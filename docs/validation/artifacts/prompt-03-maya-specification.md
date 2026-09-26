# SquadStatus product specification

## Product goal
Deliver a small, dependency-free Node ESM product that summarizes an array of worker statuses and renders the summary as deterministic human-readable text. This specification governs the trusted local SquadStatus repository; it does not authorize changes to BotSquad itself.

## Behavior and data contract
- `calculateStatusSummary(workers)` is exported from `src/calculate.mjs`. Its input must be an array of worker objects. Each worker has a `status` exactly equal to one of the strings `working`, `idle`, `blocked`, or `failed`; `name` is optional and does not affect counting. Reject invalid input or status with `TypeError`.
- Return an object with exactly the count fields `{total,working,idle,blocked,failed}`, where `total` is the array length and each status field counts matching workers. The empty array returns all five counts as zero. Do not mutate the input array or worker objects.
- `formatStatusSummary(summary)` is exported from `src/format.mjs`. It accepts an object with all five fields `total`, `working`, `idle`, `blocked`, `failed`. Every count must be a nonnegative safe integer, and `total` must equal the sum of the four status counts. Invalid, missing, or inconsistent counts throw `TypeError`.
- The formatter returns exactly `Total: N\nWorking: N\nIdle: N\nBlocked: N\nFailed: N`, substituting the five decimal counts in that order. There is no trailing newline.

## Module boundaries and ownership
- Linus owns only `src/calculate.mjs` and may add `test/calculate.extra.test.mjs`. Implement the calculator with ordinary dependency-free JavaScript, including validation, exact counting, no mutation, and empty-input behavior.
- Ada owns only `src/format.mjs` and may add `test/format.extra.test.mjs`. Implement validation and exact five-line rendering with ordinary dependency-free JavaScript.
- The trusted scaffold owns composition/CLI, immutable acceptance tests, repository setup, allocation, commits, and integration. Neither engineer edits those files or accesses another allocation. No runtime dependencies, host-service imports, or external access are needed.

## Individual acceptance
Each engineer must make a real change to the assigned module, add a useful edge-case test if warranted in the optional owned extra-test file, run the focused tests, inspect owned Git evidence, and submit a verified clean commit. Linus's focused tests must establish valid/invalid workers, exact counts, empty input, and no mutation. Ada's focused tests must establish complete safe counts, sum consistency, exact output/newline behavior, and `TypeError` for invalid summaries. A submission is evidence of that engineer's focused validation, not of integrated acceptance.

## Integrated acceptance
After both exact commits receive an approved independent review, trusted integration must combine them on a retained candidate, run the full immutable and optional extra tests, and check the trusted composition/CLI deterministic output. All tests must pass and the default product branch must advance only through the trusted successful integration. A failed review, conflict, invalid output, or failing test is not acceptance and must be reported without claiming delivery.

## Grace review expectations
Grace independently reads the specification, immutable tests, submitted diffs and focused-test evidence in the read-only review packet. The review must bind to the exact Linus and Ada source commits, assess contract alignment, validation coverage and `TypeError` behavior, module scope, edge cases, and integration risks. Grace must provide substantive findings in every review field and select `changes_required` for material defects or `approved` with stated residual risks. Grace must not claim integrated tests ran before integration or alter source.