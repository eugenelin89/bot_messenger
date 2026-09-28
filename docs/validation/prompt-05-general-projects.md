# Prompt 05 — Generalized Projects acceptance

**Status:** Runtime, real Ubuntu, reboot and documentation acceptance PASS. Final Git/deployment equality is verified in the delivery handoff.

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

## Release identity

Accepted runtime feature: `18308dd80215dea4e0fb2c89597e9c1550143051`.
The Project workflow ran on `7d3691c25e54ca821da3facdee9458e91ff506ad`; later changes
only corrected legacy acceptance instructions and documentation, with identical
production digest recorded below. All deployments used normally pushed exact SHAs.
Final main, origin/main and deployed SHA equality is recorded in the delivery handoff;
this evidence/documentation closure changes no accepted production implementation.
Authenticated live GitHub push remains explicitly unvalidated, not a completion claim.

## Initial feature deployment and public GitHub

Feature `3894e7fe37a9dfdabd8bb4314de63ea309c7a21b` was pushed normally and deployed
through the checked-in bootstrap. The hardened Ubuntu deterministic suite passed
105/105 tests, zero skips/failures, in 77.99 seconds. Its evidence is retained at
`validation/deterministic-20260928T072631Z` on the HQ.

Production comparison passed all 27 original tables, preserving IDs, profiles, runtime
bindings, messages, task/execution results and audit. The existing startup refreshWorker
routine changed only the worker updated_at timestamp; status and all other original
fields remained identical. All 38 original account mappings and 116 root JSON records
matched. Schema is 5, production remains paused, runtime ready and no completed replay.

The public GitHub adapter imported and fetched `https://github.com/octocat/hello-world.git`
on `master`, head `7fd1a60b01f91b314f59955a4e4d4e80d8edf11d`. Inspection found 7 objects,
914 object bytes, one 13-byte README. The 1.572-second credential-free probe created no
workers and archived its Project. Evidence: `validation/public-github-20260928T073400Z`.
Authenticated GitHub push was not attempted and remains unvalidated.

The first real run, `validation/projects-20260928T073322Z`, reached changes_required,
revision, second approval, completed integration, all four restart gates, reconciled
publication, blocked divergence and archive. Root/operator evidence passed 100 real UID
checks and four archived-clone denial checks. Its final report writer failed on a trailing
slash in the source-root Git safe.directory value, after all lifecycle assertions. The
harness canonicalizes that path now (verified under the service UID without a global
Git exception). This diagnostic run remains retained; the fresh repeat below provides the
clean final machine-readable result. No assertion or authority boundary was weakened.

## Accepted real Project workflow

Runtime feature **`7d3691c25e54ca821da3facdee9458e91ff506ad`** passed at `2026-09-28T07:51:57.493Z` in the fresh
`validation/projects-20260928T074655Z` company (exit 0).
[Sanitized machine-readable evidence](prompt-05-projects-evidence.json) includes exact
review artifacts, runtime profiles, policy, IDs, Linux probes and resources.

Project: `project_812d2e4d-f033-40f9-8fd6-65d31e13a0b4`; final state **archived**. Both repositories are
`imported`, default branch `trunk`, in the same Project:

- `repository_e150c06e-09b1-4443-acab-cb5c6247bc33` — LedgerBrief; remote policy `approved_push`.
- `repository_f1f39b45-d4a3-46f4-a898-8234862fc0e0` — Divergence inspection; remote policy `fetch_only`.

Policy allows two disjoint writers and three review rounds. Protected paths include
AGENTS.md, .github/, .botsquad/ and test/. Named focused `ledger` and `report` recipes
and full `full` recipe invoke only trusted confined Node tests. No package installation,
worker-selected command or external worker remote is allowed.

| Engineer | Allocation | Scope | UID/GID |
| --- | --- | --- | --- |
| Linus | `allocation_c760d508-0b51-48ed-ad29-348a52040c91` | `src/ledger/` | 20049/20049 |
| Ada | `allocation_7e35236e-4f49-4106-84e6-9a8ad3652f9a` | `src/report/` | 20050/20050 |

