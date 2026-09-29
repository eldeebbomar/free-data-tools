# Shopify products.json Pagination: 250 Limit and the 25,000 Cap

> Paginate any Shopify store's public /products.json: limit=250, page numbers, the empty-page stop signal, and the HTTP 400 you hit at 25,000 products.

- URL: https://datatooly.xyz/guides/shopify-products-json-pagination/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [See any Shopify store's products — live, free, no app](https://datatooly.xyz/shopify-store-products/)
- Tags: shopify, python, webscraping, ecommerce

To paginate a Shopify store's public `/products.json`, request `?limit=250&page=1`, then `page=2`, and so on until the response is `{"products":[]}`. 250 is the most products you can get per page. Asking for more is silently clamped to 250, and leaving `limit` out gives you 30. Pagination also stops at 25,000 products: once `page × limit` goes past 25,000, the store returns HTTP 400 `"Page * Limit exceeds the 25000 limit."`

That's the whole answer. The rest of this guide shows a runnable export script and what each response looks like. It also covers why the advice you'll find elsewhere often mixes this up with Shopify's authenticated Admin API. Every behavior below was tested on live stores on 2026-09-29.

## Two different "products" APIs

Most confusion comes from mixing up two different endpoints:

| | Storefront `/products.json` | Admin REST API |
|---|---|---|
| URL | `https://{store}/products.json` | `https://{store}.myshopify.com/admin/api/{version}/products.json` |
| Auth | None, it's public | Access token from the store owner |
| Pagination | `page` numbers | Cursor (`page_info` in the `Link` header) |
| Who can use it | Anyone, on any store that leaves it open | Only the store's owner or installed apps |

Forum answers saying "`page` is deprecated, use `page_info`" are about the Admin API. The public storefront endpoint still pages by number. It has no `Link` header, no total count and no cursor. An empty `products` array is the only end signal.

## What one page contains

Each element of `products` looks like this (fields verified on a live store):

| Level | Fields |
|---|---|
| Product | `id`, `title`, `handle`, `body_html`, `published_at`, `created_at`, `updated_at`, `vendor`, `product_type`, `tags`, `variants`, `images`, `options` |
| Variant | `id`, `title`, `option1`–`option3`, `sku`, `requires_shipping`, `taxable`, `featured_image`, `available`, `price`, `grams`, `compare_at_price`, `position`, `product_id`, `created_at`, `updated_at` |

Two things to know before you write any code:

- **Price and stock are on the variant, not the product.** A shoe in 12 sizes is one product with 12 variant rows, each with its own `price` and `available`.
- **`price` is a string in dollars** (`"25.00"`). The per-product `.js` endpoint, covered below, returns an integer in cents (`2500`). Don't mix the two sources without converting.

## Runnable Python: export a full catalog to CSV

```python
import csv
import sys
import time
import requests

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; catalog-export/1.0)"}
LIMIT = 250          # the maximum; larger values are silently clamped to 250
OFFSET_CAP = 25_000  # page * limit may not exceed this

def fetch_all_products(domain, base_path="/products.json"):
    products, page = [], 1
    while page * LIMIT <= OFFSET_CAP:
        url = f"https://{domain}{base_path}?limit={LIMIT}&page={page}"
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code == 429:
            time.sleep(10)                      # throttled: wait and retry the same page
            continue
        if r.status_code in (401, 403, 404):
            sys.exit(f"{url} -> HTTP {r.status_code}: endpoint closed, password-protected or bot-blocked")
        r.raise_for_status()
        batch = r.json().get("products", [])
        if not batch:                           # an empty page is the only end signal
            break
        products.extend(batch)
        page += 1
        time.sleep(1)                           # be polite
    else:
        print(f"warning: stopped at the {OFFSET_CAP:,}-product offset cap; "
              "split the catalog by collection to get the rest", file=sys.stderr)
    return products

def to_rows(domain, products):
    for p in products:
        for v in p["variants"]:                 # price and stock live on variants
            yield {
                "product_id": p["id"],
                "title": p["title"],
                "vendor": p["vendor"],
                "product_type": p["product_type"],
                "handle": p["handle"],
                "variant_id": v["id"],
                "variant_title": v["title"],
                "sku": v.get("sku"),
                "price": v["price"],            # a string, e.g. "25.00"
                "compare_at_price": v.get("compare_at_price"),
                "available": v.get("available"),
                "url": f"https://{domain}/products/{p['handle']}",
            }

if __name__ == "__main__":
    domain = sys.argv[1] if len(sys.argv) > 1 else "www.allbirds.com"
    products = fetch_all_products(domain)
    rows = list(to_rows(domain, products))
    with open("catalog.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
    print(f"{domain}: {len(products)} products, {len(rows)} variant rows -> catalog.csv")
```

