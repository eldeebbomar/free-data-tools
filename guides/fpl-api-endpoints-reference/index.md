# FPL API Endpoints: Complete Reference for 2026/27

> Every public Fantasy Premier League API endpoint, checked live in 2026/27: bootstrap-static, fixtures, live, entry, picks, leagues, with key fields and errors.

- URL: https://datatooly.xyz/guides/fpl-api-endpoints-reference/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/)
- Tags: api, python, football, datascience

The Fantasy Premier League API is a free, keyless JSON API at `https://fantasy.premierleague.com/api/`. Its main endpoints are `bootstrap-static/` (all players, teams and gameweeks), `fixtures/`, `element-summary/{player_id}/`, `event/{gw}/live/`, `entry/{manager_id}/` with `/history/`, `/event/{gw}/picks/` and `/transfers/`, and `leagues-classic/{league_id}/standings/`. It has no official documentation and no CORS header.

The Premier League doesn't document this API, so this reference comes from live responses. I called every endpoint below on 2026-10-14, during the 2026/27 season, between gameweek 6 (finished) and gameweek 7 (deadline 2026-10-17 10:00 UTC). Each returned HTTP 200 unless marked otherwise.

## The endpoints at a glance

| Endpoint | Returns | Status on 2026-10-14 |
|---|---|---|
| `bootstrap-static/` | Every player, team and gameweek, plus game rules | 200, 1.7 MB |
| `fixtures/` | All 380 fixtures of the season | 200 |
| `fixtures/?event={gw}` | One gameweek's fixtures | 200 (10 for GW6) |
| `fixtures/?future=1` | Only fixtures not yet played | 200 (320) |
| `element-summary/{player_id}/` | One player's remaining fixtures, this season's matches, past seasons | 200; unknown ID: 404 |
| `event/{gw}/live/` | Every player's stats and points for a gameweek | 200; a future gameweek returns `{"elements":[]}` |
| `event-status/` | Whether bonus points are added and leagues updated | 200 |
| `dream-team/{gw}/` | The best XI of a gameweek | 200 |
| `entry/{manager_id}/` | A manager's profile, rank and leagues | 200; unknown ID: 404 |
| `entry/{manager_id}/history/` | Points and rank per gameweek, past seasons, chips used | 200 |
| `entry/{manager_id}/event/{gw}/picks/` | The 15 players picked in a gameweek, captain, chip, auto-subs | 200; a future gameweek: 404 |
| `entry/{manager_id}/transfers/` | Every transfer this season | 200 |
| `leagues-classic/{league_id}/standings/` | A classic league table, 50 per page | 200 |
| `team/set-piece-notes/` | Set-piece notes per team | 200 |
| `regions/` | Countries and regions for manager profiles | 200 (255) |
| `stats/most-valuable-teams/` | The 10 highest team values | 200 |
| `my-team/{manager_id}/` | Your own team before the deadline | 403 without login |
| `entry/{manager_id}/transfers-latest/` | Your latest transfers | 403 without login |

The paths end with a slash. Two paths that older tutorials mention, `set-piece-notes/` and `bootstrap-dynamic/`, returned 404 HTML pages. The base URL itself (`/api/`) also returns 404.

## Check them yourself

```python
import time

import requests

API = "https://fantasy.premierleague.com/api/"
s = requests.Session()
s.headers["User-Agent"] = "fpl-endpoint-check/1.0 (personal script)"


def get(path):
    r = s.get(API + path, timeout=30)
    return r.status_code, (r.json() if r.headers.get("content-type", "").startswith("application/json") else None)


_, boot = get("bootstrap-static/")
gw = next(e["id"] for e in boot["events"] if e["is_current"])          # latest started gameweek
player = max(boot["elements"], key=lambda p: p["total_points"])["id"]  # any player id works
_, overall = get("leagues-classic/314/standings/")                    # 314 = the Overall league
manager = overall["standings"]["results"][0]["entry"]                  # any manager id works

paths = [
    "bootstrap-static/",
    "fixtures/",
    f"fixtures/?event={gw}",
    f"element-summary/{player}/",
    f"event/{gw}/live/",
    "event-status/",
    f"dream-team/{gw}/",
    f"entry/{manager}/",
    f"entry/{manager}/history/",
    f"entry/{manager}/event/{gw}/picks/",
    f"entry/{manager}/transfers/",
    "leagues-classic/314/standings/?page_standings=2",
    "team/set-piece-notes/",
    "regions/",
    "stats/most-valuable-teams/",
    "my-team/1/",
]
for p in paths:
    status, body = get(p)
    shape = list(body)[:4] if isinstance(body, dict) else f"list of {len(body)}" if isinstance(body, list) else "-"
    print(f"{status}  {p:<45} {shape}")
    time.sleep(0.5)
```

Output on 2026-10-14:

