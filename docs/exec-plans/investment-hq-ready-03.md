# Planned HQ-READY-03 — Yahoo evidence gateway and prospective method qualification

**Status:** Planned; implementation not selected or executed by the source-selection task  
**Owner:** Future sole writer/integrator, with risk-based read-only specialist review  
**Branch/worktree:** To be created from synchronized main when implementation is selected  
**Prepared:** 2026-10-11 America/Vancouver  
**Implementation ETA:** Estimate after owner selection and source-scope preflight; no schedule or collector created  
**Baseline:** HQ-READY-02 merged at `069f7e442ba20a6d61e636b983cecce1c3ad5863`

## Objective and settled direction

Implement the preferred **Yahoo Finance / Python `yfinance`** adapter behind BotSquad's controlled
**Financial Data Gateway** for private personal research, using [Decision038](../decisions/decision_038_yahoo_finance_private_source.md).
Qualify each supported data class and its point-in-time semantics. Return explicit blocked or
unavailable results where the selected source cannot meet an exact requirement. Do not reopen
primary-source selection or silently substitute a paid/alternate source.

The owner reports verbal permission from Yahoo for personal use. That is recorded owner evidence,
not independently verified writing or a blanket automated/public-data grant. Resolve automated-access
and retention scope separately from public redistribution. Lack of public rights must not be
confused with lack of private permission, and private permission must not enable a publisher.

## Authorization and non-goals

This is a prepared implementation plan, not permission to run it. A later explicit implementation
selection should authorize source changes, additive inert migrations as needed, authored synthetic
fixtures, deterministic adapter/gateway tests and reviewed Git integration. Live Yahoo requests
need a separate bounded probe scope (endpoints, data classes, instruments, request/byte/time totals,
retention and use assessment). No probe happens merely because this document exists. A clarification
can remain accurately labelled owner-reported evidence; do not invent a mandatory written agreement.

No paid source/subscription, account or billing changes, recurring collectors, production changes,
HQ-READY-04 employee run, model inference, public publication, Asymmetri modification or real trading.
The US$0 incremental market-data budget is fixed. The selected personal project is not expanded
into commercial or multi-user data distribution. No scraping evasion or proxy/identity rotation.

## Read and verify before coding

