# BotSquad Investment Team — design and build guide

**Version:** 1.0 | **Updated:** 2026-10-06

**Status:** Design baseline. Implementation, deployment, subscriptions and public activation are not completed or authorized by this document.

## The idea

Show an actual BotSquad organization doing useful, persistent work. Its first public experiment is a simulated stock-investment team: workers research public information, discuss alternatives, challenge proposals, make accountable decisions and review outcomes. A deterministic simulator keeps the pretend money honest. Asymmetri.co gives visitors a readable, near-live window into the team, its work and the results.

**BotSquad is the product being demonstrated. Investment performance is one observable outcome, not the sole definition of success.** Genuine discussion and linked artifacts are first-release requirements, not optional dashboard enhancements.

## Owner requirements

| ID | Requirement |
| --- | --- |
| R01 | Start with an owner-selected amount of pretend money; simulate stock purchases and sales. |
| R02 | Research markets, companies and news, with sources and understandable buy/sell/hold explanations. |
| R03 | Show portfolio value, gains/losses, transaction history and relevant charts. |
| R04 | Publish ongoing updates from BotSquad HQ to an authenticated REST API on Asymmetri.co. |
| R05 | Clearly describe the project, purpose, goal and BotSquad capabilities on display. |
| R06 | Display real, attributable team discussion in a live panel; preserve browsable discussion history. |
| R07 | Give every experiment deliverable an artifact link and retain an accessible public copy, or an explicit safe withheld record. |
| R08 | Maintain a detailed design and incremental prompt-by-prompt roadmap in this repository. |

Earlier suggestions of $100,000, USD, universe size, sector limits, schedule and benchmark are proposed defaults, not owner-confirmed settings. See [Decisions](DECISIONS.md).

## Documentation map

| Document | Single source of truth for |
| --- | --- |
| [Product and public experience](PRODUCT_AND_UX.md) | Purpose, page hierarchy, live desk, visitor journeys and charts |
| [Architecture](ARCHITECTURE.md) | Repository responsibilities, integration, ownership and trust boundaries |
| [Simulation rules](SIMULATION_RULES.md) | Orders, accounting, market evidence, risk, benchmark and metrics |
| [Public API](PUBLIC_API.md) | REST resources, event payloads, artifact references and version compatibility |
| [API security and delivery](API_SECURITY_AND_DELIVERY.md) | Signing, authorization, atomic acceptance, ordering, receipts, retries and errors |
| [Publication and artifacts](PUBLICATION_AND_ARTIFACTS.md) | Audience consent, discussion export, file storage, versions and withdrawals |
| [Team and operations](TEAM_AND_OPERATIONS.md) | Worker fit, grants, daily loop, controls, backup and recovery |
| [Validation](VALIDATION.md) | Requirement-linked acceptance, failure and security scenarios |
| [Detailed build roadmap](ROADMAP.md) | INV-01 through INV-12, dependencies, scope and completion evidence |
| [Decisions](DECISIONS.md) | Resolved design choices, open configuration and amendments |
| [References](REFERENCES.md) | Repository evidence and primary external references |

Read the product guide first, then architecture and the roadmap. Implementers read the relevant technical specifications before running a build packet. The [prompt launcher](../../../prompts/investment-experiment.md) supplies the shared instructions for one Codex task. The [documentation execution plan](../../exec-plans/investment-experiment-design.md) records this design-only work.

## Existing capabilities versus planned work

The reviewed BotSquad baseline is `ce99212c882327ad8e04fd3603867ac18428e1a4`. It supports persistent workers, Tasks, private conversations, working groups, scoped research, artifacts, bounded mandates and durable scheduling. It does not thereby have a paper-trading ledger, structured market-data adapter, public-discussion permission, public artifact export or an Asymmetri REST publisher.

The reviewed Asymmetri website has a Next.js production site, a `/botsquad` product page and documented Mac-to-server deployment access. It has no experiment API, database or investment page. Repository deployment documentation is not a new SSH verification. See [References](REFERENCES.md).

## First-release boundary

One owner, one company, one simulated portfolio, one published experiment and one market-data provider. Visitors read; they cannot issue commands, trade, comment or administer workers. There is no brokerage integration, real-money mode, public HQ route or visitor account.

The first release includes the introduction, actual roster, genuine live discussion, durable artifact pages, decisions and dissent, holdings, benchmark/performance/drawdown charts, transaction journal, methodology, data freshness and experiment health. Competing portfolios, intraday trading, SSE, arbitrary uploaded file types and public interaction are later options.

Use experiment-local IDs `INV-01`–`INV-12`. This is not core Prompt 12 and does not renumber completed milestones. Planning this owner-requested paper experiment does not displace Personal Operator reliability work or activate deferred real financial authority. Implementation starts only with a later explicit task.

## Updating the design

Each topic has one normative home above. Link instead of duplicating field definitions and rules. API fields belong in `PUBLIC_API.md`, delivery/security semantics in `API_SECURITY_AND_DELIVERY.md`, calculations in `SIMULATION_RULES.md`, and implementation status in the roadmap table.

Each build prompt updates its roadmap row, evidence links and affected specification. Record exact tested commits for both repositories; never claim an atomic cross-repository deployment. Durable scope/security changes also require an ADR. After official launch, methodology changes require a visible versioned amendment or a new run.

Status vocabulary: **Planned**, **In progress**, **Implemented, not validated**, **Validated, not deployed**, **Deployed, not activated**, **Active**, **Blocked**, **Complete**. Keep fixtures, trials and official records separate; preserve failures and dissent. No completion label without inspectable evidence.
