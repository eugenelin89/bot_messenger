# BotSquad Investment Team — design and build guide

**Version:** 1.1 | **Updated:** 2026-10-06

**Status:** Design baseline. Implementation, deployment, subscriptions and public activation are not completed or authorized by this document.

## The idea

Show an actual BotSquad organization doing useful, persistent work. Its first public experiment is a simulated stock-investment team: workers research public information, discuss alternatives, challenge proposals, make accountable decisions and review outcomes. A deterministic simulator keeps the pretend money honest. Asymmetri.co gives visitors a readable, near-live window into the team, its work and the results.

**BotSquad is the product being demonstrated. Investment performance is one observable outcome, not the sole definition of success.** Genuine discussion and linked artifacts are first-release requirements, not optional dashboard enhancements. **Ask BotSquad** adds a direct visitor conversation: ask a general question or ask about a specific transaction, and one relevant actual employee responds.

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

Earlier suggestions of $100,000, USD, universe size, sector limits, schedule and benchmark are proposed defaults, not owner-confirmed settings. See [Decisions](DECISIONS.md). Ask-specific quotas, retention and provider-use approval are likewise launch decisions, not activated defaults.

## Documentation map

| Document | Single source of truth for |
| --- | --- |
| [Product and public experience](PRODUCT_AND_UX.md) | Purpose, page hierarchy, live desk, visitor journeys and charts |
| [Architecture](ARCHITECTURE.md) | Repository responsibilities, integration, ownership and trust boundaries |
| [Simulation rules](SIMULATION_RULES.md) | Orders, accounting, market evidence, risk, benchmark and metrics |
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

Read the product guide, Ask specification, architecture and roadmap. Implementers then read the relevant technical specifications before running one build packet. The [prompt launcher](../../../prompts/investment-experiment.md) supplies shared instructions. The [original documentation execution plan](../../exec-plans/investment-experiment-design.md) and [Ask amendment plan](../../exec-plans/ask-botsquad-design.md) record design-only work.

## Version 1.1 amendment and precedence

[Ask BotSquad section 2](ASK_BOTSQUAD.md#2-explicit-amendment-to-the-original-design) and [Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) explicitly amend the original no-public-interaction/publication-only assumptions. General-purpose public commands remain prohibited. A visitor may request one scoped answer, not trade, assign Tasks or administer the company.

The portfolio publication channel stays one-way. A separate HQ-initiated outbound pull imports untrusted website questions under its own local grant. Q&A uses a private session store and separate `/api/ask/v1` contract; no visitor chat is added to the public investment archive, live team discussion or company memory. Read this amendment with any unchanged version-1.0 document. It changes only those named boundaries, not ledger accounting, core APIs or previously accepted permissions.

## Existing capabilities versus planned work

The original reviewed BotSquad baseline is `ce99212c882327ad8e04fd3603867ac18428e1a4`; this amendment was based on main `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5` with intervening Personal Operator work preserved. Persistent workers, Tasks, private conversations, working groups, scoped research, artifacts, mandates and scheduling do not by themselves implement the proposed paper ledger, public publisher or anonymous employee Q&A adapter.

The reviewed Asymmetri website has a Next.js production site, a `/botsquad` product page and documented Mac-to-server deployment access. An experiment API, private chat store, investment page and Ask BotSquad are planned here, not claimed deployed. Repository documentation is not a fresh SSH verification. See [References](REFERENCES.md).

## First-release boundary

One owner, one company, one simulated portfolio, one published experiment and one market-data provider. Visitors may read the showcase and use **Ask BotSquad** through bounded anonymous-session chat. They cannot command trades, assign work, post into the investment discussion, administer workers or browse private company/other visitor data. There is no brokerage integration, real-money mode, public HQ listener or required visitor account.

The first release includes the introduction, actual roster, genuine live team discussion, durable investment artifact pages, decisions and dissent, holdings, benchmark/performance/drawdown charts, transaction journal, methodology, freshness/health and general/contextual Ask BotSquad. Visitor chats are private to their session by default, not public broadcasts; the operator/provider processing and retention are disclosed. Competing portfolios, intraday trading, SSE, arbitrary uploads, global public chatrooms and public Q&A sharing remain later options.

Use experiment-local IDs `INV-01`–`INV-12` and `INV-ASK-01`–`INV-ASK-04`. These do not create core Prompt 12 or renumber completed milestones. Planning does not displace Personal Operator reliability work or activate financial, publication or public-question authority. Implementation begins only through later owner-selected tasks.

## Updating the design

Each topic has one normative home above. Link rather than duplicate fields and rules. Portfolio API fields belong in `PUBLIC_API.md`, publication delivery in `API_SECURITY_AND_DELIVERY.md`, calculations in `SIMULATION_RULES.md`, Ask behavior/protocol in `ASK_BOTSQUAD.md`, and all implementation status in `ROADMAP.md`.

Each build prompt updates its roadmap row, evidence links and affected specification. Record exact tested commits for both repositories; never claim an atomic cross-repository deployment. Durable scope/security changes require an ADR. After official launch, methodology changes require a visible versioned amendment or a new run. Q&A cannot revise historical investment reasoning.

Status vocabulary: **Planned**, **In progress**, **Implemented, not validated**, **Validated, not deployed**, **Deployed, not activated**, **Active**, **Blocked**, **Complete**. Keep fixtures, trials and official records separate; preserve failures and dissent. No completion label without inspectable evidence.
