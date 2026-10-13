# Yahoo Financial Data Gateway — source dossier and bounded qualification runbook

**As of:** 2026-10-12 America/Vancouver; HQ-READY-03H selected direct qualification.
**Provider/feed:** Yahoo Finance / Python yfinance1.7.0, Python3.12.12.
**State:** Default application/employee transport inactive. HQ-READY-03B source is integrated; its single authorization is spent after an unknown bootstrap outcome, with no financial data admitted and cleanup verified. No collector, deployment, public artifact or trading activation.

**Current qualification gate:** [HQ-READY-03H](../validation/investment/HQ-READY-03H.md)
selects the single direct chart request under [Decision044](../decisions/decision_044_one_shot_direct_yahoo_chart.md).
Its reviewed merged clean-main attempt returned HTTP200 and21/21 complete September sessions.
Immediate key/capsule destruction and process termination are verified;03H is permanently
spent. No replay is permitted.03B/03D/03E remain spent;03G remains unprepared.
No production/employee collector, paper fills or public data is enabled.

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

## Original bounded live-probe proposal — selected for HQ-READY-03B

The owner selected this exact proposal for HQ-READY-03B: one manually started, non-model probe of **AAPL**, mapped to Apple common
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


## HQ-READY-03B owner admission and custody

[Decision039](../decisions/decision_039_one_shot_yahoo_qualification.md) and
[acceptance](../validation/investment/HQ-READY-03B.md) supersede only the earlier unimplemented
admission/custody status and the proposal's lack of owner selection. All other source and use
limitations above remain. Source/fixture acceptance, Git integration, main rebuild and actual
probe completion are separate gates; inspect the acceptance record before executing anything.

Only the dedicated local owner CLI can prepare/consume the fixed OS-account authorization.
`HOME`, caller-selected paths, modes, environment flags, SQLite data or employee messages cannot
mint live authority. `prepare` creates the exact ten-minute manifest once; `run` requires it and
burns a create-only spent marker before DNS. Existing/missing/corrupt/spent authority is never
reset automatically. Preparation or run failure is not permission to reissue the single probe.
The manifest includes exact source/build identity, policy/instrument/calendar, all nine requests,
reviewed statement-family lists/chunks, UTC epochs and limits. Every live request checks both
existing endpoint qualification and this stricter intersection.

The capsule is `/private/tmp/botsquad-yahoo-HQ-READY-03B`, private0700/files0600 and explicitly
excluded from Time Machine before provider I/O. The nonvolatile owner anchor is under the native
OS user's `Library/Application Support/BotSquad-Yahoo-HQ-READY-03B`, independently excluded.
Normal app/production databases and repository paths are never used. SQLite is memory-only;
original response bodies and processed observations are encrypted/fsynced with a key held only
in the original supervisor. Python timezone/cookie/ISIN caches are no-op, data-processing disk
writes are denied, and child/core/deadline controls are explicit. FileVault, encrypted swap and
zero core-dump limit are checked inside live capability issuance.

Retain data only during the supervised probe and inspection, then destroy the key and entire
capsule immediately, including child directories and private report. This tightens the seven-day
maximum. A ten-minute timer also closes custody; crashed-run ciphertext is not recoverable through
an application-persisted key and cannot resume. `cleanup` removes any orphan ciphertext and fsyncs
its deletion while preserving approval/spent/accounting receipts. Same-owner whole-host rollback,
malicious OS administration and forensic RAM erasure are outside this local trust boundary.

The completed qualification used the following commands after review/integration and a clean
synchronized main build. **Historical procedure only: the authorization is now spent. Do not run
prepare/run again.** Cleanup remains available for orphan ciphertext; it cannot restore authority:

```sh
scripts/yahoo-qualification.sh prepare
scripts/yahoo-qualification.sh run
scripts/yahoo-qualification.sh status
# Only for orphan ciphertext after a dead process; never an admission reset:
scripts/yahoo-qualification.sh cleanup
```

The gateway records reservations before DNS and distinguishes socket-start intent, known HTTP
status, bounded application body bytes consumed, full valid Retry-After and provider HTTP Date.
These byte counts exclude unread discarded buffers and HTTP/TCP/TLS overhead. Unknown/incomplete
receipts stop and retain conservative charges; they are not successful-response byte claims.
Next wire creation waits at least five seconds after previous response/receipt completion, which
is stronger than start spacing and includes DNS/TLS/fsync variation. Two transient retries are a
ceiling across each complete logical read, within50 total attempts. No401/403/404/429/redirect,
bootstrap barrier, invalid header/UTF8/schema, unexpected endpoint or unknown outcome is retried.
HTTP200 provider errors terminate before the library can enter quote/chunk fallback. A valid empty
actions result with complete validated daily coverage may continue; it is not proof of corporate-action completeness. Other missing-status results stop. Nonempty partial observations may continue with explicit missingness and quality limitations.

The owner explicitly requests a private final quality report: actual attempts/status/bytes/time,
aggregate coverage/missingness/currency/adjustment and timestamp quality may be reported in this
private chat. Raw prices, metrics, action amounts, financial rows, payloads and credentials never
leave private custody. The full private report and originals are deleted; Git retains only
non-data outcome/request counts and source/test/review evidence. No observed employee delivery,
historical-simulation admission, observed-price fill, public display or recurring collection follows.

The strict integrated fixture reaches50 requests during the seventh logical read with the
pinned library's repeated bootstrap and parent-only cookies. Each of all nine operations is also
validated separately with authored transport. This is a reason to expect partial live coverage,
not permission to bypass/refill the50-request cap or alter cookie identity to complete the list.

## HQ-READY-03C offline diagnosis and subsequent proposal

