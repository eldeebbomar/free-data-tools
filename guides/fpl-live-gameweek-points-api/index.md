# FPL Live Gameweek Points from the API: Picks Math

> Compute any FPL team's gameweek score from event/{gw}/live and picks: multipliers, captaincy, chips, hits and auto-subs. Python checked against 300 teams.

- URL: https://datatooly.xyz/guides/fpl-live-gameweek-points-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/)
- Tags: python, api, football, datascience

A Fantasy Premier League team's gameweek score is each picked player's `total_points` from `https://fantasy.premierleague.com/api/event/{gw}/live/`, multiplied by the pick's `multiplier` from `entry/{manager_id}/event/{gw}/picks/`, summed, minus `event_transfers_cost`. Multipliers are 0 for the bench, 1 for starters, 2 for the captain and 3 for a triple captain. Auto-subs and vice-captaincy change them.

The Python below rebuilds the score from those two endpoints, including automatic substitutions and the captain falling back to the vice-captain. I checked it against FPL's own numbers for 300 team-gameweeks on 2026-10-14 (gameweeks 4 to 6 of 2026/27, 100 managers from four depths of the Overall league): all 300 matched, including 91 automatic substitutions.

## The two endpoints

**`event/{gw}/live/`** returns `elements`, one row per player:

| Field | Meaning |
|---|---|
| `id` | Player ID (matches `bootstrap-static/` → `elements[].id`) |
| `stats.total_points` | Points this gameweek so far |
| `stats.minutes`, `goals_scored`, `assists`, `clean_sheets`, `bonus`, `bps`, `saves`, `defensive_contribution`, `expected_goals`... | The counters behind the points |
| `explain` | Points broken down per fixture, e.g. `{"identifier": "goals_scored", "points": 10, "value": 2}` |

**`entry/{manager_id}/event/{gw}/picks/`** returns:

| Field | Meaning |
|---|---|
| `picks` | 15 rows: `element`, `position` (1–11 starters, 12–15 bench in priority order), `multiplier`, `is_captain`, `is_vice_captain`, `element_type` |
| `active_chip` | `null`, `bboost`, `3xc`, `freehit` or `wildcard` |
| `automatic_subs` | `[{element_in, element_out, event}]` once FPL has processed them |
| `entry_history` | `points` (before the hit), `event_transfers_cost`, `total_points`, `points_on_bench`, `rank`, `overall_rank`, `bank`, `value` |

For a gameweek that hasn't started, `event/{gw}/live/` returns `{"elements":[]}` and the picks endpoint returns 404 `{"detail":"Not found."}`.

## The simple version: after a gameweek

Once a gameweek is over, FPL has already applied auto-subs and captaincy to the picks, so the sum is direct:

```text
score = sum(live[p.element].total_points * p.multiplier for p in picks) - event_transfers_cost
```

For manager 895045 in gameweek 6 that gives 77, and `entry_history.points` is 77. `points_on_bench` (6) is the sum for the four `multiplier: 0` players.

## The full version: projecting the rules yourself

During a gameweek you want the score as it stands, with the substitutions that will happen. This script works from the lineup set at the deadline. For a finished gameweek it first swaps FPL's processed auto-subs back out, which is what makes it testable against FPL's numbers.

