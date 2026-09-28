# Demo 01 dogfood findings

## BLOCKING

**Live updates interrupted approval inspection.** Run 03 stopped with a detached
Approve control while opening its exact parameters. The browser rebuilt the entire
view on every state notification, even when the displayed approval did not change.
Expanded details also collapsed during updates. Fixed in `1f177f0`: avoid replacing
unchanged views and preserve exact-scope disclosures by approval ID. A real-browser
regression failed on the old UI and passed with the fix. No approval or validation
policy changed.

## IMPORTANT

**Project setup requires editing policy JSON.** Named recipes are supported and the UI
explains their limits, but a nontechnical operator must understand explicit file paths,
stages and policy structure before assigning work. The tutorial shows this honestly.
A future structured recipe form would reduce setup friction. Not changed in Demo 01.

## MINOR

**Archived Projects remain in the same selector as active Projects.** Retained failed
attempts visibly accumulate. The operator selects the fresh Project explicitly; history
is never deleted for presentation. A supported archive filter would help.

**Worker readiness can require a separate Infrastructure action.** Reusing a logical
worker whose earlier identity request was cancelled requires asking Nix again. The
driver does this through the visible control only after the current Project assigns
that worker. It does not edit bindings or replace Codex threads.

## POLISH

**Long task and evidence views require scrolling.** Full IDs, detailed receipts and
raw structured evidence are valuable, but an overview of the final result would be
easier to demonstrate than scrolling through JSON. No cosmetic redesign was added.

## Operator defects found before final acceptance

- Run 01: the driver incorrectly expected `project_id` on a task-scope row. The real
  relationship is task → repository → Project. Fixed and regression-tested.
- Run 02: a retained cancelled infrastructure task was selected instead of the newly
  requested one. The exact-approval check rejected it and stopped. Selection now binds
  the new task ID; UI mutations wait for their real HTTP response before assertions.
- Run 03: exposed the product approval-inspection blocker described above.

- Run 04: Nix's normal identity request preceded Turing's engineering assignment.
  The driver originally required assignment first and stopped without approval.
  It now accepts only an identity request backed by the current Project's actual
  hiring execution and trusted hiring records, with an unrelated-hire regression.

The fourth attempt also exposed a real specification mismatch: Maya proposed a different
input/output shape. Atlas identified the discrepancy and instructed Turing to preserve
the user's acceptance contract. This was an autonomous organization event, not an
injected defect or a fake review revision. Its failed-run evidence is retained; the
accepted tutorial reports only its own run.

- Run 05: the workflow completed and passed 23 product tests, but the operator's
  final assertion used the legacy repository specification field. Generalized Projects
  bind specifications through task ancestry. The check now requires the current
  Project's completed product-manager task, artifact and recorded execution. A regression
  rejects artifacts from unrelated Projects and missing execution evidence. Run 05
  remains a failed operator attempt and was archived through the UI before a fresh run.

All failed recordings and events remain in the private artifact area. They are not
published as successful tutorial footage.
