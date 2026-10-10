# INV-05 — Deterministic paper simulator acceptance

**Date:** 2026-10-09 America/Vancouver (2026-10-10 UTC)

**Scope:** A01/A05/A07/A09 in deterministic synthetic mode; no deployment or live authority

**Implementation commit:** `6df12e852f1780e15ef1e7e1144d808e49d02fcb`

**Integration:** Reviewed feature PR into BotSquad `main`; PR/merge receipt is recorded in the execution-plan handoff and GitHub history.

## A. Implementation and boundaries

The owner authorized source, additive migration, deterministic fixtures, read-only specialists, documentation, reviewed PR and merge. The implementation lives in BotSquad; Asymmetri was read only and its source/services were not modified. Decision031 records the method and trust boundary.

| Source | Responsibility |
| --- | --- |
| `src/control/investment.ts` | Internal `FixtureSimulator`, deterministic clock, transactions, semantic/request receipts, replay/checkpoints, disabled projections |
| `src/domain/investment/types.ts` | Frozen configuration, decisions/reviews, orders, observations, actions, entitlements, books, postings, fills, valuations and commands |
| `src/domain/investment/arithmetic.ts` | BigInt millionths, bounded values/intermediates, half-even rounding, exact rational residuals |
| `src/domain/investment/identity.ts` | Strict JCS/SHA-256, stable identities, UTC timestamps and exact field validation |
| `src/domain/investment/policy.ts` | Fixture calendar, DST/holiday/early-close/cutoff, original raw opening and quality/freshness checks |
| `src/domain/investment/accounting.ts` | Balanced portfolio/benchmark postings, weighted-average basis, cash/share reservations and fills |
| `src/domain/investment/valuation.ts` | Quality-labelled marks, exposure/drawdown, benchmark comparison and effective-time historical reconstruction |
| `src/domain/investment/reducer.ts` | Pure deterministic decision/order/action/valuation transitions and revisions |
| `src/persistence/investment-migration.ts` | Additive empty schema15: `investment_runs`, `investment_journal`, `investment_outbox`, `investment_receipts` |
| `src/persistence/store.ts` | Migration15 registration and rejection of future incompatible schema |
| `test/fixtures/investment/support.ts` | Invented instruments, prices, identities and deterministic clocks/calendars |

The fixture facade has no Company, runtime, dispatcher, scheduler, HTTP or client API caller. Fixture author/reviewer/operator strings are trusted test inputs, not authenticated employee identities. Official evidence modes reject. Configuration changes require a distinct run; existing configuration bytes/hash are immutable. Initialization creates portfolio and separate benchmark capital only when explicitly called by a fixture.

Money, prices and quantities use checked six-decimal BigInt arithmetic, never binary floating point. Supported field magnitude is at most999999999999.999999; intermediates are bounded. Trade price/notional/basis rounding residuals retain exact rationals. Whole-share discretionary orders use weighted-average basis; full exits release residue. No partial fill exists. Every posting transaction balances cash+basis+receivables against capital+realized+income+liabilities independently for each book; quantity and fee reporting are informational accounts.

Orders bind exact proposal revision/hash, independent approved review, cutoff, target session, price guard and financial version. Cash/shares reserve atomically. Admission and fill check current authority, lifecycle, marks, cash/shares, sectors, pending risk and ceilings. A posttrade probe includes fee/slippage losses in equity. A late fill rejects when any later portfolio economic postings would contaminate the target-opening risk calculation. Drawdown blocks added risk, without automatic sale. Pause/end cancels pending orders and releases reservations. Expired/terminal orders cannot revive.

Splits preserve basis and retain rational unresolved fractions. Dividends accrue from pre-ex-boundary holdings and settle once. Ticker history uses stable instrument identity. Unsupported events, simultaneous split/dividend unit ambiguity and out-of-order/unresolved splits block affected accounting/valuation; no guessed cash-in-lieu or forced sale occurs. Dividend corrections are not silently applied to prior actions. These unresolved states require later explicit reconciliation.

