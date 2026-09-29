# Gulf used-car listings — search & export

> Dubai used-car listings data is structured records of pre-owned vehicles for sale on Gulf marketplaces: make, model, year, price, mileage, GCC spec, seller type and listing URL. This query builder lets you pick platforms (DubiCars, Dubizzle), set a make, model and per-platform cap, and preview the output shape. The backing Apify actor runs the export, pay-as-you-go per listing extracted.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Automotive](https://datatooly.xyz/category/automotive/)
- URL: https://datatooly.xyz/gulf-used-car-search/
- Backing Apify actor: [gulf-used-car-scraper](https://apify.com/constructive_calm/gulf-used-car-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Extract Dubai Used Car Listings Data from Gulf Marketplaces](https://datatooly.xyz/guides/dubai-used-car-listings-data/)

Choose DubiCars or Dubizzle, a make and a model, and preview the UAE used-car listings the actor exports: price, year, mileage and GCC spec.

## Key takeaways

- This page is a query builder: you assemble a config (platforms, make, model, listing cap) and preview the output shape — it does not fetch live listings in your browser. You run the export live on the backing Apify actor.
- Output rows are normalized across DubiCars and Dubizzle Motors with consistent fields: make, model, year, price, currency (AED), mileageKm, fuelType, transmission, sellerType, isGccSpec, listingUrl and scrapedAt.
- DubiCars lists roughly 24,000 used cars in Dubai and Dubizzle Motors over 34,000 — enough volume for genuine price benchmarking, dealer monitoring and arbitrage analysis.
- Leave make and model empty to scan the whole market, or set them (e.g. Toyota / Land Cruiser) to pull a focused segment. Note: filtering by model requires a make to be set.
- The backing actor is free to start using Apify's platform free credits, then pay-as-you-go — it charges per listing extracted on a pay-per-event basis, not a flat subscription.
- Use maxListingsPerPlatform to cap volume and cost; raise it for full-market sweeps, keep it low (e.g. 10) for quick samples.

## How it works

### 1. Pick your platforms

In the platforms field, select the marketplaces to cover — for example dubicars, dubizzle, or both. Covering both gives wider coverage and lets you compare the same model across a dealer portal and a consumer marketplace.

### 2. Set make and model (or leave blank)

Enter a make (e.g. Toyota) and model (e.g. Land Cruiser) to pull a focused segment, or leave both empty to scan the entire used-car market on the selected platforms. Filtering by model requires a make to be set.

### 3. Cap the listing volume

Set maxListingsPerPlatform to control how many rows — and therefore how much cost — each run produces. Use a small number like 10 for a quick sample; raise it for a full-market sweep.

## How to use it

1. **Pick your platforms** — In the platforms field, select the marketplaces to cover — for example dubicars, dubizzle, or both. Covering both gives wider coverage and lets you compare the same model across a dealer portal and a consumer marketplace.
2. **Set make and model (or leave blank)** — Enter a make (e.g. Toyota) and model (e.g. Land Cruiser) to pull a focused segment, or leave both empty to scan the entire used-car market on the selected platforms. Filtering by model requires a make to be set.
3. **Cap the listing volume** — Set maxListingsPerPlatform to control how many rows — and therefore how much cost — each run produces. Use a small number like 10 for a quick sample; raise it for a full-market sweep.
4. **Preview the output shape** — Review the fixed example output on this page so you know exactly which fields (make, model, price, mileageKm, sellerType, listingUrl, scrapedAt, etc.) you will receive and can map them to your spreadsheet or database.
5. **Run the export live on the actor** — Copy the generated config into the backing Apify actor and run it. New Apify accounts get free platform credits to test, then it bills pay-as-you-go per event. Export the resulting dataset as JSON, CSV or Excel.

## Example output

A fixed sample of the fields the gulf-used-car-scraper actor returns — example data, not live results.

| title | price | currency | year | mileageKm |
| --- | --- | --- | --- | --- |
| 2021 Toyota Land Cruiser | 239000 | AED | 2021 | 64000 |
| 2020 Nissan Patrol | 168000 | AED | 2020 | 88000 |
| 2023 Lexus LX 600 | 455000 | AED | 2023 | 21000 |
| 2019 Toyota Camry | 58000 | AED | 2019 | 112000 |
| 2022 Mitsubishi Pajero | 97000 | AED | 2022 | 41000 |

## Ready-to-run actor input

```json
{
  "platforms": [
    "dubicars"
  ],
  "maxListingsPerPlatform": 100
}
```

## Key facts

- DubiCars lists roughly 24,000 used cars for sale in Dubai, with Toyota the top brand at around 9,000 listings, followed by Mercedes-Benz, Nissan, Suzuki and Lexus. (Source: Live counts read from dubicars.com used-car pages; figures fluctuate daily as listings turn over.)
- Dubizzle Motors shows over 34,000 used cars for sale in Dubai and roughly 43,000 across the UAE. (Source: Live listing counts on dubizzle.com motors pages; vary daily.)
- UAE used car prices reportedly fell in 2025 versus the prior year, as cross-Emirate price comparison reduced dealers' pricing power. (Source: Directional observation from UAE automotive market commentary; not an official statistic.)
- The UAE used car market has been forecast in the tens of billions of USD by 2030, with online marketplaces growing while offline showrooms still held the majority of sales as of 2025. (Source: Market sizing per published research-firm forecasts; projection, verify before citing commercially.)
- The backing Apify actor is pay-as-you-go, charging on a per-event basis (for example per listing extracted, with separate charges for AI-recovered listings and detected changes). (Source: Pricing described in the actor's README and input schema; confirm current rates on apify.com before a large run.)

## FAQ

### What is Dubai used car listings data?

It is structured, machine-readable records of pre-owned cars advertised for sale on UAE marketplaces. Each row captures fields such as make, model, year, trim, price in AED, mileage in kilometres, fuel type, transmission, body type, seller type (dealer or individual), GCC-spec flag, location, the listing URL and a scrape timestamp. Individual fields are populated when the source listing exposes them and may be empty otherwise. It turns scattered web ads into a clean dataset you can analyse, filter and join.

### Which platforms does this tool cover?

The query builder targets the major Gulf used-car marketplaces — DubiCars (a UAE dealer-focused portal with roughly 24,000 used cars listed in Dubai) and Dubizzle Motors (a consumer marketplace with over 34,000 used cars in Dubai). You choose one or more platforms in the platforms field. Results are normalized into one consistent schema so a DubiCars row and a Dubizzle row look the same.

### Does this page return live car listings in my browser?

No. This is a query builder. You assemble the configuration (platforms, make, model, per-platform cap) and preview a fixed example of the output shape so you know exactly what fields you will get. The source sites are anti-bot protected and not CORS-open, so live fetching happens server-side: you copy the config and run the export live on the backing Apify actor.

### Is it free to get Dubai used car data?

The backing actor runs on Apify, which gives new accounts free platform credits to start, so you can test before committing spend. The actor itself bills pay-as-you-go on a pay-per-event basis — for example per car listing extracted — rather than a flat subscription, and you control spend with maxListingsPerPlatform. Always check the current pricing on the actor's Apify Store page before a large run.

### How do I filter by make and model?

Set the make field to a brand (for example Toyota, Mercedes-Benz, Nissan or Lexus — among the most listed brands in Dubai) and model to a specific model (for example Land Cruiser or Patrol). Filtering by model requires a make to be set; model alone is ignored. Leave both empty to scan the entire market across the selected platforms. The filters narrow the export so you only pay for and download the segment you care about.

### What fields are in the exported dataset?

Each record can include vehicle details (make, model, year, trim, bodyType, mileageKm, fuelType, transmission, engineSize, color), pricing and location (price, currency AED, city, country), seller information (sellerType, dealerName, isGccSpec, inspected) and listing metadata (listingUrl, title, images, listingDate, scrapedAt). Not every field is present on every row — values are populated when the source listing exposes them and are otherwise null. The preview on this page shows the full shape so you can map fields before you run.

### Can I track price changes over time?

Yes. The backing actor has a change-detection mode: when you run the same query on a schedule against a named dataset (set the same datasetName each run), it compares the new run with the previous one and flags listings whose price changed, plus new and removed listings and cross-platform relistings. Detected changes are billed per change in addition to the per-listing charge. This builder produces the base query you would schedule; you enable change detection and set the dataset name on the actor itself.

### Is scraping Dubai car listings legal?

Scraping publicly visible listing data is generally lower-risk than accessing private or login-gated content, but you remain responsible for compliance. Review each platform's terms of service, avoid republishing copyrighted images or full descriptions, respect rate limits, and use the data for analysis rather than wholesale copying. For commercial use, confirm your specific use case with counsel.

### Why use this instead of a marketplace API?

Any official data feeds the marketplaces may offer tend to be commercial, enterprise-oriented products rather than self-serve. This tool is a self-serve, pay-as-you-go alternative for developers and analysts who want a specific make/model slice or a quick market snapshot without an enterprise contract — and it normalizes multiple platforms into one schema in a single run.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Egypt real-estate data](https://datatooly.xyz/egypt-real-estate-search/)
- [Saudi real-estate data](https://datatooly.xyz/saudi-real-estate-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
