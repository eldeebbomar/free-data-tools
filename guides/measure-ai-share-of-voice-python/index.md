# Measure AI Share of Voice in Python: ChatGPT, Gemini, Perplexity

> Measure your brand's AI share of voice in Python: one prompt set, several LLMs, mention counting that ignores 'I'm not familiar with X' answers.

- URL: https://datatooly.xyz/guides/measure-ai-share-of-voice-python/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Is your brand visible in ChatGPT & AI search?](https://datatooly.xyz/llm-visibility-monitor-tool/)
- Tags: python, ai, seo, llm

AI share of voice is your brand's mentions divided by the combined mentions of your brand and the competitors you track, counted across a fixed set of buyer-style prompts and several AI models. To measure it in Python, send every prompt to every model through one API, count mentions sentence by sentence, skip sentences where the model says it doesn't know you, then divide.

Most write-ups on this topic stop at the formula and a spreadsheet. This one gives you a script that runs, plus the counting mistakes that make a visibility report say the opposite of the truth.

## What you are actually measuring

An LLM answer is sampled, not looked up. Ask the same model the same question twice and the list of brands, their order, and the wording can all change. So "are we in ChatGPT?" has no single yes/no answer. It has a rate, and a rate needs three fixed things:

1. **A prompt set.** Questions a buyer would really ask, like "best note-taking app for a small startup team", not "what is Notion". Keep the set stable between runs, or your trend is measuring your prompt edits.
2. **A model set.** Visibility differs between engines, so measure each one separately and report them side by side.
3. **Repeated samples.** One answer per prompt is an anecdote. Run each prompt several times per model and average.

A second distinction matters just as much: **mention versus citation.** A mention is your brand name appearing in the answer text. A citation is your domain appearing as a linked source. Web-searching models can cite you without naming you prominently, and model-knowledge answers can name you without linking anything. Record both.

## The source, and its limits

