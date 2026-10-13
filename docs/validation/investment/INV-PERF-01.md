# INV-PERF-01 — verified financial reads and synthetic Ask interoperability

Bounded source checks and typed interoperability pass. **Linux observed-workflow readiness
remains failed.** Implementation `9a1eb5caf4a0cc3125f9da2ffe9a941cea68c0fc` does not activate
genuine market/model work, visitor intake or new financial authority. Production HQ remains
d262a8d; its denied account preflight was not retried.

The [machine-readable receipt](../evidence/inv-perf01/acceptance.json) includes exact source
hashes, tests, retained logs, resource measurements, receiver build inventory and limitations.
The [execution plan](../../exec-plans/investment-inv-perf-01.md) records scope and review.

## Change and invariant

One full transactional replay returns a coherent configuration and portfolio state. Five
adjacent read pairs consume this snapshot. Outbox/receipt queries are batched by run/version/
request, retaining configuration, ledger, reducer, checkpoint, projection, receipt and operator
checks. Nothing is retained between calls. Mutating returned objects, intervening writes and
rollback cannot validate a stale result. Market execution performs another complete replay
after its risk callback. Membership, expiry, finite authority, source use and risk remain current.

Calendar validation reuses a fixed New York formatter and each session's parsed instants;
all timezone, date, order and session checks remain, in their existing error order. It does not
cache validation results. Tests cover unchanged-head corruption, checkpoint tampering, rollback,
cross-run receipt IDs, frozen configuration and a risk callback that pauses/cancels the order.

## Qualified results

Baseline: `55d837cb4660461556b35518f1d632ff0e2479c0`. All 424 final source files matched isolated
Linux. Tests ran serially as unprivileged botsquad on Node24.21.0 with a 512 MB heap and nice10.
No production data or account was used. Build, typecheck, manifest and diff checks pass.

| Check | Actual result |
| --- | --- |
| Initial snapshot/recovery selection | 22/22; before final added negatives |
| Final financial/risk/publication selection | 156 passed, 0 failed, 4 conditional receiver skips; 206018.88 ms |
| Final snapshot selection, including callback pause | 8/8, no skips; 5980.82 ms |
| Previously skipped publication cases against actual isolated receiver | 4/4, no skips; 30360.28 ms |
| Typed Ask HTTPS/journal interoperability | 1/1, no skips; 6292.27 ms |
| Final observed actions_and_revision workflow | **0/1 failed**; runner188753.17 ms, original60-second stage bound |

The final snapshot case and interop test were added after the focused financial selection;
the final build covers them. Product code did not change after that selection. These overlapping
selections are not a new full-suite total. No complete final 27-scenario Linux run or full
repository regression is claimed. Earlier ASK-02 Linux failures remain failed receipts.

Architecture, security, recovery and test specialists accepted the bounded source change.
Review additions include checkpoint corruption, post-callback freshness, complete fixture build
inventory and bounded shutdown after spawn failure. Review does not establish live readiness.

## Performance evidence and retained failures

The instrumented baseline actions workflow failed at 214806.19 ms (runner215843.54 ms). It
recorded 2082 configuration validations/34159.53 ms, 26546 reducer calls/50181.82 ms, 28651
checkpoint hashes/17612.67 ms and 1961 constructor integrity checks/22173.11 ms. These nested
measurements overlap and cannot be summed as independent elapsed time.

The first candidate failed plain at 578204.41 ms during finalization; its suite was interrupted
after two reported passes and one failure, with no complete footer. Its interrupted resource
wrapper measured only the runner. A 295540 KiB child RSS sample is not a measured peak.
The final candidate actions workflow still failed at 187793.95 ms. Its complete resource result
was 188.85 seconds wall, 95% CPU, 238484 KiB maximum RSS and zero swaps. The original observation
bounds and assertions were not changed. A faster failed workflow is not readiness evidence.

A separate authored mechanical benchmark used the same 25 journal records, 261 calendar
sessions and output digest for four alternating rounds of 20 paired reads. Median time decreased
from 1683.40 to 723.77 ms (57.01%). The committed script/log identify the exact workload; this
does not measure the whole dispatcher workflow or resolve its timing failure.

Initial harness failures are retained: missing Store in the compiled-only profiler, runuser
absent from the root PATH, and typed fixture schemaVersion/optional-port errors. Corrected
builds passed. Receiver's initial locked install failed for missing make. An isolated downloaded/
extracted official Ubuntu toolchain was prepared without installing host packages; the successful
locked install used better-sqlite3 13.0.3's packaged `prebuilds/linux-x64.node`, SHA256
`6fd4292c6c5f352436cd85c9e1cb286978efa43c20ae350973f83414ced9991d`.
No successful native recompilation is claimed. Install warnings and logs are retained.

## Typed receiver interoperability

Website pin `d1ddbe679c05314158310183518afaaaedd8ae00`, fixture introduced at
`fe5c89f9be16b11d9ace455a95e10034186f434e`: the exact 87-file Git archive was verified before
and after locked installation/clean build. The test verifies the full source and 50-artifact
compiled inventory before launch. Source-map digest:
`8e91367bcbb6d559a1cf5832d9e48ad0ac28e52dcfe1d38a7e9c2b3c5d45df02`.
Canonical investment manifest is unchanged:
`7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.

The real HQ typed HTTPS client uses a test-only loopback dial with fixed Host/SNI and verified
fixture TLS. Generated keys remain private and are never copied into logs. Actual UTC signatures
accompany authored synthetic questions/answers. Sixteen HTTPS requests cover four control syncs,
six visitor operations, claim, renewal, status, two answer attempts and receipt lookup. The test
checks immutable retry, owned read-back, deletion/404, durable suppression and derived ACK, then
verifies private-tree removal and listener closure. There are zero model executions.

`contentPurgeVerified:false` and `restorationVerified:false` remain explicit. This proves typed
interoperability and metadata suppression, not completed HQ raw-content custody, restore safety,
provider deletion, genuine employee routing or active service authority.

## Public website and remaining project work

Website writer reports release at18:24:52UTC from `d51288fc52b0faa4401848ec9d009ad3cc3ae87b`,
build `vEx_G48mhinsBJBGK839J`, PID2378322, with 34 route/redirect and 112 preservation checks.
The complete predecessor remains `/var/www/asymmetri-rollback-20261013-97b4087`.
Parent independently read Ask, investment and methodology with HTTPS200 and no Set-Cookie.
Ask displays **Questions are not open yet**, has no form/textarea, and availability is disabled.
See [independent public read-back](../evidence/inv-perf01/public-readback.json).

Production HQ remains alive/database/dispatcher healthy and runtime degraded, unchanged source
d262a8d/PID712263. Genuine login/eligibility, prospective finite authority, real elapsed market
sessions, official publication, private HQ Ask content custody, independent Ask budgets and
actual employee routing remain unfinished. The hourly completion loop stays active.
