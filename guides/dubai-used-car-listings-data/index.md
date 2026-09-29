# How to Extract Dubai Used Car Listings Data from Gulf Marketplaces

> A practical, honest guide to extracting Dubai used car listings data from DubiCars, YallaMotor, and Dubizzle Motors using JSON-LD and embedded __NEXT_DATA__.

- URL: https://datatooly.xyz/guides/dubai-used-car-listings-data/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-30
- Updated: 2026-06-30
- Free tool: [Gulf used-car listings — search & export](https://datatooly.xyz/gulf-used-car-search/)
- Tags: webscraping, datascience, api, automotive

If you need **Dubai used car listings data** — make, model, year, price, mileage, location, and dealer for thousands of vehicles — the good news is that the major Gulf marketplaces are far friendlier to extraction than most modern web apps. The listings render server-side, and the detail pages carry structured data you can parse without a headless browser. This post walks through the actual shape of that data on DubiCars and Dubizzle Motors, with a runnable example you can adapt today.

I've spent time poking at all three. Here's what's true, what's easy, and where you'll hit a wall.

## The landscape: three platforms, three data shapes

The UAE used-car market is concentrated across a few portals:

- **DubiCars** — the UAE's largest dedicated auto portal, with tens of thousands of used listings live at any time. Listings render server-side, and individual car pages live at predictable URLs like `https://www.dubicars.com/2024-toyota-prado-vxr-<id>.html`.
- **Dubizzle Motors** — the general-classifieds giant, with tens of thousands of used cars in the UAE. It's a Next.js application, which (as we'll see) is both a gift and a headache.

