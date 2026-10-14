# ClinicalTrials.gov Classic API to v2: Migration Guide

> The classic ClinicalTrials.gov API was retired on June 25, 2024. Map full_studies, study_fields, expr, min_rnk and fmt to API v2, or use the legacy XML shims.

- URL: https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search ClinicalTrials.gov live — by condition, drug, or phase](https://datatooly.xyz/clinical-trials-search/)
- Run this exact query on Apify: [Find every clinical trial for one drug (semaglutide)](https://apify.com/constructive_calm/clinical-trials-fda-scraper/examples/ctfda-trials-by-drug-intervention-semaglutide?fpr=v77kxu)
- Another example on Apify: [Get full trial details by NCT ID](https://apify.com/constructive_calm/clinical-trials-fda-scraper/examples/ctfda-full-trial-details-by-nct-id?fpr=v77kxu)
- Tags: api, python, healthcare, datascience

The classic ClinicalTrials.gov API (`/api/query/full_studies`, `/api/query/study_fields`, `/api/info/...`) was retired on June 25, 2024, and those URLs now return HTTP 404. Move to API v2 at `https://clinicaltrials.gov/api/v2/studies`. Put your classic `expr` into `query.term`, replace `min_rnk`/`max_rnk` with `pageSize` and `pageToken`, and use `format=json` or `csv`. For XML in the old shape, NLM runs `/api/legacy/` endpoints.

This guide maps every classic endpoint and parameter to its v2 replacement. It's based on NLM's official [API Migration Guide](https://clinicaltrials.gov/data-api/about-api/api-migration), and every URL was checked live on 2026-10-14.

## What happened to the classic API

NLM's Technical Bulletin of June 25, 2024 says: *"Effective today, the classic ClinicalTrials.gov website and its application programming interface (API) are retired and no longer available."* ([NLM Technical Bulletin](https://www.nlm.nih.gov/pubs/techbull/mj24/mj24_Modern_Clinical_Trials_Website.html)). NLM's earlier announcement said attempts to use the classic website would be "automatically redirected to the modernized ClinicalTrials.gov website" ([NLM news](https://www.nlm.nih.gov/news/Modernized_ClinicalTrials.html)), but API calls get no such redirect to a working endpoint.

What the old URLs do now:

| URL | Result on 2026-10-14 |
|---|---|
| `https://clinicaltrials.gov/api/query/study_fields?...` | HTTP 404 |
| `https://clinicaltrials.gov/api/query/full_studies?...` | HTTP 404 |
| `https://clinicaltrials.gov/api/info/study_fields_list` | HTTP 404 |
| `https://classic.clinicaltrials.gov/api/query/...` | HTTP 301 to the same path on clinicaltrials.gov, which then returns 404 |
| `https://clinicaltrials.gov/ct2/results?cond=diabetes` | HTTP 301 to the new website search |

If a script started failing with 404s or empty responses in mid-2024, this is why.

## Endpoint mapping

The path prefixes, from the migration guide: classic endpoints start with `/api/info/` or `/api/query/`, the new API with `/api/v2/`, and the legacy support endpoints with `/api/legacy/`.

| Classic endpoint | v2 replacement | Legacy endpoint (XML only) |
|---|---|---|
| `/api/query/full_studies` | `/api/v2/studies` | `/api/legacy/full-studies` |
| `/api/query/study_fields` | `/api/v2/studies` with `fields=` | `/api/legacy/study-fields` |
| `/api/query/field_values` | `/api/v2/stats/field/values` (all studies, at most 250 values), or `/api/v2/studies?fields=...` | none |
| `/api/info/data_vrs` | `/api/v2/version` (`dataTimestamp`) | `DataVrs` tag in legacy responses |
| `/api/info/api_vrs` | `/api/v2/version` (`apiVersion`) | `APIVrs` tag in legacy responses |
| `/api/info/study_structure`, `/api/info/api_defs` | `/api/v2/studies/metadata`, `/api/v2/stats/field/values`, `/api/v2/stats/field/sizes` | |
| `/api/info/study_fields_list` | `/api/v2/studies/metadata` | `/api/legacy/study-fields-list` |
| `/api/info/search_areas` | `/api/v2/studies/search-areas` | |
| Single study without results | `/api/v2/studies/{nctId}` | `/api/legacy/public-xml/{nctId}` |
| Single study with results | `/api/v2/studies/{nctId}` | `/api/legacy/public-xml/{nctId}?full=true` |
| All public data as a ZIP | `/api/v2/studies/download?format=json.zip` | `/api/legacy/public-xml?format=zip` |
| `/ct2/download_studies` (search as ZIP) | `/api/v2/studies` | `/api/legacy/public-xml?format=zip&term=...` |

In the v2 column, one endpoint replaces both `full_studies` and `study_fields`: `/api/v2/studies` returns full records by default and only the requested fields when you pass `fields`.

## Parameter mapping

| Classic parameter | v2 equivalent | Notes |
|---|---|---|
| `expr` | `query.term` | The migration guide: "The Search expression, classic expr parameter, can be set in the query.term parameter." Default search areas differ slightly. |
| `min_rnk`, `max_rnk` | `pageSize` + `pageToken` | v2 uses a cursor. Each response has `nextPageToken`; pass it back as `pageToken`. Default page size 10, maximum 1,000. |
| `fmt=json` / `xml` / `csv` | `format=json` / `csv` | v2 has no XML. Only the `/api/legacy/` endpoints return XML. |
| `fields` | `fields` | v2 accepts the same piece names (`NCTId`, `BriefTitle`, `OverallStatus`), but returns them nested inside `protocolSection`. |
| Ranking by relevance | `sort=@relevance` | v2 results are unsorted by default. |
| `cond`, `term`, `intr`, `lead`, `id` (website search URLs) | `query.cond`, `query.term`, `query.intr`, `query.lead`, `query.id` | |

## Data model changes that break parsers

From the migration guide's Study Data Model section:

- **Shorter, reused field names in a nested structure.** `NCTId` is now at `protocolSection.identificationModule.nctId`. The Study Data Structure page lists each field's classic XPath next to its new path.
- **Lists are plain arrays.** There are no wrapper objects any more, and list fields have plural names, such as `conditions` and `phases`.
- **Enums are upper-case codes.** `Recruiting` is now `RECRUITING`, `Phase 2` is `PHASE2`, `Not Applicable` is `NA`. `/api/v2/studies/enums` gives every value with its `legacyValue`, so you can build the mapping in code (below).
- **Dates are ISO 8601.** They come as `yyyy`, `yyyy-MM`, `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm`. Classic values like "June 2020" are gone. Two booleans were added for the old `Unknown` dates: `SubmissionUnreleaseDateUnknown` and `UnpostedEventDateUnknown`.
- **Rich text is Markdown.** Pass `markupFormat=legacy` to get the classic formatting.

## Side by side: classic, legacy and v2

```python
import xml.etree.ElementTree as ET
import requests

CT = "https://clinicaltrials.gov"

# 1. The classic endpoint is gone.
r = requests.get(f"{CT}/api/query/study_fields",
                 params={"expr": "heart attack", "fields": "NCTId,BriefTitle", "fmt": "json"}, timeout=60)
print("classic /api/query/study_fields:", r.status_code)

# 2. The legacy shim answers in the classic XML shape (XML only).
r = requests.get(f"{CT}/api/legacy/study-fields",
                 params={"expr": "heart attack", "fields": "NCTId,BriefTitle", "min_rnk": 1, "max_rnk": 3}, timeout=60)
root = ET.fromstring(r.content)
print("legacy study-fields:", r.status_code, "APIVrs", root.findtext("APIVrs"),
      "found", root.findtext("NStudiesFound"),
      [v.text for v in root.iter("FieldValue")][:2])

# 3. The v2 equivalent: expr -> query.term, min_rnk/max_rnk -> pageSize + pageToken.
r = requests.get(f"{CT}/api/v2/studies", params={
    "query.term": "heart attack", "fields": "NCTId,BriefTitle",
    "pageSize": 3, "countTotal": "true"}, timeout=60)
d = r.json()
print("v2 /api/v2/studies:", r.status_code, "totalCount", d["totalCount"],
      [s["protocolSection"]["identificationModule"]["nctId"] for s in d["studies"]],
      "nextPageToken" in d)

# 4. Map classic display values ("Recruiting") to v2 enums ("RECRUITING").
enums = requests.get(f"{CT}/api/v2/studies/enums", timeout=60).json()
legacy_to_v2 = {
    e["type"]: {v["legacyValue"]: v["value"] for v in e["values"]}
    for e in enums if e["type"] in ("Status", "Phase", "StudyType")
}
print(legacy_to_v2["Status"]["Active, not recruiting"], legacy_to_v2["Phase"]["Phase 2"],
      legacy_to_v2["Phase"]["Not Applicable"], legacy_to_v2["StudyType"])
```

Output on 2026-10-14:

```text
classic /api/query/study_fields: 404
legacy study-fields: 200 APIVrs 1.2.0 found 13807 ['NCT01401036', 'Nobori And Uncoated Stent In Coronary Attack']
v2 /api/v2/studies: 200 totalCount 13807 ['NCT05513248', 'NCT04345848', 'NCT04619355'] True
ACTIVE_NOT_RECRUITING PHASE2 NA {'Expanded Access': 'EXPANDED_ACCESS', 'Interventional': 'INTERVENTIONAL', 'Observational': 'OBSERVATIONAL'}
```

Both APIs found 13,807 studies, but in a different order. The legacy endpoint ranks by relevance, and v2 doesn't sort unless you ask. Adding `sort=@relevance` to the v2 call returned `NCT01401036`, `NCT04838808`, `NCT05392712`, the same top three as the legacy endpoint:

```bash
curl -s "https://clinicaltrials.gov/api/v2/studies?query.term=heart+attack&fields=NCTId&pageSize=3&sort=@relevance"
```

## Should you use the legacy endpoints?

They're a bridge, not a destination. The migration guide says they are "designed to replicate the behavior of classic system endpoints as closely as possible" so clients can move "at their own pace". Their documented limits:

- XML only. `fmt=json` returns HTTP 400: `` Allowed values for parameter `fmt` are `xml` ``.
- When `expr` is set, only the first 10,000 studies can be retrieved.
- `/api/legacy/study-fields` lacks `FlowReasonNumUnits` and `OrgStudyIdDomain`. The guide notes these fields hold no data in any study.
- They report their own version (`APIVrs` 1.2.0 on 2026-10-14), separate from `/api/v2/version`.

If you have XML parsers you can't rewrite yet, point them at `/api/legacy/` today. Then move to v2 JSON, which is where new fields and features go.

## Bulk download

To mirror the whole registry, skip paging. `https://clinicaltrials.gov/api/v2/studies/download?format=json.zip` answered with `content-type: application/zip` and the file name `ctg-studies.json.zip`. Per the migration guide, each JSON file in it has the same schema as `/api/v2/studies/{nctId}`. The registry held 606,964 studies on 2026-10-14, so expect a large download.

## Related guides for this API

- [ClinicalTrials.gov API v2 query parameters](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/): everything that replaced `expr`, with tested examples.
- [Look up a study by NCT number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/): the v2 replacement for single-study XML.
- [Get completed trial results](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/): reading `resultsSection`.
- [Export search results to CSV in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/): v2's CSV mode and its header-based paging.

## Do it without code

The free [ClinicalTrials.gov search tool](https://datatooly.xyz/clinical-trials-search/) already runs on API v2. Use it to check that a migrated query returns what you expect, live in your browser.

## At scale

If you'd rather not maintain an API client at all, the [Clinical Trials & FDA Pipeline actor](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) on Apify uses API v2 with `nextPageToken` paging, and adds FDA approvals, device clearances, adverse events, recalls and shortages. It exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The migration steps above don't depend on either.*

Sources: [ClinicalTrials.gov API Migration Guide](https://clinicaltrials.gov/data-api/about-api/api-migration), [NLM Technical Bulletin, June 25, 2024](https://www.nlm.nih.gov/pubs/techbull/mj24/mj24_Modern_Clinical_Trials_Website.html), [NLM news: classic website to retire](https://www.nlm.nih.gov/news/Modernized_ClinicalTrials.html), [ClinicalTrials.gov API, interactive OpenAPI docs](https://clinicaltrials.gov/data-api/api), and live responses on 2026-10-14.

## Quick answers

### What is the ClinicalTrials.gov API v2?

It is the current REST API of ClinicalTrials.gov, at `https://clinicaltrials.gov/api/v2/`. It returns JSON or CSV, needs no key, and replaced the classic API, which NLM retired on June 25, 2024. On 2026-10-14, `/api/v2/version` reported `apiVersion` 2.0.5.

### Does the old clinicaltrials.gov/api/query/full_studies endpoint still work?

No. On 2026-10-14, `https://clinicaltrials.gov/api/query/full_studies` and `/api/query/study_fields` returned HTTP 404, and `classic.clinicaltrials.gov` redirected to them. Use `/api/v2/studies`, or `/api/legacy/full-studies` and `/api/legacy/study-fields`, which keep the classic parameters but return XML only.

### How do I replace the expr parameter from the classic ClinicalTrials.gov API?

Put the classic `expr` search expression into `query.term` on `/api/v2/studies`, as NLM's migration guide says. Add `sort=@relevance` to get the classic ranking order. In a test on 2026-10-14, `expr=heart attack` and `query.term=heart attack` both matched 13,807 studies and returned the same top three NCT IDs.

## Related guides

- [ClinicalTrials.gov API v2 in Python: query.cond, Phase, CSV](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
- [ClinicalTrials.gov API v2 Query Parameters: Full Reference](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/)
- [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
