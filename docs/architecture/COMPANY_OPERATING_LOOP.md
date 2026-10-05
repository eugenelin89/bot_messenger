# Company operating loop and durable clock

Prompt 09 implementation; release acceptance is tracked in
[the execution plan](../exec-plans/prompt-09.md). A mandate is an owner-authorized outcome
pursued through bounded strategic cycles. It is distinct from a Task, direct conversation,
working group, runtime thread and schedule occurrence. Durable records are authoritative;
provider history is replaceable. See [Decision 022](../decisions/decision_022_company_operating_loop.md)
and [the operator tutorial](../operations/COMPANY_OPERATING_LOOP_TUTORIAL.md).

## Records and authority

`Mandates` owns mandates, initiatives, operating cycles, append-only decisions, admitted
observations, explicit internal-work links, schedules/versions and occurrences. Draft creation
is passive. Trusted owner activation opens the first cycle. The owner supplies objective,
success/stop criteria, constraints, resources, coordinator and a typed immutable envelope.
Changing direction beyond that envelope requires a new owner-authored mandate; model prose,
role names, recommendations and schedule events cannot enlarge it.

Effective authority is the intersection of company policy, mandate envelope, worker
capabilities/reporting hierarchy, current standing grants, work scope and protected approvals.
Coordinator eligibility requires an enabled persistent worker with internal communication.
Task assignment additionally requires existing assignment capability and an eligible direct
report. Prompt 09 creates analysis/research Tasks for product-manager/researcher roles; a
Project or engineering recommendation remains an internal proposal. No repository operations,
protected approvals, publishing, outreach, payments or Computer Use are added.

A cycle has one current coordinator and a deadline. At most one active, waiting or blocked
cycle may exist per mandate. `active → waiting → active → closed` covers investigation,
delegation and review without inventing a state for every reasoning step. `blocked` retains
an unresolved outcome or exhausted allowance; `cancelled` records owner termination.
Decisions include disposition, rationale, alternatives, dissent/contrary evidence, unknowns,
source IDs, worker/execution provenance and previous-decision identity. Changed judgment
creates a new decision; it does not overwrite history.

## Bounded execution and continuity

Reviews use the existing conversation execution substrate with `task_id=null`, typed
`mandate_turns`, dedicated mandate/conversation ownership, and `mandate-review-v1` tools.
They cannot enter direct-chat or group methods. Shared dispatcher capacity remains two
employee executions, at most one per worker, with common execution/broker uncertainty fences.
A review completion cannot complete a Task, return a peer answer or finalize a working group.

The coordinator tools are `inspect_mandate`, `read_mandate_record`, `propose_initiative`,
`record_strategic_decision`, `convene_working_group`, `assign_internal_task`, `schedule_review`,
`wait_for_internal_work` and `complete_cycle`. Each execution permits at most 20 tool calls
and 48,000 cumulatively delivered record characters. Individual reads contain at most 6,000
characters. Replayed call IDs return their existing receipt; distinct repeated reads still
consume the cumulative allowance. Catalog visibility never establishes body delivery. Tool results travel as runtime content
envelopes containing JSON text. The worker contract requires inspecting displayed JSON before
a dependent page read; raw wrapper fields cannot drive an automatic pagination loop. Omitted
first-page offset means zero; explicit malformed offsets remain invalid.

Every settled strategic turn starts a fresh normal Prompt 07 provider generation. The
checkpoint reconstructs the mandate, current cycle, initiatives, decision previews, prior
cycle summaries, observations, work status, grants and schedules from bounded durable
records. Older originals remain retrievable through scoped reads. Prior provider tool outputs
are not copied into the replacement prompt or accepted as current evidence receipts. The
same employee, mandate, cycle and pending-work identity survive; previous session/provider
references remain inspectable. Normal prepare → persist reference → activate boundaries,
stale callback checks, consumed execution reservations and unknown-outcome fences apply.
A fresh context cannot repair an ambiguous provider invocation. Direct conversations and
working groups retain their existing continuity policy.

Internal Tasks use a private Task-scoped provider binding. Their strategy cannot enter a
later ordinary Task via worker-wide history. Compatible existing ordinary Task/research
bindings remain reusable. At creation, the coordinator explicitly selects already fully read
evidence records for a bounded 12,000-character export. The Task receives those bodies and
provenance, not arbitrary access to mandate history. Referencing an ID in Task prose does not
implicitly deliver its body. Private Task bindings cannot be adopted by other execution modes.

## Delegation and resource envelope

A typed coordinator operation creates a working group with the actual worker creator and
mandate provenance; it never impersonates an owner click. Selected observations are explicit
exports under Prompt 08 evidence-sharing rules. A group reserves its complete 24-execution
allowance from the cycle and cannot receive an owner extension that escapes that reservation.
Membership grants no research permission. Public research still needs the worker's applicable
WE-01 Task/discussion grant and work charter, as well as mandate permission and aggregate
cycle budget. Async research completion rechecks current authority before delivery.

A group does not create a Task. A separate coordinator operation must link the Task to an
existing decision in the current cycle and enforce hierarchy, role and pending-work limits.
`wait_for_internal_work` commits the review turn and releases its slot. Trusted completion
then queues one bounded continuation. The coordinator must inspect completed results before
closing the cycle. Task/group uncertainty remains visible and prevents unsafe completion.

