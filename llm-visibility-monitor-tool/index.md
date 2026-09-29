# Is your brand visible in ChatGPT & AI search?

> To track brand mentions in ChatGPT, run a fixed set of prompts through it on a recurring cadence and parse each answer for your brand name, position, citations, and sentiment. This builder generates a ready-to-run query and previews the output shape for the LLM Visibility Monitor actor, which queries ChatGPT plus Claude, Gemini, Perplexity, and Grok. Run it live on Apify (free to start with Apify's platform credits, then pay-as-you-go).

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [AI & SEO](https://datatooly.xyz/category/ai-seo/)
- URL: https://datatooly.xyz/llm-visibility-monitor-tool/
- Backing Apify actor: [llm-visibility-monitor](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)

Enter a brand, a market category and competitors, and preview how the actor records brand mentions across ChatGPT, Claude, Gemini, Perplexity and Grok: mention, position and share of voice per answer.

## Key takeaways

- This page is a query builder: enter your brand and market category, get a ready-to-run config plus a fixed example of the output shape. It does not fetch live ChatGPT answers in the browser.
- The backing actor queries five AI engines as chat models via API: ChatGPT (OpenAI), Claude, Google Gemini, Perplexity, and Grok. It does not scrape Google AI Overview SERPs.
- A mention (your brand is named) is different from a citation (your domain is linked as a source). The output captures both as separate fields.
- Output fields include brandMentioned, brandPosition, shareOfVoice, ownedDomainCited, citedUrls/citedDomains, sentimentLabel/sentimentScore, and an answerSnippet as evidence.
- AI answers vary by user, session, and model version, so a single manual check is unreliable; recurring prompt-set runs reveal the trend.
- The actor defaults to a dry-run mode that makes no external API calls and incurs no charges, so you can smoke-test the config safely before running a live, pay-as-you-go audit.
- Share of voice = your brand mentions divided by total brand + competitor mentions across the prompt set, i.e. your share of AI answers.

## How it works

### 1. Enter your brand name

Type the exact brand name you want to track in ChatGPT and the other AI engines. Use the name as customers would say it, since that is what the AI must produce in its answer for a mention to count.

### 2. Add your market category

Describe your market category (for example, 'B2B analytics software' or 'project management tools'). This lets the actor auto-generate realistic buyer-intent prompts that prospects would actually ask an AI assistant.

### 3. Choose a run preset

Pick a runPreset that balances depth against cost: quick (the default) is the cheapest read, agency and deep add more prompts, platforms and samples for a fuller audit, and custom lets you set everything yourself.

## How to use it

1. **Enter your brand name** — Type the exact brand name you want to track in ChatGPT and the other AI engines. Use the name as customers would say it, since that is what the AI must produce in its answer for a mention to count.
2. **Add your market category** — Describe your market category (for example, 'B2B analytics software' or 'project management tools'). This lets the actor auto-generate realistic buyer-intent prompts that prospects would actually ask an AI assistant.
3. **Choose a run preset** — Pick a runPreset that balances depth against cost: quick (the default) is the cheapest read, agency and deep add more prompts, platforms and samples for a fuller audit, and custom lets you set everything yourself.
4. **Generate the query and preview the output shape** — The builder produces a ready-to-run configuration and shows a fixed example of the output, including brandMentioned, brandPosition, shareOfVoice, citedDomains, and sentiment fields, so you know exactly what you will receive.
5. **Run it live on Apify** — Copy the generated config into the LLM Visibility Monitor actor on Apify and run it. It starts in a safe dry-run by default (no charges), then runs live pay-as-you-go and writes results plus summary reports to your dataset and key-value store.

## Example output

A fixed sample of the fields the llm-visibility-monitor actor returns — example data, not live results.

| prompt | platformLabel | brandMentioned | brandPosition | shareOfVoice |
| --- | --- | --- | --- | --- |
| best note-taking apps for small teams | OpenAI GPT Latest | true | 2 | 0.33 |
| best note-taking apps for small teams | Perplexity Sonar | true | 1 | 0.5 |
| Acme Notes alternatives | Claude Sonnet Latest | true | 1 | 0.25 |
| which note app syncs offline | Gemini Flash Latest | false |  | 0 |
| note-taking app with the best AI features | Grok 4.3 | false |  | 0 |

## Ready-to-run actor input

```json
{
  "runPreset": "quick"
}
```

## Key facts

- The backing actor queries five AI engines as chat models: ChatGPT (OpenAI), Claude, Google Gemini, Perplexity, and Grok. Every platform routes through OpenRouter as a model call; it does not scrape Google AI Overview SERPs. (Source: From the LLM Visibility Monitor actor's README and input schema.)
- Share of voice is computed as brand mentions divided by total brand plus competitor mentions across the prompt set. (Source: From the actor's README; consistent with the general industry definition of AI share of voice as percentage of inclusion in AI answers.)
- A brand's mention rate can swing substantially from one week to the next without any page changes, due to token sampling and retrieval drift. (Source: Reflects the well-documented non-determinism of LLM answers; any specific percentages are illustrative of drift, not a fixed benchmark.)
- ChatGPT answer variability is driven by four factors: probabilistic token sampling, per-user personalization, model version, and live retrieval. (Source: Synthesized from general AI-visibility and GEO community guidance; illustrative secondary commentary, not a load-bearing citation.)
- The actor's per-event pricing includes about $0.15 per standard LLM sample and $0.35 per premium sample, with a dry-run mode that incurs no charges. (Source: From the actor's pay-per-event pricing metadata and README; confirm current rates on the Apify Store listing before running.)
- A brand mention (the AI names your brand) is distinct from a citation (the AI links to your domain as a source) and the two require different strategies. (Source: General GEO community guidance; reflected in the actor's separate brandMentioned and ownedDomainCited fields.)

## FAQ

### How do I track brand mentions in ChatGPT?

Run a fixed set of buyer-intent prompts through ChatGPT on a schedule and parse each response for your brand name, its position among competitors, any citations to your domain, and sentiment. Doing this manually is unreliable because answers vary per session, so most teams automate it. This builder generates the query and previews the output shape; the backing LLM Visibility Monitor actor runs the prompts live across ChatGPT and four other engines.

### Does this tool fetch live ChatGPT answers in my browser?

No. This is a query builder. You enter your brand name and market category, and it produces a ready-to-run configuration plus a fixed example of the output shape so you know exactly what fields you will get. The live querying of ChatGPT and the other engines happens when you run the backing actor on Apify, which calls the AI platforms' APIs. That live querying runs server-side in the actor, where the API keys live, not in your browser.

### What is the difference between a brand mention and a citation in AI search?

A mention means the AI named your brand in its answer text. A citation means the AI linked to your website as a source. They require different strategies and are tracked separately. The actor's output records brandMentioned (boolean) and brandPosition for mentions, plus ownedDomainCited (boolean) and citedUrls/citedDomains arrays for citations, so you can see whether you are being talked about, linked to, or both.

### Which AI platforms does the LLM Visibility Monitor check?

Five major AI engines: ChatGPT (OpenAI), Claude (Anthropic), Google Gemini (used as a proxy for Google's AI Overview signal; the actor queries the Gemini model, it does not scrape Google AI Overview SERPs), Perplexity, and Grok. You can select which platforms to query when you run the actor. Checking multiple engines matters because brand visibility differs sharply between them; a brand recommended in Perplexity may be absent from ChatGPT for the same prompt.

### Why do ChatGPT brand answers change every time I ask?

ChatGPT answers vary due to probabilistic token sampling, per-user personalization and memory, the model version in use, and live retrieval. In practice a brand's mention rate can swing widely from one week to the next without changing a single page, purely from sampling and retrieval drift; treat any specific percentage as illustrative of that volatility, not a fixed benchmark. That variability is why a single manual check is misleading and why recurring, multi-sample prompt runs are needed to read a real trend.

### Is this tool free?

The builder on this page is free to use. The backing Apify actor defaults to a dry-run mode that makes no external API calls and incurs no charges, so you can smoke-test the config safely. Once you turn dry-run off and run it live, pricing is pay-per-event: about $0.15 per standard LLM sample and $0.35 per premium sample per the actor's pricing, and samples that return no usable evidence are not charged. New Apify accounts also get platform-level free credits to start.

### What is share of voice in AI search?

Share of voice is your percentage of inclusion in AI answers across a defined prompt set, often called your market share of answers. The actor calculates it as your brand mentions divided by total brand plus competitor mentions. Unlike traditional SEO rankings, you are competing for inclusion in the AI's final response, not for a position in a list of blue links, so a higher share of voice means the AI recommends you more often than rivals.

### How often should I audit my brand's AI visibility?

Most GEO practitioners recommend monthly or quarterly audits, with higher-cadence monitoring for competitive categories. Because AI answers drift between sessions and model updates, run the same prompt set repeatedly and compare snapshots over time rather than relying on one check. A common pattern is to note when you publish content or earn press, then look for movement in mention rate and citations 4 to 8 weeks later.

### Can I track competitors alongside my own brand?

Yes. When you run the actor you can supply a competitor list by brand name or URL. The output then tracks competitor mentions, position comparisons, and gaps where a competitor appears in the answer but your brand does not. This is what powers the share-of-voice calculation and the COMPETITOR_SHARE_OF_VOICE and PROMPT_GAPS summary reports, so you can see exactly which prompts your rivals own and you are missing.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Facebook Ad Library scraper](https://datatooly.xyz/facebook-ad-library-search/)
- [TikTok Ad Library API tool](https://datatooly.xyz/tiktok-ad-library-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