The independently owned clones had no remotes and clean Git state. Execution overlap
was **17.831 seconds**; real model-turn overlap was
**16.432 seconds**. Both engineers made four actual rejected write probes.

| Round | Submission | Commit |
| --- | --- | --- |
| 1 | `submission_98d634d9-741c-4a2d-914a-d39069a9b8fb` | `88fe4e17f492479aed93ab0991b5a971673f10ea` |
| 1 | `submission_676896b6-ece1-4128-aa71-5e16158bc50e` | `b2d41215bef62aff189eab67d8ba488b6d1c5868` |
| 2 | `submission_bb91ae41-10d3-4744-bf91-6b73d826232b` | `fd56c5cd360a41ff9050c24dd083927bb72f9c59` |

First review `review_cf8bab9b-e164-4857-8278-575e72310659` requested changes because the exact ledger
diff lacked malformed/nonfinite amount guards. Revision execution
`execution_549396d1-601e-486b-b3a0-66dea4bf7b0e` reused the same logical worker, task and
Codex thread and created a descendant commit and new immutable submission.
Second review `review_ea8b6af4-a694-41fb-b56e-658768ebc504` read the new exact packet,
verified the guards and approved only that revised ledger plus Ada's original report.
The validation fixture deliberately deferred those guards initially; no production
reviewer rule forces changes_required.

Integration queue `integration_0b73f552-2e65-4f5b-9c99-d01c01abf9a9` retained base
`f5fff3849d5cbfc73cb68eecfdf4b06afba591e5` and the exact approved submission IDs.
Candidate and final canonical commit are both
`649059750d00e4ef54ef8b1580e2e9184ca404da`. Full recipe passed **2/2 tests**, including
malformed/nonfinite rejection, before the canonical fast-forward. No failed or stale
candidate advanced canonical state.

## Remote publication and recovery

The controlled bare receiver represents `botsquad-validation/ledger-publication` (no actual GitHub
repository was created). The exact approval was
`approval_afd1ab73-85a3-41cf-b84a-4a6f8c84bed8`, operation
`operation_68dec7b6-83ee-432a-b83b-bc09164c1498`. It bound branch `trunk`,
old `f5fff3849d5cbfc73cb68eecfdf4b06afba591e5` and new
`649059750d00e4ef54ef8b1580e2e9184ca404da` plus Project, repository, remote and integration identity.
The non-root trusted service published once, deliberately lost the response, then
reconciled remote == new SHA after restart into one immutable receipt. An explicit
retry did not send another publication. Root-operation flag remained false.
A separate imported repository in the same Project blocked divergent remote history
without resetting or merging canonical history.

Restart checkpoints passed with exact record equality after the first submissions,
changes-required revision request, new resubmission, queued integration, lost remote
response and archived state. Pending identity approval also survived restart.
Archive preserved repositories, bindings, reviews, submissions and integration,
released allocations, rejected new work and removed worker clone access.

## Real Linux authority checks

The operator companion passed **100 actual UID checks**: 98 denials and two allowed
own-clone writes. These include source/SQLite/canonical/sibling isolation, central
Codex credential-directory canary denial, root socket denial and root/sudo denial.
Four additional archive probes denied both read and write for both released clones;
clones remained preserved. Worker identities remained ready for future authorized
allocations. All real runtime policies were read-only, network disabled, with no
inherited environments. Linux memory, tmpfs, process, network, host and output/deadline
probes also passed in the 105-test hardened service suite.

## Project resource measurements

The imported bundle was **1,797 bytes**. Canonical repositories used
404 and 256 KiB; engineer clones used 324 and 284 KiB after archive. Across 152
two-second samples, validation-cgroup peak was **244.96 MiB**, host available
memory never fell below **1384.59 MiB**, and maximum swap use was
**780 KiB**. Mean sampled host CPU busy was **30.52%**, peak 100%,
and peak one-minute load **0.91** on the one-vCPU host.

