# BotSquad — Current State

**Status:** Prompt 04 complete; real Ubuntu acceptance validated
**Updated:** 2026-09-26

This document is the short operational snapshot of what BotSquad can do **today**.
For implementation details, see the [system architecture](../architecture/SYSTEM_ARCHITECTURE.md),
[Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md), and the
[Prompt 04 Linux identity validation record](../validation/prompt-04-linux-identity.md).

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

## Prompt 04 acceptance

Runtime acceptance: `9af2db810b71ec9ca1097767a61ae0aa2edb43d8`.

- 81/81 deterministic tests on macOS and hardened Ubuntu;
- seven real worker accounts, real Nix tasks and trusted approvals;
- independent engineer clones and worker-UID file/Git operations;
- 20.285 seconds of real engineer model-turn overlap, exact Grace review and 8/8 product tests;
- 100 real UID checks (98 denials, two allowed own-clone writes);
- engineer retirement with process termination, project revocation and preserved history;
- pending approval/reconciliation, provisioner restart and bounded reboot;
- retained research/resume/interruption workflow and original production history.

Production remains paused with its original Atlas, completed task/execution, profile and
thread binding. Its OS binding remains unprovisioned until explicitly requested. The
validation companies and Linux accounts are separate retained evidence.

## Prompt 03 historical baseline

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

For the bounded Prompt 04 identity/engineering workload:

- swap remained at the pre-existing 268 KiB with no increase;
- available host memory stayed at or above 1425.16 MiB;
- validation cgroup peak was 219.36 MiB;
- mean host CPU busy was 28.25%, with a 100% sampled peak and 0.60 peak one-minute load;
- idle provisioner overhead was about 8.9 MiB cgroup / 18.7 MiB RSS.

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
    ├── Scout — Researcher
    └── Nix — DevOps
```

Workers are persistent logical identities. They are not continuously running processes.
They wake only when actual work is queued.

Current hard bounds include:

- eight workers maximum;
- three ordinary direct children per manager; the CEO may additionally have Nix;
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

Worker-owned source writes and commits now run under private Linux UIDs in independent
clones. Sibling homes and central state/auth are inaccessible to those UIDs. Product
tests remain inside the existing sandbox under the trusted botsquad account. The
control plane and root administrator remain trusted; arbitrary code under that service
UID is outside this boundary. The development backend simulates identities.

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
/opt/botsquad-provisioner        root-owned fixed protocol implementation
/var/lib/botsquad-provisioner    root-private ledgers and idempotency receipts
/var/lib/botsquad-workers        private worker homes and independent clones
```

The BotSquad service may read the application but does not own the root-managed source.

Backups of `/var/lib/botsquad` must be treated as sensitive because they include
company state and Codex service-account authentication/history.

## What is not implemented yet

The following are documented future directions, not current capabilities:

- broad trusted human approval grants;
- Computer Use/browser automation;
- public Internet UI/login;
- generalized remote server fleets;
- provider API provisioning;
- arbitrary customer deployment;
- multi-company persistence and CompanyConnection;
- cross-HQ federation;
- Telegram/external identities;
- native iOS remote client / secure relay access;
- autonomous financial authority.

See:

- [Multi-Company and Federation Model](../product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](../product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
- [Computer Use Model](../product/COMPUTER_USE_MODEL.md)

## Prompt 04 infrastructure

Nix is a persistent DevOps leaf under Atlas. Initialize Nix through the UI, review
its bootstrap request in Approvals, then let explicit infrastructure tasks coordinate
other workers. Protected operations bind the exact target, requester, task/execution,
parameters, expiry and preconditions; only the trusted human HTTP boundary can decide.
Consumption precedes host mutation and durable root receipts permit exact retry.

Linux accounts are locked/nologin, have private UID/GID/home and no privileged groups.
Only the trusted service receives read/traverse ACLs. Nix has no root/sudo/socket
access and workers receive no Codex credentials. Existing workers stay honestly
unprovisioned until explicitly requested; migration preserves all previous bindings.

Engineering waits for approved identities and clone bindings. Ordinary retirement
uses Nix plus approval, disables new dispatch, terminates the recorded UID's processes,
revokes access and retains homes/history. Temporary terminal retirement can reduce
authority automatically through a durable, safely deferred revocation intent.

See [Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md) and
[the validation record](../validation/prompt-04-linux-identity.md). Real Ubuntu acceptance passed.
The next planned product milestone is generalized projects and repository lifecycle.

## Future native mobile access

A native iPhone/iPad client is now an accepted future architecture direction.

It is not implemented yet.

The intended design keeps the Ubuntu HQ private and makes the iOS app another
authenticated BotSquad client rather than a WebView or SSH wrapper. The app should use a
stable versioned API and an explicit device-pairing/authorization model.

Normal mobile operation should eventually avoid manual SSH tunnelling through either a
private-network path or a future outbound relay. SSH remains the administrative and
recovery path.

See [Native iOS Remote Client and Secure Remote Access](../product/IOS_REMOTE_CLIENT.md).


## Canonical roadmap

The numbered implementation roadmap is maintained in
[BotSquad Roadmap](../product/ROADMAP.md).

Current next step:

~~~text
Prompt 05
Generalized projects and repository lifecycle
~~~

Subsequent planned prompts are:

~~~text
06 Authenticated remote-client API
07 Native iOS Remote MVP
08 Bounded Computer Use
09 Multi-company
10 Company-to-company collaboration
11 Telegram / external identities
12 Cross-HQ federation
~~~

See the roadmap for dependencies and acceptance themes.
