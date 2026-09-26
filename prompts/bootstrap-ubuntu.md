# Bootstrap a BotSquad Ubuntu headquarters

SSH_TARGET=botsquad

Use this alias through the operator's existing SSH configuration. Never ask for or
copy an SSH private key. The operator authorizes installing BotSquad on this dedicated
Ubuntu host, including normal system updates, required packages, a non-root service
account, persistent swap if needed, systemd and loopback-only service access.

Read AGENTS.md and docs/bootstrap/UBUNTU_BOOTSTRAP.md. Give an ETA first. Inspect the
local Git state and target before mutation; report OS, architecture, resources, swap,
packages and conflicts. Stop before mutation if the target is unrelated or unsupported.

Fetch origin and select an exact reviewed commit from current main. Use the checked-in
installer, never a collection of improvised system commands:

```sh
./scripts/bootstrap-ubuntu.sh "$SSH_TARGET" "$(git rev-parse origin/main)" --preflight-only
./scripts/bootstrap-ubuntu.sh "$SSH_TARGET" "$(git rev-parse origin/main)"
```

The SSH account must be root or have passwordless sudo. Preserve unrelated data and
SSH/firewall policy. Do not expose port 4310. Do not run BotSquad or workers as root.
Keep company data in /var/lib/botsquad and source in /opt/botsquad.

Finish noninteractive setup and confinement checks before requesting human login.
If Codex authentication is absent, have the operator run the service-account device
login command in the operator guide. Do not copy workstation authentication files,
print tokens or save device codes to evidence. Resume validation once login completes.

Verify health, actual UID, loopback socket, discovered models/reasoning, and one
bounded real workflow. Run deterministic tests as botsquad and inspect Linux security
probes. Record exact commit/runtime versions and sanitized evidence. Preserve state
across a service restart and second bootstrap. A reboot may be performed after package
operations finish, state is durable, service is enabled and SSH recovery is expected;
wait with a bounded retry loop and verify automatic startup afterward.

Print the SSH tunnel command and URL. State any unexercised gate accurately. Nix,
per-worker Unix accounts, approval grants, public hosting and Computer Use are deferred.
