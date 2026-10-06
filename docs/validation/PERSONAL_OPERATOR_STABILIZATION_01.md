# Personal Operator stabilization 01 — validation and delivery

**Status:** Complete — bounded closure, credential retirement, scheduler acceptance and production verification passed.

This unnumbered task closes Prompt 11 documentation, retires its exact temporary credential,
corrects schedule admission and records the owner priority in Decision 026. No new external
business action or Asymmetri pilot-branch change belongs to this task.

## Scheduler contract and deterministic evidence

Root cause: equal due/end was accepted, but any later claim failed the hard end check.
The deadline-driven dispatcher uses `setTimeout`/events, not a guaranteed fixed tick.
New/edited schedules require at least **30 seconds** between first due and end. This fixed
policy floor tolerates ordinary timer jitter and matches the shortest supported review
lead/interval; it does not promise capacity. Longer windows cover congestion/restarts.
No time is silently added. The inclusive hard cutoff and existing bounded catch-up,
coalescing, occurrence identity, authority, pause/cancel and versioning rules remain.
Later recurring dues can still coincide with the hard end and expire. No schema migration
or historical-row rewriting is required.

Worker errors explain the minimum and correction; the owner form flags zero/negative/short
absolute windows before submission. Daily IANA/DST resolution remains server-authoritative.
New audit records distinguish occurrence claim from first execution claim and record
nominal due, actual claim time, deadline, lateness and timing classification. Provider
turn-start confirmation remains separate runtime evidence; no claim of exact provider-start
timing is inferred from an execution claim.

- Focused mandate/scheduler suite: **68/68 pass**, no failures/skips. Twenty new cases cover
  owner/worker correction, exact minimum, before/exact/late due, inclusive end, end+1ms,
  restart before/after due and beyond end, atomic rejected edits, old zero-width retention,
  cancellation, stop and revoked coordinator/participation. Existing duplicate/one-occurrence,
  bounded backoff, idle, recurring coalescing and timezone/DST tests remain intact.
- [Owner browser suite](evidence/personal01/browser.txt): **2/2 pass**, including invalid-window feedback, corrected save and retained cross-timezone/DST cases. Initial sandbox launch was blocked; authorized rerun exposed a test-only wall-time conversion error, corrected without weakening assertions.
- [Relevant regressions](evidence/personal01/regressions-before-clock-audit.txt): **293/293 pass** across conversations, WE-01 research/revocation, working groups, schedules, business actions, Computer Use authority, HTTP, profiles and infrastructure. After the audit review fix, [affected final-source rerun](evidence/personal01/affected-final.txt): **186/186 pass**. These are overlapping suites, not additive unique-test counts.
- [Ubuntu affected/infrastructure regression](evidence/personal01/ubuntu-affected.txt): **206/206 pass**, no skips, under the installed service restrictions with an isolated test data path on the same final application source.
- Recovery review found audit recording could cross the hard end after authorization. One clock snapshot now governs authorization and `claimed_at`; `recorded_at` is separate. The added boundary/retry test passes and proves one first-claim event. [Focused output](evidence/personal01/scheduler.txt).
- [Real isolated acceptance](evidence/personal01/real-schedule-summary.json): **PASS** on
  source `50356bb003217d64afac06ff493cba52c67133e3`, using the existing guarded Prompt 09
  runner with a separate data root and loopback port. A worker created one schedule,
  version 1, with no timing correction. Due `2026-10-06T09:22:22.123Z`; first execution
  claimed at `09:22:22.151Z` (**28 ms late**), before explicit end `09:24:22.123Z`.
  A real provider turn started at `09:22:23.591Z`; two completed review executions had distinct sessions.
  One occurrence completed, Cycle 2 read the original evidence and chose STOP. The
  pre-due restart changed PID without changing work counts or pause state. A **30.032 s**
  final idle interval added no work. Zero business actions and ComputerSessions.
  The three interrupted roster-fixture executions are separate from the two real reviews;
  the objective/window were an explicit internal test, and model cost remains unknown.
  The validation service was stopped after evidence collection.

## Exact credential retirement

GitHub settings confirmed deletion of **BotSquad Prompt 11 Asymmetri pilot**. No other
credential was changed and no replacement was created. No authentication secret was read,
requested or recorded. The proof screenshot remains private outside Git.

