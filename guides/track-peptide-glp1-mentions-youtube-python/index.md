# Track Peptide & GLP-1 Mentions on YouTube with Python (No API Key)

> Count YouTube videos mentioning semaglutide, tirzepatide or BPC-157 without an API key: parse ytInitialData, map brand names to compounds, export to CSV.

- URL: https://datatooly.xyz/guides/track-peptide-glp1-mentions-youtube-python/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Peptide & GLP-1 market intelligence](https://datatooly.xyz/peptide-market-intel-tool/)
- Tags: python, webscraping, youtube, datascience

You can track YouTube mentions of semaglutide, tirzepatide or BPC-157 without an API key. Fetch the search results page, parse the `ytInitialData` JSON embedded in the HTML, and match titles and snippets against an alias list that maps brands (Ozempic, Wegovy, Mounjaro, Zepbound) to the generic compound. Dedupe by video ID and log the counts daily.

This is market-research plumbing: it measures what people publish about these compounds. It says nothing about safety, efficacy or use, and nothing here is medical advice.

## Why YouTube, and what the source can't tell you

For consumer-demand signal on peptides and GLP-1 drugs, YouTube has two advantages. Its search pages are public, and every result carries a title, a snippet, a channel, a view count and a rough upload age. The official route is the YouTube Data API, which needs a Google Cloud key and has a daily quota. The approach below reads the same search page a browser loads.

Its limits are real, and they shape how you should use the numbers:

- **It is a sample, not a census.** Search results are ranked by relevance, so older popular videos dominate. You measure "share of what YouTube shows for this query", not every video ever posted.
- **Results vary between requests.** I ran the same three searches three times in a row on 29 September 2026 and got 45, 48 and 117 unique matching videos. Treat single runs as noisy and compare trends across many runs.
- **The page structure is undocumented.** `ytInitialData` has been stable for years, but YouTube can rename things at any time. Fail loudly when the parse finds nothing.

## Runnable Python

This script needs only `requests`. It searches three queries, keeps only videos whose title or snippet actually mentions a tracked compound, dedupes them, and writes a CSV.

```python
import json
import re
import csv
import time
import requests

# Canonical compound -> aliases. Brand names map to the generic ingredient.
VOCAB = {
    "semaglutide": ["semaglutide", "Ozempic", "Wegovy", "Rybelsus"],
    "tirzepatide": ["tirzepatide", "Mounjaro", "Zepbound"],
    "retatrutide": ["retatrutide"],
    "BPC-157": ["BPC-157", "BPC 157", "BPC157"],
    "TB-500": ["TB-500", "TB 500", "TB500"],
    "GHK-Cu": ["GHK-Cu", "GHK Cu"],
}

# One regex per compound; \b stops "sema" matching "semantic", and escaping
# keeps the hyphen in "BPC-157" literal.
PATTERNS = {
    canon: re.compile(r"\b(" + "|".join(re.escape(a) for a in aliases) + r")\b", re.I)
    for canon, aliases in VOCAB.items()
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def text_of(node) -> str:
    """YouTube text is either {'simpleText': ...} or {'runs': [{'text': ...}]}."""
    if not isinstance(node, dict):
        return ""
    if "simpleText" in node:
        return node["simpleText"]
    return "".join(r.get("text", "") for r in node.get("runs", []))


def video_renderers(node):
    """Walk ytInitialData and yield every videoRenderer, wherever it is nested."""
    if isinstance(node, dict):
        if "videoRenderer" in node:
            yield node["videoRenderer"]
        for v in node.values():
            yield from video_renderers(v)
    elif isinstance(node, list):
        for v in node:
            yield from video_renderers(v)


def search_youtube(query: str) -> list[dict]:
    html = requests.get(
        "https://www.youtube.com/results",
        params={"search_query": query},
        headers=HEADERS,
        timeout=30,
    ).text
    m = re.search(r'(?:var ytInitialData|window\["ytInitialData"\])\s*=\s*(\{.*?\});\s*</script>',
                  html, re.S)
    if not m:
        raise RuntimeError("ytInitialData not found (consent page or layout change?)")
    data = json.loads(m.group(1))

    rows = []
    for v in video_renderers(data):
        title = text_of(v.get("title"))
        snippet = text_of((v.get("detailedMetadataSnippets") or [{}])[0].get("snippetText"))
        haystack = f"{title} {snippet}"
        compounds = sorted(c for c, p in PATTERNS.items() if p.search(haystack))
        if not compounds:
            continue  # search results drift off-topic; keep only real matches
        rows.append({
            "query": query,
            "video_id": v["videoId"],
            "title": title,
            "channel": text_of(v.get("ownerText")),
            "published": text_of(v.get("publishedTimeText")),  # relative, e.g. "3 days ago"
            "views": text_of(v.get("viewCountText")),
            "compounds": "|".join(compounds),
            "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
    return rows


if __name__ == "__main__":
    seen, out = set(), []
    for q in ["semaglutide", "tirzepatide", "BPC-157 peptide"]:
        for row in search_youtube(q):
            if row["video_id"] not in seen:  # the same video surfaces for many queries
                seen.add(row["video_id"])
                out.append(row)
        time.sleep(2)  # be polite

    with open("peptide_mentions.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)

    counts = {}
    for r in out:
        for c in r["compounds"].split("|"):
            counts[c] = counts.get(c, 0) + 1
    print(len(out), "videos;", counts)
```

