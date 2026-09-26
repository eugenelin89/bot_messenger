# Access and Operate a BotSquad Ubuntu HQ

**Status:** Current operator guide, including Prompt 04 infrastructure
**Supported host:** Ubuntu 24.04 x86_64

This guide assumes BotSquad has already been bootstrapped on a server and that your
workstation has an SSH alias for it.

Examples below use:

```text
botsquad
```

Replace that with your own SSH alias.

For creating a new host, see [Set Up a Minimal Ubuntu Host](../bootstrap/SETUP_UBUNTU_HOST.md)
and [Ubuntu HQ Bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md).

## Open the BotSquad UI

BotSquad listens only on the server loopback interface:

```text
127.0.0.1:4310
```

From your workstation, start an SSH tunnel:

```sh
ssh -N -L 4310:127.0.0.1:4310 botsquad
```

Leave that terminal open.

Then open:

```text
http://127.0.0.1:4310
```

The UI is running on the Ubuntu server even though the browser URL looks local.

Do not open TCP 4310 to the public Internet.

## SSH into the headquarters

For ordinary administration:

```sh
ssh botsquad
```

The bootstrap SSH user may be root or a sudo-capable administrator. The BotSquad
application itself runs separately as the non-root `botsquad` system account.

## Quick health check

```sh
ssh botsquad 'curl -fsS http://127.0.0.1:4310/api/health'
```

The health endpoint reports only bounded operational status such as:

- application liveness;
- database readiness;
- dispatcher readiness;
- cached runtime status;
- application version/deployed commit.

It does not expose company messages, credentials, session tokens, or thread transcripts.

## Service status

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'systemctl is-active botsquad'
ssh botsquad 'systemctl is-enabled botsquad'
```

Expected normal state:

```text
active
enabled
```

The live service should run as the `botsquad` user, not root.

## Verify private listener

```sh
ssh botsquad 'ss -ltnp | grep 4310 || true'
```

Expected binding:

```text
127.0.0.1:4310
```

A public `0.0.0.0:4310` listener is not the intended Prompt 03 configuration.

## View recent logs

```sh
ssh botsquad 'journalctl -u botsquad --since "15 minutes ago" --no-pager'
```

Follow logs live:

```sh
ssh -t botsquad 'journalctl -fu botsquad'
```

Press `Ctrl+C` to stop following logs.

Do not paste authentication tokens or device codes into bug reports.

## Restart BotSquad

Use a normal systemd restart:

```sh
ssh botsquad 'systemctl restart botsquad'
```

Then verify:

```sh
ssh botsquad 'systemctl is-active botsquad && curl -fsS http://127.0.0.1:4310/api/health'
```

Completed work and company state are durable. BotSquad does not intentionally replay
completed executions after restart.

Interrupted or ambiguous work is retained for inspection rather than blindly replayed.

## Check Codex runtime/login

Run the checked-in preflight under the actual service identity:

```sh
ssh botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin CODEX_BIN=/opt/botsquad/node_modules/.bin/codex sh -c "cd /opt/botsquad && node dist/scripts/codex-preflight.js"'
```

If runtime authentication is missing, the BotSquad UI can remain available while the
runtime reports degraded/not ready.

## Re-authenticate Codex

Use device authorization under the service account:

```sh
ssh -t botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser authorization privately.

If ChatGPT rejects device-code login, enable the available device-code authentication
setting in ChatGPT Security settings, or have the relevant workspace administrator
enable device-code authentication. Never share a device code; it can be phished.

OpenAI documents device-code authentication for non-interactive Codex CLI environments:
<https://developers.openai.com/docs/enterprise/access-tokens>

After login, rerun the preflight and health check.

## Pause and resume work

The UI separates:

- **Pause new dispatch** — prevents new queued work from starting;
- **Interrupt** — stops a currently running supported Codex turn.

These are not equivalent.

Pausing does not undo actions that already happened.

The Prompt 03 acceptance HQ was intentionally handed off with production dispatch
paused. That is an operator handoff choice, not a requirement for every fresh install.

Before resuming an existing HQ, inspect queued/blocked/awaiting-approval work in the UI.

## Worker model/reasoning/priority

Open a worker inspector in the UI to configure:

- model;
- reasoning effort;
- execution priority;
- human lock.

Choices are discovered from the signed-in Codex runtime/account.

Changes apply to future executions, not already-running work.

Execution history records the actual effective settings that ran.

## Update BotSquad to a newer main commit

Run updates from a trusted local BotSquad clone.

First inspect/fetch:

```sh
git fetch origin
git status --short --branch
git rev-parse origin/main
```

Then bootstrap/update the desired pushed commit:

```sh
./scripts/bootstrap-ubuntu.sh botsquad "$(git rev-parse origin/main)"
```

The installer:

