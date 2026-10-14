# ClinicalTrials.gov API: Look Up a Study by NCT Number

> Fetch one trial by NCT number with the ClinicalTrials.gov v2 API: the /studies/{nctId} endpoint, NCT format, fields, 404 vs 400, aliases and batch lookups.

- URL: https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search ClinicalTrials.gov live — by condition, drug, or phase](https://datatooly.xyz/clinical-trials-search/)
- Tags: api, python, healthcare, datascience

To look up a clinical trial by NCT number, call `https://clinicaltrials.gov/api/v2/studies/{nctId}`, for example `/api/v2/studies/NCT04437511`. It returns the full record as JSON, with no API key and no signup. Add `fields=` to return only what you need. An unknown NCT number returns HTTP 404, and a malformed one returns HTTP 400.

This page covers the single-study endpoint of the ClinicalTrials.gov v2 API: the NCT number format, the response, the errors, aliases, and how to fetch many trials at once. Everything below was run against the live API on 2026-10-14 (API version 2.0.5).

## The NCT number format

An NCT number is the ClinicalTrials.gov Identifier. The API's own field definition (from `/api/v2/studies/metadata`) says: *"The format is "NCT" followed by an 8-digit number."* For example, `NCT04437511` is Eli Lilly's TRAILBLAZER-ALZ 2 donanemab trial.

What the endpoint accepts, as tested:

| Input | Result |
|---|---|
| `NCT04437511` | HTTP 200, the study |
| `nct04437511` (lowercase) | HTTP 200, the same study |
| `NCT4437511` (leading zero dropped) | HTTP 200, `nctId` comes back as `NCT04437511` |
| `NCT99999999` (well-formed, doesn't exist) | HTTP 404, text body `NCT number NCT99999999 not found` |
| `04437511` (no `NCT` prefix) | HTTP 400, text body `` Parameter `nctId` has incorrect format `` |
| `NCT00009113` (an old alias) | HTTP 301 redirect to `NCT00010647` |

Error bodies are `text/plain`, not JSON, so check the status code before you call `.json()`.

## The endpoint

```
GET https://clinicaltrials.gov/api/v2/studies/{nctId}
```

| Parameter | Values | Notes |
|---|---|---|
| `format` | `json` (default), `csv`, `json.zip`, `fhir.json`, `ris` | `fhir.json` ignores `fields`. `ris` is a citation record. |
| `fields` | Field, piece or module names, comma- or pipe-separated | JSON uses names like `NCTId`, `BriefTitle`, `ConditionsModule`. CSV uses column names like `NCT Number`. |
| `markupFormat` | `markdown` (default), `legacy` | Applies to JSON only. |

These are the parameters listed for `/studies/{nctId}` in the [official OpenAPI spec](https://clinicaltrials.gov/data-api/api).

### What the JSON contains

The full record for NCT04437511 has five top-level keys: `protocolSection`, `resultsSection`, `documentSection`, `derivedSection` and `hasResults`. The spec also defines an `annotationSection`, which appears only on some studies.

| Section | What's in it |
|---|---|
| `protocolSection` | Registration data in modules: `identificationModule`, `statusModule`, `sponsorCollaboratorsModule`, `descriptionModule`, `conditionsModule`, `designModule`, `armsInterventionsModule`, `outcomesModule`, `eligibilityModule`, `contactsLocationsModule`, and more. |
| `resultsSection` | Posted results: participant flow, baseline, outcome measures, adverse events. Present only when `hasResults` is `true`. |
| `documentSection` | Uploaded protocol, statistical analysis plan and consent PDFs. |
| `derivedSection` | Fields ClinicalTrials.gov adds, such as MeSH terms for conditions and interventions. |
| `hasResults` | `true` when results are posted. |

A full record can be large (the API's `/api/v2/stats/size` reported an average of 17,304 bytes per study and a 99th percentile of 149,567 bytes), so use `fields` when you only need a few values.

## curl: one study, a few fields

```bash
curl -s "https://clinicaltrials.gov/api/v2/studies/NCT04437511?fields=NCTId,BriefTitle,OverallStatus,Phase,LeadSponsorName,HasResults"
```

Result:

```json
{"protocolSection":{"identificationModule":{"nctId":"NCT04437511","briefTitle":"A Study of Donanemab (LY3002813) in Participants With Early Alzheimer's Disease (TRAILBLAZER-ALZ 2)"},"statusModule":{"overallStatus":"ACTIVE_NOT_RECRUITING"},"sponsorCollaboratorsModule":{"leadSponsor":{"name":"Eli Lilly and Company"}},"designModule":{"phases":["PHASE3"]}},"hasResults":true}
```

Even with `fields`, the response keeps the nested path of each field. `Phase` comes back as `designModule.phases`, a list.

The same lookup as a one-row CSV:

```bash
curl -s "https://clinicaltrials.gov/api/v2/studies/NCT04437511?format=csv&fields=NCT%20Number,Study%20Title,Study%20Status,Phases,Sponsor"
```

```csv
NCT Number,Study Title,Study Status,Sponsor,Phases
NCT04437511,A Study of Donanemab (LY3002813) in Participants With Early Alzheimer's Disease (TRAILBLAZER-ALZ 2),ACTIVE_NOT_RECRUITING,Eli Lilly and Company,PHASE3
```

The columns come back in the API's order, not the order you asked for.

## Python: a lookup that handles every case

```python
import re
import requests

BASE = "https://clinicaltrials.gov/api/v2/studies"

def normalize_nct(raw):
    """'nct4437511', ' NCT04437511 ' -> 'NCT04437511' (NCT + 8 digits)."""
    s = raw.strip().upper().replace(" ", "")
    m = re.fullmatch(r"NCT(\d{1,8})", s)
    if not m:
        raise ValueError(f"not an NCT number: {raw!r}")
    return "NCT" + m.group(1).zfill(8)

def get_study(nct_id, fields=None):
    nct_id = normalize_nct(nct_id)
    params = {"fields": ",".join(fields)} if fields else {}
    r = requests.get(f"{BASE}/{nct_id}", params=params, timeout=30)
    if r.status_code == 404:
        return None  # body is plain text: "NCT number ... not found"
    r.raise_for_status()
    # An old alias NCT ID answers 301 to the current record. The redirect drops
    # the query string, so re-request the canonical ID to keep `fields`.
    if r.history and fields:
        canonical = r.url.rstrip("/").rsplit("/", 1)[-1]
        r = requests.get(f"{BASE}/{canonical}", params=params, timeout=30)
        r.raise_for_status()
    return r.json()

def get_many(nct_ids, fields):
    """Up to 1,000 trials in one call with filter.ids."""
    ids = [normalize_nct(x) for x in nct_ids]
    r = requests.get(BASE, params={
        "filter.ids": ",".join(ids),
        "fields": ",".join(fields),
        "pageSize": 1000,
    }, timeout=60)
    r.raise_for_status()
    return r.json()["studies"]

if __name__ == "__main__":
    FIELDS = ["NCTId", "BriefTitle", "OverallStatus", "Phase", "LeadSponsorName", "HasResults"]
    s = get_study("nct4437511", FIELDS)
    p = s["protocolSection"]
    print(p["identificationModule"]["nctId"], "|", p["identificationModule"]["briefTitle"])
    print(p["statusModule"]["overallStatus"], p["designModule"]["phases"],
          p["sponsorCollaboratorsModule"]["leadSponsor"]["name"], "hasResults:", s["hasResults"])

    print(get_study("NCT99999999"))  # -> None

    alias = get_study("NCT00009113", ["NCTId", "NCTIdAlias", "BriefTitle"])
    print(alias["protocolSection"]["identificationModule"])

    for st in get_many(["NCT04437511", "NCT04368728", "NCT00010647"], ["NCTId", "OverallStatus"]):
        p = st["protocolSection"]
        print(p["identificationModule"]["nctId"], p["statusModule"]["overallStatus"])
```

Output on 2026-10-14:

```text
NCT04437511 | A Study of Donanemab (LY3002813) in Participants With Early Alzheimer's Disease (TRAILBLAZER-ALZ 2)
ACTIVE_NOT_RECRUITING ['PHASE3'] Eli Lilly and Company hasResults: True
None
{'nctId': 'NCT00010647', 'nctIdAliases': ['NCT00009113'], 'briefTitle': 'Cost-Effectiveness of and Long-Term Outcomes Following Acupuncture Treatment for Osteoarthritis of the Knee'}
NCT00010647 COMPLETED
NCT04437511 ACTIVE_NOT_RECRUITING
NCT04368728 COMPLETED
```

## Details that trip people up

- **Aliases redirect and drop your query string.** Some studies were registered twice and merged. The old ID is kept in `nctIdAliases`, and requesting it returns a 301 to the current ID. In the test above, the redirect target had no `?fields=` on it, so following it blindly returns the full record. On 2026-10-14 there were 3,164 studies with at least one alias.
- **Batch lookups don't keep your order.** `filter.ids` returned the three studies in the API's order, not the order I sent. Index the results by `nctId`.
- **NCT IDs in a search query switch filters off.** The `/studies` docs say: "If any query parameter contains only NCT IDs (comma- and/or space-separated), filters are ignored." I sent `query.term=NCT04437511 NCT04368728` with `filter.overallStatus=RECRUITING` and got both studies back, although neither is recruiting. Use `filter.ids` when you want the filters applied.
- **Document PDFs live on a CDN.** `documentSection.largeDocumentModule.largeDocs` lists file names such as `Prot_000.pdf`. For NCT04437511 the file was at `https://cdn.clinicaltrials.gov/large-docs/11/NCT04437511/Prot_000.pdf`, where `11` is the last two digits of the NCT number. That path pattern is what I observed; it isn't documented in the API spec.
- **There is no history endpoint.** The v2 API returns only the current version. Past versions are on the website's History of Changes tab (`https://clinicaltrials.gov/study/NCT04437511?tab=history`). The internal endpoint the site appears to use, `/api/int/studies/{nctId}/history`, returned HTTP 403 to a script.

## Related guides for this API

- [ClinicalTrials.gov API v2 query parameters: the full reference](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/), for searching rather than fetching one ID.
- [Get completed trial results with the ClinicalTrials.gov API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/), which reads the `resultsSection` this page skipped.
- [Migrating from the classic ClinicalTrials.gov API to v2](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/), if your code still calls `/api/query/full_studies`.
- [Export ClinicalTrials.gov search results to CSV in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/).

## Do it without code

The free [ClinicalTrials.gov search tool](https://datatooly.xyz/clinical-trials-search/) calls this same API live from your browser. Search by condition or drug and filter by phase and status. It shows each study's NCT ID, title, status, phase and lead sponsor. No login, no key.

## At scale

To look up hundreds of NCT numbers and join the trials with FDA approvals, device clearances, adverse events and recalls, use the [Clinical Trials & FDA Pipeline actor](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) on Apify. Its `trial_details` mode takes a list of NCT IDs (`nctIds`) and returns one flat row per trial: status, phase, enrollment, primary and secondary endpoints, eligibility criteria, sponsors and locations. It exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. Everything above works with the public API alone.*

Sources: [ClinicalTrials.gov API (interactive OpenAPI docs)](https://clinicaltrials.gov/data-api/api), [Study data structure](https://clinicaltrials.gov/data-api/about-api/study-data-structure), and live responses from `clinicaltrials.gov/api/v2` on 2026-10-14.

## Quick answers

### How do I look up a clinical trial by NCT number?

Call `https://clinicaltrials.gov/api/v2/studies/NCT04437511` (swap in your NCT number). It returns the full study record as JSON, with no API key. Add `fields=NCTId,BriefTitle,OverallStatus` to get only the fields you need. On the website, the same record is at `https://clinicaltrials.gov/study/NCT04437511`.

### What is the clinicaltrials.gov API endpoint for a single study (api/v2/studies/{nctId})?

`GET https://clinicaltrials.gov/api/v2/studies/{nctId}`. It accepts `format` (json, csv, json.zip, fhir.json, ris), `fields` and `markupFormat`. An unknown NCT number returns HTTP 404 with `NCT number ... not found`; a malformed one returns HTTP 400 with the text: Parameter nctId has incorrect format. Checked live on 2026-10-14.

### What is a ClinicalTrials.gov identifier (NCT number)?

It is the unique ID ClinicalTrials.gov gives a study when it is first registered. The API's own field definition says the format is "NCT" followed by an 8-digit number, for example NCT04437511. It is also called the ClinicalTrials.gov Identifier or NCT ID.

### Is there a ClinicalTrials.gov API endpoint for historical versions of a study?

Not in the public v2 API. Its OpenAPI spec (version 2.0.5) lists no history endpoint, and `/api/v2/studies/{nctId}/history` returned HTTP 404 on 2026-10-14. Earlier versions are on the website's History of Changes tab: `https://clinicaltrials.gov/study/NCT04437511?tab=history`.

## Related guides

- [ClinicalTrials.gov API v2 in Python: query.cond, Phase, CSV](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API v2 Query Parameters: Full Reference](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/)
- [ClinicalTrials.gov Classic API to v2: Migration Guide](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/)
- [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
