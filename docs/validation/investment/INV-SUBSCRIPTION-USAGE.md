# INV-SUBSCRIPTION-USAGE acceptance — 2026-10-10

**Classification: SUBSCRIPTION USAGE & COST BLOCKED — SAFE SUBSCRIPTION ADMISSION COULD NOT BE ESTABLISHED.**

This record accepts source-level activity controls and private usage/reference-cost reporting. It does not accept genuine Codex subscription execution. The owner authorized implementation, deterministic validation, read-only account/protocol investigation, independent review and reviewed Git integration. No production deployment, retained-HQ migration, real employee turn, market workload, account/subscription change, credit purchase or public activation occurred. Asymmetri is read-only.

Base: `0dc32825fee537dc29f41f2bd86130f729f14ed3`; branch `feature/investment-subscription-usage-cost`. [Decision036](../../decisions/decision_036_subscription_activity_usage.md) preserves strict policy and Decision029; [methodology](../../operations/AI_USAGE.md) contains official references and rates. The implementation commit containing this record identifies the tested source; final PR/merge receipts are reported in the handoff.

## Enforced control-plane boundary

| Requirement | Evidence and limit |
| --- | --- |
| Invocation unit | Owner clarified one supervised Codex turn including its internal tool loop. Eight actual disposable claims exercise opening×2, facilitator×2, response, synthesis, review and finalize. Reused provider sessions consume separate reservations. No model inference is used. |
| 8/rolling24h | Immutable reservation timestamps, exact `(now−24h,now]` window, global investment count. Eighth reservation admitted; ninth blocked; exactly24h-old reservation leaves the window. Lower limits and backward-clock holds tested. Trusted HQ wall clock required. |
| 24/run | Retained history tests fill24 across expired rolling windows;25th denied. No midnight reset or refund. |
| Investment1/global2 | Independent SQLite connections contend for one investment reservation; ordinary work can take the second global slot. Existing strict concurrency behavior preserved. Unknown activity holds investment work across scopes. |
| Local15minutes | Approved upper bound900000ms; dispatcher deadline derives from persisted reservation time and signals abort. Deterministic lower100ms test verifies interruption and no replay. A future subscription adapter must enforce absolute cutoff/finite termination; pinned Codex exposes no capability. No claim of upstream billing cutoff. |
| No uncertain replay | Reserved/active crash transitions retain quota and unknown fence; interrupted/unsettled invocation cannot readmit. Actual default Codex automatic retry controls cannot satisfy the contract, so execution is blocked. |
| Current authority | Final admission rechecks worker/session identity, active run/occurrence, scope expiry/revocation, owner pause, reservation identity/deadline and eligibility inside a transaction. |
| Hidden inference | Investment `research_search`, ordinary `ask_peer` and delegated-task paths remain denied. Existing discussion synthesis/review routes are counted; deterministic simulator/DB/HTTP work is not AI invocation usage. |

Claims create usage and quota together. A crash before runtime setup cannot omit the consumed attempt from the report. Migration20 backfills all existing executions as incomplete without rewriting prior tables. Recovered unknown finish/duration stay null rather than including downtime. Original observation and response IDs remain immutable and retained; duplicate old snapshots do not regress counters.

## Actual read-only provider investigation

Global Codex was0.133.0; repository-pinned Codex was0.157.0. Generated the pinned app-server schema offline and inspected official pinned source. The supported read-only `account/read` and `account/rateLimits/read` probe observed ChatGPT authentication and `ordinaryUsageAllowed=true`, with credits available. No credentials, account identifiers or credit balance values were exposed or saved in the repository. Probe model turns: **0**.

Available credits do not establish a charge. No supported included-only/no-paid-credit request switch was found. Standard service tier is speed selection, not credit prohibition. Built-in OpenAI provider overrides do not apply retry limits as proposed; response transport also supports fallback/unbounded retries. Security review additionally found inherited endpoint concerns in the abandoned subscription startup path. The complete unsafe path was removed: `CodexRuntime` has **no** subscription capability, no override workaround and no ordinary fallback. The block reason is exposed in private team/run interfaces and admission errors. Genuine synthetic-price employee demonstration is **not ready**.

## Usage, price and aggregate evidence

Raw `rawResponse/completed` response identity is the authoritative observation when available. Fresh threads opt in; raw response-item content is suppressed. `last` is one internal provider response, `total` is cumulative thread usage with estimated/replay caveats. Only complete settled exact response telemetry with all categories present is complete. Cumulative-only/resumed, malformed, interrupted, missing or rerouted records remain incomplete/unpriced as appropriate. Cached input is a subset; reasoning is already output. No sum of repeated snapshots, aliases or guessed prices.

Reviewed registry **`openai-2026-10-10-fdc607e42c34c9a1`**, official sources checked2026-10-10. Exact integer decimal arithmetic and retained per-execution price entries preserve original estimates. Base-token exclusions and service tier are visible. Actual subscription charges and actual Pro quota consumed always remain unavailable.

