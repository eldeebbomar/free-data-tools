# Threads Keyword Search Without App Review: Monitor in Python

> Threads' keyword_search API only searches your own posts until Meta approves your app. Monitor public Threads keywords in Python without app review.

- URL: https://datatooly.xyz/guides/threads-keyword-search-without-app-review/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Monitor Threads by keyword or hashtag](https://datatooly.xyz/threads-keyword-monitor/)
- Tags: python, webscraping, socialmedia, api

Without app review, Meta's Threads `keyword_search` endpoint only searches posts owned by the authenticated user. Public posts become searchable only after Meta approves your app for the `threads_keyword_search` permission. To monitor public keywords before (or instead of) that approval, read the public search page at `threads.com/search?q=…` and dedupe posts by their `code` between runs.

That is the whole trick. The rest of this guide covers what the official endpoint gives you once approved, how the public page ships its data, a monitoring script that only prints new posts, and where the public route stops.

## Why your keyword search only returns your own posts

The official endpoint is `GET /keyword_search` on the Threads Graph API. Per Meta's documentation (checked on 29 September 2026):

- It needs two permissions: `threads_basic` and `threads_keyword_search`.
- Until your app is approved for `threads_keyword_search`, "the search will be performed only on posts owned by the authenticated user." That is why a fresh app returns your own posts and nothing else.
- A user can send at most 2,200 queries in a rolling 24-hour window. Queries that return no results do not count.
- Parameters: `q` (required), `search_type` (`TOP` or `RECENT`), `search_mode` (`KEYWORD` or `TAG`), `media_type`, `since` / `until`, `limit` (default 25, max 100), and `author_username`.

If you can get through app review, use the API. It is the sanctioned route, and it gives you date bounds and 100 results per page, which the public page does not. The rest of this guide is for the case where you can't, or not yet: a prototype, a one-off research pull, or a team without a Meta business app.

## The public route: server-rendered search pages

Threads has three public URLs that matter for keyword monitoring:

| URL | What it shows |
|---|---|
| `https://www.threads.com/search?q=<term>&serp_type=default` | Relevance-ranked results for a keyword |
| `https://www.threads.com/search?q=<term>&serp_type=recent` | Newest-first results for the same keyword |
| `https://www.threads.com/tag/<name>` | A topic tag's feed (Threads' version of a hashtag) |

Meta serves these pages with the post data embedded as JSON inside `<script type="application/json">` blocks when the request identifies as a link-preview crawler (`facebookexternalhit/1.1`, the user agent Facebook itself uses when unfurling links). A normal browser user agent gets a thin app shell instead, because the browser is expected to fetch the data with JavaScript afterwards.

The JSON is nested inside Meta's module envelope, and the exact path moves around between releases. So don't hard-code a path. Walk every block recursively and pick out anything that looks like a post: an object with a string `code`, a `caption`, a string `pk`, and either `taken_at` or `like_count`.

Two properties of these pages shape everything below:

1. **There is no cursor.** The page's `page_info` reports `has_next_page: false`. Each view renders a bounded sample, typically a few dozen posts, and you can't page deeper without logging in.
2. **The two views differ.** `default` (relevance) and `recent` (newest) overlap but aren't identical, so fetching both and merging on `code` widens what you see per term.

## Runnable Python: print only new posts per keyword

This script fetches both views for each term, merges them, and compares the result with a local state file. It keeps each post's `code` plus a "high-water mark" timestamp, and prints only posts it hasn't returned before. Run it on a cron and you have a keyword monitor.

