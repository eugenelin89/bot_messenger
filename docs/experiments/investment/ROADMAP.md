# Investment showcase — prompt-by-prompt build roadmap

**Version:** 1.0 | **Updated:** 2026-10-06 | [Design guide](README.md)

**Implementation status:** All build packets below are planned. Documentation is not implementation, deployment, publication consent or authority to spend money. Use experiment-local `INV` identifiers; this is not core Prompt 12. Personal Operator reliability work and existing security boundaries remain in force.

## How to use this roadmap

Run one packet at a time with the [shared prompt launcher](../../../prompts/investment-experiment.md). Read its linked specifications, inspect current code and previous evidence, implement only that packet, validate it, and record the handoff before proceeding. A packet may be split as `INV-05A`, `INV-05B` when necessary; retain its original acceptance requirements and mark the parent incomplete until all children pass.

The documentation here is the cross-repository source of truth. BotSquad code belongs in `eugenelin89/bot_messenger`; the receiver and public page belong in `eugenelin89/asymmetri`. Follow each repository's own AGENTS/Git/release workflow. Never assume both repos use the same branch policy or that one commit deploys both.

Do not run all packets autonomously from this roadmap. Owner selection of a build packet authorizes that task's code work, not provider purchases, live grants, deployment or official launch. Those effects need explicit scope in the implementation request. Existing accounts/credentials must be discovered through approved mechanisms, never copied into prompts or repositories.

## Dependency and status table

| Packet | Deliverable | Repository | Depends on | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| INV-01 | Frozen contracts, configuration and feasibility gate | BotSquad; read-only website review | Design baseline | Planned | — |
| INV-02 | Authenticated public receiver and durable archive | Asymmetri | 01 | Planned | — |
| INV-03 | Artifact publication and discussion archive | Asymmetri | 02 | Planned | — |
| INV-04 | Complete public showcase using labelled fixtures | Asymmetri | 03 | Planned | — |
| INV-05 | Deterministic HQ paper simulator | BotSquad | 01 | Planned | — |
| INV-06 | Structured market evidence and calendar adapter | BotSquad | 05; provider gate | Planned | — |
| INV-07 | Scoped HQ publisher and durable delivery | BotSquad | 01–03, 05 | Planned | — |
| INV-08 | Real investment-team capability and discussion integration | BotSquad | 05–07 | Planned | — |
| INV-09 | Daily operating loop and owner controls | BotSquad | 08 | Planned | — |
| INV-10 | Cross-system, security and recovery acceptance | Both | 04, 06–09 | Planned | — |
| INV-11 | Private forward-running paper trial | Both | 10; trial authorization | Planned | — |
| INV-12 | Explicit public activation and operator handoff | Both | 11; launch authorization | Planned | — |

The website fixture track (02–04) and simulator track (05–06) can proceed independently after 01 with separate writers/checkouts. The default owner-facing sequence is the numbered order. Do not build a polished financial dashboard while leaving genuine discussion or linked artifacts to an unspecified later phase.

## Common completion contract

Each packet supplies: exact starting and ending commit(s); changed files; implemented requirement IDs; focused and regression checks; actual-versus-fixture evidence; review findings/dispositions; preserved production state; remaining limitations; and the next packet's prerequisites. Record these under `docs/validation/investment/INV-NN.md` in BotSquad, linking website evidence and exact commit when applicable. This directory is a planned output, not pre-existing evidence.

A useful status is “implemented, not deployed” or “blocked by data rights,” not an unsupported “complete.” No runtime tests are claimed from documentation review; no real-worker acceptance from stubs; no official public experiment from a synthetic demo. Never require profits or a predetermined BUY to pass acceptance.

### Gates

- **G0 — Contract-ready:** strict schemas/fixtures, authority boundaries and unresolved launch configuration documented.
- **G1 — Public surface-ready:** API, artifact/discussion archive and accessible showcase work with clearly labelled fixtures.
- **G2 — Simulator-ready:** ledger, data quality, calendar, actions and benchmark pass deterministic and provider checks.
- **G3 — Organization-ready:** genuine scoped workers discuss, produce artifacts, decide and review under enforced bounds.
- **G4 — Recovery-ready:** both systems survive ambiguity/restart/revocation without duplicate financial effects or private disclosure.
- **G5 — Trial-ready:** authorized private trial has valid data rights and bounded costs; not an official experiment.
- **G6 — Public-ready:** explicit owner-approved configuration, audience, budget, data rights, deployment and start record.

