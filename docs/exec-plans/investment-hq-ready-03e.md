# Execution Plan — HQ-READY-03E AAPL historical qualification

**Status:** Active  
**Owner:** Parent Codex task; sole writer/integration owner  
**Branch:** `codex/hq-ready-03e`  
**Worktree:** `../bot_messenger-hq-ready-03e`  
**Started:** 2026-10-12 America/Vancouver  
**Initial ETA:** 2–4 hours; adapter audit, safeguards, independent reviews, regression, integration and one supervised attempt  
**Current ETA:** Approximately20–35 minutes remaining at06:45 local; full-suite fixture correction added a second serial run

## Objective and authority

Implement, review and integrate a separate one-use capability for one AAPL/XNAS/USD daily
OHLCV operation, September 1 inclusive through October 1 exclusive, 2026. Only after accepted
merge and clean synchronized-main rebuild, perform one supervised qualification and destroy
its private capsule. The owner's reported Yahoo verbal personal-use permission is recorded as
reported, not independently verified writing or unrestricted automation/public rights.

No employee inference, investment credits, trading, recurring collection, HQ-READY-04,
production deployment, provider purchase or public delivery. Decision029 remains US$0.

## Preflight and invariants

- Local and freshly fetched remote main both `d49c77b9d655413ceb66818eafb1361f91e4c404`; clean.
- Preserve all existing worktrees and earlier authority/receipt files. 03B spent, 03D spent1/1,
  Decision037 exhausted4/4. Privately hash both anchors before edits and after cleanup.
- Read AGENTS, Decisions029/032/038/039/040, investment decisions/rules/roadmap,
  prior03–03D acceptance and financial gateway/custody source.
- Independent reviewers remain read-only; parent owns all edits and Git integration.
- New fixed private anchor, exact immutable manifest/source identity, create-only consumption
  before DNS, no replay after failure/crash/uncertainty.
- Reuse FinancialDataGateway/FinancialStore, pinned Python and existing TLS/public-DNS/pin,
  diagnostics, encrypted custody and synthetic-only employee admission.

## Implementation and gates

1. Audit pinned1.7.0 actual request sequence with authored fixtures. Freeze exact requests;
   stop before network if not bounded. No provider retries or fallback.
2. New manifest/custody and dedicated supervised CLI: one logical read,6 HTTPS attempts,
   5 seconds after response completion,262144 bytes/response,1MiB total,10s/wire,
   120s operation,180s whole process including cleanup. Prior authorities unchanged.
3. Private field-level report with original event/local retrieval/unknown availability,
   calendar coverage, raw/adjusted ambiguity, missingness/actions, no-lookahead and no fills.
4. Authored quality/admission/limits/bootstrap/concurrency/crash/expiry/custody/cleanup tests;
   repaired Node24 callback regression. No real Yahoo access during development.
5. Independent architecture, security, recovery and acceptance reviews; resolve findings.
6. Focused/full regressions, check/build, contracts, diff/source manifests. Separate source
   and acceptance commits; scoped PR, reviewed merge, clean synchronized-main rebuild.
7. Host/backup/source/resource verification; prepare once, consume once; private inspection,
   immediate destruction, retained spent and non-data cleanup receipts; verify prior hashes.
8. Record actual result accurately, integrate non-data outcome, stop permanently.

## Evidence ledger

| Check | Result |
| --- | --- |
| Starting Git identity | Exact expected clean main; fetch succeeded with host permission |
| Old authority baseline | Eleven files privately hashed across unchanged 03B/03D anchors; both spent/noResume; old capsule absent |
| Pinned adapter sequence | Actual pinned adapter through gateway/transport: six exact authored requests, 21 authored sessions; no retries/fallback |
| Focused regression | 235/235 passing, zero skips; includes final native watchdog with blocked Node and Python descendants |
| Independent reviews | Security, recovery, architecture and acceptance: no remaining source blockers |
| Source freeze | Runtime `2cdc9e6d449882c27aa54e668febe373dd53ad4e`; test-only follow-up `87ad823b92a606ddad0221ee3923097142b8f041`; 30 source and 20 compiled files pinned |
| Typecheck/contracts/local TLS | Passed;175 contracts and4 actual loopback tests, zero skips |
| Full regression | Initial1486pass/1fixture-expectation failure/6existing skips; corrected two-mode local TLS fixture reviewed; final1493 total/1487pass/0fail/6existing skips in539.326s |
| Live gate | Unprepared and unconsumed; zero Yahoo requests |

## Remaining work

Implementation, all required regressions and independent source reviews are complete.
Acceptance commit, reviewed integration, clean-main rebuild,
host/custody gates and the single supervised execution remain.
Live success is not promised; denial, empty result or uncertainty is a terminal outcome.
