# INV-REAL-01 — persistent observed paper investment acceptance

Status: final acceptance in progress on `codex/inv-real-01`; no live operation is inferred.
Source baseline: `b06bc51059372b633c98b68ecc3ef144f999781c`.
Owner instructions, methodology and finite operational boundaries are recorded in
[Decision047](../../decisions/decision_047_persistent_observed_paper_investment.md).
The [operation and morning handoff](../../operations/INV-REAL-01.md) owns deployment status.

## Connected implementation

The existing gateway, deterministic fixed-point ledger, genuine-employee adapter, independent
finite journal, HQ scheduler, private owner UI and canonical signed publisher are reused.
Schema25 is additive and inert. `inv-real-open-v1` is separate from unchanged synthetic-only
`inv05-v1`. Defaults are USD100,000, eight equities plus SPY, 15% position/35% sector limits,
5% cash, zero commissions and10bps simulated one-way slippage. Exact future sessions and
source requests are finite; renewals preserve the same portfolio and consumed history.

A same-session post-close direct chart qualifies raw daily OPEN/CLOSE only when original
numeric OHLCV, instrument, venue, currency and regular-session timestamps agree. Historical
bars are research-only. Local retrieval remains the knowledge bound. No fixture fallback,
historical backdating, source-denial evasion, real trading or paid market data is added.
Normalized evidence and immutable decisions persist; raw response bodies are transient.

Employees propose through normal discussion tools, review exact independent proposals,
and submit bounded BUY/SELL/HOLD. Structured public facts, assumptions, alternatives, risks,
horizon, invalidation and position-change reasons are separate from private narratives.
Only completed attributed proposal/review pairs can be published. Canonical v1 manifest is
unchanged: `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.

## Evidence ledger

All market responses and employee replies below are authored fixtures unless explicitly
identified as production. These checks establish implementation and safeguards, not genuine
reasoning, financial performance or elapsed live sessions.

- Original focused suite:12/12 passed before expanded cases.
- Default nine-instrument four-session vertical: passed. BUY/HOLD/SELL, normal HQ dispatch,
  fixed accounting, signed canonical receiver validation, publication reconciliation, restart,
  and renewal preserve one initialization, losses, journal prefix and rolling consumption.
- Corporate-action/revision case: passed; split preserves basis and duplicates are suppressed.
  A later dividend cancels the pending SELL and accrues an unpaid receivable. Revised historical
  research is retained without replacing the earlier qualified fill.
- Missing-close case: passed with actual bounded retry clock progression and unavailable
  valuation; no invented mark. A later eligible SELL remains independently exercised.
- Source fencing covers deadline, Pause, Stop, restored occurrence ownership and post-response
  interruption. No post-fence admission or consumed-request replay is allowed.
- Populated schema24→25 preservation passes including original rowids/fields, immutable guards,
  independent spent authority, integrity and foreign keys.
- Events-only standing consent keeps `contentTypes: []`; canonical receiver scope uses its
  required JSON member but an injected JSON upload is rejected before transport. Passed.
- Later chosen benchmark session and prospective recovery preview domain checks: passed.
  The explicit deferred comparator is cash followed by the configured benchmark, with dated
  public disclosure and no retroactive allocation or discretionary-risk bypass.
- Owner UI at390/1440 passed: preview and consent are inert, Stop/renewal keep the same book,
  no page overflow, readable figures, zero external source/model/publication activity.
- Failure/interruption renewal, idle restart and future operation pass with trusted provider
  completion and full usage evidence. Five integration negatives preserve the hold for null
  usage, missing categories, retry, unknown settlement and provider interruption after an earlier
  complete response. Two legacy negatives retain prior behavior.
- Late-review publication passes: an earlier proposal reviewed later appends ordinals3/4 while
  the already-published pair remains byte-identical. Missed initial benchmark recovery passes,
  including historical reconstruction before/after the deferral and denial after allocation.
- App Server success/interruption/deadline marker checks pass. Typecheck/build and canonical
  contract check pass. Final full regression passed:1,869tests,1,863passes,0failures and6conditional skips.
  Five skipped actual-receiver checks separately passed against the compiled website receiver;
  the remaining skip is an unrelated Linux engineering recipe platform gate. Final owner-browser
  checks passed2/2 and actual finite-policy adapter marker assertions passed2/2 on Linux.
  See the [source acceptance receipt](../evidence/inv-real01/source-acceptance.json) for log hashes.

The initial1856-test suite had1846passes,6environment-gated skips and4stale schema-version
expectations; those assertions were updated from24to25. New recovery fixtures exposed a real
usage-completeness integration defect, now fixed with an independently reviewed provider
completion marker. Two fixture expectations were also corrected: configuration identity uses
its canonical hash, and the late-review path takes five actual turns. No financial or safety
assertion was removed.

## Independent review and dispositions

Architecture, security, recovery and acceptance specialists worked read-only. Findings fixed
within this milestone include source-occurrence expiry/replay ownership, permanent accounting
continuity, settled predecessor failure recovery, actual `interrupted` status, exact public
review settlement, late-review ordinal stability, transient raw-response handling, scoped
standing summary publication, API/UI metrics, later initial-session reconstruction and
prospective recovery after a missed initial benchmark opening. Security, architecture and
recovery review of the final recovery increment found no remaining blockers. Final source
acceptance outputs are recorded above; they do not establish genuine runtime operation.

## Production evidence and remaining boundaries

Preflight found the retained HQ at schema14,8workers,48tasks and69executions (68completed,
1failed), with no running execution. Quick integrity and foreign keys pass. Source/build were
still `a72cee080989960d2a9e1e74d9236157ce1a0448` before deployment. Python3.12.12 and exact
hash-locked yfinance1.7.0 dependencies are installed in a root-owned isolated runtime; pip
checks pass. Node24.21.0 archive ownership has been corrected to root. `LimitCORE=0` is prepared.
The existing service remains running during preparation. A protected SQLite copy of the retained
schema14 database migrated to25 and reopened three times: all102 original application tables
and2,626 original rows retained every original rowid/field; integrity and foreign keys pass.
No investment authority or model runtime was created. The pinned Linux adapter also passed
its authored equity/ETF test under the actual service user. See the
[production preflight receipt](../evidence/inv-real01/production-preflight.json).

The production Codex login returns workspace-routing authentication401 after one supported
refresh. Zero model turns were sent. Genuine activation requires restoring that login and
successful strict account/routing/eligibility verification; a model catalog is not sufficient.
The website execution chat remains at its pending tool-approval boundary. No public release
or genuine employee/market receipt is claimed. Actual source deployment, preserving schema14→25
migration, receiver acceptance and elapsed sessions must be recorded separately.

Ask BotSquad remains unfinished product integration, included in the owner's broader continuation
objective. It must use real eligible employees, independent quotas and session privacy, and
must not be represented as working before those gates pass.
