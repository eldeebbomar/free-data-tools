# Cointelegraph API: Get Crypto News as JSON Without a Key

> Cointelegraph has no public news API, but its site runs on a keyless GraphQL endpoint and RSS feeds. Pull articles, search results and full text as JSON.

- URL: https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Search & export Cointelegraph crypto news](https://datatooly.xyz/crypto-news-search/)
- Tags: python, crypto, api, webscraping

Cointelegraph doesn't publish a documented news API. Its website, though, loads articles from a GraphQL endpoint at `https://conpletus.cointelegraph.com/v1/` that answers plain POST requests with no key. One query gives you the latest articles or keyword search results as JSON: title, publish time, lead text, category and view count. Full article bodies need a second query per article, by slug. For just the headlines, `https://cointelegraph.com/rss` is simpler.

This guide shows both routes with code that ran against the live endpoints on 2026-09-29. It also covers the quirks that trip people up: the empty `bodyText`, the CORS lock, and a language code that doesn't mean what it looks like.

## Two free sources, and when to use each

| Source | URL | Gives you | Limits |
|---|---|---|---|
| RSS feeds | `https://cointelegraph.com/rss`, `/rss/tag/bitcoin`, `/rss/category/analysis` | The latest items as XML | 30 items per feed in testing; no search; no paging back in time |
| GraphQL | `https://conpletus.cointelegraph.com/v1/` (POST) | Latest articles, keyword search, single articles with body HTML, view counts, 14 working language editions | Undocumented and internal, so it can change without notice |

RSS is the stable, sanctioned option for "what's new right now". GraphQL is what you need for keyword search, history, view counts or full text.

## The GraphQL shape

Everything hangs off `locale(short: "<code>")`. Inside it, three queries matter:

- `posts(order: "postPublishedTime", offset, length)` returns the latest articles, newest first
- `postsSearch(offset, length, query)` returns keyword search results
- `post(slug)` returns one article, including its body

Both list queries return `{ data: [Post], hasMorePosts }`. The fields you'll use on a `Post`:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Article ID |
| `slug` / `url` | string | `url` is a relative path such as `/news/...` |
| `views` | int | View count |
| `postTranslate.title` | string | Headline |
| `postTranslate.published` | string | ISO-8601 with UTC offset |
| `postTranslate.leadText` | string | The summary paragraph |
| `postTranslate.bodyText` | string (HTML) | Filled in by `post(slug)` only (see below) |
| `postTranslate.publishedHumanFormat` | string | Came back `null` in every test |
| `category.slug` | string | For example `markets` or `latest-news` |
| `postBadge.label` | string or null | Badge label, often null |
| `author.authorTranslates[].name` | string | Byline |

## Python: search Cointelegraph and save CSV

This needs only `requests`:

```python
import csv
import time
import requests

ENDPOINT = "https://conpletus.cointelegraph.com/v1/"

QUERY = """
query Search($short: String!, $offset: Int!, $length: Int!, $query: String!) {
  locale(short: $short) {
    postsSearch(offset: $offset, length: $length, query: $query) {
      hasMorePosts
      data {
        id
        url
        views
        postTranslate { title published leadText }
        category { slug }
        postBadge { label }
      }
    }
  }
}
"""

def search_cointelegraph(term, lang="en", limit=60, page_size=20):
    rows, seen, offset = [], set(), 0
    while len(rows) < limit:
        resp = requests.post(
            ENDPOINT,
            json={"query": QUERY, "variables": {
                "short": lang, "offset": offset, "length": page_size, "query": term}},
            headers={"Origin": "https://cointelegraph.com"},
            timeout=30,
        )
        resp.raise_for_status()
        body = resp.json()
        if body.get("errors"):
            raise RuntimeError(body["errors"][0]["message"])
        page = (body["data"]["locale"] or {}).get("postsSearch") or {}
        posts = page.get("data") or []
        for p in posts:
            if p["id"] in seen or not p.get("postTranslate"):
                continue
            seen.add(p["id"])
            t = p["postTranslate"]
            rows.append({
                "id": p["id"],
                "title": t["title"],
                "published": t["published"],
                "lead": (t["leadText"] or "").strip(),
                "category": (p.get("category") or {}).get("slug"),
                "views": p.get("views"),
                "url": "https://cointelegraph.com" + p["url"],
            })
        if not posts or not page.get("hasMorePosts"):
            break
        offset += page_size
        time.sleep(0.5)  # be polite
    return rows[:limit]

if __name__ == "__main__":
    articles = search_cointelegraph("bitcoin etf", limit=60)
    with open("cointelegraph_bitcoin_etf.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=articles[0].keys())
        w.writeheader()
        w.writerows(articles)
    print(len(articles), "articles")
    for a in articles[:3]:
        print(a["published"][:10], a["views"], a["title"])
```

Output on 2026-09-29:

```
60 articles
2026-09-25 812 Bitcoin ETF inflows slow to $191M as six-day streak reaches $2.8B
2026-09-19 1416 REX launches 2x leveraged ETF tied to Bitcoin treasury firm Strive
2026-09-14 676 Bitcoin ETFs shed $463M in weekly reversal as Ether ETFs gain $197M
```

## Node.js: latest articles with full text

The list and search queries return `bodyText` as an **empty string**. I checked `posts` and `postsSearch`, for both recent and older articles. To get the body, ask for each article by slug:

```js
// Node 18+ (built-in fetch). Latest articles + full body text.
const ENDPOINT = "https://conpletus.cointelegraph.com/v1/";

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://cointelegraph.com" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

const LATEST = `
  query Latest($short: String!, $offset: Int!, $length: Int!) {
    locale(short: $short) {
      posts(order: "postPublishedTime", offset: $offset, length: $length) {
        hasMorePosts
        data { id slug url views postTranslate { title published } }
      }
    }
  }`;

const ONE_POST = `
  query One($short: String!, $slug: String!) {
    locale(short: $short) {
      post(slug: $slug) { postTranslate { bodyText } }
    }
  }`;

const lang = "en";
const list = await gql(LATEST, { short: lang, offset: 0, length: 5 });

for (const p of list.locale.posts.data) {
  // List and search queries return an empty bodyText; fetch the post by slug for the body.
  const one = await gql(ONE_POST, { short: lang, slug: p.slug });
  const html = one.locale.post?.postTranslate?.bodyText ?? "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  console.log(p.postTranslate.published.slice(0, 10), p.views, p.postTranslate.title);
  console.log("   ", text.slice(0, 120), `... (${text.length} chars)`);
  await new Promise((r) => setTimeout(r, 300));
}
```

Save it as `latest.mjs` and run `node latest.mjs`. Each article prints with a body of roughly 1,200 to 4,100 characters, where the list query alone gave 0.

## Pitfalls, stated precisely

- **It's an internal endpoint.** Cointelegraph doesn't document `conpletus` or promise it'll stay stable. Check for `errors` in every response, and alert when a page comes back empty, not only when the request fails.
- **Browsers are blocked by CORS.** The endpoint answers with `access-control-allow-origin: https://cointelegraph.com`, so a `fetch()` from any other site fails in the browser. It works from a server, a script or a notebook. That's why the free tool below builds the query instead of running it in your browser.
- **Empty `bodyText` in lists.** As shown above, you need the extra `post(slug)` call for the full text. Budget one request per article.
- **Paging.** `offset` and `length` work as you'd expect. `length` values up to 200 were accepted, and an offset of 20,000 still returned articles (from September 2024). Stop when `hasMorePosts` is false or a page comes back empty. Deduplicate by `id` in case a new article shifts the offsets while you page.
- **Language codes aren't all what they look like.** `ar` resolves to `cointelegraph.com.ar`, which looks like an Argentinian domain but serves the Arabic edition (Arabic titles, `lang="ar"`). `jp` resolves to `cointelegraph.jp`. `my` returns no data. To check what a code maps to, query `locale(short: "xx") { language { domain short } }`, and build absolute URLs from that domain, not from `cointelegraph.com`.
- **`publishedHumanFormat` is null.** Format `published` yourself.
- **Copyright.** Articles are copyrighted. Use the data for research, monitoring and analysis, not for republishing full text, and read Cointelegraph's terms before you scrape at volume.

## Do it without code

The free [Cointelegraph query builder](https://datatooly.xyz/crypto-news-search/) is a **query builder**, not a live fetcher. The CORS lock above rules out a live in-browser call. You set a keyword, a language edition and an article count, and it builds a ready-to-run input for the actor below. It also shows a fixed example of the output fields, so you can plan the schema before you run anything.

## At scale

A one-off script is fine for a single search. For a scheduled crypto-news feed, you also need retries, deduplication across runs, language editions, and exports that feed a sentiment model or dashboard. The [Cointelegraph News Scraper actor](https://apify.com/constructive_calm/crypto-news-scraper?fpr=v77kxu) on Apify handles the retries, per-run deduplication, language editions and exports on top of the same GraphQL backend. Deduplicating across scheduled runs is still up to you: key on the article `id`. It takes a keyword or pulls the latest articles, collects 5 to 100,000 per run, includes view counts, and exports JSON or CSV. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly builder and the Apify actor. The endpoints and code above work without either.*

## FAQ

### Does Cointelegraph have an official API?

It has no documented public news API. The site runs on a GraphQL endpoint (`conpletus.cointelegraph.com/v1/`) that accepts POST requests without a key, and it publishes RSS feeds at `cointelegraph.com/rss`.

### Do I need an API key?

No. Neither the GraphQL endpoint nor the RSS feeds needed a key or cookie in testing. The code sends an `Origin: https://cointelegraph.com` header to match what the site itself sends.

### Why is `bodyText` empty?

The list and search queries return an empty `bodyText`. Request the article with `post(slug: "...")` inside `locale(short: "en")` to get the full HTML body.

### Can I call it from browser JavaScript?

Not from your own site. CORS only allows the `https://cointelegraph.com` origin. Run it server-side, or use the RSS feed through your own backend.

### How far back can I go?

Offsets deep into the archive work. An offset of 20,000 on the English edition returned articles from September 2024. Page with `offset` and `length` until `hasMorePosts` is false.

### Which language codes work?

These 14 codes all returned articles on 2026-09-29: `en`, `tr`, `de`, `es`, `fr`, `it`, `jp`, `kr`, `br`, `cn`, `ar`, `in`, `tw` and `ru`. `ar` is the Arabic edition, served from `cointelegraph.com.ar` despite the Argentinian-looking domain, and `my` returned no data. Query `language { domain }` to confirm a mapping.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
- [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)
