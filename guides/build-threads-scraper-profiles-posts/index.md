# How to Build a Threads Scraper for Meta Profiles and Posts

> A practical, honest guide to building a Threads scraper for Meta's threads.com — what loads cookie-free, what doesn't, and a runnable example.

- URL: https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-13
- Updated: 2026-09-29
- Free tool: [Scrape Threads profiles, posts & hashtags](https://datatooly.xyz/threads-profile-search/)
- Tags: api, webscraping, socialmedia, datascience

If you want to build a **Threads scraper**, the first thing to get straight is *what Threads actually is in 2026* — because the surface has changed under everyone's feet. Threads is Meta's X-competitor, and it is no longer a small experiment: Meta reported it crossed **400 million monthly active users** in August 2025. That growth is exactly why marketers, researchers, and data teams suddenly want programmatic access to profiles, posts, and hashtags.

This guide is the honest version. I'll show you what loads without authentication, what doesn't, where Meta's official API helps versus where it doesn't, and a runnable code example you can adapt today.

## Fact #1: It's threads.com now, not threads.net

A surprising number of tutorials still hardcode `threads.net`. That's stale. On **April 24, 2025**, Meta officially migrated the canonical domain from `threads.net` to **`threads.com`**. Meta didn't own the `.com` at launch — it belonged to a messaging startup — and acquired it in September 2024 before flipping the canonical domain the following spring. Old `threads.net` URLs now redirect, but if you're writing a **Threads scraper**, target `threads.com` directly so you skip a redirect hop and avoid brittle string matching.

```python
# Do this
PROFILE_URL = "https://www.threads.com/@zuck"

# Not this (redirects, and you may parse a redirect interstitial)
# PROFILE_URL = "https://www.threads.net/@zuck"
```

## Fact #2: There is no open public API for general scraping

This is the part people get wrong in both directions, so let's be precise.

Meta *does* publish an official **Threads API**, opened to developers in 2024. It is genuinely useful for some things: publishing posts on behalf of an authenticated user, tokenless **oEmbed** for embedding public posts, and a limited ability to search public posts by author or media type. But it is **not an open data firehose**. To use it meaningfully you register a Meta Developer App and go through App Review, and the read surface is narrow and account-scoped — it's built for "let my app post and embed," not "let me pull arbitrary public profiles and their post history at scale."

So when someone says "just use the API," the honest answer is: the official API solves *publishing* well and *bulk public reading* poorly. For competitive research, audience analysis, or trend tracking across accounts you don't own, you're going to read the public web surface instead. Which brings us to the good news.

## Fact #3: Public profiles and posts render cookie-free

Threads is, relative to Instagram or LinkedIn, friendly to logged-out reading. **Public posts render in the initial server-side HTML** for unauthenticated visitors. You don't need cookies, a logged-in session, or GraphQL `doc_id` juggling to read a public profile's recent posts — the data is in the page Meta serves to crawlers.

The cleanest way to trigger that crawler-friendly server-rendered HTML is to identify as Meta's own link-preview crawler, `facebookexternalhit`. This is the bot Meta runs to build link previews when a URL is shared, and it reliably receives the SSR variant of the page. Combined with structured data embedded in the HTML, you get profile and post fields without browser automation.

Here's a minimal, correct example in Python. It fetches a public profile page with the crawler user-agent and pulls structured data out of the HTML. No login, no headless browser.

```python
import json
import re
import urllib.request

UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"

def fetch_public_profile(username: str) -> str:
    url = f"https://www.threads.com/@{username}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", errors="replace")

def extract_jsonld(html: str):
    """Pull <script type='application/ld+json'> blocks (structured data)."""
    blocks = re.findall(
        r'<script type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        flags=re.DOTALL,
    )
    out = []
    for b in blocks:
        try:
            out.append(json.loads(b.strip()))
        except json.JSONDecodeError:
            continue
    return out

if __name__ == "__main__":
    html = fetch_public_profile("zuck")
    for obj in extract_jsonld(html):
        # ProfilePage / Person objects carry name, handle, description, etc.
        print(json.dumps(obj, indent=2)[:800])
```

A few notes so this holds up in production:

- **Parse the JSON, don't regex the fields.** The HTML markup churns constantly; the embedded structured-data and inline JSON blobs are far more stable. Find the script blocks, `json.loads` them, then walk the objects.
- **Expect more than one JSON shape.** Threads has shipped at least two structured-data layouts over time (a bare `Person` object and a `ProfilePage` wrapping `mainEntity`). Handle both, or your parser silently returns nulls after Meta ships a tweak.
- **Validate the host.** If you accept arbitrary input URLs, make sure the host is *exactly* `threads.com` (or `www.threads.com`). A naive suffix check like "ends with threads.com" will happily accept `notthreads.com` and open you to SSRF. Match the host, not a substring.

## Fact #4: Search and reply-trees are the hard part

Here's where logged-out reading hits its ceiling, and where honest expectation-setting matters.

**Profiles and a profile's recent posts: easy.** Public, in the SSR HTML, cookie-free.

**Full reply trees: limited.** Without an authenticated session, a post's discussion tree returns only the publicly-indexed posts that reference or quote it — roughly 15–30 — not the complete comment list. The deep thread requires a login Threads doesn't hand to anonymous crawlers.

**Keyword search and hashtags: partial.** You can pull top results for a tag or query from the public surface, but the volume and depth are capped by what Threads chooses to expose to logged-out users. Treat search/hashtag as "top sample," not "exhaustive archive," and design your downstream analytics around a sample, not a census.

This isn't a flaw in your code — it's the platform boundary. A good **Threads scraper** is explicit about which mode returns complete data (profile, posts-by-user) and which returns a public subset (search, hashtag, reply-tree). On the legal side, logged-out scraping of public data has generally been treated more favorably by US case law than authenticated scraping (e.g., *hiQ v. LinkedIn*, *Meta v. Bright Data*) — but that's a posture, not legal advice. Read Meta's terms and your own jurisdiction.

## Putting it together: modes you actually want

A complete Threads scraper usually exposes these modes:

1. **Profile** — handle, bio, follower count, bio links, verification.
2. **Posts by user** — recent posts for one or more usernames.
3. **Post detail** — a source post plus its public quote-reposts/references.
4. **Search** — top results for a keyword (sampled).
5. **Hashtag** — top posts for a tag (sampled).
6. **Monitor** — emit only posts new since your last run, for ongoing tracking.

The first three return complete-ish public data; the last three are sample-or-delta by nature. Knowing that distinction up front saves you from promising stakeholders an "everything" dataset the platform won't give you.

## A faster path than hand-rolling it

The code above works, but going from "fetches one profile" to "handles both JSON shapes, retries transient failures, rotates IPs when Meta rate-limits, paginates posts, and dedupes a monitor run" is real engineering. If you'd rather skip the maintenance treadmill, I built two things to help.

First, a free **[Threads query builder](https://datatooly.xyz/threads-profile-search/)**. Important honest caveat: it is a *query builder*, **not** a live in-browser scraper. Threads isn't CORS-open, so nothing fetches live results in your tab. You pick a mode, type usernames or a query, set limits, and it previews the exact **output shape** so you know the field structure before you run anything. It's the fastest way to design your schema.

Second, the backing **[Threads Scraper actor on Apify](https://apify.com/constructive_calm/threads-scraper?fpr=v77kxu)** runs the configured job for real. It uses the cookie-free SSR approach described here (no login, no cookie management), supports all six modes above including monitor-deltas and bio-contact extraction, and is **free to start, then pay-as-you-go** — the first 10 chargeable events per run are free, so you can validate output on real data before spending anything.

*Disclosure: I built the query-builder tool and the Apify actor referenced above.*

Whether you hand-roll it with the snippet here or run the actor, the takeaways are the same: target `threads.com`, expect no open public API, lean on cookie-free SSR for profiles and posts, and treat search/hashtag/reply-trees as public samples rather than complete archives. Build for those boundaries and your scraper stays correct as Threads keeps shipping changes.

## Related guides

- [How to Scrape Reddit Without the API (After the 2023 Price Changes)](https://datatooly.xyz/guides/scrape-reddit-without-api/)
- [How to Scrape a Telegram Channel Without Login (No API Key)](https://datatooly.xyz/guides/scrape-telegram-channel-without-login/)
- [Threads Keyword Search Without App Review: Monitor in Python](https://datatooly.xyz/guides/threads-keyword-search-without-app-review/)
- [How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)](https://datatooly.xyz/guides/scrape-youtube-shorts-data/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
