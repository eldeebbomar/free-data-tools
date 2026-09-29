# The SEC EDGAR API: A Practical Guide to Free Filing Data in Python

> A hands-on guide to the free SEC EDGAR API: the required User-Agent header, ticker-to-CIK mapping, XBRL financials, and full-text search in Python.

- URL: https://datatooly.xyz/guides/sec-edgar-api-python-guide/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-13
- Updated: 2026-06-13
- Free tool: [Search SEC EDGAR filings, financials & insider trades](https://datatooly.xyz/sec-edgar-search/)
- Tags: api, python, finance, datascience

The **SEC EDGAR API** is one of the best-kept secrets in financial data engineering: every mandatory disclosure filed by every U.S. public company, available as clean JSON, for free, with no API key. If you've ever paid for a "fundamentals" data vendor or scraped a brokerage page for a balance sheet, you've been working harder than you need to. The raw, authoritative source — quarterly revenue, insider trades, institutional holdings, 8-K event filings — is sitting on `data.sec.gov` waiting for an HTTP GET.

The catch is small but absolute, and it trips up almost everyone on their first request. Let's walk through how the API actually works, write a correct, runnable Python example, and cover the one rule that will get your IP blocked if you ignore it.

## What "the SEC EDGAR API" actually is

There isn't a single endpoint. "The SEC EDGAR API" is really three free public services that work together:

1. **The structured data API** (`data.sec.gov`) — JSON endpoints for company submissions and XBRL financial facts.
2. **Full-text search** (`efts.sec.gov`) — a keyword search index over the text of every filing submitted since 2001, including exhibits.
3. **The ticker map** (`company_tickers.json`) — a small file that maps stock tickers and company names to the internal IDs the other two services require.

None of them require registration or an API key. All of them require one HTTP header. We'll get to that.

## The CIK: EDGAR's primary key

EDGAR doesn't index companies by ticker. It uses a **Central Index Key (CIK)** — a unique integer assigned to every filer. Apple's CIK is `320193`.

Two things bite people here:

- You need to translate a ticker (`AAPL`) into a CIK before you can call most endpoints. That's what `company_tickers.json` is for.
- In API URLs, the CIK **must be zero-padded to exactly 10 digits**. Apple's `320193` becomes `CIK0000320193`. Pass the un-padded number and you'll get a 404.

This is the single most common silent failure when getting started, so bake the padding into a helper and never think about it again.

## The one rule: declare a User-Agent or get a 403

The SEC enforces a **fair-access policy**. Every request must include a `User-Agent` header that identifies who you are, and the policy asks for a contact — typically your name and email. Send a request without it, or with a generic library default, and EDGAR returns **403 Forbidden** and may block your IP for roughly ten minutes.

I confirmed this the hard way while researching this article: an automated fetch of an SEC documentation page with no declared User-Agent came straight back as `403 Forbidden`. That's not an edge case — it's the designed behavior.

This rule has a subtle, important consequence: **a normal web browser cannot consume these endpoints directly.** Browser JavaScript is forbidden by the Fetch spec from setting the `User-Agent` header — it's a "forbidden header name." So a pure in-browser tool physically cannot make a compliant request to `data.sec.gov`. Any browser-based EDGAR helper is therefore a *query builder* or *preview* — it constructs the right URL for you to run server-side — not a live in-browser fetcher. Keep that distinction in mind; it matters when you choose tooling later.

The other half of fair access is a **rate limit of 10 requests per second** per IP. Exceed it and you'll see `429` responses and, again, a temporary block. A simple `time.sleep(0.1)` between calls, or capping yourself a little lower at ~8/s, keeps you safely compliant.

## A correct, runnable Python example

Here's an end-to-end script: resolve a ticker to a CIK, zero-pad it, and pull a specific financial concept (annual revenue) from the XBRL `companyconcept` endpoint. It uses only the standard `requests` library and follows every fair-access rule.

```python
import time
import requests

# Identify yourself. The SEC fair-access policy requires a descriptive
# User-Agent with a contact. Use your real app name + email.
HEADERS = {"User-Agent": "edgar-demo/1.0 (you@example.com)"}

def get_ticker_cik_map():
    """Download the official ticker -> CIK map."""
    url = "https://www.sec.gov/files/company_tickers.json"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    # Keys are arbitrary indices; each value has cik_str, ticker, title.
    return {row["ticker"].upper(): row["cik_str"] for row in resp.json().values()}

def cik_padded(cik_int):
    """EDGAR requires the CIK zero-padded to 10 digits."""
    return f"CIK{int(cik_int):010d}"

def get_concept(cik_int, concept, taxonomy="us-gaap"):
    """Fetch one XBRL concept (e.g. Revenues) for a company."""
    url = (
        f"https://data.sec.gov/api/xbrl/companyconcept/"
        f"{cik_padded(cik_int)}/{taxonomy}/{concept}.json"
    )
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()

if __name__ == "__main__":
    tickers = get_ticker_cik_map()
    cik = tickers["AAPL"]
    print(f"AAPL CIK: {cik} -> {cik_padded(cik)}")

    time.sleep(0.1)  # stay under 10 req/s

    data = get_concept(cik, "RevenueFromContractWithCustomerExcludingAssessedTax")

    # Print annual (10-K) USD figures.
    for unit in data["units"]["USD"]:
        if unit.get("form") == "10-K" and unit.get("fp") == "FY":
            print(unit["fy"], unit["frame"] if "frame" in unit else "",
                  f"${unit['val']:,}")
```

Two things to notice. First, the `User-Agent` is doing real work — remove it and every call 403s. Second, XBRL concepts are *specific*: revenue under modern US-GAAP is usually tagged `RevenueFromContractWithCustomerExcludingAssessedTax`, not a friendly `Revenue`. Discovering the right tag for each company is part of the job.

## The other endpoints worth knowing

Once you're past authentication, the API surface is broad:

- **Submissions** — `https://data.sec.gov/submissions/CIK##########.json` returns a company's filing history: every form type, accession number, and date. This is your entry point for "list all 10-Ks for this company."
- **Company facts** — `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` returns *all* XBRL facts for a company in one call. Heavy, but great for bulk extraction.
- **Frames** — `https://data.sec.gov/api/xbrl/frames/us-gaap/{CONCEPT}/{UNIT}/CY{YEAR}.json` flips the axis: one concept across *every* company for a period. Perfect for cross-sectional analysis ("every filer's 2024 revenue").
- **Full-text search** — `https://efts.sec.gov/LATEST/search-index?q=...` searches the text of all filings since 2001 by keyword, with filters for form type, date range, and entity. No key, same User-Agent rule.

## Where it gets hard (and where a tool helps)

The endpoints are free and well-documented, but turning them into a usable dataset is more work than a single GET. Real projects hit:

- **XBRL tag archaeology** — companies use different, sometimes deprecated, tags for the same concept across years.
- **Form-specific parsing** — Form 4 (insider trades), Form 13F (institutional holdings), and 8-K item codes each have their own nested structures and quirks.
- **Pagination, rate-limit backoff, and ticker resolution** plumbing you rewrite on every project.
- **The browser problem** — you can't prototype a live query from a web UI because of the User-Agent restriction.

If you want to *design* a query before you write the plumbing, a free **[SEC EDGAR query builder](https://datatooly.xyz/sec-edgar-search/)** lets you assemble the right endpoint and parameters and preview the request shape. Because of the User-Agent rule above, it builds and previews the query — it does not execute a live fetch in your browser; you run the generated request server-side.

When you'd rather skip the plumbing entirely, the **[SEC EDGAR Scraper actor](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu)** handles the compliant-User-Agent requests, rate limiting, and parsing for you. It exposes nine modes — filings, normalized financials, raw XBRL facts, full-text search, Form 4 insider trades, Form 13F holdings, activist (SC 13D/G) stakes, a latest-filings feed, and parsed 8-K items — with ticker-to-CIK resolution built in and output as JSON, CSV, Excel, or XML. It's free to start (the first 50 chargeable events per run are free), then pay-as-you-go.

## The takeaway

The SEC EDGAR API gives you institutional-grade financial data for the price of a well-formed HTTP header. Remember the three rules — **declare a User-Agent, zero-pad your CIK to 10 digits, and stay under 10 requests per second** — and the entire corpus of U.S. public-company disclosures is yours to query. Start with the `company_tickers.json` map, graduate to `companyconcept` for targeted facts or `frames` for cross-sectional pulls, and reach for the full-text index when you need to find filings by what they *say*, not just who filed them.

*Disclosure: I'm the author of the SEC EDGAR Scraper actor and the linked query builder.*

Sources: [SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [SEC: EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [SEC: EDGAR Full Text Search FAQ](https://www.sec.gov/edgar/search/efts-faq.html).

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
