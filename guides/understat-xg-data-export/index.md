# Understat xG Data Export: Pull Expected Goals with Python + CSV

> A practical guide to Understat xG data export: how the data is embedded in the page, a Python scraper that decodes it, and league and player xG to CSV.

- URL: https://datatooly.xyz/guides/understat-xg-data-export/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-30
- Updated: 2026-06-30
- Free tool: [Understat xG football analytics — export](https://datatooly.xyz/understat-football-stats/)
- Tags: python, datascience, api, football

If you've searched for an **Understat xG data export** and come up empty, here's the honest truth up front: Understat does not publish an official public API. There's no documented REST endpoint, no API key, no `/v1/xg` route. But the expected-goals data is absolutely reachable programmatically — it's sitting right inside the HTML of every page, and once you know the trick, exporting it to CSV is a dozen lines of Python.

This post walks through exactly how Understat ships its data, the one decoding gotcha that trips most people up, and a runnable scraper that gets you league, player, and match xG into a clean DataFrame you can write straight to CSV.

## Where the xG data actually lives

Understat ([understat.com](https://understat.com)) covers six leagues — the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, and the Russian Premier League — for every season since 2014/15. When you open a page like `https://understat.com/league/EPL/2023`, the tables you see (xG, xGA, shots, points) are **not** rendered server-side as HTML rows. The page ships a near-empty table and a block of JavaScript that builds it client-side.

If you view source and search for `xG`, you'll find something like this inside a `<script>` tag:

```js
var teamsData = JSON.parse('\x7B\x221\x22\x3A\x7B\x22id\x22\x3A\x221\x22...');
```

That's the whole game. The data is a JSON string passed to `JSON.parse()`, but every character has been escaped into `\xNN` hex sequences (and some `\uNNNN` unicode escapes). A naive `json.loads()` on that raw string will fail because Python sees literal backslash-x sequences, not the characters they represent.

Which variable holds what:

- **`/league/<LEAGUE>/<SEASON>`** — `datesData` (every fixture with team-level xG), `teamsData` (season table with xG/xGA/npxG/PPDA), and `playersData` (per-player xG, xA, shots, key passes).
- **`/player/<PLAYER_ID>`** — that player's match-by-match and grouped shot/xG data.
- **`/match/<MATCH_ID>`** — `shotsData` (every shot with xG, x/y coordinates, situation, result) plus `rostersData`.

So once you can decode one variable, you can decode all of them. The only thing that changes is the URL and the variable name.

## The decode that everyone gets wrong

The reliable pattern, confirmed across multiple community scrapers, is:

1. Find the `<script>` tag containing your target variable.
2. Slice out the string between `('` and `')`.
3. Turn the `\x` escapes back into real characters with `.encode("utf-8").decode("unicode_escape")`.
4. Parse the result with `json.loads()`.

That `decode("unicode_escape")` step is the key line. It converts `\x7B` into `{`, `\x22` into `"`, and so on, leaving you with a normal JSON string. One gotcha worth knowing up front: `unicode_escape` decodes those bytes as latin-1, so accented player names (Ødegaard, Sané) come out as mojibake unless you re-encode to latin-1 and decode as UTF-8 — the scraper below does exactly that.

## A runnable Python scraper

Here's a self-contained script that pulls the season player table for a league and writes it to CSV. It only needs `requests`, `beautifulsoup4`, and `pandas`.

```python
import json
import re
import requests
from bs4 import BeautifulSoup
import pandas as pd

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; xg-export/1.0)"}

def get_understat_var(url: str, var_name: str):
    """Pull one JSON variable (e.g. 'playersData') out of an Understat page."""
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    for script in soup.find_all("script"):
        text = script.string or ""
        if var_name in text:
            # Grab the string passed to JSON.parse('...')
            start = text.index("('") + 2
            end = text.index("')", start)
            raw = text[start:end]
            # Turn \x7B etc. back into real characters, then parse.
            # NOTE: unicode_escape decodes bytes as latin-1, which mangles
            # accented names (Ødegaard, Sané). Re-encode latin-1 -> decode utf-8 to fix it.
            decoded = raw.encode("utf-8").decode("unicode_escape").encode("latin-1").decode("utf-8")
            return json.loads(decoded)
    raise ValueError(f"{var_name} not found at {url}")

def league_players(league: str, season: int) -> pd.DataFrame:
    url = f"https://understat.com/league/{league}/{season}"
    data = get_understat_var(url, "playersData")
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = league_players("EPL", 2023)
    # Keep the columns most people want for an xG export
    cols = ["player_name", "team_title", "games", "time",
            "goals", "xG", "assists", "xA", "shots", "key_passes",
            "npg", "npxG"]
    df = df[cols]
    # Numeric fields arrive as strings — cast the xG ones
    for c in ["xG", "xA", "npxG"]:
        df[c] = pd.to_numeric(df[c])
    df.sort_values("xG", ascending=False, inplace=True)
    df.to_csv("epl_2023_xg.csv", index=False)
    print(df.head(10).to_string(index=False))
```

Run it and you get `epl_2023_xg.csv` — your **Understat xG data export to CSV**, sorted by expected goals, ready for a notebook or a spreadsheet.

A few notes that save debugging time:

- The numeric fields (`xG`, `xA`, `shots`) come back as **strings**, not numbers. Cast them before you do math, as the script does.
- For **shot-level data**, hit a match page and pull `shotsData`: `get_understat_var("https://understat.com/match/26618", "shotsData")`. Each shot carries `xG`, pitch coordinates `X`/`Y`, `situation`, `shotType`, and `result` — everything you need for a shot map.
- Be polite: add a delay between requests if you loop over a whole season, and cache responses so you're not re-hitting the site during development.

## Doing it in JavaScript

Same idea in Node — with one catch: `JSON.parse` itself **rejects** `\x` escapes (JSON only permits `\uNNNN`), so you can't just feed it the raw body. Convert the `\xNN` byte escapes to real bytes first, then decode them as UTF-8 (this also handles accented names correctly):

```js
const res = await fetch("https://understat.com/league/EPL/2023");
const html = await res.text();
const match = html.match(/var\s+playersData\s*=\s*JSON\.parse\('(.+?)'\)/s);
// \xNN escapes are raw UTF-8 bytes -> rebuild the byte array, then decode UTF-8
const bytes = Uint8Array.from(
  match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))),
  (c) => c.charCodeAt(0)
);
const players = JSON.parse(new TextDecoder("utf-8").decode(bytes));
console.log(players[0].player_name, players[0].xG);
```

The double `JSON.parse` looks odd but is deliberate: the inner one turns the `\x`-escaped body into a clean JSON string, the outer one parses that JSON.

## When the DIY route stops being worth it

Scraping one league-season is easy. Scraping *every* shot from *every* match across *six leagues and ten seasons* is a different job — you're into rate limits, retries, schema drift, and de-duplication. At that point the script above becomes a small maintenance project.

If you'd rather skip that, two things I built can help. The first is a free **[Understat query builder](https://datatooly.xyz/understat-football-stats/)** — you pick a league and season and it shows you the exact field shape you'll get back, so you can plan your export without reading raw HTML. (It assembles and previews the request; it doesn't scrape live in the browser.) The second, for production-scale pulls, is the **[Understat Football Analytics actor](https://apify.com/constructive_calm/understat-football-analytics?fpr=v77kxu)** on Apify, which handles the league/player/match extraction and returns structured rows you can export to CSV, JSON, or Excel. It's free to start, then pay-as-you-go.

Disclosure: I built both of those tools, so treat that last paragraph as the author's pitch — the scraping method above stands entirely on its own and is everything you need to export Understat xG data yourself.

## Wrapping up

There's no official Understat API, but there doesn't need to be. The xG, xA, and shot data is embedded as an escaped JSON string in each page; decode the `\x` escapes with `unicode_escape`, run `json.loads`, and you have clean structured data. Point the same helper at `/league`, `/player`, or `/match` URLs and you've covered league tables, player seasons, and shot maps — all exportable to CSV in a few lines.

## Related guides

- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