The output is one CSV row per unique video, and a video can count toward more than one compound (an "Ozempic vs Mounjaro" video counts for both). Run it on a schedule, append a date column, and plot the counts per compound over time. That trend line is the signal. Any single day's number is not.

## Output fields

| Column | Source in `videoRenderer` | Notes |
|---|---|---|
| `video_id` | `videoId` | Stable dedupe key across queries and days |
| `title` | `title.runs[].text` | Text can be `runs` or `simpleText`. `text_of()` handles both |
| `channel` | `ownerText` | Channel display name |
| `published` | `publishedTimeText` | Relative and coarse: `1y ago`, `2w ago`, `Streamed 2w ago` |
| `views` | `viewCountText` | A formatted string (`"129,025 views"`), not a number |
| `compounds` | your alias match | Canonical names joined with `\|` |
| `collected_at` | your clock | When you saw it. Keep it separate from `published` |

## Pitfalls

1. **Brand names hide the compound.** Ozempic, Wegovy and Rybelsus are all semaglutide, and Mounjaro and Zepbound are both tirzepatide. Count brands separately and you split one compound's signal across several labels. Resolve aliases to one canonical name first.
2. **Short slang is a false-positive trap.** Community shorthand like "sema", "tirz" or "reta" catches real mentions, but "sema" also matches unrelated things, such as the SEMA automotive trade show. The vocabulary above leaves slang out on purpose. If you add it, keep the `\b` word boundaries and spot-check the matches.
3. **Upload-date filters leak.** When I added YouTube's "this week" filter, results still included videos marked `4mo ago` and `6mo ago`, which come from recommendation shelves mixed into the page. If recency matters, filter on `published` yourself.
4. **`published` isn't a date.** "1y ago" can mean anything from 12 to 23 months. For exact dates, look the video IDs up through the official Data API, or use relative age only for coarse buckets.
5. **Don't record the collection time as the publish time.** It's an easy mistake when building a unified mention schema, and it makes every video look brand new. Keep `collected_at` and `published` in separate columns.
6. **Count unique videos, not rows.** The same video appears under several queries. Dedupe by `video_id` before you count, as the script does.

## Do it without code

The free [peptide market intelligence query builder](https://datatooly.xyz/peptide-market-intel-tool/) lets you pick sources, compound categories (GLP-1, healing, GH-GHRP and others) and an item limit. It then generates a ready-to-run input and shows a fixed example of the output shape. It is a query builder: it doesn't collect live mentions in your browser.

## At scale

The [Peptide Market Intelligence actor on Apify](https://apify.com/constructive_calm/peptide-market-intel?fpr=v77kxu) runs this kind of collection across YouTube and Amazon search results by default, with Reddit as an opt-in source. It resolves 30+ compounds and their aliases to canonical names, and it optionally adds AI-labelled sentiment, intent and vendor/brand mentions to each row. It also writes aggregate reports (top compounds, vendor leaderboard, sentiment by compound, plus week-over-week deltas when you reuse a named dataset). The first 10 chargeable events in each run are free, then it's pay-as-you-go. The same caveat applies to its output: it is public-conversation data for market research, not medical information.

*Disclosure: I built the query builder and the actor. The script above works on its own with no account.*

## FAQ

### Can I get YouTube search results without an API key?

Yes. The search results page embeds its data as JSON in a `ytInitialData` script variable, and parsing it gives you titles, channels, view counts and relative upload ages. The official YouTube Data API is the supported alternative, but it needs a Google Cloud key and has a daily quota.

### Why not use Reddit for peptide mentions?

Reddit has plenty of community discussion, but its unauthenticated JSON endpoints returned a redirect or a 403 with ordinary browser user agents in my tests on 29 September 2026. The reliable route is Reddit's official API with a registered OAuth app.

### How do I count semaglutide mentions when people say "Ozempic"?

Map every brand to its generic ingredient before counting: Ozempic, Wegovy and Rybelsus to semaglutide, and Mounjaro and Zepbound to tirzepatide. The `VOCAB` dictionary in the script does exactly this.

### Are mention counts a measure of market size?

No. They measure attention in public content, which reacts to news cycles and to how YouTube ranks results. They work best as a relative trend, comparing compounds against each other or the same compound over time, not as sales or usage figures.

### Is this data medical information?

No. It is a record of what people publish online. It shouldn't be used to judge safety, efficacy or dosing.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
