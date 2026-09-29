# FPL API Price Change Data in Python: The Official 2026/27 Fields

> Read FPL's own price-change predictions from the free bootstrap-static API in Python: price_change_percent, projections, likelihood, and the ±100 rule.

- URL: https://datatooly.xyz/guides/fpl-api-price-change-data-python/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/)
- Tags: python, api, football, datascience

Since 2026/27, the free Fantasy Premier League API includes its own price-change predictions. Each player in `bootstrap-static` carries `price_change_percent` (progress toward a rise or fall) and `price_change_projections` (projected progress at the next three updates, with a -5 to +5 likelihood). No API key is needed. A projection past ±100 means FPL expects a price move at the next update.

Most FPL price-change tutorials still teach the old approach: estimate a player's "net transfer rate" and compare it to thresholds the community reverse-engineered. You no longer have to guess. The numbers the official Price Change Predictor page shows come from the same JSON feed you can already fetch.

## Where the data lives, and its limits

Everything is in one request: `https://fantasy.premierleague.com/api/bootstrap-static/`. It returns every player (`elements`), all 20 teams, the 38 gameweeks (`events`), and game settings. When I fetched it on 29 September 2026 it held 667 players, and every one of them carried these five fields:

- `price_change_percent`
- `price_change_hourly_rate`
- `price_change_projections`
- `price_change_locked_until`
- `price_change_calibrating`

Know the limits before you build on it:

- **FPL does not document these fields.** The Premier League's announcement explains the tool in plain English: "Anything over 100 per cent will indicate that the player is expected to surpass the threshold for an increase or decrease." Changes happen at 00:00 UK time, the predictor page refreshes every 15 minutes, and a player can move by up to £0.3m in a gameweek. Everything else about the field shapes comes from reading the live JSON.
- **It is a guide, not a guarantee.** The Premier League says so directly: late selling can pull a player back under the threshold before midnight.
- **Your browser can't call it directly.** The response has no `Access-Control-Allow-Origin` header, so client-side `fetch()` is blocked by CORS. Call it from a script, a server, or a scheduled job.
- **It only shows today.** The API has no endpoint for yesterday's progress. If you want history (for example, to check how accurate the projections are), you have to save it yourself every day.

## Runnable Python: tonight's projected risers and fallers

This script needs `requests` and `pandas`. It lists every player projected at or past ±100 at the next update, and it appends a dated snapshot of all players to a CSV ledger.

```python
import os
from datetime import datetime, timezone

import pandas as pd
import requests

URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

boot = requests.get(URL, headers={"User-Agent": "fpl-price-log/1.0"}, timeout=30).json()
teams = {t["id"]: t["short_name"] for t in boot["teams"]}
positions = {p["id"]: p["singular_name_short"] for p in boot["element_types"]}


def projection(el, offset):
    """projected_percent for a given offset (0 = next update), as a float."""
    for p in el.get("price_change_projections") or []:
        if p["offset"] == offset:
            return float(p["projected_percent"]), p["likelihood"]
    return None, None


rows = []
for el in boot["elements"]:
    next_pct, next_lik = projection(el, 0)
    rows.append({
        "id": el["id"],
        "player": el["web_name"],
        "team": teams[el["team"]],
        "pos": positions[el["element_type"]],
        "price": el["now_cost"] / 10,                         # now_cost is in tenths of £m
        "owned_pct": float(el["selected_by_percent"]),        # a string in the JSON
        "progress_pct": float(el["price_change_percent"]),    # also a string
        "next_update_pct": next_pct,
        "likelihood": next_lik,                               # integer, -5 .. +5
        "locked_until": el["price_change_locked_until"],
        "calibrating": el["price_change_calibrating"],
        "net_transfers_gw": el["transfers_in_event"] - el["transfers_out_event"],
    })

df = pd.DataFrame(rows)
risers = df[df.next_update_pct >= 100].sort_values("next_update_pct", ascending=False)
fallers = df[df.next_update_pct <= -100].sort_values("next_update_pct")

cols = ["player", "team", "pos", "price", "progress_pct", "next_update_pct", "likelihood"]
print("Projected to RISE at the next update:\n", risers[cols].to_string(index=False))
print("\nProjected to FALL at the next update:\n", fallers[cols].to_string(index=False))

# The API only ever shows *today*. Append a dated snapshot so you can score
# yesterday's projections against today's prices later.
df.insert(0, "snapshot_utc", datetime.now(timezone.utc).isoformat(timespec="seconds"))
ledger = "fpl_price_ledger.csv"
df.to_csv(ledger, mode="a", index=False, header=not os.path.exists(ledger))
```

I ran this against the live API on 29 September 2026. It returned one projected faller and no risers, and it wrote 667 rows to the ledger. On a quiet day, empty tables are normal.

Schedule the script to run once a day, after the midnight update. Within a week the ledger lets you answer the question that matters: when FPL projected ≥100, did the price actually move? You can check this by comparing `now_cost` between consecutive snapshots.

