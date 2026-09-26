# Prompt 03 Ubuntu validation

**Status: Ubuntu feature acceptance PASS — real workflows, confinement and recovery validated.**

Starting origin/main: `2239be6304495d583053f4ffabd8e900d4fb63f6`.
Feature branch: `feature/prompt-03-ubuntu-hq`. SSH alias: `botsquad`.
Runtime acceptance was executed at `99e856d676ae497b76889b982c7ccd0422c2abfe`.
Subsequent acceptance documentation changes do not change the validated source digest
`00635a7d0bb94773c552dd6b1d5bb36c73d22dc617ff7530994373c881621cc5`.
All deployed work comes from pushed Git history; final main/deployed equality is checked
after integration and recorded in the final handoff.

[Consolidated machine-readable evidence](prompt-03-ubuntu-evidence.json) links the
research, engineering, service recovery and historical bootstrap/reboot records.

## Host and installation evidence

Read-only preflight confirmed Ubuntu 24.04.4, kernel 6.8.0-124-generic, x86_64,
1 vCPU, MemTotal 2,015,216 KiB (marketed 2 GB), approximately 48 GiB root disk with
46 GiB initially available, and no swap. Root bootstrap identity; no BotSquad
account/source/data/service conflicts. Dpkg health was clean; updates were pending.
Only SSH and loopback DNS sockets were listening. Existing firewall/SSH policy stayed
unchanged. No SSH keys or Codex credentials were copied or recorded.

Bootstrap installed 152 upgrades and six new dependency/kernel packages, pinned
Node 24.21.0 using the official archive SHA-256, locked Codex 0.157.0, and a single
persistent 2-GiB mode-0600 swap file. Ubuntu phasing retained libaudit-common/libaudit1;
no forced phase override, package removals or release upgrade occurred. Dpkg audit
remains empty. Kernel 6.8.0-142-generic was installed for the bounded reboot check.

The live service runs as UID 997/GID 987 (`botsquad` only, no sudo membership), with
root-owned `/opt/botsquad` and private botsquad-owned `/var/lib/botsquad`. It is enabled
at boot and listens solely on 127.0.0.1:4310. The SSH tunnel was tested in the browser.
Before human authorization, health correctly reported a degraded runtime. At 02:17 UTC
the service account was verified signed in using ChatGPT, without reading credentials.
Database, dispatcher and runtime now report ready. The actual service restart after
a real completed Atlas task preserved all records, profile and friendly thread binding.

## Deterministic and runtime evidence

- Baseline: 49 macOS tests; expanded suite: **60/60** on macOS and Ubuntu.
- Ubuntu tests include actual Git/worktree integration and actual mount/namespace,
  seccomp and Node-permission denial probes. Service-account execution alone was
  insufficient: the complete suite also runs under the production systemd restrictions.
- Hardened run `deterministic-20260926T013428Z` passed all 60 tests in 24.95 seconds.
  Strengthened symlink/proc/Git-mask probes also pass in `deterministic-20260926T013916Z`.
- Latest local complete suite passed 60/60 in 20.49 seconds. A focused actual macOS
  symlink/proc confinement probe passed after further strengthening the test.
- Static TypeScript, JavaScript syntax, shell syntax and whitespace checks pass.
- Local browser smoke verified discovered model/reasoning choices and persisted an
  explicit gpt-6-sol / low / high / human-locked profile via the UI with zero executions.
- Models/reasoning come from Codex model/list. Local actual 0.157.0 discovery succeeded;
  Ubuntu discovery also succeeds under the service restrictions with ChatGPT authentication.
- Real Mac CEO → Scout → CEO, same-binding resume after process restart and a real
  acknowledged interruption passed. See [sanitized evidence](prompt-03-macos-evidence.json).
  This is Mac regression evidence and is not counted as Ubuntu real-model acceptance.

Tests cover inherited/explicit settings, unsupported model/reasoning rejection, human
locks and forged bot authority, stable priority/FIFO, pause, atomic claims/global two-
execution capacity, capability bounds, immutable effective provenance, and honest legacy
migration. Existing worker IDs/bindings/history are preserved.

## Failures found and resolved