The benchmark uses raw prices, separate capital, affordable fractional millionths, residual cash, explicit dividends and fixed next-open reinvestment with zero fee/slippage. Initial session follows the frozen cutoff; reinvestment session follows actual payment time strictly. No adjusted series or portfolio cash finances the benchmark.

Noninitial scheduled valuations require matching raw closing marks. Unknown equity/returns/comparisons are null, aggregate quality is partial/blocked, and last-good retains its actual timestamp. Returns/drawdowns are decimal ratios; excess is percentage points. Daily comparison requires the immediately preceding eligible session. New historical values reject when present books/reservations/uncertainty would leak backward. Existing values revise from dated accepted postings, saved orders, source corrections and dated blocks; original fills/snapshots remain immutable. Revisions propagate downstream daily/peak/drawdown metrics.

Each valuation binds the exact financial accounting-history prefix via `ledgerVersion` and `ledgerHash`; `asOf` filters effective-time entries. Its journal version/hash anchors already-committed history. The enclosing journal then commits the revised snapshot without a self-referential hash. Original and revised snapshots carry independent provenance.

`inv05-private-projection-v1` is immutable private staging data, **not** a canonical public v1 payload or approved export. Its disabled outbox row, deterministic event identity, exact journal version/hash, dependency, frozen entries/outcome and projection hash commit with the journal/receipt/checkpoint in one transaction. No transport, key, publication grant or network sender exists. INV-07 owns public projection/security/delivery separately.

## B. Exact representative financial results

All examples are invented fixtures starting with1000.000000 USD, not selected investment outcomes. Independent scenarios do not form one combined account.

| Scenario | Exact observed result |
| --- | --- |
| BUY2 at100, no costs | Cash800.000000; quantity2.000000; basis200.000000 |
| Mark two shares at110 | Equity1020.000000; unrealized20.000000; total return0.020000 |
| Partial SELL1 at110 | Cash910.000000; remaining basis100.000000; realized10.000000 |
| Full SELL remaining1 at110 | Cash1020.000000; quantity/basis0.000000; realized20.000000 |
| 2:1 split after BUY2 | Quantity4.000000; basis200.000000; average cost50.000000 |
| 3:2 split then SELL1 | Released basis66.666667; remainder133.333333; full exit releases all residue |
| 1:3 reverse split | Quantity0.666666 plus exact1/1500000-share entitlement; basis200.000000; equity unknown |
| Dividend1.25 per share on2 | Receivable/income2.500000; payment cash802.500000, receivable0.000000; no double counting |
| BUY2, raw100,10bps slippage,$1 fee | Fill100.100000; cash798.800000; basis201.200000 |
| SELL1, raw110, same costs | Fill109.890000; cash907.690000; realized8.290000; accumulated fees2.000000 |
| Benchmark open300, close330 | Units3.333333; residual cash0.000100; equity1099.999990; rounded return0.100000 |
| Portfolio2% vs benchmark10% | Excess-8.000000 percentage points |
| Benchmark dividend$10, next open100 | Units rise10.000000→10.100000; reinvestment cash0.000000 |
| Late dividend at old ex-date | Old equity998.000000 retained; revised equity1000.000000, cash800.000000, receivable2.000000 |
| Original open arrives after close | Original close equity1000.000000 retained; eligible late BUY revises it to1020.000000 and reserved cash0.000000 |
| Old close corrected150→120 | Earlier equity1100→1040; later drawdown/daily return revise-0.090909→-0.038462; fills/basis unchanged |

Correct rejections/unavailability include insufficient cash/shares, missing exact review, stale/missing/adjusted/halted/corrected opening, late commitment, guard gap, expiration, risk cap, uncertain action, unavailable benchmark and unsafe historical book. An unverified correction invalidates its former mark; a raw open does not substitute for a closing mark. No winning trade is required for acceptance.

## C. Durability, recovery and preservation

