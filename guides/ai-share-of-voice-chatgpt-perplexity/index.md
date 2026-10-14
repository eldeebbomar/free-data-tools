# AI Share of Voice: Measure It in ChatGPT and Perplexity

> What AI share of voice means, the formula, mentions vs citations, how many answers you need, and a free script to score your ChatGPT and Perplexity runs.

- URL: https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Is your brand visible in ChatGPT & AI search?](https://datatooly.xyz/llm-visibility-monitor-tool/)
- Run this exact query on Apify: [Compare AI share of voice against competitors](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-share-of-voice-vs-competitors?fpr=v77kxu)
- Another example on Apify: [Track brand citations in Perplexity answers](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-perplexity-citation-tracking?fpr=v77kxu)
- Tags: ai, seo, marketing, analytics

AI share of voice is your share of the brand mentions in AI answers to a fixed set of buyer questions: answers naming you ÷ the sum of answers naming each tracked brand (you plus competitors). Measure it separately for ChatGPT, Perplexity and others, from repeated runs of unbranded prompts. Track citations of your domain as a second number.

This page covers the definition, the formulas, how big a sample you need before the number means anything, and a free scoring script that works on a hand-collected log. For the fully scripted version that calls the model APIs, see [Measure AI share of voice in Python](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/).

## The formulas

Count per answer, then add up. "Tracked brands" means your brand plus the competitors you chose.

| Metric | Formula | Answers the question |
|---|---|---|
| Mention rate | answers naming you ÷ all answers | How often am I named at all? |
| Share of voice (presence) | answers naming you ÷ Σ over tracked brands of answers naming that brand | What fraction of the tracked brand mentions are mine? |
| Share of voice (count) | times you're named ÷ times any tracked brand is named | Same, but repeated mentions within one answer count again. |
| Top-3 rate | answers with you among the first three brands named ÷ all answers | Am I near the top when I'm named? |
| Owned-site citation rate | answers citing your domain ÷ all answers | Do the answers use my site as a source? |
| Citation share | citations of your domain ÷ citations of all tracked brands' domains | Whose sites does the assistant read? |

Presence-based share of voice is the more stable of the two: one long answer that repeats a competitor five times doesn't swamp everything else. Whichever you choose, keep it fixed between reports.

Two things make share of voice easy to misread:

- **It's relative.** Add a competitor to the list and your share drops, with nothing changed in the answers. Report the competitor list with the number.
- **It hides absence.** If no tracked brand is named, that answer adds nothing to the share. A 50% share from 2 answers that name anyone is not the same as 50% from 40. Always show the mention rate next to it.

## Mentions vs citations, by assistant

- **Perplexity** says it searches the internet in real time and that "each answer includes numbered citations linking to the original sources" ([Perplexity help center](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work)). Every Perplexity answer therefore has citations to log.
- **ChatGPT** searches the web when it decides a question needs it, or when you turn search on, and then shows its sources ([OpenAI help center](https://help.openai.com/en/articles/9237897-chatgpt-search)). Answers that didn't search have no sources, so "owned-site citation rate" in ChatGPT depends on how often it searched. Record a `web_search` column so you can split the two.

A brand can be named without being cited (the model knows it, but read other pages), or cited without being named (the assistant used your page as a source for a fact but recommended someone else). The second case is common for publishers and review sites.

## How big a sample you need

A mention rate from a handful of answers is mostly noise. The 95% Wilson interval below shows the range a measured rate is consistent with; the arithmetic is the standard binomial confidence interval, not data from any assistant:

| Answers | Measured 50% means the true rate is likely within | Measured 20% means within |
|---|---|---|
| 6 | 19%–81% | 3%–56% |
| 12 | 25%–75% | 5%–45% |
| 30 | 33%–67% | 10%–37% |
| 60 | 38%–62% | 12%–32% |
| 100 | 40%–60% | 13%–29% |
| 200 | 43%–57% | 15%–26% |

What that means in practice:

- **To compare two assistants**, you need enough answers per assistant that their intervals don't overlap. A 10-point gap needs well over 100 answers each.
- **To see a month-over-month change**, the same applies to each month. Small swings between small samples are noise.
- **Spend runs where the answer is uncertain.** Prompts where you appear in 0 of 3 or 3 of 3 runs are settled enough; prompts at 1 or 2 of 3 are where extra runs pay off.

## Score a log

The input is the log format from [How to check if ChatGPT mentions your brand](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/): one row per answer, with brands in the order they appear and the cited domains.

```python
import csv
import math
import sys
from collections import defaultdict

BRAND = "Northwind"
OWNED_DOMAIN = "northwind.io"
COMPETITORS = ["Contoso", "Fabrikam", "Tailspin"]


def wilson(k, n, z=1.96):
    """95% interval for a rate of k out of n (works for small n, unlike k/n +- 2se)."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return (max(0.0, centre - half), min(1.0, centre + half))


rows = list(csv.DictReader(open(sys.argv[1] if len(sys.argv) > 1 else "ai_log.csv", encoding="utf-8")))
by_assistant = defaultdict(list)
for r in rows:
    by_assistant[r["assistant"]].append(r)
by_assistant["ALL"] = rows

tracked = [BRAND] + COMPETITORS
for name, answers in by_assistant.items():
    n = len(answers)
    present = defaultdict(int)    # answers that name each tracked brand at least once
    top3 = cited = 0
    for a in answers:
        order = [b.strip() for b in a["brands_in_order"].split(";") if b.strip()]
        for b in set(order) & set(tracked):
            present[b] += 1
        if BRAND in order[:3]:
            top3 += 1
        if OWNED_DOMAIN in a["cited_domains"].split(";"):
            cited += 1
    k = present[BRAND]
    lo, hi = wilson(k, n)
    sov = k / sum(present[b] for b in tracked)
    print(f"{name:<10} answers={n:<3} mention rate={k / n:.0%} (95% CI {lo:.0%}-{hi:.0%})  "
          f"top-3={top3 / n:.0%}  owned-site cited={cited / n:.0%}  share of voice={sov:.0%}")
    if name == "ALL":
        print("           share of voice by brand:",
              ", ".join(f"{b} {present[b] / sum(present.values()):.0%}" for b in tracked))
```

Run on a 12-answer example log with made-up brands (Northwind, Contoso, Fabrikam and Tailspin are placeholders, not measurements of any real product):

```text
chatgpt    answers=6   mention rate=50% (95% CI 19%-81%)  top-3=50%  owned-site cited=33%  share of voice=20%
perplexity answers=6   mention rate=33% (95% CI 10%-70%)  top-3=33%  owned-site cited=33%  share of voice=14%
ALL        answers=12  mention rate=42% (95% CI 19%-68%)  top-3=42%  owned-site cited=33%  share of voice=17%
           share of voice by brand: Northwind 17%, Contoso 38%, Fabrikam 34%, Tailspin 10%
```

Read the intervals before the headline. A 50% vs 33% difference between the two assistants looks large, but with 6 answers each the intervals (19–81% and 10–70%) overlap almost completely. This log is too small to say one assistant favours the brand more. It is a demo of the method, not a result.

## A measurement plan that holds up

1. **Fix the prompt set.** 10–20 unbranded buyer prompts across intents (best-for, alternatives, comparisons, problems, local, price), plus a few branded prompts reported separately.
2. **Fix the competitor list**, and include brands the answers name that you didn't expect.
3. **Fix the settings.** Same assistants, same mode (web search on or off, recorded per answer), no personalisation, same country.
4. **Collect enough answers.** Start with 3 runs per prompt per assistant, then add runs to the unstable prompts.
5. **Report per assistant, with intervals.** Mention rate, top-3 rate, share of voice, owned-site citation rate, and which sources were cited when you weren't.
6. **Repeat on a schedule** with the same plan; see [Track AI brand mentions over time](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/).

## Related guides

- [Measure AI share of voice in Python](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/): the automated version through the model APIs, with an absence filter for "I'm not familiar with X" answers.
- [How to check if ChatGPT mentions your brand (free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/).
- [How AI assistants choose which brands and sources to mention](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/).
- [Track AI brand mentions over time](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/).

## Do it without code

The free [LLM visibility query builder](https://datatooly.xyz/llm-visibility-monitor-tool/) turns a brand name, a market category and competitors into a ready-to-run audit input and shows a fixed example of the output (mention, position and share of voice per answer). It doesn't call any AI model from your browser, and the example isn't live data for your brand.

## At scale

[LLM Visibility Monitor on Apify](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) computes these numbers per AI surface: mention rate, top-3 rate, average position, sentiment, owned-site citation rate and competitor share of voice, using the same questions and denominator for every brand. It asks the API models behind ChatGPT, Claude, Gemini, Perplexity and Grok, labels whether each answer used live web search, and compares each run with your previous one. API answers can differ from what a logged-in user sees in the apps. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The formulas and script above work on any hand-collected log.*

Sources: [Perplexity: How does Perplexity work?](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work), [OpenAI Help Center: Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search), and the Wilson score interval for binomial proportions (computed in the script above).

## Quick answers

### What does share of voice mean in ChatGPT and Perplexity?

It's your brand's share of the brand mentions in AI answers to a fixed set of buyer questions: answers that name you, divided by the total answers naming any brand you track (you plus your competitors). It's relative: if a competitor gains, your share falls even when your own mentions don't change.

### Is there a way to measure share of voice inside ChatGPT or Perplexity?

Yes. Ask the same unbranded buyer questions several times each in ChatGPT and in Perplexity, log every brand each answer names, then compute your mentions over all tracked brands' mentions, per assistant. Do it by hand for free, or send the prompts through the APIs with a script. Report each assistant separately.

### How many prompts do I need to measure AI share of voice?

Enough answers that the number stops jumping around. With 30 answers, a true 50% mention rate can show anywhere from about 33% to 67% (95% interval); with 100 answers, about 40% to 60%. A practical start is 10 to 20 prompts × 3 runs per assistant, then more runs on the prompts where you appear only sometimes.

### What is the difference between a mention and a citation in AI answers?

A mention is your brand named in the answer text. A citation is your website listed or linked as a source. Perplexity shows numbered citations on every answer; ChatGPT shows sources when it has searched the web. Track both: you can be named without being cited, and cited without being named.

## Related guides

- [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
- [How AI Assistants Choose Which Brands and Sources to Cite](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/)
- [Track AI Brand Mentions Over Time: Schedules and Drift](https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
