# Proposed first genuine private employee research trial

**Status:** Proposal only. HQ-READY-04A authorizes source acceptance, not this operation.
This is one research session, distinct from the later two-real-session H1–H9 paper trial.

## Exact proposed scope

After reviewed source acceptance, prepare and present one final digest-bound approval using:

| Item | Proposed bound |
| --- | --- |
| Existing researcher/facilitator/drafter | Scout — `worker_25313ecb-e017-44ba-a8d0-c361da021d4b` |
| Existing independent challenger/reviewer | Grace — `worker_df13cd75-1718-400a-b60c-c2a114c1d9a3` |
| Mandate | Assess what AAPL September2026 historical evidence establishes, its limitations, and whether any present-day inference is justified. Produce alternatives, independent critique and a revised private conclusion. No trade is required or permitted. |
| Fresh Yahoo scope | Exactly one GET to `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`; `period1=1788235200`, `period2=1790827200`, `interval=1d`, `includePrePost=false`, `events=div,splits,capitalGains` |
| Instrument/calendar | AAPL/XNAS/USD; America/New_York; frozen reviewed2026 exchange calendar; September1 inclusive through October1 exclusive,21 scheduled sessions |
| Collection bounds | One wire,262144 response bytes,10-second HTTPS request and120-second overall collection; zero retry/fallback/bootstrap; US$0 incremental data cost |
| Provider/model/account | Official existing ChatGPT account/routing, salted fingerprints frozen outside HQ snapshots; `gpt-6-sol`, reasoning `low`, default tier, Codex0.157.0. Verify exact account/catalog before approval; abort if unavailable. |
| Work allowance | At most8 admitted turns total/rolling24h/day/cycle; at most5 per employee; one concurrent investment turn;5minutes per turn; zero uncertain retries |
| Activity window | Choose an exact start at least10minutes after setup; expiry exactly60minutes after start. Render absolute UTC timestamps and preview digest for approval. Never backdate. |
| Local retention | Delete provider-derived data and conclusions no later than2hours after the selected start (within24hours of setup). Raw gateway storage is memory-only. Retain non-content attribution/hashes/usage/approval evidence. No transcript export or permanent research archive. |
| Financial/public scope | No simulator portfolio, paper tools/fills, broker/order access, public channel/grant/transport, publication, Asymmetri mutation or recurring collector |

These identities were read from the actual HQ database; recheck they are enabled, eligible and
unchanged. The software accepts any reviewed eligible roster; these two are only this proposed
owner choice. Do not create employees or silently substitute a model, worker, date or source.

## Separate approvals and required evidence

Before **any deployment or host change**, obtain approval for the source commit to deploy,
service interruption, rollback point and below host preparation. Before **any collection or model
turn**, present the complete rendered research setup and obtain both collection consent and
external AI-processing consent plus the independently retained finite runtime approval.

The owner must assess and record source automation, private calculation and finite retention
permission, and separately permit transmission to the selected model/account under a stated
provider-retention policy. The earlier reported personal-use permission is not evidence of
unlimited model processing/public distribution. If permission or the provider's actual retention
terms cannot support this scope, stop before collection. Do not fabricate rights evidence.

Existing paid credits may be spent. Exact balances, Pro/credit attribution and final charges may
be unavailable. The owner must accept that risk and internal provider retries, record fresh
reload-OFF evidence (within24hours), and accept the above turn/duration bounds rather than an
unsupported dollar ceiling. No billing/reload setting is changed by the application.

## Read-only Ubuntu findings (2026-10-13 UTC)

- Actual HQ: Ubuntu24.04.5 LTS, kernel6.8.0-142-generic; Node24.21.0.
- Healthy active `botsquad.service`, user/group `botsquad`, working directory `/opt/botsquad`;
  code `a72cee080989960d2a9e1e74d9236157ce1a0448`; retained HQ schema14.
- `PrivateTmp=yes`, `ProtectSystem=strict`, `NoNewPrivileges=yes`; cgroup
  `/system.slice/botsquad.service`, `KillMode=control-group`.
- Root filesystem48GiB, approximately36GiB free; RAM approximately1.97GiB,1.5GiB available.
- **Blocking:** core limit is `infinity`;2GiB swap exists and approximately40MiB is used.
  Current ordinary Codex home is persistent. No04A root host manifest, isolated research
  runtime home, independent guard or source deployment was provisioned or activated.
- Eight existing persistent enabled employees were found, including Scout and Grace. Only
  identity/profile fields were read; no private provider credentials or transcripts were read.

Earlier Ubuntu22.10 references may describe another historical deployment/Asymmetri host. These
findings are specific to the `botsquad` SSH target; this task changed neither host.

## Deployment/confinement acceptance before authority

1. Reconfirm clean synchronized accepted main, resource headroom and no unrelated active work.
   Approve a recoverable **pre-collection** HQ rollback copy, excluding any subsequent provider
   data. Upgrade schema14→24 offline; verify all retained IDs/rows/usage and zero new authority.