The existing Store uses `BEGIN IMMEDIATE`, WAL, FULL synchronization and busy timeout. Each facade operation verifies retained history before mutation; recovery recomputes deterministic outcomes/postings/checkpoints instead of trusting cached balances or rerunning a model.

Actual child Node processes with independent SQLite handles were SIGKILLed immediately before commit and immediately after commit/before response. Reopening showed either the intact reservation/cash1000 with no new outbox, or one fill/cash800 and its one outbox. The uncertain identical request converged to the single durable fill; conflicting reuse rejected. Separate restart tests preserve initialization, reservations, full financial history and outbox exactly, including a configuration retry after clock advancement.

Two simultaneous independent processes compete for BUY cash and SELL shares using the same financial version: exactly one pending reservation and one rejection result. Fill/cancel, fill/expiry and fill/pause races produce coherent terminal orders and no stranded cash. Replay validates sequence, predecessor/configuration/operation/request hashes, original receipt linkage, effects, financial version/checkpoint and outbox dependency/content/count. Same-command receipts cannot swap a blocked attempt for a later successful one.

Disposable tampering tests detect invalid predecessor, changed journal payload, missing outbox, missing/changed/mislinked receipt, missing foreign reference, truncated history, incompatible future schema and a corrupt SQLite file. Append-only/frozen triggers reject ordinary mutation. No historical record is deleted as a repair; corruption tests deliberately tamper only disposable fixtures to prove rejection.

The populated schema14 migration test uses all original migrations1–14, copies actual representative fixture rows with rowids, then upgrades/reopens three times. It verifies every prior row/field and original migration record, foreign keys, integrity and unrelated filesystem paths. Nonempty workers, Tasks/executions, conversations/messages, Working Groups, standing grants, schedules, audit and business receipts are present. All four investment tables remain empty. Existing grants, capabilities, IDs, schedules and receipts survive byte-for-field comparisons. Fixture business activity uses a simulated in-memory adapter; no model/provider runs.

Limits: this proves local process-crash/SQLite recovery, not abrupt hardware power loss, corruption repair, independently held backups, production retention or actual-host capacity. Full replay is deliberately conservative and bounded at100000 commands; no production throughput claim is made. Complete database replacement by an administrator is outside retained-hash integrity. Live recovery/backup/retention gates remain future activation work; no RECOVERY-01 milestone is reinstated.

## D. Security and authority

No real brokerage, live market connection, paid feed/service, worker trading capability, investment mandate/schedule, publisher credential/key/grant, background publisher, public export, website communication or operational investment run was created. No HQ worker/model session was started for demonstrations. Development-time specialists reviewed code only. Production HQ was not contacted, restarted, migrated or deployed. No Asymmetri change/deployment occurred. The two-slot runtime limit and global roles are unchanged.

Contract1.0 stays pinned to `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755`, manifest `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`. Contract files, offline contract helpers, runtime, HTTP, Company and client API have zero diff against base. Existing pinned canonicalize2.1.0 moved from dev to runtime dependency; npm install reported zero vulnerabilities and introduced no package upgrade.

## E. Verification and independent reviews

Environment: local macOS arm64, Node24.10.0, npm11.6.0, Node SQLite3.51.3, TypeScript project build, deterministic fixture clocks/seeds. Test databases are disposable. Existing HTTP tests require localhost listeners; the accepted full run used approved unsandboxed local test execution. No live-host, real-market, real-worker or public-browser test is claimed for INV-05.

| Command | Final observed result |
| --- | --- |
| `npm run check` | Pass |
| `npm test` |715 tests:714 pass,0 fail,1 skip;109301ms |
| `npm run contracts:test` |175 pass,0 fail; canonical generated artifacts current |
| `node --test dist/test/investment-{arithmetic,simulator,actions,review,recovery,migration}.test.js` |91 pass,0 fail;2759ms |
| `git diff --check` | Pass |
| Canonical/runtime/HTTP/Company/client preservation diff | Empty |

