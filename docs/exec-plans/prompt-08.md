# Execution Plan — Prompt 08 working groups

**Status:** Implementation complete; real acceptance and delivery in progress
**Owner:** Codex Prompt 08 implementation task
**Branch:** `feature/prompt-08-working-groups`
**Worktree:** `../bot_messenger-prompt08`
**Started:** 2026-10-01
**Initial ETA:** 8–16 hours including real Ubuntu acceptance, independent review and deployment
**Current ETA:** 30–60 minutes (11:55 UTC update); revised estimates reported every 30 minutes as requested

## Objective and scope

Deliver bounded deliberation by separately executed persistent workers, explicit shared
evidence, attributable responses and immutable synthesis. Preserve task, conversation,
research and infrastructure authority. Complete real acceptance and normal integration
before marking this milestone accepted. No recurring scheduler, employee Computer Use,
live business actions, production demonstration roster or automatic grant activation.

## Baseline and ownership

- Fetched `origin/main`: `9f57f7fd67d52b13dd0feb50863994059a342aac`.
- Original main is clean. Existing audit, Prompt 07, empowerment docs and WE-01 worktrees
  are preserved. This task owns only the new Prompt 08 worktree/branch.
- Ubuntu service is active/enabled; health reports database/dispatcher ready and runtime
  ready. Source and reported build are the same baseline SHA; listener is loopback 4310.
- GitHub CLI is absent locally; use an available authenticated GitHub interface after
  checking it. No permission or protection bypass.
- Retained-HQ inventory, protected consistent backup and repeated offline migration passed; see progress ledger below.

## Design under examination

Reuse the shared dispatcher and Prompt 07 scoped conversation sessions with a rigorously
typed discussion association, a first-class working-group object and distinct tools.
Group requests cannot use direct-chat controls, peer spawning or task tools. Group
research uses WE-01's broker/receipts, one group-wide work budget and individual daily
limits, with an explicitly owner-authorized discussion mode rather than broadening
old grants. Shared evidence is a bounded immutable export, not access to source history.
Synthesis is independently owned by the group; no fake Task. Confirm details against code
before finalizing Decision 021.

## Invariants and risks

- SQL and trusted code bind group, request, worker, session generation and current scope.
- One active execution per worker, two globally; facilitation releases its slot.
- Drafts/passive notes never dispatch. Explicit start/extension controls authorize work.
- Deadlines and consumed budgets survive restart; pauses do not erase usage.
- Uncertain employee/broker outcomes retain the existing shared worker fence.
- Private direct conversations, task histories and unexported documents stay excluded.
- Group artifact completion never completes a Task or grants follow-on authority.
- Device API v1 gains no group authority, transcript, evidence or event payload.
- Migration never creates workers/grants, clears fences or changes production pause.

## Implementation and acceptance matrix

| Gate | Required evidence | State |
| --- | --- | --- |
| Preflight | Required docs/code, remote/PR/host state, ownership and current retained inventory | Passed; actual retained state inventoried |
| Domain | Draft/start, charter, eligible manual/Atlas team, finite budgets, lifecycle, causal turns | Passed deterministic and actual Ubuntu acceptance |
| Sharing | Owner export, public-source packet, provenance, revocation and private-history denials | Passed deterministic and actual Ubuntu acceptance |
| Runtime | Shared capacity, scoped sessions, no task tools, callback/settlement safety | Passed deterministic and actual Ubuntu acceptance |
| Synthesis | Attributable immutable versions, dissent/challenges, bounded review, separate Task preview/submit | Passed deterministic and actual Ubuntu acceptance |
| Browser | Charter, transcript/evidence, interjection, controls, history isolation and screenshots | Passed deterministic and actual Ubuntu acceptance |
| C08-1 A | Real supplied-material deliberation with substantive response and browser interjection | Passed on 4e2a7eb: four real workers, 11 turns, draft/final, no Task |
| C08-1 B | Atlas-selected roster, actual worker research, >1 source, shared inspection and denied new authority | Passed on 34779af: five real workers, two sources, 15 turns, reviewed final; prior failures retained |
| C08-2 C | Actual rollover, safe restart, no duplicates, separate deterministic and provider failure evidence | Passed: actual rollover, safe restart, confirmed interrupts and controlled in-flight crash; unknown fences retained |
| D | Deterministic authority, isolation, scope, bounds, idempotency, lifecycle, migration and actual idle interval | Passed: 211/211 Ubuntu, 210/211 local with Linux-only skip, actual 30-second idle |
| E | No discussion-created Task; explicit edited owner submission through existing Task path | Passed: real final → edited owner preview → Atlas report; exact selected context verified |
| F | Current typecheck/full suite counts, affected Ubuntu/browser regression, independent read-only review | All actual checks and independent final evidence review passed |
| Preservation | Consistent protected backup, repeated offline migration, original records retained | Offline check passed; production post-deployment comparison remains |
| Delivery | Complete diff, normal PR/merge/push, exact deployment/build, health and cleanup | Pending |