## INV-01 — Contracts and feasibility

**Outcome:** Future implementers can build against one stable contract and know which real-world prerequisites are still missing.

**Read:** [Architecture](ARCHITECTURE.md), [Simulation rules](SIMULATION_RULES.md), [API](PUBLIC_API.md), [API security](API_SECURITY_AND_DELIVERY.md), [Decisions](DECISIONS.md), repository AGENTS and current capability/scheduler code.

**Work:** Verify both repository baselines, actual Task/worker/group/artifact types and shared execution limits. Read website production/CLI/build documentation. Read-only SSH inspection is allowed only when the selected task explicitly includes it. Record receiver host capacity, existing Node versions, a supported minimal SQLite/runtime choice, service isolation and build portability. Confirm the exact data provider's internal/automated/display/redistribution/derived-data/retention rights and costs from primary sources; do not buy or subscribe.

Create versioned JSON Schema/OpenAPI, shared types and golden fixtures covering every event, receipt, error, order, valuation and artifact relationship. Include signature/canonicalization vectors, version compatibility and duplicate/conflict cases. Store canonical contract artifacts under a documented BotSquad directory and define how the website vendors the exact version/hash. Freeze synthetic test configuration; retain owner choices as unresolved launch gates, not silent defaults.

**Acceptance:** A01, A02, A06, A09, A12 in [Validation](VALIDATION.md). All R01–R08 map to later gates. Contract tests reject unknown/identity-bearing fields and unsupported versions. Provider rights or runtime uncertainty is explicitly blocked. Fixture work may pass G0 while live-data/public gates remain blocked.

**Not included:** Application implementation beyond contract validation fixtures; production grants, purchases, accounts, service changes or active runs.

**Codex task:** “Execute INV-01 only. Produce the contract/feasibility package, test its golden fixtures, update open decisions and handoff evidence. Do not infer launch consent or build subsequent packets.”

## INV-02 — Public REST receiver

**Outcome:** A fake authorized publisher can safely write durable public records through the Asymmetri experiment API.

**Work:** Vendor the exact contract; implement a small separately owned receiver with additive SQLite migrations, explicit publisher/run scope, signed requests, atomic event/receipt/read-model writes, bounded public reads and health endpoints. Keep runtime data outside Git. Implement financial watermark/dependency checks and immutable identity conflicts. Add fake local keys/identities for tests only; no production key material in fixtures. Provide disabled-by-default deployment templates and a compatibility-safe website read interface.

**Acceptance:** A02, A06, A07, A09. Duplicate and concurrent retries create one accepted record. Invalid/revoked/wrong-run writes fail; receipt GET remains authenticated. Older snapshots do not overwrite newer ones; missing financial predecessors do not become complete public state. Restart preserves records and receipts. Existing site builds remain intact.

**Not included:** HQ worker activity, live data, visitor accounts, a generic CMS or production deployment unless separately requested.

**Handoff:** Receiver commit, contract digest, migration version, exact route behavior, local test evidence and explicitly unconfigured production settings.

**Codex task:** “Execute INV-02 only in the Asymmetri repository using the version-pinned BotSquad contract. Implement and validate the bounded receiver; preserve existing site/runtime boundaries and leave production publication disabled.”

## INV-03 — Artifacts and discussion archive

**Outcome:** Discussion messages can link to permanent, safe, exact-version deliverables.

**Work:** Implement content staging, hash/type/size checks, crash-safe durable bytes and metadata, artifact registry/version routes, discussion/topic relationships and human detail pages. Add withheld/awaiting/withdrawn states, approved public downloads, corrections and owner-only emergency withdrawal. No arbitrary source URL fetching or direct public directory listing. Distinguish authentic contribution records from system activity and fixture examples.

**Acceptance:** A03, A06, A07. Every fixture deliverable has an accessible exact-version link or explicit safe state. Hash guessing cannot reveal unpublished content. Crash between bytes and metadata creates no broken public link. Unsafe Markdown, script-bearing uploads, bad MIME/oversize/path traversal and formula-like export cells are handled safely. Withdrawn bytes and cached views are inaccessible after the documented invalidation process.

