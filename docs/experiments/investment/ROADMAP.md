# Investment showcase — prompt-by-prompt build roadmap

**Version:** 1.4 | **Updated:** 2026-10-09 | [Design guide](README.md)

**Implementation status:** INV-01 contracts and INV-02 Asymmetri REST receiver/archive are implemented and validated locally; INV-03 onward and all Ask packets remain planned. The receiver is default disabled and not deployed. Documentation is not implementation, deployment, publication consent or authority to spend money. Use experiment-local `INV` identifiers; this is not core Prompt 12. Personal Operator reliability work and existing security boundaries remain in force.

**Ask BotSquad amendment:** R09 adds general and transaction-context public questions answered by one relevant real employee. Read [the feature specification](ASK_BOTSQUAD.md) and [the four detailed Ask packets](ASK_BOTSQUAD_ROADMAP.md). They amend the original read-only-visitor scope through [Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md), without granting visitors investment or owner authority. The status table below remains authoritative for both tracks.

**Owner market-data decision:** [Decision 029 — zero-cost sourcing](../../decisions/decision_029_zero_cost_market_data.md) fixes the investment experiment's market-data budget at **US$0 incremental spend**, with free APIs and permitted low-frequency webpage scraping/extraction. Paid Tiingo or other fee-based access is **not** an approved fallback. Source automation and public/derived data rights remain separately required; missing permission or reliable prices blocks affected live/public features, not local synthetic work.

## How to use this roadmap

Run one packet at a time with the [shared prompt launcher](../../../prompts/experiments/investment-showcase.md). **Every future showcase Codex prompt must explicitly require review of Decision 029, DECISIONS.md, SIMULATION_RULES.md and this roadmap before editing**, including Asymmetri/Ask/website prompts that could affect public market-derived data. Read linked specifications, inspect current code and previous evidence, implement only that packet, validate it, and record the handoff before proceeding. A packet may be split as `INV-05A`, `INV-05B` when necessary; retain its original acceptance requirements and mark the parent incomplete until all children pass.

The documentation here is the cross-repository source of truth. BotSquad code belongs in `eugenelin89/bot_messenger`; the receiver and public page belong in `eugenelin89/asymmetri`. Follow each repository's own AGENTS/Git/release workflow. Never assume both repos use the same branch policy or that one commit deploys both.

Do not run all packets autonomously from this roadmap. Owner selection of a build packet authorizes that task's code work, not provider purchases, live grants, deployment or official launch. Those effects need explicit scope in the implementation request. Existing accounts/credentials must be discovered through approved mechanisms, never copied into prompts or repositories.

## Dependency and status table

| Packet | Deliverable | Repository | Depends on | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| INV-01 | Frozen contracts, configuration and feasibility gate | BotSquad; read-only website review | Design baseline including R09 | Complete, not deployed | [INV-01 evidence](../../validation/investment/INV-01.md) |
| INV-02 | Authenticated public receiver and durable archive | Asymmetri | 01 | Complete, not deployed | [INV-02 evidence](../../validation/investment/INV-02.md) |
| INV-03 | Artifact publication and discussion archive | Asymmetri | 02 | Planned | — |
| INV-04 | Complete public showcase using labelled fixtures | Asymmetri | 03 | Planned | — |
| INV-05 | Deterministic HQ paper simulator | BotSquad | 01 | Planned | — |
| INV-06 | Zero-cost free-source market evidence, permitted scraping and calendar adapter | BotSquad | 05; Decision 029 and source-use/quality gate | Planned | — |
| INV-07 | Scoped HQ publisher and durable delivery | BotSquad | 01–03, 05 | Planned | — |
| INV-08 | Real investment-team capability and discussion integration | BotSquad | 05–07 | Planned | — |
| INV-09 | Daily operating loop and owner controls | BotSquad | 08 | Planned | — |
| INV-ASK-01 | Q&A contract, private session queue and abuse controls | Both | INV-01, INV-02 | Planned | — |
| INV-ASK-02 | HQ question retrieval, routing and actual employee answers | BotSquad | ASK-01, INV-07, INV-08 | Planned | — |
| INV-ASK-03 | General/contextual public chat interface | Asymmetri; HQ checks | ASK-02, INV-03, INV-04 | Planned | — |
| INV-ASK-04 | Q&A security, privacy, fairness and recovery acceptance | Both | ASK-03, INV-09 | Planned | — |
| INV-10 | Cross-system, security and recovery acceptance | Both | 04, 06–09, ASK-04 | Planned | — |
| INV-11 | Private forward-running paper trial and visitor-Q&A exercise | Both | 10; trial authorization | Planned | — |
| INV-12 | Explicit public activation and operator handoff | Both | 11; portfolio and Ask launch authorization | Planned | — |