## Evidence ledger

| Check | Source/revision | Result |
| --- | --- | --- |
| Fetch and clean baseline | `9f57f7f` | Passed |
| Ubuntu health and listener | Same source/health SHA, Node v24.21.0 | Passed; read-only check |

## Relevant reading and documentation

Use AGENTS, README, Project Memory, Roadmap, product/organization models, milestone
requirements, system/conversation architecture, operations/multiple-instance/public
research guides, Client API v1, Decisions 015–020 and Prompt 07/WE-01 plans/reports.
Update affected current docs, add Decision 021, a focused technical guide, tutorial,
sanitized screenshots/evidence and a dedicated validation report. Do not mark Prompt 08
complete or Prompt 09 next before required acceptance passes.

## Remaining gates

Complete normal integration/deployment
with retained-state comparison and temporary-service cleanup. Historical progress below
records earlier gate states; the matrix and validation report give current status.

## Progress — 2026-10-01 09:40 UTC

Core implementation exists in the owned worktree; **not yet accepted or deployed**.
Schema 10, typed group-associated conversation turns, scoped tool schemas and SQL
ownership, manual/Atlas team selection, explicit evidence export and new opt-in research
mode, bounded protocol, immutable synthesis, owner controls and separate assignment
are implemented. Browser groups use the existing owner session boundary.

Actual preflight: seven enabled idle production workers (Atlas, Nix, Maya, Turing,
Linus, Ada, Grace), 43 Tasks (26 completed, 17 cancelled), no running/queued work,
**unpaused**, one existing Atlas public-research grant covering Task/conversation only.
Preserve that grant exactly. No open PRs at preflight. Protected SQLite backup and
original-record inventory: `/var/backups/botsquad/prompt08-20261001T0904Z/`;
consistent source backup plus offline copy, directory 0700/files 0600. No retained-data
migration or production restart has occurred.

Evidence so far (development checks, not real acceptance):
- Initial sandboxed full run: 192 tests, 146 pass, 45 fail, one Linux skip. Failures
  included denied loopback listeners and nested macOS sandbox execution; retained log.
- Authorized local rerun: 192 tests, 191 pass, zero failures, one Linux-only skip.
- Latest focused discussion run: 16 tests, all pass. Covers causal protocol, no Tasks,
  grant-mode isolation, source export, stale checkpoints, pause/stop, retained fences,
  atomic scheduling, membership/sharing changes, deadlines/extensions, large artifacts,
  Atlas audience confirmation and SQL ownership rejection.
- Actual Chrome checks: two working-group browser tests pass after fixing startup TDZ;
  first failed attempt retained. Screenshots inspected. Current broader rerun pending.
- Separate read-only reviewer reproduced and we fixed partial scheduling, false evidence
  checkpoint advancement, incomplete-final fence handling, browser startup TDZ, Atlas
  audience changes, synthesis envelope accounting and SQL association hardening.
  Follow-up found record retrieval counting refresh receipts; now separately tracked.
  JSON escaping is handled by dropping optional previews while retaining original IDs.

Isolated real-worker validation scripts are being prepared. Roster setup is explicitly
labelled trusted fixture, not model evidence. Six persistent roles, no inherited grants.
Optional operator-only pause, one-turn rollover threshold and in-flight crash controls
are separate from production entry points. C08-1/C08-2, migration, Linux regressions,
final documentation/review/integration/deployment remain open. ETA remains 7–14 hours.

