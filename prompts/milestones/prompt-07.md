# Prompt 07 — Conversations and context continuity

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `75a2f70bec179b2055d82eb9fc6ad81a09d99953`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Establish direct human/worker and bounded peer conversation independently of Tasks, with durable context continuity.

## Required behavior

- Persist explicit reply requests and passive messages; support direct specialist replies and bounded peer answer/continuation.
- Use separate worker/conversation provider generations and source-backed scoped handoffs.
- Keep worker/conversation IDs, transcripts, pending obligations and legacy Task bindings across rollover.

## Authority / safety boundaries

- Participation grants no assignment, filesystem, infrastructure, approval or external-action authority.
- Share the dispatcher and worker uncertainty fence across work origins; reject stale callbacks and private-context leakage.
- No idle model polling or blind replay of ambiguous provider effects.

## Acceptance expectations

- C07-1–C07-4: real direct/peer replies, passive no-work behavior, forced context replacement and retained obligations.
- Recovery through an interrupted handoff, denied unauthorized sources, legacy Task resume and attributable browser/runtime evidence.

## Explicit non-goals

Working groups, recurring company scheduling, Computer Use, public research tools, business integrations and iOS.

## Historical outcome

C07-1–C07-4 and required real Ubuntu/regression acceptance passed. WE-01 later supplied public research; it is not a back-ported Prompt 07 feature.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-07--first-class-conversations-and-direct-worker-interaction)
- [Execution plan](../../docs/exec-plans/prompt-07.md)
- [Validation](../../docs/validation/prompt-07-conversations-continuity.md)
- Primary decisions: [016](../../docs/decisions/decision_016_intelligent_company_model.md), [017](../../docs/decisions/decision_017_single_company_first.md), [018](../../docs/decisions/decision_018_conversations_context_continuity.md)
- [Architecture](../../docs/architecture/CONVERSATIONS_AND_CONTINUITY.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
