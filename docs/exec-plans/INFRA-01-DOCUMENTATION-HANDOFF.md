# Execution Plan — INFRA-01 infrastructure checkpoint handoff

**Status:** Complete for the documentation change; infrastructure acceptance pending
**Owner:** Primary INFRA-01 integration agent; specialists read-only
**Branch:** feature/infra01-documentation-handoff
**Worktree:** Dedicated `botsquad-infra01-docs` checkout, separate from all existing writers
**Started:** 2026-10-09
**Initial ETA:** 25–40 minutes for remaining cross-repository preparation/review
**Current ETA:** Documentation complete; infrastructure gates require owner action

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
5. Publish the dedicated branch and open the normal documentation PR after the
   evidence links are finalized. GitHub records publication and review state.
   No BotSquad runtime tests are claimed for this documentation-only change.

## Evidence boundaries

Asymmetri's original host is still Ubuntu 22.10. Its audit, TLS-verified existing-site
baselines, encrypted backup preparation and local checks are evidence of preparation,
not Ubuntu LTS acceptance. Cloud account/recovery access, paid-resource approval,
full restore rehearsal, Linux compatibility, every-site staging and separate
cutover/write-freeze approval remain required. Retained HQ was not contacted or
modified. Existing HQ Ubuntu acceptance is not evidence for the separate website host.

The Asymmetri migration preserves its actual production release; newer GitHub main
and the default-disabled receiver are not automatically deployed. US$0 market-data
policy and separate hosting/model/publication approvals remain intact.

## Remaining work and handoff

The documentation branch is ready for reviewed PR integration. INFRA-01 remains
prepared, approval-pending; INFRA-02 remains planned and unselected. Completion of
infrastructure later must not change investment feature statuses without their own
acceptance. Product Vision and System Architecture were reviewed and need no edits
because their runtime/product truth is unchanged.
