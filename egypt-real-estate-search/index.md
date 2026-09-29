# Egypt real-estate listings — search & export

> Egypt property listings data is structured real-estate information — price (EGP), area, location, bedrooms, agent contact and amenities — pulled from Aqarmap, Dubizzle Egypt and Property Finder Egypt. This page is a free-to-use query builder: it assembles a ready-to-run query and previews the output shape. You then run the query on the backing Apify actor (pay-as-you-go, with Apify's platform-level free starting credits) to export the actual listings as JSON or CSV.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Real Estate](https://datatooly.xyz/category/real-estate/)
- URL: https://datatooly.xyz/egypt-real-estate-search/
- Backing Apify actor: [egypt-real-estate-scraper](https://apify.com/constructive_calm/egypt-real-estate-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)

Pick Aqarmap, Property Finder or Dubizzle, a listing type and an area, and preview the Egyptian property listings the actor exports: price in EGP, area, bedrooms and location.

## Key takeaways

- This page is a query builder: it assembles your search config (platforms, listing type, location, max listings) and shows a fixed example of the output shape — it does not fetch live listings in your browser.
- Run the built query on the backing Apify actor (egypt-real-estate-scraper) to get the real listings, exportable as JSON or CSV.
- Covers three Egyptian portals: Aqarmap, Dubizzle Egypt (OLX) and Property Finder Egypt — sale or rent.
- Each listing row includes priceEGP, pricePerSqm, areaSqm, bedrooms/bathrooms, city/district/compound, GPS, amenities and agent/agency contact.
- The query builder is free; the backing actor is pay-as-you-go (per run plus per listing). Apify's platform-level free credits cover light starting usage — there is no separate actor-specific free allowance.
- Use it for price-per-sqm benchmarking, lead lists, market dashboards and compound-level comparisons across New Cairo, Sheikh Zayed, 6th October and the North Coast.

## How it works

### 1. Pick your platforms and listing type

Choose one or more of Aqarmap, Dubizzle Egypt and Property Finder Egypt, then set listingType to sale or rent. The actor defaults to all three platforms and sale.

### 2. Set location and result cap

Pick a location such as New Cairo, Sheikh Zayed or Alexandria (or leave it on any location), and set maxListingsPerPlatform (actor default 25) to control how many listings the run pulls per platform.

### 3. Preview the output shape

Review the fixed example row to confirm the fields you'll receive — priceEGP, pricePerSqm, areaSqm, location hierarchy, amenities and agent/agency contact — before spending anything.

## How to use it

1. **Pick your platforms and listing type** — Choose one or more of Aqarmap, Dubizzle Egypt and Property Finder Egypt, then set listingType to sale or rent. The actor defaults to all three platforms and sale.
2. **Set location and result cap** — Enter a location such as New Cairo, Sheikh Zayed or Alexandria, and set maxListingsPerPlatform (actor default 25) to control how many listings the run pulls per platform.
3. **Preview the output shape** — Review the fixed example row to confirm the fields you'll receive — priceEGP, pricePerSqm, areaSqm, location hierarchy, amenities and agent/agency contact — before spending anything.
4. **Copy the query and run it live** — Copy the generated query config and run it on the backing Apify actor (egypt-real-estate-scraper). The page only builds the query; the actor fetches the real listings.
5. **Export the dataset** — When the run finishes, download the Apify dataset as CSV, Excel or JSON, or pull it via the Apify API to feed a spreadsheet, database or dashboard.

## Example output

A fixed sample of the fields the egypt-real-estate-scraper actor returns — example data, not live results.

| title | priceEGP | city | areaSqm | bedrooms |
| --- | --- | --- | --- | --- |
| Apartment for sale in Fifth Settlement, 3 bedrooms | 8500000 | New Cairo | 180 | 3 |
| Villa for sale in Sheikh Zayed with private garden | 24000000 | Sheikh Zayed | 420 | 5 |
| Fully finished apartment near the North 90 street | 6200000 | New Cairo | 145 | 2 |
| Duplex for sale in 6th of October, ready to move | 7300000 | 6th of October | 230 | 4 |
| Chalet for sale on the North Coast, sea view | 9800000 | North Coast | 120 | 2 |

## Ready-to-run actor input

```json
{
  "platforms": [
    "aqarmap"
  ],
  "listingType": "sale",
  "maxListingsPerPlatform": 100
}
```

## Key facts

- The actor's input schema lists Aqarmap at 450K+ properties, Dubizzle/OLX at 168K+ listings and Property Finder at 93K+ listings — roughly 600,000+ combined listings across the three portals. (Source: From the actor's README and input schema (constructive_calm/egypt-real-estate-scraper); portal inventories are platform self-reported and fluctuate as listings are added or removed.)
- Property Finder Egypt offers the richest per-row data of the three portals, including GPS coordinates, amenities and agent contact available directly from search results without enrichment. (Source: From the actor's README (constructive_calm/egypt-real-estate-scraper).)
- Dubizzle Egypt was formerly branded OLX Egypt; its listings split across apartments, villas/houses and other property types. (Source: Dubizzle Egypt site branding via web search, 2026; live category counts fluctuate.)
- Average apartment prices in New Cairo compounds ran roughly EGP 40,000–70,000 per sqm in 2025, with Fifth Settlement broadly in the ~EGP 55,000–65,000/sqm band depending on finishing and project. (Source: Synthesised from community Egyptian property-market guides via web search; estimates vary widely by source, project and finishing level and are not transacted prices.)
- The backing Apify actor is pay-as-you-go: $0.01 per run start, $0.005 per listing extracted and $0.03 per AI-extracted listing, so 100 listings total is about $0.51. (Source: From the actor's README (constructive_calm/egypt-real-estate-scraper); confirm current rates on the live Store page before a large run.)

## FAQ

### What is Egypt property listings data?

Egypt property listings data is the structured record behind each for-sale or for-rent advert on portals like Aqarmap, Dubizzle Egypt and Property Finder Egypt. A single row typically holds the price in EGP, area in square metres, derived price per sqm, bedrooms and bathrooms, the city/district/compound location, GPS coordinates, amenities, and the agent or agency contact. Collected at scale it powers price benchmarking, lead generation and market analysis.

### Does this tool return live Egypt property listings in my browser?

No. This page is a query builder. It assembles your search configuration — platforms, listing type, location and max listings per platform — and shows a fixed example of the output shape so you know what fields to expect. The Egyptian portals are anti-bot protected and not open to in-browser fetching, so you copy the built query and run it on the backing Apify actor, which returns the actual live listings.

### Which platforms and data sources does it cover?

It targets three of Egypt's largest property marketplaces: Aqarmap (the actor's input schema cites 450K+ properties), Dubizzle Egypt — formerly OLX, cited at 168K+ listings — and Property Finder Egypt (cited at 93K+ listings, the richest data including GPS and agent info). You can build a query for one platform, two, or all three at once, for either sale or rent listings, then run it on the actor to merge the results into one normalised dataset.

### What fields are in each listing row?

Each row includes sourcePlatform, title, priceEGP, pricePerSqm, areaSqm, bedrooms, bathrooms, city, district, compound, latitude, longitude, amenities, sellerName, agencyName, brokerLicense, downPayment, installmentYears, isVerified, listingDate and an extractionConfidence quality flag. Turning on full-detail enrichment can add the agent phone number (Property Finder phones are included without enrichment). The exact fields present per row depend on what each portal exposes for that listing.

### How do I export the data to CSV or Excel?

Build your query here to confirm the platforms, listing type and location, then run it on the Apify actor. The actor writes results to an Apify dataset, which you can download as JSON, CSV, Excel (XLSX), XML or HTML, or pull programmatically through the Apify API. CSV and Excel are the common choices for spreadsheet analysis; JSON is best for feeding a database or dashboard.

### Is this tool free?

The query builder on this page is free to use. The backing Apify actor is pay-as-you-go: $0.01 per run start, $0.005 per listing extracted, and $0.03 per listing when the AI vision fallback is triggered. There is no separate actor-specific free tier, but Apify's platform-level free credits cover light starting usage. As a rough guide, 100 listings total is about $0.51. Check the actor's Store page for current pricing before a large run.

### Is scraping Egyptian real-estate listings legal?

Collecting publicly visible listing data is generally permitted in most jurisdictions, but you remain responsible for compliance. Respect each portal's terms of service and robots.txt, avoid bypassing logins or paywalls, and treat agent contact details as personal data under privacy rules such as GDPR — use them lawfully and only for legitimate purposes. This page is informational, not legal advice; consult counsel for your specific use case.

### What can I use Egypt property listings data for?

Common uses are price-per-sqm benchmarking across compounds and districts, building broker or developer lead lists, tracking new supply and price changes over time, populating a property portal or CRM, and market-research dashboards. Because rows carry GPS and compound names, you can compare like-for-like across New Cairo's Fifth Settlement, Sheikh Zayed, 6th October, the New Administrative Capital and North Coast resorts.

### How fresh and accurate is the data?

The actor pulls listings live from each portal at the moment you run it, so freshness matches what is publicly posted that day. Each row carries an extractionConfidence flag and an isVerified field reflecting the platform's own verification status. Prices and availability change frequently in the Egyptian market — re-run the query to refresh, and treat any single listing's price as the advertised ask, not a transacted value.

### How many listings can I pull in one run?

You set maxListingsPerPlatform in the query — the actor defaults to 25 as a quick sample that keeps runs under about five minutes. The backing actor supports much larger pulls (up to 5,000 per platform, 15,000 across all three), so you can start small to preview the shape and confirm fields, then raise the cap for a full market export. Larger runs cost more under the pay-as-you-go model, so size the cap to your actual need.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Saudi real-estate data](https://datatooly.xyz/saudi-real-estate-search/)
- [Gulf used-car listings](https://datatooly.xyz/gulf-used-car-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