**Not included:** PDF/office rendering, arbitrary attachments, third-party object storage or public access to private HQ content.

**Codex task:** “Execute INV-03 only. Build the durable discussion/artifact archive and prove safe lifecycle and relationship behavior. Use clearly synthetic content and retain earlier versions and failures.”

## INV-04 — BotSquad public showcase

**Outcome:** A visitor can understand the project and inspect the entire work-to-outcome journey using clearly labelled synthetic data.

**Read:** [Product and UX](PRODUCT_AND_UX.md) is the required first-release scope.

**Work:** Add the introduction, purpose/goal, real-versus-fixture truth states, roster, Live Investment Desk, topic pages, artifact library, decisions/dissent, portfolio charts, holdings, journal, methodology and operational health. Support polling, paused auto-follow, reconnect, pagination, accessible charts/tables and loading/empty/stale/error/withheld/ended states. Link from `/botsquad` without redesigning the site. Preserve both build paths and all protected Motion routes.

**Acceptance:** A03, A04, A09. Complete keyboard/mobile/tablet/desktop review; no hidden fixture values presented as real. A reader can follow research → discussion → decision → order/receipt → review through working links. The live desk and artifact pages cannot be dropped to declare a portfolio-only MVP complete. No model executes to make the demo appear lively.

**Not included:** Official experiment announcement, visitor interaction, live-trading claims or unscheduled production publication.

**Codex task:** “Execute INV-04 only. Implement the BotSquad-first showcase exactly against the public experience specification. Demonstrate the full journey with permanent synthetic labels and document visual/accessibility evidence.”

## INV-05 — Deterministic paper simulator

**Outcome:** Trusted software, not worker prose, owns pretend cash, holdings and profit/loss.

**Work:** Add frozen run configuration, fixed-point journal, derived balances, semantic order idempotency, decision/review references, reservations, price guards, risk checks and order lifecycle. Implement weighted-average basis, rounding, corporate actions, dividend receivables/payments, benchmark accounting, quality-labelled valuations and corrections. Supply a fake deterministic clock/feed. Commit ledger effects and disabled publication outbox records atomically in the HQ database. Migrations create zero active work or authority.

**Acceptance:** A01, A05, A07, A09. Exact cash/basis/quantity replay; partial/full sales; fees/slippage; split/dividend fixtures; conflicting concurrent orders; no negative cash/shares; rejected risk; duplicate intent; crash after commit; old valuation correction; no-lookahead cutoff. Current production identities/history and scheduler behavior remain preserved.

**Not included:** Live market provider, real brokerage code, new worker roles or production simulation activation.

**Codex task:** “Execute INV-05 only. Build and thoroughly test the deterministic paper ledger against the frozen methodology. Use fixture prices and clocks, preserve additive migration safety, and never implement a real-money mode.”

## INV-06 — Market evidence and calendar

**Outcome:** Prices and corporate actions come from attributable structured observations, not an AI answer or article snippet.

**Work:** Add one approved provider adapter, stable instruments, raw-price/adjustment semantics, event/availability/retrieval times, delay/rights metadata, calendar holidays/early closes and quality/expiry behavior. Implement explicit raw opening fills and matched valuation marks; normalize supported corporate actions; halt/flag unsupported events. Store provider corrections without rewriting the original evidence. Respect request quotas and real costs.

**Acceptance:** A01, A05, A08. Fixture holiday/DST/early-close/gap/halt/correction cases; no retrospective fill after a missed cutoff; no adjusted-price double counting; missing data cannot become a confident equity number. An authorized read-only live provider probe proves field semantics and timestamps. Without rights/access, mark the live gate blocked and keep fixtures visibly separate.

**Not included:** A provider marketplace, unapproved account creation/subscription, intraday strategies, arbitrary fallback feeds or scraped-price substitution.

**Codex task:** “Execute INV-06 only. Integrate the selected licensed structured data source with explicit semantics and failure behavior. Stop the live-data gate when rights, credentials or actual field behavior cannot be verified.”

## INV-07 — HQ public publication adapter

**Outcome:** HQ can publish selected experiment records and artifacts without exposing private company state.

