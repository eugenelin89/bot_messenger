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
