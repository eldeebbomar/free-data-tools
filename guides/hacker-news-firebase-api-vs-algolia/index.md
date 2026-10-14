# Hacker News Firebase API vs Algolia: Which One to Use

> HN's official Firebase API (topstories, item, user) vs the Algolia search API: endpoints, rate limits, freshness and speed, tested side by side in Python.

- URL: https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search Hacker News by keyword — live, with points and comments](https://datatooly.xyz/hacker-news-search/)
- Tags: api, python, webdev, datascience

Use the official Firebase API (`https://hacker-news.firebaseio.com/v0/`) for the front-page ranking (`topstories`), live lists and exact item lookups. Use the Algolia API (`https://hn.algolia.com/api/v1/`) for anything you need to search or filter by keyword, author, points or date. Firebase has no search and returns IDs you fetch one by one. Algolia returns full records in one call.

Both are free, need no key, and send `Access-Control-Allow-Origin: *`. I ran the same tasks through both on 2026-10-14. Here is how they differ.

## Side by side

| | Firebase (official) | Algolia (HN Search) |
|---|---|---|
| Base URL | `https://hacker-news.firebaseio.com/v0/` | `https://hn.algolia.com/api/v1/` |
| Docs | [HackerNews/API on GitHub](https://github.com/HackerNews/API) | [HN Search API page](https://hn.algolia.com/api) |
| Run by | Hacker News, on Firebase | Algolia |
| Search, filters | None | Full-text query, `tags`, `numericFilters` |
| Front-page ranking | `topstories`, in rank order | `tags=front_page`: the same set, not in rank order |
| Response shape | Lists of IDs, then one item per request | Full hits, up to 1,000 per request |
| Comment trees | `kids` IDs only; walk them yourself | `/items/{id}` returns the nested tree |
| Deleted and dead items | Returned, flagged `deleted` / `dead` | Not returned |
| Rate limit | "There is currently no rate limit." | "10,000 per hour" per IP |
| Field names | `by`, `score`, `time`, `descendants`, `kids` | `author`, `points`, `created_at_i`, `num_comments`, `children` |

## Firebase endpoints

Every path ends in `.json`. Without it, the server answered HTTP 301.

| Endpoint | Returns | Count on 2026-10-14 |
|---|---|---|
| `/v0/topstories.json` | Front-page ranking, including jobs | 500 IDs (docs: up to 500) |
| `/v0/newstories.json` | Newest stories | 500 IDs (docs: up to 500) |
| `/v0/beststories.json` | Best stories | 200 IDs |
| `/v0/askstories.json` | Latest Ask HN | 22 IDs (docs: up to 200) |
| `/v0/showstories.json` | Latest Show HN | 177 IDs (docs: up to 200) |
| `/v0/jobstories.json` | Latest jobs | 31 IDs (docs: up to 200) |
| `/v0/item/{id}.json` | One story, comment, job, poll or poll option | |
| `/v0/user/{id}.json` | `id`, `created`, `karma`, `about`, `submitted` | Usernames are case-sensitive: `PG` returned `null` |
| `/v0/maxitem.json` | The highest item ID | 50090563 at the time |
| `/v0/updates.json` | `items` and `profiles` that changed recently | 97 items, 26 profiles |

The item fields, per the official docs: `id`, `deleted`, `type`, `by`, `time`, `text`, `dead`, `parent`, `poll`, `kids`, `url`, `score`, `title`, `parts` and `descendants`. The docs say `kids` are "in ranked display order" and `descendants` is "the total comment count" of a story or poll. Only `id` is guaranteed; a field that doesn't apply is absent, not `null`.

Firebase also accepts its REST query parameters. `topstories.json?orderBy="$key"&limitToFirst=3` returned only the first three IDs, and `?print=pretty` indents the output.

## Same task, both APIs

Fetching the current front page:

```python
import time
from concurrent.futures import ThreadPoolExecutor

import requests

FB = "https://hacker-news.firebaseio.com/v0"
ALGOLIA = "https://hn.algolia.com/api/v1"
s = requests.Session()


def fb(path):
    r = s.get(f"{FB}/{path}.json", timeout=30)
    r.raise_for_status()
    return r.json()  # a missing item is HTTP 200 with the body `null`


# Official API: the ranked list, then one request per story.
t0 = time.time()
ids = fb("topstories")[:30]
with ThreadPoolExecutor(10) as ex:
    stories = [x for x in ex.map(lambda i: fb(f"item/{i}"), ids) if x]
print(f"Firebase: {len(stories)} stories in {time.time() - t0:.1f}s ({len(ids) + 1} requests)")
for rank, st in enumerate(stories[:3], 1):
    print(f"  #{rank} {st['score']} pts, {st.get('descendants', 0)} comments: {st['title']}")

# Algolia: one request for the stories on the front page now (not in rank order).
t0 = time.time()
hits = s.get(f"{ALGOLIA}/search", params={"tags": "front_page", "hitsPerPage": 50}, timeout=30).json()["hits"]
print(f"Algolia front_page: {len(hits)} stories in {time.time() - t0:.1f}s (1 request)")
print(f"  same IDs as Firebase top 30: {len({int(h['objectID']) for h in hits} & set(ids))}")

# Firebase list endpoints and how many IDs each returned today.
for name in ["topstories", "newstories", "beststories", "askstories", "showstories", "jobstories"]:
    print(f"{name:<12} {len(fb(name))} ids")
```

Output on 2026-10-14:

```text
Firebase: 30 stories in 14.2s (31 requests)
  #1 524 pts, 211 comments: Iosevka is an open-source, sans-serif and slab-serif monospace font
  #2 25 pts, 3 comments: Submarine cable resilience
  #3 134 pts, 39 comments: Pg_vectorsearch: An index that is faster than pgvector's IVFFlat and HNSW
Algolia front_page: 30 stories in 3.0s (1 request)
  same IDs as Firebase top 30: 28
topstories   500 ids
newstories   500 ids
beststories  200 ids
askstories   22 ids
showstories  177 ids
jobstories   31 ids
```

Request times vary a lot from run to run. In an earlier test the same thread pool fetched 200 Firebase items in 4.4 seconds. The shape is what matters: Firebase is one request per item, and Algolia is one request per page of up to 1,000 items.

The two front pages overlapped on 28 of 30 IDs in this run and on 29 of 30 in an earlier one. The front page changes from minute to minute, and the two requests weren't simultaneous. If you need the exact ranking, `topstories` is the source: it's ordered, and `front_page` isn't.

## Freshness

On 2026-10-14 the newest item in Algolia's `/search_by_date` had the same ID as Firebase's `maxitem`, 27 seconds after it was posted. Points and comment counts for the five top stories matched exactly between the two APIs. On that day Algolia was effectively live. Firebase is still the source of truth: Algolia indexes what Firebase publishes, so if the two ever disagree, trust Firebase.

## Rate behaviour

- **Firebase:** the README says "There is currently no rate limit." That's not an invitation to hammer it. Use a small thread pool, as above, and cache items that no longer change (old stories and comments).
- **Algolia:** the API page says "We are limiting the number of API requests from a single IP to 10,000 per hour." That's about 2.7 requests per second, sustained. Because one request can return 1,000 hits, you rarely need that many.
- **Neither publishes an error format for throttling.** Back off and retry on 429 and 5xx.

## Which one to use

| Task | Use |
|---|---|
| Front page in rank order | Firebase `topstories` |
| New, Ask, Show or job lists as HN shows them | Firebase list endpoints |
| Search by keyword, author, domain or points | Algolia `/search` |
| Everything posted between two dates | Algolia `/search_by_date` with `created_at_i` |
| A whole comment thread fast | Algolia `/items/{id}` |
| A complete thread including removed comments | Firebase, walking `kids` |
| A user's karma and submissions | Firebase `/user/{id}` (`submitted` lists every item ID); Algolia `/users/{name}` returns only karma and about |
| Watching for changes | Firebase `/updates` or `maxitem` |

Most real projects use both. Find IDs with Algolia, then read the authoritative item from Firebase when it matters.

## Related guides for this API

- [HN Algolia API reference](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/).
- [Get all comments for a Hacker News story](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/), which compares all three ways of reading a thread.
- [Search Hacker News by date range or points](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/).
- [The Hacker News Search API: free, no key](https://datatooly.xyz/guides/hacker-news-search-api/).

## Do it without code

The free [Hacker News search tool](https://datatooly.xyz/hacker-news-search/) runs Algolia searches live in your browser: keyword, type (story, comment, Show HN, Ask HN), relevance or date order, and a minimum score.

## At scale

The [Hacker News Scraper actor](https://apify.com/constructive_calm/hacker-news-scraper?fpr=v77kxu) on Apify combines both APIs. Its list modes (top, new, best, ask, show and job) read the Firebase rankings, its search mode uses Algolia, and it can attach comment trees, author karma, and filters on score, comments, date and domain. It also parses the monthly "Who is hiring?" thread into job rows. It exports JSON, CSV or Excel, and it's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. Both APIs work fine without them.*

Sources: [Hacker News API on GitHub (official)](https://github.com/HackerNews/API), [HN Search API](https://hn.algolia.com/api), and live responses from both APIs on 2026-10-14.

## Quick answers

### Where is the official Hacker News API documentation?

The official Hacker News API is documented in the `HackerNews/API` repository on GitHub. Its base URL is `https://hacker-news.firebaseio.com/v0/`, with endpoints such as `/item/{id}.json`, `/user/{id}.json`, `/maxitem.json`, `/topstories.json`, `/newstories.json`, `/beststories.json`, `/askstories.json`, `/showstories.json`, `/jobstories.json` and `/updates.json`.

### How many stories does the Hacker News topstories endpoint return?

Up to 500 IDs, according to the official docs; `newstories` also returns up to 500, and `askstories`, `showstories` and `jobstories` up to 200 each. On 2026-10-14 the endpoints returned 500 (top), 500 (new), 200 (best), 22 (ask), 177 (show) and 31 (job) IDs. They are IDs only: fetch each with `/v0/item/{id}.json`.

### Does the Hacker News API have a rate limit?

The official Firebase API's README says "There is currently no rate limit." The Algolia search API, a separate service, says it limits each IP to 10,000 requests per hour.

### Can I search Hacker News with the Firebase API?

No. The Firebase API has no search, keyword or filter endpoint, only lists of IDs and lookups by ID. To search by keyword, author, points or date, use the Algolia API at `https://hn.algolia.com/api/v1/search`.

## Related guides

- [The Hacker News Search API: Free, No-Key, and Surprisingly Powerful](https://datatooly.xyz/guides/hacker-news-search-api/)
- [HN Algolia API Reference: Search, Tags, Filters, Limits](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/)
- [Get All Comments for a Hacker News Story with the API](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/)
- [Search Hacker News by Date Range or Points (API)](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
