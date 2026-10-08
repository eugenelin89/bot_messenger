# Prompt 10 — Bounded Computer Use

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `d39b7c7bf74aac091741387da16d77a80b2ac67c`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Prove an explicitly authorized Computer Operator can perform bounded browser work on Ubuntu with trusted isolation and recovery.

## Required behavior

- Use an ordinary computer Task and one isolated headless Chromium resource per HQ.
- Bind immutable owner grants to worker, Task, session and site/action/network/time scope.
- Provide structured rendered snapshots to the model and attributable private PNG evidence to the owner.

## Authority / safety boundaries

- Native worker browser/shell/MCP and personal desktop remain disabled; downloads/uploads are disabled.
- Trusted forwarding checks every request; exact protected fixture requests need trusted human approval.
- Hold the browser reservation through approval wait and unconfirmed cleanup; revoke/interrupt safely and never replay unknown transmitted effects.

## Acceptance expectations

- C10-1: actual browser/worker execution, enforced scope, injected hostile content, exact fixture approvals, denial/revocation and private evidence.
- Real isolation, interruption/restart/unknown-outcome checks, regression and zero automatic retained production authority.

## Explicit non-goals

Full desktop/workstation access, personal accounts, general external business actions, secret management and automatic operator/session grants.

## Historical outcome

C10-1, review, deployment and retained-state acceptance passed. A fixture POST proves enforcement only; Prompt 11 separately proved a real action path. Structured snapshots do not establish model screenshot vision.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-10--bounded-computer-use)
- [Execution plan](../../docs/exec-plans/prompt-10.md)
- [Validation](../../docs/validation/PROMPT_10_VALIDATION.md)
- Primary decisions: [006](../../docs/decisions/decision_006_bounded_computer_use.md), [024](../../docs/decisions/decision_024_bounded_computer_use.md)
- [Architecture](../../docs/architecture/COMPUTER_USE.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
