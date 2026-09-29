# Find H-1B & green-card visa sponsors + salary data

> An H-1B visa sponsor lookup finds U.S. employers that have filed visa sponsorship paperwork for a given role and location. This free tool builds a ready-to-run query (role, city, max results) and previews the exact output shape. You then run it live on the backing Apify actor, which reads official U.S. Department of Labor LCA and PERM disclosure data. Free to start, then pay-as-you-go.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Jobs & Visas](https://datatooly.xyz/category/jobs-visas/)
- URL: https://datatooly.xyz/visa-sponsor-finder/
- Backing Apify actor: [visa-sponsor-tracker](https://apify.com/constructive_calm/visa-sponsor-tracker?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [PERM Disclosure Data in Python: Find Green Card Sponsors by City](https://datatooly.xyz/guides/perm-disclosure-data-python-green-card-sponsors/)

Enter a role and city and preview the H-1B and green-card sponsors the actor ranks from U.S. Department of Labor disclosure data: filings, approval rate and median salary per employer.

## Key takeaways

- This page is a query builder: you set a role, city, and result cap, see a sample of the output fields, then run the query live on the Apify actor — it does not fetch live sponsor results inside your browser.
- Data comes from official U.S. Department of Labor (OFLC) LCA and PERM disclosure files, the same public records third-party H-1B sites index.
- Results identify employers that filed H-1B, H-1B1, E-3, or PERM green-card paperwork, with job titles, offered wages, work locations, and filing outcomes.
- An LCA filing is a prerequisite step, not proof an H-1B was approved — read filing counts and approval outcomes accordingly.
- The backing actor is free to start, then pay-as-you-go: the first 10 chargeable output events per run are free before charging begins.
- Coverage is U.S. visa programs only; fiscal years from FY2008 onward are selectable, and DOL publishes new disclosure data roughly quarterly, about a month after each fiscal quarter closes.

## How it works

### 1. Choose the sponsor-finder mode

Keep the mode set to sponsor-finder. This is the option that lists employers who have filed visa sponsorship paperwork for a particular role, rather than profiling a single company or returning raw filings.

### 2. Enter the role and city

Type the job role you want to target (for example, 'software engineer' or 'data analyst') and the city where you want sponsors. Leaving city blank broadens the search nationwide; adding it narrows results to that local labor market.

### 3. Set a result cap

Set maxItems to limit how many results the run returns (the example uses 50). A smaller cap keeps the run cheap and fast while you test; raise it once you know the query returns what you need.

## How to use it

1. **Choose the sponsor-finder mode** — Keep the mode set to sponsor-finder. This is the option that lists employers who have filed visa sponsorship paperwork for a particular role, rather than profiling a single company or returning raw filings.
2. **Enter the role and city** — Type the job role you want to target (for example, 'software engineer' or 'data analyst') and the city where you want sponsors. Leaving city blank broadens the search nationwide; adding it narrows results to that local labor market.
3. **Set a result cap** — Set maxItems to limit how many results the run returns (the example uses 50). A smaller cap keeps the run cheap and fast while you test; raise it once you know the query returns what you need.
4. **Preview the output shape** — Review the sample output on this page to confirm the fields you will get — employer name, job title, offered and prevailing wage, work location, visa type, and filing outcome. This is a fixed example, not live data.
5. **Run the query live on the actor** — Send the generated config to the backing Apify actor to fetch real results from the DOL disclosure files. It is free to start, then pay-as-you-go, with the first 10 chargeable events free each run.

## Example output

A fixed sample of the fields the visa-sponsor-tracker actor returns — example data, not live results.

| employer | role | filings | approvalRate | medianSalary |
| --- | --- | --- | --- | --- |
| Example Cloud Inc. | software engineer | 412 | 98.3 | 158000 |
| Sample Retail Technologies LLC | software engineer | 236 | 97 | 149500 |
| Placeholder Software Corp | software engineer | 118 | 98.3 | 165000 |
| Demo Analytics Group | software engineer | 64 | 95.3 | 131000 |
| Acme Systems Consulting | software engineer | 57 | 91.2 | 112000 |

## Ready-to-run actor input

```json
{
  "mode": "sponsor-finder",
  "maxItems": 50
}
```

## Key facts

- The backing actor reads official U.S. Department of Labor (OFLC) LCA and PERM public disclosure files, covering H-1B, H-1B1, E-3, and PERM green-card records. (Source: From the actor's README and input schema; source cited as dol.gov/agencies/eta/foreign-labor/performance.)
- Selectable fiscal years run from FY2008 onward across the H-1B/LCA and PERM programs; the DOL publishes new data roughly quarterly. (Source: From the actor's input handling (fiscal-year input accepts FY2008 and later, the first year DOL publishes); corroborated by the DOL OFLC release pattern (data released ~1 month after each fiscal quarter closes).)
- An LCA is certified by the DOL but does not approve an H-1B; the employer must still file Form I-129 with USCIS for the actual sponsorship. (Source: DOL Office of Foreign Labor Certification LCA program documentation and general immigration-law guidance.)
- The backing actor is free to start, then pay-as-you-go: the first 10 chargeable output events per run are a free trial before per-event charging begins. (Source: From the actor's README and pay-per-event configuration (actor start $0.01 per GB of run memory, $0.04 at the default 4 GB; visa filing $0.005; salary percentile row $0.003).)
- The UK's official GOV.UK Register of Licensed Sponsors is a free, regularly updated list of licensed worker sponsors — but it is NOT covered by this U.S.-only actor. (Source: GOV.UK 'Register of licensed sponsors: workers'; noted here only to set scope honestly. The exact organisation count fluctuates and is not tracked by this actor.)

## FAQ

### What is an H-1B visa sponsor lookup?

An H-1B visa sponsor lookup searches public records to find U.S. employers that have filed visa sponsorship paperwork for a given job role and location. The underlying data is the Department of Labor's Labor Condition Application (LCA) and PERM disclosure files, which every sponsoring employer must file. A lookup returns the employer name, job title, offered wage, work location, and filing outcome so you can see who actually sponsors for your role.

### How does this query builder work?

You pick a mode (sponsor-finder), type a role and city, and set a maximum number of results. The page assembles a ready-to-run input config and shows a fixed example of the output shape — the fields each result will contain. It does not return live sponsor data in your browser. To get real results, you run the generated query on the backing Apify actor, which reads the DOL disclosure files at run time.

### Where does the sponsor data come from?

From the U.S. Department of Labor's Office of Foreign Labor Certification (OFLC) public disclosure files at dol.gov/agencies/eta/foreign-labor/performance. These cover Labor Condition Applications for H-1B, H-1B1, and E-3 visas, plus PERM green-card records. This is the same public dataset that third-party H-1B sites index; the actor reads it directly so you control filters and output.

### Does an LCA filing mean the H-1B was approved?

No. An LCA is a prerequisite an employer files with the Department of Labor before petitioning USCIS — it does not guarantee an H-1B was approved. The DOL reviews LCAs mainly for completeness within about seven working days. Actual H-1B approval happens later when USCIS adjudicates Form I-129. Treat LCA filing counts as evidence an employer sponsors, not proof of a granted visa.

### Is this tool free?

The query builder on this page is free to use — building a query and previewing the output shape costs nothing. The backing Apify actor that runs the query live is free to start, then pay-as-you-go: the first 10 chargeable output events in each run are treated as a free trial before billing begins, then events like a returned filing or salary row are charged per event.

### Does it cover UK visa sponsors?

No. The backing actor covers U.S. visa programs only — H-1B, H-1B1, E-3, and PERM green-card sponsorship from Department of Labor data. It does not read the UK Home Office Register of Licensed Sponsors. If you need UK sponsor data, the official GOV.UK 'Register of licensed sponsors: workers' CSV is the authoritative free source to check directly.

### Can I look up the salary or prevailing wage for a role?

Yes, indirectly. Each sponsor filing in the output includes the offered (annualized) wage and the prevailing wage the employer disclosed, plus city/state. The actor also offers a salary-lookup mode that returns a full wage distribution — the p10, p25, median, p75, and p90 percentiles — for a role and location based on real filings, so you can benchmark an offer against what sponsors have actually paid.

### How current is the data?

The Department of Labor publishes new disclosure data roughly quarterly, typically about a month after each federal fiscal quarter closes. The actor discovers the available files at run time, so freshness tracks the DOL release schedule rather than a fixed internal cadence. Selectable fiscal years run from FY2008 onward across the H-1B/LCA and PERM programs.

### What can I do with the results?

Job seekers use sponsor lookups to target companies with a real sponsorship history before applying, and to benchmark salary offers. Recruiters and immigration teams use them to research an employer's filing patterns, approval outcomes, and worksite locations. Because the output is structured (employer, role, wage, location, outcome), you can export it and filter or join it with your own job-search or CRM data.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Company hiring signals](https://datatooly.xyz/company-hiring-signals/)
- [H-1B salary lookup](https://datatooly.xyz/salary-benchmark-lookup/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
