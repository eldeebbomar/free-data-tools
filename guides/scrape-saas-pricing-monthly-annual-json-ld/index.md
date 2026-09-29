# Scrape Monthly vs Annual SaaS Prices From Pricing-Page JSON-LD

> Get both sides of a SaaS pricing page's monthly/annual toggle without a browser: read schema.org Offer JSON-LD in Python, then diff it on a schedule.

- URL: https://datatooly.xyz/guides/scrape-saas-pricing-monthly-annual-json-ld/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Track SaaS pricing & plan changes](https://datatooly.xyz/saas-pricing-tracker-tool/)
- Tags: python, webscraping, saas, json

To scrape both the monthly and the annual price from a SaaS pricing page without clicking the billing toggle, check the page's JSON-LD first. Many pricing pages embed schema.org `Offer` objects whose `priceSpecification` lists one `UnitPriceSpecification` per billing period: `unitCode: "MON"` or `"ANN"`, or `billingDuration: "P1M"` or `"P1Y"`. One plain HTTP request gets you both numbers.

When the JSON-LD is missing, or names the plans without prices, the numbers are rendered client-side and you need a browser. This guide covers the fast path, a working extractor, a diff for change alerts, and the traps in how vendors mark prices up.

## Why the toggle is the hard part

A pricing page usually shows one billing period at a time. The other set of prices is either hidden in the DOM (a `display:none` twin, or a `data-annual-price` attribute), fetched by JavaScript when you flip the switch, or baked into structured data for search engines. Scraping the visible cards gets you whichever period the page defaults to. Clicking the toggle means running a browser.

Structured data sidesteps both. It's there for Google's rich results, so it tends to be complete, machine-readable, and in the raw HTML.

## What real pages expose

I fetched a handful of well-known pricing pages with a plain HTTP client on 29 September 2026 and ran the extractor below on each:

| Page | JSON-LD offers | What you get |
|---|---|---|
| `monday.com/pricing` | 16 | Plan names with separate `MON` and `ANN` unit prices, per product line |
| `calendly.com/pricing` | 8 | Plan prices in USD, GBP and EUR, marked `billingDuration: "P1Y"` |
| `zapier.com/pricing` | 4 | Plan names; only the free plan carries a price |
| `slack.com/pricing` | 0 | Nothing in JSON-LD. Prices are rendered client-side. |

So this is a fast path, not a universal one. Where it works it's cheap and exact. Where it doesn't, the page is telling you it needs a browser.

## Runnable Python: extract offers and billing periods

```python
import json, re, sys, requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
LD_RE = re.compile(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', re.S | re.I)

def walk(node, product=None):
    """Yield (product_name, offer) for every Offer anywhere in a JSON-LD tree."""
    if isinstance(node, list):
        for n in node:
            yield from walk(n, product)
    elif isinstance(node, dict):
        types = node.get("@type")
        types = types if isinstance(types, list) else [types]
        if "Offer" in types:
            yield product, node
            return
        name = node.get("name") if {"Product", "SoftwareApplication"} & set(types) else product
        for v in node.values():
            yield from walk(v, name)

def period(spec):
    """Map a UnitPriceSpecification to 'monthly' | 'annual' | None."""
    unit = str(spec.get("unitCode", "")).upper()
    dur = str(spec.get("billingDuration", "")).upper()
    if unit == "MON" or dur == "P1M":
        return "monthly"
    if unit == "ANN" or dur == "P1Y":
        return "annual"
    return None

def to_num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def extract(url):
    html = requests.get(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}, timeout=30).text
    plans = []
    for block in LD_RE.findall(html):
        try:
            data = json.loads(block)
        except ValueError:
            continue
        for product, offer in walk(data):
            row = {"product": product, "plan": offer.get("name"), "currency": offer.get("priceCurrency"),
                   "price": to_num(offer.get("price")), "monthly": None, "annual": None}
            specs = offer.get("priceSpecification") or []
            for spec in specs if isinstance(specs, list) else [specs]:
                p = period(spec)
                if p:
                    row[p] = to_num(spec.get("price"))
                    row["currency"] = row["currency"] or spec.get("priceCurrency")
            plans.append(row)
    return plans

if __name__ == "__main__":
    for url in sys.argv[1:]:
        plans = extract(url)
        print(f"\n{url}: {len(plans)} offers in JSON-LD")
        for p in plans[:8]:
            print("  ", p)
```

```bash
pip install requests
python pricing_ld.py https://monday.com/pricing https://calendly.com/pricing
```

On monday.com, captured on the date above, the first rows looked like this: both toggle states in one fetch.

```text
{'product': 'monday.com Work Management', 'plan': 'Free', 'currency': 'USD', 'price': 0.0, 'monthly': None, 'annual': None}
{'product': 'monday.com Work Management', 'plan': 'Basic', 'currency': 'USD', 'price': None, 'monthly': 12.0, 'annual': 9.0}
{'product': 'monday.com Work Management', 'plan': 'Standard', 'currency': 'USD', 'price': None, 'monthly': 14.0, 'annual': 12.0}
```

Prices change, so treat those numbers as a snapshot of the markup, not current pricing.

## Turn it into a change alert

Save each run's rows and compare them with the previous run's on structured fields. A diff of raw HTML fires on every rotating testimonial and build hash. A diff of plan rows fires only when a plan or a price moves.

