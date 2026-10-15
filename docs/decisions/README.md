# Decision Records

Durable product, architecture, security, data, and workflow decisions belong here.

For a fresh chat or Codex task, first read [Project Memory](../PROJECT_MEMORY.md), then
verify current implementation/status against the repository. For future milestone order,
use the [canonical roadmap](../product/ROADMAP.md) and Decision 026’s current priority,
which clarifies Decision 017. Prompts 01–10 are complete; Prompt 11 is complete within
bounded supervised scope; Personal Operator stabilizations 01–03 are complete and deployed.
See [specification navigation](../../prompts/README.md). Historical decision bodies retain
their acceptance-time wording; current interpretations below do not rewrite those records.

## Rules

- Use filenames `decision_NNN_<slug>.md`.
- Decisions are append-preserving history.
- If a later decision changes an earlier one, mark the old decision as superseded/partially superseded and link both directions.
- Do not create a decision record for every implementation detail.
- Record a decision when future agents would otherwise be likely to reopen or accidentally violate an important choice.

## Current decisions

| ID | Decision | Status | Date |
| --- | --- | --- | --- |
| [001](decision_001_local_first_control_plane.md) | Local-first control plane | Partially superseded / clarified by 009 | 2026-09-24 |
| [002](decision_002_messages_do_not_grant_authority.md) | Messages do not grant authority | Accepted | 2026-09-24 |
| [003](decision_003_codex_first_runtime.md) | Codex is the first executable runtime adapter | Accepted | 2026-09-24 |
| [004](decision_004_delegated_worker_creation.md) | Delegated worker creation with an authority ceiling | Accepted | 2026-09-24 |
| [005](decision_005_rename_to_botsquad.md) | Rename product from Bot Messenger to BotSquad | Accepted | 2026-09-24 |
| [006](decision_006_bounded_computer_use.md) | Computer Use is a bounded, preferably sandboxed capability | Accepted | 2026-09-24 |
| [007](decision_007_prompt_01_runtime_and_recovery.md) | Prompt 01 App Server, bounded authority and recovery | Accepted | 2026-09-25 |
| [008](decision_008_managed_engineering.md) | Managed engineering, independent review and tested integration | Accepted | 2026-09-25 |
| [009](decision_009_ubuntu_bootstrap.md) | Ubuntu HQ uses a checked-in Codex bootstrap prompt | Accepted | 2026-09-25 |
| [010](decision_010_multi_company_federation.md) | Companies are isolated first-class domains with explicit federation | Accepted future constraints; priority deferred by 017 | 2026-09-25 |
| [011](decision_011_ubuntu_hq_profiles.md) | Ubuntu service, Linux confinement and worker AI profiles | Accepted and validated | 2026-09-26 |
| [012](decision_012_ios_remote_client.md) | Native clients use a stable authenticated API and private remote-access layer | Partially implemented by 015; iOS/transport deferred | 2026-09-25 |
| [013](decision_013_trusted_worker_infrastructure.md) | Trusted approvals, Nix and isolated worker infrastructure | Implemented; Ubuntu validated | 2026-09-26 |
| [014](decision_014_generalized_projects.md) | Generalized software Projects, scoped revisions, integration and remote lifecycle | Implemented; Ubuntu validated | 2026-09-28 |
| [015](decision_015_remote_client_trust.md) | Stable client API, explicit device trust, durable retries and reconnect | Implemented; Ubuntu/restart/reboot validated | 2026-09-29 |
| [016](decision_016_intelligent_company_model.md) | Intelligent company operating model; hierarchy governs authority, not thought | Accepted north star; bounded slices implemented in 018/021/022/025 | 2026-09-29 |
| [017](decision_017_single_company_first.md) | One operational company first; runtime continuity, durable scheduling and Asymmetri Motion pilot | Accepted foundation; milestones 07–11 complete (11 supervised); sequencing clarified by 026 | 2026-09-29 |
| [018](decision_018_conversations_context_continuity.md) | Direct conversations, bounded replies and scoped provider-context continuity | Implemented; Prompt 07 acceptance complete | 2026-09-29 |
| [019](decision_019_near_term_worker_empowerment.md) | Useful worker capabilities and standing authority as a very near-term priority | Accepted priority; WE-01 slice complete; broader empowerment deferred | 2026-09-29 |