| Bound | Default | Allowed owner range |
| --- | ---: | ---: |
| Reserved model executions per cycle | 40 | 2–80 |
| Internal Tasks per cycle | 3 | 0–6 |
| Groups per cycle | 1 | 0–2 |
| Research operations per cycle | 16 | 0–32 |
| Pending internal work | 2 | 1–4 |
| Cycle duration | 60 minutes | 1–120 minutes |
| Cycles per mandate | 4 | 1–12 |
| Minimum review interval | 60 seconds | 30–86,400 seconds |
| Schedule horizon | 7 days | 1–30 days |
| Occurrences per schedule | 4 | 1–12 |
| Active schedules | 1 | 1–3 |

Internal Tasks, groups and worker schedules default enabled; public research defaults disabled.
Defaults permit the five explicitly labelled evidence modes. The timezone defaults to
`America/Vancouver`. All values remain intersected with the worker's existing permissions.
Reservations are conservative: unused group turns do not create extra strategic authority.
Each continuation reserves another execution. Deadline enforcement includes linked Tasks.

## Evidence and withdrawal

Only trusted owner/application ingestion admits an observation. Its mode is one of
`real_read_only`, `public_source`, `owner_provided`, `sanitized_snapshot`, `simulated_fixture`.
The body retains source, provenance, observed time/period, separately recorded time, optional
value/unit, missingness and limitations. Classification is mandate-private. Missing observation
time remains missing; retrieval time is not substituted. Models cannot manufacture observations.

Decisions require complete same-execution delivery of each cited current original and either
substantive evidence or an explicit missing-evidence explanation. Hypotheses, prior decisions
and unexecuted Task metadata are context, not factual measurements. A Task result must be
backed by a completed execution. A final group synthesis remains an attributed interpretation
with its source/dissent limitations; it does not turn simulated data into real product results.

Withdrawal retains owner-readable originals and audit history. It changes coordinator scope,
replaces safely queued requests, denies stale callbacks and future delivery, and invalidates
explicit group exports. Because free-form derivatives may quote sources without recording
every dependency, all earlier derived strategy, Task results and group work in that mandate
are conservatively withheld from future workers. This may withhold unrelated older material.
Existing provider transmissions cannot be recalled; unknown provider fences are never cleared.
The owner can admit a newly authorized observation and inspect all retained historical records.

## Clock semantics

The clock runs in trusted application code, never model polling. An injectable clock supports
controlled tests; production uses actual time. The dispatcher wakes for the next due time,
retry, cycle deadline or queued schedule expiry. No schedule means no model work.

Schedules persist owner, creator, mandate/initiative, purpose, coordinator, IANA timezone,
recurrence, end/count limits, version, consumed count and next due instant. Supported recurrence
is one-time, fixed elapsed seconds or daily `HH:mm` in the mandate timezone. Spring-forward
nonexistent wall times resolve to the first valid minute after the gap. Fall-back repeated
minutes use the earlier instant. Fixed intervals are elapsed seconds across DST.

Occurrence identity is a stable hash of schedule ID, version and due instant. Materializing an
occurrence and consuming its due interval is atomic. Claiming it, opening its cycle and queuing
its typed request are atomic. Duplicate callbacks and restarts cannot duplicate a review.
The due path rechecks version, lifecycle, expiry, owner/coordinator eligibility, pauses,
worker/broker fences, overlap and cycle limits. The dispatcher checks again before execution.

Overlap uses **hold one** per schedule; missed times **coalesce** into one pending occurrence
with `through_at` and `missed_count`. Multiple missed intervals consume their count allowance;
restart cannot produce a burst of one model execution per missed tick. Historical completed
occurrences never change. Editing increments the version, preserves consumed counts and history,
and supersedes undispatched old-version work. Cancellation is terminal; create a new schedule
for a new authorization. A schedule already consumed but still pending remains pausable.

Known settled failures may receive at most two reserved continuations after 30 then 60 seconds.
They reconstruct durable effects and retain prior decisions. An ambiguous provider invocation
blocks with no automatic replay, even when a decision or close request had already committed.
Confirmed completed review output can be reconciled into one completed occurrence after restart.
Bounds, expiry and unknown outcomes remain visible to the owner for inspection.

## Owner controls, storage and deployment

Global and mandate pause hold new dispatch while retaining schedule history; already running
work follows existing interruption semantics. Schedule pause applies only before its review's
first execution; an already started cycle is controlled through the mandate. Stop/cancel deny
new cycles and internal actions, cancel safely queued work and retain records. Grant revocation
removes research authority without cancelling the mandate; existing authorized evidence may
still support a decision. Disabling a worker or an uncertainty fence prevents dispatch.

The trusted browser provides mandate creation, labelled observations, cycle/decision/history
inspection, activation, review-now, pause/resume/stop/cancel, schedule edits and schedule controls.
It retains Host/Origin/CSRF checks and escaped text/link validation. Client API v1 gains no new
strategy, observation, schedule, group-control or approval authority; private linked Tasks,
artifacts, messages, executions and event hints are excluded from its projections.

Schema 11 introduces the model and preserves working-group creator provenance. Additive schema
12 adds private Task sessions, selected evidence exports and cumulative read accounting.
Migration creates no domain mandate, observation, schedule, grant or model invocation and clears
no fence. Production delivery requires a protected consistent backup, repeated offline migration,
full retained-state comparison and exact source/build verification. Demonstrations belong only
in isolated validation data directories.

Prompt 10 owns bounded Computer Use. Prompt 11 owns approved real external action, receipts and
measured business outcomes. Prompt 09 simulated strategic acceptance proves neither live
marketing/product operation nor revenue improvement, outreach, publication or spending.
