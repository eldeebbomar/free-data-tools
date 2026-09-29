# How to Export Google Patents to CSV (Honest Guide to Every Real Path)

> A precise, no-hype guide to exporting Google Patents search results to CSV — the built-in 1,000-row cap, the BigQuery bulk path, and why browser scraping fails.

- URL: https://datatooly.xyz/guides/export-google-patents-to-csv/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-05-31
- Updated: 2026-05-31
- Free tool: [Search Google Patents by company, inventor, or keyword — the structured way](https://datatooly.xyz/google-patents-search-builder/)
- Tags: python, api, datascience, tutorial

If you've ever needed to pull a few thousand patents into a spreadsheet — every filing by a competitor, every patent citing your portfolio, the legal status of an entire technology cluster — you've probably searched **how to export Google Patents to CSV** and found a maze of half-answers. This guide cuts through it. I'll show you exactly what works, what's capped, and what's quietly impossible, with verified facts and a runnable example.

Let me start with the single most important thing, because it shapes every decision below:

> **Google Patents has no public REST API.** There is no documented, supported HTTP endpoint you can hit to query patents programmatically. This is the root cause of nearly every frustration people run into.

With that established, here are the three real paths, from simplest to most powerful.

## Path 1: The built-in CSV download (fast, but capped at 1,000)

Google Patents *does* have an export button, and for small jobs it's perfect. Run a search at [patents.google.com](https://patents.google.com), then look for the **Download (CSV)** link near the results.

It works. But it has a hard ceiling:

> **The built-in CSV export returns only the top 1,000 results.** If your query matches 40,000 patents, you get the first 1,000 by relevance and nothing more.

The exported columns are also fairly thin — typically id, title, assignee, inventor, priority/filing/publication/grant dates, and result link. You do **not** get the abstract, the claims text, the full citation graph, or detailed legal-status events. For a quick competitor snapshot, this is fine. For analysis, it's a teaser.

A practical tip: tighten your query so the 1,000 you get are the 1,000 you want. Combine fields:

```
(assignee:"Tesla") AND (inventor:"Straubel") AND before:priority:20200101
```

Google Patents supports field-qualified search — `assignee:`, `inventor:`, `before:`/`after:` with `priority`/`filing`/`publication`, country codes, CPC classifications, and free text. Narrowing first is the difference between a useful 1,000-row export and a useless one.

## Path 2: BigQuery — the only Google-supported bulk path

When 1,000 rows isn't enough, there is exactly one path Google itself supports for bulk patent data, and it's a good one: the **`patents-public-data`** dataset on Google BigQuery.

This is a genuinely first-class resource. The main table, `patents-public-data.patents.publications`, contains bibliographic information on tens of millions of patent publications worldwide, with structured fields for assignees, inventors, titles, abstracts, claims, CPC/IPC classifications, citations, and priority/filing/publication dates — far richer than the CSV button.

Two things to know before you commit:

1. **It requires SQL.** There's no point-and-click here. You write queries.
2. **Pricing is generous but real.** On-demand BigQuery gives you the **first 1 TiB of query data processed free every month**; beyond that, queries are billed per TiB scanned (Google has historically documented the patents dataset access at $5/TB, and current general on-demand US pricing is $6.25/TiB — check the [official BigQuery pricing page](https://cloud.google.com/bigquery/pricing) for the rate that applies to you). The patents tables are large, so a careless `SELECT *` can chew through your free tier in a single query. Always select only the columns you need and filter early.

Here's a real, runnable example. It pulls US patents matching an assignee, flattens the repeated fields (titles and assignees are nested arrays in this schema), and writes a clean CSV. You'll need a Google Cloud project and `pip install google-cloud-bigquery pandas db-dtypes`.

```python
from google.cloud import bigquery

client = bigquery.Client(project="your-gcp-project-id")

# title_localized and assignee_harmonized are REPEATED records, so UNNEST them.
# Filter by country and date FIRST to limit the bytes scanned (and the cost).
query = """
SELECT
  pub.publication_number,
  title.text          AS title,
  assignee.name       AS assignee,
  pub.filing_date,
  pub.publication_date,
  pub.grant_date
FROM `patents-public-data.patents.publications` AS pub,
  UNNEST(pub.title_localized)      AS title,
  UNNEST(pub.assignee_harmonized)  AS assignee
WHERE pub.country_code = 'US'
  AND title.language = 'en'
  AND assignee.name LIKE '%TESLA%'
  AND pub.filing_date BETWEEN 20150101 AND 20231231
"""

# Dry run FIRST — see how many bytes this will scan before you pay a cent.
dry = client.query(query, job_config=bigquery.QueryJobConfig(dry_run=True))
print(f"This query will scan {dry.total_bytes_processed / 1e9:.2f} GB")

# If that looks acceptable, run it for real.
df = client.query(query).to_dataframe()
df.to_csv("tesla_patents.csv", index=False)
print(f"Exported {len(df)} rows to tesla_patents.csv")
```

The `dry_run` step is the habit that saves your bill. It returns the exact byte count *without* running the query, so you always know the cost before you spend it. Dates in this dataset are stored as integers in `YYYYMMDD` form (e.g. `20150101`), which trips up newcomers — note the comparison style above.

BigQuery is the right answer for academic analysis, large-scale landscaping, and anything where you control a GCP project and are comfortable with SQL. Its main downsides: the SQL learning curve for the nested schema, and the fact that some legal-status events and full citation context require joining additional tables.

## Path 3 (the one people *expect* to work): browser scraping — and why it doesn't

This is where most tutorials go wrong, so let me be precise.

Google Patents search is powered internally by an XHR endpoint (the one your browser hits as you type a query). The intuitive idea is: "I'll just `fetch()` that endpoint from a little web page and read the JSON." It feels like it should work. It does not, and here's the exact reason:

> **The query endpoint does not send a permissive CORS header.** A browser running on any other origin cannot read the response — the browser blocks it before your JavaScript ever sees the data.

This isn't a bug you can header-hack around from client-side JS; CORS is enforced by the browser, not the server. So a pure in-browser scraper served from your own domain is a dead end. Combined with "no public REST API," this is why client-side patent tools can only ever *build* a query and show you a curated sample — a browser on another origin can't read live results, so the fetch has to happen server-side.

To actually fetch results at scale you need a **server-side** process (your own backend, a cloud function, or a hosted scraper) that makes the request without a browser's CORS enforcement, handles pagination, parses the response, and respects rate limits. That's real work, and it's the gap the two tools below fill.

## Tying it together: a builder + a scraper

If you just need to construct a precise query and preview what the data looks like — without writing SQL or standing up a backend — the free [Google Patents Search Builder](https://datatooly.xyz/google-patents-search-builder/) lets you compose searches by assignee, inventor, and keyword and see a real sample of the structured output. Because of the CORS reality above, it's honest about what it is: a **query builder with a real sample preview**, not a live in-browser scraper. It's a great way to nail your query before you spend BigQuery bytes or kick off a larger run.

When you need the full export — thousands of rows, across 100+ patent offices, *with* the fields the built-in CSV omits — the [Google Patents Intelligence actor on Apify](https://apify.com/constructive_calm/google-patents-intelligence?fpr=v77kxu) (disclosure: I build it, and the free Search Builder above) runs the live search server-side and returns the citation graph, legal status, and claims count as CSV, JSON, Excel, or an API endpoint. It's the do-this-at-scale option for the cases where the 1,000-row cap bites and you'd rather not maintain SQL pipelines or your own scraping infrastructure.

## Which path should you pick?

- **A quick competitor snapshot, under 1,000 results?** Use the built-in CSV button. Narrow your query first.
- **Large-scale analysis and you know SQL?** BigQuery's `patents-public-data` is the gold standard. Dry-run every query.
- **Thousands of enriched rows without SQL or servers?** A hosted scraper is the pragmatic choice.

A closing note on doing this responsibly: scraping any site, Google Patents included, lives under its Terms of Service and applicable law. For bulk needs, the BigQuery dataset is the explicitly Google-supported route and the cleanest one to stand behind — prefer it when SQL is on the table, and keep request volumes reasonable when you don't. Build the right query once, and the export takes care of itself.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