## Field reference

| Field | Type in JSON | What it holds |
|---|---|---|
| `price_change_percent` | string, e.g. `"98.0"` | Current progress toward a change. Positive values point toward a rise, negative toward a fall. |
| `price_change_projections` | array of 3 objects | `{offset, projected_percent, likelihood}` for offsets 0, 1 and 2. From the live values, these appear to be the next three nightly updates. `projected_percent` is a string. |
| `likelihood` (inside projections) | integer, -5 to +5 | A banded confidence. In my snapshot, ±5 matched projections past ±100 and ±4 matched values just short of the line. |
| `price_change_hourly_rate` | number | How fast the counter is moving. The units aren't documented. I wouldn't build on it. |
| `price_change_locked_until` | ISO timestamp or `null` | Set for only a handful of players (8 of 667 in my snapshot). The name suggests that player's price can't change before that time. |
| `price_change_calibrating` | boolean | `true` while FPL is still calibrating a player. Don't trust projections while it's true. |
| `now_cost` | integer | Price in tenths of £m (`61` = £6.1m). |
| `cost_change_event` / `cost_change_start` | integer | How much the price has changed this gameweek and since the season started, in tenths. Use these to confirm that a projected change actually happened. |

## Pitfalls that will bite you

1. **Some numbers arrive as strings.** `price_change_percent`, `projected_percent`, `selected_by_percent`, `form` and `expected_goals` are all JSON strings. If you compare `"98.0" >= 100` in JavaScript, you get string coercion instead of a numeric comparison. Cast every one of them.
2. **"UK midnight" isn't a fixed UTC time.** It is 23:00 UTC during British Summer Time and 00:00 UTC in winter. If you schedule in UTC, pick a time that is safely after both, such as 01:30 UTC.
3. **Reaching 100 doesn't guarantee a change.** A projection of 100.3 two nights out (`offset: 2`) can still fall back if managers stop buying. Treat `offset: 0` as the actionable number.
4. **Early in the season the feed isn't ready.** The Premier League says the predicted-progress figure appears only after a calibration period of at least one gameweek. Check `price_change_calibrating` before you act on any projection.
5. **Responses are cached.** The endpoint returned `cache-control: max-age=300` when I tested it, so polling faster than every five minutes gives you the same data.
6. **Snapshots can't be backfilled.** If your job misses a day, that day is gone.

## The old way still has a use

Before this feed existed, predictors divided net transfers by ownership and compared the result to community-derived thresholds. That approach is still useful as a cross-check: `net_transfers_gw` is already in the script above. Keep in mind that the thresholds are approximations, not FPL's formula.

## Do it without code

If you want an FPL query without writing Python, the free [FPL query builder](https://datatooly.xyz/fpl-intelligence-tool/) lets you pick a mode (gameweek picks, mini-league intel, manager dashboard, price-change predictor) and a gameweek. It then generates a ready-to-run input and shows a fixed example of the output shape. It is a query builder: it does not fetch live FPL data in your browser, because of the CORS restriction described above.

## At scale

The [FPL Intelligence actor on Apify](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) runs these calls server-side on a schedule, with no CORS problems and no cron job to maintain. It covers captain and transfer picks, a wildcard optimizer, mini-league differentials, manager dashboards, live gameweek tracking, and historical seasons from the community vaastav archive. One thing to know: its `price_change_predictor` mode uses the net-transfer heuristic, not the official fields in this guide, so treat it as a second opinion next to FPL's own projection. Pricing is pay-per-event: the first 10 chargeable events in each run are free, then it's pay-as-you-go.

*Disclosure: I built the query builder and the actor. The Python above works on its own without either of them.*

## FAQ

### Does the FPL API have official price change predictions?

Yes, since the 2026/27 season. Each player in `bootstrap-static` has `price_change_percent` and a three-entry `price_change_projections` array. FPL doesn't document the fields, but they back the official Price Change Predictor, and the Premier League's explanation says values over 100% signal an expected change.

### What does 100% mean in FPL price changes?

The Premier League says anything over 100% indicates the player is expected to cross the rise or fall threshold at the next update, which happens at 00:00 UK time. Negative values work the same way for falls. It is not a guarantee: late transfers can pull the number back.

### Do I need an API key or login?

No. `bootstrap-static` is public and unauthenticated. You do need to call it from a script or server rather than browser JavaScript, because the response has no CORS header.

### Can I get historical FPL price change progress?

Not from the API. It reports only the current state. Save a snapshot on a schedule, as the script's ledger does. For past seasons' prices, weekly per-player data (including `value`) exists in the community vaastav/Fantasy-Premier-League archive on GitHub.

### Why are all the price change fields zero or calibrating?

Early in a season FPL needs a calibration period of at least one gameweek before it shows predicted progress. Check `price_change_calibrating` and wait for it to turn false before trusting projections.

## Related guides

- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
