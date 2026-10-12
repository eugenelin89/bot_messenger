# HQ-READY-03 Yahoo gateway source acceptance

**Date:** 2026-10-11 America/Vancouver; validation continues into2026-10-12 UTC.
**Base:** `92916908a409d55c20343890ff73f2ad86a0e890`, verified clean and synchronized before editing.
**Branch/worktree:** `codex/investment-hq-ready-03` / `../bot_messenger-hq-ready-03`; parent sole writer.
**Status:** Source and deterministic acceptance complete; approved for reviewed Git integration.
**Reviewed source/test commit:** `150ef9b0b191bcc77ea9a029a81d9a02584dc5f9`.
**Scope:** Explicit owner selection of source, dependencies, inert migration, authored fixtures,
read-only reviews and accepted Git integration. No live-data or operational acceptance.

## Implemented source

The selected [plan](../../exec-plans/investment-hq-ready-03.md) is implemented as a sibling research
facade over the existing MarketStore/policy/instrument/calendar/persistence boundary. It supports
daily OHLCV, company metadata/fundamentals, all three annual/quarterly statements, splits and
dividends through the pinned Python library. Schema23 adds only empty immutable tables.

Versioned normalized records retain original bounded response text, exact adapter output,
request/version/source hashes, provider event/fiscal end, unknown availability, first local
retrieval, normalization, delivery and immutable local revision chains. Missing sessions/values,
foreign or unknown currencies, uncertain statement units, adjustments and incomplete action dates
are explicit. No backfill/current snapshot/correction can be admitted before its knowledge and
delivery cutoffs. Separate action timestamps are retained; raw provider symbols are checked before
the library can overwrite them. Records remain private research and execution-unqualified.

Every underlying request is reserved durably before I/O, including bootstrap/library internals
and retries. Limits, rate spacing, cache identity, policy/expiry/revocation checks, per-attempt and
aggregate deadlines, byte/output/storage caps, circuits and permanent unknown fences are trusted
TypeScript controls. Python has fixed executable/entry point, scrubbed temporary environment,
bounded ordered stdio, no shell and delegated HTTP. The real library is tested with authored HTTP.

Production Yahoo transport always rejects before DNS. Scopes remain fixture-only. No employee
tool, scheduler, runtime route or public projection is added. Future scoped employee wiring must
use the trusted admission seam; this acceptance does not claim that wiring is implemented. The
[dossier/runbook](../../operations/YAHOO_FINANCIAL_GATEWAY.md) gives exact limits and the separately
unauthorized probe. Live admission requires reviewed owner approval, finite retention and restore
custody integration, not a configuration toggle.

## Deterministic acceptance map

| Plan requirement | Evidence and limit |
| --- | --- |
|1. Inert setup/migration | Populated schema22→23 repeated migration compares every prior row/rowid, old ledger and filesystem inventory, foreign keys/integrity; no authority seeded; default gateway/production transport deny before I/O |
|2. Four classes and quality | Authored fictional ACME Yahoo-shaped payloads, actual yfinance1.7.0 execution for OHLCV/actions/fundamentals and six statement combinations; null/NaN, changed schema/currency/columns, missing/partial sessions, precision and empty data |
|3. Originals and provenance | Original bodies persist before normalization even on schema failure; raw parameters redact crumb; library versions, first knowledge and local A→B→A lineage survive reopen; immutable triggers and cache/replay timestamps |
|4. No lookahead | Late/current fundamentals and statements, after-cutoff corrections/delivery, partial/future bars/actions, stale evidence, unknown units, adjustment labels and frozen calendar/DST checks; no conversion to simulator records |
|5. Bounds and failures | Concurrent/duplicate requests, shared handles/budgets, real-clock three-call spacing, long Retry-After,403/redirect/503, smaller policy timeout, aggregate timeout, cancellation, actual Python child close, malformed/overlapping/oversized stdio, fake DNS/TLS/cookies, expiry/revocation and SIGKILL after durable reservation |
|6. Private boundary | Public delivery use rejected, source policy rights rechecked, observation type denied by existing MarketAdmission; no employee/public route or export capability introduced; existing publication regressions retained |
|7. Repository/financial preservation | Focused and full serial tests, typecheck/build and contracts results below; existing BUY/SELL/HOLD, accounting, benchmark, risk, recovery, team/loop/runtime checks use deterministic fakes |
|8. Actual Yahoo probe | **Not executed and not accepted.** Zero real Yahoo market-data requests. Proposal requires separate owner authorization and admission/custody work; fixtures cannot satisfy this gate |

## Dependencies and commands

Python **3.12.12**, **yfinance1.7.0**, all22 transitive packages pinned with wheel SHA-256 hashes.
The [audit](../../../adapters/yahoo/dependency-audit.json) records exact versions/artifacts and
published PyPI advisory metadata; arrays were empty, which is not a comprehensive security
guarantee. [Adapter instructions](../../../adapters/yahoo/README.md) document audited capabilities,
known library transformations and reproducible offline validation. `pip check` passed; a
wheel-only `--require-hashes --ignore-installed --dry-run` independently verified lock resolution.
No Node dependency changed. macOS arm64 was tested; Linux execution/confinement is unproven.