1. The initial Linux probe could not create the required namespace because Ubuntu's
   global AppArmor userns restriction was enabled and the package shipped no matching
   admission profile. The installer now installs a root-owned, group-only bwrap copy
   and a path-specific userns admission profile. The global restriction remains 1;
   bwrap is not setuid and grants no sudo. Namespaces/seccomp supply actual isolation.
2. Linux rejected `rmSync` on an empty temporary directory. The filter is unlinked
   after opening and the empty directory is now removed with `rmdirSync`.
3. Under the full systemd policy, bubblewrap could not mount procfs beneath protected
   proc submounts. The runner now uses an empty `/proc`, retains PID isolation, and
   keeps all systemd kernel protections. The next hardened suite passed 60/60.
4. A new Git-mask probe incorrectly required reading the replacement null device;
   PrivateDevices correctly returned EACCES. The assertion now verifies masked device
   identity and rejects writes, without requiring a device read. Original failed logs
   remain in the host validation directory. No product security control was weakened.
5. An initial Mac command used a global 0.133.0 CLI and failed before model work; the
   successful run explicitly used the project's 0.157.0 binary. A later deterministic
   invocation lacked sandbox permission for loopback test servers; the authorized run
   passed. Neither environment failure was presented as a passing test.

Bootstrap now gates service startup on the same systemd-restricted deterministic
suite using `scripts/validate-ubuntu-host.sh deterministic --wait`. It returns failure
and preserves evidence when the suite fails. Existing company state remains intact.

## Security review

Trusted human profile updates use Host/Origin/session-token checks and accept no
payload-supplied actor. Bot tools expose no profile mutation, including on unlocked
profiles; optional manager requests remain deferred. Runtime discovery does not run
a model. Explicit model mismatches fail before turns rather than silently substituting.
Recorded provenance cannot be rewritten by later profile updates or normal SQL updates.
Friendly names do not replace UUID, workspace and persisted thread identity checks.

The Linux runner mounts only its read-only product, trusted Node and required runtime
libraries. It masks Git metadata, leaves `/proc` empty, drops capabilities, uses an
empty environment and isolates PID/network/mount/user namespaces. Actual tests reject
host/sibling/source reads, symlink escapes, writes, child processes, signals and network;
trusted engineering tools reject traversal, ownership and protected Git paths. No
fallback to ordinary execution exists. The service itself retains HTTPS/JIT/namespaces
required for Codex and Node; these are deliberate exceptions, not arbitrary worker tools.

The shared service UID remains a documented limitation against arbitrary malicious
processes with that UID. Per-worker Unix accounts, Nix, privileged provisioning,
broad approval grants, Computer Use and public UI access remain deferred.

## Real Ubuntu workflows and profiles

Both runs used fresh validation directories, the real botsquad account, Codex 0.157.0
and systemd units derived from the production unit without weakening its restrictions.

- **Research: PASS**, 02:18:08–02:19:12 UTC (64 seconds), two workers, five total
  executions including a persisted follow-up and acknowledged interruption. The main
  Atlas → Scout → Atlas workflow used three successful executions and produced a
  report. Restart preserved records and reused Atlas's exact thread/workspace/name.
  [Full research evidence](prompt-03-ubuntu-research-evidence.json).
- **Engineering: PASS**, 02:20:30–02:22:56 UTC (146.154 seconds), six persistent real
  workers, six tasks and ten completed executions. Linus/Ada execution overlap was
  26.440 seconds; actual model-turn overlap was **24.958 seconds**. Their real source,
  sibling and traversal probes were rejected. Grace independently read the exact-commit
  review packet and approved both submissions. Trusted integration passed **8/8 tests**
  and the expected CLI output before advancing product main to
  `68d72258e1d7cd7d15ef95e922a51e6441606daf`. Restart preserved all engineering records,
  completed executions and wake history without duplicate work.
  [Full engineering evidence](prompt-03-ubuntu-engineering-evidence.json),
  [Maya specification](artifacts/prompt-03-maya-specification.md),
  [Grace review](artifacts/prompt-03-grace-review.json).

