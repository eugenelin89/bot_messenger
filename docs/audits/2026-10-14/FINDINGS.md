# Prioritized findings register

As-of evidence: [system inventory](SYSTEM-STATUS.md), [workflow](INVESTMENT-WORKFLOW-AUDIT.md), [website owner packet](evidence/website-owner-packet.txt). **No P0 condition was demonstrated** in the bounded audit. That is not a security certification. Status means: open requires action; mitigated has controls but residual impact; resolved requires the stated evidence; unverified means the acceptance claim has not been established.

## BSIA-001 — transient rolling shortage blocks next research

| Field | Finding |
|---|---|
| Component / severity | InvestmentLoop finite admission / **P1** |
| Finding | Original 846d222 would block the Oct 15 12:00 start needing four calls with rolling consumption 7/8; deployed 0fabbbac now defers within the original window. Genuine Oct 15 acceptance remains pending |
| Evidence | Seven reservation timestamps in `evidence/hq-after-cutoff.json`; original versus corrected `src/control/investment-loop/service.ts` `planFiniteTurns`/`tick`; [deployment receipt](evidence/deployment-receipt.json) |
| Impact | Fresh next-day employee research may stop despite sufficient capacity within its unchanged window |
| Root cause | Known in the original source: capacity was checked during enqueue after occurrence activation, without pre-start rolling deferral |
| Recommended action | Read-only earliest-capacity calculation and pending `retry_at` before any group/request change; preserve cutoff and all caps |
| Ownership / status | HQ / **Mitigated**; reviewed/tested PR 100 deployed 20:26, preservation verified; genuine Oct 15 acceptance remains unverified |
| Acceptance | Focused limits/expiry/withdrawal/restart tests; reviewed merge and exact guarded deployment; genuine Oct 15 occurrence waits then starts once under same authority |

## BSIA-002 — genuine formal decision chain unproven

| Field | Finding |
|---|---|
| Component / severity | Employee discussion → typed proposal/review/submission / **P1** |
| Finding | Seven genuine turns produced no typed paper proposal, review, submission or formal HOLD |
| Evidence | `evidence/hq-after-cutoff.json` empty proposal/review/submission/order arrays; [handoff investigation](../../validation/investment/INV-REAL-01-PAPER-HANDOFF.md) |
| Impact | No investment decision can reach order admission/accounting/public decision history |
| Root cause | Known instructions/context gap: terminal discussion tool ended the turn; exact handoff IDs absent; authored fixture bypassed discovery |
| Recommended action | Exercise deployed PR #98 discovery/tool ordering through genuine next-session work; preserve actual rejection/HOLD/no-decision distinctions |
| Ownership / status | HQ / **Mitigated in deployed source; genuine acceptance unverified** |
| Acceptance | Attributed current-session proposal, independent exact review and valid submission with settled usage; alternatively explicit independent rejection; truthful public projection. No forced transaction |

## BSIA-003 — four remaining calls leave no recovery margin

| Field | Finding |
|---|---|
| Component / severity | Finite workflow capacity / **P1** |
| Finding | Four family calls remain; the paused final-cycle minimum is four. October 14 had only one day/rolling call left for three missing typed stages |
| Evidence | Seven spent family attempts; Decision 052 maximum old 4+additional 7; scheduler finalization reserves; [capacity](COST-AND-CAPACITY.md) |
| Impact | Optional discussion, revisions or further provider failures can prevent genuine completion |
| Root cause | Known finite envelope versus final-cycle lifecycle; bounded design constraint, not permission to enlarge it |
| Recommended action | Use the existing role-appropriate tools before terminal steps; record failure/rejection honestly. Design a future budget only after actual usage evidence |
| Ownership / status | Owner and HQ / **Open constraint** |
| Acceptance | Genuine next-day completion in≤4 remaining calls, or explicit blocked/no-decision result without retries or extra authority; later budgets require owner approval |

## BSIA-004 — authority ends October 15

| Field | Finding |
|---|---|
| Component / severity | Autonomous continuity / **P1** for sustained operation |
| Finding | Model/source/publication authority expires 2026-10-15T23:40Z; ordinary same-portfolio renewal also fails because the original Maya reservation remains incomplete |
| Evidence | Finite/publication envelopes and plan 2 occurrences; `observed-investment.ts:82`, `finite-journal.ts:103,106–107,127,139`; independent continuity review |
| Impact | Cannot truthfully claim indefinite daily autonomous trading |
| Root cause | Known finite expiry plus incomplete-history renewal gates. The exact accepted gap is recognized only for the current successor, not ordinary renewal; its one-use recovery cannot be repeated |
| Recommended action | Prepare a separately owner-authorized policy and implementation explicitly carrying forward the exact gap without refund/reclassification; then validate and approve new finite authority/source/publication scope |
| Ownership / status | Owner and HQ / **Open owner-dependent constraint** |
| Acceptance | Reviewed policy/code acceptance plus exact new prospective envelope, preserved portfolio/history/consumption and genuine later-session receipts. Ordinary approval or successful successor completion alone is insufficient |