2. Preserve the existing **root-managed, non-service-writable installed tree**. Build pinned
   source/dependencies unprivileged in staging, verify the reviewed artifacts, then install them
   through the approved root deployment process. Before root supervisor execution, independently
   verify root ownership, canonical paths and absence of service/group/other write permission for
   the guard, every imported module, Node runtime and their parent directories. A source hash
   computed by service-writable code is not root-code custody. Verify the actual CLI,
   Python3.12.12/yfinance1.7.0 and pinned transport confinement. Do not call Yahoo or models.
3. Approve and validate no swap/core dumping for the supervised process. With only2GiB RAM,
   assess headroom before disabling swap; do not do it opportunistically during a trial. Verify
   backup/snapshot/crash collection exclusions for HQ research content and runtime storage.
4. Provision `/run/botsquad-private-research/<authorityId>/{codex,tmp}` on tmpfs with canonical
   service-owned0700 directories. Authenticate the exact existing account there through a
   separately approved operator process; application code copies no credentials.
5. Provision root-protected `/etc/botsquad/private-research/<authorityId>.json` and
   `/run/botsquad-research-guard/` without writable/symlinked parents. Manifest schema is
   `ResearchHostManifest` in `src/control/market/research-host.ts`: exact HQ root/UID, authority,
   expiry/retention, backup-exclusion attestation, service, boot/source hashes and guard identity.
   Start the reviewed `dist/scripts/private-research-guard.js <authorityId>` under a root systemd
   unit with restart/failure supervision. Initial `guardPid=0` is bound once before owner setup;
   use the resulting immutable manifest hash in the source packet. Restart never refreshes
   approved manifest identity or re-enables work.
6. With authored fixtures only, establish missing/stale/forged lease rejection, process/cgroup
   membership, guard death/restart, stop/deadline behavior, descendant join and cold cleanup
   before any HTTP read after restart. Test root guard → `runuser` cold helper, tmpfs removal,
   SQLite/WAL marker absence, unavailable journal and pending purge. Require actual Linux
   evidence; Mac predicate tests are not operational acceptance.
7. Owner setup → exact two consents → stop HQ safely for independent finite-journal provisioning/
   approval → select that existing authority through `BOTSQUAD_FINITE_HQ_AUTHORITY` → restart.
   Preserve all earlier spent authorizations and permanently consumed/unknown entries. No
   runtime selector or custody failure may create a replacement allowance.
8. Use the authenticated owner collection button for the one exact request from the **running
   supervised service**, not an outside operator process. Inspect normalized provenance,
   missingness and the one-use receipt. Any denial/rate limit/unknown stops this trial; no
   fallback, additional symbol or recollection. Then explicitly start the exact future window.

## Trial evidence and stop behavior

Observe normal scheduler/dispatcher work with real employee/provider IDs. Require complete
worker-specific evidence reads, independently attributed substantive contributions, a separate
review of the full draft, final response to critique, and settled usage. Record actual timestamps
and honest completeness privately. No canned dialogue, forced dissent, forced conclusion or
trade. A failed contribution, missing telemetry, unknown outcome, revoked member/source,
reload change, expired window or lost custody stops admission without refund/replay.

Pause/Stop use existing owner controls, including before the discussion starts. At expiry the
independent guard stops the **whole HQ service cgroup**, including other work; this outage needs
explicit operational approval. At retention deadline it runs cold cleanup as the service account.
Inspect purge receipts and database/WAL/runtime absence. Provider retention is separately bounded
by the approved terms; do not claim remote erasure from local cleanup. Remove the runtime selector
before ordinary HQ service is restored. Preserve uncertain/consumed accounting; rollback never
restores an allowance or a backup containing expired provider data.

## Separate later gates

H1–H9 still require an exact paper-run consent/cash-only ledger, two distinct real elapsed exchange
sessions, eligible contemporaneous execution evidence or explicit unavailable/HOLD state, genuine
employee decisions and independent review, valuations/benchmark and portfolio continuity, controlled
restart between sessions, complete consumption evidence and private closure. This research run has
no paper ledger and cannot satisfy H2/H5/H6. Public launch additionally needs public/derived rights,
canonical publication mappings, Asymmetri/Ask security and capacity acceptance, reviewed deployment
and a separate launch authorization.

## Concise follow-up prompt

“Prepare the HQ-READY-04A first genuine private research trial using the reviewed packet. Recheck
Scout/Grace, propose exact UTC times, rights/provider-retention evidence, account fingerprints and
reload-OFF proof, and complete the permitted read-only host checks. Present the final deployment/
confinement and one-request/eight-turn approval packet before making host changes, retrieving Yahoo
data or invoking employees. Keep the two-real-session H1–H9 paper trial and public launch separate.”