```text
200  bootstrap-static/                             ['chips', 'events', 'game_settings', 'game_config']
200  fixtures/                                     list of 380
200  fixtures/?event=6                             list of 10
200  element-summary/115/                          ['fixtures', 'history', 'history_past']
200  event/6/live/                                 ['elements']
200  event-status/                                 ['status', 'leagues']
200  dream-team/6/                                 ['top_player', 'team']
200  entry/895045/                                 ['id', 'joined_time', 'started_event', 'favourite_team']
200  entry/895045/history/                         ['current', 'past', 'chips']
200  entry/895045/event/6/picks/                   ['active_chip', 'automatic_subs', 'entry_history', 'picks']
200  entry/895045/transfers/                       list of 36
200  leagues-classic/314/standings/?page_standings=2 ['league', 'standings', 'last_updated_data', 'new_entries']
200  team/set-piece-notes/                         ['last_updated', 'teams']
200  regions/                                      list of 255
200  stats/most-valuable-teams/                    list of 10
403  my-team/1/                                    ['detail']
```

## Key fields, endpoint by endpoint

### `bootstrap-static/`

Top-level keys: `events`, `game_settings`, `game_config`, `phases`, `teams`, `total_players`, `element_stats`, `element_types`, `elements`, `chips`. On 2026-10-14 it held 667 players, 20 teams, 38 gameweeks and `total_players: 11085989`.

| Array | Key fields |
|---|---|
| `elements` (players, 109 fields each) | `id`, `web_name`, `team`, `element_type` (1 GKP, 2 DEF, 3 MID, 4 FWD), `now_cost` (tenths of £m), `total_points`, `event_points`, `form`, `selected_by_percent`, `status`, `chance_of_playing_next_round`, `news`, `minutes`, `goals_scored`, `assists`, `expected_goals`, `expected_assists`, `defensive_contribution`, `ep_next`, `transfers_in_event`, `price_change_percent` |
| `teams` | `id`, `name`, `short_name`, `strength_overall_home`, `strength_overall_away`, `played`, `win`, `draw`, `loss`, `points`, `position` |
| `events` (gameweeks) | `id`, `name`, `deadline_time`, `is_previous`, `is_current`, `is_next`, `finished`, `data_checked`, `average_entry_score`, `highest_score`, `most_captained`, `top_element` |
| `element_types` | `squad_select` (2/5/5/3), `squad_min_play`, `squad_max_play` |
| `game_settings` | `squad_squadsize` (15), `squad_team_limit` (3 per club), `squad_total_spend` (1000 = £100.0m), `transfers_cap`, `max_extra_free_transfers` |

Several numbers arrive as strings: `form`, `selected_by_percent`, `expected_goals`, `price_change_percent`. Cast them before comparing. The response carried `cache-control: max-age=300`, so it changes at most every five minutes.

### `fixtures/`

Each fixture: `id`, `event` (gameweek), `kickoff_time`, `team_h`, `team_a`, `team_h_score`, `team_a_score`, `team_h_difficulty`, `team_a_difficulty`, `started`, `finished`, `minutes`, `stats`. For a finished match, `stats` lists `goals_scored`, `assists`, `own_goals`, `penalties_saved`, `penalties_missed`, `yellow_cards`, `red_cards`, `saves`, `bonus`, `bps` and `defensive_contribution`, each split into `h` and `a` with `{value, element}` pairs. Difficulty is covered in [FPL fixture difficulty from the API](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/).

### `element-summary/{player_id}/`

