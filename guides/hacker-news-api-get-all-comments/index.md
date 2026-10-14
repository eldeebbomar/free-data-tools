# Get All Comments for a Hacker News Story with the API

> Three ways to download every comment on a Hacker News thread: the Algolia item tree, the search index and the Firebase API. Tested Python, and what each misses.

- URL: https://datatooly.xyz/guides/hacker-news-api-get-all-comments/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search Hacker News by keyword — live, with points and comments](https://datatooly.xyz/hacker-news-search/)
- Tags: python, api, webscraping, datascience

To get every comment on a Hacker News story, request `https://hn.algolia.com/api/v1/items/{story_id}`. It returns the story with the full comment tree nested in `children`, in one call, with no key. It skips deleted and dead comments and every reply under them. For a complete set, use the search index (`tags=comment,story_{id}`) or walk the official Firebase API.

I tested all three methods on two threads on 2026-10-14: the 2007 Dropbox launch post (71 comments) and "OpenAI's board has fired Sam Altman" (2,530 comments). The counts don't agree, and the reason matters if you are building a dataset.

## Three methods compared

| Method | Requests | Big thread: comments returned | Time (big thread) | Gaps |
|---|---|---|---|---|
| Algolia `/items/{id}` | 1 | 2,450 | 1.8 s | No deleted or dead comments, and none of their replies |
| Algolia search, `tags=comment,story_{id}` | 1 per 1,000 comments, or more | 2,530 | 21.8 s | Flat list (rebuild the tree from `parent_id`), no deleted or dead items |
| Firebase `/v0/item/{id}.json` | 1 per comment | 2,734 items, 204 of them deleted or dead | 53.9 s with 16 threads | None; it's the source of truth |

