# PERM Disclosure Data in Python: Find Green Card Sponsors by City

> Use the DOL's free PERM disclosure file to list green card sponsors by city and occupation in Python: where the file lives, key columns, and the traps.

- URL: https://datatooly.xyz/guides/perm-disclosure-data-python-green-card-sponsors/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Find H-1B & green-card visa sponsors + salary data](https://datatooly.xyz/visa-sponsor-finder/)
- Tags: python, datascience, career, immigration

To find green card (PERM) sponsors by city, download the Department of Labor's free PERM disclosure file and filter it in pandas. Keep `CASE_STATUS` values starting with "Certified", match `PRIMARY_WORKSITE_CITY` and `PRIMARY_WORKSITE_STATE`, optionally narrow by `PWD_SOC_CODE`, then count cases per `EMP_BUSINESS_NAME`. The current file is about 156 MB of XLSX. There's no API key and no signup, and the whole analysis is about 40 lines of Python.

Sponsor sites like h1bgrader and visasponsorhub build their lists from these same public files. This guide shows how to query the files yourself: where the file lives now (the link moved in FY2026), which columns matter in the new PERM form, and the data-quality traps that skew a naive count. Every figure below comes from running the code on 2026-09-29.

## The source: OFLC disclosure files

The DOL's Office of Foreign Labor Certification (OFLC) publishes case-level disclosure data for its programs on one page:

```
https://www.dol.gov/agencies/eta/foreign-labor/performance
```

A few points you need to know before you start:

- **It's a bulk file, not an API.** Each program publishes an `.xlsx` per fiscal year. The current year's file is replaced each quarter with a cumulative year-to-date version.
- **The FY2026 files moved.** Older files are linked under `/sites/dolgov/files/ETA/oflc/pdfs/...`. The FY2026 disclosure files are linked from the same page under `https://www.dol.gov/media/`, for example `https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx`. A scraper that only matches the old path pattern will quietly miss the newest data.
- **It's big.** `PERM_Disclosure_Data_FY2026_Q3.xlsx` is 156,267,808 bytes: one sheet, 137 columns, 112,550 cases. Its decision dates run from 2025-10-01 to 2026-06-30, which is fiscal 2026 through Q3.
- **PERM is the first step, not the green card.** A certified PERM case is the DOL's labor certification. The employer still has to file with USCIS afterwards. A certification is solid evidence that an employer sponsors a role. It isn't proof that anyone received a green card.

## The columns that matter

The file has 137 columns. For sponsor discovery you need about ten:

| Column | Meaning |
|---|---|
| `CASE_NUMBER` | Unique case ID |
| `CASE_STATUS` | `Certified`, `Certified - Expired`, `Withdrawn`, `Denied` |
| `DECISION_DATE` | When the DOL decided the case |
| `EMP_BUSINESS_NAME` | Sponsoring employer |
| `PWD_SOC_CODE` / `PWD_SOC_TITLE` | Standard occupation code and title (e.g. `15-1252.00`, Software Developers) |
| `JOB_TITLE` | Employer's own job title |
| `JOB_OPP_WAGE_FROM` / `JOB_OPP_WAGE_TO` | Offered wage range |
| `JOB_OPP_WAGE_PER` | `Year`, `Hour`, `Month`, `Bi-Weekly`, `Week` |
| `PRIMARY_WORKSITE_CITY` / `PRIMARY_WORKSITE_STATE` | Where the job is |

These are the names used by the current PERM form. I confirmed them in the FY2025 Q4 and FY2026 Q3 files. Older files, and the H-1B LCA files, use different column names, so check the Record Layout PDF published next to each file before you reuse code across years.

The file also contains names, phone numbers and emails of employer contacts and attorneys. You don't need any of that to rank employers, so the code below never loads those columns.

## Runnable Python

This needs `requests`, `pandas` and `openpyxl`:

