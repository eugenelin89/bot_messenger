# Execution Plan — HQ-READY-03D one-shot Yahoo connectivity

**Status:** Active
**Owner:** Parent Codex, sole writer; read-only security/recovery/acceptance specialists
**Branch:** `codex/hq-ready-03d-connectivity`
**Worktree:** `../bot_messenger-hq-ready-03d`
**Started:** 2026-10-11 America/Vancouver
**Initial ETA:** 60–90 minutes for source, offline tests/reviews, integration and one supervised attempt
**Current ETA:** 20–35 minutes remaining at source freeze; full serial regression, integration and one supervised attempt remain

## Objective

Implement and independently review the distinct create-only authority in the reviewed
[proposal](../operations/YAHOO_CONNECTIVITY_PROPOSAL.md), then consume the owner's new
one-request permission once. Record only non-data diagnostics and permanently stop.

## Scope and preserved boundaries

- Exactly GET `https://fc.yahoo.com/`; one resolver invocation, validated single IP,
  one TCP/TLS connection/request; no retry, redirect, alternate address or financial read.
- Separate fixed private OS-account anchor and new approval identity; 60-second lifetime,
  10-second transport deadline, 30-second process ceiling; 16KiB headers/4KiB consumed body.
- Raw bytes/header/cookies discarded; only private non-data approval/spent/stage/accounting/
  cleanup receipts survive. No financial capsule, gateway activation or worker authority.
- Original HQ-READY-03B five retained files are SHA256-baselined privately and stay unchanged;
  old capsule absent, noResume true. Decision037 exhausted at 4/4 remains unchanged.
- Decisions029/032/038/039, investment DECISIONS, SIMULATION_RULES§7, ROADMAP,
  HQ-READY-03B/03C acceptance, AGENTS and architecture/product requirements reviewed.
- No employee/model execution, collector, trading, spending, production/Asymmetri/public changes.

## Implementation steps

1. Verify synchronized main and preserve old evidence (done: `e688fdbe94ac425891dbb42e582275908f9b1a50`).
2. Implement new owner-only custody/CLI and literal-endpoint transport, reusing PR61 pin/diagnostics.
3. Offline authored failures, bounds, concurrency/replay/crash tests and real loopback TLS; review exact source.
4. Freeze source/build, integrate reviewed source and rebuild clean synchronized main.
5. Verify host custody controls, prepare once and consume once; never retry any uncertain outcome.
6. Independently inspect safe receipts and cleanup; recheck historical hashes; record actual outcome.

## Validation plan

Typecheck/build, focused transport/custody/diagnostic/gateway regressions, contract integrity,
full serial regression where shared-boundary coverage warrants it. Read-only security/recovery
review before network. Fixtures never resolve Yahoo or use a public socket. SIGKILL/concurrency,
late callbacks, malformed/oversized/compressed responses, no cookie persistence, fsync failures,
expiry and source/anchor changes must deny or stop with spent authority preserved.
No Level3 employee acceptance is relevant or claimed. One real supervised connectivity attempt
is distinct from fixtures and proves no financial-data quality or broader permission.

## Evidence ledger

| Check | Source | Result |
| --- | --- | --- |
| Remote/main identity | e688fdbe94ac425891dbb42e582275908f9b1a50 | Clean local and fetched origin/main equal |
| Historical preservation baseline | Private `/private/tmp/hq-ready-03d-historical-baseline.json` | Five digests, noResume true, capsule absent |

## Decisions made during execution

The user explicitly approved the exact proposal and confirmed reported Yahoo permission covers
this minimal automated personal GET and non-data receipt retention. This is owner-reported verbal
provenance, not independent verification or an ongoing grant. No additional permission gate is
inferred from the proposal's already-satisfied owner approval requirement.

## Documentation freshness / remaining work

New decision/acceptance/runbook updates will describe the separate one-shot authority and outcome.
Product vision, employee capabilities, simulation and public contracts do not change.
Implementation and source reviews are complete. Final focused/full regression passed. Integration, supervised attempt and final evidence remain. Headers-only handling deliberately consumes zero body bytes. The independent 10-second consumption watchdog is stricter than the 30-second process ceiling; admission requires 10 seconds remaining in the 60-second lifetime.

## Review disposition

Security and recovery independently verified the revised source/build manifests and cleared source.
Their two deadline findings were fixed with an independent consumption watchdog, synchronous
elapsed/expiry checks and conservative near-expiry admission. Acceptance requested an isolated
real 10-second watchdog test; it was added. All reviewers remain read-only.
The initial read-only host check could not query FileVault inside the sandbox; host access
verified Node 24.10.0, FileVault, encrypted swap and disabled core dumps. No 03D authority exists yet.

## Final source acceptance checkpoint

Implementation `8f24393a07b31639fc67b602ce86dc3e1546a4e9`, [PR62](https://github.com/eugenelin89/bot_messenger/pull/62).
Focused223/223 and full1457 total/1451 passed/0 failed/6 existing skips passed on frozen source.
Source/build manifests and log hashes are in03D acceptance. No new authority has been prepared.
Next: exact-head integration, clean synchronized main rebuild, one prepare/run, explicit non-data
recovery receipt and independent actual-outcome/historical-preservation inspection.
