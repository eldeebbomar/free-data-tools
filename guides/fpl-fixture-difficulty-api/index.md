# FPL Fixture Difficulty (FDR) from the API in Python

> Read FPL fixture difficulty from the free API: team_h_difficulty, team_a_difficulty, how they map to team strength, and a Python table of the next 5 gameweeks.

- URL: https://datatooly.xyz/guides/fpl-fixture-difficulty-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/)
- Tags: python, api, football, datascience

FPL fixture difficulty ratings are in `https://fantasy.premierleague.com/api/fixtures/`: every fixture carries `team_h_difficulty` and `team_a_difficulty` on a 1–5 scale, where higher is harder. Use `fixtures/?future=1` for upcoming matches only, and map team IDs to names with `bootstrap-static/` → `teams`. No key is needed, but there's no CORS header, so call it from a script.

Below: the fields, what the rating appears to be based on, and a Python script that prints every team's next five fixtures with difficulty, run on 2026-10-14 (2026/27 season, before gameweek 7).

## Where the ratings are

| Endpoint | Field | Point of view |
|---|---|---|
| `fixtures/` (add `?future=1` or `?event={gw}`) | `team_h_difficulty`, `team_a_difficulty` | Home side and away side |
| `element-summary/{player_id}/` → `fixtures` | `difficulty`, `is_home` | The player's team |
| `bootstrap-static/` → `teams` | `strength_overall_home`, `strength_overall_away` | The ratings the difficulties match (see below) |

A fixture row looks like this (gameweek 7, from the live API):

```json
{"id": 64, "event": 7, "kickoff_time": "2026-10-17T11:30:00Z", "team_h": 9, "team_a": 6,
 "team_h_difficulty": 4, "team_a_difficulty": 3, "finished": false, "started": false}
```

## Next five gameweeks, easiest first

```python
import requests

API = "https://fantasy.premierleague.com/api/"
s = requests.Session()
s.headers["User-Agent"] = "fpl-fdr/1.0 (personal script)"

boot = s.get(API + "bootstrap-static/", timeout=30).json()
teams = {t["id"]: t["short_name"] for t in boot["teams"]}
next_gw = next(e["id"] for e in boot["events"] if e["is_next"])
horizon = range(next_gw, next_gw + 5)                        # the next five gameweeks

fixtures = s.get(API + "fixtures/?future=1", timeout=30).json()

# One row per team: list of (gw, opponent, H/A, difficulty), from that team's point of view.
runs = {tid: [] for tid in teams}
for f in fixtures:
    if f["event"] not in horizon:                            # event is None for unscheduled games
        continue
    runs[f["team_h"]].append((f["event"], teams[f["team_a"]], "H", f["team_h_difficulty"]))
    runs[f["team_a"]].append((f["event"], teams[f["team_h"]], "A", f["team_a_difficulty"]))

table = []
for tid, games in runs.items():
    games.sort()
    total = sum(g[3] for g in games)
    # Blank gameweeks lower the sum, so rank on the average and show the game count.
    table.append((total / len(games) if games else 99, len(games), teams[tid],
                  "  ".join(f"{opp}({ha}){d}" for _, opp, ha, d in games)))

print(f"Fixture difficulty, GW{horizon.start}-GW{horizon.stop - 1} (easiest first)")
for avg, n, team, run in sorted(table):
    print(f"{team:<4} avg {avg:.1f} over {n}: {run}")

unscheduled = sum(1 for f in fixtures if f["event"] is None)
print(f"\nunscheduled future fixtures (event is null): {unscheduled}")
```

Output on 2026-10-14:

```text
Fixture difficulty, GW7-GW11 (easiest first)
COV  avg 2.6 over 5: TOT(A)3  FUL(H)2  SUN(H)3  EVE(A)3  CRY(H)2
MCI  avg 2.6 over 5: IPS(H)2  AVL(A)3  BHA(H)3  NFO(A)3  FUL(H)2
TOT  avg 2.6 over 5: COV(H)2  CHE(A)4  CRY(H)2  LEE(A)3  IPS(H)2
ARS  avg 3.0 over 5: NFO(A)3  EVE(H)3  LIV(A)4  HUL(H)2  NEW(A)3
BOU  avg 3.0 over 5: SUN(H)3  MUN(A)4  LEE(H)3  IPS(A)2  NFO(H)3
CHE  avg 3.0 over 5: EVE(A)3  TOT(H)2  MUN(H)4  SUN(A)3  LEE(H)3
FUL  avg 3.0 over 5: HUL(H)2  COV(A)2  AVL(A)3  NEW(H)3  MCI(A)5
SUN  avg 3.0 over 5: BOU(A)3  LEE(H)3  COV(A)2  CHE(H)4  AVL(A)3
AVL  avg 3.2 over 5: NEW(A)3  MCI(H)4  FUL(H)2  MUN(A)4  SUN(H)3
BHA  avg 3.2 over 5: CRY(H)2  LIV(A)4  MCI(A)5  BRE(H)3  HUL(A)2
BRE  avg 3.2 over 5: LIV(H)4  HUL(A)2  NFO(H)3  BHA(A)4  EVE(H)3
CRY  avg 3.2 over 5: BHA(A)4  NEW(H)3  TOT(A)3  LIV(H)4  COV(A)2
HUL  avg 3.2 over 5: FUL(A)3  BRE(H)3  IPS(H)2  ARS(A)5  BHA(H)3
IPS  avg 3.2 over 5: MCI(A)5  NFO(H)3  HUL(A)2  BOU(H)3  TOT(A)3
LEE  avg 3.2 over 5: MUN(H)4  SUN(A)3  BOU(A)3  TOT(H)2  CHE(A)4
NEW  avg 3.2 over 5: AVL(H)3  CRY(A)3  EVE(H)3  FUL(A)3  ARS(H)4
NFO  avg 3.2 over 5: ARS(H)4  IPS(A)2  BRE(A)3  MCI(H)4  BOU(A)3
EVE  avg 3.4 over 5: CHE(H)4  ARS(A)5  NEW(A)3  COV(H)2  BRE(A)3
LIV  avg 3.4 over 5: BRE(A)3  BHA(H)3  ARS(H)4  CRY(A)3  MUN(H)4
MUN  avg 3.4 over 5: LEE(A)3  BOU(H)3  CHE(A)4  AVL(H)3  LIV(A)4

unscheduled future fixtures (event is null): 0
```

As a cross-check, `element-summary/101/` (a Chelsea player) listed EVE (A) 3, TOT (H) 2, MUN (H) 4, SUN (A) 3 and LEE (H) 3 for gameweeks 7 to 11, the same as the CHE row.

## What the rating is based on

FPL doesn't document the formula. The data shows a simple relationship, at least in 2026/27:

```python
from collections import Counter

import requests

API = "https://fantasy.premierleague.com/api/"
h = {"User-Agent": "fpl-fdr/1.0 (personal script)"}
teams = {t["id"]: t for t in requests.get(API + "bootstrap-static/", headers=h, timeout=30).json()["teams"]}
fixtures = requests.get(API + "fixtures/", headers=h, timeout=30).json()

print("difficulty values:", sorted(Counter(
    d for f in fixtures for d in (f["team_h_difficulty"], f["team_a_difficulty"])).items()))
print("home side's difficulty == away team's strength_overall_home:",
      sum(f["team_h_difficulty"] == teams[f["team_a"]]["strength_overall_home"] for f in fixtures), "of", len(fixtures))
print("away side's difficulty == home team's strength_overall_away:",
      sum(f["team_a_difficulty"] == teams[f["team_h"]]["strength_overall_away"] for f in fixtures), "of", len(fixtures))
ars = next(t for t in teams.values() if t["short_name"] == "ARS")
print("ARS:", {k: ars[k] for k in ("strength", "strength_overall_home", "strength_overall_away",
                                   "strength_attack_home", "strength_defence_away")})
```