- preserves `/var/lib/botsquad`;
- preserves Codex service-account auth;
- preserves operator environment overrides;
- stops the service before changing source/build;
- runs the hardened validation gate;
- restarts only after validation succeeds;
- refuses dirty/unrelated deployment state;
- does not force-reset retained company data.

If the update fails after the service has been stopped, the failure remains visible
rather than automatically running a partially updated build.

Database migrations do not currently have an automatic rollback mechanism.

## Initialize and operate worker infrastructure

Open **Infrastructure → Initialize Nix**. This creates a logical DevOps worker and
one pending bootstrap approval. In **Approvals**, inspect the worker, requester,
task/execution, exact parameters, preconditions and expiry, then approve or deny.
An approval grants only that operation once. Bot messages and artifacts never approve.

Once Nix is ready, **Ask Nix to provision** creates a real infrastructure task for
existing unprovisioned workers. New workers automatically receive such a task on
production Linux. Engineering waits for identity and clone grants; the UI exposes
the waiting reason without model polling. Existing companies are not auto-provisioned
by migration. Codex credentials and original runtime workspaces stay under botsquad.

Use **Ask Nix to retire** only after outstanding and unintegrated work is resolved.
Approval disables logical dispatch, locks/expires the Unix account, terminates its
recorded UID processes and revokes home/project traversal. Homes and evidence remain.
Protected CEO/CTO/Nix retirement is outside this bounded workflow.

**Check provisioner health** reads the local protocol status. **Reconcile interrupted
operations** retries only already-consumed exact intent under the same operation ID.
Pending, expired and denied approvals cannot be used to create new authority. An
unavailable provisioner leaves recoverable intent and blocks dependent work; repair
the service and reconcile instead of editing SQLite or making replacement accounts.

```sh
ssh botsquad 'systemctl status botsquad-provisioner.socket botsquad-provisioner.service --no-pager'
ssh botsquad 'journalctl -u botsquad-provisioner --since "15 minutes ago" --no-pager'
```

The socket is enabled at boot; its service starts on demand. Do not add worker users
to the botsquad group or give them sudo, socket access or central credentials. Root
code is updated only by the operator bootstrap from an exact pushed revision.

## Back up the headquarters

The durable/sensitive directory is:

```text
/var/lib/botsquad
```

It contains company state, artifacts, runtime state, and service-account Codex data.

For a consistent backup, stop BotSquad first:

```sh
ssh botsquad 'systemctl stop botsquad'
```

Use your operator-controlled backup/snapshot mechanism to protect the full
`/var/lib/botsquad` tree. Prompt 04 also requires `/var/lib/botsquad-provisioner`,
`/var/lib/botsquad-workers`, `/etc/botsquad` and the host account/UID mapping. Preserve
ownership and ACLs. A consistent whole-host snapshot is suitable; copying SQLite
alone cannot restore worker accounts or root receipts. Keep the provisioner idle
while capturing these related state directories.

Then restart:

```sh
ssh botsquad 'systemctl start botsquad'
```

Treat the backup as sensitive credential-bearing material. Do not commit or upload it
to ordinary project storage.

Provider snapshots can also protect the whole VM, but the provider's snapshot/security
model is outside BotSquad.

## Host reboot

The service is enabled at boot.

A normal reboot should return BotSquad automatically:

```sh
ssh botsquad 'reboot'
```

After the machine returns:

```sh
ssh botsquad 'systemctl is-active botsquad && curl -fsS http://127.0.0.1:4310/api/health'
```

Prompt 03 acceptance validated reboot recovery on Ubuntu 24.04 x86_64.

## Troubleshooting

### SSH works but the browser does not

Check:

1. the tunnel terminal is still running;
2. `botsquad.service` is active;
3. the server listens on `127.0.0.1:4310`;
4. local port 4310 is not already occupied by a development instance.

Useful commands:

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'ss -ltnp | grep 4310 || true'
```

### Runtime says not logged in

Run the device login command above under the `botsquad` service identity, then run
the Codex preflight again.

### Engineering fails closed

Do not bypass the confinement gate.

Inspect:

```sh
ssh botsquad 'journalctl -u botsquad --since "30 minutes ago" --no-pager'
```

The supported Linux contract is Ubuntu 24.04 x86_64. Missing/failed confinement is
intentionally treated as unsupported rather than falling back to unrestricted tests.

### Need deeper acceptance checks

The installed host includes:

```sh
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh deterministic'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh prompt01'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh engineering'
```

Run the real-model scenarios only when you intentionally want to consume Codex usage.

## Related documentation

- [Current State](CURRENT_STATE.md)
- [Ubuntu HQ Bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md)
- [Set Up a Minimal Ubuntu Host](../bootstrap/SETUP_UBUNTU_HOST.md)
- [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [Prompt 03 Validation](../validation/prompt-03-ubuntu.md)
- [Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md)