## BSIA-005 — historical usage remains incomplete; actual cost unknown

| Field | Finding |
|---|---|
| Component / severity | Provider telemetry/accounting / **P2** |
| Finding | Maya `execution_ec78843c-0b56-4343-9d38-a6ba223867be` has 0 authoritative responses; diagnostic 66,720 is not a valid turn total. All exact-model prices/invoices unavailable |
| Evidence | `evidence/inventory-verified.json` usage; PR #93 prevention; three later complete genuine turns |
| Impact | Full-run tokens/actual charges cannot be reported; recurrence would correctly halt work |
| Root cause | Known pinned cold-resume raw-event limitation; invoice/cost access unavailable |
| Recommended action | Preserve exact historical gap and consumed attempt; retain fresh finite sessions and authoritative checks; report known subset only |
| Ownership / status | HQ / **Mitigated**, historical incompleteness permanent unless authentic missing telemetry appears |
| Acceptance | Future finite turns retain authoritative response usage; no gap reclassification/refund. Billing claims require actual account evidence |

## BSIA-006 — current off-host recovery custody unverified

| Field | Finding |
|---|---|
| Component / severity | HQ/receiver persistence / **P2** |
| Finding | Same-host snapshots exist; receiver backup has 6 versus 9 final live events. No current independent off-host restore/recurring retention verified |
| Evidence | `evidence/host-metadata.txt`, inventory backup metadata, website owner packet; systemd timer inventory does not exclude cron/cloud snapshots |
| Impact | Host loss could lose immutable private history or independent authority/publication custody |
| Root cause | Known evidence/operations gap; actual external snapshot policy undetermined |
| Recommended action | Establish a consistent encrypted off-host backup set and retention/restore runbook that includes databases and independent custody without secret leakage |
| Ownership / status | HQ and website infrastructure owner / **Open** |
| Acceptance | Recent off-host receipt, integrity/prefix verification, offline restore proving spent authority cannot be reset; recovery objectives and recurring ownership documented |

## BSIA-007 — unsupported website operating system

| Field | Finding |
|---|---|
| Component / severity | Shared website/receiver host / **P2** |
| Finding | Ubuntu 22.10 remains an accepted historical exception, outside standard support |
| Evidence | Fresh owner OS readback; existing infrastructure runbook; Ubuntu interim release policy |
| Impact | Security maintenance and reliable future deployments are constrained |
| Root cause | Known deferred host migration |
| Recommended action | Plan supported LTS replacement/migration with Motion coordination, immutable archive/custody preservation and rollback |
| Ownership / status | Website/infrastructure owner / **Open accepted exception** |
| Acceptance | Supported OS live, service isolation/config/data/hash continuity and independent recovery proof; no history rewind |

## BSIA-008 — tight deployment capacity and uneven resource caps

| Field | Finding |
|---|---|
| Component / severity | Shared host resources / **P2** |
| Finding | Website free disk only 134 MiB above 6 GiB deployment floor; about 303 MiB available RAM. HQ service memory maximum unlimited |
| Evidence | Fresh host metadata and website packet; HQ service memory about 216–218 MB at observation |
| Impact | New candidates/backups/heavy builds can violate floor or contend with Motion; HQ growth lacks a hard service ceiling |
| Root cause | Small shared hosts and accumulated retained deployment artifacts; precise future growth unknown |
| Recommended action | Capacity plan before new web deployment/backup; retain protected evidence; continue serialized off-host builds; evaluate HQ resource limit after measurement |
| Ownership / status | Website and HQ infrastructure owners / **Mitigated by build coordination, open capacity work** |
| Acceptance | Measured headroom for candidate+rollback+backup under approved floor; resource policy with tested failure behavior and no deletion of required custody |

## BSIA-009 — normalized evidence reproducible, raw provider bytes absent

