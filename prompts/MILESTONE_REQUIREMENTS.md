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

## Development-time Codex specialist review

For substantial implementation work, route development-time Codex subagents according to
the changed risk surface using [the specialist guide](../docs/agents/README.md) and
[Decision 023](../docs/decisions/decision_023_codex_specialist_subagents.md).

The parent Codex thread remains the only writer/integrator. Specialists are read-only and
advisory. Do not create parallel writers or let a specialist stage, commit, merge, deploy,
or mutate retained BotSquad state.

Use specialists when they materially improve the work:

- `control_plane_architect` for new domain/execution origins, dispatcher/runtime/tool
  boundaries, or major control-plane architecture.
- `security_reviewer` for permissions, approvals, secrets, network/external actions,
  Computer Use, client trust, or prompt-injection-sensitive surfaces.
- `recovery_reviewer` for migrations, durable scheduling, async callbacks, idempotency,
  retries, restart/reconciliation, or ambiguous-provider outcomes.
- `product_strategy_reviewer` for material product/business/roadmap boundaries, generic
  engine versus reference-fixture choices, and scope sequencing.
- `test_reviewer` before closing substantial milestone/production work when acceptance
  claims could exceed the evidence.

Do not invoke all reviewers by habit. A prompt should name the likely applicable reviewers,
allow the parent to add/remove one when the actual changed risk differs, and record any
non-obvious omission. Review packets should be minimal and source-bound. Reviewer requests
for extra validation must identify the concrete risk and smallest sufficient check.

Subagent review supplements but never replaces the milestone's deterministic invariants,
real-runtime acceptance, independent product evidence, or trusted security enforcement.

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

## Preserve WE-01 standing research authority

Future milestones preserve Decision 020's separate public-research and company-knowledge
grants, source provenance/freshness, durable work/day budgets, compatible session lineage,
and asynchronous callback ownership. Read the WE-01 acceptance report for the current
live status. Do not assume every worker is granted, enable production permissions through
migration, send internal documents to public search, or confuse provider-internal actions
with hard application broker limits. Unknown research invocations preserve the shared
worker fence; ordinary source failures do not. Prompt 10 — Bounded Computer Use — is Complete and deployed, with C10-1 and release evidence in its validation record. Prompt 11 — Single-company business operations and measured pilot — is in progress; its real-business gates remain pending.

## Prompt 08 implementation reference

The accepted working-group implementation records its actual acceptance and deployment in
[Decision 021](../docs/decisions/decision_021_bounded_working_groups.md),
[technical semantics](../docs/architecture/WORKING_GROUPS.md), and
[Prompt 08 validation](../docs/validation/PROMPT_08_VALIDATION.md). Later prompts must
preserve group execution ownership, explicit sharing and grant-mode opt-in, actual seen
checkpoints, versioned recommendations, separate assignments and uncertainty fences.
A failed model attempt remains failed even when a separately authorized incomplete
result or fresh isolated regression succeeds. Check the validation report's open gates
before changing the canonical roadmap's completion status.


## Prompt 09 implementation reference

[Decision 022](../docs/decisions/decision_022_company_operating_loop.md) and
[the architecture](../docs/architecture/COMPANY_OPERATING_LOOP.md) define the implemented
mandate/clock boundary. C09-1 through C09-4 remain individual acceptance gates in
[the active plan](../docs/exec-plans/prompt-09.md); implementation is not release completion.
Later prompts must preserve worker/cycle identity, evidence modes and delivery proof,
private Task contexts, durable occurrence/version semantics, consumed bounds and unknown
provider fences. Prompt 10 owns Computer Use; Prompt 11 owns measured live operations.

## Prompt 10 implementation reference

[Architecture](../docs/architecture/COMPUTER_USE.md), [tutorial](../docs/operations/COMPUTER_USE_TUTORIAL.md),
[Decision 024](../docs/decisions/decision_024_bounded_computer_use.md) and
[C10-1 validation](../docs/validation/PROMPT_10_VALIDATION.md) distinguish real browser/worker
proof, synthetic tests, injected faults and production inactivity. Preserve one bounded
headless browser, owner-only immutable session grants, no personal desktop, disabled file
transfer, trusted exact fixture approval and unknown-effect fencing. Do not count the fixture
POST as Prompt 11's real action/receipt/measured-result gate or claim screenshot vision when
the model receives only structured rendered snapshots.

## Prompt 11 implementation reference

Read [business architecture](../docs/architecture/BUSINESS_OPERATIONS.md),
[tutorial](../docs/operations/BUSINESS_OPERATIONS_TUTORIAL.md),
[Decision 025](../docs/decisions/decision_025_bounded_business_operations.md) and
[validation](../docs/validation/PROMPT_11_VALIDATION.md). Preserve separate evidence/Decision/
action/approval/attempt/receipt objects, exact immutable scope, protected credential boundary,
no blind replay and withdrawal rules. A real-runtime fixture or code deployment never passes
the real C11-2 effect, scheduled C11-3 loop or evidence-driven C11-4 outcome by itself.
