# Execution Plan — HQ-READY-03D one-shot Yahoo connectivity

**Status:** Complete — executed once; authority spent; outcome recorded
**Owner:** Parent Codex, sole writer; read-only security/recovery/acceptance specialists
**Branch:** `codex/hq-ready-03d-connectivity` for implementation; `codex/hq-ready-03d-outcome` for closure
**Worktree:** `../bot_messenger-hq-ready-03d`
**Started:** 2026-10-11 America/Vancouver
**Initial ETA:** 60–90 minutes for source, offline tests/reviews, integration and one supervised attempt
**Final timing:** Deadline/recovery review findings and the full serial regression extended the original estimate; no scope expansion or additional live attempt resulted

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
Implementation, source reviews, focused/full regression, reviewed integration/main rebuild, the one supervised attempt and independent actual-outcome acceptance are complete. Headers-only handling consumed zero body bytes. The independent 10-second consumption watchdog is stricter than the 30-second process ceiling; admission requires 10 seconds remaining in the 60-second lifetime.

## Review disposition

Security and recovery independently verified the revised source/build manifests and cleared source.
Their two deadline findings were fixed with an independent consumption watchdog, synchronous
elapsed/expiry checks and conservative near-expiry admission. Acceptance requested an isolated
real 10-second watchdog test; it was added. All reviewers remain read-only.
The initial read-only host check could not query FileVault inside the sandbox; host access
verified Node 24.10.0, FileVault, encrypted swap and disabled core dumps. No03D authority existed at that preflight checkpoint.

## Final source acceptance checkpoint

Implementation `8f24393a07b31639fc67b602ce86dc3e1546a4e9`, [PR62](https://github.com/eugenelin89/bot_messenger/pull/62).
Focused223/223 and full1457 total/1451 passed/0 failed/6 existing skips passed on frozen source.
Source/build manifests and log hashes are in03D acceptance. No new authority had been prepared
at that source checkpoint.

## Execution and closure

PR62 merged as `3b79718c25805c967ec2bee78f359479364ca6dd`. Clean synchronized main rebuilt
and matched every frozen hash. One prepare/run completed on 2026-10-12 at 07:39:41Z: TLS verified,
HTTP 404 headers at 146 ms, response-size validator stopped processing, body 0/uninspected.
Child exited 0 without watchdog kill. Explicit non-data recovery followed process exit;
the private anchor is backup-excluded and spent permanently 1/1/noResume. Five original 03B
hashes match, its capsule is absent and Decision037 remains 4/4. No further network action follows.
The outcome branch changes documentation only; no source or frozen manifest changes.
The independent acceptance reviewer directly verified the actual six receipts, distinct identity,
single reservation, ordered stages, process exit, backup exclusion and historical preservation;
no material blocker remains. The packet ends with this recorded outcome and no further authority.
