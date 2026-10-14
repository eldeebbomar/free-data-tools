# SEC EDGAR Rate Limit and User-Agent: Fair Access Rules

> SEC fair access in practice: the User-Agent format, the 10 requests/second cap across all machines, what the 403 means, how long a block lasts. Tested client.

- URL: https://datatooly.xyz/guides/sec-edgar-rate-limit-user-agent/
- Author: Omar Eldeeb (https://datatooly.xyz/about/)
- Published: 2026-10-14
- Updated: 2026-10-14
- Free tool: [Search SEC EDGAR filings, financials & insider trades](https://datatooly.xyz/sec-edgar-search/)
- Tags: api, python, finance, webscraping

SEC EDGAR's fair-access rules are short. Send a `User-Agent` with your name or company and a contact email, such as `Acme Research admin@acme.com`, and stay at or under 10 requests per second in total across all your machines. No User-Agent, or a library default, gets HTTP 403. Go over the rate and your IP can be limited until it stays under it for 10 minutes.

The [SEC EDGAR API in Python guide](https://datatooly.xyz/guides/sec-edgar-api-python-guide/) gives the short version. This page goes further: the exact wording of each rule, what the server actually does (tested on 2026-10-14), and a client that follows the rules.

## The rules, in the SEC's words

**User-Agent.** From [Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data):

> Please declare your user agent in request headers:
> Sample Declared Bot Request Headers:
> User-Agent: Sample Company Name AdminContact@&lt;sample company domain&gt;.com

The [webmaster FAQ](https://www.sec.gov/about/webmaster-frequently-asked-questions) repeats that sample and adds `Accept-Encoding: gzip, deflate` and `Host: www.sec.gov`.

**Rate.** Accessing EDGAR Data says "Current max request rate: 10 requests/second" and "SEC reserves the right to limit request rates to preserve fair access for all users." The SEC.gov [privacy and security policy](https://www.sec.gov/about/privacy-information) gives the details:

> Current guidelines limit users to a total of no more than 10 requests per second, regardless of the number of machines used to submit requests.
>
> If a user or application submits more than 10 requests per second, further requests from the IP address(es) may be limited for a brief period. Once the rate of requests has dropped below the threshold for 10 minutes, the user may resume accessing content on SEC.gov.

Three details matter in practice:

1. **The limit is per user, not per IP.** Ten workers each doing 2 requests per second is 20 per second, which is over the limit.
2. **The block is not a fixed 10 minutes.** It lasts until your rate has stayed below the threshold for 10 minutes. If you keep retrying at full speed while blocked, the 10 minutes never start.
3. **It covers all of SEC.gov.** That includes `data.sec.gov` (submissions, XBRL), `efts.sec.gov` (full-text search) and `www.sec.gov` (Archives, `company_tickers.json`).

The SEC also says it doesn't "offer technical support for developing or debugging scripted downloading processes", and that the policy "may change".

## What the server did on 2026-10-14

Each User-Agent below was sent to `https://data.sec.gov/submissions/CIK0000789019.json`, with a one-second pause between requests:

| User-Agent sent | Status |
|---|---|
| (header removed) | 403 |
| `curl/8.15.0` (curl's default) | 403 |
| `python-requests/2.32.3` (requests' default format) | 403 |
| `MyApp/1.0` | 200 |
| `Mozilla/5.0` | 200 |
| `contact@example.com` | 200 |
| `Jane Doe jane@example.com` | 200 |
| `Data Tooly research contact@example.com` | 200 |

curl's default also got 403 from `efts.sec.gov` and from `www.sec.gov` (`/files/company_tickers.json` and an Archives document).

What this shows: the automatic 403 catches **missing and default library** User-Agents. It didn't check whether an email was present. A 200 doesn't make a request compliant, though. The policy asks for company-specific information and a contact, and the SEC can manage traffic it can't identify. Send `Name or Company contact@yourdomain` and you meet the rule as written.

### The 403 page

The 403 body is an HTML page, not JSON. Its key lines:

> Your Request Originates from an Undeclared Automated Tool
>
> To allow for equitable access to all users, SEC reserves the right to limit requests originating from undeclared automated tools. Your request has been identified as part of a network of automated tools outside of the acceptable policy and will be managed until action is taken to declare your traffic.
>
> Please declare your traffic by updating your user agent to include company specific information.

The page also includes a `Reference ID`. If you think you've been blocked by mistake, the SEC points you to opendata@sec.gov.

## A client that follows the rules

```python
import threading
import time
import requests

class SecClient:
    """requests.Session that declares a User-Agent, stays under a request rate,
    and tells an undeclared-tool block apart from a temporary limit."""

    def __init__(self, user_agent, max_per_second=8):
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": user_agent, "Accept-Encoding": "gzip, deflate"})
        self.min_interval = 1.0 / max_per_second
        self.lock = threading.Lock()  # one shared pace across threads
        self.last = 0.0

    def _wait_turn(self):
        with self.lock:
            delay = self.last + self.min_interval - time.monotonic()
            if delay > 0:
                time.sleep(delay)
            self.last = time.monotonic()

    def get(self, url, retries=4, **kw):
        for attempt in range(retries + 1):
            self._wait_turn()
            r = self.s.get(url, timeout=60, **kw)
            if r.status_code == 403 and "Undeclared Automated Tool" in r.text:
                # Retrying won't help: fix the User-Agent.
                raise RuntimeError("SEC blocked the request as an undeclared automated tool")
            if r.status_code in (403, 429, 503) and attempt < retries:
                wait = float(r.headers.get("Retry-After", 0)) or min(60 * 2 ** attempt, 600)
                time.sleep(wait)  # back off; the SEC lifts limits after 10 quiet minutes
                continue
            r.raise_for_status()
            return r
        raise RuntimeError(f"gave up on {url}")

sec = SecClient("Data Tooly research contact@example.com")

# 20 requests: the client spaces them at 8 per second.
t0 = time.monotonic()
for cik in [320193, 789019, 1652044, 1018724, 1045810] * 4:
    sec.get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json")
elapsed = time.monotonic() - t0
print(f"20 requests in {elapsed:.1f}s = {20 / elapsed:.1f} req/s")

# What a missing or default User-Agent gets.
bad = SecClient("python-requests/2.32.3")
try:
    bad.get("https://data.sec.gov/submissions/CIK0000320193.json")
except RuntimeError as e:
    print("blocked:", e)
```

Output on 2026-10-14:

```text
20 requests in 3.3s = 6.0 req/s
blocked: SEC blocked the request as an undeclared automated tool
```

Design notes:

- **Pace below 10, not at 10.** At 8 per second you have room for clock jitter and a second script you forgot was running. The measured 6 per second is lower because each request also waits for the network; the limiter only sets a ceiling.
- **One limiter for the whole job.** The lock makes threads share one pace. For several processes or machines, divide the budget between them, because the SEC counts your total.
- **Don't retry the undeclared-tool 403.** Every retry is another undeclared request. Fix the header instead.
- **Back off for minutes, not seconds, on other errors.** The SEC doesn't document which status code a rate-limited client gets, and I didn't trigger the limit to find out. The client therefore backs off on 403, 429 and 503, from 1 minute up to 10, which fits the "below the threshold for 10 minutes" rule.

## Need more than 10 per second? Use the bulk files

The SEC's [EDGAR APIs page](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) calls the nightly ZIP archives "the most efficient means to fetch large amounts of API data":

| File | Contains |
|---|---|
| `https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip` | All data from the XBRL frames and company facts APIs |
| `https://www.sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip` | The filing history of every filer, from the submissions API |

One download instead of tens of thousands of requests keeps you within the rules without trying.

## Can a browser call the SEC APIs?

Not in a way that meets the rule. A web page can't choose the User-Agent its browser sends, so it can't declare itself the way the SEC asks. Run SEC requests server-side, which is why the free tool below is a query builder rather than a live search.

## Related guides for this API

- [SEC EDGAR API in Python](https://datatooly.xyz/guides/sec-edgar-api-python-guide/): the overview, with a full example.
- [Submissions API and ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/).
- [Company facts, company concept and frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/).
- [EDGAR full-text search API](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/).

## Do it without code

The free [SEC EDGAR query builder](https://datatooly.xyz/sec-edgar-search/) assembles a ready-to-run query for filings, financials, full-text search or insider trades from plain tickers, and shows the output shape. You run it server-side, where the User-Agent can be set.

## At scale

The [SEC EDGAR Scraper actor](https://apify.com/constructive_calm/sec-edgar-scraper?fpr=v77kxu) on Apify sends a declared User-Agent, paces its requests and handles paging for you across nine modes: filings, financials, XBRL facts, full-text search, Form 4, 13F, 13D/G, a latest-filings feed and 8-K items. It exports JSON, CSV or Excel. It's free to start, then pay-as-you-go.

*Disclosure: I build the datatooly query builder and the Apify actor. The rules and the client above apply with or without them.*

Sources: [SEC: Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [SEC webmaster FAQ, Developers section](https://www.sec.gov/about/webmaster-frequently-asked-questions), [SEC.gov privacy and security policy](https://www.sec.gov/about/privacy-information), [SEC: EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), and live responses on 2026-10-14.

## Quick answers

### What is the SEC EDGAR API rate limit?

No more than 10 requests per second, "regardless of the number of machines used to submit requests", per SEC.gov's privacy and security policy. If you go over, "further requests from the IP address(es) may be limited for a brief period"; access resumes once your rate has stayed under the threshold for 10 minutes. The same limit covers data.sec.gov, efts.sec.gov and www.sec.gov.

### What does the SEC fair access policy say about 10 requests per second and User-Agent?

Both rules are on the SEC's Accessing EDGAR Data page: "Current max request rate: 10 requests/second" and "Please declare your user agent in request headers", with the sample `User-Agent: Sample Company Name AdminContact@<sample company domain>.com`. The webmaster FAQ adds `Accept-Encoding: gzip, deflate` and `Host: www.sec.gov` to the sample headers.

### Why does SEC EDGAR return 403 Forbidden?

Usually because the request has no User-Agent or a library default. The 403 page is titled "Your Request Originates from an Undeclared Automated Tool" and asks you to "declare your traffic by updating your user agent to include company specific information." On 2026-10-14, no User-Agent, `curl/8.15.0` and `python-requests/...` all got 403 from data.sec.gov.

### What is the SEC user agent API requirement?

Every request to SEC.gov's APIs (data.sec.gov, efts.sec.gov and www.sec.gov files) must carry a User-Agent that names you or your company and gives a contact email, for example `Acme Research admin@acme.com`. There is no API key; the User-Agent is how the SEC identifies automated traffic.

## Related guides

- [SEC EDGAR API in Python: User-Agent Format & Rate Limits](https://datatooly.xyz/guides/sec-edgar-api-python-guide/)
- [SEC Company Facts API: companyfacts, concept & frames](https://datatooly.xyz/guides/sec-edgar-companyfacts-xbrl-frames-api/)
- [EDGAR Full-Text Search API: efts.sec.gov Parameters](https://datatooly.xyz/guides/sec-edgar-full-text-search-api/)
- [SEC EDGAR API: Submissions JSON and Ticker to CIK](https://datatooly.xyz/guides/sec-edgar-submissions-api-ticker-to-cik/)
- [Get Completed Clinical Trial Results with the API](https://datatooly.xyz/guides/clinicaltrials-gov-api-completed-trial-results/)
- [ClinicalTrials.gov API: Look Up a Study by NCT Number](https://datatooly.xyz/guides/clinicaltrials-gov-api-nct-number-lookup/)
