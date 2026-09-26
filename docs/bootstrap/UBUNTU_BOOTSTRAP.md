# Ubuntu HQ bootstrap

Prompt 03 established and validated the Ubuntu HQ. Prompt 04 extended that deployment
with Nix, exact-scope trusted approvals, a narrow root provisioner, private per-worker
Unix identities and independent engineering clones. See the
[Prompt 04 validation record](../validation/prompt-04-linux-identity.md) for the current
acceptance baseline and the [Prompt 03 record](../validation/prompt-03-ubuntu.md) for the
historical Ubuntu baseline. Ubuntu HQ remains the primary self-hosted deployment; the
workstation provides SSH, administration and development.

## Operator quick links

- [Current State](../operations/CURRENT_STATE.md)
- [Access and Operations](../operations/ACCESS_AND_OPERATIONS.md)
- [Prepare a New Ubuntu Host](SETUP_UBUNTU_HOST.md)
- [Bootstrap Prompt](../../prompts/bootstrap-ubuntu.md)

## Starting contract

Dedicated Ubuntu 24.04 x86_64, working SSH alias, Internet access for Ubuntu packages,
GitHub, Node and npm, and root or passwordless sudo. A 1-vCPU/2-GB/50-GB host with
2 GiB swap has passed both the bounded Prompt 03 workload and the Prompt 04
worker-identity/engineering acceptance at two active executions; see the validation
records before applying that sizing to larger work. No provider API
or hard-coded address is used. Existing conflicting paths/accounts fail clearly.

Run [the bootstrap prompt](../../prompts/bootstrap-ubuntu.md), or inspect and invoke:

```sh
git fetch origin
./scripts/bootstrap-ubuntu.sh botsquad "$(git rev-parse origin/main)" --preflight-only
./scripts/bootstrap-ubuntu.sh botsquad "$(git rev-parse origin/main)"
```

An exact pushed feature SHA may be used for milestone acceptance. Production handoff
requires the integrated main SHA. The installer refuses dirty/unrelated checkouts and
updates only to a descendant commit. It never resets or deletes retained company data.

## Installed layout and policy

- `/opt/botsquad`: root-owned checkout/build, readable but not writable by the service.
- `/opt/botsquad-runtime/node`: pinned official Node 24.21.0 (SHA-256 verified archive).
- `/var/lib/botsquad`: botsquad-owned mode 0700 company state and artifacts.
- `/var/lib/botsquad/.codex`: service-account runtime auth/history, mode 0700.
- `/etc/botsquad/environment`: optional operator overrides, root mode 0600.
- `botsquad.service`: non-root, boot-enabled, bounded restarts and journal logs.
- `/opt/botsquad-provisioner`: root-owned fixed Python protocol and client.
- `/var/lib/botsquad-provisioner`: root-private identity/project ledger and receipts.
- `/var/lib/botsquad-workers`: private UID-owned homes, with trusted service read ACLs.
- `botsquad-provisioner.socket`: root:botsquad 0660 Unix socket, enabled at boot.
- `botsquad-provisioner.service`: socket-activated root service with fixed operation scope.
- `/swapfile-botsquad`: 2 GiB mode 0600 when existing useful swap is absent.

APT update/upgrade installs available system/security updates without removing packages
or changing release. Existing configuration files are retained. Phased/held packages
are reported; bootstrap never disables security globally. It grants user-namespace admission to a root-owned, service-group-only copy of
bubblewrap through a dedicated AppArmor profile and requires a successful non-root
namespace probe. The global Ubuntu unprivileged-userns restriction remains enabled.
A host that cannot provide confinement is unsupported; there is no fallback.

The service uses a read-only system filesystem, private temporary/device mounts,
no new privileges, no ambient capabilities and a 256-task bound. User namespaces
remain enabled for bubblewrap. V8 JIT executable memory and Codex HTTPS are required,
so MemoryDenyWriteExecute and blanket service-network denial are intentionally absent.
Logical authority comes from narrow tools. Production Linux worker-owned source and
Git mutations run under the bound private UID; central Codex and confined product
tests retain the trusted service identity. Worker accounts receive no Codex credentials.

## One-time Codex login

Use the official device authorization flow under the intended identity:

