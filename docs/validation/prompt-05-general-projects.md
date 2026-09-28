# Prompt 05 — Generalized Projects acceptance

**Status:** In progress; no completion claim.

**Started:** 2026-09-28 06:00 UTC

**Starting main:** `b1c005815425353c51b385a2b5e8c26f17e66edf`

**Baseline Ubuntu:** `ff39661e438c31b1e842ab917ee06a49de403480`

**Branch:** `feature/prompt-05-general-projects`

## Local evidence

- Original deterministic suite: 81/81 passed before implementation.
- Generalized suite: 103/103 passed, including retained schema-4 migration,
  actual Git revision/two deliveries, exact review packets, crash reconciliation,
  remote atomic-old-SHA race, lost responses, archive, HTTP and Prompt 04 regressions.
- Final local suite: 104 passed, zero failures, one explicitly Linux-only resource test
  skipped on macOS (105 total), 38.6 seconds. Deadline/output/early-exit checks passed;
  the memory/tmpfs probe must pass on Ubuntu before acceptance.
- Python provisioner parser/manifest/idempotency checks: 9/9 passed.
- Browser acceptance used a disposable paused company, with no real model execution:
  created Project, created local repository on `trunk`, inspected policy/revision evidence,
  archived Project, verified history retained and work controls removed. JavaScript syntax
  and TypeScript checks passed. This is development UI evidence, not Linux isolation.
- Migration fixture compares every retained original column/row across workers,
  profiles, bindings, identities, approvals, protected operations, receipts, repositories,
  allocations, submissions, reviews, integrations, tasks, executions, messages and artifacts.
  External filesystem tree is unchanged; all foreign keys remain valid.

## Production preservation

At 07:16 UTC, production was paused, runtime ready, with one worker, one completed task
and execution, one binding, no engineering repositories and no active executions or
pending approvals. The infrastructure UI represents its retained unprovisioned identity;
no new Unix grant was made by migration or preflight.

A root-only backup was created before deployment:
`/var/backups/botsquad/prompt05-20260928T071833Z`, mode 0700. The verified archive is
6,368,311 bytes; SHA-256 `4718dce7e5bd361ffc5d4dc61d3137a861af0b87e537e27048199d5c2972be06`.
It includes production/validation data, central Codex state, worker homes, provisioner
state/code, service/configuration, account mapping and protected account databases.
The protected manifest records 27 original tables, 38 service/worker accounts and hashes
of 116 retained root JSON ledger/receipt files. No credential contents are published.
Services were stopped for consistency and restarted; production remains paused.

## Security review

Reviewed import, URL normalization, credential handling, Git metadata/hooks, normalized
paths/overlap, immutable provisioner manifests, recipes, packet provenance, integration,
publication and archive. Closed issues before feature deployment:

- resource-limit bundle ingestion before object inspection;
- exact receive-pack old SHA instead of an insufficient preflight-only push check;
- write limits across the working tree, including prospective overwrites;
- worker ID in immutable allocation identity;
- read-only repository plus bounded disposable `build/` scratch;
- no false success for early-exit/output/deadline recipe failures;
- exact revised packet and recovery after validated canonical advance;
- compatible runtime tool-schema markers rather than silent thread replacement;
- new work and policy changes blocked while publication is pending;
- seed bundle contents omitted from UI/model infrastructure snapshots.

The checked-in fresh-company harness uses only real runtime turns and trusted human
HTTP approvals. Its operator-selected bare transport and durable pause gates exist only
in `scripts/fixtures/projects-server.ts`, never production entrypoints or worker tools.
The initial LedgerBrief submission deliberately defers input guards in this validation
fixture; Grace must identify the actual defect, request revision, and review the real
new commit. Normal production reviewer behavior has no forced-disposition rule.

## Remaining acceptance gates

Exact feature push/deployment; Ubuntu deterministic suite and resource probes; real
Nix/Unix/Codex workflow with concurrent engineers and two review rounds; four durable
restart checkpoints; bare-remote publication/lost-response/divergence; harmless UID
canaries and archive revocation; retained SquadStatus/research/retirement regressions;
required host reboot; final production comparison; documentation freshness; normal
main integration/push/deployment/equality. Record IDs, SHAs and sanitized evidence below
when observed. Authenticated live GitHub push is currently unvalidated and no credential
or disposable external publication target has been assumed.
