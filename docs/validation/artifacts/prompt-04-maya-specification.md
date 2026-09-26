# SquadStatus product specification

## Goal
Deliver a small, dependency-free Node ESM product that summarizes a team's worker statuses deterministically and presents the summary as exact human-readable text. This specification governs two source modules; trusted composition/CLI and immutable acceptance tests are already supplied.

## Behavior and data contract
- `calculateStatusSummary(workers)` is exported from `src/calculate.mjs`. `workers` must be an array of worker objects. Each worker has a `status` exactly equal to one of the case-sensitive strings `working`, `idle`, `blocked`, or `failed`; `name` is optional and does not affect counting. Return a fresh summary object with keys `total`, `working`, `idle`, `blocked`, `failed`, where total is the array length and each category count matches its occurrences. For an empty array, all five counts are zero. Do not mutate the input array or its worker objects. Invalid input or status throws `TypeError`.
- `formatStatusSummary(summary)` is exported from `src/format.mjs`. Require an object containing all five counts as nonnegative safe integers, with `total === working + idle + blocked + failed`. Missing, invalid, or inconsistent counts throw `TypeError`. Return exactly five lines in this order, with decimal counts and no trailing newline: `Total: N\nWorking: N\nIdle: N\nBlocked: N\nFailed: N`.
- Use ordinary dependency-free JavaScript suitable for Node ESM. Do not import host services or add runtime dependencies.

## Boundaries and ownership
Linus owns only `src/calculate.mjs` and may add `test/calculate.extra.test.mjs`. Ada owns only `src/format.mjs` and may add `test/format.extra.test.mjs`. Neither changes the other's module, trusted composition/CLI, immutable tests, or Git metadata. The independent modules are joined only by the trusted composition layer.

## Acceptance
- Linus: focused immutable calculate tests pass; valid mixed and empty inputs produce exact counts; invalid inputs/statuses raise `TypeError`; inputs remain unchanged. Add a useful edge-case test if appropriate.
- Ada: focused immutable format tests pass; exact output including line order, capitalization, spacing, and lack of final newline; reject missing, non-safe/non-integer/negative, and inconsistent counts with `TypeError`. Add a useful edge-case test if appropriate.
- Each engineer runs focused validation, inspects their own Git change, and submits a verified real source commit. The full integrated suite must pass after the two exact submitted commits are combined; trusted CLI composition/output must also pass. A focused pass alone does not establish integration success.

## Independent review and release gate
Grace reads the actual spec, immutable tests, exact submitted diffs and focused validation evidence. Review must bind to both exact source commits, assess behavior and data-contract compliance, test sufficiency, unintended changes, and integration risk. State substantive findings and any residual risk; require changes if defects exist. Approval is not an integration result. Turing may request trusted integration only after an approved review; release requires a successful integration receipt with full test and deterministic CLI evidence. Report failures or limitations honestly without claiming unrun tests passed.