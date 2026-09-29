# Facebook Ad Library Scraper — search & export competitor ads

> A Facebook Ad Library scraper is a tool that pulls public ad data — creatives, copy, CTAs, advertiser, and run dates — from Meta's Ad Library at scale. This page is a query builder: you set a keyword, country, and active-status filter to generate a ready-to-run config and preview the output shape, then run it live on the backing Apify actor (free to start, then pay-as-you-go).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Ads Intelligence](https://datatooly.xyz/category/ads-intelligence/)
- URL: https://datatooly.xyz/facebook-ad-library-search/
- Backing Apify actor: [facebook-ad-library-pro](https://apify.com/constructive_calm/facebook-ad-library-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Facebook Ad Library Scraper: API Limits and the Real Approach](https://datatooly.xyz/guides/facebook-ad-library-scraper/)

Search Meta's public Ad Library by keyword, advertiser and country, then preview the ad records the actor exports: advertiser page, ad copy, platforms and start date.

## Key takeaways

- This is a query builder: it assembles a ready-to-run config and shows a fixed example of the export shape — it does not fetch live ads in your browser.
- Set three core inputs — keyword (or advertiser name), country (ISO code like US), and active status (active vs all) — plus an optional max-items cap.
- The Facebook Ad Library itself is free and public at facebook.com/ads/library, with no login required, but it has no native bulk export or CSV.
- The backing Apify actor (facebook-ad-library-pro) runs the search at scale and is free to start — the first 3 chargeable events of each run are free — then pay-as-you-go per ad scraped.
- EU and UK ads carry extra transparency data (demographic reach and targeting); political and social-issue ads are archived for 7 years with spend and funding details.
- The official Meta Ad Library API requires a developer app plus government-ID verification and is rate-limited — the actor avoids that friction.

## How it works

### 1. Enter a keyword or advertiser name

Type the brand, product, or topic you want to research into the keyword field — for example a competitor's name or a niche term. This becomes the search term the backing actor runs against Meta's public Ad Library.

### 2. Choose a country

Set the country using an ISO code such as US, GB, or DE. Ad availability and content vary by region, and EU/UK selections surface extra transparency fields like demographic reach.

### 3. Set the active status and item cap

Pick 'active' to see only ads running now, or 'all' to include archived political and social-issue ads. Set max items (for example 50) to control how many ads the run returns and to keep the test small.

## How to use it

1. **Enter a keyword or advertiser name** — Type the brand, product, or topic you want to research into the keyword field — for example a competitor's name or a niche term. This becomes the search term the backing actor runs against Meta's public Ad Library.
2. **Choose a country** — Set the country using an ISO code such as US, GB, or DE. Ad availability and content vary by region, and EU/UK selections surface extra transparency fields like demographic reach.
3. **Set the active status and item cap** — Pick 'active' to see only ads running now, or 'all' to include archived political and social-issue ads. Set max items (for example 50) to control how many ads the run returns and to keep the test small.
4. **Generate the query and preview the output shape** — The builder assembles your inputs into a ready-to-run config and shows a fixed example of the export — fields like creative, copy, CTA, advertiser, and run dates — so you know exactly what to expect.
5. **Run it live on the Apify actor** — Send the config to the backing actor (facebook-ad-library-pro) to execute the real scrape. It is free to start, then pay-as-you-go per ad. Download the results as CSV, JSON, or Excel when the run finishes.

## Example output

A fixed sample of the fields the facebook-ad-library-pro actor returns — example data, not live results.

| pageName | bodyText | publisherPlatform | startDate | isActive |
| --- | --- | --- | --- | --- |
| Stride Running Co. | Our lightest trail shoe yet. Built for long miles and rocky descents. | ["FACEBOOK","INSTAGRAM"] | 1756684800 | true |
| Stride Running Co. | Free returns for 60 days. Find your fit with our online size guide. | ["INSTAGRAM"] | 1754006400 | true |
| PaceLab Fitness | Train for your first half marathon with a 12-week plan built by coaches. | ["FACEBOOK"] | 1757462400 | true |
| Northfield Outdoor Gear | End-of-season sale: up to 40% off running jackets. | ["FACEBOOK","INSTAGRAM","MESSENGER"] | 1751328000 | false |
| Kinetic Sole | Recycled materials, same cushioning. Meet the new everyday runner. | ["FACEBOOK","INSTAGRAM","AUDIENCE_NETWORK"] | 1758067200 | true |

## Ready-to-run actor input

```json
{
  "country": "US",
  "activeStatus": "active",
  "count": 50
}
```

## Key facts

- The Facebook Ad Library is free and open to anyone, with no Facebook account required to search active ads. (Source: Meta Transparency Center and Ad Library documentation.)
- Political and social-issue ads are retained in the Ad Library for 7 years and display spend, reach, and funding-entity information. (Source: Meta Transparency Center stated commitment for ads about social issues, elections, and politics.)
- Meta's official Ad Library API requires a developer app plus government-ID verification and is rate-limited per access token. (Source: Meta for Developers Ad Library API documentation.)
- EU and UK ads in the Ad Library carry extra transparency data, including demographic reach and targeting (location, age, gender) not shown for other regions. (Source: Meta Transparency Center and regional ad-transparency requirements.)
- The backing Apify actor charges per ad scraped on a pay-as-you-go basis and is free to start, with the first 3 chargeable events of each run free. (Source: From the actor's README and input schema (constructive_calm/facebook-ad-library-pro).)
- The backing actor offers a country dropdown of 50+ common ISO codes plus a Custom country code field for any other 2-letter ISO 3166-1 code, and reads the public Ad Library without requiring login credentials. (Source: From the actor's README and input schema (constructive_calm/facebook-ad-library-pro).)

## FAQ

### What is a Facebook Ad Library scraper?

A Facebook Ad Library scraper is a tool that automatically collects public ad data from Meta's Ad Library — the searchable archive of ads running on Facebook, Instagram, Messenger, and related surfaces. It pulls fields like ad creative, body copy, headline, call-to-action, destination URL, advertiser name, and run dates so you can analyze competitor ads in bulk instead of clicking through the web UI one ad at a time.

### Is scraping the Facebook Ad Library legal?

The Ad Library is a public transparency tool that Meta launched specifically so anyone — no Facebook account required — can inspect active ads. Collecting the public, non-personal ad data it displays is generally lower-risk than scraping private or logged-in content. That said, you are responsible for complying with Meta's terms and your local laws. Avoid collecting personal data, and consult counsel for commercial or high-volume use cases.

### Does this tool return live Facebook ads in my browser?

No. This page is a query builder. It takes your keyword, country, and active-status inputs and assembles a ready-to-run configuration, then shows a fixed example of the output shape so you know what fields to expect. The Ad Library source is anti-bot and not open to direct browser requests, so the actual scrape runs on the backing Apify actor, which you launch with one click using the config you built here.

### What data fields can I extract from the Facebook Ad Library?

Public fields typically include the ad creative (image, video, or carousel previews), ad body text, headline, link description, call-to-action text, destination URL, advertiser page name, active status, and the date the ad started running. EU and UK ads add demographic reach and targeting data due to regional transparency laws. Political and social-issue ads also expose spend ranges and the funding entity behind them.

### How much does the Facebook Ad Library scraper cost?

The Ad Library website itself is free to browse. The backing Apify actor that runs your query is free to start, then pay-as-you-go: you are billed per ad scraped, with additional small per-event charges only if you request advertiser resolution or demographic details. The first 3 chargeable events of each run are free, so you can test a small query before scaling up. You only pay for what you actually pull.

### Do I need the official Meta Ad Library API or an access token?

Not for this tool. Meta's official Ad Library API requires registering a developer app, completing government-ID verification, and managing access tokens, and it is rate-limited per token. It is also primarily oriented toward political and social-issue ads. The backing actor reads the public Ad Library directly, so you skip the developer-app setup and ID verification entirely.

### Can I search all countries or only specific ones?

You set a country per query using an ISO country code (for example, US, GB, or DE). The backing actor's country dropdown covers 50+ common ISO codes, and a Custom country code field accepts any other 2-letter ISO 3166-1 code for markets outside the dropdown. Ad content and availability vary by region because Meta filters the Ad Library by country, and EU/UK regions surface additional transparency fields. To cover multiple markets, run one query per country or supply multiple Ad Library search URLs.

### What is the difference between 'active' and 'all' ads?

Active status controls which ads the search returns. 'Active' returns only ads currently running, which is best for seeing what a competitor is spending on right now. 'All' includes inactive ads where they are archived — primarily political and social-issue ads, which Meta retains for seven years. Most commercial (non-political) inactive ads are not archived, so 'all' mainly expands coverage for political and issue advertising.

### How do I export competitor ads to CSV?

The Ad Library web interface has no native bulk export or CSV download. With this builder, you set your keyword, country, and active-status filter, generate the config, and run it on the backing Apify actor. The actor returns a flat, CSV-ready dataset of every matching ad, which you can download as CSV, JSON, or Excel from the run's dataset, or pull through Apify's API for automated reporting.

### Why can't I see ad spend or impressions for every ad?

Meta only publishes spend, impressions, and reach for ads classified as political or social-issue advertising. For ordinary commercial ads, the Ad Library shows the creative, copy, advertiser, and run dates but not performance metrics. The scraper can only return what Meta makes public — it cannot reveal a competitor's private cost-per-click, conversion, or precise audience-targeting data, which Meta does not expose for non-political ads.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [TikTok Ad Library API tool](https://datatooly.xyz/tiktok-ad-library-search/)
- [LLM brand-visibility monitor](https://datatooly.xyz/llm-visibility-monitor-tool/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
