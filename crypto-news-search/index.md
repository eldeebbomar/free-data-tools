# Search & export Cointelegraph crypto news

> A Cointelegraph scraper extracts structured crypto-news articles, titles, full text, authors, categories, dates, and view counts, from Cointelegraph's GraphQL backend instead of copy-pasting pages. This free tool is a query builder: set a keyword, language, and article count, preview the output shape, then run the configured query on the backing Apify actor (which uses pay-as-you-go pricing on Apify, where new accounts get free platform credits to start).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [News & Crypto](https://datatooly.xyz/category/news-crypto/)
- URL: https://datatooly.xyz/crypto-news-search/
- Backing Apify actor: [crypto-news-scraper](https://apify.com/constructive_calm/crypto-news-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)

Search Cointelegraph by keyword and language edition and preview the article records the actor exports: URL, title, publish date and view count.

## Key takeaways

- This page is a query builder, not a live fetcher: it produces a ready-to-run config and shows a fixed example of the output shape, then you run it on the actor.
- The backing crypto-news-scraper actor pulls from Cointelegraph's GraphQL API across 15 language codes (en, tr, de, es, fr, it, jp, kr, br, cn, ar, my, in, tw, ru); in a live check on 29 September 2026 every edition except my (Malay) returned articles.
- Four inputs drive a query: search_query (keyword, empty = latest), language, article_count (5-100,000), and fetch_full_text.
- Each article returns title, summary (leadText), optional full body, author, category, ISO + human dates, cover image, badges, and optional view count.
- The backing actor uses pay-as-you-go pricing (pay-per-event, billed per article saved) and failed requests are not charged; Apify itself gives new accounts free platform credits to start.
- Use scraped articles for internal research, sentiment analysis, and monitoring, not republishing, articles are copyrighted; review Cointelegraph's Terms first.

## How it works

### 1. Enter a search query

Type a keyword into search_query, for example bitcoin, ETF, or a project name. Leave it empty to pull the latest Cointelegraph articles instead of a keyword search.

### 2. Pick a language edition

Set the language field to one of the 15 codes the actor accepts (default en); on 29 September 2026, 14 returned articles and my (Malay) returned none. Each run targets a single Cointelegraph language edition, such as ar for Arabic or jp for Japanese.

### 3. Set how many articles and whether to include full text

Choose article_count (5 to 100,000) and toggle fetch_full_text. Full text returns complete article bodies; turn it off for lighter, faster metadata-only runs.

## How to use it

1. **Enter a search query** — Type a keyword into search_query, for example bitcoin, ETF, or a project name. Leave it empty to pull the latest Cointelegraph articles instead of a keyword search.
2. **Pick a language edition** — Set the language field to one of the 15 codes the actor accepts (default en); on 29 September 2026, 14 returned articles and my (Malay) returned none. Each run targets a single Cointelegraph language edition, such as ar for Arabic or jp for Japanese.
3. **Set how many articles and whether to include full text** — Choose article_count (5 to 100,000) and toggle fetch_full_text. Full text returns complete article bodies; turn it off for lighter, faster metadata-only runs.
4. **Preview the output shape** — Review the fixed example output the builder shows, post ID, title, leadText, author, category, dates, cover image, badges, and view count, so you know exactly what schema to expect.
5. **Run the query live on the actor** — Send the generated config to the backing Apify actor (pay-as-you-go, billed per article saved; new Apify accounts start with free platform credits) to perform the real GraphQL fetch and export results as JSON or CSV.

## Example output

A fixed sample of the fields the crypto-news-scraper actor returns — example data, not live results.

| post_url | postTranslate | views |
| --- | --- | --- |
| https://cointelegraph.com/news/bitcoin-etf-inflows-weekly-example | {"title":"Bitcoin ETF inflows climb for a third straight week","published":"2026-09-28T14:05:00.000Z"} | 18420 |
| https://cointelegraph.com/news/ethereum-staking-yields-example | {"title":"Ethereum staking yields shift after validator queue clears","published":"2026-09-27T09:30:00.000Z"} | 9210 |
| https://cointelegraph.com/news/stablecoin-supply-record-example | {"title":"Stablecoin supply reaches a new high as trading volumes recover","published":"2026-09-26T17:45:00.000Z"} | 12760 |
| https://cointelegraph.com/news/defi-lending-rates-example | {"title":"DeFi lending rates drift lower as borrowing demand cools","published":"2026-09-25T11:10:00.000Z"} | 6340 |
| https://cointelegraph.com/news/bitcoin-miners-hashrate-example | {"title":"Bitcoin miners add hashrate ahead of difficulty adjustment","published":"2026-09-24T08:20:00.000Z"} | 7985 |

## Ready-to-run actor input

```json
{
  "language": "en",
  "article_count": 50,
  "fetch_full_text": true
}
```

## Key facts

- The backing actor scrapes Cointelegraph across 15 language codes (en, tr, de, es, fr, it, jp, kr, br, cn, ar, my, in, tw, ru); in a live check on 29 September 2026 every edition except my (Malay) returned articles. (Source: From the actor's input schema and README for constructive_calm/crypto-news-scraper.)
- article_count is configurable from a minimum of 5 to a maximum of 100,000, with a default of 10. (Source: From the actor's input schema (constructive_calm/crypto-news-scraper).)
- Pricing is pay-per-event at $6.00 per 1,000 articles saved, and failed requests are not charged. (Source: From the actor's README pricing section (constructive_calm/crypto-news-scraper).)
- Each article can return title, summary (leadText), optional full body, author, category, ISO + human-readable dates, cover image, badges, and optional view count. (Source: Field list taken from the actor's README data table; the README notes some fields may be null.)
- The actor queries Cointelegraph's GraphQL API directly rather than rendering pages in a browser, keeping compute overhead low. (Source: Described in the actor's README; consistent with Cointelegraph exposing a GraphQL backend.)

## FAQ

### Does this tool fetch live Cointelegraph articles in my browser?

No. This page is a query builder. You configure a keyword, language, and article count, and it shows you a fixed example of the output shape so you know exactly what fields to expect. To get real articles you run the generated query on the backing Apify actor, which performs the actual GraphQL fetch on its servers. The builder itself does not return live results.

### Is the Cointelegraph scraper free?

The query builder on this page is free to use. The backing Apify actor uses pay-per-event pricing billed per article successfully saved, and failed requests are not charged, so you only pay for results. Apify does not bundle a tool-specific free article allowance, but new Apify accounts receive platform-wide free credits you can put toward small test runs before scaling up to thousands of articles.

### What languages does the Cointelegraph scraper support?

The backing actor covers 15 Cointelegraph language editions: English (en), Turkish (tr), German (de), Spanish (es), French (fr), Italian (it), Japanese (jp), Korean (kr), Portuguese/Brazil (br), Chinese (cn), Arabic (ar), Malay (my), Hindi (in), Taiwan Chinese (tw), and Russian (ru). In a live check on 29 September 2026 the my edition returned no articles; the other 14 did. Set the language field in the query builder to target one edition per run.

### What fields does each article return?

Each article includes the post ID and URL, title, summary (leadText), optional full body text, author IDs/names/profile URLs, category IDs/titles/URLs, an ISO timestamp plus a human-readable date, a cover image URL, content badges (such as News or Opinion), and an optional view count. Some fields can be null because Cointelegraph's API does not always populate every value.

### How do I search Cointelegraph by keyword?

Put a term in the search_query field, for example bitcoin, ethereum, or a project name, and the actor returns matching articles in your chosen language. Leave search_query empty to fetch the latest articles instead of running a keyword search. Set article_count to control how many results you collect, from 5 up to 100,000.

### Is scraping Cointelegraph legal?

Scraping public pages for internal research, analysis, or monitoring generally has stronger footing than republishing. News articles are copyrighted, so you should not republish full text or build a competing news feed from scraped content. Review Cointelegraph's Terms of Service before scraping at scale, and prefer aggregate analysis (sentiment, trends, metadata) over wholesale content reuse.

### What can I use scraped Cointelegraph data for?

Common uses include crypto-news sentiment analysis, market-research datasets, trend and narrative monitoring, training internal classifiers, and feeding dashboards or alerts. Because the actor returns clean fields like title, full text, category, date, and view count, the data is well suited to NLP pipelines and time-series analysis. Keep usage to internal analysis rather than redistributing full articles.

### How is this different from other Cointelegraph scrapers on Apify?

Several Cointelegraph actors exist on the Apify Store. This one (constructive_calm/crypto-news-scraper) queries the GraphQL backend across 15 language editions, returns rich fields including optional full text and view counts, and uses transparent pay-per-event pricing billed per article saved. This builder adds a free, no-account way to design and preview your query before you run it on the actor.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [SEC EDGAR API tool](https://datatooly.xyz/sec-edgar-search/)
- [MEV pair scanner](https://datatooly.xyz/mev-pair-scanner-tool/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
