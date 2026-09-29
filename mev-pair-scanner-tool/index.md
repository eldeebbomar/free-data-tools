# Scan DEX pairs for MEV & sandwich risk

> This free query builder assembles a ready-to-run config for DEX sandwich-attack MEV data: pick a mode (scan-token, scan-pair or discover-mev), a chain and token or pool addresses, then preview the per-pair output, including sandwich_rate_24h, mev_risk_level and a gas, builder-tip and pool-fee breakdown. The backing Apify actor runs it, pay-as-you-go per pair scanned, and each row's data_availability map separates true zeros from unindexed data.

- Type: Query builder (builds a ready-to-run query; the example output below is a fixed sample, not live results)
- Category: [Crypto & DeFi](https://datatooly.xyz/category/crypto-defi/)
- URL: https://datatooly.xyz/mev-pair-scanner-tool/
- Backing Apify actor: [mev-pair-scanner](https://apify.com/constructive_calm/mev-pair-scanner?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [How to Check a DEX Pool's Sandwich Attack Rate (Python + API)](https://datatooly.xyz/guides/check-dex-pool-sandwich-attack-rate/)

Pick a chain and token or pool addresses and preview the per-pool MEV and sandwich-attack metrics the actor returns, from risk level to fee breakdown.

## Key takeaways

- Builds a copy-paste-ready query and shows a fixed example of the output shape — it does not return live on-chain data in your browser.
- Output fields cover sandwich risk directly: sandwich_rate_24h, estimated_sandwich_attacks_24h, mev_risk_level, mev_to_total_fees_ratio_24h, and a fee_regime label.
- Three modes: scan-token (a token's top pools), scan-pair (specific pool addresses), and discover-mev (rank the most MEV-toxic pools on a chain).
- The backing actor pulls from Codex.io's GraphQL index across 133 chains, including Ethereum, Solana, Base, BSC, and Arbitrum.
- Run it on the Apify actor — free to start on Apify's platform credits, then pay-as-you-go (a per-run start fee plus a per-pair-scanned charge).
- A fee breakdown (base fees, priority fees, builder tips, pool/LP fees, L1 data fees) shows how much of a pool's trading cost is MEV leakage versus normal gas — though several fields are null by design (builder tips are zero on L2s like Base/Arbitrum, L1 data fees are null on L1 chains), which the per-row data_availability map flags.

## How it works

### 1. Pick a scan mode

Choose scan-token to scan a token's top pools, scan-pair for specific pool addresses, or discover-mev to rank the most MEV-toxic pools on a chain. The default template uses scan-token on Ethereum.

### 2. Set the chain and addresses

Select a default_evm_chain (Ethereum by default) for bare 0x addresses, paste token addresses into tokens (or pool addresses into pairs). Solana base58 addresses auto-detect; use chain:address to override per row.

### 3. Set a result cap

Set max_results to limit how many pools are scanned (the actor caps a run at 20 pairs). Fewer pairs means a lower pay-as-you-go cost when you run it.

## How to use it

1. **Pick a scan mode** — Choose scan-token to scan a token's top pools, scan-pair for specific pool addresses, or discover-mev to rank the most MEV-toxic pools on a chain. The default template uses scan-token on Ethereum.
2. **Set the chain and addresses** — Select a default_evm_chain (Ethereum by default) for bare 0x addresses, paste token addresses into tokens (or pool addresses into pairs). Solana base58 addresses auto-detect; use chain:address to override per row.
3. **Set a result cap** — Set max_results to limit how many pools are scanned (the actor caps a run at 20 pairs). Fewer pairs means a lower pay-as-you-go cost when you run it.
4. **Preview the output shape** — Review the fixed example output — sandwich_rate_24h, mev_risk_level, mev_to_total_fees_ratio_24h, the fees_24h breakdown, the per-row data_availability map, and safer_trading_windows_utc (which can be empty on persistently MEV-dominated pools) — so you know exactly which fields you'll get back.
5. **Run it live on the actor** — Copy the generated query and run it on the backing Apify actor, which is free to start on your Apify platform credits and then pay-as-you-go. The actor fetches the live per-pair MEV data; the builder does not.

## Example output

A fixed sample of the fields the mev-pair-scanner actor returns — example data, not live results.

| token0_symbol | token1_symbol | exchange | mev_risk_level | sandwich_rate_24h |
| --- | --- | --- | --- | --- |
| WETH | USDC | UniswapV3 | medium | 0.00179 |
| PEPE | WETH | UniswapV2 | high | 0.0121 |
| WETH | USDC | Aerodrome | low | 0.00022 |
| ARB | WETH | UniswapV3 | low | 0.00041 |
| CAKE | WBNB | PancakeSwapV3 | medium | 0.00096 |

## Ready-to-run actor input

```json
{
  "mode": "scan-token",
  "default_evm_chain": "ethereum",
  "max_results": 20
}
```

## Key facts

- On Solana, sandwich-attack bots are reported to have drained a large sum from users — figures circulating in 2025 range up to roughly $500 million over a multi-month period. (Source: Third-party 2025 crypto-research write-ups and community guides; cited as an estimated range, not on-chain ground truth. The actor's README references the ~$500M Solana figure.)
- Coordinated Solana mitigation in 2025 — validator action and Jito closing its public mempool — is reported to have cut sandwich-attack profitability significantly. (Source: 2025 community reporting on Solana ecosystem actions; percentages quoted elsewhere are estimates, not verified figures.)
- On Ethereum, community MEV-data dashboards have tracked tens of thousands of sandwich attacks per month through 2025, at a small average profit per attack. (Source: Third-party MEV-data dashboards/community guides; figures are platform estimates, not on-chain ground truth.)
- The backing actor sources its data from Codex.io's GraphQL index, which covers 133 blockchain networks. (Source: From the actor's README and input schema.)
- The actor uses pay-per-event pricing (a per-run start fee, a per-pair-scanned charge, and an optional per-AI-verdict charge) and has no actor-specific free quota — it is free to start using Apify's platform free credits. (Source: From the actor's README and pay_per_event config; exact per-event amounts are set on the actor page and may change.)

## FAQ

### What is a DEX sandwich attack, in plain terms?

A sandwich attack is a three-transaction MEV pattern. A bot watching the mempool spots your pending swap, places a buy right before it to push the price against you, lets your trade execute at the worse price, then sells right after to pocket the difference. It only works on AMM-based DEXs, where trade size and slippage tolerance let the bot calculate its profit ceiling from your transaction.

### What does this tool actually return — live data or a query?

It returns a query, not live results. The builder assembles a ready-to-run config (mode, chain, token or pool addresses, max_results) and shows a fixed example of the output shape so you know what fields to expect. The underlying source is anti-bot and not CORS-open, so live scanning happens when you run the query on the backing Apify actor, not in your browser.

### Which fields describe sandwich and MEV risk in the output?

Per pool you get sandwich_rate_24h (share of transactions sandwiched), estimated_sandwich_attacks_24h (a 24-hour count), mev_risk_level (low/medium/high or null), mev_to_total_fees_ratio_24h (how much of fees flow to MEV builders), and fee_regime_24h (mev-dominated, gas-dominated, or pool-fee-dominated). A fees_24h object splits total cost into base fees, priority fees, builder tips, pool fees (labelled 'Pool fees (USD)', i.e. LP fees), and L1 data fees. Coverage is not uniform: builder tips are genuinely zero on L2s like Base/Arbitrum/Optimism/Polygon (so mev_to_total_fees_ratio_24h is then null), L1 data fees are null on L1 chains, and Solana coverage is per-pool — some pools return only the sandwich rate. Every row includes a data_availability map showing which fields populated for that pool.

### Which chains and data source does it cover?

The backing actor queries Codex.io's GraphQL index, which covers 133 blockchain networks — Ethereum, Solana, Base, BSC, Arbitrum, Optimism, Polygon, Avalanche, Sui, Aptos, and many more. Bare 0x addresses resolve via the default_evm_chain dropdown (defaults to Ethereum), Solana base58 addresses auto-detect, and an explicit chain:address prefix overrides the default per row.

### How much money do sandwich attacks actually extract?

On Solana, bots reportedly drained a large sum from users (figures circulating in 2025 crypto-research write-ups range up to roughly $500 million over a multi-month period ending in 2025), before coordinated mitigation — validator action and Jito closing its public mempool — cut profitability substantially. On Ethereum, community MEV-data dashboards have tracked tens of thousands of sandwich attacks per month through 2025, often at a small average profit per attack. Treat these as third-party estimates, not on-chain ground truth.

### What are the three modes and when do I use each?

Use scan-token to discover and scan a token's top-volume pools when you only know the token. Use scan-pair when you already have specific pool/pair addresses and want direct analysis. Use discover-mev to rank the most MEV-toxic pools across selected chains by risk level, filtered by a minimum-liquidity threshold — useful for finding which pools to avoid before you trade.

### How can I actually avoid getting sandwiched when I trade?

Common defenses are setting a tight slippage tolerance (around 0.1% on stable pairs, 0.5-1% on liquid pairs), routing through a private RPC such as Flashbots Protect or MEV Blocker so your transaction skips the public mempool, and using MEV-protected aggregators like CoW Swap or 1inch Fusion. This scanner helps the planning side: spotting high-sandwich-rate pools and, when available, lower-MEV trading windows before you swap.

### Is the backing actor free, and what does a run cost?

The in-browser query builder is free. Running the actor on Apify is free to start using your Apify platform free credits — there is no separate actor-specific free quota — and then pay-as-you-go. The actor uses pay-per-event pricing: a per-run start fee, a per-pair-scanned charge for each pool analyzed with full MEV intel and 24h hourly bars, and an optional small charge per AI verdict if you enable the trader summary. You only pay for the pairs you actually scan.

### Can it tell me the safest time of day to trade a pool?

Sometimes, when the data supports it. Each scanned pool includes safer_trading_windows_utc — the hours over the last 24 hours where the pool's MEV risk was 'low', derived from bars_hourly time-series data (OHLCV plus MEV and fee columns). Note this field is frequently empty: on persistently MEV-dominated pools — often the very high-risk pools you'd most want to time — there may be no low-risk hour, and the array comes back empty. When it does populate, combine it with sandwich_rate_24h and the fee regime label to time a trade into a lower-toxicity window.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [SEC EDGAR API tool](https://datatooly.xyz/sec-edgar-search/)
- [Crypto news scraper](https://datatooly.xyz/crypto-news-search/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
