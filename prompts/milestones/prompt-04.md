# Prompt 04 — Nix, approvals and worker Linux identity

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `9fc5f8289aafd51983102a88b13b6e1d4182dbab`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Give Linux workers private Unix identities and independent engineering clones through exact trusted approvals and a narrow provisioner.

## Required behavior

- Introduce persistent Nix infrastructure Tasks and trusted human initialization/approval.
- Bind immutable operations to target, requester, parameters, expiry and preconditions; persist intent and durable host receipts.
- Perform approved source/Git mutations as the worker UID; retire safely while preserving homes, IDs and history.

## Authority / safety boundaries

- Nix receives typed requests, no root/sudo/shell or onward delegation.
- Only the trusted service/admin reaches the root-owned Unix socket; use fixed operations and ID-derived paths.
- Keep Codex authentication/runtime workspaces under the service identity; migration creates no OS users or implicit grants.

## Acceptance expectations

- Real Ubuntu Nix/approval flow, private identities/clones, UID denial probes, concurrent engineering and exact review/integration.
- Lost-response receipt reconciliation, safe retirement, restart/reboot, retained state and research regression.

## Explicit non-goals

General Projects, service administration, remote fleets, mobile APIs, Computer Use, multi-company and arbitrary privileged commands.

## Historical outcome

Accepted real Ubuntu identities, approvals, isolation, engineering and recovery. The development backend remains simulated and is not Linux isolation evidence.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-04--nix-trusted-approvals-and-per-worker-linux-identity)
- [Execution plan](../../docs/exec-plans/prompt-04.md)
- [Validation](../../docs/validation/prompt-04-linux-identity.md)
- Primary decisions: [013](../../docs/decisions/decision_013_trusted_worker_infrastructure.md)
- [Architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
