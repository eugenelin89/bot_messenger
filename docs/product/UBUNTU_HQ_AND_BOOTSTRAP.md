# BotSquad — Ubuntu HQ and Bootstrap Model

**Status:** Prompt 04 implemented and validated on Ubuntu 24.04 x86_64
**Date:** 2026-09-26

Before starting, see [Set Up a Minimal Ubuntu Host for BotSquad](../bootstrap/SETUP_UBUNTU_HOST.md).

## Current implementation truth

Prompt 04 is complete. For operational truth, use:

- [Current State](../operations/CURRENT_STATE.md)
- [Access and Operations](../operations/ACCESS_AND_OPERATIONS.md)
- [Ubuntu HQ Bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md)
- [Prompt 04 validation](../validation/prompt-04-linux-identity.md)
- [Prompt 03 historical baseline](../validation/prompt-03-ubuntu.md)
- [Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md)

Prompt 04 implements and validates the bounded Nix/worker identity portion below.
Broader upgrades, service administration and fleet management
remain design rationale, not current capabilities. See Decision 013.

## Goal

Make BotSquad easy to install for a real user:

> Give Codex a fresh supported Ubuntu machine that is reachable through an existing SSH alias, and let the checked-in BotSquad bootstrap prompt turn that machine into a working BotSquad headquarters.

The user should not need to manually configure Node.js, Codex, systemd, BotSquad directories, Linux sandboxing, service startup, or the BotSquad web UI.

The primary deployment model is therefore self-hosted rather than workstation-local. A cloud provider is convenient, but not required; the host may also be a private VM or physical Ubuntu machine.

The desired onboarding experience is:

```text
1. Create a fresh Ubuntu server.
2. Configure SSH locally so this succeeds:

   ssh my-botsquad-server

3. Clone/open BotSquad locally.
4. Run the checked-in Ubuntu bootstrap Codex prompt with:

   SSH target: my-botsquad-server

5. Codex bootstraps the server.
6. Complete any unavoidable interactive Codex/ChatGPT login step.
7. Codex verifies the BotSquad service and web UI.
8. Connect to the BotSquad UI through an SSH tunnel.
9. Begin creating/using the squad.
```

For the project owner, the SSH alias may be something like:

```text
ssh botsquad
```

The product and bootstrap design must never depend on that particular alias.

## Bootstrap is not Nix

The one-time installer and the ongoing DevOps worker are separate concepts.

### Bootstrap Codex task

Runs before BotSquad exists on the Ubuntu host.

Its job is to:

- connect through the operator's existing SSH configuration;
- inspect the target safely;
- install and configure the BotSquad host;
- clone/update the BotSquad repository;
- install and validate the Codex runtime;
- configure BotSquad as an always-on service;
- validate Linux isolation;
- validate the web UI and restart behavior;
- leave reproducible bootstrap artifacts in the repository.

### Nix — DevOps worker

Nix is created **after BotSquad is running**.

Nix coordinates worker-account provisioning, project access and health inspection
through typed requests and trusted human approval. Upgrades and general host/service
administration remain future work.

Nix is not required to solve the initial installation chicken-and-egg problem.

## Trust boundary

The bootstrap prompt may invoke the local command:

```sh
ssh <target> ...
```

using the human operator's pre-existing SSH client configuration.

The prompt should not ask the user to paste a private SSH key into:

- the prompt;
- BotSquad;
- the repository;
- logs;
- artifacts.

SSH authentication remains owned by the operator's local SSH client / agent / config.

The bootstrap task receives only a logical SSH target such as:

```text
my-botsquad-server
```

and uses normal SSH commands.

## Supported starting state

Prompt 03 validated the initial Ubuntu starting contract.

The current supported starting contract is:

- fresh supported Ubuntu LTS;
- reachable through an SSH alias;
- target account has the privilege needed to bootstrap the host, either root or passwordless/usable sudo;
- normal Internet access for package/runtime installation;
- enough CPU, memory and disk for BotSquad and concurrent Codex workers.

The bootstrap inspects and fails clearly if the host does not meet the supported contract.

Do not silently weaken security or continue on an unknown distribution/platform.

## Desired installed layout

The current service and worker-infrastructure layout is:

```text
Ubuntu host
│
├── /opt/botsquad/                # application checkout / deployable code
├── /var/lib/botsquad/            # durable company state
├── /var/log/botsquad/            # bounded service logs if needed
│
├── botsquad service account      # runs the control plane, not root
├── botsquad.service              # systemd unit
│
├── privileged provisioner        # bounded root socket service
│
└── worker Unix accounts          # Prompt 04 approved bindings
    ├── botsquad-atlas
    ├── botsquad-nix
    ├── botsquad-turing
    ├── botsquad-linus
    ├── botsquad-ada
    └── botsquad-grace
```