Concurrent-engineering samples peaked at 241.77 MiB charged cgroup memory; the queued
integration/full-recipe window peaked at 185.34 MiB sampled memory. Cgroup peak includes
charged file cache; summed process RSS double-counts shared pages. The sampler cannot
resolve sub-second import/clone/recipe peaks independently. Overall cgroup memory.peak
captures intervening charged peaks. The public GitHub import/fetch independently took
1.572 seconds. These are bounded fixture measurements, not large-repository sizing claims.

## Validation fixture diagnostics

Three legacy diagnostic runs remain retained. `identity-20260928T075221Z` completed
SquadStatus integration but its models guessed an absolute source filename, so the
existing exact botsquad_source audit assertion failed. Every attempted write was
rejected. `identity-20260928T080029Z` then stopped before engineering because the CTO
waited for an engineer-only context value; trusted completion validation rejected it.
`identity-20260928T080646Z` completed integration but one engineer concatenated its
sibling allocation ID into the path argument, so the original sibling_allocation
audit assertion correctly failed. The final standalone validation entrypoint renders
four exact rejected-write JSON objects from each actual allocation into its engineer
context. Models still invoke real tools; no audit/result is fabricated and production
has no fixture switch or import. Production denial/completion logic and all legacy
assertions are unchanged. These diagnostic runs are not counted as accepted regressions.

The accepted Project source and subsequent fixture-only revisions have identical
production files (`src`, `deploy`, `public`, package manifests and tsconfig): 39 files,
SHA-256 `b51b68226fa82c2aaa251d4e63847620570ab5c8ca887840ab4dda2efaa5db8b`,
computed over sorted relative paths, NUL separators and file contents. Final delivery
must preserve this digest. Hardened runs at `5b091e2a10575cd481ea63f14ec38297b7063332`
and `cf22a0a448e7c9739107c5452f6005ca9e738dd7` each passed all 105 tests, zero skips,
in 86.91 and 87.91 seconds respectively.

## Production hard-coding review

The final search classified every production occurrence of SquadStatus/calculate/format,
SQUAD_FILES and PRODUCT_CONTRACT. The scaffold/contract and legacy runner are explicit
regression adapters; engineering branches select them only for legacy repositories;
the old objective route/tool enum remains historical compatibility; migration 2 remains
historical SQL. Generic Project tasks use registered repository scope, policy and recipes.
Occurrences such as repositoryformatversion and format_version are unrelated identifiers.
No generic engine path requires those module names or default branch main; the accepted
Project used trunk. Retained tests only changed expected migration version/column lists
and added immutable-trigger assertions before their original corruption checks. No old
assertion was removed or relaxed.

## Research and real host receipt regressions

On `18308dd80215dea4e0fb2c89597e9c1550143051`, fresh research run
`prompt01-20260928T081549Z` passed in 77.5 seconds. Scout produced its real artifact;
Atlas resumed/evaluated, restart preserved all completed records, the same retained
thread resumed again, and a new real turn acknowledged interruption before cancellation.
Human-locked gpt-6-sol/low profiles were verified, with Atlas critical and Scout normal
priority. [Sanitized research evidence](prompt-05-research-evidence.json) records all eight
checks, identities, bindings and provenance.

Fresh `recovery-20260928T080645Z` passed against the identical production implementation:
real Linux operation `operation_19b02502-9830-40f9-b22a-e8c23540bc1d`, approval
`approval_7aa1feab-3d01-43bb-9179-459c24c79c1e`, UID 20063. The account was actually
created before the transport response was withheld; the consumed approval recovered on
restart with the same UID and exact receipt. A changed operation payload was rejected.

## Accepted SquadStatus and retirement regression