`fixtures` (remaining matches, with `difficulty` and `is_home` from that player's side), `history` (one row per match this season: `round`, `opponent_team`, `minutes`, `total_points`, `bps`, `expected_goals`, `value`, `selected`, `transfers_balance`, and more) and `history_past` (one row per earlier season: `season_name`, `start_cost`, `end_cost`, `total_points`, `minutes`).

### `event/{gw}/live/`

`elements` is a list of every player with `id`, `stats` (the same counters as above plus `total_points`, `in_dreamteam` and `played`) and `explain`, which breaks the points down per fixture: `{"identifier": "goals_scored", "points": 10, "value": 2}`. Pair it with a manager's picks to compute their score; see [FPL live gameweek points from the API](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/).

### `entry/{manager_id}/` and its sub-paths

| Endpoint | Key fields |
|---|---|
| `entry/{id}/` | `id`, `name` (team name), `started_event`, `summary_overall_points`, `summary_overall_rank`, `summary_event_points`, `current_event`, `last_deadline_value`, `last_deadline_bank`, `leagues` (`classic`, `h2h`, `cup`) |
| `entry/{id}/history/` | `current` (per gameweek: `points`, `total_points`, `overall_rank`, `bank`, `value`, `event_transfers`, `event_transfers_cost`, `points_on_bench`), `past` (`season_name`, `total_points`, `rank`), `chips` (`name`, `event`, `time`) |
| `entry/{id}/event/{gw}/picks/` | `picks` (15 rows: `element`, `position`, `multiplier`, `is_captain`, `is_vice_captain`), `active_chip`, `automatic_subs`, `entry_history` |
| `entry/{id}/transfers/` | `element_in`, `element_in_cost`, `element_out`, `element_out_cost`, `event`, `time` |

How to find a manager ID, and a full history script: [Find your FPL manager ID and pull your team history](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/).

### `leagues-classic/{league_id}/standings/`

`league` (`id`, `name`, ...), `standings` (`page`, `has_next`, `results`: `entry`, `entry_name`, `player_name`, `rank`, `last_rank`, `total`, `event_total`), `new_entries` and `last_updated_data`. Fifty rows per page; add `?page_standings=2` and keep going while `has_next` is `true`. League `314` is the Overall league.

### Small endpoints

- `event-status/` returned `{"status": [{"bonus_added": true, "date": "2026-10-10", "event": 6, "points": "r"}, ...], "leagues": "Updated"}`. Check `bonus_added` and `leagues` before you treat a gameweek's numbers as final.
- `dream-team/{gw}/` returns `top_player` (`id`, `points`) and `team` (11 rows of `element`, `points`, `position`).

## Errors

| Situation | Status | Body |
|---|---|---|
| Unknown manager | 404 | `{"detail":"No Entry matches the given query."}` |
| Unknown player | 404 | `{"detail":"No Element matches the given query."}` |
| Picks for a gameweek that hasn't started | 404 | `{"detail":"Not found."}` |
| Your own team without login | 403 | `{"detail":"Authentication credentials were not provided."}` |
| `me/` without login | 200 | `{"player":null,"watched":[]}` |

## Rules of the road

- **No browser calls.** The responses I checked (`bootstrap-static/`, `fixtures/`, `entry/{id}/`) carried no `Access-Control-Allow-Origin` header, so a web page can't `fetch()` them. Use a server, a script or a scheduled job.
- **No published rate limit.** FPL documents none. Cache `bootstrap-static/` (it's 1.7 MB and only changes every five minutes), pause between requests, and back off on errors. My scripts send a descriptive `User-Agent`; the API also answered without one.
- **The API only shows now.** It doesn't keep yesterday's prices, ownership or price-change progress. Save snapshots if you need history; for past seasons, the community vaastav/Fantasy-Premier-League archive on GitHub is the usual source.
- **Prices are in tenths.** `now_cost: 61` is £6.1m, and `squad_total_spend: 1000` is £100.0m.

## Related guides for this API

- [Find your FPL manager ID and pull your team history](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/).
- [FPL live gameweek points from the API](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/).
- [FPL fixture difficulty from the API](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/).
- [FPL API price change data in Python](https://datatooly.xyz/guides/fpl-api-price-change-data-python/), for the official price-change fields.

## Do it without code

The free [FPL query builder](https://datatooly.xyz/fpl-intelligence-tool/) lets you pick a mode (gameweek picks, mini-league intel, manager dashboard, price-change predictor and others), a gameweek and manager IDs, and gives you a ready-to-run input with a fixed example of the output. It's a query builder, not a live tool: because of the missing CORS header, it can't call the FPL API from your browser.

## At scale

The [FPL Intelligence actor](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) on Apify calls these endpoints server-side and turns them into ready answers: captain, transfer and differential picks, a wildcard optimizer, mini-league intel, a manager dashboard, live gameweek tracking, a price-change predictor, and past seasons from the vaastav archive. It exports JSON, CSV or Excel and runs on a schedule. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. Every endpoint above works without either.*

Sources: live responses from `fantasy.premierleague.com/api/` on 2026-10-14. FPL publishes no API documentation.

## Quick answers

### Is there an official Fantasy Premier League API?

There is a public, unauthenticated JSON API at `https://fantasy.premierleague.com/api/` that the FPL website itself uses, but the Premier League publishes no documentation for it. Everything known about it comes from reading its live responses. The base URL with no path returns 404, so start from `bootstrap-static/`.

### Is the FPL API free?

Yes. The public endpoints need no key, no account and no payment. Only endpoints about your own logged-in team, such as `my-team/{id}/`, need authentication; without it they return 403 with `Authentication credentials were not provided.`

### Can I call the FPL API from JavaScript in the browser?

Not directly. The responses carry no `Access-Control-Allow-Origin` header, so the browser blocks a cross-origin `fetch()`. Call the API from a server, a script, a serverless function or a scheduled job, and serve the result to your page.

### How do I build a fantasy platform using FPL data?

Load `bootstrap-static/` once (players, teams, gameweeks) and cache it, read `fixtures/` for the schedule and difficulty, `event/{gw}/live/` for points, and `entry/{id}/...` for managers' teams. Call everything server-side because there is no CORS header, store snapshots yourself (the API only shows the current state), and respect the 300-second cache on `bootstrap-static/`.

### What is league 314 in the FPL API?

League 314 is the Overall league, the global ranking of every FPL manager. `leagues-classic/314/standings/` returned it on 2026-10-14 with 50 managers per page; add `?page_standings=2` for the next page.

## Related guides

- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [FPL Fixture Difficulty (FDR) from the API in Python](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/)
- [FPL Live Gameweek Points from the API: Picks Math](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/)
- [Find Your FPL Manager ID and Pull Your Team History](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/)
- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
