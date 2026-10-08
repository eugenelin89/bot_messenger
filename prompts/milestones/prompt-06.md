# Prompt 06 — Stable authenticated remote-client API

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `011fd3874ae3483e87468ef21d1e5f1091a88224`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Expose a stable authenticated native-client contract while preserving the private browser administration boundary.

## Required behavior

- Add /api/v1 with stable HQ identity, locally paired devices, Ed25519 proof, short-lived tokens and sanitized DTOs.
- Enforce immutable device capability ceilings and current human/device/token state on every request.
- Make retries durable and idempotent; provide bounded HQ-bound SSE reconnect/reset behavior.

## Authority / safety boundaries

- Local browser pairing, fingerprint confirmation and revocation remain trusted human operations.
- Device identity is distinct from workers and runtime accounts; no protected approval or enrollment expansion.
- Do not forward the full administrative listener as a device-only transport; migration creates no external work.

## Acceptance expectations

- Independent reference client and real browser pairing through SSH on Ubuntu; denials, expiration, revocation, interruption and safe retries.
- Service restart, host reboot, event reconnect, prior milestone regressions and retained-HQ preservation.

## Explicit non-goals

Native iOS app, relay, public listener/CORS, APNs, remote protected approvals, Project-policy editor and multi-company.

## Historical outcome

Protocol, Ubuntu restart/reboot and retained-state acceptance passed. Decision 012’s native iOS and mobile-transport design remains deferred.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-06--stable-authenticated-remote-client-api)
- [Execution plan](../../docs/exec-plans/prompt-06.md)
- [Validation](../../docs/validation/prompt-06-remote-client-api.md)
- Primary decisions: [012](../../docs/decisions/decision_012_ios_remote_client.md), [015](../../docs/decisions/decision_015_remote_client_trust.md)
- [Architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
