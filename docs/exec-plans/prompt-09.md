# Execution Plan — Prompt 09 company operating loop

**Status:** Complete — accepted, merged and deployed; completion documentation delivery recorded separately
**Owner:** Codex Prompt 09 implementation chat  
**Branch:** `codex/prompt09-company-operating-loop`  
**Worktree:** `../bot_messenger-prompt09`  
**Started:** 2026-10-05 (America/Vancouver)  
**Initial ETA:** 8–14 hours, including actual Ubuntu acceptance, independent review and deployment  
**Current ETA:** Implementation delivery complete; final completion-documentation deployment and handoff remain. The user requested an ETA every 15 minutes.

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
| C09-1 broad | Real broad cycle, team choices, initiative, alternatives, useful internal Task and follow-up | tested — real c6690a5 broad cycle closed; semantic review passed; three failed attempts retained |
| C09-1 specific | Real Asymmetri reference, fixture-only product logic, no external action | tested — two actual Asymmetri cycles; fixture-only simulated evidence; semantic review passed |
| C09-2 schedules | One-time/recurring, owner/purpose/zone/limits, edit/version/cancel durability | tested — one-time/recurring/version/cancel controlled cases and actual elapsed-time occurrence pass |
| C09-3 clock | Due/restart/dedup/overlap/catch-up/pause/revoke/idle and actual elapsed-time worker | tested — controlled clock/recovery, real scheduled invocation and idle service restart pass |
| C09-4 two cycles | Two actual cycles, attributable intervening observation, evidence-responsive decision, scheduled second cycle | tested — actual scheduled second cycle evaluated the new 7/3/2 synthetic outcome; independent PASS |
| Mandate authority | Owner activation; immutable envelope; no prose escalation; coordinator eligibility | tested — owner/envelope/role denial checks pass |
| Internal coordination | Typed group creation; separate decision-linked Task; current hierarchy and grants | tested — actual company-selected groups and separate decision-linked Tasks completed |
| Evidence/memory | Mode/provenance/time/missingness; delivered-citation validation; bounded original reads; rollover | tested — 48 focused checks; real fresh contexts and all 15 same-execution decision citations verified |
| Clock failures | All requested crash points, known-failure backoff, unknown-outcome no-replay | tested — atomic rollback/claim, actual database reopen, provider-reference boundaries, known 30/60-second backoff and no-replay fences |
| Human/browser | Create/envelope/activate/pause/stop/observations/decisions/schedules/review-now/history | tested — all 11 browser checks and 21 actual original-record/artifact links pass |
| Client API/privacy | No strategy, observation, group-control or schedule authority exposed to v1 | tested — v1 privacy and compatibility pass |
| Prompt 07 regressions | Direct/passive/reply/peer/rollover/interruption/uncertainty | tested — actual direct/peer/passive/neutral rollover, research/grant/revocation/source history, manual/Atlas groups, interruption and retained uncertainty passed |
| WE-01 regressions | Grants/revocation/public sources/failures/async/rollover | tested — actual direct/peer/passive/neutral rollover, research/grant/revocation/source history, manual/Atlas groups, interruption and retained uncertainty passed |
| Prompt 08 regressions | Manual/Atlas groups, sharing, challenge/response, synthesis, separate assignment, privacy | tested — actual direct/peer/passive/neutral rollover, research/grant/revocation/source history, manual/Atlas groups, interruption and retained uncertainty passed |
| Engineering/Projects | Hierarchy/review/integration/revision/archive/isolation/recovery/publication fixture | tested — actual engineering, Projects, identity recovery and Prompt 01 passed; exact Ubuntu 259/259 |
| Infrastructure/API | Identity/provisioner, browser boundaries, compatible v1 | tested — complete suite, 11 browser checks, nine provisioner tests and actual Linux probes passed |
| Migration/preservation | Protected consistent backup, offline migration repeated, integrity/FKs, retained rows/identities | tested — offline schema 10→12 and 11→12 preserve all original rows/fields/rowids; fresh deployment checks passed |
| Independent review | Separate security/recovery review and semantic real-artifact review; material fixes | tested — security/recovery, semantic, final harness and owner-link reviews passed |
| Documentation | Required current docs, Decision 022 if still unused, architecture/tutorial/validation | implemented — current documentation, tutorial, Decision 022 and detailed validation/delivery report |
| Integration/deploy | Normal PR merge, exact local/origin/source/build equality, health/preservation/cleanup | tested — PR #10 normal merge; exact application deployment, browser/idle, original/fresh preservation and seven temporary HQs stopped |
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
| Independent review | Read-only reviewer started on baseline; implementation review follows | tested — material fixes reviewed; c6690a5 security and C09-1/C09-4 semantic clearance |

