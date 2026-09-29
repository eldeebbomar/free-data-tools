# Search the TikTok Ad Library (EU/DSA)

> The TikTok ad library API exposes ads from TikTok's EU Commercial Content Library (library.tiktok.com), covering the EEA, UK, Switzerland and Turkey under the EU Digital Services Act. TikTok's own API is restricted to approved academic researchers, so this builder lets you check whether a market is covered, assemble a ready-to-run query by keyword or advertiser, and preview the output shape — then you run it live on the Apify actor.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Ads Intelligence](https://datatooly.xyz/category/ads-intelligence/)
- URL: https://datatooly.xyz/tiktok-ad-library-search/
- Backing Apify actor: [tiktok-ad-library-pro](https://apify.com/constructive_calm/tiktok-ad-library-pro?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [The TikTok Ad Library API: A Developer's Guide to the DSA Library](https://datatooly.xyz/guides/tiktok-ad-library-api/)

Enter keywords and EU/DSA regions and preview the TikTok Ad Library records the actor exports: advertiser, ad name, region, dates and estimated audience.

## Key takeaways

- TikTok's official Commercial Content API is gated to approved academic researchers and qualified organizations in the US/EU, is non-commercial only, and approval can take weeks to months — it is not open to marketers or agencies.
- The public TikTok Commercial Content Library at library.tiktok.com is free to browse, needs no login, and exists because the EU Digital Services Act requires TikTok to disclose ads served in the region.
- The EU Ad Library covers EU/DSA markets only: the 27 EEA states plus EEA add-ons (Iceland, Liechtenstein, Norway), the UK, Switzerland and Turkey — 33 regions in total, not the US. For global top-performing ads (US included), the same actor has a separate Creative Center mode.
- This page is a query builder and coverage checker: you check whether one target region has data, assemble a keyword or advertiser query, and preview the output shape, then run it live on the backing Apify actor (it does not fetch live ads in your browser).
- Keyword search is hard-capped by TikTok at roughly 1,000 results per (keyword, region); searching by advertiser name or business ID is uncapped, so large advertisers can return hundreds of thousands of ads.
- The backing actor 'tiktok-ad-library-pro' by constructive_calm is free to start, then pay-as-you-go — the first 10 chargeable events per run are free — returning structured JSON with creatives, advertiser identity, dates active and per-region targeting/reach data.

## How it works

### 1. Enter a keyword or advertiser

Enter a keyword you want to track (for example a product category or campaign term), or switch to advertiser search and enter a brand name or business ID to pull a specific competitor's full ad set, which is uncapped unlike keyword search.

### 2. Pick a covered target market

Choose one target region from the 33 supported EU/DSA markets — the 27 EEA states plus Iceland, Liechtenstein, Norway, the UK, Switzerland and Turkey. The checker confirms whether TikTok publishes data for that market; the US and other non-EU markets are not covered and will have no ads.

### 3. Check coverage and the query type

Confirm the coverage verdict for your chosen market, and note the query type: keyword search is capped at roughly 1,000 results per keyword-and-region pair, while advertiser-ID search is uncapped — the better choice for exhaustive competitor research.

## How to use it

1. **Enter a keyword or advertiser** — Enter a keyword you want to track (for example a product category or campaign term), or switch to advertiser search and enter a brand name or business ID to pull a specific competitor's full ad set, which is uncapped unlike keyword search.
2. **Pick a covered target market** — Choose one target region from the 33 supported EU/DSA markets — the 27 EEA states plus Iceland, Liechtenstein, Norway, the UK, Switzerland and Turkey. The checker confirms whether TikTok publishes data for that market; the US and other non-EU markets are not covered and will have no ads.
3. **Check coverage and the query type** — Confirm the coverage verdict for your chosen market, and note the query type: keyword search is capped at roughly 1,000 results per keyword-and-region pair, while advertiser-ID search is uncapped — the better choice for exhaustive competitor research.
4. **Preview the output shape** — Review the bundled example output: ad ID, creative URLs, advertiser identity, first/last shown dates, days active, estimated audience and per-region targeting. This shows exactly what fields you will receive before you spend anything.
5. **Run the query live on the actor** — Open the prefilled run form on the Apify actor and start it. The actor — free to start, then pay-as-you-go, with the first 10 chargeable events per run free — handles the live fetching at scale across all 33 covered regions and returns structured JSON (CSV is available via Apify's standard dataset export).

## Example output

A fixed sample of the fields the tiktok-ad-library-pro actor returns — example data, not live results.

| advertiserName | name | queryRegion | firstShownDate | estimatedAudience |
| --- | --- | --- | --- | --- |
| Glowlab Skincare | Vitamin C serum launch | DE | 2026-08-02 | 100K-1M |
| Glowlab Skincare | Night cream 2-for-1 | FR | 2026-09-01 | 10K-100K |
| Example Beauty Co | Hydrating serum routine | IT | 2026-07-15 | 1M-10M |
| Sample Derm | SPF 50 daily fluid | ES | 2026-06-20 | 10K-100K |
| Placeholder Naturals | Retinol alternative serum | NL | 2026-09-10 | 1K-10K |

## Ready-to-run actor input

```json
{
  "mode": "eu_dsa_library",
  "regions": [
    "DE"
  ],
  "maxItems": 50
}
```

## Key facts

- TikTok's Commercial Content Library covers ads served in the European Economic Area, the UK, Switzerland and Turkey, launched in response to the EU Digital Services Act. (Source: TikTok Newsroom and support.tiktok.com Commercial Content Library pages, plus the actor's README; verified via WebSearch June 2026.)
- The official TikTok Commercial Content API is restricted to approved academic researchers and qualified organizations in the US/EU, is non-commercial only, and approval can take weeks or months. (Source: developers.tiktok.com Commercial Content API documentation; verified via WebFetch June 2026.)
- The official Commercial Content API is tightly rate-limited and intended for research, which makes it unsuitable for bulk commercial collection. (Source: developers.tiktok.com Commercial Content API documentation (research-access and rate-limit terms); no specific daily request figure is published, so none is claimed here.)
- The backing Apify actor covers 33 DSA regions and returns about 32 fields per ad, including creatives, advertiser identity, dates active and per-region targeting/reach. (Source: From the actor's README ('Data fields (32 per ad)') and input schema (33-region enum) for constructive_calm/tiktok-ad-library-pro.)
- Keyword search is hard-capped by TikTok at roughly 1,000 results per keyword-and-region pair, while advertiser-name and business-ID searches are uncapped. (Source: From the actor's README and input schema (input-mode descriptions) for constructive_calm/tiktok-ad-library-pro.)
- The backing actor is free to start, then pay-as-you-go, charging $0.0008 per EU Ad Library ad scraped with no run-start fee (about $0.80 per 1,000 ads), with the first 10 chargeable events per run free. (Source: From the actor's README pricing table and pay_per_event configuration for constructive_calm/tiktok-ad-library-pro.)

## FAQ

### Is there an official TikTok ad library API?

Yes, TikTok runs a Commercial Content API tied to its EU Commercial Content Library, but access is restricted. It is open only to approved academic researchers and qualified organizations in the US and Europe, requires a research-purpose application that can take weeks or months, and commits users to non-commercial use. Marketers, agencies and commercial entities cannot get access, which is why most people use the public library or a scraper instead.

### Is the TikTok ad library API free?

TikTok's official Commercial Content API is free but gated to approved researchers, is tightly rate-limited, and carries a non-commercial commitment. The public Commercial Content Library at library.tiktok.com is free to browse with no login. The backing Apify actor used here is free to start, then pay-as-you-go — you only pay for the ads you actually scrape (there is no run-start fee), and the first 10 chargeable events per run are free so you can validate the output first.

### Which countries does the TikTok ad library cover?

Coverage is EU/DSA only. The library reflects ads served in the European Economic Area (the 27 EU states plus Iceland, Liechtenstein and Norway), the United Kingdom, Switzerland and Turkey — 33 regions in total. It does not cover the United States or other global markets, because the library exists to satisfy EU Digital Services Act transparency rules, not voluntary global disclosure. Use the coverage check here to confirm your target market has data before you run anything.

### How do I search the TikTok ad library by keyword?

In this builder you enter a keyword (or switch to an advertiser ID), pick one target region, and preview the generated query and output shape before running it live on the actor. Keyword search maps to TikTok's library search. Note TikTok hard-caps keyword results at roughly 1,000 per keyword-and-region pair, so for exhaustive coverage of a single brand, search by advertiser name or business ID instead, which is uncapped. The paid actor runs your query across multiple regions in bulk.

### Can I search TikTok ads by advertiser or competitor name?

Yes. Searching by advertiser is the most reliable way to pull a competitor's full ad set, because it is uncapped unlike keyword search. The backing actor can auto-resolve a brand name to its TikTok business IDs — large advertisers like Temu run under many business IDs and have returned hundreds of thousands of ads — so an advertiser query gathers ads across all of them. You can also pass a direct business ID for the tightest match. Build the query here, then run it live.

### What data fields does the TikTok ad library return?

The backing actor returns structured JSON with about 32 fields per ad: ad ID, name and URL; whether it is active; first-shown and last-shown dates and days active; media type with video and cover-image URLs; advertiser name, business IDs, registry location and sponsor; the query region; estimated audience and total impressions; plus per-region targeting drill-down by age, gender and reach. Creatives and targeting are exactly what the EU/DSA library publicly exposes.

### Why does this tool build a query instead of returning live ads?

TikTok's library is not open for direct browser calls — its endpoint is not CORS-accessible and requires session and anti-CSRF tokens plus specific headers a browser cannot set, so a static web page cannot fetch live ads. Instead this builder validates coverage, generates a clean ready-to-run configuration, and shows a bundled example of the output shape so you know exactly what you will get. You then run that query live on the Apify actor, which handles the tokens, headers and pagination at scale.

### How is the TikTok Commercial Content Library different from the Creative Center?

They are two separate TikTok tools. The Commercial Content Library is a DSA transparency repository at library.tiktok.com covering EU, UK, Switzerland and Turkey ads, searchable by advertiser, keyword, date and country. The Creative Center is a global marketing inspiration tool showing trending and top-performing ads with creative signals. This builder targets the Commercial Content Library, which is the source with structured advertiser, date and targeting data. The backing actor can also pull Creative Center top-ads leaderboards (81 countries, US included) in its separate creative_center mode.

### Is scraping the TikTok ad library legal?

The Commercial Content Library is a public, login-free transparency surface that TikTok is legally required to publish under the EU Digital Services Act, and scrapers only access data TikTok already makes public to every visitor. That said, you should review TikTok's terms, avoid redistributing data in ways the terms prohibit, and use the data for legitimate competitive research. This page does not provide legal advice; consult your own counsel for your specific use case.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Facebook Ad Library scraper](https://datatooly.xyz/facebook-ad-library-search/)
- [LLM brand-visibility monitor](https://datatooly.xyz/llm-visibility-monitor-tool/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
