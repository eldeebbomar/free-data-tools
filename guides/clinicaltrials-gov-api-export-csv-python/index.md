# ClinicalTrials.gov API to CSV: Export Trials by Phase in Python

> Export ClinicalTrials.gov search results to CSV with the free v2 API: format=csv, the x-next-page-token header, and the phase filter that actually works.

- URL: https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Search ClinicalTrials.gov live — by condition, drug, or phase](https://datatooly.xyz/clinical-trials-search/)
- Tags: python, api, datascience, healthcare

To export ClinicalTrials.gov search results to CSV, call `https://clinicaltrials.gov/api/v2/studies?format=csv`. No API key is needed. In CSV mode the cursor for the next page comes back in the `x-next-page-token` **response header**, not in the body. Only the first page includes a header row. Filter phases with `filter.advanced=AREA[Phase]PHASE3`, because `filter.phase` does not exist and the API rejects it with HTTP 400.

Most tutorials cover the JSON flavour of the v2 API and stop there. This guide covers the CSV path end to end and the three details that break naive scripts. Every URL, header and error message below was checked against the live API on 2026-09-29.

## The source and what it gives you

ClinicalTrials.gov is the U.S. National Library of Medicine's public trial registry. Its v2 REST API has one search endpoint:

```
https://clinicaltrials.gov/api/v2/studies
```

It needs no key and no signup. It also sends `Access-Control-Allow-Origin: *`, so you can call it from a browser as well as from a script. By default it returns JSON. Add `format=csv` and you get `text/csv` with 30 columns per study:

`NCT Number, Study Title, Study URL, Acronym, Study Status, Brief Summary, Study Results, Conditions, Interventions, Primary Outcome Measures, Secondary Outcome Measures, Other Outcome Measures, Sponsor, Collaborators, Sex, Age, Phases, Enrollment, Funder Type, Study Type, Study Design, Other IDs, Start Date, Primary Completion Date, Completion Date, First Posted, Results First Posted, Last Update Posted, Locations, Study Documents`

The parameters you'll use most:

| Parameter | What it does | Example |
|---|---|---|
| `query.cond` | Condition or disease search | `query.cond=non-small cell lung cancer` |
| `query.intr` | Drug or intervention search | `query.intr=semaglutide` |
| `query.term` | Free-text search | `query.term=GLP-1` |
| `filter.overallStatus` | Status filter (comma or pipe separated) | `RECRUITING,NOT_YET_RECRUITING` |
| `filter.advanced` | Essie expression for fields without a dedicated filter | `AREA[Phase]PHASE3` |
| `fields` | Limit columns (CSV uses display names) | `NCT Number,Study Title,Phases` |
| `pageSize` | Studies per page, max 1000 | `1000` |
| `pageToken` | Cursor for the next page | value of `x-next-page-token` |
| `countTotal` | Adds the total match count | `true` |

## Runnable Python: search to CSV, every page

This script exports recruiting Phase 2 and Phase 3 non-small cell lung cancer trials. It needs only `requests`.

```python
import csv
import io
import time
import requests

BASE = "https://clinicaltrials.gov/api/v2/studies"

params = {
    "format": "csv",
    "query.cond": "non-small cell lung cancer",
    "filter.overallStatus": "RECRUITING",
    "filter.advanced": "AREA[Phase](PHASE2 OR PHASE3)",  # filter.phase does not exist (HTTP 400)
    "fields": "NCT Number,Study Title,Study Status,Phases,Sponsor,Start Date",
    "countTotal": "true",
    "pageSize": 1000,  # the maximum per page
}

def get_page(session, p):
    for attempt in range(5):
        r = session.get(BASE, params=p, timeout=60)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(2 ** attempt)  # back off, then retry
            continue
        r.raise_for_status()  # a 400 here usually means a bad parameter name or value
        return r
    raise RuntimeError("gave up after 5 attempts")

def export_csv(path, params, max_pages=100):
    session = requests.Session()
    token, written = None, 0
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        for page in range(max_pages):
            p = dict(params, **({"pageToken": token} if token else {}))
            r = get_page(session, p)
            rows = list(csv.reader(io.StringIO(r.text)))
            if page == 0:
                print("matching studies:", r.headers.get("x-total-count"))
                writer.writerow(rows.pop(0))  # only the FIRST page carries a header row
            for row in rows:
                writer.writerow(row)
                written += 1
            # In CSV mode the cursor is a response HEADER, not a JSON field.
            token = r.headers.get("x-next-page-token")
            if not token:
                break
            time.sleep(0.5)
    return written

if __name__ == "__main__":
    n = export_csv("nsclc_ph2_ph3_recruiting.csv", params)
    print("rows written:", n)
```

When I ran it on 2026-09-29 it printed `matching studies: 710` and wrote 710 rows. The first lines of the file:

```csv
NCT Number,Study Title,Study Status,Sponsor,Phases,Start Date
NCT07103395,"A Study Evaluating Neoadjuvant Chemotherapy, Concurrent Chemoradiotherapy ...",RECRUITING,Sun Yat-sen University,PHASE2,2026-01-01
NCT06236438,"Study to Evaluate Adverse Events, Optimal Dose, and Change in Disease Activity ...",RECRUITING,AbbVie,PHASE2|PHASE3,2024-04-10
```

To test the pagination, I re-ran the export with `pageSize=200`, which forces four pages. It returned the same 710 rows with 710 unique NCT numbers.

## The three details that break scripts

### 1. The page cursor moves to a header

In JSON mode, the next-page cursor is the `nextPageToken` field in the body. In CSV mode the body is pure CSV, so the API puts the cursor in response headers instead:

| Header | Meaning |
|---|---|
| `x-next-page-token` | Pass it back as `pageToken`. It is absent on the last page. |
| `x-total-count` | Total matches (only when `countTotal=true`) |

If you look for `nextPageToken` in a CSV response, you'll never find a second page.

### 2. Page 2 and later have no header row

Only the first page starts with the column names. Later pages are data rows only. If you parse each page with `csv.DictReader`, it treats the first study of page 2 as a header and your columns silently shift. Read page one's header once, then append raw rows, as the script does.

### 3. There is no `filter.phase`

Several tutorials show `filter.phase=PHASE3`. The live API answers with HTTP 400 and the body `` `filter.phase` is unknown parameter ``. Use one of these instead. Both returned the same 1,402 Phase 3 lung-cancer studies:

```
filter.advanced=AREA[Phase]PHASE3
aggFilters=phase:3
```

For several phases, use `AREA[Phase](PHASE2 OR PHASE3)`. Studies that span two phases show both values in the `Phases` column, separated by a pipe (`PHASE2|PHASE3`). Split on `|` before you count by phase.

## Smaller pitfalls

- **CSV `fields` uses display names.** `fields=NCT Number,Study Title` works. The JSON-style name fails with `Parameter 'fields' contains invalid CSV column name: 'NCTId'`. In JSON mode it's the other way round (`NCTId`, `BriefTitle`).
- **Column order is fixed.** The API returns the columns you ask for in its own order, not yours. I asked for `Phases,Sponsor` and got `Sponsor,Phases`. Map columns by header name, not by position.
- **`pageSize` tops out at 1000.** A request for 1,001 still returns 1,000 studies without an error. Don't compute page counts from the number you asked for.
- **Status values are validated.** A typo such as `RECRUITNG` returns HTTP 400 with `Invalid value in parameter overallStatus`. Treat a 400 as a query bug, not something to retry.
- **Date ranges go through `filter.advanced` too.** For example `AREA[StartDate]RANGE[2024-01-01,MAX]`. You can combine clauses with `AND`.
- **Rate limits aren't published.** NLM doesn't publish a fixed request quota. Community reports put the practical ceiling around 50 requests per minute per IP, which is an estimate, not a documented limit. Use `pageSize=1000`, pause between pages, and back off on 429.
- **CORS is open.** You can make the same call from browser JavaScript with `fetch()`. That is how the free tool below works.

## Do it without code

If you only need to see which trials match before you write any code, try the free [ClinicalTrials.gov search tool](https://datatooly.xyz/clinical-trials-search/). It's a **live** tool: it calls the official v2 API directly from your browser and shows real studies with NCT ID, status, phase and lead sponsor. You can filter by condition, drug, phase and status. There's no login and no key.

## At scale

The script covers one registry. Things get harder when you need trials joined with FDA drug approvals, 510(k) and PMA device clearances, adverse events, recalls and drug shortages, rolled up per sponsor and re-checked on a schedule. For that I run the [Clinical Trials & FDA Pipeline actor](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) on Apify. It uses the same `nextPageToken` pagination internally. It resolves sponsors by ticker or name, has a monitor mode for change detection, and exports to JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The API details and the script above work without either.*

## FAQ

### Does the ClinicalTrials.gov API need an API key?

No. The v2 endpoint `https://clinicaltrials.gov/api/v2/studies` is public, with no key, no signup and no authentication. It also sends `Access-Control-Allow-Origin: *`, so browser `fetch()` calls work too.

### How do I get CSV instead of JSON?

Add `format=csv` to the query. The response is `text/csv` with 30 default columns. Narrow it with `fields=` using the CSV display names, such as `NCT Number,Study Title,Phases`.

### How do I paginate CSV results?

Read the `x-next-page-token` response header and send it back as `pageToken` on the next request. Stop when the header is missing. Remember that only the first page has a header row.

### Why does `filter.phase` return HTTP 400?

That parameter doesn't exist in the v2 API. Filter phases with `filter.advanced=AREA[Phase]PHASE3`, or `aggFilters=phase:3`. For several phases use `AREA[Phase](PHASE2 OR PHASE3)`.

### What is the maximum page size?

1,000 studies per request. Larger values are clamped to 1,000 without an error.

### Can I search by drug instead of condition?

Yes. Use `query.intr` for interventions, for example `query.intr=semaglutide`, or `query.term` for free-text search. You can combine either with `query.cond` and the status and phase filters.

## Related guides

- [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
