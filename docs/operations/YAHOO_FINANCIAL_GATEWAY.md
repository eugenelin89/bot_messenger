# Yahoo Financial Data Gateway — source dossier and inactive runbook

**As of:** 2026-10-11 America/Vancouver; HQ-READY-03 source integration only.
**Provider/feed:** Yahoo Finance / Python yfinance1.7.0, Python3.12.12.
**State:** Default inactive; synthetic fixture admission only. No live market-data request,
employee inference, scheduled collector, deployment, public artifact or trading activation.

## Permission provenance and use assessment

The owner selects Yahoo Finance for this personal, non-commercial hobby project and reports
receiving verbal permission from Yahoo for personal use. This is **owner-reported verbal
permission**, not independently verified writing. The conversation date, representative, exact
words, automated endpoints/frequency, retention and public-use scope were not provided. Do not
invent them or require a new written agreement merely to develop/test this offline adapter.
[Decision038](../decisions/decision_038_yahoo_finance_private_source.md) records that provenance.

The official [Canadian terms](https://legal.yahoo.com/ca/en/yahoo/terms/otos/index.html),
[US terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html) and
[Finance disclaimer](https://help.yahoo.com/kb/finance-for-web/SLN2310.html) were identified for
the use-specific assessment on2026-10-11. The documentation fetches were unavailable/blocked;
no successful current terms review or independent legal conclusion is claimed. No retry or
access-control evasion was used. This does not invalidate the owner's reported personal-use
permission; automation and retention assumptions still need the bounded probe decision below.

| Use | Current disposition |
| --- | --- |
| Offline source and authored fixtures | Owner authorized; no Yahoo data involved |
| Personal research source selection | Owner selected; verbal permission reported |
| Automated access / internal calculation / private retention of real data | Unresolved exact scope; no observed runtime policy or live admission created |
| Public display / derived portfolio / benchmark / exports / permanent public archive | Not granted; no public projection or publication path |
| Incremental source cost | US$0 under Decision029; no subscription/trial/billing fallback |

`permanent_archive` is a distinct public use, not unlimited private retention. No source right
is derived from the library license, a worker message or a caller-supplied approval callback.

## Implemented architecture and record semantics

`FinancialStore` composes the existing `MarketStore`, immutable SourcePolicy/instrument/calendar
records and SQLite transaction boundary. Schema23 adds empty scopes, revocations, logical requests,
actual attempts/results, original payloads, observations/results and deliveries. No migration
seeds authority. `FinancialDataGateway` is a one-shot trusted facade; the existing synthetic price
collector, simulator, company/dispatcher and employee capabilities are unchanged.

The fixed Python child delegates HTTP over a bounded ordered protocol. Endpoint qualification,
shared reservations, limits, retry/circuit state and original retention live in TypeScript.
The dormant HTTPS implementation pins validated public DNS addresses, verifies TLS, denies
redirect/consent/login/proxy routes and uses an ephemeral bounded Secure cookie jar. It is tested
with injected fake DNS/HTTPS. The production transport rejects before DNS. Enabling a live probe
requires separately reviewed trusted admission and retention/custody integration; it is **not a
configuration toggle** in this accepted source.

Only the trusted `FinancialAdmission` seam can issue immutable private delivery receipts.
Consumer identity must come from a future trusted scoped tool binding, not employee text. No
new employee tool is exposed in this milestone. Future wiring must preserve policy, private
audience, consumer/observation identity and delivery time through existing scoped evidence reads;
generic owner-material import would strip this provenance and is not authorized. Workers retain
no shell/Python/HTTP/cookie authority. Financial records are not simulator price/action records,
and cannot enter the current public export/Ask/projection interfaces.

| Class | Supported normalized records and limits |
| --- | --- |
| OHLCV | Daily, explicit exclusive-end range up to366 days; stable symbol mapping, USD/venue and New York timezone validation against frozen calendar; original event timestamp and library midnight index; volume shares; separate adjusted close; missing elapsed sessions, null/NaN and partial bars explicit |
| Fundamentals |16 allowlisted metadata/metric fields; market-cap quote currency and company reporting currency separately preserved, unknown currency unqualified; current snapshot only |
| Statements | Income, balance sheet and cash flow, annual/quarterly; up to4/5 periods and300 labels; fiscal end retained; unknown unit/release/filing time remains unqualified/null |
| Splits/dividends | Ratio or amount/currency and original action event timestamp separate from the price bar; missing dividend currency unqualified; declaration/record/payment time unknown unless actually provided by a future qualified schema; no action cash posting or completeness claim |

`financial-research-v1` observations retain provider/feed, Yahoo symbol and stable internal
instrument, policy/instrument/calendar hashes, complete normalized request, sanitized underlying
parameters, Python/library/adapter versions, exact adapter output and bounded successful JSON
response text/hashes. Bootstrap cookie/crumb bodies are excluded; receipts retain hash/size/status.
Raw JSON persists before normalization, including failed schema cases. Transport strings are
UTF-8 decoded bodies, not a claim to original compressed/TLS wire bytes. Responses using content
encoding are rejected by the dormant wire. Source IDs/revision/publication are null when absent;
IDs and append-only A→B→A revisions are explicitly local.

Individual raw retrieval times, complete-packet first retrieval, normalization, fiscal/session/event
dates and actual consumer delivery are distinct. Provider availability remains null. A cutoff
requires original retrieval, normalization and delivery no later than that cutoff and the latest
locally known vintage at that time. Corrections do not rewrite past observations, decisions,
orders or journals. Clock rollback fences collection/delivery. Cache repeats preserve original
knowledge times. Statements with unknown units are research-visible but decision-unqualified.

All records retain `executionQualified=false`, `audience=private_research` and unqualified provider
split adjustment basis. Explicit library flags do not establish as-traded price meaning. Adjusted
returns must never be combined with explicit action accounting as if both were raw. Historical
research remains separate from a new prospectively approved observed-price method and run.
HQ-READY-02 `private_paper` and `inv05-v1` remain synthetic-only; no real observed-price fills.

## Bounds, cache and recovery

- One active provider operation and one wire attempt at a time across handles/processes sharing
  the authoritative SQLite database. Reserve before I/O; singleton immutable scope cannot refill.
- Scope maximum100 actual attempts,8MiB aggregate response budget,262,144 bytes per response,
  minimum five seconds between attempts, at most two transient retries. Source policy can only
  tighten limits. Bootstrap and all library-internal requests consume the same allowance.
- Aggregate operation deadline up to120 seconds; each attempt obeys the source-policy timeout
  (at most10 seconds); child hard deadline120 seconds. No unbounded wait/retry or `period=max`.
- Cache identity includes policy/instrument/calendar, exact fields/range/adjustment and all adapter
  versions. Class ceilings are24h for history/actions/fundamentals and7 days for statements,
  further capped by policy `cacheMs` (currently at most24h). Missing/NaN/partial records never
  qualify as cache hits. Use-time freshness is independent; stale evidence is visibly labelled.
- Retain full Retry-After,403 access blocks and finite transient circuits. Unknown transport,
  cancellation after reserve or interrupted completion consumes allowance and globally fences
  new I/O. There is no reset/reconciliation permission in this milestone.
- Immutable history is capped at32MiB plus bounded metadata,10,000 logical requests/deliveries/
  observations; individual responses, result output and rows have earlier caps. No silent pruning.

Crash/restart acceptance concerns **one intact authoritative SQLite history**, including a real
SIGKILL after reservation. It does not establish allowance preservation after copying, deleting
or restoring the database, or replacement of all custody copies. Live collection stays blocked
until that separate custody/reconciliation design is reviewed. Existing immutable HQ tables are
not a finite-retention deletion system: real probe data must use a disposable, private isolated
database/capsule, never the production HQ or backups.

## Separate bounded live-probe proposal — not authorized or executed

Proposed owner decision: one manually started, non-model probe of **AAPL**, mapped to Apple common
stock/XNAS/USD, solely to inspect the selected source's actual schemas, coverage and limitations.
No employees, order tools, production/scheduler, public output or payments. Owner confirmation
may remain accurately reported verbal evidence; no mandatory written agreement is imposed.

| Scope item | Exact proposed bound |
| --- | --- |
| Logical reads | Nine: one OHLCV, one actions, one fundamentals, plus income/balance-sheet/cash-flow each annual and quarterly. Stop on failures; no broadened universe or fallback |
| Historical range |2026-09-01 inclusive to2026-10-01 exclusive, daily, explicit unrepaired flags; metadata `range=1d` only |
| Fundamental fields | `shortName,longName,sector,industry,country,marketCap,totalRevenue,totalDebt,totalCash,trailingPE,forwardPE,priceToBook,sharesOutstanding,profitMargins,revenueGrowth,returnOnEquity` |
| Statement wire range | Pinned library uses2016-12-31 through UTC day ceiling at probe start; freeze exact epoch bounds in the approval manifest, maximum12 years; only annual/quarterly labels for selected statement,300 types maximum per request and4/5 returned periods |
| HTTPS GET endpoints | `fc.yahoo.com/`; `query1.finance.yahoo.com/v1/test/getcrumb` and the same path on query2; `/v8/finance/chart/AAPL` on query1/query2; `/v10/finance/quoteSummary/AAPL` on query1/query2; `/v7/finance/quote?symbols=AAPL` on query1/query2; `/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL` on query1/query2 |
| Endpoint parameters | Exact qualifier in `src/domain/market/yahoo-transport.ts`; chart1d only, no pre/post; quoteSummary five audited modules; locale en-US/US; quote AAPL only; fundamentals helper timeseries only `trailingPegRatio`. Crumb is transient and excluded from durable parameters |
| Actual requests | At most50 total including bootstrap/chunks/retries; one at a time, at least5 seconds apart; at most two502/503/504 retries inside that total;403/429/redirect/consent/schema/oversize/unknown stops the probe |
| Bytes/time |262,144 bytes per response,8MiB total,10-second per-request timeout,120-second logical deadline,10-minute overall scope; no budget/time refill after interruption |
| Storage and retention | Private local isolated disposable capsule outside repository/production/sync/backups; original responses and immutable receipts encrypted/access-restricted by owner host; maximum7 days from start, then destroy entire capsule including SQLite WAL/SHM and private report. No raw or derived real data in Git/public artifacts; only a non-data pass/fail/request-count summary may be retained |
| Permission assumptions | Owner confirms that reported personal-use permission covers these automated endpoints/rate, private calculation and seven-day retention; any narrower conditions become stricter scope. No public/derived/export/archive rights inferred; US$0 |

Before any probe, implement and independently review a trusted owner-approved manifest bound to
exact policy/instrument/calendar/endpoints/parameters/limits/expiry, authoritative request custody
and whole-capsule expiry/deletion. Admission cannot be a worker-written message, environment flag
or no-op callback. Freeze an updated calendar/reference and evaluate current terms/permission
evidence without overstating it. Record actual endpoint attempts, sizes/timing, originals/failures,
field coverage, metadata/statement units, adjustment and availability findings privately. The
50-request ceiling may end before nine reads complete; incomplete coverage is the result, never
permission to extend. Approval of this proposal would authorize that bounded qualification work,
not observed trading, HQ-READY-04, production acquisition or publication.
