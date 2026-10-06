# Personal Operator stabilization 03 — owner attention

**Status:** Active  
**Owner:** Parent Codex task, sole writer/integrator/deployer  
**Branch:** `codex/personal-operator-stabilization-03`  
**Worktree:** `bot_messenger-personal03`  
**Started:** 2026-10-06  
**Initial ETA:** 2–3 hours, including review, exact Ubuntu validation and deployment.  
**Current ETA:** Within the initial 2–3 hour window; implementation and local review complete, delivery gates remain.

## Objective and boundaries

Answer “Does anything need me right now?” with a deterministic read-only projection of
current authoritative records and links to existing owner controls. An item requires an
unresolved current condition plus a supported owner decision, recovery or inspection path.
Decision 026 applies. No Prompt 12, migration, dismissal, new authority, external effects,
model execution, new device scope or Client API v1 extension.

## Preflight and architecture

Fetched origin before editing: main remains `ce99212c882327ad8e04fd3603867ac18428e1a4`.
Clean main and separate writer worktree verified. Production health and source match this
baseline; runtime ready. Existing worktrees are untouched.

Use `GET /api/attention` under the existing local browser Host/Origin boundary. A dedicated
trusted projection reads tables directly: existing snapshot/approval/device inspectors can
expire approvals or perform cleanup and therefore cannot establish zero-write semantics.
The projection returns bounded metadata, static descriptive labels, typed source/destination
identities and timestamps; no free-text objectives, errors, private bodies, paths, envelopes,
credentials, screenshots or provider payloads. Existing inspectors retain full evidence.

## Implementation, source rules and privacy

The [validation record](../validation/PERSONAL_OPERATOR_STABILIZATION_03.md) records the complete
source inventory, exact inclusion/exclusion rules, source precedence, ordering and privacy.
Implementation: `src/control/attention.ts`, local-owner route in `src/http/server.ts`, nav/
refresh/list in `public/app.js` and `index.html`, compact `styles.css`, existing Computer and
mandate exact-record selection. No migration, dependency, v1 or authority changes.
Tests: `attention-helpers.ts`, `attention.test.ts`, `attention-http.test.ts`,
`attention-ui.browser.mjs`. Existing startup tests remain intact.

## Evidence and review

Completed: source inventory; production retained Task investigation; read projection and
UI; 52/52 final focused checks, 287/287 affected-domain checks, 45/45 browser checks and
TypeScript check/build. See validation record for exact scope and fixture qualifications.
Read-only architecture/security/test specialists identified and verified fixes for session
ownership, domain deduplication, Computer/occurrence expiry and stale count generation.
No material architecture/security findings remain. Test review's host/production gates remain.

Production baseline is ready, unpaused and quiescent. The retained blocked infrastructure
Task is genuinely unresolved (target enabled but unprovisioned, expired operation, no later
resolution): expect one item. Its historic expired approval is excluded. Preserve it unchanged.

## Remaining delivery gates

1. Exact Ubuntu static/domain/browser validation in an isolated checkout.
2. Review/merge PR, validate exact merged revision, protected consistent backup/deployment.
3. Confirm original history, receipt/home/identity/permission/pause preservation, loopback and health.
4. Real private tunnel desktop/narrow/hard-reload/source/back/reconnect, no writes; 30-second idle.
5. Commit factual completion evidence; exact local/origin/deployed delivery identity.

Next Daily Driver candidate is status/recovery wording and common operator-flow simplification.
No Prompt 12 or wider stale-document sweep.
