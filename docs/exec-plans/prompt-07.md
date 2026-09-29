# Execution Plan — Prompt 07 conversations and context continuity

**Status:** Active  
**Owner:** Codex Prompt 07 implementation task  
**Branch:** `feature/prompt-07-conversations-continuity`  
**Worktree:** `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-prompt07`  
**Started:** 2026-09-29 09:12 UTC  
**Initial ETA:** 6–10 hours, including real Ubuntu acceptance, review and deployment.  
**Current ETA:** 4–6 hours remaining at 09:42 UTC. Updates in the active task every 30 minutes; no scheduled reporting task.

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
  listener only `127.0.0.1:4310`; no 4311 listener. Full data inventory still pending.
- Runtime remains pinned at Codex 0.157.0; inspect generated matching schema before change.
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
| C07-1 | Real Maya + engineer replies, peer exchange, passive/no Task, authority, queue/pause/interrupt | Pending |
| C07-2 | Actual different provider contexts, stable worker/conversation, history + pending obligation | Pending |
| C07-3 | Bounded source handoff, privacy sentinel, stale callback fencing, restart handoff | Pending |
| C07-4 | Duplicate/ambiguous outcomes, legacy binding/task preservation, matching protocol evidence | Pending |
| Regression | Unit/integration/browser/API/provisioner/Linux isolation + real research/engineering/Projects | Pending |
| Delivery | Read-only security review, PR/normal merge, exact source/build equality, data preservation | Pending |

## Evidence ledger

| Check | Source/command | Result |
| --- | --- | --- |
| Git state | fetch/status/worktrees/branches + connector PR search | Baseline matches; isolated branch created; no open PRs |
| HQ health | SSH systemctl/health/revision/ss | Healthy/runtime ready, private listener, retained source `29c6795` |
| Dependencies | npm ci offline | Missing cached package; normal network install started |

## Remaining gates

All implementation and acceptance gates remain open. No completion claim or production
domain mutation. Do not merge/deploy until required validation, migration/preservation
and review pass. Record real model provenance and unavailable usage as unknown.

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
