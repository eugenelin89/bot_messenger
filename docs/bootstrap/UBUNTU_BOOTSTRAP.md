# Ubuntu HQ bootstrap

Prompt 03 implementation; real acceptance results are recorded in
[the validation record](../validation/prompt-03-ubuntu.md). Ubuntu HQ is the primary
self-hosted deployment. The workstation provides SSH, administration and development.

## Starting contract

Dedicated Ubuntu 24.04 x86_64, working SSH alias, Internet access for Ubuntu packages,
GitHub, Node and npm, and root or passwordless sudo. The current 1-vCPU/2-GB host is
an acceptance candidate until real resource/recovery evidence is complete. No provider
API or hard-coded address is used. Existing conflicting paths/accounts fail clearly.

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
Logical worker authority still comes from narrow tools, not the shared service UID.

## One-time Codex login

Use the official device authorization flow under the intended identity:

```sh
ssh -t botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser step privately. Never paste the code/tokens into repository
evidence. Device login may need to be enabled in ChatGPT security/workspace settings.
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
Back up the full `/var/lib/botsquad` while stopped; it includes sensitive Codex state,
so use operator-controlled protected backup storage. Do not commit backups.

## Current boundaries

Ubuntu 24.04 x86_64 and Node 24 are the supported Linux contract. macOS Seatbelt remains
available for development regression. Other platforms fail closed for engineering.
Linux product tests use bubblewrap mount/user/PID/network namespaces, seccomp and Node
permissions. Only the read-only product and runtime libraries are visible; writes,
network sockets, process clones, host signals, namespace escape and protected Git
metadata are denied. Tests remain bounded to 10 seconds and captured output.

Nix, separate worker Unix identities/clones, trusted privileged provisioning, human
approval grants, general remote fleets, financial authority, customer deployment and
Computer Use are future milestones.
