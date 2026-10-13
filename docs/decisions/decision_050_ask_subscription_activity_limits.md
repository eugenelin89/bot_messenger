# Decision 050 — Explicit Ask subscription activity limits

**Date:** 2026-10-13
**Status:** Accepted source amendment under existing owner implementation authority; operational use requires the remaining runtime acceptance
**Scope:** Canonical capability representation and dormant independent Ask accounting

The Ask product specification section8 permits conservative activity limits when a subscription
cannot provide a true hard monetary bound. Pinned Codex0.157 has no included-only switch or hard
output-token parameter in turn/start. Decision049's strict metadata cannot truthfully represent
that runtime. Neither an owner login nor an agent-supplied boolean can create the missing capability.
No API purchase, new billing approval or provider-rights milestone is introduced by this amendment.

## Explicit alternative, preserved strict behavior

Canonical AskLimits gains `activity_capped_subscription` with required version1
`subscriptionActivityPolicy`. Its closed constants disclose monitored token thresholds, unavailable
actual cost, possible overshoot/internal retries, and a hold on missing usage or threshold breach.
Daily dollars, per-execution and total/day charge allowances, and completed charge receipts are
null in this mode. They are never coerced to zero or called free usage. Router/research allowances
remain zero. Strict existing payloads retain their exact shapes and cannot carry this policy.

The adapter proof requires false hard input/output enforcement flags, explicit monitored-usage
support and the exact bound policy. Existing account, routing, eligibility, provider-session,
reservation, worker, scope and expiry proofs remain mandatory. This schema supplies none of them.
The version1 policy is an explicit pinned-package extension under the existing1.0 route/schema
family; older consumers reject its new enum. Both repositories must review the exact manifest
and consumer behavior before selecting it. Investment DTOs and signing semantics are unchanged.

## Accounting and irrevocable stops

Reserve finite execution count and the configured input+output threshold before a possible effect.
Retain at least max(reserved total, complete measured input+output) in all applicable grant/day/
rolling24hour token sums; underuse and known no-send never refund authority. Component input or
output excess is a breach even when the combined total is below the reserved sum.

One immutable settlement event stores complete over-threshold usage and terminal
`settled_over_limit` state together. That state permanently blocks reserve, admit and transmit
across grants, services, generations, UTC midnight and restart. It cannot be converted to unknown
or cleared by delivery reconciliation. Revocation and privacy/receipt processing remain possible.
The state requires no further completion headroom. Missing/incomplete usage remains an unsettled
or unknown execution and prevents fresh work; an invalid receipt is never converted to zero.
A crash after SQL commit but before independent checkpoint durability leaves custody held, with
measured usage retained in the immutable journal. No automated reconciliation/reset is supplied.

Completed activity usage with null cost is execution-known but monetarily unpriced. Within any
applicable strict per-grant, current UTC-day or rolling24hour window, unpriced reservations deny
strict money admission; the code does not subtract or ignore them. At the exact rolling boundary,
complete old activity outside all applicable windows no longer contributes to the current-window
check, but remains recorded as null. This is windowed budgeting, not recovery of historical cost.
Unknown execution and threshold holds never expire via those windows.

## Acceptance and limits

Require strict legacy replay and mixed-proof negatives, unknown/numeric cost mismatches, exact
closed policy validation, missing telemetry, input-only/output-only/combined excess, renewal/service/
restart/day escape attempts, late settlement after revocation/expiry, failed-checkpoint custody,
no-refund accounting and exact rolling-window transition tests. Review both producer and pinned
website consumer; disclose actual enforcement in the public service before enabling it.

This source amendment supplies no operational initializer, new runtime permit, public eligibility,
provider telemetry completeness, ephemeral context/retention evidence or actual employee answer.
It does not remove those implementation/acceptance requirements or alter investment authority.

Bounded source and pinned consumer reviews passed. See [INV-ASK-SUBSCRIPTION-01](../validation/investment/INV-ASK-SUBSCRIPTION-01.md)
for exact hashes, tests, earlier failures and unproven operational requirements. The website writer
validated the candidate in isolation; its deployed pin remains unchanged until adopted from the merged HQ commit.
