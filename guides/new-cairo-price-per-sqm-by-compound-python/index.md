# Price per sqm by Compound in New Cairo: Compute It with Python

> Stop trusting broker blogs: compute New Cairo apartment price per square meter by compound from live Property Finder Egypt listings, split ready vs off-plan.

- URL: https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Egypt real-estate listings — search & export](https://datatooly.xyz/egypt-real-estate-search/)
- Tags: python, webscraping, realestate, pandas

To get New Cairo price per square meter by compound, compute it from live listings instead of trusting a blog figure. Property Finder Egypt's search pages embed each listing's price, size, compound and completion status in `__NEXT_DATA__` JSON. Fetch a few pages, divide price by size, and take the median per compound, keeping ready and off-plan units separate.

Search for "New Cairo price per square meter" and you'll find developer and broker pages quoting ranges that disagree widely. They're usually not wrong so much as mixed: ready units with off-plan launches, cash prices with installment prices, prime compounds with side streets. When you compute the figure yourself, you control every one of those choices.

## The source: Property Finder Egypt's embedded JSON

Property Finder Egypt is a Next.js site. Its search pages ship the full result set as JSON inside `<script id="__NEXT_DATA__">`, so one HTTP GET returns structured data. You don't need a headless browser. The listings are at `props.pageProps.searchResult.listings`, and the page metadata (`total_count`, `page`, `per_page`) is at `searchResult.meta`.

Location lives in the URL. The New Cairo apartments-for-sale page is:

```
https://www.propertyfinder.eg/en/buy/cairo/apartments-for-sale-new-cairo-city.html
```

When I fetched it on 29 September 2026, `meta.total_count` reported 28,312 listings. Pagination is a plain `?page=2`.

Limits to keep in mind: these are **asking** prices, not transaction prices; the JSON shape is undocumented and changed at least once this year; and scraping at volume raises rate limits and terms-of-service questions. Throttle your requests and keep the page count modest.

## Runnable Python

This script needs `requests` and `pandas`.

```python
import json
import re
import time
import requests
import pandas as pd

BASE = "https://www.propertyfinder.eg/en/buy/cairo/apartments-for-sale-new-cairo-city.html"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}
NEXT_DATA = re.compile(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', re.S)


def fetch_page(page: int) -> list[dict]:
    url = BASE if page == 1 else f"{BASE}?page={page}"
    html = requests.get(url, headers=HEADERS, timeout=30).text
    m = NEXT_DATA.search(html)
    if not m:
        raise RuntimeError(f"No __NEXT_DATA__ on page {page} (blocked or layout change)")
    result = json.loads(m.group(1))["props"]["pageProps"]["searchResult"]
    rows = []
    for item in result["listings"]:
        if item.get("listing_type") != "property":
            continue  # skip project cards, project units and carousels
        p = item["property"]
        loc = p.get("location") or {}
        price = (p.get("price") or {}).get("value")
        size = (p.get("size") or {}).get("value")
        rows.append({
            "id": p["id"],
            "compound": loc.get("name") if loc.get("type") == "COMPOUND" else None,
            "area_path": loc.get("path_name"),
            "status": p.get("completion_status"),  # completed / off_plan / *_primary
            "bedrooms": p.get("bedrooms"),          # a string: "2", "3", "studio"
            "price_egp": price,
            "size_sqm": size,
            "payment": ",".join(p.get("payment_method") or []),
            "listed": p.get("listed_date"),
        })
    return rows


rows = []
for page in range(1, 6):  # 5 pages is a demo; each page has ~20 organic listings
    rows += fetch_page(page)
    time.sleep(1.5)

df = pd.DataFrame(rows).drop_duplicates("id")
df = df[df.price_egp.notna() & (df.size_sqm > 20)]
df["egp_per_sqm"] = (df.price_egp / df.size_sqm).round()
df["ready"] = df.status.str.startswith("completed")
df.to_csv("new_cairo_listings.csv", index=False)

by_compound = (
    df.dropna(subset=["compound"])
      .groupby(["compound", "ready"])
      .egp_per_sqm.agg(["count", "median"])
      .query("count >= 3")  # a median of 1-2 asking prices is noise
      .sort_values("median", ascending=False)
)
print(len(df), "listings;", df.compound.notna().sum(), "with a compound")
print(by_compound.head(10).to_string())
```

I ran it three times on 29 September 2026. Each run produced about 90 unique listings, of which roughly half were tagged to a named compound, and printed a table of compounds with a listing count and a median EGP per sqm. I'm not reproducing those figures here on purpose: five pages is a demo sample, not a market statistic. Raise the page count, run it on a schedule, and build your own history.

The script deliberately leaves out agent names and phone numbers, even though the JSON contains them. Leave them out unless you have a lawful reason to process personal contact data.

## Field reference (inside each `property` object)

| JSON path | Example | Notes |
|---|---|---|
| `price.value` | `13351800` | EGP integer. Also check `price.is_hidden` |
| `size.value` | `134` | With `size.unit` = `"sqm"` |
| `price_per_area.price` | `99640` | Property Finder's own figure. Recompute it anyway |
| `location.type` / `location.name` | `"COMPOUND"`, `"Mivida"` | The name is a compound only when the type is `COMPOUND` |
| `location.path_name` | `"Cairo, New Cairo City, The 5th Settlement, ..."` | Comma-separated hierarchy |
| `completion_status` | `completed`, `completed_primary`, `off_plan`, `off_plan_primary` | `primary` = sold by the developer |
| `payment_method` | `["cash", "installments"]` | A list |
| `down_payment_price` | `3337950` or `null` | Present on many installment listings |
| `bedrooms` / `bathrooms` | `"3"`, `"studio"` | Strings, not integers |
| `furnished` | `"NO"`, `"PARTLY"`, `"YES"` | Uppercase strings |
| `listed_date` | `"2026-09-27T19:44:38Z"` | ISO timestamp |

## Pitfalls

1. **Not everything in `listings` is a listing.** Each page mixes `property` items with `project`, `project_unit` and carousel entries. When I checked, about 20 of the 30 items per page were organic properties. Filter on `listing_type == "property"`.
2. **Pages overlap.** Five pages of 20 gave me 100 rows but only 92 unique IDs, because ranking shifts while you paginate. Always dedupe on `id`.
3. **"Compound" is often missing.** Listings pinned to a street or sub-district (`location.type` of `STREET`, `SUBDISTRICT` and so on) have no compound name. About half of my sample did. Don't fill the gap by guessing from the title.
4. **Ready and off-plan are different markets.** Developer off-plan launches (`off_plan_primary`) are often sold on installment plans, and a price payable over years isn't comparable to a cash price for a finished resale unit. Group by `completion_status` (or at least ready vs off-plan) before comparing.
5. **Types will trip up your casting.** `bedrooms` includes `"studio"`, so `int()` fails on it. Cast with care and map `studio` to 0 if you need a number.
6. **Sanity-filter sizes.** Advertised areas are typed in by agents, so guard against placeholders and typos. The `size_sqm > 20` guard and a minimum-count threshold per compound keep one bad row from becoming a "median".
7. **Asking isn't selling.** Everything here is advertised prices. Treat the result as an asking-price index.

## Aqarmap and Dubizzle

Egypt's other two big portals behave differently. Aqarmap's search pages carry a schema.org `ItemList` of `RealEstateListing` objects in JSON-LD, but each one has only the name, URL and price. Area and bedrooms require the detail page. Dubizzle Egypt is the heaviest of the three to extract. Covering all three portals with one normalized schema is the job the actor below does.

## Do it without code

The free [Egypt real estate query builder](https://datatooly.xyz/egypt-real-estate-search/) lets you pick platforms (Aqarmap, Property Finder, Dubizzle), sale or rent, a location such as New Cairo, Sheikh Zayed or the North Coast, and a listing cap. It then generates a ready-to-run input and shows a fixed example of the output shape. It is a query builder and doesn't fetch live listings in your browser.

## At scale

The [Egyptian Real Estate Scraper on Apify](https://apify.com/constructive_calm/egypt-real-estate-scraper?fpr=v77kxu) pulls Aqarmap, Property Finder and Dubizzle into one normalized dataset, with `priceEGP`, `areaSqm`, `pricePerSqm`, `compound`, `district`, GPS where the portal has it, and payment-plan fields. It supports up to 5,000 listings per platform, optional change detection between runs, and export to CSV, JSON or Excel. It's free to start, then pay-as-you-go per listing.

*Disclosure: I built the query builder and the actor. The script above works on its own.*

## FAQ

### What is the average price per square meter in New Cairo?

It depends on the compound, on ready vs off-plan, and on cash vs installments, which is why published figures disagree. Compute a median per compound from current listings with the script above, and label the result as an asking-price figure with its date and sample size.

### Does Property Finder Egypt have a public API?

It has no public listings API for this. The search pages embed their data in `__NEXT_DATA__` JSON, which is what the script reads. The shape is undocumented and can change, so fail loudly when the path isn't found.

### How do I get only one district or compound?

Use the location-specific search URL (for example `.../buy/cairo/apartments-for-sale-new-cairo-city.html`), then filter on `location.path_name` or on `location.name` where `location.type` is `COMPOUND`.

### Why do my numbers change between runs?

The result ranking shifts, and new listings keep arriving. The search metadata includes a `new_properties_count` that ran into the thousands when I checked. Use medians over larger samples, and track the figure over time rather than trusting one run.

### Can I export Egyptian property listings to CSV?

Yes. The script writes `new_cairo_listings.csv` directly. The Apify actor also exports its dataset as CSV, JSON or Excel.

## Related guides

- [How to Extract Saudi Arabia Property Data from 4 Listing Portals](https://datatooly.xyz/guides/saudi-arabia-property-data/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
