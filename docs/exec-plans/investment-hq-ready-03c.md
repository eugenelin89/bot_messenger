# Execution Plan — HQ-READY-03C transport diagnosis

**Status:** Source/offline acceptance complete; Git integration tracked separately
**Owner:** Parent Codex, sole writer/integration owner; independent read-only specialists
**Branch:** `codex/hq-ready-03c-transport-diagnostics`
**Worktree:** `../bot_messenger-hq-ready-03c`
**Started:** 2026-10-11 America/Vancouver
**Initial ETA:** 2–3 hours including offline validation, review and Git integration
**Current ETA:** Final Git integration, approximately5–10 minutes

## Objective and scope

Diagnose the first Yahoo connection failure from retained non-data evidence, repair supported
source defects, preserve privacy-safe connection stages and test failures offline. Prepare a
separate minimal connectivity proposal; integrate accepted source through a reviewed PR.
No Yahoo request, external DNS probe, employee inference, production/deployment, financial
collection, spending, public publication or new authority is authorized.

## Relevant requirements

Read `AGENTS.md`, README, product vision, architecture, decision index/Decisions029/032/038/039,
investment DECISIONS/ROADMAP, SIMULATION_RULES section7, HQ-READY-03/03B acceptance and the
Yahoo gateway runbook. Decision037 remains permanently exhausted4/4. The prior approval,
spent marker, accounting and cleanup receipts must remain byte-identical; never reset/reuse.

## Invariants and risks

- DNS and every wire attempt remain behind consumed one-shot custody and durable reservations.
- Public-address pinning, strict TLS/SNI, hosts/parameters/cookies/redirect policy remain intact.
- Diagnostics contain fixed enums/timestamps only, never raw exceptions, addresses or secrets.
- Unknown transmission or settlement consumes allowance and cannot be replayed/refunded.
- Parent is sole writer; specialists inspect fixed source read-only. Heavy tests run serially.
- No schema, runtime/employee boundary or approved probe manifest change is planned.

## Implementation and validation

1. Verify synchronized clean main and isolate worktree. **Done:** local/remote
   `bd7a0b62300323503e522d9f283b28894a17f517` verified by successful GitHub fetch.
2. Inspect retained receipts/source/logs; reproduce suspected local callback mismatch offline.
3. Implement bounded stage diagnostics, closed error classification and supported repairs.
4. Test DNS, validation, TCP, TLS, request write/reset, response, timeout, cancellation,
   receipt failure, crash/no-replay and late callbacks with authored/injected behavior.
5. Run focused gateway/transport/custody/recovery/Python/protocol tests, typecheck, contracts
   and relevant serial regressions. No Level3 employee or Yahoo live acceptance is authorized.
6. Obtain independent security/recovery/acceptance reviews; resolve concrete findings.
7. Record evidence/proposal, commit, open PR, verify reviews/mergeability, merge and sync main.

## Evidence and decisions during execution

- Read-only receipt inspection: one reservation, wire intent, no HTTP status/body, terminal
  unknown; capsule absent and cleanup/key destruction recorded. Private receipt hashes
  captured locally for final equality checks; original files untouched.
- Source orders completed DNS/public validation before wire intent. Failure followed intent
  by14ms. Old receipts cannot distinguish socket construction/TCP/TLS/write failure.
- Node24.10.0 offline reproduction with `fixture.invalid` and injected loopback lookup:
  client requested `all:true`; old scalar callback produced `ERR_INVALID_IP_ADDRESS` before
  a connection. This is a supported source defect and leading hypothesis, not retrospective
  proof of the discarded original error.
- Sandboxed GitHub fetch failed DNS; authorized host fetch succeeded. This is current local
  environment evidence only, not a Yahoo connectivity test or proof of original sandbox cause.

## Documentation freshness and remaining work

Update diagnostic acceptance and the gateway runbook with an unexecuted, unapproved second
probe proposal. Add current roadmap links only where status changes. Preserve historical
acceptance/decisions and source-selection permission provenance. Implementation, validation and reviews are complete; only Git integration remains.

## Validation/review checkpoint

Source repair and offline tests complete. Final source/test manifest SHA256
`4e9c5b1833f201d38600f119e419bd6e2c5cd121bfbbe6408c7e6246d0430dde` covers eight files.
Independent security, recovery and acceptance reviewers verified every entry and the separate
unexecuted connectivity proposal; no source blockers remain. Review fixes: freeze late callbacks,
correct asynchronous fsync fault placement, classify encrypted header-receipt failure as settlement
uncertainty, clarify that fixture capabilities are not live owner authority.

| Check | Result |
| --- | --- |
| Real local Node pin regression and TLS trust |3/3 pass; no external DNS/socket |
| Focused gateway/custody/recovery/protocol/Python/transport |154/154 pass before final header-settlement delta |
| Final diagnostics including that delta |38/38 pass |
| Final typecheck/build/contracts generation |Pass |
| Original authority integrity |Five files byte-identical; capsule absent; noResume true |
| Source manifest/whitespace/privacy/local docs links |Pass;122 existing/new local file links checked |
| Full serial regression |1,409 tests;1,403 pass,0 fail,6 existing skips;525.281s |

**Revised ETA:** 15–25 minutes after the review checkpoint, contingent on full-suite and remote
integration gates. The initial estimate was conservative; the local callback reproduction made
source diagnosis faster. Only evidence-table completion, final acceptance, commit/PR/review-status/
mergeability and synchronized-main integration remain. No live test will follow integration.


Full validation passed. Final source acceptance is complete, with original authority preserved
and no live test executed. Parent is proceeding to the explicitly authorized commit/PR/merge
steps; integration identity and final synchronized main will be returned in the handoff.

## Completion handoff

Source acceptance commit `60caf32cbac330e2e3a4951be73b8cd839b06bc0` is submitted through
[PR61](https://github.com/eugenelin89/bot_messenger/pull/61). This link tracks merge state and
identity without a self-referential commit hash. Parent verifies remote reviews/status checks,
mergeability, synchronized main and rebuilt source/build manifests; final chat reports actual
main SHA. No production deployment or second Yahoo test follows. The separately unapproved
proposal is `docs/operations/YAHOO_CONNECTIVITY_PROPOSAL.md`.
