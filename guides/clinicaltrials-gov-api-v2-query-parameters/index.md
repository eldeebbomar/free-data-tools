# ClinicalTrials.gov API v2 Query Parameters: Full Reference

> Every ClinicalTrials.gov API v2 /studies parameter: query.cond, query.term, filter.advanced AREA[] syntax, filter.geo, aggFilters, sort, fields, paging. Tested.

- URL: https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search ClinicalTrials.gov live — by condition, drug, or phase](https://datatooly.xyz/clinical-trials-search/)
- Tags: api, python, healthcare, datascience

The ClinicalTrials.gov API v2 has one search endpoint, `https://clinicaltrials.gov/api/v2/studies`. You search with `query.*` parameters (`query.cond`, `query.term`, `query.intr`, `query.spons`), narrow with `filter.*` and `aggFilters`, choose output with `fields` and `format`, and page with `pageSize` and `pageToken`. There is no API key. There is also no `filter.phase`; use `filter.advanced=AREA[Phase]PHASE3`.

This is a complete reference for the `/studies` endpoint, built from the [official OpenAPI spec](https://clinicaltrials.gov/data-api/api) (API version 2.0.5) and checked against the live API on 2026-10-14. Every count below comes from that day's data, so your numbers will drift as the registry grows.

## Query parameters: what to search

`query.*` parameters search text and affect relevance ranking. Each one targets a "search area", a group of fields defined by the API (the full list is at `/api/v2/studies/search-areas`).

| Parameter | Search area | Searches in (examples) | Example | Matches on 2026-10-14 |
|---|---|---|---|---|
| `query.cond` | ConditionSearch | Condition, titles, condition MeSH terms, keywords, NCT ID (7 fields) | `query.cond=lung cancer` | 14,620 |
| `query.term` | BasicSearch | 57 fields, incl. NCT ID, acronym, titles, conditions, interventions, summary ("Other terms" on the website) | `query.term=GLP-1` | 4,273 |
| `query.intr` | InterventionSearch | Intervention name, type, other names, arm groups, MeSH terms (12 fields) | `query.intr=pembrolizumab` | 2,977 |
| `query.titles` | TitleSearch | Acronym, brief title, official title | `query.titles=TRAILBLAZER` | 12 |
| `query.outc` | OutcomeSearch | Primary, secondary and other outcome measures and descriptions (9 fields) | `query.outc=HbA1c` | 12,125 |
| `query.spons` | SponsorSearch | Lead sponsor, collaborators, organization name | `query.spons=Pfizer` | 6,091 |
| `query.lead` | `LeadSponsorName` field only | Lead sponsor only | `query.lead=Pfizer` | 3,884 |
| `query.locn` | LocationSearch | Location city, state, country, facility, ZIP | `query.locn=Boston` | 21,515 |
| `query.id` | IdSearch | NCT ID, NCT ID aliases, acronym, org study ID, secondary IDs | `query.id=NCT04437511` | 1 |
| `query.patient` | PatientSearch | 47 fields, a patient-oriented mix of conditions, titles, summary and interventions | | |

`query.spons` vs `query.lead`: Pfizer appears as lead sponsor or collaborator on 6,091 studies, and as lead sponsor on 3,884.

Every `query.*` value uses Essie expression syntax, so `"exact phrase"`, `AND`, `OR`, `NOT` and parentheses all work. For example `query.term="continuous glucose monitor"` matched 234 type 2 diabetes studies.

## Filter parameters: what to keep

Filters narrow the result set without changing ranking.

| Parameter | Format | Example |
|---|---|---|
| `filter.overallStatus` | Comma- or pipe-separated statuses | `RECRUITING\|NOT_YET_RECRUITING` |
| `filter.ids` | Comma- or pipe-separated NCT IDs | `NCT04437511,NCT04368728` |
| `filter.geo` | `distance(lat,lon,radius)` with `mi` or `km` | `distance(42.3601,-71.0589,50mi)` |
| `filter.advanced` | An Essie expression, usually `AREA[Field]value` | `AREA[Phase]PHASE3` |
| `filter.synonyms` | `area:synonym_id` pairs | `ConditionSearch:1651367` |
| `aggFilters` | `filter_id:option` pairs, the website's sidebar filters | `results:with,status:com` |
| `postFilter.*` | Same as the `filter.*` versions | `postFilter.overallStatus=RECRUITING` |

The spec says `filter.*` and `postFilter.*` "have same effect", and both exist "just to simplify applying parameters from search request".

Valid `filter.overallStatus` values (from the spec): `ACTIVE_NOT_RECRUITING`, `COMPLETED`, `ENROLLING_BY_INVITATION`, `NOT_YET_RECRUITING`, `RECRUITING`, `SUSPENDED`, `TERMINATED`, `WITHDRAWN`, `AVAILABLE`, `NO_LONGER_AVAILABLE`, `TEMPORARILY_NOT_AVAILABLE`, `APPROVED_FOR_MARKETING`, `WITHHELD`, `UNKNOWN`. Anything else, such as `OPEN`, returns HTTP 400: `` Invalid value in parameter `overallStatus`: `OPEN` ``.

### filter.advanced and the AREA[] syntax

Most fields have no dedicated filter. You reach them with `filter.advanced`, which takes an Essie expression. `AREA[FieldName]` points the expression at one field. All of these returned HTTP 200 on 2026-10-14, combined with `query.cond=type 2 diabetes` (11,987 studies):

| Goal | `filter.advanced` value | Studies |
|---|---|---|
| Phase 3 | `AREA[Phase]PHASE3` | 1,642 |
| Phase 2 or 3 | `AREA[Phase](PHASE2 OR PHASE3)` | 2,811 |
| Started on or after 2024-01-01 | `AREA[StartDate]RANGE[2024-01-01,MAX]` | 1,903 |
| Enrollment of 1,000 or more | `AREA[EnrollmentCount]RANGE[1000,MAX]` | 1,059 |
| Industry lead sponsor | `AREA[LeadSponsorClass]INDUSTRY` | 4,350 |
| Phase field empty | `AREA[Phase]MISSING` | 2,113 |
| Exclude "not applicable" phase | `NOT AREA[Phase]NA` | 7,497 |
| Completed, no results posted | `AREA[OverallStatus]COMPLETED AND AREA[HasResults]false` | 5,955 |
| A recruiting site in Boston | `SEARCH[Location](AREA[LocationCity]Boston AND AREA[LocationStatus]RECRUITING)` | 26 |

`SEARCH[Location](...)` makes both conditions apply to the same location. Without it, a study with a recruiting site in Chicago and a closed site in Boston would match. Phase values are `NA`, `EARLY_PHASE1`, `PHASE1`, `PHASE2`, `PHASE3` and `PHASE4`.

### aggFilters

`aggFilters` uses the short keys behind the website's filter sidebar. The spec gives `results:with,status:com` and `status:not rec,sex:f,healthy:y` as examples. `phase:3` matched exactly the same 1,642 studies as `AREA[Phase]PHASE3`. Separate several options for one filter with spaces (`status:not rec`) and separate filters with commas.

## Output and paging parameters

| Parameter | What it does | Notes from testing |
|---|---|---|
| `fields` | Which fields to return | JSON uses field names (`NCTId`, `BriefTitle`), piece names or module names. CSV uses column names (`NCT Number`). An unknown name returns HTTP 400. `@query` returns the fields your query matched. |
| `format` | `json` (default) or `csv` | In CSV mode the next-page token comes in the `x-next-page-token` response header. |
| `markupFormat` | `markdown` (default) or `legacy` | JSON only. |
| `sort` | Up to 2 sort keys, `Field:asc` or `Field:desc` | Only date and numeric fields, plus `@relevance`. `sort=BriefTitle` returned HTTP 400: `Unsupported sort field type: text`. Results are unsorted by default. |
| `countTotal` | `true` adds `totalCount` to the first page | CSV puts it in the `x-total-count` header. |
| `pageSize` | Studies per page | Default 10. Values above 1,000 are quietly reduced to 1,000. `0` means the default. |
| `pageToken` | The `nextPageToken` from the previous page | Every other parameter must stay the same, apart from `countTotal`, `pageSize` and `pageToken`. |
| `geoDecay` | How distance from `filter.geo` affects ranking | Ignored without `filter.geo`. |

## curl: one request with several parameters

```bash
curl -s "https://clinicaltrials.gov/api/v2/studies?query.cond=type+2+diabetes&filter.advanced=AREA%5BPhase%5DPHASE3&filter.overallStatus=RECRUITING&countTotal=true&pageSize=2&fields=NCTId,BriefTitle"
```

Result (trimmed titles):

```json
{"totalCount":74,"studies":[
{"protocolSection":{"identificationModule":{"nctId":"NCT07797335","briefTitle":"AMBITION 7: A Research Study Investigating How Well Zenagamtide Lowers Blood Sugar ..."}}},
{"protocolSection":{"identificationModule":{"nctId":"NCT07613307","briefTitle":"A Study of Orforglipron (LY3502970) in Participants With Type 2 Diabetes Who Observe Ramadan Fasting"}}}
],"nextPageToken":"ZVNj7o2Elu8o3lpzC8-7qrbumpOQJJxuZPKj2PAW"}
```

URL-encode the brackets in `AREA[...]` (`%5B`, `%5D`) when you build URLs by hand. `requests` and `curl --data-urlencode` do it for you.

## Python: counting and paging

```python
import time
import requests

BASE = "https://clinicaltrials.gov/api/v2/studies"
session = requests.Session()

def count(**params):
    """Total matching studies for a query (countTotal=true, one tiny page)."""
    p = {**params, "countTotal": "true", "pageSize": 1, "fields": "NCTId"}
    r = session.get(BASE, params=p, timeout=60)
    r.raise_for_status()  # a 400 means a bad parameter name or value
    return r.json()["totalCount"]

def search(params, fields, page_size=1000, max_pages=50):
    """Yield every matching study, following nextPageToken."""
    p = {**params, "fields": ",".join(fields), "pageSize": page_size}
    for _ in range(max_pages):
        r = session.get(BASE, params=p, timeout=60)
        r.raise_for_status()
        data = r.json()
        yield from data.get("studies", [])  # a page may be empty
        token = data.get("nextPageToken")
        if not token:
            return
        p["pageToken"] = token  # every other parameter must stay the same
        time.sleep(0.5)

q = {"query.cond": "type 2 diabetes"}
print("all T2D studies:          ", count(**q))
print("+ Phase 3:                ", count(**q, **{"filter.advanced": "AREA[Phase]PHASE3"}))
print("+ recruiting:             ", count(**q, **{"filter.overallStatus": "RECRUITING"}))
print("+ within 50 mi of Boston: ", count(**q, **{"filter.geo": "distance(42.3601,-71.0589,50mi)"}))
print("+ semaglutide:            ", count(**q, **{"query.intr": "semaglutide"}))

rows = list(search(
    {**q, "query.intr": "semaglutide", "filter.overallStatus": "RECRUITING", "sort": "LastUpdatePostDate:desc"},
    ["NCTId", "BriefTitle", "Phase", "LeadSponsorName", "LastUpdatePostDate"],
))
print(len(rows), "recruiting semaglutide T2D trials; newest update:")
for st in rows[:3]:
    p = st["protocolSection"]
    print(p["identificationModule"]["nctId"], p["statusModule"]["lastUpdatePostDateStruct"]["date"],
          p.get("designModule", {}).get("phases"), p["sponsorCollaboratorsModule"]["leadSponsor"]["name"])
```

Output on 2026-10-14:

```text
all T2D studies:           11987
+ Phase 3:                 1642
+ recruiting:              869
+ within 50 mi of Boston:  586
+ semaglutide:             331
50 recruiting semaglutide T2D trials; newest update:
NCT07743983 2026-10-13 ['PHASE3'] BrightGene Bio-Medical Technology Co., Ltd.
NCT06897475 2026-10-09 ['PHASE2'] Eli Lilly and Company
NCT07668388 2026-10-07 ['PHASE2'] Novo Nordisk A/S
```

## Mistakes the API rejects (and ones it doesn't)

| Request | What happens |
|---|---|
| `filter.phase=PHASE3` | HTTP 400, `` `filter.phase` is unknown parameter `` |
| `filter.overallStatus=OPEN` | HTTP 400, invalid value |
| `fields=NCTId,Bogus` | HTTP 400, `Parameter 'fields' contains invalid field name: 'Bogus'` |
| `sort=BriefTitle` | HTTP 400, text fields can't be sorted |
| `pageSize=5000` | HTTP 200 with 1,000 studies, no warning |
| `query.term=NCT04437511 NCT04368728` plus filters | HTTP 200, and the filters are ignored (documented: a query of only NCT IDs switches filters off) |

A 400 is a bug in your query, so don't retry it. Retry only on 429 and 5xx, with backoff. NLM doesn't publish a fixed request quota for this API.

## Related guides for this API

- [Look up a study by NCT number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/) with `/studies/{nctId}`.
- [Get completed trial results](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/) with `aggFilters=results:with,status:com`.
- [Classic API to v2 migration](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/): how `expr`, `min_rnk` and `fmt` map to v2.
- [Export search results to CSV in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/), including the header-based CSV paging.

## Do it without code

The free [ClinicalTrials.gov search tool](https://datatooly.xyz/clinical-trials-search/) builds these queries for you and runs them live in your browser. Pick a condition, a drug, a phase and a status, and you get real studies back.

## At scale

For scheduled pulls across many conditions or sponsors, with FDA approvals, device clearances, adverse events, recalls and shortages joined on, use the [Clinical Trials & FDA Pipeline actor](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) on Apify. Its `trials` mode takes conditions, interventions, phases, statuses, countries and a date range, and pages through `nextPageToken` for you. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The API works the same without them.*

Sources: [ClinicalTrials.gov API, interactive OpenAPI docs](https://clinicaltrials.gov/data-api/api), [Search Areas](https://clinicaltrials.gov/data-api/about-api/search-areas), [Study Data Structure](https://clinicaltrials.gov/data-api/about-api/study-data-structure), and live API responses on 2026-10-14.

## Quick answers

### Where is the ClinicalTrials.gov API documentation?

The official reference is the interactive OpenAPI page at `https://clinicaltrials.gov/data-api/api`, and the raw OpenAPI 3.0 spec is served at `https://clinicaltrials.gov/api/oas/v2`. Field names are on the Study Data Structure page and search areas on the Search Areas page, both under clinicaltrials.gov/data-api/about-api.

### How do I use clinicaltrials.gov/api/v2/studies?query.cond?

`query.cond` searches the Conditions or disease area: `https://clinicaltrials.gov/api/v2/studies?query.cond=type%202%20diabetes`. On 2026-10-14 that matched 11,987 studies. Narrow it with `filter.overallStatus=RECRUITING`, `filter.advanced=AREA[Phase]PHASE3` or `query.intr=semaglutide`, and add `countTotal=true` to get `totalCount`.

### Is there a filter.phase parameter in clinicaltrials.gov/api/v2/studies?

No. `filter.phase=PHASE3` returns HTTP 400 with the body: filter.phase is unknown parameter. Filter phase with `filter.advanced=AREA[Phase]PHASE3`, `AREA[Phase](PHASE2 OR PHASE3)` for several phases, or `aggFilters=phase:3`. Both forms returned the same 1,642 Phase 3 type 2 diabetes studies on 2026-10-14.

### Is there a free clinical trials API?

Yes. The ClinicalTrials.gov v2 REST API from the U.S. National Library of Medicine is free, needs no API key or signup, and returns JSON or CSV. On 2026-10-14 it reported 606,964 registered studies (`/api/v2/stats/size`).

## Related guides

- [ClinicalTrials.gov API v2 in Python: query.cond, Phase, CSV](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
- [ClinicalTrials.gov Classic API to v2: Migration Guide](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/)
- [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
