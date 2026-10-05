# Execution Plan — Prompt 09 company operating loop

**Status:** Active; acceptance is not complete  
**Owner:** Codex Prompt 09 implementation chat  
**Branch:** `codex/prompt09-company-operating-loop`  
**Worktree:** `../bot_messenger-prompt09`  
**Started:** 2026-10-05 (America/Vancouver)  
**Initial ETA:** 8–14 hours, including actual Ubuntu acceptance, independent review and deployment  
**Current ETA:** 8–14 hours; user requested an ETA update every 15 minutes

## Objective and boundary

Implement durable owner-activated mandates, bounded company-selected internal work,
source-grounded append-only decisions, labelled observations and a durable trusted clock.
Prove broad and Asymmetri Motion mandates with actual workers and at least two evidence-based
Asymmetri cycles, the second triggered by the scheduler. Integrate normally and deploy the
accepted exact main revision only after all required gates pass.

Prompt 10 Computer Use, Prompt 11 live business operations, external publication/outreach,
spending, commercial accounts, private analytics and changes to Asymmetri Motion are out of
scope. Use explicitly simulated acceptance evidence unless approved material is supplied.
No production demonstration, schedule, grant activation or roster change is authorized.

## Preflight and ownership

- Fetched current main: `ccf85629493b4d839d98c73a2e3ed1742304843b`. Original main clean.
- Owned isolated branch/worktree created from that main. Existing audit, empowerment,
  Prompt 07/08 and WE-01 worktrees preserved. GitHub reports no open PRs.
- Ubuntu source and health commit match main. Service active, runtime ready, listener
  `127.0.0.1:4310`. Only production HQ and provisioner services are active.
- Actual retained state differs from historical October 1 counts: schema 10; eight enabled
  idle workers including Scout; 48 Tasks, 65 executions, one conversation, six Projects,
  zero groups. No running executions or queued replies. One blocked infrastructure Task.
  Global pause is false. No outstanding execution/session/broker uncertainty fences.
- One retained Atlas public-research grant covers Task and direct conversation only;
  zero pending approvals. Preserve this exact state and all unrelated history.
- Protected inventory/backup and offline migration checks remain required before deployment.

## Design and invariants

Use the existing shared two-slot dispatcher and scoped conversation-session substrate,
with typed mandate review turns, a distinct tool schema and SQL ownership checks. Reviews
remain distinct from Tasks, direct replies and discussions. Reuse existing task hierarchy,
research grants and group evidence mechanisms; never impersonate a human operation.

The trusted company clock persists versioned schedules and stable occurrences. It holds
one coalesced overdue occurrence, retains missed counts, denies overlap and preserves
unknown provider fences. Idle time invokes no models. Clock time is injectable for tests.
Fixed-interval and daily wall-clock recurrence remain bounded; IANA zone semantics and
DST resolution are explicit and tested. Decisions cite actual same-execution delivered
records; observation bodies can only enter through owner/trusted ingestion. Synthetic
material never becomes a production metric. No automatic grant or capability expansion.

## Acceptance matrix

States are **implemented**, **tested**, **blocked**, or **intentionally out of scope**.
A blocked gate below means its listed prerequisite is still outstanding, not a passed claim.

| Gate | Required evidence | State / remaining prerequisite |
| --- | --- | --- |
| C09-1 broad | Real broad cycle, team choices, initiative, alternatives, useful internal Task and follow-up | blocked — implementation and actual Ubuntu run |
| C09-1 specific | Real Asymmetri reference, fixture-only product logic, no external action | blocked — implementation and actual Ubuntu run |
| C09-2 schedules | One-time/recurring, owner/purpose/zone/limits, edit/version/cancel durability | blocked — implementation and deterministic/real tests |
| C09-3 clock | Due/restart/dedup/overlap/catch-up/pause/revoke/idle and actual elapsed-time worker | blocked — implementation and controlled plus real acceptance |
| C09-4 two cycles | Two actual cycles, attributable intervening observation, evidence-responsive decision, scheduled second cycle | blocked — real runs and independent semantic review |
| Mandate authority | Owner activation; immutable envelope; no prose escalation; coordinator eligibility | blocked — implementation and denial tests |
| Internal coordination | Typed group creation; separate decision-linked Task; current hierarchy and grants | blocked — implementation and actual integration |
| Evidence/memory | Mode/provenance/time/missingness; delivered-citation validation; bounded original reads; rollover | blocked — implementation and grounding/recovery tests |
| Clock failures | All requested crash points, known-failure backoff, unknown-outcome no-replay | blocked — fault injection and restart tests |
| Human/browser | Create/envelope/activate/pause/stop/observations/decisions/schedules/review-now/history | blocked — implementation and browser verification |
| Client API/privacy | No strategy, observation, group-control or schedule authority exposed to v1 | blocked — projection/event/control regression tests |
| Prompt 07 regressions | Direct/passive/reply/peer/rollover/interruption/uncertainty | blocked — accepted candidate regressions |
| WE-01 regressions | Grants/revocation/public sources/failures/async/rollover | blocked — accepted candidate regressions |
| Prompt 08 regressions | Manual/Atlas groups, sharing, challenge/response, synthesis, separate assignment, privacy | blocked — accepted candidate regressions |
| Engineering/Projects | Hierarchy/review/integration/revision/archive/isolation/recovery/publication fixture | blocked — applicable complete and real suites |
| Infrastructure/API | Identity/provisioner, browser boundaries, compatible v1 | blocked — applicable complete suite and host probes |
| Migration/preservation | Protected consistent backup, offline migration repeated, integrity/FKs, retained rows/identities | blocked — migration implementation and deployment gate |
| Independent review | Separate security/recovery review and semantic real-artifact review; material fixes | blocked — candidate and real evidence required |
| Documentation | Required current docs, Decision 022 if still unused, architecture/tutorial/validation | blocked — final implementation and evidence |
| Integration/deploy | Normal PR merge, exact local/origin/source/build equality, health/preservation/cleanup | blocked — all prior gates |
| Prompt 10/11 | Computer Use and live external/business operation | intentionally out of scope — separate numbered milestones |

