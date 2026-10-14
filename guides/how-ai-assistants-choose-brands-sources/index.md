# How AI Assistants Choose Which Brands and Sources to Cite

> What OpenAI, Perplexity, Anthropic and Google document about how their assistants pick sources: web search, crawlers, robots.txt. Plus a crawler check script.

- URL: https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Is your brand visible in ChatGPT & AI search?](https://datatooly.xyz/llm-visibility-monitor-tool/)
- Tags: ai, seo, marketing, python

AI assistants answer from two places: what the model learned in training and, when they search the web, the pages the search returns, which they show as citations. Vendors document the crawlers and controls (robots.txt tokens, location, search settings) but not how they rank sources, so treat any "ranking factor" list as a guess unless it cites the vendor.

This page sticks to what OpenAI, Perplexity, Anthropic and Google say in their own documentation, marks the places where the docs are silent, and gives you a script to check whether these assistants' crawlers may read your site.

## Two ways an answer gets built

| | Answer from model knowledge | Answer with web search |
|---|---|---|
| Where brands come from | Patterns the model learned in training | Pages the search step retrieved for this question, plus what the model already knows |
| Sources shown | Usually none | Citations or a sources list |
| How current | As of the model's training data | As current as the pages retrieved |
| What you can influence | Slowly: being widely and consistently described across the web | Being on the pages that get retrieved, and letting the search crawler read your site |

Whether a given answer searched is often the model's own choice:

- **ChatGPT** can search the web on its own when a question benefits from current information, and you can also turn search on yourself; answers that used search show their sources ([OpenAI help: searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search)).
- **OpenAI's API** says the same about its web search tool: "the model can choose to search the web or not based on the content of the input prompt" ([OpenAI web search guide](https://developers.openai.com/api/docs/guides/tools-web-search)).
- **Perplexity** says it uses AI "to search the internet in real-time" and that "each answer includes numbered citations linking to the original sources" ([Perplexity help center](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work)).

That's why measuring visibility means recording, per answer, whether search was used.

## Which pages the search step can use

Each vendor runs separate crawlers for search and for training, with separate robots.txt tokens. From their own documentation:

| Vendor | Token | What the vendor says it's for |
|---|---|---|
| OpenAI | `OAI-SearchBot` | "used to surface websites in search results in ChatGPT's search features." "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links." |
| OpenAI | `ChatGPT-User` | Certain user actions in ChatGPT and Custom GPTs; "not used for crawling the web in an automatic fashion", and "robots.txt rules may not apply." |
| OpenAI | `GPTBot` | Crawling content that "may be used in training our generative AI foundation models." |
| Perplexity | `PerplexityBot` | "designed to surface and link websites in search results on Perplexity"; "not used to crawl content for AI foundation models." |
| Perplexity | `Perplexity-User` | Fetches pages for user questions; "generally ignores robots.txt rules." |
| Anthropic | `Claude-SearchBot` | "navigates the web to improve search result quality for users"; blocking it "prevents our system from indexing your content for search optimization." |
| Anthropic | `Claude-User` | Retrieves content in response to a user query; blocking it prevents that. |
| Anthropic | `ClaudeBot` | Training: blocking it signals that future materials "should be excluded from our AI model training datasets." |
| Google | `Google-Extended` | Controls use for training future Gemini models and for grounding in Gemini Apps; it "does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search." |

OpenAI adds that "it can take ~24 hours from a site's robots.txt update for our systems to adjust" for search results.

The practical point: **blocking a training crawler doesn't remove you from AI search, and blocking a search crawler can.** If you want to be cited in ChatGPT search answers, OpenAI's documentation says OAI-SearchBot must be allowed.

### Check your own site

```python
import sys
import urllib.robotparser

import requests

# User-agent tokens from each vendor's own crawler documentation.
AGENTS = {
    "OAI-SearchBot": "ChatGPT search results",
    "ChatGPT-User": "ChatGPT fetching a page for a user",
    "GPTBot": "OpenAI model training",
    "PerplexityBot": "Perplexity search results",
    "Claude-SearchBot": "Claude search indexing",
    "Claude-User": "Claude fetching a page for a user",
    "ClaudeBot": "Anthropic model training",
    "Google-Extended": "Gemini training and grounding (not Google Search)",
}


def check(site, path="/"):
    url = f"https://{site}/robots.txt"
    r = requests.get(url, timeout=20, headers={"User-Agent": "robots-check/1.0"})
    rp = urllib.robotparser.RobotFileParser()
    rp.parse(r.text.splitlines() if r.status_code == 200 else [])
    print(f"{site}{path}  (robots.txt HTTP {r.status_code})")
    for agent, purpose in AGENTS.items():
        verdict = "allowed" if rp.can_fetch(agent, f"https://{site}{path}") else "BLOCKED"
        print(f"  {agent:<17} {verdict:<8} {purpose}")


for site in sys.argv[1:]:
    check(site)
```

`python ai_robots.py datatooly.xyz` on 2026-10-14:

```text
datatooly.xyz/  (robots.txt HTTP 200)
  OAI-SearchBot     allowed  ChatGPT search results
  ChatGPT-User      allowed  ChatGPT fetching a page for a user
  GPTBot            allowed  OpenAI model training
  PerplexityBot     allowed  Perplexity search results
  Claude-SearchBot  allowed  Claude search indexing
  Claude-User       allowed  Claude fetching a page for a user
  ClaudeBot         allowed  Anthropic model training
  Google-Extended   allowed  Gemini training and grounding (not Google Search)
```

Pass your own domain. Python's `urllib.robotparser` follows the basic robots.txt rules but not every extension, so treat a surprising result as a reason to read the file yourself. A missing robots.txt (HTTP 404) means everything is allowed. Your CDN or firewall can also block these crawlers regardless of robots.txt; check its bot settings too.

## Other inputs the vendors document

- **Location.** Answers to local questions depend on where the asker is. The OpenAI API's web search tool accepts an approximate `user_location` (country, city, region, timezone). The same "best dentist" question has different right answers in different cities.
- **Personalisation.** Memory, chat history and custom instructions can shape answers in ChatGPT. OpenAI's shopping help article lists memory and custom instructions among the context it uses to pick products.
- **Product results aren't ads.** The same shopping article says product results are chosen independently and that ads are shown separately.
- **How much the search step reads.** In OpenAI's API, `search_context_size` changes how much retrieved material the model sees, and the docs say it "does not set an exact token count or guarantee a specific number of sources or citations."

## What the vendors don't say

None of these vendors publishes how it ranks retrieved pages, how it picks which brands to name from them, or how training data shapes recommendations. Advice that lists precise "ranking factors" for ChatGPT or Perplexity is inference from experiments, not documentation. Some experiments are useful, but read them as observations that can change with the next model update.

What you can do with confidence follows from the documented parts:

1. **Let the search crawlers in** (the table above), and check your CDN isn't blocking them.
2. **Find out which pages get cited** for your buyer questions. Log the cited domains for every answer, as in [How to check if ChatGPT mentions your brand](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/). Those pages are what the search step currently reads for your category, whether they are yours, a competitor's, a review site or a forum.
3. **Make the facts easy to retrieve.** Searched answers quote prices, plans and features from pages. Out-of-date pricing on your own site or a well-cited review page is a likely source of wrong answers about you.
4. **Measure, change one thing, and measure again** with the same prompt set. Without a fixed baseline you can't tell a real gain from run-to-run noise; see [AI share of voice](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/) for sample sizes.

## Related guides

- [How to check if ChatGPT mentions your brand (free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/).
- [AI share of voice: measure it in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/).
- [Track AI brand mentions over time](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/).
- [Measure AI share of voice in Python](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/).

## Do it without code

The free [LLM visibility query builder](https://datatooly.xyz/llm-visibility-monitor-tool/) turns your brand, category and competitors into a ready-to-run audit input, with a fixed example of the output. It doesn't call any AI model from your browser.

## At scale

[LLM Visibility Monitor on Apify](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) records the sources behind each answer. It classifies every cited domain as owned, competitor, review site, Reddit or other user content, news, or other, ranks them, and lists the third-party sources cited in answers where a competitor appeared and you didn't. It also quotes the prices, plans and facts the answers state about your brand so you can check them. It asks the API models behind ChatGPT, Claude, Gemini, Perplexity and Grok and labels whether each answer used live web search; API answers can differ from the consumer apps. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. Everything above is from the vendors' public documentation.*

Sources: [OpenAI: overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots), [OpenAI: web search tool guide](https://developers.openai.com/api/docs/guides/tools-web-search), [OpenAI Help Center: Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search), [Perplexity: How does Perplexity work?](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work), [Perplexity crawlers](https://docs.perplexity.ai/guides/bots), [Anthropic: crawlers and how to block them](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Google's common crawlers (Google-Extended)](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers).

## Quick answers

### How does ChatGPT decide which brands to recommend?

OpenAI doesn't publish a ranking formula. What it documents: ChatGPT answers either from what the model learned in training or, when it searches the web, from the pages the search returns, and it shows those as sources. Sites that block OAI-SearchBot are not shown in ChatGPT search answers. Location and personalisation can also change the result.

### Does blocking GPTBot remove my site from ChatGPT search?

No. OpenAI's crawler documentation says GPTBot is for training foundation models, and OAI-SearchBot is the one used to surface websites in ChatGPT's search features: "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers, though can still appear as navigational links." The two are controlled separately in robots.txt.

### How does Perplexity choose its sources?

Perplexity says it searches the internet in real time and that each answer includes numbered citations linking to the original sources. It doesn't publish how it ranks them. Its crawler, PerplexityBot, is "designed to surface and link websites in search results on Perplexity" and, per Perplexity, is not used to collect training data for AI foundation models.

### How can I monitor how ChatGPT and other AI assistants describe my brand?

Ask each assistant a fixed set of questions on a schedule, including a few that name your brand ("Is [brand] good for [use case]?", "What does [brand] cost?"), and log the claims it makes about you and the sources it cites. Compare them with your real prices and features, and fix the pages it cites when they are out of date.

## Related guides

- [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
- [Track AI Brand Mentions Over Time: Schedules and Drift](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