```python
import json, pathlib
from pricing_ld import extract

def key(p):
    return (p["product"], p["plan"], p["currency"])

def diff(old, new):
    old_by, new_by = {key(p): p for p in old}, {key(p): p for p in new}
    changes = []
    for k in old_by.keys() - new_by.keys():
        changes.append(("plan_removed", k))
    for k in new_by.keys() - old_by.keys():
        changes.append(("plan_added", k))
    for k in old_by.keys() & new_by.keys():
        for field in ("price", "monthly", "annual"):
            a, b = old_by[k][field], new_by[k][field]
            if a is not None and b is not None and a != b:
                changes.append(("price_increase" if b > a else "price_decrease", k, field, a, b))
    return changes

url = "https://monday.com/pricing"
snap = pathlib.Path("monday.snapshot.json")
current = extract(url)
if snap.exists():
    for c in diff(json.loads(snap.read_text()), current):
        print(c)
snap.write_text(json.dumps(current, indent=2))
print(f"saved {len(current)} offers")
```

To test it, edit one price in the snapshot file by hand and run it again. You'll get a line like `('price_increase', ('monday.com Work Management', 'Basic', 'USD'), 'monthly', 10.0, 12.0)`. Pipe those lines to Slack or email and you have a pricing-change monitor.

## Field reference: the schema.org keys that matter

| Key | Where | Meaning |
|---|---|---|
| `@type: "Offer"` | anywhere in the tree, often under `Product.offers` or `@graph` | One plan, or one plan in one currency |
| `name` | Offer | Plan name, sometimes with a currency suffix, like "Standard Plan (USD)" |
| `price`, `priceCurrency` | Offer | A single headline price |
| `priceSpecification` | Offer | An object **or a list** of `UnitPriceSpecification` |
| `unitCode` | spec | UN/CEFACT unit: `MON` = month, `ANN` = year |
| `billingDuration` | spec | ISO 8601 duration: `P1M` monthly, `P1Y` yearly |
| `unitText` | spec | Free text such as "seat/month". Read it before comparing. |
| `description` | Offer or spec | Often says "per seat, billed annually" |

## Pitfalls

- **`price: 0` doesn't always mean free.** Calendly's Enterprise offer carries `price: "0"` with `unitText: "yr"`. That's a contact-sales placeholder. Treat a zero as free only when the plan name or description agrees.
- **An annual spec is usually a per-month rate.** `billingDuration: "P1Y"` alongside `unitText: "seat/month"` means "per seat per month, billed yearly", not a yearly total. Normalize units before you compare vendors.
- **One page, several currencies.** Calendly lists USD, GBP and EUR offers side by side. Key your diff on currency too, as the script does, or a GBP row will look like a price change.
- **Names without prices.** Zapier's JSON-LD lists paid plans with no price. The numbers load client-side, so you need browser rendering for those pages.
- **Location changes the answer.** Many vendors localize currency and price by IP or `Accept-Language`. Fetch from one consistent location, or you'll diff geography instead of pricing.
- **Structured data can lag the page.** It's SEO markup, and it can go stale after a redesign. Spot-check it against the visible cards now and then.
- **Be polite.** Public pricing pages are meant to be read, but check the site's terms and robots.txt, and fetch each page on a schedule measured in hours or days, not seconds.

## Do it without code

The free [SaaS pricing tracker query builder](https://datatooly.xyz/saas-pricing-tracker-tool/) takes competitor homepage or pricing URLs and builds a ready-to-run input with pricing-page discovery and change detection switched on, plus a fixed example of the output shape. It's a query builder: it doesn't fetch live prices in your browser.

## At scale

[SaaS Pricing & Feature Tracker on Apify](https://apify.com/constructive_calm/saas-pricing-tracker?fpr=v77kxu) handles the pages that JSON-LD doesn't cover. It finds the pricing page from a homepage, tries structured data, comparison tables and plan cards, and keeps the most confident result. It reads monthly and annual prices from data attributes and hidden toggle elements, falls back to a real browser for client-rendered pages, and can use AI vision when extraction comes back incomplete. Each plan gets `priceMonthly`, `priceAnnualPerMonth`, `currency`, `features` and `isEnterprise`, plus a `priceSource` (JSON-LD, card, table, promo or AI), promo fields (`hasPromo`, `promoPrice`, `promoText`) and an `extractionConfidence` rating. With a named dataset, scheduled runs flag added or removed plans, price moves and feature changes, and can POST them to a webhook. A `country` input sets which market's prices you see. It's free to start, then pay-as-you-go.

*Disclosure: I built the query builder and the actor. The scripts above work on their own.*

## FAQ

### How do I scrape both monthly and annual prices from a pricing page?

Look for schema.org `Offer` JSON-LD first. If `priceSpecification` holds one entry with `unitCode: "MON"` and one with `"ANN"` (or `billingDuration` `P1M` and `P1Y`), you have both prices from a single request. Otherwise, read the hidden toggle elements or render the page and click the toggle.

### Do I need Selenium or Playwright to scrape SaaS pricing?

Only for pages that render prices with JavaScript. If the raw HTML carries priced `Offer` JSON-LD, `requests` is enough. If the JSON-LD is missing or has plan names without prices, you need a browser.

### How can I get alerted when a competitor changes its pricing?

Store each run's plan rows and diff them against the previous run on plan name, currency and price fields, then send any changes to Slack, email or a webhook. Diffing structured rows avoids the false alarms that raw-HTML diffs produce.

### Why does the scraped price differ from what I see in my browser?

Usually location or currency: many vendors localize by IP and browser language. It can also be stale JSON-LD, or a per-seat monthly rate being compared against a yearly total. Check `unitText` and `billingDuration`.

### Is it legal to scrape competitor pricing pages?

Pricing pages are published for anyone to read, but legality depends on your jurisdiction and the site's terms. Collect only public pricing, respect robots.txt and the terms, keep request rates low, and ask counsel for anything commercial at scale.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
