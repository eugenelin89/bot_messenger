# Prompt 11 validation — business operations

**Status:** Implementation and acceptance in progress; not a completed live milestone.
**Branch:** `feature/prompt-11-business-operations`
**Evidence modes:** local deterministic/real browser with SIMULATED provider; Ubuntu and live
business evidence remain separately pending. No private Asymmetri source or credential is here.

| ID | Required evidence | Status |
| --- | --- | --- |
| C11-1 | Useful bounded evidence/capabilities and reviewed authority | Implemented; focused local checks/reviews; Ubuntu runtime pending |
| C11-2 | Exact approved real external action, provider receipt, observed real effect | Pending credential, repository workflow and exact owner approval |
| C11-3 | Real two-cycle scheduled pilot, restart/context recovery and supervision | Fixture recovery/scheduling checks passed; real Ubuntu/runtime/live pilot pending |
| C11-4 | Real baseline, sources, usage/costs/unknowns and evidence-driven next decision | Model schema and fixture checks implemented; live evidence/decision pending |

## Local evidence and retained failures

- Focused business domain, production adapter over controlled transport, and migration suite:
  **73 passed, zero failures/skips** at the latest focused run. Fixtures are not C11-2.
- Actual database close/reopen tests cover approved, preparing, transmitting and receipt states;
  one continuation, retained lineage and no blind replay. A separately built populated v13
  database migrates/reopens three times with every original rowid/field preserved, integrity/
  foreign keys intact and zero new business authority.
- Adapter contract tests validate exact request bytes, fixed host, repository identity,
  tree/blob/UTF-8 checks, symlinks/executables, redirects, response bounds, timeout, protected
  files, changed content, revocation boundary, lost response, actual parent and ambiguous history.
- Authorization checks include immutable fields/approval, owner boundary, worker self-approval
  denial, expiry/stop/pause/revoke, late success, cross-grant unknown fencing, source withdrawal,
  interruption/shutdown, worker reservation and separately approved exact compensation.
- Real headless Chrome exercised local UI/backend at desktop and mobile widths: reviewed hash,
  disabled approval until acknowledgement, one fixture effect/receipt, passive compensation
  request and no JavaScript page errors. Screenshots are local protected validation artifacts.
- Initial compile failures: unused test import and wrong ClientDTO constructor; corrected.
  Initial test failures retained: null-prototype comparison, runtime-recovery timestamp versus
  pure migration comparison, and sandbox loopback EPERM. Corrected tests separate preservation
  from runtime mutation; loopback tests reran with authorized local networking.
- First adapter transport fixture incorrectly emitted strings rather than network Buffers,
  causing parsing failures; corrected and positive/negative adapter cases passed.
- First full suite: 362 tests, 358 passed, three failed, one skipped. All three failures were
  legacy tests expecting schema 13 instead of additive schema 14. Expectations were updated
  without weakening retained-row assertions. Full rerun: **367 tests, 366 passed, zero failed, one Linux-only skip** (53.3 seconds).

## Independent review and disposition

Parent remains sole writer/deployer. Project-scoped specialists operated read-only.

| Specialist | Material finding | Disposition |
| --- | --- | --- |
| Product strategy | Prefer an actually useful operations correction; do not equate document presence with business growth | Candidate is scoped document clarity; business signal/cost unknowns explicit |
| Product strategy | Preserve Asymmetri branch/review flow; do not choose direct-main merely to fit adapter | Normal owner-prepared short-lived branch preferred; exact exception would require separate explicit approval |
| Security | Withdrawn non-baseline evidence or old Decision could still authorize effect | All evidence withdrawals invalidate prior action/Decision before transmission |
| Security | Worker observation bypassed evidence-mode gate; replacement metacharacters changed bytes | Mode checked before/after read; metadata-only return; literal replacement |
| Security | Credential ancestors lacked owner check; receipt parent guessed baseline head | Root/service ownership required; actual validated provider parent retained |
| Recovery | Shutdown allowed preflight transmission; multiple/orphan proposals stranded cycles | Immediate shutdown admission gate; one distinct intent/execution; orphan cancellation |
| Recovery/test | Exception hooks were not crash/reopen proof; migration test began already migrated | Added actual persisted-state reopen and populated v13 migration tests |
| Architecture | Read cancellation was dropped; same-worker healthy work raced executor preflight | Signal propagated/transport aborted; pending callbacks gate commitment; independent worker reservation |
| Test | Fixture adapter alone did not test actual GitHub protocol; catalog leaked withdrawn prose | Production adapter transport fixtures; bounded metadata catalog and withdrawal checks |

Final source/evidence review follows Ubuntu validation; no pending live gate is silently waived.

## Ubuntu, deployment and live evidence

First Ubuntu attempt (`20261006a`, source `95bd394`) failed during isolated roster setup:
the harness attempted to hire a researcher from a product Task, correctly rejected by the
existing role policy. No model or business action ran. Its database/journal are retained.
The harness now uses separate product/research setup Tasks through the unchanged authority
path. Host regression paths were also aligned with the existing operator path guards before use.

The first Linux engineering/identity run used the advertised default `gpt-6-astra`, while
the retained historical runner pins `gpt-6-sol`. Its CTO created the local fixture repository
then declined allocation because it could not inspect recipe IDs with the available legacy
tools. Completion was correctly rejected for missing trusted integration. Retain this model/
legacy-workflow limitation; the regression runner now matches the historical model configuration
and repeats in a fresh directory, without changing production tools or weakening assertions.

Acceptance remains pending. Isolated harness under `scripts/business/` refuses retained production paths and
uses real Codex workers with a visibly SIMULATED persistent provider. Risky fault tests are
fixture-only. No production grants, private target writes or live approvals have occurred.

Before delivery: protected production snapshot, every original row/field/identity/home/grant
inventory, repeated offline migration, relevant Linux regressions, normal PR merge, exact
merged build/deployment equality, idle/no-work check and cleanup of owned validation processes.

The real pilot exit packet must still record original mandate/envelope, exact authorized
target, actual baseline/source, company-selected alternatives/work/Decision, exact owner
approval, action/receipt/result, scheduled occurrence and Cycle 2 decision, usage and cost
unknowns, failures/interventions, limitations and next review. A fixture cannot fill these rows.
