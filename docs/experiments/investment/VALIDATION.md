# Validation and acceptance matrix

**Version:** 1.1 | **Status:** Required future checks, not test results | [Guide](README.md)

## Evidence rules

A specification, mock, synthetic transcript, real model invocation, elapsed market trial and production deployment prove different things. Label each evidence item explicitly. Record exact source commits, test commands, counts, fixture configuration, clock/data mode, scope and limitations. Never pass real-worker acceptance with a stub, elapsed-time acceptance with a simulated clock, or public activation with a deployment alone.

No investment gain, chosen stock or predetermined conclusion is required for software acceptance. A defensible HOLD or explicit missing-evidence stop can pass organizational acceptance. Do not manufacture disagreement or rewrite failures to make the showcase look intelligent.

## Requirement coverage

| Owner requirement | Main acceptance | Build packets |
| --- | --- | --- |
| R01 Pretend money and simulated trading | A01, A05, A07 | INV-05, 06, 08, 09, 10 |
| R02 Research and buy/sell/hold explanations | A08, A10 | INV-06, 08, 09, 11 |
| R03 Portfolio, history and charts | A01, A04, A05 | INV-04, 05, 06, 10 |
| R04 Authenticated HQ REST publication | A02, A06, A07 | INV-02, 07, 10 |
| R05 BotSquad/project purpose and goals | A04, A12 | INV-04, 12 |
| R06 Genuine live discussion and history | A03, A04, A10 | INV-03, 04, 08, 09, 10 |
| R07 Durable links for deliverables | A03, A06, A07 | INV-03, 07, 08, 10 |
| R08 Maintainable design and build roadmap | A09, A12 | All packets |
| R10 US$0 market-data budget; permitted free collection/scraping and public-use rights | A01, A05, A08, A12 | INV-06, 10, 11, 12 |

## A01 — Configuration and methodology

Validate immutable run/configuration hashes, separate trial/official identity, supported currency and universe, explicit benchmark proxy, limits, calendar/version, fill convention, fees/slippage, rounding and finite budgets. Unapproved defaults remain unresolved launch prerequisites. No real-money mode, broker account or arbitrary financial endpoint exists.

Test methodology amendments and archived run selection: a losing run cannot be silently replaced or reset. Public calculations cite a methodology version. Fixture/provider modes cannot be relabelled by a worker or request body inconsistent with run configuration.

## A02 — Contract and REST correctness

Both repositories pass identical version-pinned golden schemas and signature vectors. Cover every event, reference, error, receipt, snapshot, artifact and pagination response. Reject unknown fields/versions, duplicate JSON keys, invalid Unicode/numbers, excessive nesting, wrong run identity and content conflicts.

Atomic batch, identical retry, concurrent retry, repeated event in a new batch, changed-content conflict, missing dependency, out-of-order activity, contiguous financial journal, stale snapshot and corrected historical valuation all have deterministic expected results. Receipt acknowledgement never causes another paper trade.

## A03 — Discussion and artifact completeness

Show a real contribution's original author/time/topic/reply relationship, distinguish system activity and owner interjections, preserve dissent and link exact synthesis versions. All experiment deliverables appear as published or explicit safe withheld/awaiting/failed/withdrawn entries; none vanish because they were inconvenient.

Navigate the complete source → report → discussion → decision → order/receipt → review chain. Verify content hash and exact-version URLs after restart and correction. Old decisions retain old versions. Missing/uploading/withdrawn bytes never become broken or unauthorized downloads. Public summaries are labelled derivatives, not invented verbatim conversations.

## A04 — Public experience

A visitor can explain BotSquad, the experiment's purpose/goal, simulated money, source delays and the distinction between teamwork and returns. Introductory content is available without waiting for a live feed. Actual participating roster and truthful current/queued/idle/unknown status are visible.

Test desktop, tablet and 390px mobile, keyboard/focus, reduced motion, non-color-only charts, readable long reports, chart tables, export, pagination and all empty/error/stale/withheld/ended states. New messages do not steal scroll position. Hidden tabs back off. No fake typing, fixture returns disguised as real, stock-tip claims or guaranteed profits.