**Work:** Add owner UI for destination/run/audience/record classes/budgets/expiry, dry-run projection preview, consent and revocation. Implement trusted public IDs and exact origin mapping, isolated public-context exports, artifact derivatives, durable outbox, signing, dependency-ordered delivery, receipts, retries, quotas, heartbeat and backlog health. Keep signing credentials outside workers. Distinguish publisher acknowledgement from ledger execution. No existing grants silently widen.

**Acceptance:** A02, A03, A06, A07, A09. Revocation before/after transmission; lost response; repeated batch; key rotation; publication permission denied despite research/group permission; private conversation/source exclusion; artifact link only after durable bytes; receiver response cannot command HQ; staged/queued records remain safe during a long outage. Owner can see exactly what audience scope is being authorized.

**Not included:** Automatic grant activation, arbitrary HTTP tools, public HQ access, company-wide transcript export or GitHub-document-adapter permission reuse.

**Codex task:** “Execute INV-07 only. Implement the narrowly scoped publication grant and trusted durable publisher. Prove public/private separation and retry safety with an isolated receiver; leave retained production grants unchanged.”

## INV-08 — Real investment team

**Outcome:** Existing eligible BotSquad workers genuinely research, deliberate, produce evidence and make attributable paper decisions.

**Work:** Map actual workers to experiment responsibilities without changing global roles. Add the minimum owner-granted paper-adapter capability and compatible execution/tool schema. Use fresh scoped public-audience contexts and selected evidence. Integrate research, actual group contributions, immutable synthesis/artifacts, independent proposal review and typed order submission. Preserve direct-report rules and shared capacity. If an existing role cannot perform a needed task, implement and review the narrow capability explicitly rather than treating a title as permission.

**Acceptance:** A03, A05, A06, A09, A10. At least one real group exchange responds to another worker's evidence/objection; public versions are attributable to actual executions. The team chooses meaningful research and conclusions; HOLD is valid. A challenged proposal is reviewed at the same revision used by the order. Role/grant denials remain enforced, and unrelated worker context is not exported. Stubs do not pass real-worker acceptance.

**Not included:** Hiring beyond current limits, blanket research privileges, a scripted stock pick or fabricated dissent, general financial authority.

**Codex task:** “Execute INV-08 only. Connect genuine BotSquad work to the simulator and public projections in isolated state. Preserve worker identities, hierarchy and capabilities; validate substantive collaboration without scripting the investment conclusion.”

## INV-09 — Operating loop and owner controls

**Outcome:** The experiment runs on the always-on HQ without the Mac remaining awake or models polling for work.

**Work:** Bind one active run to a bounded mandate, calendar-aware due work, evidence intake, submission deadline, next-open fill job, end-of-session valuation and later outcome review. Reuse durable scheduling/dispatcher ownership. Add finite cycle/turn/research/order/run budgets, missed-run coalescing, expiry and provider backoff. Implement exact pause/stop/cancel semantics, owner attention, published status, measured usage and explicit unknown costs. Keep other projects schedulable.

**Acceptance:** A05, A07, A09, A10. Real scheduled second cycle with intervening evidence, no duplicate occurrence after restart, no late backdated order, no idle model polling, global two-slot preservation, compatible context rollover, owner pause cancels unfilled paper orders as specified, and publication revocation does not erase local trades. A model pause is not falsely described as cancelling an already committed operation.

**Not included:** Continuous intraday model monitoring, a second scheduler, unlimited recurring work or forcing every cycle to trade.

**Codex task:** “Execute INV-09 only. Complete the bounded daily company loop and precise owner controls. Prove real scheduled continuation and recovery while preserving shared resources and all existing uncertainty fences.”

## INV-10 — End-to-end and adversarial acceptance

**Outcome:** The complete system is demonstrably correct before a forward trial.

**Work:** Freeze both candidate commits and contract digests. Run the [validation matrix](VALIDATION.md) through real services using isolated state, then real workers with clearly synthetic market evidence, and only authorized live-data probes. Test rejected orders, missing data, stale observations, authentic discussions, every artifact link, duplicate/ambiguous delivery, corrupted/missing content, permission withdrawal, restart/context replacement, backups/restores and public UI truth states. Use risk-routed read-only security, recovery, architecture and test review where available.

**Acceptance:** All A01–A10 and relevant A12 checks pass; blocking findings fixed and rerun. Evidence distinguishes fixtures, actual model execution, actual elapsed scheduling and observed market facts. Retained HQ state/permissions and unrelated site routes are preserved. No claim of profitability, full autonomy or official operation.

