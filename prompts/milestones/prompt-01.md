# Prompt 01 — Persistent AI organization

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `5e7f4688ae29e5f0d4dfc29c3e9059a1f2c318f1`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Prove Human → Atlas → Scout → Atlas with durable identities and real Codex execution.

## Required behavior

- Persist workers, explicit Tasks, messages, execution attempts, artifacts and audit.
- Let Atlas hire and assign Scout within the trusted delegation ceiling; resume Atlas to evaluate the report.
- Use event-driven bounded dispatch, stable worker runtime bindings and visible pause/interruption/recovery controls.

## Authority / safety boundaries

- Messages never confer authority; bind tools to trusted execution identity.
- Keep worker, Task and provider thread distinct; reject workspace/thread swaps and retain uncertain outcomes without blind replay.
- Limit research to approved local documents; no native shell, broad network, inherited MCP or unrestricted writes.

## Acceptance expectations

- Real research report and resumed Atlas evaluation; inspect actual artifacts, runtime attribution and browser state.
- Verify restart preservation, no completed-work replay, bounded concurrency, passive idle state and denied authority escalation.

## Explicit non-goals

Engineering teams, Ubuntu deployment, direct conversations, public research, external actions, spending and multi-company support.

## Historical outcome

Accepted macOS real-runtime research, restart/resume and interruption evidence. Later Ubuntu deployment and WE-01 public research are separate work, not original Prompt 01 requirements.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-01--persistent-ai-organization)
- [Execution plan](../../docs/exec-plans/prompt-01.md)
- [Validation](../../docs/validation/prompt-01.md)
- Primary decisions: [002](../../docs/decisions/decision_002_messages_do_not_grant_authority.md), [003](../../docs/decisions/decision_003_codex_first_runtime.md), [004](../../docs/decisions/decision_004_delegated_worker_creation.md), [007](../../docs/decisions/decision_007_prompt_01_runtime_and_recovery.md)
- [Architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