Preserve protected Motion pages, both hostnames, tutorial canonical/hashes/image URLs, navigation and both existing website build paths. No visitor tracking/account feature is introduced incidentally.

## A05 — Ledger, orders and risk

Replay journal to exact cash/quantity/basis and returns using fixed-point arithmetic. Bound numeric magnitude and checked intermediate multiplication/division to prevent overflow. Test half-even rounding, final-position basis residue, partial/full sale, slippage/fees, reservations, competing buys, reserved shares, zero/negative/overflow inputs and rejected insufficient funds.

Test semantic order idempotency even when a model repeats the intent with a new request ID. Exact proposal revision/review must match the order. Check position/sector ceilings on admission and fill, pending orders, price guards, overnight gaps, stale/incomplete risk marks, cancelled/expired orders and unknown instruments.

Test no-lookahead: decision after the cutoff cannot fill at the earlier known opening price; delayed data retains actual processing time. Splits do not generate profit, dividends accrue/pay once, adjusted prices do not double count actions, ticker changes preserve identity, and unsupported mergers/delistings stop misleading valuation. Benchmark uses documented matched timing and dividend convention; excess return is not labelled alpha.

## A06 — Security and publication boundaries

Exercise missing/invalid/expired/revoked credentials; wrong method/path/body/digest/authority; nonce replay; rotated keys; cross-run/event-class mismatch; anonymous receipt GET; unauthorized admin/withdrawal; body/page/rate quota; and safe error/log output. A public receiver response must not become an HQ command or model prompt.

Inject adversarial article text requesting secret export, unrelated artifact publication or grant expansion. Verify denial by trusted scope, not reliance on the model refusing. Public group contexts cannot inherit private direct-conversation or other-project history. Research access and group membership alone cannot publish.

Test staged-content hash guessing, path traversal, arbitrary URL-fetch requests, dangerous Markdown/links, active HTML/SVG uploads, fake MIME, excessive image dimensions/decompression, oversized bodies and CSV formulas. Public content downloads honor visibility and cache invalidation. No private signing key or HQ administrative endpoint appears in browser responses or logs.

## A07 — Crash, ambiguity and recovery

| Failure window | Required result |
| --- | --- |
| HQ before ledger transaction commits | No financial effect or publication record |
| HQ after ledger/outbox commit, before send | Exactly one durable effect; pending delivery resumes |
| Receiver after commit, before HTTP response | Receipt reconciliation/identical retry; no duplicate record |
| Bytes staged, metadata uncommitted | Nonpublic orphan; no broken public link |
| Artifact metadata accepted, referring message delayed | Stable artifact exists; dependent event can retry |
| Snapshot arrives before financial predecessor | Explicit dependency block; no false complete balance |
| Grant revoked while request is pending | Stop future attempts/delivery; retain already-transmitted outcome evidence |
| Run pause races with fill | Serialized outcome: prior committed fill retained or pending order cancelled |
| Receiver unavailable for extended interval | Durable bounded backlog, visible stale state, stop-new-risk threshold |
| Disk full or corrupted content | No partial accepted record; owner attention and integrity failure |
| Restore older HQ / two publishers | Generation/lease and remote-watermark reconciliation block divergence |
| Receiver restore changes cursor continuity | New archive epoch and bounded client resynchronization |

Test service restart, host restart where authorized, forced context rollover and late callbacks. Existing provider uncertainty fences survive. Do not regenerate a completed analysis or order to repair publication. Verify consistent SQLite backups plus content manifests and exact hashes by isolated restore, not merely by backup-file existence.

## A08 — Real market evidence and rights

Under [Decision 029](../../decisions/decision_029_zero_cost_market_data.md), assert **US$0 incremental market-data spend**: no paid plan, paid trial, subscription, license, fee-based API fallback or account action leading to charges. Evaluate free documented APIs, public open data and only **permitted low-frequency webpage extraction/scraping**; record each source's actual automated-access permission, site restrictions, robots directives where relevant, request budget, retention, public display, redistribution, derived-data, history/archive rights and attribution requirements. Free/delayed/visible information is not automatically redistributable or automatically scrapeable. Check no bypass of access controls, paywalls, CAPTCHAs or anti-bot restrictions. Document unknown permissions as explicit blocks, not assumed authorization.

