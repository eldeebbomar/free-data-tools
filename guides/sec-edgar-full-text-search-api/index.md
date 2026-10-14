# EDGAR Full-Text Search API: efts.sec.gov Parameters

> How efts.sec.gov/LATEST/search-index works: q syntax, forms, ciks, startdt/enddt, sort, paging with from, the JSON response and its traps. Tested Python code.

- URL: https://datatooly.xyz/guides/sec-edgar-full-text-search-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search SEC EDGAR filings, financials & insider trades](https://datatooly.xyz/sec-edgar-search/)
- Run this exact query on Apify: [Full-text search: find 10-Ks that mention "artificial intelligence"](https://apify.com/constructive_calm/sec-edgar-scraper/examples/sec-fulltext-search-ai-10k?fpr=v77kxu)
- Another example on Apify: [Full-text search within specific companies' filings](https://apify.com/constructive_calm/sec-edgar-scraper/examples/sec-fulltext-search-within-companies?fpr=v77kxu)
- Tags: api, python, finance, datascience

EDGAR full-text search has a JSON endpoint: `https://efts.sec.gov/LATEST/search-index?q=...`. Pass a phrase in `q`, filter with `forms`, `ciks` (10-digit) and `startdt`/`enddt`, and page with `from` in steps of 100. No API key is needed, but you must send a User-Agent naming you. The SEC doesn't document this endpoint as an API; it's the backend of its Full-Text Search page.

This page documents what each parameter actually does. Every response from the endpoint includes a `query` object, the Elasticsearch query it ran, so the table below comes from those echoes plus live tests on 2026-10-14. It is not from an official spec, because there isn't one.

## What full-text search covers

From the SEC's [Full-Text Search FAQ](https://www.sec.gov/edgar/search/efts-faq.html): it searches "the full text of all EDGAR filings submitted electronically since 2001", and "the full text of a filing includes all data in the filing itself as well as all attachments (such as exhibits)". Natural-language queries aren't supported.

Each result is one **document**, not one filing. A 10-K and its exhibits are separate hits that share an accession number. In one page of 100 hits I found 99 distinct filings.

## Parameters

| Parameter | What it does (from the echoed query) | Example |
|---|---|---|
| `q` | Searches document text. A quoted phrase is a phrase match. Words without quotes are each required. | `q="supply chain disruption"` |
| `forms` | Filters on `root_forms`, comma-separated. Upper case only: `8-k` matched 0 documents where `8-K` matched 831. `10-K` also returns `10-K/A`. | `forms=10-K,8-K` |
| `ciks` | Filters on `ciks`. Must be zero-padded to 10 digits: `320193` matched 0, `0000320193` matched 12. | `ciks=0000320193` |
| `startdt`, `enddt` | Range on `file_date`, format `yyyy-mm-dd`. Works with or without `dateRange=custom`. | `startdt=2025-01-01&enddt=2025-12-31` |
| `dateRange` | Ignored by the endpoint. `30d`, `1y`, `5y` and `all` produced no date filter; the website turns them into `startdt`/`enddt` itself. | |
| `from` | Offset of the first hit. `from=9900` worked; `from=10000` returned no hits. | `from=100` |
| `sort` | `desc` or `asc` sorts by `file_date`. Without it, results are ranked by relevance. | `sort=desc` |
| `locationCodes` | Filters on business-address state (`biz_states`). | `locationCodes=CA` |
| `locationType=incorporated` | Makes `locationCodes` filter on state of incorporation (`inc_states`) instead. | `locationType=incorporated&locationCodes=DE` |
| `entityName` | Adds a loose word match on company names. `Apple Inc.` became separate matches for `Apple` and `Inc.`, giving 43 results against 12 for Apple's CIK. Prefer `ciks`. | |
| `hits`, `size`, `page` | Ignored. The page size is always 100. | |

### Query syntax in `q`

These all ran on 2026-10-14. The syntax matches the FAQ.

| You type | It becomes |
|---|---|
| `"supply chain disruption"` | Exact phrase |
| `software hardware` | Both words required (implied AND) |
| `tariff OR tariffs -china` | Either word, and not "china" (`-` or `NOT` excludes) |
| `tariff NEAR(5) china` | Both words within 5 words of each other, in any order (default 10) |
| `gas*` | Prefix wildcard (only at the end of a word) |

An empty `q` with no other filter returns nothing. But `forms` plus dates with no `q` works: `forms=8-K&startdt=2026-10-13&enddt=2026-10-13` returned the day's 252 8-K documents.

## The response

```json
{
  "took": 293,
  "hits": {
    "total": {"value": 331, "relation": "eq"},
    "hits": [{
      "_id": "0001640334-25-001300:acro_10k.htm",
      "_source": {
        "ciks": ["0001622996"],
        "display_names": ["ACRO BIOMEDICAL CO., LTD.  (CIK 0001622996)"],
        "form": "10-K", "root_forms": ["10-K"], "file_type": "10-K",
        "file_date": "2025-07-24", "period_ending": "2024-12-31",
        "adsh": "0001640334-25-001300", "sequence": 1,
        "sics": ["7900"], "biz_states": ["IN"], "inc_states": ["NV"],
        "biz_locations": ["Fishers, IN"], "file_num": ["000-55643"], "items": []
      }
    }]
  },
  "aggregations": {"entity_filter": {}, "sic_filter": {}, "biz_states_filter": {}, "form_filter": {}},
  "query": {}
}
```

That's a trimmed real hit from the query below. The fields you'll use most:

- `hits.total.value` with `relation`. When `relation` is `"gte"`, the value is capped at 10,000 and the true count is higher.
- `_id` is `accession:filename`. Together with the first CIK, it gives the document URL (see `doc_url` below).
- `adsh` is the accession number, the same for every document in a filing.
- `items` lists 8-K item numbers when the document belongs to an 8-K.
- `aggregations` gives the top 30 companies, SIC codes, states and forms for the whole result set. That's useful for counts without paging.

## Python: search, page and link to documents

```python
import time
import requests

EFTS = "https://efts.sec.gov/LATEST/search-index"
HEADERS = {"User-Agent": "Data Tooly research contact@example.com"}  # use your own name + email

def search(q, forms=None, ciks=None, start=None, end=None, max_hits=300):
    """Yield full-text search hits, 100 per page, following `from`."""
    params = {"q": q}
    if forms:
        params["forms"] = ",".join(forms)           # upper case: "8-K", not "8-k"
    if ciks:
        params["ciks"] = ",".join(f"{int(c):010d}" for c in ciks)  # must be 10 digits
    if start or end:
        params.update(dateRange="custom", startdt=start, enddt=end)  # yyyy-mm-dd
    offset = 0
    while offset < max_hits:
        r = requests.get(EFTS, params={**params, "from": offset}, headers=HEADERS, timeout=60)
        r.raise_for_status()
        hits = r.json()["hits"]["hits"]
        if not hits:
            return
        yield from hits
        offset += len(hits)                         # the page size is fixed at 100
        time.sleep(0.2)                             # stay well under 10 requests/second

def doc_url(hit):
    """Build the sec.gov URL of the matching document."""
    adsh, filename = hit["_id"].split(":", 1)
    cik = int(hit["_source"]["ciks"][0])
    return f"https://www.sec.gov/Archives/edgar/data/{cik}/{adsh.replace('-', '')}/{filename}"

first = requests.get(EFTS, headers=HEADERS, timeout=60, params={
    "q": '"supply chain disruption"', "forms": "10-K",
    "dateRange": "custom", "startdt": "2025-01-01", "enddt": "2025-12-31"}).json()
print("total:", first["hits"]["total"])
print("forms:", [(b["key"], b["doc_count"]) for b in first["aggregations"]["form_filter"]["buckets"]])
print("top states:", [(b["key"], b["doc_count"]) for b in first["aggregations"]["biz_states_filter"]["buckets"][:3]])

hits = list(search('"supply chain disruption"', forms=["10-K"], start="2025-01-01", end="2025-12-31"))
print(len(hits), "hits,", len({h["_source"]["adsh"] for h in hits}), "distinct filings")
h = hits[0]["_source"]
print(h["display_names"][0], "|", h["form"], h["file_date"], "| period", h["period_ending"])
print(doc_url(hits[0]))

apple = list(search("tariff", ciks=[320193]))
print("Apple filings mentioning tariff:", len(apple), sorted({x["_source"]["form"] for x in apple}))
```

Output on 2026-10-14:

```text
total: {'value': 331, 'relation': 'eq'}
forms: [('10-K', 331)]
top states: [('CA', 68), ('NY', 28), ('TX', 26)]
300 hits, 299 distinct filings
ACRO BIOMEDICAL CO., LTD.  (CIK 0001622996) | 10-K 2025-07-24 | period 2024-12-31
https://www.sec.gov/Archives/edgar/data/1622996/000164033425001300/acro_10k.htm
Apple filings mentioning tariff: 12 ['10-K', '10-K405', '10-Q', '8-K', 'DEF 14A', 'PX14A6G', 'SC TO-I']
```

The document URL returned HTTP 200. The filing's index is at the same folder plus `{accession}-index.htm`, or `index.json` for a machine-readable listing.

The same first query with curl:

```bash
curl -s -A "Data Tooly research contact@example.com" \
  "https://efts.sec.gov/LATEST/search-index?q=%22supply+chain+disruption%22&forms=10-K&dateRange=custom&startdt=2025-01-01&enddt=2025-12-31"
```

## Traps that return wrong data without an error

None of these return an error. You just get wrong or empty results:

1. **Unpadded CIK → 0 results.** `ciks=320193` returns an empty result with HTTP 200. Always pad: `f"{cik:010d}"`.
2. **Lowercase form → 0 results.** `forms=8-k` matched nothing.
3. **`dateRange=30d` does nothing.** Send `startdt` and `enddt` yourself.
4. **A badly formatted date is ignored.** `startdt=2026/01/01` returned unfiltered results. Use `yyyy-mm-dd`.
5. **The 10,000-hit ceiling.** `from` can't go past 9,900. To collect more, split the date range into smaller windows, for example month by month, so each window stays under 10,000.
6. **Hits are documents.** Count filings with distinct `adsh`, not with `len(hits)`.

## Rate limit and User-Agent

The endpoint follows SEC.gov's fair-access rules: at most 10 requests per second, and a declared User-Agent. With no User-Agent, or with curl's or python-requests' default, efts.sec.gov answered HTTP 403. The [SEC rate limit and User-Agent guide](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/) covers the exact format and the block behavior.

## Related guides for this API

- [SEC EDGAR API in Python: User-Agent, rate limits, XBRL](https://datatooly.xyz/guides/sec-edgar-api-python-guide/), the overview.
- [Submissions API and ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/): get the 10-digit CIK that `ciks=` needs.
- [Company facts, company concept and frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/): the numbers inside the filings you found.
- [SEC rate limits and User-Agent rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/).

## Do it without code

The free [SEC EDGAR query builder](https://datatooly.xyz/sec-edgar-search/) assembles a full-text search configuration, with tickers, forms and dates, and shows the output shape. It's a query builder, not a live search: browsers can't send the User-Agent the SEC requires, so the query runs server-side.

## At scale

The [SEC EDGAR Scraper actor](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu) on Apify has a `full_text_search` mode (`searchQuery`, `searchCiks`, `forms`, `dateFrom`, `dateTo`) that handles the User-Agent, pacing and paging, and returns clean rows as JSON, CSV or Excel. It also has a `latest_feed` mode for new filings. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The endpoint works the same without them.*

Sources: [SEC Full-Text Search FAQ](https://www.sec.gov/edgar/search/efts-faq.html), [SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), and live responses from efts.sec.gov on 2026-10-14, including each response's echoed `query` object.

## Quick answers

### What are the efts.sec.gov LATEST search-index API parameters?

`q` (search text, quoted for a phrase), `forms` (comma-separated, upper case, e.g. `10-K,8-K`), `ciks` (10-digit, zero-padded), `startdt` and `enddt` (`yyyy-mm-dd`), `from` (offset), `sort` (`desc` or `asc` by filing date), `locationCodes` and `locationType=incorporated`, and `entityName`. The page size is fixed at 100 and `from` stops at 9,900. Checked against the echoed query on 2026-10-14.

### Is there SEC EDGAR full text search API documentation?

The SEC documents the Full-Text Search page in its FAQ (sec.gov/edgar/search/efts-faq.html), including the query syntax, but it doesn't publish `efts.sec.gov/LATEST/search-index` as a documented API. The parameter behavior on this page comes from live tests and the `query` object each response echoes back. Treat it as an interface that can change without notice.

### How do I call efts.sec.gov from Python with requests?

`requests.get('https://efts.sec.gov/LATEST/search-index', params={'q': '"supply chain disruption"', 'forms': '10-K', 'startdt': '2025-01-01', 'enddt': '2025-12-31'}, headers={'User-Agent': 'Your Name you@example.com'})`. Without a declared User-Agent, python-requests' default got HTTP 403 on 2026-10-14. Read `hits.total.value` for the count and `hits.hits[]._source` for each document.

### How far back does EDGAR full-text search go?

The SEC's FAQ says Full-Text Search covers "the full text of all EDGAR filings submitted electronically since 2001", including attachments such as exhibits.

## Related guides

- [SEC EDGAR API in Python: User-Agent Format & Rate Limits](https://datatooly.xyz/guides/sec-edgar-api-python-guide/)
- [SEC Company Facts API: companyfacts, concept & frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/)
- [SEC EDGAR Rate Limit and User-Agent: Fair Access Rules](https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/)
- [SEC EDGAR API: Submissions JSON and Ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
