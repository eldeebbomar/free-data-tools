# SEC EDGAR API: Submissions JSON and Ticker to CIK

> Yes, EDGAR has a free API with no key: map a ticker to a CIK with company_tickers.json, then list every filing from data.sec.gov/submissions. Tested Python.

- URL: https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search SEC EDGAR filings, financials & insider trades](https://datatooly.xyz/sec-edgar-search/)
- Tags: api, python, finance, datascience

Yes, EDGAR has an API, and it's free with no API key. Map a ticker to a CIK with `https://www.sec.gov/files/company_tickers.json`, then fetch `https://data.sec.gov/submissions/CIK##########.json`, with the CIK zero-padded to 10 digits, to get the company's details and full filing history. The one requirement is a User-Agent header with your name and email.

This page covers the two building blocks every EDGAR project starts with: ticker-to-CIK and the submissions API. The code was run on 2026-10-14.

## The SEC's APIs at a glance

| What | URL | Key? |
|---|---|---|
| Ticker → CIK map | `https://www.sec.gov/files/company_tickers.json` | No |
| Ticker → CIK + exchange | `https://www.sec.gov/files/company_tickers_exchange.json` | No |
| Filing history + metadata | `https://data.sec.gov/submissions/CIK##########.json` | No |
| XBRL financials | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` (and `companyconcept`, `frames`) | No |
| Full-text search | `https://efts.sec.gov/LATEST/search-index?q=...` | No |
| Filing documents | `https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/...` | No |

The SEC's [EDGAR APIs page](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) says data.sec.gov's APIs "do not require any authentication or API keys to access." What is required is a declared User-Agent and a rate of no more than 10 requests per second; see the [SEC rate limit and User-Agent guide](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/). A search for "SEC API key" often leads to filer API tokens. Those exist, but they are for submitting filings to EDGAR, not for reading data.

## Ticker to CIK

EDGAR identifies every filer by a Central Index Key (CIK). The SEC says CIKs "remain unique to the filer; they are not recycled." `company_tickers.json` maps tickers to CIKs:

```bash
curl -s -A "Data Tooly research contact@example.com" "https://www.sec.gov/files/company_tickers.json"
```

```json
{"0":{"cik_str":1045810,"ticker":"NVDA","title":"NVIDIA CORP"},"1":{"cik_str":320193,"ticker":"AAPL","title":"Apple Inc."},"2":{"cik_str":1652044,"ticker":"GOOGL","title":"Alphabet Inc."}, ...}
```

What to know about the file (checked on 2026-10-14):

- The top-level keys (`"0"`, `"1"`, ...) are just row numbers. Build your own index by ticker.
- `cik_str` is an **integer** despite its name. Pad it yourself: `f"CIK{cik:010d}"`.
- It held 10,447 tickers for 8,032 CIKs. 1,440 companies have more than one ticker; GOOGL and GOOG both map to 1652044, for example.
- Share classes use a dash: Berkshire Class B is `BRK-B`, not `BRK.B`. Normalize user input.
- The SEC says it updates these files periodically "but do[es] not guarantee accuracy or scope". Delisted tickers drop out. For historical work, keep the CIK, not the ticker.

`company_tickers_exchange.json` has the same mapping in a columnar layout with the exchange added: `{"fields": ["cik", "name", "ticker", "exchange"], "data": [[1045810, "NVIDIA CORP", "NVDA", "Nasdaq"], ...]}`.

## The submissions API

```bash
curl -s -A "Data Tooly research contact@example.com" "https://data.sec.gov/submissions/CIK0000320193.json"
```

The top-level fields for Apple: `cik`, `entityType`, `sic`, `sicDescription`, `ownerOrg`, `insiderTransactionForOwnerExists`, `insiderTransactionForIssuerExists`, `name`, `tickers`, `exchanges`, `ein`, `lei`, `description`, `website`, `investorWebsite`, `category`, `fiscalYearEnd`, `stateOfIncorporation`, `stateOfIncorporationDescription`, `addresses`, `phone`, `flags`, `formerNames`, `filings`.

`filings` has two parts:

- **`filings.recent`**: per the SEC, "at least one year's of filing or to 1,000 (whichever is more) of the most recent filings in a compact columnar data array". Apple's had 1,001 rows.
- **`filings.files`**: extra JSON files for older filings, each with `name`, `filingCount`, `filingFrom` and `filingTo`. Apple had one, `CIK0000320193-submissions-001.json`, with 1,264 filings from 1994-01-26 to 2015-09-15.

`recent` is **column-oriented**: one array per field (`accessionNumber`, `filingDate`, `reportDate`, `acceptanceDateTime`, `act`, `form`, `fileNumber`, `filmNumber`, `items`, `core_type`, `size`, `isXBRL`, `isInlineXBRL`, `isXBRLNumeric`, `primaryDocument`, `primaryDocDescription`). Row `i` is the `i`th element of every array.

The SEC says the submissions API updates in real time "with a typical processing delay of less than a second".

## Python: ticker → CIK → filings → document URLs

```python
import time
import requests

HEADERS = {"User-Agent": "Data Tooly research contact@example.com"}  # use your own name + email

def get(url):
    r = requests.get(url, headers=HEADERS, timeout=60)
    r.raise_for_status()
    time.sleep(0.15)  # stay under 10 requests/second
    return r.json()

# 1. Ticker -> CIK, from the SEC's own mapping file.
tickers = get("https://www.sec.gov/files/company_tickers.json")
by_ticker = {row["ticker"]: row for row in tickers.values()}
print(len(by_ticker), "tickers;", by_ticker["AAPL"], by_ticker["BRK-B"])

def cik_for(ticker):
    return by_ticker[ticker.upper()]["cik_str"]

# 2. Submissions: company metadata plus filing history.
cik = cik_for("aapl")
sub = get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json")
print(sub["name"], sub["tickers"], sub["exchanges"], "| SIC", sub["sic"], sub["sicDescription"],
      "| FY ends", sub["fiscalYearEnd"])

# `recent` is column-oriented: one list per field. Zip it into rows.
recent = sub["filings"]["recent"]
rows = [dict(zip(recent, values)) for values in zip(*recent.values())]
print(len(rows), "recent filings; older pages:", [f["name"] for f in sub["filings"]["files"]])

def filing_urls(cik, row):
    folder = f"https://www.sec.gov/Archives/edgar/data/{cik}/{row['accessionNumber'].replace('-', '')}"
    return f"{folder}/{row['primaryDocument']}", f"{folder}/{row['accessionNumber']}-index.htm"

for row in [r for r in rows if r["form"] in ("10-K", "10-Q")][:3]:
    doc, index = filing_urls(cik, row)
    print(row["form"], row["filingDate"], "period", row["reportDate"], doc)

# 3. Older filings live in extra files listed under filings.files.
older = get(f"https://data.sec.gov/submissions/{sub['filings']['files'][0]['name']}")
print("oldest filing on record:", min(older["filingDate"]), "| rows in older file:", len(older["accessionNumber"]))
```

Output on 2026-10-14:

```text
10447 tickers; {'cik_str': 320193, 'ticker': 'AAPL', 'title': 'Apple Inc.'} {'cik_str': 1067983, 'ticker': 'BRK-B', 'title': 'BERKSHIRE HATHAWAY INC'}
Apple Inc. ['AAPL'] ['Nasdaq'] | SIC 3571 Electronic Computers | FY ends 0926
1001 recent filings; older pages: ['CIK0000320193-submissions-001.json']
10-Q 2026-07-31 period 2026-06-27 https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm
10-Q 2026-05-01 period 2026-03-28 https://www.sec.gov/Archives/edgar/data/320193/000032019326000013/aapl-20260328.htm
10-Q 2026-01-30 period 2025-12-27 https://www.sec.gov/Archives/edgar/data/320193/000032019326000006/aapl-20251227.htm
```

The older file is a bare column dictionary, with no `filings.recent` wrapper, which is why the last step reads `older["filingDate"]` directly.

## Gotchas

- **Pad the CIK in data.sec.gov URLs.** `submissions/CIK320193.json` returned HTTP 404 with an XML body. Archive paths (`/Archives/edgar/data/320193/...`) take the unpadded number.
- **`cik` comes back as a string here.** The submissions JSON has `"cik": "0000320193"` (padded string), while `company_tickers.json` has an integer. Normalize with `int()` before you compare.
- **Accession numbers appear in two forms.** The JSON uses `0000320193-25-000079`. Folder paths drop the dashes: `000032019325000079`.
- **`fiscalYearEnd` is `MMDD`.** Apple's `0926` means its fiscal year ends around September 26.
- **Recent isn't everything.** For a full history, also fetch every file in `filings.files`.
- **Bulk option.** The SEC publishes all submissions as one nightly ZIP: `https://www.sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip`.

## Related guides for this API

- [Company facts, company concept and frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/): the financial numbers, using the same CIK.
- [EDGAR full-text search API](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/): find filings by their text, filtered by CIK.
- [SEC rate limits and User-Agent rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/).
- [SEC EDGAR API in Python](https://datatooly.xyz/guides/sec-edgar-api-python-guide/), the overview guide.

## Do it without code

The free [SEC EDGAR query builder](https://datatooly.xyz/sec-edgar-search/) takes plain tickers, so you don't have to look up or pad CIKs, plus a mode (filings, financials, full-text search or insider trades) and form types. It shows the output shape. It builds the query rather than fetching live, because browsers can't send the User-Agent the SEC requires.

## At scale

The [SEC EDGAR Scraper actor](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu) on Apify resolves tickers to CIKs and pulls filings, financials, Form 4 insider trades, 13F holdings, 13D/G stakes and parsed 8-K items, with the User-Agent and pacing handled. It exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The endpoints above work without either.*

Sources: [SEC: EDGAR Application Programming Interfaces](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [SEC webmaster FAQ](https://www.sec.gov/about/webmaster-frequently-asked-questions), and live responses on 2026-10-14.

## Quick answers

### Does EDGAR have an API?

Yes. The SEC runs free REST APIs on data.sec.gov: `submissions/CIK##########.json` for a company's filing history and `api/xbrl/...` for financial data. There's also full-text search at efts.sec.gov. The SEC says these APIs "do not require any authentication or API keys to access." You only need a User-Agent header that identifies you.

### Do I need an SEC API key?

No. There's no API key, token or signup for EDGAR data. Send a User-Agent such as `Your Company you@example.com` and stay under 10 requests per second. (The SEC does issue API tokens to filers, but only for submitting filings, not for reading data.)

### How do I convert a stock ticker to a CIK?

Download `https://www.sec.gov/files/company_tickers.json`. Each entry has `cik_str`, `ticker` and `title`, for example `{"cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc."}`. Pad the CIK to 10 digits for API URLs: `CIK0000320193`. On 2026-10-14 the file had 10,447 tickers for 8,032 CIKs.

### What is the SEC submissions API URL?

`https://data.sec.gov/submissions/CIK##########.json`, with the 10-digit zero-padded CIK, for example `https://data.sec.gov/submissions/CIK0000320193.json` for Apple. It returns company metadata plus `filings.recent` (at least one year or 1,000 filings, whichever is more) and `filings.files` for older history.

## Related guides

- [SEC EDGAR API in Python: User-Agent Format & Rate Limits](https://datatooly.xyz/guides/sec-edgar-api-python-guide/)
- [SEC Company Facts API: companyfacts, concept & frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/)
- [EDGAR Full-Text Search API: efts.sec.gov Parameters](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/)
- [SEC EDGAR Rate Limit and User-Agent: Fair Access Rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
