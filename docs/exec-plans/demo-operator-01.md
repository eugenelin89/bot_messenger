# Execution Plan — Demo Operator 01

**Status:** Real-run and regression acceptance passed; delivery recorded in task handoff
**Owner:** Codex Demo Operator task
**Branch:** feature/demo-operator-01
**Worktree:** bot_messenger
**Started:** 2026-09-28 09:50 UTC
**Initial ETA:** 60–120 minutes
**Latest ETA:** 10–20 minutes remaining at 10:40 UTC for documentation and final delivery.

## Objective

Implement a small reusable browser operator and capture one truthful, self-verifying
StudyPlan workflow on the existing development HQ. This is an interlude, not Prompt 06.

## Scope and boundaries

- Fresh Project in the existing HQ; no second service or reset.
- Consequential demo actions only through real UI controls. Read-only API assertions.
- Scenario, browser driver, assertions and recording separated.
- Exact scenario-bound approval checks; stop on unexpected approvals or failed assertions.
- Preserve authenticated validation completion receipts, confined recipes, independent
  workers/clones, exact reviews and trusted integration. No direct canonical Git writes.
- No credentials in evidence; videos remain outside Git with integrity metadata.
- User clarified root SSH is allowed only for backup, deployment and read-only host
  checks. All demo actions remain in the UI.

## Starting evidence

Fresh fetch confirmed local HEAD and origin/main at
`50ba2931b21b99c2a9be14916fb6bcb042ea458d`; clean checkout, audit worktree preserved.
Live service health reports the same SHA, ready runtime, paused HQ, no active executions,
no pending approvals, one retained Atlas, one completed historical task, no Projects.
Retained Atlas tool schema is 4; generic CTO/engineer/reviewer compatibility remains enforced.

## Work sequence

1. Read current docs/code/UI; inspect and protect host state with private backup.
2. Implement bounded browser driver, StudyPlan scenario, assertions and evidence recorder.
3. Test parsing, ordering, fail-stop, redaction, approval allowlist and bounded paths.
4. Run against actual UI. Preserve failures, fix real blockers with regression tests,
   then restart from a fresh Project. Never present a failed attempt as a tutorial.
5. Verify final Git/review/validation/worker evidence and retained host history.
6. Produce tutorial artifacts and video metadata; update current-facing docs and links.
7. Fetch main again, integrate normally, push, deploy exact final main and verify health.

## Validation

Focused deterministic operator tests, full existing suite for shared product fixes,
security review of browser/approval boundaries, real Ubuntu UI acceptance and host
preservation comparison. Existing forged/missing/early-exit receipt regressions remain.

## Acceptance closure

Protected backup and preservation checks passed. The approval live-update product
blocker was fixed at `1f177f0`. Five attempts remain truthfully failed and archived
through the UI; run 05 completed real integration but exposed a legacy-field assumption
in the operator's final specification check. The corrected check follows current Project
task provenance with a regression. Failed evidence was never relabeled as successful.

Fresh run 06 passed all assertions, producing a continuous 5m46s recording, 17 live
screenshots plus one actual video frame, transcript, events and narration. Grace approved
round 1; the real StudyPlan full recipe passed 24/24. The finished Project remains active
and HQ paused. See the [tutorial](../tutorials/demo-01-studyplan/README.md).

Local deterministic suite: 120 passes, one Linux-only skip. Hardened Ubuntu: 121/121.
Provisioner: 9/9. Explicit Chrome approval regression: 1/1. Existing validation-receipt
adversarial tests remain included. Artifact integrity, credential-pattern scan, screenshot
associations, changed Markdown links and whitespace checks passed.

All 20 original validation databases, 245 root records, 78 account mappings and 40
original main-company rows passed comparison. Canonical Git and both worker clones
match their trusted evidence. No `src/` or `deploy/` files changed from audited main.
No new Decision 015 is needed; existing browser/test and Project boundaries suffice.

## Delivery procedure

Fetch current main again, preserve any newer valid source, integrate the feature normally
without force push, and deploy the exact merged main to the existing HQ. The final task
handoff records accepted feature, local main, origin/main and deployed SHAs, with repeated
service/readiness/paused-state and retained-evidence checks. Large videos remain outside
Git at the exact location and digest in the tutorial.
