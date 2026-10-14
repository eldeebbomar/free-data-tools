# How to Check if ChatGPT Mentions Your Brand (Free)

> A free, step-by-step way to check if ChatGPT and other AI assistants mention your brand: buyer prompts, clean chats, repeat runs, a simple log, and scoring.

- URL: https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Is your brand visible in ChatGPT & AI search?](https://datatooly.xyz/llm-visibility-monitor-tool/)
- Run this exact query on Apify: [Track how ChatGPT (OpenAI) mentions your brand](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-chatgpt-brand-mentions?fpr=v77kxu)
- Another example on Apify: [Audit a brand's visibility across AI answers](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-brand-ai-visibility-audit?fpr=v77kxu)
- Tags: ai, seo, marketing, chatgpt

To check if ChatGPT mentions your brand for free, write 10–20 questions a buyer would ask without naming you. Ask each one in a new, unpersonalised chat, at least three times, and note every brand named, its position and the cited sites. The share of runs that name you is your mention rate. One answer proves nothing; the rate does.

This guide is the manual version of what visibility tools automate. It works in ChatGPT, Perplexity, Gemini, Claude or any other assistant, and it produces a log you can score with a short script, or in a spreadsheet.

## Why one check isn't enough

An AI answer is generated each time you ask, so the same question can name different brands, in a different order, from one chat to the next. Several things change what you see:

| What varies | Why it matters |
|---|---|
| Sampling | The model can pick different words, and different brands, for the same prompt. |
| Web search | ChatGPT can search the web on its own when a question needs current information, or you can turn search on yourself ([OpenAI help: searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search)). A searched answer is built from the pages it found and shows sources; an unsearched one comes from the model's training. |
| Location | Answers to local questions can depend on where you are. "Best accountant near me" will differ by city, so note where each check was run. |
| Personalisation | Memory, past chats and custom instructions can shape answers, so run checks signed out or with personalisation turned off. |
| Model updates | The model behind ChatGPT changes over time, so last quarter's check isn't this quarter's. |

So the question to answer isn't "does ChatGPT mention us?" but "in what share of relevant answers does it name us, and where?".

## Step 1: write buyer prompts, not brand prompts

If you type your brand into the prompt, the answer will mention you. That tells you nothing about recommendations. Write the questions someone asks before they know you exist:

| Intent | Example pattern |
|---|---|
| Best for a use case | "What's the best [category] for [type of company / situation]?" |
| Alternatives | "What are good alternatives to [market leader]?" |
| Comparison | "[Competitor A] vs [Competitor B]: which is better for [use case]?" |
| Problem | "How do I [job your product does] without [common pain]?" |
| Local | "Best [service] in [city]" (only if you serve a location) |
| Price | "Cheapest [category] that still has [key feature]" |

Write 10–20 unbranded prompts across these intents, and keep a separate group of 2–3 branded prompts ("Is [your brand] good for [use case]?", "What does [your brand] cost?") to check what the assistant says about you. Report the two groups separately; the branded ones always mention you.

Give each prompt an ID (P1, P2...) and never edit the wording once you start, or later checks won't be comparable.

## Step 2: use a clean session

- **Remove personalisation.** Use a private browser window while signed out, or a chat with memory and custom instructions turned off. Your own chat history about your company can steer the answer toward you.
- **Start a new chat for every prompt.** Earlier messages in a conversation shape later answers.
- **Pick your location on purpose.** If you sell in one country, run the checks from there, or note where you ran them.
- **Write down the model.** Note which model or mode the app shows, if any.

## Step 3: run each prompt several times

Ask each prompt at least three times, each in its own new chat. Three runs won't give you a precise number, but they show whether you appear always, never, or sometimes. "Sometimes" prompts need more runs; see [AI share of voice](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/) for how many.

Do the same for web search on and off if you want both views. In ChatGPT, an answer that used search shows sources you can open; record whether it did.

## Step 4: log every answer the same way

One row per answer, in a spreadsheet or CSV:

```csv
date,assistant,web_search,prompt_id,run,brands_in_order,cited_domains
2026-10-14,chatgpt,on,P1,1,Contoso;Northwind;Fabrikam,contoso.com;g2.com;northwind.io
2026-10-14,chatgpt,on,P1,2,Contoso;Fabrikam,contoso.com;reddit.com
```

- `brands_in_order`: every brand the answer names, in the order it first names them, separated by `;`. Include brands you don't track; they're the competitors you didn't know about.
- `cited_domains`: the domains of the sources the answer links or lists.
- If you want more, add a column for a short quote of what the answer says about you, so you can catch wrong facts.

Count a brand only when the answer recommends or describes it. "I'm not familiar with Northwind" is not a mention.

## Step 5: score it

Three numbers, per assistant and per prompt:

- **Mention rate:** answers that name you ÷ all answers.
- **Top-3 rate:** answers that name you among the first three brands ÷ all answers.
- **Owned-site citation rate:** answers that cite your own domain ÷ all answers.

A spreadsheet's `COUNTIF` does it. Or run this script on the CSV. It groups the runs by assistant and prompt and flags the prompts where you appear only some of the time:

```python
import csv
import sys
from collections import defaultdict

BRAND = "Northwind"          # your brand, spelled as you log it
OWNED_DOMAIN = "northwind.io"

rows = list(csv.DictReader(open(sys.argv[1], encoding="utf-8")))
groups = defaultdict(list)
for r in rows:
    groups[(r["assistant"], r["prompt_id"])].append(r)

print(f"{'assistant':<11}{'prompt':<7}{'runs':>5}{'named':>7}{'top 3':>7}{'cited':>7}  verdict")
for (assistant, pid), runs in sorted(groups.items()):
    order = [[b.strip() for b in r["brands_in_order"].split(";") if b.strip()] for r in runs]
    named = sum(BRAND in o for o in order)
    top3 = sum(BRAND in o[:3] for o in order)
    cited = sum(OWNED_DOMAIN in r["cited_domains"].split(";") for r in runs)
    verdict = ("always" if named == len(runs) else "never" if named == 0 else "unstable: run more")
    print(f"{assistant:<11}{pid:<7}{len(runs):>5}{named:>7}{top3:>7}{cited:>7}  {verdict}")
```

Run on a 12-row example log (`python prompt_summary.py ai_log.csv`). The brands are made up: Northwind, Contoso, Fabrikam and Tailspin are placeholder names, not real results.

```text
assistant  prompt  runs  named  top 3  cited  verdict
chatgpt    P1         3      2      2      2  unstable: run more
chatgpt    P2         3      1      1      0  unstable: run more
perplexity P1         3      1      1      1  unstable: run more
perplexity P2         3      1      1      1  unstable: run more
```

## How to read the result

- **"Never" on unbranded prompts** means the assistant doesn't put you in its answer for that need. Look at who it names instead and which sites it cites; those sources are where your category's reputation is being formed.
- **"Unstable"** is the common case. You're on the edge of the list. More runs will tell you whether that's 1 in 3 or 2 in 3.
- **Mentioned but not cited** means the assistant knows you, but your own pages aren't what it reads. **Cited but not mentioned** means it reads your pages for facts but recommends others.
- **Branded prompts** are for accuracy. Check prices, plans and claims it states about you against reality.

For why assistants pick the brands and sources they do, see [How AI assistants choose which brands and sources to mention](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/).

## Related guides

- [AI share of voice: measure it in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/), with the formula and sample sizes.
- [How AI assistants choose which brands and sources to mention](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/).
- [Track AI brand mentions over time](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/).
- [Measure AI share of voice in Python](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/), the scripted version through the model APIs.

## Do it without code

The free [LLM visibility query builder](https://datatooly.xyz/llm-visibility-monitor-tool/) takes your brand, market category and competitors, and produces a ready-to-run audit input, with a fixed example of the output shape. It doesn't query any AI model from your browser, and the example isn't live data for your brand.

## At scale

[LLM Visibility Monitor on Apify](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) automates this protocol. It writes a buyer-question set for your category (the generator is never told your brand name; a few branded questions are reported separately), saves it so every run asks the same questions, and sends them to the API models behind ChatGPT, Claude, Gemini, Perplexity and Grok. Each row records whether your brand was mentioned, its position, the cited sources, and whether that model searched the web. These are API models, not the consumer apps, so answers can differ from what a logged-in user sees. It has a free demo mode that calls no models, and is free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The manual protocol above needs neither.*

Sources: [OpenAI Help Center: Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search), [Perplexity: How does Perplexity work?](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work).

## Quick answers

### How can I check my brand in ChatGPT for free?

Write 10 to 20 questions a buyer in your category would ask, without your brand name in them. Ask each one in a new, unpersonalised chat (signed out, or with memory off), three times, and log which brands the answer names, in what order, and which sites it cites. The share of runs that name you is your mention rate. It costs nothing but time.

### Is there a tool to see if ChatGPT mentions your brand?

Yes, several paid tools run fixed prompt sets through AI models on a schedule. You can do the same check by hand for free with the protocol on this page, or script it through the model APIs and pay per call. Whatever you use, check that it asks unbranded buyer questions, repeats each one, and tells you whether web search was on.

### How do I track ChatGPT mentions of my brand over time?

Keep the prompt set, settings and log format fixed, and repeat the check on a schedule, for example monthly by hand or weekly with a script. Compare mention rates between runs, not single answers, because the same question can name different brands each time.

### Why does ChatGPT mention my brand in one chat but not another?

Answers are generated, not looked up, so each run can differ. Whether ChatGPT searched the web, your account's memory and custom instructions, your approximate location, and model updates all change the answer. That's why a single check proves little and you need repeated runs.

### Does asking ChatGPT 'what do you know about my brand' work?

It tells you what ChatGPT says when it's asked about you by name, which is useful for checking facts. It doesn't tell you whether ChatGPT recommends you to someone who doesn't know your name yet. For that, ask unbranded questions like "best [category] for [use case]".

## Related guides

- [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How AI Assistants Choose Which Brands and Sources to Cite](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/)
- [Track AI Brand Mentions Over Time: Schedules and Drift](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
