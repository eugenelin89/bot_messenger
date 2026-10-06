# Personal Operator stabilization 02 — startup and navigation

**Status:** Complete — code deployment and production acceptance passed
**Owner:** Parent Codex task (sole writer/integrator/deployer)
**Branch:** implementation `codex/personal-operator-stabilization-02`; evidence completion `codex/personal-operator-stabilization-02-completion`
**Worktree:** `bot_messenger-personal02`
**Started:** 2026-10-06
**Initial ETA:** 2–3 hours including browser/runtime checks, review and deployment.

## Objective and boundaries

Eliminate the initial-state navigation race while preserving the owner's selected view,
real loaded state, drafts and existing authority. Decision 026 keeps this an unnumbered
Personal Operator / Daily Driver correction. No Prompt 12, new capability, backend
semantic change, dependency or migration is planned. Production validation is read-only.

## Baseline and reproduction

Fetched `origin/main`: `1e5581a236e62bb9c712dc5753c984d61548437d`; existing worktrees
left intact. `public/app.js` installs navigation before awaiting session/state, then
`render()` immediately reads `state.workers`. Session failure also prevents EventSource
creation; ready reports connected before a successful state refresh. Computer Sessions
is absent from the navigation-triggered auxiliary refresh list.

Hold `/api/state` with Playwright routing, click navigation and retain the failing
baseline result. Apply the same sequence at desktop and narrow widths after the fix.

## Implementation and validation steps

1. Add deterministic startup/navigation browser tests against an isolated fixture HQ.
2. Establish a small readiness lifecycle, safe shell/loading/error presentation,
   recovery and mutation prerequisites; preserve serialized/coalesced refreshes and
   guard auxiliary responses by their current selection.
3. Run targeted tests, affected existing browser suites and relevant HTTP checks.
4. Obtain read-only `test_reviewer` findings and resolve material gaps. Other specialists
   are unnecessary unless the changed surface expands beyond frontend readiness.
5. Fetch/reconcile, inspect full diff, commit/push/PR/normal merge; test exact Ubuntu source.
6. Inspect production health/active work/pause; take protected backup; build/deploy exact
   merge and verify identity, preserved history, repeated real tunnel navigation and idle.

## Evidence ledger

- Held-state baseline failed deterministically at both desktop/narrow widths with undefined workers.
- Explicit booting/ready/degraded, safe shell, auxiliary loading, abortable serialized refresh,
  selection guards and inherited mutation controls implemented in public app/index/styles,
  computers/groups/mandates; regression in test/startup-ui.browser.mjs.
- Local: 21/21 focused; 32/32 overlapping affected/representative browser; HTTP 6/6; type check.
- Ubuntu installed Node/Chromium: 21/21 focused on isolated data, non-root.
- Test reviewer found transient disabled-button restoration and held obsolete request blocking
  reconnect; both fixed with specific regressions. Follow-up review found no pre-merge blocker.
- Production preflight healthy and idle; pause=false, 8 workers/48 Tasks/69 executions retained.
- PR #19 merged normally: ee4f0992603b21c902f06e348db0bc88a479c802. Exact Ubuntu rerun 27/27.
- Exact production build: 251 compiled/public files match independent build. Protected backup
  and preservation of 59,909 original rows/82 databases, 212 worker-home ownership/mode/ACL records, 702 root records, 427 mappings.
- Real tunnel acceptance: 8 hard reloads, 13 tabs, desktop/narrow, native tunnel reconnect,
  zero pageerrors/mutation requests; active tab and cached content preserved.
- Pause=false; 8 workers/48 Tasks/69 executions/1 business receipt retained; zero ComputerSessions.
  Provider remains unconfigured/credential absent/grant revoked. Post-restart and post-UI
  30-second idle intervals left every table count and pause state unchanged.
- Completion documentation is a separate normal PR; final exact identity receipt is recorded
  in the protected delivery journal and final handoff. That documentation merge preserved application/test/dependency trees.
- Its final tunnel rerun exposed a reconnect-label ordering case; a deterministic red test
  confirms failed-state before stream-error masks the reconnect label. One status-priority
  condition fixes it, with 33/33 affected browser tests (22 startup) and read-only reviewer
  acceptance. Final branch: codex/personal-operator-stabilization-02-reconnect-status.
  The final exact deployment receipt distinguishes this application follow-up from PR #19.
- Exact PR #21 Ubuntu run exposed a boot-test release/cancellation overlap (27/28).
  Buffered diagnostics show the renewed request did not reach the fixture server;
  transport attribution remains unresolved. Separate boot-control completion from ready
  renewal without weakening the dedicated abort-before-release reconnect case. Preserve
  failure/trace; rerun affected tests and exact Ubuntu, plus un-routed native production
  reconnect before closure. Test-only branch: codex/personal-operator-stabilization-02-test-order.

Detailed evidence and retained failed attempts: ../validation/PERSONAL_OPERATOR_STABILIZATION_02.md.

## Documentation and remaining work

Inspected CURRENT_STATE, PROJECT_MEMORY, ROADMAP and stabilization 01 validation.
Update current claims only when supported; preserve historical Prompt 11 qualifications.
Create `docs/validation/PERSONAL_OPERATOR_STABILIZATION_02.md` with exact evidence.
Next candidates remain broader loading/status clarity, owner attention/pending actions,
common workflow simplification and maintenance UX; none are implemented here.
