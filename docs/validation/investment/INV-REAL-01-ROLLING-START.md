# Pending research waits for existing rolling capacity

Audit finding BSIA-001: at2026-10-15T12:00Z the deployed scheduler would reserve a final-cycle startup/finalization allocation of4 against7 retained rolling attempts and cap8. The third old reservation exits the strict24-hour window at12:01:13.039, within the unchanged13:00 cutoff. Throwing during enqueue can block already-started research unnecessarily.

The correction preflights the complete startup allocation before changing the occurrence/group. Only never-started pending research can persist a bounded retry; it waits for settled rolling usage to age out, or becomes missed at its original expiry. Permanent family/run/worker/day/cycle limits still fail; active/unknown work never becomes a retry. Independent journal/custody calculation is read-only and includes the retained accepted incomplete attempt. Actual enqueue/reserve checks remain authoritative. No schema, frozen authority, model cap, source hash, deadline, historical record or provider permission changes.

## Validation actually performed

Local Node24.10.0, Python3.12.12/yfinance1.7.0 through the existing fixture adapter. No real model, Yahoo request or production state used.

| Check | Result |
|---|---|
| TypeScript build | Passed final build07 |
| Canonical contract | Passed; contract1.0 and8 digests unchanged |
| New scheduler integration |10/10 passed,15.0s; exact threshold, no consumption-journal/custody mutation or new provider requests while waiting, current-session HOLD/BUY/rejection, cutoff, unknown/permanent exhaustion, draft openings, membership/sharing withdrawal, active nonretry |
| Exact observed recovery |1/1 passed,48.3s; seven exact reservation times, retained incomplete gap, real Store/Company/FiniteJournal reopen and Dispatcher recovery while pending, same retry/frozen authority, then fresh Oct15 typed HOLD in four turns and signed fixture publication |
| Existing focused regression | Original selection235 cases:214 passed,21 failed from local environment. Twenty custody fixtures passed on rerun with canonical `TMPDIR=/private/tmp`; localhost owner-API case passed outside sandbox after listener EPERM. All235 selected cases have completed passes across these non-overlapping selections; original batch was not clean |
| Independent specialist review | Read-only review found no authority bypass; required extra coverage above was added; final review found no blocking defect or additional necessary test for this correction |

Commands and raw logs are retained in [validation evidence](../../audits/2026-10-14/evidence/validation/manifest.json). Initial test errors are retained: one TypeScript union narrowing error; string-versus-number `nextWake` expectation; two wrong fixture column names; canonical Mac tmp custody and sandbox loopback restrictions. None was hidden by weakening production controls. No whole-suite, GitHub CI, genuine-provider or production-deployment pass is claimed.

Focused regression command selected `finite-hq*.test.js`, `finite-telemetry-recovery.test.js`, `investment-loop*.test.js`, `investment-paper-handoff.test.js`, `discussions.test.js`, `ai-usage.test.js` with test concurrency1. The observed selection was `--test-name-pattern='retained recovery closes and publishes a fill' dist/test/observed-late-close.test.js`. New tests discover current proposal/review identifiers through actual tool handlers. Authored model/data remain synthetic.

## Deployment boundary

Source integration is distinct from guarded production deployment. Automatic approval review rejected the initial delegation of deployment, stating this specific production mutation lacked authorization. No production restart, authority action, model dispatch, source fetch or financial operation was performed for this correction. A precise reviewed-commit deployment decision is required if that restriction remains. Existing HQ coordinator and scheduled operations retain ownership; do not deploy across an active collection/financial stage or renew any allowance.
