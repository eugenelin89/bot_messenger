# ASK-02 private content foundation

**Status:** Source and evidence accepted; normal PR integration in progress

**Owner:** INV-REAL-01 sole writer; advisory specialists are read-only.

**Branch/worktree:** codex/inv-real-01 in bot_messenger-inv-real-01.

**Started:** 2026-10-13 18:39 UTC. **Initial ETA:** 90–150 minutes.

## Concrete next prompt and scope

Implement an unwired private SQLite Ask question/answer store and schema27 Company metadata
projection. Reserve immutable import and answer identities before committing private bodies;
commit the answer and its pending-authority outbox atomically in the private database. Reconcile
only exact existing identities. Bound owned history, rows/bytes and original retention horizons.
Apply every retained privacy control, including already-ACKed controls, before raw access.
Keep raw text, prepared requests and arbitrary errors outside Company DB/WAL/audit/backups.
No runtime, network, grants, employee execution or application wiring is added.

Baseline is merged7fcb573/PR82. Production remains d262a8d/PID712263 with healthy database/
dispatcher and degraded runtime. Strict account401 is not retried without changed login/routing.
Linux observed workflow timing remains unresolved. Website d51288fc/buildvEx_G48mhinsBJBGK839J
serves truthful unavailable Ask; its writer is completing independent production-path/acceptance
work. The hourly completion loop remains active; full project completion is not claimed.

## Requirements and reviewed boundaries

AGENTS.md, README, product vision, system architecture, Decision028, Decision029, Decision047,
investment DECISIONS/SIMULATION_RULES/ROADMAP, ASK_BOTSQUAD and its roadmap, prior ASK01/02
acceptance and control journal. Owner-reported Yahoo permission and release authority stand.

Architecture/recovery/security design review accepts the dormant split-store slice with:

- Explicit metadata whitelists; no claim/question/answer/prepared-wrapper JSON in Company.
- Company reserve → private commit → verified Company completion, without nested or attached
  cross-database transactions. Pending and formerly-available states remain distinct.
- One immutable answer reservation; a missing body never authorizes regeneration/model replay.
- Company suppression first, private tombstone+body/outbox deletion atomically next, application
  receipt last. Missing/mismatched custody and corrupt/missing committed content fail closed.
- Persistent private-store identity, private modes, canonical paths, single-link files and
  explicit exclusion from Company and configured ordinary backup roots. No credentials.
- Original retention deadlines never slide. Pending rows count toward caps. Cleanup works
  while admission is disabled. Unknown expired evidence stays held for recovery.
- Existing suppression-journal-v1 claims remain contentPurgeVerified:false and
  restorationVerified:false. SQLite row deletion proves no backup/filesystem/provider erasure.

## Implementation and checks

1. Add passive Company metadata migration and dedicated private SQLite custody/schema.
2. Add exact import, owned history, immutable answer/outbox, receipts, suppression and recovery.
3. Test each commit boundary with authored faults; no duplicate or resurrected raw content.
4. Prove ownership, identity conflicts, corruption/missing-custody holds, deadline tightening,
   capacity, rollback/clock fences, private paths and absence of raw canaries in Company storage.
5. Run focused source/recovery/migration/contract tests, broaden applicable persistence checks,
   build/typecheck/manifest and diff checks; retain any failures. Review exact final source.
6. Record acceptance, source hashes and morning handoff; normal PR/check/review/merge.

No Level3 claim: the component has no model/runtime caller. Genuine Ask routing, independent
finite authority, service backup/restore custody and full cross-system acceptance remain later
integration work. Validation uses admitted isolated Linux; Motion owns the Mac native slot.
Linux initial admission:32,958,796KiB disk free,1,551MiB available RAM; serial512MBheap/nice10.

## Review and validation progress — 19:18 UTC

Private storage build and initial29/29 tests passed; expanded54/54 passed including seven real
SIGKILL checkpoints in disposable child processes. Review corrected negative-receipt purge,
held-state pruning, orphan cleanup, sidecar symlinks, exact Company journal ownership, cleanup
after admission change, receipt corruption and separate-clock freshness. Architecture,
security and recovery reviewers report no remaining blocker for the dormant scope.

First broad run:377/384 passed,7 failed because the existing simulator schema allowlist rejected
new27. The explicit allowlist now includes27; all checks/failures are retained. Final source is
frozen for build/typecheck/contract and broadened migration/control/Ask/financial checks.
No account, market, model or production HQ change. Actual elapsed work remains inside the
original90–150minute estimate. Website closed release is independently read back; its separate
receiver rollout is delegated to the website chat.

Final acceptance review requested a same-Company two-service isolation case with identical
opaque IDs; added. A second broad run passed431/432, with the sole future-schema fixture still
using current27. It now uses28; remaining schema count expectations in AI-profile/engineering
were updated and those suites added. Source behaviors passed; both failures are retained.
Final source is frozen again with59 private-content cases. No assertion was weakened.

## Final validation — 19:29 UTC

Implementationd9e422ea691f25ef79f13ed183bb76f49597e859. All416 selected build-input hashes
match Linux. Final build/typecheck/contracts and458/458 checks pass with no failures, skips
or cancellations;59 cases exercise private content and7 actual child SIGKILL boundaries.
Sixteen lossless logs, initial failures, exact commands/source hashes and independent
production/public read-backs are recorded in the acceptance receipt. No full regression,
physical purge/restore, provider execution or Linux observed-workflow readiness is claimed.
Independent final evidence review and normal PR/check/merge remain before delivery.

Final independent evidence review accepted all416 source hashes,17 changed-code hashes,16
raw/wrapped logs, read-backs, lock/manifest and the complete reported counts. No mismatches
or blocking findings. Acceptance is strictly dormant source; all operational exclusions stand.
