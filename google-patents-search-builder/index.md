# Search Google Patents by company, inventor, or keyword — the structured way

> Google Patents search lets you query 100+ patent offices (USPTO, EPO, WIPO, JPO, CNIPA) by keyword, assignee/company, inventor, CPC classification, or date. The free site is ideal for reading single patents but caps its CSV download at the first 1,000 results per query and offers no public API. For bulk, repeatable landscape work, use a structured query builder plus a server-side export pipeline.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Patents & IP](https://datatooly.xyz/category/patents-ip/)
- URL: https://datatooly.xyz/google-patents-search-builder/
- Backing Apify actor: [google-patents-intelligence](https://apify.com/constructive_calm/google-patents-intelligence?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Export Google Patents to CSV (Honest Guide to Every Real Path)](https://datatooly.xyz/guides/export-google-patents-to-csv/)

Compose a precise patent query — by keyword, assignee (company), or inventor — and see an example of the clean, structured records the actor returns: titles, assignees, filing/grant dates, citation counts, and legal status across USPTO, EPO, WIPO and 100+ offices.

## Key takeaways

- Google Patents indexes 120+ million patent publications from 100+ offices worldwide, including USPTO, EPO, WIPO, JPO and CNIPA, with machine-translated full text.
- Google's built-in Download (CSV) button is documented to return only the top 1,000 results of any single query, and fewer may be returned.
- Google Patents offers no official public REST search API. The only Google-supported bulk path is the Google Patents Public Datasets on BigQuery, which requires SQL and a Google Cloud project.
- Search by company uses the assignee: operator, search by inventor uses inventor:, and both can be stacked with keyword, CPC, country and before:/after: date filters.
- Because Google Patents does not send a permissive CORS header, browsers block other sites from reading its results — so this free tool is an honest query builder + sample-data preview, not a live scraper.
- Google Patents' native CSV omits abstracts, full claims, citations and legal status. Those omitted fields are exactly what IP analysts need, so enriched server-side extraction is usually required.
- BigQuery patent access is free for the first 1 TB of query data per user per month, then $5 per terabyte, but you must write SQL to use it.

## How it works

### 1. Compose the right query

Patent search is fiddly — keyword vs. assignee vs. inventor each behave differently. This builder produces a clean, valid run configuration you can copy and run instantly.

### 2. See what you'll get

The sample shows the actual fields the actor returns per patent: title, abstract, assignee, filing/publication/priority dates, legal status, claims count, and backward/forward citation counts — not just a link.

### 3. Run it across 100+ patent offices

Google Patents Intelligence covers USPTO, EPO, WIPO, JPO, CNIPA, KIPO and more in one query, with deep enrichment and a monitor mode for new filings by a competitor or in a CPC class.

## How to use it

1. **Pick your search dimension** — Choose how to search Google Patents: by keyword, company/assignee, inventor, CPC classification, or a combination. Enter the exact terms (e.g. assignee:"Acme Corp", inventor:"Jane Doe", a keyword phrase, or a CPC code).
2. **Add filters to scope the query** — Narrow the result set with country/office filters (US, EP, WO, JP, CN), a priority- or publication-date range via before:/after:, and patent status. Tight scoping keeps each query under the 1,000-row native cap and produces cleaner landscapes.
3. **Build the structured query and preview fields** — The free builder assembles a valid run configuration and previews the structured output fields (title, assignee, inventor, dates, IDs, and enriched fields) using sample data, since Google Patents' lack of CORS prevents a live in-browser fetch.
4. **Review the sample-data preview** — Inspect the previewed rows to confirm the fields and shape match what your analysis needs before committing to a real run. Adjust operators or filters and rebuild until the structure is right.
5. **Run live and export** — Hand the same config to the Google Patents Intelligence actor to run live across 100+ offices, deep-enrich each record with citations, legal status and claims, paginate past the 1,000 cap, and export to CSV, JSON, Excel, or API.

## Example output

A fixed sample of the fields the google-patents-intelligence actor returns — example data, not live results.

| title | assigneeCurrent | patentId | filingDate | grantDate |
| --- | --- | --- | --- | --- |
| Technologies for resource-efficient quantum error correction | The University Of Chicago | US12210935B2 | 2020-03-03 | 2025-01-28 |
| Fault tolerant quantum error correction with linear codes | Microsoft Technology Licensing, Llc | US11700020B2 | 2019-10-24 | 2023-07-11 |
| Quantum error correction | Google Llc | US12353959B2 | 2023-10-05 | 2025-07-08 |
| Quantum error-correction in microwave integrated quantum circuits | Rigetti & Co, Llc | US11977113B1 | 2023-02-06 | 2024-05-07 |
| Adaptive error correction in quantum computing | International Business Machines Corporation | US11475189B2 | 2021-04-20 | 2022-10-18 |

## Ready-to-run actor input

```json
{
  "mode": "search",
  "maxResults": 50,
  "enrichmentDepth": "deep"
}
```

## Key facts

- Google Patents indexes over 120 million patent publications from more than 100 patent offices worldwide, including USPTO, EPO, WIPO, JPO and CNIPA. (Source: Google Patents official coverage page (patents.google.com about/coverage), fetched 2026-05-31.)
- Google Patents' built-in Download (CSV) feature returns only the top 1,000 results of a query, and Google notes fewer than 1,000 may be returned. (Source: Google Help, Search results page documentation (support.google.com/faqs/answer/7049588).)
- Google does not offer a direct public REST API for patents.google.com; the only Google-supported bulk access is the Google Patents Public Datasets on BigQuery, which requires SQL. (Source: Google Cloud Public Datasets blog and google/patents-public-data GitHub; confirmed absence of a live search API.)
- BigQuery access to the public patent datasets is free for the first 1 TB of query data per user per month, then billed at $5 per terabyte. (Source: Google Cloud BigQuery pricing as cited in Google Patents Public Datasets documentation.)
- Google Patents supports field operators including assignee:, inventor:, before:, after:, plus Boolean AND/OR/NOT and proximity operators (NEAR, ADJ, WITH, SAME). (Source: Google Patents advanced search documentation (support.google.com/faqs/answer/7049475) and GreyB operator guide.)

## FAQ

### Does Google Patents have an API?

No. Google Patents does not publish an official public REST API for live search. The only Google-supported bulk option is the Google Patents Public Datasets on BigQuery, which requires SQL and a Google Cloud project (free for the first 1 TB/month, then $5/TB). For programmatic search-and-export without SQL, people use a scraping actor or third-party API that returns structured JSON/CSV per query.

### How do I export Google Patents results to CSV?

On a Google Patents results page there is a Download (CSV) button, but Google documents it as returning only the top 1,000 results, and it includes limited columns (title, assignee, inventor, dates, IDs) without claims, citations, or legal status. For larger or enriched exports, split queries under 1,000 rows or run a dedicated pipeline that paginates and structures every field.

### How do I search Google Patents by company or assignee?

Use the assignee: operator, e.g. assignee:"Apple Inc", or the Assignee field in advanced search (it autocompletes). Assignee names are not normalized, so one company can appear under several spellings, subsidiaries, and acquisitions. Robust patent search by assignee means searching multiple name variants and deduplicating by patent family before exporting.

### How do I search Google Patents by inventor?

Use inventor:"First Last" in the search box or the Inventor field in advanced search. Combine it with assignee, keyword and date filters, e.g. inventor:"Jane Doe" assignee:"Acme" after:priority:20200101. Inventor names have spelling variants and homonyms, so verify hits against assignee and CPC classification before treating an inventor portfolio as complete.

### Why can't a website search Google Patents live in my browser?

Google Patents' query endpoint does not send a permissive Access-Control-Allow-Origin header for third-party origins, so the browser blocks JavaScript on another site from reading the response. This free tool is honest about it: it builds a valid query config and previews the structured fields with sample data, while the actual live fetch runs server-side in the paid actor.

### What is the best Google Patents API alternative for bulk download?

If you need more than 1,000 rows, multiple offices, or fields Google's CSV omits (claims, forward/backward citations, legal status), the practical alternatives are the BigQuery public dataset (SQL-based) or a server-side extraction actor that runs the search, paginates, enriches each record, and exports CSV/JSON/Excel/API. The actor route avoids SQL and returns analysis-ready rows.

### How many results can you download from Google Patents at once?

Google's built-in CSV download returns only the top 1,000 results of any single query, and Google notes fewer may be returned. The web UI itself also caps pagination at roughly 100 pages of 10 results. To capture more, narrow the query into sub-1,000 slices (by year, country, or CPC) and merge them, or use a pipeline that paginates beyond the cap into one deduplicated export.

### Does Google Patents cover non-US patents like EPO, WIPO, and CNIPA?

Yes. Google Patents indexes 100+ patent-issuing authorities, including the USPTO (US), EPO (European), WIPO (PCT/WO), JPO (Japan) and CNIPA (China), with machine-translated full text for many. For cross-office competitive intelligence, search by patent family rather than single publications so the same invention filed in several offices is counted once.

### Is scraping Google Patents allowed?

Google Patents is a public-facing site and the underlying patents are government-published. Many teams extract it for research and competitive intelligence, but you should review Google's Terms of Service, rate-limit requests, and avoid overloading the service. A managed actor with proxy rotation and polite pacing reduces the operational and compliance burden versus ad-hoc scripts.

### What fields does Google Patents' CSV miss that analysts need?

The native CSV gives title, assignee, inventor, key dates and patent numbers, but typically omits the abstract, full claims, forward/backward citations, current legal status (granted/expired/lapsed), CPC detail, and family members. Those omitted fields are exactly what IP analysts use to judge patent strength, freedom-to-operate, and white space, so enriched extraction is usually required for real analysis.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Clinical trials search](https://datatooly.xyz/clinical-trials-search/)
- [Peptide market intel](https://datatooly.xyz/peptide-market-intel-tool/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
