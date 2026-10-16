# Investment workspace and retained run controls

Open **Projects → Investment** in the private HQ. The linked routes are **Portfolio & work**,
**Team permissions**, and **Publication**. Merely opening them does not collect data,
run an employee, approve a decision, trade, publish, or activate Ask. Ask remains paused.

## Read the portfolio and work

1. Read the **Latest portfolio valuation** and its actual quality/as-of time. A complete
   valuation is a recorded calculation; partial or blocked data is not a complete price set.
2. Read **Formal decisions** from the committed ledger. Research proposals and independent
   reviews are listed separately; the decision table shows its exact matching independent review
   as approved, rejected, missing or mixed. A committed record alone does not prove an
   approved or executed trade. A discussion or completed response is not a decision.
3. Read **Paper orders** and their individual status/session/reason. A HOLD decision can
   have no order. These are simulated orders, not real trades.
4. Read **Operations held** for portfolio restrictions, and the schedule's own reason for
   research/scheduling blocks. Absence in one section does not prove every operation is clear.
5. Read **Research and discussion** under the retained schedule for work records and usage.
   **Schedule state** describes the schedule, not whether an employee is currently running.
6. Read **Future schedule** for the next pending occurrence. A future timestamp is not
   proof that it ran or will meet all admission/permission requirements. Expand original
   schedule records for the exact stage and evidence.

Existing pause/stop/resume, reload confirmation, scoped authority, publication previews
and consent retain their distinct meanings. **Other research and legacy setup tools** opens
private synthetic setup, private historical research and legacy finite planning. Do not
use a setup form to continue an exhausted authority. The current operational source is
[INV-REAL-01](INV-REAL-01.md); the sections below preserve earlier source workflows and
closed Decision037 history, not reusable activation permission. Original run records stay
unchanged. [UX verification](../ux/hq-redesign/USABILITY-VALIDATION.md) separates fixtures
from retained live evidence.

## Prepare an isolated authorized run

Use a separately approved frozen paper configuration and fresh approved investment team. Preserve existing workers and global roles. The team needs the same run's publication channel and independently approved source/participant permissions. Team consent, loop start and public publication consent are distinct. A draft and page load create no model work.

Open **Projects → Investment → Other research and legacy setup tools**. Select the **Approved team** and explicit exchange session dates from the frozen calendar. Include the initial frozen benchmark opening. Enter the research window, maximum turns per cycle/New York day/whole run, deterministic attempt count and retry interval. For strict mode, enter input/output tokens and maximum model cost for each day and the whole run; zero cost is a hard ceiling. For a team explicitly approved in subscription activity mode, these monetary/token fields are omitted; choose limits no higher than8/rolling24h,24/run and15minutes, while investment concurrency remains1 and global2. Existing cycle/day counts may be lower. This selection does not overcome the displayed runtime block.

Choose **Preview schedule and limits**. Review exact research/cutoff/open/expiry/mark timestamps, immutable run/team configuration and derived cycle reservation. Check the explicit approval checkbox, then start the displayed plan. Editing any input invalidates the visible consent; a stale response cannot start a changed plan. After start, limits are immutable. Start itself does not force a model call before a due window or overcome a missing bounded adapter.

## Observe a finite cycle

Inspect **Schedule, reservations, measured usage and receipts** and the run's next occurrence/state. Original market records must be admitted under the frozen source policy; this scheduler does not fetch arbitrary prices. Participants can discuss and independently review exact paper proposals. New narrative derivatives still need exact publication preview and consent. An existing standing financial grant can capture permitted order/ledger/valuation changes, but cannot approve new prose. Missing source or publication evidence leaves explicit pending/blocked stages; no close or article price substitutes for the required opening.

The next cycle sees retained outcomes and observation metadata. It must read original cited records before revising conclusions. Consumed reservations and ordinary group limits remain cumulative. Unknown usage is shown as unknown. Strict mode retains its unknown-spend hold; activity mode uses invocation allowance instead of a monetary budget, but unknown provider settlement still stops further investment admission. Owner Attention links to blocked runs. A bounded source retry uses a new attempt receipt; an uncertain provider result never auto-retries.

## Choose the appropriate control

| Control | Result |
| --- | --- |
| Global model pause | Holds new model dispatch. Does not cancel committed paper orders; deterministic stages can still run. |
| Runtime interrupt | Signals the selected active turn. Does not establish provider settlement or undo effects. |
| Pause investment run | Atomically cancels pending orders and holds future scoped work; active turns receive abort. Filled trades remain. |
| Resume investment run | Rechecks current authority, usage/provider uncertainty and publication health. Only eligible future work continues; no cancelled orders or missed stages return. |
| Stop investment run | Ends future cycles and pending orders. No further valuation is implied. |
| Cancel paper order | Cancels only a still-pending order. A concurrent completed fill returns its terminal receipt. |
| Publication pause/revoke | Stops corresponding publication authority. Local history and completed trades remain; new risk is held. Previously published copies require separate receiver withdrawal. |

## Recovery and end of run

