# Execution Plan — INFRA-01 infrastructure checkpoint handoff

## Current closure — October 9, 2026

**Status:** Migration cancelled/deferred; snapshot deletion and cleanup verified;
documentation reviewed. INFRA-02 remains not started.
**Owner/branch:** Same primary writer, `feature/infra01-documentation-handoff`;
existing dedicated worktree, specialists read-only; PR #35 open and unmerged.
**Closure ETA:** Initially 25–40 minutes for audit, deletion, cleanup and documentation.

The owner explicitly cancelled migration, authorized exact snapshot deletion after
backup verification, and retained current Ubuntu 22.10 production. Decision 030
records the exception and future readiness gates. The roadmap pins Asymmetri closure commit
`f229c05d8cfad7a8fd71edef48bc6f7df74f8580`. All historic attempts below remain evidence only; their
rebuild, retirement and snapshot-retention gates no longer govern this workstream.

Actual closure evidence: all 12 archive copies verified; 11.23 GB snapshot removed
with account absence confirmed 20:05:58 UTC; 198 requests/15 hosts and DNS/TLS passed;
production identities/configs unchanged. Mac 48 KiB allocated disposable files removed;
no new HQ/production deletion. Encrypted backups and private evidence preserved.
No deployment, new authority, public behavior change, expense or next milestone.

Validation for this update: focused Markdown/link checks, unchanged INV/INV-ASK rows,
contract and Decision 029 bytes, complete diff and independent read-only scope/security
review. No runtime tests or unavailable paid automated review are claimed for docs.
PR #35 is updated on its owned branch, not merged; other writers/worktrees are untouched.

## Historical preparation and continuation record

Everything below records earlier preparation; current scope/status above supersedes
its active instructions. Earlier failed tests, risks and commit references remain.

**Status:** Complete for the documentation change; infrastructure acceptance pending
**Owner:** Primary INFRA-01 integration agent; specialists read-only
**Branch:** feature/infra01-documentation-handoff
**Worktree:** Dedicated `botsquad-infra01-docs` checkout, separate from all existing writers
**Started:** 2026-10-09
**Initial ETA:** 25–40 minutes for remaining cross-repository preparation/review
**Current ETA:** Retirement/recovery documentation ready for review; production retirement and migration ETA depend on explicit windows, console/custody and target acceptance gates

## Objective and scope

Record the owner-selected Asymmetri Ubuntu migration as INFRA-01 and the separately
selected future receiver deployment/Linux acceptance as INFRA-02. Keep both distinct
from locally complete, undeployed INV-02 feature implementation.

This branch changes documentation only. No HQ, worker, Nix authority, receiver,
contract, grant, runtime, schema, source provider, investment milestone status or
Decision 029 change. No INFRA-02 prompt is generated or task started.

## Current authority reviewed

Repository AGENTS, README, Project Vision, System Architecture, decision index,
Project Memory, investment README/ROADMAP/DECISIONS/SIMULATION_RULES, Decision 029,
and INV-02 validation. The isolated branch starts at freshly fetched origin/main
`5ad0466ffef7367f9eba8c977af4e732f101dc5d`. Existing primary and other worktrees
remain unchanged. One primary writer; read-only roadmap and acceptance review.

## Implementation and validation

1. Inspected repository ownership and synchronized the remote before creating this
   isolated branch; no reset, force push or unrelated staging.
2. Added a separate infrastructure table and short guide/memory links. The existing
   INV/INV-ASK table and all contracts/Decision 029 remain byte-identical.
3. Linked exact Asymmetri preparation commit `50fb207ffbd752ebd1d3d2a0e35c3612826b16dd`
   in the roadmap, with migration and validation records.
   Its status is prepared, with no new host or production cutover.
4. Reviewed all changed Markdown and relative links, checked unchanged milestone
   rows/contracts and `git diff --check`; obtained independent read-only review.
