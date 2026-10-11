# Investment run controls — source-only operator guide

This guide describes the implemented private owner interface. It is not an activation instruction for retained HQ state. Current Codex investment model dispatch is held in both policies: strict token/cost enforcement is unavailable, and subscription included-only/retry guarantees are unverified. See [Decision036](../decisions/decision_036_subscription_activity_usage.md). Source permissions, genuine employee acceptance and deployment gates remain in [readiness](INVESTMENT_READINESS.md).

## Prepare an isolated authorized run

Use a separately approved frozen paper configuration and fresh approved investment team. Preserve existing workers and global roles. The team needs the same run's publication channel and independently approved source/participant permissions. Team consent, loop start and public publication consent are distinct. A draft and page load create no model work.

Open **Investment run** from private HQ. Select the **Approved team** and explicit exchange session dates from the frozen calendar. Include the initial frozen benchmark opening. Enter the research window, maximum turns per cycle/New York day/whole run, deterministic attempt count and retry interval. For strict mode, enter input/output tokens and maximum model cost for each day and the whole run; zero cost is a hard ceiling. For a team explicitly approved in subscription activity mode, these monetary/token fields are omitted; choose limits no higher than8/rolling24h,24/run and15minutes, while investment concurrency remains1 and global2. Existing cycle/day counts may be lower. This selection does not overcome the displayed runtime block.

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
