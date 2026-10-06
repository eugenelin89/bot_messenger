# Personal Operator stabilization 01 — validation and delivery

**Status:** Active; implementation/local focused tests passed, real acceptance and delivery pending.

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
- Recovery review found audit recording could cross the hard end after authorization. One clock snapshot now governs authorization and `claimed_at`; `recorded_at` is separate. The added boundary/retry test passes and proves one first-claim event. [Focused output](evidence/personal01/scheduler.txt).
- Real isolated short scheduled review, restart and idle interval: pending.

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
cutoff qualifications are explicit. Security: retirement script/source review found no
blocker; independent artifact review pending. Product and test reviews pending.

Production scheduler deployment is pending. Before delivery: full diff/check, fresh main,
normal PR/merge, exact merged build, protected consistent backup and inventory, safe restart,
retained Prompt 01–11 record verification, provider retirement recheck and final idle interval.