[Diagnostic acceptance](../validation/investment/HQ-READY-03C.md) records a reproduced Node24
pinned-lookup callback defect: `all:true` requires an array, whereas the old callback always
returned a scalar. The repaired transport supports both forms without changing the selected IP,
TLS verification, endpoint or request allowance. The original failed probe's exact cause remains
unknown because its exception code and individual connection milestones were not retained.
Its durable wire intent confirms earlier DNS/public-address validation, not a connected socket
or transmitted HTTP request. There is no evidence that Yahoo refused the original request.

New non-data receipts preserve fsynced milestone timestamps and allowlisted failure categories
for DNS/destination, local permission/configuration, TCP/TLS, write/reset, response timeout,
HTTP refusal/rate limits, cancellation and settlement uncertainty. Request-finish means local
write completion only. Late callbacks cannot revise settled receipts. Unknown outcomes still
consume their reservation and never replay; crashes with no terminal receipt stay unsettled.
No original receipt is rewritten or augmented retrospectively.

The first authority is spent permanently. The [separate second connectivity proposal](YAHOO_CONNECTIVITY_PROPOSAL.md)
starts with one bounded GET to `https://fc.yahoo.com/`, without nine financial reads, cookies or
fallbacks. It requires separate owner approval and a new reviewed one-shot capability. It is
unexecuted and not expressible by reusing the old manifest/CLI. Genuine financial qualification,
observed fills, employees, recurring operation, production and public delivery remain blocked.

## HQ-READY-03E — separate one-history qualification

[Decision041](../decisions/decision_041_one_shot_aapl_history.md) fixes one AAPL September2026
OHLCV operation, six ordered underlying requests including repeated cookie bootstrap and one
metadata chart, query1-only charts, no retry/fallback,1MiB total and a supervised180-second
process ceiling. [Acceptance](../validation/investment/HQ-READY-03E.md) owns its actual gate status.
The original03B and03D authorities remain spent; their commands/anchors are never reused.

The new dedicated entrypoint is `scripts/yahoo-history.sh` with `prepare`, `run`, `status` and
`cleanup`. Preparation is create-only and must follow accepted merge, fresh clean-main build,
source/host/custody verification. Run only consumes that existing independent approval. `cleanup`
requires the original data process group gone; it removes only the03E ciphertext capsule and
retains authority/non-data evidence. No environment or caller path can enable the live transport.
A denied/empty/unknown result is final; no further run follows. Check the acceptance disposition
before any operation. No data is admitted to employees, simulation, public outputs or production.

**03E is now permanently closed.** The single attempt received bootstrap HTTP404 and stopped
before chart access. Its approval is spent1/1/noResume; capsule/key deletion and prior receipts
are verified. Do not invoke prepare/run again. Only non-data status/cleanup inspection remains;
any new provider access requires a separately selected and reviewed authority.

## HQ-READY-03F — offline bootstrap correction

[Decision042](../decisions/decision_042_yahoo_bootstrap_compatibility.md) distinguishes a narrow,
complete plain-text cookie404 with a usable newly received anonymous cookie from terminal
refusal. The pinned library ignores bootstrap status; BotSquad retains the original404 and
counts it as an attempt. [Authored acceptance](../validation/investment/HQ-READY-03F.md) covers
full gateway/Python/normalization behavior. Unrecognized responses, missing cookie/crumb and
upstream no-crumb/refusal fallbacks remain blocked. The correction is fixture-only: existing
live custody/issuers and all historical receipts are unchanged and permanently spent.

The [next exact AAPL proposal](YAHOO_AAPL_QUALIFICATION_PROPOSAL.md) requires separate owner
approval and a reviewed extension of existing custody before any network access. No new
live authority was prepared or consumed. Fictional success does not classify the destroyed03E
body, establish today's access conditions, qualify execution prices or grant publication rights.


## HQ-READY-03H — one direct chart, no bootstrap

The separate fixed `scripts/yahoo-direct.sh` accepts the existing `prepare`, `run`, `status`
and `cleanup` lifecycle. These are owner-only operations, not startup, worker or scheduler
commands. `prepare` is create-only and `run` consumes once before DNS. Never rerun a spent
operation, remove its anchor, or use an older issuer to obtain another request.

Its exact manifest fixes query1 AAPL September2026, one request/connection/response,
262144 application bytes,16KiB parsed headers and10/120/180-second ceilings. Non200,
first informational/upgrade response, barriers, malformed/incomplete JSON, schema/identity
failure or uncertain accounting terminate. No cookie jar, crumb, credentials, redirects or
fallback exists. Pinned `PriceHistory` consumes the already captured response once; source
JSON types are checked before library coercion. FinancialDataGateway and existing admission
remain authoritative. Original values/event times exist only in the ephemeral private capsule
and memory; retained quality contains completeness/provenance facts without financial values.

The fixed OS-account anchor is `~/Library/Application Support/BotSquad-Yahoo-HQ-READY-03H`
(resolved from account identity, not HOME). The capsule is `/private/tmp/botsquad-yahoo-HQ-READY-03H`.
FileVault/encrypted swap/core-dump and verified backup exclusions are required. Parent/native
watchdogs independently cap the single operation and cleanup; supervisor loss terminates the
data process group. Recovery never recreates data/key or renews spent authority. An interrupted
empty-directory creation without capsule ownership evidence is not force-deleted: report
cleanup incomplete and retain the spent fence. No data/network exists in that narrow window.

After the single outcome inspect only non-data accounting/quality, verify all groups gone,
capsule absent and authority spent/noResume. Preserve the17 historical receipt hashes and
unused03G state. Success can support a separately authorized private employee-integration
proposal; failure requires a source decision memo, never an automatic second Yahoo attempt.
