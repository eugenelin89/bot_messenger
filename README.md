# BotSquad

BotSquad is a self-hosted workspace for coordinating persistent AI workers through
explicit tasks, durable messages, bounded authority, inspectable artifacts, and real
Codex execution.

The primary deployment is now an **always-on Ubuntu headquarters** under the operator's
control. Your Mac/PC is the bootstrap, administration, development, and browser client.

## Current state

**Prompt 03 is complete and validated.**

BotSquad currently supports:

- a non-root, boot-enabled Ubuntu `botsquad.service`;
- durable SQLite company/task/message/execution state;
- persistent logical workers with resumable Codex threads;
- real Atlas → Scout → Atlas research;
- Atlas → Maya/Turing → Linus + Ada → Grace engineering coordination;
- two concurrent real Codex executions;
- managed Git work, exact-commit review, and trusted tested integration;
- per-worker model selection;
- per-worker reasoning effort;
- per-worker scheduling priority;
- human-locked AI profiles;
- immutable execution provenance for effective model/reasoning/priority/runtime;
- runtime-discovered Codex model/reasoning choices;
- friendly Codex thread names;
- hardened Ubuntu engineering confinement;
- restart, reboot, and repeat-bootstrap recovery.

The Prompt 03 runtime acceptance baseline is
`630cb0a9bfe0ded02d99ef1b595dcfa4bf1ce058`. Later documentation commits may move
`main` without changing that accepted runtime baseline.

For the detailed snapshot, measured resource evidence, and deferred features, see
[Current State](docs/operations/CURRENT_STATE.md).

## Architecture at a glance

```text
Human workstation
      |
      | SSH / SSH tunnel
      v
operator-controlled Ubuntu HQ
      |
      +-- botsquad.service           non-root systemd service
      +-- SQLite/company state
      +-- dispatcher
      +-- Codex App Server
      +-- managed Git/engineering
      +-- Linux confinement
      +-- 127.0.0.1:4310 web UI
```

BotSquad is **self-hosted**, not a hosted multi-tenant SaaS. Assigned model/task context
may be sent to the configured external model runtime, but BotSquad coordination state
remains on the operator-controlled host.

## Open an existing BotSquad HQ

If your SSH alias is `botsquad`:

```sh
ssh -N -L 4310:127.0.0.1:4310 botsquad
```

Leave that terminal open, then browse to:

```text
http://127.0.0.1:4310
```

The browser URL looks local, but the application is running on the Ubuntu server.

The UI is intentionally **not exposed directly to the public Internet**.

Useful checks:

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'curl -fsS http://127.0.0.1:4310/api/health'
ssh botsquad 'journalctl -u botsquad --since "15 minutes ago" --no-pager'
```

For restart, runtime login, updates, backups, troubleshooting, and deeper validation,
see [Access and Operations](docs/operations/ACCESS_AND_OPERATIONS.md).

## Set up a brand-new BotSquad server

BotSquad is provider-neutral. The Ubuntu machine may be:

- a DigitalOcean Droplet;
- AWS EC2;
- Hetzner;
- Azure;
- Google Cloud;
- another VPS;
- your own VM;
- a physical Ubuntu computer.

### 1. Create the Ubuntu host

The currently certified Linux contract is:

```text
Ubuntu 24.04 LTS
x86_64
SSH access
Internet access for packages/GitHub/Codex
root or usable sudo for bootstrap
```

The smallest configuration actually validated for the bounded Prompt 03 workload is:

```text
1 vCPU
2 GB RAM
~50 GB disk
2 GiB swap
```

A 2-vCPU / 4-GB host is a more comfortable starting point for heavier work.

See [Set Up a Minimal Ubuntu Host](docs/bootstrap/SETUP_UBUNTU_HOST.md) for a
DigitalOcean example and provider-neutral SSH setup.

### 2. Create an SSH alias

Your workstation should be able to run:

```sh
ssh my-botsquad
```

without giving BotSquad or Codex your private-key contents.

Example `~/.ssh/config`:

```text
Host my-botsquad
    HostName 203.0.113.10
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Root is acceptable for the initial fresh-server bootstrap. BotSquad itself is installed
to run continuously as the separate non-root `botsquad` service account.

### 3. Clone BotSquad on your workstation

```sh
git clone https://github.com/eugenelin89/bot_messenger.git
cd bot_messenger
git fetch origin
```

You do **not** need to manually install Node, Codex, BotSquad, systemd units, swap, or
Linux sandboxing on the server.

### 4. Run the checked-in bootstrap prompt

Open:

```text
prompts/bootstrap-ubuntu.md
```

Set:

```text
SSH_TARGET=my-botsquad
```

Run that prompt from Codex against your local BotSquad checkout.

Codex will inspect the host first, then use the checked-in reproducible installer to
configure the Ubuntu headquarters.

Experienced operators can inspect and invoke the installer directly:

```sh
./scripts/bootstrap-ubuntu.sh my-botsquad "$(git rev-parse origin/main)" --preflight-only
./scripts/bootstrap-ubuntu.sh my-botsquad "$(git rev-parse origin/main)"
```

### 5. Sign the Ubuntu service account into Codex

