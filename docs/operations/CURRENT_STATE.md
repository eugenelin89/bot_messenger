# BotSquad — Current State

**Status:** Prompt 03 complete and validated  
**Updated:** 2026-09-25

This document is the short operational snapshot of what BotSquad can do **today**.
For implementation details, see the [system architecture](../architecture/SYSTEM_ARCHITECTURE.md),
[Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md), and the
[Prompt 03 Ubuntu validation record](../validation/prompt-03-ubuntu.md).

## Primary deployment

BotSquad now runs as an always-on, self-hosted Ubuntu headquarters:

```text
Human workstation
      |
      | SSH / SSH tunnel
      v
Ubuntu BotSquad HQ
      |
      +-- botsquad.service      non-root systemd service
      +-- SQLite/company state
      +-- Codex App Server
      +-- dispatcher
      +-- managed engineering/runtime isolation
      +-- loopback-only web UI
```

The validated Linux contract is currently:

- Ubuntu 24.04 x86_64;
- Node.js 24.21.0;
- Codex CLI/App Server 0.157.0;
- non-root `botsquad` service account;
- source/build under `/opt/botsquad`;
- persistent state and Codex service-account auth under `/var/lib/botsquad`;
- private UI on `127.0.0.1:4310`;
- Linux engineering confinement using bubblewrap, namespaces, seccomp, AppArmor admission, and Node permissions.

Prompt 01/02's macOS-local path remains useful for development/regression, but Ubuntu HQ
is the primary operating topology.

## Prompt 03 acceptance baseline

Prompt 03 runtime acceptance and delivery completed at:

```text
630cb0a9bfe0ded02d99ef1b595dcfa4bf1ce058
```

Later documentation-only commits may move `main`; the SHA above identifies the accepted
Prompt 03 runtime baseline.

Acceptance proved:

- 60/60 deterministic tests on macOS and hardened Ubuntu;
- real Ubuntu Atlas → Scout → Atlas research;
- persisted Codex thread resume across restart;
- acknowledged real-turn interruption;
- real six-worker engineering with Atlas, Maya, Turing, Linus, Ada, and Grace;
- two simultaneous real Codex workers;
- exact-commit review;
- trusted integration;
- 8/8 integrated product tests;
- service restart without replay;
- host reboot recovery;
- repeat bootstrap/idempotency;
- private SSH-tunnel UI access.

The six-worker Ubuntu engineering run completed in about 146 seconds, with about
24.96 seconds of actual Linus/Ada model-turn overlap.

## Validated light-duty host

The smallest configuration actually validated is:

```text
1 vCPU
2 GB RAM
~50 GB disk
2 GiB configured swap
```

For the bounded Prompt 03 workload:

- real workflows used no swap;
- available host memory stayed above roughly 1.42 GiB during the engineering sample;
- sampled CPU peaked around 74%.

This is a **light-duty validated floor**, not a capacity promise for large repositories,
heavy builds, long contexts, or sustained queues.

A 2-vCPU / 4-GB host remains the more comfortable planning choice when cost permits.

## Current organization model

The validated company can coordinate:

```text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    ├── Turing — CTO
    │   ├── Linus — Engineer
    │   ├── Ada — Engineer
    │   └── Grace — Reviewer
    └── Scout — Researcher
```

Workers are persistent logical identities. They are not continuously running processes.
They wake only when actual work is queued.

Current hard bounds include:

- eight workers maximum;
- three direct children per manager;
- two hierarchy edges;
- two active executions globally;
- one active execution per worker/task.

## Worker AI profiles

Each worker can now have:

- an explicit Codex model or inherited default;
- reasoning effort or inherited default;
- execution priority;
- human lock state.

The UI discovers model/reasoning choices from the active Codex runtime/account rather
than relying on a hard-coded model list.

Each execution records the effective:

- model;
- reasoning effort;
- priority;
- runtime version/adapter.

New Codex threads use friendly names such as:

```text
BotSquad · Atlas · CEO
BotSquad · Linus · Engineer
```

Durable worker/thread/workspace IDs remain authoritative.

## Dispatcher priority

Eligible work is ordered:

```text
critical → high → normal → low
```

then by stable queue/FIFO order.

Priority does not bypass:

- pause;
- authority/capability checks;
- task validity;
- one-active-execution-per-worker;
- the global two-execution limit.

Strict priority currently has no aging policy, so sustained high-priority work can
starve lower-priority queues.

## Engineering confinement

The current Ubuntu product runner fails closed.

It restricts product tests using:

- bubblewrap namespaces;
- read-only product/runtime mounts;
- hidden/protected Git metadata;
- network isolation;
- seccomp syscall filtering;
- empty environment;
- Node permission controls;
- bounded runtime/output.

Acceptance probes denied:

- filesystem escape;
- sensitive canary reads;
- network;
- uncontrolled child processes;
- host signaling;
- sibling allocation access;
- BotSquad source mutation;
- path/symlink escape.

This does **not** yet isolate arbitrary malicious processes that already share the
`botsquad` service UID. Per-worker Unix identities are the next infrastructure milestone.

## Private access model

BotSquad is deliberately not exposed publicly.

The expected operator path is:

```sh
ssh -N -L 4310:127.0.0.1:4310 <ssh-alias>
```

Then open:

```text
http://127.0.0.1:4310
```

See [Access and Operations](ACCESS_AND_OPERATIONS.md).

## Current persistence

Production-style Ubuntu data is separate from source code:

```text
/opt/botsquad          application checkout/build
/var/lib/botsquad      company state, artifacts, runtime state and service Codex auth
```

The BotSquad service may read the application but does not own the root-managed source.

Backups of `/var/lib/botsquad` must be treated as sensitive because they include
company state and Codex service-account authentication/history.

## What is not implemented yet

The following are documented future directions, not current capabilities:

- Nix as the active DevOps worker;
- separate Unix account per worker;
- privileged worker provisioner;
- independent per-worker project clones;
- broad trusted human approval grants;
- Computer Use/browser automation;
- public Internet UI/login;
- generalized remote server fleets;
- provider API provisioning;
- arbitrary customer deployment;
- multi-company persistence and CompanyConnection;
- cross-HQ federation;
- Telegram/external identities;
- autonomous financial authority.

See:

- [Multi-Company and Federation Model](../product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](../product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
- [Computer Use Model](../product/COMPUTER_USE_MODEL.md)

## Next milestone

The next recommended infrastructure milestone is:

```text
Nix — DevOps
        |
        v
trusted human grants
        |
        v
narrow privileged provisioner
        |
        +-- create/disable worker Unix users
        +-- prepare worker homes
        +-- provision project clones
        +-- grant/revoke project access
        +-- perform bounded host operations
```

That creates a stronger worker security boundary before Computer Use or broader
external authority is added.