Root AGENTS; Decisions029/031/032/035/036/037/038; current investment decision register and
[market rules](../experiments/investment/SIMULATION_RULES.md#7-market-observations-and-licensing);
[operational design](../operations/INVESTMENT_OPERATIONAL_DESIGN.md#5-time-fills-actions-and-valuation),
[readiness](../operations/INVESTMENT_READINESS.md#yahoo-source-selection--2026-10-11) and
[HQ-READY-02 acceptance](../validation/investment/HQ-READY-02.md).
Inspect the actual main SHA, worker/runtime restrictions and active writers before selecting files.

Current source accepts `synthetic-json-v1` only in `MarketCollector`; `PriceAdapter` and evidence
schemas cover regular open/close, not a general OHLCV/fundamentals product. `MarketStore` stores
policies/instruments/calendars/prices/actions. Neither changing a label to `observed` nor installing
`yfinance` creates a valid integration. Document new typed records and admission explicitly.

## Implementation sequence

### 1. Source dossier and use-specific policy

Record provider/feed/endpoints, applicable regional/finance terms and access date, the exact
owner-reported permission and unresolved scope. Keep internal research/calculation and retention
separate from automation and from each public use. Record retention/deletion obligations and
private backup boundaries; do not interpret the existing `permanent_archive` flag as unlimited
private retention or public licensing. No data gets an `allowed` policy solely from library docs,
software licensing, source selection or an employee assertion.

Freeze the intended small universe, instrument/venue/currency mapping, data classes, requests,
retention horizon, rate/cost bounds and expiry. Record data availability/quality separately from
permission. A private-qualified field can remain public-blocked. No provider contact or broader
permission claim is implied. Keep the dossier private where it contains personal correspondence.

### 2. Gateway and Python adapter boundary

Reuse `src/control/market/{collector,store,admission}.ts` and
`src/domain/market/{types,normalize,admission,validation,calendar}.ts` as the trusted gateway
foundation. Keep policy, quota, receipts, caching, quality and use-time admission there; keep
Python/library behavior in one narrow adapter. Specify a versioned typed request/result protocol,
fixed executable/entry point and dependency lock for Python plus a tested pinned `yfinance` release.
Audit its required dependencies and supported transport hooks at implementation time; no package
is installed by this plan.

Workers receive only scoped admitted observations through existing evidence interfaces. They do
not get arbitrary symbols/URLs, shell/Python access, provider cookies or general HTTP authority.
Use an allowlisted egress/transport boundary that bounds actual underlying requests, redirects,
responses and credentials. Reserve attempts before I/O; recheck use policy/expiry before persistence
and delivery. Library callbacks, transport/cache behavior and internal retries must be observable
and bounded; if this cannot be enforced, live adapter admission stays blocked.

The adapter cannot place/fill paper orders, invent source policy or start a background service.
Migrations/import/startup remain inert. No new timer or unbudgeted employee/coordinator turn.

### 3. Supported records and provenance

| Data class | Planned support and explicit exclusions |
| --- | --- |
| Historical OHLCV | Explicit interval/range, session/calendar, venue/timezone/currency, volume units, complete/partial bar and raw/adjusted semantics. Daily history is research data until separately qualified for an approved execution method. |
| Company fundamentals | Available company metadata and metrics with field definitions, units/currency, as-of/source times and missingness. A current snapshot is not point-in-time historical fundamentals. |
| Financial statements | Income statement, balance sheet and cash flow, annual/quarterly as available; retain fiscal period, period type, release/filing time if supplied, source labels and restatement version. Do not fabricate absent dates or values. |
| Splits/dividends | Available ratios/amounts, currency, ex/effective/record/declaration/payment dates as supplied; distinguish date-only fields from instants and missing from zero. Incomplete action/payment evidence cannot authorize cash posting or prove no action occurred. |

Persist the earliest unmodified available provider/adapter observation, payload/hash, provider/feed,
Yahoo symbol and internal stable instrument mapping, request parameters and response metadata,
Python/yfinance/adapter/schema versions, original timezone/session, retrieval and normalization
times, provider availability time if known, first local knowledge time, adjustments and quality.
Retain actual provider IDs/versions if supplied. Otherwise create a distinctly local content ID
and revision chain; do not claim Yahoo supplied a durable ID or revision counter.

Retain exact provider bytes only where accessible and permitted. When `yfinance` exposes only
processed tables, preserve that original adapter output and explicitly record the missing raw
payload evidence. Any field needing stronger provenance remains unqualified. Preserve missing,
NaN, stale, delayed, partial, unavailable, rate-limited, conflicting, schema-changed and corrected
states through normalization; no forward-fill, zero substitution or model-generated replacement.

### 4. Point-in-time and adjustment rules

- Store event/session/fiscal-period time, provider publication/availability time, first successful
  retrieval, normalization time and later retrievals separately. Unknown availability stays null;
  a historical date or first retrieval must never be relabelled as provider publication time.
- Historical decisions can use only the admitted original vintage actually knowable/delivered by
  their cutoff. Today's revised history or fundamentals cannot be replayed as yesterday's evidence.
  Backfills may support labelled retrospective research, not earlier operational decisions.
- Make adjustment behavior explicit and versioned. Qualify `auto_adjust=False`, `back_adjust=False`,
  `repair=False`, `rounding=False`, actions and timezone handling rather than rely on defaults.
  These flags are planned settings, not proof of raw as-traded values; split normalization can still
  require separate qualification. Keep adjusted/total-return series separate from raw-price plus
  explicit-action accounting, preventing double-counted splits/dividends. Repair output never
  replaces the original observation and cannot silently become execution evidence.
- Append changed-provider observations/restatements as revisions with original knowledge times,
  hashes and predecessor links. Idempotent repeats/cache hits preserve original timestamps. Preserve
  prior decisions, fills and journals; separately attributable revaluation is not a rewritten trade.
- Calendar dates are not evidence of exchange openings, absence of halts or corporate-action
  completeness. Handle DST, holidays, early closes, symbol/listing changes and incomplete current
  bars explicitly. Do not relabel delayed daily Open/Close as a contemporaneous live quote.

### 5. Rate, cache and failure contract

Proposed conservative starting limits for later review, **not Yahoo-advertised limits or permission**:
shared one-request-at-a-time egress, at least five seconds between actual outbound requests, at
most two retries for transient failures within a finite request/deadline budget, and no unbounded
`period=max` or full-universe download. The separately approved probe must set a small total cap;
production cadence is not selected here. Disable library parallel download (`threads=False`) and
validate hidden cookie/session/bootstrap/action requests against the same quota.

Use one durable provider budget shared across data classes/workers/processes and cache misses.
Cache immutable originals by policy, instrument, interval/range, adjustment, fields and adapter
version. Freeze class-specific TTLs at implementation review: refresh no more frequently than the
needed daily-session research cadence; statements/fundamentals should have longer TTLs appropriate
to releases. TTL does not refresh observation/availability time or override stale-data policy.

Bound socket/subprocess duration, bytes, rows, histories and retained storage. Honor Retry-After
without shortening it; if beyond the current deadline, return deferred/unavailable and stop the
attempt. Back off and retain 429/403/schema/timeout/error receipts; no retry storm or anti-bot bypass.
After the bounded transient allowance, open a visible failure circuit requiring the configured
cooldown or owner action. Cache failure results conservatively; never serve last-good data as fresh.
Keep consumed attempts across restart and duplicate requests; interrupted effects are not refunded.

### 6. Research qualification versus observed paper execution

Historical Yahoo research support can be accepted while observed fills remain blocked. Preserve
HQ-READY-02's synthetic-only `private_paper` scopes and `inv05-v1` tests unchanged; never widen an
existing run's evidence mode or replay Yahoo into its history. Do not treat its zero-research/private
allowlist as automatic authority for a new network source.

If the owner separately selects observed paper operation, require an explicit new run/scope,
qualified private source policy and approved versioned methodology. The operational design's T1
proposal needs an eligible new raw observation after locked decision/review/guard/quantity, with
execution time no earlier than qualified observation/processing. Yahoo historical daily bars alone
do not establish that event or its availability. Keep matching benchmark funding/reinvestment,
valuation, corporate-action and freshness semantics in the same approved version. No silent
next-open timing change, stale-price trade, invented dividend pay time or favorable correction.
If Yahoo cannot support the chosen method, deliver private research plus an explicit fill gate;
request a prospective method/source decision rather than fabricate evidence.

## Acceptance requirements for the later implementation

1. Empty setup/migration/import/startup invokes no Yahoo request, provider model or scheduler.
   Existing synthetic/pilot/strict policies and Decision0374/4 remain unchanged.
2. Authored fake Yahoo-shaped payloads cover all four data classes, unavailable fields, empty
   responses, currency/unit/schema changes, partial OHLCV and numeric precision. Unsupported
   fields produce typed quality failures, not guessed data or silent fallback.
3. Compare original payload/adapter output and normalized result; IDs, version/hash, source dates,
   first knowledge, cache-hit timestamps, null availability and correction lineage survive restart.
4. Demonstrate no lookahead from after-cutoff bars, current fundamentals, delayed statements,
   restatements, split-adjusted history or future corporate actions. Period end is never release.
5. Concurrent callers share rates/cache/budget; include internal library requests/retries, 429 with
   long Retry-After, 403/block, timeouts, child-process failure, oversized output, cancellation,
   expiry/revocation during I/O and crash after reservation/before result. No bypass/replay/refill.
6. Keep private Yahoo data and derived artifacts out of every publication/export/public Ask route,
   even if a worker or stale receipt asserts consent. Source choice never manufactures public rights.
7. Keep existing simulator/accounting/market/loop/runtime regressions green. Test BUY/SELL/HOLD,
   missing/uncertain actions, risk/benchmark and financial history only with deterministic fakes;
   observed method tests require its separate prospective approval. Browser checks only if UI changes.
8. A separately authorized live non-model probe must record actual bounded requests, observed
   coverage/quality/adjustment/availability, original receipts and failures privately. Fakes or
   library documentation cannot satisfy this gate; no live payloads go into public Git fixtures.

Use read-only `security_reviewer` for scope/egress/publication, `recovery_reviewer` for attempts,
cache/revisions/restoration, `control_plane_architect` for the Python/gateway boundary, and
`test_reviewer` for point-in-time/financial claims as those surfaces change. Parent is sole writer.
Run focused checks first; broaden shared regressions serially after resource checks. No real
employee runtime script, production migration or collector activation belongs to HQ-READY-03.

## Deliverables and stop conditions

Deliver the use-specific Yahoo dossier, reviewed inert gateway/adapter source, locked dependencies,
typed provenance/quality and point-in-time fixtures, request/failure/recovery tests, operator docs
and validation record. Report source, fake tests, permitted live-probe evidence and remaining blocks
separately. Qualify only supported fields; private research acceptance is not complete observed-run
or public-launch readiness. Preserve historical acceptance records and canonical public contracts.

Stop dependent live work for unresolved automation/retention scope, paid requirements, inaccessible
provenance, unbounded internal I/O, unsupported adjustment/action/time semantics or absent method
approval; continue authorized offline source/fixture work. No indefinite provider search. After
independent review, follow the normal scoped PR/merge/main synchronization workflow. Stop there;
HQ-READY-04/05, production, recurring acquisition and public release require separate authorization.
