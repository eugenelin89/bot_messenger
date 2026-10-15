# Execution Plan — recurring investment review pause

**Status:** Active  
**Owner:** Current repair chat, sole writer  
**Branch:** `fix/investment-review-clock`  
**Worktree:** `bot_messenger-review-clock`  
**Started:** 2026-10-15  
**Initial ETA:** 20–40 minutes; revise after reproduction and recovery review.

## Objective and scope

Diagnose the October 15 pause, repair its reproducible source defects, validate the
review path and report exactly what can resume under retained authority. Preserve
the portfolio, historical usage gaps, spent attempts, cutoff, grants and Ask pause.

## Evidence

- Live HQ `0fabbbac`, schema 29, healthy runtime. Rolling start succeeded once at
  12:01:15Z. Atlas created a genuine HOLD proposal.
- Maya's review execution rejected
  `paper_review` with `review_mismatch` at 12:03:44.432Z. No runtime approval event.
- Adapter mislabels bounded callback errors as unavailable approval and interrupts.
  New usage is incomplete, successor loop blocked, no review/submission committed.
- Family consumed 10/11 attempts; cutoff 13:00Z elapsed; authority expires 23:40Z.
  Decision 052's exception covers only the original gap, not this new one.

## Steps and checks

1. Reproduce review rejection with an advancing clock; check exact hash/timestamp guards.
2. Bind the trusted review and journal to one timestamp without weakening live admission.
3. Correct runtime failure classification, preserving fail-closed behavior and usage holds.
4. Run focused and shared regression tests; obtain read-only recovery/security review.
5. Prepare reviewed delivery and recovery status. No SQL repair, fabricated review,
   refunded usage, replayed expired research or new finite authority.

## Requirements consulted

AGENTS.md; product vision/intelligent company/architecture; Decisions 029 and 052;
investment decisions, simulation rules and roadmap; October 14 audit/readiness.

## Validation and reviews

Advancing-clock failure reproduced before correction. Build, contract checks, 49
team/loop boundary tests and two permitted-loopback HTTP tests pass. Broad run:
198 pass, four fail, four skip; three failures resolved by test normalization or
loopback permission, one financial publication-health failure reproduced unchanged
on the audit baseline. Finite tool rejection/approval scenarios pass. Independent
recovery and security reviewers found no source authority bypass; requested
cutoff, replay and raw timestamp rejection tests pass.

## Remaining work

Reviewed source delivery, isolated Linux validation, guarded deployment preserving
the blocked run, final operational receipt. New finite recovery is outside the
retained authorization; no budget or telemetry exception is silently expanded.
