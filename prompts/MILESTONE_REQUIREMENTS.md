# Requirements for Future BotSquad Milestone Prompts

**Status:** Accepted prompt-authoring guidance; not an executable milestone  
**Updated:** 2026-09-29

Read the root `AGENTS.md`, [Project Memory](../docs/PROJECT_MEMORY.md), the [canonical roadmap](../docs/product/ROADMAP.md), [Decision 016](../docs/decisions/decision_016_intelligent_company_model.md), [Decision 017](../docs/decisions/decision_017_single_company_first.md) and the [single-company operating requirements](../docs/product/SINGLE_COMPANY_OPERATIONS.md) before authoring or revising an organization milestone.

This guide is a requirements source, not permission to implement every future feature now. Preserve the requested milestone's scope and current repository evidence. A historical or already-running prompt is not silently rewritten by this document.

## Include in each substantial implementation prompt

### Preflight and ownership

Inspect synchronized main, HEAD, current branch/worktree, working tree, active writers, repository instructions, current implementation and relevant accepted decisions. Preserve unrelated work and existing data. Work on an owned short-lived branch/worktree; do not force push, reset, delete branches or overwrite a concurrent task. Explain how concurrent documentation is incorporated rather than merging it twice.

### Product outcome and non-goals

State the employee/company behavior being improved, the bounded deliverable, the dependencies actually required and the explicit deferred work. Distinguish current capabilities from planned behavior. Do not turn a milestone into a fixed theatrical transcript or a large generic platform.

### Authority and recovery

Identify the trusted enforcement layer, policy/grant scope, user control, secrets boundary, idempotency and ambiguous-outcome handling. Treat conversation, deliberation, decision, Task and external operation as distinct. Recheck permissions after delay, retry, schedule dispatch and context rollover. Model text and summaries never authorize an action.

### Evidence and acceptance

Define deterministic invariant tests and, where authorized, real bounded runtime acceptance. Include provenance, artifacts/receipts, measured results, failure cases and current limitations. Do not script every participant, reply, strategy or conclusion. Preserve dissent and uncertainty. A fixture validates its stated scope; it cannot establish a live customer/business result.

### Delivery

Update affected product/architecture docs, decision records and the execution plan. Require relevant tests and an explicit security review when authority/runtime boundaries change. Use normal reviewed integration to main when the task authorizes it and checks permit it; stop at a clear blocker rather than bypass checks. Push and verify the exact resulting commit. Deploy only when explicitly included in the task; documentation integration alone is not deployment. State implemented versus deferred behavior and checks not run. Leave a concise continuation handoff.

## Milestone-specific required acceptance

| ID | Applies to | Requirement |
| --- | --- | --- |
| C07-1 | 07 | Direct human↔worker and peer conversations, bounded explicit reply requests, passive messages that do not wake a model, and preserved assignment/approval boundaries |
| C07-2 | 07 | Force runtime-context rollover while Worker and BotSquad Conversation IDs, history, pending work and evidence persist |
| C07-3 | 07 | Scoped, bounded, source-linked handoff; no private-context leakage; stale-session callbacks rejected; restart during handoff reconciled |
| C07-4 | 07 | No blind replay of completed or ambiguous operations; preserve compatible legacy bindings and reject unsupported runtime assumptions |
| C08-1 | 08 | Real bounded cross-functional deliberation with response to others, alternatives, preserved dissent, synthesis and separately authorized follow-on work |
| C08-2 | 08 | Reuse 07 continuity and current participant permissions; no new unbounded conversation or context-sharing loop |
| C09-1 | 09 | Both a broad mandate and the canonical Asymmetri Motion specific-product mandate, with meaningful choices left to the team |
| C09-2 | 09 | Durable one-time/recurring review triggers, owner/purpose, timezone semantics, occurrence identity, cancellation and bounded execution |
| C09-3 | 09 | Restart, duplicate, overlap, missed-run catch-up, edit, pause, revocation and no-idle-model-polling cases; controlled-clock tests plus an authorized real short scheduled occurrence |
| C09-4 | 09 | At least two operating cycles with intervening attributable evidence and a reasoned next decision; no fake production metrics or unapproved product changes |
| C10-1 | 10 | Isolated bounded Computer Use, explicit site/action/file/network scope, revocation, interruption, injection resistance and receipts; no default access to the owner's desktop |
| C11-1 | 11 | Minimal useful business evidence/metrics and reviewed role/capability extensions where needed, rather than every connector or unrestricted worker tools |
| C11-2 | 11 | At least one explicitly approved real external business action with receipt and observation; labelled dry-run fallback does not satisfy the live gate |
| C11-3 | 11 | Two-cycle scheduled pilot, recovery through restart/context rollover, denied/revoked actions, effect deduplication or safe blocking, and human supervision evidence |
| C11-4 | 11 | Baseline/source definitions, usage/costs or declared unknowns, outcomes/limitations and evidence-based continue/iterate/pivot/stop; no guaranteed revenue improvement |

Use these IDs in each applicable execution plan's acceptance matrix. Mark a requirement implemented, tested, blocked or intentionally out of scope with a reason; do not drop it silently.

## Priority guard

Prompts 01–06 remain completed history. Preserve 07 conversations/continuity → 08 deliberation → 09 company loop/scheduler → 10 bounded Computer Use → 11 real single-company operations.

The old future assignments of 11 multi-company, 12 company collaboration, 13 Telegram and 14 federation are superseded by Decision 017. Those directions are deferred and unnumbered. Minimal scheduling belongs in 09; minimal business evidence and external-action adapters belong in 11, not behind federation. Broader CRM/accounting/cloud/payment platforms remain later unless a new explicit owner decision changes scope.

Asymmetri Motion is configuration and acceptance evidence, not a hard-coded dependency of the generic BotSquad engine. Do not read private product data, change another repository or publish/send/spend merely because the reference case is named.
