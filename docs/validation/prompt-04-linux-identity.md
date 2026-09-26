# Prompt 04 — Linux identities, approvals and Nix acceptance

**Status:** Runtime and real Ubuntu acceptance PASS. Final Git/deployment equality is verified in the delivery handoff.

Starting synchronized main: `a81dc576473196a3b1634fb4fbb49a0cd07d32d3`.
Implementation branch: `feature/prompt-04-nix-worker-identity`, one worktree and one
implementation writer. The initial local main was clean and 26 documentation commits
behind origin; those commits were inspected and fast-forwarded before implementation.
All host deployments use pushed, exact Git revisions. No force push or history rewrite.

## Scope and trust boundary

Nix is a persistent DevOps leaf with its own worker/principal, Codex binding, profile,
Linux account and explicit infrastructure tasks. The initial human-requested Nix
bootstrap is the only exception to Nix coordination; it still requires exact approval.
Every subsequent protected grant in acceptance passed through Nix and the real trusted
loopback HTTP decision endpoint. The validation operator approved only the fixed fresh
validation company scenario. No bot approval tool or direct SQL approval mutation exists.

Logical workers, Unix accounts, runtime workspaces/threads and executions are distinct.
Migration 4 preserves previous histories, profiles and runtime paths without creating
OS users. Linux engineering requires backend-correct identities and both clone bindings
before dispatch. The development backend is explicitly simulated and makes no Linux
isolation claim.

Root provisioner code is root-owned under `/opt/botsquad-provisioner`; its state and
receipts are private under `/var/lib/botsquad-provisioner`. Only root and the trusted
service UID may connect to the Unix socket. Root handles fixed account lifecycle and
receipts; a separate child drops to the target UID/GID with no supplementary groups,
no capabilities, NoNewPrivileges, fixed environment and resource limits before project
parsing, writes and Git. The protocol has no shell, arbitrary executable, arbitrary
path, username, package installation or service restart operation.

## Deterministic checks and explicit security review

The expanded suite passes **81/81** on macOS and inside the production Ubuntu systemd
restrictions, including eight Python parser/receipt cases. TypeScript and JavaScript,
shell and Python syntax checks pass. Tests cover migration with retained histories,
exact immutable approval envelopes, human-only decisions, wrong target/requester,
expiry/denial/replay/stale execution and preconditions, consumed-intent recovery,
identity readiness, account/project ownership, retirement and deferred revocation.
Historical scheduling, profile provenance, Git review/integration and product confinement
regressions remain included.

The review traced authority from runtime tools through task scope, immutable operation,
one-time transactional approval consumption, the fixed client, SO_PEERCRED, strict
bounded parser, root ledger, UID child and trusted import. Worker/message text never
supplies human authority. Bootstrap accepts only exact commits and installs privileged
code outside service-writable state. Unknown or ambiguous state fails closed.

Important reviewed details:

- Account names derive from immutable worker UUIDs, never display names. UID/GID
  reservation is durable before user creation; existing collisions are not adopted.
- Approval persists target, requester principal/worker, task/execution, parameters and
  hash, expiry, reason and current preconditions. Consumption and running intent commit
  before the host call; the same operation ID can reconcile, while changed payloads fail.
- Private worker groups have no members; accounts are locked/nologin with no SSH keys
  or copied Codex credentials. Only the service receives named read/traverse ACLs.
- Root code never executes product JavaScript or repository Git as root. Fixed Git
  invocations disable hooks, external configuration, fsmonitor, signing and prompts;
  tree checks reject links, special files, unsafe config and Git indirection.
- Independent clones have worker-owned metadata. Trusted import revalidates exact
  parent and allowed paths; Grace approves exact commits before tested integration.
- Product tests still run as botsquad in the existing bubblewrap, namespace, seccomp
  and Node-permission sandbox, with Git metadata hidden. This is distinct from UID
  execution of bounded source writes and commits.
- Retirement blocks active/outstanding/unintegrated work and protected managers,
  disables logical dispatch before revocation, uses UID-bound pidfds, retains homes
  and history, and cannot silently delete data or recreate disabled identities.

