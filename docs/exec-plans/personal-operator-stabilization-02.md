# Personal Operator stabilization 02 — startup and navigation

**Status:** Active
**Owner:** Parent Codex task (sole writer/integrator/deployer)
**Branch:** `codex/personal-operator-stabilization-02`
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
- Remaining: PR/merge, exact Ubuntu rerun, protected backup/deploy, tunnel acceptance and idle.

Detailed evidence and retained failed attempts: ../validation/PERSONAL_OPERATOR_STABILIZATION_02.md.

## Documentation and remaining work

Inspected CURRENT_STATE, PROJECT_MEMORY, ROADMAP and stabilization 01 validation.
Update current claims only when supported; preserve historical Prompt 11 qualifications.
Create `docs/validation/PERSONAL_OPERATOR_STABILIZATION_02.md` with exact evidence.
Next candidates remain broader loading/status clarity, owner attention/pending actions,
common workflow simplification and maintenance UX; none are implemented here.