Prompt 03 creates the botsquad service account. Prompt 04 adds the root provisioner
and individually approved worker bindings. Display names in this diagram are
conceptual: actual usernames are `bsw-` plus a stable UUID-derived hash, recorded in
SQLite/root ledgers. Homes use `/var/lib/botsquad-workers/<username>`.

## BotSquad service model

BotSquad runs continuously under systemd:

```text
Ubuntu boot
   ↓
systemd
   ↓
botsquad.service
   ↓
BotSquad control plane
   ↓
SQLite + dispatcher + Codex runtime
```

The service is designed and validated to:

- run as a non-root service user;
- restart after host reboot;
- retain company data;
- expose only the intended local interface;
- fail visibly if prerequisites/runtime compatibility are broken.

## Web UI access

The first supported deployment should **not expose the BotSquad UI directly to the public Internet**.

Preferred initial access:

```sh
ssh -L 4310:127.0.0.1:4310 my-botsquad-server
```

Then open locally:

```text
http://127.0.0.1:4310
```

BotSquad on the Ubuntu host should continue binding to loopback by default.

A future authenticated/public or VPN-based access model is separate work.

## Linux isolation

Prompt 02's original engineering test confinement was macOS-specific. Prompt 03 therefore required—and implemented—a separately validated Linux isolation path before engineering could be considered supported on Ubuntu.

The current Ubuntu implementation uses the supported Codex/Linux sandbox facilities and OS primitives actually available on the target, including:

- Unix user isolation;
- filesystem ownership/permissions;
- bubblewrap and/or supported Codex Linux sandboxing;
- seccomp or equivalent supported confinement;
- restricted environment variables;
- restricted network;
- bounded process execution;
- per-worker/project scope.

The Linux path establishes equivalent security requirements rather than pretending to reproduce macOS Seatbelt semantics by name.

There must be no unsandboxed fallback silently used when a required engineering isolation gate fails.

## Per-worker Linux identity

The long-term Ubuntu model is:

```text
BotSquad logical worker
        |
        +-- Codex thread/runtime binding
        +-- AI profile
        +-- Linux identity
        +-- project access
        +-- capabilities
```

Examples:

```text
Atlas  -> botsquad-atlas
Nix    -> botsquad-nix
Linus  -> botsquad-linus
Ada    -> botsquad-ada
Grace  -> botsquad-grace
```

Regular bot users should not have unrestricted sudo/root.

If privileged host changes are needed, they belong behind a small trusted provisioner with a narrow operation set.

The AI worker may request a privileged operation; trusted code authorizes and performs it.

## Same-host execution

Once BotSquad itself runs on the Ubuntu HQ, a bot does not need to SSH back into the same host merely to use its Linux account.

Preferred execution shape:

```text
BotSquad
   ↓
worker execution
   ↓
trusted local execution under the worker's Unix identity
   ↓
worker project/home scope
```

SSH remains useful for:

- the human operator;
- initial bootstrap;
- debugging/administration;
- future workers targeting another machine;
- future multi-host BotSquad infrastructure.

## Git model on Linux

Prompt 02 uses shared Git worktrees under one macOS account.

When engineering workers have distinct Unix identities, prefer independent clones backed by a trusted local central repository rather than shared cross-user Git metadata.

Conceptually:

```text
/srv/botsquad/repos/product-x.git
          ↑
          |
   +------+------+
   |             |
Linus clone    Ada clone
/home/...      /home/...
```

Prompt 04 implements independent private clones for the fixed SquadStatus product.
The development backend retains Prompt 02 worktrees; generalized repositories remain
Prompt 05. Trusted integration imports exact commits by bundle, and Grace receives
a read-only review packet rather than a mutable clone.

## Nix — bounded DevOps worker

Implemented logical worker identity:

```text
Name: Nix
Title: DevOps
Linux account: bsw-<stable UUID-derived hash>
```

Nix currently coordinates:

- request worker account creation/disablement;
- prepare worker project clones;
- grant/revoke approved project access;
- check host health;

Credential rotation, BotSquad upgrades and service administration remain deferred.

Nix should not receive an unrestricted root shell.

Privileged actions should be implemented through trusted typed operations.

## AI profile per worker

Prompt 03 made model/runtime policy first-class per worker.

Each worker now has an AI profile with at least:

```text
model
reasoning effort
execution priority
configuration ownership / human lock
```

These concepts are distinct.

### Model

The model should be chosen from models actually advertised by the active Codex runtime/account.

Do not hard-code one model name for all workers.

A global runtime/default model remains a fallback for workers without an explicit choice.

### Reasoning effort

Allow the supported reasoning levels advertised by the runtime.

Do not assume a fixed enum if the runtime exposes different capabilities; validate requested settings against the selected model/runtime.

### Execution priority

Priority is a BotSquad dispatcher concept, not model reasoning.

At minimum support a bounded ordering such as:

```text
low
normal
high
critical
```

or a documented equivalent.

Priority decides which queued worker is dispatched first when execution slots are limited.

