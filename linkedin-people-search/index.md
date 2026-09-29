# Find LinkedIn profiles by job title and location

> To find LinkedIn profiles by job title and location, search LinkedIn's public profile pages through a public search index for each title-and-city pair, then collect each person's name, headline, company and profile URL. This free builder writes that run input and previews the output shape; the backing Apify actor runs it with no LinkedIn login or cookies and charges per profile delivered, never per search page.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Lead Generation](https://datatooly.xyz/category/lead-generation/)
- URL: https://datatooly.xyz/linkedin-people-search/
- Backing Apify actor: [linkedin-people-finder](https://apify.com/constructive_calm/linkedin-people-finder?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)

Enter job titles and locations and preview the LinkedIn people the actor finds (name, headline, current company and profile URL) with no LinkedIn login or cookies.

## Key takeaways

- This is a query builder: enter job titles and locations (or raw search queries), copy a ready-to-run input and preview a fixed example of the output. It does not fetch live LinkedIn data in your browser.
- The backing actor (LinkedIn People Search by constructive_calm) finds public profiles through a public search index and opens them cookie-free. No LinkedIn account, login or session cookie is used.
- Billing is per profile delivered: $0.002 per short profile and $0.004 per full profile, plus $0.01 per run. Search pages and deduplicated profiles are never billed.
- Each title-and-location search tops out at roughly 300–400 results. Widen coverage with more titles, more cities, synonym expansion and freshness windows rather than deeper paging.
- Freshness windows (past_week, past_month) keep only recently re-indexed profiles, a practical job-change signal, and dedupeMode auto returns only people you have not been given before.
- Location is a text match, so every row carries locationConfidence (exact, mentioned or unknown) and you can filter out people who merely mention the city.

## How it works

### 1. Titles × locations

Enter one or more job titles and one or more locations. The actor searches every title in every location, so 2 titles and 2 cities become 4 search combinations. For full control, add raw search queries instead, e.g. "Head of Talent" "Berlin" -recruiter.

### 2. Short or full

Short mode returns name, headline, current title, company and profile URL from the public search index ($2 per 1,000 profiles). Full mode also opens each profile for the about section, work history, education and follower counts ($4 per 1,000); a profile that will not open is billed at the Short price.

### 3. Fresh people, no repeats

Set freshness to past_week or past_month to keep only profiles re-indexed recently — often a sign the person changed jobs or headline. On the actor, dedupeMode auto remembers everyone it has already given you, so a weekly scheduled run returns only new people.

## How to use it

1. **Enter job titles and locations** — Add one or more job titles (e.g. Registered Nurse, ICU Nurse) and one or more locations (e.g. Dubai, Abu Dhabi). Every title is searched in every location.
2. **Add raw queries if you need them** — For full control, add raw search queries such as "Head of Talent" "Berlin" -recruiter. They run before the title and location combinations.
3. **Pick mode and freshness** — Choose Short ($2 per 1,000) for discovery and monitoring, or Full ($4 per 1,000) to open each profile for about, work history and education. Set freshness to past_week or past_month to keep recently re-indexed profiles only.
4. **Cap the run** — Set maxProfiles. It is a hard cap on rows returned, and because you pay per row it is also your cost cap.
5. **Run it on Apify and export** — Copy the input, paste it into the LinkedIn People Search actor, run it, and download the dataset as CSV, JSON or Excel, or pull it over the Apify API into your ATS or CRM.

## Example output

A fixed sample of the fields the linkedin-people-finder actor returns — example data, not live results.

| name | headline | currentCompany | locationConfidence | enriched |
| --- | --- | --- | --- | --- |
| Jane Example | Registered Nurse - ICU at Example Health Hospital | Example Health Hospital | exact | true |
| Omar Sample | ICU Staff Nurse \| BLS & ACLS certified | Sample Medical Centre | exact | true |
| Priya Placeholder | Staff Nurse at Placeholder Hospital \| Open to opportunities in Dubai | Placeholder Hospital | mentioned | false |
| Alex Demo | Head of Talent at Demo Software Ltd | Demo Software Ltd | exact | false |
| Sam Testcase | Talent Acquisition Manager \| Hiring engineers across the UK |  | exact | false |

## Ready-to-run actor input

```json
{
  "jobTitles": [
    "Registered Nurse"
  ],
  "locations": [
    "Dubai"
  ],
  "mode": "full",
  "freshness": "any",
  "maxProfiles": 100
}
```

## Key facts

- The actor charges $0.01 per run, $0.002 per short profile and $0.004 per full profile; search pages and deduplicated profiles are never billed, and there is no separate free-trial tier. (Source: Live Apify pay-per-event pricing for constructive_calm/linkedin-people-finder (actor-start, short-profile, full-profile), checked via the Apify API on 2026-09-29.)
- Each search page yields roughly 10 public LinkedIn profiles, and a single query tops out at about 300–400 results. (Source: From the linkedin-people-finder README (What it does; Limitations).)
- Full mode opens profiles successfully roughly 80% of the time; the rest are returned with enriched: false and billed at the Short price. (Source: From the linkedin-people-finder README (Limitations).)
- currentTitle is filled on roughly 4% to 53% of rows depending on the profession, while headline is populated on effectively every row, so headline is the field to filter on. (Source: From the linkedin-people-finder README (Limitations), measured by the author across live searches.)
- Location matching is text-based; every row carries locationConfidence of exact, mentioned or unknown instead of silently dropping people who only mention the city. (Source: From the linkedin-people-finder README and its dataset type definitions (LocationConfidence).)

## FAQ

### How do I find LinkedIn profiles by job title and location?

Enter the job titles and the cities, regions or countries you care about, for example Registered Nurse in Dubai and Abu Dhabi. The backing actor searches every title in every location through a public search index restricted to LinkedIn profile pages, and returns one row per person with name, headline, current title, current company, location and profile URL. This page builds that run input for you and shows the output shape before you spend anything.

### Does this tool search LinkedIn live in my browser?

No. It is a query builder. LinkedIn does not allow other websites to read its pages from a visitor's browser, so this page assembles a ready-to-run input and shows a fixed example of the output (the example people are fictional). To get real results, paste the input into the LinkedIn People Search actor on Apify and run it there.

### Do I need a LinkedIn account, login or cookies?

No. The actor discovers people through a public search index and, in Full mode, opens each public profile page without any LinkedIn session. There is no account to connect, no cookie to paste and no session to keep alive, so no LinkedIn account is put at risk by the scraping itself. Profiles whose owners have switched off public visibility cannot be reached at all.

### How much does a LinkedIn people search cost?

The actor is pay-per-event: $0.01 per run, $0.002 per short profile ($2 per 1,000) and $0.004 per full profile ($4 per 1,000). Search pages, duplicates removed by deduplication and empty results are never billed, and a profile that cannot be opened in Full mode is billed at the Short price. There is no separate free-trial tier; Apify's free monthly platform credit covers small test runs.

### What fields do I get for each person?

Every row has profileUrl, slug, name, headline, currentTitle, currentCompany, location (raw, normalized and countryCode), locationConfidence, snippet and enriched, plus a _meta block showing which query found the person. Full mode adds about, workHistory (employer and company page URL; role titles and dates are usually blank on public profiles), education, followers and connections.

### How many people can one search return?

Roughly 300–400 per query. A public search index has a hard ceiling, so a single title-and-city search cannot page into the thousands the way a logged-in LinkedIn search can. To reach more people, add more job titles and locations, turn on expandSynonyms (title variants and nearby cities), or run different freshness windows, then let deduplication collapse the overlap.

### Can I find the employees of a specific company?

Only approximately. The actor has no company filter, but you can add a raw search query that combines a role with the company name, such as "Software Engineer" "Acme Corp". That is a text match against public headlines and snippets, so it finds people who mention the company, not a verified employee list. Check currentCompany on each row before relying on it.

### Can I filter by seniority, company size or industry?

No. Seniority, years of experience, company headcount, function and industry facets live inside LinkedIn's logged-in search, which this actor deliberately does not use. You get job title and location, plus whatever you can express in a raw query string. If your workflow depends on those facets, a session-based product will fit better.

### Does it return email addresses or phone numbers?

No. The actor returns public profile data only. It does not guess, infer or buy email addresses, and public LinkedIn profiles do not expose contact details.

### Is it legal to collect LinkedIn profiles this way?

The actor reads only public profile pages through a public search index, with no login, no authentication bypass and no connection-gated data. Using the output is a separate question: the rows are personal data about real people, so under GDPR, UK GDPR or similar rules you are the controller and need a lawful basis, transparency and a retention policy, and LinkedIn's Terms of Service still apply. This is general information, not legal advice.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [extract full LinkedIn profiles, posts and articles from URLs](https://datatooly.xyz/linkedin-profile-lookup/)
- [see which companies are hiring right now](https://datatooly.xyz/company-hiring-signals/)
- [benchmark what a role pays](https://datatooly.xyz/salary-benchmark-lookup/)
- [find H-1B visa sponsors by role and city](https://datatooly.xyz/visa-sponsor-finder/)