After restart inspect retained occurrences, usage, provider status and publication restore reconciliation before resuming. Do not reset tables, refund reservations or relabel unknown usage as zero. Exact control retries return their original receipts. Cleanup can expire already-pending orders without new source/model authority. A finite exhausted loop cannot be resumed to replay old work. Keep the simulator journal, occurrence attempts and publisher receipts together when investigating a discrepancy; a publication acknowledgement is not a trade execution.

This packet deploys nothing, creates no real model/market workload and leaves no demonstration runner. Future operation requires the separate decisions in the readiness proposal.

## Inspect usage and reference cost

Private team/run panels and execution/worker inspectors show common usage records and original pricing versions. Open the methodology and breakdown details for worker/cycle/day/activity aggregation, excluded unpriced records and the priced-completion average denominator. Estimated API-equivalent cost is separate from simulated P&L. Actual subscription charges and Pro quota consumed are unavailable. [AI usage](AI_USAGE.md) documents exact semantics, examples and the current runtime block.

## Separate finite private credit pilot

The original failed pilot is permanently stopped and its scope revoked. Its one consumed reservation is inherited by the [durable continuation](../validation/investment/INV-CREDIT-PILOT-CONTINUATION.md); zero confirmed genuine turns remains its historical outcome. The old `run.ts prepare/turn` commands reject new execution. Never open the archived database with Store or a migrating supervisor. Preserve the archive and use byte/digest inspection plus a disposable read-only database copy.

After passing deterministic checks, independent reviews and accepted integration, rebuild clean synchronized main. The trusted local `dist/scripts/credit-pilot/continuation.js` supervisor uses a fixed OS-account private authority location; no manifest or command argument selects another ledger. These commands describe the separately approved one-Atlas continuation and grant no additional authority:

- `register <accepted-sha> <archive> <independently-verified-archive-digest> <actual-reload-OFF-confirmation-time>` initializes authority once, inheriting1/4 consumed. Use only the retained verified archive and actual owner confirmation. Existing/incomplete authority blocks registration; there is no reset command.
- `prepare <accepted-sha>` binds one inert disposable successor using the retained approved minimal Atlas/Maya identity/profile fields. It preserves hierarchy while excluding private missions/history/sessions/workspaces/credentials. The successor has only one authorized new release.
- `preflight <accepted-sha>` performs official non-inference authentication, requirements, configuration, skill/tool and exact-model catalog checks; pins account and routing hashes. Preflight failure stops the lineage. The original failed attempt's account fingerprint remains unknown.
- `inspect <accepted-sha>` reads successor evidence; `inspect-lineage <accepted-sha>` reads durable counts/receipts even if temporary state is gone.
- `turn <accepted-sha>` releases the approved Atlas request once, consumes cumulative reservation2, then stops and revokes its scope after completion/failure/uncertainty. It cannot launch Maya or release another turn. Private reports are retained outside the temporary workspace as well as inside it.
- `stop` stops/revokes the successor; `stop-lineage` stops durable authority even if temporary state is missing. Emergency stops do not require a source SHA or a clean checkout. Active supervision observes external stop and authority unavailability.

Source SHA checks do not establish freshness of ignored build output; retain the accepted-main rebuild receipt before registration/release. Owner confirmation must remain within24hours at admission and still applicable. Automatic reload is owner-confirmed OFF, never claimed as freshly queried. No purchase or billing mutation is available. Local five-minute interruption cannot guarantee upstream billing cutoff; internal provider retries may consume existing credits.

Every reservation survives setup failure, rollback, process exit and deleted temporary state. Every provider admission is one-use. Successful completion ends this release authority too: cumulative2/4 means two unused reservations and zero authorized further turns. Do not reopen, replay, prepare another allowance or treat a successful response as production/public readiness.

Account notifications retain PR48's generation invalidation and authoritative rereads. Unchanged startup identity may proceed; account/routing changes, unresolved notifications, model/provider reroute or failed confinement block admission. Active notifications interrupt conservatively. Use only clearly fictional market observations; no paper orders, research fetching, publication or scheduled loop. Inspect original provider IDs, usage completeness, settlement and API-equivalent estimates privately; shared-account balance observations do not prove attributable credit deduction.

## One explicitly authorized Maya review of historical Atlas evidence

The completed Atlas commands above have no remaining release permission. The narrowly scoped
[Decision037 Maya amendment](../validation/investment/INV-CREDIT-MAYA-REVIEW.md) uses the same
fixed authority via `dist/scripts/credit-pilot/maya-review.js`, only from rebuilt clean main
matching the accepted merge SHA. These actions describe the current owner-selected attempt,
not reusable permission:

- `authorize <accepted-sha> <retained-atlas-archive> <verified-archive-digest> <retained-owner-request-file> <actual-reload-confirmation-time>` adds schema2 once, preserving schema1 rows/receipts. Never fabricate or renew confirmation timestamps.
- `prepare <accepted-sha>` binds one inert Maya sandbox and exact complete historical imports. No model runs.
- `preflight <accepted-sha>` verifies official ChatGPT configuration, exact model/low support and account/routing without inference; count remains 2.
- `inspect <accepted-sha>` or `inspect-lineage <accepted-sha>` shows private evidence and cumulative counts. Output is sensitive; do not put raw reports in Git.
- `turn <accepted-sha>` durably claims supervision, selects only Maya, reserves count 3, admits one fresh provider turn, then permanently stops and revokes. Never repeat after an error.
- `stop` revokes local authority; `stop-lineage` stops external authority even if the sandbox is unavailable. Stop commands require no SHA and cannot reauthorize anything.

