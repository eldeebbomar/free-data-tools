# Search Hacker News by Date Range or Points (API)

> Find Hacker News stories between two dates or above a points threshold with the free Algolia API, and get past the 1,000-result cap. Tested Python and JS.

- URL: https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search Hacker News by keyword — live, with points and comments](https://datatooly.xyz/hacker-news-search/)
- Tags: python, javascript, api, datascience

To search Hacker News by date, call `https://hn.algolia.com/api/v1/search_by_date` with `numericFilters=created_at_i>=START,created_at_i<END` in Unix seconds. To filter by score, add `points>100` to the same parameter, comma-separated. Use `/search` instead when you want the highest-scoring stories first. No API key is needed. One query returns at most 1,000 hits, so split long ranges.

Every example below ran against the live API on 2026-10-14. For the full parameter list, see the [HN Algolia API reference](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/).

## The filters you need

| Goal | Parameters |
|---|---|
| Posted in September 2026 (UTC) | `numericFilters=created_at_i>=1788220800,created_at_i<1790812800` |
| At least 100 points | `numericFilters=points>=100` |
| Busy discussions | `numericFilters=num_comments>=200` |
| Both | `numericFilters=points>=100,num_comments>=200` (comma = AND) |
| Either | `numericFilters=(points>5000,num_comments>4000)` (parentheses = OR) |
| Stories only | `tags=story` |
| Show HN or Ask HN | `tags=show_hn` or `tags=ask_hn` |
| Newest first | the `/search_by_date` endpoint |
| Highest score first | the `/search` endpoint with an empty `query` |

`created_at_i` is in seconds, not milliseconds, and in UTC. The official page's own example is `search_by_date?tags=story&numericFilters=created_at_i>X,created_at_i<Y`.

**Which endpoint sorts how.** The same September window gave a different first page on each endpoint. `/search_by_date` returned stories from the last minutes of the window, each with a handful of points. `/search` returned the month's biggest stories. The official page says `/search` is "sorted by relevance, then points, then number of comments", and with no query, relevance is a tie, so points decide.

## The top stories of a month, with curl

```bash
# Top 5 stories of September 2026 (UTC) by points
curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i%3E%3D1788220800,created_at_i%3C1790812800&hitsPerPage=5&attributesToRetrieve=title,points,created_at" \
  | python -c "import sys, json; [print(h['points'], h['created_at'][:10], h['title']) for h in json.load(sys.stdin)['hits']]"
```

```text
2391 2026-09-15 Show HN: An e-ink frame that hears birds and draws them as 1800s illustrations
2301 2026-09-04 Discovery of a new OpenAI agent message board
2279 2026-09-03 GPT-6 Astra
2230 2026-09-03 .name Termination
2054 2026-09-08 Navier-Stokes – Tristan Buckmaster [pdf]
```

`%3E%3D` is `>=` and `%3C` is `<`. To get the timestamps in Python, use `int(datetime(2026, 9, 1, tzinfo=timezone.utc).timestamp())`; that gives `1788220800`.

## The last 7 days, in JavaScript

The API sends `Access-Control-Allow-Origin: *`, so this works in a browser as well as in Node 18+.

```js
// Stories from the last 7 days with 300+ points, highest first.
const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
const params = new URLSearchParams({
  tags: "story",
  numericFilters: `created_at_i>${since},points>=300`,
  hitsPerPage: "5",
});
const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`);
const { hits, nbHits } = await res.json();
console.log(`${nbHits} stories`);
for (const h of hits) console.log(h.points, h.created_at.slice(0, 10), h.title);
```

Output on 2026-10-14:

```text
98 stories
2123 2026-10-07 Margaret Hamilton has died
1440 2026-10-09 Triple-A Minesweeper
1407 2026-10-13 Gemini 4 Argon
1384 2026-10-09 Cloudflare acquires Deno
1134 2026-10-08 Why isn't the industry freaking out about DeepSeek 4.1 Flash?
```

## More than 1,000 results: split the window

A single query stops at 1,000 hits. Past that, the API returns no hits and the message "you can only fetch the 1000 hits for this query". The fix is to cut the date range into slices that each hold 1,000 or fewer and join them. This function does it automatically by halving any window that is too big:

```python
import time
from datetime import datetime, timezone

import requests

API = "https://hn.algolia.com/api/v1/search_by_date"
s = requests.Session()


def ts(day):
    """'2025-01-01' -> Unix seconds (UTC)."""
    return int(datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())


def get(params, attempts=4):
    for i in range(attempts):
        r = s.get(API, params=params, timeout=30)
        if r.status_code == 200:
            return r.json()
        time.sleep(2 ** i)  # 1, 2, 4 s on 429/5xx
    r.raise_for_status()


def search_window(tags, start, end, extra="", query=""):
    """Every hit with start <= created_at_i < end. Splits the window while a
    slice holds more than 1,000 hits, because deeper pages are refused."""
    nf = f"created_at_i>={start},created_at_i<{end}" + (f",{extra}" if extra else "")
    first = get({"query": query, "tags": tags, "numericFilters": nf, "hitsPerPage": 1000})
    if first["nbHits"] <= 1000:
        return first["hits"]
    mid = (start + end) // 2
    return (search_window(tags, start, mid, extra, query)
            + search_window(tags, mid, end, extra, query))


