# Track SaaS pricing & plan changes

> To track competitor SaaS pricing, point a pricing-page scraper at your rivals' URLs and capture plan names, monthly/annual prices, features, and limits as structured data, then re-run on a schedule to detect changes. This free tool builds the ready-to-run query and previews the exact output shape; you run it live on the backing Apify actor (free to start, then pay-as-you-go).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [SaaS & SEO](https://datatooly.xyz/category/saas-seo/)
- URL: https://datatooly.xyz/saas-pricing-tracker-tool/
- Backing Apify actor: [saas-pricing-tracker](https://apify.com/constructive_calm/saas-pricing-tracker?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Scrape Monthly vs Annual SaaS Prices From Pricing-Page JSON-LD](https://datatooly.xyz/guides/scrape-saas-pricing-monthly-annual-json-ld/)

Paste competitors' homepage or pricing URLs and preview the structured pricing data the actor extracts: plans, prices, free-tier and enterprise flags, ready to re-run for change alerts.

## Key takeaways

- This page is a query builder: you configure the run and preview a fixed example of the JSON output shape, then execute it live on the backing Apify actor (new Apify accounts get platform free credits to start, then it is pay-as-you-go).
- Enter competitor homepage or pricing URLs; with discoverPricingPage enabled the actor finds the /pricing page automatically so you do not have to hunt for it.
- Output is structured JSON per company: companyName, pricingPageUrl, hasFreeTier, totalPlansFound, an extractionConfidence rating, and a plans array with planName, priceMonthly, priceAnnualPerMonth, currency, features, featureLimits, isFree, isEnterprise, and trialDays.
- With detectChanges on, scheduled re-runs compare against prior results and flag added/removed plans, price moves, and feature shifts via a hasChanges flag and a changes array.
- SaaS pricing tends to be revisited regularly rather than left static, so periodic monitoring generally beats one-off snapshots.
- Public pricing pages are generally legal to scrape, but you should respect each site's terms of service and robots.txt and avoid overloading servers.

## How it works

### 1. Add competitor URLs

Enter your competitors' homepage or pricing-page URLs into startUrls. Add as many rivals as you want to compare in a single run; you can mix homepages and direct /pricing links.

### 2. Enable pricing-page discovery

Keep discoverPricingPage on so the actor automatically finds each company's /pricing page from its homepage. Turn it off only if you are passing exact pricing URLs and want to skip discovery.

### 3. Turn on change detection

Leave detectChanges enabled and persist results to a named dataset. Each re-run then compares against the prior snapshot and flags added or removed plans, price moves, and feature shifts.

## How to use it

1. **Add competitor URLs** — Enter your competitors' homepage or pricing-page URLs into startUrls. Add as many rivals as you want to compare in a single run; you can mix homepages and direct /pricing links.
2. **Enable pricing-page discovery** — Keep discoverPricingPage on so the actor automatically finds each company's /pricing page from its homepage. Turn it off only if you are passing exact pricing URLs and want to skip discovery.
3. **Turn on change detection** — Leave detectChanges enabled and persist results to a named dataset. Each re-run then compares against the prior snapshot and flags added or removed plans, price moves, and feature shifts.
4. **Preview the output shape and copy the query** — Review the example JSON on this page, the plans array with planName, priceMonthly, priceAnnualPerMonth, currency, features, featureLimits, and flags, so you know exactly what you will receive, then copy the generated config.
5. **Run it live on Apify** — Paste the query into the backing saas-pricing-tracker actor on Apify and run it. New Apify accounts include platform free credits to get started, after which it is pay-as-you-go (a per-run-start fee plus a per-company fee). Add a schedule and a webhook URL to get recurring runs and pricing-change alerts.

## Example output

A fixed sample of the fields the saas-pricing-tracker actor returns — example data, not live results.

| companyName | totalPlansFound | hasFreeTier | hasEnterprisePlan | defaultCurrency |
| --- | --- | --- | --- | --- |
| Acme Analytics | 4 | true | true | USD |
| Sample CRM | 3 | false | true | USD |
| Placeholder Docs | 3 | true | false | USD |
| Demo Support Desk | 3 | false | true | USD |
| Example Mailer | 3 | true | false | USD |

## Ready-to-run actor input

```json
{
  "useAI": true,
  "discoverPricingPage": true,
  "detectChanges": true
}
```

## Key facts

- Most SaaS companies are reported to review their pricing at least once a year, with faster-moving teams revisiting it quarterly. (Source: Directional figure from third-party SaaS pricing commentary and vendor surveys (typically self-selected samples); not first-party measurement and not independently verified here.)
- In Visualping's own analysis of competitor pricing-page monitors, a large share flagged at least one change within roughly a month. (Source: Vendor-published analysis from Visualping (visualping.io); first-party to the vendor and not independently verified here.)
- Larger SaaS vendors are commonly reported to build mid-single-digit annual price increases into contracts at renewal. (Source: Directional pattern from third-party SaaS pricing commentary; specific vendor terms vary by contract and are not independently verified here.)
- Competitive-intelligence vendors report that a majority of teams using sales battlecards see improved win rates. (Source: From competitive-intelligence vendor survey material (self-reported, selection-biased samples); treat as directional marketing data, not independent measurement.)
- The backing Apify actor is pay-as-you-go: $0.01 per GB of run memory at start ($0.04 at the default 4 GB) plus $0.09 per company analyzed, so tracking 10 competitors is on the order of $0.94 per run. AI-enhanced extraction, if enabled, may add a small per-result fee on pages where it is needed. (Source: Per-event rates from the actor's README and input schema; check the Apify Store page for current rates, which may change.)

## FAQ

### How do I track competitor SaaS pricing automatically?

List your competitors' homepage or pricing URLs, enable auto-discovery of the pricing page, and run a pricing-page scraper that returns plan names, prices, billing options, and features as structured JSON. Schedule recurring runs and turn on change detection so each run compares against the last and flags price moves, new tiers, or feature shifts. This tool builds that query and previews the output shape; you run it live on the Apify actor.

### Is this tool free?

The query builder on this page is free to use: you configure the run, preview the example output shape, and copy a ready-to-run config. Actually executing the scrape happens on the backing Apify actor. New Apify accounts include platform free usage credits to get started, after which it is pay-as-you-go. The actor charges a small fee per run start plus a per-company-analyzed fee, so cost scales with how many competitors you track per run. AI-enhanced extraction, if enabled, may add a small per-result fee on pages where it is needed.

### Does this page return live competitor pricing in my browser?

No. This is a query builder. It assembles a ready-to-run configuration and shows a fixed example of the JSON output shape so you know exactly what fields you will get. Live pricing pages are not CORS-open and often need browser rendering, so the actual extraction runs on the backing Apify actor. You take the generated query, run it there, and receive the structured dataset.

### What data does the SaaS pricing tracker return?

For each company it returns structured JSON: companyName, companyUrl, pricingPageUrl, hasFreeTier, hasEnterprisePlan, totalPlansFound, and a plans array. Each plan includes planName, priceMonthly, priceAnnualPerMonth, priceAnnualTotal, pricingModel, currency (ISO 4217), billingPeriods, a features list, featureLimits, ctaText/ctaUrl, priceSource (JSON-LD, card, table, promo or AI), promo fields (hasPromo, promoPrice, promoText), and the flags isFree, isEnterprise, isPopular, and trialDays. There is also an optional featureComparison matrix, an extractionMethod and extractionConfidence rating (high, medium, or low), and an errors array. When change detection is on you also get a hasChanges boolean, a changes array, and previousScrapedAt. The fixed example shown on this page is a representative subset of these fields.

### How does change detection work?

Enable detectChanges and persist results to a named dataset. On each scheduled re-run, the actor compares the current extraction against the prior stored snapshot and flags differences: added or removed plans, price increases or decreases, billing changes, and features that moved between tiers. It sets hasChanges to true and lists specifics in a changes array, and can post a webhook alert so your team sees the update without manual checking.

### How often do SaaS companies change their pricing?

For many SaaS companies, pricing is an ongoing process rather than a once-a-year event. Industry commentary and vendor surveys (which tend to reflect self-selected, higher-growth teams) suggest that most SaaS companies revisit pricing at least annually, with faster-moving teams re-evaluating quarterly, and that larger vendors often build modest annual increases into renewals. Treat those figures as directional rather than precise. Because changes are frequent and rarely announced, weekly-to-monthly monitoring catches packaging and tier shifts you would otherwise miss.

### Is it legal to scrape competitor pricing pages?

Publicly visible pricing data is generally legal to collect, and courts have repeatedly held that accessing public web data is not inherently illegal. The caveats matter: respect each site's terms of service and robots.txt, do not bypass logins or technical barriers, avoid scraping personal data, and do not overload servers. This tool targets public pricing pages only. For your specific situation and jurisdiction, confirm with your own legal counsel.

### Can it send alerts to Slack or a webhook when prices change?

Yes. The backing actor accepts a webhook URL and posts a notification whenever a run detects changes, including what changed. You can route that webhook into Slack, email, or your own automation so sales and product teams get pricing alerts in real time with context, instead of manually re-checking competitor sites. Pair this with a recurring schedule to build an ongoing change log.

### What can I do with the structured pricing data?

Common uses include benchmarking your own plans against rivals, building feature-versus-price comparison matrices, populating sales battlecards with current competitor tiers, feeding a pricing model, and maintaining a historical change log that reveals strategy over time. Because the output is clean JSON, you can pipe it into BI tools, Google Sheets, or a database, and reuse the same query on a schedule to keep everything current.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Hacker News search](https://datatooly.xyz/hacker-news-search/)
- [App Store top charts](https://datatooly.xyz/app-store-top-charts/)
- [Shopify product scraper](https://datatooly.xyz/shopify-store-products/)
