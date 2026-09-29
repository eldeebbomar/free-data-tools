# How to Build an H-1B Salary Database by Employer (with Python)

> A practical guide to querying H-1B salary data by employer and role, using the authoritative DOL OFLC LCA disclosure files with runnable Python.

- URL: https://datatooly.xyz/guides/h1b-salary-database-by-employer/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-30
- Updated: 2026-06-30
- Free tool: [What does a role pay? H-1B/PERM salary benchmarks](https://datatooly.xyz/salary-benchmark-lookup/)
- Tags: datascience, api, python, career

If you've searched for an **H-1B salary database by employer** and hoped to find a clean JSON API you could just hit, you've probably been disappointed. There isn't one — at least not from the government. But the underlying data is fully public, authoritative, and very queryable once you know where it actually lives. This post shows you the real source, what's in it, and how to query H-1B salary data by employer and role programmatically with Python.

## Where the data actually comes from

Every site you've seen with H-1B salaries — h1bdata.info, h1bgrader, and the rest — is re-publishing the same upstream source: the **LCA (Labor Condition Application) disclosure data** released by the U.S. Department of Labor's Office of Foreign Labor Certification (OFLC).

Here's how it works. Before an employer can file an H-1B petition, it must submit a Labor Condition Application to the DOL attesting to the wage it will pay. By law, OFLC publishes these applications as **public disclosure data**. The files cover the H-1B, H-1B1, and E-3 programs and are released **quarterly** on the OFLC performance-data page:

> https://www.dol.gov/agencies/eta/foreign-labor/performance

A few things worth being precise about, because most blog posts get them fuzzy:

- **It's bulk download, not a live API.** OFLC posts Excel (`.xlsx`) files — one per quarter since FY2020, and one per year for older years going back to 2008. There is no real-time query endpoint. You download the file and parse it yourself.
- **Each row is one application, not one approval.** The `CASE_STATUS` column tells you whether it was Certified, Denied, Withdrawn, etc. If you want "real" offers, filter to `Certified`.
- **The wage is a disclosed offered wage, not actual paid salary.** It's the wage the employer attested to on the application. That's still the single best public benchmark for "what does Company X pay for Role Y," but it's not the same as a verified paystub.

Each file has 75+ columns. The ones you almost always care about:

| Column | Meaning |
|---|---|
| `CASE_STATUS` | Certified / Denied / Withdrawn |
| `EMPLOYER_NAME` | The sponsoring employer |
| `JOB_TITLE` | Employer-supplied job title |
| `SOC_TITLE` | Standardized occupation (e.g. "Software Developers") |
| `WAGE_RATE_OF_PAY_FROM` / `..._TO` | Offered wage range |
| `WAGE_UNIT_OF_PAY` | Year / Hour / Month |
| `WORKSITE_CITY` / `WORKSITE_STATE` | Where the role sits |
| `RECEIVED_DATE` | When it was filed |

Column names have drifted slightly over the years (older files used names like `LCA_CASE_EMPLOYER_NAME`), so always check the record layout PDF that ships alongside each year's file.

## Querying it in Python

Here's a complete, runnable example. Download a quarterly LCA disclosure `.xlsx` from the OFLC page first (they're large — tens to over a hundred MB, hundreds of thousands of rows), then point this at it. It filters to certified cases, normalizes everything to an annual wage, and lets you query by employer and SOC role.

