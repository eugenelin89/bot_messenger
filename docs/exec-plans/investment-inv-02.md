# Execution Plan — INV-02 receiver documentation handoff

**Status:** Complete (local implementation; documentation integration recorded by PR)
**Owner:** INV-02 Codex sole implementation/integration writer; read-only specialists
**Branch:** codex/inv02-receiver-handoff
**Worktree:** bot_messenger-inv02 (isolated sibling of the canonical checkout)
**Started:** 2026-10-09
**Initial ETA:** 3–5 hours across both repositories
**Current ETA:** unchanged

## Objective and scope

Implement and locally validate INV-02 in Asymmetri, then record exact implementation evidence here through the normal documentation PR. No BotSquad runtime or contract changes. No deployment, production maintenance, live data, standing authority, Ask implementation, employee activation or later milestone.

## Relevant current documents and decisions

Reviewed both AGENTS files and website architecture/development/testing/deployment/access/server/journal documents; investment README, ROADMAP, ARCHITECTURE, PUBLIC_API, API_SECURITY_AND_DELIVERY, PUBLICATION_AND_ARTIFACTS, PRODUCT_AND_UX, ASK_BOTSQUAD, DECISIONS, SIMULATION_RULES, VALIDATION; INV-01 acceptance; prompt; Decisions 027/028/029 and Project Memory. README, product vision and system architecture remain unchanged because the delivered runtime is owned by Asymmetri.

Decision 029 fixes incremental market-data acquisition/licensing budget at US$0. Only synthetic fixtures are exercised; future permitted free APIs/bounded scraping and independently verified publication rights remain INV-06 work.

## Invariants and risks

One writer per checkout; exact accepted contract bytes; durable receipts and current authority; immutable events and financial dependencies; private staged content; bounded resources; no Ask records in public archive. A receipt acknowledges archive storage and never creates a trade. No runtime employee/agent behavior changes.

## Steps and validation

1. Preflight both repositories, fetch, identify ownership and pin accepted contract.
2. Implement standalone default-disabled Node/SQLite receiver on clean Asymmetri main.
3. Exercise real local HTTP, synthetic signatures, atomic SQL, separate-process races, SIGKILL windows, backup/restore fencing, content integrity and withdrawal.
4. Resolve security/recovery/test specialist findings; validate Node 24 and Node 22 plus Next/Vinext/check/audits.
5. Commit Asymmetri implementation/docs, separate engineering journal, push and verify main.
6. Update this repository's roadmap/architecture/acceptance with exact SHA and manifest digest; review, commit and integrate documentation PR.

No end-to-end HQ employee execution, live market-data or production acceptance is required or authorized in this milestone.

## Evidence ledger

| Check | Source | Result |
| --- | --- | --- |
| Asymmetri clean synchronized main | 1232d1cbbe642a10a2455c2ed9c601174e548d2a | Passed before edits |
| BotSquad documentation base | b57c41a | Separate worktree; original main preserved |
| Canonical contract byte comparison | ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755 vs current main | Unchanged |
| Contract manifest SHA-256 | 7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31 | Exact vendored package and regenerated declarations pass |
| Receiver and website validation | Asymmetri 457f9354b3f8daf5c4c75b8f5ac1946433da3ce0 | 183/183 on Node24 and22; both builds/check/production audits pass; three reviewer acceptances |

## Decisions during execution

Use independent package/lockfile and local loopback service, SQLite WAL/FULL with immutable event/receipt constraints, filesystem CAS outside checkout, explicit trusted publisher configuration. Keep public content downloads unavailable until INV-03; expose legitimate metadata/read foundations. No paid-provider assumptions. Historical disk warning was superseded by separately documented maintenance; supported OS and fresh capacity checks remain deployment gates.

## Completion handoff

No remaining local implementation acceptance blocker. Asymmetri implementation457f935 and journal66a882d are pushed and remote verified. Canonical [INV-02 evidence](../validation/investment/INV-02.md) records the full handoff; this documentation branch follows the reviewed PR workflow; Git history and the final handoff record its integration identity. No live deployment is authorized.
