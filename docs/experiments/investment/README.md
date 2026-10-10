# BotSquad Investment Team — design and build guide

**Version:** 1.7 | **Updated:** 2026-10-09

**Status:** INV-01 through INV-04 are implemented and synthetically validated. [INV-04 evidence](../../validation/investment/INV-04.md) pins the complete showcase source, Engineering Journal and local browser acceptance. The website is not deployed; the schema002 receiver remains privately installed, stopped/default disabled. [INV-05 evidence](../../validation/investment/INV-05.md) records the synthetic-only HQ simulator, exact accounting, recovery and schema15 preservation; [INV-06 evidence](../../validation/investment/INV-06.md) records source-only synthetic market/calendar acceptance and an identifier-only live probe; actual price/public-rights gates remain blocked. INV-07–09 source work is owner-authorized under the [sequence ledger](../../exec-plans/investment-autonomous-sequence-06-09.md); later investment and all Ask packets remain planned. Public activation, real HQ publishing and market operations remain disabled.

**Counterpart implementation:** [Asymmetri website/receiver](https://github.com/eugenelin89/asymmetri) owns the independently disabled public archive and the complete INV-04 *source-only* interface; the [cross-repo integration map](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md), [receiver runbook](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md) and [INV-04 website evidence](https://github.com/eugenelin89/asymmetri/blob/main/docs/INV-04-VALIDATION.md) link the actual implementation. This BotSquad repository owns the [canonical contract](../../../contracts/investment/v1/PROTOCOL.md) and the implemented synthetic-only HQ simulator, future permitted market sources and publisher. Neither repository automatically deploys the other; the nine contract files are pinned and verified, not fetched at runtime. INV-07 is the next authorized source packet after reviewed INV-06 integration; the public Ask preview is not a working chat service.

The separate [infrastructure checkpoints](ROADMAP.md#separate-infrastructure-checkpoints)
record INFRA-01 migration cancelled/deferred and verified cleanup/snapshot deletion.
The existing Ubuntu 22.10 server remains under the time-limited
[owner exception](../../decisions/decision_030_defer_ubuntu_migration.md). INFRA-02
was explicitly selected and privately accepted on it. No Django retirement or real publisher activation occurred. The owner separately selected
INV-03 and INV-04; no later packet starts automatically.

## The idea

Show an actual BotSquad organization doing useful, persistent work. Its first public experiment is a simulated stock-investment team: workers research public information, discuss alternatives, challenge proposals, make accountable decisions and review outcomes. A deterministic simulator keeps the pretend money honest. Asymmetri.co gives visitors a readable, near-live window into the team, its work and the results.

**BotSquad is the product being demonstrated. Investment performance is one observable outcome, not the sole definition of success.** Genuine discussion and linked artifacts are first-release requirements, not optional dashboard enhancements. **Ask BotSquad** adds a direct visitor conversation: ask a general question or ask about a specific transaction, and one relevant actual employee responds.

**Owner-approved market-data policy:** [Decision 029](../../decisions/decision_029_zero_cost_market_data.md) fixes the incremental market-data budget at **US$0**. The experiment must use free APIs and permitted low-frequency web extraction/scraping, with real-source provenance and separately verified public-display rights. INV-01's paid-provider market survey is historical research only; no paid provider is approved.

## Owner requirements

| ID | Requirement |
| --- | --- |
| R01 | Start with an owner-selected amount of pretend money; simulate stock purchases and sales. |
| R02 | Research markets, companies and news, with sources and understandable buy/sell/hold explanations. |
| R03 | Show portfolio value, gains/losses, transaction history and relevant charts. |
| R04 | Publish ongoing updates from BotSquad HQ to an authenticated REST API on Asymmetri.co. |
| R05 | Clearly describe the project, purpose, goal and BotSquad capabilities on display. |
| R06 | Display real, attributable team discussion in a live panel; preserve browsable discussion history. |
| R07 | Give every investment-team deliverable an artifact link and retain an accessible public copy, or an explicit safe withheld record. |
| R08 | Maintain a detailed design and incremental prompt-by-prompt roadmap in this repository. |
| R09 | Offer Ask BotSquad: public access to general or transaction-specific questions, one relevant real employee answer per question, evidence links and contextual follow-up. |
| R10 | Market-data acquisition must cost US$0 incrementally: free APIs/permitted low-frequency scraping with reliable timestamped observations; no paid fallback, no unpermitted automated access, and no public/derived display without applicable rights. |

Earlier suggestions of $100,000, USD, universe size, sector limits, schedule and benchmark are proposed defaults, not owner-confirmed settings. **The US$0 market-data budget is confirmed, not a suggestion.** Free-source selection and public rights verification remain open. See [Decisions](DECISIONS.md). Ask-specific quotas, retention and provider-use approval are likewise launch decisions, not activated defaults.

## Documentation map

| Document | Single source of truth for |
| --- | --- |
| [Product and public experience](PRODUCT_AND_UX.md) | Purpose, page hierarchy, live desk, visitor journeys and charts |
| [Architecture](ARCHITECTURE.md) | Repository responsibilities, integration, ownership and trust boundaries |
| [Simulation rules](SIMULATION_RULES.md) | Orders, accounting, market evidence, risk, benchmark and metrics |
| [Contract 1.0](../../../contracts/investment/v1/PROTOCOL.md) | Canonical schema/OpenAPI, generated types, fixtures, signature/hash profile and vendor pinning |
| [Public API](PUBLIC_API.md) | Portfolio-publication resources, event payloads, artifact references and version compatibility |
| [API security and delivery](API_SECURITY_AND_DELIVERY.md) | Publication signing, authorization, atomic acceptance, ordering, receipts, retries and errors |
| [Publication and artifacts](PUBLICATION_AND_ARTIFACTS.md) | Public investment audience consent, discussion export, file storage, versions and withdrawals |
| [Ask BotSquad](ASK_BOTSQUAD.md) | General/contextual chat, employee routing, private Q&A protocol, abuse controls and ASK acceptance |
| [Ask build packets](ASK_BOTSQUAD_ROADMAP.md) | Detailed INV-ASK-01 through INV-ASK-04 scope and handoffs |
| [Team and operations](TEAM_AND_OPERATIONS.md) | Investment worker fit, grants, daily loop, controls, backup and recovery |
| [Validation](VALIDATION.md) | Base requirement-linked acceptance, failure and security scenarios |
| [Detailed build roadmap](ROADMAP.md) | All INV and INV-ASK dependencies, implementation status and evidence |
| [Decisions](DECISIONS.md) | Resolved design choices, open configuration and amendments |
| [References](REFERENCES.md) | Baseline repository evidence and primary external references; Ask adds its checked sources in its own specification |

Read the product guide, Ask specification, architecture and roadmap. **Every future investment-showcase Codex prompt must review Decision 029, DECISIONS.md, SIMULATION_RULES.md section 7 and ROADMAP.md**, including Asymmetri website/publication and Ask tasks. Implementers then read the relevant technical specifications before running one build packet. The [prompt launcher](../../../prompts/experiments/investment-showcase.md) supplies shared instructions. The [original documentation execution plan](../../exec-plans/investment-experiment-design.md) and [Ask amendment plan](../../exec-plans/ask-botsquad-design.md) record design-only work.

## Version 1.1 amendment and precedence

[Ask BotSquad section 2](ASK_BOTSQUAD.md#2-explicit-amendment-to-the-original-design) and [Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) explicitly amend the original no-public-interaction/publication-only assumptions. General-purpose public commands remain prohibited. A visitor may request one scoped answer, not trade, assign Tasks or administer the company.

The portfolio publication channel stays one-way. A separate HQ-initiated outbound pull imports untrusted website questions under its own local grant. Q&A uses a private session store and separate `/api/ask/v1` contract; no visitor chat is added to the public investment archive, live team discussion or company memory. Read this amendment with any unchanged version-1.0 document. It changes only those named boundaries, not ledger accounting, core APIs or previously accepted permissions.

## Existing capabilities versus planned work

The original reviewed BotSquad baseline is `ce99212c882327ad8e04fd3603867ac18428e1a4`; this amendment was based on main `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5` with intervening Personal Operator work preserved. Persistent workers, Tasks, private conversations, working groups, scoped research, artifacts, mandates and scheduling do not by themselves implement the proposed paper ledger, public publisher or anonymous employee Q&A adapter.

The reviewed Asymmetri website has a Next.js production site, a `/botsquad` product page and documented Mac-to-server deployment access. INV-02 implements the isolated experiment API/archive; INFRA-02 installs and validates it privately, stopped/default disabled. INV-03 adds artifact/discussion/record pages in source, without releasing the public website.
INV-04 now completes the labelled synthetic showcase, exact evidence journey, charts/tables/exports, holdings, journal, health and static disabled Ask preview in source and local validation. Private chat storage and actual employee Ask answers remain planned. The [INFRA-02 record](../../validation/investment/INFRA-02.md) links dated actual-host evidence; documentation alone is not a new SSH verification. See [References](REFERENCES.md).

## First-release boundary

One owner, one company, one simulated portfolio, one published experiment and one documented **primary free market-data source**, with only explicit, versioned, rights-verified fallback sources. Visitors may read the showcase and use **Ask BotSquad** through bounded anonymous-session chat. They cannot command trades, assign work, post into the investment discussion, administer workers or browse private company/other visitor data. There is no brokerage integration, real-money mode, public HQ listener or required visitor account.

The first release includes the introduction, actual roster, genuine live team discussion, durable investment artifact pages, decisions and dissent, holdings, benchmark/performance/drawdown charts, transaction journal, methodology, freshness/health and general/contextual Ask BotSquad. Visitor chats are private to their session by default, not public broadcasts; the operator/provider processing and retention are disclosed. Competing portfolios, intraday trading, SSE, arbitrary uploads, global public chatrooms and public Q&A sharing remain later options.

Use experiment-local IDs `INV-01`–`INV-12` and `INV-ASK-01`–`INV-ASK-04`. These do not create core Prompt 12 or renumber completed milestones. Planning does not displace Personal Operator reliability work or activate financial, publication or public-question authority. Implementation begins only through later owner-selected tasks.

## Updating the design

Each topic has one normative home above. Link rather than duplicate fields and rules. Portfolio API fields belong in `PUBLIC_API.md`, publication delivery in `API_SECURITY_AND_DELIVERY.md`, calculations in `SIMULATION_RULES.md`, Ask behavior/protocol in `ASK_BOTSQUAD.md`, and all implementation status in `ROADMAP.md`.

Each build prompt updates its roadmap row, evidence links and affected specification. Record exact tested commits for both repositories; never claim an atomic cross-repository deployment. Durable scope/security changes require an ADR. After official launch, methodology changes require a visible versioned amendment or a new run. Q&A cannot revise historical investment reasoning.

Status vocabulary: **Planned**, **In progress**, **Implemented, not validated**, **Validated, not deployed**, **Deployed, not activated**, **Active**, **Blocked**, **Complete**. Keep fixtures, trials and official records separate; preserve failures and dissent. No completion label without inspectable evidence.
