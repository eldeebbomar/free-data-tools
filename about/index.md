# About Data Tooly

> Who builds Data Tooly, how its live tools and query builders differ, where the data comes from, plus the affiliate disclosure and privacy note.

- URL: https://datatooly.xyz/about/
- Updated: 2026-09-29

## Who builds it

Data Tooly is built and maintained by **Omar Eldeeb**, a data engineer who publishes 28 production data-extraction actors on the Apify Store under the handle `constructive_calm`. Every tool on this site sits in front of one of those actors, and every guide is written from the experience of building them.
- [Apify Store profile](https://apify.com/constructive_calm?fpr=v77kxu) (all actors)
- [GitHub](https://github.com/eldeebbomar)
- [DEV Community](https://dev.to/odeeb) (articles)

## What this site is

Data Tooly is a static collection of 28 free, no-login data tools grouped into 18 categories, plus 28 long-form [guides](https://datatooly.xyz/guides/). Each tool answers one concrete question about a public data source — what a company is hiring for, what an app ranks, what a Reddit search returns — and hands its exact configuration to an Apify actor when you need the same thing in bulk, on a schedule, or as clean JSON or CSV.

## Live tools vs. query builders

Every tool is exactly one of two kinds, and the page says which:
- **Live tool** (5 today): genuinely fetches real data in your browser. This is only possible when the source's public API allows cross-origin browser requests and needs no header a browser cannot send.

- **Query builder** (23 today): assembles a ready-to-run query and shows a fixed, bundled sample that is clearly labelled _“Example output — a fixed sample showing the data shape, NOT live results for your query.”_ A builder never presents a static sample as results for what you typed.

When in doubt a tool is a builder. A source is only marked live after its browser access has been tested.

## Where the data comes from

The live tools call public sources directly from your browser — there is no server in between:- [Company Hiring Signals](https://datatooly.xyz/company-hiring-signals/) — reads the public Greenhouse Job Board API directly from your browser.
- [Search Hacker News by keyword](https://datatooly.xyz/hacker-news-search/) — reads the Algolia Hacker News search API (hn.algolia.com) directly from your browser.
- [App Store Top Charts](https://datatooly.xyz/app-store-top-charts/) — reads Apple's iTunes RSS top-chart feeds directly from your browser.
- [Search ClinicalTrials.gov live](https://datatooly.xyz/clinical-trials-search/) — reads the official ClinicalTrials.gov v2 API directly from your browser.
- [See any Shopify store's products](https://datatooly.xyz/shopify-store-products/) — reads each Shopify store's public /products.json endpoint directly from your browser.

The example tables on query-builder pages are fixed samples bundled with the site to show the output shape of the matching actor. The actors themselves run on Apify and collect **public** data only; respect each source's terms when you use them.

## Affiliate disclosure

Links to apify.com on this site carry an affiliate parameter (`fpr=v77kxu`). If you sign up for Apify through one of them, the site may earn a commission from Apify at no extra cost to you. Separately, Omar Eldeeb publishes the actors the tools link to, so running them on Apify's pay-as-you-go pricing also generates revenue for the author. The browser tools themselves are free and stay free.

## Privacy

Data Tooly uses **Google Analytics 4** to count visits and see which pages are useful; Google Analytics sets cookies in your browser for this. There are no accounts, no sign-up, no forms and no newsletter. The site is static with no backend of its own: what you type into a tool is processed in your browser and, for live tools, sent directly to the public source listed above — it is not collected or stored by this site.

## Contact

Found a bug or an inaccurate claim? Open an issue or reach out via [GitHub](https://github.com/eldeebbomar).