```python
import sys
import time

import requests

API = "https://fantasy.premierleague.com/api/"
s = requests.Session()
s.headers["User-Agent"] = "fpl-live-points/1.0 (personal script)"


def get(path, attempts=4):
    for i in range(attempts):
        r = s.get(API + path, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code == 404:
            raise LookupError(f"{path}: {r.json().get('detail')}")
        time.sleep(2 ** i)  # 429 / 5xx: back off 1, 2, 4 s
    r.raise_for_status()


boot = get("bootstrap-static/")
PLAYER = {p["id"]: p for p in boot["elements"]}
MIN_PLAY = {t["id"]: t["squad_min_play"] for t in boot["element_types"]}  # 1 GKP, 3 DEF, 2 MID, 1 FWD
MAX_PLAY = {t["id"]: t["squad_max_play"] for t in boot["element_types"]}


def deadline_lineup(picks, auto_subs):
    """After a gameweek, FPL's picks already have the auto-subs swapped in.
    Swap them back to get the 15 players in the order the manager set."""
    by_el = {p["element"]: dict(p) for p in picks}
    for sub in auto_subs:
        a, b = by_el[sub["element_in"]], by_el[sub["element_out"]]
        a["position"], b["position"] = b["position"], a["position"]
    return sorted(by_el.values(), key=lambda p: p["position"])


def gameweek_points(manager_id, gw):
    live = {e["id"]: e["stats"] for e in get(f"event/{gw}/live/")["elements"]}
    fixtures = get(f"fixtures/?event={gw}")
    picks = get(f"entry/{manager_id}/event/{gw}/picks/")
    chip = picks["active_chip"]

    # A player "didn't play" only once all of their team's matches this gameweek are over.
    done = {}
    for f in fixtures:
        for team in (f["team_h"], f["team_a"]):
            done[team] = done.get(team, True) and f["finished_provisional"]
    mins = lambda el: live.get(el, {}).get("minutes", 0)
    gw_over = all(f["finished_provisional"] for f in fixtures)  # also covers teams with no match (blank)
    out_for_good = lambda el: mins(el) == 0 and done.get(PLAYER[el]["team"], gw_over)
    pos = lambda el: PLAYER[el]["element_type"]

    order = deadline_lineup(picks["picks"], picks["automatic_subs"])
    xi = [p["element"] for p in order[:11]]
    bench = [p["element"] for p in order[11:]]

    subs = []
    if chip != "bboost":
        for out in list(xi):
            if not out_for_good(out):
                continue
            for cand in bench:  # bench order = substitution priority
                if mins(cand) == 0 or (pos(out) == 1) != (pos(cand) == 1):
                    continue
                trial = [cand if e == out else e for e in xi]
                counts = {t: sum(pos(e) == t for e in trial) for t in MIN_PLAY}
                if all(MIN_PLAY[t] <= counts[t] <= MAX_PLAY[t] for t in MIN_PLAY):
                    xi = trial
                    bench.remove(cand)
                    subs.append((cand, out))
                    break

    mult = {el: 1 for el in xi + (bench if chip == "bboost" else [])}
    cap = next(p["element"] for p in order if p["is_captain"])
    vice = next(p["element"] for p in order if p["is_vice_captain"])
    armband = cap if not out_for_good(cap) else vice if not out_for_good(vice) else None
    if armband in mult:
        mult[armband] = 3 if chip == "3xc" else 2

    gross = sum(live.get(el, {}).get("total_points", 0) * m for el, m in mult.items())
    hit = picks["entry_history"]["event_transfers_cost"]
    return {"chip": chip, "subs": subs, "mult": mult, "live": live, "gross": gross,
            "hit": hit, "net": gross - hit, "fpl_points": picks["entry_history"]["points"]}


if __name__ == "__main__":
    manager_id, gw = int(sys.argv[1]), int(sys.argv[2])
    r = gameweek_points(manager_id, gw)
    for el, m in r["mult"].items():
        tag = {2: " (C)", 3: " (TC)"}.get(m, "")
        print(f"  {PLAYER[el]['web_name']:<14} {r['live'][el]['total_points']:>3} x{m}{tag}")
    for cand, out in r["subs"]:
        print(f"  auto-sub: {PLAYER[cand]['web_name']} in for {PLAYER[out]['web_name']}")
    print(f"chip={r['chip']}  gross={r['gross']}  hit=-{r['hit']}  net={r['net']}  "
          f"(FPL's own gameweek points: {r['fpl_points']})")
```

`python fpl_live_points.py 895045 6` (the Overall league leader on 2026-10-14):

```text
  Raya             3 x1
  Gabriel          2 x1
  De Cuyper       15 x1
  Hall             0 x1
  O'Shea          11 x1
  Rogers           9 x1
  Palmer           8 x2 (C)
  Schade           1 x1
  João Pedro      12 x1
  Haaland          6 x1
  Wissa            2 x1
  auto-sub: O'Shea in for Szoboszlai
chip=None  gross=77  hit=-0  net=77  (FPL's own gameweek points: 77)
```

Szoboszlai started but played 0 minutes, so the first eligible bench player, O'Shea (11 points), came in. Two more cases from the same run:

```text
$ python fpl_live_points.py 895045 3 | tail -1
chip=3xc  gross=90  hit=-0  net=90  (FPL's own gameweek points: 90)
$ python fpl_live_points.py 2098553 6 | tail -1
chip=None  gross=100  hit=-4  net=96  (FPL's own gameweek points: 100)
```

The second shows that `entry_history.points` is the score before the hit: that manager's `total_points` went from 409 to 505, which is 100 − 4 added.

## The rules the script applies

| Rule | In the code |
|---|---|
| A starter who plays 0 minutes, once their team's matches are over, is replaced by the first bench player who played | `out_for_good`, bench loop in position order |
| Goalkeepers only swap with goalkeepers | `(pos(out) == 1) != (pos(cand) == 1)` |
| The XI must stay a legal formation: at least 1 GK, 3 DEF, 2 MID, 1 FWD | `squad_min_play` / `squad_max_play` from `bootstrap-static/` → `element_types` |
| If the captain doesn't play, the vice-captain's points are doubled; if neither plays, nobody's are | `armband` |
| Triple Captain triples instead of doubles | `3 if chip == "3xc"` |
| Bench Boost counts all 15 players and makes no substitutions | `chip != "bboost"` |
| Transfer hits are taken off the total | `event_transfers_cost` |

