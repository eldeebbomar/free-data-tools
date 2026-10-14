# Football & sports analytics data tools

> Two football data sources live here. Fantasy Premier League publishes public JSON endpoints for players, fixtures and managers' squads, but sends no CORS header, so browsers cannot call them directly. Understat publishes expected-goals analytics (xG, xA, npxG and more) for the top European leagues since 2014/15, embedded in its pages rather than offered as an API. Both tools are query builders: each assembles a ready-to-run configuration and previews a fixed example of the output. The actual export runs on the backing Apify actor.

- URL: https://datatooly.xyz/category/sports-analytics/
- Tools: 2 (0 live, 2 query builders)
- Updated: 2026-10-14

## Tools

- [Fantasy Premier League data & picks](https://datatooly.xyz/fpl-intelligence-tool/) (query builder): The main public FPL API endpoints in one list (bootstrap-static, fixtures, picks, live gameweek), plus a free builder for manager and gameweek queries.
- [Understat xG football analytics — export](https://datatooly.xyz/understat-football-stats/) (query builder): Build a ready-to-run query for Understat xG data — players, teams, shots across 6 leagues since 2014/15 — preview the output shape, then run it live.

## Guides

- [FPL API Endpoints: Complete Reference for 2026/27](https://datatooly.xyz/guides/fpl-api-endpoints-reference/): Every public Fantasy Premier League API endpoint, checked live in 2026/27: bootstrap-static, fixtures, live, entry, picks, leagues, with key fields and errors.
- [FPL Fixture Difficulty (FDR) from the API in Python](https://datatooly.xyz/guides/fpl-fixture-difficulty-api/): Read FPL fixture difficulty from the free API: team_h_difficulty, team_a_difficulty, how they map to team strength, and a Python table of the next 5 gameweeks.
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/): Read FPL's own price-change predictions from the free bootstrap-static API in Python: price_change_percent, projections, likelihood, and the ±100 rule.
- [FPL Live Gameweek Points from the API: Picks Math](https://datatooly.xyz/guides/fpl-live-gameweek-points-api/): Compute any FPL team's gameweek score from event/{gw}/live and picks: multipliers, captaincy, chips, hits and auto-subs. Python checked against 300 teams.
- [Find Your FPL Manager ID and Pull Your Team History](https://datatooly.xyz/guides/fpl-manager-id-team-history-api/): Where to find your Fantasy Premier League manager (team) ID, then pull every gameweek, chip, transfer and past season for it from the free FPL API in Python.
- [Understat xG Data Export: Pull Expected Goals with Python + CSV](https://datatooly.xyz/guides/understat-xg-data-export/): A practical guide to Understat xG data export: how the data is embedded in the page, a Python scraper that decodes it, and league and player xG to CSV.

## Other categories

- [Hiring & Sales Signals](https://datatooly.xyz/category/hiring-sales-signals/)
- [Patents & IP](https://datatooly.xyz/category/patents-ip/)
- [Social & Community](https://datatooly.xyz/category/social-community/)
- [Dev & Community](https://datatooly.xyz/category/dev-community/)
- [App Intelligence](https://datatooly.xyz/category/app-intelligence/)
- [Health & Pharma](https://datatooly.xyz/category/health-pharma/)
- [E-commerce Intelligence](https://datatooly.xyz/category/ecommerce-intelligence/)
- [News & Crypto](https://datatooly.xyz/category/news-crypto/)
- [Real Estate](https://datatooly.xyz/category/real-estate/)
- [Ads Intelligence](https://datatooly.xyz/category/ads-intelligence/)
- [Automotive](https://datatooly.xyz/category/automotive/)
- [Lead Generation](https://datatooly.xyz/category/lead-generation/)
- [AI & SEO](https://datatooly.xyz/category/ai-seo/)
- [Crypto & DeFi](https://datatooly.xyz/category/crypto-defi/)
- [SaaS & SEO](https://datatooly.xyz/category/saas-seo/)
- [Finance & Filings](https://datatooly.xyz/category/finance-filings/)
- [Jobs & Visas](https://datatooly.xyz/category/jobs-visas/)
