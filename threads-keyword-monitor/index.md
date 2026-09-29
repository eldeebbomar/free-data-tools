# Monitor Threads by keyword or hashtag

> This is a query builder for searching Threads (threads.com) by keyword or hashtag and scheduling monitoring of saved searches for new matching posts. You configure the mode (search, hashtag, or monitor), terms, and limits here, then run it on the backing Apify actor. It scrapes public Threads cookie-free — no login or API token — finding posts that match your terms, not a single profile.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Social & Community](https://datatooly.xyz/category/social-community/)
- URL: https://datatooly.xyz/threads-keyword-monitor/
- Backing Apify actor: [threads-search-monitor](https://apify.com/constructive_calm/threads-search-monitor?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Threads Keyword Search Without App Review: Monitor in Python](https://datatooly.xyz/guides/threads-keyword-search-without-app-review/)

Enter keywords or hashtags and preview the matching public Threads posts the actor finds (author, text, likes, replies and the query that matched), or schedule it as a monitor.

## Key takeaways

- This page builds a config for keyword and hashtag SEARCH plus scheduled MONITORING of saved searches — it is distinct from the threads-profile-search page, which extracts one given user's profile and posts.
- Three modes: search (keyword or phrase), hashtag (topic-tag feed), and monitor (re-runs a saved search on a schedule and returns only new matching posts since the last run).
- Cookie-free: it reads public threads.com pages with no Threads login, OAuth token, or official API key — search and monitor find posts matching your terms, not a specific profile.
- Common uses are brand monitoring, lead generation, and trend tracking — surface every post mentioning your brand, product, niche, or hashtag.
- Optional add-ons: reply-tree extraction, author bio contacts (email or phone parsed from public bios), and linktree or beacons link resolution.
- This is a builder and fixed-sample preview, not live in-browser results — Threads pages are not CORS-open, so you copy the generated config into the Apify actor to run it.
- The backing actor is free to start, then pay-as-you-go via Apify platform credits using a pay-per-event model; your first 10 chargeable events are free once per Apify account (a lifetime allowance, not per run, and it does not apply to repeat monitor runs).

## How it works

### 1. Choose a mode

Pick search for a keyword or phrase, hashtag for a topic tag, or monitor to track new matching posts for a saved search on a schedule. Search and hashtag are for one-off pulls; monitor is for recurring brand, lead, or trend tracking.

### 2. Enter your terms and limits

Add keywords or phrases (search mode) or tags (hashtag mode), then set the per-query result cap and optional date range. You can include several terms in one run; results carry a matchedQuery field so you know which term surfaced each post.

### 3. Toggle optional enrichments

Optionally enable reply-tree extraction with a depth limit, author bio contact resolution (email and phone), and linktree resolution. Each is opt-in and, on the actor, billed as a separate event, so turn on only what your use case needs.

## How to use it

1. **Choose a mode** — Pick search for a keyword or phrase, hashtag for a topic tag, or monitor to track new matching posts for a saved search on a schedule. Search and hashtag are for one-off pulls; monitor is for recurring brand, lead, or trend tracking.
2. **Enter your terms and limits** — Add keywords or phrases (search mode) or tags (hashtag mode), then set the per-query result cap and optional date range. You can include several terms in one run; results carry a matchedQuery field so you know which term surfaced each post.
3. **Toggle optional enrichments** — Optionally enable reply-tree extraction with a depth limit, author bio contact resolution (email and phone), and linktree resolution. Each is opt-in and, on the actor, billed as a separate event, so turn on only what your use case needs.
4. **Preview the output shape** — Review the fixed sample to see the record structure — matchedQuery, post id, username, text, timestamp, engagement counts, media URLs, and any reply or author fields — before you run anything at scale.
5. **Run or schedule it on Apify** — Copy the generated config into the backing Apify actor and start it, or set mode to monitor and create a schedule. The actor runs cookie-free and returns the dataset as JSON, CSV, or Excel; it is free to start, then pay-as-you-go.

## Example output

A fixed sample of the fields the threads-search-monitor actor returns — example data, not live results.

| username | text | likeCount | replyCount | matchedQuery |
| --- | --- | --- | --- | --- |
| jane.example | Tried three web scraping tools this week, the one with built-in retries saved me hours. | 214 | 31 | web scraping |
| omar.sample | Is anyone using the Threads API for scheduled posts yet? Curious about rate limits. | 96 | 44 | threads api |
| priya.placeholder | Hot take: most scraping projects fail on maintenance, not on the first version. | 388 | 57 | web scraping |
| alex.demo | Shipped a small tool that exports my saved posts to CSV. Link in bio. | 41 | 9 | threads api |
| maria.muster | What is your go-to stack for monitoring brand mentions? | 73 | 26 | web scraping |

## Ready-to-run actor input

```json
{
  "mode": "search",
  "sort": "top",
  "maxItems": 50
}
```

## Key facts

- Threads (Meta's X competitor at threads.com) surpassed 400 million monthly active users in Q3 2025, up from about 275 million at the end of 2024. (Source: Reported by TechCrunch and Meta, August 2025; cited across Threads statistics roundups.)
- Threads reached roughly 150 million daily active users in 2025, rising from the 100 million DAU Meta announced in December 2024. (Source: Social Media Today / eMarketer Threads coverage, October 2025.)
- Threads supports clickable, searchable topic tags (its version of hashtags), available to users worldwide, with one tag per post and support for multi-word phrases. (Source: Search Engine Land and TechCrunch coverage of Threads topic tags; verified June 2026.)
- Meta's official Threads API keyword_search endpoint requires authentication and is rate-limited to about 2,200 queries per user in a rolling 24-hour period; the backing actor instead reads public Threads cookie-free. (Source: Meta for Developers Threads API documentation; actor README.)
- The backing Apify actor is free to start, then pay-as-you-go via Apify platform credits, with the first 10 chargeable events free once per Apify account (a lifetime allowance, not per run). (Source: From the actor's Apify Store listing and pay-per-event configuration.)

## FAQ

### How is this different from the Threads profile search page?

The threads-profile-search page targets a specific account: you give it a username and it returns that user's profile and recent posts. This page is the opposite starting point — you give it a keyword or hashtag and it finds posts across Threads that match those terms, regardless of who posted them. It also adds monitor mode, which re-runs a saved search on a schedule and returns only new matching posts. Use profile search when you know the account; use this when you are tracking a topic, brand, or tag.

### Does Threads have a public search, and is there an official API?

Threads (Meta's X competitor at threads.com) supports searching public posts and topic tags on its public web. Meta also ships an official Threads API with a keyword_search endpoint, but that path requires OAuth login and is rate-limited (around 2,200 queries per user in a rolling 24 hours), and it is oriented around an authenticated app context. The backing actor instead reads the public Threads web cookie-free, so you do not need a token or login. Logged-in search on Threads itself may surface a fuller set, but public search returns real results.

### What are the search, hashtag, and monitor modes?

Search mode takes keywords or phrases and returns matching public posts. Hashtag mode takes topic tags (Threads' version of hashtags) and pulls that tag's feed. Monitor mode is for scheduled runs: it stores a watermark of what it has already seen and, on each new run, returns only posts that have appeared since the last run for your saved search. Monitor is what turns a one-off search into ongoing brand monitoring, lead-gen, or trend tracking.

### Does this page return live Threads results in my browser?

No. It is a query builder. You choose the mode, enter your keywords or hashtags, set limits, and preview a fixed example of the output shape so you know the dataset structure. A browser cannot fetch threads.com results directly because the page is not CORS-open to other sites. You copy the generated config into the backing Apify actor, which executes the scrape server-side and returns the dataset as JSON, CSV, or Excel.

### What does each result record contain?

Post records include the matched query, post id, username, full name, post text, timestamp, engagement counts (likes, replies, reposts, quotes), media type and media URLs, and the post URL. When reply trees are enabled, reply records add a depth and a parent post id. When contact extraction is enabled, author records add parsed emails, phone numbers, and bio links. A recordType field labels each row as a post, reply, or author.

### Can it extract author contact details and resolve linktrees?

Optionally, yes. Turn on contact resolution and the actor parses public bios for emails and phone numbers and collects bio links — useful for lead generation from people posting about your niche. Linktree resolution follows Linktree, Beacons, or Stan links from the bio to surface the destinations behind them. Both are opt-in because they add per-author processing and, on the actor, are priced as separate events. Only scrape and use public contact data in line with applicable terms and privacy law.

### How much does the backing actor cost?

The actor is free to start, then pay-as-you-go using Apify platform credits on a pay-per-event model, and your first 10 chargeable events are free once per Apify account (a lifetime allowance, not per run, and it does not apply to repeat monitor runs). Current per-event pricing: $0.01 per run start, $0.0035 per surfaced search result, $0.0015 per fetched reply, $0.01 per monitor delta (new post detected), and $0.02 per unique author for the optional bio-contact extraction. Once the free allowance is used, a 50-post search runs roughly $0.19. Check the Apify listing for current pricing.

### How do I run this on a schedule for monitoring?

Build a search or hashtag config here, then on Apify set the actor's mode to monitor and create a schedule (for example hourly or daily). On each run, monitor mode compares against its stored watermark and writes only new matching posts to the dataset, so you get an incrementally updated feed instead of re-fetching everything. Pair it with Apify integrations to push new matches to Slack, a webhook, or a sheet for live brand or trend alerts.

### Is scraping Threads search results legal?

Scraping publicly available web data is generally treated as lawful in the US — the Ninth Circuit's hiQ v. LinkedIn ruling held that scraping public web data does not violate the CFAA. However, Meta's Terms of Use restrict automated collection, and GDPR or similar laws apply when you process personal data of EU residents, which is especially relevant if you extract author contacts. Scrape only public data, keep request rates reasonable, and review the relevant terms before commercial use. This is not legal advice.

### What are the coverage limits of cookie-free public search?

Public, cookie-free search reads what Threads serves to anonymous visitors, so it does not deep-paginate an unlimited archive — set realistic per-query caps rather than expecting an exhaustive backfill of every historical post for a term. Logged-in or official-API search may surface a fuller set. Private accounts are out of scope, and very deep nested reply chains can be partial. The actor is honest about these bounds; use monitor mode going forward to capture new posts reliably rather than trying to scrape the entire past.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [LinkedIn profile scraper](https://datatooly.xyz/linkedin-profile-lookup/)
- [Threads profile scraper](https://datatooly.xyz/threads-profile-search/)
- [Reddit search tool](https://datatooly.xyz/reddit-search-builder/)
- [Telegram channel scraper](https://datatooly.xyz/telegram-channel-search/)