```text
difficulty values: [(2, 171), (3, 380), (4, 171), (5, 38)]
home side's difficulty == away team's strength_overall_home: 380 of 380
away side's difficulty == home team's strength_overall_away: 380 of 380
ARS: {'strength': None, 'strength_overall_home': 4, 'strength_overall_away': 5, 'strength_attack_home': 0, 'strength_defence_away': 0}
```

What that means:

- **Each team has two ratings, and they describe the team as an opponent.** Arsenal's `strength_overall_home` is 4 and `strength_overall_away` is 5. Hosting Arsenal is rated 4; visiting Arsenal is rated 5. The field names read as if they described Arsenal's own home and away strength, but the fixtures say otherwise.
- **The rating doesn't change with form within a fixture list.** It's a lookup per opponent and venue, so two teams playing the same opponent at the same venue get the same number. FPL may update the ratings during a season, so re-read `fixtures/` rather than caching it for months.
- **This season uses 2 to 5.** No fixture was rated 1 on 2026-10-14.
- **Some team fields are empty.** `strength` was `null` and the `strength_attack_*` / `strength_defence_*` fields were 0 for every team, so build nothing on them this season.

## Pitfalls

- **Blank and double gameweeks.** A team with no match in a gameweek contributes nothing to the sum, which makes its run look easier. The script averages over games played and shows the count. A double gameweek adds a sixth fixture to the five-week window; that's two chances to score, not a harder run.
- **`event: null`.** Postponed or unscheduled fixtures have no gameweek. The script skips them and counts them at the end.
- **Difficulty isn't attack and defence.** A defender cares about the opponent's attack, a forward about its defence. FPL's single number blends both. For something sharper, combine fixtures with expected goals from `element-summary` history or another source.
- **No CORS.** Server-side only.

## Related guides for this API

- [FPL API endpoints: complete reference](https://datatooly.xyz/guides/fpl-api-endpoints-reference/).
- [FPL live gameweek points from the API](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/).
- [Find your FPL manager ID and pull your team history](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/).
- [FPL API price change data in Python](https://datatooly.xyz/guides/fpl-api-price-change-data-python/).

## Do it without code

The free [FPL query builder](https://datatooly.xyz/fpl-intelligence-tool/) builds a ready-to-run input for the gameweek-picks mode, which weighs upcoming fixtures, and shows a fixed example of the output shape. It doesn't fetch live FPL data in your browser.

## At scale

The [FPL Intelligence actor](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) on Apify uses these difficulty ratings in its `gameweek_picks` mode, with a configurable fixture look-ahead (`picksFixtureLookahead`), to rank captain, transfer-in, differential and sell candidates. It also runs a wildcard optimizer and mini-league and live-gameweek modes, and exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The scripts above need neither.*

Sources: live responses from `fantasy.premierleague.com/api/` on 2026-10-14. FPL publishes no API documentation or difficulty formula.

## Quick answers

### Where is fixture difficulty in the FPL API?

In `https://fantasy.premierleague.com/api/fixtures/`. Each fixture has `team_h_difficulty` (how hard the match is for the home team) and `team_a_difficulty` (for the away team), on FPL's 1 to 5 scale. `element-summary/{player_id}/` repeats it from one player's side as `difficulty`, alongside `is_home`.

### How is FPL fixture difficulty calculated?

FPL doesn't publish a formula. In the 2026/27 data, every fixture's difficulty equalled the opponent's `strength_overall_home` (when you play at home) or `strength_overall_away` (when you play away) from `bootstrap-static/` → `teams`: 380 of 380 fixtures for both sides on 2026-10-14. So it's a fixed rating per opponent and venue, not a model of form.

### How do I get only upcoming FPL fixtures?

Call `fixtures/?future=1`; on 2026-10-14 it returned the 320 fixtures not yet played. Use `fixtures/?event=7` for one gameweek. A fixture with `event: null` hasn't been given a gameweek yet.

## Related guides

- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [FPL API Endpoints: Complete Reference for 2026/27](https://datatooly.xyz/guides/fpl-api-endpoints-reference/)
- [FPL Live Gameweek Points from the API: Picks Math](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/)
- [Find Your FPL Manager ID and Pull Your Team History](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/)
- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