```python
from pathlib import Path
import pandas as pd
import requests

URL = "https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx"
XLSX = Path("PERM_Disclosure_Data_FY2026_Q3.xlsx")
CACHE = Path("perm_fy2026_q3.pkl")

# Employer, job and worksite columns only. The file also contains names, phone
# numbers and emails of contact people and attorneys; don't load what you don't need.
COLS = [
    "CASE_NUMBER", "CASE_STATUS", "DECISION_DATE",
    "EMP_BUSINESS_NAME", "PWD_SOC_CODE", "PWD_SOC_TITLE", "JOB_TITLE",
    "JOB_OPP_WAGE_FROM", "JOB_OPP_WAGE_PER",
    "PRIMARY_WORKSITE_CITY", "PRIMARY_WORKSITE_STATE",
]
ANNUAL = {"Year": 1, "Month": 12, "Bi-Weekly": 26, "Week": 52, "Hour": 2080}

def load():
    if CACHE.exists():
        return pd.read_pickle(CACHE)
    if not XLSX.exists():
        headers = {"User-Agent": "Mozilla/5.0 (compatible; perm-research/1.0)"}
        with requests.get(URL, headers=headers, stream=True, timeout=120) as r:
            r.raise_for_status()
            with open(XLSX, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
    # Slow step (minutes): openpyxl parses the whole 100+ MB workbook once.
    df = pd.read_excel(XLSX, usecols=COLS, dtype={"PWD_SOC_CODE": str}, engine="openpyxl")
    df["CITY"] = df["PRIMARY_WORKSITE_CITY"].str.strip().str.upper()   # casing is inconsistent
    df["EMPLOYER"] = df["EMP_BUSINESS_NAME"].str.strip().str.replace(r"\s+", " ", regex=True)  # trailing spaces split one employer into two
    df["ANNUAL_WAGE"] = df["JOB_OPP_WAGE_FROM"] * df["JOB_OPP_WAGE_PER"].map(ANNUAL)
    df.to_pickle(CACHE)                                                # later runs load in seconds
    return df

df = load()
certified = df[df["CASE_STATUS"].isin(["Certified", "Certified - Expired"])]

def green_card_sponsors(city, state, soc_prefix="", top=10):
    sub = certified[(certified["CITY"] == city.upper())
                    & (certified["PRIMARY_WORKSITE_STATE"] == state)
                    & certified["PWD_SOC_CODE"].fillna("").str.startswith(soc_prefix)]
    return (sub.groupby("EMPLOYER")
               .agg(certified=("CASE_NUMBER", "count"),
                    median_annual_wage=("ANNUAL_WAGE", "median"),
                    top_occupation=("PWD_SOC_TITLE", lambda s: s.mode().iat[0] if s.notna().any() else None))
               .sort_values("certified", ascending=False)
               .head(top))

if __name__ == "__main__":
    print(f"{len(df):,} PERM cases; status breakdown:")
    print(df["CASE_STATUS"].value_counts().to_string(), "\n")
    # Computer & mathematical occupations (SOC 15-xxxx) in Austin, TX
    print(green_card_sponsors("Austin", "TX", soc_prefix="15-").to_string())
```

Output from the FY2026 Q3 file:

```
112,550 PERM cases; status breakdown:
Certified              87741
Certified - Expired    16287
Withdrawn               4643
Denied                  3879

                                certified  median_annual_wage       top_occupation
EMPLOYER
Oracle America, Inc.                  165           139464.00  Software Developers
Charles Schwab & Company, Inc.         62           155104.50  Software Developers
PayPal, Inc.                           23           148902.83  Software Developers
Deloitte Consulting LLP                21           109000.00  Software Developers
Advanced Micro Devices, Inc.           20           137200.50  Software Developers
...
```

The first run took a few minutes on my machine, almost all of it `read_excel`. Once the pickle cache exists, the rerun finishes in about a second. Change the city, state and SOC prefix to ask a new question: `"29-"` for healthcare practitioners, `"13-2011"` for accountants, or `""` for all occupations.

## Traps that skew the counts

### Employer names are dirty

`Charles Schwab & Company, Inc.` shows up twice in the raw data, once with a trailing space, which splits its count into 47 and 15. Stripping and collapsing whitespace brings the number of distinct employer strings in this file down from 31,753 to 30,228. Legal-entity variants such as "Inc." versus "Inc" or subsidiaries remain separate. For serious work, add your own alias map.

