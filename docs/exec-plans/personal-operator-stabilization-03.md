# Personal Operator stabilization 03 — owner attention

**Status:** Complete and deployed
**Owner:** Parent Codex task, sole writer/integrator/deployer
**Branch:** `codex/personal-operator-stabilization-03`
**Worktree:** `bot_messenger-personal03`
**Started:** 2026-10-06
**Initial ETA:** 2–3 hours, including review, exact Ubuntu validation and deployment.
**Outcome:** Completed within the initial estimate; exact delivery identity is in the final handoff and protected receipt.

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
`attention-ui.browser.mjs`. Startup assertions and dedicated cancellation coverage remain intact; held boot now completes before fixture session renewal.

## Evidence and review

The [validation record](../validation/PERSONAL_OPERATOR_STABILIZATION_03.md) owns exact rules,
commands/scopes, reviewed findings, retained initial failures and final evidence.
Local: 52/52 focused, 287/287 affected domains, 45/45 broad browser, 34/34 post-review browser,
22/22 final startup and 2/2 explicit coordinator-order checks. Exact merge Ubuntu:
**292/292 domain + 34/34 browser**, check/build pass. No skips or live-agent reruns.

Read-only architecture/security/test specialists closed their reviews. Fixed session-owner
and group/mandate/research duplicates, delivery integration linkage, expired Computer and
blocked-occurrence omissions, cached-count generation, business lifecycle filters, and
unsupported Computer retry presentation. Ubuntu found two fixture assumptions: roster
ordering and boot/session-renewal sequencing. Explicit coordinator priority and sequential
boot assertion preserve coverage; dedicated pre-release cancellation remains unchanged.
The original failure logs remain; precise original release/abort timing mechanism is unproven.

PR #23 merged as `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5` and was deployed after exact Ubuntu
validation. Concurrent separate PR #24 design docs were preserved; this task added neither
that Decision 027 nor any investment runtime or Prompt 12. The completion follow-up is docs
and sanitized evidence only; final exact delivery identity belongs to its protected receipt
and final handoff, with the identical accepted application tree.

## Production acceptance

Production Attention is **1 blocked item**: Nix's retained identity-coordination Task for an
enabled unprovisioned worker. Its expired approval is historical; the desired binding is
still unsatisfied. The exact existing Task inspection/cancel path is usable; no generic retry
can grant authority. The legitimate item was preserved unchanged.

Protected consistent backup; independent exact build (259 files); 59,909 original rows across
82 databases, 212 homes, 702 root records and 427 account/group mappings preserved. Only
workers.updated_at is excluded by the established comparator. Pause=false, healthy runtime,
loopback-only listener, revoked/retired provider authority and prior evidence all preserved.

Real desktop/narrow private tunnel hard reloads, immediate Attention loading, exact source
inspection/back and two native reconnects passed with zero page errors or mutation requests.
Both post-restart and post-UI 30-second idle samples added no work. Full preservation repeated
after UI. No production fixtures or authority were created.

## Remaining work and next candidate

No product/acceptance work remains. Final documentation delivery repeats protected deployment
and read-only checks of its unchanged application; exact local/origin/deployed SHA is recorded
in the handoff. Next Daily Driver candidate: status/recovery wording and common operator-flow
simplification, driven by actual use. No Prompt 12 or wider stale-document sweep.
