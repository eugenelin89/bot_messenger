# Decision 030 — Defer Ubuntu migration and retain the existing host

**Date:** 2026-10-09
**Status:** Accepted owner infrastructure exception; cancellation cleanup verified; no receiver deployment
**Applies to:** Asymmetri hosting and Investment Showcase infrastructure checkpoints

## Context and supersession

INFRA-01 prepared a supported Ubuntu migration, first to a replacement Droplet and
then by rebuilding the existing Droplet. Django archival retirement was evaluated
as a simplification. Neither migration nor retirement happened. The owner explicitly
cancelled/deferred the project, retained the current Ubuntu 22.10 host and authorized
deletion of its temporary paid migration snapshot after backup verification.

This decision supersedes the migration prerequisite and snapshot-retention gate in
earlier infrastructure documentation. Historical INV-01/INV-02 evidence and failed
recovery attempts remain intact. It does not change contract 1.0, feature acceptance,
[Decision 029](decision_029_zero_cost_market_data.md), grants or operational authority.

## Decision

1. Preserve the original Droplet/IPs, DNS, all websites, services, Django/socket,
   SQLite, dormant PG data, shared identities, runtimes, rollback and swap.
2. INFRA-01 migration is **cancelled/deferred**, not completed. Its exact 11.23 GB
   snapshot was deleted after all 12 encrypted off-server archive copies passed
   verification. Absence was confirmed October 9 at 13:05:58 PDT / 20:05:58 UTC.
   Approximately US$0.6738/month before tax is eliminated; accrued usage has not yet
   been itemized and is not refunded. Required recovery material remains protected.
3. Ubuntu 22.10 remains unsupported. Record a **time-limited accepted operational
   risk**, reviewed before the next deployment or new public exposure. No calendar
   expiry was supplied. This is not a permanent waiver or a claim of security;
   compensating controls do not replace missing OS security patches.
4. INFRA-01 completion is no longer an automatic dependency of INFRA-02 or local
   investment development. INFRA-02 may be planned for the current Ubuntu 22.10 host
   only through a separate owner-selected task with explicit deployment authority.
5. Before deployment, demonstrate actual Node.js 22/SQLite native compatibility,
   proxy/signed-request behavior, least-privilege identity/storage, current
   CPU/RAM/swap/disk capacity, backups/restore/rollback and preservation of all sites.
   Review OS risk and separately authorize compensating controls or public exposure.
6. Publishing remains default disabled. No receiver, market-data collection, Ask,
   infrastructure expense or next feature milestone is activated by this decision.
7. Future upgrade or Django retirement requires an independent owner request and
   fresh evidence. Do not silently restart the cancelled runbook.

## Evidence and limits

The [infrastructure roadmap](../experiments/investment/ROADMAP.md#separate-infrastructure-checkpoints)
links the exact Asymmetri closure commit. The 198-request/15-host baseline, DNS/TLS,
production service/configuration/identity checks passed. HQ service identity,
listeners and packages remain unchanged, with no rehearsal remnants. New Mac
cleanup removed 48 KiB of allocated disposable files; HQ/production new reclamation
was zero. Earlier HQ cleanup is not counted again.

Encrypted sets remain off-server on the same Mac, not independently verified on a
separate device. They are historical recovery points; synthetic Linux checks do
not prove real private-cluster runtime recovery. These limits remain documented.
Daily billing has not yet itemized the short-lived snapshot charge; no refund is
claimed. No new task-related billable resource remains.

## Consequences and unchanged status

INV-01 remains complete. INV-02 remains implemented and locally validated, default
disabled and undeployed. INFRA-02 is not started. INV-03 and later/Ask packets remain
planned; local work may proceed only on a separate request. Current infrastructure
can be used subject to the actual acceptance and explicit authority above. This
exception removes an automatic upgrade dependency, not operational/security review.
