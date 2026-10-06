# Learn by doing: a bounded company mandate

Use a fresh isolated validation company for this exercise. Do not add a demonstration mandate,
schedule, observation or grant to retained production. A draft does not run a worker; activation
does. See [limits and recovery](../architecture/COMPANY_OPERATING_LOOP.md) and the
[Prompt 09 execution plan](../exec-plans/prompt-09.md) for current release acceptance.

## 1. Create a passive mandate

Open the private HQ browser through the established SSH tunnel. Select **Mandates**, then
**New mandate**. Use a clearly fictional objective, for example:

> Improve the sustainable success of this SIMULATED small software product. Decide useful
> internal investigation and strategy from the supplied evidence. Compare reasonable
> alternatives; choose people and work that help resolve the important unknowns.

Use success criteria that require an attributable decision, useful internal analysis and a
later review. State a stop condition when evidence, permission or bounds are insufficient.
Select an enabled persistent coordinator such as Atlas. Save the passive draft.

## 2. Set internal authority and limits

In the creation form, authorize only the internal categories needed for the exercise. Task
assignment still needs existing role/capability and direct-report eligibility. Group membership
still grants no additional permissions. The public-research checkbox uses existing individual
grants; it does not create one. Leave it off unless the isolated workers have explicit applicable
grants through the normal Public Research controls.

State constraints: internal analysis only; no publication, outreach, spending, repository changes,
private accounts or Computer Use. Keep finite cycle, Task/group, research, duration, scheduling
horizon and occurrence limits. For a short exercise, choose two cycles, one group, three Tasks,
40 reserved model executions and one schedule. Keep the IANA timezone explicit. Request that
the coordinator schedule its follow-up a few minutes after finishing the first internal work,
then stop after the second review. This specifies the test window, not its strategic answer.

The saved envelope is immutable. If a later objective needs broader authority, author a new
mandate deliberately. A free-form statement such as “budget 500” does not authorize payment.

## 3. Admit a labelled baseline and activate

Select **Add labelled observation**. Choose **SIMULATED FIXTURE** and title it accordingly.
Provide several plausible competing signals, for example a fictional setup completion rate,
return rate and feedback counts. Include denominators or explicitly mark them unknown. Set
an observed period, source such as `fixture://tutorial/baseline`, provenance explaining who
invented it, and limits stating that no actual product/customer/revenue outcome is established.
Leave unavailable values or observation time blank rather than inventing precision.

Link the observation to the mandate. Review its visibly rendered mode, source, separate observed
and recorded times, and missingness. Then click **Activate mandate**. Resume company dispatch
only if this isolated fixture is intentionally paused. Ordinary drafts and observation entry
remain passive.

## 4. Watch the first company cycle

Inspect **Operating cycles** and **Internal work and results**. The team may choose an initiative,
convene a useful working group and create a separate decision-linked analysis Task. It selects
participants and strategy inside the envelope. Open the group to inspect actual contributions,
challenge, shared evidence and synthesis. Open the Task to inspect the assigned question and
artifact. A group recommendation alone is not a Task assignment or external-action approval.

A waiting coordinator releases its execution slot while internal work runs. It receives a fresh
strategic context when the trusted completion event resumes review. A blocked outcome is an
inspection requirement; do not clear a fence or repeatedly press review-now to bypass it.

## 5. Inspect the decision and sources

In **Strategic decisions**, examine recommendation, alternatives, rationale, contrary evidence,
unknowns and cited originals. Compare the choice to the actual group/Task outputs. An explicit
missing-evidence statement is legitimate. A simulated number must remain simulated in both the
analysis and final decision. Worker interpretation is not a trusted measurement.

If an observation was admitted incorrectly, **Withdraw future access** retains the owner history
while denying future worker delivery. Earlier derived strategy/results are conservatively
withheld too; a provider's already transmitted context cannot be recalled. Correct the source
by admitting a new attributable observation, without disguising its evidence mode.

## 6. Inspect the company-created review

The coordinator should save its useful follow-up under **Review schedules**. Check purpose,
timezone, due instant, recurrence, count/end bounds and version. Inspect occurrence history as
it becomes due. Do not create the second cycle manually for this exercise.

One-time, elapsed-interval and daily wall-clock recurrence are supported. The daily first date
and `HH:mm` both use the mandate's stored IANA timezone, even when the browser is elsewhere.
The server resolves that calendar date using the same DST rule as later occurrences. One-time
and interval due times, and schedule end times, use the browser's local timezone. A spring
clock gap moves to the first valid minute; a repeated autumn minute uses the earlier instant.
Missed intervals coalesce; another active cycle holds the review rather than starting a competitor.

## 7. Admit new evidence before the review

After Cycle 1 closes, add another **SIMULATED FIXTURE** observation linked to its cycle and
selected initiative. Use a neutral, attributable outcome that permits more than one reasoned
response. For example: a hypothetical review of twelve synthetic case descriptions found seven
consistent with the proposed mechanism, three inconclusive and two accessibility/edge concerns.
State explicitly that no implementation/customer experiment occurred and no conversion,
retention or revenue improvement can be inferred. Record source, provenance, time and limitations.

This observation is the owner's evidence input. It is not a prompt telling Atlas what second
decision to make.

## 8. Let the clock trigger the review

Wait past the actual due time. Check that one occurrence is linked to Cycle 2 with trigger
`durable_schedule`. No worker should poll the clock while idle. If the service was temporarily
offline, inspect the coalesced missed count rather than expecting one execution per missed tick.
The same worker's uncertainty fence still blocks scheduling even after a restart.

## 9. Assess the second decision

Inspect whether the company recovered the first choice, read the intervening observation,
acknowledged limitations and explained its next disposition. Continue, iterate, pivot, stop or
scale can all be strategically reasonable within the envelope. Do not require a dramatic pivot.
Compare its reasoning to the actual evidence, and confirm that it never claims a live business
improvement from the fixture. The next follow-up or explicit stop condition must be durable.

## 10. Pause or stop and retain the record

**Pause mandate** holds future dispatch; **Resume mandate** releases eligible held work without
duplicating occurrences. Schedule **Pause** affects an unstarted scheduled review; control an
already started cycle through the mandate. Schedule **Cancel** is terminal. **Stop mandate**
ends further cycles and internal authority while preserving decisions, evidence and history.
Global pause retains all schedules and holds dispatch company-wide.

This exercise establishes bounded internal company review. It does not establish live marketing,
product operation, publication, customer outreach, revenue improvement, autonomous spending or
unrestricted computer operation. Prompt 10 and Prompt 11 have separate acceptance gates.

## Choosing a usable review window

A new or edited review must end at least 30 seconds after its first due time. Equal due/end
times leave no dispatch window and are rejected. Leave longer for busy workers or restart
downtime. The end is an inclusive hard cutoff for the first execution claim; no extra grace
is added. Missed recurring times still coalesce within the end/count limits. Daily reviews
resolve in the mandate timezone using the existing DST rule; server validation is authoritative.
The owner can inspect retained occurrence reasons, claim audit timestamps and execution history.