## Execution sequence

1. Complete code/document preflight and protected baseline inventory.
2. Implement durable model, scoped review tools, internal coordination and trusted clock.
3. Add precise owner browser controls and preserve Client API v1 privacy.
4. Run deterministic authority, grounding, schedule, migration and recovery acceptance.
5. Run actual Ubuntu broad and Asymmetri two-cycle acceptance; retain failed attempts.
6. Independently review security/recovery and real strategic responsiveness; resolve findings.
7. Run complete applicable suite and real affected regressions; update all current docs.
8. Reconcile current main, commit/push/open PR, normal merge, exact deployment and preservation.
9. Stop temporary services/tunnels, retain evidence, provide complete final handoff and disable ETA heartbeat.

## Evidence ledger

| Check | Evidence | Result |
| --- | --- | --- |
| Repository/host preflight | Git fetch/status/worktree and SSH health plus read-only SQLite inventory | tested — baseline and newer retained state above |
| Concurrent PRs | Connected GitHub search, 2026-10-05 | tested — no open PRs |
| Independent review | Read-only reviewer started on baseline; implementation review follows | blocked — candidate not yet implemented |

## Remaining work

All implementation and release gates above remain open. Do not mark Prompt 09 complete
or Prompt 10 next until the complete acceptance matrix passes.

## Implementation checkpoint (2026-10-05)

The first implementation adds schema 11, typed mandate reviews on the existing conversation
session substrate, a distinct tool schema, owner browser controls, full-record citation
receipts, explicit coordinator-origin groups, decision-linked direct-report analysis Tasks
and a clock with durable versions/occurrences. Fixed intervals and daily local time are
supported. Spring gaps move to the first valid minute; fall overlaps use the earlier instant.

22 focused local checks pass, including privacy, group authority, mixed model reservation,
known versus unknown recovery and confirmed-completion reconciliation. The browser workflow
passed. The first full suite had 223 passes, one Linux-only skip and three obsolete latest-schema
assertions (10 rather than 11); these expectations were updated without weakening preservation
assertions. A second full run is in progress. All failed-run reports are retained.

Root-private preflight inventory saved under `/var/backups/botsquad/prompt09-20261005`: 43
databases, 484 root records, 145 homes. SQLite online backup API created `original.sqlite`
and a separate never-served `offline/company.sqlite`. No production state was changed.

Baseline independent read-only review identified eight integration risks: discriminator,
assignment hierarchy, delegated group provenance, aggregate bounds, research grant modes,
settlement/recovery, grounding and v1 privacy. These inform implementation; this baseline
review is not candidate clearance. Exact candidate and semantic artifact reviews remain.

Revised remaining ETA: 7–12 hours. Real Ubuntu acceptance, review, complete regressions,
documentation and production delivery remain outstanding.

### Review and first real attempt — 2026-10-05 19:00 UTC

Frozen candidate `a504807` completed the local suite (233 total, 232 passed, one Linux-only
skip) and the offline retained-state migration (schema 10→11, 69 tables, 2,231 original
rows, every original field and rowid preserved, repeated reopen and integrity/FKs clean).
Independent read-only review withheld clearance for six material findings: private Task
provider-context reuse, post-queue schedule pause/expiry, observation export withdrawal,
Task deadline interruption, hypothesis-only grounding, and deduplicated retrieval charging.
All six have focused fixes and regressions. Additive schema 12 retains early validation
schema 11 while adding private Task contexts, read accounting and explicit Task evidence exports.

The first actual broad attempt ran at `/var/lib/botsquad/validation/mandates-p09-20261005-initial`
with real gpt-6-sol workers under the existing runtime. Atlas independently chose an
activation/setup hypothesis, a three-person group and a separate Scout analysis Task.
The Task honestly reported that Atlas had referred to a baseline without exporting it.
The coordinator continuation then repeatedly omitted the required `offset` argument after
one complete observation read; the 20-call limit stopped it with an unresolved provider
fence. No fence was cleared and this attempt is not acceptance. The failure and all original
records are retained. The product now supports explicit selected evidence-body exports to
internal Tasks and actionable pagination errors/completion hints; no strategy is scripted.

The updated targeted suite passes 30/30. The full local suite passes 240/241 with one
Linux-only skip. A prior sandboxed full attempt failed because local listeners and nested
isolation processes were denied; that report is retained and the permission-correct run
passed. Actual acceptance and final independent review remain blocked pending fresh runs.
ETA remains 7–12 hours; production remains unchanged.
