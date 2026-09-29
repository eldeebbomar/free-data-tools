# Extract Telegram public channel posts

> To scrape a Telegram channel, point a scraper at its public web preview (t.me/s/<channel>), which renders recent posts as server-side HTML with no login or API key. This page is a query builder: enter channel handles and a post limit, preview the exact output shape, then run the config live on the backing Apify actor (free to start, then pay-as-you-go).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Social & Community](https://datatooly.xyz/category/social-community/)
- URL: https://datatooly.xyz/telegram-channel-search/
- Backing Apify actor: [telegram-intelligence-pro](https://apify.com/constructive_calm/telegram-intelligence-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Scrape a Telegram Channel Without Login (No API Key)](https://datatooly.xyz/guides/scrape-telegram-channel-without-login/)

Enter public Telegram channel handles and a post limit, and preview the post records the actor extracts from t.me with no login: text, views, reactions and forwards.

## Key takeaways

- This tool builds a ready-to-run query and previews the output shape; it does not fetch live channel data in your browser. You run the finished config on the Apify actor.
- Public channels expose a server-rendered preview at t.me/s/<channel> that includes post text, view counts, reactions, media URLs, and forwarded-from info with no login or API key.
- The web preview only exposes a recent window of posts, not full channel history; extracting a channel's complete archive requires Telegram's official MTProto API (e.g. Telethon) and credentials.
- Private channels and groups cannot be scraped this way because no authenticated session is used; the method works for public channels only.
- The backing actor (telegram-intelligence-pro) is free to start, then pay-as-you-go: the first 30 chargeable events of each run are free, and it charges per non-empty post extracted rather than per row.
- Four modes cover different jobs: channel_snapshot (recent posts), posts_history (deep paginated history), search_by_keyword, and monitor_channels (delta detection).

## How it works

### 1. Enter the public channel handles

In the channels field, add one or more public channel handles (the part after t.me/, without the @). Private channels and groups will not work because the method uses no login. The builder keeps mode set to channel_snapshot by default for a single pull of recent posts.

### 2. Set the post limit and field options

Set maxPostsPerChannel to cap how many recent posts to pull per channel (default 50). Optionally toggle includeReactions and includeForwards to control which fields appear. For deeper history, switch mode to posts_history; for cross-channel scanning, use search_by_keyword.

### 3. Preview the output shape

Review the fixed example output the builder renders: a channel record (handle, title, subscriber count, verified status, media counts) and post records (text, postId, postedAt, viewCount, reactions, mediaUrls, forwardedFromHandle). This confirms the exact fields you'll receive before spending anything.

## How to use it

1. **Enter the public channel handles** — In the channels field, add one or more public channel handles (the part after t.me/, without the @). Private channels and groups will not work because the method uses no login. The builder keeps mode set to channel_snapshot by default for a single pull of recent posts.
2. **Set the post limit and field options** — Set maxPostsPerChannel to cap how many recent posts to pull per channel (default 50). Optionally toggle includeReactions and includeForwards to control which fields appear. For deeper history, switch mode to posts_history; for cross-channel scanning, use search_by_keyword.
3. **Preview the output shape** — Review the fixed example output the builder renders: a channel record (handle, title, subscriber count, verified status, media counts) and post records (text, postId, postedAt, viewCount, reactions, mediaUrls, forwardedFromHandle). This confirms the exact fields you'll receive before spending anything.
4. **Copy the generated config** — Copy the assembled JSON input the builder produces. This is a ready-to-run configuration for the backing actor; nothing is fetched live in your browser at this step.
5. **Run it live on the Apify actor** — Open the telegram-intelligence-pro actor on Apify, paste the config as the input, and run it. The actor performs the real extraction against the public previews. It's free to start, then pay-as-you-go per non-empty post.

## Example output

A fixed sample of the fields the telegram-intelligence-pro actor returns — example data, not live results.

| channelHandle | text | viewCount | reactionsTotal | postedAt |
| --- | --- | --- | --- | --- |
| examplemarketsdaily | Morning brief: oil steady, gold near weekly high, three things to watch today. | 21400 | 312 | 2026-09-29T07:00:00.000Z |
| examplemarketsdaily | Chart of the day: container freight rates vs. retail import volumes. | 18950 | 244 | 2026-09-29T06:00:00.000Z |
| sampletechnews | New open-source release adds offline mode and a plugin API. | 7320 | 158 | 2026-09-29T05:00:00.000Z |
| sampletechnews | Weekly roundup: five developer tools worth a look. | 6875 | 97 | 2026-09-29T04:00:00.000Z |
| placeholderdeals | Flash sale ends tonight: 30% off annual plans with code EXAMPLE30. | 3410 | 41 | 2026-09-29T03:00:00.000Z |

## Ready-to-run actor input

```json
{
  "mode": "channel_snapshot",
  "maxPostsPerChannel": 50
}
```

## Key facts

- Public Telegram channels currently expose a server-rendered web preview at t.me/s/<channel> that returns recent posts as HTML the actor can parse without a login or API key. (Source: From the backing actor's README and source (got-scraping + cheerio against t.me/s/), which read the preview as server-rendered HTML; this reflects Telegram's current markup and may change.)
- The public web preview only serves a recent window of a channel's posts, not its full archive; a channel's complete history requires Telegram's official MTProto API and credentials. (Source: From the backing actor's source: it paginates t.me/s/ backward via ?before= until the preview stops returning older posts. The exact depth is set by Telegram and is not an official published limit.)
- The preview supports backward pagination via the ?before= query parameter, letting the actor walk older posts within the preview window. (Source: From the backing actor's source (postsHistory walks t.me/s/ via ?before=<oldestMsgId> per page); also described in community scraping guides for the t.me/s/ endpoint.)
- Per-post fields available from the preview include text, view counts, reaction emoji counts, media URLs, and forwarded-from information. (Source: From the backing actor's documented output fields and input schema (includeReactions and includeForwards toggles, mediaUrls and viewCount in the post record).)
- The backing actor charges per non-empty post extracted rather than per returned row, with the first 30 chargeable events of each run free, then pay-as-you-go. (Source: From the telegram-intelligence-pro pay-per-event config and source (post-extracted skips empty rows; TRIAL_FREE_EVENTS=30 in src/utils/charge.ts). Check the actor's README for current per-event prices.)

## FAQ

### Can I scrape a Telegram channel without the API or a phone number?

Yes, for public channels. Every public channel has a web preview at t.me/s/<channel> that Telegram renders as server-side HTML, so an HTTP request and an HTML parser can read recent posts with no api_id, api_hash, bot token, or phone number. This is exactly what the builder targets. Private channels and groups still require an authenticated MTProto session via a library like Telethon.

### How far back can I pull posts from a Telegram channel?

The public web preview only serves a recent window of a channel's posts, paginating backward with the ?before= parameter rather than exposing the full archive. For complete channel history beyond that window you need Telegram's official MTProto API with credentials. In this builder, set maxPostsPerChannel for a snapshot, or use posts_history mode for deeper backward scrolling within whatever the preview still serves.

### Is it legal to scrape a Telegram channel?

Public channel previews are designed to be publicly viewable, and extracting publicly available factual data is generally considered lawful in many jurisdictions. That is not legal advice: you should review Telegram's Terms of Service, respect copyright and personal-data rules like GDPR, and avoid abusive automation, which can get accounts restricted. Consult counsel for high-stakes or commercial use cases.

### What data can I extract from a Telegram channel?

The public preview exposes channel metadata (handle, title, description, verified status, subscriber count, media counts, avatar) and per-post fields: text, post ID, posted-at timestamp, view count, reaction emojis with counts, forwards, forwarded-from handle/name, and media URLs. The builder's preview shows the full output shape with channel records and post records so you know the exact fields before you run.

### Can I download media and images attached to channel posts?

The web preview includes media URLs (photos, videos, files) attached to each post, which the output exposes in a mediaUrls field. That gives you direct links to fetch the media yourself. The builder previews where these URLs appear in the output shape; actually retrieving the live URLs happens when you run the generated config on the backing actor.

### What is the difference between this query builder and a live scraper?

This page is a builder: you enter channel handles and options, it assembles a valid input config and shows a fixed example of the output shape. It does not fetch live posts in your browser, because the source is not open to in-browser cross-origin requests. To get real data, copy the generated config and run it on the backing Apify actor, which performs the actual extraction.

### How do I watch a Telegram channel for new posts?

Use monitor_channels mode. The actor stores a checkpoint of the last seen post per channel and, on each scheduled run, returns only the delta (new posts since last time). Build the config here by listing your channels, then schedule the actor to run on a cron in Apify. You are not re-billed for posts you already captured, though each genuinely new delta post is a chargeable event — so cost scales with how much fresh content a channel publishes between runs, not with its backlog.

### What does it cost to run the backing Telegram actor?

The telegram-intelligence-pro actor is free to start, then pay-as-you-go on a pay-per-event model. It charges per non-empty post extracted (a post with text, media, views, or reactions) rather than per row, plus small per-event charges for each resolved channel, each search-keyword match, and each new post detected in monitor mode. The first 30 chargeable events in every run are free. See the actor's README and input schema for the current per-event prices before running at scale.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [LinkedIn profile scraper](https://datatooly.xyz/linkedin-profile-lookup/)
- [Threads profile scraper](https://datatooly.xyz/threads-profile-search/)
- [Threads keyword monitor](https://datatooly.xyz/threads-keyword-monitor/)
- [Reddit search tool](https://datatooly.xyz/reddit-search-builder/)