The one pre-existing skip is “Linux generic recipes cap large buffers and the disposable build filesystem”; the host is macOS. Focused91 and contract175 are included in full715, not additional distinct tests. Arithmetic coverage includes10000 seeded decimal/rounding checks and1000 seeded accumulation/partial-exit/full-exit conservation cycles.

Earlier results were not silently discarded: initial dependency setup hit restricted-network/npm cache failure and succeeded with approved isolated-cache `npm ci --ignore-scripts`; initial TypeScript issues were corrected. The first full sandbox run had712 total,653 pass,58 fail,1 skip, including old schema-count assertions and blocked loopback/nested-recipe checks. Five existing schema-count assertions were updated14→15, without weakening preservation checks; approved loopback rerun passed713/714 before the final cross-instrument regression raised the final count to715. During review regression development, an expired benchmark fixture timestamp and a snapshot checkpoint assertion referencing a later unaffected payment were corrected to test the intended conditions.

| Independent read-only specialist | Findings corrected and final disposition |
| --- | --- |
| `control_plane_architect` including accounting | Separate journal/financial versions, exact valuation checkpoint, aggregate benchmark quality, fee/slippage posttrade equity, benchmark cutoff consistency and payment-effective timestamps; no remaining blocker |
| `security_reviewer` | Correction supersession across quality states, global action-ID collision, exact closing marks, evidence source/time references, historical uncertainty/reservation leakage; cleared with independent in-memory reproductions |
| `recovery_reviewer` | Late economic revisions, truthful financial hashes, initialization retry, original receipt linkage, terminal arithmetic rejection/release, historical-book fence, benchmark funding timing/tiny-cash state; cleared after fixes |
| `test_reviewer` | Added simultaneous-action uncertainty, global late-fill risk guard, concurrent SELL, sector/drawdown/freshness boundaries and repeated weighted-basis cycles; independently passed21 arithmetic cases and cross-instrument regression; no remaining blocker |

Primary agent was the only implementation writer. No paid GitHub automated review credits were purchased. Final compiled checks above ran after substantive fixes.

## F. Git and documentation handoff

Base was fetched/verified `19d77bf497dd1621e263ae517e16d2e9e36d1f9f`. Owned branch is `feature/inv05-deterministic-paper-simulator`; worktree is `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-inv05`. Other worktrees/branches were preserved; no other active BotSquad writer was found at preflight or preintegration. Implementation commit is recorded above; the reviewed PR carries exact final head and merge metadata. The [execution plan](../../exec-plans/investment-inv-05.md) links the integration receipt.

Updated documentation: README, PROJECT_MEMORY, system/investment architecture, investment guide/roadmap/rules/decisions/validation/references, shared launcher, Decision031/index, this evidence and the execution plan. Historical INV-01–04 evidence is unchanged. Cross-repository references remain the [Asymmetri integration guide](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md), [receiver runbook](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md), and [INV-04 validation](https://github.com/eugenelin89/asymmetri/blob/main/docs/INV-04-VALIDATION.md). Accepted counterpart documentation baseline is `ac53b11dfc915979d6a7074ebfb27dce9aefa8a0`; website source/journal remain its documentedc31f500/3d9e1ad checkpoints.

## G. Separately authorized next step

INV-06 — Zero-Cost Market Evidence and Calendar Adapter is ready for separate implementation selection, and has not started. Decision029 requires permitted zero-cost source automation, raw price/action/calendar quality, completeness, original availability/correction provenance and display/archive/derived rights. No paid fallback is authorized.

An actual paper run still needs owner-approved official configuration/authority, source/calendar acceptance, reviewed worker/decision integration, explicit schedules/budgets and actual-host deployment/recovery/retention evidence. Public publication additionally needs privacy-reviewed canonical projections, grants, signing/transport/receipts, data/public-use rights, custody/capacity and separately authorized website/public ingress. No such activation follows this merge.