```python
import json, re, sys, time, pathlib, requests
from urllib.parse import quote

UA = "facebookexternalhit/1.1"   # Meta server-renders embedded JSON for link-preview crawlers
SCRIPT_RE = re.compile(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', re.S)
STATE = pathlib.Path("threads_seen.json")

def walk(node, posts, depth=0):
    """Collect post nodes: code + caption + pk + (taken_at or like_count)."""
    if depth > 30 or node is None:
        return
    if isinstance(node, list):
        for v in node:
            walk(v, posts, depth + 1)
    elif isinstance(node, dict):
        if (isinstance(node.get("code"), str) and "caption" in node
                and isinstance(node.get("pk"), str)
                and ("taken_at" in node or "like_count" in node)):
            old = posts.get(node["code"])
            if old is None or len(json.dumps(node)) > len(json.dumps(old)):
                posts[node["code"]] = node          # keep the richest copy
        for v in node.values():
            walk(v, posts, depth + 1)

def fetch_view(term, view, attempts=3):
    url = f"https://www.threads.com/search?q={quote(term)}&serp_type={view}"
    for i in range(attempts):
        try:
            r = requests.get(url, timeout=25, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
            r.raise_for_status()
            posts = {}
            for block in SCRIPT_RE.findall(r.text):
                try:
                    walk(json.loads(block), posts)
                except ValueError:
                    continue
            if posts:
                return list(posts.values())
            # 200 with zero posts: a login gate, a data-less shell, or a real "no results".
        except requests.RequestException:
            pass
        time.sleep(2 * (i + 1))
    return []

def to_row(p, term):
    user, info = p.get("user") or {}, p.get("text_post_app_info") or {}
    return {
        "matchedQuery": term,
        "code": p["code"],
        "url": f"https://www.threads.com/@{user.get('username')}/post/{p['code']}",
        "username": user.get("username"),
        "text": (p.get("caption") or {}).get("text"),
        "takenAt": p.get("taken_at"),                  # unix seconds
        "likes": p.get("like_count"),
        "replies": info.get("direct_reply_count"),
        "reposts": info.get("repost_count"),
        "quotes": info.get("quote_count"),
    }

def monitor(terms):
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    new_rows = []
    for term in terms:
        prior = state.get(term, {})
        seen, high_water = set(prior.get("codes", [])), prior.get("lastTakenAt", 0)
        union = {}
        for view in ("recent", "default"):              # recency view first, then relevance
            for p in fetch_view(term, view):
                union.setdefault(p["code"], p)
        fresh = [p for p in union.values()
                 if p["code"] not in seen
                 and (p.get("taken_at") is None or p["taken_at"] > high_water)]
        new_rows += [to_row(p, term) for p in fresh]
        stamps = [p.get("taken_at") or 0 for p in union.values()] + [high_water]
        codes = list(dict.fromkeys([*union, *prior.get("codes", [])]))[:2000]   # newest first, capped
        state[term] = {"codes": codes, "lastTakenAt": max(stamps)}
        print(f"{term!r}: {len(union)} gathered, {len(fresh)} new", file=sys.stderr)
    STATE.write_text(json.dumps(state))
    return new_rows

if __name__ == "__main__":
    for row in monitor(sys.argv[1:] or ["web scraping"]):
        print(json.dumps(row, ensure_ascii=False))
```

```bash
pip install requests
python threads_monitor.py "web scraping" "n8n"
```

The first run for a term prints everything currently visible. That's your baseline. After that, a post has to clear two gates to print: its `code` has never been seen, and it's newer than the last timestamp recorded for that term. The code check stops repeats. The timestamp check stops a post from coming back after its code ages out of the capped list.

## Field reference

These are the raw keys on each post node the walker collects, and what the script maps them to:

| Raw key | Script field | Notes |
|---|---|---|
| `code` | `code` | Short post ID, used in the URL. The dedupe key. |
| `pk` | — | Numeric post ID as a string |
| `user.username` | `username` | Author handle |
| `caption.text` | `text` | Post body. `caption` can be present with empty text. |
| `taken_at` | `takenAt` | Unix seconds |
| `like_count` | `likes` | |
| `text_post_app_info.direct_reply_count` | `replies` | |
| `text_post_app_info.repost_count` | `reposts` | |
| `text_post_app_info.quote_count` | `quotes` | |
| `image_versions2`, `carousel_media`, `video_versions` | — | Media candidates. Pick the largest `width × height`. |

The post URL is built as `https://www.threads.com/@<username>/post/<code>`. Use `threads.com`: `threads.net` URLs redirect, and a redirect is one more hop to go wrong.

## Pitfalls