Initial focused runs exposed and repaired the Python audit-hook conflict with urllib3's local
IPv6 bind feature check, schema23 compatibility in the simulator, and test-clock setup. The
first reviewed focused run passed64/64 in22.797s at `/tmp/hq-ready-03-focused-final.log`.
Independent acceptance review then required stronger original-identity and currency/action-time
fixtures and corresponding source fixes; final evidence supersedes that checkpoint.

The first full sandboxed run (`/tmp/hq-ready-03-full.log`) reported1,318 tests:1,251 passed,
61 failed,6 skipped in374.192s. Many loopback tests failed `listen EPERM`; nested engineering
validation also failed under the outer sandbox. One late Python fundamentals check encountered
the in-progress protocol revision while the TypeScript output was still the previous build, so
this was not a final frozen-source run. The entire suite was rerun below on the final fixed tree
with host permission for its existing local test fixtures; no network source grant follows.

Final frozen-source validation:

| Command/evidence | Result |
| --- | --- |
| Focused gateway/recovery/Python/protocol/wire tests | **72/72 passed**,0 failures/skips,25.545s; `/tmp/hq-ready-03-focused-reviewed.log` |
| `npm test` (serial, host-authorized local fixtures) | **1,326 tests:1,320 passed,0 failed,6 skipped**,482.223s; `/tmp/hq-ready-03-full-final.log` |
| `npm run check` | Passed |
| `npm run build` | Passed in focused/full/contracts commands on unchanged source |
| `npm run contracts:test` (includes `contracts:check`) | **175/175 passed**,0 failures/skips; `/tmp/hq-ready-03-contracts.log` |
| Dependency consistency and wheel hashes | `pip check` and hash-required wheel-only dry run passed; `/tmp/hq-ready-03-dependency-check.log` |
| Documentation/scope |515 local links checked with0 missing files/anchors; `git diff --check` passed; changed-file secret-pattern review found no token/private-key matches |

The six full-suite skips are pre-existing: four actual isolated team receiver variants, one
actual standalone receiver integration and one Linux-only generic-recipe resource test. They
are not counted as passes. All21 actual pinned-Python tests executed against authored responses;
none were skipped. No UI changed, so no new browser acceptance was required. Financial, market,
accounting, recovery, publication, loop and runtime suites passed in the full run. Canonical
contracts, Node dependencies, Decisions029/037 and historical HQ-READY-02 acceptance are unchanged.
Heavy jobs ran one at a time after host capacity checks; other worktrees were untouched.

## Independent reviews and resolved findings

Read-only architecture, recovery, security and acceptance specialists advise the parent writer.
The initial architecture/security/recovery checkpoint was manifest
`836f1136430cf25d65bc1f1cd57a40ab50e5f06f1a5aa3197b7360b6035dc751`.
No specialist edited files, ran genuine employees, contacted Yahoo or performed Git integration.

Material findings addressed in source and targeted fixtures:

- Durable completion/delivery high-water timestamps prevent rollback/backdating after a request
  start; idempotent delivery replay does not consume new storage allowance.
- Separate each source-policy wire timeout from the aggregate scope deadline; cookie→crumb→data
  can complete with genuine five-second spacing while a hanging attempt times out promptly.
- Detect missing elapsed scheduled sessions; label gaps without fabricating price rows.
- Preserve original payloads even when normalization fails; bound/validate child stream and wire
  behavior, including actual cancellation and unknown request effects.
- Preserve reporting currency separately from trading/quote currency, and dividend currency
  separately from stock currency; absent currency becomes unqualified, not USD by assumption.
- Validate original chart/quote/timeseries symbols before yfinance can rewrite them.
- Preserve each raw action event timestamp instead of substituting its OHLCV bar timestamp.

The final13-file source checkpoint is manifest SHA-256
`05fcb9509cb14653e59bd77927382996c22462494c42b9acef407a4222141163`.
The committed [complete32-artifact source/test/dependency manifest](HQ-READY-03-source.sha256)
has SHA-256 `5abe932b5da0d39bf3d8f1fde609bcaf9d491cee7b951c758e9066b021713b31`.
Every entry matched before and after final tests and matches the reviewed commit above.
Architecture, security, recovery and acceptance re-review found no remaining blocking/important
findings. The test reviewer inspected the completed full/focused/contracts logs and accepted
source and deterministic acceptance for Git integration. Actual Yahoo validation is not accepted.

## Preserved authority and remaining gates

Decision029 remains US$0. Decision037 is exhausted4/4; no genuine employee inference, new credit
authority or expenditure occurred. HQ-READY-02 and `inv05-v1` stay synthetic-only. No production
database was migrated, collector scheduled, observed paper fill enabled, Asymmetri/public data
published, paid feed selected, real-money trade placed or HQ-READY-04 started.

Crash/restart evidence covers an **intact authoritative SQLite ledger**, not copied/deleted/
restored allowance or replacement of all custody copies. Real probe data needs a separately
reviewed disposable private capsule with finite expiry/deletion and authoritative custody. The
owner's reported verbal personal-use permission is accurately preserved; automation/retention
and public rights are not invented. No written agreement is required for this offline acceptance.
Actual Yahoo availability/coverage/limits, Linux confinement, scoped employee delivery wiring
and a prospectively approved observed-price method remain unvalidated or unimplemented gates.

Stop after accepted source integration. The next possible bounded action is the separate
[live-probe proposal](../../operations/YAHOO_FINANCIAL_GATEWAY.md), not production or trading.
