# Scrape Threads profiles, posts & hashtags

> A Threads scraper extracts public data from threads.com — profiles, posts, hashtags, and search results — into structured JSON or CSV. This free query builder lets you configure a scrape (mode, usernames, post limits) and preview the exact output shape, then run it live on the backing Apify actor, which is free to start and then pay-as-you-go. No login or API key is required for public data.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Social & Community](https://datatooly.xyz/category/social-community/)
- URL: https://datatooly.xyz/threads-profile-search/
- Backing Apify actor: [threads-scraper](https://apify.com/constructive_calm/threads-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Build a Threads Scraper for Meta Profiles and Posts](https://datatooly.xyz/guides/build-threads-scraper-profiles-posts/)

Enter Threads usernames and preview the public profile records the actor extracts without a login: bio, follower count, verification and links.

## Key takeaways

- This page is a query builder: you configure the scrape and preview the output shape here, then run it live on the Apify actor — it does not fetch live Threads results in your browser.
- The backing actor scrapes public threads.com data in six modes: posts by user, profile, post detail (discussion tree), search, hashtag, and monitor (new posts since last run).
- No Threads login or API key is needed — public profiles and posts are read from server-rendered JSON embedded in the page.
- Output includes username, userId, follower count, bio, verification status, post text, engagement metrics (likes, replies, reposts, quotes), media URLs, and timestamps.
- The actor is free to start, then pay-as-you-go: the first 10 chargeable events per run are free, then per-event pricing applies.
- Private accounts, full follower lists, and deep nested reply chains cannot be scraped without login; per-profile post volume is limited by what Threads serves publicly.

## How it works

### 1. Choose a scrape mode

Select what you want to extract: posts by user (recent posts feed), profile (user info), hashtag, search, post detail (a post plus its public discussion tree), or monitor (only new posts since the last run). The default template uses posts-by-user mode.

### 2. Enter usernames or queries

Add the Threads usernames you want (without the @), or a hashtag/keyword for hashtag and search modes. For post detail mode, paste full threads.com post URLs. The builder accepts a list, so you can target several accounts in one run.

### 3. Set the post limit

Set maxPostsPerUser to cap how many recent posts to keep per account (the template defaults to 25). Remember Threads only serves a limited public window, so very high values will not page through full history.

## How to use it

1. **Choose a scrape mode** — Select what you want to extract: posts by user (recent posts feed), profile (user info), hashtag, search, post detail (a post plus its public discussion tree), or monitor (only new posts since the last run). The default template uses posts-by-user mode.
2. **Enter usernames or queries** — Add the Threads usernames you want (without the @), or a hashtag/keyword for hashtag and search modes. For post detail mode, paste full threads.com post URLs. The builder accepts a list, so you can target several accounts in one run.
3. **Set the post limit** — Set maxPostsPerUser to cap how many recent posts to keep per account (the template defaults to 25). Remember Threads only serves a limited public window, so very high values will not page through full history.
4. **Preview the output shape** — Review the example output shown here — username, follower count, bio, post text, engagement metrics, media URLs, and timestamps — so you know the dataset structure before you run anything.
5. **Run it live on Apify** — Copy the generated config into the backing Apify actor and start the run. The actor is free to start then pay-as-you-go; it executes the scrape and returns the dataset as JSON, CSV, or Excel.

## Example output

A fixed sample of the fields the threads-scraper actor returns — example data, not live results.

| username | fullName | followerCount | isVerified | biography |
| --- | --- | --- | --- | --- |
| jane.example | Jane Example | 18400 | false | Product designer. Writing about UX and small tools. |
| omar.sample | Omar Sample | 62300 | true | Home cook sharing 15-minute dinners. |
| priya.placeholder | Priya Placeholder | 9870 | false | Running coach \| marathon plans in bio link |
| alex.demo | Alex Demo | 4125 | false | Indie game dev. Devlogs every Friday. |
| maria.muster | Maria Muster | 27650 | false | Travel photographer based in Lisbon. |

## Ready-to-run actor input

```json
{
  "mode": "profile",
  "maxPostsPerUser": 25
}
```

## Key facts

- Threads does not offer a public posts API, so public data is read from JSON that Threads embeds in its page markup (script tags), not from an official API. (Source: From the actor's README and input schema; corroborated across multiple Apify Threads actor listings and community scraping guides.)
- Public Threads profiles, posts, hashtags, and search all load without authentication, and the backing actor reads them cookie-free. Logged-in search may surface a fuller set, but public search returns real results without a login. (Source: From the actor's README and confirmed by community scraping guides.)
- The backing Apify actor is free to start, then pay-as-you-go: the first 10 chargeable events per run are free, with per-event pricing from $0.0015 (reply) and $0.0035 (post) up to $0.020 (premium bio-contact extraction). (Source: From the actor's README and pay-per-event configuration.)
- Per-profile public post availability is approximately 7–25 posts per fetch without pagination, varying by account and content type. (Source: From the actor's README and input schema; consistent with general Threads public-page limits noted in community scraping guides.)
- US courts (Ninth Circuit, hiQ Labs v. LinkedIn) have held that scraping publicly available web data does not violate the Computer Fraud and Abuse Act, though platform Terms of Service and privacy laws like GDPR still apply. (Source: Widely reported summary of hiQ v. LinkedIn (2022); cited in scraping-legality overviews. Not legal advice.)

## FAQ

### What is a Threads scraper?

A Threads scraper is a tool that extracts public data from Meta's Threads (threads.com) — user profiles, posts, hashtags, and search results — and returns it as structured JSON or CSV instead of raw HTML. It reads data Threads already embeds in the page as server-rendered JSON. This builder configures the scrape and previews the output shape; the backing Apify actor runs it live and is free to start, then pay-as-you-go.

### Do I need to log in or get an API key to scrape Threads?

No. Public Threads profiles and posts load without authentication, and the backing actor reads them cookie-free, so you do not need a Threads login or an official API key. Threads does not offer a public posts API, so scraping the public web pages is the standard route. Note that search results and full follower lists require login on Threads itself, so those are not fully accessible without it.

### Does this page scrape Threads live in my browser?

No. This is a query builder. You pick a mode (posts by user, profile, hashtag, search, post detail, or monitor), enter usernames or queries, set limits, and preview the exact output shape. The browser cannot fetch threads.com results directly because the page is not CORS-open to other sites. You copy the generated config and run it on the backing Apify actor, which executes the scrape and returns the dataset.

### What data fields can I extract from a Threads profile?

Profile mode returns username, userId, full name, biography, follower count, verification status, and profile/bio links. Post records add the post text, engagement metrics (likes, replies, reposts, and quotes), media URLs, timestamps, and whether a post is a reply or repost. An optional bio-contact step can parse emails and phone numbers from public bios for outreach.

### How many posts per profile can I scrape?

Threads serves a limited window of recent posts per profile to anonymous visitors — roughly 7 to 25 without pagination, depending on the account and content type. The maxPostsPerUser setting caps how many you keep per user. You cannot reliably page through an entire post history of a high-volume account, because Threads gates older posts and full lists behind login.

### Is scraping Threads legal?

Scraping publicly available Threads data is generally treated as lawful in the US; the Ninth Circuit's hiQ v. LinkedIn ruling held that scraping public web data does not violate the CFAA. However, Meta's Terms of Use restrict automated collection, and GDPR or similar laws can apply when you process personal data of EU residents. Scrape only public data, keep request rates reasonable, and review the relevant terms before commercial use.

### How much does the backing Threads actor cost?

The backing Apify actor is free to start, then pay-as-you-go using a pay-per-event model. The first 10 chargeable events per run are free, after which individual events are priced — from roughly $0.0015 for a reply, $0.0035 for a post, and $0.005 for a profile, up to about $0.020 for premium bio-contact extraction. You only pay for what each run actually processes; there is no flat subscription required to begin.

### Can I scrape Threads followers or a full follower list?

Not completely. Threads does not display the entire follower or following list for large accounts to anonymous visitors, so no tool can export the full list without login — the unlisted entries simply are not served. You can reliably capture a profile's aggregate follower count, bio, links, and recent posts, but treat exhaustive follower-by-follower exports as out of scope for public scraping.

### Can I monitor a Threads account for new posts?

Yes. The backing actor has a monitor mode that detects only posts published since the previous run for the usernames you specify, instead of re-fetching everything. It stores a per-user watermark in the run's Key-Value Store, so it is suitable for scheduled runs that track new activity from a watchlist of accounts. You configure the usernames in this builder and then schedule the actor run on Apify to keep the dataset incrementally updated.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [LinkedIn profile scraper](https://datatooly.xyz/linkedin-profile-lookup/)
- [Threads keyword monitor](https://datatooly.xyz/threads-keyword-monitor/)
- [Reddit search tool](https://datatooly.xyz/reddit-search-builder/)
- [Telegram channel scraper](https://datatooly.xyz/telegram-channel-search/)
