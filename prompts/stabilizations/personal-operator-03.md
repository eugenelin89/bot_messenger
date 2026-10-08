# Personal Operator stabilization 03 — Owner Attention and pending-action overview

**Status:** Complete and deployed. Unnumbered work under Decision 026; not a core numbered milestone.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed stabilization specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `df633bc5294d26fd652fa4391ac08262dc202962`. Sources were reviewed at baseline
`968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; see the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit).
This file describes the completed task; reading it does not authorize replaying its actions.

## Goal

Answer “Does anything need me right now?” with a deterministic read-only overview linked to existing owner controls.

## Required behavior

- Project unresolved current authoritative records into bounded sanitized summaries and exact source destinations.
- Deduplicate shared domain/session/task conditions; exclude closed history unless an independent unresolved fence remains.
- Preserve exact totals, unknown versus verified-zero counts, stale cached generations and useful desktop/narrow navigation.

## Authority / safety boundaries

- Use SELECT-only projection rather than inspectors that may expire or clean up records.
- No free-text objectives/errors, private content, credentials, provider payloads or screenshots in the overview.
- No dismissal model, migration, model invocation, external effect, new device scope or Client API v1 authority.

## Acceptance expectations

- Classification, precedence, privacy, zero-write HTTP and exact-link tests across current domains.
- Browser navigation, held startup, reconnect, stale-count and responsive acceptance.
- Exact Ubuntu domain/browser validation, deployment preservation and idle checks without unnecessary live-agent reruns.

## Explicit non-goals

New approval/recovery semantics, background model monitoring, historical inbox, generic notification system and feature expansion.

## Historical outcome

Complete and deployed. Exact source links, classification, privacy and deduplication passed, with retained production state and zero idle work. The overview adds navigation to existing controls; it grants no new authority.

## Related records

- [Personal Operator roadmap](../../docs/product/ROADMAP.md#personal-operator--daily-driver-phase)
- [Execution plan](../../docs/exec-plans/personal-operator-stabilization-03.md)
- [Validation](../../docs/validation/PERSONAL_OPERATOR_STABILIZATION_03.md)
- Decisions: [026](../../docs/decisions/decision_026_personal_operator_stabilization.md)
- [System architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document)
- [Stabilization index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
