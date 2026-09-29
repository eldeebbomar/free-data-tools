# Understat xG football analytics — export

> Understat xG data is expected-goals football analytics — xG, xA, npxG, xGChain and xGBuildup for players, teams and individual shots across the top six European leagues since 2014/15. This tool builds a ready-to-run query and previews the exact output shape; you run it live on the backing Apify actor (free to start, then pay-as-you-go) to export the rows.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Sports Analytics](https://datatooly.xyz/category/sports-analytics/)
- URL: https://datatooly.xyz/understat-football-stats/
- Backing Apify actor: [understat-football-analytics](https://apify.com/constructive_calm/understat-football-analytics?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/)

Pick a mode, league and season and preview the Understat xG data the actor exports: xG, xA, npxG and goals per player, team, match or shot.

## Key takeaways

- This is a query builder: pick a mode, leagues and seasons, preview the output shape, then run it live on the Apify actor to get real rows — it does not fetch live data in your browser.
- Understat covers six leagues — EPL, La Liga, Bundesliga, Serie A, Ligue 1 and the Russian Premier League (RFPL) — with data going back to the 2014/15 season.
- Player rows expose the full Understat model: xG, xA, npxG (non-penalty xG), xGChain and xGBuildup, plus minutes, goals and assists.
- Understat has no official public API and serves data as JSON embedded in <script> tags with no CORS header — that is exactly why a builder + server-side actor is needed instead of a live browser fetch.
- The backing Apify actor is free to start, then pay-as-you-go; it also supports team, match and shot-level modes beyond the default league_players preview.
- Understat's xG model is more lenient than StatsBomb/FBref because it ignores defensive pressure, so don't mix sources within one analysis.

## How it works

### 1. Pick a mode

Choose what you want to export. The default is league_players (one row per player per season); the actor also supports league_teams, league_matches, match_shots, team_situations, player_career and fixtures.

### 2. Set leagues and seasons

Add one or more leagues (e.g. EPL, La_liga, Bundesliga, Serie_A, Ligue_1, RFPL) and seasons by start year — "2025" is the 2025/26 season. Set maxResults to cap how many rows you pull.

### 3. Preview the output shape

The builder shows a fixed example of the JSON columns you'll receive — xG, xA, npxG, xGChain, xGBuildup and the conventional stats — so you can confirm the schema before spending anything.

## How to use it

1. **Pick a mode** — Choose what you want to export. The default is league_players (one row per player per season); the actor also supports league_teams, league_matches, match_shots, team_situations, player_career and fixtures.
2. **Set leagues and seasons** — Add one or more leagues (e.g. EPL, La_liga, Bundesliga, Serie_A, Ligue_1, RFPL) and seasons by start year — "2025" is the 2025/26 season. Set maxResults to cap how many rows you pull.
3. **Preview the output shape** — The builder shows a fixed example of the JSON columns you'll receive — xG, xA, npxG, xGChain, xGBuildup and the conventional stats — so you can confirm the schema before spending anything.
4. **Run it live on the actor** — Send the generated query to the backing Apify actor (understat-football-analytics). It scrapes Understat server-side and returns the real rows. It's free to start, then pay-as-you-go.
5. **Export to JSON or CSV** — Pull the finished dataset from the Apify run as JSON or CSV and load it into pandas, a spreadsheet, or your model. Attribute Understat as the source and keep usage non-commercial unless you've checked their terms.

## Example output

A fixed sample of the fields the understat-football-analytics actor returns — example data, not live results.

| name | team | xG | goals | xA |
| --- | --- | --- | --- | --- |
| Luca Vellano | Manchester City | 24.6 | 27 | 4.1 |
| Daniel Okafor | Liverpool | 18.2 | 19 | 10.3 |
| Samuel Brennan | Arsenal | 10.8 | 12 | 8.7 |
| Tomas Lindqvist | Newcastle United | 16.8 | 21 | 2.2 |
| Rafael Castellan | Chelsea | 11.9 | 14 | 7.4 |

## Ready-to-run actor input

```json
{
  "mode": "league_players",
  "leagues": [
    "EPL"
  ],
  "seasons": [
    "2025"
  ],
  "maxResults": 50
}
```

## Key facts

- Understat covers six leagues — EPL, La Liga, Bundesliga, Serie A, Ligue 1 and the Russian Premier League — with data from the 2014/15 season onward. (Source: Verified via Understat.com league pages and corroborating coverage articles (search May 2026).)
- Understat's xG model is trained on over 100,000 shots and accounts for shot distance, angle, body part and assist type. (Source: Reported across multiple xG-explainer sources; figure is Understat's own commonly cited training-set size, not independently audited here.)
- Understat's xG differs from StatsBomb/FBref by roughly 3% at match level and 5–10% on individual shots, partly because Understat ignores defensive pressure. (Source: Per a 2024 cross-provider predictive-power comparison and an xG-website comparison (cited in research); approximate figures.)
- Understat has no official public API and embeds its data as JSON inside <script> tags, with no cross-origin (CORS) header. (Source: Confirmed by community scraper libraries (understatapi, worldfootballR) and the JSON.parse extraction pattern; basis for this page being a builder.)
- The backing Apify actor is free to start, then pay-as-you-go, with the first batch of chargeable events per run free and a per-run cost cap. (Source: From the actor's Apify Store page, understat-football-analytics by constructive_calm (May 2026).)

## FAQ

### What is Understat xG data?

Understat xG data is expected-goals analytics for football, where xG assigns every shot a scoring probability from 0 to 1 based on factors like distance, angle and body part. Understat publishes player, team, match and shot-level xG for the top European leagues. Alongside raw xG it exposes xA (expected assists), npxG (non-penalty xG), xGChain and xGBuildup, letting you judge chance quality rather than just goals scored.

### Does Understat have an official API?

No. Understat does not publish an official public API. The site is server-rendered HTML and embeds its statistics as JSON inside <script> tags (parsed via JSON.parse). Community libraries like understatapi (Python) and worldfootballR (R) scrape that embedded JSON, and Apify actors do the same server-side. Because the page sends no cross-origin (CORS) header, a browser tool cannot fetch it directly — which is why this page is a query builder, not a live fetcher.

### Which leagues and seasons does Understat cover?

Understat covers six competitions: the English Premier League (EPL), Spanish La Liga, German Bundesliga, Italian Serie A, French Ligue 1 and the Russian Premier League (RFPL). Coverage runs from the 2014/15 season through the current campaign. In this builder you supply seasons by their start year — for example "2025" means the 2025/26 season and "2014" the 2014/15 season.

### What does this tool actually do?

It builds a ready-to-run query and shows you a fixed example of the output shape — it does not return live Understat results in your browser. You choose a mode (such as league_players), leagues, seasons and a result cap, preview the JSON columns you'll get back, then run that query live on the backing Apify actor, which scrapes Understat server-side and returns the real rows for export to JSON or CSV.

### How much does the backing Apify actor cost?

The backing actor, understat-football-analytics by Omar Eldeeb (Apify handle constructive_calm), is free to start, then pay-as-you-go on a pay-per-event basis. The first batch of chargeable events per run is free, and there is a per-run cost cap to prevent accidental overages. Pricing scales with how many rows or shots you export. Check the actor's Store page for the current per-event rates before a large run.

### What fields are in a league_players row?

A player-season row includes the full Understat model: xG, xA (expected assists), npxG (non-penalty xG), xGChain and xGBuildup, alongside conventional stats like minutes played, goals, assists, shots, key passes, appearances, position and yellow/red cards. xGChain and xGBuildup credit a player for the value of possessions they were involved in, with xGBuildup excluding the shot and key pass to isolate buildup contribution.

### How is Understat xG different from FBref or StatsBomb?

They use different models. FBref uses StatsBomb data, which factors in defensive pressure and the number of defenders between the shooter and goal — inputs Understat's model ignores. As a result Understat tends to be slightly more lenient, assigning marginally higher xG to the same shot. Differences are roughly 3% at the match level and 5–10% on individual shots, so stick to one source within a single analysis rather than mixing them.

### Is it legal to scrape Understat data?

Understat's support has previously stated its data is free for non-commercial use with attribution, though that stance can change and is not a license. Responsible access means using only publicly available pages, respecting rate limits and not bypassing any authentication. The backing actor throttles shot-level requests to be polite to Understat's servers. For commercial use, review Understat's terms and consider a licensed provider; this builder does not grant you any rights to the data.

### What is xGChain and xGBuildup?

Both are possession-value metrics in Understat's model. xGChain sums the xG of every possession a player was involved in — any pass, dribble or shot that ended in a chance counts toward their total. xGBuildup is the same idea but strips out the shot and the final key pass, isolating a player's contribution to building the move rather than finishing it. They help surface deep-lying playmakers and progressors who don't show up in goals-and-assists tables.

### Can I get shot-level xG and pitch coordinates?

Yes — the backing actor supports a match_shots mode that returns shot-level data: normalized x/y pitch coordinates, the xG model value for each shot, the situation (open play, set piece, penalty), body part, result, and the score at the moment of the shot, plus derived distance and angle. This is the data behind Understat's shot maps. This page's default preview uses league_players, but you can switch modes in the builder.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
- [Hacker News search](https://datatooly.xyz/hacker-news-search/)
- [App Store top charts](https://datatooly.xyz/app-store-top-charts/)