**Not included:** Resolving a test failure by broadening authority, clearing an uncertainty fence without reconciliation, hiding a bad transcript or touching unrelated production data.

**Codex task:** “Execute INV-10 only. Validate the exact cross-repository candidates against every acceptance requirement. Retain failures and classify evidence honestly; do not mark a mocked or partial path as a successful live experiment.”

## INV-11 — Private forward paper trial

**Outcome:** Observe actual bounded team behavior over market sessions without presenting test activity as an official public run.

**Prerequisites:** Explicit trial authorization, real provider rights/access, finite budgets and an isolated trial run. The selected task must define whether the receiver is private staging or local; a production URL is not assumed private merely because it is unlinked.

**Work:** Proposed observation window is five trading sessions, owner-adjustable. Let real workers research, discuss, decide and review new observations. Record missed deadlines, HOLDs, failures, interventions, publication lag, artifacts, accounting quality and usage/cost. Require at least two genuine operating cycles with an actual scheduled review and intervening observations; do not require a profit or a pivot. Continue through a bounded planned restart when safe.

**Acceptance:** A08, A10, A11. No lookahead or invented prices; all deliverables accounted for; performance reconciles; model usage stays bounded; no private leaks; the owner can explain the team-to-result chain. Bugs produce retained evidence and an explicit fix/retest decision. Elapsed days cannot be manufactured by advancing a fake clock.

**Not included:** Official public launch, replacing trial losses, extending budgets silently or creating real trades. An assistant/Codex task must not promise unowned background work; the installed HQ scheduler owns authorized runtime activity and the operator inspects its evidence later.

**Codex task:** “Execute the authorized setup or evidence-review portion of INV-11 only, specifying which. Establish or inspect the bounded private forward trial. Report elapsed evidence honestly and leave unobserved sessions pending; do not simulate time to claim trial completion.”

## INV-12 — Public activation and handoff

**Outcome:** Start a clearly described official paper experiment with auditable consent and reliable operating procedures.

**Prerequisites:** G0–G5 passed; explicit owner instruction to deploy/activate the official run; frozen capital/universe/benchmark/risk/horizon; publication audience and expiry; data rights; cost budget; final copy/disclosures; verified backup/restore; exact website and HQ release candidates.

**Work:** Follow each repository's real release workflow, inspect server state, preserve existing data and protected site routes, deploy receiver compatibility before publisher changes, and verify exact identities. Create a new official run rather than reset the trial. Activate separately scoped paper/research/publication authority, publish configuration and initial cash state, then verify actual discussion, artifact, decision and valuation links. Publish methodology and limitations with realistic freshness labels. Supply owner runbook, emergency pause/revoke/withdrawal procedure, key rotation and rollback instructions.

**Acceptance:** A01–A12, G6. Public page explains BotSquad first, shows actual authorized work, labels all simulation/delay information, retains trial history separately and exposes no HQ/private control. Initial public receipt/read-back, artifact integrity, routing compatibility and normal/paused/stale states are verified. The owner receives exact commits, configuration hash, run ID, active grants/expiry, budgets and outstanding limitations, without secrets.

**Not included:** Real-money capability, profit guarantees, silent rule amendments, unsupported “fully autonomous” claims or indefinite authority. A deployment alone never starts the experiment.

**Codex task:** “Execute INV-12 only after confirming the explicit deployment and activation instruction and all launch prerequisites. Start the new official paper run with preserved history, verify the complete public evidence chain, and deliver the operator handoff. Otherwise leave the launch blocked with precise missing gates.”

## Later, deliberately deferred

Consider SSE only after polling is reliable; intraday marks/trading only after licensing and methodology review; richer risk metrics only with adequate observations; additional strategies only with distinct run/configuration identities; object storage only after capacity need; new file formats only after safe rendering design. Public comments, brokerage execution, financial credentials, multi-company/federation and general publishing platforms are not implicit follow-ups.

## Updating this roadmap

For each packet, change the status table once and link its evidence file. Preserve original requirements and failed checks. Record amendments in [Decisions](DECISIONS.md). When implementation changes a design, update that subject's normative document and shared contract together rather than add contradictory notes here. Do not mark the full experiment complete while any required introduction, discussion, artifact, accounting, privacy or recovery gate is missing.