The Premier League describes the vice-captain rule in its [postponements explainer](https://www.premierleague.com/news/1609337). The formation limits come from the API's own `element_types`.

**One known difference.** When two starters are both replaced, the script can pair them with the bench players differently than FPL records in `automatic_subs`. The same players end up in the XI, so the score is the same. That happened once in the 300 checks. In one Bench Boost gameweek FPL also recorded an entry in `automatic_subs` (the script records none); with all 15 players counting, the score was the same either way. The other 298 matched FPL's substitutions exactly.

## Using it during a live gameweek

All 300 checks were on finished gameweeks. On 2026-10-14 no gameweek was in progress (gameweek 7's deadline is 2026-10-17 10:00 UTC), so the live behaviour below is how the code is designed to work, not something I tested:

- A starter whose match hasn't kicked off isn't substituted yet, because `out_for_good` waits for `finished_provisional` on all of that team's fixtures.
- A bench player whose match hasn't started can't come on yet (`mins(cand) == 0`), so the projection can change as matches finish.
- `total_points` changes during matches. Bonus points are added later: check `event-status/` for `"bonus_added": true` on each day before treating a score as final.
- `event/{gw}/live/` has no published cache rule. Polling it every minute or two is plenty; matches don't change faster than that.

## Pitfalls

- **Points before the hit.** Compare like with like: `entry_history.points` against `gross`, `net` against FPL's displayed net score.
- **Free Hit and Wildcard don't change the maths.** They change the squad, and the picks endpoint already returns the squad used that gameweek.
- **Double gameweeks.** A player with two fixtures has one `total_points` covering both. `explain` lists them per fixture.
- **No CORS.** The API can't be called from browser JavaScript; run this as a script or on a server.

## Related guides for this API

- [FPL API endpoints: complete reference](https://datatooly.xyz/guides/fpl-api-endpoints-reference/).
- [Find your FPL manager ID and pull your team history](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/).
- [FPL fixture difficulty from the API](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/).
- [FPL API price change data in Python](https://datatooly.xyz/guides/fpl-api-price-change-data-python/).

## Do it without code

The free [FPL query builder](https://datatooly.xyz/fpl-intelligence-tool/) builds a ready-to-run input for gameweek picks, mini-league intel, manager dashboards and more, and shows a fixed example of the output shape. It doesn't fetch live points in your browser; the API blocks that.

## At scale

The [FPL Intelligence actor](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) on Apify has a `live_tracker` mode that takes a gameweek plus manager or league IDs and returns live points per manager and live standings per league, as a single snapshot or refreshed on an interval. Other modes cover captain and transfer picks, a wildcard optimizer, mini-league intel and manager dashboards. It exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The script above needs neither.*

Sources: live responses from `fantasy.premierleague.com/api/` on 2026-10-14 (FPL publishes no API documentation), and the Premier League's article [How postponements affect FPL managers](https://www.premierleague.com/news/1609337).

## Quick answers

### How do I get live FPL points from the API?

Fetch `https://fantasy.premierleague.com/api/event/{gw}/live/` for every player's `stats.total_points` that gameweek, then `entry/{manager_id}/event/{gw}/picks/` for the manager's 15 picks. Multiply each player's points by the pick's `multiplier` (0 bench, 1 starter, 2 captain, 3 triple captain), add them up, and subtract `entry_history.event_transfers_cost`.

### What does multiplier mean in the FPL picks endpoint?

It's how many times the player's points count: 0 on the bench, 1 in the starting XI, 2 for the captain and 3 for a triple captain. With Bench Boost active, bench players get 1. After a gameweek, multipliers already reflect auto-subs and a vice-captain taking over.

### Does FPL entry_history points include the transfer hit?

No. `entry_history.points` is the gameweek score before the hit, and `event_transfers_cost` is the deduction. For one manager in GW6 of 2026/27, `points` was 100, the cost was 4, and `total_points` rose from 409 to 505.

### What does event/{gw}/live return for a gameweek that hasn't started?

`{"elements":[]}`, an empty list, with HTTP 200. The picks endpoint for that gameweek returned 404 with `{"detail":"Not found."}` (tested on gameweek 7, three days before its deadline).

## Related guides

- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [FPL API Endpoints: Complete Reference for 2026/27](https://datatooly.xyz/guides/fpl-api-endpoints-reference/)
- [FPL Fixture Difficulty (FDR) from the API in Python](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/)
- [Find Your FPL Manager ID and Pull Your Team History](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/)
- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
