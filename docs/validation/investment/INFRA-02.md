# INFRA-02 — Private receiver installation and Linux acceptance

**Accepted October 9, 2026 for private synthetic scope.** The existing INV-02
receiver is installed on the owner-selected Ubuntu 22.10 Asymmetri host, with
an empty operational archive and a stopped/default-disabled service. Public
publishing and real HQ traffic remain disabled. No INV-03 or Ask work began.

## Exact evidence and Git boundary

- [Asymmetri implementation](https://github.com/eugenelin89/asymmetri/commit/2e663dd3f4281e29aa7e45bf34fbc54ad8a59559): hardened unit, explicit acceptance utilities and operational documentation.
- [Separate Engineering Journal commit](https://github.com/eugenelin89/asymmetri/commit/193dc1fcf9d973506dadb68b3732cf47d44d1b9a): both commits pushed; clean Asymmetri main and exact remote identity verified.
- [Actual-host validation](https://github.com/eugenelin89/asymmetri/blob/2e663dd3f4281e29aa7e45bf34fbc54ad8a59559/docs/INFRA-02-VALIDATION.md) and [installation/backup/rollback runbook](https://github.com/eugenelin89/asymmetri/blob/2e663dd3f4281e29aa7e45bf34fbc54ad8a59559/docs/INFRA-02-RECEIVER-DEPLOYMENT.md).
- Installed runtime source `a38696e9efb4d55dff1835d4dbb674454332170d`, whose receiver subtree is byte-identical to accepted INV-02 `457f9354b3f8daf5c4c75b8f5ac1946433da3ce0`. The later hardened unit is separately hash-pinned in the validation record. The website release was not synchronized.
- Contract1.0 remains `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755`, nine-file manifest SHA-256 `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`; no contract or migration amendment.

Decision030 was read on still-open [PR35](https://github.com/eugenelin89/bot_messenger/pull/35)
at `e2f2caa0e3f267e412639a45e3c11cf7567134b8`. This documentation-only branch,
`feature/infra02-receiver-acceptance`, stacks on its accepted decision branch. Current
main was fetched at `5ad0466ffef7367f9eba8c977af4e732f101dc5d`. The idle infrastructure
checkout was reused after ownership checks; unrelated worktrees were preserved.
No merge is claimed. [Execution plan](../../exec-plans/infrastructure-infra-02.md).

## Installation and authority

Actual Ubuntu22.10/kernel5.19.0-46, existing Node22.23.1/npm10.9.8 x64,
glibc2.36/systemd251.4/nginx1.22.0. Pinned better-sqlite3 13.0.3 loads SQLite3.53.4
without global libraries/Node/OS upgrades. Separate non-login receiver user, root-owned
code `/opt/asymmetri-receiver/receiver`, private config `/etc/asymmetri-investment`,
private data `/var/lib/asymmetri-investment`. Migration001 exact checksum, repeated
initialization safe, integrity/FKs/WAL/FULL pass. Operational publisher/key/run/event/
batch/nonce/content/rights counts are zero.

`asymmetri-investment.service` is **inactive/static**, no boot enablement target,
config `enabled:false`, explicit marker absent. Configured address127.0.0.1:3101;
no final receiver/proxy listener. Temporary signing keys remained in process memory;
all synthetic authorities were fenced and their test archives/units removed.
Installation does not grant real publication or HQ authority.

## Actual-host acceptance

| Evidence | Result |
| --- | --- |
| Linux Node22 receiver suite, contracts/native SQLite | **183/183**; local Node24 suite also183/183 |
| Isolated nginx stream plus complete-directory restore | **42/42** |
| Installed-profile confinement probe | Non-root, zero capabilities/NoNewPrivileges, private roots hidden, restricted writes, fsync/rename, loopback allowed/non-loopback denied |
| CLI graceful restart/SIGKILL/stale-lock recovery |827 events/17 batches, exact durable receipts/nonces and fresh-key receipt/retry reconciliation preserved |
| Bounded workload |164.4seconds,240 reads,concurrency4;68.87MiB receiver cgroup peak,115.125MiB max RSS;1.98MiB proxy peak |
| Settled idle |31 samples/30.05seconds after startup;25.64–27.66MiB receiver cgroup memory |
| CPU/swap/resource health |39.05 receiver CPU seconds;zero receiver/proxy swap/OOM;host minimum322.14MiB available;host swap64 pages in/495 out |
| Existing-site probes during load |64/64 pass;Next p95~163ms,Django~150ms |
| Final original baseline/DNS/TLS |198/198 unchanged across15 hosts,expected errors/retired responses preserved |
| Original application/configuration/source/build/firewall |Unchanged,including48 configuration fingerprints;no unrelated application/nginx restart |
| Asymmetri check/Next/Vinext builds and production audits |Pass;zero audited production vulnerabilities;pre-existing notices only |

The initial **HTTP nginx profile failed duplicate-Connection preservation**: its
normalization allowed200 upstream. The assertion remains; that profile is rejected.
Transparent loopback stream acceptance proves raw-byte/signature transport, **not
real HTTP/TLS ingress**. Exact public ingress remains a separate activation gate,
as explicitly allowed by the INFRA-02 request. No production nginx route was added.

Recovery covers real SQL/CAS kill windows, complete stopped SQLite/CAS copy and file
hashes, integrity/FKs, newer withdrawal/withholding reconciliation, authority/cursor
fencing and receipt convergence. SIGKILL's stale CLI lock fails closed and requires
verified operator recovery. No event history was dropped to repair an error.
The systemd drill checks revoked/disabled state and unsigned denial; signed revoked
key rejection is separately established by the integration/proxy tests.

Read-only runtime/storage, signing/proxy and isolation/preservation reviewers accepted
the corrected implementation/evidence with no remaining private-scope blockers.
Read isolation was strengthened after review; a host-specific test path was removed.
Overlength synthetic fixture rejection, bounded stream timeout closure and unloaded
unit `reset-failed` orchestration corrections are disclosed in Asymmetri's ledger.
No failing HTTP profile was reclassified as accepted HTTP ingress.

## Security exception, preservation and limits

Decision030 retains unsupported Ubuntu22.10 temporarily; confinement cannot supply
missing OS/kernel patches. No new public port, DNS/IP change, cloud resource,
subscription, snapshot, Django retirement or OS migration occurred. Existing sites,
dormant PostgreSQL, encrypted archives, rollback and swap remain. INFRA-01 stays
cancelled. No private source data or HQ state was copied into this repository.

Measured load proves bounded private viability, not sustained full-archive capacity
or a public SLA. Hardware power loss, full offsite disaster recovery, real TLS ingress,
real workers/trading/market sources and Ask were not accepted. Receiver recurring
backups/retention and independent custody remain future reviewed arrangements.
Decision029's **US$0 incremental market-data budget** is unchanged.

Before public investment publishing or real HQ traffic: accepted exact ingress/TLS,
representative sustained sizing, backup/retention/custody, current finite publisher
scope and key lifecycle, HQ outbox/receipt reconciliation, verified free-source and
redistribution rights, feature gates and explicit activation authority are required.
INV-03 local synthetic work is ready only on a separate owner request. INFRA-02
does not authorize starting it or activating an official run.

This BotSquad handoff changes current status and evidence links only. Markdown,
relative links, diff/secret-pattern checks and independent review apply; no BotSquad
runtime or HQ acceptance is inferred from documentation checks. Historical INV-01/02,
contract bytes, simulation rules and feature-packet statuses are preserved.

**INFRA-02 COMPLETE — RECEIVER INSTALLED AND PRIVATELY VALIDATED; PUBLIC PUBLISHING DISABLED**
