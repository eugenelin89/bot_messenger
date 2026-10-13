# Decision 046 — explicit fresh-research recovery release

**Date:** 2026-10-13 UTC
**Status:** Source reviewed; validation/integration recorded in HQ-READY-04C
**Scope:** B1 source repair only; no live authority or operational consent

## Decision

Normal startup still recovers every finite authority into a hold. An authenticated human
may explicitly release a typed recovery hold for an approved, untouched, future private
research draft through the existing owner HTTP/CSRF boundary. This action keeps both the
loop and working group draft. Collection and Start remain distinct explicit actions.

The release digest binds the entire immutable external envelope, authority/run/scope,
configuration/preview, exact recovery hold/control revision and current reload attestation.
Admission rechecks the enabled owner, worker eligibility/membership/workspace identity,
both consents, source/processing rights, retention, host/source/custody identity and future
occurrence. No scoped collection reservation or model attempt may exist, even if settled.
Provider/global uncertainty, incomplete usage, insufficient remaining allowance, changed
reload evidence or stopped/expired authority denies release. Shutdown denies pending controls.

The Codex adapter performs strict non-inference identity checks in each approved worker
workspace using the approved isolated runtime. Every account verifier and RPC connection
stays open and current through the final synchronous owner transaction. Account/routing,
configuration, requirements, catalog/profile, credits and connection invalidation must pass.
There is no thread/start, thread/resume or turn/start. After asynchronous verification,
the owner transaction repeats admission and checks the future draft again after synchronous
host/workspace/accounting work, immediately before release.

The independently retained finite journal is the sole release authority. Under its write
lock it recomputes eligibility and appends release plus the exact single-use owner receipt
in one SQLite transaction, followed by durable custody agreement. A matching repeated
receipt is a no-op; conflicts, changed reload evidence and newer holds/revisions reject it.
Transactions with no appended events do not rewrite custody, avoiding stale duplicate
checkpoint writes over concurrent events. Uncertain persistence/custody fails closed.
There is no local permission cache, new authority store, refund, counter reset or allowance.

## Compatibility and limits

Only new, explicitly typed recovery holds are eligible. Historical untyped holds and owner,
failure or uncertainty holds stay ineligible even after another recovery. Do not rewrite
old journal events to relabel them. This repairs the future fresh-authority deployment
sequence; it does not unlock previously recorded old-format holds or spent authorities.

Local HQ restore cannot undo external consumed history. Restoring either journal or custody
alone is detected; deliberate coordinated rollback of every copy requires an independently
held current checkpoint and remains an operational custody responsibility. Source fixtures
are not actual Linux guard, confinement, provider identity or genuine employee acceptance.

Decision037 remains permanently exhausted4/4; historical Yahoo authorizations stay spent.
The direct03H transport,04A evidence/worker path, synthetic private paper, finite limits and
public denial remain unchanged. No schema or contract change is required.

See [04C acceptance](../validation/investment/HQ-READY-04C.md) and
[separate owner approval package](../operations/HQ_READY_04B_APPROVAL_PACKET.md).
