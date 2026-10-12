# HQ-READY-03D — one-shot Yahoo connectivity

**Started:** 2026-10-11; continued 2026-10-12 America/Vancouver
**Base:** `e688fdbe94ac425891dbb42e582275908f9b1a50`, clean fetched local/remote main
**Branch/worktree:** `codex/hq-ready-03d-connectivity` / `../bot_messenger-hq-ready-03d`
**Status:** Source/offline acceptance complete; reviewed integration and one supervised attempt pending

[Decision040](../../decisions/decision_040_one_shot_yahoo_connectivity.md) records the owner's
new one-attempt approval and reported permission. The reviewed [proposal](../../operations/YAHOO_CONNECTIVITY_PROPOSAL.md)
controls scope. This is separate from the permanently exhausted HQ-READY-03B probe and Decision037.

## Source boundary

The new owner CLI and private custody module permit only one literal endpoint. No application,
worker tool, financial gateway, database, migration, dependency or existing Yahoo source changes.
PR61's repaired Node pin and allowlisted diagnostics are reused. There is no cookie jar or
financial capsule. One exclusive fsynced spent reservation precedes DNS; source/host/root/expiry
checks and irreversible accounting failure latches protect admission. Cleanup preserves authority.

Headers-only handling consumes zero body bytes and closes immediately. Every status, malformed or
oversized/compressed response, cancellation and uncertainty stops. Body content/challenges are
uninspected; no financial qualification follows. Independent 10-second consumption and 30-second
overall watchdogs include cleanup, and synchronous elapsed checks prevent delayed fsync from
admitting DNS/request/end after the transport deadline. Watchdog termination is joined before
reporting process exit; an operational child error retains supervision until exit.

## Offline evidence

All data is authored, DNS is injected and real sockets use literal loopback only. No Yahoo DNS or
public socket is used in tests. Source acceptance is not a live connectivity result.

| Check | Result |
| --- | --- |
| First typecheck | UUID default inference error; explicit string annotation fixed |
| Initial custody/transport fixtures |38/39 pass; copied-directory fixture failed its expected identity assertion because copied mode was too broad; fixture modes corrected without weakening denial |
| Expanded second run |39/40 pass; local TLS listener denied by sandbox EPERM, with all authored cases passing |
| Actual loopback TLS/parser variants |Passed after local-listener access; pinned scalar shape, TLS trust denial, header cap, interim and upgrade stop; `/private/tmp/hq-ready-03d-local-first.log` |
| Deadline/recovery-expanded authored fixtures |44/44 pass, zero skips; `/private/tmp/hq-ready-03d-connectivity-third.log` |

Security/recovery review found the in-process timeout alone could be delayed by synchronous fsync.
The independent 10-second watchdog and immediate elapsed checks repair that defect. Tests cover
synchronous deadline overrun at DNS/request/end boundaries, blocked child termination, two real
processes racing one reservation, SIGKILL after a durable DNS stage, fsync/short-write failures,
source/root/expiry denial, retained-accounting replay denial, late callbacks and recovery receipts.
No generic rollback-proof claim is made for a malicious OS owner restoring the whole anchor.

## Historical preservation and remaining gates

Before edits, all five original 03B approval/spent/accounting/cleanup files were hashed privately;
noResume was true and the old capsule absent. Read-only equality has been confirmed during final acceptance; it will be rechecked after the actual run.
Decision037 is unchanged/exhausted at 4/4. No financial data, employee execution, recurring collector,
spend, production change, public output, Asymmetri deployment or HQ-READY-04 is started.

Remaining: reviewed integration/main rebuild,
host checks, one prepare/consume, non-data receipt/cleanup inspection and final historical equality.

Admission additionally requires at least 10 seconds remaining in the 60-second manifest lifetime,
so the independent consumption ceiling cannot outlive absolute expiry. Final wall/monotonic
checks after filesystem reads prevent a synchronous read stall from hiding expiry.

The first broader run used an unlinked pinned Python environment in the new worktree: 192 passed,
4 failed and 25 skipped. Its log remains `/private/tmp/hq-ready-03d-focused-missing-venv.log`.
The existing Python 3.12.12 environment was linked without installing dependencies before rerun.

## Final source freeze

The [source manifest](HQ-READY-03D-source.sha256) has digest
`e69ae6e014643abfb2f803b12b69ec217987c0fc9716fb5839184c70ea23446f`.
The [compiled manifest](HQ-READY-03D-build.sha256) has digest
`c1aacac3edbe8cfd7cbcf17b40820bba1c4ae98156499dbd6f86dc2968a025bd`.
Security and recovery independently verified every entry and cleared this source.
Final focused acceptance passed **223/223**, zero failures/skips, 117.952s, including the
real loopback TLS/parser variants and pinned Python authored operations. The normal
30-second supervisor test terminated a blocked child in 10.127s, proving its separate
10-second consumption ceiling. Near-expiry and filesystem-stall tests passed.
Final typecheck/build and generated contract integrity passed. Full serial regression passed: **1,457 total, 1,451 passed, 0 failed, 6 existing skips**, 684.845s.

The GitHub check API for implementation commit
`8f24393a07b31639fc67b602ce86dc3e1546a4e9` reports no configured checks/statuses.
[PR62](https://github.com/eugenelin89/bot_messenger/pull/62) is draft while the full suite runs.
No remote review submissions or unresolved threads were present at the initial check.
The local read-only host preflight verified Node 24.10.0, FileVault, encrypted swap and core dumps
disabled; the 03D approval/spent/accounting/cleanup paths were all absent. The initial sandbox
FileVault query failed without changing state; the host-level read-only check passed.

## Final full regression and retained evidence

The full suite completed on the frozen compiled source. Its six pre-existing skips are five
external standalone-receiver variants and one Linux-only filesystem/resource case. No Yahoo,
connectivity, custody, Python, financial or new recovery test was skipped. Test fixtures remain
distinct from live Yahoo evidence. Security, recovery and acceptance source reviews are cleared;
no source blockers remain. No Level3 employee, production or public acceptance is claimed.

Only non-data log hashes are committed; full logs remain local.

| Local log | SHA256 |
| --- | --- |
| `hq-ready-03d-full.log` | `f73d511bd2b5cc874b692004ab2a58c4c6f1af76db4bd7ca67fdd9a84a38e380` |
| `hq-ready-03d-focused-final.log` | `91678c2a2f894acb5b2f600d0f0742a559a4ede82082098530ed86b53bf1650d` |
| `hq-ready-03d-build-final.log` | `6950d327ee1d7a372a870ceff93a12f68ec7b5f3f31860c660a343e80b7b0047` |
| `hq-ready-03d-check-final.log` | `c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652` |
| `hq-ready-03d-contracts.log` | `d918d028251e4d2b5ef144341ceffc8155f5baf1eda87fdbcbe040dd282085f5` |

Implementation commit: `8f24393a07b31639fc67b602ce86dc3e1546a4e9`.
The follow-up acceptance commit changes documentation only; source/build manifest bytes remain
fixed. PR62 is ready for integration after exact-head remote checks. Live preparation/consumption
will occur only after a matching rebuild on clean synchronized main.