```sh
ssh -t botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser step privately. Never paste the code/tokens into repository
evidence. If ChatGPT rejects device-code login, enable the available device-code authentication setting in ChatGPT Security settings, or have the relevant workspace administrator enable device-code authentication. Device codes can be phished; never share one.
If device auth is unavailable, use the official browser callback flow with an SSH
forward of port 1455 under the same service identity. Workstation auth files are not
part of the installer. [Official authentication documentation](https://learn.chatgpt.com/docs/auth).

Then validate as botsquad:

```sh
ssh botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin CODEX_BIN=/opt/botsquad/node_modules/.bin/codex sh -c "cd /opt/botsquad && node dist/scripts/codex-preflight.js"'
```

The UI worker inspector discovers model/reasoning choices from that runtime. A global
`BOT_MODEL` in `/etc/botsquad/environment` is only an optional default. Explicit worker
choices are validated again at execution time and never silently substituted.

## Private UI and operations

```sh
ssh -N -L 4310:127.0.0.1:4310 botsquad
```

Open <http://127.0.0.1:4310>. Port 4310 is never opened publicly by bootstrap.
If your workstation already uses 4310, stop that local development instance or use
another local port and a proxy preserving the service's expected Host header.

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'journalctl -u botsquad --since "10 minutes ago" --no-pager'
ssh botsquad 'curl -fsS http://127.0.0.1:4310/api/health; ss -ltnp'
ssh botsquad 'systemctl restart botsquad'
```

Health contains only liveness, database/dispatcher readiness, cached runtime status,
version and commit. Runtime status becomes ready after discovery; discovery sends no
model task. A missing login leaves the UI usable with degraded runtime status.

Rerun the installer with the exact desired descendant commit to update. It preserves
operator environment overrides, credentials, company state and the single swap entry.
Updates stop the service before changing source/dependencies and restart it only after
the hardened validation gate passes. Schedule updates while idle: interrupted work is
retained for inspection, never automatically replayed. A failed update remains visibly
stopped until repaired; automatic rollback across database migrations is not attempted.
Back up the full `/var/lib/botsquad` while stopped; it includes sensitive Codex state,
so use operator-controlled protected backup storage. Do not commit backups.

## Current boundaries

Ubuntu 24.04 x86_64 and Node 24 are the supported Linux contract. macOS Seatbelt remains
available for development regression. Other platforms fail closed for engineering.
Linux product tests use bubblewrap mount/user/PID/network namespaces, seccomp and Node
permissions. Only the read-only product and runtime libraries are visible; writes,
network sockets, process clones, host signals, namespace escape and protected Git
metadata are denied. Tests remain bounded to 10 seconds and captured output.

Prompt 04 adds Nix, worker Unix identities/clones and exact-scope infrastructure
approvals. General remote fleets, financial authority, customer deployment and
Computer Use remain future milestones. Development identities are simulated and
make no Linux isolation claim.

## Acceptance under the production service restrictions

After authentication, run the checked-in host validation launcher as root. It creates
an ephemeral systemd unit using the installed service's User, filesystem, capability
and namespace restrictions; the production company continues to use its own data.
Each run writes a fresh private directory under `/var/lib/botsquad/validation`.

```sh
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh deterministic'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh prompt01'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh engineering'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh recovery --wait'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh identity'
```

Run these sequentially. Research, engineering and identity invoke real Codex work and use the discovered
`gpt-6-sol` profile only if advertised (otherwise they fail visibly). Inspect the
printed unit and evidence directory for completion: `exit-code` must be 0 and real
runs must produce `evidence.json` with PASS. `console.log` retains failure context;
`resources.jsonl` samples host memory/swap/load and service-user process RSS every
two seconds without capturing process arguments or environment. Summed RSS includes
shared pages more than once; process CPU percentages are lifetime averages, not
instantaneous utilization. Every unit has a 30-minute upper bound and no retry loop.
Never treat unit startup alone as a passing validation.

`engineering` explicitly uses the simulated development identity backend to retain
the Prompt 02/03 worktree regression. It is not Linux UID acceptance. `identity`
requires the real socket backend, creates fresh accounts through Nix and exact human
HTTP decisions, and waits before retirement for its operator companion. Using the
exact report directory printed by the launcher, run in a second SSH invocation:

```sh
ssh botsquad 'python3 /opt/botsquad/scripts/validate-identity-operator.py /var/lib/botsquad/validation/identity-<printed-timestamp>'
```

The companion runs harmless per-UID canaries and starts a bounded sleep under the
integrated engineer's UID, then lets the application retire it and verifies SIGKILL/history
preservation. It never edits approvals or SQLite. `recovery` uses an acceptance-only
transport wrapper to lose one real completed host response, then proves consumed
intent reconciles on restart. The production code has no fault-injection switch.
