# The TikTok Ad Library API: A Developer's Guide to the DSA Library

> A practical, accurate guide to the TikTok ad library API: what the DSA Commercial Content Library covers, the official researcher path, and how to query it.

- URL: https://datatooly.xyz/guides/tiktok-ad-library-api/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-13
- Updated: 2026-06-13
- Free tool: [Search the TikTok Ad Library (EU/DSA)](https://datatooly.xyz/tiktok-ad-library-search/)
- Tags: api, marketing, webdev, tiktok

If you have ever tried to find a clean, documented TikTok ad library API, you have probably hit a wall of marketing pages, half-answers, and tools that promise "global TikTok ads" without telling you what is actually inside. This guide cuts through that. I will explain exactly what TikTok exposes, what it does *not*, where the data comes from, and how to query it programmatically without guessing.

The short version: there is a real, public TikTok ad transparency database, but its scope is narrower than most people assume, and there are two very different access paths with very different rules.

## What the TikTok Ad Library actually is

TikTok runs a **Commercial Content Library** at [library.tiktok.com](https://library.tiktok.com). It exists because of the EU's **Digital Services Act (DSA)**, which requires very large online platforms to keep a searchable, public archive of the advertising they serve. So this is not a marketing feature TikTok built for fun — it is a regulatory obligation.

That regulatory origin shapes everything about it, including the single most important fact you need before you write a line of code:

> **US ads are not in this library.** The Commercial Content Library covers ads shown to users in the EU/EEA, plus the UK, Switzerland, and Türkiye. It does not cover the United States, Brazil, India, Mexico, Canada, Japan, or Australia.

In practice the supported set is the 27 EU member states, the three additional EEA countries (Iceland, Liechtenstein, Norway), the UK, Switzerland, and Türkiye — 33 regions in total. If you query an unsupported country, you get an HTTP 400, not an empty result. I have seen plenty of teams burn a sprint building "US TikTok ad monitoring" on top of this data before discovering the US simply is not there. Don't be that team.

(Separately, TikTok also runs the **Creative Center**, a global "top ads" showcase at `ads.tiktok.com/business/creativecenter`. That is a curated highlight reel, often login-gated, and is a different surface from the DSA library. Keep the two straight — people conflate them constantly.)

## The two access paths

There are two ways to programmatically reach Commercial Content Library data, and confusing them is the root of most "the TikTok ad library API doesn't work" complaints.

### 1. The official Commercial Content API (gated)

TikTok publishes an official **Commercial Content API** under [developers.tiktok.com](https://developers.tiktok.com/products/commercial-content-api). It is OAuth-based and free, but it is *gated*. Per TikTok's own documentation, eligibility is limited to qualifying academic institutions and non-profit researchers in the US, EEA, UK, and Switzerland (plus certain Brazilian researchers studying youth safety). **Commercial users, creators, and advertisers are explicitly ineligible.** Approved applications get a client key and are tightly rate-limited under a non-commercial-use commitment — TikTok's Research Tools documentation cites a ceiling on the order of 1,000 requests per day, and the Commercial Content endpoints additionally cap a single call at roughly 50 ads, so high-volume pulls mean a lot of paginated calls. TikTok says you typically hear back on a Commercial Content API application within about two working days.

So if you are an academic, this is your path. If you are building anything commercial, you are not eligible — and that is by design, not an oversight.

### 2. The public library's JSON endpoints

The public-facing library at `library.tiktok.com` is a normal web app that talks to a JSON backend. Because the library itself is public to everyone regardless of location, those read endpoints are reachable without OAuth. This is the path that powers most third-party tooling for the DSA library.

I want to be precise and honest here: this is the *public* library data, the same archive any person can browse in their own browser. It is not a private feed, and it is rate-limited at scale. Below is the real request shape, which I verified directly against the live endpoints rather than copying from docs.

## A working request

The flow is: discover supported regions, then POST a search scoped to one region and a time window. Time bounds are **mandatory** and expressed in **Unix seconds**. Here is a runnable Node example (Node 18+ has `fetch` built in):

```js
const BASE = "https://library.tiktok.com";

// 1) Supported regions (cache this ~24h)
async function getRegions() {
  const res = await fetch(`${BASE}/api/v1/support-regions`);
  const json = await res.json();
  return json.region_list; // [{ region: "DE", name: "Germany" }, ...]
}

// 2) Keyword search, scoped to ONE region + a time window
async function searchAds({ query, region = "DE", days = 30 }) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 60 * 60;
  const url =
    `${BASE}/api/v1/search` +
    `?region=${region}&type=1&start_time=${start}&end_time=${end}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      query_type: "3",          // STRING. 1=All, 2=AdvName, 3=Keyword
      order: "last_shown_date,desc",
      offset: 0,
      limit: 12,                // server caps page size at 12 regardless
    }),
  });

  // Rate-limit quirk: a soft limit returns HTTP 200 with a PLAIN-TEXT
  // body ("limit exceed"), so res.ok is true but JSON.parse throws.
  const text = await res.text();
  if (/limit\s*exceed|too\s*many/i.test(text)) {
    throw new Error("rate-limited (soft 429) — back off and retry");
  }
  const json = JSON.parse(text);
  return json; // { code: 0, data: [...ads...], total, has_more, search_id }
}

