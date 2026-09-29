# Company Hiring Signals — read buying intent from job postings

> Company hiring signals are inferences about a business's strategy and budget drawn from its open job postings. The mix of roles a company is recruiting for reveals where it's investing: heavy engineering hiring signals a product build-out, a surge in sales/BD roles signals go-to-market expansion, and data/AI roles signal an analytics push. Because a job posting is a documented commitment of money, hiring is among the most reliable B2B buying signals.

- Type: Live tool (fetches real data in your browser)
- Category: [Hiring & Sales Signals](https://datatooly.xyz/category/hiring-sales-signals/)
- URL: https://datatooly.xyz/company-hiring-signals/
- Backing Apify actor: [ats-hiring-intent-scraper](https://apify.com/constructive_calm/ats-hiring-intent-scraper?fpr=v77kxu) (free to start, then pay-as-you-go)
- Updated: 2026-09-29
- Full guide: [Read Company Hiring Signals From Public Job Board APIs (with code)](https://datatooly.xyz/guides/company-hiring-signals-job-board-apis/)

Type a company name. Get its live open roles straight from Greenhouse, plus an instant read on where it's investing — sales, engineering, data, or leadership. Free, no login, no API key.

## Key takeaways

- A hiring signal is the strategic intent you read from a company's open roles — the departments it's growing point to where it's spending next.
- Hiring outranks anonymous web-visit intent data because a job posting is public, verifiable, and tied to a real budget commitment, not an inferred page view.
- The Greenhouse Job Board API (https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs) is public, read-only, and requires no authentication — it returns every open role as JSON.
- Common signal-to-intent mappings: engineering hires = product build-out, sales/BD hires = revenue expansion, data/ML hires = AI initiative, finance/ops hires = fundraising or M&A.
- This free tool reads live Greenhouse roles for one company and classifies the intent instantly; the paid actor sweeps 25,000+ companies across Greenhouse, Lever, Ashby, SmartRecruiters and Workday with weekly change alerts.
- Hiring signals are strongest when combined with funding and technographic data — hiring tells you direction, a funding round tells you budget timing.
- A company hiring a named tool (e.g. a 'Salesforce Administrator') discloses its tech stack, which doubles as a technographic signal for vendors and competitors.

## How it works

### 1. Live roles from Greenhouse

Thousands of companies run hiring on Greenhouse and expose a public Job Board API that returns Access-Control-Allow-Origin: *. This tool reads it directly in your browser — no key, no backend — and lists the open roles for the company you type.

### 2. An instant hiring signal

Job titles are demand signals. A spike in Account Executive roles means a sales expansion; a wave of ML/Data roles means an AI push. The tool buckets the open roles and surfaces the dominant signal — the same logic the full actor applies at scale with an AI classifier.

### 3. From one company to your whole market

This page does one company, one snapshot. The ATS Hiring Intent actor sweeps 25,000+ companies across Greenhouse, Lever, Ashby, SmartRecruiters and Workday, tags each with an AI buying-intent label, and alerts you when a target starts hiring for what you sell.

## How to use it

1. **Enter a company name** — Type the name of the company you want to research into the free in-browser tool. It will attempt to resolve the company's Greenhouse board token automatically.
2. **Fetch live open roles** — The tool queries the public Greenhouse Job Board API and pulls the company's current open positions — title, department, and location — directly in your browser, with no login.
3. **Read the hiring-intent signal** — Review the auto-generated intent label (such as expanding-sales, engineering-build-out, or data-and-ai-push) that summarizes what the role mix suggests the company is investing in.
4. **Interpret the department mix** — Scan which departments are growing: engineering points to a product build-out, sales to revenue expansion, data/AI to an analytics initiative, finance/ops to a possible fundraise or M&A.
5. **Scale with the paid actor** — To monitor thousands of companies across five ATS platforms with an AI classifier and weekly change alerts, run the ATS Hiring Intent actor on Apify, which works server-side without browser CORS limits.

## Ready-to-run actor input

```json
{
  "mode": "signals",
  "atsTargets": [
    "greenhouse:stripe"
  ],
  "maxItems": 200
}
```

## Key facts

- The Greenhouse Job Board API is a public, read-only REST API at https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs that requires no authentication and returns all open roles as JSON. (Source: Greenhouse official developer docs (developers.greenhouse.io/job-board.html), corroborated by ATS integration guides.)
- Appending ?content=true to the Greenhouse jobs endpoint includes each job's full HTML description in the response. (Source: Greenhouse developer documentation and ATS integration guides observed in research.)
- A Greenhouse board token usually matches the company name in lowercase and appears in the careers-page URL as boards.greenhouse.io/{board_token}. (Source: ATS integration guide documentation.)
- Lever, Ashby, and SmartRecruiters each expose public job-board APIs, while Workday uses tenant-specific CXS endpoints with POST-based pagination that are harder to standardize. (Source: Public ATS API references gathered during research (ats-apis.com, scraping-workday.com).)
- Hiring signals are considered among the most reliable B2B intent signals because, unlike anonymous web-visit intent data, a job posting is public, verifiable, and tied to a documented budget commitment. (Source: B2B sales-intelligence sources on intent-data reliability observed in research; framed as industry consensus, not a measured statistic.)
- The paid ATS Hiring Intent actor sweeps 25,000+ companies across Greenhouse, Lever, Ashby, SmartRecruiters and Workday with an AI intent classifier and weekly change alerts. (Source: Actor description provided for this page (apify.com/constructive_calm/ats-hiring-intent-scraper).)

## FAQ

### What are company hiring signals?

Company hiring signals are strategic insights derived from a company's open job postings. The pattern of roles — which departments are expanding and which titles appear — acts as a leading indicator of where the business is investing. A spike in engineering roles signals a product build-out; a wave of sales hires signals go-to-market expansion; data and ML roles signal an AI or analytics initiative. Because each posting commits real budget, the signal is concrete rather than speculative.

### Is hiring a reliable buying signal in B2B sales?

Yes. Unlike anonymous web-visit intent data, a job posting is public, verifiable, and tied to an actual budget allocation, which makes it one of the most reliable intent signals available. The caveat is interpretation: hiring tells you direction, not exact timing or budget size. Reps get the best results pairing a hiring signal with a funding round or technographic data — hiring shows what they're building, funding shows when the money lands.

### How do I find out what a company is hiring for, for free?

Check the company's careers page, LinkedIn Jobs, Glassdoor, or the public APIs behind modern applicant tracking systems. Companies on Greenhouse, Lever, and Ashby expose every open role as structured JSON with no login. This page's free tool does it for you: type a company name, and it reads the live Greenhouse Job Board API and returns the open roles plus an instant hiring-intent classification.

### What is the Greenhouse Job Board API?

The Greenhouse Job Board API is a public, read-only REST API that powers companies' careers pages. The endpoint is https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs and it returns all open jobs as JSON — title, location, departments, last-updated date, and apply URL — with no authentication. Add ?content=true to include full HTML job descriptions. It is distinct from Greenhouse's Harvest API, which is key-gated and exposes private recruiting data.

### What does the department a company hires into reveal?

The hiring department is a map of strategic priorities. Engineering hiring points to a product or platform build-out. Sales, BD, and SDR roles point to revenue and market expansion. Data, ML, and AI roles point to an analytics or AI push. Finance and ops hires frequently precede a fundraise or M&A. Roles in a new city signal geographic expansion, and a posting that names a specific tool reveals the company's tech stack.

### How do I find a company's Greenhouse board token?

The board token is the company identifier in the API path and usually matches the company name in lowercase. The easiest way to find it is the careers-page URL: boards.greenhouse.io/{board_token}. For example, a board at boards.greenhouse.io/stripe uses the token 'stripe'. This free tool tries to resolve the token from the company name you enter so you don't have to look it up manually.

### Can a website read the Greenhouse API directly in the browser?

Yes, for Greenhouse specifically. The Greenhouse Job Board API returns the header Access-Control-Allow-Origin: * (verified), so this free tool fetches a company's live open roles directly in your browser — no server, no key. Not every source allows this: Reddit and Google Patents send no permissive CORS header, so browsers block reading them. For those sources, and to sweep thousands of boards at once, the paid ATS Hiring Intent actor runs server-side on Apify without browser CORS limits.

### What ATS platforms expose public job data besides Greenhouse?

Lever exposes a public postings API (api.lever.co/v0/postings/{company}?mode=json), Ashby offers a public job board API (api.ashbyhq.com/posting-api/job-board/{org}), and SmartRecruiters has a public Posting API. Workday is the hard one: its job boards use tenant-specific CXS endpoints on wd1/wd3/wd5 subdomains with POST-based pagination, so it's far less standardized. The paid actor normalizes all five into one schema.

### What's the difference between the free tool and the paid ATS Hiring Intent actor?

The free tool checks one company at a time against the Greenhouse Job Board API and returns its open roles with an instant hiring-intent label — ideal for a quick lookup. The paid actor scales it: it sweeps 25,000+ companies across Greenhouse, Lever, Ashby, SmartRecruiters and Workday, runs an AI intent classifier on the role mix, and sends weekly change alerts when a company's hiring posture shifts — built for ongoing pipeline and competitive monitoring.

### Why is hiring data better than traditional intent data?

Traditional intent data infers interest from anonymous web behavior or third-party content consumption, which is probabilistic and often noisy. A job posting is the opposite: it's a public, documented decision to spend money on a capability. That makes hiring signals verifiable and attributable to a named company. The trade-off is that hiring data needs interpretation to map a role to a specific buying need — which is exactly what an intent classifier automates.

## Related tools

- [Browse all free data tools](https://datatooly.xyz/)
- [H-1B salary lookup](https://datatooly.xyz/salary-benchmark-lookup/)
- [H-1B visa sponsor finder](https://datatooly.xyz/visa-sponsor-finder/)
- [Fantasy Premier League data](https://datatooly.xyz/fpl-intelligence-tool/)
- [source people on LinkedIn by job title and city](https://datatooly.xyz/linkedin-people-search/)
