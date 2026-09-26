# Prompt 03 Ubuntu validation

**Status: In progress — service-account Codex authorization pending; not accepted for main.**

Starting origin/main: `2239be6304495d583053f4ffabd8e900d4fb63f6`.
Feature branch: `feature/prompt-03-ubuntu-hq`. SSH alias: `botsquad`.
All work is committed/deployed from pushed feature history, never a random server copy.

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
The health endpoint reports database/dispatcher ready and runtime degraded until
service-account login. That is an honest partial-readiness state, not real acceptance.

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
  the Ubuntu account-specific catalog remains unverified until sign-in.
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

## Resource interpretation

An early idle service cgroup sample was about 25 MiB and Node RSS about 65 MiB.
After reboot/startup discovery, cgroup memory was about 169 MiB (including charged
file cache), Node RSS about 63 MiB and host available memory about 1.6 GiB. Swap used 0–12 KiB
in deterministic checks. These are preliminary idle/test observations only. The
1-vCPU/2-GB/50-GB host remains an **acceptance candidate**, not a proven light-duty
minimum until real concurrent model workloads and recovery gates pass.

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
validated bubblewrap/seccomp/empty-proc confinement, human profile controls and pending
real acceptance from future intentions. Optional manager profile requests remain
deferred; hardware sizing remains a candidate until real concurrent workload proof.
The future documents explicitly state the current one-company-per-data-directory
limit. Multi-company persistence, CompanyConnection, federation, Telegram, external
identities, Nix, worker Unix accounts and Computer Use remain unimplemented future
scope. Provider references were checked against official Telegram and OpenAI sources.

Historical Prompt 01/02 execution plans and validation records are unchanged.
Decision 001 retains its historical rationale and appended Decision 009 clarification.
PR #1 needs no separate merge; it can be closed as incorporated into the feature
branch, preferably when Prompt 03's remaining acceptance gates permit main integration.

## Remaining acceptance gates

1. Human performs official Codex device authorization under the botsquad service account.
2. Verify Ubuntu runtime catalog and run bounded real Prompt 01/02 workflows under the
   installed systemd restrictions, including Linus/Ada overlap, exact-commit Grace review,
   trusted integration, friendly names and immutable effective profiles.
3. Measure real worker resources and prove completed real Ubuntu work is not replayed.
   Non-model service reboot and same-SHA bootstrap preservation already pass.
4. Final security/diff/document review; integrate into current main only after acceptance.
5. Deploy exact integrated main SHA and verify remote/local/main equality and health.

Do not interpret this provisional record as completed acceptance.