(async () => {
  const data = await searchAds({ query: "skincare", region: "FR", days: 14 });
  console.log(`total=${data.total}, first page=${data.data.length}`);
})();
```

A few things that will save you hours, all learned the hard way:

- **`query_type` is a string** (`"1"`/`"2"`/`"3"`), not an integer — and several other response fields are typed as strings too, so don't assume numbers.
- **Page size is server-capped at 12**, no matter what `limit` you send. Paginate with `offset` plus the `search_id` cursor from the previous response.
- **`region=ALL` is rejected.** One ISO region code per call.
- The response is flat: `data` *is* the array of ads, and `total` / `has_more` / `search_id` sit at the top level.
- A soft rate limit returns **HTTP 200 with a plain-text body**, not JSON. Sniff the body before `JSON.parse` and treat that as a retryable 429 with exponential backoff.
- Video creative URLs are signed and expire (roughly 24h), so store a `fetched_at` timestamp next to any media URL you keep.

## What you get per ad

This is where the DSA library is genuinely interesting. Because the law mandates targeting transparency, each ad detail record exposes far more than a creative thumbnail. Across the search and per-ad detail endpoints you can assemble roughly **32 fields per ad**: the creative URLs, advertiser identity and registered business location, the sponsor/payer, first- and last-shown dates, and — the valuable part — **audience targeting and reach broken down by region, age bracket, and gender**.

That demographic breakdown is richer than the comparable Meta Ad Library, which only exposes reach and spend data for political and social-issue ads (outside the EU, where the DSA forces broader disclosure). On TikTok's DSA library, the targeting tree is available for commercial ads broadly. If you are doing competitive ad intelligence or studying how a brand splits spend across age and gender in different EU markets, that tree is the whole point.

## A faster way to explore before you build

Hand-building region codes, Unix timestamps, and `query_type` values gets tedious when you are just trying to see whether a brand or keyword has any coverage. I maintain a small free query-builder, [TikTok Ad Library Search](https://datatooly.xyz/tiktok-ad-library-search/), that lets you assemble a valid query — keywords plus one of the 33 supported regions — and preview the request you would send. To be clear about what it is: it is a **query builder and previewer**, not a live in-browser scraper, so it helps you get the parameters right before you run anything.

When you are ready to actually pull ads at volume — paginating past the 12-per-page cap, enriching each ad with its full targeting tree, and handling the soft-rate-limit and signed-URL quirks above — that is what my Apify actor, [TikTok Ad Library Pro](https://apify.com/constructive_calm/tiktok-ad-library-pro?fpr=v77kxu), automates. It takes keywords, advertiser names, or business IDs, returns the ~32-field records described above across all 33 DSA regions, and is **free to start, then pay-as-you-go** (the first chargeable events on each run are free, so you can validate it against your own use case before committing).

*Disclosure: I built both the free query-builder and the Apify actor linked above.*

## The honest bottom line

The **TikTok ad library API** is real and, for the DSA region, surprisingly rich — but it is an EU-transparency tool, not a global ad-spying firehose. Internalize three things and you will avoid every common trap: the data is **EU/EEA + UK/CH/TR only (no US)**, the **official API is gated to non-commercial researchers**, and the public library's endpoints are usable but **rate-limited and full of small typing quirks** (string enums, 12-per-page caps, plain-text rate-limit bodies, mandatory Unix-second time bounds). Build with those constraints in mind and the targeting data you get back is some of the most detailed ad transparency available anywhere.

## Related guides

- [Facebook Ad Library Scraper: API Limits and the Real Approach](https://datatooly.xyz/guides/facebook-ad-library-scraper/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
