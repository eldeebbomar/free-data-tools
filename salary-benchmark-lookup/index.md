# What does a role pay? H-1B/PERM salary benchmarks

> SalaryBench IQ turns the US Department of Labor's public H-1B (LCA) and PERM wage disclosures into salary benchmarks. This free builder writes a ready-to-run query for a role, with optional employer, city, state, visa-type and year filters, and previews the output: P10 to P90 percentiles per role and location, or individual disclosed wage records. It is visa-sponsored base-wage data, a subset of US jobs, excluding bonus and equity.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Jobs & Visas](https://datatooly.xyz/category/jobs-visas/)
- URL: https://datatooly.xyz/salary-benchmark-lookup/
- Backing Apify actor: [salarybench-iq](https://apify.com/constructive_calm/salarybench-iq?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Build an H-1B Salary Database by Employer (with Python)](https://datatooly.xyz/guides/h1b-salary-database-by-employer/)

Enter a role and location and preview the salary percentiles SalaryBench IQ computes from public H-1B and PERM wage filings, P10 to P90 per role and city.

## Key takeaways

- This is a SALARY-BENCHMARKING tool: it answers 'what does this role pay in this city/state/employer,' not 'which companies sponsor visas' (that is the companion visa-sponsor-finder tool).
- Two modes: salary-benchmark for aggregate percentiles (P10, P25, median, P75, P90) and salary-samples for individual disclosed wage records.
- Data comes from the public US DOL Office of Foreign Labor Certification (OFLC) H-1B/LCA + PERM disclosure files, where sponsoring employers must report the offered/required wage.
- Honest scope: this is visa-sponsored wage data (a real-salary signal but a subset of all US jobs) and it is the base offered wage, excluding bonus and equity.
- Role is the only field you type (mode is preset); employer, city, state, visaTypes (default H-1B), fiscalYears, minSalary/maxSalary, and maxItems are optional filters.
- The page is a query BUILDER — it outputs a ready-to-run config plus a fixed example output shape; it does not run live searches in the browser.
- The actor is free to start and then pay-as-you-go using your Apify platform credits.

## How it works

### 1. Enter the role you want to benchmark

Type the job title into the required role field, for example 'Software Engineer,' 'Data Scientist,' or 'Product Manager.' This is the one mandatory input and drives the whole query.

### 2. Add location and employer filters

Optionally narrow by city, state, and employer. Location matters because the DOL prevailing wage is defined per occupation per area, so a city or state filter gives you a location-adjusted range instead of a blended national figure.

### 3. Choose visa types and fiscal years

Set visaTypes (defaults to H-1B; add H-1B1, E-3, or PERM as needed) and pick fiscalYears to control how recent the data is. Optionally bound results with minSalary, maxSalary, and maxItems.

## How to use it

1. **Enter the role you want to benchmark** — Type the job title into the required role field, for example 'Software Engineer,' 'Data Scientist,' or 'Product Manager.' This is the one mandatory input and drives the whole query.
2. **Add location and employer filters** — Optionally narrow by city, state, and employer. Location matters because the DOL prevailing wage is defined per occupation per area, so a city or state filter gives you a location-adjusted range instead of a blended national figure.
3. **Choose visa types and fiscal years** — Set visaTypes (defaults to H-1B; add H-1B1, E-3, or PERM as needed) and pick fiscalYears to control how recent the data is. Optionally bound results with minSalary, maxSalary, and maxItems.
4. **Pick benchmark or samples mode** — Choose salary-benchmark for aggregate percentiles (P10, P25, median, P75, P90) and a top-employer summary, or salary-samples to return the individual disclosed wage records with case number, SOC code, offered wage, and worksite.
5. **Copy the config and run the actor on Apify** — The builder produces a ready-to-run configuration and a fixed example output shape. Open SalaryBench IQ on Apify, paste the config, and run it — free to start, then pay-as-you-go on your Apify platform credits.

## Example output

A fixed sample of the fields the salarybench-iq actor returns — example data, not live results.

| role | city | state | medianSalary | count |
| --- | --- | --- | --- | --- |
| software engineer | Seattle | WA | 158000 | 5120 |
| software engineer | San Jose | CA | 170000 | 6840 |
| software engineer | Austin | TX | 135000 | 2210 |
| software engineer | New York | NY | 155000 | 3975 |
| software engineer | Chicago | IL | 126000 | 1480 |

## Ready-to-run actor input

```json
{
  "mode": "salary-benchmark",
  "role": "software engineer",
  "visaTypes": [
    "H-1B"
  ],
  "maxItems": 50
}
```

## Key facts

- The DOL Office of Foreign Labor Certification (OFLC) publishes public disclosure files covering the PERM, LCA (H-1B/H-1B1/E-3), H-2A, H-2B, CW-1, and Prevailing Wage programs. (Source: DOL OFLC Performance Data page (dol.gov/agencies/eta/foreign-labor/performance), verified 2026.)
- H-1B employers must make the rate of pay, the actual-wage system, and the prevailing wage rate and its source available to the public. (Source: DOL Wage and Hour Division Fact Sheet #62F on H-1B public-view recordkeeping, verified 2026.)
- Each LCA record includes job title, SOC code, prevailing wage, the offered/actual wage, a wage level of I–IV, worksite location, and employer information. (Source: DOL OFLC LCA disclosure record layout and performance data, verified 2026.)
- The disclosed figure is the offered wage on the filing (base salary) and does not include stock, bonus, or other monetary benefits, and reflects job offers rather than confirmed final compensation. (Source: DOL Form ETA-9035 (LCA) wage definition; analysis of LCA disclosure databases, verified 2026.)
- DOL releases the disclosure files quarterly, typically about a month after each fiscal-year quarter ends, with each release cumulative for the fiscal year. (Source: DOL OFLC disclosure-data release notes and quarterly cadence, verified 2026.)

## FAQ

### What is the difference between this tool and visa-sponsor-finder?

They use the same public DOL disclosure data but answer different questions. visa-sponsor-finder helps you discover WHICH companies sponsor H-1B/PERM and how often they file — it is for job seekers and recruiters mapping sponsoring employers. This salary-benchmark tool answers HOW MUCH a given role pays: percentile salary ranges by role, city, state, or employer, and the individual disclosed wage records behind them. If you want sponsor discovery, start with visa-sponsor-finder; if you want pay data, use this one.

### Where does the salary data come from?

From the U.S. Department of Labor's Office of Foreign Labor Certification (OFLC) public disclosure files. When an employer sponsors a foreign worker, it must file a Labor Condition Application (LCA) for H-1B/H-1B1/E-3 roles or a PERM application for green-card roles, and report the offered/required wage. The DOL publishes these filings as public disclosure datasets, typically released quarterly (about a month after each fiscal-year quarter ends).

### Is this the actual salary the worker received?

Not exactly. The disclosed figure is the offered or required wage on the filing — what the employer stated it would pay for the position — not a confirmed final paycheck. It is base salary and does not include bonus, stock, or other compensation. Employers must pay at least the higher of the prevailing wage or their actual wage for similar workers, so it is a strong, legally-grounded salary signal, but treat it as the base offered wage rather than total compensation.

### Does this cover all US jobs or just visa roles?

Just visa-sponsored roles. The dataset only contains positions where an employer filed an H-1B, H-1B1, E-3, or PERM application. That is a meaningful subset — heavily weighted toward tech, engineering, finance, healthcare, and academia — but it is not a census of all U.S. employment. Use it as a strong real-salary benchmark for sponsored roles, not as a universal national wage figure.

### What is the difference between salary-benchmark mode and salary-samples mode?

salary-benchmark mode aggregates the matching filings (certified/approved filings by default) into a percentile distribution — P10, P25, median, P75, P90 — plus the filing count, top employer, and visa-type breakdown for the role and location you specified. salary-samples mode skips the aggregation and returns the individual disclosed records: case number, visa type, decision, employer, job title, SOC code, offered wage, prevailing wage, and worksite. Pick benchmark for a quick range; pick samples when you want to inspect the underlying rows.

### What inputs do I need to build a query?

Role is the only field you must type — mode is preset to salary-samples (for example, 'Software Engineer' or 'Data Scientist'). Optional filters let you narrow further: employer, city, state, visaTypes (defaults to H-1B; you can add H-1B1, E-3, or PERM), fiscalYears, minSalary and maxSalary to bound the wage range, and maxItems to cap how many rows are returned. The more filters you add, the tighter and more comparable the benchmark.

### Why should I filter by city or state?

Because the same role pays very differently across metro areas, and the DOL data captures that. The prevailing wage is defined for a specific occupation in a specific area of intended employment, so a Software Engineer benchmark in San Francisco will not match one in Dallas or Atlanta. Filtering by city or state gives you a location-adjusted percentile range instead of a blended national figure that masks cost-of-living differences.

### How current is the data?

The DOL releases public disclosure files quarterly, usually about a month after each fiscal-year quarter closes, and each release is cumulative for that fiscal year. You can target specific fiscal years with the fiscalYears input. Because a small share of cases can change on appeal or redetermination, the most recent quarter is the freshest but also the most subject to minor later revision.

### Does this page return live salary results in my browser?

No. This page is a query builder. It assembles a ready-to-run configuration from your inputs and shows a fixed example of the output shape so you know what to expect. To get actual results you run the SalaryBench IQ actor on Apify with that config. The actor is free to start and then pay-as-you-go on your Apify platform credits.

### Can I compare salaries across employers?

Yes. Leave employer blank and use salary-benchmark mode to see the percentile range plus the top filing employer for a role and location, or run salary-samples to list disclosed wages per employer side by side. You can also re-run the query with a specific employer filter to see that company's filed wages versus the broader market range for the same role and city.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Company hiring signals](https://datatooly.xyz/company-hiring-signals/)
- [H-1B visa sponsor finder](https://datatooly.xyz/visa-sponsor-finder/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
