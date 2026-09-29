# Execution Plan — Single-company-first roadmap alignment

**Status:** Active  
**Owner:** BotSquad documentation task requested by the human owner  
**Branch:** `docs/single-company-first-20260929`  
**Worktree:** GitHub connector; no operator workstation or HQ worktree modified  
**Started:** 2026-09-29  
**Baseline:** `a1532d3359223f4047d28f9a3c054dd1369108db`

## Objective

Record the owner's accepted priority: prove one AI company can operate a real business before investing in multiple companies or federation. Preserve the intelligent-employee model, broad and specific mandates, and trustworthy operational boundaries.

## In scope

- An accepted decision and indexed, cross-linked project continuity record.
- Prompt 07 runtime-context rollover requirements.
- Prompt 09 minimal durable scheduling and Asymmetri Motion acceptance.
- Practical single-company operations after Prompt 10 and before multi-company/federation.
- Canonical roadmap, product direction, and future-prompt guidance consistency.

## Out of scope

Runtime implementation, migrations, model execution, new credentials/integrations, changes to Asymmetri Motion itself, public marketing actions, spending, deployment, and changes to retained HQ state.

## Relevant current docs / decisions

`AGENTS.md`, `README.md`, `docs/product/PROJECT_VISION.md`, `docs/product/ROADMAP.md`, `docs/product/INTELLIGENT_COMPANY_MODEL.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md`, the decision index, and Decisions 010, 014, 015 and 016.

## Invariants / risks changed

- This is accepted future scope, not evidence that Prompts 07+ are implemented.
- Persistent employees and BotSquad conversations must not depend on one provider thread.
- Scheduling must be durable, bounded and non-polling at the model layer.
- Broad strategic discretion must not become broader operational authority.
- Production credentials, existing history, worker identities and other writers remain untouched.
- A simulated/draft-only business scenario must not be described as real business operation.
- Preserve historical decisions and milestone evidence; explicitly identify superseded future ordering.

## Implementation steps

1. Read current GitHub main, instructions, relevant models and decisions; check concurrent PRs/branches.
2. Add Decision 017, detailed single-company operating requirements and project continuity notes.
3. Update roadmap and current-facing entry points; retain historical records and explain numbering changes.
4. Add future Codex prompt requirements and acceptance traceability.
5. Review the documentation-only diff, links, status wording and accepted invariants.
6. Integrate through a normal documentation PR, without force-pushing or modifying another writer's branch.

## Validation plan

### Fast checks

Read back changed files and inspect the exact GitHub diff; verify linked repository paths and roadmap/status consistency. Check that changed paths are documentation/instruction files only.

### Local integration / end-to-end agent execution

Not required for this documentation-only change. No runtime tests, real-model runs or server probes are claimed. A local clone was unavailable in this session; GitHub connector reads/writes are the source of truth.

### Restart / recovery and security

Review future acceptance requirements for context rollover, durable schedules, idempotency, safe ambiguity handling, authorization rechecks, scoped memory and revocation. These are requirements, not executed tests.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Main baseline | `a1532d3359223f4047d28f9a3c054dd1369108db` | Read | Prompt 06 complete; Prompt 07 next |
| Concurrent PRs | GitHub open-PR collection at preflight | None open | Existing branches preserved |
| Isolated writer branch | `docs/single-company-first-20260929` | Created | No workstation/HQ edits |
| Documentation diff and links | Pending | Pending | Complete before integration |

## Decisions made during execution

Durable product decisions belong in Decision 017. A repository-backed memory/handoff is the durable continuation mechanism for this update; it is not a claim that ChatGPT account memory has been modified.

## Documentation freshness

Update the canonical roadmap, relevant decision status/index, product vision/entry points and prompt guidance. Preserve completed execution plans and validation reports unchanged. Current capability claims remain at Prompt 06.

## Remaining work / blockers

Documentation authoring, consistency review, PR and integration remain in progress. No implementation is part of this task.

## Completion handoff

Report the final PR/commit, changed documentation, the new prompt sequence, checks actually performed, any unmerged state, and the explicit distinction between repository continuity notes and ChatGPT account memory.