## Progress — 2026-10-01 09:55 UTC

- C08-1 A passed on `4e2a7eb`: group `group_615eb29c-3d39-43e7-81a0-6566087e82a2`,
  Maya/Turing/Linus/Grace, 11 actual turns. Owner added the keyboard-only, no-network,
  no-personal-video constraint through Chrome after two initial contributions. Turing
  revised the original local-import recommendation in response; Grace challenged what
  would count as a useful inspection action. Final synthesis
  `synthesis_57f66767-22bb-4633-a07e-b15f45cf6624` retains the distinction between a
  precomputed sample and executing the actual pipeline, uncertain effort and untested
  accessibility. No implementation Task. Two immutable synthesis versions.
- Restart at a settled, globally paused boundary retained two completed/two queued turns;
  continuation succeeded. Low-threshold fixture requested fresh contexts after each actual
  completed turn; detailed provider-reference proof is being exported. No fake usage events.
- Linux deterministic candidate suite: **202/202 passed**, no skips, 164.0 seconds.
- Latest local discussion checks: **21/21 passed**, including new async revocation/stop,
  device privacy and group-wide research budget tests.
- Reviewer additionally reproduced hundreds of tiny owner notes overwhelming context
  metadata. Fixed with an admission cap of 32 owner interjections; 32 remain deliverable.
- Live Atlas research acceptance now running on `18b9141`. Only the isolated fixture Atlas
  receives the explicit discussion-mode grant. Production remains baseline and unchanged.
- ETA **6–12 hours remaining**; next estimate due approximately 10:25 UTC.

- 10:22 UTC: C08 research group reached shared real evidence and peer responses, then
  Atlas's synthesis provider timed out (240 seconds, no artifact). Preserved the failed
  run and worker fence. Added/reviewed narrow owner-selected existing synthesizer for
  explicit incomplete finish; 24 focused and 5 affected browser tests pass. Original
  failure remains failed; a separately named browser recovery phase will validate the
  partial result. Production unchanged. No uncertainty repair or broad new permissions.

- 10:25 UTC ETA: **5–10 hours remaining**. Research group now completed by explicit
  owner-selected Maya incomplete synthesis, retaining Atlas timeout/fence and failed
  original phase. Full local suite 209 total:208 passed,0 failed,1 Linux-only skip.
  Fresh isolated company will validate harmless assignment; old company stays intact.
  Remaining: live regression/controlled crash gates, final Linux suite, documentation,
  normal merge, code-only production deployment and preservation/cleanup.

- 10:45 UTC: independent semantic review identified a real grounding failure in the
  first research final: it called product category unknown despite the unread owner
  packet identifying a local video-analysis prototype. Artifact retained unchanged;
  research final quality gate remains open. New trusted full-excerpt delivery checks
  reject catalog-only, peer, partial and prior-turn citations; 26 focused tests pass.
  Reviewer separately exercised escaped6000-char exports, wrong-ID equality, rollback,
  facilitator current-turn reading and max47894/48000 context. No material finding.
  A new actual Atlas-organized run will validate the correction. Existing Task research
  regression passed actual CEO/Scout/resume/restart/interruption.

- 10:55 UTC ETA: **3–6 hours remaining**. Controlled in-flight crash/restart and
  no-replay blocking passed; original unknown fences retained. Full candidate suite
  is 211/211 on Ubuntu, 210 pass/one Linux skip locally. Second research attempt
  read the owner brief correctly but Atlas exhausted its unchanged16-call budget
  after source-ID/excerpt mistakes. Failure retained. Corrected actionable guidance
  and source error messages; bounded partial finish and a fresh isolated confirmation
  will verify the correction. Existing production is unchanged.

## Delivery sequencing

Keep the implementation PR explicitly release-pending through acceptance and review.
After its normal merge, deploy the exact integrated source using only the established
application build/service steps, preserving the provisioner/OS configuration. Verify
runtime/build identity, private listener, browser, actual pause/grants and original-state
preservation. Only then update completion/next-milestone documentation in a normal bounded
follow-up PR. Deploy that final documentation revision and save its exact receipt outside
Git, avoiding a commit that tries to contain its own future hash. No unrelated writer or
validation failure is discarded.

