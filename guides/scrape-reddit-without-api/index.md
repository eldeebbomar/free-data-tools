# How to Scrape Reddit Without the API (After the 2023 Price Changes)

> A precise, honest guide to scraping Reddit without the API: what actually works in 2024, the 403/CORS traps, and old.reddit.com HTML.

- URL: https://datatooly.xyz/guides/scrape-reddit-without-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-05-31
- Updated: 2026-09-29
- Free tool: [Search Reddit by keyword or subreddit — and export it clean](https://datatooly.xyz/reddit-search-builder/)
- Tags: webscraping, python, api, datascience

If you've landed here, you already know the backstory: in 2023 Reddit's API went from free-and-generous to metered-and-expensive, third-party apps shut down, and a lot of data pipelines broke overnight. So the practical question for developers and data folks is no longer "should I use the API?" but **how to scrape Reddit without the API** at all — cleanly, legally-aware, and without burning hours on requests that silently return `403`.

This article walks through what genuinely works in 2026, what *looks* like it works but doesn't, and the constraints you'll hit no matter which path you choose. The code paths you can verify yourself in a terminal; the rate limits, the ~250 search cap and the Pushshift/terms details are drawn from Reddit's docs and widely-reported community experience (links where it matters), and real-world enforcement is more erratic than any documented figure.

## The thing everyone tries first (and why it fails)

The classic "no API" trick is appending `.json` to any Reddit URL:

```
https://www.reddit.com/r/programming/.json
https://www.reddit.com/r/programming/comments/<id>/.json
```

This is a real, undocumented JSON view of the page. The problem is *where* you call it from.

- **From a browser (client-side JS):** it's **CORS-blocked**. Reddit doesn't send `Access-Control-Allow-Origin` for these endpoints, so `fetch()` from your web app throws before you ever see data. No amount of header tweaking fixes CORS from the browser — it's enforced by the browser, not by your code.
- **From a server:** `www.reddit.com/.../.json` returns **HTTP 403**. When I re-tested on 29 September 2026 it did so for every user agent I tried, from a residential connection as well as from datacenter IPs. Reddit tightened this after the API changes specifically to stop the "just hit `.json` from a Lambda" pattern.

So the `www.reddit.com` `.json` approach dies in the two places people most want to use it: the browser and servers. It is not a foundation you want a pipeline on.

## What actually works: old.reddit.com server-rendered HTML

The long-standing no-API path is the **old Reddit interface**, `old.reddit.com`. Unlike the modern React SPA (which hydrates data client-side and is painful to parse), old Reddit ships **fully server-rendered HTML, cookie-free**. You request a page, you get the listing already in the markup.

Two important nuances I want to be honest about:

1. **The gate is the user agent, not the IP.** In 2026 `old.reddit.com` answers ordinary browser user agents, and custom bot user agents like the one below, with a `302` redirect to `/login/?reason=lor2`, from residential and datacenter IPs alike. When I tested on 29 September 2026, only link-preview crawler user agents (the bots that build link previews for chat and social apps) still received the public page.
2. **Past that gate, datacenter IPs are fine.** In my actor's runs, subreddit listings, search, user pages and comment threads all load from datacenter IPs. The limit you actually hit is Reddit's rate limiting (HTTP `429`), so pace your requests and back off.

Here's the classic minimal example that pulls the front page of a subreddit from old Reddit and extracts post titles and links. It uses `requests` + `BeautifulSoup`, with a real, descriptive User-Agent (Reddit reliably rejects the default `python-requests` UA). **Heads-up:** when I ran it on 29 September 2026 it stopped at the login check, because that descriptive UA is now redirected to the login page. The parsing logic is still correct for the page old Reddit serves to clients it lets through. I haven't rewritten it to pose as another company's crawler, because that contradicts the honest-User-Agent advice at the end of this post; if you need data today, use Reddit's official Data API or a managed scraper.

```python
import requests
from bs4 import BeautifulSoup

HEADERS = {
    # A real, descriptive UA. Reddit blocks the default python-requests UA.
    "User-Agent": "research-bot/1.0 (contact: you@example.com)"
}

def scrape_subreddit(subreddit: str):
    url = f"https://old.reddit.com/r/{subreddit}/"
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()  # 403/429 will surface here
    if "/login" in resp.url:
        # Since 2026 old.reddit redirects most user agents to a login page.
        raise RuntimeError(f"Redirected to Reddit's login wall: {resp.url}")

    soup = BeautifulSoup(resp.text, "html.parser")
    posts = []
    for thing in soup.select("div.thing[data-fullname]"):
        title_el = thing.select_one("a.title")
        if not title_el:
            continue
        posts.append({
            "id": thing.get("data-fullname"),
            "title": title_el.get_text(strip=True),
            "permalink": thing.get("data-permalink"),
            "score": thing.get("data-score"),
            "author": thing.get("data-author"),
            "subreddit": thing.get("data-subreddit"),
        })
    return posts

if __name__ == "__main__":
    for p in scrape_subreddit("programming")[:5]:
        print(p["score"], "-", p["title"])
```

The `div.thing` element carries most of what you need as `data-*` attributes — `data-fullname` (the post ID like `t3_abc123`), `data-score`, `data-author`, `data-permalink`. That's why old Reddit is so pleasant: the structure is stable and the data is right there in attributes instead of buried in a hydration blob.

### Pagination

Old Reddit paginates with a `?count=25&after=<fullname>` query string. The "next" button's `href` gives you the URL directly:

```python
next_btn = soup.select_one("span.next-button a")
next_url = next_btn["href"] if next_btn else None
```

Follow that link to walk listings. Add a polite delay (1–2 seconds) between requests and reuse a `requests.Session` so connections are kept alive.

## The hard limits you cannot engineer around

Before you build anything ambitious, internalize these constraints. They're properties of Reddit, not of your scraper.

**Search caps at ~250 results (observed).** In practice Reddit's search — whether via the API or the HTML interface — appears to return roughly the top ~250 matches for a query and then stops, with no deep pagination past that. It's widely-observed behavior rather than an officially documented number, but it's consistent enough to plan around. If your use case is "give me every post ever mentioning X," search alone will not deliver it.

**Comment indexing is weak.** Reddit search indexes *post* titles and bodies far better than it indexes *comments*. A keyword that lives only in comment threads will frequently not surface in search at all. This trips up sentiment and brand-monitoring projects constantly.

**Pushshift is gone for you (probably).** Pushshift used to be the answer for historical, full-text, deep Reddit search. Since 2023 it has been **restricted to verified subreddit moderators**. Unless you're a mod with approved access, treat Pushshift as unavailable.

**The official Data API is metered and commercial-use-restricted.** For completeness: the official route allows roughly **100 requests/minute with OAuth** (about **10/minute unauthenticated**), and Reddit's terms **restrict commercial use** without a separate licensing/paid agreement. So even if you go "official," you're capped and legally boxed in for anything revenue-adjacent.

Put together: there is no magic endpoint that gives you unlimited, deep, full-text Reddit history for free. Anyone who tells you otherwise is selling something or about to get blocked.

## A sane workflow: build the query first, then export

A mistake I see often is jumping straight to code, then discovering the query was wrong after burning a bunch of requests. Because search is capped at ~250 results and comment indexing is weak, **the precision of your query matters more than the speed of your scraper**.

So the workflow I'd recommend:

1. **Compose and preview the query before you fetch anything.** A free, no-signup helper for this is the [Reddit Search Builder](https://datatooly.xyz/reddit-search-builder/). It lets you assemble a precise Reddit query (subreddit filters, time windows, sort, exact-phrase syntax) and previews the result schema so you know exactly which fields you'll get back before committing to a run. Getting the query right up front is the single biggest lever given the 250-result ceiling.

2. **Run small to validate** the HTML parser against real markup, and confirm you are getting listings rather than the login redirect (selectors drift; verify before scaling).

3. **Scale the export with proper IP rotation.** This is where a DIY scraper gets painful — you need a way past the login wall that fits your terms-of-use position, rotating IPs, retry/backoff on `403`/`429`, and dedup across pages. Maintaining that yourself is a real project.

If you'd rather not run and maintain the proxy + retry + parsing stack, the [Reddit Scraper](https://apify.com/constructive_calm/reddit-scraper-pro?fpr=v77kxu) actor on Apify is the do-this-at-scale option I built around exactly the constraints above (disclosure: it's my actor). It takes **one list of targets** (keywords, `r/subreddit`, `r/subreddit keyword`, `u/user` or any Reddit link, each auto-detected), fetches comment threads for post links, has an `onlyNew` switch for scheduled monitoring, and handles **datacenter-first with residential fallback** so the easy routes stay cheap and the hard routes still work, with retry/backoff on `403`/`429` to keep success rates high. Pricing is **$0.0025 per post, billed from the first item**; Apify's free monthly credit covers a small test run on a real query. It reads the same public `old.reddit.com` pages described here, just with the IP rotation, backoff, and schema normalization already wired up.

## A quick decision guide

- **Need a few subreddit or user listings, occasionally?** The parsing logic above is enough once you have page access. Since the 2026 login wall, the simplest compliant route at small volume is Reddit's official Data API.
- **Need search results or comment trees at any volume?** Plan for Reddit's rate limits and accept the ~250-result search ceiling. Build your query carefully first.
- **Need scale, reliability, or scheduled monitoring?** Either invest serious time in a rotating-proxy pipeline, or hand it to a managed actor and spend your time on the analysis instead of the plumbing.

## One honest closing note

Whatever path you pick, respect the source. Reddit's terms prohibit unauthorized commercial use of its data, the official API is rate-limited for a reason, and aggressive scraping gets IPs and projects banned. Scrape conservatively, identify your bot honestly in the `User-Agent`, cache what you fetch so you don't re-hammer the same pages, and don't republish content in ways that violate users' or Reddit's rights. "Without the API" is a technical choice — it isn't a license to ignore the terms behind it. Build accordingly, and your pipeline will outlast the next round of changes.

## Related guides

- [How to Scrape a Telegram Channel Without Login (No API Key)](https://datatooly.xyz/guides/scrape-telegram-channel-without-login/)
- [Threads Keyword Search Without App Review: Monitor in Python](https://datatooly.xyz/guides/threads-keyword-search-without-app-review/)
- [How to Build a Threads Scraper for Meta Profiles and Posts](https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/)
- [How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)](https://datatooly.xyz/guides/scrape-youtube-shorts-data/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
