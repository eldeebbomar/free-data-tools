# YouTube Shorts Scraper — find viral Shorts by channel or keyword

> YouTube Shorts Scraper Pro is an Apify actor that scrapes Shorts by channel handle, keyword, hashtag or Short URL, auto-detecting each input line. It reads YouTube's own internal data API with no login, API key or daily quota and returns view, like and comment counts plus two computed metrics: viralScore (views divided by channel subscribers; above 1 means the Short beat the channel's audience) and engagementRate ((likes + comments) divided by views).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Social & Community](https://datatooly.xyz/category/social-community/)
- URL: https://datatooly.xyz/youtube-shorts-search/
- Backing Apify actor: [youtube-shorts-scraper-pro](https://apify.com/constructive_calm/youtube-shorts-scraper-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Scrape YouTube Shorts Data (Exact View, Like & Comment Counts)](https://datatooly.xyz/guides/scrape-youtube-shorts-data/)

Enter channels, keywords, hashtags or Short URLs and preview the YouTube Shorts records the actor returns: views, likes, comments, viralScore and engagementRate.

## Key takeaways

- Accepts four input types on one list — channel handle (@MrBeast), keyword ("cooking tips"), hashtag (#asmr), or a direct Short URL — and auto-detects each line, so no mode switching is needed.
- Uses YouTube's internal data API for exact view/like/comment counts, not the rounded estimates the public API returns.
- Requires no API key, no OAuth, and no login, and is not subject to the official API's daily quota.
- Adds two computed metrics calculated by the actor, not supplied by YouTube: viralScore (views ÷ channel subscribers) and engagementRate ((likes + comments) ÷ views).
- Optional flags let you pull comments (maxComments default 20) and download each Short as a 360p MP4 saved to Apify storage with a shareable link.
- Public data only, fetched through residential proxies; free to start on Apify, then pay-as-you-go.

## How it works

### 1. Add your inputs

Put one or more lines in the required startUrls list — any mix of channel handles (@MrBeast), keywords ("cooking tips"), hashtags (#asmr), or direct Short URLs. Each line is auto-detected.

### 2. Set scope and recency

Choose maxResults per input (default 10), optionally set publishedAfter to a date (YYYY-MM-DD) or a relative window like "7 days", and pick sortOrder: newest, popular, or oldest.

### 3. Enable optional extras

Turn on includeComments (with maxComments, default 20) to pull comments, and downloadVideos to save each Short as a 360p MP4 with a shareable link.

## How to use it

1. **Add your inputs** — Put one or more lines in the required startUrls list — any mix of channel handles (@MrBeast), keywords ("cooking tips"), hashtags (#asmr), or direct Short URLs. Each line is auto-detected.
2. **Set scope and recency** — Choose maxResults per input (default 10), optionally set publishedAfter to a date (YYYY-MM-DD) or a relative window like "7 days", and pick sortOrder: newest, popular, or oldest.
3. **Enable optional extras** — Turn on includeComments (with maxComments, default 20) to pull comments, and downloadVideos to save each Short as a 360p MP4 with a shareable link.
4. **Run the actor** — Start the run on Apify. It queries YouTube's internal data API through residential proxies — no API key, login, or quota is needed.
5. **Collect the output** — Read the dataset: each Short returns videoId, url, title, description, hashtags, exact view/like/comment counts, durationSeconds, publishedAt, thumbnail, channel details, plus computed viralScore and engagementRate.

## Example output

A fixed sample of the fields the youtube-shorts-scraper-pro actor returns — example data, not live results.

| title | channelName | viewCount | viralScore | engagementRate |
| --- | --- | --- | --- | --- |
| $1 vs $100 street food challenge | Example Eats | 4830000 | 2.013 | 0.0447 |
| 5-minute morning ab routine | FitSample | 1210000 | 1.33 | 0.03464 |
| This cable trick fixes every messy desk | Placeholder Tech | 2640000 | 7.543 | 0.04553 |
| Rating airport lounges in 30 seconds | Demo Travels | 780000 | 0.65 | 0.0294 |
| Satisfying pottery trim | Clay Example Studio | 1590000 | 18.068 | 0.06216 |

## Ready-to-run actor input

```json
{
  "startUrls": [
    "@MrBeast"
  ],
  "maxResults": 10,
  "sortOrder": "newest"
}
```

## Key facts

- The official YouTube Data API v3 has a default quota of 10,000 units per day.
- A single search.list call in the YouTube Data API v3 costs 100 quota units, so the default quota allows only about 100 searches per day.
- The YouTube Data API v3 requires an API key or OAuth 2.0 credentials to make requests.
- YouTube Shorts are vertical videos of up to 3 minutes; the Data API v3 does not provide a clean filter to isolate Shorts from standard videos.
- This actor returns exact viewCount, likeCount, and commentCount rather than the rounded values commonly surfaced through the public API.
- viralScore (views ÷ channel subscribers) and engagementRate ((likes + comments) ÷ views) are computed by the actor itself and are not fields returned by YouTube.

## FAQ

### How is this different from the official YouTube Data API v3?

The official API works but has a strict 10,000-unit/day quota, requires an API key or OAuth, does not cleanly isolate Shorts from regular videos, and returns limited, rounded statistics. This actor reads YouTube's internal data API instead, so it returns exact counts, isolates Shorts, and needs no key or quota.

### Do I need a YouTube or Google API key?

No. The actor authenticates nothing on YouTube's side — no API key, no OAuth, and no login. You only need an Apify account to run it.

### What inputs can I give it?

A startUrls list is the only required field. Each line can be a channel handle like @MrBeast, a keyword like "cooking tips", a hashtag like #asmr, or a direct Short URL. The actor auto-detects the type of each line, so you can mix them freely.

### Are the view and like counts exact or estimated?

Exact. Because the actor pulls from the same internal data endpoint youtube.com uses, viewCount, likeCount, and commentCount are the precise integers YouTube shows, not the rounded figures the public Data API returns.

### What are viralScore and engagementRate?

They are the actor's own computed metrics, not values from YouTube. viralScore is views divided by the channel's subscriber count (above 1 means the Short outperformed the channel's audience; above 5 is a breakout), and engagementRate is (likes + comments) divided by views. They are provided as convenience analytics on top of the raw fields.

### Can it download the actual Short video?

Yes. Turn on downloadVideos and each Short is saved as a 360p MP4 to Apify storage, with a shareable videoDownloadUrl added to that record's output.

### How do I control how many results and how recent they are?

Set maxResults per input (default 10), publishedAfter as either a date (YYYY-MM-DD) or a relative window like "7 days", and sortOrder as newest, popular, or oldest.

### What does it cost to run?

The backing Apify actor is free to start and then pay-as-you-go. Runtime uses residential proxies and scrapes only public data.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [LinkedIn profile scraper](https://datatooly.xyz/linkedin-profile-lookup/)
- [Threads profile scraper](https://datatooly.xyz/threads-profile-search/)
- [Threads keyword monitor](https://datatooly.xyz/threads-keyword-monitor/)
- [Reddit search tool](https://datatooly.xyz/reddit-search-builder/)
