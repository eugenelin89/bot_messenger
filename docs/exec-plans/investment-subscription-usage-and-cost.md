# Execution Plan — Investment subscription usage and cost

**Status:** Active
**Owner:** Codex parent, sole writer; independent read-only specialists
**Branch:** `feature/investment-subscription-usage-cost`
**Worktree:** `bot_messenger-subscription-usage`
**Started:** 2026-10-10
**Initial ETA:** 3–5 hours including validation and review
**Current ETA:** Validation/reviews finished; Git integration and final verification remain (approximately20–30minutes)

## Objective and authorization

Implement private synthetic investment subscription activity admission and common private
execution usage/reference-cost reporting. The owner authorized source, tests, independent
reviews, PR and merge, but no deployment, purchases or genuine employee demonstration.
Fetched `origin/main` is `0dc32825fee537dc29f41f2bd86130f729f14ed3`.
Existing checkout/worktrees and unrelated Asymmetri work are preserved.

The owner explicitly clarified in this chat that an invocation means **one supervised
Codex turn, including its internal tool loop**. Internal provider requests are not individually
capped. Separately started continuations, synthesis and reviews each count again. Research
broker turns remain denied for investment until safely independently admitted.

## Invariants and implementation

1. Verify pinned Codex 0.157.0 generated schema, official usage semantics, authentication
   and current exact-model pricing; never infer subscription billing or remaining Pro quota.
2. Add inert schema20 durable admission and usage observations with transaction/identity
   fences. Preserve strict token/cost mode and all existing authority/source/publisher checks.
3. Add separate subscription runtime entry and fresh subscription eligibility before
   provider invocation, rolling 24h cap8, run24, investment1/global2, local15min deadline,
   consumed reservations, restart uncertainty and no automatic uncertain retry.
4. Normalize cumulative snapshots without double-counting cache/reasoning; retain incomplete
   usage. Persist original exact decimal estimate and reviewed pricing version.
5. Integrate private execution/worker and investment run/cycle/day reporting and accessible
   compact UI. No public contract or Asymmetri changes; no third-party telemetry.
6. Deterministic transport/DB/admission/pricing/migration/browser tests, full required checks,
   independent architecture/security/recovery/test review, corrections, docs and reviewed merge.

## Validation and evidence

Run `npm run check`, `npm run build`, `npm test`, `npm run contracts:test`,
`git diff --check`, focused fake-provider and disposable-database/browser checks.
Serialize heavy checks. Real inference is expressly excluded. No fixture proves upstream
quota enforcement. Record exact results in `docs/validation/investment/INV-SUBSCRIPTION-USAGE.md`.

## Findings and decisions

- Global `codex` is0.133.0; the repository-pinned existing installation is0.157.0.
  Generated protocol offline using the pinned binary; no inference or credentials read.
- Existing `last`-only usage audit lacks cache/reasoning accounting; it must not be summed.
- Investment broker already fails closed. All group turn kinds share the dispatcher.
- Temporary concurrency holds must skip candidates rather than permanently block them.

## Remaining work

Implementation, decision036/operator documentation and acceptance record are complete. Full suite953 cases:952 passed,1 Linux-only skip; contracts175 passed; focused99 passed; browser6 passed. Control-plane/security/recovery/test and usage-semantics reviews have no remaining source blockers. PR and reviewed integration remain.
No deployment or activation follows this milestone.

## Runtime investigation disposition

Read-only account probe established current included ChatGPT access, with credits available. No inference or charge observed. Pinned0.157 has no supported included-only switch, ignores built-in retry overrides, and can retry uncertain transport outcomes. Removed the proposed capability rather than claiming unsupported safety. Codex subscription execution remains blocked with an owner-visible reason. This meets the requested fail-closed branch; it does not make a genuine demonstration eligible. Recovery review fixes include atomic usage creation, pre20 incomplete backfill, null unknown duration and immutable cycle identity.

Final regression corrected the future-schema sentinel from20 to21. No assertion was weakened. Screenshots show incomplete missing-cache usage; long model previews are clamped with full values retained in details. Browser evidence uses disposable local state only.
