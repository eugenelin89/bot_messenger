# Decision 022 — Bounded strategic mandates and durable company clock

Date: 2026-10-05  
Status: Implemented; full release acceptance pending  
Extends: Decisions 016–018, 020 and 021

## Context

Persistent employees, direct conversations, research and working groups can investigate a
question, but the owner still has to orchestrate each follow-up. A company mandate needs
bounded continuity across internal work and later evidence-based reviews. A timer or provider
thread cannot become permission to perform arbitrary business actions.

## Decision

Persist an owner-authored, explicitly activated mandate with immutable strategic envelope,
coordinator, success/stop criteria and labelled evidence policy. Separate initiatives,
bounded operating cycles, append-only attributable strategic decisions, trusted observations,
internal-work links and versioned review schedules. Keep one open cycle per mandate.

Use typed `mandate-review-v1` conversation turns within the existing two-slot dispatcher.
Keep SQL ownership distinct from direct replies, working groups and Tasks. Every settled
coordinator turn gets a fresh Prompt 07 generation assembled from scoped durable records;
worker identity, cycle, lineage, outstanding work, budgets and unknown fences remain durable.
Require current original-delivery receipts instead of trusting provider history or catalogs.

Expose only narrow strategic tools. Coordinator-created groups use explicit typed provenance
and Prompt 08 exports. Tasks are separately decision-linked, hierarchy/capability checked,
limited to internal analysis/research and given isolated Task provider contexts plus explicitly
selected source bodies. Research still requires WE-01 grants/charters and current async checks.
No strategic prose, group conclusion or schedule adds permissions.

Admit observations only through trusted owner/application logic. Preserve evidence mode,
source, observed period/time, recording time, missingness and limitations. Model interpretation
is not an observation. Decisions must cite fully delivered substantive evidence or explicitly
state missing evidence. Withdrawal preserves owner history while denying future worker delivery
of the source and conservatively all prior derivatives.

Implement a trusted durable clock for one-time, fixed-interval and daily IANA-zone reviews.
Use stable schedule/version/due occurrence identities, atomic occurrence consumption and atomic
cycle/request claim. Hold one overlapping review and coalesce missed intervals with explicit
counts. Edits retain versions/history/consumption; cancellation is terminal. Spring gaps use
the first valid minute, repeated fall minutes the earlier instant. Known failures have bounded
backoff; ambiguous provider outcomes retain fences and are never automatically replayed.

The owner can inspect, pause, stop, admit/withdraw evidence, review now and control schedules.
Browser mutations retain the trusted local boundary. Client API v1 gains no strategic authority
or private-strategy projections. Migrations create no live mandate, schedule, observation,
grant or model work. Production must preserve all retained state and idle startup behavior.

## Consequences and acceptance boundary

The organization may select useful people, hypotheses, internal work and follow-ups within
trusted bounds. Reservations deliberately favor safety over maximal utilization. Fresh
strategic generations cost context reconstruction but keep current evidence delivery explicit.
Conservative withdrawal may hide unrelated older derivatives from workers; owner history stays
readable. A blocked unknown outcome requires inspection, not a new thread for the same worker.

Release acceptance requires a real broad cycle, actual Asymmetri Motion Cycle 1 and a durable
scheduler-initiated Cycle 2 responding to intervening attributable evidence, deterministic clock
and crash cases, regressions, independent security and semantic reviews, and retained-state
production deployment. Simulated/sanitized evidence remains labelled and proves no live results.

Prompt 10 remains bounded Computer Use. Prompt 11 remains approved single-company external
operations and a measured pilot. This decision authorizes neither implementation early.

See [architecture and limits](../architecture/COMPANY_OPERATING_LOOP.md),
[operator tutorial](../operations/COMPANY_OPERATING_LOOP_TUTORIAL.md) and
[acceptance plan](../exec-plans/prompt-09.md).
