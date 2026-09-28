# Demo 01 validation and boundary review

The recorded acceptance uses the real existing Ubuntu development HQ. Development
fixtures and historical Prompt 05 tests are distinguished from that real-model run.

## Deterministic and browser checks

- Complete local suite: **120 passed, one Linux-only skip, zero failures** (121 total).
- Operator-specific deterministic cases: **13/13** (included above): strict scenario
  ordering and identity, fail-stop execution, bounded paths including symlink escape,
  screenshot association, structured/serialized secret redaction, failed-run publication
  rejection, loopback-only origin, unexpected approval rejection, scoped objective and
  specification provenance, pre-assignment hire provenance, canonical integration gate,
  and no production database/private mutation/shell shortcuts.
- Separate real Chrome regression: **1/1**. Approval details stay expanded during
  genuine live-state updates; unchanged approval controls remain attached. This failed
  before the product fix and passes afterward.
- The first attempt to run the full suite inside the outer workstation sandbox could
  not start nested sandbox and loopback fixtures. It was rerun with the required local
  test permissions; no test or product confinement was disabled.

- Hardened Ubuntu service-restriction suite: **121/121**, no failures/skips,
  **90.162 seconds**, exit code 0. Exact tested source:
  `25cc544b9700f5a06f03451485b158a2b8b1518a`.
  Retained host evidence: `/var/lib/botsquad/validation/deterministic-20260928T103720Z`.
- Ubuntu provisioner suite: **9/9** via `python3 test/provisioner_test.py`.
- Real StudyPlan full recipe: **24/24** under the unchanged authenticated completion
  boundary, with independent first-round approval and a real canonical Git advance.

## Security-focused review

The only product runtime change is `public/app.js` preserving expanded approval details
and avoiding replacement of unchanged views. Immutable approval envelopes, server-side
preconditions, authentication, CSRF/origin checks, Nix, provisioner and permissions are
unchanged. The operator rechecks exact scope immediately before clicking Approve.

The browser uses an ephemeral Chrome context, blocks other origins, disables downloads
and closes popups. It accepts only the private loopback HQ URL. Verification endpoints
are read-only and bounded; consequential actions use normal UI controls. Worker text
cannot select arbitrary browser actions. Only Project-bound identity creation and clone
preparation are eligible approvals; publication or unrelated operations stop execution.

There are no changes under `src/` or `deploy/` relative to the audited baseline. In
particular, the trusted validation reporter, authenticated invocation receipt, recipe
confinement, canonical Git integration and root provisioner protocol are untouched.
The existing forged, missing, early-exit and incomplete-validation regressions remain
part of the full suite. A worker's TAP-looking output is never accepted by this operator
as an independent validation verdict.

Root SSH was explicitly authorized for protected backup, deployment and read-only host
checks. It is outside the Demo Operator. All demo actions, including failed-attempt
cleanup, occur through the UI. No credentials were read or published. Generated StudyPlan
Git remains local with no remote; source delivery to the existing BotSquad GitHub repo
is a separate authorized operation. Authenticated generated-Project push remains
unvalidated and was not needed.

## Preservation and final deployment

The protected pre-run backup is `/var/backups/botsquad/demo01-20260928T0955Z/state.tar.gz`
on the existing HQ, root-only, 14,085,894 bytes. Its SHA-256 is
`6a49d74ca51f7ffb724aaedc2f07425e8d22eeda26d40e249f385bd2cb94c0c8`.
The final host preservation report records comparisons with that pre-run baseline.

The [preservation report](host-preservation.json), captured after the successful run
and before source delivery, confirms all 20 retained validation databases, 245 original
root records, 78 existing account mappings and 40 original main-company rows. Only the
existing worker `updated_at` refresh is excluded from original-row comparison. SQLite
integrity and foreign keys pass. The actual canonical branch matches the integrated
SHA, is clean, and both private worker clones have matching ownership and no remotes.

The final source delivery changes documentation only after the tested source above.
Final merged/deployed SHA equality and repeated preservation checks are recorded in
the task handoff. Application deployment preserves the existing systemd, AppArmor,
provisioner and service-account credential configuration.
