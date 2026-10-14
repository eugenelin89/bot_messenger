# Cost, usage and operating capacity

As of the [19:25 inventory](evidence/inventory-verified.json), the observed run has **seven genuine model executions**, all settled, with **six complete usage records** and one historical incomplete record. No new provider calls were initiated by the audit. Counts, tokens, subscription consumption and billed charges are different quantities.

## Recorded model usage

Actual route: official OpenAI provider, `gpt-6-sol`, pinned CodexCLI 0.157.0, requested reasoning`low`/tier`default`; returned telemetry tier`standard`. The approved finite mode is `credit_approved_finite_hq` with existing credits allowed. It does not prove included-only ChatGPT Pro consumption or zero incremental AI cost.

| Execution (exact suffix; all prefixed `execution_`) | Employee / reserved UTC | Authoritative responses | Total tokens |
|---|---|---:|---:|
| `377ea290-34b1-4dad-84df-d062237ef578` | Atlas12:00:01.505 | 4 | 51,042 |
| `e3ed1125-119b-48ee-9b3a-74f2d6e8b9d3` | Maya12:00:38.485 | 3 | 36,245 |
| `f141db7a-40fa-439c-88e1-376c965456c3` | Atlas12:01:13.039 | 3 | 39,856 |
| `ec78843c-0b56-4343-9d38-a6ba223867be` | Maya12:01:42.449 | **0** | **Unknown** |
| `f75b928c-fd89-4481-8643-3d7e6fda6f84` | Atlas17:06:10.156 | 3 | 44,297 |
| `296fbeda-854e-4d7a-b5a6-09f74a32baf8` | Maya17:06:45.395 | 3 | 47,159 |
| `8b5a95d1-17b8-494f-86a0-f83588aa5848` | Atlas17:07:21.902 | 3 | 42,881 |

The six complete records contain19 response records: input256,875, cached-input161,152, output4,605, reasoning-output188, total261,480. Cached input is a subset of input and reasoning output a subset of output; do not add them again. The historical Maya row displays cumulative diagnostic66,720 tokens, but has zero authoritative responses and `completeness=incomplete`. Adding it to261,480 would produce an unsupported run total. The actual all-seven total remains unknown.

All exact-model cost estimates are `unavailable: Exact model price unavailable`. No list-price substitution or token-to-invoice estimate is treated as a settled charge. Subscription quota, purchased-credit draw, provider invoices and host-account billing were not available to this audit.

## Installed ceilings and next-session arithmetic

| Control | Existing bound / consumption |
|---|---|
| Recovery family | Original4 + maximum7 additional =11 total;7 consumed,4 remain |
| Original policy maxRun |16; recovery family11 is the tighter effective limit |
| Rolling24h |8 across investment modes;7 currently retained,1 spare at initial audit |
| New York calendar day |8;7 consumed Oct 14 |
| Cycle / worker |7 per cycle;12 per worker |
| Concurrent investment / global dispatcher |1 investment /2 global |
| Per-turn duration |300seconds and original occurrence/authority deadline |
| Unknown retry |0; uncertain requests remain consumed and fenced |
| Source requests |Nine morning requests spent; nine Oct 14 close plus eighteen Oct 15 requests remain prospectively scoped |
| Authority and publication expiry |2026-10-15T23:40Z; no automatic extension |

At Oct 15T12:00Z all seven Oct 14 reservations are still inside the strict24-hour window. The final research cycle needs one initial facilitator turn plus three protected synthesis/review/finalization turns. Seven+four exceeds8. At12:01:13.039 the third morning reservation ages out, leavingfour+four=8. This releases rolling capacity only; family consumption stays7. [Readiness](OCTOBER-15-READINESS.md) describes the scheduler defect and correction.

The four-turn minimum permits a new typed decision if workers act efficiently: proposer during facilitation or synthesis, independent review during the reviewer turn, submission before the final terminal synthesis. It has **no spare turn** for optional discussion, revision, a rejected provider request or extra reasoning exchanges. A valid rejection can conclude without an order. A formal HOLD still requires typed proposal/review/submission. More generous discussion requires a separately approved future envelope, never a silent cap increase.

## Actual cost evidence

| Category | What is known | What remains unknown |
|---|---|---|
| AI subscription | Approved account observed as ChatGPT Pro; finite credit-approved route installed | Subscription invoice, quota consumed, marginal credit charges |
| Separate Ask API | HQ Ask tables/usage empty; key absent; receiver claims/answers/service keys0; public disabled | Account-wide billing outside these services; no API spend decision sought while paused |
| Market data | Hard US$0 incremental budget; policy acquisition cost0; bounded Yahoo source under owner-reported permission | Any unrelated owner subscriptions; no paid feed introduced |
| HQ and web hosting | Existing hosts/resources recorded in architecture report | Monthly host, network, snapshot and backup invoices |
| Storage/publication | Existing SQLite and signed HTTP; retained scope12 writes/minute/16MiB per day | Monetary allocation among website/Motion/investment and off-host backup costs |
| Audit validation | Local and isolated Linux authored tests, read-only queries and public GETs | Codex development-chat subscription/account attribution; not charged into paper portfolio |

The $100,000 is simulated investment capital, not an AI or hosting budget. AI/host costs do not silently alter investment P&L.

## Sustainability verdict

Current authority supports only the remaining finite experiment through October 15, conditionally. It cannot support indefinite daily autonomous trading. Continuing needs a separately authorized and reviewed renewal policy that explicitly carries the retained historical telemetry exception, implementation/acceptance and new finite authority. Ordinary same-portfolio renewal currently rejects the original incomplete record even after a successful successor. Fresh source/publication scope, verified accounting and adequate recovery custody are also required. The architecture keeps idle scheduling model-free, but each genuine research cycle consumes finite calls and tokens. Four turns is a technical minimum for this paused final-day group, not a reliable universal daily operating budget. Do not estimate settled monthly costs from seven calls.