The actual Ubuntu catalog advertises gpt-6-astra (default), gpt-6-sol, gpt-6-luna,
gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna and gpt-5.5. All expose low/medium/high/xhigh;
all except gpt-5.5 expose max; Astra/Sol/5.6-Sol/5.6-Terra expose ultra. Choices are
runtime/account observations, never a hard-coded UI promise. The bounded real runs
used gpt-6-sol: low for normal work and medium for Grace's independent review.
Friendly names are `BotSquad · <name> · <title>`; identity still uses exact durable
worker, thread and canonical workspace bindings.

Actual engineering profiles and one execution proving each configuration follow.
Every shown execution records `codex-cli 0.157.0`, `codex-app-server` and immutable
`recorded` provenance. Full worker/thread IDs are in the evidence JSON.

| Worker | Model | Reasoning | Priority / human lock | Execution |
| --- | --- | --- | --- | --- |
| Atlas | gpt-6-sol | low | critical / locked | `execution_62f6a76b-872a-4636-a825-f24d04411229` |
| Turing | gpt-6-sol | low | high / locked | `execution_83971a1f-31e4-42dd-a9f2-81ce3d0d3c18` |
| Linus | gpt-6-sol | low | normal / locked | `execution_1e7455f5-e545-4e12-bf96-bd59eb40c0f1` |
| Grace | gpt-6-sol | medium | high / locked | `execution_605f5892-97ca-42df-aaee-ebd44a089f2f` |

## Resource interpretation

An early idle service cgroup sample was about 25 MiB and Node RSS about 65 MiB.
After reboot/startup discovery, cgroup memory was about 169 MiB including charged
file cache, Node RSS about 63 MiB and host available memory about 1.6 GiB. Swap used
0–12 KiB during early deterministic checks; the final main bootstrap used 268 KiB.
The real workflows used no swap. After the real service restart, idle Node RSS
was about 65 MiB and cgroup memory about 19 MiB.

During real engineering, 75 samples covered 146 seconds: host available memory stayed
at or above **1,455.59 MiB**, validation cgroup peak was **187.12 MiB**, summed service-user
RSS peaked at **765.22 MiB**, and summed Codex RSS at **290.68 MiB** with two Codex
processes. Swap use was **zero**. Host CPU busy samples averaged **19.04%** and peaked
at **73.89%**; one-minute load peaked at **0.34**. The root disk was approximately
48 GiB, with about 5 GiB used including the 2-GiB swap file; exact `df` observations
are in the consolidated evidence.

This is the **smallest validated light-duty configuration** for the bounded SquadStatus
workload at the unchanged two-execution limit: 1 vCPU, 2 GB RAM, approximately 50 GB
nominal disk and 2 GiB configured swap. It does not establish capacity for large
repositories, heavy builds, longer contexts or sustained queues. Two vCPUs/4 GB RAM
remains a comfortable planning recommendation for more headroom.

The bounded acceptance launcher records host memory/swap/load, two-second CPU tick
deltas, cgroup current/peak memory and service-user per-process RSS without arguments
or environment. RSS sums double-count shared pages; per-process ps CPU is a lifetime
average. Model/App Server peaks and engineer overlap must come from real runs.

## Recovery and repeat-install evidence

At feature revision `1352d8f4068fc4855f44be5e7083a4be634ebfd7`, a bounded reboot
changed the boot ID and kernel from 6.8.0-124-generic to 6.8.0-142-generic. The enabled
service auto-started as UID 997/GID 987 with zero restarts and the same deployed SHA.
Database/dispatcher health and private loopback binding returned. Every company
snapshot collection remained equal; only the idle worker's `updated_at` was refreshed
by normal recovery. Atlas identity, the harmless message, human lock/default profile
and paused dispatch persisted. There were no tasks or executions in this production
state, so this does not prove real completed-work replay prevention on Ubuntu yet.

The persistent 2-GiB swap returned with zero used after reboot, exactly one fstab entry,
and AppArmor's global userns restriction remained enabled. Before reboot, no Codex
process or package operation was active. Raw non-secret snapshots are retained under
`.validation/prompt03-host`; see the [sanitized host evidence](prompt-03-host-evidence.json).

A second successful bootstrap of that exact same SHA after reboot passed all 60 tests
under the installed systemd restrictions on the new kernel. Snapshot comparison again
preserved every company collection (apart from normal worker updated_at refresh),
service identity, permissions, pause, source SHA and exactly one persistent swap entry.
No duplicate user or service was created. Explicit write probes confirm the service
can write `/var/lib/botsquad` but cannot write `/opt/botsquad`, its compiled main module
or `/etc`. The final installer also stops the service before replacing build files;
failed updates stay stopped and retain evidence rather than running a partial build.

