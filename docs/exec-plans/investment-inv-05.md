# Execution Plan — INV-05 deterministic paper simulator

**Status:** Source/local acceptance complete; reviewed integration in progress

**Owner:** Codex INV-05 primary writer; specialists read-only

**Branch:** `feature/inv05-deterministic-paper-simulator`

**Worktree:** `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-inv05`

**Started:** 2026-10-09 America/Vancouver

**Initial ETA:** 3–5 hours including implementation, deterministic acceptance, review and PR integration

**Current ETA:** 15–30 minutes for final evidence/PR/merge; implementation and acceptance complete

## Objective

Implement and merge INV-05 synthetic-only trusted accounting, with immutable configuration, exact arithmetic, replayable journal, orders/reservations/risk, calendar/evidence, actions, benchmark, valuation corrections and atomic disabled outbox. No deployment or later milestone.

## In scope

- A01 configuration/methodology, A05 accounting/orders/risk, A07 local crash/replay and A09 preservation in deterministic synthetic mode.
- Additive schema15 after verified schema14; existing Store transaction conventions.
- Typed internal library only; explicit test fixture calls create synthetic runs.
- Read-only architecture, security, accounting, recovery and acceptance specialists; reviewed PR and authorized merge.

## Out of scope

Production database/service changes, live prices or paid data, Asymmetri changes, worker tools/grants/model turns, schedules, signing/transport, official runs, INV-06 onward and OS migration.

## Relevant current docs / decisions

AGENTS.md; required repository/product/architecture and investment specifications; Decisions 029/030; contract v1.0; INV-01/04 evidence. Fetched BotSquad main `19d77bf497dd1621e263ae517e16d2e9e36d1f9f`. Asymmetri cross-repository map read from current main; implementation references remain `c31f500`/`3d9e1ad`, documentation baseline `ac53b11`. Canonical contract commit `ba3dd74`, manifest `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.

## Invariants / risks changed

- One implementation writer. Existing worktrees/branches preserved; task inventory shows no other active BotSquad writer.
- BigInt six-decimal postings, checked bounds/intermediates, explicit half-even residuals; whole discretionary shares.
- Immutable command journal and derived financial effects; replay verifies predecessor, effects, checkpoint and outbox. SQLite serializes reservations and terminal races.
- Immutable semantic order identity and exact decision/review revision; trusted observed timestamps prevent hindsight commitment.
- No worker/runtime/HTTP entry point. Fixture identities never become company capability grants.
- Separate benchmark book and explicit receivables/entitlements; incomplete marks never produce complete equity.
- Internal disabled projection records are not authorized public exports. Canonical wire files stay unchanged.

## Implementation steps

1. Read required sources, verify current refs and isolate owned worktree. **Done.**
2. Implement fixed-point/config/calendar/evidence/domain accounting and replay. **Done.**
3. Implement additive migration and transactional journal/outbox facade. **Done.**
4. Exercise synthetic acceptance matrix and representative previous-schema preservation. **Done.**
5. Independent read-only reviews, resolve blockers and rerun relevant checks. **Done.**
6. Update normative docs and INV-05 evidence, commit/push/PR, inspect final identities and merge.
7. Verify clean local/remote main; stop before INV-06.

## Validation plan

| Area | Required checks |
| --- | --- |
| Arithmetic | parsing/ranges, half-even, weighted basis, fees/slippage, full-exit residue, seeded repeated cycles |
| Orders/risk | exact review, BUY/SELL/HOLD, semantic duplicate/conflict, reservation competition, ceilings, cash/shares, finite budget/pause/end |
| Timing/evidence | weekend/holiday/DST/early close/closure/halt, committed cutoff, raw open only, freshness/delay/corrections |
| Actions/benchmark | splits/fractions, dividends ex/payment, ticker history, unsupported events, duplicates/order, ETF proxy reinvestment |
| Valuation | initial cash, missing/null, matching sessions, returns/drawdown, historical correction propagation |
| Recovery | restart at each state, process crash before/after commit and before response, races, replay/corruption/truncation, journal/outbox atomicity |
| Migration/preservation | disposable populated schema14 upgrade, all prior rows/IDs/permissions/schedules, no seeded authority |
| Regression | focused suites, `npm run check`, `npm test`, `npm run contracts:test`, `git diff --check` |

Real worker, real market, live-host and public transport acceptance are excluded because their interfaces are unchanged and activation is unauthorized.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Fetch and ownership | `19d77bf` | Pass | Primary checkout remains untouched; isolated branch/worktree |
| Schema preflight | Store source | 14 | Next additive migration is 15 |
| Implementation | `6df12e852f1780e15ef1e7e1144d808e49d02fcb` | Pass | Sole writer; no runtime/HTTP/Company wiring |
| Focused acceptance | Final compiled source |91/91 | Real SIGKILL, concurrency, corruption, populated14→15 preservation |
| Full regression | Final compiled source |714 pass/715 total |0 fail;1 pre-existing Linux-only skip |
| Contracts | Canonical v1 unchanged |175/175 | Generated package current |
| Static/diff | TypeScript and diff check | Pass | Canonical/runtime/Company/HTTP/client unchanged |
| Specialists | Architecture, security, recovery, tests | Cleared | All substantive findings fixed; see INV-05 evidence |

## Decisions made during execution

- Reuse the existing JCS implementation dependency for runtime hashes; do not import offline contract test/oracle helpers into production.
- Preserve strict canonical v1 wire shapes. Keep richer internal recovery metadata private and disabled until INV-07 implements explicit projections and authority.

## Documentation freshness

Update README, project memory and investment roadmap/guide/rules/architecture/decisions/validation where delivered truth changes. Preserve historical INV-01–04 evidence and cross-repo ownership links.

## Remaining work / blockers

Reviewed PR integration and final local/remote main verification remain. Source, documentation and acceptance are complete. No known external blocker.

## Completion handoff

Implementation `6df12e852f1780e15ef1e7e1144d808e49d02fcb`; [INV-05 acceptance](../validation/investment/INV-05.md) contains exact financial values, failed attempts/corrections,91 focused tests,714 full-suite passes and175 contract passes. PR/merge receipt will be linked here before integration. No deployment, Asymmetri change, operational authority or INV-06 work follows merge.
