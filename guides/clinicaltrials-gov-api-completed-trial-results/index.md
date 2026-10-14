# Get Completed Clinical Trial Results with the API

> Find completed trials with posted results on ClinicalTrials.gov and read outcomes, p-values and adverse events from the v2 API resultsSection. Python included.

- URL: https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search ClinicalTrials.gov live — by condition, drug, or phase](https://datatooly.xyz/clinical-trials-search/)
- Tags: api, python, healthcare, datascience

To find results of completed clinical trials, search ClinicalTrials.gov for completed studies that have posted results. With the free v2 API that's `https://clinicaltrials.gov/api/v2/studies?aggFilters=results:with,status:com`. Then fetch a study with `fields=ResultsSection` to get its outcome measures, statistical analyses, participant flow and adverse events as JSON. No API key is needed.

This guide shows how to find those trials, what the results JSON looks like, and how to read it in Python. Everything was run against the live API on 2026-10-14.

## How many trials have posted results

Counts from the API on 2026-10-14:

| Query | Studies |
|---|---|
| All registered studies | 606,964 |
| Studies with posted results (`AREA[HasResults]true`) | 80,504 |
| Completed studies (`filter.overallStatus=COMPLETED`) | 331,828 |
| Completed and with posted results (`aggFilters=results:with,status:com`) | 67,158 |
| Results first posted in 2026 (`AREA[ResultsFirstPostDate]RANGE[2026-01-01,MAX]`) | 4,757 |

So about one in five completed studies has summary results on ClinicalTrials.gov. A trial without posted results may still have published them in a journal. See the section on publications below.

## Step 1: find completed trials with results

Two filters give the same set. Both returned 67,158 studies:

```
aggFilters=results:with,status:com
filter.overallStatus=COMPLETED&filter.advanced=AREA[HasResults]true
```

Results are often posted while a study is still `ACTIVE_NOT_RECRUITING`, for example after the primary completion date while long-term follow-up continues. To include those, drop the status filter and keep `AREA[HasResults]true`.

To get the newest results first, sort by `ResultsFirstPostDate:desc`. That field is "the date on which summary results information was first available on ClinicalTrials.gov after National Library of Medicine (NLM) quality control (QC) review has concluded", according to the API's field definitions.

## Step 2: what the results JSON contains

`resultsSection` is present only when `hasResults` is `true`. It has five modules:

| Module | What's in it |
|---|---|
| `participantFlowModule` | Arms (`groups`) and `periods`: how many started, completed, and dropped out, and why |
| `baselineCharacteristicsModule` | Baseline measures per arm, such as age, sex and race, with `denoms` (participants analyzed) |
| `outcomeMeasuresModule` | `outcomeMeasures`: each has `type` (`PRIMARY`, `SECONDARY`, ...), `title`, `unitOfMeasure`, `paramType`, `timeFrame`, `groups`, `classes` (the values) and `analyses` (the statistics) |
| `adverseEventsModule` | `eventGroups` with serious and other adverse event counts per arm, plus `seriousEvents` and `otherEvents` broken down by term |
| `moreInfoModule` | Point of contact and any restriction on the investigators publishing (`certainAgreement`) |

An outcome value sits at `classes[].categories[].measurements[]`, keyed by `groupId` (for example `OG000`). Map it back to the arm name through the outcome's own `groups` list. The IDs are local to each outcome, not shared across the record.

## Step 3: read it in Python

```python
import requests

BASE = "https://clinicaltrials.gov/api/v2/studies"

# 1. Find completed trials that have posted results, newest results first.
r = requests.get(BASE, params={
    "query.intr": "semaglutide",
    "aggFilters": "results:with,status:com",   # = has results + completed
    "sort": "ResultsFirstPostDate:desc",
    "fields": "NCTId,BriefTitle,ResultsFirstPostDate",
    "countTotal": "true",
    "pageSize": 5,
}, timeout=60)
r.raise_for_status()
data = r.json()
print("completed semaglutide trials with results:", data["totalCount"])
for st in data["studies"]:
    p = st["protocolSection"]
    print(" ", p["identificationModule"]["nctId"],
          p["statusModule"]["resultsFirstPostDateStruct"]["date"],
          p["identificationModule"]["briefTitle"][:70])

# 2. Pull the results section of one of them.
nct = "NCT06045221"  # pinned so the output below is reproducible
study = requests.get(f"{BASE}/{nct}", params={"fields": "NCTId,ResultsSection"}, timeout=60).json()
res = study["resultsSection"]
print("\n", nct, "result modules:", list(res))

# 3. Primary outcomes: one value per arm, plus the statistical analysis.
for om in res["outcomeMeasuresModule"]["outcomeMeasures"]:
    if om["type"] != "PRIMARY":
        continue
    print("\nPRIMARY:", om["title"])
    print("  unit:", om.get("unitOfMeasure"), "| param:", om.get("paramType"), "| time frame:", om.get("timeFrame"))
    arms = {g["id"]: g["title"] for g in om["groups"]}
    for cls in om.get("classes", []):
        for cat in cls["categories"]:
            for m in cat["measurements"]:
                print(f"  {arms[m['groupId']]}: {m['value']} (spread {m.get('spread')})")
    for a in om.get("analyses", []):
        print("  p-value:", a.get("pValue"), "|", a.get("statisticalMethod"),
              "|", a.get("paramType"), a.get("paramValue"),
              f"[{a.get('ciLowerLimit')}, {a.get('ciUpperLimit')}]")

# 4. Serious adverse events per arm.
for g in res["adverseEventsModule"]["eventGroups"]:
    print(f"\nSAE {g['title']}: {g.get('seriousNumAffected')}/{g.get('seriousNumAtRisk')} participants")
```

Output on 2026-10-14:

```text
completed semaglutide trials with results: 104
  NCT06771115 2026-09-29 Phase 2a Placebo-Controlled Study of VTX3232 Alone or in Combination W
  NCT06045221 2026-09-15 A Study of Orforglipron (LY3502970) Compared With Semaglutide in Parti
  NCT06401746 2026-08-31 Body Surface Gastric Mapping in Patients on Semaglutide
  NCT04596631 2026-08-21 A Research Study to Compare a New Medicine Oral Semaglutide to a Dummy
  NCT05132088 2026-08-14 Research Study to Investigate How Well Semaglutide Tablets Taken Once 

 NCT06045221 result modules: ['participantFlowModule', 'baselineCharacteristicsModule', 'outcomeMeasuresModule', 'adverseEventsModule', 'moreInfoModule']

PRIMARY: Change From Baseline in Hemoglobin A1c (HbA1c) [Non-inferiority of 36 mg Orforglipron Versus 14 mg Semaglutide and 12 mg Orforglipron Versus 7 mg Semaglutide]
  unit: Percentage of HbA1c | param: LEAST_SQUARES_MEAN | time frame: Baseline, Week 52
  12 mg Orforglipron: -1.91 (spread 0.058)
  36 mg Orforglipron: -2.16 (spread 0.051)
  7 mg Semaglutide: -1.11 (spread 0.063)
  14 mg Semaglutide: -1.45 (spread 0.061)
  p-value: <.001 | Mixed Models Analysis | Least Squares Mean difference -0.71 [-0.86, -0.55]
  p-value: <.001 | Mixed Models Analysis | Least Squares Mean difference -0.79 [-0.96, -0.62]

SAE 12 mg Orforglipron: 21/424 participants

SAE 36 mg Orforglipron: 40/423 participants

SAE 7 mg Semaglutide: 19/426 participants

SAE 14 mg Semaglutide: 24/425 participants
```

That is the ACHIEVE-3 trial: Lilly's oral orforglipron against oral semaglutide in type 2 diabetes.

## Things to watch in results data

- **Values are strings.** `value`, `spread`, `pValue` and the confidence limits all come back as text, and `pValue` can be `"<.001"`. Parse them yourself and keep the original string.
- **Read `paramType` and `dispersionType`.** A value can be a least-squares mean, a median or a count of participants. `spread` can be a standard error, a standard deviation or an interquartile range. The type tells you which.
- **Not every primary outcome has an analysis.** In the first trial listed above (NCT06771115), the primary outcome was a count of participants with adverse events and had no `analyses` entry.
- **Large records.** A full record with results can be well over 100 KB. Ask for `fields=NCTId,ResultsSection`, or narrower pieces such as `OutcomeMeasuresModule`, when you don't need the protocol.
- **There is no separate results endpoint.** Results are part of the study record from `/api/v2/studies/{nctId}`. The website shows them on the study page's Results tab (`https://clinicaltrials.gov/study/NCT06045221?tab=results`).

## When a trial has no posted results: look for publications

Many completed trials report only in a journal. Each record's `protocolSection.referencesModule.references` lists publications with a PubMed ID (`pmid`) and a `type`: `BACKGROUND`, `RESULT` or `DERIVED`. `RESULT` marks a publication the record identifies as reporting the study's results. `DERIVED` references are publications ClinicalTrials.gov links to the study by its NCT number. ACHIEVE-3's Lancet paper, for example, is attached as `DERIVED` (PMID 41765029).

On 2026-10-14, 83,614 completed studies had no posted results but did have a `RESULT` or `DERIVED` reference:

```
filter.overallStatus=COMPLETED&filter.advanced=AREA[HasResults]false AND AREA[ReferenceType](RESULT OR DERIVED)
```

## Related guides for this API

- [Look up a study by NCT number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/): the `/studies/{nctId}` endpoint and its errors.
- [ClinicalTrials.gov API v2 query parameters](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/): every filter used above, and more.
- [Classic API to v2 migration](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/), if older code read results from the classic XML.
- [Export search results to CSV in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/). The CSV has a `Study Results` column (YES/NO).

## Do it without code

Use the free [ClinicalTrials.gov search tool](https://datatooly.xyz/clinical-trials-search/) to find trials by condition, drug, phase and status, live in your browser, and get their NCT numbers before you pull results.

## At scale

To track a sponsor's or an indication's trials over time, use the [Clinical Trials & FDA Pipeline actor](https://apify.com/constructive_calm/clinical-trials-fda-scraper?fpr=v77kxu) on Apify. It returns `hasResults` and the completion dates for each trial. Its `monitor` mode re-checks the trials you list and emits a `trial_results_posted` change when results appear. The actor doesn't parse the outcome tables themselves; use the script above for that. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The API and the script above work without either.*

Sources: [ClinicalTrials.gov API, interactive OpenAPI docs](https://clinicaltrials.gov/data-api/api), [Study Data Structure](https://clinicaltrials.gov/data-api/about-api/study-data-structure), and live API responses on 2026-10-14.

## Quick answers

### Where can I search for results of completed clinical trials?

On ClinicalTrials.gov. On the website, use the Study Results filter set to "With results" with status Completed. With the API, call `https://clinicaltrials.gov/api/v2/studies?aggFilters=results:with,status:com`. On 2026-10-14 that matched 67,158 completed studies with posted results, out of 331,828 completed studies. The results themselves are in each record's `resultsSection`.

### How do I get clinicaltrials.gov results data from the API?

Request one study with `fields=ResultsSection`, for example `https://clinicaltrials.gov/api/v2/studies/NCT06045221?fields=NCTId,ResultsSection`. The section has five modules: `participantFlowModule`, `baselineCharacteristicsModule`, `outcomeMeasuresModule`, `adverseEventsModule` and `moreInfoModule`. It's present only when `hasResults` is `true`.

### Is there a clinical trial results database?

ClinicalTrials.gov is the main public one for trials registered there: on 2026-10-14, 80,504 of its 606,964 studies had summary results posted. Many other trials report results only in journals. For those, check the record's `referencesModule` for publications of type `RESULT` or `DERIVED`, which carry PubMed IDs.

## Related guides

- [ClinicalTrials.gov API v2 in Python: query.cond, Phase, CSV](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
- [ClinicalTrials.gov API v2 Query Parameters: Full Reference](https://datatooly.xyz/guides/clinicaltrials-gov-api-v2-query-parameters/)
- [ClinicalTrials.gov Classic API to v2: Migration Guide](https://datatooly.xyz/guides/clinicaltrials-gov-classic-api-v2-migration/)
- [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)
- [SEC Company Facts API: companyfacts, concept & frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/)
