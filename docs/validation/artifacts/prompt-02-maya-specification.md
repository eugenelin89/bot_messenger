# SquadStatus Product Specification

## Product Goal
SquadStatus is a dependency-free Node ESM validation product that summarizes worker statuses and formats the resulting summary for display. The product is intentionally small, deterministic, and testable through trusted immutable tests plus optional focused edge-case tests.

## Expected Behavior

### `calculateStatusSummary(workers)`
Location: `src/calculate.mjs`

Given an array of worker objects, return a new summary object with exactly these count fields:

```js
{ total, working, idle, blocked, failed }
```

Behavior requirements:
- Count every worker in `total`.
- Count statuses exactly matching one of: `working`, `idle`, `blocked`, `failed`.
- Return zeros for an empty array:
  ```js
  { total: 0, working: 0, idle: 0, blocked: 0, failed: 0 }
  ```
- Do not mutate the input array or worker objects.
- Throw `TypeError` for invalid input or invalid status.

### `formatStatusSummary(summary)`
Location: `src/format.mjs`

Given a valid summary object, return exactly this five-line string, with no trailing newline:

```text
Total: N
Working: N
Idle: N
Blocked: N
Failed: N
```

Behavior requirements:
- Preserve this exact label order and capitalization.
- Use the provided numeric values.
- Do not append a trailing newline.
- Throw `TypeError` for invalid, missing, unsafe, negative, or inconsistent counts.

## Data Contract and Validation Rules

### Worker Input Contract
- Input to `calculateStatusSummary` must be an array.
- Each array item must be a worker object.
- Each worker must have a `status` property exactly equal to one of:
  - `working`
  - `idle`
  - `blocked`
  - `failed`
- `name` is optional and has no effect on the summary.
- Any non-array input, non-object worker item, missing status, or status outside the allowed exact strings must throw `TypeError`.

### Summary Object Contract
`formatStatusSummary` accepts an object with five required count fields:
- `total`
- `working`
- `idle`
- `blocked`
- `failed`

Each count must be:
- present,
- a number,
- a nonnegative safe integer.

Consistency rule:
- `total` must equal `working + idle + blocked + failed`.

Any missing, invalid, negative, unsafe, non-integer, or inconsistent count must throw `TypeError`.

## Module Boundaries

### `src/calculate.mjs`
- Owns validation of worker-array input.
- Owns counting logic.
- Exports `calculateStatusSummary(workers)`.
- Must not depend on `src/format.mjs`.
- Must not use third-party dependencies.

### `src/format.mjs`
- Owns validation of summary-object input.
- Owns rendering the exact output string.
- Exports `formatStatusSummary(summary)`.
- Must not depend on `src/calculate.mjs`.
- Must not use third-party dependencies.

### Trusted Composition / CLI
- Composition and CLI behavior are trusted and already defined outside the module work.
- Engineers should not change unrelated composition or CLI code unless explicitly required by the provided harness.

## Implementation Responsibilities

### Linus — Calculate Module
Linus owns `src/calculate.mjs` only.
Responsibilities:
- Implement `calculateStatusSummary(workers)`.
- Ensure valid worker arrays produce correct counts.
- Ensure empty arrays return all-zero counts.
- Ensure invalid input/status throws `TypeError`.
- Preserve input immutability.
- Add an optional useful edge-case test at `test/calculate.extra.test.mjs` if desired.
- Run focused and full repository tests before submission.

### Ada — Format Module
Ada owns `src/format.mjs` only.
Responsibilities:
- Implement `formatStatusSummary(summary)`.
- Ensure valid summaries render the exact required five-line string.
- Ensure there is no trailing newline.
- Ensure invalid, missing, unsafe, negative, non-integer, or inconsistent counts throw `TypeError`.
- Add an optional useful edge-case test at `test/format.extra.test.mjs` if desired.
- Run focused and full repository tests before submission.

## Individual Acceptance Criteria

### Linus Acceptance
- `calculateStatusSummary` returns `{total, working, idle, blocked, failed}` with correct counts.
- Empty array returns all zeros.
- Valid statuses are accepted only when exactly `working`, `idle`, `blocked`, or `failed`.
- Invalid input/status throws `TypeError`.
- Input array and worker objects are not mutated.
- Focused calculate tests pass.
- Full integrated tests pass after both modules are present.
- Linus submits a verified commit for the calculate implementation.

### Ada Acceptance
- `formatStatusSummary` returns exactly:
  `Total: N\nWorking: N\nIdle: N\nBlocked: N\nFailed: N`
- Output has no trailing newline.
- All five counts are required and must be nonnegative safe integers.
- `total` must equal the sum of the four status counts.
- Invalid/missing/inconsistent counts throw `TypeError`.
- Focused format tests pass.
- Full integrated tests pass after both modules are present.
- Ada submits a verified commit for the format implementation.

## Integrated Acceptance Criteria
- The product remains dependency-free Node ESM.
- Calculate and format modules work together through trusted composition/CLI.
- Both focused module tests and full integrated tests pass.
- Optional extra tests, if added, must pass and must not weaken or replace immutable tests.
- No source outside each engineer’s owned module and optional owned extra test should be changed without clear justification.

## Grace Review Expectations
Grace must independently review the exact submitted commits from Linus and Ada. The review must assess:
- Alignment with this specification and the engineering contract.
- Correct validation behavior and `TypeError` handling.
- Input immutability for calculate.
- Exact output formatting for format, including no trailing newline.
- Dependency-free Node ESM compliance.
- Test evidence from focused and full test runs.
- Integration risk between independently implemented modules.

Grace should approve only if the implementation satisfies the spec and the submitted evidence supports acceptance. If defects or material risks exist, Grace should request changes with substantive findings.