# How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)

> A practical guide to scraping YouTube Shorts data: why the official API falls short, how the internal API works, and a runnable example with exact counts.

- URL: https://datatooly.xyz/guides/scrape-youtube-shorts-data/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-07-06
- Updated: 2026-09-29
- Free tool: [YouTube Shorts Scraper — find viral Shorts by channel or keyword](https://datatooly.xyz/youtube-shorts-search/)
- Tags: webscraping, youtube, api, datascience

If you have ever tried to figure out **how to scrape YouTube Shorts data** — the view counts, like counts, publish dates, and channel stats for a batch of Shorts — you have probably discovered that it is more annoying than it looks. Shorts are technically just videos, but YouTube treats them as a distinct surface, and the tools most people reach for either cost quota you do not have or return numbers that are rounded and incomplete.

This post walks through the real options: what the official API does and does not give you, how the "internal API" scraping approach actually works, and a runnable example you can drop into a script today.

## Why scraping YouTube Shorts data is harder than it should be

The obvious first stop is the **YouTube Data API v3**. It is a legitimate, well-documented REST API, and for many jobs it is the right tool. But three things make it awkward specifically for Shorts work:

1. **Quota.** Every Google Cloud project gets a default allocation of **10,000 units per day**. That sounds like a lot until you learn the pricing: a `search.list` call costs **100 units**, so you get roughly **100 searches per day** before you hit `quotaExceeded`. A plain `videos.list` read is only 1 unit, but you can only call it once you already have the video IDs — and getting those IDs by keyword or hashtag is the expensive search step. ([Google's quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost) lists the per-method costs.)

2. **No clean Shorts filter.** The Data API has no `type=short` parameter. A Short is returned as an ordinary video resource. You can heuristically guess (short duration, vertical aspect ratio, `#shorts` in the description) but there is no first-class "give me this channel's Shorts" endpoint.

3. **API key / OAuth setup.** You need a Google Cloud project, an enabled API, and a key — and for some data, OAuth. That is fine for a product, but heavy for a one-off dataset.

To be clear: the official API is **not** unusable. If you need a handful of videos per day and you already manage an API key, it is a fine, fully-supported choice. The friction is real but bounded — it is the quota and the missing Shorts isolation that push people toward scraping when they need volume or richer data.

## The internal-API approach (how scraping actually works)

Here is the part most tutorials get wrong. You do **not** scrape YouTube Shorts by parsing HTML with regex, and there is **no secret public REST endpoint** you can `curl`. What actually powers `youtube.com` in your browser is an internal JSON API (the same backend the web player talks to as you scroll). When you load a Shorts feed, a channel page, or a search results page, the site sends structured JSON payloads containing every field the UI renders — titles, exact view counts, like counts, publish timestamps, channel subscriber counts, and more.

The scraping approach, conceptually, is:

- Issue the same requests the browser issues, with the right context/client parameters, so YouTube returns those JSON payloads instead of a rendered page.
- Walk the (deeply nested, frequently-renamed) JSON to pull out the fields you care about.
- Rotate residential proxies so you are not making thousands of requests from one datacenter IP.

The payoff over the official API: because you are reading the **same data the site itself renders**, you get **exact** counts (e.g. `viewCount: 4823117`) rather than the rounded values (`4.8M`) you often see, no API key, no OAuth, and no 10,000-unit ceiling.

The cost is engineering time. YouTube renames those JSON keys and changes the request envelope regularly, so a scraper you write today will quietly break in a few months. That is the maintenance treadmill you are signing up for if you build it yourself — and the reason a maintained tool is often worth it for this specific target.

## Doing it without building the parser yourself

Rather than reverse-engineer the payload walking, you can call a maintained actor that already does it. Here is a complete, runnable Node.js example using the Apify client to scrape Shorts by channel handle, keyword, hashtag, or a direct Short URL — each input line is auto-detected, so you do not configure any "mode":

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const run = await client.actor('constructive_calm/youtube-shorts-scraper-pro').call({
  // Each line is auto-detected: @handle, keyword, #hashtag, or a Short URL
  startUrls: [
    '@MrBeast',
    'cooking tips',
    '#asmr',
    'https://www.youtube.com/shorts/abcdEFGhijk',
  ],
  maxResults: 25,            // per input line
  publishedAfter: '30 days', // date "2026-01-01" or relative "7 days"
  sortOrder: 'popular',      // newest | popular | oldest
  includeComments: true,
  maxComments: 20,
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();

for (const s of items) {
  console.log(
    `${s.viewCount.toLocaleString()} views | ` +
    `viralScore ${s.viralScore} | ${s.title}`
  );
}
```

`startUrls` is the only required input. Everything else has sensible defaults (`maxResults` is 10, `maxComments` is 20). If you flip on `downloadVideos`, each result also gets a `videoDownloadUrl` pointing at a 360p MP4 saved to storage with a shareable link.

### What you get back per Short

Each dataset item is a flat object, which makes it trivial to dump to CSV or load into pandas:

```json
{
  "videoId": "abcdEFGhijk",
  "url": "https://www.youtube.com/shorts/abcdEFGhijk",
  "title": "60-second garlic butter trick",
  "description": "…",
  "hashtags": ["cooking", "shorts"],
  "viewCount": 4823117,
  "likeCount": 312044,
  "commentCount": 1876,
  "durationSeconds": 58,
  "publishedAt": "2026-06-14T09:32:00Z",
  "thumbnail": "https://i.ytimg.com/…",
  "channelName": "Example Kitchen",
  "channelId": "UC…",
  "channelSubscribers": 2450000,
  "channelVerified": true,
  "viralScore": 1.969,
  "engagementRate": 0.06509
}
```

The first block of fields comes straight from YouTube's own data. The last two — `viralScore` (views ÷ channel subscribers, so anything above 1 beat the channel's own audience) and `engagementRate` ((likes + comments) ÷ views) — are **computed by the actor**, not values YouTube publishes. They are handy for ranking a batch of Shorts by breakout potential without writing your own formula, but treat them as a derived heuristic, not an official metric.

## A quick note on choosing your approach

- **A few Shorts, occasionally, and you already have an API key?** Use the official Data API. It is free within quota and fully supported.
- **You need Shorts isolated by channel/keyword/hashtag, exact counts, and volume?** Either write an internal-API scraper (and accept the maintenance) or use a maintained one.

If you want to see the exact input/output shape before running anything, there is a free **[query-builder tool](https://datatooly.xyz/youtube-shorts-search/)** where you paste your inputs and preview the resulting output schema in the browser. It does not fetch live results client-side — YouTube is not CORS-open, so no browser page can — it just helps you construct and understand the request.

To run it for real against live data, the backing actor is **[youtube-shorts-scraper-pro](https://apify.com/constructive_calm/youtube-shorts-scraper-pro?fpr=v77kxu)** on Apify. It is free to start, then pay-as-you-go, and it handles the residential-proxy rotation and the JSON-walking so you do not inherit the breakage treadmill.

However you go about it, keep it to **public data only** — public Shorts, public channel stats, public comments — and you have a clean, repeatable way to pull YouTube Shorts data with exact numbers instead of rounded guesses.

*Disclosure: I build and maintain the youtube-shorts-scraper-pro actor referenced above.*

## Related guides

- [How to Scrape Reddit Without the API (After the 2023 Price Changes)](https://datatooly.xyz/guides/scrape-reddit-without-api/)
- [How to Scrape a Telegram Channel Without Login (No API Key)](https://datatooly.xyz/guides/scrape-telegram-channel-without-login/)
- [Threads Keyword Search Without App Review: Monitor in Python](https://datatooly.xyz/guides/threads-keyword-search-without-app-review/)
- [How to Build a Threads Scraper for Meta Profiles and Posts](https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