if __name__ == "__main__":
    t0 = time.time()
    hits = search_window("show_hn", ts("2025-01-01"), ts("2026-01-01"), extra="points>=100")
    ids = {h["objectID"] for h in hits}
    print(f"{len(hits)} Show HN posts with 100+ points in 2025 "
          f"({len(ids)} unique) in {time.time() - t0:.1f}s")
    for h in sorted(hits, key=lambda h: -h["points"])[:5]:
        print(h["points"], h["created_at"][:10], h["title"])

    # A window that needs splitting: every story posted in one week.
    t0 = time.time()
    week = search_window("story", ts("2026-09-01"), ts("2026-09-08"))
    print(f"{len(week)} stories posted 2026-09-01..07 in {time.time() - t0:.1f}s")
```

Output on 2026-10-14:

```text
742 Show HN posts with 100+ points in 2025 (742 unique) in 3.5s
3346 2025-12-09 Show HN: Gemini Pro 3 imagines the HN front page 10 years from now
3237 2025-01-22 Show HN: I made an open-source laptop from scratch
1581 2025-02-26 Show HN: I got laid off from Meta and created a minor hit on Steam
1557 2025-12-20 Show HN: Jmail – Google Suite for Epstein files
1539 2025-06-27 Show HN: I'm an airline pilot – I built interactive graphs/globes of my flights
7020 stories posted 2026-09-01..07 in 18.5s
```

The first query fit in one request. The second didn't: 7,020 stories in one week, so the function split the week into slices. As a check, I asked for each of the seven days separately; their `nbHits` added up to exactly 7,020, and every returned ID was unique and inside the window.

## Pitfalls

- **Half-open windows.** Use `>=` at the start and `<` at the end, as above. With `>=` and `<=` on both ends, an item posted exactly on a boundary second lands in two slices.
- **Trust `nbHits` only when it's exact.** For broad queries the response sets `exhaustiveNbHits: false`, and the count is an estimate. The splitting function only compares `nbHits` with 1,000 on narrow windows, where the counts I saw were exact.
- **`points` is current, not historical.** A story's points keep changing while it's active, and the filter uses the latest value. "Stories that had 100 points on day one" isn't something this API can answer.
- **A wrong field name fails silently.** `numericFilters=score>10` returned 0 hits and no error. The fields are `created_at_i`, `points` and `num_comments`.
- **Time zones.** Timestamps are UTC. "September" in New York starts four hours later than in UTC; build your boundaries in the time zone you mean.
- **Rate limit.** Splitting multiplies requests. The official limit is 10,000 per hour per IP, and the one-week split above used 17 requests.

## Related guides for this API

- [HN Algolia API reference](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/): all endpoints, tags and limits.
- [Get all comments for a Hacker News story](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/).
- [Hacker News Firebase API vs Algolia](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/).
- [The Hacker News Search API: free, no key](https://datatooly.xyz/guides/hacker-news-search-api/).

## Do it without code

The free [Hacker News search tool](https://datatooly.xyz/hacker-news-search/) runs these searches live in your browser. Type a keyword, choose stories, comments, Show HN or Ask HN, sort by relevance or date, and set a minimum score. The results are real, with points, comment counts, author and date.

## At scale

The [Hacker News Scraper actor](https://apify.com/constructive_calm/hacker-news-scraper?fpr=v77kxu) on Apify takes the same filters as inputs: a keyword, a date range in Unix seconds (`dateFromUnix`, `dateToUnix`), minimum score and comments, and a domain filter. It returns flat rows you can export as JSON, CSV or Excel, optionally with comment trees and author karma, and it runs on a schedule. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The scripts above use only the public API.*

Sources: [HN Search API (official page)](https://hn.algolia.com/api), [Algolia: numericFilters](https://www.algolia.com/doc/api-reference/api-parameters/numericFilters), and live responses from `hn.algolia.com/api/v1` on 2026-10-14.

## Quick answers

### How do I search Hacker News by date?

Use `https://hn.algolia.com/api/v1/search_by_date` with `numericFilters=created_at_i>=START,created_at_i<END`, where START and END are Unix timestamps in seconds (UTC). Add `tags=story` for stories only and `query=` for a keyword. Results come newest first.

### How do I find the top Hacker News stories of a month?

Call `/api/v1/search` (not `search_by_date`) with `tags=story` and a `created_at_i` window for the month, and leave `query` empty. `/search` ranks by relevance, then points, then comments, so with no query the highest-scoring stories come first.

### How do I search Hacker News for posts with more than 100 points?

Add `numericFilters=points>100` (URL-encoded as `points%3E100`) to `/api/v1/search` or `/api/v1/search_by_date`. Combine conditions with commas for AND, for example `points>100,num_comments>50`. The field is `points`; `score` silently returns nothing.

### Can I use Hacker News search with a date range on the website?

Yes. HN Search at `hn.algolia.com` has a date-range menu (last 24 hours, past week, past month, past year, or a custom range) and sorting by date or popularity. The API gives you the same filters with `created_at_i`, and no 1,000-result ceiling if you split the range.

## Related guides

- [The Hacker News Search API: Free, No-Key, and Surprisingly Powerful](https://datatooly.xyz/guides/hacker-news-search-api/)
- [HN Algolia API Reference: Search, Tags, Filters, Limits](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/)
- [Get All Comments for a Hacker News Story with the API](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/)
- [Hacker News Firebase API vs Algolia: Which One to Use](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