The script uses [OpenRouter](https://openrouter.ai), an OpenAI-compatible endpoint that routes one request format to OpenAI, Google, Perplexity, Anthropic and others. That saves you writing five clients. The `~…-latest` model IDs it exposes (for example `~openai/gpt-mini-latest`) follow each vendor's newest model in that line, which is convenient for monitoring but means the model underneath can change between runs.

Be clear about what an API answer is. It isn't a screenshot of someone's ChatGPT app. Consumer apps add memory, account personalization, location and product experiments that an API call doesn't have. API sampling is the repeatable, comparable baseline, not a reproduction of any one user's screen.

## Runnable Python

Set `OPENROUTER_API_KEY` in your environment, edit the brand, competitors, prompts and models, and run it. Each call is billed by OpenRouter per token, so start with one prompt and one sample.

```python
import os, re, time, json, requests

API = "https://openrouter.ai/api/v1/chat/completions"
KEY = os.environ["OPENROUTER_API_KEY"]

BRAND = ["Notion"]                                    # brand + aliases (no overlapping aliases)
COMPETITORS = {"Obsidian": ["Obsidian"], "Evernote": ["Evernote"], "OneNote": ["OneNote"]}
PROMPTS = ["What is the best note-taking app for a small startup team?"]
MODELS = ["~openai/gpt-mini-latest", "~google/gemini-flash-latest", "perplexity/sonar"]
SAMPLES = 1                                           # raise to 3+ for a real audit

# A sentence where the model says it does NOT know the brand is absence, not visibility.
ABSENCE = re.compile(
    r"\b(not familiar|not aware|couldn't find|could not find|unable to find|"
    r"no (?:information|data|results)|does(?:n't| not) (?:appear|exist)|never heard|fictional)\b",
    re.I,
)

def ask(model, prompt, attempts=3):
    for i in range(attempts):
        try:
            r = requests.post(API, timeout=90,
                              headers={"Authorization": f"Bearer {KEY}"},
                              json={"model": model, "temperature": 0.2, "max_tokens": 1200,
                                    "messages": [{"role": "user", "content": prompt}]})
            if r.status_code in (401, 403):
                raise SystemExit(f"auth failed: {r.text[:200]}")   # a dead key never recovers
            r.raise_for_status()
            return r.json()["choices"][0]["message"].get("content") or ""
        except (requests.RequestException, ValueError, KeyError):
            if i == attempts - 1:
                raise
            time.sleep(2 ** i)                                   # 1s, 2s backoff

def hits(text, aliases):
    return [m.start() for a in aliases
            for m in re.finditer(rf"(?<![\w.]){re.escape(a)}(?!\w)", text, re.I)]

def score(answer):
    sentences = [s for s in re.split(r"(?<=[.!?])\s+|\n+", answer) if s.strip()]
    brand = sum(len(hits(s, BRAND)) for s in sentences if not ABSENCE.search(s))
    comps = {name: len(hits(answer, al)) for name, al in COMPETITORS.items()}
    first_seen = {name: min(hits(answer, al)) for name, al in COMPETITORS.items() if hits(answer, al)}
    if brand:
        first_seen["__brand__"] = min(hits(answer, BRAND))
    order = sorted(first_seen, key=first_seen.get)
    return {"brandMentionCount": brand, "brandMentioned": brand > 0,
            "brandPosition": order.index("__brand__") + 1 if brand else None,
            "competitorMentions": comps}

if __name__ == "__main__":
    rows = []
    for prompt in PROMPTS:
        for model in MODELS:
            for s in range(SAMPLES):
                rows.append({"prompt": prompt, "model": model, "sample": s, **score(ask(model, prompt))})

    brand_total = sum(r["brandMentionCount"] for r in rows)
    comp_total = sum(sum(r["competitorMentions"].values()) for r in rows)
    print(json.dumps(rows, indent=2))
    if brand_total + comp_total:
        print(f"share of voice: {brand_total / (brand_total + comp_total):.0%}")
```

```bash
pip install requests
export OPENROUTER_API_KEY=sk-or-...
python ai_share_of_voice.py
```

You get one row per prompt × model × sample, then a single share-of-voice figure. Don't read much into the number from one prompt and one sample. It moves from run to run, which is the whole reason to sample repeatedly.

The absence filter is the part worth testing yourself. Feed `score()` a sentence like *"I'm not familiar with Notion, so I can't compare it. Obsidian and Evernote are popular choices."* and it returns `brandMentioned: False` with the competitors counted. A naive "is the name in the text" check would call that a mention.

## Fields worth recording

The script keeps the minimum. A production audit usually stores these per answer:

| Field | Type | Meaning |
|---|---|---|
| `brandMentioned` | bool | Brand named in at least one substantive sentence |
| `brandMentionCount` | int | Substantive mentions (absence sentences excluded) |
| `brandPosition` | int or null | Order of first appearance among brand + tracked competitors |
| `competitorMentions` | object | Mention count per competitor |
| `shareOfVoice` | float | brand ÷ (brand + competitors) for that answer |
| `citedDomains` | array | Domains linked or written out in the answer |
| `ownedDomainCited` | bool | Your domain is among `citedDomains` |
| `sentimentLabel` | string | Scored on the brand's own sentences only |
| `model`, `prompt`, `sample`, `observedAt` | — | So you can compare like with like over time |

## Pitfalls that flip the result

- **Absence counted as presence.** Models often echo your brand name while saying they don't recognise it. Count mentions per sentence and drop absence sentences. Otherwise an invisible brand shows up as "mentioned".
- **Borrowed sentiment.** If you score sentiment over the whole answer, praise for a competitor becomes praise for you. Score only the sentences that mention your brand.
- **Alias collisions.** Aliases that contain each other (a brand name and its domain, say) double-count the same mention. Keep aliases disjoint, and match on word boundaries so short names don't hit inside other words.
- **Reasoning models returning fragments.** Some models spend their token budget on hidden reasoning and return a short or empty `content`. OpenRouter accepts `"reasoning": {"enabled": false}` for models that allow it, but some endpoints require reasoning and will reject that. Check `finish_reason`, and treat an empty or cut-off answer as "no data", not as "not mentioned".
- **Citations outside URLs.** Model-knowledge answers often write "Notion (notion.so)" without `https://`. A URL-only extractor misses these, so add a bare-domain pass with a short list of allowed TLDs.
- **Web search changes both answers and cost.** Letting a model search the web gives you citations, but per-call cost varies widely between models. Measure a few calls on each model before you schedule hundreds.
- **Auth errors must stop the run.** A 401 or 403 affects every call. If you soft-fail it, you get a "successful" run full of empty rows.

## Do it without code

The free [LLM visibility query builder](https://datatooly.xyz/llm-visibility-monitor-tool/) takes a brand name, a market category and competitors, and generates a ready-to-run input with a fixed example of the output shape. It doesn't query any AI model from your browser. It's a query builder, and the fixed example isn't live data for your brand.

## At scale

[LLM Visibility Monitor on Apify](https://apify.com/constructive_calm/llm-visibility-monitor?fpr=v77kxu) runs this as a scheduled audit. It covers OpenAI, Anthropic Claude, Google Gemini, Perplexity and xAI Grok surfaces, labels each row by how the answer was produced (native search, OpenRouter web search, or model knowledge only), and can generate a buyer-intent prompt set from your market category. It applies the absence and brand-only sentiment rules above and writes a scorecard, competitor share of voice, citation opportunities, prompt gaps and an agency-style report to the run's key-value store. It has an optional demo mode that makes no LLM calls, supports your own OpenRouter key, and is free to start, then pay-as-you-go. Samples that come back empty or truncated aren't charged.

*Disclosure: I built the query builder and the actor. The script above works on its own with any OpenRouter key.*

## FAQ

### What is AI share of voice?

It's your brand's share of the brand mentions in AI answers for a defined set of prompts: your mentions divided by your mentions plus your tracked competitors' mentions. It's a relative measure. Adding or removing a competitor changes it.

### How do I track brand mentions in ChatGPT automatically?

Send a fixed prompt set to an OpenAI model through the API on a schedule, several samples per prompt, and store mention, position, citation and sentiment per answer. Compare runs over time instead of reading any single answer.

### Is the API answer the same as what users see in the ChatGPT app?

No. The app adds memory, personalization, location and experiments. API sampling gives you a repeatable baseline for trends and competitor comparison. It doesn't show you any individual user's screen.

### How many prompts and samples do I need?

Enough that one odd answer can't swing the result. Start with a small stable set of buyer-intent prompts and at least a few samples per model. Then keep the set fixed so changes over time reflect the models, not your prompt edits.

### Does this cover Google AI Overviews?

Not directly. AI Overviews live on Google's results page, and a plain HTTP request to google.com/search now gets a JavaScript-required page, not results. Querying a Gemini model gives you a signal about what Google's model says. It isn't the Overview itself.

### What's the difference between a mention and a citation?

A mention is your brand name in the answer text. A citation is your website linked or named as a source. Track them separately. You can be mentioned without being cited, and cited without being prominently mentioned.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
