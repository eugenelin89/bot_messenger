# October 15 review pause repair

## Genuine incident

The rolling admission correction worked: the retained October 15 research occurrence
started once at 12:01:15 UTC (05:01 Vancouver). Atlas committed the genuine HOLD
proposal. No review or submission committed.
Maya's review execution failed on
`Paper review rejected: review_mismatch` at 12:03:44 UTC.

The private incident receipt records the actual state; production identifiers and
raw diagnostic logs are retained locally outside this public repository. There was no runtime approval request. The old adapter nevertheless
reported `awaiting_approval` because it used its approval-denial flag for every
bounded tool callback exception. The interruption correctly held further work,
but the displayed cause was wrong.

## Root cause and correction

The paper facade sampled `reviewedAt` before validation. The simulator sampled
`recordedAt` later. The reducer requires exact equality. A frozen fixture clock
hid this production defect. An advancing-clock regression first reproduced the
same `review_mismatch` failure.

The facade now captures one trusted timestamp after review validation and uses it
for the review, journal and review row. Scope and occurrence admission still use
the live clock; no worker-supplied timestamp or relaxed reducer check is added.
The adapter now reports rejected bounded callbacks as failed with their actual
reason, while retaining interruption, provider settlement and incomplete-usage
fences. Actual approval requests remain denied and separately labelled.

## Validation and review

- Advancing-clock reproduction failed before the fix and passes after it.
- Tests cover matching persisted timestamps, immutable duplicate-call replay,
  rejection of raw mismatched timestamps, and crossing cutoff during admission.
- Finite adapter tests distinguish tool failure from actual approval denial;
  both interrupt once, retain consumed allowance and block further dispatch.
- Independent recovery and security reviews found no authority bypass. Their
  requested replay/cutoff tests are included. Full test results follow below.
- These are authored tests, not additional genuine model calls.

Build and canonical contract checks pass. The initial broad run had 198 passes,
four failures and four intentional skips. Two failures were sandbox loopback
`EPERM`; both HTTP tests pass with loopback permission. The new replay assertion
needed JSON normalization for SQLite's null-prototype row; all 49 team/loop
boundary tests then pass. One pre-existing financial publication-health test fails
identically on the unchanged audit checkout, so no all-green full-suite claim is
made. Raw logs are retained locally alongside the private incident receipt.

## Operational recovery boundary

Production has consumed 10 of 11 family calls. One remains, while independent
review plus submission requires at least two. The October 15 13:00 UTC decision
cutoff has elapsed; current authority expires at 23:40 UTC (16:40 Vancouver).
The new failed Maya invocation remains settled but incomplete. Decision 052
permits only the original October 14 usage gap, and explicitly blocks any new
incomplete outcome. The source fix cannot authorize replay or clear this hold.

No historical execution, usage completeness, reservation, portfolio amount,
proposal or cutoff may be rewritten. No synthetic review or retroactive HOLD
submission substitutes for the missing genuine chain. A new prospective recovery
needs an owner-selected finite budget and schedule and a reviewed policy that
preserves both exceptions and all ten spent calls. A resume click or the old
one-use successor mechanism is insufficient. Ask remains owner-paused.

## Delivery

Source validation and controlled deployment are in progress. The live loop remains
blocked; do not describe this code correction as resumed investment operation.
