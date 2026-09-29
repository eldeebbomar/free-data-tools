# Facebook Ad Library Scraper: API Limits and the Real Approach

> Why the official Meta Ad Library API only covers political ads, and how to build a Facebook ad library scraper for commercial competitor ads instead.

- URL: https://datatooly.xyz/guides/facebook-ad-library-scraper/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-13
- Updated: 2026-09-29
- Free tool: [Facebook Ad Library Scraper — search & export competitor ads](https://datatooly.xyz/facebook-ad-library-search/)
- Tags: webdev, api, marketing, datascience

If you want to pull a competitor's running ads programmatically, building a **Facebook ad library scraper** sounds like it should be a solved problem. Meta has a public Ad Library *and* an official API, so surely you just grab a token and query? Not quite. The gap between what the official API covers and what most people actually need is the single most expensive misunderstanding in this space, and it sends a lot of developers down a dead end on day one.

This post walks through what's real: where the data lives, exactly what the official API will and won't give you, what the data shape looks like, and what it actually takes to extract commercial ads at scale.

## Two different things: the Library vs. the API

The **Meta/Facebook Ad Library** is a public, browser-accessible database of ads. You can open `https://www.facebook.com/ads/library/`, pick a country from the dropdown, choose **"All ads"** for general commercial advertising, type in an advertiser name or keyword, and results load immediately. No login, no account required for commercial ads. For each ad you can see the creative (image, video, or carousel), the primary text and headline, the call-to-action, the advertiser's Page name, which platforms it runs on (Facebook, Instagram, Messenger, Audience Network), its start date, and active/inactive status — including the multiple variations a brand is split-testing at once. It's a genuinely rich competitive-intelligence surface.

The **Meta Ad Library API** is a separate, gated product — and this is where expectations break.

## The API only covers political and issue ads

Here's the fact that isn't obvious until you've already spent an afternoon on it: the official Ad Library API is scoped to **ads about social issues, elections, or politics**, plus ads delivered to the EU and associated territories. General **commercial / "All ads" content is not queryable through the API.** The public website lets you *browse* commercial ads; the API does not let you *pull* them.

On top of the scope limit, getting access is a process:

1. **Identity verification.** You confirm your identity and location at `facebook.com/ID`, uploading a government ID (passport, national ID, or driver's license) and confirming your country of residence. Approval typically takes one to three business days.
2. **A Meta for Developers app.** Once verified, you create an app and add the "Ad Library API" product.
3. **Tokens and permissions.** You issue an access token with the appropriate scopes (`ads_read`, and for the archive, `ads_archive`).

Worth noting for anyone targeting Europe: as of October 6, 2025, Meta no longer permits political, electoral, or social-issue ads in the EU at all. So the API's "EU-delivered ads" coverage now effectively means the historical archive of those ads — not new ones going forward.

So if your verified token *does* clear all those hoops and you're researching, say, election spending, a call looks like this:

```python
import requests

# Official Meta Ad Library API — POLITICAL / ISSUE ads ONLY.
# Commercial "All ads" are NOT available through this endpoint.
TOKEN = "YOUR_VERIFIED_ACCESS_TOKEN"

params = {
    "access_token": TOKEN,
    "search_terms": "climate",
    "ad_reached_countries": "['US']",
    "ad_type": "POLITICAL_AND_ISSUE_ADS",  # the only broadly supported type
    "ad_active_status": "ALL",
    "fields": ",".join([
        "id", "page_name", "ad_creative_bodies",
        "ad_delivery_start_time", "publisher_platforms",
        "impressions", "spend",
    ]),
    "limit": 50,
}

resp = requests.get(
    "https://graph.facebook.com/v25.0/ads_archive",  # use the current Graph API version
    params=params,
    timeout=30,
)
resp.raise_for_status()
for ad in resp.json().get("data", []):
    print(ad["id"], ad.get("page_name"), ad.get("ad_delivery_start_time"))
```

That's the entire official path — and it's a fine path for political-transparency research. But if you're doing competitor analysis, e-commerce product research, or creative inspiration, none of those ads are political, so the API returns nothing useful to you.

## The commercial use case = scraping the public Library

When people search for a "facebook ad library scraper," they almost always mean the commercial case: *"show me every active ad this brand is running, with the creatives and copy."* Since the API doesn't serve that, the only route is extracting it from the public Library website. And the public Library is built to resist exactly that.

What you run into, in roughly the order you'll hit it:

- **It's a JavaScript application.** The ads aren't in the initial HTML. A plain `requests.get()` returns a shell. You either drive a real browser engine (Playwright/Puppeteer) that executes JS and lets the results render, or replay the page's own internal data requests from an HTTP client, which is what my actor does.
- **Fingerprint and handshake checks.** Meta inspects the TLS handshake, the HTTP/2 settings frame, and the browser fingerprint *before* serving content. A default headless Chromium can get flagged on the very first navigation, and an HTTP client gets an anti-bot challenge page instead of results. A browser-grade TLS client such as `got-scraping` gets through once it solves that challenge and carries the resulting cookies.
- **IP reputation and rate limiting.** Requests from datacenter IPs or repetitive patterns get throttled or blocked quickly. Rotate IPs, and keep residential proxies as a fallback for requests that get challenged.
- **Shifting selectors.** Meta restructures the layout and renames element classes regularly, so brittle CSS selectors break without warning. Extraction logic has to be defensive.

None of this is impossible — it's just real engineering with ongoing maintenance, not a weekend script. Build it yourself and you're signing up to babysit a headless-browser fleet or a challenge solver, a proxy budget, and a parser that breaks every time Meta ships a redesign.

## What the extracted data actually looks like

Whether you build it or buy it, here's a realistic shape for one commercial ad pulled from the public Library. Designing your downstream code against this shape early saves a lot of rework:

```json
{
  "ad_archive_id": "1234567890123456",
  "page_name": "Acme Outdoor Co.",
  "page_id": "100064123456789",
  "ad_creative": {
    "title": "Built for the Trail",
    "body": "Our lightest pack yet. Free shipping this week only.",
    "cta_text": "Shop Now",
    "link_url": "https://acmeoutdoor.example/packs",
    "images": ["https://scontent.example/ad_img_01.jpg"],
    "videos": []
  },
  "publisher_platforms": ["FACEBOOK", "INSTAGRAM"],
  "ad_delivery_start_time": "2026-05-28",
  "ad_delivery_stop_time": null,
  "is_active": true,
  "ad_snapshot_url": "https://www.facebook.com/ads/library/?id=1234567890123456",
  "country": "US"
}
```

Note what's present here that the *political* API doesn't expose for commercial advertisers — the creative assets, CTA, and destination URL — and what's absent: there are no `impressions` or `spend` ranges. Those metrics are only published for political/issue ads. For commercial ads, you get creative and delivery metadata, not spend. The exception is the EU: under the Digital Services Act the Library shows estimated reach with an age, gender and country breakdown for ads delivered there. My actor requests it as `demographicReach` when ad-detail scraping is on, though Meta returns it empty for many commercial ads, and it is reach, not spend. Knowing that boundary keeps you from promising a stakeholder numbers that don't exist.

## A faster path: query builder + a hosted scraper

If you'd rather not hand-roll the browser-and-proxy stack, two tools shorten the loop. I work on these, so treat this as a disclosure, not a neutral review.

To get the request right before you write any code, the free **[Facebook Ad Library search builder](https://datatooly.xyz/facebook-ad-library-search/)** lets you assemble a search config — keyword, advertiser, country, filters — and preview the output shape you'll get back. It's a **query builder**: it constructs the configuration and shows you the structure, not a live in-browser scrape (Meta isn't CORS-open, so no browser-side tool can fetch results directly). It's a quick way to nail down your parameters and field expectations up front.

When you're ready to actually pull data, **[Facebook Ad Library Pro](https://apify.com/constructive_calm/facebook-ad-library-pro?fpr=v77kxu)** runs the extraction on the Apify platform — search by keyword, advertiser, or country, and get ad creatives, text, platforms, and dates, plus deeper ad-detail scraping, with Meta's anti-bot challenge, proxy rotation, and parser maintenance handled for you. It's **free to start, then pay-as-you-go** through Apify platform credits, so you can validate it against a real competitor before committing budget.

## The takeaway

For a **facebook ad library scraper**, draw the line clearly: the official Meta Ad Library API is real but narrow — political and issue ads, ID-verified access, no commercial coverage. The broad competitor-research use case lives in the public Library, which means JavaScript rendering or request replay, fingerprinting, proxies, and shifting selectors. Decide which side of that line your project sits on *before* you write code, design against the actual data shape (creatives yes, commercial spend no), and you'll skip the most common multi-day detour in this whole space.

## Related guides

- [The TikTok Ad Library API: A Developer's Guide to the DSA Library](https://datatooly.xyz/guides/tiktok-ad-library-api/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