| Field | Finding |
|---|---|
| Component / severity | Research reproducibility / **P2** |
| Finding | Raw Yahoo response bodies are discarded; normalized evidence/request hashes persist |
| Evidence | Source adapter/persistence policy and eighteen verified normalized content hashes in the final inventory |
| Impact | Decisions can be traced to supplied observations, but raw responses cannot be reparsed later to independently re-run normalization |
| Root cause | Intentional retention boundary; not observed data corruption |
| Recommended action | Disclose this limit; evaluate permitted bounded raw retention separately if stronger reproducibility is required |
| Ownership / status | HQ / **Mitigated by normalized provenance; residual open** |
| Acceptance | Reports accurately delimit reproducibility; any retention change has explicit source/privacy/storage policy and does not refetch spent observations |

## BSIA-010 — current-facing documentation contains obsolete stage claims

| Field | Finding |
|---|---|
| Component / severity | Operations/navigation / **P2** |
| Finding | README/AGENTS and chronological architecture sections still described the receiver as stopped/source-only; requested handoff path was wrong |
| Evidence | Audit-start main 6293589; [status reconciliation](SYSTEM-STATUS.md) |
| Impact | A later operator could mistake historical gates for current deployment or repeat obsolete work |
| Root cause | Accumulated milestone prose without a clear current status pointer |
| Recommended action | Update front-door pointers/current assertions; explicitly label historical sections and retain old evidence |
| Ownership / status | HQ / **Mitigated in the reviewed audit PR 101**; its normal merge receipt records integration closure |
| Acceptance | Normal reviewed docs PR merged; authoritative links resolve; current deployment/genuine limitations agree with final evidence |

## BSIA-011 — calendar and corporate-action coverage finite

| Field | Finding |
|---|---|
| Component / severity | Market/calendar lifecycle / **P3** |
| Finding | Calendar support ends 2026; only qualified supported split/dividend actions are covered |
| Evidence | Retained configuration and `src/domain/market/calendar.ts`, `observed-paper.ts` |
| Impact | Later sessions or unsupported corporate events cannot be presumed safe/complete |
| Root cause | Deliberately bounded initial implementation |
| Recommended action | Add prospective calendar/source/action support before affected sessions, with fixture and genuine evidence as appropriate |
| Ownership / status | HQ / **Open future work**, not a blocker for ordinary Oct 14–15 sessions |
| Acceptance | Exact reviewed calendar, holiday/timezone tests, explicit unknown-action handling; no fabricated dividend cash |

## BSIA-012 — release approval clock defect

| Field | Finding |
|---|---|
| Component / severity | Recovery preparation/release / **P1 historical** |
| Finding | Two exact releases failed before append because approval and journal times differed |
| Evidence | [close activation report](../../validation/investment/INV-REAL-01-CLOSE-ACTIVATION.md), PR #96 and successful 16:57 activation |
| Impact | Delayed recovery, unused original research draft |
| Root cause | Known separate timestamp captures |
| Recommended action | Preserve single approval timestamp and explicit same-unused-draft revision; retain failed evidence |
| Ownership / status | HQ / **Resolved for demonstrated release path** |
| Acceptance | Met: exact successor released/activated, no duplicate authority, old attempts/gap/history retained. This does not resolve genuine decision acceptance |

## Scheduled close qualification

The actual close collection, accounting, valuation and public readback succeeded; final evidence is linked in the workflow report. Missing observations before their due times were not classified as failures. Do not mark BSIA-002 resolved merely because a benchmark or valuation appears. Ask's closed state is intentional and is not an investment readiness defect.

## BSIA-013 — provider publication time and final-bar status unverified

| Field | Finding |
|---|---|
| Component / severity | Market-source qualification / **P2 residual evidence limitation** |
| Finding | Internal `verified` denotes a same-session snapshot accepted under the approved paper methodology. Provider publication time and final-bar status are not independently established; an exchange-final close is not independently verified |
| Evidence | `financial-normalize.ts:76`, `observed-paper.ts:30–56`, `investment/policy.ts:103`; independent source review found no additional finality gate |
| Impact | Collection/qualification success must not be described as independent exchange-close certification; vendor revision or lag cannot be ruled out from these records alone |
| Root cause | Known boundary: non-null OHLCV plus calendar/session/raw-parser checks; `sourceAvailableAt:null`. Collection≥5 minutes and processing≥20 minutes after close are elapsed-time safeguards |
| Recommended action | Disclose the accepted snapshot semantics and unknown availability/finality; evaluate stronger provider evidence or a prospective delay policy separately, without replaying spent requests |
| Ownership / status | HQ market-data policy / **Mitigated by explicit methodology; residual unverified** |
| Acceptance | Public/audit wording accurately distinguishes snapshot qualification from independent finality; any stronger guarantee requires reviewed source evidence and prospective policy acceptance. No corruption or current methodology violation is demonstrated |
