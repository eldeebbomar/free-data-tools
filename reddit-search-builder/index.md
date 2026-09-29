# Search Reddit by keyword or subreddit — and export it clean

> Reddit keyword search means finding every Reddit post or comment that mentions a term, optionally scoped by subreddit, author, title, or date using operators like subreddit:, author:, and "exact phrase". This free builder writes a ready-to-run export input and shows the clean output shape you'll get. Reddit's JSON is CORS-blocked in browsers, so an honest export has to run server-side, in a scraper like the Reddit Scraper actor.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Social & Community](https://datatooly.xyz/category/social-community/)
- URL: https://datatooly.xyz/reddit-search-builder/
- Backing Apify actor: [reddit-scraper-pro](https://apify.com/constructive_calm/reddit-scraper-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Scrape Reddit Without the API (After the 2023 Price Changes)](https://datatooly.xyz/guides/scrape-reddit-without-api/)

Compose a precise Reddit query as a simple list of targets — a keyword, r/subreddit, r/subreddit keyword, u/user or any Reddit link, one per entry — with sort and time range, and see an example of the structured posts the actor returns: title, subreddit, score, comment count, author, URL. Free to set up; export at scale with the actor.

## Key takeaways

- Reddit keyword search finds posts and comments containing a term; advanced operators (subreddit:, author:, title:, selftext:, flair:, plus AND/OR/NOT and quoted phrases) narrow it precisely.
- Reddit's .json endpoints send no CORS header for third-party sites (verified with a direct browser probe), so no honest in-browser live fetch is possible.
- Reddit's built-in search caps recall at roughly 250 results per query and indexes comments weakly, so it misses posts that genuinely exist.
- Pushshift, the long-standing free Reddit archive, was restricted to Reddit-verified subreddit moderators for moderation use only after the 2023 API changes.
- Reddit's official Data API free tier allows ~100 requests/minute for OAuth apps (10/min unauthenticated) and prohibits commercial use; commercial access requires a paid enterprise contract.
- This free tool builds the run input and previews the exact schema; it does not fake a live fetch. The Reddit Scraper actor then exports the full result set to CSV/JSON at $0.0025 per post, billed from the first item.

## How it works

### 1. List your targets

Each entry is auto-detected: plain text is a keyword search across Reddit, r/name is a subreddit feed, r/name words searches inside one subreddit, u/name pulls a user's posts and comments, and any Reddit post or search link works too. Quote exact phrases. The builder emits a valid run input instantly.

### 2. Preview the structured posts

The sample shows the real field names the actor returns: title, subreddit, score, numComments, author, createdAt, url and body — ready for analysis, not a screenshot.

### 3. Export at scale

The Reddit Scraper actor handles pagination, comment threads for post links, a postedAfter date cut-off and an onlyNew switch for scheduled runs that return just the posts published since the last run — the parts that break when you DIY it.

## How to use it

1. **Enter your keyword** — Type the term or exact phrase you want to find on Reddit. Wrap multi-word phrases in quotes (e.g. "customer churn") so the query matches the phrase, not loose words.
2. **Scope and refine with operators** — Optionally add a subreddit (subreddit:saas), an author (author:username), restrict to titles (title:) or post bodies (selftext:), and combine terms with AND/OR/NOT. Keyword entries run through Reddit's own search, so these operators work inside them; to stay inside one community, start the entry with r/name.
3. **Preview the output shape** — Review the sample schema the tool displays: title, subreddit, author, score, numComments, createdAt, url and body are the actor's real field names. It is a fixed example of the shape; no live fetch is faked.
4. **Copy your run input** — Copy the finished run input (JSON), or paste the same lines into the actor's Targets field.
5. **Run the export for clean CSV/JSON** — Open the Reddit Scraper actor, paste the input and run it, then download the dataset as CSV or JSON. Pagination is handled for you, so the export isn't truncated to a single 25-post page.

## Example output

A fixed sample of the fields the reddit-scraper-pro actor returns — example data, not live results.

| title | subreddit | score | numComments |
| --- | --- | --- | --- |
| What's everyone using for offshore/remote recruiting in 2026? | recruiting | 412 | 187 |
| We tried 6 'Notion alternatives' so you don't have to — honest writeup | productivity | 2840 | 503 |
| Is anyone actually getting ROI from buying-intent data tools? | sales | 318 | 142 |
| Best way to monitor a keyword across multiple subreddits? | DataHoarder | 596 | 98 |
| Reddit API pricing killed my side project — what are people doing now? | webdev | 1733 | 421 |

## Ready-to-run actor input

```json
{
  "targets": [
    "r/technology",
    "web scraping"
  ],
  "sort": "auto",
  "timeFilter": "all",
  "maxPostsPerTarget": 25,
  "maxItems": 50
}
```

## Key facts

- Reddit's .json endpoints are blocked by CORS in browsers (no Access-Control-Allow-Origin for third-party origins), so a web page on another domain cannot read them directly. (Source: Verified directly with a browser CORS probe while building the Reddit Scraper actor (2026); documented in the author's build notes.)
- old.reddit.com still serves public subreddit feeds, search results, user pages and comment threads without login or cookies, but in 2026 it began login-walling ordinary browser user agents, so reliable collection now has to run server-side. (Source: Observed while maintaining the Reddit Scraper actor (September 2026); recorded in the author's reference notes.)
- Reddit's built-in search returns at most about 250 results per query with no deeper pagination, and weakly indexes comments, causing it to miss posts that exist. (Source: Widely documented Reddit search/listing cap (web research); consistent with Reddit Help's stated relevance-ranked search behavior.)
- Pushshift, cited in over 1,700 scholarly articles, was restricted after Reddit's 2023 API changes to Reddit-verified subreddit moderators for moderation use only. (Source: Reddit Help Pushshift Access Request page and Independent Tech Research letter (web research).)
- Reddit's official Data API free tier permits ~100 requests/minute for OAuth apps and 10/minute unauthenticated, prohibits commercial use, and requires a paid contract for commercial/high-volume access. (Source: Reddit Data API terms and 2023-2025 pricing reporting (web research); exact commercial rates are negotiated, not publicly listed.)
- The Reddit Scraper actor charges $0.0025 per post fetched ($0.0008/comment, $0.003/search result, $0.004/user-history item, $0.0025/monitor delta), billed from the first item, and takes one targets list that auto-detects keywords, subreddits, subreddit searches, users and post links. (Source: Live Apify API pricing and input schema for constructive_calm/reddit-scraper-pro (author's own actor), build 0.3.3, checked 2026-09-29.)

## FAQ

### How do I search Reddit for a specific keyword across all subreddits?

Use reddit.com/search/?q=YOUR_KEYWORD, or the search bar. For precision add operators: wrap exact phrases in quotes, use subreddit:name to scope a community, author:username for one poster, title: to match only titles, and selftext: for post bodies. Reddit also supports AND, OR, and NOT (case-sensitive). This page explains each operator, and the builder turns your keywords into a ready-to-run export input.

### Why does Reddit search miss posts I know exist?

Reddit's search prioritizes relevance and recency over completeness, indexes comments weakly, hides mature content behind a default Safe Search filter, and caps results at roughly 250 per query with no deeper pagination. Old or low-engagement posts often never surface. For exhaustive recall you must paginate the source directly and collect comments separately, which a dedicated scraper does.

### Can I scrape Reddit without using the official API?

Yes. old.reddit.com serves public subreddit feeds, search results, user pages and comment threads with no login. The Reddit Scraper actor reads those public pages server-side with rotating proxies (no OAuth app, no API key), then exports clean CSV/JSON. The free builder here only constructs the run input and previews the schema.

### Why can't this free tool show me live Reddit results in the browser?

Honesty matters: Reddit's .json endpoints send no Access-Control-Allow-Origin header for third-party origins, so browsers block the request (CORS). That was verified directly with a browser probe. So the tool builds your run input and shows a real sample output shape instead of faking a live fetch.

### What replaced Pushshift for Reddit data?

After Reddit's 2023 API policy changes, Pushshift access was restricted to Reddit-verified subreddit moderators for moderation use only, ending its role as a free public archive used by 1,700+ scholarly papers. The practical replacements are Reddit's paid official Data API or a scraper that reads Reddit's public pages directly, like the Reddit Scraper actor.

### How do I export Reddit posts to CSV?

The free builder shows the exact columns you'll get (title, subreddit, author, score, upvoteRatio, numComments, createdAt, url, body, flair). To produce the file, put your keyword or r/subreddit in the Reddit Scraper actor's targets list, run it, and download the dataset as CSV (or JSON, or pull it from the dataset API). It handles pagination so the export is the full set, not a truncated 25-row page.

### Is scraping Reddit legal?

Scraping publicly visible pages is generally permissible, but Reddit's User Agreement restricts automated access and commercial reuse, and a 2025 Reddit lawsuit against Anthropic shows Reddit actively enforces its terms. Respect rate limits and robots directives, avoid republishing personal data, and get counsel for commercial use. This is general information, not legal advice.

### How much does the Reddit API cost now?

Reddit's Data API keeps a free tier (~100 requests/minute per OAuth client, 10/min unauthenticated) for non-commercial use, but commercial access requires a paid contract; reported enterprise rates start around $0.24 per 1,000 requests with thousands-per-month minimums. For predictable per-result cost with no OAuth setup, the Reddit Scraper actor charges $0.0025 per post fetched, billed from the first item.

### Can I monitor a keyword on Reddit for new mentions?

Yes. Turn on the Reddit Scraper actor's onlyNew option and schedule it: the first run saves a baseline, and every later run returns only posts published since the previous run, tracked separately for each subreddit and keyword line. Free tools like F5Bot email keyword alerts, but for structured, exportable, recurring data feeds for brand and social-listening workflows a scraper is more complete.

### What's the difference between searching a subreddit and searching all of Reddit?

An all-of-Reddit search (reddit.com/search) scans every public community for your term; a subreddit search (reddit.com/r/name/search with restrict_sr=on) limits results to that one community. Scoping to a subreddit usually returns more relevant, less noisy results. In the builder, a plain keyword searches all of Reddit, while an entry like r/saas churn searches inside that one subreddit.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [LinkedIn profile scraper](https://datatooly.xyz/linkedin-profile-lookup/)
- [Threads profile scraper](https://datatooly.xyz/threads-profile-search/)
- [Threads keyword monitor](https://datatooly.xyz/threads-keyword-monitor/)
- [Telegram channel scraper](https://datatooly.xyz/telegram-channel-search/)
