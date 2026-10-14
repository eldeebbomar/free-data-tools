# Find Your FPL Manager ID and Pull Your Team History

> Where to find your Fantasy Premier League manager (team) ID, then pull every gameweek, chip, transfer and past season for it from the free FPL API in Python.

- URL: https://datatooly.xyz/guides/fpl-manager-id-team-history-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/)
- Tags: python, api, football, datascience

Your FPL manager ID is the number after `/entry/` in the address bar when you open the Points tab on the Fantasy Premier League website, for example `/entry/1234567/event/6`. With it, `https://fantasy.premierleague.com/api/entry/{id}/history/` returns your points, rank, bank and team value for every gameweek, the chips you've used and your past seasons. No login or key is needed.

This guide shows where the ID is, how to find someone else's, and a Python script that pulls a whole season's history, run against the live API on 2026-10-14 (2026/27 season, after gameweek 6).

## Where to find the ID

| Where | What to look for |
|---|---|
| Points tab, on the website | The URL reads `.../entry/{manager_id}/event/{gw}` |
| A league table, through the API | Each standings row's `entry` field (see below) |
| The My Team page | Not here: its URL has no ID |

Don't mix it up with a **league ID**, which appears in `/leagues/{league_id}/standings/c` URLs and goes into `leagues-classic/{league_id}/standings/`.

### Someone else's ID

There is no "search by name" endpoint. Find them in a league you share instead:

```python
import requests

r = requests.get("https://fantasy.premierleague.com/api/leagues-classic/314/standings/",
                 headers={"User-Agent": "fpl-history/1.0"}, timeout=30).json()
for row in r["standings"]["results"][:3]:
    print(row["rank"], row["entry"], row["total"])
```

```text
1 895045 545
2 4182037 532
3 6313482 531
```

That was the top of the Overall league on 2026-10-14: rank, manager ID, total points. Each row has `entry` (the manager ID), `entry_name` (team name), `player_name`, `rank` and `total`. Swap `314` (the Overall league) for your mini-league's ID and page through with `?page_standings=2`, `3` and so on while `has_next` is `true`.

## Pull a season's history

```python
import csv
import sys
import time

import requests

API = "https://fantasy.premierleague.com/api/"
s = requests.Session()
s.headers["User-Agent"] = "fpl-history/1.0 (personal script)"


def get(path, attempts=4):
    for i in range(attempts):
        r = s.get(API + path, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code == 404:
            raise SystemExit(f"{path}: {r.json().get('detail')}")  # wrong ID: retrying won't help
        time.sleep(2 ** i)
    r.raise_for_status()


manager_id = int(sys.argv[1])
entry = get(f"entry/{manager_id}/")
hist = get(f"entry/{manager_id}/history/")
transfers = get(f"entry/{manager_id}/transfers/")
names = {p["id"]: p["web_name"] for p in get("bootstrap-static/")["elements"]}

print(f"Manager {manager_id}: started GW{entry['started_event']}, "
      f"{entry['summary_overall_points']} pts, overall rank {entry['summary_overall_rank']:,}")
print(f"Classic leagues: {len(entry['leagues']['classic'])}")

print("\nGW  pts  hit  bench  overall rank   value  bank")
for gw in hist["current"]:
    print(f"{gw['event']:>2} {gw['points']:>4} {-gw['event_transfers_cost']:>4} "
          f"{gw['points_on_bench']:>6} {gw['overall_rank']:>13,} "
          f"{gw['value'] / 10:>6.1f} {gw['bank'] / 10:>5.1f}")

print("\nChips:", ", ".join(f"{c['name']} (GW{c['event']})" for c in hist["chips"]) or "none")
print("Past seasons:", ", ".join(f"{p['season_name']}: {p['total_points']} pts, rank {p['rank']:,}"
                                 for p in hist["past"][-3:]) or "none")

last = transfers[0] if transfers else None  # newest first
if last:
    print(f"\n{len(transfers)} transfers; latest GW{last['event']}: "
          f"{names[last['element_out']]} (£{last['element_out_cost'] / 10}m) -> "
          f"{names[last['element_in']]} (£{last['element_in_cost'] / 10}m)")

with open(f"fpl_{manager_id}_history.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=hist["current"][0].keys())
    w.writeheader()
    w.writerows(hist["current"])
print(f"wrote fpl_{manager_id}_history.csv")
```

