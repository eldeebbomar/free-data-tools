# Search ClinicalTrials.gov live — by condition, drug, or phase

> The ClinicalTrials.gov API is the official NIH/NLM v2 REST endpoint at https://clinicaltrials.gov/api/v2/studies — it returns clinical-trial records as JSON, needs no API key, and is CORS-open (Access-Control-Allow-Origin: *). This free tool queries it live from your browser: type a condition, drug, or phase and get real matching studies with NCT ID, title, status, phase, and lead sponsor.

- Type: Live tool (fetches real data in your browser)
- Category: [Health & Pharma](https://datatooly.xyz/category/health-pharma/)
- URL: https://datatooly.xyz/clinical-trials-search/
- Backing Apify actor: [clinical-trials-fda-scraper](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)

Type a medical condition or drug and search the official ClinicalTrials.gov registry live in your browser — real studies with NCT ID, status, phase, and lead sponsor. Free, no login, no API key.

## Key takeaways

- The tool is genuinely live: it calls the official ClinicalTrials.gov v2 REST API directly from your browser. No key, no signup, no proxy server in between (the API sends Access-Control-Allow-Origin: *, verified).
- Search by condition (query.cond), free-text term (query.term), or filter by phase and overall status (RECRUITING, COMPLETED, TERMINATED, etc.). Results show NCT ID, title, status, phase, and lead sponsor.
- The classic (legacy) ClinicalTrials.gov API was retired on June 25, 2024 — the v2 API built on OpenAPI 3.0 is the only supported version now.
- ClinicalTrials.gov holds over 500,000 registered studies (NLM marked the 500K milestone on the registry's 25th anniversary, April 2025) — the largest public trial registry in the world, all keyed by NCT identifier.
- This in-browser tool covers trial search only. For FDA drug approvals, 510(k)/PMA device clearances, FAERS adverse events, recalls, drug shortages, and sponsor pipeline rollups, the Clinical Trials & FDA Pipeline actor adds nine more modes plus CSV/JSON/Excel export.
- The backing Apify actor is free to start, then pay-as-you-go: the first 10 chargeable events of every run are free, and a 100-trial search costs roughly $0.04 ($0.01 run start + 90 paid trials at $0.0003).

## How it works

### 1. Real registry results, live

This queries the official ClinicalTrials.gov v2 REST API directly from your browser — the same registry the NIH publishes — so every study (NCT ID, status, phase, sponsor) is live, not a fixed sample.

### 2. Filter like an analyst

Search by condition and/or drug/intervention, then narrow by phase and status. Great for tracking a competitor's pipeline, an indication's trial landscape, or recruiting/active studies in a space.

### 3. Add the FDA layer at scale

The Clinical Trials & FDA Pipeline actor merges trials with FDA drug approvals, 510(k)/PMA device clearances, adverse events, recalls and drug shortages into a per-sponsor pipeline — with sponsor resolution by ticker/name, monitoring, and JSON/CSV/API export.

## How to use it

1. **Enter a condition, drug, or phase** — Type a medical condition like 'lung cancer', a drug or intervention like 'ozempic', or pick a phase. The tool maps your input to the v2 API's query.cond and query.intr parameters, and phase and status to filter.advanced (AREA[Phase], AREA[OverallStatus]).
2. **Run the live search** — Click search. The tool sends a fetch() request straight to https://clinicaltrials.gov/api/v2/studies from your browser — there's no backend in between because the API is CORS-open.
3. **Read the real results** — Each matching study shows its NCT ID, brief title, overall status (e.g., RECRUITING, COMPLETED), phase, and lead sponsor — pulled live from the official registry, not a cached sample.
4. **Open a study by NCT ID** — Click an NCT identifier to open its full ClinicalTrials.gov record, or fetch it programmatically at https://clinicaltrials.gov/api/v2/studies/{NCTId} for eligibility, arms, and outcome measures.
5. **Scale up with the actor** — For FDA approvals, device clearances, adverse events, recalls, shortages, sponsor pipeline rollups, monitoring, and CSV/JSON/Excel export, run the Clinical Trials & FDA Pipeline actor — free to start, then pay-as-you-go.

## Ready-to-run actor input

```json
{
  "mode": "trials",
  "maxItems": 100
}
```

## Key facts

- The ClinicalTrials.gov v2 REST API returns Access-Control-Allow-Origin: * and HTTP 200 to a browser-origin request, so it can be queried directly client-side with no proxy. (Source: Verified live via curl with Origin: https://datatooly.xyz header on 2026-06-01; response header observed directly.)
- ClinicalTrials.gov passed 500,000 registered studies around April 2025 (its 25th anniversary), making it the largest public clinical-trial registry in the world. (Source: NLM Director's blog, 'A 25-Year Journey to a Half-Million Registered Studies,' April 2, 2025.)
- The classic ClinicalTrials.gov API was retired on June 25, 2024; v2, built on the OpenAPI 3.0 specification, is the only supported version. (Source: NLM Technical Bulletin (2024 Mar–Apr) and ClinicalTrials.gov API Migration Guide.)
- The v2 API requires no API key and no authentication; community reports put the informal practical limit near 50 requests per minute per IP. (Source: Official: no-key access per ClinicalTrials.gov data-api docs. The ~50 req/min figure is community-reported, not an NLM-published hard limit.)
- A live query for recruiting lung-cancer trials returned real records including NCT06238882 (Instituto Nacional de Cancerología de México) and NCT04973293 (Ruijin Hospital). (Source: Observed directly from https://clinicaltrials.gov/api/v2/studies on 2026-06-01.)
- The backing Clinical Trials & FDA Pipeline actor is free to start, then pay-as-you-go: the first 10 chargeable events per run are free and a 100-trial search costs about $0.04 ($0.01 run start + 90 paid trials at $0.0003). (Source: Apify Store listing, constructive_calm/clinical-trials-fda-scraper, pay-per-event pricing section.)

## FAQ

### Does the ClinicalTrials.gov API require an API key?

No. The ClinicalTrials.gov v2 REST API is fully public — no API key, no authentication, and no signup. You can call https://clinicaltrials.gov/api/v2/studies directly from a script or, because it sends Access-Control-Allow-Origin: *, straight from a browser with fetch(). That CORS-open behavior is exactly why the search box on this page works live, with no backend proxy in between.

### What is the base URL for the ClinicalTrials.gov v2 API?

The studies endpoint is https://clinicaltrials.gov/api/v2/studies. To pull one trial's full record by its NCT number, use https://clinicaltrials.gov/api/v2/studies/{NCTId} (for example, .../NCT04211111). Both return JSON by default. The v2 API is built on the OpenAPI 3.0 specification, so its parameters and schema are formally documented at clinicaltrials.gov/data-api.

### How do I search ClinicalTrials.gov by condition?

Put the disease in the query.cond parameter, like ?query.cond=lung%20cancer. For drugs or interventions, use query.term=ozempic. Narrow results with filter.overallStatus=RECRUITING and, for phase, filter.advanced=AREA[Phase]PHASE3 (there is no filter.phase parameter; the API rejects it with HTTP 400), and set pageSize to control how many studies return. A full example: https://clinicaltrials.gov/api/v2/studies?query.cond=lung+cancer&filter.overallStatus=RECRUITING&pageSize=10. This tool builds that query for you.

### Is the old (classic) ClinicalTrials.gov API still available?

No. NLM retired the classic ClinicalTrials.gov API on June 25, 2024, alongside the modernized website. The v2 REST API is now the only supported version. If you have legacy code hitting the old endpoints or XML responses, you must migrate — NLM publishes an official API Migration Guide at clinicaltrials.gov/data-api/about-api/api-migration mapping classic fields to v2 equivalents.

### Does the ClinicalTrials.gov API have a rate limit?

NLM does not publish a hard, official rate limit for the v2 API, and no API key is needed. Community reports put the practical ceiling around 50 requests per minute per IP; reasonable batch queries rarely trip it. For heavy, scheduled, or large-export workloads, run server-side with backoff and pagination via nextPageToken rather than hammering from a single browser tab.

### How many clinical trials are on ClinicalTrials.gov?

As of April 2025, ClinicalTrials.gov listed more than 500,000 registered studies — a milestone NLM marked on the registry's 25th anniversary. It is the largest public clinical-trial registry in the world. Every study carries a unique NCT identifier (National Clinical Trial number), which is the join key across registries, FDA datasets, and publications.

### Can I query the ClinicalTrials.gov API directly from the browser?

Yes — and that is unusual for a government API. ClinicalTrials.gov sends the Access-Control-Allow-Origin: * header (verified live), so a browser fetch() to the v2 endpoint succeeds without a CORS error. That is why this page can show real studies client-side. Most APIs block cross-origin browser calls and force you through a proxy; this one does not.

### How do I get full study details by NCT number?

Request the single-study endpoint: https://clinicaltrials.gov/api/v2/studies/NCT04211111. The JSON response includes the full protocolSection — identification, status, sponsor/collaborators, design (phases, study type), eligibility criteria, arms/interventions, and outcome measures — plus the resultsSection when results are posted. In this tool's upsell actor, the trial_details mode pulls and flattens those records for export.

### What's the difference between this free tool and the paid Clinical Trials & FDA Pipeline actor?

This page searches ClinicalTrials.gov trials live, in your browser, for free. The Apify actor (free to start, then pay-as-you-go) adds nine more modes: full trial details, FDA drug approvals, 510(k)/PMA device clearances, FAERS adverse events, recalls, drug shortages, sponsor pipeline rollups, change monitoring, and AI summaries — plus sponsor resolution, filters, and CSV/JSON/Excel export. The first 10 chargeable events per run are free.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Google Patents search](https://datatooly.xyz/google-patents-search-builder/)
- [Peptide market intel](https://datatooly.xyz/peptide-market-intel-tool/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