The bootstrap will tell you when this interactive step is required.

Generic form:

```sh
ssh -t my-botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser authorization privately.

If ChatGPT blocks device-code login, enable the available device-code authentication
setting in ChatGPT Security settings (or ask the relevant workspace administrator to
enable it). **Never share a device code.**

### 6. Open BotSquad

```sh
ssh -N -L 4310:127.0.0.1:4310 my-botsquad
```

Then open:

```text
http://127.0.0.1:4310
```

The full bootstrap, service layout, update policy, login procedure, and validation
commands are documented in [Ubuntu HQ Bootstrap](docs/bootstrap/UBUNTU_BOOTSTRAP.md).

## Validated Ubuntu deployment

The accepted Prompt 03 host used:

- Ubuntu 24.04.4 x86_64;
- kernel 6.8.0-142 after reboot;
- Node.js 24.21.0;
- Codex CLI/App Server 0.157.0;
- 1 vCPU;
- 2 GB RAM;
- approximately 50 GB disk;
- 2 GiB persistent swap.

Real acceptance proved:

- 60/60 hardened deterministic tests;
- real Ubuntu research/restart/resume/interruption;
- real six-worker engineering;
- 146-second engineering completion;
- about 24.96 seconds of overlapping Linus/Ada model turns;
- exact-commit Grace review;
- 8/8 integrated product tests;
- no completed-work replay;
- service restart;
- host reboot;
- repeat bootstrap;
- private tunnel UI;
- no swap use during real workflows.

See [Prompt 03 Ubuntu validation](docs/validation/prompt-03-ubuntu.md).

## Worker AI settings

Open a worker inspector in the UI to configure:

- **Model** — inherit or choose a model advertised by the active Codex runtime;
- **Reasoning** — inherit or choose a supported effort for that model;
- **Priority** — critical, high, normal, or low;
- **Human lock** — prevents bot/manager profile mutation.

Profile changes apply to future executions.

Execution history records the actual effective model, reasoning, priority, and runtime
used for that execution.

Priority controls scheduling among otherwise eligible tasks. It does not bypass pause,
authority, capability, or concurrency limits.

## Current limits

BotSquad is not yet a general autonomous company platform.

Current important limits include:

- one company per data directory;
- eight workers maximum;
- three direct children per manager;
- two hierarchy edges;
- two active executions globally;
- one fixed SquadStatus engineering template/workflow;
- no arbitrary external repository registration/deployment;
- no per-worker Unix account yet;
- no Nix DevOps worker yet;
- no broad permission-granting human approval workflow;
- no Computer Use/browser automation;
- no public Internet UI/login;
- no multi-company runtime implementation yet;
- no cross-HQ federation;
- no Telegram/external-identity implementation;
- no autonomous financial authority.

The next infrastructure milestone is expected to add Nix, trusted human grants, a narrow
privileged provisioner, and separate Unix identities/project access for workers.

## Local development

Ubuntu HQ is the primary deployment, but local development/regression remains supported.

Requirements:

- Node.js 24.x;
- Git;
- Codex login;
- macOS Seatbelt or the bootstrapped Ubuntu confinement adapter for engineering tests.

```sh
npm ci
npm run codex:preflight
npm run dev
```

Open:

```text
http://127.0.0.1:4310
```

Local development state defaults to `.data/`; production-style Ubuntu state uses
`/var/lib/botsquad`.

## Validate

```sh
npm run check
npm test
npm run validate:prompt01
npm run validate:real
```

The real validation commands consume Codex usage.

Ubuntu HQ also includes the production-restriction validation launcher:

```sh
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh deterministic'
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh prompt01'
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh engineering'
```

Run real-model scenarios only when you intentionally want to consume Codex usage.

## Documentation

### Start here

- [Current State](docs/operations/CURRENT_STATE.md)
- [Access and Operations](docs/operations/ACCESS_AND_OPERATIONS.md)
- [Set Up a Minimal Ubuntu Host](docs/bootstrap/SETUP_UBUNTU_HOST.md)
- [Ubuntu HQ Bootstrap](docs/bootstrap/UBUNTU_BOOTSTRAP.md)
- [Prompt 03 Ubuntu Validation](docs/validation/prompt-03-ubuntu.md)

### Architecture and product

- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Project Vision](docs/product/PROJECT_VISION.md)
- [AI Organization Model](docs/product/AI_ORGANIZATION_MODEL.md)
- [Ubuntu HQ and Bootstrap Model](docs/product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Decision 011 — Ubuntu service, confinement and worker AI profiles](docs/decisions/decision_011_ubuntu_hq_profiles.md)
- [Decision Index](docs/decisions/README.md)

### Future architecture

- [Multi-Company and Federation Model](docs/product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](docs/product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
- [Computer Use Model](docs/product/COMPUTER_USE_MODEL.md)

### Examples and history

- [SquadStatus Case Study](docs/examples/squadstatus-case-study.md)
- [Prompt 01 Plan](docs/exec-plans/prompt-01.md)
- [Prompt 02 Plan](docs/exec-plans/prompt-02.md)
- [Prompt 03 Plan](docs/exec-plans/prompt-03.md)