5. Published the initial dedicated branch as commit bc97c88 and opened
   [PR #35](https://github.com/eugenelin89/bot_messenger/pull/35). Continuation preflight
   verified it remains open/unmerged and owned by this workstream; update it safely.
   No BotSquad runtime tests are claimed for this documentation-only change.

## Evidence boundaries

Asymmetri's original host is still Ubuntu 22.10. Its audit, TLS-verified existing-site
baselines, encrypted backup preparation and local checks are evidence of preparation,
not Ubuntu LTS acceptance. The initial report left cloud recovery, paid resources, full restore rehearsal,
Linux compatibility and traffic/write-freeze approval unresolved. The continuation
supersedes that resource/traffic strategy as described below. Existing HQ Ubuntu
acceptance alone is not evidence for the separate website applications.

The Asymmetri migration preserves its actual production release; newer GitHub main
and the default-disabled receiver are not automatically deployed. US$0 market-data
policy and separate hosting/model/publication approvals remain intact.

## Remaining work and handoff

The documentation branch is ready for reviewed PR integration. INFRA-01 remains
blocked on recovery gaps and separate rebuild/outage approval; INFRA-02 remains planned and unselected. Completion of
infrastructure later must not change investment feature statuses without their own
acceptance. Product Vision and System Architecture were reviewed and need no edits
because their runtime/product truth is unchanged.

## October 9 same-Droplet continuation — historical phase

The retirement amendment below supersedes this phase’s active Django/PG runtime
acceptance requirements and unanswered private-transfer question. Its checks remain
historical evidence; current operational guidance is linked by the roadmap.

The owner superseded the replacement-Droplet proposal: keep the existing Droplet
identity/IP and DNS, rebuild its disk with Ubuntu 24.04 only after demonstrated
recovery and explicit outage/destructive approval. No new Droplet or permanent
hosting increase is authorized. Initial Asymmetri evidence at 50fb207 remains
historical; then-current runbook/validation were pinned to `f2964bdef68779b7c5d6e4d136821c78e30e7cb4`.

Snapshot storage is approved up to US$1.50/month. The authorized live snapshot
completed at 11.23 GB, approximately US$0.67/month before tax; independent application
backups remain necessary. Once accepted migration, healthy observation and tested
current post-rebuild recovery are evidenced, deletion of the exact migration
snapshot(s) and verification of no further storage accrual are mandatory for
INFRA-01 completion. No early deletion, implicit outage or destructive rebuild.

After a same-Droplet rebuild, no original live disk remains. Rollback is a snapshot
restore onto the same Droplet, with additional downtime and preservation/reconciliation
of any new writes. DNS switching is not the recovery mechanism. The active plan
requires all 15 hosted entries plus default behavior, peer Django/SQLite, dormant
PG 14, retained files, Nginx/TLS, accounts/access and schedules to be accepted.

The owner later authorized `ssh botsquad` as an isolated rehearsal environment and
required cleanup after use. This does not authorize a BotSquad service/package/data
change, receiver activation or broader worker authority. Public pinned website
source can be tested in bounded task-only namespaces. Automatic approval review
blocked transfer of private settings/databases/TLS archives pending explicit scoped
permission; no such transfer is claimed here. The Asymmetri validation record owns
actual Linux outcomes and cleanup receipts, including failed attempts and corrections.
The pinned Next release passed Ubuntu 24.04/Node 22 checks, production build, native
image processing, startup and 22 application requests. Task files/processes/units were
removed at 18:37:09 UTC; HQ service and listeners were unchanged. No private recovery
payload transferred and no host package was installed. This is application rehearsal,
not full multi-site restoration or production migration acceptance.

Validation preserves the entire INV/INV-ASK status table, Decision 029, contracts and
completed INV-01/02 technical records. This continuation updates four documentation
files only, with one primary writer and read-only specialist review. PR #35 remains
open for review; document readiness does not complete INFRA-01 or start INFRA-02.


## October 9 retirement amendment and further recovery verification

Continue the same INFRA-01 workstream and existing PR #35. The owner selected retirement
of the active peer Django application, preserving source, SQLite, settings, static
files and recovery instructions. The dormant draft selects PostgreSQL; retain the
entire cleanly stopped cluster and supplemental TLS files without installing PG on
the future target. No other active dependency was found. Shared application users,
OS Python, surviving sites, all DNS records and the snapshot remain protected.

Actual copied SQLite passed 10 read-only Django journeys on the Mac; all 216 current
non-DB source/settings/static files match the encrypted archive. Case-sensitive
Mac restoration verified 42,605 retained members and 66 filename collisions. Numeric
Linux ownership tests and Django/PG runtime checks used synthetic fixtures only.
No private production archives, real records/settings or TLS keys went to HQ.
The latest prohibition supersedes the earlier unanswered transfer-permission question.

The pinned Next release rebuilt on Ubuntu; combined Next/Gunicorn/Nginx passed 337
synthetic requests under an aggregate 512 MiB limit. In-unit kernel memory peak was
130.71 MiB with zero swap/OOM; 4 rps is not sustained four-way concurrency or whole-host
stress acceptance. Retirement saves roughly 36 MiB current charged RAM and 20 MiB swap;
dormant PG saves no current runtime memory. Existing 1 GB + 2 GiB swap is provisionally
reasonable, subject to target/build/headroom validation. Original data is not a disk
cleanup candidate. Application runtime omission reduces maintenance obligations.

A small static 410 notice is recommended, retaining domains/DNS/TLS. Actual response,
write-freeze window and stop/disable of **both** active service and socket require
approval and a final verified SQLite/file checkpoint. Neither retirement nor rebuild
has occurred. Original domain responses remain until approval; original baseline
history is preserved. Full private runtime recovery is an explicit archival limitation,
not a requirement to run unused applications on the new target.

BotSquad cleanup at 19:24:58 UTC removed 44,984 files/1,733,402,849 regular bytes, with no
remaining task processes/units and unchanged HQ service/listeners/package inventory.
Mac temporary restore volume/key/plaintext/runtime were removed; encrypted recovery
archives and receipts remain. No host package installation or HQ configuration change.

DigitalOcean offered Ubuntu 24.04 x64 and the retained snapshot in the existing
Droplet's rebuild selector; the form was cancelled. Root/admin console password
entries are locked and original custom user-data empty. Usable console/bootstrap,
separate-device custody, final target acceptance and separate outage/rebuild approval
remain. Snapshot deletion is still a post-success mandatory gate, not authorized now.

Review corrected the main run sheet to stop the socket with its service and separated
private file/owner-metadata evidence from synthetic Linux ownership application.
The INV/INV-ASK table, Decision 029, contracts and feature/runtime authority are unchanged.
Current Asymmetri evidence is pinned in the roadmap to the implementation commit;
the prompt journal is a separate commit. PR #35 stays open and unmerged.
