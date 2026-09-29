# Execution Plan — Single-company-first roadmap alignment

**Status:** Complete — documentation authoring and review; integration status is recorded by PR #2  
**Owner:** BotSquad documentation task requested by the human owner  
**Branch:** `docs/single-company-first-20260929`  
**Worktree:** GitHub connector; no operator workstation or HQ worktree modified  
**Started / reviewed:** 2026-09-29  
**Baseline:** `a1532d3359223f4047d28f9a3c054dd1369108db`  
**Delivery:** [PR #2](https://github.com/eugenelin89/bot_messenger/pull/2)

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

`AGENTS.md`, `README.md`, `docs/product/PROJECT_VISION.md`, `docs/product/ROADMAP.md`, `docs/product/INTELLIGENT_COMPANY_MODEL.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md`, the decision index, and Decisions 010, 014, 015 and 016. Decision 017 now records the accepted extension.

## Invariants / risks addressed

- This is accepted future scope, not evidence that Prompts 07+ are implemented.
- Persistent employees and BotSquad conversations must not depend on one provider thread.
- Scheduling must be durable, bounded and non-polling at the model layer.
- Broad strategic discretion must not become broader operational authority.
- Production credentials, existing history, worker identities and other writers remain untouched.
- A simulated/draft-only business scenario must not be described as real business operation.
- Preserve historical decisions and milestone evidence; explicitly identify superseded future ordering.

## Implementation and review completed

1. Read current GitHub main, instructions and relevant planning/architecture material; checked concurrent PRs/branches.
2. Added Decision 017, detailed single-company operating requirements and project continuity notes.
3. Updated roadmap, README and vision; retained completed milestone sections and explained future numbering changes.
4. Linked Decisions 010/016 to 017 without replacing their original rationale; updated the decision index.
5. Added milestone acceptance IDs and scoped `prompts/AGENTS.md` authoring guidance.
6. Opened PR #2; inspected changed paths and the roadmap, README and vision diffs. Reviewed new-document content, relative references, numbering, evidence labels and authority/recovery requirements.
7. Prepared normal merge integration with an expected-head guard. The PR, rather than a guessed future commit hash in this document, records the actual merge outcome.

## Validation performed and limits

### Documentation review

The PR changed-file list contains 12 documentation/instruction files only. The roadmap diff leaves the completed Prompt 01–06 sections unchanged. README and vision agree with the canonical sequence: 07 continuity, 08 deliberation, 09 company loop/scheduler/reference test, 10 Computer Use, 11 real single-company operations. Old 11–14 scale/transport assignments are explicitly superseded.

New relative references were manually checked against the known repository paths and created files. Requirements C07–C11 agree with the decision, roadmap and operating companion. No automated link checker was run; this is a manual document/path review, not a claim that every historical document has been exhaustively audited.

### Local integration / end-to-end agent execution

Not run and not required for this documentation-only change. No runtime tests, real-model runs, deployment checks or server probes are claimed. A local clone was unavailable in this session; GitHub connector content and the PR diff are the source of truth.

### Restart / recovery and security

Reviewed future acceptance requirements for scoped context rollover, stale callback rejection, durable schedules, authority rechecks, duplicate/ambiguous operation handling, revocation and a real-business evidence gate. These are written requirements, not executed tests or new operational permissions.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Main baseline | `a1532d3359223f4047d28f9a3c054dd1369108db` | Read | Prompt 06 complete; Prompt 07 next |
| Concurrent PRs | GitHub open-PR collection at preflight | None open | Existing branches preserved |
| Isolated writer branch | `docs/single-company-first-20260929` | Used | No workstation/HQ edits |
| Changed-file inventory | PR #2 at `3f22480dcd74acbcd74ceb82e011228276e084e2` | 12 docs/instruction files | No runtime/configuration/fixture changes |
| Key diffs | PR #2 roadmap, README and vision patches | Reviewed | Completed roadmap 01–06 sections unchanged |
| New links and requirement consistency | Created files and known repository paths | Manually reviewed | No automated link checker |
| GitHub status/check runs | `3f22480dcd74acbcd74ceb82e011228276e084e2` | No statuses/check runs reported | Not a CI pass claim |
| GitHub review state | PR #2 | No submitted reviews at inspection; mergeable | No blocked review was bypassed |
| Runtime / deployment tests | Not run | Not applicable to this change | Planned behavior remains unimplemented |

## Decisions made during execution

Decision 017 records the owner's four accepted changes and the revised delivery order. Minimal practical business adapters are not required to depend technically on Computer Use. A dry run does not satisfy the live-operation gate; a failed commercial hypothesis can still yield a valid evidence-based decision. No model/provider exactly-once guarantee is assumed when an outcome is unknown.

A repository-backed memory/handoff is the durable continuation mechanism for this update; it is not a claim that ChatGPT account memory or an already-running Codex task has been modified.

## Documentation freshness

Updated the canonical roadmap, README, vision, decision index and Decisions 010/016. Added Decision 017, `docs/PROJECT_MEMORY.md`, `docs/product/SINGLE_COMPANY_OPERATIONS.md`, `prompts/MILESTONE_REQUIREMENTS.md` and `prompts/AGENTS.md`. Earlier completed execution plans and validation reports remain unchanged. The implemented architecture/current-state records are not rewritten as though planned features exist; the new companion and Decision 017 describe their future extensions.

Current-facing sequence authority is the roadmap. Older future-numbering summaries are superseded explicitly rather than silently reinterpreted as current implementation. No claim of a repository-wide historical documentation audit is made.

## Remaining work / blockers

No documentation-content blocker remains. Actual integration is recorded by PR #2 and the final handoff. Prompts 07–11 are still future implementation. Next planning work is Prompt 07 including context continuity; this task does not generate or run that implementation prompt.

## Completion handoff

Use the final PR merge/head SHA as the delivery receipt. Report the 12-file documentation scope, accepted priority/order, manual review and non-run runtime checks. Point subsequent chats/Codex tasks to Project Memory, Decision 017 and the prompt requirements instead of relying on an old chat recap. No force push, branch deletion, deployment or retained-state change is part of delivery.
