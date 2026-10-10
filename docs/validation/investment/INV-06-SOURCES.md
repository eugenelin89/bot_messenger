# INV-06 — zero-cost source feasibility and rights evidence

Reviewed 2026-10-09–10 (America/Vancouver), using current primary documentation and a read-only independent source-rights specialist. **No live equity-price source is selected or activated.** No new account, subscription, paid trial, license purchase or scraping bypass occurred. Decision029's US$0 ceiling is unchanged. Missing permission and uncertain raw regular-session opening semantics block live fills; they do not approve a close-price substitute.

## Price-source decision matrix

“Conditional” means provider capability exists under appropriate account/permission; it is not permission granted to this project. “Unknown” is a blocked gate, not an implied allowance. None is an approved fallback.

| Candidate and primary evidence | Cost/authentication/rate | Raw opening, time, identity and actions | Corrections/reliability/fallback disposition |
| --- | --- | --- | --- |
| [Alpha Vantage docs](https://www.alphavantage.co/documentation/), [support](https://www.alphavantage.co/support/), [terms](https://www.alphavantage.co/terms_of_service/) | Free compact daily API, key required;25/day. Full history/intraday/daily-adjusted premium and excluded | Raw daily OHLCV documented. Exact regular-session open/auction semantics and within-deadline availability unproven. Symbols/exchanges need separate identity verification. Split/dividend endpoints documented; completeness/payment semantics unprobed | Standard terms personal/individual/noncommercial, organizational association treated commercial. No project exception found. No price probe. Corrections/availability guarantees unproven; not selected |
| [Yahoo official terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html?ncid=mbr_idnedulnk00000001) | Public pages do not establish free automated API rights; no approved account/feed | Raw regular-session definition, provenance, correction and corporate-action completeness not established | Official indexed terms prohibit automated collection absent prior permission; direct terms read returned999, not bypassed. Unofficial libraries confer no rights; not selected |
| [Stooq attempted terms](https://stooq.com/t/?i=510), [robots](https://stooq.com/robots.txt) | Keyless CSV descriptions not accepted as primary permission evidence; rate/quota unverified | Adjustment, exact open, event/availability times, instrument/venue/actions unverified | Terms returned JavaScript verification and robots unavailable to the research tool. No bypass or quote endpoint probe; all relevant rights unknown; not selected |
| [Twelve Data pricing](https://twelvedata.com/pricing), [terms](https://twelvedata.com/terms), [usage](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage), [docs](https://twelvedata.com/docs/markets/market-state) | Basic free account/API key;8 credits/min,800/day; no account created | `adjust=none` exists; default split-adjusted is unsuitable. Regular-open and actual availability unproven; action and instrument completeness unprobed | Free commercial use restricted, redistribution requires authorization, cache duration restrictions and termination deletion. Not selected; no technical reliability probe |
| [Alpaca market-data FAQ](https://docs.alpaca.markets/us/docs/market-data-faq), [redistribution](https://alpaca.markets/support/redistribute-alpaca-api) | Existing account/keys required, none approved/discovered for this task. Live free IEX; historical SIP may be queried free if end is>=15min old. Exact authorized quota unverified | Feed/trade-condition-dependent bars; daily open cannot automatically be deemed frozen execution opening. Identity/actions/availability/corrections need verification | Standard support denies data redistribution; derivative/retention/archive rights unresolved. Historical SIP nuance retained; no categoric “IEX-only” claim. Not selected |
| [FRED S&P500](https://fred.stlouisfed.org/series/sp500) | Government hosting; API key/terms separate | Daily closing price index, third-party S&P copyright, no dividends; not SPY or raw opening. No full equity-universe/action feed | Cannot satisfy frozen open/benchmark semantics; government hosting does not license third-party series. Not selected |
| [Nasdaq Data Link WIKI product](https://data.nasdaq.com/databases/WIKIP) | Historical public-domain dataset; current export/API UI authentication remains separate | Historical daily prices/actions; no current observations or current availability chain | Active support ended2018-04-11; provider discourages investment/analysis use. Historical license does not make stale data operational. Not selected |

## Independent rights assessment

A=expressly allowed in stated narrow scope; C=conditional/provider capability requiring account/scope verification; B=blocked by reviewed standard restriction for this project; U=not established. Internal computation does not imply public distribution.

| Source | Automation | Internal calculation | Retention | Raw public display | Derived portfolio | Benchmark | Exports/downloads | Permanent archive |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alpha Vantage | C, key | B organizational use without writing | U | B | B | B | B | U/B |
| Yahoo | B absent permission | U | U | U | U | U | U | U |
| Stooq | U | U | U | U | U | U | U | U |
| Twelve Data Basic | C, key | C for permitted noncommercial scope | C, limits | B | B for public showcase | B | B | B, termination deletion |
| Alpaca | C, account | C/U | U | B standard API terms | U | U | B raw data | U/B |
| FRED third-party S&P | C, API terms | U | U | U | U | U | U | U |
| WIKI historical dataset | C access route | A dataset reuse | A | A | A | A | A | A; obsolete prices |
| OpenFIGI identifier strings only | A documented public API | A | A | A | A identifiers only | A identifiers only | A | A perpetual dedication |
| Invented local fixtures | A fixture-only | A fixture-only | A fixture-only | A only with synthetic label and separate publisher consent | Same | Same | Same | Same |

This is a source-selection gate assessment grounded in the linked restrictions, not a legal opinion or a claim about privately negotiated agreements. No source's price rights become verified from this table. No operational source approval has been recorded.

## OpenFIGI: bounded real identity evidence

[API documentation](https://www.openfigi.com/api/documentation) explicitly supports free unauthenticated mapping. [Terms §§1,5](https://www.openfigi.com/docs/terms-of-service) dedicate FIGI alphanumeric identifiers to perpetual public use, including commercial use/display/retention/derivatives/redistribution. [FAQ Usage and Fees](https://www.openfigi.com/about/faq) addresses database storage/sharing and describes associated metadata as open under the incorporated MIT standard. We conservatively permit only identifier strings in this evidence report's public output; returned names/ticker/exchange/type were parsed privately and not archived as public-domain response bytes.

`OpenFigiProbe` has one literal public endpoint, one documented ID, one request/one job per instance,10s timeout,64KiB body cap, strict schema/duplicate-key checking, exact requested-identity validation, no redirects, no key, no retries or timer. Provider docs say25 requests/min unauthenticated and conflict between5/10 jobs/request; one job avoids that ambiguity.429 fails closed. This is an explicit development probe adapter, not an installed registry synchronizer or live collector.

The single actual request used the provider's documented example `ID_BB_GLOBAL=BBG000BLNNH6`. Receipt: [inv06-openfigi-probe.json](evidence/inv06-openfigi-probe.json), retrieved `2026-10-10T07:00:14.316Z`, one result, SHA-256 `c5557d18c510d57d906050f7f09c2c2d274e8a15c2594d2f1abe59ce608d013d`. The result distinguished FIGI/composite/share-class IDs. The exchange code is not a MIC or proof of listing/execution venue. This is **not a market-price probe**, operational universe selection, or proof of any price/action right. The later exact-response/duplicate-key parser guards were checked synthetically; the one real call was not repeated merely to exercise a code revision.

## Calendar and other evidence

The [NYSE calendar](https://www.nyse.com/trade/hours-calendars) and [Nasdaq calendar](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule) agree on ten2026 closures and Nov27/Dec24 early closes. Core equities09:30–16:00 New York; early close13:00. July2 is a full equity session. The checked-in reference covers only2026 and names its version/sources. DST uses `America/New_York`, independent of host timezone. Calendar publication is a scheduled reference, never confirmation of an actual opening or absence of a halt. Explicit closure revisions preserve earlier versions; actual future exceptional closures require fresh dated evidence.

The [NYSE Carter closure notice](https://ir.theice.com/press/news-details/2024/The-New-York-Stock-Exchange-Will-Close-Markets-on-January-9-to-Honor-the-Passing-of-Former-President-Jimmy-Carter-on-National-Day-of-Mourning/default.aspx) illustrates why exceptional closures cannot be inferred from recurring holidays. It concerns2025, outside this calendar's validity; our2026 exceptional-closure test is explicitly synthetic.

[SEC APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) need no key; [fair access](https://www.sec.gov/about/developer-resources) allows identified bounded automation, shared ceiling10requests/s. CIK identifies issuers, not distinct securities. Filings/XBRL are research/action evidence, not an OHLC feed or complete normalized corporate-action service. No SEC collection was run.

[Nasdaq halt RSS](https://www.nasdaqtrader.com/Trader.aspx?id=TradeHaltRSS) supports readers with at most once/min polling. [Feed terms](https://www.nasdaqtrader.com/content/administrationsupport/agreementstrading/THRSSFeedTermsCond.pdf) restrict modification; permanent retention/public derivatives remain unverified. No halt collector was implemented or started. Fixture halts are typed missing-price states, never invented opens.

## Readiness decision

Proceed with trusted typed evidence/calendar and synthetic adapter integration; no price feed/fallback satisfies all present operational requirements. Before real paper operation: select an authorized account-free or already-approved-account source, verify exact raw regular opening/availability/correction/action completeness, approve frozen identifiers/venues/calendar, and record all internal/retention rights. Before any real public financial output, separately verify raw, derived, benchmark, export and permanent archive rights. If unavailable, seek an explicit owner decision on a versioned methodology or reduced display; never silently change the current next-open rule or spend money.
