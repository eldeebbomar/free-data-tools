# HN Algolia API Reference: Search, Tags, Filters, Limits

> The Hacker News Algolia API in one page: /search vs /search_by_date, every tag, numericFilters, hitsPerPage, the 1,000-hit cap, /items and /users. Tested live.

- URL: https://datatooly.xyz/guides/hacker-news-algolia-api-reference/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search Hacker News by keyword — live, with points and comments](https://datatooly.xyz/hacker-news-search/)
- Tags: api, python, webdev, datascience

The Hacker News Algolia API is a free, keyless REST API at `https://hn.algolia.com/api/v1/`. Use `/search` for relevance order or `/search_by_date` for newest first. Filter with `tags` (story, comment, show_hn, ask_hn, author_NAME, story_ID) and `numericFilters` on `points`, `num_comments` and `created_at_i`. One query returns at most 1,000 hits.

This page is the reference I wanted when I built on it: every endpoint and parameter, what each one does, and the limits. Each example below was run against the live API on 2026-10-14. The official documentation is the [HN Search API page](https://hn.algolia.com/api), which is short; Algolia's general search parameters apply on top of it.

## The four endpoints

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /api/v1/search?query=...` | Hits sorted by relevance, then points, then number of comments | The official page gives that sort order. |
| `GET /api/v1/search_by_date?query=...` | Hits sorted newest first | Same parameters as `/search`. |
| `GET /api/v1/items/:id` | One item with its whole comment tree nested in `children` | A missing ID returns HTTP 404 with `{"error":"Not Found","status":404}`. |
| `GET /api/v1/users/:username` | `username`, `karma`, `about` | A missing user returned HTTP 500 (an HTML error page), not 404. |

Every response is JSON and the API sends `Access-Control-Allow-Origin: *`, so browser `fetch()` works without a proxy.

## Search parameters

| Parameter | Example | What it does |
|---|---|---|
| `query` | `query=sqlite` | Full-text search. Wrap a phrase in double quotes for an exact phrase: `"rust compiler"` matched 202 stories, against 1,068 for the two words unquoted. |
| `tags` | `tags=story` | Filters by type, author or story. See the next section. |
| `numericFilters` | `numericFilters=points>100` | Filters on `created_at_i`, `points` or `num_comments` with `<`, `<=`, `=`, `>`, `>=`. |
| `page` | `page=2` | Zero-based page number. |
| `hitsPerPage` | `hitsPerPage=100` | Defaults to 20. Values above 1,000 are cut to 1,000. |
| `restrictSearchableAttributes` | `restrictSearchableAttributes=url` | The official page's example for matching URLs only. |
| `attributesToRetrieve` | `attributesToRetrieve=title,points` | Algolia parameter. Trims each hit to those fields (plus `objectID` and `_highlightResult`). |
| `typoTolerance` | `typoTolerance=false` | Algolia parameter. Turns off fuzzy matching. |

The official page says "The complete list of search parameters is available in Algolia Search API documentation." The two Algolia parameters above are the ones I tested; others may be restricted by the index settings.

## Tags

The official list is `story`, `comment`, `poll`, `pollopt`, `show_hn`, `ask_hn`, `front_page`, `author_:USERNAME` and `story_:ID`. In practice you write `author_pg` and `story_8863`, with no colon.

| Tag | Matches | Tested |
|---|---|---|
| `story` | Submissions (including Show HN and Ask HN, which also carry `show_hn` or `ask_hn`) | yes |
| `comment` | Comments | yes |
| `show_hn`, `ask_hn` | Show HN and Ask HN posts | yes |
| `front_page` | Stories on the front page right now | 30 hits; 29 of them were also in the Firebase `topstories` top 30 at the same moment |
| `poll`, `pollopt` | Polls and poll options | yes |
| `author_pg` | Items by user `pg` | 10,723 items |
| `story_8863` | The story and every comment in its thread | 72 hits (1 story + 71 comments) |
| `job` | Job posts | Works, though it isn't in the official list |
| `launch_hn` | Launch HN posts | Works, though it isn't in the official list |

**Combining tags.** Commas mean AND. Parentheses mean OR. The official example: `tags=author_pg,(story,poll)` means author is pg AND (type is story OR poll).

```text
tags=story,author_pg          stories by pg              (699 hits)
tags=author_pg,(story,comment) stories or comments by pg (10,684 hits)
tags=comment,story_38309611   every comment in one thread (2,530 hits)
```

## numericFilters

The filterable fields are `created_at_i` (Unix seconds), `points` and `num_comments`. Commas mean AND. Parentheses mean OR, as with tags.

```bash
# Stories with more than 1,000 points: 2,684 hits
curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points%3E1000&hitsPerPage=3"

# At least 500 points AND at least 500 comments: 3,593 hits
curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points%3E%3D500,num_comments%3E%3D500"

# More than 5,000 points OR more than 4,000 comments: 7 hits
curl -s "https://hn.algolia.com/api/v1/search?tags=story&numericFilters=(points%3E5000,num_comments%3E4000)"
```

`%3E` is `>` and `%3D` is `=`. Python's `requests` and JavaScript's `URLSearchParams` encode these for you.

**Watch out:** a misspelled field doesn't raise an error. `numericFilters=score>10` returned HTTP 200 with 0 hits. HN's Firebase API calls the field `score`, but here it is `points`.

## The response

```json
{
  "hits": [ ... ],
  "nbHits": 60688,
  "page": 0,
  "nbPages": 500,
  "hitsPerPage": 2,
  "exhaustiveNbHits": false,
  "query": "rust",
  "params": "query=rust&tags=story&hitsPerPage=2&advancedSyntax=true&analyticsTags=backend",
  "processingTimeMS": 18
}
```

That was `query=rust&tags=story&hitsPerPage=2`. Note `advancedSyntax=true` in `params`: the server adds it, which is why quoted phrases work.

Fields in each hit:

| Field | Story | Comment | Notes |
|---|---|---|---|
| `objectID` | yes | yes | The HN item ID, as a string. |
| `title`, `url` | yes | | `url` is missing for Ask HN text posts. |
| `story_text` | Ask HN, text posts | | HTML. |
| `comment_text` | | yes | HTML. |
| `author`, `created_at`, `created_at_i` | yes | yes | `created_at_i` is Unix seconds. |
| `points`, `num_comments` | yes | | Null on comments. |
| `story_id`, `parent_id` | `story_id` | both | Comments also carry `story_title` and `story_url`. |
| `children` | yes | | IDs of the top-level replies only. |
| `updated_at` | yes | yes | When Algolia last refreshed the record. |
| `_tags`, `_highlightResult` | yes | yes | Tags, and the matched text wrapped in `<em>`. |

**Don't treat `nbHits` as a count when `exhaustiveNbHits` is false.** On 2026-10-14, `tags=comment` with no query reported 303,748 hits, while `tags=story` reported 45,522,013. HN has far more comments than stories, so both are estimates. With a narrow filter, `exhaustiveNbHits` came back `true` and the count matched the real total: a one-day window summed correctly across seven days.

## The 1,000-hit cap

`nbPages` never goes past what 1,000 hits allow. Asking for page 50 at 20 per page (hit 1,001 onward) returned HTTP 200, no hits, and this message:

```text
you can only fetch the 1000 hits for this query. You can extend the number of hits returned via the paginationLimitedTo index parameter or use the browse method.
```

You can't change `paginationLimitedTo` or use `browse` on someone else's index, so the fix is to narrow the query. Split it into `created_at_i` windows that each hold 1,000 hits or fewer. [Search Hacker News by date range or points](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/) has a script that splits windows automatically.

## Python: a small client

```python
import time
import requests

BASE = "https://hn.algolia.com/api/v1"
s = requests.Session()

def hn(path, **params):
    for attempt in range(4):
        r = s.get(f"{BASE}/{path}", params=params, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code == 404:
            return None
        time.sleep(2 ** attempt)  # 1, 2, 4 s on 429 or 5xx
    r.raise_for_status()

top = hn("search", tags="story", numericFilters="points>1000", hitsPerPage=3)
for h in top["hits"]:
    print(h["points"], h["num_comments"], h["title"])

latest = hn("search_by_date", query="sqlite", tags="comment", hitsPerPage=1)["hits"][0]
print(latest["created_at"], latest["story_title"])

print(hn("users/pg"))
print(hn("items/999999999"))
```

Output on 2026-10-14 (the comment line changes every few minutes):

```text
6015 436 Stephen Hawking has died
5771 967 A Message to Our Customers
5710 2530 OpenAI's board has fired Sam Altman
2026-10-14T15:01:57Z Strafe: A new open-source, E2E Encrypted, and federated alternative to Discord
{'about': 'Bug fixer.', 'karma': 157316, 'username': 'pg'}
None
```

With no `query`, `/search` puts the highest-scoring stories first, so it doubles as an "all-time top stories" endpoint.

## Limits and behaviour

| Topic | What I found |
|---|---|
| Rate limit | "10,000 per hour" per IP, from the official API page. |
| Authentication | None. |
| CORS | `Access-Control-Allow-Origin: *`. |
| Freshness | The newest item in `/search_by_date` had the same ID as Firebase's `maxitem`, 27 seconds after it was posted. Points and comment counts on the five top stories matched the Firebase API exactly. |
| Page size | Default 20, maximum 1,000. |
| Depth | 1,000 hits per query. |
| Missing user | HTTP 500, so treat a 500 from `/users/` as "maybe missing", not only as an outage. |

## Related guides for this API

- [The Hacker News Search API: free, no key](https://datatooly.xyz/guides/hacker-news-search-api/), the shorter introduction.
- [Get all comments for a Hacker News story](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/), for `/items` and the comment tree.
- [Hacker News Firebase API vs Algolia](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/), for which API to use when.
- [Search Hacker News by date range or points](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/), for queries past 1,000 hits.

## Do it without code

The free [Hacker News search tool](https://datatooly.xyz/hacker-news-search/) calls this API live from your browser. Type a keyword, pick a type (story, comment, Show HN, Ask HN), sort by relevance or date and set a minimum score. You get real results with points, comments, author and date, and no key.

## At scale

The [Hacker News Scraper actor](https://apify.com/constructive_calm/hacker-news-scraper?fpr=v77kxu) on Apify uses both official APIs. It has nine modes: top, new, best, ask, show and job lists, keyword search, a user's submissions, and the monthly "Who is hiring?" threads as job rows. It can attach comment trees and author karma, filter by score, comment count, date and domain, and export JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. Everything above works with the public API alone.*

Sources: [HN Search API (official page)](https://hn.algolia.com/api), [Algolia search API parameters](https://www.algolia.com/doc/api-reference/search-api-parameters), [Hacker News API (Firebase) on GitHub](https://github.com/HackerNews/API), and live responses from `hn.algolia.com/api/v1` on 2026-10-14.

## Quick answers

### What is HN Algolia?

HN Search, at `hn.algolia.com`, is the Hacker News search engine run by Algolia. Its public REST API lives at `https://hn.algolia.com/api/v1/` and has four endpoints: `/search`, `/search_by_date`, `/items/:id` and `/users/:username`. It needs no API key and sends `Access-Control-Allow-Origin: *`, so it also works from browser JavaScript.

### What is the HN Algolia API rate limit?

The official API page says: "We are limiting the number of API requests from a single IP to 10,000 per hour." It also says to contact Algolia support if you think your IP was blocked by mistake. There is no API key, so the limit is per IP.

### How do I get more than 1,000 results from the HN Algolia API?

You can't page past 1,000 hits for one query. `hitsPerPage` is capped at 1,000, and a request past that point returns no hits and the message "you can only fetch the 1000 hits for this query". Split the query into `created_at_i` time windows that each hold 1,000 hits or fewer, and combine the results.

### What is the difference between search and search_by_date on HN Algolia?

`/search` sorts by relevance, then points, then number of comments. `/search_by_date` sorts newest first. Both take the same parameters (`query`, `tags`, `numericFilters`, `page`, `hitsPerPage`).

## Related guides

- [The Hacker News Search API: Free, No-Key, and Surprisingly Powerful](https://datatooly.xyz/guides/hacker-news-search-api/)
- [Get All Comments for a Hacker News Story with the API](https://datatooly.xyz/guides/hacker-news-api-get-all-comments/)
- [Hacker News Firebase API vs Algolia: Which One to Use](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/)
- [Search Hacker News by Date Range or Points (API)](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