## Current deployment interpretation

Decision 009 is the deployment-direction authority: BotSquad moved from the Prompt 01/02 workstation-local topology to the implemented always-on, self-hosted Ubuntu headquarters.

Decision 001 remains important for control-plane ownership and persistence, but its term **local-first** now means operator-controlled/self-hosted state rather than “must run on the operator's laptop.”

Historical Prompt 01/02 decisions and validation records should remain unchanged unless a later decision explicitly supersedes their architectural lesson. They describe what was actually validated at those milestones.

Decision 010 defines deferred multi-company/federation boundaries. The implementation
through Prompt 11 and stabilizations 01–03 remains one company per data directory and does not implement those
boundaries, Telegram or external identities. Decision 011 records the Ubuntu/service/profile
choices and their real-runtime acceptance evidence; Decision 013 records the trusted
approval, Nix, provisioner and isolated worker-infrastructure boundary. Decision 014
extends engineering to generalized Projects, scoped revision/review, durable integration,
trusted non-root remote publication and evidence-preserving archive.

Decision 015 implements the protocol/device foundation of Decision 012. Decision 012 retains the future native-client direction: an iOS app is a first-class
BotSquad client, the HQ remains private by default, and remote transport/authentication
are explicit layers rather than public exposure of the current loopback web service.

Decision 016 defines the product north star after Prompt 06: BotSquad should behave like
a company of persistent intelligent employees able to handle broad or specific mandates,
communicate and deliberate across hierarchy, make attributable decisions, operate in
iterative evidence-driven cycles and take initiative within trusted authority. It does
not grant financial/external authority; those require separate enforced capability and
policy layers.

## Current product priority and continuation

Decision 017 makes **one useful operating AI company** the priority before multi-company
or federation. It extends 016 and supersedes the previous post-Prompt-10 future order,
without discarding Decision 010's eventual isolation/security constraints.

Prompt 07 delivered runtime-context rollover; Prompt 09 delivered a minimal durable
scheduler and both broad-mandate and Asymmetri Motion reference acceptance. Prompt 11
completed a small practical single-company capability set and bounded supervised live pilot. The old future
11–14 multi-company/collaboration/Telegram/federation assignments are deferred/unnumbered.

The [milestone index](../../prompts/milestones/README.md) links the actual implementation,
acceptance and deployment records; Decision 026 now prioritizes unnumbered Personal Operator work.
Read [Single-Company Business Operations](../product/SINGLE_COMPANY_OPERATIONS.md) and
[Milestone Prompt Requirements](../../prompts/authoring/MILESTONE_REQUIREMENTS.md) when generating
future work. Maintain [Project Memory](../PROJECT_MEMORY.md) when accepted decisions or
verified milestone state change so the project can continue after a chat context ends.

Decision 019 requested useful worker tools, public research and standing authority after
Prompt 07. WE-01 completed the first slice under Decision 020 before Prompt 08. Broader
empowerment remains deferred; deployed capabilities require separate explicit owner grants.

## Decision 020 — Scoped public research and standing knowledge authority

[Decision 020](decision_020_scoped_public_research.md) implements the first Decision 019
slice: separate owner grants, an isolated existing-account live-search broker, bounded
HTTPS source reading, durable scoped evidence, asynchronous receipts and compatible
session transitions. Acceptance and retained activation remain explicit separate facts.

- [Decision 021 — Bounded working groups and scoped deliberation](decision_021_bounded_working_groups.md) — accepted; real Ubuntu acceptance and production deployment verified.

