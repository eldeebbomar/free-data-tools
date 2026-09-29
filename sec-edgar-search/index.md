# Search SEC EDGAR filings, financials & insider trades

> The SEC EDGAR API is the SEC's free, no-key REST interface (data.sec.gov) for U.S. company filings, XBRL financials, and insider trades. This builder maps a ticker plus a mode (filings, financials, insider trades) into a ready-to-run query and previews the output shape. The SEC requires a custom User-Agent header browsers can't set, so it builds the config you run live on the backing actor.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Finance & Filings](https://datatooly.xyz/category/finance-filings/)
- URL: https://datatooly.xyz/sec-edgar-search/
- Backing Apify actor: [sec-edgar-scraper](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [The SEC EDGAR API: A Practical Guide to Free Filing Data in Python](https://datatooly.xyz/guides/sec-edgar-api-python-guide/)

Enter tickers and a mode (filings, XBRL financials, full-text search or insider trades) and preview the SEC EDGAR records the actor returns.

## Key takeaways

- The SEC EDGAR API is free and needs no API key or login, but every request must send a User-Agent header naming your app and contact email or it returns 403 Forbidden.
- This page is a query builder: pick a ticker, mode (filings / financials / insider trades) and forms, preview the output shape, then run it live on the backing Apify actor.
- Because the User-Agent header cannot be set from browser JavaScript, EDGAR is effectively blocked in-browser, so the builder produces a config instead of fetching live results here.
- Official endpoints live on data.sec.gov: submissions, XBRL companyfacts, and companyconcept; the CIK must be zero-padded to 10 digits (Apple = CIK0000320193).
- The SEC caps automated access at 10 requests per second per IP (since July 27, 2021); exceeding it triggers a temporary block.
- The backing actor (constructive_calm/sec-edgar-scraper) is free to start, then pay-as-you-go per event, covering filings, XBRL facts, normalized statements, full-text search and Form 4 insider trades.

## How it works

### 1. Enter a ticker or company

Type one or more stock tickers (for example AAPL, MSFT). The builder maps each ticker to the SEC CIK the EDGAR API expects, so you don't have to zero-pad a 10-digit CIK yourself.

### 2. Choose a mode

Select what you want: filings (raw documents), financials (XBRL numbers like revenue and net income), or insider trades (Form 4). The mode determines which EDGAR endpoint and output shape the query targets.

### 3. Pick forms and a limit

Set the form types you care about (10-K, 10-Q, 8-K, Form 4, 13F-HR, and more) and a maxItems cap to control how many records the run returns and what it costs.

## How to use it

1. **Enter a ticker or company** — Type one or more stock tickers (for example AAPL, MSFT). The builder maps each ticker to the SEC CIK the EDGAR API expects, so you don't have to zero-pad a 10-digit CIK yourself.
2. **Choose a mode** — Select what you want: filings (raw documents), financials (XBRL numbers like revenue and net income), or insider trades (Form 4). The mode determines which EDGAR endpoint and output shape the query targets.
3. **Pick forms and a limit** — Set the form types you care about (10-K, 10-Q, 8-K, Form 4, 13F-HR, and more) and a maxItems cap to control how many records the run returns and what it costs.
4. **Preview the output shape** — Review the fixed example output so you know the exact fields you'll receive — type discriminator, cik, ticker, companyName, form, accessionNumber, filingDate, and mode-specific data. This confirms the schema before you spend anything.
5. **Run it live on the actor** — Copy the generated config into the backing Apify actor (constructive_calm/sec-edgar-scraper) and run it. The actor sets the required User-Agent header, respects the 10-requests-per-second limit, and returns live EDGAR data — free to start, then pay-as-you-go.

## Example output

A fixed sample of the fields the sec-edgar-scraper actor returns — example data, not live results.

| companyName | ticker | form | filingDate | accessionNumber |
| --- | --- | --- | --- | --- |
| Apple Inc. | AAPL | 10-K | 2025-10-31 | 0000320193-25-000079 |
| Apple Inc. | AAPL | 10-K | 2024-11-01 | 0000320193-24-000123 |
| MICROSOFT CORP | MSFT | 10-K | 2026-07-29 | 0001193125-26-323660 |
| Tesla, Inc. | TSLA | 10-K | 2026-01-29 | 0001628280-26-003952 |
| Alphabet Inc. | GOOGL | 10-K | 2026-02-05 | 0001652044-26-000018 |

## Ready-to-run actor input

```json
{
  "mode": "filings",
  "forms": [
    "10-K"
  ],
  "maxItems": 25
}
```

## Key facts

- The SEC EDGAR API requires no API key or authentication — it is free and public — but every request must include a User-Agent header naming the application and a contact email, or the request returns 403 Forbidden. (Source: SEC EDGAR developer documentation and multiple API guides (tldrfiling.com, sec.gov), verified 2026-06-01.)
- The SEC limits automated EDGAR access to no more than 10 requests per second per IP address, a policy that took effect July 27, 2021; exceeding it can cause a temporary IP block. (Source: SEC.gov 'Accessing EDGAR Data' / rate-control announcement, corroborated by dealcharts.org and tldrfiling.com, verified 2026-06-01.)
- Official endpoints live on data.sec.gov, and the CIK must be zero-padded to 10 digits (e.g., Apple = CIK0000320193) for the submissions and XBRL companyfacts/companyconcept JSON endpoints. (Source: SEC EDGAR API guide (tldrfiling.com) and SEC.gov endpoint docs, verified 2026-06-01.)
- Form 4 insider-transaction filings must be filed within two business days of the transaction, and Form 8-K current reports generally within four business days of the triggering event. (Source: Investor.gov, SEC.gov forms guidance, and Wikipedia Form 4/8-K entries, verified 2026-06-01.)
- The backing actor (constructive_calm/sec-edgar-scraper) is free to start then pay-as-you-go, with the first 50 chargeable events per run complimentary and per-event prices such as $0.40 per 1,000 filings fetched. (Source: Apify Store listing for constructive_calm/sec-edgar-scraper, retrieved 2026-06-01.)

## FAQ

### Is the SEC EDGAR API free and does it need an API key?

Yes. The SEC EDGAR API is free, public, and requires no API key, token, or login. The only requirement is a descriptive User-Agent header that names your application and a contact email (for example, "Sample Company AdminContact@example.com"). Requests without it return 403 Forbidden. The backing actor that runs your query is separate: it is free to start, then pay-as-you-go per event.

### Why can't this tool fetch SEC EDGAR data live in my browser?

EDGAR rejects requests that lack a proper User-Agent header, and browser JavaScript cannot set that header for cross-origin fetches. EDGAR also does not send CORS headers. So a direct in-browser call is blocked. This page works around that by building a ready-to-run query and previewing the output shape; you then run it live on the backing actor, which sets the required header server-side.

### What's the difference between EDGAR filings, financials, and insider trades?

Filings are the documents companies submit (10-K annual, 10-Q quarterly, 8-K current reports). Financials come from XBRL data the SEC tags inside those filings, giving structured numbers like revenue, net income, and assets. Insider trades are Form 4 filings, which corporate insiders must file within two business days of a stock transaction. This builder lets you target each via its mode setting.

### How do I find a company's CIK from a ticker?

The CIK (Central Index Key) is the SEC's internal identifier for each filer. You can look it up on the SEC's CIK Lookup page by company name or ticker. In the official APIs the CIK must be zero-padded to 10 digits, so Apple's 320193 becomes CIK0000320193. This builder accepts plain tickers and maps them for you, so you usually don't need to enter the CIK manually.

### What are the official SEC EDGAR API endpoints?

They live on data.sec.gov. Company submissions: data.sec.gov/submissions/CIK{10-digit}.json. Company facts (all XBRL data): data.sec.gov/api/xbrl/companyfacts/CIK{10-digit}.json. A single concept: data.sec.gov/api/xbrl/companyconcept/CIK{10-digit}/us-gaap/{Tag}.json. Full-text search runs on a separate host, efts.sec.gov. All return JSON and require the User-Agent header.

### What is the SEC EDGAR API rate limit?

The SEC caps automated access at no more than 10 requests per second per IP address, a policy in force since July 27, 2021. The limit applies across all EDGAR endpoints regardless of how many machines you use. Exceeding it can trigger a temporary IP block (commonly reported as roughly 10 minutes). The backing actor paces requests to stay within this fair-access limit.

### What forms can I query — 10-K, 10-Q, 8-K, Form 4?

Common form types include the 10-K (audited annual report), 10-Q (unaudited quarterly report for the first three quarters), 8-K (current report for major events, due within four business days), and Form 4 (insider transactions, due within two business days). The backing actor also supports 13F-HR institutional holdings, SC 13D/G activist stakes, DEF 14A, and Form D. Set the forms field in this builder.

### Does this builder return live filing data on the page?

No. It builds the query and shows a fixed example of the output shape so you know the field structure (type discriminators, cik, ticker, companyName, form, accessionNumber, filingDate, and mode-specific data). To get live results, run the generated config on the backing Apify actor, which fetches from EDGAR server-side with the required User-Agent and rate-limit handling.

### How fresh is SEC EDGAR data?

EDGAR reflects filings as companies submit them, so new documents appear shortly after acceptance — an 8-K can post within days of a triggering event. Public reference guides do not publish a fixed refresh interval for the XBRL financial endpoints, so treat freshness as event-driven (tied to filing acceptance) rather than a guaranteed schedule. Always confirm filing dates in the returned data.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [MEV pair scanner](https://datatooly.xyz/mev-pair-scanner-tool/)
- [Crypto news scraper](https://datatooly.xyz/crypto-news-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
