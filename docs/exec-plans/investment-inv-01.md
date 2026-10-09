# Execution Plan — INV-01 contracts and feasibility

**Status:** Implementation, validation and specialist review complete; integration tracked by [PR32](https://github.com/eugenelin89/bot_messenger/pull/32)
**Owner:** Codex primary writer, chat 01a11eb5-9782-7f31-8481-70d7a5351d37  
**Branch:** codex/inv01-contracts-feasibility  
**Worktree:** bot_messenger-inv01 (sibling of the primary checkout)  
**Started:** 2026-10-08 (America/Vancouver)  
**Initial ETA:** 2–4 hours, including research, contract implementation, review and integration  
**Current ETA:** About30–60 minutes for final regression, source review and PR integration (04:20UTC checkpoint); initial2–4-hour range remains sufficient

## Objective and scope

Deliver G0 for the investment showcase and Ask BotSquad: one versioned contract
package, deterministic synthetic conformance evidence and source-backed feasibility.
Implement only in BotSquad. Asymmetri and both production servers remain read-only.
No runtime integration, migration, grant, operational run, model invocation, trade,
account, purchase, production publication or deployment is in scope.

## Baseline and ownership

Fetched origin; clean main and origin/main both a72cee080989960d2a9e1e74d9236157ce1a0448.
Inspected branches/worktrees and current Codex chats; existing writers use other
branches or repositories. This task owns its dedicated new worktree. Primary main
and unrelated worktrees remain untouched during implementation. Parent is sole
writer/integrator; read-only architecture, website, security/recovery and validation
specialists supply advice under AGENTS.md and Decision 023.

## Requirements and invariants

Read the owner-requested repository/design packet, Decisions 027/028 and relevant
accepted architecture decisions. Portfolio publication and private visitor Q&A have
separate schemas, stores, grants and retention. Trusted identity never comes from
names or prose. Unknown provider work is fenced; transport retry never authorizes
model replay. Frozen run values in tests are labelled synthetic, not owner consent.

## Implementation steps

1. Finish read-only code/host/provider feasibility; record observed versus proposed facts.
2. Author strict JSON Schema/OpenAPI, derived TypeScript types and vendoring manifest.
3. Implement offline structural/semantic/signature conformance helpers and golden fixtures.
4. Exercise validation, identities/references, accounting consistency, delivery ordering,
   idempotency, content safety, ownership, cancellation and unknown-outcome cases.
5. Update normative specifications, decision register and INV-01 validation handoff.
6. Hold source fixed for independent security/recovery/acceptance review; fix findings.
7. Type-check, run focused/full applicable tests, document/reference checks and diff checks.
8. Recheck remote main/ownership, commit, push, create reviewed PR and safely merge.

## Validation plan and evidence limits

Level 1 plus disposable local contract-model tests only. Real workers, production
receiver, SQL concurrency/restart, live market data and browser acceptance belong to
later milestones. Read-only SSH establishes host feasibility, never live acceptance.
Tests must reject malformed/unknown input and enforce cross-record semantics beyond
JSON Schema. Contract generation and manifest checks must detect drift.

## Evidence ledger

| Check | Source | Result |
| --- | --- | --- |
| Git/concurrency preflight | a72cee0; local worktrees and Codex chat inventory | Clean isolated starting point |
| Required design review | Investment specs and Decisions 027/028 | Scope and boundary amendment reconciled |

## Remaining work / blockers

Contract implementation, focused/full validation and specialist reviews complete. Source integration and final merge identity are tracked in PR32; no later implementation packet is authorized. Provider licensing,
anonymous service account rights and launch configuration may block future live
milestones; none prevents synthetic contract work. No future packet will be started.

## Progress checkpoint — 2026-10-09 UTC

Implemented schema/OpenAPI/generated types/manifest/profile and synthetic fixtures; current focused suite174 passing before final equivalent-timestamp case, included in pending full regression. npm audit reports0 vulnerabilities. Resolved specialist findings for signature/content/identity/recovery/accounting wire consistency. Provider/host/API-account feasibility and recommended-but-unapproved configuration documented in INV-01 evidence. Current remote main remains a72cee0; no competing writer or open PR found. Website and production systems remain read-only.

Initial sandbox regression could not bind loopback ports and included two newly added fixtures whose test grant expired before the fixture clock; those test clocks/scopes were corrected. Rerunning full suite with local loopback access; no production access or runtime activation. All251 changed-document relative links and920 schema/OpenAPI references resolve. No production source imports contract helpers.

## Final validation checkpoint

Focused175/175; full624 tests:623 pass,0 fail,1 expected Linux-only skip. Type and generated-contract checks pass. Audit0 vulnerabilities;251 document links/920 schema references valid; diff whitespace clean. All specialist findings resolved, including equal UTC timestamp representations. Evidence explicitly distinguishes actual source/host inspection from synthetic finance/model examples. No production dependencies, domain/runtime/migration/grant/scheduler or server state changed. Source merge only remains; initial ETA did not increase.


Implementation source `5ea318f41cfd9c87b8d7f1a2afa467b7b7045aee` pushed and PR32 opened/attached. GitHub reported no configured CI checks/statuses. Exact tested code is unchanged by the final documentation handoff. Normal merge uses expected head SHA and current clean base; do not bypass any subsequently configured branch protection.
