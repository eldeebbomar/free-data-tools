# Fantasy Premier League data & picks

> The Fantasy Premier League API is the set of public JSON endpoints under fantasy.premierleague.com/api/ (bootstrap-static for players, entry/{id}/event/{gw}/picks/ for a manager's squad). It has no CORS header, so browsers can't call it directly. This builder maps your inputs (mode, gameweek, top-N) to a ready-to-run query and previews the output shape; run it live on the actor.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Sports Analytics](https://datatooly.xyz/category/sports-analytics/)
- URL: https://datatooly.xyz/fpl-intelligence-tool/
- Backing Apify actor: [fpl-intelligence](https://apify.com/constructive_calm/fpl-intelligence?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)

Pick a mode and gameweek and preview the ranked captain, transfer and differential picks the actor computes from the official Fantasy Premier League API.

## Key takeaways

- The Fantasy Premier League API is a free, unofficial set of public JSON endpoints under fantasy.premierleague.com/api/ with no official documentation.
- The FPL API sends no Access-Control-Allow-Origin header, so direct browser fetch() calls are blocked by CORS and need a server or proxy.
- This page is a query builder: it maps your inputs to a ready-to-run config and shows a fixed example output shape, not live results.
- Common endpoints: bootstrap-static/ for all players and teams, and entry/{manager_id}/event/{event_id}/picks/ for a manager's gameweek squad.
- The backing Apify actor (constructive_calm/fpl-intelligence) runs the call server-side across modes like gameweek_picks and manager_dashboard.
- The actor is free to start, then pay-as-you-go via pay-per-event, with the first 10 chargeable events per run free.
- FPL's data is free for non-commercial use; check Premier League terms before any monetised project.

## How it works

### 1. Choose a mode

Pick what you want from the Fantasy Premier League API. The default mode is gameweek_picks (top captain, transfer, and differential candidates); manager_dashboard builds a specific manager's season view, combining picks, history, and transfers data keyed off entry/{manager_id}/.

### 2. Set the gameweek and parameters

Enter the gameweek number (event_id), for example 1, and set picksTopN (how many ranked rows to return, e.g. 20). For manager modes, also supply your manager ID found before '/history' in your FPL URL.

### 3. Build and preview the query

The builder assembles a ready-to-run config and shows a fixed example of the output shape, such as a captain_pick row with player, fixture, pickScore, and reasonTags. This is a preview, not live data, because the FPL API blocks browser CORS.

## How to use it

1. **Choose a mode** — Pick what you want from the Fantasy Premier League API. The default mode is gameweek_picks (top captain, transfer, and differential candidates); manager_dashboard builds a specific manager's season view, combining picks, history, and transfers data keyed off entry/{manager_id}/.
2. **Set the gameweek and parameters** — Enter the gameweek number (event_id), for example 1, and set picksTopN (how many ranked rows to return, e.g. 20). For manager modes, also supply your manager ID found before '/history' in your FPL URL.
3. **Build and preview the query** — The builder assembles a ready-to-run config and shows a fixed example of the output shape, such as a captain_pick row with player, fixture, pickScore, and reasonTags. This is a preview, not live data, because the FPL API blocks browser CORS.
4. **Copy the config** — Copy the generated JSON input. It is the exact input the backing actor expects, so there is no guesswork translating endpoints or query parameters yourself.
5. **Run it live on the actor** — Paste the config into the constructive_calm/fpl-intelligence actor on Apify and run it. The actor calls the FPL API server-side (avoiding CORS) and returns real rows. It is free to start, then pay-as-you-go.

## Example output

A fixed sample of the fields the fpl-intelligence actor returns — example data, not live results.

| player | type | rank | pickScore | reasonTags |
| --- | --- | --- | --- | --- |
| {"webName":"Vellano","team":{"shortName":"MCI"},"position":"FWD","cost":14.5,"selectedByPercent":58.2,"epNext":7.9} | captain_pick | 1 | 92.4 | ["good_form","easy_fixture","home_advantage","high_ep_next"] |
| {"webName":"Okafor","team":{"shortName":"LIV"},"position":"MID","cost":13,"selectedByPercent":41.7,"epNext":7.1} | captain_pick | 2 | 88.1 | ["good_form","set_piece_taker","xgi_leader","high_ep_next"] |
| {"webName":"Brennan","team":{"shortName":"ARS"},"position":"MID","cost":10,"selectedByPercent":29.5,"epNext":6.4} | captain_pick | 3 | 81.6 | ["easy_fixture","home_advantage","high_ep_next"] |
| {"webName":"Castellan","team":{"shortName":"CHE"},"position":"MID","cost":9.5,"selectedByPercent":18.3,"epNext":5.8} | captain_pick | 4 | 74.9 | ["set_piece_taker","xgi_leader"] |
| {"webName":"Lindqvist","team":{"shortName":"NEW"},"position":"FWD","cost":8.5,"selectedByPercent":6.1,"epNext":5.6} | captain_pick | 5 | 70.2 | ["easy_fixture","low_ownership"] |

## Ready-to-run actor input

```json
{
  "mode": "gameweek_picks",
  "picksTopN": 20
}
```

## Key facts

- The Fantasy Premier League API base URL is https://fantasy.premierleague.com/api/, with the bootstrap-static/ endpoint returning all players, teams, and gameweek summaries. (Source: Consistent with community FPL API guides and the backing actor's README.)
- The FPL API does not support CORS (no Access-Control-Allow-Origin header), so it cannot be called from a browser front end and must be reached server-side or via a proxy. (Source: Reported across community FPL API guides; consistent with MDN's CORS missing-allow-origin documentation.)
- A manager's gameweek squad comes from entry/{manager_id}/event/{event_id}/picks/, returning active_chip, automatic_subs, entry_history, and a picks array. (Source: Consistent with the live FPL API response shape and community FPL API guides.)
- There is no official documentation or a published list of FPL API endpoints; it is reverse-engineered and treated as unofficial. (Source: Noted across multiple community FPL API guides; the backing actor's README also flags it as not officially documented.)
- The backing Apify actor uses pay-per-event pricing. A typical weekly picks run lists at roughly six cents, but the actor's first 10 chargeable events per run are free, so a casual weekly run usually costs only the $0.01 run-start fee. (Source: From the actor's README (constructive_calm/fpl-intelligence); confirm current pricing before running.)

## FAQ

### Is there an official Fantasy Premier League API?

There are public JSON endpoints under https://fantasy.premierleague.com/api/, but no official documentation or supported, published list of them. The community treats it as an unofficial API: you can paste bootstrap-static/ into a browser address bar and get JSON back. Because it is undocumented, endpoints and response fields can change without notice, so build defensively and validate responses.

### Is the Fantasy Premier League API free to use?

The FPL endpoints themselves are free and require no API key for public data, but community guidance is that they are intended for non-commercial use only. If your project earns money, review the Premier League's terms first. Note that the backing Apify actor used here is free to start, then pay-as-you-go via pay-per-event, separate from the FPL API itself being free.

### Why can't I call the FPL API directly from my browser?

The Fantasy Premier League API does not return an Access-Control-Allow-Origin header, so browsers block cross-origin fetch() calls under the CORS policy. Server-to-server requests and mobile clients are not restricted by CORS, so the fix is to call FPL from a backend or proxy. That browser limitation is exactly why this page is a query builder, not a live fetcher.

### How do I get a manager's picks for a gameweek?

Use the endpoint https://fantasy.premierleague.com/api/entry/{manager_id}/event/{event_id}/picks/, where manager_id is the team ID and event_id is the gameweek number. It returns active_chip, automatic_subs, entry_history, and the picks array (each with element ID, captain/vice flags, and position). The backing actor's manager_dashboard mode goes further than this one endpoint: it combines picks with the manager's history, transfers, and live-points data to build a season view.

### How do I find my FPL manager ID?

Sign in at fantasy.premierleague.com, open 'Pick Team', then 'View Gameweek history'. Your manager ID is the number in the URL right before '/history'. You can also hit the authenticated /api/me/ endpoint and read the 'entry' field. That ID is what you plug into entry/{manager_id}/ endpoints to fetch picks, history, and transfers.

### What does the bootstrap-static endpoint return?

https://fantasy.premierleague.com/api/bootstrap-static/ is the summary endpoint: it returns every Premier League player (with points, price, status, ownership, and match stats), all teams, the list of gameweeks/events with summary stats like average and highest score, and the game's general settings. It's the usual starting point for any FPL data project before you query manager-specific endpoints.

### What is the difference between this builder and the Apify actor?

This page builds and previews a query: you choose a mode, gameweek, and top-N, and it shows a ready-to-run config plus a fixed example of the output shape. It does not return live data in your browser, because the FPL API blocks CORS. The backing Apify actor, constructive_calm/fpl-intelligence, actually runs the request server-side and returns real rows.

### How much does the backing FPL actor cost?

The Apify actor is free to start, then pay-as-you-go on a pay-per-event model. Per its README, events are priced individually (for example gameweek-picks-fetched and manager-dashboard-fetched). Its list price for a typical weekly picks run is about six cents, but the actor also gives the first 10 chargeable events per run free, so a casual weekly run usually costs only the $0.01 run-start fee. Confirm current pricing on the actor's Apify Store page before running.

### Can I get historical FPL seasons from the API?

The live FPL API mostly exposes the current season; deep historical data is not a single documented endpoint. The backing actor includes a historical_seasons mode covering past seasons (per its README, 2016-17 through the current season) for model training, pulled from a community GitHub archive rather than the live API and charged per season-gameweek pair. For the live API alone, you would archive bootstrap-static and picks data yourself each gameweek.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Understat xG stats](https://datatooly.xyz/understat-football-stats/)
- [Hacker News search](https://datatooly.xyz/hacker-news-search/)
- [App Store top charts](https://datatooly.xyz/app-store-top-charts/)