Trusted local business control revoked the exact pilot grant. The operator removed its
credential file without reading/hashing it, retired active/pending provider config under
protected storage, removed only its environment assignment and restarted through systemd.
Pre-restart checks covered Tasks, executions, conversation requests, ComputerSessions,
schedules/occurrences and business operations. Pause state stayed unchanged.

Post-restart: new process with no provider setting, `configured:false`, ready runtime,
healthy database/dispatcher, loopback listener, eight workers and one receipt retained;
zero new executions, browser sessions or business actions. **2,624 original rows across
102 tables** were preserved, allowing only the targeted grant revocation and ordinary
worker startup timestamp refresh; retirement audit/control records were appended.
The backup and before/after/result records are in protected operator storage.

The first collector attempt used the wrong session response key and stopped before any
grant/credential mutation. Its consistent backup remains retained; corrected execution
passed. No provider observation/reconciliation or external action was used to test retirement.

## Reviews, preservation and deployment

Recovery: confirmed root cause and recommended explicit positive window without implicit
authority extension. Architecture: no source blocker; first-claim timing and recurring
cutoff qualifications are explicit. Security: independently verified exact retirement artifacts and private GitHub deletion
screenshot, no blocker. Product: final snapshot passed with no remaining strategy blocker.
Recovery and test reviewers independently cross-checked the final, timing, restart and idle
artifacts and accepted the narrow live result with no blockers. The test used prescribed
timing and a graceful pre-due restart; it does not prove autonomous timing selection,
in-flight recovery or sustained unattended reliability.

## Production delivery checkpoint

[PR #17](https://github.com/eugenelin89/bot_messenger/pull/17) merged normally as
`ecdbe7561c53d3d02ec3fef4f267095e678f364e`. Source, tests, scripts and dependency lock
are unchanged from the real-acceptance source; subsequent changes record evidence only.
No configured GitHub status checks/workflows were bypassed; full PR diff/check passed.

The [production checkpoint](evidence/personal01/production-checkpoint.json) records a
separate exact-merge build matching all **251 compiled/public files**. A protected backup
was taken with HQ, browser broker and provisioner stopped. The original **59,909 rows in
82 databases**, **212 worker homes**, **702 root records** and **427 account/group mappings**
passed preservation, excluding only ordinary `workers.updated_at`. No schema migration.
This retains the Prompt 01–10 history and Prompt 11's failed model turn, two schedule
versions (including the owner intervention), completed occurrence, approval/action/receipt,
evidence and STOP. Private originals and backup remain in protected operator storage.

Production: eight idle workers, 48 Tasks, 69 executions, two closed cycles, one completed
occurrence, one successful external action/approval/attempt/receipt, zero ComputerSessions.
Pause=false survived restart. Runtime, database and dispatcher are healthy on loopback.
The exact temporary credential and provider configuration are absent, no provider is
configured, and the retained business grant is revoked. All work counts stayed unchanged
through restart and a **30-second final idle interval**. No new external action occurred.
Task-owned validation services are stopped; no task-owned tunnel remains.

Delivery failures were preserved rather than hidden. The clean-checkout preflight first
stopped on generated Python bytecode; it was moved intact to protected storage. The first
startup then failed because the private operator script's `umask 077` propagated into Git,
making updated public runtime files unreadable by the service. Four Git-verified public
runtime files were narrowly made service-group-readable; private state/credential permissions
were untouched. A proposed broader repair was rejected by automatic approval review and
was not applied. The corrected operator script creates application/build files with normal
readable permissions and checks service readability before starting the verified build.
The successful health, preservation and idle evidence above was collected after recovery.

This is an executed code-delivery checkpoint, not an inference that a future documentation
HEAD is deployed. Final documentation-only merge/source equality is verified separately in
the operator handoff and protected completion journal.

## Remaining work candidates

No acceptance blocker remains. The likely next Personal Operator task is the existing
early-navigation/initial-state UI race, followed by clearer loading/status/error presentation
as real owner usage warrants. The race was not changed here. Decision 026 keeps feature
expansion deferred and creates no Prompt 12. Monetary model/provider cost and the earlier
pilot's readability/business benefit remain unknown or unmeasured.
