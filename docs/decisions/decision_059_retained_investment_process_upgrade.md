# Decision 059 — retained investment process upgrade

Date: 2026-10-17. Status: accepted for source implementation; operational release is separate.

## Context

The retained paper book has three independently acknowledged, settled attempts with
incomplete usage: completed, awaiting approval and failed. Decisions 052–055 and the
Decision 058 bounded legacy successor preserve them. Ordinary Save/approval correctly
rejects incomplete predecessors, and legacy renewal cannot enlarge its paper tools.
INV-114 requests a reviewed transition on that same portfolio, not a new book or an
erasure of incomplete history. October 19–21 operations must remain untouched.

## Decision

Add explicit `retained_process_upgrade_v1` and `retained_process_renewal_v1` renewal
variants. The first is consumed once per retained run by an independent
`approve_process_upgrade` journal event, atomically with predecessor retirement and
attestation. Subsequent `approve_process_renewal` events retain that upgrade identity
and the exact three original exceptions. Existing schema 32 tables store immutable
previews/scopes/receipts; no schema migration or startup initializer grants authority.

Require the latest independently approved predecessor to be expired or explicitly
retired, all other predecessors retired, and all provider/source effects settled.
Local loops must be finished/stopped/blocked with no running or future pending work.
The book must be paused with no pending orders. Preparation never stops an active
predecessor, including the existing October 19–21 scope.
Same-book publication must have no in-flight/uncertain jobs, receipt obligations or
leases before its new hold is installed. Preview and transactional Save recheck this;
unrelated books and queued never-sent jobs do not prevent setup.

Freeze canonical HQ/root/run, unchanged book configuration/risk/calendar/source rights,
employee roles and model profile; exact predecessor envelopes, reservation baseline,
all local usage hashes, original exception hashes, collection baseline, current
custody checkpoint and portfolio head; complete process policy and request hashes;
future occurrences, selected finite allowances and owner receipt. Fresh dual account
and routing verification is required immediately before independent approval. The
existing authentic reload-OFF attestation remains subject to its current validity.

The only tool expansion is the legacy five paper tools to the exact eight
`investment-process-v1` tools. Ordinary and legacy approvals cannot perform it.
Process scopes cannot inherit the legacy invalid-OHLC omission or model/source
continuations. New unknown outcomes or incomplete receipts block further work. Known
settled failed/interrupted attempts with complete usage can use explicit owner resume
or standing idle-restart recovery; their reservations remain spent.

## Owner lifecycle and recovery

1. Draft policy in HQ. Objective, evaluation dates, primary URLs and numeric model
   limits remain owner choices; 120-day history and a three-session threshold are
   proposals. Messages confer no permissions.
2. Explicit Preview/Save creates an inert scope and the whole-book publication hold.
   Save binds private source consent, but grants no independent runtime authority.
3. Explicit independent approval records the exact recoverable request before external
   verification. Its committed envelope is authoritative even if local finalization
   fails. An exact retry can finalize locally while held/expired without another grant
   or account check; it does not clear a later hold. HQ reload reuses the saved request.
4. Separate activation verifies the exact local finalization receipt, current authority,
   unchanged paused book/draft and future windows. It atomically starts book and loop.

A preapproval custody change leaves the old draft inert. The owner must explicitly
stop that unapproved draft and prepare a new one from the latest independent
predecessor. Earlier drafts/receipts remain archived. Approval, not preparation,
consumes the one-use transition. A finite-journal commit without matching custody
stays blocked for separate offline inspection; no automatic repair is added.

Raw rolling consumption is never subtracted. Legacy allowances cannot transfer to a
process scope. A process renewal requires a fresh explicit finite allowance and unspent
request identities, while retaining all previous consumption and missingness.

A source-failure recovery also preserves an untouched scheduled discussion as draft
only when it already has zero turns and no scope executions. Its loop/book still
block/pause; touched groups still pause. This repairs the prior empty-group recovery
mismatch without authorizing dispatch or widening legacy continuation eligibility.

## Operational limits

US$0 incremental market-data cost, existing risk and simulated costs, private-data
boundaries, process-book publication hold and Ask pause remain in force. Performance
targets remain aspirational; HOLD and research-blocked outcomes remain legitimate.
No source change deploys, selects a runtime, renews authority or schedules October 22.
See the [guarded plan](../operations/INV114_RETAINED_PROCESS_DEPLOYMENT.md) and
[validation](../validation/investment/INV114_RETAINED_PROCESS.md) for separate facts.
