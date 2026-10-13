# Execution Plan — HQ-READY-03H direct Yahoo chart qualification

**Status:** Full offline validation accepted; integrating reviewed source before live preparation.
**Owner:** Parent Codex, sole writer; independent read-only specialists
**Branch:** `codex/hq-ready-03h`
**Worktree:** `../bot_messenger-hq-ready-03h`
**Started:** 2026-10-12 America/Vancouver
**Initial ETA:** 60–120 minutes; earlier stop if offline feasibility fails
**Resume ETA:** 30–45 minutes, including a fresh complete serial regression, integration and single live attempt. Earlier review found numeric coercion needing strict source validation.

## Objective and scope

Determine whether the pinned Python3.12.12/yfinance1.7.0 parsing path and existing
FinancialDataGateway can qualify one captured AAPL September2026 chart without
bootstrap, cookies, crumbs, retries, alternate endpoints or fabricated provider state.
Only after deterministic feasibility, independent architecture/security/recovery/
acceptance review, regression, accepted PR merge and matching clean-main rebuild may
a separate create-only authority admit the owner's exact single GET.

## References and invariants

- Follow `AGENTS.md`, Decisions029/032/038–043, investment decisions/rules/roadmap,
  Yahoo gateway runbook, direct-chart proposal and03–03G acceptance records.
- Starting clean local/remote main: `3141b390f5b4fa7ecd8a79ca8d809449ef307aa7`.
- Preserve all17 historical receipt names/bytes,03B/03D/03E spent/noResume state,
  deleted capsules,03G unprepared state, Decision037 exhausted4/4 and US$0.
- Reuse parsing, gateway, schemas, encrypted temporary capsule, custody and watchdogs.
- One DNS lookup, one validated public address/family, one TCP/TLS connection and
  exact query1 AAPL GET;16KiB headers,262144 application bytes,10/120/180s deadlines.
- Current retrieval never establishes historical availability or paper-fill eligibility.
- No employees, credits, trading, collectors, production, Asymmetri or public data.

## Steps and validation

1. Read required context; verify synchronized clean main and historical custody. Done.
2. Prove captured-response parsing and gateway normalization offline before live authority. Done (37/37).
3. If feasible, extend existing custody with a distinct exact one-use manifest and CLI;
   fault-test denial, timeout, cancellation, crash, replay, accounting and cleanup. Done (89/89).
4. Freeze source; independent reviews, focused/full regression, typecheck/build/contracts.
   Four reviews clear;43 source/28 build entries match; typecheck/build/contracts175/175 and
   local TLS4/4 pass. Resumed full regression1,703 tests:1,697 passed,0 failures,6 existing skips.
5. Commit, scoped PR, accepted merge, synchronized-main rebuild/source identity checks.
6. Prepare/consume only new authority, supervised single request, private quality assessment,
   immediate destruction and process/cleanup/spent verification. Stop after outcome.

## Evidence ledger

| Check | Evidence | Result |
| --- | --- | --- |
| Starting main | Fresh GitHub fetch and clean equal HEAD/main/origin/main | Passed |
| Historical authority | `/private/tmp/hq-ready-03h-authority-baseline.json` |17 receipts;3 spent/noResume; capsules absent;03G/03H absent |

## Remaining work

Offline feasibility passed before live-authority implementation (37/37); final direct suite
89/89 passed with zero skips. Architecture numeric-coercion finding fixed; recovery startup
cancellation race fixed. All four independent reviews are clear; resumed full regression passed after the intentional pause.
No new owner authority or Yahoo network effect exists.
Tests use authored data only and cannot establish provider availability or data quality.


## Safe pause — 2026-10-13 UTC / 2026-10-12 Vancouver

Owner requested pause to close the computer. Stopped the offline full-regression process group
with SIGINT before integration or any live preparation. No Yahoo03H owner anchor/capsule,
DNS/request or financial sample exists. The partial full log has no completed acceptance
result; interruption is not a regression pass. All independent reviewer agents are idle.

Resume from this branch/worktree. First inspect Git/remote state and confirm no competing
changes. Recheck source43/build28 manifests and historical17 receipt hashes. Rerun `npm test`
with loopback listener permission; the interrupted log is preserved separately. Finalize the
acceptance record with exact count/skips/log hashes, obtain final evidence review, commit/push,
open and merge the scoped accepted PR. Then fast-forward clean main, rebuild, verify manifests
and `probeSourceIdentity`, and perform host/custody preflight. Only then use the fixed03H
`prepare`/`run` lifecycle once. Record one outcome, destruction/process termination, spent
state and unchanged historical receipts. Finish with an outcome record; do not retry Yahoo.

Completed evidence: initial feasibility37/37 before live-issuer coding; final direct89/89;
local TLS4/4; typecheck/build; contracts175/175; architecture/security/recovery/acceptance clear;
43 source/28 build hashes match. Numeric/action-coercion and startup-cancellation findings fixed.
The17-receipt baseline is preserved in `.validation/hq-ready-03h-pause/` with non-data test logs
and a verification helper. This ignored local directory contains authored-test output and
receipt hashes only; no provider payload, key, cookie or credential. Original logs also remain
in `/private/tmp`; use the preserved copies after restart. Dependencies are ignored symlinks
to the existing Node modules and pinned Python environment in sibling worktrees; do not remove
them or install/upgrade packages for this checkpoint.


## Resume checkpoint

Owner explicitly resumed03H and reconfirmed completion through merge and one live request.
Fresh fetch confirms unchanged `3141b390f5b4fa7ecd8a79ca8d809449ef307aa7` remote/main base;
main is clean,43 source/28 build hashes match,17 old receipts match,03G/H remain unprepared.
The full offline suite was restarted as `/private/tmp/hq-ready-03h-full-resumed.log` with local
loopback permission. The earlier interrupted log remains preserved; it is not acceptance.


## Final offline validation

Resumed full suite:1,703 tests,1,697 passed,0 failures/cancellations,6 existing receiver/Linux
skips,850.400 seconds. Source43/build28 hashes and all17 historical receipts still match.
No Yahoo/adapter/custody test skipped. Log: `/private/tmp/hq-ready-03h-full-resumed.log`.
Next gates are final evidence review, source commit/PR merge, clean synchronized main rebuild
and source identity, then the single newly authorized request and immediate destruction.
