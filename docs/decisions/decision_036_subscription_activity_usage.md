# Decision 036 — Subscription activity policy and private AI usage reporting

**Date:** 2026-10-10
**Status:** Accepted owner policy; source implementation only; real Codex subscription admission blocked
**Amends:** [Decision 034](decision_034_scoped_investment_team.md) and [Decision 035](decision_035_finite_investment_loop.md)

The owner accepts practical activity limits for separately authorized private synthetic investment testing, without claiming provider-enforced token/dollar or exact subscription-quota limits. Strict provider-enforced policy remains a separate, unchanged option. Existing scopes without an explicit policy remain strict; migration grants no new authority.

One invocation is **one supervised Codex turn, including its internal tool loop**, as expressly clarified by the owner. Separately started follow-ups, resumed turns, synthesis, review and finalization each consume another reservation. Maximums are 8 per rolling 24 hours across investment runs, 24 per authorized run, one investment invocation at a time, the existing two global execution slots, and 15 minutes local supervision. Lower immutable approved limits are permitted. There is no automatic retry after uncertain execution. Local cancellation cannot guarantee immediate upstream termination or billing settlement.

Schema20 records permanent reservations with exact execution/request/worker/scope/run/occurrence identity. Claim and default usage record are one transaction. Fresh provider eligibility and current authority are rechecked at the final admission boundary. Failed setup consumes a reservation conservatively; unknown execution retains the investment concurrency fence after restart. Backward local-clock movement holds admission. Timekeeping uses the trusted HQ clock, not model-supplied timestamps. No paid/API fallback, account change or credit purchase is permitted.

All group turn kinds share admission. Investment model research-broker calls, ordinary peer continuations and delegated tasks are denied through existing scoped tools until they can inherit independently enforceable admission. Deterministic calculation and ordinary permitted source HTTP reads do not consume AI reservations. Ordinary engineering/conversation/research work gains reporting without these investment caps.

## Runtime feasibility and retained block

Pinned Codex0.157.0 has no supported included-only/no-paid-credit request switch. `ordinaryUsageAllowed` is current included-access evidence, not a guarantee for the internal tool loop. Built-in `openai` provider definitions ignore attempted retry overrides; WebSocket fallback and optional unbounded connection retry are further reasons not to claim zero uncertain retry. `CodexRuntime` therefore exposes **no** `runSubscriptionInvestment` capability and supplies an explicit owner-visible block reason. There is no ordinary `run` fallback. A future adapter needs a reviewed, supported implementation of the full contract before capability can be exposed.

The read-only probe found current included ChatGPT access, but available credits. That is not evidence of a charge. No model turn, account mutation or private account identifier was used in acceptance. Even a future zero-credit account observation alone would not resolve the pinned runtime's retry limitation.

Sources reviewed at implementation:

- [Pinned experimental turn parameters](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server-protocol/src/protocol/v2/turn.rs), [configuration schema](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/core/config.schema.json), [account eligibility structures](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server-protocol/src/protocol/v2/account.rs).
- [Provider definitions and merge behavior](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/model-provider-info/src/lib.rs), [response retries](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/core/src/responses_retry.rs), [official subscription/credit pricing](https://developers.openai.com/codex/pricing).

## Reporting and reference prices

Common private reporting preserves deduplicated upstream response usage and diagnostic cumulative snapshots. `last` is the last underlying provider response, not the whole supervised turn; `total` is cumulative thread usage and may be estimated/replayed. Cached input is a subset of input; reasoning is already in output. Only settled complete exact response telemetry qualifies for complete usage. Resumed threads without raw-event opt-in remain incomplete. Missing, conflicting, decreasing or overflowing counters cannot become zero. Historical executions are explicitly backfilled as incomplete.

Original exact model prices and version are captured per invocation. Decimal-safe integer arithmetic reports **Estimated API-equivalent cost (USD)**. Actual subscription charges and actual Pro quota consumed remain unavailable. Missing exact model/service tier or unsupported pricing dimensions are unavailable/partial; no alias guessing. Partial aggregates disclose unpriced and incomplete invocation IDs and unknown duration. These estimates never alter simulated portfolio P&L.

See [usage methodology](../operations/AI_USAGE.md) and [acceptance evidence](../validation/investment/INV-SUBSCRIPTION-USAGE.md). Decision029's US$0 market-data requirement, source rights, independent paper review, publication consent, canonical contract1.0 and financial arithmetic remain unchanged. This decision authorizes no deployment, production migration, run activation, genuine-employee demonstration or new recovery milestone.
