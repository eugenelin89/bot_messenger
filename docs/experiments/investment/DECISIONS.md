# Design decisions and launch configuration

**Version:** 1.1 | **Updated:** 2026-10-06 | [Guide](README.md)

## Status discipline

The owner requested design/roadmap and then added Ask BotSquad, not implementation or launch. No new runtime authority follows. Personal Operator stabilization remains current; local INV and INV-ASK identifiers do not create core Prompt 12.

[Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) and the [Ask amendment table](ASK_BOTSQUAD.md#2-explicit-amendment-to-the-original-design) supersede only the original read-only-visitor/publication-only scope. Visitors may request a bounded answer; they still cannot command investments or access private company state.

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

These are proposed implementation decisions within the requested design, not evidence that code exists or every parameter is owner-approved. The feature specification owns precise routing, API, retention, recovery and acceptance semantics.

## Configuration still requiring resolution

| ID | Item | Resolve by |
| --- | --- | --- |
| O01 | Capital/currency, universe, benchmark, risk limits and horizon | INV-01 specification; explicit owner approval before official activation |
| O02 | Market-data provider, internal/public/derived-data rights, delay, retention, fees and budget | INV-01; live-data/public gates remain blocked without evidence |
| O03 | Actual receiver host capacity, runtime/SQLite driver, identity, port and service paths | INV-01 read-only preflight; provision only when deployment is authorized |
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

## Amendment process

Record date, decision ID, reason, affected documents, owner authorization where required and comparability impact. Before launch, update versioned baseline/contracts. After launch, retain prior methodology and append amendments or start a new run. Security fixes do not erase investment history. New visitor Q&A interpretations cannot retroactively change a trade's original rationale.

## Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-10-06 | 1.0 | Initial owner-requested investment design and roadmap; implementation planned |
| 2026-10-06 | 1.1 | R09 Ask BotSquad; actual employee routing, session-private chat, scoped outbound question retrieval and four required pre-launch packets; no runtime activation |
