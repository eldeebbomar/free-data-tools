# Search Hacker News by keyword — live, with points and comments

> The Hacker News search API is the public Algolia-powered endpoint at hn.algolia.com/api/v1, which full-text-searches every HN story, comment, Ask/Show HN and poll with no key and no auth. This page runs it live in your browser — type a keyword and get real matching stories with points, comments, author and date, plus tag, sort and minimum-points filters.

- Type: Live tool (fetches real data in your browser)
- Category: [Dev & Community](https://datatooly.xyz/category/dev-community/)
- URL: https://datatooly.xyz/hacker-news-search/
- Backing Apify actor: [hacker-news-scraper](https://apify.com/constructive_calm/hacker-news-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [The Hacker News Search API: Free, No-Key, and Surprisingly Powerful](https://datatooly.xyz/guides/hacker-news-search-api/)

Type a keyword and search Hacker News live, right here in your browser — real matching stories with points, comments, author, and date. Filter by type, sort by relevance or date, set a minimum score. Free, no login, no API key.

## Key takeaways

- This tool is genuinely live: it queries the public HN Algolia API directly from your browser (CORS-open, no key) and returns real, current results — not a cached sample.
- The HN search API has two endpoints: /search (sorted by relevance, then points, then comments) and /search_by_date (newest first). Both are free, no API key, no auth.
- Filter by tag (story, comment, ask_hn, show_hn, poll, front_page, author_X) and by numericFilters (points, num_comments, created_at_i Unix timestamp).
- Algolia's HN API has historically allowed on the order of ~10,000 requests/hour per IP and caps retrievable results at about 1,000 per query — fine for ad-hoc search, a wall for scale.
- Use the Firebase API for raw/real-time front-page and item data; use Algolia for keyword search and full comment trees — most projects combine both.
- For scale, monitoring, full nested comment trees, user profiles and the monthly Who-is-hiring parser, the Hacker News Scraper actor (free to start, then pay-as-you-go) handles pagination, retries and CSV/JSON/API export.

## How it works

### 1. Real Hacker News results, live

This searches the public HN Algolia API directly from your browser — the same index that powers hn.algolia.com — so what you see is live, not a fixed sample. Points, comment counts, author and date come straight from the API.

### 2. Filter the way researchers do

Scope to Stories, Comments, Ask HN or Show HN; sort by relevance or newest; set a minimum score to cut to front-page-worthy items. Great for tracking a launch, a competitor, or sentiment on a topic.

### 3. Go deep + at scale with the actor

The Hacker News Scraper actor adds 9 modes — top/new/best, full nested comment trees, a user's whole history, and an auto-parser for the monthly 'Who is hiring?' thread — plus date/score/domain filters and JSON/CSV/API export.

## How to use it

1. **Type your keyword** — Enter a search term in the box above — a product name, company, technology, or topic. The tool queries the public HN Algolia API directly from your browser the moment you submit.
2. **Pick a tag filter** — Narrow to stories, comments, Ask HN, or Show HN using the tag control. This maps to the API's tags parameter (story, comment, ask_hn, show_hn) so you only see the content type you care about.
3. **Choose relevance or date sort** — Switch between relevance (the /search endpoint, ranked by points and comments) and newest-first (the /search_by_date endpoint). Use date sort when you are monitoring fresh mentions.
4. **Set a minimum points floor** — Use the min-points filter to hide low-signal posts. This applies the API's numericFilters=points>N constraint so only stories above your threshold appear.
5. **Scale up with the actor** — When you need full comment trees, user profiles, the Who-is-hiring parser, or thousands of rows exported to CSV/JSON/API, switch to the Hacker News Scraper actor — free to start, then pay-as-you-go, with pagination and retries handled for you.

## Ready-to-run actor input

```json
{
  "mode": "search",
  "maxItems": 30
}
```

## Key facts

- The HN search API exposes two endpoints: /search (sorted by relevance, then points, then number of comments) and /search_by_date (most recent first). (Source: Documented behavior of hn.algolia.com/api/v1, confirmed via the cotera HN API guide and HN's own API docs.)
- The Algolia-powered HN API has historically allowed on the order of ~10,000 requests/hour per IP and caps retrievable results at about 1,000 per query. (Source: ~10,000/hour is a long-cited community/Algolia-staff figure on Hacker News (not an official SLA); the ~1,000-result retrievable cap is standard Algolia pagination behavior.)
- The HN search API requires no API key and no authentication for read-only search. (Source: Stated in the cotera HN API guide ('No auth, no API key, completely free') and matches the official hn.algolia.com/api docs.)
- Supported tag filters include story, comment, ask_hn, show_hn, poll, front_page, and author_USERNAME / story_ID prefixes. (Source: Listed in the official hn.algolia.com/api documentation and the cotera guide.)
- A typical monthly 'Ask HN: Who is hiring?' thread receives roughly 400 to 900 top-level job postings. (Source: Reported across multiple HN hiring-scraper write-ups; order-of-magnitude figure, varies month to month.)
- The Hacker News Scraper actor supports 9 modes and makes the first 50 chargeable events in every run free, on a pay-as-you-go model after that. (Source: From the actor's Apify Store listing (apify.com/constructive_calm/hacker-news-scraper).)

## FAQ

### Does the Hacker News search API require an API key?

No. The public HN search API, powered by Algolia at hn.algolia.com/api/v1, needs no API key and no authentication for read-only search. You can call /search or /search_by_date directly with a query string and tags. That is exactly what the live tool on this page does — it hits the endpoint from your browser with no credentials. For heavy or scheduled extraction you still need your own infrastructure for pagination, retries and rate-limit handling.

### What is the rate limit on the HN Algolia API?

The Algolia-powered HN search API has historically allowed about 10,000 requests per hour per IP, a figure cited by Algolia staff on Hacker News itself, and each request returns at most 1,000 hits. That is generous for interactive search but becomes a wall when you page through thousands of stories or comments. Tools that scale beyond it must rotate requests and respect throttling to avoid temporary blocks.

### How do I search Hacker News by keyword?

Call GET hn.algolia.com/api/v1/search?query=YOUR_KEYWORD for relevance-ranked results, or /search_by_date?query=YOUR_KEYWORD for newest-first. Add &tags=story to limit to stories, &tags=comment for comments, or &tags=ask_hn / show_hn for those threads. Add numericFilters=points>100 to set a floor. The live tool above wraps all of this in a form, so you can type a keyword and pick filters without writing any code.

### Is this tool actually live or just a sample?

It is genuinely live. The tool fetches results from the public HN Algolia API in your own browser at the moment you search, so what you see is the current index, including stories posted minutes ago. There is no cached snapshot and no fixed sample set. The HN endpoint returns permissive CORS headers, which is what allows a static page to call it directly client-side.

### What is the difference between the HN Firebase API and the Algolia API?

They serve different jobs. The official Firebase API (hacker-news.firebaseio.com) gives raw items and real-time front-page/new streams via server-sent events, but has no search. The Algolia API adds full-text search, tag filtering and numeric filters, and returns an item's full comment tree in one call. Most projects combine both: Algolia to find stories by keyword, then Algolia /items/:id to pull the whole discussion.

### Can I filter HN search by points, date, or author?

Yes. Use numericFilters to set thresholds: points>100, num_comments>50, or created_at_i ranges using Unix timestamps for date windows. Use the author_USERNAME tag to limit to one submitter (for example tags=story,author_pg). Combine tags with commas for AND logic and use comma-separated tags for AND and Algolia's array syntax for OR. The live tool above exposes tag, sort and minimum-points controls directly.

### How do I monitor Hacker News for keyword or brand mentions?

For one-off checks, run a keyword search here and sort by date. For continuous monitoring, you poll /search_by_date on a schedule and diff new objectIDs, or use the Hacker News Scraper actor's monitor-style modes with date and score filters and export to CSV/JSON/API. Free and paid alert services also exist (e.g. F5Bot for free email alerts); the actor route is the build-your-own option with full data ownership and structured export.

### How do I scrape the monthly 'Who is hiring?' thread?

The Ask HN: Who is hiring? thread posts on the first of each month and draws roughly 400 to 900 top-level job comments. You can fetch it via Algolia /items/:id to get the full comment tree, then parse each comment's first line (commonly Company | Role | Location | Remote). The Hacker News Scraper actor has a dedicated hiring_threads mode that returns the thread as structured job rows so you skip writing the parser yourself.

### What does the live tool give me versus the Hacker News Scraper actor?

The live tool answers a single keyword query instantly in your browser: matching stories with points, comments, author and date, plus tag, sort and min-points filters. The Hacker News Scraper actor is the scale path — 9 modes (top/new/best/ask/show/jobs/search/user/hiring_threads), full nested comment trees, user profiles, the Who-is-hiring parser, date/score/domain filters and CSV/JSON/API export. It is free to start, then pay-as-you-go, with the first 50 chargeable events in every run free.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [App Store top charts](https://datatooly.xyz/app-store-top-charts/)
- [Shopify product scraper](https://datatooly.xyz/shopify-store-products/)
- [SaaS pricing tracker](https://datatooly.xyz/saas-pricing-tracker-tool/)
