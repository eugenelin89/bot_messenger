# Personal Operator stabilization 02 — Startup and navigation reliability

**Status:** Complete and deployed. Unnumbered work under Decision 026; not a core numbered milestone.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed stabilization specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `ca5331af326bf18297ab91f018b7fffca1acb6dd`. Sources were reviewed at baseline
`968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; see the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit).
This file describes the completed task; reading it does not authorize replaying its actions.

## Goal

Eliminate the initial-state navigation race and make loading, readiness and recovery clear while preserving owner selection and drafts.

## Required behavior

- Allow immediate navigation before initial state arrives, with explicit booting/ready/degraded presentation.
- Serialize/coalesce refreshes; abort obsolete requests and guard auxiliary responses by current selection.
- Retain cached content with honest reconnect/stale status and preserve mutation prerequisites.

## Authority / safety boundaries

- No backend semantic change, schema/dependency addition, new capability or authority.
- Production validation stays read-only; loading and reconnect cannot manufacture verified empty state.
- Keep existing session and mutation controls intact.

## Acceptance expectations

- Reproduce held-state navigation failure, then verify desktop and narrow loading/error/reconnect behavior.
- Run focused startup and affected browser/HTTP tests; validate exact Ubuntu source and retained-state deployment.
- Exercise real tunnel navigation/reconnect with zero page errors, mutation requests or idle work.

## Explicit non-goals

Owner Attention aggregation, new runtime capability, mobile client and general UI redesign.

## Historical outcome

Complete and deployed, including the follow-up reconnect-label ordering correction and isolated test-order repair. Production navigation/preservation/idle evidence passed; the initial failures remain recorded.

## Related records

- [Personal Operator roadmap](../../docs/product/ROADMAP.md#personal-operator--daily-driver-phase)
- [Execution plan](../../docs/exec-plans/personal-operator-stabilization-02.md)
- [Validation](../../docs/validation/PERSONAL_OPERATOR_STABILIZATION_02.md)
- Decisions: [026](../../docs/decisions/decision_026_personal_operator_stabilization.md)
- [System architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document)
- [Stabilization index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
