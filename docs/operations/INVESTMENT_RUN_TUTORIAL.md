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

Decision037 permits a distinct disposable experiment through `scripts/credit-pilot/run.ts` after deterministic tests, specialist review, accepted main integration and explicit confirmation that automatic credit reload is disabled. This mode cannot start an Investment run schedule or dispatch from ordinary HQ. Build the clean synchronized accepted main checkout. The supervisor's `prepare` command requires a narrow existing-worker roster JSON, advertised exact model, actual reload-confirmation timestamp and accepted main SHA; it writes fresh temporary SQLite/workspaces and an immutable approval. Never supply a confirmation timestamp without the owner's actual confirmation.

`preflight <root>` checks the pinned runtime and current catalog without inference. `inspect <root>` shows queued requests and retained evidence. `turn <root> <request-id|first> <previous-inspected-execution-id|none> <accepted-main-sha>` releases exactly one request and exits after settlement/stop. Inspect the original contribution, model/auth identity, usage and settlement before another invocation. Stop after any failure/uncertainty or four reservations. `stop <root>` permanently ends the pilot and revokes its private scope. No runner or schedule continues between commands.

Use only the original minimal identity/profile fields read from existing workers; never open retained production SQLite with the migrating Store/Company classes. Exclude private missions, sessions, history, credentials and workspaces. Keep real transcripts in private evidence, with fictional market input clearly labeled. Formal proposal/order tools and publication are unavailable; an analytical proposal or objection may be recorded in a discussion contribution. See [acceptance and current live gate](../validation/investment/INV-CREDIT-PILOT.md).

Retain the original pilot directory and reuse it for every command. Running `prepare` again does not renew the owner’s four-turn authorization. Immediately before the first turn, rebuild the clean accepted SHA and retain its build receipt alongside private evidence; Git source cleanliness alone does not establish that ignored build output is current. A nonempty global Codex AGENTS file, failed skill isolation or unavailable stable account identity keeps inference blocked.
