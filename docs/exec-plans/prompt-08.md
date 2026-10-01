# Execution Plan — Prompt 08 working groups

**Status:** Active, preflight/design; acceptance pending  
**Owner:** Codex Prompt 08 implementation task  
**Branch:** `feature/prompt-08-working-groups`  
**Worktree:** `../bot_messenger-prompt08`  
**Started:** 2026-10-01  
**Initial ETA:** 8–16 hours including real Ubuntu acceptance, independent review and deployment  
**Current ETA:** 6–12 hours (09:55 UTC update); revised estimates reported every 30 minutes as requested

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
| Domain | Draft/start, charter, eligible manual/Atlas team, finite budgets, lifecycle, causal turns | Implemented; focused checks pass, real acceptance in progress |
| Sharing | Owner export, public-source packet, provenance, revocation and private-history denials | Implemented; focused checks pass, real acceptance in progress |
| Runtime | Shared capacity, scoped sessions, no task tools, callback/settlement safety | Implemented; focused checks pass, real acceptance in progress |
| Synthesis | Attributable immutable versions, dissent/challenges, bounded review, separate Task preview/submit | Implemented; focused checks pass, real acceptance in progress |
| Browser | Charter, transcript/evidence, interjection, controls, history isolation and screenshots | Implemented; focused checks pass, real acceptance in progress |
| C08-1 A | Real supplied-material deliberation with substantive response and browser interjection | Passed on 4e2a7eb: four real workers, 11 turns, draft/final, no Task |
| C08-1 B | Atlas-selected roster, actual worker research, >1 source, shared inspection and denied new authority | Pending |
| C08-2 C | Actual rollover, safe restart, no duplicates, separate deterministic and provider failure evidence | Pending |
| D | Deterministic authority, isolation, scope, bounds, idempotency, lifecycle, migration and actual idle interval | Pending |
| E | No discussion-created Task; explicit edited owner submission through existing Task path | Pending |
| F | Current typecheck/full suite counts, affected Ubuntu/browser regression, independent read-only review | Pending |
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

All implementation/acceptance/delivery gates above remain open. No implementation or
real group acceptance has been claimed from this preflight.

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