## Actual production service recovery

After sign-in, a single bounded Atlas acknowledgement ran through `botsquad.service`
in the retained production company. It completed as
`execution_03a33a7a-61c3-413c-b6f4-a89a920add54` with gpt-6-sol / low / critical /
human-locked settings. The service was then restarted through systemd. Comparison
preserved every company collection apart from normal worker `updated_at`, including
the completed task/execution, messages and exact friendly thread binding; no replay
occurred and runtime readiness returned. Dispatch remains paused for human handoff.
[Service recovery evidence](prompt-03-service-recovery-evidence.json).

The earlier reboot ran before account authorization, and is not relabeled as a
post-model-work reboot. The real workflows above subsequently ran on the rebooted
6.8.0-142 kernel with the enabled production service and retained confinement policy.

## Concurrent documentation PR

[PR #1](https://github.com/eugenelin89/bot_messenger/pull/1), branch
`docs/ubuntu-hq-direction`, is **fully incorporated through latest reviewed revision
`9a219990e1bbbdce192a31e93c9cb1d589e1a552`** into the Prompt 03 feature branch.
Integration uses normal non-fast-forward merges: the original Ubuntu contribution
at `eed6353` entered through `4e8711e`, followed by a reviewed merge of the seven later
future-architecture commits after the user's expanded handoff. No force push or
separate merge to main occurred.

The sole merge conflict was the decision index: both branches assigned 010. Keep
[Decision 010](../decisions/decision_010_multi_company_federation.md) for the accepted
future company/federation direction, and renumber the implementation record to
[Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md), updating every link.
This preserves both decisions and all current Prompt 03 implementation work.

Intentional wording changes distinguish implemented Ubuntu paths, Codex 0.157.0,
validated bubblewrap/seccomp/empty-proc confinement, human profile controls and measured
real acceptance from future intentions. Optional manager profile requests remain
deferred. The original candidate sizing now becomes a validated light-duty floor
only because the real concurrent run supplied the evidence above.
The future documents explicitly state the current one-company-per-data-directory
limit. Multi-company persistence, CompanyConnection, federation, Telegram, external
identities, Nix, worker Unix accounts and Computer Use remain unimplemented future
scope. Provider references were checked against official Telegram and OpenAI sources.

Historical Prompt 01/02 execution plans and validation records are unchanged.
Decision 001 retains its historical rationale and appended Decision 009 clarification.
PR #1 needs no separate merge; it can be closed as incorporated into Prompt 03.
Main integration carries both documentation merge parents with the implementation.

## Delivery and limitations

Feature acceptance and first main delivery are complete. Main fast-forwarded from
`2239be6` to `cc581a3d0495772aaef1c4c2bce2aac5cbbf2a41`; no integration conflict, force
push or separate PR #1 merge occurred. The exact revision was deployed through the
installer, passed 60/60 hardened tests in 27.45 seconds, and was verified at 02:36 UTC.
Every production company collection survived except normal worker timestamp refresh;
the completed execution was not replayed, runtime returned ready, UID remained 997,
and the service remained active/enabled with only the loopback UI listener. Login,
permissions and the single swap entry survived the update.

This delivery-record-only follow-up does not change the validated source digest.
The final handoff records the exact final main/remote/deployed SHA equality after its
deployment. Local final-deployment snapshots are retained under `.validation/prompt03-host`.

Only Ubuntu 24.04 x86_64 is certified for this Linux runner. The observed hardware
floor applies to the bounded workload above. Strict priority can starve lower queues;
there is no aging policy. Shared service UID isolation from arbitrary same-UID
malicious processes remains future work. Invalid runtime profiles fail visibly and
interrupted work requires inspection; no broad approval grants or automatic repair
are claimed. Provider catalog and usage allowances can change.

The next implementation milestone is Nix/Linux worker identity: trusted human grants,
a narrow privileged provisioner, separate worker Unix accounts and controlled project
access. Computer Use follows a reliable infrastructure/authority boundary. Future
multi-company, federation and external-identity documentation remains unimplemented.