### City casing and blanks

Worksite cities come in mixed case (`New York`, `EL SEGUNDO`). Uppercase them before matching. 4,388 cases in this file have no `PRIMARY_WORKSITE_CITY` at all, so a city filter will never match them.

### Wages come in five units

About 7.8% of cases state an hourly wage. If you take a median of `JOB_OPP_WAGE_FROM` without annualizing (hour × 2080, week × 52 and so on), those rows drag it down badly.

### Excel damages some codes

In the raw workbook, one `PWD_SOC_CODE` cell is stored as a date (`9033-11-01`) and 54 are blank. Without `dtype={"PWD_SOC_CODE": str}`, pandas returns a mixed-type column, and saving it to Parquet fails with `ArrowTypeError`. Read codes as strings and `fillna("")` before calling `.str.startswith`.

### Status is not a yes/no

`Certified - Expired` means the certification was granted but has since expired. It still shows the employer sponsored the role, which is why the script counts it. `Withdrawn` and `Denied` don't show that.

### Downloads can be refused

The file downloaded fine for me with a plain client. Some environments report 403 from dol.gov for bare HTTP clients, so if you hit one, send a normal browser-style `User-Agent`. Cache the file locally. Re-downloading 156 MB every time you run the script is slow for you and wasteful for the DOL.

## Do it without code

If you want to plan the query before downloading anything, the free [visa sponsor finder](https://datatooly.xyz/visa-sponsor-finder/) is a **query builder**. You pick a mode, role and city, and it builds a ready-to-run input for the actor below. It also shows a fixed example of the output shape. It doesn't fetch live DOL data in your browser, because these files are far too large for that.

## At scale

One file and one city is a notebook job. Repeating it across fiscal years and programs (PERM plus H-1B LCA), handling column changes between form versions, and noticing new quarterly files is a small pipeline. The [Visa Sponsor Tracker actor](https://apify.com/constructive_calm/visa-sponsor-tracker?fpr=v77kxu) on Apify reads the same OFLC disclosure files. It has `sponsor-finder`, `company-check`, `salary-lookup` and `bulk-export` modes, converts wages to annual figures, and caches the files between runs. Each filing row records the `sourceFile` it came from. Whichever tool you use, check that field to confirm which fiscal year and quarter a result reflects. The actor is free to start, then pay-as-you-go.

*Disclosure: I build the datatooly builder and the Apify actor. The DOL source facts and the code above work without either.*

## FAQ

### Where do I download PERM disclosure data?

From the OFLC Performance Data page at `dol.gov/agencies/eta/foreign-labor/performance`. The current file is `https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx`. Earlier years are linked from the same page.

### Is there a PERM API?

No. The DOL publishes bulk `.xlsx` files, not a query API. You download the file and filter it locally, or use a tool that does that for you.

### How often is PERM data updated?

The OFLC posts disclosure data by fiscal quarter, and the current year's file is cumulative. The FY2026 Q3 file covers decisions from 2025-10-01 through 2026-06-30.

### Does a certified PERM case mean the worker got a green card?

No. PERM labor certification is the DOL step. The employer then petitions USCIS, and the green card comes later. Treat certified cases as evidence of sponsorship, not as approvals of green cards.

### How is this different from H-1B LCA data?

LCA files cover temporary H-1B, H-1B1 and E-3 filings. PERM covers permanent (green card) labor certifications. Both come from the same OFLC page, but they use different column names. For the H-1B side, see the [H-1B salary database guide](https://datatooly.xyz/guides/h1b-salary-database-by-employer/).

### Why do I see the same company twice?

Employer names are free text in the source. Trailing spaces, punctuation and subsidiary names split one company into several strings. Normalize whitespace at the very least, and keep an alias map for the employers you care about.

## Related guides

- [How to Build an H-1B Salary Database by Employer (with Python)](https://datatooly.xyz/guides/h1b-salary-database-by-employer/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