For each intended public field—including simulated fill prices, holdings, benchmark/portfolio series, derived returns, JSON and historical charts—verify the source permits the associated disclosure. Run negative tests showing that a restricted source or missing right causes a withheld/limited public projection, not automatic release or paid substitution.

An actually permitted **free read-only observation** should confirm available raw opening/close fields, source times, availability delay and instrument identity. Test holidays, early closes, DST, unexpected closures, halts, stale bars, provider corrections, corporate actions, rate limits, site-layout changes and unavailable/conflicting sources. A free close-only feed cannot silently substitute for the frozen next-open fill rule; require a separately approved versioned methodology change if necessary. Verify no retrospective pricing, made-up values, default-to-paid calls or unauthorized scraping on failure. Fresh retrieval of an old article is not recent news. Research text never supplies the execution price.

## A09 — Existing-system preservation

Migration creates zero grants, workers, schedules, runs or model work. Compare retained identities/history/permissions before and after an isolated migration and any approved deployment. Existing engineering, direct conversations, working groups, mandates, public research, startup navigation and native API behavior remain compatible.

Run investment work alongside unrelated eligible work: preserve two global execution slots, one per worker, hierarchy/role checks, cancellation, fairness and all consumed budgets. Existing Task/provider bindings must not silently adopt incompatible tools. Website packaging and unrelated sites remain untouched.

Documentation links, requirement IDs, statuses, source paths and current-versus-proposed claims remain consistent. Each change updates the appropriate normative document rather than creating contradictory duplicate specifications.

## A10 — Genuine organizational behavior

Use actual authorized workers with an open enough question to choose research, participants and conclusions. Require substantive response to another worker's evidence or objection, attributable artifacts, an independently reviewed proposal and a meaningful scheduled later review using intervening observations. Preserve unresolved concerns rather than fake consensus.

Separate synthesis, decision, order and receipt. Validate authentic source timestamps and no hindsight editing. A HOLD may satisfy decision acceptance; deterministic fill tests independently prove accounting. No scripted profitable purchase, manufactured dissent or retry-until-good transcript selection.

Real elapsed scheduling and context continuity must be observed. A changed or confirmed later strategy should cite the prior decision and new evidence. Measure human interventions and actual usage where available; do not call the system unattended when the operator repaired its decisions or timing.

## A11 — Forward trial

Use a distinct private trial run with authorized live inputs and finite duration/budget. At least two actual operating cycles and a scheduled review are required; the proposed longer observation window is in the roadmap. Real elapsed sessions cannot be replaced by accelerated clocks.

Retain all trades/HOLDs, missed deadlines, source failures, artifacts, interventions, delivery lag, corrections and expenses/unknown costs. Reconcile daily portfolio and benchmark. A poor investment result is not a software failure; accounting fabrication, missing evidence, privacy leakage or unbounded operation is.

## A12 — Release and operator handoff

Verify explicit owner deployment/activation scope, **Decision 029's zero-dollar market-data rule**, actual permitted automated source use and public/derived rights, frozen official configuration, finite grants/budgets, compatible exact commits, current server state, backups and rollback. Create a new official run; never erase trial history. Deploying code alone creates no authority.

Read back the first actual public configuration, discussion, artifact and financial records; inspect browser links/status and protected site continuity. Deliver a runbook with pause/stop/revoke/withdrawal, expiry/rotation, restore and known limitations. Publish the project's purpose, goals, methodology and distinction between coordination evidence and investment performance.

## Evidence record template

For each `docs/validation/investment/INV-NN.md`, record status/date, objective, both source commits and contract digest, environment/evidence modes, requirement IDs, checks/results, review findings, failed attempts, state preservation, actual external effects, what was not tested, blockers and next step. Never include credentials, raw private contexts or unnecessary sensitive transcripts.

The current documentation task should report only documentation checks; all acceptance above remains pending implementation.