The website fixture track (02–04) and simulator track (05–06) can proceed independently after 01 with separate writers/checkouts. The default sequence is INV-01–INV-09, INV-ASK-01–INV-ASK-04, then INV-10–INV-12. Earlier parallel Ask work may follow its actual dependencies. Do not build a polished financial dashboard while leaving genuine discussion, linked artifacts or the newly requested employee Q&A to an unspecified later phase.

## Common completion contract

Each packet supplies: exact starting and ending commit(s); changed files; implemented requirement IDs; focused and regression checks; actual-versus-fixture evidence; review findings/dispositions; preserved production state; remaining limitations; and the next packet's prerequisites. Record these under `docs/validation/investment/INV-NN.md` or `INV-ASK-NN.md` in BotSquad, linking website evidence and exact commit when applicable. INV-01 and INV-02 evidence now exists; later packet evidence remains to be produced.

A useful status is “implemented, not deployed” or “blocked by data rights,” not an unsupported “complete.” No runtime tests are claimed from documentation review; no real-worker acceptance from stubs; no official public experiment from a synthetic demo. Never require profits or a predetermined BUY to pass acceptance. A separate chatbot falsely labelled as an employee cannot pass Ask acceptance.

### Gates

- **G0 — Contract-ready:** strict portfolio and Q&A schemas/fixtures, authority boundaries and unresolved launch configuration documented.
- **G1 — Public surface-ready:** API, artifact/discussion archive and accessible showcase work with clearly labelled fixtures.
- **G2 — Simulator-ready:** ledger, data quality, calendar, actions and benchmark pass deterministic and **permitted zero-cost source** checks, without assumed paid feeds.
- **G3 — Organization-ready:** genuine scoped workers discuss, produce artifacts, decide and review under enforced bounds.
- **G-ASK — Employee Q&A-ready:** actual relevant-employee general/contextual answers; session privacy, independent HQ quotas, no action authority and safe recovery proven by ASK-A01–ASK-A12.
- **G4 — Recovery-ready:** both systems survive ambiguity/restart/revocation without duplicate financial effects, duplicated accepted answers or private disclosure.
- **G5 — Trial-ready:** authorized private trial has valid free-source automated-use rights and reliable observations, US$0 market-data charges, and separately bounded non-data costs; not an official experiment.
- **G6 — Public-ready:** explicit owner-approved configuration, audience, budgets, **zero-dollar market-data acquisition and verified public/derived use rights**, privacy settings, deployment and separate portfolio/Ask activation records.

## INV-01 — Contracts and feasibility

**Outcome:** Future implementers can build against one stable contract and know which real-world prerequisites are still missing.

**Read:** [Architecture](ARCHITECTURE.md), [Simulation rules](SIMULATION_RULES.md), [API](PUBLIC_API.md), [API security](API_SECURITY_AND_DELIVERY.md), [Ask BotSquad](ASK_BOTSQUAD.md), [Decisions](DECISIONS.md), repository AGENTS and current capability/scheduler code.

**Work:** Verify both repository baselines, actual Task/worker/group/artifact types and shared execution limits. Read website production/CLI/build documentation. Read-only SSH inspection is allowed only when the selected task explicitly includes it. Record receiver host capacity, existing Node versions, a supported minimal SQLite/runtime choice, service isolation and build portability. Confirm the exact data provider's internal/automated/display/redistribution/derived-data/retention rights and costs from primary sources; do not buy or subscribe. Also verify the configured AI runtime/provider can serve anonymous third-party questions under the owner's approved account/plan; developer access alone is not clearance for a public service.

