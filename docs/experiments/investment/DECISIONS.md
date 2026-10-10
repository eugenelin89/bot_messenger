# Design decisions and launch configuration

**Version:** 1.6 | **Updated:** 2026-10-09 | [Guide](README.md)

## Status discipline

The owner separately selected INV-01 through INV-05 for their documented contract, receiver/archive and labelled synthetic website-source scopes. [INV-04 acceptance](../../validation/investment/INV-04.md) is complete locally but no public website release or real HQ investment simulator/publisher/Ask authority exists; [INV-05](../../validation/investment/INV-05.md) adds deterministic synthetic-only HQ accounting without deployment; INV-06–09 source work is now expressly authorized by the dated sequence amendment below. These selections create no active production publisher, brokerage authority, provider subscription or launch approval. Personal Operator stabilization remains a separate core priority; local INV and INV-ASK identifiers do not create core Prompt 12.

[Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) and the [Ask amendment table](ASK_BOTSQUAD.md#2-explicit-amendment-to-the-original-design) supersede only the original read-only-visitor/publication-only scope. Visitors may request a bounded answer; they still cannot command investments or access private company state.

**Owner-approved market-data constraint:** [Decision 029](../../decisions/decision_029_zero_cost_market_data.md) sets a hard **US$0 incremental market-data budget** and requires free APIs or permitted low-frequency web extraction. It supersedes INV-01's conditional paid Tiingo recommendation as the forward implementation path. It does not waive automated-access/public-display rights or authorize any scraping or launch by itself.

## Selected design baseline

| ID | Decision | Rationale |
| --- | --- | --- |
| D01 | BotSquad showcase first; investment results second | Demonstrate coordination, evidence and persistence, not just a stock chart |
| D02 | Genuine live discussion and linked artifacts in the first release | Explicit owner requirements, not optional later polish |
| D03 | Paper-only deterministic ledger at HQ | Models propose decisions; trusted arithmetic records effects |
| D04 | Authenticated outbound investment publication to Asymmetri REST | Public display without public HQ access; Ask has a separate bounded outbound pull lane |
| D05 | Narrow dedicated receiver/public archive; existing site renders it | Separate state and credentials from marketing pages and unrelated sites; private Q&A is not in this public archive |
| D06 | Public-audience scope and separate standing export grant | Private discussions/research rights do not imply publication permission |
| D07 | Append-preserving investment events/artifacts, with exceptional withdrawal | Honest history and necessary privacy/security response; visitor Q&A has a separate short retention/deletion policy |
| D08 | Near-live discussion, daily initial financial cycle, polling first | Visible teamwork without unnecessary intraday/model infrastructure |
| D09 | Reuse eligible existing workers with scoped responsibilities | Preserve current roles, hierarchy and shared capacity |
| D10 | Next-session opening fills after an earlier immutable cutoff | Avoid choosing a known favorable price after making the decision |
| D11 | Corporate-action accounting and explicit stale-data states before public launch | Prevent misleading profit and performance claims |
| D12 | Fixture, private trial and official runs are separate | Never pass a test transcript off as live operation |
| D13 | Canonical contracts here, version-pinned by the website | Avoid incompatible producers/receivers; portfolio and Ask use separate namespaces and access models |
| D14 | Ask accepts general and contextual questions; one relevant actual employee answers | Demonstrate real organizational interaction rather than an impersonating FAQ bot |
| D15 | Anonymous-session-private Q&A by default | Public access does not imply broadcasting a visitor's conversation or publishing it as an artifact |
| D16 | HQ independently admits questions through outbound retrieval under a separate Ask grant | No inbound HQ API, owner impersonation, action authority or automatic influence on investment memory |
| D17 | At most one bounded low-priority Ask execution within existing shared capacity | Protect owner/market-deadline work; public traffic must not create unlimited cost |
| D18 | US$0 incremental market-data spend is a hard owner constraint | Free API access or permitted web extraction only; no paid source, license, upgrade or subscription without a new explicit owner decision ([Decision 029](../../decisions/decision_029_zero_cost_market_data.md)) |
| D19 | Data availability and public rights are separately verified | Never evade scraping restrictions, invent fill prices, substitute unverified quotes, or publish fields without applicable source rights; degrade visibly or block live/public gates |
| D20 | Existing Ubuntu 22.10 retained under a time-limited owner exception | [Decision 030](../../decisions/decision_030_defer_ubuntu_migration.md): INFRA-01 cancelled; INFRA-02 needs separate authorization and actual host acceptance, without an automatic migration prerequisite |

D01–D19 are accepted design requirements; INV-01 contracts and the INV-02 receiver/archive are implemented and locally validated, with the receiver default disabled. [INFRA-02](../../validation/investment/INFRA-02.md) subsequently installs it privately and validates synthetic Linux operation, finishing stopped with an empty operational archive. D20 records the accepted infrastructure exception. [INV-03](../../validation/investment/INV-03.md) subsequently adds the validated artifact/discussion archive and disabled schema002 private installation. Operational values below remain recommendations requiring approval. The feature specification owns precise routing, API, retention, recovery and acceptance semantics.

## Configuration still requiring resolution

| ID | Item | Resolve by |
| --- | --- | --- |
| O01 | Capital/currency, universe, benchmark, risk limits and horizon | INV-01 specification; explicit owner approval before official activation |
| O02 | Select permitted free API/source or allowed web scraper; verify internal/automated use, display/derived/archive rights, timestamps, retention, correction quality and limits | Market-data budget is fixed at US$0 by D18; INV-06 must prove actual free-source suitability, otherwise block live/public fields and escalate a methodology/display choice instead of spending |
| O03 | Representative live capacity and exact public ingress | INV-03 passes isolated TLS, 953s bounded synthetic load, complete restore and current-control fencing; shared443 topology/authority/renewal, full-archive/public sizing and actual independent backup custody/policy still gate activation |
| O04 | Eligible real investment roster, research/group grants and scoped paper-order capability | INV-08; do not rename roles to imply authority |
| O05 | Finite investment model/research/operation budgets and schedule/end conditions | INV-09 and owner activation |
| O06 | Investment publication audience, classes, expiry, withdrawals and retention | INV-07 owner review; no implicit consent from implementation |
| O07 | Official start date, final public copy and website/privacy disclosures | INV-12; no launch without explicit owner instruction |
| O08 | Ask-eligible roster/topics/fallback and exact least-privilege runtime integration | INV-ASK-02; do not equate an employee title with permission |
| O09 | Provider/account terms for anonymous third-party model use, Ask quotas and cost bounds | INV-01/INV-ASK-01 feasibility; INV-ASK-04 verified launch gate |
| O10 | Session lifetime, raw-content/backup retention, deletion, abuse controls and visitor processing notice | INV-ASK-01/03/04; defaults in ASK_BOTSQUAD.md require review |
| O11 | Optional Ask research-mode grant and public-source rights | INV-ASK-02; existing Task/group grants do not widen automatically |
| O12 | Separate public Ask activation, grant expiry, moderation configuration and emergency shutoff | INV-12 after G-ASK; deployment alone does not admit questions |

No placeholder authorizes spending, accounts or hidden defaults. Synthetic contract/UI work can proceed while live rights or public-service terms are blocked. Public activation cannot. Public transcript sharing remains deferred; a different audience would need a separately consented design amendment.

## INV-01 recommendations and unresolved gates

Evidence and primary sources: [INV-01](../../validation/investment/INV-01.md). Wire version 1.0 and its [profile](../../../contracts/investment/v1/PROTOCOL.md) are selected implementation decisions; fixtures are not launch settings.

| Item | Recommended default | Approval or external prerequisite |
| --- | --- | --- |
| Capital/currency | 100, 000 USD, no deposits/withdrawals during official run | Owner approval; v1 USD only |
| Initial universe | Ten candidate liquid US common stocks: AAPL, MSFT, AMZN, GOOGL, META, NVDA, JPM, JNJ, XOM, PG | Proposal, not investment advice or approved membership. Freeze provider stable IDs, listing/sector classification and availability before run; no scraped symbol resolution |
| Benchmark | SPY ETF proxy; raw prices plus explicit dividend receivables/payment and next eligible opening reinvestment, fractional units, zero benchmark commission/slippage | Verify instrument/feed/rights, freeze initial units and residual cash; do not call it the S&P500 index itself |
| Risk | Long-only/no leverage; 15% position, 30% sector at new-risk admission; 10% observed drawdown stops new risk | Owner approves classification and limits; price moves may exceed limits; no guaranteed loss bound |
| Cadence/horizon | One review per regular exchange session; close valuation; weekly outcome review; 60 official sessions, separately authorized5-session private trial | Owner selects dates and calendar; missed deadlines coalesce/expire, never backdate |
| Execution | Next regular opening after commitment at least30min before open; whole discretionary shares; 10bps adverse slippage, zero commission; 24 h maximum data wait after target open | Verify exact provider field/availability/halts; expire if missing; six-decimal half-even weighted-average basis, explicit action entitlements |
| Market data | **Current owner decision:** US$0 incremental fees; use verified free APIs and permitted low-frequency web collection, with documented provenance and no silent paid fallback. **Historical INV-01 finding:** Tiingo EOD Startup paid redistribution was conditionally suggested, but is now superseded by Decision 029 | INV-06 must verify free-source automation/internal-use rights, raw price and action quality, publishable derived/display/archive fields, availability and rate limits. If none qualifies, stop the affected live/public gate; do not buy a feed |
| Publication | Authorized contribution batches every<=15s when active; heartbeat60s, stale180s; daily financial valuations after provider readiness | Measure30s visible-tab target; respect licensed delay and owner audience/expiry. Stop new risk if outbox>24 h or64 MiB |
| Discussions/artifacts | Actual scoped group contributions, dissent, exact synthesis and every deliverable registry entry; approved public derivatives or safe withheld reason | No private transcript export. Text/Markdown/JSON/CSV/normalized PNG only; existing HQ lower limits prevail |
| Investment usage |32 executions/cycle, 64/day, 3, 840/run; 32 broker calls/day, 1, 920/run; recommend$10/day, $600/run ceiling | Owner budget and enforceable metering required. Default group reservation is24 plus coordinator; prior12/cycle was insufficient. Caps are ceilings, not scheduled consumption |
| Ask admission |2, 000 chars, 5/hour and20/day/session, one outstanding, queue50, TTL10min; 24 h absolute session | Owner privacy/abuse approval; network/global limits and authenticated session ownership separately enforced |
| Ask worker/model budget | One active shared slot, 25% rolling duty ceiling, 20 questions/day globally; one answer, deterministic router initially, 0 optional research calls; 240s deadline, 8k input/1.5k output per execution, 200k tokens/day, proposed$2/day | New approved API account/adapter/model and hard reservations. Unknown token/cost usage disables paid admission. Optional model router/research require separate cap/grant review |
| Retention/storage | Public archive/history for approved permanent duration; earlier CAS1 GiB proposal (installed private receiver cap256MiB, not fully capacity-qualified), staging24 h; Ask raw<=7days in operator-controlled stores or earlier deletion; provider retention separately disclosed/approved, non-content suppression30days | Provider perpetual rights unresolved; fresh host/storage headroom acceptance required. INV-03 proposes archive daily+prechange backups, 7daily/4weekly/3monthly retention, RPO24h/targetRTO2h and current withdrawal reconciliation; none is activated or a measured RTO. Ask backup expiry<=7days and 30-day suppression remain separate INV-ASK requirements |
| Stop conditions | Owner pause/revocation; expired grant/budget; uncertain provider outcome; missing/stale/unsupported market action; ledger conflict; drawdown threshold; outbox/storage cap; Ask stale control barrier or unverified costs | Stop affected admission, retain durable evidence, show owner action; never erase trades or automatically retry uncertain model work |

Resolved INV-01 choices: canonical schema plus generated types, exact named endpoint DTOs, signed generation fence, decimal/rational representation, durable identity/receipt semantics, private Ask namespace and current host/runtime integration plan. Source implementation does not approve the rows above. Changes to official frozen methodology require an explicit amendment/new run.

INFRA-02 subsequently accepted private actual-host compatibility, recovery and bounded capacity under Decision030. INV-03 adds accepted isolated TLS and measured private capacity/recovery. Remaining activation gates include complete public ingress, larger/public sizing and independently verified backup custody/retention; **permitted zero-cost acquisition and separately verified public/derived-data rights** before corresponding live/public data; approved API-backed runtime/account plus metering/retention before anonymous Ask. They **do not block separately selected fixture-based INV-04 work**. Required sequence refinements are documented in the evidence record.

## Amendment process

Record date, decision ID, reason, affected documents, owner authorization where required and comparability impact. Before launch, update versioned baseline/contracts. After launch, retain prior methodology and append amendments or start a new run. Security fixes do not erase investment history. New visitor Q&A interpretations cannot retroactively change a trade's original rationale.

## Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-10-06 | 1.0 | Initial owner-requested investment design and roadmap; implementation planned |
| 2026-10-06 | 1.1 | R09 Ask BotSquad; actual employee routing, session-private chat, scoped outbound question retrieval and four required pre-launch packets; no runtime activation |
| 2026-10-08 | 1.2 | INV-01 wire foundation and observed feasibility; concrete unapproved defaults, host/data/account gates; no runtime activation |
| 2026-10-09 | 1.3 | Owner sets US$0 market-data budget; free APIs/permitted scraping replace paid feed path; data access and public display rights remain required (Decision 029) |
| 2026-10-09 | 1.4 | Owner cancels INFRA-01 migration, deletes its verified snapshot and retains Ubuntu 22.10 under a time-limited exception; INFRA-02 remains unstarted and separately authorized (Decision 030) |
| 2026-10-09 | 1.5 | Owner-selected INFRA-02 completes private Linux installation and synthetic acceptance; final receiver stopped/default disabled, public HTTP/TLS and real publisher/HQ activation remain gated ([evidence](../../validation/investment/INFRA-02.md)) |
| 2026-10-09 | 1.6 | Owner-selected INV-03 completes artifact/discussion archive, disabled schema002 private installation, isolated TLS and stronger synthetic capacity/recovery; public topology, custody, rights and HQ gates retained; prior backup deletion corrected ([evidence](../../validation/investment/INV-03.md)) |

## INV-05 implementation decision

[Decision031](../../decisions/decision_031_deterministic_paper_simulator.md) freezes the delivered synthetic method and local integrity boundary. Schema15 adds no authority; the private outbox is not a public v1 projection. No official configuration, live source, employee execution, scheduler or transport is activated. [INV-05](../../validation/investment/INV-05.md) records actual accounting, process-kill, concurrency, migration and review evidence. INV-06 remains separately selectable.

## 2026-10-10 INV-06 source-scope amendment

[INV-06 acceptance](../../validation/investment/INV-06.md) and [Decision032](../../decisions/decision_032_market_evidence_boundary.md) record typed immutable market evidence, independent source-use rights, bounded fixture collection, scheduled exchange calendar, correction-aware simulator admission, additive schema16 and actual crash recovery. A01/A05/A08 pass only for the documented synthetic scope; OpenFIGI proves identifiers only. Live raw-opening/action completeness, operational calendar updates and public-derived/export/archive rights remain blocked. The owner-authorized [INV-06→09 sequence](../../exec-plans/investment-autonomous-sequence-06-09.md) permits reviewed source integration and subsequent independent synthetic work, not production activation or a claim of complete live INV-06 acceptance. Historical selection wording above remains provenance.