```python
import pandas as pd

# Path to a quarterly LCA disclosure file downloaded from
# https://www.dol.gov/agencies/eta/foreign-labor/performance
FILE = "LCA_Disclosure_Data_FY2026_Q1.xlsx"

# Only read the columns we need — the full file has 75+ and is slow to load whole.
COLS = [
    "CASE_STATUS", "EMPLOYER_NAME", "JOB_TITLE", "SOC_TITLE",
    "WAGE_RATE_OF_PAY_FROM", "WAGE_UNIT_OF_PAY",
    "WORKSITE_CITY", "WORKSITE_STATE",
]

df = pd.read_excel(FILE, usecols=COLS, engine="openpyxl")

# 1. Keep only certified applications.
df = df[df["CASE_STATUS"].str.upper() == "CERTIFIED"].copy()

# 2. Normalize every wage to an annual figure. DOL's WAGE_UNIT_OF_PAY values are
# Year / Month / Bi-Weekly / Week / Hour, but the exact label and casing drift
# across years — so match case-insensitively and cover the common variants
# (otherwise an unmatched unit silently becomes NaN and the row is dropped).
PERIODS = {"YEAR": 1, "MONTH": 12, "BI-WEEKLY": 26,
           "WEEK": 52, "WEEKLY": 52, "HOUR": 2080}  # 2080 = 40h * 52w

df["wage"] = pd.to_numeric(df["WAGE_RATE_OF_PAY_FROM"], errors="coerce")
unit = df["WAGE_UNIT_OF_PAY"].astype(str).str.strip().str.upper()
df["annual_wage"] = df["wage"] * unit.map(PERIODS)
df = df.dropna(subset=["annual_wage"])

def query(employer=None, role=None, state=None):
    out = df
    if employer:
        out = out[out["EMPLOYER_NAME"].str.contains(employer, case=False, na=False)]
    if role:
        out = out[out["SOC_TITLE"].str.contains(role, case=False, na=False)]
    if state:
        out = out[out["WORKSITE_STATE"].str.upper() == state.upper()]
    return out

# Example: software roles at Stripe in California
res = query(employer="Stripe", role="Software", state="CA")

print(f"{len(res)} matching certified applications")
print(res["annual_wage"].describe()[["count", "mean", "min", "max"]].round(0))
print("Median:", round(res["annual_wage"].median()))
```

A few practical notes:

- `pandas.read_excel` with `usecols` is dramatically faster than loading all 75 columns. For repeated queries, convert the file to Parquet once (`df.to_parquet(...)`) and read that instead — it's an order of magnitude quicker.
- Always normalize `WAGE_UNIT_OF_PAY`. A surprising share of records are filed hourly, and if you don't convert them you'll get a "median salary" of $85 that quietly ruins your analysis.
- The example uses `WAGE_RATE_OF_PAY_FROM` (the floor, and the conservative benchmark). The file also carries `WAGE_RATE_OF_PAY_TO` for the ceiling of the posted range — add it to `COLS` if you want both ends.
- Employer names are not deduplicated. "Amazon.com Services LLC", "Amazon Web Services", and "Amazon Development Center" are separate strings. Substring matching (as above) is the pragmatic fix; for serious work you'll want a normalization pass.

## Scaling it: many quarters, many years

One quarter is a snapshot. To build a real **H-1B salary database by employer** you'll want to concatenate several years of files so you can see trends and have enough rows per employer/role to compute a stable median:

```python
import glob

frames = []
for f in glob.glob("LCA_Disclosure_Data_FY20*.xlsx"):
    # usecols errors if any name is missing, and column names drift across years —
    # so read the header row first and request only the columns that exist in this file.
    avail = pd.read_excel(f, nrows=0, engine="openpyxl").columns
    frames.append(pd.read_excel(f, usecols=[c for c in COLS if c in avail], engine="openpyxl"))
full = pd.concat(frames, ignore_index=True)
```

That's also where the work starts to add up: downloading every quarterly file, handling the column-name drift between years, deduplicating employers, and keeping it refreshed each quarter when OFLC posts new data. None of it is hard — it's just plumbing — but it's the part that turns "I found a CSV" into "I have a queryable benchmark."

## A shortcut if you'd rather skip the plumbing

If you just want to sketch the query you'd run — employer + role + state — before committing to the full ETL, I put together a small free **query-builder** that lets you compose the lookup and preview the shape of the result: [datatooly.xyz/salary-benchmark-lookup](https://datatooly.xyz/salary-benchmark-lookup/). It builds the query for you; it does not run the dataset live in your browser (these files are far too large for that).

And if you want the parsed, normalized, deduplicated data delivered as structured JSON without maintaining the pipeline yourself, I built an Apify actor for exactly this — **[SalaryBench IQ](https://apify.com/constructive_calm/salarybench-iq?fpr=v77kxu)** — which queries the DOL LCA disclosure data by employer/role/state and returns clean records. It's free to start, then pay-as-you-go.

*Disclosure: I built both of those tools, so treat that section as me telling you about my own work — the DOL-source facts and the code above stand entirely on their own.*

## The honest takeaway

There is no official H-1B salary JSON API. But the data behind every H-1B salary site is one well-documented, free, public source: the DOL OFLC LCA disclosure files. Download a quarter, filter to `Certified`, normalize the wage unit, and you have a defensible salary benchmark by employer and role in about 30 lines of Python. Everything past that — multi-year history, employer normalization, quarterly refresh — is just engineering you can do yourself or offload.

## Related guides

- [PERM Disclosure Data in Python: Find Green Card Sponsors by City](https://datatooly.xyz/guides/perm-disclosure-data-python-green-card-sponsors/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
