# Peptide & GLP-1 market intelligence

> Peptide market research data is consumer-demand signal pulled from public communities about compounds like semaglutide, tirzepatide and BPC-157. This free tool builds a ready-to-run query and previews the exact output shape (mentions, sentiment, intent, vendor leaderboard); you then run it live on the backing Apify actor, which is pay-as-you-go (Apify's platform-level free credits let you start without adding a card).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Health & Pharma](https://datatooly.xyz/category/health-pharma/)
- URL: https://datatooly.xyz/peptide-market-intel-tool/
- Backing Apify actor: [peptide-market-intel](https://apify.com/constructive_calm/peptide-market-intel?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)](https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/)

Pick sources and compound categories and preview the peptide and GLP-1 mentions the actor extracts from YouTube, Amazon and Reddit: compound, intent, sentiment and vendors.

## Key takeaways

- This is a query builder: it generates a ready-to-run config and shows a fixed example of the output shape; it does not fetch live results in the browser.
- Run the configured query on the backing Apify actor (constructive_calm/peptide-market-intel) on a pay-as-you-go basis, using Apify's platform-level free credits to get started.
- Default sources are YouTube and Amazon; Reddit is an opt-in extra. The tool tracks 30+ compounds including semaglutide, tirzepatide, BPC-157 and TB-500 plus brand aliases (Ozempic, Wegovy, Mounjaro).
- Each mention row carries sentiment (positive/neutral/negative + 0-1 score), intent (vendor-question, experience-report, dosage-question, side-effect, price-inquiry), and extracted vendor/brand mentions.
- Optional aggregate reports include TOP_COMPOUNDS, VENDOR_LEADERBOARD, SENTIMENT_BY_COMPOUND and TRENDING_COMPOUNDS_7D for week-over-week tracking.
- Useful for DTC supplement brands, market researchers and brand-risk teams monitoring unregulated peptide and GLP-1 demand signals.
- Set maxItemsPerSource low (e.g. 30) to keep a preview run cheap; only the first 10 chargeable events per run are free, mention rows are charged first, and with aggregates on (the default) up to 4 aggregate reports are charged after them.

## How it works

### 1. Choose your sources and compounds

Select which platforms to scan. YouTube and Amazon are enabled by default; Reddit is an opt-in extra. A source that is blocked is reported as blocked, never as zero results. Optionally narrow to compound categories like GLP-1, healing, cosmetic or longevity, and add any custom vocabulary terms you want matched.

### 2. Set the item limit

Set maxItemsPerSource. Use a small number such as 30 for a low-cost preview run; raise it for fuller weekly scans once you've confirmed the output shape. Only the first 10 chargeable events per run are free: mention rows are charged first, then up to 4 aggregate reports.

### 3. Enable aggregates and trend tracking

includeAggregates is on by default, generating the TOP_COMPOUNDS, VENDOR_LEADERBOARD and SENTIMENT_BY_COMPOUND reports. Schedule the actor and TRENDING_COMPOUNDS_7D reports week-over-week deltas across runs; the history lives in a named key-value store in your account (trendingStoreName).

## How to use it

1. **Choose your sources and compounds** — Select which platforms to scan. YouTube and Amazon are enabled by default; Reddit is an opt-in extra. A source that is blocked is reported as blocked, never as zero results. Optionally narrow to compound categories like GLP-1, healing, cosmetic or longevity, and add any custom vocabulary terms you want matched.
2. **Set the item limit** — Set maxItemsPerSource. Use a small number such as 30 for a low-cost preview run; raise it for fuller weekly scans once you've confirmed the output shape. Note that mention rows are charged first and aggregate reports are charged after mentions, so a small preview may only partly fit inside the actor's first 10 free events per run.
3. **Enable aggregates and trend tracking** — includeAggregates is on by default, generating the TOP_COMPOUNDS, VENDOR_LEADERBOARD and SENTIMENT_BY_COMPOUND reports. Schedule the actor and TRENDING_COMPOUNDS_7D reports week-over-week deltas across runs; the history lives in a named key-value store in your account (trendingStoreName).
4. **Copy the generated query and preview the shape** — The builder outputs a ready-to-run JSON config and a fixed example of the output rows (mention text, compounds, sentiment, intent, vendor/brand mentions) so you know exactly what fields to expect before spending anything.
5. **Run it live on the Apify actor** — Paste the config into the backing actor (constructive_calm/peptide-market-intel) on Apify and run it. The actor performs the live collection and Gemini enrichment and returns your real dataset on a pay-as-you-go basis.

## Example output

A fixed sample of the fields the peptide-market-intel actor returns — example data, not live results.

| compounds | source | intent | sentiment | vendorMentions |
| --- | --- | --- | --- | --- |
| ["semaglutide"] | youtube | experience-report | {"label":"positive","score":0.62} | [] |
| ["BPC-157"] | amazon | side-effect | {"label":"negative","score":-0.41} | ["ExampleLabs"] |
| ["tirzepatide"] | youtube | dosage-question | {"label":"neutral","score":0.05} | [] |
| ["TB-500","BPC-157"] | reddit | vendor-question | {"label":"neutral","score":0} | ["SampleSource"] |
| ["GHK-Cu"] | amazon | experience-report | {"label":"positive","score":0.55} | ["PlaceholderSkin"] |

## Ready-to-run actor input

```json
{
  "sources": [
    "youtube",
    "amazon"
  ],
  "maxItemsPerSource": 50,
  "includeAggregates": true
}
```

## Key facts

- The global GLP-1 receptor agonist market was valued around USD 53.5 billion in 2024, with multiple forecasts projecting roughly 17-22% CAGR into the early 2030s. (Source: Third-party market-research estimates that vary by publisher; confirm the latest figures with the publishers directly. Treat as projections, not guarantees.)
- Semaglutide held the largest single-compound share of the GLP-1 segment in 2024 by most market analyses. (Source: Third-party GLP-1 receptor agonist market analyses; specific share percentages vary by publisher and should be re-checked at the source.)
- Academic researchers have analyzed hundreds of thousands of GLP-1-related Reddit discussions with large language models, generally finding neutral-to-positive sentiment. (Source: Summarized from third-party peer-reviewed Reddit-based studies; verify exact counts and findings with the original publications.)
- Reddit-based pharmacovigilance studies have surfaced patient-reported GLP-1 side effects (for example menstrual changes and chills/hot flashes) that are not prominent in trial labeling. (Source: Third-party academic reporting on Reddit pharmacovigilance studies; confirm specifics with the cited research before relying on them.)
- The actor tracks 30+ peptide compounds and their aliases across YouTube, Amazon and optional Reddit, with an experimental TikTok source disabled by default. (Source: From the actor's README and input schema (constructive_calm/peptide-market-intel). The 30+ total combines a static seed vocabulary with a runtime UniProt query plus a consumer overlay.)
- The backing actor is pay-as-you-go, charging per enriched mention row and per aggregate report, with the first 10 chargeable events per run free. (Source: From the actor's README and pay_per_event configuration; mentions are charged first and the up-to-4 aggregate reports after them; only the first 10 chargeable events per run are free. Confirm current rates on the Apify page.)

## FAQ

### What is peptide market research data?

Peptide market research data is structured signal about consumer demand, sentiment and vendor reputation for peptide compounds such as semaglutide, tirzepatide, BPC-157 and GHK-Cu. Because much of the demand sits in unregulated gray-market and community channels, a large share comes from public discussion on platforms like YouTube, Amazon and Reddit rather than from clinical or regulatory databases alone.

### Does this tool return live peptide data in my browser?

No. It is a query builder. You pick sources, compound categories and item limits, and it produces a ready-to-run configuration plus a fixed example of the output shape so you know exactly what fields you'll get. You then run that query live on the backing Apify actor, which performs the actual collection and enrichment and returns the real dataset.

### How much does it cost to run the query?

Building and previewing the query here is free. The backing Apify actor is pay-as-you-go, and Apify's platform-level free credits let you start without adding a card. Per the actor's pricing it charges per enriched mention row and per aggregate report document, with the first 10 chargeable events per run free. Mention rows are charged first and the aggregate reports after them, so a preview run that finds more than 10 mentions will already be past that free allowance; always confirm current pricing on the actor's Apify page.

### Which peptide compounds and sources are covered?

The actor tracks 30+ compounds across categories like GLP-1, healing, GH-GHRP, cosmetic, sexual, nootropic and longevity, including semaglutide, tirzepatide, BPC-157 and TB-500 plus brand aliases such as Ozempic, Wegovy and Mounjaro. Default sources are YouTube and Amazon; Reddit is available as an opt-in extra, and there is an experimental TikTok option that is off by default.

### What sentiment and intent does each mention include?

Each mention row includes a sentiment object with a label (positive, neutral or negative) and a 0-1 confidence score, plus an intent classification: vendor-question, experience-report, dosage-question, side-effect, price-inquiry or other. Rows also carry resolved canonical compounds, raw aliases, and extracted vendor and brand mentions, so you can separate purchase intent from anecdotal experience reports.

### Can I track peptide demand trends week over week?

Yes. Schedule recurring runs with the same inputs and the actor produces a TRENDING_COMPOUNDS_7D aggregate (its history is kept in a named key-value store in your account) showing week-over-week mention-count deltas per compound. Other aggregates include TOP_COMPOUNDS (mention counts), VENDOR_LEADERBOARD (retailers with sentiment breakdown) and SENTIMENT_BY_COMPOUND for brand-risk monitoring. includeAggregates is on by default, so these reports are generated unless you turn it off.

### Who uses peptide market intelligence like this?

Typical users are DTC supplement and peptide brands, market-intelligence and competitive-intelligence teams, and brand-risk or pharmacovigilance analysts. They use community signal to gauge demand for emerging compounds (for example retatrutide), benchmark vendor reputation, and spot patient-reported side effects before they surface in formal channels. Academic studies have analyzed large samples of GLP-1 Reddit posts for similar purposes.

### Is scraping Reddit and Amazon for this allowed?

The actor collects publicly visible posts, video metadata and product listings, not private or login-gated content. As with any web data collection, you are responsible for complying with each platform's terms and applicable law, and for using the output for legitimate market-research purposes. The tool does not provide medical advice and should not be used to make clinical or dosing decisions.

### How is the sentiment and compound matching generated?

When enrichmentMode is set to full, the actor uses Gemini 2.5 Flash to disambiguate compounds (collapsing slang like 'sema' and 'tirz' to canonical names), classify sentiment with a confidence score, extract intent, and identify vendor and brand names. Setting enrichmentMode to raw skips AI enrichment and returns matched mentions without the sentiment and intent layers.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Google Patents search](https://datatooly.xyz/google-patents-search-builder/)
- [Clinical trials search](https://datatooly.xyz/clinical-trials-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
