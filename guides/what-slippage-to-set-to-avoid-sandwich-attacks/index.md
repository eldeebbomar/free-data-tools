# What Slippage Should I Set to Avoid Sandwich Attacks?

> Pick a slippage tolerance from pool depth and the pool's MEV risk: why loose settings invite sandwich bots, a rule-of-thumb table, and what to check first.

- URL: https://datatooly.xyz/guides/what-slippage-to-set-to-avoid-sandwich-attacks/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Scan DEX pairs for MEV & sandwich risk](https://datatooly.xyz/mev-pair-scanner-tool/)
- Run this exact query on Apify: [Pre-trade MEV safety check on a known pool](https://apify.com/constructive_calm/mev-pair-scanner/examples/mev-pre-trade-pool-safety-check?fpr=v77kxu)
- Tags: defi, crypto, ethereum, solana

Set the lowest slippage tolerance that still lets your swap fill under normal price movement. As a starting point, that's about 0.1–0.5% on deep major pairs and about 0.5–1% on mid-size tokens. Go higher only on thin, fast-moving pools, and there an MEV-protected route matters more than the exact number. Your tolerance is the most a sandwich bot can push your price: 5% on a $1,000 swap lets your fill land up to $50 below the quote. Check whether the pool is actually being sandwiched before you choose.

*This is an explainer about trade execution, not financial advice. It doesn't tell you what to buy or sell.*

## What slippage tolerance actually does

When you request a swap, the app quotes an output amount. That quote already includes your **price impact**, which is how far your own trade moves the pool's price. Slippage tolerance is the extra room you allow on top of the quote, to cover price moves between the moment you sign and the moment your transaction lands in a block. The app turns it into a minimum output:

`minimum output = quoted output × (1 − slippage tolerance)`

If the price moves further than that before your swap executes, the swap fails instead of filling. On a normal public route you still pay the network fee for the failed transaction. Uniswap says its web app suggests a tolerance "usually between 0.1% and 5%", based on live gas fees and your swap size.

## Why high slippage invites sandwich attacks

A sandwich bot sees your pending swap and buys just before it, which pushes the price up. Your swap then fills at that worse price, and the bot sells just after you. The only thing that limits how far the bot can push you is your minimum output. Set it loosely, and you've told the bot exactly how much room it has.

| Swap size | Tolerance | Most your fill can land below the quote |
|---|---|---|
| $1,000 | 0.5% | $5 |
| $1,000 | 1% | $10 |
| $1,000 | 5% | $50 |
| $1,000 | 10% | $100 |

The table is plain arithmetic. It shows a ceiling, not the bot's profit: the bot also pays its own price impact, pool fees and gas or tips, so it only attacks when what it can take beats those costs. That's why academic work on sandwiches describes the trade-off as two-sided. A tolerance that's too small makes trades fail, and one that's too large lets bots profit. Larger trades and looser settings make you a more attractive target. Meme-coin traders get hit hard because they tend to set high slippage on thin, volatile pools.

## A rule-of-thumb table

These are my starting points, not guarantees. They assume you've already checked your price impact on the swap screen, and the "MEV risk" columns come from the pool checks in the next section.

| Pool and trade | Low MEV risk, no sandwiches seen | Medium MEV risk, or a few sandwiches | High MEV risk, or regular sandwiches |
|---|---|---|---|
| Stablecoin to stablecoin, deep pool | 0.05–0.1% | 0.05–0.1%, protected route | 0.05–0.1%, protected route |
| Major pair (ETH/USDC, SOL/USDC), price impact under 0.1% | 0.1–0.5% | 0.1–0.3%, protected route | 0.1–0.3%, protected route, split large orders |
| Mid-size token, price impact under 1% | 0.5–1% | 0.5%, protected route | Lowest that fills, protected route, trade smaller |
| Thin or new pool, price impact over 1% | 1–3% | Protected route, trade smaller | Rethink the size; don't fix failed fills by raising slippage |

Read across a row, not down a column. The same token can sit in a calm pool on one DEX and a heavily sandwiched pool on another, and the tolerance you pick should follow the pool you're actually routing through.

## Use the pool's MEV numbers to pick a setting

The [MEV Risk Scanner](https://apify.com/constructive_calm/mev-pair-scanner?fpr=v77kxu) reads Codex's per-pool data for the last 24 hours. Four of its fields decide which column of the table you're in:

- `sandwich_rate_24h` and `estimated_sandwich_attacks_24h`: the share of the pool's transactions that were sandwiched, and that rate multiplied by the day's transaction count. Anything above zero means bots are active in that pool right now.
- `mev_risk_level`: the most common hourly label. Codex labels each hour `low` when builder tips are under 3% of fees, `medium` at 3–30%, and `high` above 30%. It measures how hard bots of every kind compete in the pool, not sandwiches alone.
- `data_availability`: if the sandwich or fee fields weren't populated, treat the pool as unknown, which means the middle column.
- `safer_trading_windows_utc`: the hours in the last day that were labelled `low`. Use it as a hint about busy hours, not a schedule.

Two example rows, abbreviated and rounded, from a test run on 1 October 2026 (not live data):

```json
[
  { "token0_symbol": "WETH", "token1_symbol": "USDt", "exchange": "UniswapV3",
    "liquidity_usd": 56961580, "transactions_24h": 708,
    "mev_risk_level": "low", "mev_to_total_fees_ratio_24h": 0.034,
    "sandwich_rate_24h": 0, "estimated_sandwich_attacks_24h": 0 },
  { "token0_symbol": "USDC", "token1_symbol": "WETH", "exchange": "UniswapV3",
    "liquidity_usd": 3417730, "transactions_24h": 22633,
    "mev_risk_level": "high", "mev_to_total_fees_ratio_24h": 0.305,
    "sandwich_rate_24h": 0.00063, "estimated_sandwich_attacks_24h": 14 }
]
```

Both pools trade ETH against a dollar stablecoin on Ethereum. The first had no detected sandwiches and a low builder-tip share, so it falls in the left-hand column. The second had about 14 estimated sandwiches in a day and 30% of its fees going to builders, so it's the right-hand column: a tight setting and a protected route. A router may split your trade across both pools, so if you're choosing a pool by hand, choose with this in mind.

## Check the chart before you trade

The numbers above cover the last 24 hours. Before you sign, look at the live chart too. Open the token on [Defined](https://www.defined.fi/tokens?ref=CUKLU) (referral link), switch the chart to 1-minute candles, and check two things:

1. **How much the price moves in a minute.** If recent 1-minute candles swing by 2%, a 0.3% tolerance will fail often. Wait, or trade smaller, rather than opening the gate wide.
2. **Whether the trade list shows sandwiches.** Look for the same wallet buying just before someone else and selling just after, at the same timestamp. [How to tell if a token's pool is getting sandwiched](https://datatooly.xyz/guides/tell-if-token-pool-is-getting-sandwiched/) walks through it step by step.

## When your swap keeps failing at low slippage

- **Raise it in small steps,** for example from 0.5% to 0.8%, not straight to 10%.
- **Use a protected route.** [Flashbots Protect](https://docs.flashbots.net/flashbots-protect/overview) on Ethereum keeps your transaction out of the public mempool, and it doesn't include transactions that would revert, so a too-tight setting doesn't cost you a fee. On Solana, Jupiter offers dynamic slippage and an MEV-protect mode that routes through Jito block engines, for slightly higher fees.
- **Trade smaller,** so your price impact and the room you leave both shrink.
- **Taxed tokens are a special case.** If a token charges a transfer tax, your tolerance has to cover the tax or the swap fails, and a bot gets that same room. Be extra careful with size on those.

*Disclosure: I built the MEV Risk Scanner. The link marked "referral link" is a referral: if you sign up through it and trade, I get a share of the trading fees.*

## FAQ

### Is 0.5% slippage safe from sandwich attacks?

On a deep major pair with small price impact, 0.5% leaves a bot little room, and an MEV-protected route closes most of the rest. No setting is completely safe, though. On a thin pool with regular sandwiches, even 0.5% of a large trade can be worth attacking.

### What slippage should I use for meme coins?

Use the lowest setting that fills, usually higher than for major pairs because these prices move fast. Check the pool first. If it shows regular sandwiches, use a protected route and trade smaller instead of raising slippage.

### Why does my swap fail when I set low slippage?

The price moved past your minimum output before your transaction landed, either from normal volatility or from other trades in the same block. Raise the tolerance a little at a time, or use a route that doesn't charge you for reverted transactions.

### Does auto slippage protect me from MEV?

Auto or dynamic slippage sets the tolerance from the current market for each trade, which usually keeps it tighter than a fixed high value. That reduces the room a bot gets, but it doesn't hide your transaction. A protected route does that.

### Can I use high slippage if I send through a private RPC?

A private RPC hides your swap from public-mempool bots, which is the biggest risk. A 2026 study still found sandwiches against "protected" transactions on several chains, so keep slippage sensible even on a private route.

### What's the difference between price impact and slippage?

Price impact is how far your own trade moves the pool's price, and it's already built into your quote. Slippage tolerance is the extra movement you accept on top of the quote before the swap fails.

### Does a low `mev_risk_level` mean I can loosen slippage?

Not by itself. `mev_risk_level` reflects the builder-tip share of fees, not sandwiches. Check `sandwich_rate_24h` too, and remember that both describe the last 24 hours, not your next block.

### What slippage should I set for stablecoin swaps?

Stablecoin pairs barely move, so 0.05–0.1% usually fills in a deep pool. Anything much looser only gives a bot room to work with.

## Sources

- Uniswap, "What is slippage in crypto?": https://blog.uniswap.org/what-is-slippage-crypto
- MEV Blocker, "Sandwich attacks": https://docs.mevblocker.io/concepts/mev-attack-types/sandwich-attacks
- Heimbach and Wattenhofer, "Eliminating Sandwich Attacks with the Help of Game Theory" (2022): https://arxiv.org/abs/2202.03762
- Helius, "Solana MEV report" (memecoin slippage, Jupiter dynamic slippage and MEV Protect): https://www.helius.dev/blog/solana-mev-report
- Heimbach, Solmaz, Öz and Torres, "No Place to Hide: An Analysis on Protected Order Flow Sandwich Attacks" (2026): https://arxiv.org/abs/2609.28115
- Flashbots Protect overview: https://docs.flashbots.net/flashbots-protect/overview

Live token and pool charts: [Defined](https://www.defined.fi/tokens?ref=CUKLU) (referral link — the site earns a share of trading fees if you sign up; not financial advice).

## Related guides

- [How to Check a DEX Pool's Sandwich Attack Rate (Python + API)](https://datatooly.xyz/guides/check-dex-pool-sandwich-attack-rate/)
- [How to Tell if a Token's Pool Is Getting Sandwiched Before You Swap](https://datatooly.xyz/guides/tell-if-token-pool-is-getting-sandwiched/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