On the day I tested it, `python export.py www.allbirds.com` walked three full pages, stopped on an empty fourth page, and printed `692 products, 7454 variant rows`. On a store that blocks the endpoint (Gymshark answered 403 from behind a CDN), the script exits with a clear message instead of writing an empty file.

## Pitfalls, stated precisely

### `limit` is silently clamped

`?limit=500` returns 250 products with HTTP 200, not an error. Leaving `limit` off returns 30. If your loop assumes "I asked for 500, so fewer than 500 means the last page", it stops after page one. Always stop on an empty page, never on a short one.

### The 25,000-product cap

On a store with a very large catalog, the last accepted request was `limit=250&page=100`. `page=101` returned:

```
HTTP 400
{"errors":"Page * Limit exceeds the 25000 limit."}
```

The same cap applied with `limit=100` (page 250 was the last accepted page). It's based on offset, so a smaller page size doesn't buy you more products. It only costs you more requests. To go past it, split the catalog by collection. List collections with `/collections.json?limit=250` and page through each one at `/collections/{handle}/products.json`. You page through each collection separately, so as long as no single collection holds more than 25,000 products, this covers the catalog. Deduplicate by product `id`, because a product can belong to several collections.

### `products_count` doesn't match what you get

`/collections.json` reports a `products_count` per collection. In testing, one collection reported 107 while its `products.json` returned 43. Count the products you actually receive and don't trust that field.

### Stock numbers are store-dependent

The list endpoint only gives a boolean `available` per variant. The single-product endpoints give more:

- `/products/{handle}.json` returns a much richer variant object. On one store it included `inventory_quantity`. On another it didn't.
- `/products/{handle}.js` returns the storefront theme's JSON, including `price_min`, `price_max` and `price_varies`. Its prices are integers in cents.

Treat `inventory_quantity` as a bonus field when it's present. It won't always be there.

### Blocked stores, 403s and throttling

Some stores sit behind a WAF or CDN rule that returns 403 to non-browser clients. Password-protected stores and non-Shopify sites fail as well. Some sites also serve HTML instead of JSON, so check the content type before you parse. If a store starts answering 429, slow down. The script waits and retries the same page.

### CORS

`/products.json` answers with `Access-Control-Allow-Origin: *` on open stores, so browser JavaScript can read it directly. That's what makes an in-browser tool possible.

## Do it without code

To check whether a store leaves `/products.json` open, and to see what's in it, paste the domain into the free [Shopify store products tool](https://datatooly.xyz/shopify-store-products/). It's a **live** tool: it fetches the store's real `/products.json` from your browser and previews the first page with titles, vendors, types, prices and stock status. It tells you plainly when a store is blocked. There's no app, login or key.

## At scale

The script above gives you one catalog, once. Competitor monitoring means running it on a schedule across many stores and diffing each run against the last. You'd flag variant price changes, new product IDs and `available` flips, and fall back to the sitemap when `/products.json` is blocked. For that I built the [Shopify Store Intelligence actor](https://apify.com/constructive_calm/shopify-store-intel?fpr=v77kxu) on Apify. It has catalog-snapshot, new-launch, price-change and stock-signal modes and an AI store audit, and exports JSON or CSV. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly tool and the Apify actor. The endpoint behavior and the script above work without either.*

## FAQ

### What is the maximum `limit` for Shopify `products.json`?

250 products per request. Higher values are clamped to 250 without an error, and leaving `limit` off returns 30.

### How do I know I've reached the last page?

The response is `{"products":[]}`. There's no total-count header and no next-page link on the storefront endpoint, so an empty array is the only reliable stop signal.

### Why do I get HTTP 400 "Page * Limit exceeds the 25000 limit"?

The storefront endpoint won't page past an offset of 25,000 products. Page through `/collections/{handle}/products.json` for each collection instead, and deduplicate by product `id`.

### Is `page` deprecated for `products.json`?

Not on the public storefront endpoint, where numbered pages still work. The deprecation you've read about applies to the authenticated Admin REST API, which uses cursor-based `page_info` pagination.

### Can I get inventory quantities from `products.json`?

The list endpoint only returns a boolean `available` per variant. Some stores expose `inventory_quantity` on `/products/{handle}.json` or `.js`, but many don't, so treat it as optional.

### Why does `products.json` return 403 for some stores?

The store blocks non-browser clients with a WAF or CDN rule, or is password-protected. The endpoint may still exist, but you can't reach it from that client without a different route, such as the store's sitemap.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
