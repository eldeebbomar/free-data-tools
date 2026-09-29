# Extract LinkedIn profiles — posts & articles

> A LinkedIn profile scraper extracts public profile data — name, headline, work history, education, recent posts, and articles — without logging in. This free tool builds a ready-to-run query and previews the exact JSON output shape; it does not fetch live results in your browser. Run the query on the backing Apify actor (LinkedIn Profile Pro), which is pay-as-you-go; your first 10 resolved profiles are free once per Apify account.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Lead Generation](https://datatooly.xyz/category/lead-generation/)
- URL: https://datatooly.xyz/linkedin-profile-lookup/
- Backing Apify actor: [linkedin-profile-pro](https://apify.com/constructive_calm/linkedin-profile-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Build a LinkedIn Profile Scraper: The Honest Technical Guide](https://datatooly.xyz/guides/build-linkedin-profile-scraper/)

Paste public LinkedIn profile URLs and preview the records the actor extracts without logging in: name, headline, location, followers, work history and recent posts.

## Key takeaways

- This is a query builder: paste LinkedIn profile URLs or slugs, set options, and copy a ready-to-run config plus see a fixed example of the output shape — it does not return live data in the browser.
- The backing actor (LinkedIn Profile Pro by constructive_calm) is cookie-free and login-free: it parses public JSON-LD embedded in profile pages, so no LinkedIn account or session cookie is needed.
- Output includes profile fields (name, headline, country, work history with dates, education), up to ~10 recent posts with engagement metrics, and up to ~10 published articles.
- Pricing is pay-as-you-go on Apify: $4.00 per 1,000 profiles resolved, and your first 10 resolved profiles are free once per Apify account (a lifetime allowance, not per run) (Apify also gives new accounts platform free credits to start).
- Cookie-free architecture has limits: skills, certifications, per-reaction breakdowns, and comment-thread bodies are not available — that data only loads behind a login wall.
- U.S. case law (hiQ Labs v. LinkedIn) suggests scraping public data is unlikely to violate the CFAA, but the dispute settled in 2022 and scraping can still breach LinkedIn's Terms of Service — scrape public data responsibly.

## How it works

### 1. Add profile URLs or slugs

Paste one or more public LinkedIn profile URLs (e.g. linkedin.com/in/username) or bare slugs into the profileUrls field. The builder accepts both formats and automatically deduplicates repeats so you aren't charged twice.

### 2. Set your options

Keep includeRecentPosts on to bundle each person's recent posts and articles at no extra charge, and set maxItems to cap how many profiles the run processes (the actor defaults to 500).

### 3. Preview the output shape

Review the fixed example output to confirm the JSON fields you'll receive — name, headline, country, work history, education, posts, and articles — so you know the shape before spending anything.

## How to use it

1. **Add profile URLs or slugs** — Paste one or more public LinkedIn profile URLs (e.g. linkedin.com/in/username) or bare slugs into the profileUrls field. The builder accepts both formats and automatically deduplicates repeats so you aren't charged twice.
2. **Set your options** — Keep includeRecentPosts on to bundle each person's recent posts and articles at no extra charge, and set maxItems to cap how many profiles the run processes (the actor defaults to 500).
3. **Preview the output shape** — Review the fixed example output to confirm the JSON fields you'll receive — name, headline, country, work history, education, posts, and articles — so you know the shape before spending anything.
4. **Copy the generated query** — Copy the ready-to-run input config that the builder produces. This is the exact JSON you'll paste into the backing Apify actor.
5. **Run it live on the actor** — Open LinkedIn Profile Pro on Apify (by constructive_calm), paste the config, and run. Your first 10 resolved profiles are free once per Apify account, so validate results before scaling — then it's pay-as-you-go at $4.00 per 1,000 profiles resolved.

## Example output

A fixed sample of the fields the linkedin-profile-pro actor returns — example data, not live results.

| name | headline | country | city | followers |
| --- | --- | --- | --- | --- |
| Jane Example | Head of Product at Example Analytics | US | Austin | 4210 |
| Omar Sample | Senior Data Engineer \| Streaming pipelines | AE | Dubai | 1830 |
| Priya Placeholder | Growth Marketing Lead at Placeholder Labs | IN | Bengaluru | 2975 |
| Alex Demo | Founder, Demo Robotics | GB | London | 12640 |
| Maria Muster | Talent Acquisition Partner | DE | Berlin | 950 |

## Ready-to-run actor input

```json
{
  "includeRecentPosts": true,
  "maxItems": 50
}
```

## Key facts

- The backing actor charges $4.00 per 1,000 profiles resolved ($0.004 per profile), and your first 10 resolved profiles are free once per Apify account (a lifetime allowance, not per run). (Source: From the LinkedIn Profile Pro actor's pay-per-event config and README ($0.004 per profile-resolved event; 10-profile lifetime allowance per Apify account in src/utils/charge.ts).)
- The actor reports an expected ~70% success rate at default settings, rising to ~85% with residential proxy fallback enabled. (Source: From the LinkedIn Profile Pro actor's README and input schema.)
- The actor extracts up to roughly 10 recent posts and up to roughly 10 published articles per public profile — the set exposed by the cookie-free page rather than a profile's full posting history. (Source: From the LinkedIn Profile Pro actor's README and input schema ("up to ~10 recent posts per profile").)
- In hiQ Labs v. LinkedIn, the Ninth Circuit (ruling on a preliminary injunction) found that scraping publicly available data is unlikely to be 'without authorization' under the U.S. Computer Fraud and Abuse Act (CFAA); the case was procedurally narrow and settled in 2022, with hiQ conceding it had breached LinkedIn's User Agreement. (Source: Public reporting on the hiQ Labs v. LinkedIn litigation and 2022 settlement. Violating LinkedIn's ToS remains a separate civil matter; not legal advice.)
- Cookie-free LinkedIn scrapers cannot return skills, certifications, per-reaction breakdowns, or comment-thread bodies — that data only loads behind a login wall. (Source: From the LinkedIn Profile Pro actor's README ("Known limits" section) and cookie-free architecture.)

## FAQ

### What is a LinkedIn profile scraper?

A LinkedIn profile scraper is a tool that extracts structured data from public LinkedIn profile pages — name, headline, location, work history, education, follower counts, recent posts, and articles — and returns it as JSON. This page is a query builder: you paste profile URLs and it generates a ready-to-run config plus a preview of the output shape. The actual extraction runs on the backing Apify actor, not in your browser.

### Does this tool scrape LinkedIn live in my browser?

No. This is a query builder, not a live scraper. It assembles a ready-to-run query and shows a fixed example of the JSON output shape so you know exactly what fields you'll get. LinkedIn is anti-bot and not CORS-open, so live in-browser fetching is not possible. To get real data, run the generated query on the backing Apify actor, LinkedIn Profile Pro.

### Do I need to log in or provide LinkedIn cookies?

No. The backing actor is cookie-free and login-free. It works by parsing the public JSON-LD structured data that LinkedIn embeds in profile pages, fetched over plain HTTP requests. Because no account session is involved, there is no LinkedIn account to flag or ban from the scraping itself. You only need public profile URLs or bare slugs as input.

### How much does the LinkedIn profile scraper cost?

The backing Apify actor is pay-as-you-go: $4.00 per 1,000 profiles resolved ($0.004 per profile). Your first 10 resolved profiles are free once per Apify account (a lifetime allowance, not per run), and new Apify accounts also get platform free credits to start. Recent posts and articles are bundled into that per-profile charge with no extra per-post fee. You are not charged for invalid slugs, soft-blocks, empty responses, or duplicate inputs.

### What data fields does it return?

For each profile: name, headline, country, work history with dates, education with dates, photo URL, followers, and connections. It also returns up to roughly 10 recent posts with full text, likes, comments, shares, and timestamps, plus up to roughly 10 published articles with titles, descriptions, and dates. Skills, certifications, per-reaction breakdowns, and comment-thread bodies are not available without a login.

### Is scraping LinkedIn profiles legal?

U.S. case law leans toward scraping publicly visible data being unlikely to violate the CFAA — in hiQ Labs v. LinkedIn, the Ninth Circuit (ruling on a preliminary injunction) found that accessing public pages probably isn't 'without authorization' under the CFAA. But that was a narrow, procedural ruling, not a final merits decision: the case settled in 2022, with hiQ conceding it had breached LinkedIn's User Agreement. So scraping public data can still breach LinkedIn's Terms of Service, which carries civil risk (cease-and-desist, account or IP blocks). This is general information, not legal advice — scrape only public data, respect privacy laws like GDPR, avoid login-gated content, and consult a lawyer for your specific use case.

### How accurate or reliable is the extraction?

The backing actor reports roughly a 70% success rate at default settings, rising to about 85% when residential proxy fallback is enabled (which adds cost). Misses come from soft-blocks and profiles that don't expose JSON-LD. You aren't charged for soft-blocks or empty responses, and you can raise maxRetriesPerProfile (default 5, up to 10) to improve hit rate on stubborn profiles.

### Can I scrape posts and articles too, or just the profile?

Both. The actor bundles recent posts and articles into each profile result at no extra charge. Toggle includeRecentPosts and includeArticles (both default to true). The actor extracts up to roughly 10 recent posts and up to roughly 10 published articles per profile — that is what the public, cookie-free page exposes, not a profile's complete posting history. For the full archive you'd need a logged-in session, which this actor deliberately avoids.

### Can it find email addresses or phone numbers?

No. This actor extracts public profile data, posts, and articles only — it does not perform email or phone enrichment. Public LinkedIn profiles don't expose contact details in their JSON-LD, so emails and phone numbers are out of scope. Tools that claim email lookup typically rely on separate enrichment databases, which are priced and sourced differently.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Threads profile scraper](https://datatooly.xyz/threads-profile-search/)
- [Threads keyword monitor](https://datatooly.xyz/threads-keyword-monitor/)
- [Reddit search tool](https://datatooly.xyz/reddit-search-builder/)
- [Telegram channel scraper](https://datatooly.xyz/telegram-channel-search/)
- [find LinkedIn profiles by job title and location](https://datatooly.xyz/linkedin-people-search/)