- [Decision 022 — Bounded strategic mandates and durable company clock](decision_022_company_operating_loop.md) — accepted; actual broad/two-cycle Ubuntu acceptance and production deployment verified.


- [Decision 023 — Risk-routed read-only Codex specialist subagents](decision_023_codex_specialist_subagents.md) — accepted development workflow; parent remains sole writer/integrator.

- [Decision 024 — Bounded browser-first Computer Use](decision_024_bounded_computer_use.md) — accepted, implemented and deployed; C10-1 and delivery evidence recorded in Prompt 10 validation.

## Prompt 11 bounded implementation

| ID | Decision | Status | Date |
| --- | --- | --- | --- |
| [025](decision_025_bounded_business_operations.md) | Exact supervised business actions and attributable outcome review | Complete within bounded supervised scope | 2026-10-06 |

## Current priority after Prompt 11

- [Decision 026 — Single-owner Personal Operator stabilization before further feature expansion](decision_026_personal_operator_stabilization.md) — accepted October 6, 2026. Clarifies Decision 017 sequencing: Prompt 11 is complete for bounded supervised scope; the current unnumbered phase prioritizes one owner's daily reliability/usability. No automatic Prompt 12. Capability expansion resumes only from demonstrated need or explicit owner priority.

## Owner-requested experimental design — investment showcase

[Decision 027](decision_027_public_investment_showcase_design.md) records the October 6 owner request for a public paper-investment demonstration of BotSquad. The [design guide](../experiments/investment/README.md) and [detailed INV-01–INV-12 roadmap](../experiments/investment/ROADMAP.md) cover genuine live team discussion, durable public artifacts, a deterministic simulated portfolio and scoped REST publication to Asymmetri.co.

This is a design-only experimental track, not core Prompt 12, deployed functionality or a new production grant. Personal Operator stabilization and the existing private/financial authority boundaries remain unchanged. Use the [single-packet Codex launcher](../../prompts/experiments/investment-showcase.md) only when the owner selects the next implementation task.

## Ask BotSquad amendment

[Decision 028](decision_028_ask_botsquad_public_questions.md) partially amends Decision 027's read-only-visitor/publication-only scope. The owner adds a public-access chat for general or transaction-specific questions answered by one relevant actual employee. The [Ask specification](../experiments/investment/ASK_BOTSQUAD.md) defines routing, anonymous-session privacy, scoped outbound HQ question retrieval, independent local quotas and no investment action authority. The [four Ask packets](../experiments/investment/ASK_BOTSQUAD_ROADMAP.md) are integrated before INV-10 in the existing status roadmap.

The investment archive stays public/read-only, while Q&A is separately session-authorized and private by default. No visitor question or chat answer becomes company memory, an investment observation or public artifact automatically. This is a design amendment only; implementation, provider-use checks and explicit public-service activation remain future gates.

## Owner market-data budget amendment — Investment Showcase

[Decision 029 — Zero-cost market-data sourcing](decision_029_zero_cost_market_data.md) records the owner's October 9, 2026 instruction: **US$0 incremental market-data acquisition/licensing budget**, with free APIs and permitted low-frequency website scraping. It supersedes the conditional paid-provider recommendation in INV-01 as the implementation direction, without rewriting its historical findings or relaxing requirements for source automation, storage, public/derived use, attribution, price integrity or no-lookahead fills. If compliant free data cannot support a particular feature, that feature's live/public gate stays blocked; no paid substitution or unauthorized scraping.

