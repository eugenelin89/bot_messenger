# Execution Plan — Prompt 11 closure and Personal Operator stabilization 01

**Status:** Active
**Owner:** Parent Codex chat; sole writer, integrator and deployer; specialists read-only
**Branch:** `codex/personal-operator-stabilization-01`
**Worktree:** `bot_messenger-personal01`
**Started:** 2026-10-06
**Initial ETA:** 2–4 hours, dependent on authentication and real runtime acceptance
**Current ETA:** 30–60 minutes remaining after real acceptance; merge/deployment gates remain

## Objective and boundaries

Close Prompt 11 honestly at bounded supervised scope, retire its exact temporary
credential, fix the observed scheduling defect, and prioritize one owner's dependable
daily use. This is not Prompt 12. No additional external business action, pilot-branch
change, integration expansion, or early-navigation race implementation is authorized.
Private pilot receipts and operator material stay outside Git.

## Baseline and investigation

- Fetched current origin/main before edits: `4a05ba46a78d44bc836c26043bd846c6a00e6749`.
- Production reports the same revision, healthy database/dispatcher and ready runtime.
- Read repository instructions, product/architecture context, Decision 022 and private
  live-pilot completion, schedule intervention and idle records.
- Exact failure: `saveSchedule` accepts `end_at >= due_at`; due discovery creates an
  occurrence at or after its due instant, but claiming cancels when `now > end_at`.
  The first execution repeats the hard end check. A zero-width window therefore needs
  an exact-millisecond claim. The private live pilot's version 1 had equal due/end;
  an owner edit produced version 2 with a ten-minute window. Preserve both versions.
- Clock uses a deadline-driven timer, not a fixed polling tick. Occurrence creation and
  consumption are atomic, then claim/cycle/request creation is separately atomic.
  IDs bind schedule/version/due, missed recurrence times coalesce, overlap holds one,
  cancellation is terminal, and first dispatch rechecks authority and end time.
- Review one-time/interval/daily representations, worker schema, owner UI, DST tests,
  restart/catch-up and schedule edit/version behavior before finalizing the rule.

## Steps and evidence gates

1. Verify private closure; revoke only the exact pilot GitHub token, then use trusted
   local controls to revoke its grant and retire only its provider config/secret.
   Inspect idle work, preserve pause, back up SQLite consistently, restart and compare
   original rows; retain receipts, failed execution and intervention history.
2. Choose/document the smallest coherent schedule rule; implement authoritative
   validation, actionable worker feedback and owner form guidance/validation.
3. Focused deterministic jitter, boundary, catch-up, expiry, restart, duplicate,
   cancellation, stopped/revoked authority, versioning and idle tests; retain DST.
4. Update current-facing closure and unnumbered Personal Operator direction; append
   next unused decision without rewriting historical checkpoints.
5. Read-only recovery, architecture, security, product and test specialist review;
   parent resolves evidence-backed blockers. Run relevant milestone regressions.
6. Harmless real short internal review on isolated HQ, no timing repair, exactly one
   occurrence, fresh real execution, restart where practical, final idle sample.
7. Inspect full diff/check, fetch/reconcile main, commit/push, PR, normal merge, exact
   build, protected production backup/preservation, safe deploy/restart and idle proof.

## Validation and preservation

No schema change is planned. Preserve all prior rows/IDs/fields except explicit grant
revocation and ordinary startup timestamps, with new audit/control records appended.
Prompt 07, WE-01, Prompt 08/09/11 and indirectly affected Prompt 10 deterministic
regressions are required; no unrelated expensive live workflow without changed risk.
Record actual counts and distinguish fake runtime tests from real isolated acceptance.

## Evidence ledger

| Check | Result | Source |
| --- | --- | --- |
| GitHub token | Exact named temporary token deleted; GitHub success notice and empty fine-grained token list | Private screenshot; no token value read |
| Prompt 11 live acceptance | C11-1/2/4 pass; C11-3 pass within supervised scope | Protected/private completion and exit packet |
| Source baseline | Local/origin/production `4a05ba4` | Fetch and production health |

## Decisions and remaining work

Chosen rule: strict 30-second minimum first-due dispatch window, preserving the inclusive
hard end and existing bounded catch-up. No implicit grace or schema migration. This matches
the shortest supported scheduling lead, tolerates ordinary deadline-timer jitter and leaves
capacity/restart tolerance to a longer explicit window. Later recurring dues near the end
may expire. Worker and owner paths share validation; original schedules/history stay intact.

Implementation, public closure and Decision 026 are complete. Focused 68/68, relevant 293/293,
post-review affected 186/186, Ubuntu affected/infrastructure 206/206, browser 2/2 pass (overlapping counts). Recovery audit-boundary
finding corrected and re-reviewed; architecture has no blocker. Retirement preserved 2,624
rows/102 tables and revoked only the exact pilot authority. Browser harness wall-time mistake
and retirement collector pre-mutation session-key error are retained as failed attempts.

Real isolated acceptance passed: worker-created version 1, zero owner corrections, 28 ms
claim jitter, one completed occurrence, two real executions in fresh sessions, restart before
due with no work growth, STOP and 30.032 seconds idle. Fixture executions are distinguished.
Security independently accepted private retirement evidence; product final snapshot passed.
Recovery and test reviewers independently accepted the live artifacts with no blockers.
Merge and deployment remain pending. No overall
completion or production scheduler-fix claim until these gates have actual evidence.
