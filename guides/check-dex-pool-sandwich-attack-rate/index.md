# How to Check a DEX Pool's Sandwich Attack Rate (Python + API)

> Measure how often a Uniswap, Raydium or Aerodrome pool gets sandwiched: pull per-hour sandwichRate and MEV fee data from Codex getBars in Python.

- URL: https://datatooly.xyz/guides/check-dex-pool-sandwich-attack-rate/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Scan DEX pairs for MEV & sandwich risk](https://datatooly.xyz/mev-pair-scanner-tool/)
- Tags: ethereum, defi, python, blockchain

To check a DEX pool's sandwich attack rate, query its hourly bars from Codex's GraphQL `getBars` endpoint. Each bar carries `sandwichRate` (sandwiched events divided by transactions), `mevRiskLevel`, and a fee split into gas, builder tips and LP fees. Weight each hour by its transaction count to get the 24-hour rate. A free Codex key covers light use.

Most "how to detect sandwich attacks" material has you rebuild the detector: pull every swap, group swaps by block, and look for a front-run and a back-run by the same address around a victim. That's a research project. If you only need to know whether a pool gets sandwiched a lot before you trade on it or provide liquidity to it, an indexer that has already done the detection is much faster.

## The source: Codex `getBars`

[Codex](https://www.codex.io/) is a GraphQL API that indexes DEX trades across more than a hundred networks. Its `getBars` query returns OHLCV candles for a pair, plus MEV and fee columns for each bar. The field definitions from Codex's SDK types:

- `sandwichRate`: "Rate of sandwich attacks per transaction (sandwichedEventCount / transactions). Null when no transaction data."
- `mevRiskLevel`: "low (<3% builder tips), medium (3-30%), or high (>30%)"
- `mevToTotalFeesRatio`: builder tips ÷ total fees
- `feeRegimeClassification`: gas-dominated (gas >50% of fees), mev-dominated (tips >20%), or pool-fee-dominated
- `totalFees` = `poolFees + baseFees + priorityFees + builderTips + l1DataFees`, all in USD

Limits worth knowing: you need an API key. Codex's pricing page currently lists a free plan with 10,000 requests a month at 5 requests per second, after a $1 one-time activation fee. One 24-hour scan of one pool costs one request. The key goes in the `Authorization` header as-is, with no `Bearer` prefix.

## Runnable Python

This script needs `requests` and a `CODEX_API_KEY` environment variable.

```python
import os
import time
import requests

CODEX_URL = "https://graph.codex.io/graphql"
API_KEY = os.environ["CODEX_API_KEY"]  # secret key, sent WITHOUT "Bearer"

QUERY = """
query Bars($symbol: String!, $from: Int!, $to: Int!, $resolution: String!) {
  getBars(symbol: $symbol, from: $from, to: $to, resolution: $resolution,
          removeEmptyBars: true) {
    t transactions
    sandwichRate mevRiskLevel mevToTotalFeesRatio feeRegimeClassification
    totalFees baseFees priorityFees builderTips poolFees l1DataFees
    pair { address networkId protocol token0Data { symbol } token1Data { symbol } }
  }
}
"""


def f(x):
    """Codex returns numeric fields as strings (or null)."""
    return None if x is None else float(x)


def sandwich_report(pool_address: str, network_id: int, hours: int = 24) -> dict:
    now = int(time.time())
    variables = {
        "symbol": f"{pool_address}:{network_id}",  # POOL address, not token
        "from": now - hours * 3600,
        "to": now,
        "resolution": "60",  # 1-hour bars
    }
    r = requests.post(
        CODEX_URL,
        json={"query": QUERY, "variables": variables},
        headers={"Authorization": API_KEY},
        timeout=30,
    )
    r.raise_for_status()
    body = r.json()
    if body.get("errors"):
        raise RuntimeError(body["errors"][0]["message"])
    b = body["data"]["getBars"]

    tx = [n or 0 for n in b["transactions"]]
    rates = [f(v) for v in b["sandwichRate"]]
    # sandwichRate is per bar (sandwiched / transactions). Weight by each
    # bar's transaction count; a plain mean over-weights quiet hours.
    sandwiched = sum(r_ * t for r_, t in zip(rates, tx) if r_ is not None)
    total_tx = sum(t for r_, t in zip(rates, tx) if r_ is not None)

    def total(field):
        vals = [f(v) for v in (b.get(field) or []) if v is not None]
        return round(sum(vals), 2) if vals else None  # None = not indexed

    p = b["pair"]
    return {
        "pool": p["address"],
        "pair": f'{p["token0Data"]["symbol"]}/{p["token1Data"]["symbol"]}',
        "protocol": p["protocol"],
        "bars": len(b["t"]),
        "transactions": sum(tx),
        "sandwich_rate_24h": round(sandwiched / total_tx, 5) if total_tx else None,
        "est_sandwiched_tx_24h": round(sandwiched),
        "mev_risk_by_hour": b["mevRiskLevel"],
        "fees_usd": {k: total(k) for k in
                     ("totalFees", "baseFees", "priorityFees",
                      "builderTips", "poolFees", "l1DataFees")},
    }


if __name__ == "__main__":
    # USDC/WETH 0.05% Uniswap v3 pool on Ethereum (network id 1)
    rep = sandwich_report("0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", 1)
    for k, v in rep.items():
        print(f"{k:24} {v}")
```

I ran this on 29 September 2026 against that pool, then against the top-volume pools on Solana (network id `1399811149`) and Base (`8453`). Each call returned 25 hourly bars. The results show why the per-row caveats below matter: the busiest Solana SOL/USDC pools returned a `sandwichRate` but `null` for every fee field, while Ethereum pools returned the full fee breakdown.

To find pool addresses, Codex's `filterPairs` query ranks pairs by `volumeUSD24` or `liquidity` on a given network.

## Output fields

| Field | Meaning | Watch out for |
|---|---|---|
| `sandwich_rate_24h` | Sandwiched transactions ÷ transactions, weighted by hour | `None` if Codex has no transaction data for the pool |
| `est_sandwiched_tx_24h` | Approximate count of sandwiched transactions | Derived from the rate. It is not a list of attacks |
| `mev_risk_by_hour` | `low` / `medium` / `high` per bar | Based on builder-tip share of fees, **not** sandwich rate |
| `fees_usd.builderTips` | USD paid to block builders (MEV) | `None` on L2s such as Base, where there's no builder market |
| `fees_usd.poolFees` | LP fees | `None` on some Solana pools |
| `fees_usd.l1DataFees` | L1 data-posting cost | Only on L2 rollups. `None` on L1 chains |

## Pitfalls

1. **`mevRiskLevel` is not a sandwich metric.** It measures how much of the pool's fees go to block builders. In my test, the Ethereum USDC/WETH pool had a sandwich rate of zero while most of its hourly bars were `medium` MEV risk. Builder tips pay for every kind of MEV, including arbitrage, backruns and liquidations, not just sandwiches. Report both numbers, and don't use one as a stand-in for the other.
2. **A token address silently resolves to a pool.** When I passed the WETH token address as the symbol, Codex returned bars for the USDC/WETH 0.05% pool without any error. Always read `pair.address` from the response to confirm which pool you actually measured.
3. **`null` means "not indexed", not zero.** Don't turn a missing value into a zero, or pools with no data will look perfectly safe. The script keeps `None` for exactly this reason.
4. **Numbers are strings.** `sandwichRate`, every fee field, `liquidity` and `volume` come back as decimal strings. `transactions` is an integer.
5. **Don't average the hourly rates without weighting.** Hours with 10 trades and hours with 2,000 trades count equally in a plain mean, and one quiet hour with a single sandwich skews the result. Weight by transactions.
6. **Case matters off-EVM.** EVM addresses work in any case. Solana base58 addresses are case-sensitive, so never lowercase them.
7. **Bar limits.** Codex documents a maximum of 1,500 datapoints per `getBars` request. For long windows at fine resolution, page through time.

For trade-level history on EVM chains, Dune's curated `dex.sandwiches` and `dex.sandwiched` tables record the attacker and victim legs, and you query them with SQL. That approach suits forensic work. Codex is the quicker option for a live, per-pool check.

## Do it without code

The free [MEV pair scanner query builder](https://datatooly.xyz/mev-pair-scanner-tool/) turns a mode (scan a token's top pools, scan specific pools, or discover the most MEV-toxic pools on a chain), a chain and a list of addresses into a ready-to-run input. It also shows a fixed example of the output shape. It is a query builder, not a live scanner: it doesn't call Codex from your browser.

## At scale

The [MEV Risk Scanner actor on Apify](https://apify.com/constructive_calm/mev-pair-scanner?fpr=v77kxu) wraps this query with Codex access included, so you don't need your own key. It scans up to 20 pools per run across chains, attaches a `data_availability` map to every row so you can tell nulls from zeros, lists the low-risk hours, and can add an optional one-line AI verdict. You can schedule it for a daily MEV leaderboard. It's free to start, then pay-as-you-go per pool scanned. One difference from the script above: the actor's `sandwich_rate_24h` is a simple average of the hourly values, not a transaction-weighted one.

*Disclosure: I built the query builder and the actor. The script above works on its own with a free Codex key.*

## FAQ

### What is a good sandwich rate for a DEX pool?

There's no official benchmark. Compare pools that trade the same pair: a pool whose rate is several times higher than its siblings is the one to avoid or to route through a private RPC. Look at `sandwich_rate_24h` over several days, not a single snapshot.

### Is there a free API for sandwich attack data?

Codex's free plan (10,000 requests a month per its pricing page, after a $1 activation fee) includes `getBars` with `sandwichRate`. Dune's `dex.sandwiches` tables can be queried with SQL on a Dune account. Both are free to start.

### Why is `builderTips` null on Base or Arbitrum?

Those L2s don't have an MEV-builder market like Ethereum mainnet, so there is nothing to report and `mevToTotalFeesRatio` can't be computed. L2 fee data shows up in `l1DataFees` instead.

### Why does a Solana pool return only `sandwichRate`?

Codex's fee indexing is per pool on Solana. In my test, the highest-volume SOL/USDC pools returned sandwich rates but no fee breakdown. Treat the missing fields as unknown.

### Does a low sandwich rate mean my trade is safe?

No. It means the pool was rarely sandwiched recently. Your own slippage tolerance and whether your transaction goes through a public mempool matter more. A tight slippage limit and a private RPC reduce the risk no matter which pool you use.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
