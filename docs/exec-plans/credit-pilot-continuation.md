# Execution plan — Decision 037 remaining-budget continuation

**Status:** Active  
**Owner:** Parent Codex; specialists read-only  
**Branch:** `feature/credit-pilot-continuation`  
**Worktree:** `bot_messenger-credit-continuation`  
**Started:** 2026-10-10 America/Vancouver  
**Initial ETA:** 2–4 hours, subject to review and provider gates  
**Latest remaining estimate:** 20–35 minutes for remaining regression, integration, one provider attempt and handoff (06:01 UTC)

## Objective and scope

Preserve the stopped original pilot and its consumed reservation. Implement owner-private durable lineage outside disposable state, then validate, independently review and merge before one genuine Atlas turn. The current request releases at most one of the three remaining reservations; success does not release more. No production deployment, purchase, billing mutation, official run, live market data, brokerage, publication or recurring model work.

## Starting evidence and requirements

Clean local and remote main both `d1cbbea9f948c58555c59fd960d42caecc8e6b1d`. Read AGENTS, product/architecture/project memory, Decisions 029/031/034–037, investment DECISIONS/SIMULATION_RULES/ROADMAP, pilot/repair acceptance and run tutorial. All 47 original archive/disposable files matched the retained repair baseline without opening either database. Original reservation=1, confirmed provider turns=0, stopped scope revoked; fingerprint remains historically null. Existing approved model is exact `gpt-6-luna`, subject to fresh catalog verification.

Owner freshly confirmed reload OFF in this chat; provenance remains owner confirmation, not a billing API query. Private evidence records the confirmation separately from the historical 06:04 screenshot. Asymmetri Motion coordination initially allowed small checks; its phone/native slot was subsequently released before the serial full suite. More than 23 GiB was available during validation.

## Invariants and design

- Fixed owner-controlled authority location; manifests cannot choose/reset authority.
- Dedicated SQLite transactions, inherited count1/max4, unique successor, one release, append-only receipts.
- External reservation commits before local claim commit; rollback/crash never refunds.
- Independent one-shot admission commits before transmission; copied execution state cannot replay.
- Permanent stop after success/failure/uncertainty; restart never restores release authority.
- Bind exact original archive digest, successor/root/worker/request/execution/source, fresh account and routing hashes, billing confirmation and expiry.
- PR48 account-generation verification, tools, model and provider confinement remain intact. Genuine analysis stays unscripted and private.
- No HQ schema change planned; ordinary capabilities and historical evidence remain unchanged.

## Implementation steps

1. Implement dedicated lineage persistence, supervisor commands and runtime capability.
2. Add deterministic concurrency, crash, replay, identity and preservation coverage.
3. Run check/build/full/contracts/focused usage-recovery, privacy and diff checks serially.
4. Obtain read-only control-plane, security, recovery, accounting and acceptance verdicts; fix material findings.
5. Commit source/tests and acceptance docs, verify PR head/base, merge accepted source, synchronize and rebuild main.
6. Verify original archive, prepare one successor, perform official non-inference preflight, release Atlas once, stop and preserve private evidence.
7. Update acceptance and handoff with actual outcome/usage/unknowns, exact integration receipts and residual allowance.

## Evidence ledger

| Check | Result |
| --- | --- |
| Original evidence hashes | 47/47 unchanged, databases unopened |
| Initial independent design review | Control/security and recovery/accounting requirements incorporated |
| Initial full suite | 1,058 passed / 6 skipped / 0 failed; pre-finalization-fix development receipt |
| Final focused / contracts / usage-recovery | 111/111; 175/175; 81/81 passed |
| Final full suite | 1,059 passed / 6 skipped / 0 failed (1,065 total), 309.293 seconds |
| Source/test commit | `478c5b077ca2cbb5ef9e7660520b74a2a71c7c54` |
| Exact-source reviews | Control/security, recovery/accounting and acceptance approved; no material findings |
| Integration | Pending PR/merge/main rebuild |
| Actual provider turn | Not started |

## Documentation freshness and remaining work

Update Decision037 by dated amendment, new continuation validation, original repair handoff by additive note, pilot validation, tutorial, readiness, architecture and project memory. Keep original history and private bytes out of Git. Implementation and review fixes are complete. Final validation passed. Exact-source reviews passed. Git integration and the single genuine turn remain pending.