The Firebase story reported `descendants: 2530`, and 2,734 items minus 204 deleted or dead is 2,530. So `descendants` (and Algolia's `num_comments`) counts live comments.

**Where the item tree loses comments.** The tree was 80 short. I checked every one of the 80: each was a live reply whose parent comment was deleted or dead. The tree prunes the whole branch at the removed comment. The search index had all 80. Asking `/items/38312257` for one of them directly worked too, so the data is there; it just isn't attached to the tree.

On small threads the difference is usually zero. The Dropbox thread has 71 live comments and the tree returned 71.

## What the item tree looks like

`GET https://hn.algolia.com/api/v1/items/8863` returns the story at the top, with the same fields on every node:

| Field | Story | Comment |
|---|---|---|
| `id`, `type` | `8863`, `story` | `8865`, `comment` |
| `author`, `created_at`, `created_at_i` | yes | yes |
| `title`, `url`, `points` | yes | `null` |
| `text` | `null` for link posts | HTML |
| `parent_id`, `story_id` | `null`, `8863` | parent's ID, `8863` |
| `children` | top-level comments | replies, nested |

Comment text is HTML: paragraphs are separated by `<p>`, links are `<a href>`, and quotes and apostrophes are entity-encoded (`&#x27;`). The script below converts it to plain text.

## Python: all three methods

```python
import csv
import html
import re
import time
from concurrent.futures import ThreadPoolExecutor

import requests

ALGOLIA = "https://hn.algolia.com/api/v1/items/{}"
FIREBASE = "https://hacker-news.firebaseio.com/v0/item/{}.json"
s = requests.Session()


def get_json(url, attempts=4):
    for i in range(attempts):
        try:
            r = s.get(url, timeout=60)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 404:
                return None
        except requests.RequestException:
            pass
        time.sleep(2 ** i)
    raise RuntimeError(f"failed: {url}")


def to_text(fragment):
    """HN comment HTML -> plain text (<p> becomes a blank line)."""
    t = re.sub(r"<p>", "\n\n", fragment or "")
    t = re.sub(r"<[^>]+>", "", t)
    return html.unescape(t).strip()


def comments_algolia(story_id):
    """One request: the whole tree. Flattened depth-first, in thread order."""
    root = get_json(ALGOLIA.format(story_id))
    rows = []

    def walk(node, depth):
        for c in node.get("children", []):
            rows.append({"id": c["id"], "parent": c["parent_id"], "depth": depth,
                         "author": c["author"], "created_at": c["created_at"],
                         "text": to_text(c["text"])})
            walk(c, depth + 1)

    walk(root, 1)
    return root, rows


def comments_search(story_id, start=0, end=2**31):
    """Flat list from the search index (tags=comment,story_ID). Includes replies
    whose parent was deleted. Splits the time window while a slice has > 1,000 hits."""
    r = s.get("https://hn.algolia.com/api/v1/search_by_date", timeout=60, params={
        "tags": f"comment,story_{story_id}", "hitsPerPage": 1000,
        "numericFilters": f"created_at_i>={start},created_at_i<{end}"}).json()
    if r["nbHits"] <= 1000:
        return [{"id": int(h["objectID"]), "parent": h["parent_id"], "author": h["author"],
                 "created_at": h["created_at"], "text": to_text(h["comment_text"])}
                for h in r["hits"]]
    mid = (start + end) // 2
    return comments_search(story_id, start, mid) + comments_search(story_id, mid, end)


def comments_firebase(story_id, workers=16):
    """Official API: one request per comment, level by level. Keeps deleted
    and dead items so you can see what the Algolia tree leaves out."""
    story = get_json(FIREBASE.format(story_id))
    rows, level, depth = [], [(k, story_id) for k in story.get("kids", [])], 1
    with ThreadPoolExecutor(workers) as ex:
        while level:
            items = list(ex.map(lambda pair: get_json(FIREBASE.format(pair[0])), level))
            nxt = []
            for item in items:
                if not item:
                    continue
                rows.append({"id": item["id"], "parent": item.get("parent"), "depth": depth,
                             "author": item.get("by"), "time": item.get("time"),
                             "deleted": item.get("deleted", False), "dead": item.get("dead", False),
                             "text": to_text(item.get("text"))})
                nxt += [(k, item["id"]) for k in item.get("kids", [])]
            level, depth = nxt, depth + 1
    return story, rows


if __name__ == "__main__":
    story_id = 8863  # "My YC app: Dropbox - Throw away your USB drive"

    t0 = time.time()
    root, rows = comments_algolia(story_id)
    print(f"Algolia: {root['title']!r} -> {len(rows)} comments, "
          f"max depth {max(r['depth'] for r in rows)}, {time.time() - t0:.1f}s")
    print(rows[0]["author"], "|", rows[0]["text"][:70])

    with open(f"hn_{story_id}_comments.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)

    t0 = time.time()
    story, fb_rows = comments_firebase(story_id)
    gone = sum(1 for r in fb_rows if r["deleted"] or r["dead"])
    print(f"Firebase: descendants={story['descendants']} -> {len(fb_rows)} items "
          f"({gone} deleted or dead), {time.time() - t0:.1f}s")

    big = 38309611  # "OpenAI's board has fired Sam Altman"
    t0 = time.time()
    root, rows = comments_algolia(big)
    print(f"Algolia, big thread: {len(rows)} comments, max depth "
          f"{max(r['depth'] for r in rows)}, {time.time() - t0:.1f}s")
    t0 = time.time()
    flat = comments_search(big, start=root["created_at_i"], end=int(time.time()) + 60)
    print(f"Search index, big thread: {len(flat)} comments, {time.time() - t0:.1f}s")
    t0 = time.time()
    story, fb_rows = comments_firebase(big)
    gone = sum(1 for r in fb_rows if r["deleted"] or r["dead"])
    print(f"Firebase, big thread: descendants={story['descendants']} -> {len(fb_rows)} items "
          f"({gone} deleted or dead), {time.time() - t0:.1f}s")
```

Output on 2026-10-14:

```text
Algolia: 'My YC app: Dropbox - Throw away your USB drive' -> 71 comments, max depth 5, 1.1s
dhouston | oh, and a mac port is coming :)
Firebase: descendants=71 -> 72 items (1 deleted or dead), 5.6s
Algolia, big thread: 2450 comments, max depth 14, 1.8s
Search index, big thread: 2530 comments, 21.8s
Firebase, big thread: descendants=2530 -> 2734 items (204 deleted or dead), 53.9s
```

And the first rows of `hn_8863_comments.csv`:

```csv
id,parent,depth,author,created_at,text
8865,8863,1,dhouston,2007-04-04T19:22:55.000Z,"oh, and a mac port is coming :)"
9007,8865,2,vlad,2007-04-05T01:48:11.000Z,"Drew, this is awesome!  All of the features you mentioned are exactly what people need."
```

## Which method to use

- **Reading or summarising a thread:** `/items/{id}`. One fast request, already in thread order. The missing branches hang off removed comments, which a reader on the site sees collapsed or flagged anyway.
- **A dataset that should match `num_comments`:** the search index. It returned exactly 2,530 on the big thread. Rebuild the tree from `parent_id` if you need it, and expect replies whose parent isn't in your set.
- **Moderation research, or anything that needs removed items:** Firebase. It's the only one that returns deleted and dead items, flagged with `deleted: true` or `dead: true`. It's also the slowest: one request per comment.

## Pitfalls

- **The search split needs a sensible window.** One query returns at most 1,000 hits, so the function halves the time window until each slice fits. Starting the window at the story's own `created_at_i` saves requests; a window from 1970 still worked but took longer.
- **Order isn't guaranteed across methods.** The item tree is in display order. The search index is newest first. Firebase `kids` are in ranked display order, but the script reads them level by level. Sort by `created_at` or rebuild the tree if order matters.
- **Firebase answers a missing ID with `null` and HTTP 200.** `get_json` returns `None` for it, and the walker skips it.
- **A thread keeps growing while it's on the front page.** Comments posted between your requests won't match a count you read earlier. For a fixed snapshot, record the time you started and filter by `created_at_i` afterwards.
- **"Who is hiring?" threads** are posted by the account `whoishiring`. Find this month's with `/search_by_date?tags=story,author_whoishiring`; on 2026-10-14 the newest was "Ask HN: Who is hiring? (October 2026)" (ID 49922569, 389 comments). Job posts are the top-level comments, so take `depth == 1` from the tree.

## Related guides for this API

- [HN Algolia API reference](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/): every parameter, tag and limit.
- [Hacker News Firebase API vs Algolia](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/).
- [Search Hacker News by date range or points](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/), which uses the same window-splitting idea.
- [The Hacker News Search API: free, no key](https://datatooly.xyz/guides/hacker-news-search-api/).

## Do it without code

The free [Hacker News search tool](https://datatooly.xyz/hacker-news-search/) searches stories and comments live in your browser, with points, comment counts, author and date. Set the type to comments to see which threads discuss a topic, then use a story's ID with the code above.

## At scale

The [Hacker News Scraper actor](https://apify.com/constructive_calm/hacker-news-scraper?fpr=v77kxu) on Apify attaches comment trees to stories (`includeComments`, with a `maxCommentDepth` cap), can flatten them into rows, and can add each author's karma. It walks the official Firebase API level by level, so replies under deleted comments aren't lost. Its `hiring_threads` mode turns the monthly "Who is hiring?" thread into job rows. It exports JSON, CSV or Excel, and it's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The script above needs neither.*

Sources: [HN Search API (official page)](https://hn.algolia.com/api), [Hacker News API (Firebase) on GitHub](https://github.com/HackerNews/API), and live responses from both APIs on 2026-10-14.

## Quick answers

### How do I get all comments on a Hacker News post?

Call `https://hn.algolia.com/api/v1/items/{story_id}`. One request returns the story with every comment nested in `children`, and no API key is needed. It leaves out deleted and dead comments and the replies under them. For those replies, page through `/search_by_date?tags=comment,story_{id}`, or walk the official Firebase API item by item.

### Does the Hacker News API return the comment tree?

The Algolia API does: `/api/v1/items/:id` returns the whole tree nested in `children`. The official Firebase API doesn't. Each item lists only its direct reply IDs in `kids`, so you fetch `/v0/item/{id}.json` for every comment yourself, one request each.

### Why does my Hacker News comment count not match num_comments?

`num_comments` (Algolia) and `descendants` (Firebase) count live comments. The Algolia item tree also drops live replies whose parent comment was deleted or flagged dead. On one 2,530-comment thread the tree held 2,450, and all 80 missing comments sat under a deleted or dead parent.

## Related guides

- [The Hacker News Search API: Free, No-Key, and Surprisingly Powerful](https://datatooly.xyz/guides/hacker-news-search-api/)
- [HN Algolia API Reference: Search, Tags, Filters, Limits](https://datatooly.xyz/guides/hacker-news-algolia-api-reference/)
- [Hacker News Firebase API vs Algolia: Which One to Use](https://datatooly.xyz/guides/hacker-news-firebase-api-vs-algolia/)
- [Search Hacker News by Date Range or Points (API)](https://datatooly.xyz/guides/search-hacker-news-by-date-range-points/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