- **A 200 with zero posts is ambiguous.** Meta sometimes answers a crawler request with a full-size page that has the data blocks stripped, or with a "Threads · Log in" gate. This varies by IP and by moment. It's why the script retries and logs "0 gathered" instead of treating the term as dead. From the connection I wrote this on, every request came back as the data-less shell, so the script above ran cleanly but returned nothing. That was the IP, not the method: the same approach run on Apify's cloud through its proxies on the same day returned 10 posts for "web scraping". Output from a clean IP is what the field table documents. If you're on a hot IP, try from another egress before concluding a term has no posts.
- **Coverage is a sample, not an archive.** With no cursor, one term yields a few dozen posts at most, even when thousands exist. Widen coverage by monitoring related terms and by running more often, not by trying to page backwards.
- **Busy terms rotate.** For a high-volume keyword, consecutive fetches can surface different slices. Early runs will look "new-heavy" until the seen-set fills.
- **Tags are separate.** Topic tags live at `/tag/<name>`. Searching `q=%23name` gives an overlapping but different sample, so fetch both if a tag matters.
- **Date filters only narrow.** Filtering on `taken_at` trims what the page showed you. It can't reach older posts the page never exposed.
- **Terms and privacy.** Meta's terms restrict automated collection, and post authors are people. Collect public posts only, keep request rates modest, and have a lawful basis before you store or contact anyone.

## Do it without code

The free [Threads keyword monitor query builder](https://datatooly.xyz/threads-keyword-monitor/) lets you pick a mode (search, hashtag, or monitor), enter your terms, and set sort and limits. It generates a ready-to-run input and shows a fixed example of the output shape. It's a query builder: Threads isn't open to cross-site browser requests, so it doesn't fetch live posts in your browser.

## At scale

[Threads Search & Monitor on Apify](https://apify.com/constructive_calm/threads-search-monitor?fpr=v77kxu) runs the same public-page approach with the parts that are tedious to maintain yourself. It fetches through Apify datacenter proxies and automatically retries gated pages through residential. It merges the relevance and recency views (and the tag view for hashtags). Its monitor mode keeps the seen-codes and high-water state in a named key-value store in your own Apify account, so a scheduled run returns only new posts. Reply trees and author bio contacts are both opt-in. It's free to start, then pay-as-you-go, charged per post returned. In monitor mode, only new posts are charged.

*Disclosure: I built the query builder and the actor. The script above works on its own.*

## FAQ

### Does the Threads API support keyword search?

Yes. `GET /keyword_search` accepts `q`, `search_type` (`TOP` or `RECENT`), `search_mode` (`KEYWORD` or `TAG`), `since`/`until` and `limit` up to 100. It needs the `threads_keyword_search` permission, and a user can make at most 2,200 queries per rolling 24 hours.

### Why does keyword_search only return my own posts?

Your app hasn't been approved for `threads_keyword_search` yet. Until it is, Meta scopes the search to posts owned by the authenticated user. Public posts become searchable after approval through App Review.

### Can I search Threads without logging in?

For public posts, yes. `threads.com/search?q=<term>` and `threads.com/tag/<name>` render public results for anonymous visitors. Private accounts and anything behind the login wall stay out of reach, and there's no cursor for deeper pages.

### How many posts can I get per keyword without the API?

A bounded sample per view, typically a few dozen posts. Merging the `default` and `recent` views widens it somewhat. For broader coverage, monitor several related terms on a schedule instead of trying to backfill one term's history.

### How do I get only new Threads posts for a keyword?

Store each post's `code` plus the newest `taken_at` you've seen for that term. On every run, emit only posts whose code is new and whose timestamp is newer than the stored mark, then update both. The script above does exactly this in a local JSON file.

### Is it threads.net or threads.com?

`threads.com`. Old `threads.net` links still redirect, but build URLs on `threads.com` directly.

## Related guides

- [How to Scrape Reddit Without the API (After the 2023 Price Changes)](https://datatooly.xyz/guides/scrape-reddit-without-api/)
- [How to Scrape a Telegram Channel Without Login (No API Key)](https://datatooly.xyz/guides/scrape-telegram-channel-without-login/)
- [How to Build a Threads Scraper for Meta Profiles and Posts](https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/)
- [How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)](https://datatooly.xyz/guides/scrape-youtube-shorts-data/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