| Deterministic example | Tokens and duration | Estimated API-equivalent USD |
| --- | --- | ---: |
| Complete gpt-5.3-codex, standard | Input24,500; cached20,000; uncached4,500; output3,200 including1,200 reasoning; total27,700;252s | 0.056175000000 |
| Interrupted with same observed tokens | Same known counters retained; settlement/usage incomplete; no replay | 0.056175000000, partial known portion |
| No final/authoritative usage | Counts unknown; finish/duration unknown after recovery | Unavailable |
| Missing-cache tiny fixture | One input, zero output, cached unknown; conservative uncached rate; incomplete | 0.000001750000, partial |
| Second worker, gpt-6-luna standard base | Input1,000,000 incl500,000 cached; output200,000; additional price dimensions unverified | 0.155000000000, partial |

Mixed-worker report correctly totals the two priced models to `$0.211175000000`, lists the unpriced invocation separately and marks the total partial. Unknown token totals stay null. Per-worker splits, exact occurrence/run attribution, New York day and rolling24h reports are tested. Cycle native details show tokens, duration and worker breakdown; remaining allowance belongs to the shared run. The average labels its priced-completed denominator. No value changes simulator P&L.

## UI and privacy

Updated execution history/inspector, worker inspector (including unavailable model-catalog state), investment team policy/summary and investment run/cycle details. Native details are keyboard operable; horizontally scrollable tables have a focusable labeled region, captions and header cells. Escaped long/HTML-like model names, missing values, fractional USD, incomplete status, keyboard opening/closing and mobile/desktop overflow are checked. No green fabricated zero or external analytics/scripts.

Browser acceptance at390px and1440px uses real disposable local backend data and headless installed Chrome. The shared usage route rejects cross-origin and device-token requests and allows only parameterized known filters. Public v1 investment contracts, device DTOs and Asymmetri projections do not expose these private histories. Screenshots are local fixture evidence under `/private/tmp/botsquad-usage-browser/`, not production screenshots.

## Validation

Environment: macOS/Darwin arm64, Node24.10.0, repository TypeScript/Playwright, installed Chrome, disposable SQLite/loopback servers. Existing Asymmetri receiver build at `/Users/eugenelin/dev/asymmetri/website/receiver` was imported read-only for local synthetic receiver regression; website source HEAD `3d9e1ad55dc5ad1861393e63d05370a2a1a7b054`. No Linux runtime or real model was exercised.

Final validation results (focused and contract cases overlap the full suite; do not add them together):

| Check | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm run build` | Passed |
| `INV07_RECEIVER_ROOT=… npm test` | 953 total: **952 passed,0 failed,1 skipped** (Linux-only recipe containment),67.216s |
| `npm run contracts:test` | **175 passed,0 failed**,0.409s |
| Focused usage/pricing/activity/runtime/loop/migration | **99 passed,0 failed**,8.639s |
| Browser team/run/usage,390px/1440px | **6 passed,0 failed**; refreshed after missing-category correction and compact long-name previews |
| `git diff --check` | Passed |

Retained failures/corrections: initial focused migration calls exposed the simulator schema equality and Store future-version guard still at19; both updated to20. Historical downgrade helpers now remove derived schema20 tables before recreating old fixtures. Existing strict-mode error wording was preserved. New clock tests initially attempted to move the monotonic fixture simulator clock backward; the clock-regression test now injects the HQ clock directly. Activity loop resume correctly required publication health; the fixture now supplies exact synthetic consent. Initial browser binding failed with sandbox `EPERM`; rerun used approved disposable loopback access. First full regression:953 total,951 passed,1 failed,1 Linux-only skip; the failure was a stale future-schema test inserting20, corrected to21 without weakening its assertion.

## Independent review dispositions

- **Control plane:** no blocking invocation/routing bypass; final evidence adds actual eight-turn discussion, reused sessions and activity loop pause/resume. Dispatcher uses the durable reservation deadline.
- **Security:** prior retry/endpoint blockers resolved by removing the unsupported Codex capability. Private route and escaped UI accepted; genuine execution remains blocked.
- **Recovery:** atomic claim/usage, historical backfill, null unknown duration, immutable cycle identity and duplicate-snapshot fixes accepted; no blocking findings remain.
- **Usage semantics/pricing:** pinned upstream meaning and raw-event limits reviewed independently; five exact standard price tuples verified against official sources. No paid-only bypass found or attempted.
- **Test/acceptance:** cycle details, pricing exclusions, mixed models/workers and populated occurrence migration added. Refreshed browser assertion and inspected screenshot confirm missing-cache incompleteness. Final full/focused/contracts/browser counts are recorded above.

All specialists were read-only. Parent remained sole writer. Fake adapters and compressed clocks prove local deterministic rules, not upstream quota enforcement or real employee behavior.

## Handoff boundary

A separately reviewed provider capability is still needed before the owner can authorize a small genuine employee demonstration using synthetic prices. Do not relax credit/retry checks, purchase API access, activate a run, deploy, change Decision029 or expand this packet. Stop after reviewed source integration.
