# Track AI Brand Mentions Over Time: Schedules and Drift

> Monitor how often ChatGPT and other AI assistants mention your brand over time: what to hold fixed, how often to run, what causes drift, how to compare runs.

- URL: https://datatooly.xyz/guides/track-ai-brand-mentions-over-time/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Is your brand visible in ChatGPT & AI search?](https://datatooly.xyz/llm-visibility-monitor-tool/)
- Run this exact query on Apify: [Track how AI describes your brand's sentiment](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-brand-sentiment-tracking?fpr=v77kxu)
- Another example on Apify: [Track how ChatGPT (OpenAI) mentions your brand](https://apify.com/constructive_calm/llm-visibility-monitor/examples/llm-vis-chatgpt-brand-mentions?fpr=v77kxu)
- Tags: ai, seo, marketing, python

To track AI brand mentions over time, run the same buyer questions in the same assistants with the same settings on a schedule (monthly by hand, weekly with a script). Log every brand and cited domain per answer and compare runs prompt by prompt. Record the model and whether web search ran, to separate real change from updates and noise.

The first check tells you where you stand. This guide is about the second and later checks: what to hold constant, what causes drift, and how to tell a real change from noise. The comparison script at the end runs on the same CSV log as the [free ChatGPT brand check](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/).

## Hold these fixed

If any of these change between runs, a change in your numbers may come from your setup, not the assistants.

| Hold fixed | Why |
|---|---|
| Prompt wording | A reworded question is a different question. Add new prompts as new IDs; never edit old ones. |
| Competitor list | Share of voice is relative; a new competitor lowers everyone else's share. |
| Assistants and modes | Record web search on or off per answer. Searched and unsearched answers behave differently. |
| Personalisation | Same clean session every time: signed out, or memory and custom instructions off. |
| Location and language | Answers can be localised, so run checks from the same country and language each time. |
| Runs per prompt | More runs give a tighter estimate; changing the count changes the noise level. |
| Counting rules | What counts as a mention (not "I'm not familiar with X"), and how you record order and citations. |

Save the raw answers, not just your tallies, so you can re-score old runs if you refine the rules.

## What causes drift

Some changes are real, some come from the assistant, and some are noise.

| Source | What happens | How to spot it |
|---|---|---|
| Model updates | The vendor replaces or updates the model behind the app or API. | Record the model name the app or API reports for each run. A jump across many prompts on the same date suggests an update. |
| Retrieval changes | The pages web search returns for a question change: new reviews, updated listicles, your own new pages. | Compare the cited domains between runs for the prompts that changed. |
| Crawler access | Blocking a search crawler removes your pages from that assistant's search answers. OpenAI documents that sites opted out of OAI-SearchBot "will not be shown in ChatGPT search answers." | Re-check robots.txt and CDN bot rules; see [How AI assistants choose which brands and sources to mention](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/). |
| Your own changes | Pricing pages, comparison pages, reviews, PR. | Note the date of each change, and compare the prompts it should affect. |
| Randomness | The same question gives different answers run to run. | Small samples. A 1-in-3 to 2-in-3 move on one prompt is usually noise. |

## How often to run

| Cadence | Suits | Sample per run |
|---|---|---|
| Monthly | Most brands, done by hand | 10–20 prompts × 3 runs per assistant |
| Weekly | Active content or PR work, scripted | The same set, so weeks are comparable |
| After a known change | A relaunch, a pricing change, a big review | One extra run, compared with the last scheduled one |

Running more often doesn't make a single run more accurate. More answers per run does.

## Compare two runs

This script compares two logs prompt by prompt (won, lost, up, down, same) and tests whether the overall mention rate changed by more than chance would explain:

```python
import csv
import math
import sys
from collections import defaultdict

BRAND = "Northwind"


def load(path):
    """{(assistant, prompt_id): [True/False per run]} - did the answer name BRAND?"""
    out = defaultdict(list)
    for r in csv.DictReader(open(path, encoding="utf-8")):
        brands = [b.strip() for b in r["brands_in_order"].split(";")]
        out[(r["assistant"], r["prompt_id"])].append(BRAND in brands)
    return out


def two_proportion_p(k1, n1, k2, n2):
    """Two-sided p-value for 'the mention rate changed' (normal approximation)."""
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    if se == 0:
        return 1.0
    z = (k2 / n2 - k1 / n1) / se
    return math.erfc(abs(z) / math.sqrt(2))


before, after = load(sys.argv[1]), load(sys.argv[2])
print(f"{'prompt':<16}{'before':>8}{'after':>8}  change")
for key in sorted(set(before) | set(after)):
    b, a = before.get(key, []), after.get(key, [])
    if not b or not a:
        print(f"{'/'.join(key):<16}  only in one run: not comparable")
        continue
    rb, ra = sum(b) / len(b), sum(a) / len(a)
    change = "won" if rb == 0 and ra > 0 else "lost" if rb > 0 and ra == 0 else (
        "up" if ra > rb else "down" if ra < rb else "same")
    print(f"{'/'.join(key):<16}{sum(b)}/{len(b):<6}{sum(a)}/{len(a):<6}  {change}")

k1 = sum(sum(v) for v in before.values()); n1 = sum(len(v) for v in before.values())
k2 = sum(sum(v) for v in after.values()); n2 = sum(len(v) for v in after.values())
print(f"\nmention rate {k1}/{n1} = {k1 / n1:.0%} -> {k2}/{n2} = {k2 / n2:.0%}, "
      f"p = {two_proportion_p(k1, n1, k2, n2):.2f}")
```

`python compare_runs.py log_2026-09.csv log_2026-10.csv` on two small example logs (the brands are placeholders, not real measurements):

```text
prompt            before   after  change
chatgpt/P1      1/3     3/3       up
chatgpt/P2      0/3     1/3       won
chatgpt/P3      3/3     2/3       down

mention rate 4/9 = 44% -> 6/9 = 67%, p = 0.34
```

The headline looks like a 23-point gain. With 9 answers per month, p = 0.34 says a change this size would turn up often by chance alone. Same rates with more answers, using the same test:

| Before | After | p |
|---|---|---|
| 12/30 (40%) | 18/30 (60%) | 0.12 |
| 40/100 (40%) | 50/100 (50%) | 0.16 |
| 80/200 (40%) | 100/200 (50%) | 0.04 |
| 40/100 (40%) | 60/100 (60%) | 0.005 |

A rule of thumb from this: on 100 answers a run, a 20-point move is solid evidence; a 10-point move needs about 200 answers a run before it stands out. The prompt-by-prompt view is still useful at small sizes. It tells you where to look, such as which cited sources changed on a prompt you lost, even when the total isn't conclusive.

## Pitfalls

- **Comparing different prompt sets.** If you added prompts, compare only the prompts present in both runs. The script marks the others as not comparable.
- **Mixing searched and unsearched answers.** If one month used search more often than the other, the rates move for that reason alone. Compare within each mode.
- **Reacting to one prompt.** One prompt going from 3/3 to 2/3 is one answer's difference.
- **Forgetting branded prompts.** Mention rate on branded prompts is always high. Keep them out of the totals and use them to track what the assistant says about you.

## Related guides

- [How to check if ChatGPT mentions your brand (free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/), which defines the log format.
- [AI share of voice: measure it in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/).
- [How AI assistants choose which brands and sources to mention](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/).
- [Measure AI share of voice in Python](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/), for collecting the answers through the APIs.

## Do it without code

The free [LLM visibility query builder](https://datatooly.xyz/llm-visibility-monitor-tool/) gives you a ready-to-run audit input from your brand, category and competitors, with a fixed example of the output. It doesn't call any AI model from your browser.

## At scale

[LLM Visibility Monitor on Apify](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) is built for scheduled runs. It saves the generated question set so every run asks the same questions, compares each run with your previous run for the same brand, country and language (questions won, lost and unchanged), and records the model it requested and the model that actually answered on every row. You can schedule it weekly through Apify. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The comparison script works on any hand-collected log.*

Sources: [OpenAI: overview of OpenAI crawlers](https://developers.openai.com/api/docs/bots), [OpenAI Help Center: Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search), and the two-proportion z-test (computed in the script above).

## Quick answers

### How can I monitor AI mentions for my website or brand?

Fix a set of buyer questions, the assistants you check, and the settings (web search on or off, no personalisation, one country). Run the same set on a schedule, log every brand and cited domain per answer, and compare each run with the previous one prompt by prompt. Changes are only meaningful if the setup stayed the same.

### How often should I check ChatGPT for my brand?

Monthly is enough for most brands by hand; weekly if you are actively changing content and want to see the effect, which is easier to script. Checking daily mostly measures run-to-run randomness unless you collect many answers per day.

### Why did my brand disappear from ChatGPT answers?

Common causes: the model behind the assistant was updated, the pages its web search retrieves changed, a crawler block (for example OAI-SearchBot in robots.txt or at your CDN) stopped your pages being shown, or plain randomness in a small sample. Compare against the same prompts and settings before concluding anything changed.

### How do I keep track of what LLMs say about my brand?

Include a few branded questions ("Is [brand] good for...", "What does [brand] cost?") in each run and save the sentences about your brand with the date and model. Over time you can see which claims change and which sources they come from, and correct pages that feed wrong facts.

## Related guides

- [Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity](https://datatooly.xyz/guides/measure-ai-share-of-voice-python/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
- [How AI Assistants Choose Which Brands and Sources to Cite](https://datatooly.xyz/guides/how-ai-assistants-choose-brands-sources/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
