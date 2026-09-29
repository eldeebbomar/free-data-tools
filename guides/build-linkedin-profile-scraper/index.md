# How to Build a LinkedIn Profile Scraper: The Honest Technical Guide

> A practical, honest guide to building a LinkedIn profile scraper: why there's no public API, how public pages embed JSON-LD, and the legal reality.

- URL: https://datatooly.xyz/guides/build-linkedin-profile-scraper/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-06-13
- Updated: 2026-09-29
- Free tool: [Extract LinkedIn profiles — posts & articles](https://datatooly.xyz/linkedin-profile-lookup/)
- Tags: api, webscraping, datascience, leadgen

If you have ever tried to build a **LinkedIn profile scraper**, you have probably discovered that the obvious path — "just call the API" — is a dead end. LinkedIn does not hand out programmatic access to arbitrary member profiles, and most of the tutorials that promise a five-line solution quietly skip the parts that actually matter: the data source, the legal posture, and why naive HTML parsing breaks.

This article is the honest version. I will show you where public profile data genuinely lives, a correct code pattern for reading it, and the legal nuance you need to understand before you point any automation at LinkedIn. No fabricated benchmarks, no "100% undetectable" nonsense.

## There is no open public API for profiles

Let's get this out of the way first, because it shapes every decision downstream.

LinkedIn has an API, but it is **not** a general-purpose way to read other people's profiles. Public/open access to profile data was removed back in **2015**. What remains in the self-service developer portal is narrow: "Sign in with LinkedIn" gives you the *authenticated user's own* name, headline, and photo — and only with their consent. Anything richer (the Profile API, full work history, connections) is gated behind the **LinkedIn Partner Program**, requires approval, and ships with hard restrictions.

A few details that surprise people:

- The Profile API restricts data retention — under the partner terms you generally may **not cache or store** profile data beyond short, strictly time-limited windows.
- The API Terms of Use explicitly **prohibit** scraping, combining LinkedIn data with other sources, reselling data, and using the API for lead generation.

So if your goal is "read public profile pages at scale for research or enrichment," the official API simply does not offer that product. That is not a loophole you are missing — it is a deliberate design choice. Which leads to the real question: what *is* publicly available on the page itself?

## What a public LinkedIn profile actually exposes

Open a LinkedIn profile in an incognito window — no login — and you will see a public version of the page. That HTML is rendered for search engines and social-preview crawlers, and like most modern sites built for SEO, it embeds **structured data** using [schema.org](https://schema.org/ProfilePage) vocabulary in JSON-LD format.

Concretely, public profile pages carry a `<script type="application/ld+json">` block describing a `Person` (often nested inside a `ProfilePage` via its `mainEntity` property). Google has recommended JSON-LD for [profile-page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page) since 2017, and LinkedIn populates it, likely because it wants those rich search results.

This matters enormously for a scraper. Instead of writing brittle CSS selectors against an obfuscated, frequently-changing DOM, you parse a **machine-readable JSON object** that the site publishes for search engines. It is more stable, more complete, and far less likely to silently break on a redesign.

## A correct pattern for reading the JSON-LD

Here is a minimal, runnable Node.js example that extracts and parses JSON-LD from an HTML document. I am showing the *parsing* logic — the part most tutorials get wrong — rather than encouraging you to hammer LinkedIn directly.

```js
import { load } from "cheerio";

/**
 * Extract a Person object from a profile page's JSON-LD.
 * Handles both shapes seen in the wild:
 *   1. A bare Person at the top level
 *   2. A ProfilePage whose `mainEntity` is the Person
 */
function extractPerson(html) {
  const $ = load(html);
  const blocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).contents().text())
    .get();

  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue; // skip malformed blocks instead of crashing the run
    }

    // JSON-LD may be a single object or a @graph array
    const nodes = Array.isArray(data)
      ? data
      : Array.isArray(data["@graph"])
        ? data["@graph"]
        : [data];

    for (const node of nodes) {
      if (node["@type"] === "Person") return node;
      if (node["@type"] === "ProfilePage" && node.mainEntity?.["@type"] === "Person") {
        return node.mainEntity;
      }
    }
  }
  return null;
}

const person = extractPerson(html);
if (person) {
  console.log({
    name: person.name,
    headline: person.jobTitle ?? person.description,
    image: typeof person.image === "string" ? person.image : person.image?.contentUrl,
    sameAs: person.sameAs, // linked social/profile URLs
  });
}
```

Two things to notice. First, the function tolerates **both** the bare-`Person` shape and the `ProfilePage.mainEntity` shape — real pages drift between them, and a scraper that assumes only one will return nulls the day the markup changes. Second, malformed JSON-LD is skipped, not fatal. Defensive parsing is the difference between an enrichment job that quietly drops one row and one that kills the whole batch.

What this snippet does **not** show is fetching. That is intentional, because *how* you request the page is where both the engineering and the law get interesting.

## The fetching problem (and the trick that helps)

A plain `fetch()` from a datacenter IP with a generic user agent usually gets you an interstitial or a login wall, not the public HTML. The page you see in incognito is served to *recognized crawlers*.

The pragmatic approach is to identify your client as one of the social-preview bots LinkedIn already whitelists for link unfurling — for example the `facebookexternalhit/1.1` user agent — and route the request through a proxy so you are not firing thousands of calls from one address. That combination tends to return the SSR HTML with the JSON-LD intact, **cookie-free** (no logged-in session, no fake accounts). That is exactly the technique the actor I mention at the end uses: social-preview UA plus a datacenter proxy, parse the JSON-LD, then augment with a few DOM-extracted engagement counts for recent posts.

The reason this is worth doing carefully rather than aggressively brings us to the part nobody should skip.

## The legal reality: hiQ v. LinkedIn

You cannot write honestly about a **LinkedIn profile scraper** without the `hiQ v. LinkedIn` saga, and it is routinely misquoted in both directions. Here is what actually happened.

In April 2022, the Ninth Circuit [reaffirmed a narrow reading](https://www.jenner.com/en/news-insights/publications/client-alert-data-scraping-in-hiq-v-linkedin-the-ninth-circuit-reaffirms-narrow-interpretation-of-cfaa) of the Computer Fraud and Abuse Act (CFAA). The core holding: when a site *generally permits public access* to data, scraping that public data is **likely not** "access without authorization" under the CFAA. That is the line everyone celebrates — and it is real.

But the story did not end there. In late 2022 the case [resolved with a stipulated $500,000 judgment against hiQ](https://www.privacyworld.blog/2022/12/linkedins-data-scraping-battle-with-hiq-labs-ends-with-proposed-judgment/). The district court had found that LinkedIn's **user agreement** — which prohibits scraping and fake accounts — was enforceable as a matter of **contract**. hiQ also caught CFAA liability tied specifically to using *fake accounts to reach password-protected pages*.

The honest takeaway is two-sided:

- Scraping genuinely **public** data is, in the Ninth Circuit, unlikely to be a *CFAA* (anti-hacking) violation.
- That is **not blanket permission**. Terms-of-service breach-of-contract claims are a separate and live risk, logging in or using fake accounts changes the analysis entirely, and this is **evolving case law** — not settled, nationwide green light. Privacy regimes like GDPR add another independent layer if you touch EU residents' data.

Treat "public + no login + respect the ToS posture + minimize footprint + know your jurisdiction" as the baseline, and get your own legal advice for anything commercial. Anyone who tells you scraping LinkedIn is flatly "legal" or flatly "illegal" is oversimplifying a genuinely nuanced area.

## A faster way to prototype the output

If you want to see the exact shape of the data before writing any code, I built a free **[LinkedIn Profile Lookup query builder](https://datatooly.xyz/linkedin-profile-lookup/)**. Important: it is a *query builder*, not a live scraper — it assembles a ready-to-run input config and previews the JSON output shape (name, headline, work history, education, recent posts, articles) right in the page. It does **not** fetch live results in your browser. It is just the fastest way to design your query and know what fields you will get back.

When you are ready to actually run extraction at scale, that config drops straight into the **[LinkedIn Profile Pro actor on Apify](https://apify.com/constructive_calm/linkedin-profile-pro?fpr=v77kxu)**, which implements the cookie-free JSON-LD approach described above (social-preview UA + datacenter proxy, with residential fallback). It returns the parsed profile plus up to roughly ten recent posts and articles per profile, and it is **free to start, then pay-as-you-go** — your first 10 resolved profiles are free once per Apify account for testing, and you are not charged for duplicates or invalid slugs.

*Disclosure: I built both the query builder and the Apify actor linked above.*

## Wrapping up

The durable lesson is that a good **LinkedIn profile scraper** is mostly an exercise in reading the structured data a public page already publishes — not in defeating LinkedIn — and in respecting a legal boundary that is narrower and more nuanced than the headlines suggest. Parse the JSON-LD defensively, handle both `Person` shapes, stay on genuinely public surfaces, never use fake logins, and keep the ToS and `hiQ` precedent in mind. Do that, and you have an enrichment pipeline that is both robust and defensible.

**Sources:** [Ninth Circuit / CFAA analysis (Jenner & Block)](https://www.jenner.com/en/news-insights/publications/client-alert-data-scraping-in-hiq-v-linkedin-the-ninth-circuit-reaffirms-narrow-interpretation-of-cfaa), [hiQ settlement and breach-of-contract finding (Privacy World)](https://www.privacyworld.blog/2022/12/linkedins-data-scraping-battle-with-hiq-labs-ends-with-proposed-judgment/), [LinkedIn API Terms of Use](https://www.linkedin.com/legal/l/api-terms-of-use), [schema.org ProfilePage](https://schema.org/ProfilePage), [Google profile-page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

## Related guides

- [LinkedIn X-Ray Search for Recently Updated Profiles (Past Week)](https://datatooly.xyz/guides/linkedin-x-ray-search-recently-updated-profiles/)
- [ClinicalTrials.gov API to CSV: Export Trials by Phase in Python](https://datatooly.xyz/guides/clinicaltrials-gov-api-export-csv-python/)
- [Cointelegraph API: Get Crypto News as JSON Without a Key](https://datatooly.xyz/guides/cointelegraph-api-crypto-news-json/)
- [Price per sqm by Compound in New Cairo: Compute It with Python](https://datatooly.xyz/guides/new-cairo-price-per-sqm-by-compound-python/)
- [FPL API Price Change Data in Python: The Official 2026/27 Fields](https://datatooly.xyz/guides/fpl-api-price-change-data-python/)
