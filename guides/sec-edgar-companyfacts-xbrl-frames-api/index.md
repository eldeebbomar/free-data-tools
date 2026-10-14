# SEC Company Facts API: companyfacts, concept & frames

> Pull XBRL financials from data.sec.gov: companyfacts, companyconcept and frames URLs, the JSON shape, the fy and frame traps, and a CSV export. Tested Python.

- URL: https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search SEC EDGAR filings, financials & insider trades](https://datatooly.xyz/sec-edgar-search/)
- Tags: api, python, finance, datascience

The SEC's XBRL APIs on data.sec.gov return reported financials as JSON, free and with no API key. `companyfacts/CIK##########.json` gives every fact for one company. `companyconcept/CIK##########/us-gaap/{Tag}.json` gives one tag for one company. `frames/us-gaap/{Tag}/{Unit}/CY{Year}.json` gives one tag across all companies for one period. Pad the CIK to 10 digits and send a User-Agent.

This page covers the three endpoints, the JSON they return, and the traps that silently give you wrong numbers. All code was run on 2026-10-14.

## The three endpoints

From the SEC's [EDGAR APIs page](https://www.sec.gov/search-filings/edgar-application-programming-interfaces):

| Endpoint | URL pattern | Returns |
|---|---|---|
| Company facts | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | "all the company concepts data for a company" |
| Company concept | `https://data.sec.gov/api/xbrl/companyconcept/CIK##########/us-gaap/AccountsPayableCurrent.json` | "all the XBRL disclosures from a single company (CIK) and concept (a taxonomy and tag)", with "a separate array of facts for each units on measure" |
| Frames | `https://data.sec.gov/api/xbrl/frames/us-gaap/AccountsPayableCurrent/USD/CY2019Q1I.json` | "one fact for each reporting entity that is last filed that most closely fits the calendrical period requested" |

The SEC says the facts come from financial statements in "forms 10-Q, 10-K, 8-K, 20-F, 40-F, 6-K, and their variants". They are limited to standard taxonomies (`us-gaap`, `ifrs-full`, `dei`, `srt`) and to facts that apply to the whole company. The XBRL APIs update in real time "with a typical processing delay of under a minute".

### Frame periods and units

| Period | Format | Meaning (from the SEC page) |
|---|---|---|
| Annual | `CY2024` | Duration of 365 days, plus or minus 30 |
| Quarterly | `CY2024Q1` | Duration of 91 days, plus or minus 30 |
| Instant | `CY2024Q1I` | A point in time, for balance-sheet items |

Units are `USD`, `shares`, `pure` (the default XBRL unit), or a ratio joined with `-per-`, such as `USD-per-shares` for EPS. `frames/us-gaap/EarningsPerShareBasic/USD-per-shares/CY2024.json` returned 5,591 companies.

## The JSON

`companyfacts` has the shape `{cik, entityName, facts: {taxonomy: {Tag: {label, description, units: {unit: [fact, ...]}}}}}`. Apple's file on 2026-10-14 was 3.8 MB, with the `dei` and `us-gaap` taxonomies and 503 us-gaap concepts. One fact:

```json
{"start": "2026-03-29", "end": "2026-06-27", "val": 29789000000,
 "accn": "0000320193-26-000020", "fy": 2026, "fp": "Q3", "form": "10-Q",
 "filed": "2026-07-31", "frame": "CY2026Q2"}
```

| Field | Meaning |
|---|---|
| `start`, `end` | The period the value covers. Instant facts have only `end`. |
| `val` | The value, in the unit you are under |
| `accn` | Accession number of the filing that reported it |
| `fy`, `fp` | Fiscal year and period **of the filing**, not of the fact (see trap 1) |
| `form`, `filed` | Form type and filing date |
| `frame` | Present on the one fact the SEC chose for that calendar period (see trap 2) |

`frames` has the shape `{taxonomy, tag, ccp, uom, label, description, pts, data: [{accn, cik, entityName, loc, start, end, val}]}`, where `pts` is the number of companies.

## Python: all three, plus a CSV for Excel

```python
import csv
import time
from datetime import date
import requests

HEADERS = {"User-Agent": "Data Tooly research contact@example.com"}  # use your own name + email
XBRL = "https://data.sec.gov/api/xbrl"

def get(url):
    r = requests.get(url, headers=HEADERS, timeout=60)
    r.raise_for_status()  # 404 = wrong CIK padding, tag, unit or period
    time.sleep(0.15)      # stay under 10 requests/second
    return r.json()

def cik10(cik):
    return f"CIK{int(cik):010d}"

def annual_from_10k(facts):
    """One value per fiscal year: full-year facts from 10-K filings, latest filing wins."""
    best = {}
    for f in facts:
        if f.get("form") not in ("10-K", "10-K/A") or "start" not in f:
            continue
        days = (date.fromisoformat(f["end"]) - date.fromisoformat(f["start"])).days
        if 350 <= days <= 380 and (f["end"] not in best or f["filed"] > best[f["end"]]["filed"]):
            best[f["end"]] = f
    return [best[k] for k in sorted(best)]

# 1. companyfacts: every XBRL fact a company has reported, in one call.
facts = get(f"{XBRL}/companyfacts/{cik10(320193)}.json")
print(facts["entityName"], "| taxonomies:", list(facts["facts"]),
      "| us-gaap concepts:", len(facts["facts"]["us-gaap"]))
for f in annual_from_10k(facts["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"])[-3:]:
    print(f"  FY ending {f['end']}: ${f['val']:,}  (fy {f['fy']}, filed {f['filed']}, frame {f.get('frame')})")

# 2. companyconcept: one tag for one company.
rev = get(f"{XBRL}/companyconcept/{cik10(320193)}/us-gaap/RevenueFromContractWithCustomerExcludingAssessedTax.json")
last = annual_from_10k(rev["units"]["USD"])[-1]
print(rev["label"], "| FY ending", last["end"], f"${last['val']:,}")

# 3. frames: one tag for every company, one period.
frame = get(f"{XBRL}/frames/us-gaap/NetIncomeLoss/USD/CY2024.json")
print("CY2024 NetIncomeLoss:", frame["pts"], "companies; largest values:")
for d in sorted(frame["data"], key=lambda d: d["val"], reverse=True)[:5]:
    print(f"  {d['entityName'][:28]:28s} ${d['val']:,}  accn {d['accn']}")

# 4. Check a suspicious frame value against every fact behind it.
trr = get(f"{XBRL}/companyfacts/{cik10(1573221)}.json")["facts"]["us-gaap"]["NetIncomeLoss"]["units"]["USD"]
for f in trr:
    if f.get("start") == "2024-01-01" and f["end"] == "2024-12-31":
        print(f"  TheRealReal FY2024: {f['val']:,}  form {f['form']:8s} filed {f['filed']}  frame {f.get('frame')}")

# 5. Save the frame to CSV (opens in Excel).
with open("net_income_cy2024.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["cik", "entityName", "loc", "start", "end", "val", "accn"])
    w.writeheader()
    w.writerows(frame["data"])
print("wrote", len(frame["data"]), "rows to net_income_cy2024.csv")
```

Output on 2026-10-14:

```text
Apple Inc. | taxonomies: ['dei', 'us-gaap'] | us-gaap concepts: 503
  FY ending 2023-09-30: $96,995,000,000  (fy 2025, filed 2025-10-31, frame CY2023)
  FY ending 2024-09-28: $93,736,000,000  (fy 2025, filed 2025-10-31, frame CY2024)
  FY ending 2025-09-27: $112,010,000,000  (fy 2025, filed 2025-10-31, frame CY2025)
Revenue from Contract with Customer, Excluding Assessed Tax | FY ending 2025-09-27 $416,161,000,000
CY2024 NetIncomeLoss: 6068 companies; largest values:
  TheRealReal, Inc.            $134,202,000,000  accn 0001573221-26-000036
  Alphabet Inc.                $100,118,000,000  accn 0001308179-26-000342
  HighPeak Energy, Inc.        $95,069,000,000  accn 0001437749-26-014193
  Apple Inc.                   $93,736,000,000  accn 0000320193-25-000079
  BERKSHIRE HATHAWAY INC       $88,995,000,000  accn 0001193125-26-083899
  TheRealReal FY2024: -134,202,000  form 10-K     filed 2025-02-21  frame None
  TheRealReal FY2024: -134,202,000  form 10-K     filed 2026-02-26  frame None
  TheRealReal FY2024: 134,202,000,000  form PRE 14A  filed 2026-04-15  frame None
  TheRealReal FY2024: 134,202,000,000  form DEF 14A  filed 2026-04-27  frame CY2024
wrote 6068 rows to net_income_cy2024.csv
```

The first rows of the CSV:

```csv
cik,entityName,loc,start,end,val,accn
1750,AAR CORP.,-,2024-06-01,2025-05-31,12500000,0001140361-26-031078
1800,Abbott Laboratories,US-IL,2024-01-01,2024-12-31,13402000000,0001628280-26-010185
```

## The traps

### 1. `fy` is the filing's fiscal year, not the fact's

All three Apple values above carry `fy 2025`, including the year that ended in September 2023. They were all reported in the 10-K filed on 2025-10-31, which shows three years of income statement. To label a value by its own period, use `end` (or `start` and `end`). Don't group by `fy`.

### 2. A `frame` value can come from the wrong filing

The frames API returns the fact that was **last filed** for the period. The output above shows what that can do. TheRealReal's 10-Ks report a 2024 net **loss** of $134,202,000. A proxy statement (DEF 14A) filed in April 2026 tagged the same line as **+$134,202,000,000**: the opposite sign and 1,000 times larger. Because it was filed last, it became the `CY2024` frame value, and TheRealReal ranked first in the frame, ahead of Alphabet. HighPeak Energy has the same pattern: $95,069,000 in its 10-Ks, $95,069,000,000 in a DEF 14A.

What to do:

- For one company's history, filter on `form` (`10-K`, `10-K/A`, `10-Q`) and take the latest filing per period, as `annual_from_10k` does, instead of trusting `frame`.
- For cross-company frames, sanity-check outliers. For any value that looks off, open that company's `companyfacts` and compare the facts behind it.

### 3. Duplicates are normal

The same period appears once for every filing that reported it. Apple's fiscal 2024 net income is in both the 2024 and the 2025 10-K. Only one copy has `frame`. Summing facts without de-duplicating double-counts.

### 4. The tag you guess may not exist

`companyconcept/CIK0000320193/us-gaap/Revenue.json` returned HTTP 404 with an XML `NoSuchKey` body. Apple reports revenue as `RevenueFromContractWithCustomerExcludingAssessedTax`. Across all filers, the CY2024 frame for that tag had 2,972 companies and the frame for `Revenues` had 2,507. The older `SalesRevenueNet` had 1,649 companies in CY2017. Some companies change tags over the years. List the keys of `facts["us-gaap"]` from `companyfacts` to see which tags a company really uses.

### 5. 404s are XML, and the CIK must be padded

Every miss (an unpadded CIK such as `CIK320193.json`, a tag that doesn't exist, or a period without the `CY` prefix) returned HTTP 404 with an XML error body, not JSON. Check the status before parsing.

## Bulk alternative

For every company at once, the SEC publishes `https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip`. It "contains all the data from the XBRL Frame API and the XBRL Company Facts API", is recompiled nightly, and is the SEC's recommended way to fetch large amounts of data.

## Related guides for this API

- [Submissions API and ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/): find the CIK these URLs need.
- [EDGAR full-text search API](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/): find filings by what they say.
- [SEC rate limits and User-Agent rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/): the 403 and the 10-per-second limit.
- [SEC EDGAR API in Python](https://datatooly.xyz/guides/sec-edgar-api-python-guide/), the overview guide.

## Do it without code

The free [SEC EDGAR query builder](https://datatooly.xyz/sec-edgar-search/) builds a financials query from tickers and shows the output shape. It's a query builder: browsers can't send the User-Agent the SEC requires, so the data is fetched server-side when you run the query.

## At scale

The [SEC EDGAR Scraper actor](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu) on Apify has a `financials` mode that returns normalized income statement, balance sheet and cash flow rows per ticker, and an `xbrl_facts` mode for raw facts by concept (`xbrlConcepts`). It resolves tickers to CIKs, paces requests, and exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The endpoints above work without either.*

Sources: [SEC: EDGAR Application Programming Interfaces](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), and live data.sec.gov responses on 2026-10-14.

## Quick answers

### Where is the official documentation for the SEC EDGAR company facts API?

On sec.gov's "EDGAR Application Programming Interfaces" page (sec.gov/search-filings/edgar-application-programming-interfaces). It documents `data.sec.gov/api/xbrl/companyfacts/CIK##########.json`, `companyconcept/CIK##########/us-gaap/{tag}.json` and `frames/{taxonomy}/{tag}/{unit}/{period}.json`, and says these APIs "do not require any authentication or API keys".

### What is the difference between companyfacts, companyconcept and frames?

`companyfacts` returns every XBRL fact for one company (Apple: 503 us-gaap concepts in one 3.8 MB file on 2026-10-14). `companyconcept` returns one tag for one company. `frames` returns one tag for every company in one period, such as `us-gaap/NetIncomeLoss/USD/CY2024`, which had 6,068 companies.

### How do I download SEC financial data into Excel with the API?

Call the frames API for the tag and period you want, for example `https://data.sec.gov/api/xbrl/frames/us-gaap/NetIncomeLoss/USD/CY2024.json` with a declared User-Agent, and write `data[]` to a CSV file with columns cik, entityName, loc, start, end, val and accn. Excel opens the CSV directly. The Python script on this page does exactly that.

### Do the SEC XBRL APIs need an API key?

No. The SEC states that data.sec.gov's APIs "do not require any authentication or API keys to access." You do need a User-Agent header that identifies you, and you must stay under 10 requests per second.

## Related guides

- [SEC EDGAR API in Python: User-Agent Format & Rate Limits](https://datatooly.xyz/guides/sec-edgar-api-python-guide/)
- [EDGAR Full-Text Search API: efts.sec.gov Parameters](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/)
- [SEC EDGAR Rate Limit and User-Agent: Fair Access Rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/)
- [SEC EDGAR API: Submissions JSON and Ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
