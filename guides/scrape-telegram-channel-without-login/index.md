# How to Scrape a Telegram Channel Without Login (No API Key)

> A verified, runnable guide to scraping public Telegram channels without login, an API key or a phone number, using the t.me/s/ preview and plain HTTP.

- URL: https://datatooly.xyz/guides/scrape-telegram-channel-without-login/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-30
- Updated: 2026-09-29
- Free tool: [Extract Telegram public channel posts](https://datatooly.xyz/telegram-channel-search/)
- Tags: python, webscraping, api, osint

If you want to **scrape a Telegram channel without login**, you do not need MTProto, you do not need a bot token, and you do not need to hand Telegram a phone number. Every public channel quietly exposes a server-rendered HTML preview that you can fetch with a plain HTTP request and parse with any HTML library. No account. No risk to an account you don't even have to create.

This is the cleanest, lowest-friction way to pull recent posts from a public channel, and most people never discover it because the Telegram developer docs push you straight toward the full Bot API or the Telethon/MTProto client libraries. Those are powerful, but they're overkill — and a liability — when all you want is the public message feed.

Let me show you exactly how it works, give you a runnable script, and be honest about where this approach hits a wall.

## The trick: t.me/s/&lt;channel&gt;

Telegram publishes a public web preview for every public channel at:

```
https://t.me/s/<channelname>
```

The `/s/` is the important part — it serves the "preview" (the embeddable, indexable version). Hit `https://t.me/s/durov` in a browser with JavaScript turned off and you'll still see the posts. That's the tell: the HTML is **server-rendered**, so a basic HTTP client receives the fully-populated page. No headless browser required.

Inside that HTML, each post lives in a predictable structure. The classes are the same ones the official Telegram post widget uses, and have been stable in practice:

- `.tgme_widget_message` — the container for a single post. It carries a `data-post` attribute like `durov/123`, where `123` is the message ID.
- `.tgme_widget_message_text` — the post body (with inline HTML for links, bold, etc.).
- `.tgme_widget_message_date time` — a `<time>` element whose `datetime` attribute is an ISO-8601 timestamp.
- `.tgme_widget_message_views` — the view count, rendered as a human string like `12.4K`.
- `.tgme_widget_message_photo_wrap` / `.tgme_widget_message_video_wrap` — media wrappers; the image URL is tucked into a `background-image` CSS rule.

That's everything you need to reconstruct a structured feed.

## A runnable example

Here's a self-contained Python script using `requests` and `beautifulsoup4`. It fetches one page of a public channel and extracts each post's ID, text, timestamp, and view count.

```python
import re
import requests
from bs4 import BeautifulSoup

def scrape_channel(channel: str):
    url = f"https://t.me/s/{channel}"
    # A normal browser UA avoids the occasional stripped-down response.
    headers = {"User-Agent": "Mozilla/5.0 (compatible; my-scraper/1.0)"}
    resp = requests.get(url, headers=headers, timeout=20)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    posts = []

    for msg in soup.select(".tgme_widget_message"):
        data_post = msg.get("data-post", "")          # e.g. "durov/123"
        msg_id = data_post.split("/")[-1] if data_post else None

        text_el = msg.select_one(".tgme_widget_message_text")
        text = text_el.get_text("\n", strip=True) if text_el else ""

        time_el = msg.select_one(".tgme_widget_message_date time")
        timestamp = time_el["datetime"] if time_el and time_el.has_attr("datetime") else None

        views_el = msg.select_one(".tgme_widget_message_views")
        views = views_el.get_text(strip=True) if views_el else None

        posts.append({
            "id": msg_id,
            "text": text,
            "datetime": timestamp,
            "views": views,
        })

    return posts


if __name__ == "__main__":
    for p in scrape_channel("telegram"):
        print(f"[{p['datetime']}] ({p['views']} views) #{p['id']}")
        print(p["text"][:200])
        print("-" * 40)
```

Install the two dependencies and run it:

```bash
pip install requests beautifulsoup4
python scrape.py
```

You'll get the most recent posts on the channel's preview page printed as structured records. No keys, no login, nothing to authorize.

## Paginating backwards with ?before=

A single fetch of `t.me/s/<channel>` returns roughly the latest 16–20 posts. To go further back, use the `before=` query parameter with a message ID. Telegram then returns the page of posts *older* than that ID:

```
https://t.me/s/<channel>?before=<message_id>
```

So the loop is simple: grab a page, find the **smallest** `data-post` message ID on it, then request the next page with `?before=<that_id>`. Repeat until you hit your target count or stop getting new posts.

```python
def scrape_paginated(channel: str, max_posts: int = 200):
    collected, before = [], None
    while len(collected) < max_posts:
        url = f"https://t.me/s/{channel}"
        if before:
            url += f"?before={before}"
        # scrape_channel_from_url = the parse logic from the first example,
        # factored out to accept a full URL instead of building it from the channel name
        page = scrape_channel_from_url(url)
        if not page:
            break
        collected.extend(page)
        # oldest message id on this page becomes the next cursor
        ids = [int(p["id"]) for p in page if p["id"] and p["id"].isdigit()]
        if not ids:
            break
        new_before = min(ids)
        if new_before == before:              # no progress -> reached the end
            break
        before = new_before
    return collected[:max_posts]
```

Add a short `time.sleep()` between requests to be polite, and dedupe by message ID since page boundaries can overlap by one or two posts.

## Where this approach stops working (be honest)

This method is genuinely useful, but it has hard limits you should know up front:

1. **Public channels only.** Private channels, and *all* groups, are invisible to `t.me/s/`. Groups in particular require Telethon/MTProto with API credentials *and* membership — there is no login-free path.
2. **Recent messages, not full archives.** Paginating with `before=` walks backwards, but Telegram does not serve unbounded deep history through the preview reliably. You can get a healthy window of recent posts; you cannot count on dumping a channel's entire multi-year backlog this way.
3. **Rendered fields only.** You get what the preview shows — text, dates, view counts, media URLs, link previews. You do not get the raw API objects (reactions breakdowns, forward chains, edit history) that MTProto exposes.
4. **Rate limiting.** It's an HTTP endpoint like any other. Hammer it from one IP and you'll get throttled. Space out requests and rotate if you're going wide.

If your use case fits inside "recent posts from public channels," none of this matters and you're done. If you need full history at scale, you've outgrown the preview.

## When you outgrow the snippet

Two things that saved me time, in increasing order of scale:

- To stop hand-checking class names and `before=` cursors, I built a small free **query builder** at [datatooly.xyz/telegram-channel-search](https://datatooly.xyz/telegram-channel-search/). You type a channel and pick the preview shape you want, and it generates the request configuration for you. It's a builder — it composes the query, it doesn't run a live scrape inside your browser.

- When you need full history, many channels in parallel, media URLs, and managed proxies instead of babysitting a `requests` loop, that's where a hosted actor earns its keep. I run [**Telegram Intelligence Pro**](https://apify.com/constructive_calm/telegram-intelligence-pro?fpr=v77kxu) on Apify for exactly that — it's free to start, then pay-as-you-go, so you can try it on one channel before committing to a bulk job.

*Disclosure: I build the datatooly tool and the Apify actor linked above; the t.me/s/ technique and the code here work entirely on their own without either.*

## TL;DR

To **scrape a Telegram channel without login**: fetch `https://t.me/s/<channel>`, parse `.tgme_widget_message` blocks for `data-post` IDs, `.tgme_widget_message_text`, the `<time datetime>` attribute, and `.tgme_widget_message_views`, then page backwards with `?before=<oldest_id>`. No API key, no phone number, no MTProto — just HTTP and an HTML parser. Mind the limits (public channels, recent posts) and reach for a hosted tool only when you actually need scale.

## Related guides

- [How to Scrape Reddit Without the API (After the 2023 Price Changes)](https://datatooly.xyz/guides/scrape-reddit-without-api/)
- [Threads Keyword Search Without App Review: Monitor in Python](https://datatooly.xyz/guides/threads-keyword-search-without-app-review/)
- [How to Build a Threads Scraper for Meta Profiles and Posts](https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/)
- [How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)](https://datatooly.xyz/guides/scrape-youtube-shorts-data/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