No runtime/HTTP tool can administer this continuation. Missing/tampered sources, unrelated
context, a stale confirmation, unsupported model or unknown account state blocks inference.
A successful review is one-way historical cross-employee review; no later Atlas response is
authorized. Preserve the remaining unused reservation rather than trying another employee.

**Completed invocation:** Maya's authorized turn has now completed and settled. The Maya
commands cannot prepare/release another attempt; both old successors remain stopped and
revoked. Current allowance is 3/4 consumed, one unused, zero authorized future releases.
See the [outcome](../validation/investment/INV-CREDIT-MAYA-REVIEW.md). Never rerun a turn to
reproduce its response or dashboard; inspect retained private records instead.

## Final Decision037 continuation boundary — 2026-10-11

The owner's final request permits exactly one Atlas response after accepted source and
billing gates. The trusted local `scripts/credit-pilot/final-atlas.ts` supervisor authenticates
the stopped predecessors and imports all three complete historical records into one new
private group. Its `authorize` operation takes the accepted main SHA, verified Maya archive
and digest, retained owner-request file, and actual reload-OFF confirmation JSON. `prepare`
and non-inference `preflight` precede the sole `turn`; each command remains bound to accepted
source and fixed private authority. These are controlled owner operations, not public API
or worker tools. Do not invoke earlier turn commands or copy a manifest as a workaround.

The final reservation permanently exhausts the original 4/4 allowance on any outcome.
Stop/revoke and evidence retention must follow; inspect does not authorize another turn.
A stale confirmation requires genuine fresh owner evidence, never a guessed timestamp.
See [final acceptance](../validation/investment/INV-CREDIT-FINAL-ATLAS.md) for current status.
No purchase, reload change, paper order, real-data run, public publication or schedule follows.


## Final Decision037 outcome — 2026-10-11 America/Vancouver

Decision037 is permanently closed at **4/4** after one genuine final Atlas response. All
stages are stopped and scopes revoked; zero unused allowance and zero future releases remain.
Do not invoke `prepare`, `release`, `reserve`, `admit` or any old/final `turn` command to
continue it. Earlier command instructions above are historical, not current permission.
One queued Maya request is inert behind exhausted/revoked authority and must not be dispatched.
Preserve the owner-private closed archive and registry; read-only evidence inspection grants
no new execution. See [final acceptance](../validation/investment/INV-CREDIT-FINAL-ATLAS.md).
No purchases, reload changes, market-data collection, paper orders, deployment or schedule
were activated. A new readiness task requires separate owner authorization.

## Private finite HQ setup — source workflow only

HQ-READY-02 extends **Projects → Investment → Other research and legacy setup tools** with a private synthetic setup form. Select existing
employees and their scoped responsibilities, a mandate/output/constraints, two future synthetic
session dates, capital/fees/risks, finite turn ceilings and an explicit scoped model/reasoning
profile. The fixture universe is SYNTHA/SYNTHB with SYNETF benchmark; these are invented assets.
The frozen method remains `inv05-v1`, next regular open, long only, USD, no leverage. This form
acquires no data, provisions no runtime authority and changes no employee defaults.

1. Preview the complete configuration and actual-consent start rule. Editing invalidates consent;
   stale previews fail without backdating the run.
2. Confirm the exact preview. Creation returns immutable configuration/hash and initial cash-only
   valuation, a private scope, static source original and draft schedule. It starts no model work.
3. Inspect the mandate, workers, next session, portfolio, proposals/reviews/orders, usage, expiry
   and source originals. Publication is disabled; disabled simulator outbox records are private
   audit projections, not public jobs.

Do not attempt operational activation under this source-only authorization. A later selected
HQ-READY-04 task must provision and approve independent service custody and bind the exact
finite authority. The optional `BOTSQUAD_FINITE_HQ_AUTHORITY` service selector names that existing
ID; it cannot select a path or create/reset allowance. Leave it unset for this milestone. Existing
fixed custody is still discovered for cross-mode accounting/fencing even when that selector is absent.

Once separately authorized, owner pause interrupts model work and cancels pending orders; stop
is terminal and preserves fills/history. Global model pause remains separate. Reload confirmation
and exact future-only resume are distinct controls. Recovery cancels/misses old work and requires
explicit resume of eligible future occurrences; unknown settlement cannot resume. No per-employee
manual release is required for a healthy approved finite run.

[Readiness and remaining gates](INVESTMENT_READINESS.md#hq-ready-02-source-status) ·
[Fake acceptance](../validation/investment/HQ-READY-02.md). No next packet or genuine run follows
automatically. Decision037 stays permanently4/4.
