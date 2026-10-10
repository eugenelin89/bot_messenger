# Execution Plan — INV-04 documentation handoff

- **Status:** Source handoff complete; enclosing PR records final integration
- **Owner:** INV-04 primary integration writer; independent read-only reviewers
- **Branch:** feature/inv04-showcase-handoff
- **Worktree:** Dedicated local handoff checkout
- **Started:** 2026-10-09
- **Initial ETA:** 2–3 hours for full cross-repository milestone
- **Current ETA:** Documentation review complete; final PR integration remains

## Objective

Record accepted Asymmetri source and local showcase validation without claiming a
public release or activating BotSquad HQ, investment operations or Ask.

## In scope

- Exact accepted source/journal links, roadmap and project-memory handoff.
- Scoped documentation PR, independent read-only review and authorized merge.

## Out of scope

HQ/runtime changes, production deployment, new keys/grants/ingress, paid resources,
INV-05 implementation, real-data integration and Ask execution.

## Relevant docs / decisions

AGENTS.md, README, PROJECT_VISION, SYSTEM_ARCHITECTURE, investment README/ROADMAP,
Decision 029, Decision 030, investment DECISIONS and SIMULATION_RULES section 7.
US$0 incremental market-data budget and all later activation gates remain binding.

## Invariants / risks changed

Documentation only in BotSquad. One writer owns integration; reviewers are development
agents, not runtime employees. No persistence, migration, grants or provider calls.
The deterministic synthetic demonstration proves interface behavior, not intelligent
employee execution, investment quality, market rights or public capacity.

## Steps and validation

1. Verify Asymmetri tests, browser evidence, production preservation and accepted commits.
2. Pin source/journal in INV-04 evidence and update current handoff references.
3. Check links, diff and documentation-only scope; request independent review.
4. Push branch, open PR, merge if review and permissions permit; verify main.

## Evidence ledger

- Asymmetri implementation `c31f500c6ebb063341bca7444dac6782df7a7b17` and
  journal `3d9e1ad55dc5ad1861393e63d05370a2a1a7b054` pushed and verified on main.
- [INV-04 handoff](../validation/investment/INV-04.md) pins source, local acceptance,
  screenshots/CSV, limitations, read-only production preservation and future gates.
- 202 receiver tests, 3 focused tests, Next webpack/Vinext builds, production audits,
  six browser widths and failure/recovery journeys accepted; no deployment.
- Independent contract/security reviewer accepted all five BotSquad documentation
  files with no blockers. Exact website commits and activation gates were verified.
- 113 local links and four immutable source paths resolve; privacy and whitespace
  checks pass. No BotSquad runtime tests are needed or claimed for this docs-only diff.
- The enclosing PR owns final push/merge outcome; its head contains this source
  handoff. Verify the accepted commit is on main after merge without moving another
  writer's checkout. No subsequent milestone begins automatically.

## Decisions

No new recovery milestone. INV-05 may be selected separately after this source handoff;
public activation continues to require its explicit later milestones.