- 11:20 UTC: independent semantic review accepted fresh C08-1 B on `34779af`:
  five workers, 15 actual completed executions, two retrieved public sources, linked
  draft/final, 36 causal prior-contribution references and 28 same-execution evidence
  checks. Maya/Scout revised their recommendations after concrete Turing/Grace challenges.
  Known search failure retained; no ambiguous operation or new Task. Final owner-brief
  grounding and private-source exclusion verified. All C08-1/C08-2 core gates now pass;
  real engineering/Projects regressions and delivery remain. Current full Linux 211/211
  and local 210/211 (one Linux-only skip). Real identity transport recovery passed.

- 11:25 UTC ETA: **1–2 hours remaining**. Both core C08 cases and semantic/security
  review pass; current suite is 211/211 Ubuntu and210 local plus one Linux-only skip.
  Real recovery, assignment, revocation and idle checks pass. Engineering/identity is
  progressing through its normal protected clone setup; Projects follows sequentially.
  Then normal merge, exact application-only deployment and final preservation/cleanup.
  Production remains unchanged. No scope expansion or relaxation of limits/fences.

- 11:33 UTC: the existing real engineering/identity workflow completed14 Tasks but its
  actual engineers missed overlap by203 ms (provider-turn gap1,568 ms) while Nix follow-ups
  occupied a slot. Failure/root/identities retained; canary and retirement gates not reached.
  Independent review accepted an optional fixture-only restrictive admission gate waiting
  for infrastructure Task AND execution settlement. Original eligibility/dispatch/overlap
  assertions stay unchanged; no production scheduler edits or provider waiting. Fresh
  real rerun required, with the fixture admission explicitly recorded in its evidence.

- 11:42 UTC: engineering rerun passed on `04ff797`: 14 workflow Tasks, 26 executions,
  23,053 ms actual provider-turn overlap after the explicit readiness admission, exact
  commit review and confined integration. All 100 real UID checks passed. An additional
  retirement Task killed the one harmless UID probe, denied retired access and preserved
  history/home. Original failed overlap run remains failed. Projects started sequentially
  in `projects-prompt08-20261001T114202Z`; production is still unchanged.

- 11:49 UTC: Projects passed on `04ff797`: two engineers, real requested revision,
  three submissions/two review rounds, confined integration, all restart checkpoints,
  one reconciled local-remote publication attempt, divergence denial and archive recovery.
  Actual provider turns overlapped 17,043 ms after operator readiness admission; 100 UID
  checks and four archived-clone access denials passed. Independent final evidence review
  is underway. Typecheck/build/diff checks pass and all 182 built files exactly match
  the retained candidate manifest. No production migration or restart yet.

- 11:53 UTC: independent read-only review accepted the engineering/Projects receipts,
  selected public exports and application-only deployment scripts. No material blocker.
  Fresh protected backup/repeated migration passed; all original records and identities
  still match. Temporary services/tunnels are stopped with evidence retained. Normal
  evidence commit, PR integration and exact-build production gate follow.

- 11:55 UTC ETA: **30–60 minutes remaining**. All actual acceptance/regression and
  independent review gates passed. PR #7 merged normally as
  `01f5b76b533d6fc715fba669e7c139fcafd566c5`; local main and origin/main match. Application-only
  deployment is building that exact revision, followed by the actual service-confinement
  gate before startup. GitHub's optional automated Codex review was unavailable due to
  review quota; the separate read-only security/recovery reviewer completed review.
  Production was safely paused/stopped with no active job after its consistent backup.

- 12:04 UTC: exact integrated backend gate passed211/211; all182 build files matched,
  service/PID/private listener/HQ/grants/pause and original+fresh preservation passed.
  The legacy comparator's client-event growth diagnostic is retained; independent review
  accepted exact bijective accounting of the two owner pause/resume audit notifications,
  with every original row/cursor and all identity/home/receipt checks unchanged.
  Production Chrome preview found a real initial-roster loading race (no writes/work).
  Narrow browser fix waits for roster readiness; delayed-response regression and all
  affected Chrome checks pass. Review and normal correction delivery precede completion.
