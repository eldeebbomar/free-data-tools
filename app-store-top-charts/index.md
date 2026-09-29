# App Store Top Charts — live, any country, free

> The App Store top charts are Apple's ranked lists of the most popular iOS apps, split into Top Free, Top Paid, and Top Grossing per country. This free tool fetches the official Apple iTunes RSS feed live in your browser and shows the real current ranking, app name, developer, and category. It is genuinely live, not a sample. Apple caps each chart at the top 100.

- Type: Live tool (fetches real data in your browser)
- Category: [App Intelligence](https://datatooly.xyz/category/app-intelligence/)
- URL: https://datatooly.xyz/app-store-top-charts/
- Backing Apify actor: [app-store-rank-tracker](https://apify.com/constructive_calm/app-store-rank-tracker?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [App Store Top Charts API: Free, Key-Free, and CORS-Open](https://datatooly.xyz/guides/app-store-top-charts-api/)

Pick a country and a chart — Top Free, Top Paid, or Top Grossing — and see the live App Store rankings right in your browser: rank, app, developer, category. Straight from Apple's official feed. Free, no login, no API key.

## Key takeaways

- The tool is genuinely live: it reads Apple's official iTunes RSS top-charts feed directly in your browser (CORS-open, no API key, no login) and shows the real current ranking.
- Three chart types: Top Free ranks by download volume, Top Paid ranks by paid download volume, and Top Grossing ranks by total revenue including in-app purchases.
- Apple limits the public RSS feed to the top 100 apps per chart per country, so this tool shows ranks 1 through 100.
- Charts are country-specific because demand, competition, localization, and spending power differ by region, so the #1 app in the US is often not #1 elsewhere.
- Each row shows rank, app name, developer, and category pulled straight from Apple's feed.
- For 150+ countries, category charts, rank-change deltas, risers/fallers, forecasts, scheduled history, and per-app enrichment, the App Store + Google Play Rank Tracker actor is free to start, then pay-as-you-go.
- Google Play's charts are not reliably browser-fetchable (they typically need a proxy server-side), which is why this in-browser tool covers the Apple App Store only.

## How it works

### 1. The real, current App Store charts

This reads Apple's official iTunes RSS top-charts feed directly from your browser, so the rankings are live — the actual apps charting right now in the country and chart you pick, with developer and category.

### 2. Compare countries and chart types

Switch between Top Free, Top Paid and Top Grossing, and across markets from the US to Japan to the UAE. A fast way to see what's winning where, or how an app ranks in a target market today.

### 3. Track movement over time with the actor

The Rank Tracker actor covers 150+ countries and category charts, enriches each app (ratings, reviews, developer, screenshots), computes rank-change deltas + risers/fallers + a statistical forecast, keeps snapshot history, and exports JSON/CSV/API. Google Play too (server-side).

## How to use it

1. **Pick a country** — Choose the storefront you want, such as United States, United Kingdom, Japan, or Brazil. Each country has its own ranking because demand and competition differ by region.
2. **Choose a chart type** — Select Top Free, Top Paid, or Top Grossing. Top Free and Top Paid rank by downloads; Top Grossing ranks by total revenue including in-app purchases.
3. **Load the live ranking** — The tool fetches Apple's official iTunes RSS feed directly in your browser and renders the real current ranking, up to Apple's cap of 100 apps.
4. **Read each app's details** — Scan the list for rank position, app name, developer, and category to spot leaders, newcomers, and category competitors.
5. **Upgrade for depth** — For 150+ countries, category charts, rank-change deltas, risers/fallers, forecasts, scheduled history, and CSV/JSON/API export, run the App Store + Google Play Rank Tracker actor, free to start, then pay-as-you-go.

## Ready-to-run actor input

```json
{
  "platforms": [
    "apple"
  ],
  "countries": [
    "us"
  ],
  "chartTypes": [
    "top-free"
  ],
  "resultsPerChart": 100
}
```

## Key facts

- Apple's public iTunes RSS top-charts feed returns a maximum of 100 ranked apps per chart per country. (Source: Verified live 2026-06-01 against the Apple iTunes RSS feed (itunes.apple.com/us/rss/topfreeapplications): the feed.entry array returned the ranked apps in order. Apple's RSS feed limit is up to 100 per chart.)
- The live feed returns each app's name, developer, and category, plus icon and App Store URL. (Source: Directly observed in the JSON structure of the iTunes RSS feed on 2026-06-01 (fields im:name, im:artist, category).)
- The feed is published by Apple and the data is Apple's; respect Apple's terms when reusing it. (Source: Apple iTunes RSS feed is an official Apple endpoint; chart data is Apple's property.)
- Apple is reported to refresh its charts several times per day (exact cadence is not officially published); Google Play is generally reported to update roughly once per day. (Source: Refresh cadence is Apple-side and not officially published; figures here are widely-reported approximations, not an Apple SLA.)
- Top Free and Top Paid charts rank by download velocity, while Top Grossing ranks by total revenue including in-app purchases (ad revenue excluded). (Source: ASO industry sources (aso.dev, AppTweak) surfaced via WebSearch, May 2026.)
- The Apple RSS top-charts feed is CORS-open (Access-Control-Allow-Origin: *), allowing direct browser fetch with no API key. (Source: Verified 2026-06-01: itunes.apple.com/{cc}/rss/* returns a permissive Access-Control-Allow-Origin header, so the cross-origin browser fetch succeeds without a proxy.)

## FAQ

### Is this App Store top charts tool actually live or just a sample?

It is genuinely live. When you pick a country and chart, the tool fetches Apple's official iTunes RSS top-charts feed directly in your browser. The feed returns a permissive CORS header, so no key or server is needed, and it returns the real current ranking with app name, developer, and category. The data is Apple's own. It is not a cached or sample dataset.

### How many apps does the App Store top charts feed show?

Apple's public iTunes RSS feed caps each chart at the top 100 apps per country, so this tool shows ranks 1 through 100. Verified live, the US Top Free feed returns exactly 100 results, from rank #1 down to rank #100. To go deeper than 100, track category charts, or pull 150+ countries, use the App Store + Google Play Rank Tracker actor, which is free to start, then pay-as-you-go.

### What is the difference between Top Free, Top Paid, and Top Grossing?

Top Free ranks apps by free download volume, and Top Paid ranks apps by paid download volume, so both measure download velocity. Top Grossing ranks by total revenue, combining paid downloads and in-app purchases, so it measures revenue velocity. That is why a free game with strong in-app purchases can sit low on Top Free yet high on Top Grossing. Ad revenue is excluded because it does not flow through Apple's billing.

### How often do the App Store top charts update?

Apple refreshes its charts multiple times per day. Apple is widely reported to refresh charts several times a day (exact cadence is not officially published). Because this tool reads Apple's RSS feed live each time you load it, you always see Apple's most recently published ranking rather than a snapshot from yesterday. Google Play, by contrast, typically updates its charts once per day.

### Why are App Store rankings different in each country?

Apple maintains separate charts per storefront because demand, competition, localization quality, seasonality, and spending power differ by region. A high-performing local app can dominate one country's chart while a US-led app ranks lower there. Wealthier iOS markets also skew Top Grossing differently than download-heavy markets skew Top Free. That is why this tool lets you switch countries, and the upgrade actor covers 150+ storefronts.

### Can I see the App Store top charts for free?

Yes. This tool is free to use with no signup, no key, and no quota, because it reads Apple's open RSS feed in your browser. For heavier needs (150+ countries, all three chart types at once, category charts, rank-change deltas, risers and fallers, statistical forecasts, scheduled history, and CSV/JSON/API export), the backing App Store + Google Play Rank Tracker actor on Apify is free to start, then pay-as-you-go.

### Does this tool cover Google Play top charts too?

This in-browser tool covers the Apple App Store only, because Apple's RSS feed is CORS-open and safe to fetch from a browser. Google Play top charts are not browser-fetchable; they require a residential proxy server-side. The App Store + Google Play Rank Tracker actor handles both stores server-side, so if you need Google Play rankings alongside iOS, use the actor, which is free to start, then pay-as-you-go.

### What data fields does each top-charts row include?

Each row in this tool shows the app's rank position, app name, developer, and category. The underlying feed also carries the app icon and App Store URL. For deeper per-app enrichment such as star ratings, review counts, and screenshots, the Rank Tracker actor adds those fields on top of the raw chart positions.

### How is this different from Sensor Tower, AppTweak, or Appfigures top charts?

Those platforms layer analytics, history, and estimates on top of chart data, usually behind signup or paid tiers. This tool is the opposite: a zero-friction, no-signup window onto Apple's own live RSS ranking, ideal for a quick real-time check. When you outgrow the 100-app, single-country, current-snapshot limit, the Rank Tracker actor adds history, deltas, forecasts, and 150+ countries, free to start, then pay-as-you-go.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Hacker News search](https://datatooly.xyz/hacker-news-search/)
- [Shopify product scraper](https://datatooly.xyz/shopify-store-products/)
- [SaaS pricing tracker](https://datatooly.xyz/saas-pricing-tracker-tool/)