Fresh `identity-20260928T081724Z` passed on the accepted runtime feature, with seven
real workers/Unix accounts, real Nix approval requests, distinct engineer clones,
28.799 seconds execution overlap and **27.171 seconds model-turn overlap**.
Every original denial/audit, profile, provenance, review, integration and restart
assertion passed. Full SquadStatus validation passed **6/6 fixed tests** and its exact
CLI output. Integration `integration_5fc3f98d-41e8-41c1-9404-e27852a38611` produced
`24f54342a962c920c532ddd5a3f54ed87e1fce31`.

The operator companion passed 100 actual UID checks. Retiring Linus (UID 20075)
through `operation_f715785a-ed61-4aa2-82fd-9058a421548a` killed the bounded sleep with
SIGKILL, revoked clone access, retained the home/history, denied home reads, and rejected
new assignment. Restart preserved the disabled identity and all historical records.
The provisioner cgroup peaked at 21,901,312 bytes (20.89 MiB) during this installation's
acceptance window. [Sanitized legacy evidence](prompt-05-legacy-evidence.json) contains
exact identities, submissions, review, integration, probes and retirement results.

## Full reboot and final preservation

A full host reboot was required and performed because the root provisioner changed
and the bootstrap installed five host package updates. The boot ID changed. Production
service and provisioner socket started at boot; a normal read-only inspect_host_health
request activated the provisioner service and returned protocol 2/ready. Socket activation
is intentional; an inactive service before its first socket request is not a boot failure.

Strict comparison preserved all 10 closed/current acceptance databases, all 78 current
service/worker account mappings, 245 root JSON ledgers/receipts, and captured home/clone
ownership, modes and ACLs. SQLite integrity and foreign-key checks passed. Against the
original protected backup, all 27 original production tables, 38 original accounts and
116 original root records remained intact. Only the existing startup worker updated_at
refresh is excluded; no other original field is excluded. No completed work replayed.

After reboot, four actual archived-clone read/write denials and a retired-home denial
passed again. Production stayed paused with runtime ready; central Codex reports ChatGPT
authentication without credential reads, and UI remains solely `127.0.0.1:4310`.
[Sanitized host recovery evidence](prompt-05-host-recovery-evidence.json) omits the raw
host/account inventory, boot IDs and private backup contents.

## Documentation acceptance and limitations

Decision 014 records Project/repository identity, scopes, recipes, review/revision,
integration, remote trust/approval, archive and migration. README, AGENTS, Roadmap,
Vision, Organization, Architecture, Ubuntu/bootstrap, operator/multi-instance/Demo docs,
decision index and both English/Taiwan Traditional Chinese white papers agree on the
new lifecycle. Roadmap now marks **Prompt 05 Complete / Prompt 06 Next** after runtime
and reboot acceptance. Historical Prompt 01–04 decisions and validation records remain
unchanged. No Prompt 06+ implementation was added.

Current-facing stale searches covered fixed-product limitations, one-review/integration,
calculate/format assumptions, arbitrary-repository and generalized-project future claims,
and outdated Prompt 04/05/06 status. Remaining matches are explicitly historical legacy
schema/fixture evidence or valid limits; they are not current generic-engine requirements.

Known limits: bounded dependency-free Node tests only; no dependency/environment manager
or deployment automation; 16 MiB repository objects, 4 MiB bundle, 1,000 files, 128 KiB/file,
256 KiB diff, 100 changed paths and 16 commits/submission; unsupported Git features fail
closed. Older Codex engineering bindings cannot silently adopt new tool schemas. Public
GitHub fetch passed, but authenticated GitHub push was not attempted without a safe
credential and disposable authorized target. Controlled bare-receiver publication passed.

Final Markdown gate: **20 changed Markdown files, 215 relative links, zero broken
internal targets**; no relative fragment links required checking. `git diff --check`
passed. The pre-integration fetch found main advanced to
`30e208f11e7961ac7644b71e794f355639c8d433`; both incoming documentation commits were
inspected and preserved by a normal merge. The new engineer primer's explicitly
historical discussion remains intact, with a short accepted-implementation note and
links to current evidence. Production files still match the accepted digest.
