# How to Extract Saudi Arabia Property Data from 4 Listing Portals

> A practical guide to collecting Saudi Arabia property data from the major portals, including the REGA license trick that dedupes listings across platforms.

- URL: https://datatooly.xyz/guides/saudi-arabia-property-data/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-30
- Updated: 2026-09-29
- Free tool: [Saudi real-estate listings — search & export](https://datatooly.xyz/saudi-real-estate-search/)
- Tags: webscraping, datascience, api, realestate

If you have ever tried to assemble a clean dataset of **Saudi Arabia property data**, you already know the pain: the same villa in Riyadh shows up on Bayut.sa, on PropertyFinder.sa, and on Aqar.fm — three different listing IDs, three slightly different prices, three different agents. Naively concatenate them and your "market" is 30–40% duplicates. This post walks through how the Saudi portals actually expose their data, and the one field that quietly solves the deduplication problem: the REGA advertisement license number.

I have spent a fair amount of time poking at these portals, so the goal here is to give you the honest, verified mechanics — not a fantasy where everything is a tidy public REST API.

## The four portals that matter

For practical coverage of the Kingdom, four sites carry the bulk of supply:

- **Bayut.sa** — the dubizzle/Bayut group's Saudi portal, English + Arabic.
- **Wasalt.sa** — owned by the Public Investment Fund (PIF), strong on sale and off-plan inventory.
- **Aqar.fm** (`sa.aqar.fm`) — one of the highest-traffic portals in the Kingdom, Arabic-only, very deep on local supply.
- **PropertyFinder.sa** — the Saudi arm of Property Finder, English-first, strong agent coverage.

Each one carries the same core fields per listing: **price, area (m²), location, bedrooms/bathrooms, property type, listing purpose (sale / rent / off-plan), and the listing agent or brokerage.** That overlap is exactly what makes cross-portal joins both necessary and possible.

## How the listings are actually delivered

Here is the first thing worth internalizing: these are modern JavaScript front-ends, but **you usually do not need a headless browser to read a listing.**

Several of these portals are built as Next.js-style applications. When a Next.js page renders on the server, the framework serializes the props used for rendering into an embedded JSON blob — the `__NEXT_DATA__` script tag — so React can hydrate on the client. Per Next.js's own maintainers, this tag is not removable, and "the data contained in there should be what is already presented to your user." Translation for our purposes: the listing data that paints the page is sitting right there in the initial HTML response as structured JSON.

That means a plain HTTP GET, plus a parse of the embedded JSON, often gets you a fully structured listing object — price, beds, baths, geo, agent — without spinning up Playwright. (Some portals use a differently named state object or an embedded data-island instead of `__NEXT_DATA__`, so always inspect the actual HTML before assuming a selector.)

## The REGA join key — the part most people miss

Saudi Arabia regulates real-estate advertising through the **Real Estate General Authority (REGA)**. Under the brokerage regulations, you cannot legally advertise a property without a **real-estate advertisement license**, and the license number plus its expiry must be displayed on the advertisement. REGA even runs a public **Advertisement License Inquiry** service so anyone can check a license number's status — active, expired, or cancelled.

The downstream consequence is the useful part. Because the *property* (via its brokerage contract) gets a REGA advertisement license, and that number must be shown on the ad, **the same property advertised on Bayut.sa and PropertyFinder.sa carries the same REGA license number on both.** That makes the REGA advertisement number an excellent **cross-portal join key** for deduplication — far more reliable than fuzzy-matching on price-and-address, which breaks the moment one agent rounds the price or writes "Al Malqa" instead of "Al-Malqa".

A few honest caveats:

- Not every portal exposes the number with equal prominence. The Next.js-rendered portals (Bayut, PropertyFinder, Wasalt) tend to surface it cleanly; Aqar.fm is more variable, so treat REGA-on-Aqar as best-effort and keep a fuzzy fallback.
- A single brokerage contract with a "marketing" scope can cover an advertisement, so in rare cases one license maps to a small bundle rather than exactly one unit. Use it as a strong signal, not an infallible primary key.

## A runnable extraction sketch

Here is a self-contained Node.js (18+) example showing the pattern: fetch a page, pull the embedded JSON, normalize to a common shape, and dedupe by REGA number. The selector and JSON paths are intentionally generic — you adapt them to whatever each portal actually emits — but the structure is exactly what you'd ship.

```js
// node >=18, ESM. npm i cheerio
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Pull the embedded Next.js JSON island from a listing/search page.
async function fetchEmbeddedJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Next.js serializes render props here. Some portals use a
  // differently-named tag, so inspect the HTML and adjust.
  const raw = $("#__NEXT_DATA__").contents().text();
  if (!raw) return null;
  return JSON.parse(raw);
}

// Map a portal-specific listing object onto one canonical shape.
function normalize(portal, l) {
  return {
    portal,
    sourceId: l.id ?? l.listingId ?? null,
    rega: (l.permitNumber ?? l.licenseNumber ?? l.regaAdNumber ?? "")
      .toString()
      .trim(),
    purpose: l.purpose ?? l.category ?? null, // sale | rent | off-plan
    type: l.propertyType ?? null,             // villa, apartment, ...
    price: l.price ?? null,
    areaSqm: l.area ?? l.builtUpArea ?? null,
    beds: l.bedrooms ?? null,
    baths: l.bathrooms ?? null,
    city: l.location?.city ?? null,
    district: l.location?.district ?? null,
    agent: l.agent?.name ?? l.contactName ?? null,
  };
}

// Dedupe across portals using the REGA advertisement number.
function dedupeByRega(rows) {
  const byRega = new Map();
  const noKey = [];
  for (const r of rows) {
    if (!r.rega) {
      noKey.push(r); // fall back to fuzzy matching downstream
      continue;
    }
    const seen = byRega.get(r.rega);
    if (!seen) {
      byRega.set(r.rega, { ...r, seenOn: [r.portal] });
    } else {
      seen.seenOn.push(r.portal);
      // Keep the richest record; here we prefer a non-null price.
      if (seen.price == null && r.price != null) seen.price = r.price;
    }
  }
  return { merged: [...byRega.values()], unmatched: noKey };
}

// --- usage sketch ---
const data = await fetchEmbeddedJson("https://www.example-portal.sa/search");
const listings = data?.props?.pageProps?.listings ?? []; // adapt this path
const rows = listings.map((l) => normalize("examplePortal", l));
const { merged, unmatched } = dedupeByRega(rows);
console.log(`merged=${merged.length} unmatched=${unmatched.length}`);
```

The shape of `data.props.pageProps` differs per portal — that path is the single thing you'll spend the most time pinning down. Once you have it, the `normalize → dedupeByRega` pipeline is portable across all four sites.

## Practical notes from the trenches

- **Be polite.** Throttle, set a real User-Agent, and respect each site's terms. These portals will rate-limit aggressive clients, and Aqar.fm in particular reacts to bursty traffic.
- **Proxies matter for scale.** A single datacenter IP is fine for prototyping; for any real volume you'll want rotating (ideally residential) IPs.
- **Normalize early.** Arabic district names have multiple romanizations — store the original Arabic string and a slugified key, and never join on the display name.
- **Treat REGA as a strong signal, not gospel.** Join on it first, then fuzzy-match the remainder on `(city, district, price-bucket, beds, areaSqm)`.

## If you'd rather not build the plumbing

I build data tools, so two honest plugs. To sketch a query — pick the platform, the listing type, and preview the output field shape before you write any code — I made a free query-builder at **[datatooly.xyz/saudi-real-estate-search](https://datatooly.xyz/saudi-real-estate-search/)**. It's a builder, not a live in-browser scraper, so it won't return listings itself.

When you want the data flowing, the **[Saudi Real Estate Scraper](https://apify.com/constructive_calm/saudi-real-estate-scraper?fpr=v77kxu)** on Apify handles the multi-portal fetch and the embedded-JSON parsing for you, and returns the REGA license number as its own field so you can run the dedup above — free to start, then pay-as-you-go.

*Disclosure: I built both the query-builder and the Apify actor linked above.*

The takeaway, tool or no tool: in Saudi Arabia, the regulator handed you a free primary key. Use the REGA advertisement license number and your cross-portal dataset gets dramatically cleaner.

## Related guides

- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
