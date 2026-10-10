# Private AI usage and reference cost

Open **Executions → Usage & cost**, a worker's **AI usage and cost** inspector, **Investment team**, or **Investment run**. Reports show the worker/activity, provider/model, execution/request/thread/turn, start/finish, duration, status, token categories, completeness, original pricing source/version, and unknown reasons. Worker, activity, occurrence, New York calendar day, rolling24h and run aggregates share the same records. The rolling admission window is exactly24h and independent of calendar days.

The browser endpoint is `GET /api/usage` with optional `executionId`, `workerId`, `runId` and `cycleId` filters. It uses the existing private local owner boundary, Host/Origin checks and device-token denial. It is not a public investment or device-v1 endpoint. No external analytics/scripts are loaded. Source links open only on owner selection. Usage and cost never enter public publication contracts or portfolio accounts.

## What the counters mean

Codex0.157.0 `thread/tokenUsage/updated.total` is cumulative thread usage; `last` describes one underlying model response. Cumulative counts can be estimated/replayed and do not establish complete per-turn billing. We retain them as diagnostic snapshots, deduplicate exact observations and subtract only a known baseline. We never sum repeated totals or repeated `last` fields.

Fresh threads request supported experimental `rawResponse/completed` events with nullable per-response usage and an exact response ID. Response-item content is opted out; prompts, raw reasoning and response text are not stored by usage accounting. The common service sums unique valid responses, retains missing usage and rejects conflicting IDs, negative/fractional/contradictory/overflowing counters. Cached input and cache-write categories are input subsets; reasoning tokens are included in output. A terminal response alone does not repair lost telemetry. Cold-resumed threads retain continuity but may lack raw events; cumulative-only reporting remains incomplete. Late telemetry can improve an interrupted record's known portion without turning an uncertain invocation into settled work.

References: [token structures](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/protocol/src/protocol.rs), [thread protocol and raw events](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server-protocol/src/protocol/v2/thread.rs), [session accounting](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/core/src/session/mod.rs), [usage replay](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server/src/request_processors/token_usage_replay.rs).

## Reviewed pricing registry

Checked **2026-10-10**, version **`openai-2026-10-10-fdc607e42c34c9a1`**, USD per million tokens. The exact local registry is `src/domain/usage/pricing.ts`; every invocation retains its original entry/version. Changing the registry affects future records only. Existing historical records with no telemetry remain explicitly unpriced.

| Exact model | Uncached input | Cached input | Output |
| --- | ---: | ---: | ---: |
| gpt-5.3-codex | 1.75 | 0.175 | 14 |
| gpt-6-astra | 10 | 1 | 50 |
| gpt-6.1-sol | 2 | 0.10 | 10 |
| gpt-6-luna | 0.10 | 0.01 | 0.50 |
| gpt-5.6-sol | 4 | 0.40 | 20 |

Sources: [official API pricing](https://developers.openai.com/api/docs/pricing) and cross-check against the [official Work/Codex rate card](https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing). Model aliases/display names inherit no price. Standard service tier must be verified. Base estimates exclude tools, regional surcharges, cache writes and long-context multipliers. The newer model entries remain partial because additional dimensions cannot be established from these counters. Nonzero cache writes are unsupported. Missing cached input can use the explicitly labeled conservative uncached-input rate. Unknown service tier or model yields **Estimate unavailable**.

Calculation: `(uncached input × input rate + cached input × cached rate + output × output rate) / 1,000,000`, where uncached=input−cached. Integer arithmetic retains twelve decimal USD places; neither cached nor reasoning tokens are added again. The displayed average uses only priced completed invocations and names that denominator. A partial cost total is a known portion, never an assertion that unpriced work cost zero.

Deterministic worked example: gpt-5.3-codex, standard tier,24,500 input including20,000 cached,3,200 output including1,200 reasoning,27,700 total,252seconds: `(4,500×1.75 +20,000×0.175 +3,200×14)/1,000,000 = $0.056175 USD`. One uncached input token costs a reference `$0.00000175 USD`. These are fixture estimates; actual subscription charges and actual Pro quota consumed are **unavailable**.

Interrupted example: retain the same observed tokens and estimated known portion, but mark usage/estimate incomplete and retain uncertainty. With no authoritative usage, tokens and cost stay unknown/unavailable. Recovered unknown finish times and durations stay null; downtime is not execution time.

## Activity policy and current runtime block

[Decision036](../decisions/decision_036_subscription_activity_usage.md) permits max8 supervised turns/rolling24h,24/run,15minutes locally,1 investment and2 global executions, with lower owner limits. Each separately started turn counts, including a continuation on the same provider thread. Claim atomically reserves quota and usage; final admission checks current identity, authority and supported eligibility. A consumed reservation is never deleted/refunded. Restart or uncertain provider completion blocks investment replay; cost estimation alone never grants or revokes activity allowance.

**Current Codex subscription execution is blocked.** Its supported API cannot prohibit paid-credit continuation or provide the required retry guarantee. The owner UI exposes this reason. Strict mode still requires a genuine bounded adapter. A deterministic test adapter proves local control behavior only. No genuine employee trial or production activation is authorized by this milestone.