Every future investment-showcase Codex prompt must review Decision 029, the [investment decision register](../experiments/investment/DECISIONS.md), the [market observation rules](../experiments/investment/SIMULATION_RULES.md#7-market-observations-and-licensing) and the [current investment roadmap](../experiments/investment/ROADMAP.md), via the [shared launcher](../../prompts/experiments/investment-showcase.md). Investment and Ask public-service model/infrastructure budgets remain separately controlled.


## Owner infrastructure exception — Investment Showcase

[Decision 030 — Defer Ubuntu migration](decision_030_defer_ubuntu_migration.md)
records cancellation of INFRA-01, verified deletion of its migration snapshot and
retention of the current Ubuntu 22.10 host under a time-limited risk exception.
Review before future deployment/public exposure; do not restore an automatic LTS
prerequisite. [INFRA-02](../validation/investment/INFRA-02.md) subsequently completed
owner-authorized private installation and actual-host synthetic acceptance. The
receiver remains stopped/default disabled with no real authority or public ingress.
Public activation gates remain explicit; contract 1.0 and Decision 029 are unchanged.

## Deterministic paper accounting — INV-05

[Decision 031](decision_031_deterministic_paper_simulator.md) records the synthetic-only simulator, schema15, exact accounting, replay/valuation provenance and disabled private projection. [INV-05 evidence](../validation/investment/INV-05.md) records local acceptance; integration does not deploy or activate it.

## Trusted market evidence — INV-06

[Decision032](decision_032_market_evidence_boundary.md) separates source permissions, scheduled calendars, immutable evidence and one-shot collection from workers/accounting. Synthetic integration is implemented; live price permissions/semantics and public financial rights remain blocked. The [authorized sequence](../exec-plans/investment-autonomous-sequence-06-09.md) permits source work through INV-09 without production activation.

## Scoped synthetic publisher — INV-07

[Decision 033](decision_033_scoped_investment_publisher.md) records owner preview/consent, opt-in bounded capture, opaque public projections, immutable schema17, signed delivery/current-head restore fencing and explicit v1 coverage limitations. [Acceptance](../validation/investment/INV-07.md) remains source/synthetic-only and partial; no production authority follows.

## Scoped investment team — INV-08

[Decision034](decision_034_scoped_investment_team.md) records owner-scoped existing employees, mandatory bounded runtime entry, exact source/proposal/review attribution, BUY publication admission and committed public derivatives. [Evidence](../validation/investment/INV-08.md) is partial source acceptance; actual employee runs and production remain held.

## Finite investment operating loop — INV-09

[Decision035](decision_035_finite_investment_loop.md) binds one immutable team/run to exact finite calendar stages, permanent usage reservations, measured/unknown costs and precise run controls through the existing scheduler. [Evidence](../validation/investment/INV-09.md) distinguishes isolated source acceptance from pending genuine/live cycles.

## Subscription activity and usage reporting

[Decision036](decision_036_subscription_activity_usage.md) amends034/035 with a separately approved private activity policy and common usage/reference-cost reporting. Pinned Codex admission remains blocked; [acceptance](../validation/investment/INV-SUBSCRIPTION-USAGE.md) distinguishes fake local controls from provider feasibility.

- [Decision 037 — Credit-approved supervised private pilot](decision_037_credit_approved_private_pilot.md): dated owner exception for existing credits/internal retries, four total turns in disposable private synthetic state; no ordinary activation.

## Owner-selected private financial source

- [Decision 038 — Yahoo Finance for private personal research](decision_038_yahoo_finance_private_source.md): accepted owner selection of Yahoo and preferred Python `yfinance` adapter behind the planned controlled Financial Data Gateway. Permission is **owner-reported verbal permission for personal use**, with no independently verified writing or broader grant. Separately assess automation/retention and public redistribution; US$0 and HQ-READY-02 synthetic acceptance remain intact. [HQ-READY-03](../validation/investment/HQ-READY-03.md) now has source/fake acceptance; live data and operational authority remain blocked.

- [Decision039 — One-shot private Yahoo qualification](decision_039_one_shot_yahoo_qualification.md): owner-selected HQ-READY-03B admission/custody, reviews and integrated-source gates before a single bounded non-model probe; no ongoing authority.

- [Decision040 — Separate one-shot Yahoo connectivity](decision_040_one_shot_yahoo_connectivity.md): HQ-READY-03D owner approval for one minimal GET with independent private custody and non-data receipts; no rearm of03B, financial reads or ongoing authority.

- [Decision041 — Separate one-shot AAPL history qualification](decision_041_one_shot_aapl_history.md): HQ-READY-03E, one historical operation/six requests, independent one-use custody; prior authorities remain spent.

- [Decision042 — Offline Yahoo bootstrap compatibility](decision_042_yahoo_bootstrap_compatibility.md): narrow fixture-only cookie404 correction with original status and parent cookie validation; no new live authority or rearm. [03F acceptance](../validation/investment/HQ-READY-03F.md) and [future proposal](../operations/YAHOO_AAPL_QUALIFICATION_PROPOSAL.md) distinguish authored success from unqualified actual access.

- [Decision043 — Yahoo qualification feasibility](decision_043_yahoo_qualification_feasibility.md): HQ-READY-03G withholds live admission at the independent technical-evidence gate; distinct offline custody integration and a direct-chart proposal create no owner authority.

- [Decision044 — One-shot direct Yahoo chart qualification](decision_044_one_shot_direct_yahoo_chart.md): HQ-READY-03H, captured-response parsing without bootstrap, distinct one-request private authority and unchanged spent historical approvals.

- [Decision045 - Private financial evidence in normal employee research](decision_045_private_employee_financial_research.md): HQ-READY-04A source integration through existing employees, discussions, dispatcher and finite authority; separate collection/AI-processing consent, historical-only evidence, independent critique/revision and finite private retention. Genuine Linux/collection/model acceptance remains a separate operational gate.

- [Decision046 — Explicit fresh-research recovery release](decision_046_fresh_research_recovery_release.md): HQ-READY-04C adds a digest-bound owner action for untouched future approved drafts, using existing external journal receipts/custody. No new allowance or live approval.

- [Decision047 — Persistent observed paper investment](decision_047_persistent_observed_paper_investment.md): owner-reported Yahoo confirmation, new prospective method, continuing ledger and finite renewed authority; acceptance pending.

- [Decision048 — Private Ask content custody](decision_048_private_ask_content_custody.md): passive Company metadata and separate finite-retention raw SQLite custody, immutable import/answer identities, atomic private outbox, deletion and uncertainty recovery; dormant and not employee or delivery authority.

- [Decision049 — Private Ask authority custody](decision_049_private_ask_authority_custody.md): separate finite metadata grants, immutable attempts, independent consumed-budget custody and named receipt reconciliation; dormant, with no operational initializer, runtime permit or public admission.

- [Decision050 — Ask subscription activity limits](decision_050_ask_subscription_activity_limits.md): accepted explicit monitored-threshold/unknown-cost mode preserving strict variants, with durable cross-grant threshold holds; bounded source and pinned candidate consumer review pass, operational integration remains separate.

- [Decision051 — Separate Ask API route and closed launch](decision_051_ask_api_launch.md): pinned stateless public-question adapter, independent priced custody and pause, privacy cleanup after expiry, and one-use same-generation clean restart. Implementation/deployment are authorized; API expense and genuine acceptance remain pending.

- [Decision052 — Retained research and prospective close recovery](decision_052_retained_research_close_recovery.md): explicit owner request for today's new decision and paper trade, one exact historical-usage exception, preserved consumption and prospective regular CLOSE; technical release evidence required. ASK stays paused.
- [Decision053 — Owner-authorized observed renewal](decision_053_owner_observed_renewal.md): seven additional attempts after two exactly retained settled gaps, independent admission baseline and prospective next-session research; old consumption remains visible and no uncertain outcome is waived.

- [Decision054 — Observed source continuation](decision_054_observed_source_continuation.md): one exact known OHLC research failure, retained successes, unspent requests and two future starts under the same allowance, with explicit missingness and no affected-instrument order.

- [Decision055 — Observed model continuation](decision_055_observed_model_continuation.md): bounded same-turn input correction and one owner-authorized fresh decision after a retained settled failure, with cumulative allowance and completed-only publication.