`python fpl_history.py 1` on 2026-10-14 (manager ID 1, chosen only because it's easy to remember):

```text
Manager 1: started GW1, 394 pts, overall rank 1,922,103
Classic leagues: 24

GW  pts  hit  bench  overall rank   value  bank
 1   41    0      4     6,875,541  100.0   0.0
 2  121    0      0       912,695  100.1   0.0
 3   36    0      7     2,523,055  100.7   0.0
 4   82    0      7     1,917,475  101.2   0.0
 5   55    0     11     1,514,974  101.5   0.0
 6   59    0      6     1,922,109  101.6   0.1

Chips: bboost (GW2), wildcard (GW3), freehit (GW5)
Past seasons: 2023/24: 2708 pts, rank 19, 2024/25: 2502 pts, rank 120,612, 2025/26: 2419 pts, rank 4,119

43 transfers; latest GW6: Wissa (£6.1m) -> Gonzalo (£6.0m)
wrote fpl_1_history.csv
```

A wrong ID stops the script with the API's message: `entry/999999999/: No Entry matches the given query.`

## What each field means

### `entry/{id}/history/` → `current` (one row per gameweek)

| Field | Meaning |
|---|---|
| `event` | Gameweek number |
| `points` | Points scored that gameweek, **before** the transfer hit |
| `event_transfers`, `event_transfers_cost` | Transfers made and points deducted for them |
| `total_points` | Season total after the hit: for one manager, 409 + 100 − 4 = 505 |
| `overall_rank`, `rank` | Overall rank after the gameweek, and rank for that gameweek alone |
| `percentile_rank` | Gameweek percentile band |
| `value`, `bank` | Team value and money in the bank, in tenths of £m |
| `points_on_bench` | Points left on the bench |

`past` lists earlier seasons (`season_name`, `total_points`, `rank`), and `chips` lists each chip played (`name`: `bboost`, `3xc`, `wildcard`, `freehit`; `event`; `time`).

### `entry/{id}/`

`summary_overall_points`, `summary_overall_rank`, `summary_event_points`, `current_event`, `started_event`, `last_deadline_value`, `last_deadline_bank`, `name` (the team name), `player_first_name`, `player_last_name`, and `leagues` with `classic`, `h2h` and `cup` arrays. Each classic league carries `id`, `name`, `entry_rank` and `entry_last_rank`, which is how you list a manager's mini-leagues.

### `entry/{id}/transfers/`

One row per transfer: `element_in`, `element_in_cost`, `element_out`, `element_out_cost`, `event` and `time`, newest first. Player IDs map to names through `bootstrap-static/` → `elements`.

## Pitfalls

- **`points` doesn't include the hit.** Subtract `event_transfers_cost` for the net score, or use the difference in `total_points`.
- **The two rank fields can disagree slightly.** `entry/1/` said overall rank 1,922,103 while the last `history` row said 1,922,109. They appear to be updated at different moments; use one source consistently.
- **The ID belongs to this season's team.** FPL creates your team fresh each season. Manager ID 1 above joined on 2026-07-23 but still lists ten past seasons under `past`, because FPL links them for you. Old IDs in your scripts may point at last season's team.
- **Prices are in tenths.** `value: 1016` is £101.6m.
- **Server-side only.** The API sends no CORS header, so this doesn't work from browser JavaScript.
- **Names are personal data.** Manager names are visible to anyone on FPL, but if you publish a table, consider showing team names or IDs only.

## Related guides for this API

- [FPL API endpoints: complete reference](https://datatooly.xyz/guides/fpl-api-endpoints-reference/).
- [FPL live gameweek points from the API](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/), which uses the picks endpoint for one gameweek.
- [FPL fixture difficulty from the API](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/).
- [FPL API price change data in Python](https://datatooly.xyz/guides/fpl-api-price-change-data-python/).

## Do it without code

The free [FPL query builder](https://datatooly.xyz/fpl-intelligence-tool/) has a manager-dashboard mode: enter one or more manager IDs and a gameweek and it gives you a ready-to-run input, with a fixed example of the output shape. It doesn't fetch live FPL data in your browser, because the API blocks cross-origin requests.

## At scale

The [FPL Intelligence actor](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) on Apify has a `manager_dashboard` mode that takes manager IDs and returns the season trajectory, chip usage, best and worst captains and per-transfer gains and losses. It also has `mini_league_intel` for whole leagues and `live_tracker` for live gameweeks. It exports JSON, CSV or Excel and runs on a schedule. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The script above needs neither.*

Sources: live responses from `fantasy.premierleague.com/api/` on 2026-10-14 (FPL publishes no API documentation); the Points-page URL pattern is the one FPL's own site uses.

## Quick answers

### How do I find my FPL manager ID?

Log in at `fantasy.premierleague.com` and open the Points tab. The address bar shows `/entry/1234567/event/6`: the number after `/entry/` is your manager ID (also called team ID or entry ID). The My Team page doesn't show it.

### What is a manager ID in FPL?

It's the number FPL gives your team, used in every manager endpoint of the API: `entry/{id}/`, `entry/{id}/history/`, `entry/{id}/event/{gw}/picks/` and `entry/{id}/transfers/`. It's different from a league ID, which appears in `/leagues/{id}/standings/` URLs.

### Can I find someone's FPL ID by their name?

The API has no search by name. Find the manager in a league they play in: `leagues-classic/{league_id}/standings/` lists each row's `entry` (the manager ID), `entry_name` and `player_name`, 50 per page.

### Does my FPL team ID change every season?

FPL creates your team fresh each season, and the history endpoint links your earlier seasons to it. In the 2026/27 data, manager ID 1 had a `joined_time` of 2026-07-23 yet listed 10 past seasons under `history.past`. Look up your ID again at the start of each season rather than reusing last year's.

## Related guides

- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [FPL API Endpoints: Complete Reference for 2026/27](https://datatooly.xyz/guides/fpl-api-endpoints-reference/)
- [FPL Fixture Difficulty (FDR) from the API in Python](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/)
- [FPL Live Gameweek Points from the API: Picks Math](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/)
- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
