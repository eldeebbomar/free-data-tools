# Saudi real-estate listings — search & export

> Saudi Arabia property data is structured listing information — price in SAR, location, bedrooms, area, agent contact, and the REGA advertising-license number — pulled from portals like Bayut.sa, Wasalt, Aqar.fm and PropertyFinder.sa. This tool builds a ready-to-run query and previews the output shape; you run it live on the backing Apify actor to export real listings as JSON or CSV.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Real Estate](https://datatooly.xyz/category/real-estate/)
- URL: https://datatooly.xyz/saudi-real-estate-search/
- Backing Apify actor: [saudi-real-estate-scraper](https://apify.com/constructive_calm/saudi-real-estate-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Extract Saudi Arabia Property Data from 4 Listing Portals](https://datatooly.xyz/guides/saudi-arabia-property-data/)

Choose Bayut.sa, Wasalt, Aqar.fm or PropertyFinder.sa, cities and a listing type, and preview the Saudi property listings the actor exports: price in SAR, area, city and REGA licence.

## Key takeaways

- This page is a query builder: you configure platforms, cities, listing type and a result cap, preview the fixed output shape, then run the query live on the Apify actor — it does not fetch live listings in your browser.
- Covers four Saudi portals: Bayut.sa, Wasalt.sa (PIF-owned), Aqar.fm and PropertyFinder.sa, normalized into one schema.
- The REGA (Real Estate General Authority) advertising-license number acts as a cross-platform join key — Bayut, Wasalt and PropertyFinder expose it, letting you de-duplicate the same property across portals.
- listingType supports sale, rent, off_plan and auction; you can also filter by city, price range in SAR, and Vision 2030 zones like NEOM, Red Sea and ROSHN.
- The backing actor is free to start, then pay-as-you-go — roughly $0.004 per listing, with the first 10 chargeable events per run free for trialing.
- Output is normalized JSON/CSV: common fields (price, area, beds, coordinates, agent) plus platform-specific extras like Aqar.fm installment plans.

## How it works

### 1. Choose your platforms

Select which Saudi portals to query — Bayut.sa, Wasalt.sa, Aqar.fm and/or PropertyFinder.sa. The default template starts with bayut_sa; add more to compare inventory across sources in one normalized dataset.

### 2. Set cities and listing type

Add target cities (e.g. Riyadh, Jeddah) and pick a listingType: sale, rent, off_plan or auction. Optionally narrow further with a SAR price range or a Vision 2030 zone filter for NEOM, Red Sea or ROSHN areas.

### 3. Cap the result volume

Set maxListingsPerPlatform (the actor defaults to 200; this template uses 100) to control cost and runtime. Start small to trial the output within the first 10 free chargeable events before scaling up.

## How to use it

1. **Choose your platforms** — Select which Saudi portals to query — Bayut.sa, Wasalt.sa, Aqar.fm and/or PropertyFinder.sa. The default template starts with bayut_sa; add more to compare inventory across sources in one normalized dataset.
2. **Set cities and listing type** — Add target cities (e.g. Riyadh, Jeddah) and pick a listingType: sale, rent, off_plan or auction. Optionally narrow further with a SAR price range or a Vision 2030 zone filter for NEOM, Red Sea or ROSHN areas.
3. **Cap the result volume** — Set maxListingsPerPlatform (default 100) to control cost and runtime. Start small to trial the output within the first 10 free chargeable events before scaling up.
4. **Preview the output shape** — Review the fixed example output the builder shows — price, location, beds, area, agent contact, REGA license number and platform-specific extras — so you know exactly which fields your export will contain.
5. **Run it live on the actor** — Send the generated query to the backing Apify actor to fetch real listings. Download the dataset as CSV or JSON, or pull it via the Apify API into your own analysis pipeline.

## Example output

A fixed sample of the fields the saudi-real-estate-scraper actor returns — example data, not live results.

| title_en | price_sar | city_en | rega_license_number | is_rega_verified |
| --- | --- | --- | --- | --- |
| Apartment for sale in Al Malqa | 1250000 | Riyadh | 7100000001 | true |
| Villa for sale in Al Narjis with roof annex | 3400000 | Riyadh | 7100000002 | true |
| Off-plan apartment in a ROSHN community | 980000 | Riyadh | 7100000003 | true |
| Townhouse for sale in Obhur Al Shamaliyah | 2100000 | Jeddah | 7100000004 | false |
| Apartment for sale in Al Shati | 1650000 | Dammam | 7100000005 | true |

## Ready-to-run actor input

```json
{
  "platforms": [
    "bayut_sa"
  ],
  "listingType": "sale",
  "maxListingsPerPlatform": 100
}
```

## Key facts

- Aqar.fm reports over 12 million app downloads and around 400 million monthly property searches in Saudi Arabia. (Source: Aqar platform figures surfaced via web search of Saudi real-estate portals (May 2026); verify against Aqar's own site for current numbers.)
- A REGA real-estate advertising license is valid for one year and may be extended for a period not exceeding five years. (Source: Real Estate General Authority (rega.gov.sa) advertisement-license issuance service description, accessed 2026.)
- The backing actor covers four Saudi portals with reported inventories of roughly 72,000+ listings on Bayut.sa, 24,000+ on Wasalt.sa, and about 1.5 million total on Aqar.fm. (Source: Figures stated on the actor's Apify Store listing (constructive_calm/saudi-real-estate-scraper); platform counts fluctuate over time.)
- In Riyadh, average villa rents rose about 17.2% year-on-year to roughly SAR 88,715, per market data cited in 2026 coverage. (Source: Global Property Guide / market-review figures surfaced via web search (2026); directional context only, not produced by this tool.)
- The backing Apify actor is free to start, then pay-as-you-go at approximately $0.004 per listing, with the first 10 chargeable events per run free. (Source: Pricing stated on the actor's Apify Store page; confirm live pricing before running large exports.)

## FAQ

### What is Saudi Arabia property data and what does it include?

Saudi Arabia property data is structured information about real-estate listings in the Kingdom: asking price in SAR, property type, bedrooms, bathrooms, built area, city and district, map coordinates, agent or broker contact, photo URLs, and timestamps. For Saudi listings it also includes the REGA advertising-license number and, on Aqar.fm, installment-plan terms. This builder lets you select which fields and platforms you want before running the query.

### Which platforms does this Saudi property data tool cover?

It targets four Saudi portals: Bayut.sa, Wasalt.sa (owned by the Public Investment Fund), Aqar.fm, and PropertyFinder.sa. You choose any combination in the platforms input — the default template uses bayut_sa. Each platform's results are normalized into one unified schema, so common fields line up across sources while platform-specific extras (like Aqar.fm installment plans) are preserved rather than dropped.

### Does this tool return live listings directly in my browser?

No. It is a query builder. You configure platforms, cities, listingType and a result cap, and it shows you a fixed example of the output shape so you know exactly what fields to expect. To get real, current listings you run the generated query live on the backing Apify actor, which handles the source (anti-bot, not CORS-open) and returns the dataset as JSON or CSV.

### What is a REGA license number and why does it matter for Saudi property data?

REGA is Saudi Arabia's Real Estate General Authority. Every property advertisement must carry a REGA advertising license, valid for one year and renewable. Because Bayut, Wasalt and PropertyFinder display this license number, it works as a cross-platform join key: you can match the same physical property advertised on multiple portals and de-duplicate, or filter to REGA-verified listings only.

### Is scraping Saudi real-estate listings legal?

The tool reads publicly visible listing pages — it does not bypass logins or access proprietary databases. Whether automated collection is permitted depends on each portal's terms of service and applicable law, so review those before large-scale extraction and avoid republishing copyrighted media or personal data unlawfully. Treat outputs as a starting point for analysis, and consult the portal or legal counsel if you intend commercial redistribution.

### How much does it cost to run the Saudi property data query?

The backing Apify actor is free to start, then pay-as-you-go. Pricing is roughly $0.01 per run start plus about $0.004 per listing (around $4 per 1,000 listings), with a small per-fetch proxy charge on PropertyFinder. The first 10 chargeable events per run are free, so you can trial a small query before committing to a larger export. Always check the actor's Store page for current pricing.

### Can I filter Saudi listings by Vision 2030 mega-projects like NEOM or ROSHN?

Yes. The actor auto-tags listings located in Vision 2030 zones — NEOM, the Red Sea, Diriyah, ROSHN, Qiddiya and King Salman Park — and offers a filter to return only those areas. This is useful for tracking off-plan inventory and developer activity around the Kingdom's giga-projects. Combine it with listingType set to off_plan to focus on pre-construction supply.

### What's the difference between sale, rent, off_plan and auction listing types?

listingType controls which inventory you pull. 'sale' returns resale and ready properties for purchase; 'rent' returns leasing listings; 'off_plan' returns pre-construction units sold before completion — common around Vision 2030 projects; 'auction' returns properties sold via auction, notably on Wasalt's auction platform. Pick one per query to keep the dataset focused, or run separate queries and merge on the REGA license number.

### How do I export the Saudi property data to CSV or use it in a script?

After you build the query here and confirm the output shape, run it on the Apify actor. The actor writes results to a dataset you can download as CSV, JSON, Excel or feed via API into your own pipeline. Because the schema is normalized across platforms, the same column layout applies whether you pulled from Bayut, Wasalt, Aqar.fm or PropertyFinder — simplifying analysis in spreadsheets or BI tools.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Egypt real-estate data](https://datatooly.xyz/egypt-real-estate-search/)
- [Gulf used-car listings](https://datatooly.xyz/gulf-used-car-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
