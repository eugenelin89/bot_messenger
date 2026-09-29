# Execution Plan — Prompt 07 conversations and context continuity

**Status:** Implementation, review and acceptance complete; delivery verification tracked in the private journal below
**Owner:** Codex Prompt 07 implementation task  
**Branch:** `feature/prompt-07-conversations-continuity`  
**Worktree:** `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-prompt07`  
**Started:** 2026-09-29 09:12 UTC  
**Initial ETA:** 6–10 hours, including real Ubuntu acceptance, review and deployment.  
**Current ETA:** 2–3 hours remaining at 10:16 UTC. Updates in the active task every 30 minutes; no scheduled reporting task.

## Objective and scope

Implement first-class human/worker and peer conversations, explicit bounded reply work,
and scoped runtime context rollover. Validate C07-1–C07-4, review, normally integrate to
main, push, deploy the exact revision to the existing HQ, and verify preserved state.
Prompt 08 deliberation, Prompt 09 scheduling, Computer Use, integrations, public ingress,
multi-company and Asymmetri Motion changes remain out of scope.

## Starting state and ownership

- Fetched `origin/main`: `de01669e3d1775f9fcdd8de9f3e26837c19baa4e` (PR #2 already merged).
- Existing main checkout remains untouched at `29c6795`; separate audit worktree exists.
- GitHub connector reports no open PRs. Local `gh` is unavailable; connector is available.
- Retained HQ read-only preflight: service active, runtime ready, deployed `29c6795`,
  listener only `127.0.0.1:4310`; no 4311 listener. Initial preservation inventory and offline migration acceptance are complete.
- Runtime remains pinned at Codex 0.157.0; matching generated experimental schemas inspected.
- Network commands need normal environment escalation. Git fetch and SSH succeeded.

## Required authorities and reading

Root AGENTS, README, PROJECT_MEMORY, canonical ROADMAP, product/organization/company
models, SINGLE_COMPANY_OPERATIONS, prompts instructions and milestone requirements,
architecture, current state/access/multiple-instance guidance, Client API v1,
Decisions 002/003/007/014/015/016/017, Prompt 06 execution/validation and plan template.
Decision 017's single-company-first order remains authoritative.

## Design and invariants

1. Conversation records and reply requests are independent of Tasks. Execution origin
   must be a checked discriminated union in code and storage; historical IDs preserved.
2. All work shares the dispatcher, worker exclusion and global capacity of two.
   Passive messages never dispatch; replies never implicitly request another reply.
3. Conversation tools are a separate narrow schema. No task, artifact, repository,
   infrastructure, approval or external action authority is inherited.
4. Conversation/worker-scoped runtime generations never resume legacy task contexts.
   Handoffs derive from bounded currently authorized original records plus structured
   obligations. Persist provenance, source range, lineage and omissions.
5. Bound causal chains across conversations; persist consumed budgets across restart.
   Peer answers are discovered through bounded explicit retrieval/continuation, with
   no execution slot held waiting or polling.
6. Rollover occurs only at safe ownership boundaries. Persist intent and replacement,
   activate atomically, fence late callbacks; ambiguous provider attempts block without
   blind replay. Preserve healthy legacy task bindings and original provenance.
7. Browser-only conversations; v1 scopes/DTOs/events must not expose private chat data
   or silently gain reply authority. Human owner has administrative oversight.

## Implementation steps

1. Complete preflight, baseline checks, retained-state inventory and protocol inspection.
2. Implement migration/domain, conversation authorization/receipts/budgets, shared dispatch.
3. Implement separate runtime modes, scoped bindings, handoff/rollover/recovery fencing.
4. Add browser conversation/history/control surface and v1 compatibility protection.
5. Add deterministic/integration/migration/privacy/recovery coverage and repeatable real
   Ubuntu acceptance harness with browser screenshots and durable evidence.
6. Run applicable full checks, real research/engineering/Projects regressions and review.
7. Update current-facing docs/decision/validation; integrate, push, deploy and preserve.

## Acceptance matrix

| Gate | Required evidence | Status |
| --- | --- | --- |
| C07-1 | Real Maya + engineer replies, peer exchange, passive/no Task, authority, queue/pause/interrupt | Passed; phase and server evidence |
| C07-2 | Actual different provider contexts, stable worker/conversation, history + pending obligation | Passed, Maya generations 1/2/3/4 |
| C07-3 | Bounded source handoff, privacy sentinel, stale callback fencing, restart handoff | Passed, real inputs plus deterministic fault checks |
| C07-4 | Duplicate/ambiguous outcomes, legacy binding/task preservation, matching protocol evidence | Passed, real task return and deterministic unknown-outcome fencing |
| Regression | Unit/integration/browser/API/provisioner/Linux isolation + real research/engineering/Projects | Passed |
| Delivery | Read-only security review, PR/normal merge, exact source/build equality, data preservation | Review passed; final result in private delivery journal |

## Evidence ledger

| Check | Source/command | Result |
| --- | --- | --- |
| Git state | fetch/status/worktrees/branches + connector PR search | Baseline matches; isolated branch created; no open PRs |
| HQ health | SSH systemctl/health/revision/ss | Healthy/runtime ready, private listener, retained source `29c6795` |
| Dependencies | npm ci offline | Missing cached package; normal network install started |

## Delivery and recovery gate

All implementation, review and C07 acceptance gates passed. Final Linux suite: 159/159;
local: 158 plus one Linux-only skip. Real research, identity engineering and generalized
Projects all passed, including the final fresh Projects rerun at 10:37 UTC. Prompt 08
is next. Cost remains unknown.

Normal PR/merge and exact main deployment are the remaining release procedure at this
checkpoint. The authoritative terminal delivery result is the protected HQ journal
`/var/lib/botsquad/validation/prompt07-delivery.json`, recording the exact merge/source/
build, health, pause, cleanup and original inventory comparison. Check that journal
before repeating any deployment after interruption; absence means delivery is not yet
verified. The final task handoff also links the PR and exact SHAs. This avoids embedding
a commit's own SHA in its source. Never stop merely because a PR exists, reset retained
history or create production demonstration work.

## Recovery notes

Continue in the explicit worktree above. Re-read this plan and `git status` after
interruption. Retain test databases, transcripts and evidence; never reset production.
Update this file at meaningful implementation/validation boundaries.

## Implementation checkpoint — 09:52 UTC

Migration 7, typed non-task execution ownership, bounded shared dispatcher, conversation
tools/receipts, source-linked handoffs, context generations and browser UI implemented.
Codex remains 0.157.0; matching generated experimental protocol inspected. Token usage
signals are advisory; eight turns / 64k submitted context characters also request safe rollover.
Read-only review fixes: recipient-local drafts, unresolved-provider blocking across task
and conversation work, early durable provider-reference preparation, complete scoped
message retrieval, exact source bookmarks, reserved peer continuation settlement and
stale-turn approval/output filtering. Review remains open pending final fixes/evidence.

Baseline: 135 pass, one Linux-only skip. First expanded full run: 148 pass, one skip.
Latest focused run: 29 pass (including actual Chrome fixture interaction); two new
protocol cases added after that run. Logs in /private/tmp/botsquad-prompt07-*.log.
No fake provider evidence is acceptance evidence. Actual Ubuntu validation next.

Retained host paused, 7 workers, 43 tasks, 53 executions, no active executions or pending
approvals. Preservation inventory: /var/backups/botsquad/prompt07-20260929T0912Z/inventory.json
(23 databases, 281 root records, 84 worker homes). Source/data have not been deployed or
mutated. New isolated validation scripts target /opt/botsquad-conversations-validation
and /var/lib/botsquad/validation/conversations-20260929-prompt07 on loopback 4311.
Same Unix account/credentials/provisioner namespace is explicitly retained.

## Acceptance checkpoint — 10:11 UTC

- Source 75a2f70 first Linux full run: 155/155 passed.
- Source f323953 shared execution fence and browser race fixes: full local 155 pass,
  one Linux-only skip; Linux 156/156 passed. Chrome browser regressions 4/4 passed.
- Real direct phase passed on f323953: Maya substantive reply; Linus task-busy chat
  queued correctly; passive and pause evidence; no hidden Tasks.
- Real peer phase passed on 6694be3 after retaining an initial incomplete parent turn.
  Ada and reserved Linus continuation answered even on that first attempt; tool feedback
  now explicitly asks the initial worker to submit its own acknowledgement before ending.
  New explicit peer request completed all three turns. No transcripts were manufactured.
- Real Maya rollover passed: generation 2, original constraint/open question and second
  queued obligation preserved. Controls passed including real confirmed interruption and
  return to original Linus task provider binding. Prepared-boundary crash/restart next.
- Offline retained database migration 6→8 and repeat open passed: 43 original tables,
  1,622 rows, every original field/rowid, FK/integrity. Protected backup uses SQLite backup
  API under /var/backups/botsquad/prompt07-20260929T0912Z. Never served the copied DB.
- Provisioner 9/9 and 189 retained UID-denial probes passed without credential contents.
- Real research regression running at conversations-prompt01-20260929T100946Z.
  Real identity engineering and generalized Projects plus final review/docs/integration
  and deployment remain open. Production remains paused/unchanged.

Evidence: .validation/prompt07-real on the owned workstation, with fixture, phase
records, real request IDs, screenshots and retained failed attempts; Ubuntu validation
root conversations-20260929-prompt07 contains actual runtime-input captures and SQLite.

## Final runtime checkpoint — 10:24 UTC

Runtime implementation 67f78a1 includes all reviewer fixes. Read-only reviewer cleared
material findings. Final deterministic tests: 159/159 Ubuntu, 158 local plus one supported-
platform skip. Browser 4/4, provisioner 9/9. Conversation phases direct/peer/rollover/
controls/crash/recovery/idle all passed; 15 real input records, 13 conversation attempts
(including the intentional pre-turn crash), four fixture/legitimate Tasks total.

Actual generation references and full synthetic evidence are checked in under
docs/validation/evidence/prompt07. Export assertions verify handoff hashes, pending
obligations, no private/task sentinel injection, tool separation, unique replies and
no remaining ambiguous provider attempts in the completed conversation run.

Engineering identity regression passed on 6694be3 with 100 probes and real retirement.
Final-code generalized Projects is running at projects-prompt07-20260929T101954Z; its
operator companion is running and handles the ready markers. Do not restart/update
its checkout until finished. Conversation service is paused, idle, on 67f78a1.

Original inventory comparison after validation still passes: 23 DBs, 11,677 rows,
171 account/group mappings, 281 root records, 84 homes. Main unchanged at de01669.
Final deployment journal target: /var/lib/botsquad/validation/prompt07-delivery.json.

## Projects validation checkpoint — 10:36 UTC

The first Projects run completed its model workflow but failed the four-denial-probe
assertion because exact operator probe instructions did not reach child objectives.
The validation-only context fixture now carries those four exact objects to the real
engineer. Normal tools/enforcement and the assertion remain unchanged; no synthetic
results/events. Commit 7a92215 passed type checks and is pushed. Fresh real Projects
run: projects-prompt07-20260929T103148Z; operator companion active. Preserve both runs.
Runtime code remains the reviewed/tested 67f78a1. Production remains untouched/paused.

## Acceptance closure — 10:39 UTC

Fresh Projects rerun passed: real revision/re-review, four restart gates, integration,
local bare remote lost-acknowledgement reconciliation and archive. Actual execution/turn
overlap 8,129/6,758 ms. Operator companion passed 100 UID checks and four archive checks.
Read-only final review cleared the fixture and corrected queued-versus-in-flight restart
wording. All material findings are resolved. Origin/main remains de01669; integration
checkout clean at 29c6795. Final docs/evidence commit and normal release procedure next.