Create versioned JSON Schema/OpenAPI, shared types and golden fixtures covering every event, receipt, error, order, valuation and artifact relationship. Include signature/canonicalization vectors, version compatibility and duplicate/conflict cases. Include the separate Q&A namespace, session-owned visibility and question/answer identity in the contract plan; INV-ASK-01 completes its executable intake/lease/privacy cases. Store canonical contract artifacts under a documented BotSquad directory and define how the website vendors the exact version/hash. Freeze synthetic test configuration; retain owner choices as unresolved launch gates, not silent defaults.

**Acceptance:** A01, A02, A06, A09, A12 in [Validation](VALIDATION.md), plus Ask contract and provider-use requirements. All R01–R10 map to applicable later gates; R10 is a post-INV-01 owner decision and is required for future source/publication implementation. Contract tests reject unknown/identity-bearing fields and unsupported versions. Provider rights or runtime uncertainty is explicitly blocked. Fixture work may pass G0 while live-data/public-service gates remain blocked.

**Not included:** Application implementation beyond contract validation fixtures; production grants, purchases, accounts, service changes or active runs.

**Codex task:** “Execute INV-01 only. Produce the contract/feasibility package including the Ask amendment, test its golden fixtures, update open decisions and handoff evidence. Do not infer launch consent or build subsequent packets.”

INV-01 handoff: contract 1.0 is ready to vendor for local disabled INV-02. Host OS/disk remediation is a deployment gate; market rights and Ask-account approval gate later live operation. **Decision 029, accepted after INV-01, supersedes the former conditional paid-provider recommendation without altering historic evidence or wire contract 1.0.** None authorizes starting the next packet automatically.

## INV-02 — Public REST receiver

**Outcome:** A fake authorized publisher can safely write durable public records through the Asymmetri experiment API.

**Work:** Vendor the exact contract; implement a small separately owned receiver with additive SQLite migrations, explicit publisher/run scope, signed requests, atomic event/receipt/read-model writes, bounded public reads and health endpoints. Keep runtime data outside Git. Implement financial watermark/dependency checks and immutable identity conflicts. Add fake local keys/identities for tests only; no production key material in fixtures. Provide disabled-by-default deployment templates and a compatibility-safe website read interface. Keep the public-only archive structurally separate from the later private Q&A store.

**Acceptance:** A02, A06, A07, A09. Duplicate and concurrent retries create one accepted record. Invalid/revoked/wrong-run writes fail; receipt GET remains authenticated. Older snapshots do not overwrite newer ones; missing financial predecessors do not become complete public state. Restart preserves records and receipts. Existing site builds remain intact.

**Not included:** HQ worker activity, live data, visitor accounts, a generic CMS or production deployment unless separately requested. Public-question intake belongs to INV-ASK-01, not this publication permission.

**Handoff:** Receiver commit, contract digest, migration version, exact route behavior, local test evidence and explicitly unconfigured production settings.

**Codex task:** “Execute INV-02 only in the Asymmetri repository using the version-pinned BotSquad contract. Implement and validate the bounded receiver; preserve existing site/runtime boundaries and leave production publication disabled.”