(YallaMotor is another large regional portal worth knowing about, though we'll focus on DubiCars and Dubizzle here since their extraction patterns cover the two dominant approaches.)

The thing that makes Gulf marketplaces pleasant to work with is that they're SEO-driven. These sites *want* Google to read their inventory, so they expose it server-side and they annotate it. That's exactly the data you want.

## Why JSON-LD is your best friend

Dealerships and marketplaces embed [Schema.org](https://schema.org/Car) structured data in their pages so search engines (and increasingly AI search systems) can render rich results — price, mileage, availability, the works. The [`Vehicle`/`Car`](https://schema.org/docs/automotive.html) and `Product` types cover make, model, model year, mileage (`mileageFromOdometer`), fuel type, transmission, body type, VIN, and price.

For the data extractor, this is a free lunch. Instead of writing brittle CSS selectors against a layout that changes every quarter, you read a `<script type="application/ld+json">` block that the site maintains *for its own SEO*. It's the most stable surface on the page.

On DubiCars, the listing grid renders server-side — results are visible in raw HTML without executing a line of JavaScript (paginated, so you page through them) — and detail pages carry JSON-LD plus a clean field set: price (shown in AED with an optional USD toggle), year, mileage in km, location (emirate), regional spec (GCC / Japanese / American / Other — a DubiCars-specific field on the page, not a standard schema.org property), and dealer name with a link to the dealer profile.

## A runnable example

Here's a self-contained Node.js script (Node 18+, native `fetch`, no dependencies) that fetches a DubiCars-style detail page and extracts vehicle fields from its JSON-LD. It safely handles both a single object and the `@graph` array form, and it normalizes the fields you actually care about.

```javascript
// extract-vehicle.mjs — Node 18+ (native fetch, no deps)

/** Pull every application/ld+json block out of raw HTML. */
function extractJsonLdBlocks(html) {
  const blocks = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      // Skip malformed blocks rather than crashing the run.
    }
  }
  return blocks;
}

/** Flatten @graph and arrays into a flat list of typed nodes. */
function flattenNodes(blocks) {
  const out = [];
  for (const b of blocks) {
    if (Array.isArray(b)) out.push(...b);
    else if (Array.isArray(b['@graph'])) out.push(...b['@graph']);
    else out.push(b);
  }
  return out;
}

function isVehicleNode(node) {
  const t = node && node['@type'];
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) =>
    ['Car', 'Vehicle', 'Product'].includes(x)
  );
}

function normalize(node) {
  const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  const odo = node.mileageFromOdometer || {};
  return {
    title: node.name ?? null,
    make: node.brand?.name ?? node.manufacturer?.name ?? null,
    model: node.model ?? null,
    year: node.vehicleModelDate ?? node.productionDate ?? null,
    price: offer?.price ?? null,
    currency: offer?.priceCurrency ?? null,
    mileage: odo.value ?? null,
    mileageUnit: odo.unitCode ?? odo.unitText ?? null,
    fuelType: node.fuelType ?? null,
    transmission: node.vehicleTransmission ?? null,
    bodyType: node.bodyType ?? null,
    vin: node.vehicleIdentificationNumber ?? null,
    url: node.url ?? offer?.url ?? null,
  };
}

async function extractVehicle(url) {
  const res = await fetch(url, {
    headers: {
      // A realistic UA reduces the odds of an interstitial.
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const nodes = flattenNodes(extractJsonLdBlocks(html));
  const vehicle = nodes.find(isVehicleNode);
  if (!vehicle) {
    throw new Error('No Vehicle/Car/Product JSON-LD found on page.');
  }
  return normalize(vehicle);
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: node extract-vehicle.mjs <listing-url>');
  process.exit(1);
}
extractVehicle(target)
  .then((v) => console.log(JSON.stringify(v, null, 2)))
  .catch((e) => {
    console.error('Extraction failed:', e.message);
    process.exit(1);
  });
```

Run it against a detail URL and you get a clean object. The pattern is deliberately defensive: malformed JSON-LD blocks are skipped, both `@graph` and bare-object forms are handled, and missing fields come back as `null` instead of throwing. That matters at scale, because no marketplace annotates every listing identically.

## When there's no JSON-LD: read the embedded state

Dubizzle Motors is a Next.js app. Next.js apps serialize their server-fetched data into a `<script id="__NEXT_DATA__" type="application/json">` block at the bottom of the HTML — the same data the React app hydrates from. For listing and search pages, that JSON often contains the full result set (and frequently more fields than the visible card shows). The extraction approach is identical to the JSON-LD one: grab the block, `JSON.parse` it, then walk `props.pageProps` to find the listings array.

```javascript
function extractNextData(html) {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  return m ? JSON.parse(m[1]) : null;
}
```

The honest catch: **Dubizzle sits behind a WAF.** Plain datacenter requests get challenged or blocked, and naive `fetch` calls are often detected by their TLS fingerprint, headers notwithstanding. Reaching it reliably needs a request library that mimics a real browser's TLS handshake plus residential or well-rotated proxies, and a respectful crawl rate. DubiCars is far more forgiving — start there if you're learning.

A few ground rules regardless of platform: keep concurrency low, cache pages you've already fetched, identify yourself honestly in your User-Agent where reasonable, and check each site's terms before you collect at volume.

## If you'd rather not maintain the plumbing

Selector drift, WAF challenges, proxy rotation, and bilingual (English/Arabic) field normalization add up. If you just want the data, I built two things to skip the maintenance:

- A free **[Gulf Used Car query builder](https://datatooly.xyz/gulf-used-car-search/)** that lets you pick a platform and preview the output shape before you commit to anything. (It's a query/preview builder — it doesn't scrape live in your browser.)
- The **[Gulf Used Car Scraper](https://apify.com/constructive_calm/gulf-used-car-scraper?fpr=v77kxu)** on Apify, which handles DubiCars and Dubizzle Motors end to end — JSON-LD parsing, `__NEXT_DATA__` extraction, the WAF handling, and normalized output. It's free to start, then pay-as-you-go.

*Disclosure: I build and maintain both tools, and the Apify link is an affiliate link.*

## Wrapping up

The reason **Dubai used car listings data** is approachable comes down to one thing: these marketplaces publish structured data on purpose. Read the JSON-LD when it's there, fall back to `__NEXT_DATA__` when it isn't, write defensive parsers that tolerate missing fields, and treat Dubizzle's WAF with respect. Start with the runnable script above against DubiCars, and you'll have normalized listings flowing in an afternoon.

## Related guides

- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
