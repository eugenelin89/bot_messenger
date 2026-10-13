# HQ-READY-04B — deployment and authorization preparation

**Date:** 2026-10-12 America/Vancouver / 2026-10-13 UTC
**Scope:** Read-only actual-host inspection, offline blocker reproduction, documentation and reviewed Git integration
**Status:** Preparation accepted by four independent reviewers; genuine deployment/trial BLOCKED

## Decision-ready result

[The complete owner packet](../../operations/HQ_READY_04B_APPROVAL_PACKET.md) defines the
exact Scout/Grace/AAPL scope, current eligibility findings, recoverable schema14→24 plan,
whole-HQ outage, Linux controls, five independent decisions, future times, rights/credit
gates and R1–R11 acceptance. [The configuration appendix](../../operations/HQ_READY_04B_LINUX_CONFIGURATION.md)
makes proposed systemd/failure-stop behavior reviewable. [The copy-ready execution prompt](../../operations/HQ_READY_04B_EXECUTION_PROMPT.md)
stops on missing approvals/evidence and the newly discovered source blocker.

The exact assessed candidate `da6d3e10c9d8484c4a924d192c30c7c70d6fb743` is **not approved
for genuine deployment/trial**. Its fresh finite authority is held by service recovery,
and normal controls cannot release it before first collection. A narrow explicit-owner
draft-release source follow-up, independent review, accepted integration and a newly
presented exact-commit D1 are required.04B makes no executable change.

## Starting point and fresh actual-host evidence

Fresh Git fetch confirmed clean local and remote main at the assessed candidate, the
user's stated baseline. PR71 is merged;03H direct collection and04A integration remain
unchanged. The sole writer uses `codex/hq-ready-04b` in its own worktree.

The [machine-generated sanitized receipt](../evidence/hq-ready-04b/host-readonly.json)
was captured at2026-10-13T06:04:33Z, with
[supplementary observations](../evidence/hq-ready-04b/supplementary-observations.md)
from the surrounding read-only SSH checks. Database access used mode=ro, query_only and
a read transaction; only table/identity/aggregate fields were emitted. No production
transcript, mission, credential or full database was exported.

- Ubuntu24.04.5, kernel6.8.0-142, Node24.21.0; healthy actual HQ remains at
  `a72cee080989960d2a9e1e74d9236157ce1a0448`, schema14.
- Eight enabled employees. Exact Scout and Grace are persistent, enabled with enabled
  principals/internal_message and idle. Zero unresolved runtime attempts. Grace has a
  ready Linux engineering identity; Scout's lack of one is not a discussion requirement.
- Installed executable Codex0.157.0 and supported login-status ChatGPT mode verified.
  Model cache dated October8 advertises gpt-6-sol/low. **Fresh online availability,
  exact personal plan/account/routing, credit eligibility and reload-OFF are unverified.**
- Root-owned application source; actual Node executable UID/GID1001 mode0755. Do not
  execute it as the root guard. Verified same-version root installation is required.
  Installed checkout is detached; service-user Git fails dubious-ownership checking.
- RAM about1.92GiB/1.46GiB available,2GiB swap/about40MiB used, root disk about35.9GiB
  available, `/run` only197MiB. Effective core soft0/hard unlimited. No research guard,
  manifest/tmpfs or finite journal/checkpoint exists at the fixed expected paths.
- System Python3.12.3, no required Python3.12.12/yfinance adapter environment established.
- Retained48tasks/69executions,8runtime bindings,1exhausted review schedule,0groups;
  1blocked task remains historical.68completed/1failed executions, zero running work.
  Browser/provisioner services are active, HQ unpaused. Idle at inspection is not a
  guarantee of harmless later interruption.
- SQL quick_check `ok`, zero FK violations. A prior protected70,602,867-byte backup
  archive passes gzip integrity and has a recorded SHA-256. This does **not** establish
  a new rollback point, full independent restore or cloud backup exclusions.

Initial `git fetch` failed inside restricted networking and succeeded with the authorized
network escalation. Initial remote `node` lookup failed because SSH PATH differs from the
service; explicit installed path verification succeeded. These failed probes are not
runtime failures or evidence of changed production state.

## New blocker B1 — evidence and narrow disposition

Relevant accepted source: `Dispatcher.start`, `Company.recover`, `FiniteHQ.recover`,
`FiniteJournal.recover`, and `InvestmentLoop.control/holdFinite`.

`FiniteJournal.recover` appends a hold for every unstopped authority. A new research loop
remains draft because `holdFinite` only blocks active loops. Collection and Start require
unheld authority; draft Resume is disallowed; Pause→Resume needs evidence that cannot
yet be collected. The prescribed stop/approve/restart sequence therefore deadlocks.

The parent built the exact candidate locally (`npm run build`, pass), then used existing
`researchFixture` with authored ACME, fixture custody and fake adapters. After consent,
approval and the actual `Company.recover()` path, the
[reproduction receipt](../evidence/hq-ready-04b/fresh-authority-recovery.json) records:

| Action | Actual result |
| --- | --- |
| Collect after recovery | Recovery requires exact owner resume of eligible future work |
| Start after recovery | Same hold rejection |
| Resume draft | Only held loops can resume |
| Pause then Resume | Fresh collection has not admitted evidence |
| External effects |0fixture-wire calls,0admitted observations,0investment executions; no Yahoo/model call |

