# Execution Plan — INFRA-01 infrastructure checkpoint handoff

**Status:** Complete for the documentation change; infrastructure acceptance pending
**Owner:** Primary INFRA-01 integration agent; specialists read-only
**Branch:** feature/infra01-documentation-handoff
**Worktree:** Dedicated `botsquad-infra01-docs` checkout, separate from all existing writers
**Started:** 2026-10-09
**Initial ETA:** 25–40 minutes for remaining cross-repository preparation/review
**Current ETA:** Documentation and public-source rehearsal complete; private recovery and destructive-operation gates prevent a reliable migration ETA

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

## October 9 same-Droplet continuation

The owner superseded the replacement-Droplet proposal: keep the existing Droplet
identity/IP and DNS, rebuild its disk with Ubuntu 24.04 only after demonstrated
recovery and explicit outage/destructive approval. No new Droplet or permanent
hosting increase is authorized. Initial Asymmetri evidence at 50fb207 remains
historical; current runbook/validation are pinned to `f2964bdef68779b7c5d6e4d136821c78e30e7cb4`.

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
