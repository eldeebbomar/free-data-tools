# LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)

> Add Google's past-week filter to a LinkedIn X-ray search to surface recently re-indexed profiles, then dedupe by slug so each run shows only new people.

- URL: https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-09-29
- Updated: 2026-09-29
- Free tool: [Find LinkedIn profiles by job title and location](https://datatooly.xyz/linkedin-people-search/)
- Tags: linkedin, recruiting, python, career

To run a LinkedIn X-ray search for recently updated profiles, add Google's time filter to a `site:linkedin.com/in` query: pick **Tools → Past week** or append `&tbs=qdr:w` to the URL (`qdr:m` for past month). Only profiles Google has re-indexed in that window come back. A profile often gets re-crawled after it changes, so this works as a rough job-change signal. Dedupe by profile slug to see only new people each week.

That's the core technique. Below is how to build the queries so they stay precise, a small script that generates them and dedupes what you collect, and a clear list of what this public route can't see.

## How an X-ray search works

LinkedIn's own people search needs you to be logged in. Public profiles, though, are indexed by search engines, and an X-ray search asks Google for them directly:

```text
site:linkedin.com/in "Data Engineer" "Lisbon" -recruiter -hiring
```

- `site:linkedin.com/in` limits results to personal profiles. Company pages (`/company/`), posts (`/posts/`) and schools fall out.
- Quote **every** term, even single words. Unquoted, Google stems and substitutes ("engineer" pulls in "engineering", a city pulls in its country), which quietly widens the search past what you asked for.
- `-recruiter -hiring` removes the recruiters who put the same title and city in their own headlines.

The time filter is a URL parameter: `tbs=qdr:w` is the past week and `tbs=qdr:m` the past month. It's the same filter as the Tools menu.

## What "recently updated" really means

The filter keeps pages Google has indexed recently. It doesn't read any "last updated" date from LinkedIn. In practice, Google re-crawls a public profile when something on it changes (a new employer, a rewritten headline, an "open to work" line), so a past-week slice tends to be enriched for people who just moved. It's a proxy, not proof. Some re-crawls are routine, and some changes take longer than a week to be picked up. Treat the result as a shortlist to read, not a list of confirmed job changes.

## Runnable Python: build the queries, dedupe the results

The script below does two things you'd otherwise do by hand. It turns titles × locations into ready-to-open Google URLs with the freshness filter applied. Then it normalizes whatever profile links you collect, so the same person isn't counted twice across country subdomains, letter case, tracking parameters and trailing slashes.

```python
from itertools import product
from urllib.parse import urlencode, urlparse, unquote

FRESHNESS = {"any": None, "past_month": "qdr:m", "past_week": "qdr:w"}

def xray_queries(titles, locations, exclude=(), freshness="past_week"):
    """One Google URL per title x location, every term quoted, profiles only (/in/)."""
    urls = []
    for title, loc in product(titles, locations):
        q = " ".join(["site:linkedin.com/in", f'"{title}"', f'"{loc}"', *[f"-{w}" for w in exclude]])
        params = {"q": q}
        if FRESHNESS[freshness]:
            params["tbs"] = FRESHNESS[freshness]
        urls.append("https://www.google.com/search?" + urlencode(params))
    return urls

def profile_key(url):
    """Canonical key for dedupe: country subdomains, case, query strings and trailing slashes collapse."""
    u = urlparse(url.strip())
    host = u.hostname or ""
    if not (host == "linkedin.com" or host.endswith(".linkedin.com")):   # rejects notlinkedin.com
        return None
    parts = [p for p in u.path.split("/") if p]
    if len(parts) < 2 or parts[0].lower() != "in":
        return None                                                       # company/school/post pages
    return unquote(parts[1]).lower()

if __name__ == "__main__":
    for url in xray_queries(["Data Engineer", "Analytics Engineer"], ["Lisbon", "Porto"],
                            exclude=["recruiter", "hiring"]):
        print(url)

    seen = set()   # persist this between runs (a file, a DB table) to get "new people only"
    pasted = [
        "https://pt.linkedin.com/in/jane-example-123a45b",
        "https://www.linkedin.com/in/Jane-Example-123a45b/?originalSubdomain=pt",
        "https://www.linkedin.com/company/example-corp",
        "https://notlinkedin.com/in/fake",
    ]
    for link in pasted:
        key = profile_key(link)
        status = "skip" if key is None else ("dupe" if key in seen else "new")
        if key:
            seen.add(key)
        print(f"{status:5} {key}  <- {link}")
```

Running it prints four search URLs, then:

```text
new   jane-example-123a45b  <- https://pt.linkedin.com/in/jane-example-123a45b
dupe  jane-example-123a45b  <- https://www.linkedin.com/in/Jane-Example-123a45b/?originalSubdomain=pt
skip  None  <- https://www.linkedin.com/company/example-corp
skip  None  <- https://notlinkedin.com/in/fake
```

(The profile links are fictional.) Open the URLs in your browser and collect the profile links. Save `seen` between weekly sessions, and next week only genuinely new people count.

The host check uses an exact match or a leading-dot suffix on purpose. A looser pattern like "ends with linkedin.com" also accepts `notlinkedin.com`.

## Why the script doesn't fetch Google for you

A plain HTTP request to `google.com/search` now gets a page that requires JavaScript, not results. I checked this while writing: the response contained the `enablejs` / `noscript` interstitial and zero profile links. Scripted scraping of Google's result pages is also against Google's terms. Run the queries by hand, use an official search API, or use a hosted tool that handles discovery. Don't point a loop of `requests.get` at Google.

## What one result gives you

| Field | Where it comes from | Reliability |
|---|---|---|
| Profile URL / slug | Result link | High. Vanity slugs are case-insensitive, so lowercase them. |
| Name | Result title, before the first separator | High |
| Headline | Result title or snippet | High. This is the field to filter on. |
| Current employer | "Role at Company" in the headline, or the snippet | Patchy. Google truncates titles, so a cut-off employer name looks plausible and is wrong. |
| Country | Country subdomain such as `pt.` or `ae.` | Useful hint, not an address |
| Location | Snippet text | A text match, not a geo filter |

## Pitfalls

- **One query has a ceiling.** A public-index site search tops out at a few hundred results (roughly 300–400 per query in the actor's measurements). You widen coverage by asking different questions (title variants, neighbouring cities, both freshness windows), not by paging deeper.
- **Location is text, not geography.** People whose headline merely *mentions* your city match too. Tag each person by whether the evidence came from their location field or just a mention, rather than silently mixing the two.
- **Truncated titles corrupt employers.** "Registered Nurse at Dubai Health …" is not an employer name. Recover the employer from the snippet, or leave it empty.
- **Only vanity URLs are public.** ID-style links (`/in/ACoAAA…`) resolve only for logged-in users. If a spreadsheet gives you those, find the column with the public vanity URL.
- **Private profiles don't exist here.** When an owner switches public visibility off, the profile isn't indexed and can't be reached without an account. That's the design working, not a bug to route around.
- **Headline beats title.** Public profiles often blank role titles and dates in the experience section. The headline is almost always present.
- **It's still personal data.** Public doesn't mean unregulated. Under GDPR and similar laws you need a lawful basis for storing and contacting these people, and LinkedIn's terms still apply.

## Do it without code

The free [LinkedIn people search builder](https://datatooly.xyz/linkedin-people-search/) takes job titles, locations, optional raw queries, a mode and a freshness window (any, past month or past week), and produces a ready-to-run input with a fixed example of the output shape. The example people are fictional. It's a query builder: LinkedIn doesn't allow other sites to read it from your browser, so it doesn't return live profiles.

## At scale

[LinkedIn People Search on Apify](https://apify.com/constructive_calm/linkedin-people-finder?fpr=v77kxu) runs the discovery for you through a public search index, with no LinkedIn login, account or cookies. It turns titles × locations into quoted queries, can expand title synonyms and nearby cities, and applies `freshness: "past_week"` or `"past_month"`. Every row carries `locationConfidence` (`exact`, `mentioned` or `unknown`). Short mode returns name, headline, current title, company and URL. Full mode also opens each public profile for about, work history, education and follower counts. Set `dedupeMode: "auto"` with a weekly Apify schedule and each run returns only people you haven't been given before. The seen-set lives in a named key-value store in your own account. It's free to start, then pay-as-you-go per profile delivered. Search pages and deduplicated profiles are never billed.

*Disclosure: I built the query builder and the actor. The script above works on its own.*

## FAQ

### How do I find recently updated LinkedIn profiles?

Run an X-ray search (`site:linkedin.com/in "Title" "City"`) and apply Google's time filter: Tools → Past week, or `&tbs=qdr:w` in the URL. You get profiles Google re-indexed in that window, which leans toward people who recently changed something on their profile.

### Does the past-week filter mean the person changed jobs?

No. It means Google re-indexed the public page recently. Profile changes are a common reason for that, so the slice is useful for spotting movers, but check each headline and employer before acting on it.

### Can I do a LinkedIn X-ray search without logging in?

Yes. X-ray searching uses Google's index of public profiles, so no LinkedIn account is involved. You'll only see profiles whose owners made them public, and only what those public pages show.

### Why do I only get a few hundred results for a search?

A site search over a public index has a hard ceiling per query. Split one broad search into several narrower ones (title variants, individual cities, different freshness windows) and dedupe the merged results by slug.

### Can I export X-ray results to CSV?

Collect the profile URLs, normalize them to slugs, and write name, headline, URL and the query that found each person to a CSV. The script above handles normalization and dedupe. A hosted tool can return the same rows as CSV or JSON directly.

## Related guides

- [How to Build a LinkedIn Profile Scraper: The Honest Technical Guide](https://datatooly.xyz/guides/build-linkedin-profile-scraper/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