This is an authored local reproduction of the startup recovery method, not an actual
Linux deployment/reopened dispatcher test. The first diagnostic attempt reached the same
flow but its final count query referenced a nonexistent table; it exited without a
receipt. The corrected diagnostic queried existing evidence/execution tables and counted
the fake wire. Temporary fixture state was closed/removed in both runs. No assertion or
runtime control was weakened and no application source/test file was changed.

The proposed follow-up adds an explicit authenticated owner, digest/revision-bound,
idempotent release for an untouched future research draft **after recovery**. It must
preserve draft state, approvals, schedules and every consumed/unknown entry, invoke no
collection/model, and deny consumed, uncertain, expired, stopped, changed or missing
authority. Test the actual reopened dispatcher→release→collection→start sequence and
crash/concurrent/replay denials. Do not solve this by skipping recovery, direct journal
editing or pre-restart resume.04B documents this blocker and stops short of implementation.

## Other preparation corrections from independent review

- Global no-swap and both core limits0 are required. Per-cgroup swap0 and current soft0
  are insufficient. Root Node ownership is a known remediation, not a presumed pass.
- Cleanup begins at retainUntil. Proposal now triggers at start+1h50 and requires
  completed deletion by start+2h, leaving ten minutes for observed cold cleanup.
- Whole HQ stops at activity expiry and remains stopped through cleanup: about50minutes
  plus restoration, in addition to initial maintenance. Brokers in separate cgroups need
  explicit maintenance handling. Global Pause must later be explicitly released for due
  authorized work and restored at closure.
- Schema20 backfills incomplete legacy ai_usage. Actual14→24 proof must preserve every
  original rowid/field and validate that exception;04A's23→24 fixture alone is insufficient.
- Pre-consumption matched rollback is distinct from post-consumption schema24 recovery.
  Never rewind independent custody or discard new execution/usage/non-content receipts.
- Fixture isolation needs its own passwd home and the exact hardcoded botsquad.service.
  Changing only BOT_DATA_DIR or using another service name is not equivalent.
- Final runtime preview/manifest/account identities cannot exist before approved setup.
  This review packet is not a runtime consent digest. Fresh source rights, provider terms
  and reload-OFF remain unresolved, not defaulted to allowed.
- Capacity for at least six turns must remain before collection/start; eight is a ceiling.
  Assess genuine content privately before19:00 shutdown and retain only verdicts/IDs/hashes.

## Independent review ledger

Four development specialists are read-only and independent of the parent writer. Their
advice is not a BotSquad employee contribution, owner authorization or genuine trial.

| Reviewer | Material findings / disposition |
| --- | --- |
| Architecture | Independently confirms B1; narrow owner-release direction, post-restart ordering, live-digest gates, global Pause release, root code/runtime custody. Final PASS for preparation; timing correction applied: R4–R7 before shutdown, R10 only after observed cleanup. |
| Security | Identified observed Node UID1001 root-execution blocker; required exact unit/failure action and honest conditional D1, no-swap/core, manifest access, remote-retention/rights. Final PASS for preparation; no remaining blocking document findings. |
| Recovery | Discovered B1; schema20 backfill exception, exact preservation, phase-specific rollback, finite passwd-home custody, whole-service/cold-cleanup and pause requirements. Final PASS for preparation; live operation explicitly blocked. |
| Acceptance | Distinguishes cached vs fresh account/catalog, requires supplementary host receipt, minimum remaining workflow budget and substantive owner review before stop. Final PASS for preparation; all nine requested deliverables present, genuine checks NOT RUN. |

## Validation and remaining gates

Completed: clean starting-source verification, fresh read-only host inspection, targeted
current-source audit, unchanged-source TypeScript build, authored B1 reproduction and
four requested specialist reviews. Final documentation checks passed: all10 changed files
are Markdown/JSON under docs;102 relative links resolve; both evidence JSON files parse;
credential-pattern/manual content review found no secrets or production transcripts;
Vancouver/UTC conversions, future schedule and frozen request epoch bounds agree.
`git diff --check` passes. No GitHub Actions workflow is present in this checkout.

Not performed: source repair; actual schema14→24 migration/backup/restore; Linux fixtures;
host files/service/swap/authentication changes; real model/account preflight beyond supported
status; source permission verification beyond documented reports; reload dashboard check;
Yahoo request; genuine employee inference; credit expenditure; paper trades; deployment;
Asymmetri/publication. No broad regression suite was rerun for documentation-only changes;
historical source acceptance remains precisely the evidence reported in04A/PR71.

Still required before deployment: B1 accepted replacement commit and new exact D1; reviewed
fixture driver and Linux configurations; exact verified Python artifacts; independent
backup destination/restore proof and source/build custody. Still required before data/model
use: completed Linux confinement/cleanup, exact source/model-processing rights and actual
provider/account-retention terms, strict fresh account/model/routing, reload-OFF evidence,
both live preview consents and independently provisioned finite approval.

All R1–R11 genuine trial checks remain NOT RUN. Two-real-session H1–H9 paper acceptance
remains separate.03B/03D/03E/03H remain spent; Decision037 remains permanently4/4. Historical
files/receipts were not edited or reconstructed. No new live authority was provisioned.

## Git integration and final handoff

The reviewed change is documentation-only on `codex/hq-ready-04b`, based on the exact
assessed source above. The final handoff supplies the resulting commit/PR and synchronized
main identity without a self-referential document hash. The result is a prepared,
reviewable blocked packet; it does not label the host or assessed source trial-ready.
