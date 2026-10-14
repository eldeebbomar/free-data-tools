# How to Tell if a Token's Pool Is Getting Sandwiched Before You Swap

> Before you swap, check whether a DEX pool is being sandwiched: read its trade feed, check its 24h sandwich rate and MEV fee share, then route your trade.

- URL: https://datatooly.xyz/guides/tell-if-token-pool-is-getting-sandwiched/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Scan DEX pairs for MEV & sandwich risk](https://datatooly.xyz/mev-pair-scanner-tool/)
- Run this exact query on Apify: [Pre-trade MEV safety check on a known pool](https://apify.com/constructive_calm/mev-pair-scanner/examples/mev-pre-trade-pool-safety-check?fpr=v77kxu)
- Another example on Apify: [Check Solana memecoin pools for sandwich attacks](https://apify.com/constructive_calm/mev-pair-scanner/examples/mev-solana-memecoin-sandwich-check?fpr=v77kxu)
- Tags: defi, crypto, ethereum, solana

To tell whether a token's pool is getting sandwiched, look through its recent trades for one wallet that buys just before someone else's buy and sells just after it, in the same block. Then check two numbers for the last 24 hours: the share of the pool's transactions that were sandwiched, and the share of its fees that went to MEV. If either is high, trade with tight slippage through an MEV-protected route, or trade smaller.

*This is an explainer about how trades get executed. It is not financial advice and says nothing about whether any token is worth buying.*

## What a sandwich attack is

A sandwich attack is three swaps in one block. A bot buys the token just before your pending buy (the front-run), your buy fills at the higher price the bot just created, and the bot sells right after you (the back-run) and keeps the difference. Your slippage tolerance caps how far the bot can push your price: if the front-run moves the price past your minimum output, your swap reverts instead of filling.

The bot has to see your swap before it lands in a block. On Ethereum that usually means the public mempool. Solana has no public mempool, but sandwiches still happen there through private mempools and validators that see transactions before they're included.

## Check 1: read the pool's trade feed

The most direct evidence is in the trades themselves. Open the pool's chart and trade list, for example this [USDC/WETH Uniswap v3 pool on Defined](https://www.defined.fi/eth/0xe0554a476a092703abdb3ef35c80e0d76d32939f?ref=CUKLU) (referral link), and work through these steps:

1. Switch the chart to a 1-minute timeframe and click a busy candle. The trade table then shows only the trades inside that candle.
2. Look for a triplet: wallet A buys, a different wallet B buys, then wallet A sells about the same amount it bought, with the same timestamp.
3. Filter the trade table by wallet A's address. A sandwich bot repeats that buy-then-sell rhythm around other people's trades, often many times a day on the same pool.
4. To confirm a single case, open the three transactions in a block explorer (Etherscan, Solscan, Basescan) and check that they share a block number and appear in that order.

Some patterns look similar but aren't sandwiches. A wallet that buys and sells minutes apart is just a trader, and a lone sell right after a big swap is usually arbitrage. A sandwich needs both legs, one on each side of a victim. Checking by eye also only covers one pool for one hour. It can't tell you how often the pool gets hit.

## Check 2: measure the sandwich rate and the MEV share

[Codex](https://www.codex.io/) indexes DEX trades and flags sandwiched transactions for each pool. The [MEV Risk Scanner](https://apify.com/constructive_calm/mev-pair-scanner?fpr=v77kxu) on Apify reads that data for a token's top pools, for specific pool addresses, or for a chain's busiest pools. For each pool it returns these fields covering the last 24 hours:

| Field | What it tells you |
|---|---|
| `sandwich_rate_24h` | Share of the pool's transactions that were sandwiched (the average of the hourly rates) |
| `estimated_sandwich_attacks_24h` | That rate multiplied by the 24h transaction count, rounded. It's an estimate, not a list of attacks |
| `mev_to_total_fees_ratio_24h` | Share of the pool's fees paid to block builders as tips |
| `mev_risk_level` | The most common hourly label. Codex labels each hour `low` (under 3% builder tips), `medium` (3–30%) or `high` (over 30%) |
| `fee_regime_24h` | `mev-dominated`, `gas-dominated` or `pool-fee-dominated` |
| `safer_trading_windows_utc` | Start times of the hours labelled `low` |
| `data_availability` | How much of each field was populated, so you can tell "zero" from "not indexed" |

Here's an example row, abbreviated and rounded, from a test run on 1 October 2026. It isn't live data:

```json
{
  "pair_address": "0xe0554a476a092703abdb3ef35c80e0d76d32939f",
  "chain": "ethereum",
  "exchange": "UniswapV3",
  "token0_symbol": "USDC",
  "token1_symbol": "WETH",
  "liquidity_usd": 3417730,
  "transactions_24h": 22633,
  "mev_risk_level": "high",
  "mev_to_total_fees_ratio_24h": 0.305,
  "fee_regime_24h": "mev-dominated",
  "sandwich_rate_24h": 0.00063,
  "estimated_sandwich_attacks_24h": 14,
  "safer_trading_windows_utc": []
}
```

In plain terms, about 0.06% of roughly 22,600 transactions were sandwiched, around 14 in a day. Meanwhile about 30% of the pool's fees went to block builders, and no hour was quiet enough to count as `low`.

Those are two different signals. `mev_risk_level` measures builder tips, and builder tips pay for every kind of MEV, including arbitrage, back-runs and liquidations, not just sandwiches. A pool can be `high` and see few sandwiches, or `low` and still get sandwiched. Use `sandwich_rate_24h` as your sandwich signal, and `mev_risk_level` as a measure of how hard bots compete in that pool. Compare pools that trade the same pair: one whose rate is several times higher than its siblings is the one to route around.

## Check 3: compare your trade size with the pool

A sandwich only pays if the bot's profit beats its own gas, fees and tips. That profit grows with two things: how far your trade moves the price, and how much slippage you allow. Your swap screen's **price impact** figure shows how much your trade alone moves the price. A trade with almost no price impact in a deep pool is a thin target. A trade that moves a thin meme-coin pool by several percent, sent with a loose slippage setting, is exactly what bots look for.

Liquidity figures aren't always comparable across sites, because they count pool depth differently. Compare figures from the same source.

## Check 4: decide how to send the trade

- **Use an MEV-protected route.** On Ethereum, [Flashbots Protect](https://docs.flashbots.net/flashbots-protect/overview) sends your transaction to a private mempool that sandwich bots can't see. It doesn't include transactions that would revert, so you don't pay for failed swaps. [MEV Blocker](https://docs.mevblocker.io/) works in a similar way. On Solana, some aggregators offer an MEV-protect mode that routes through Jito block engines, at slightly higher fees.
- **Keep slippage tight.** The tighter it is, the less room a front-run has. The companion guide [What slippage should I set to avoid sandwich attacks?](https://datatooly.xyz/guides/what-slippage-to-set-to-avoid-sandwich-attacks/) covers how to choose a number.
- **Trade smaller, or split the order,** when your price impact is high.
- **Treat timing as a hint.** `safer_trading_windows_utc` shows which hours yesterday had a low builder-tip share. It doesn't promise anything about tomorrow.

## What these checks can't tell you

- **They describe the past 24 hours, not your next transaction.** The bot that targets you only needs to see your swap once.
- **Detection comes from Codex,** and coverage varies. Some Solana pools return a sandwich rate but no fee breakdown. On L2s like Base, builder tips are empty or zero, so `mev_to_total_fees_ratio_24h` comes back null there. Read `data_availability` before trusting a zero.
- **Protected routes reduce the risk but don't remove it.** A 2026 measurement study found sandwich attacks against "protected" transactions on every chain it examined, and noted that these often don't sit tightly around the victim. That means they won't always show up as the neat triplet from Check 1.

## Run it for your own tokens

The free [MEV pair scanner query builder](https://datatooly.xyz/mev-pair-scanner-tool/) turns a token or pool address and a chain into a ready-to-run input, and shows the output shape. It doesn't call Codex from your browser. The [actor](https://apify.com/constructive_calm/mev-pair-scanner?fpr=v77kxu) runs the scan: up to 20 pools per run, at 1-hour bars by default (5-minute to 1-day bars are also available), with an optional one-line AI verdict. It's free to start, then pay-as-you-go per pool scanned. If you'd rather write the code yourself, [the Python version of this check](https://datatooly.xyz/guides/check-dex-pool-sandwich-attack-rate/) calls Codex directly.

*Disclosure: I built the query builder and the actor. The link marked "referral link" is a referral: if you sign up through it and trade, I get a share of the trading fees.*

## FAQ

### Can I see a sandwich attack on a DEX chart?

Not on the candles themselves. You can see one in the trade list: the same wallet buys just before another trader's buy and sells just after it, in the same block. Click a 1-minute candle to filter the trades down to that minute, then filter by the suspected bot's wallet.

### Does a high MEV risk level mean the pool is getting sandwiched?

Not necessarily. `mev_risk_level` comes from the share of fees paid to block builders, and that covers arbitrage and liquidations as well as sandwiches. Check `sandwich_rate_24h` for sandwiches specifically.

### Is a pool with a 0% sandwich rate safe to swap in?

It means few or no sandwiches were detected in the last 24 hours, or, if `data_availability` shows the field as missing, that nothing was measured. A loose slippage setting on a public route can still get you sandwiched, so keep slippage tight either way.

### Are meme coins sandwiched more than major pairs?

Meme-coin traders are an easy target because they often set high slippage when trading thin, volatile pools. The pool's own numbers matter more than the category, though, so check each pool.

### Do private RPCs stop sandwich attacks?

They hide your transaction from the public mempool, and that removes the most common way bots find victims. Research published in 2026 still found sandwiches against protected transactions on several chains, so treat a private RPC as a big risk reduction, not a guarantee.

### Why are some fields null for Solana or Base pools?

Codex's fee indexing varies by pool on Solana, and L2s like Base don't have a builder-tip market like Ethereum mainnet's. A null value means "not available", not zero.

### Which chains can I check?

Any network Codex indexes, which is more than a hundred, including Ethereum, Solana, Base, BNB Chain and Arbitrum. Paste a bare `0x` address with a default chain selected, a Solana address as-is, or `chain:address` to mix chains in one run.

## Sources

- MEV Blocker, "Sandwich attacks": https://docs.mevblocker.io/concepts/mev-attack-types/sandwich-attacks
- Helius, "Solana MEV report" (private mempools, memecoin slippage, Jupiter MEV Protect): https://www.helius.dev/blog/solana-mev-report
- Heimbach and Wattenhofer, "Eliminating Sandwich Attacks with the Help of Game Theory" (2022): https://arxiv.org/abs/2202.03762
- Heimbach, Solmaz, Öz and Torres, "No Place to Hide: An Analysis on Protected Order Flow Sandwich Attacks" (2026): https://arxiv.org/abs/2609.28115
- Flashbots Protect overview: https://docs.flashbots.net/flashbots-protect/overview
- Defined docs, transaction filtering: https://docs.defined.fi/trading/defined-features/transaction-filtering

Live token and pool charts: [Defined](https://www.defined.fi/tokens?ref=CUKLU) (referral link — the site earns a share of trading fees if you sign up; not financial advice).

## Related guides

- [How to Check a DEX Pool's Sandwich Attack Rate (Python + API)](https://datatooly.xyz/guides/check-dex-pool-sandwich-attack-rate/)
- [What Slippage Should I Set to Avoid Sandwich Attacks?](https://datatooly.xyz/guides/what-slippage-to-set-to-avoid-sandwich-attacks/)
- [AI Share of Voice: Measure It in ChatGPT and Perplexity](https://datatooly.xyz/guides/ai-share-of-voice-chatgpt-perplexity/)
- [How to Check if ChatGPT Mentions Your Brand (Free)](https://datatooly.xyz/guides/check-if-chatgpt-mentions-your-brand/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