## Remaining work

All implementation, actual acceptance, review and production application delivery gates passed.
Prompt 09 is complete and Prompt 10 is next. This completion record is integrated normally;
its exact final documentation deployment receipt is retained outside Git after verification.

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


### Second real attempt and conservative continuity — 2026-10-05 19:15 UTC

Candidate `66c291a` passed the complete Ubuntu suite: 241/241, including Linux-only checks.
Its browser workflow passed. The second broad real attempt delivered the explicitly selected
simulated baseline to Scout and produced a qualified, source-grounded Task result. A group
also completed. Atlas's resumed coordinator again performed one valid complete baseline read,
then 19 invalid reads omitting `offset`, exhausting the bounded call allowance. Actual tool
payloads were recorded in the private validation evidence. This attempt remains failed, with
its unknown provider fence intact. Production is unchanged.

Follow-up independent review found withdrawal could still reappear through provider context,
derived Task results and previews; unexecuted Task metadata could also count as evidence.
The fixes conservatively withhold prior derived worker material after withdrawal, invalidate
queued scope, preserve owner originals and fences, and require completed Task execution
results for substantive grounding. Every settled strategic turn now starts a normal Prompt 07
generation reconstructed from trusted records, with fresh evidence receipts and retained
lineage/budgets. Direct conversations and ordinary Task bindings retain existing behavior.
The reviewer found this continuity policy sound but requires actual acceptance proof.

The current focused suite passes 35/35, including fresh generations, withdrawal, grounding,
and atomic claim rollback. Reports include all failed attempts. Remaining ETA: 7–12 hours.


### Third attempt and actual response-contract diagnosis — 2026-10-05 19:25 UTC

`fd6a755` received independent scoped security clearance. The full local suite passed
245/246 with one Linux-only skip. Its fresh coordinator generation still exhausted the
20-call limit, so the continuity change did not fix the behavioral failure. Attempt
`mandates-p09-20261005-review2` is retained and stopped with its fence intact.

Read-only inspection of that specific provider thread's operational tool programs (excluding
hidden reasoning and credentials) established the actual cause: a single generated code-tool
program looped over `rawReturn.next_offset` and `rawReturn.fully_delivered`, but dynamic tool
returns are content envelopes containing JSON text. Those fields were undefined, so its
`while(true)` loop repeatedly omitted offset before the model could see feedback. This was
not repeated deliberative choice after receiving corrective error text.

The corrected mandate tool contract tells workers to display the return and inspect its JSON,
read one page per dependent call, and avoid automatic pagination loops on raw wrappers.
The runtime introduction now identifies a strategic mandate review precisely. An omitted
first-page offset also defaults to zero, with null/strings/negative/fractional inputs still
rejected and scope/delivery/cumulative budgets unchanged (35/35 focused checks pass).
The fixture retains the same low reasoning configuration to test the diagnosed correction.


### Actual strategic acceptance and regression checkpoint — 2026-10-05 19:49 UTC

Candidate `c6690a5` completed the real broad cycle and two Asymmetri cycles. The corrected
runtime tool contract resolved the nested pagination loop without changing the model profile,
expected answer or company strategy. Broad work selected conditional cohort diagnosis after
considering a prototype alternative. Asymmetri narrowed setup clarity to an internal diagnostic
proposal; its scheduled review evaluated the new 7 consistent / 3 inconclusive / 2 concerning
simulated descriptions and stopped at the owner two-cycle bound, retaining the hypothesis
weakly. Neither baseline nor outcome is production data. Independent semantic review passed,
including reconstruction of all 15 evidence hashes across five decisions. One immutable
summary misattributes Scout's Task to Maya; authoritative provenance and citations are correct.

The scheduled second cycle began 85 ms after 19:36:45 UTC, once. A real service restart after
completion preserved 24 executions and all cycles/decisions/occurrences without new dispatch.
The broad mandate was owner-paused; its one-time occurrence expired before dispatch and is
retained as cancelled, rather than an indefinite held review. Asymmetri remains stopped.