It must not bypass capability, approval or concurrency rules.

### Human locking

The human operator must be able to lock a worker's AI profile so managers cannot change it.

A future manager profile-request interface must enforce:

- company model allowlist;
- supported model/reasoning combinations;
- manager delegatable limits;
- human locks.

### Execution provenance

Every execution should record the actual:

- model;
- reasoning effort;
- scheduling priority;
- runtime version.

This makes later quality/cost/performance comparisons possible.

## Codex thread naming

Human-visible Codex threads should be easy to identify.

Prefer names such as:

```text
BotSquad · Atlas · CEO
BotSquad · Nix · DevOps
BotSquad · Linus · Engineer
```

When run/company context matters:

```text
BotSquad · <company/product> · Linus · Engineer
```

Do not rely on opaque worker IDs as the primary human-visible thread title.

Worker ID remains the durable identity key.

## Codex runtime upgrade/revalidation

Current BotSquad was validated with a pinned Codex CLI/App Server version.

Prompt 03 was the platform/runtime migration and explicitly:

1. inspected the supported Codex runtime on Ubuntu;
2. determined whether the existing pin should remain or be upgraded;
3. verified App Server protocol/tool compatibility;
4. discovered advertised models and reasoning options;
5. reran runtime identity, sandbox, tool confinement, resume, interrupt and real-worker tests;
6. updated the pin only with evidence.

Do not simply install an arbitrary latest version and assume compatibility.

Do not blindly preserve the old pin if it blocks supported Ubuntu/current-model operation.

## Bootstrap artifacts

Prompt 03 left a reproducible installation path in the repository, and Prompt 04 extends that installer with the trusted provisioner and worker-identity infrastructure.

Expected artifacts may include:

```text
docs/bootstrap/UBUNTU_BOOTSTRAP.md
prompts/bootstrap-ubuntu.md
scripts/bootstrap-ubuntu.sh
deploy/systemd/botsquad.service
```

Exact structure may differ if implementation evidence justifies it.

The checked-in Codex prompt should be the human-facing entrypoint.

The script/configuration should contain the deterministic/repeatable system setup wherever practical.

Codex should orchestrate and diagnose; it should not depend on improvising a different set of commands every installation.

## Bootstrap prompt contract

The checked-in bootstrap prompt should accept an explicit variable near the top:

```text
SSH_TARGET=<alias>
```

Example:

```text
SSH_TARGET=botsquad
```

It must:

1. verify local Git/SSH preconditions;
2. verify `ssh $SSH_TARGET` succeeds;
3. inspect the target OS/architecture/resources;
4. report planned mutations and ETA;
5. bootstrap using reproducible checked-in artifacts;
6. preserve SSH credentials outside repository/model artifacts;
7. pause only for genuinely interactive prerequisites such as Codex account authorization;
8. validate installed BotSquad;
9. reboot/restart as necessary and verify recovery;
10. print the SSH tunnel command and local UI URL;
11. record sanitized installation evidence.

## Security expectations

Bootstrap work is security-sensitive.

The prompt and implementation must:

- never commit or print private SSH keys;
- avoid storing passwords/tokens in the repo or normal logs;
- use non-root runtime identities;
- minimize persistent privileged surfaces;
- keep the UI loopback-only initially;
- preserve firewall/SSH access while configuring the host;
- avoid locking the operator out;
- prefer reversible/inspectable changes;
- report unsupported/ambiguous host state instead of guessing;
- never disable security controls merely to make validation pass.

## Historical acceptance target for Prompt 03

The successful Prompt 03 demonstration started from a fresh supported Ubuntu target reachable through an SSH alias and proved:

1. the bootstrap prompt can connect without receiving raw SSH private-key material;
2. target compatibility is checked;
3. BotSquad is installed reproducibly;
4. BotSquad runs as a non-root systemd service;
5. durable state lives outside the Git checkout;
6. the service survives reboot/restart;
7. UI is reachable through an SSH tunnel and not publicly exposed by default;
8. Codex authentication/runtime works on Ubuntu;
9. Linux runtime confinement is validated;
10. Prompt 01 research workflow works on Ubuntu;
11. Prompt 02 engineering behavior or an equivalent Linux-safe regression works on Ubuntu;
12. per-worker model selection works;
13. per-worker reasoning selection works;
14. per-worker dispatcher priority works;
15. execution provenance records actual AI profile/runtime;
16. thread names are human-readable;
17. installation evidence contains no secrets.

The concrete installer/service/Linux/profile choices are in [Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md); operational steps are in [Ubuntu bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md). Manager-requested AI profiles are deferred; trusted human configuration is implemented.

Prompt 03 established Ubuntu HQ, confinement, reproducible bootstrap and per-worker
AI profiles. Prompt 04 added and validated Nix, exact-scope approvals, the narrow root
provisioner and worker Unix-account/clone lifecycle while preserving those boundaries.
Prompt 05 is the next canonical milestone.