INV-02 handoff: [Asymmetri implementation 457f935](https://github.com/eugenelin89/asymmetri/commit/457f9354b3f8daf5c4c75b8f5ac1946433da3ce0), migration 001, exact contract manifest `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`. **183/183 local synthetic tests pass on Node 22.23.1 and 24.10.0**, both website builds and production audits pass, and three independent read-only reviewers accepted the corrected source. INV-03 local work is ready on a new explicit request; public downloads/pages and all production activation remain deferred. See the [complete evidence and deployment gates](../../validation/investment/INV-02.md).

## INV-03 — Artifacts and discussion archive

**Outcome:** Discussion messages can link to permanent, safe, exact-version deliverables.

**Work:** Implement content staging, hash/type/size checks, crash-safe durable bytes and metadata, artifact registry/version routes, discussion/topic relationships and human detail pages. Add withheld/awaiting/withdrawn states, approved public downloads, corrections and owner-only emergency withdrawal. No arbitrary source URL fetching or direct public directory listing. Distinguish authentic contribution records from system activity and fixture examples. Investment-team artifact completeness never automatically publishes visitor Q&A or visitor-specific attachments.

**Acceptance:** A03, A06, A07. Every fixture deliverable has an accessible exact-version link or explicit safe state. Hash guessing cannot reveal unpublished content. Crash between bytes and metadata creates no broken public link. Unsafe Markdown, script-bearing uploads, bad MIME/oversize/path traversal and formula-like export cells are handled safely. Withdrawn bytes and cached views are inaccessible after the documented invalidation process.

**Not included:** PDF/office rendering, arbitrary attachments, third-party object storage or public access to private HQ content.

**Codex task:** “Execute INV-03 only. Build the durable discussion/artifact archive and prove safe lifecycle and relationship behavior. Use clearly synthetic content and retain earlier versions and failures.”

## INV-04 — BotSquad public showcase

**Outcome:** A visitor can understand the project and inspect the entire work-to-outcome journey using clearly labelled synthetic data.

**Read:** [Product and UX](PRODUCT_AND_UX.md) and the explicit [Ask experience amendment](ASK_BOTSQUAD.md) define the revised first-release scope.

**Work:** Add the introduction, purpose/goal, real-versus-fixture truth states, roster, Live Investment Desk, topic pages, artifact library, decisions/dissent, portfolio charts, holdings, journal, methodology and operational health. Support polling, paused auto-follow, reconnect, pagination, accessible charts/tables and loading/empty/stale/error/withheld/ended states. Link from `/botsquad` without redesigning the site. Preserve both build paths and all protected Motion routes. Reserve the general Ask page, embedded panel and contextual buttons using clearly labelled disabled/fixture states; actual visitor chat is implemented in the Ask packets.

**Acceptance:** A03, A04, A09. Complete keyboard/mobile/tablet/desktop review; no hidden fixture values presented as real. A reader can follow research → discussion → decision → order/receipt → review through working links. The live desk and artifact pages cannot be dropped to declare a portfolio-only MVP complete. No model executes to make the demo appear lively. Do not claim the inactive Ask scaffold can answer questions.

**Not included:** Official experiment announcement, actual public-question processing before the Ask gates, live-trading claims or unscheduled production publication.

**Codex task:** “Execute INV-04 only. Implement the BotSquad-first showcase against the public experience specification and reserve the Ask entry points. Demonstrate the journey with permanent synthetic labels and document visual/accessibility evidence.”

## INV-05 — Deterministic paper simulator

**Outcome:** Trusted software, not worker prose, owns pretend cash, holdings and profit/loss.

**Work:** Add frozen run configuration, fixed-point journal, derived balances, semantic order idempotency, decision/review references, reservations, price guards, risk checks and order lifecycle. Implement weighted-average basis, rounding, corporate actions, dividend receivables/payments, benchmark accounting, quality-labelled valuations and corrections. Supply a fake deterministic clock/feed. Commit ledger effects and disabled publication outbox records atomically in the HQ database. Migrations create zero active work or authority.

**Acceptance:** A01, A05, A07, A09. Exact cash/basis/quantity replay; partial/full sales; fees/slippage; split/dividend fixtures; conflicting concurrent orders; no negative cash/shares; rejected risk; duplicate intent; crash after commit; old valuation correction; no-lookahead cutoff. Current production identities/history and scheduler behavior remain preserved.

**Not included:** Live market provider, real brokerage code, new worker roles or production simulation activation.

**Codex task:** “Execute INV-05 only. Build and thoroughly test the deterministic paper ledger against the frozen methodology. Use fixture prices and clocks, preserve additive migration safety, and never implement a real-money mode.”

## INV-06 — Market evidence and calendar

**Outcome:** Prices and corporate actions come from attributable **zero-cost, permitted, verifiable free resources or low-frequency website extraction**, not an AI answer or article snippet.

**Work:** Follow [Decision 029](../../decisions/decision_029_zero_cost_market_data.md) and [simulation section 7](SIMULATION_RULES.md#7-market-observations-and-licensing). Evaluate free documented APIs, open data and limited permitted scraping/structured extraction; select no paid source or trial. Record site/API automation, retention, public/derived/archive rights, attribution, rate limits, source fields and reliability evidence. Implement a provider-independent bounded collector with stable instruments, raw-price/adjustment semantics, original event/availability/retrieval times, deterministic field validation, optional explicitly versioned fallback sources, caching/rate backoff, calendar holidays/early closes, quality/expiry and layout-change detection. Preserve the planned no-lookahead next-open rule unless an explicit approved methodology revision changes it; a free close-only source does not authorize inventing a raw open. Normalize supported corporate actions; halt/flag unsupported events and retain provider corrections.

**Acceptance:** A01, A05, A08. Fixture holiday/DST/early-close/gap/halt/correction cases; no retrospective fill after a missed cutoff; no adjusted-price double counting; missing or conflicting free-source data cannot become a confident equity number. Use a **permitted no-cost read-only observation** to prove field semantics, market timestamps, rate/backoff and layout-change handling where possible. Record separate automation/internal/retention/public-derived rights for public output; if unverified, mark that gate blocked. Tests also prove no fallback to a paid service, an unpermitted scraper or a made-up substitute fill.

**Not included:** Paid providers, trials that can bill, purchases, unapproved accounts, scraping behind access restrictions or against source permissions, high-volume extraction, a provider marketplace, intraday strategies, arbitrary fallback providers, or substituting closing/article prices for the defined opening fill.

**Codex task:** “Execute INV-06 only. First read Decision 029, DECISIONS.md, SIMULATION_RULES.md and this roadmap. Build a zero-market-data-cost adapter using free APIs and permitted bounded scraping, with source/rights provenance, quality checks and honest unavailability. Never buy a feed or relax the frozen fill model without a separate owner-approved change. Block live/public outputs when rights or data cannot be verified.”

## INV-07 — HQ public publication adapter

**Outcome:** HQ can publish selected experiment records and artifacts without exposing private company state.

**Work:** Add owner UI for destination/run/audience/record classes/budgets/expiry, dry-run projection preview, consent and revocation. Implement trusted public IDs and exact origin mapping, isolated public-context exports, artifact derivatives, durable outbox, signing, dependency-ordered delivery, receipts, retries, quotas, heartbeat and backlog health. Keep signing credentials outside workers. Distinguish publisher acknowledgement from ledger execution. No existing grants silently widen. The independent Ask pull/answer adapter may reuse tested transport code, not this grant's authority.

**Acceptance:** A02, A03, A06, A07, A09. Revocation before/after transmission; lost response; repeated batch; key rotation; publication permission denied despite research/group permission; private conversation/source exclusion; artifact link only after durable bytes; receiver response cannot command HQ; staged/queued records remain safe during a long outage. Owner can see exactly what audience scope is being authorized.

**Not included:** Automatic grant activation, arbitrary HTTP tools, public HQ access, company-wide transcript export or GitHub-document-adapter permission reuse. No anonymous question may be imported through an ordinary publication receipt.

**Codex task:** “Execute INV-07 only. Implement the narrowly scoped publication grant and trusted durable publisher. Prove public/private separation and retry safety with an isolated receiver; leave retained production grants unchanged.”

## INV-08 — Real investment team

**Outcome:** Existing eligible BotSquad workers genuinely research, deliberate, produce evidence and make attributable paper decisions.

**Work:** Map actual workers to experiment responsibilities without changing global roles. Add the minimum owner-granted paper-adapter capability and compatible execution/tool schema. Use fresh scoped public-audience contexts and selected evidence. Integrate research, actual group contributions, immutable synthesis/artifacts, independent proposal review and typed order submission. Preserve direct-report rules and shared capacity. If an existing role cannot perform a needed task, implement and review the narrow capability explicitly rather than treating a title as permission.

**Acceptance:** A03, A05, A06, A09, A10. At least one real group exchange responds to another worker's evidence/objection; public versions are attributable to actual executions. The team chooses meaningful research and conclusions; HOLD is valid. A challenged proposal is reviewed at the same revision used by the order. Role/grant denials remain enforced, and unrelated worker context is not exported. Stubs do not pass real-worker acceptance.

**Not included:** Hiring beyond current limits, blanket research privileges, a scripted stock pick or fabricated dissent, general financial authority. Public-service employee contexts and routing belong to INV-ASK-02; visitor conversations never become investment evidence by default.

**Codex task:** “Execute INV-08 only. Connect genuine BotSquad work to the simulator and public projections in isolated state. Preserve worker identities, hierarchy and capabilities; validate substantive collaboration without scripting the investment conclusion.”

## INV-09 — Operating loop and owner controls

**Outcome:** The experiment runs on the always-on HQ without the Mac remaining awake or models polling for work.

**Work:** Bind one active run to a bounded mandate, calendar-aware due work, evidence intake, submission deadline, next-open fill job, end-of-session valuation and later outcome review. Reuse durable scheduling/dispatcher ownership. Add finite cycle/turn/research/order/run budgets, missed-run coalescing, expiry and provider backoff. Implement exact pause/stop/cancel semantics, owner attention, published status, measured usage and explicit unknown costs. Keep other projects schedulable and preserve priority over bounded public Q&A when time-sensitive work is due.

**Acceptance:** A05, A07, A09, A10. Real scheduled second cycle with intervening evidence, no duplicate occurrence after restart, no late backdated order, no idle model polling, global two-slot preservation, compatible context rollover, owner pause cancels unfilled paper orders as specified, and publication revocation does not erase local trades. A model pause is not falsely described as cancelling an already committed operation.

**Not included:** Continuous intraday model monitoring, a second scheduler, unlimited recurring work or forcing every cycle to trade.

**Codex task:** “Execute INV-09 only. Complete the bounded daily company loop and precise owner controls. Prove real scheduled continuation and recovery while preserving shared resources and all existing uncertainty fences.”

## INV-ASK-01 through INV-ASK-04 — Ask BotSquad

Use the complete [Ask build packets](ASK_BOTSQUAD_ROADMAP.md), not a second copy of their requirements here. They cover the private anonymous queue/contract, HQ retrieval and relevant real-employee answer, general/contextual interface, and security/privacy/capacity/recovery acceptance. Run exactly one selected packet using the shared launcher.

G-ASK requires genuine answers to general and transaction-specific questions, appropriate follow-ups and actual identity changes when a handoff is needed. A visitor may request an explanation, not a trade or private context. Session privacy, local HQ budget enforcement and no automatic influence on investment memory are mandatory. The feature's ASK-A01–ASK-A12 complement, rather than replace, the base acceptance matrix.

## INV-10 — End-to-end and adversarial acceptance

**Outcome:** The complete system is demonstrably correct before a forward trial.

**Work:** Freeze both candidate commits and contract digests. Run the [base validation matrix](VALIDATION.md) and [Ask acceptance](ASK_BOTSQUAD.md#10-acceptance-and-launch-prerequisites) through real services using isolated state, then real workers with clearly synthetic market evidence, and only authorized live-data probes. Test rejected orders, missing data, stale observations, authentic discussions, every artifact link, duplicate/ambiguous delivery, corrupted/missing content, permission withdrawal, restart/context replacement, backups/restores and public UI truth states. Add real general/contextual questions, session isolation, injection, denial of action authority, lease/result ambiguity and Ask traffic during investment deadlines. Use risk-routed read-only security, recovery, architecture and test review where available.

**Acceptance:** All A01–A10, ASK-A01–ASK-A11 and relevant A12/ASK-A12 checks pass; blocking findings fixed and rerun. Evidence distinguishes fixtures, actual model execution, actual elapsed scheduling and observed market facts. Retained HQ state/permissions and unrelated site routes are preserved. No claim of profitability, universal expertise, full autonomy or official operation.

**Not included:** Resolving a test failure by broadening authority, clearing an uncertainty fence without reconciliation, hiding a bad transcript or touching unrelated production data.

**Codex task:** “Execute INV-10 only. Validate the exact cross-repository candidates, including Ask BotSquad, against every acceptance requirement. Retain failures and classify evidence honestly; do not mark a mocked or partial path as a successful live experiment.”

## INV-11 — Private forward paper trial

**Outcome:** Observe actual bounded team behavior over market sessions without presenting test activity as an official public run.

**Prerequisites:** Explicit trial authorization, real **permitted zero-cost source** access and separately checked public/derived rights where publication is involved, finite non-data budgets and an isolated trial run. The selected task must define whether the receiver is private staging or local; a production URL is not assumed private merely because it is unlinked. Authorize private Ask test sessions and provider use separately; no general public admission yet.

**Work:** Proposed observation window is five trading sessions, owner-adjustable. Let real workers research, discuss, decide and review new observations. Record missed deadlines, HOLDs, failures, interventions, publication lag, artifacts, accounting quality and usage/cost. Require at least two genuine operating cycles with an actual scheduled review and intervening observations; do not require a profit or a pivot. Continue through a bounded planned restart when safe. Exercise general, transaction-specific, follow-up and disallowed-action visitor questions while observing shared capacity, session privacy and the absence of contamination of investment evidence.

**Acceptance:** A08, A10, A11 and ASK-A11 with all other Ask safety gates retained. No lookahead or invented prices; all investment deliverables accounted for; performance reconciles; model usage stays bounded; no private leaks; the owner can explain the team-to-result and question-to-employee chains. Bugs produce retained evidence and an explicit fix/retest decision. Elapsed days cannot be manufactured by advancing a fake clock.

**Not included:** Official public launch, replacing trial losses, extending budgets silently or creating real trades. An assistant/Codex task must not promise unowned background work; the installed HQ scheduler owns authorized runtime activity and the operator inspects its evidence later.

**Codex task:** “Execute the authorized setup or evidence-review portion of INV-11 only, specifying which. Establish or inspect the bounded private forward trial with the agreed Ask test traffic. Report elapsed evidence honestly and leave unobserved sessions pending; do not simulate time to claim trial completion.”

## INV-12 — Public activation and handoff

**Outcome:** Start a clearly described official paper experiment and Ask BotSquad service with auditable consent and reliable operating procedures.

**Prerequisites:** G0–G5 and G-ASK passed; explicit owner instruction to deploy/activate the official run and public-question service; frozen capital/universe/benchmark/risk/horizon; publication audience and expiry; **Decision 029's US$0 market-data budget, actual permitted automated collection and public/derived archival rights**; model-provider-use rights; separate finite investment/Ask cost budgets; final copy/disclosures, session/retention/moderation settings; verified backup/restore; exact website and HQ release candidates.

**Work:** Follow each repository's real release workflow, inspect server state, preserve existing data and protected site routes, deploy receiver compatibility before publisher changes, and verify exact identities. Create a new official run rather than reset the trial. Activate separately scoped paper/research/publication and Ask authority, publish configuration and initial cash state, then verify actual discussion, artifact, decision and valuation links. Verify one authorized real general question and one contextual question through the visitor interface without disclosing session contents publicly. Publish methodology and limitations with realistic freshness labels. Supply owner runbook, emergency investment pause, independent Ask shutoff, revoke/withdraw/delete procedures, key rotation and rollback instructions.

**Acceptance:** A01–A12, ASK-A01–ASK-A12 and G6. Public page explains BotSquad first, shows actual authorized work and employee replies, labels all simulation/delay information, retains trial history separately and exposes no HQ/private control or other visitor conversations. Initial public receipt/read-back, artifact integrity, routing compatibility and normal/paused/stale/Ask-capacity states are verified. The owner receives exact commits, configuration hash, run ID, active grants/expiry, budgets, privacy defaults and outstanding limitations, without secrets.

**Not included:** Real-money capability, profit guarantees, silent rule amendments, unsupported “fully autonomous” or unlimited-chat claims or indefinite authority. Deployment alone never starts either investment operation or anonymous model work. A disabled Ask feature may be deployed, but the revised full showcase cannot be called complete until its explicit gate passes.

**Codex task:** “Execute INV-12 only after confirming explicit deployment, portfolio and Ask activation scope and all launch prerequisites. Start the new official paper run and bounded public-question service with preserved history, verify both evidence chains, and deliver the operator handoff. Otherwise leave the relevant activation blocked with precise missing gates.”

## Later, deliberately deferred

Consider SSE only after polling is reliable; intraday marks/trading only after licensing and methodology review; richer risk metrics only with adequate observations; additional strategies only with distinct run/configuration identities; object storage only after capacity need; new file formats only after safe rendering design. Ask BotSquad is now in scope through its own packets. Global public chatrooms, public transcript sharing, visitor-driven investment work, brokerage execution, financial credentials, multi-company/federation and general publishing platforms are not implicit follow-ups.

## Updating this roadmap

For each packet, change the status table once and link its evidence file. Preserve original requirements and failed checks. Record amendments in [Decisions](DECISIONS.md) and applicable ADRs. When implementation changes a design, update that subject's normative document and shared contract together rather than add contradictory notes here. Do not mark the full experiment complete while any required introduction, discussion, artifact, Ask, accounting, privacy or recovery gate is missing.