The complete c6690a5 Ubuntu suite passed 246/246. Eight additional focused integration tests
cover aggregate research charging, late callback denial, provider-reference boundaries,
actual database reopen and exact bounded backoff. With those tests, the local full suite
passes 253/254 (one Linux-only skip); all 10 browser checks pass. Ubuntu final checkpoint
rerun is pending. Real engineering, independent review, integration, restart and 100 actual
Linux isolation probes passed, including worker retirement. Real manual group restart and
context replacement, four-person response/synthesis, 30-second idle observation and separately
submitted internal assignment passed. Remaining actual research/direct/Projects regressions,
documentation and production delivery remain open. Remaining ETA: 4–7 hours at 19:44 UTC.


### Release checkpoint — 2026-10-05 20:14 UTC

Checkpoint `7d1e1b7` passed all 256 Ubuntu tests with zero skips, local 255/256 with one
Linux-only skip, 45 focused clock/authority checks, all 10 browser workflows, 21 actual
original-result links and nine provisioner protocol tests. Its engine matches the accepted
c6690a5 real runs. Actual Prompt 01, engineering, Projects/publication/archive, root isolation,
retirement and lost-response recovery all passed. Actual direct/peer/neutral rollover, manual
and Atlas-organized groups, explicit separate assignment, public sources, original-source
rollover, known-source failure, revoked permission and provider-confirmed interruption passed.
Deliberate actual group and direct provider-start crashes retained their fences after restart
with no duplicate output or automatic replay. Evidence remains labelled by method.

Separate semantic review passed the public group and retained-source reply. A read-only check
verified 26 group contexts and transcripts exclude four private conversations and 26 private
sources. All six owned validation HQs are stopped with consistent retained-release snapshots;
five temporary tunnels are closed. Original preflight preservation still passes: 43 databases,
33,607 rows, 293 account/group mappings, 484 root records and 145 homes (only workers.updated_at
excluded, as in the existing comparator). No production domain mutation has occurred.

Draft PR #10 is attached. Remaining delivery uses an application-only exact-main procedure,
with no OS, package, provisioner or credential changes. Independent operator review required
failure-stop, exact runtime readiness, all non-model pending-work guards, fresh pre-stop
inventory comparison and explicit empty-new-table checks; these were added before execution.
The initial 8–14-hour estimate was conservative while the runtime read-loop failure was
unresolved; remaining ETA is now 45–90 minutes. Completion/Prompt 10 Next will be marked only
after actual production delivery, preservation and cleanup pass.

## GitHub follow-up review checkpoint (2026-10-05 20:29 UTC)

PR #10's automated review found three P2 issues: expired-cycle queued Tasks remained pending,
owner retry could queue a one-shot internal Task that could never dispatch, and daily review
creation interpreted the first instant in the browser zone instead of the mandate zone.
The fixes cancel unresolved unstarted linked Tasks when blocking a cycle, reject internal
Task retry without changing attempts/fences, and resolve daily first calendar date plus
clock time in the trusted mandate zone. Owner absolute-time callers remain compatible.
48 targeted checks and all 11 browser checks pass, including a UTC browser creating/editing
Vancouver daily reviews over spring gaps and autumn repeats. The full local suite passes 258/259 with only the Linux-specific check skipped. Independent
follow-up review found no material regression. Exact-candidate Ubuntu validation and release
remain pending; production remains unchanged.

## Accepted production delivery — October 5

PR #10 merged normally as `9c9bdce50f5ec3bb7ec4931979dc9eed70bff260`. Local integration main, origin/main,
production source and health matched; the independently built candidate and installed runtime/public
manifest matched across 197 files. The integrated build passed Ubuntu 259/259 before
service startup. Runtime is ready, service identity is botsquad, and the listener is loopback-only.
Actual Chrome loaded Mandates and passive draft controls without a POST; 30 idle seconds retained
exactly 48 Tasks and 65 executions. Eight workers, one original grant and pause=false are preserved.
All seven new strategic domain tables are empty. No production demonstration or new permission exists.

Protected schema 10→12 migration reopened twice, preserving all 2,231 original rows, every original
field and rowid, integrity and foreign keys. Fresh preservation covers 55 databases, 44,415 original
rows, 337 account/group mappings, 557 root records and 167 worker homes; the original task preflight
comparison also passed. Only the established heartbeat field workers.updated_at is excluded.
Seven task-owned temporary HQs are stopped and snapshots retained; original five validation tunnels
are closed. The production verification tunnel is closed after final documentation release checks.

See [the delivery report](../validation/PROMPT_09_VALIDATION.md) for receipts, independent review,
known limitations and the final handoff boundary. No remaining Prompt 09 product work is blocked.
The initial 8–14-hour estimate included conservative allowance for real-model diagnosis/retesting;
completion was faster after resolving the tool-envelope contract and the final review findings.
