# See any Shopify store's products — live, free, no app

> Every Shopify store exposes a public /products.json endpoint that returns its catalog — titles, vendors, types, variants, prices, and stock — as JSON, with no API key. This free tool fetches that endpoint live in your browser (CORS is open, ACAO:*) for the ~70-80% of stores that allow it. WAF-protected brands like Gymshark return 403 in-browser; the backing Apify actor reaches those server-side via sitemap fallback and residential proxy.

- Type: Live tool (fetches real data in your browser)
- Category: [E-commerce Intelligence](https://datatooly.xyz/category/ecommerce-intelligence/)
- URL: https://datatooly.xyz/shopify-store-products/
- Backing Apify actor: [shopify-store-intel](https://apify.com/constructive_calm/shopify-store-intel?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Shopify products.json Pagination: 250 Limit and the 25,000 Cap](https://datatooly.xyz/guides/shopify-products-json-pagination/)

Enter a Shopify store domain and pull its live product catalog right in your browser — title, vendor, type, price, and stock status, straight from the store's public feed. Free, no login, no API key.

## Key takeaways

- Append /products.json to any Shopify domain (e.g. allbirds.com/products.json) to get its public product catalog as JSON — no key, no login.
- The tool fetches the endpoint live in YOUR browser because Shopify serves /products.json with an open CORS header (Access-Control-Allow-Origin: *) — verified, not a sample.
- Each product carries id, title, handle, vendor, product_type, tags, images, options, and a variants array; price, available, sku, and compare_at_price live on each variant, not the product.
- ~70-80% of Shopify stores expose /products.json; big brands behind a WAF (e.g. Gymshark) return 403 in-browser. The tool says so and suggests known-good demo stores.
- The endpoint returns up to 250 products per page; paginate with ?limit=250&page=2 to read larger catalogs.
- For WAF-blocked stores and continuous monitoring, the Shopify Store Intelligence Apify actor (free to start, then pay-as-you-go) falls back to sitemap + residential proxy server-side and adds price-change, stock-signal, and new-launch detection.

## How it works

### 1. Real products, live in the browser

Most Shopify stores expose a public /products.json endpoint by default (CORS-open). This tool reads it directly — title, vendor, product type, price, and availability come straight from the store, live, not a sample.

### 2. The honest coverage caveat

Around 70-80% of Shopify stores expose /products.json. Big brands behind a WAF (Gymshark-tier) return 403 to a browser — the tool tells you when that happens. The actor handles those server-side with a sitemap + residential-proxy fallback.

### 3. Monitor catalogs + prices at scale

The Shopify Store Intelligence actor scans many stores at once and adds variant-level price-change deltas, new-launch detection, stock signals with true inventory levels, and an AI store-audit (niche, buyer persona, price tier) — exported as JSON/CSV/API.

## How to use it

1. **Enter a Shopify store domain** — Type a store's domain into the tool — for example allbirds.com or kith.com. You do not need an API key, an account, or the Shopify app. The tool normalizes the URL and targets the public /products.json endpoint.
2. **Let the tool fetch /products.json live in your browser** — Shopify serves /products.json with an open CORS header (Access-Control-Allow-Origin: *), so the fetch happens directly in your browser against the real store. Results are live, not a stored sample.
3. **Read the real products, variants, and prices** — Review each product's title, vendor, product_type, and tags, then expand the variants array to see per-size or per-color price, compare_at_price, sku, and the available flag for stock status.
4. **Handle a 403 (WAF-protected store)** — If the store sits behind a firewall, the fetch returns 403 and the tool says so plainly, offering known-good demo stores. To reach blocked brands, switch to the Apify actor, which uses a sitemap fallback and residential proxy server-side.
5. **Scale to monitoring with the Apify actor** — For multi-store snapshots, full pagination beyond 250 products, and scheduled price_changes, new_launches, or stock_signals detection, run the Shopify Store Intelligence actor (free to start, then pay-as-you-go) and export to CSV, JSON, or API.

## Ready-to-run actor input

```json
{
  "mode": "catalog_snapshot",
  "maxProductsPerStore": 500
}
```

## Key facts

- allbirds.com/products.json returned a valid JSON object with a products array containing id, title, handle, body_html, vendor, product_type, tags, variants, images, and options on each product. (Source: Live fetch of https://www.allbirds.com/products.json?limit=3 performed during research on 2026-06-01.)
- The storefront /products.json endpoint returns a maximum of 250 products per page and defaults to roughly 30 when no limit is set. (Source: Shopify Community pagination threads and developer guides reviewed June 2026; consistent across multiple sources.)
- Price, available, sku, and compare_at_price are stored on each variant object, not at the product level — so a product's effective price comes from its variants array. (Source: Confirmed by live allbirds.com structure plus Shopify dev docs on Product and ProductVariant objects.)
- Roughly 70-80% of Shopify stores expose /products.json openly; the remainder sit behind a WAF (e.g. Gymshark) and return 403 in-browser to non-authenticated requests. (Source: Operator estimate from the tool author (Omar Eldeeb / constructive_calm); WAF 403 behavior corroborated by Shopify Web Bot Auth and 403-troubleshooting articles, June 2026.)
- Courts in the hiQ Labs v. LinkedIn line have held that scraping publicly available data does not, by itself, violate the U.S. Computer Fraud and Abuse Act. (Source: Widely cited 2022 hiQ v. LinkedIn precedent; legal-compliance summaries reviewed June 2026. Not legal advice.)

## FAQ

### What is the Shopify products.json endpoint?

It is a public JSON feed every Shopify storefront exposes at /products.json (e.g. allbirds.com/products.json). It returns the store's products with id, title, handle, vendor, product_type, tags, images, options, and a variants array carrying price, available, sku, and compare_at_price. No API key or login is required because it serves the same public catalog shoppers already see. It is read-only and does not expose customer, order, or draft data.

### How do I view a Shopify store's products for free?

Enter the store's domain into this tool (or simply append /products.json to its URL in any browser). The tool fetches the endpoint live and renders real products — title, vendor, type, variant prices, and availability. This works for the roughly 70-80% of Shopify stores that leave the endpoint open. It is a genuinely live fetch, not a cached sample. Stores behind a web application firewall return 403; the tool detects that and suggests known-good demo stores.

### Why does products.json return a 403 or fail for some stores?

Roughly 20-30% of Shopify stores sit behind a web application firewall (often Cloudflare-based bot protection). A browser request without bot-auth credentials looks like a scraper, so the WAF returns 403 Forbidden. Big brands such as Gymshark do this. The endpoint is not gone — it is gatekept. This tool reports the 403 honestly; the backing Apify actor reaches such stores server-side using a sitemap fallback and Apify residential proxy rotation.

### How many products does products.json return at once?

The endpoint returns up to 250 products per page and defaults to roughly 30 if you do not set a limit. To read a full catalog, paginate with ?limit=250&page=2, ?limit=250&page=3, and so on until a page comes back empty. Note that the storefront /products.json uses simple page numbering; Shopify's authenticated Admin REST API uses cursor (page_info) pagination instead. This tool and the actor handle paging for you.

### What fields can I extract from products.json?

At the product level: id, title, handle, body_html (description), published_at, created_at, updated_at, vendor, product_type, tags, images, and options. At the variant level (inside the variants array): title, price, compare_at_price, sku, available, and option1/option2/option3 for size, color, or material. There is no single product-level price — price and stock live on each variant, so a product with five sizes has five variant rows.

### Is scraping a Shopify store's products.json legal?

The data — product names, prices, descriptions — is public information shown to every visitor. In the hiQ Labs v. LinkedIn line of cases, U.S. courts generally found that scraping publicly available data does not, by itself, violate the Computer Fraud and Abuse Act — though this is evolving case law, not blanket permission. That said, Shopify's Terms of Service discourage automated access, and individual store owners can still object. Best practice: respect robots.txt, rate-limit, identify your user agent, and consult counsel for large-scale commercial use. This tool surfaces public catalog data only.

### How do I monitor a competitor's Shopify prices and new launches?

Snapshot the store's /products.json on a schedule and diff consecutive runs: a changed variant price is a price move, a new product id is a launch, and an available flag flipping to false is a stockout. The Shopify Store Intelligence Apify actor automates this with dedicated modes — price_changes (variant deltas), new_launches, and stock_signals — using KV-checkpointed change detection so each run compares against the last. It is free to start, then pay-as-you-go.

### What does the Shopify Store Intelligence actor add over the free tool?

The free tool reads one open store's /products.json in your browser. The Apify actor (free to start, then pay-as-you-go) adds five modes — catalog_snapshot, new_launches, price_changes, stock_signals, and store_audit with AI niche classification — across multiple stores at once. It does a deep inventory probe, reaches WAF-blocked stores via sitemap plus residential proxy server-side, checkpoints changes between runs, and exports to CSV, JSON, or API.

### Can I get the full catalog of a store with thousands of products?

Yes, by paginating. /products.json caps each page at 250 products, so a 4,000-product store needs about 16 sequential requests (?limit=250&page=1 through page=16). Doing this rapidly from one IP can trigger Shopify rate limiting (HTTP 429/430). The Apify actor spaces requests, rotates residential proxies, and falls back to the sitemap when /products.json is throttled or blocked, so large catalogs come back complete without manual paging.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [Hacker News search](https://datatooly.xyz/hacker-news-search/)
- [App Store top charts](https://datatooly.xyz/app-store-top-charts/)
- [SaaS pricing tracker](https://datatooly.xyz/saas-pricing-tracker-tool/)