The provisioner needs `/etc` writable for shadow-utils atomic replacement/locks, but
its code exposes only fixed lifecycle commands. Its systemd default-root identity
retains the narrow capability bound and NoNewPrivileges; explicit `User=root` caused
systemd 255 to drop effective CAP_SETUID under this seccomp setup. Startup asserts the
required drop capability and worker children assert zero effective/permitted capability.
See [Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md) and the
[upstream systemd source](https://github.com/systemd/systemd/blob/v255/src/core/exec-invoke.c#L4477).

## Failure history and preserved evidence

These failed runs are retained and are not reported as passing acceptance:

1. `identity-20260926T083357Z`: shadow-utils rejected a colon in GECOS. The root ledger
   retained its reserved UID and consumed operation; the comment now uses a space.
2. `identity-20260926T084005Z`: explicit systemd root identity dropped CAP_SETUID.
   Correcting that exposed Git's default `master` selection on bundle clone; the helper
   now explicitly clones `main`. A proposed diagnostic that bypassed the normal socket
   boundary was rejected by automatic approval review and was not executed. Diagnosis
   continued through read-only capability state and the normal protocol.
3. `identity-20260926T085236Z`: `mkdir(0700)` masked the inherited service ACL on the
   projects parent. The helper now explicitly grants only service read/traverse, and
   readiness checks actual access before activating the clone.
4. `identity-20260926T090607Z`: the workflow, 100 UID probes and Linus retirement passed,
   but the final harness compared SQLite null-prototype rows against HTTP objects.
   Normalizing JSON fixes only the assertion; this run retains exit code 1.

The first full passing run, `identity-20260926T085848Z`, used seven real accounts,
25.012 seconds of model-turn overlap, 88 isolation checks and Grace retirement. Final
acceptance strengthens this with 100 probes and integrated engineer retirement.
Failed validation accounts/data remain locked and private with UUID-ledger provenance;
they are retained for diagnosis rather than deleted or confused with production workers.

## Operational limits

One company per data directory and the fixed SquadStatus template remain the scope.
The trusted service still hosts Codex App Server and central authentication; Prompt 04
does not claim that every model/runtime process runs as the worker UID. Worker-owned
source and Git operations do, and product tests retain their separate sandbox.
Root administrators and the control plane are trusted. Application records/root receipts
are durable audit evidence, not cryptographic protection against those trusted actors.

General repositories, package/service administration, remote/mobile APIs, Computer Use,
external identities, multi-company persistence and federation remain deferred. No public
UI port, broad sudo, worker auth copy, shared writable source or ordinary home deletion
was introduced. Production Atlas stays unprovisioned until explicitly requested.

Back up company state, central auth, root receipts/ledgers, worker homes and the OS
account mapping together. Preserve numeric UID/GID ownership on restoration; do not
invent new identities or replay consumed grants with new operation IDs.

## Final real workflow evidence

The complete gate passed at feature revision `9af2db810b71ec9ca1097767a61ae0aa2edb43d8`,
in `/var/lib/botsquad/validation/identity-20260926T091321Z`, with exit code 0.
The source digest (src/public/scripts plus package/build configuration) is
`cceed78d0886b29e6c6d92f73e270bf029f227b3324c00fdccdaef4c2c09bc73`.
Privileged code and installed unit hashes are recorded separately in host evidence.

[Machine-readable identity evidence](prompt-04-linux-identity-evidence.json) includes
full worker/principal/thread/task/execution IDs, immutable profiles, all approvals and
receipts, actual source ownership, independent review and integration, denial probes
and retirement. Git bundles are omitted; exact parameter hashes remain. No credentials
or HTTP session tokens are included.

The pre-retirement workflow used seven workers, fourteen tasks and 26 executions;
retirement added one Nix task and two turns for **15 tasks / 28 executions** total.
All executed through Codex 0.157.0 / codex-app-server with recorded profile provenance.
Nix used gpt-6-sol / low / normal / human-locked; Grace used medium / high; all other
workers used low reasoning. Atlas was critical, Turing high, engineers normal.

| Worker | Worker ID | Unix username | UID/GID | Final state |
| --- | --- | --- | --- | --- |
| Nix | `worker_cb3f4a60-31e2-4724-b40e-ec588011e45f` | `bsw-15af83e6cad70e05cceab668` | 20030/20030 | ready |
| Linus | `worker_c4d75bc7-3571-46c3-9757-d53191f062d7` | `bsw-06682a1c9b832147074e9be7` | 20034/20034 | disabled |
| Ada | `worker_95e46041-c206-4d9c-bd51-4734f2c9ce4a` | `bsw-6682838197ced2b6dad94e50` | 20035/20035 | ready |
| Grace | `worker_b7a29d72-c7f6-44e6-bb47-230fcf03125b` | `bsw-fcac3ebdd842f5b63ce5215a` | 20036/20036 | ready |

Homes are `/var/lib/botsquad-workers/<unix_username>`. Linus and Ada each received
an independent `projects/<allocation_id>` clone in their home; their committed source
files were owned by UID/GID 20034 and 20035 respectively. Linus's clone is now revoked
and its preserved home root-owned 0700. Ada remains ready. Nix and Grace need no writable
engineering clone; Grace uses the trusted read-only exact-commit review packet.

Nix principal: `principal_223be4bf-3666-48be-bb81-a733bd602d2d`. Its first real infrastructure task was
`task_b2227c46-f687-45df-9244-d1cc047beb45`, execution `execution_3c49d0aa-cf7a-4f63-b8d3-60da12a8ce39`,
thread `01a0dcfd-a9b6-76c0-afd0-7abddee2427d`. The runtime workspace remains separate from
its Linux home.

An actual approval lifecycle created Atlas's identity: Nix requested
`operation_86045832-8945-4057-b0f7-c279219e4756` at 2026-09-26T09:13:30.383Z, approval
`approval_4a4ce7a8-dc9d-4778-9265-52e6ed92f8b7`, target `worker_e5846932-b848-4aa6-b421-fe65d2c94e74`.
The trusted human HTTP decision was recorded at 2026-09-26T09:13:32.946Z; consumption
at 2026-09-26T09:13:32.947Z preceded the host mutation. The completed receipt returned
UID/GID 20031 and `ready`. No second approval or duplicated account was created.

The operator companion passed **100 actual UID checks: 98 denials and two allowed
own-clone writes**. Each of Linus, Ada, Nix and Grace was denied read/write access to
sibling-home canaries, private company/central-auth canaries, root receipts, private
configuration and canonical product main; denied source/provisioner/system-file write
opens, socket connection, setuid(0) and passwordless sudo. Own-clone scratch writes
had the expected UID; sibling-clone writes failed. Probes opened harmless canaries or
files without reading/printing their content or modifying protected files.

Linus/Ada execution overlap was **21.622 seconds**; actual model-turn overlap was
**20.285 seconds**. Submitted commits were
`07c6d6ee2d400072391a4c535471ce83dff931f5` and
`c932cc9a86c3658caa059b0e581d0fb9daad0f75`. Grace independently approved both in
`review_81a93671-1055-4c56-82d2-f92de265dc4e`; trusted integration advanced product main
to `cd34e129ca1f2b6f6523c8963c7ad336682639ce` only after **8/8 full tests** and exact
CLI output passed. See [Maya's specification](artifacts/prompt-04-maya-specification.md)
and [Grace's review](artifacts/prompt-04-grace-review.json).

After integration, Nix requested Linus retirement under operation
`operation_cd1d190e-8365-473b-8c10-cf8fec12d41d`, approval
`approval_4dc353fb-e5f5-4d71-b57b-2b1a6207a6fe`. The account was locked/expired/nologin,
UID 20034's recorded harmless sleep PID 75087 received SIGKILL, project access was
revoked, and the preserved root-owned home denied that UID. Existing submissions,
review and execution history survived restart unchanged. A new engineering assignment
was rejected before persistence with `Worker is disabled`.

## Recovery and research regression

The identity harness restarted the app with a pending Nix bootstrap approval and
verified no host action before the human decision. Further process restarts preserved
completed workflow records, consumed approvals, receipts, project state, execution
history and retired dispatch state without duplicate work.

`recovery-20260926T091801Z` passed a real fault after Linux account creation but before
the response reached the control plane: consumed intent stayed running, app restart
reconciled the exact receipt and UID 20037, and a changed operation payload was rejected.
Restarting the actual root service changed PID 67968 to 75819; an exact request through
the normal service-account socket returned the same receipt while every root ledger
and receipt hash stayed unchanged. Actual service-UID write opens against root code,
units and the BotSquad compiled entrypoint were denied.

`prompt01-20260926T091853Z` passed real Atlas → Scout → Atlas research, process
restart, same-binding resume and acknowledged turn interruption under the updated
production restrictions. See [research evidence](prompt-04-research-evidence.json).
Research-only legacy workers remain honestly unprovisioned; this does not claim their
Codex processes run under worker UIDs.

## Resource measurements

Host: Ubuntu 24.04.5 x86_64, kernel 6.8.0-142-generic, 1 vCPU, 2,015,216 KiB RAM,
approximately 48 GiB root disk and 2 GiB configured swap. Identity acceptance sampled
every two seconds for 131 samples.

| Window | Minimum host available MiB | Max sampled validation cgroup MiB | Max service-user RSS sum MiB | Mean / max host CPU busy |
| --- | ---: | ---: | ---: | ---: |
| Whole identity/retirement run | 1425.16 | 205.86 | 840.95 | 28.25% / 100% |
| During Nix executions | 1430.05 | 201.44 | 840.95 | 23.14% / 83% |
| During engineering executions | 1425.16 | 205.86 | 769.01 | 29.75% / 55.56% |

The cgroup kernel peak was **219.36 MiB**. Swap stayed at the pre-existing **268 KiB**
throughout, with no increase. One-minute load peaked at **0.60**. Two engineers had
at most two Codex processes and 288.14 MiB summed Codex RSS. Across the whole run,
startup/discovery/teardown yielded up to three sampled Codex processes; recorded active
executions never exceeded two. RSS sums double-count shared pages; phase windows may
overlap and cgroup peak is cumulative. These are whole service-user/window measurements,
not isolated per-model memory or a capacity guarantee.

The 1-vCPU/2-GB host remains a validated light-duty floor for the bounded workload.
Broader repositories, long contexts and sustained builds require fresh capacity evidence.

Before reboot, idle Node RSS was **65.42 MiB** and service cgroup memory **19.96 MiB**.
The root provisioner had one task, **18.68 MiB RSS** and approximately **8.9 MiB cgroup**
usage. After reboot/startup discovery, Node RSS was **63.70 MiB**, service cgroup memory
**180.17 MiB** including charged cache, and provisioner RSS **18.64 MiB** with
**8.87 MiB cgroup** usage. The provisioner has a 192-MiB hard cgroup cap; these are
observed idle/startup overheads, not a separately sampled peak of all UID helper actions.
Swap returned with zero used. The real-workload figures above include actual host
pressure from the provisioner but do not attribute every shared page to one process.

## Bounded reboot, production preservation and delivery

The host was idle with paused production, no active validation/Codex work and no package
transaction. The running unattended-upgrade process was verified to be its idle shutdown
monitor; both apt daily transaction units were inactive. A root-private, numeric-owner
ACL/xattr backup at
`/var/backups/botsquad/prompt04-20260926T082822Z/pre-reboot.tar.gz`
(6,342,735 bytes, root:root 0600) captured company state/auth, worker homes, provisioner
ledgers/receipts, service configuration and account mapping. The earlier protected
`headquarters.tar.gz` backup preserves the original Prompt 03 production baseline.

The authorized reboot at 09:23 UTC changed the verified boot ID on kernel
6.8.0-142-generic; raw boot IDs and host/account inventories remain private.
`botsquad.service` and the provisioner socket auto-started enabled; an ordinary health
request activated the root service. The socket parent remained root:botsquad 0750,
runtime returned ready and the UI remained only 127.0.0.1:4310. Root service is static
and activated by its enabled socket. Both actual processes retain NoNewPrivileges.

Every account/UID/GID/lock/home-owner record, root ledger/receipt hash, closed identity
validation database hash and privileged code/unit hash matched before and after reboot.
Disabled Linus remained disabled. Exact post-boot replay returned the same receipt and
UID 20037. The validation companies are retained datasets, not auto-started production
services; their app-restart behavior was separately validated above.

Production remains its original Atlas company, paused, with one completed task and
execution, three messages and one unchanged runtime binding. Tasks, executions, messages,
artifacts, repositories, allocations, submissions, reviews, integrations, wake events,
principals and channels match the protected pre-deployment snapshot exactly. Atlas's
AI profile, human lock, worker/principal IDs and runtime workspace are unchanged.
Only the intended CEO delegatable capability ceiling migrated; its OS binding remains
honestly unprovisioned. Central Codex authentication was verified without reading secrets.

[Sanitized host, resource and recovery evidence](prompt-04-host-recovery-evidence.json)
records these comparisons. Full root inventories and failure-account mappings remain
in private operator evidence, separate from the repository. Only the bounded acceptance
company bindings requested by the prompt are published. No retained evidence was deleted.

Current main was fetched and inspected again after acceptance; it remained
`a81dc576473196a3b1634fb4fbb49a0cd07d32d3` with no competing worktree/writer.
The accepted feature history is integrated normally without force or unrelated changes.
Documentation-only delivery commits preserve the accepted source digest and root code
hashes. The final handoff records the matching local main, origin/main and deployed SHA
after the required final bootstrap/hardened test gate.

Automatic approval review initially rejected pushing the larger host evidence inventory.
The publication was reduced to requested acceptance facts, bounded validation identities,
service state, measured resources and preservation results. Raw account/receipt inventories,
process/listener listings and boot identifiers remain private.
