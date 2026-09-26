# BotSquad Roadmap

**Status:** Canonical prompt roadmap  
**Updated:** 2026-09-26

This document defines the current planned sequence of BotSquad implementation prompts.

Prompt numbers are roadmap identifiers, not product version numbers. A prompt may contain
multiple commits and may be split internally if evidence requires it, but the numbering
below should remain stable unless a later explicit roadmap update changes it.

## Roadmap at a glance

| Prompt | Milestone | Status |
| --- | --- | --- |
| 01 | Persistent workers, tasks, Codex runtime, research loop | Complete |
| 02 | Managed engineering organization and independent review | Complete |
| 03 | Ubuntu HQ, reproducible bootstrap, Linux confinement, worker AI profiles | Complete |
| 04 | Nix, trusted approvals, privileged provisioner, per-worker Linux identity | Complete |
| 05 | Generalized projects and repository lifecycle | Next |
| 06 | Stable authenticated remote-client API and device identity | Planned |
| 07 | Native iOS Remote MVP | Planned |
| 08 | Bounded Computer Use | Planned |
| 09 | Multi-company support on one HQ | Planned |
| 10 | Company-to-company collaboration | Planned |
| 11 | External identities and Telegram integration | Planned |
| 12 | Cross-HQ federation | Planned |
| 13+ | Broader operating capabilities | Later |

The sequence intentionally builds stronger authority and isolation boundaries before
adding broader external access or autonomous capabilities.

---

## Prompt 01 — Persistent AI organization

**Status:** Complete

Prompt 01 proved the smallest real organization loop:

~~~text
Human
  |
  v
Atlas — CEO
  |
  v
Scout — Researcher
  |
  v
Atlas
  |
  v
Human
~~~

Major capabilities:

- persistent logical worker identities;
- explicit tasks and durable messages;
- event-driven dispatch;
- no idle model polling;
- Codex App Server runtime adapter;
- persistent Codex thread binding;
- execution records per attempt;
- worker hiring within a trusted authority ceiling;
- restart/recovery without replaying completed work;
- artifacts and audit evidence.

Key lesson:

> A worker is a durable organizational identity, not a continuously running model process.

See the Prompt 01 plan, validation record, and Decision 007.

---

## Prompt 02 — Managed engineering organization

**Status:** Complete

Prompt 02 expanded the organization:

~~~text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    └── Turing — CTO
        ├── Linus — Engineer
        ├── Ada — Engineer
        └── Grace — Reviewer
~~~

Major capabilities:

- product specification before engineering;
- two concurrent real Codex engineers;
- task-bound branches/worktrees;
- narrow trusted source-editing tools;
- bounded product tests;
- exact-commit review;
- immutable review evidence;
- trusted integration only after tests;
- conflict/failure preservation;
- concurrency evidence;
- restart without duplicate work.

Prompt 02 used the fixed SquadStatus product as a bounded validation environment.

Key lesson:

> Multi-agent engineering becomes trustworthy when ownership, evidence, review, and
> integration are explicit control-plane objects instead of chat conventions.

See the SquadStatus case study and Decision 008.

---

## Prompt 03 — Ubuntu headquarters

**Status:** Complete and validated

Prompt 03 moved BotSquad from a workstation-local experiment to an always-on,
operator-controlled Ubuntu headquarters.

Major capabilities:

- reproducible Ubuntu bootstrap;
- provider-neutral SSH target;
- non-root botsquad systemd service;
- source/build separated from durable company state;
- persistent swap policy for small hosts;
- boot/reboot recovery;
- repeat-install/idempotency;
- private loopback-only web UI;
- Codex authentication under the service identity;
- Codex CLI/App Server upgrade and revalidation;
- Linux engineering confinement;
- macOS regression path preserved;
- per-worker model selection;
- per-worker reasoning effort;
- per-worker execution priority;
- human AI-profile lock;
- immutable effective execution provenance;
- runtime-discovered model/reasoning choices;
- friendly Codex thread names;
- service health/readiness;
- real Ubuntu research and six-worker engineering acceptance.

Validated light-duty host:

~~~text
Ubuntu 24.04 x86_64
1 vCPU
2 GB RAM
approximately 50 GB disk
2 GiB configured swap
~~~

Prompt 03 proved that the bounded six-worker workflow can run on this small host while
two Codex workers overlap.

Key lesson:

> BotSquad can be a real self-hosted headquarters rather than a collection of local
> terminal sessions.

See Current State, Decision 011, and the Prompt 03 Ubuntu validation record.

---

## Prompt 04 — Nix, trusted approvals, and per-worker Linux identity

**Status:** Complete

[Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md) and
[real Ubuntu acceptance](../validation/prompt-04-linux-identity.md) record the implementation.

- Nix is a persistent DevOps leaf under Atlas, with explicit tasks and no root/sudo.
- Human approvals bind exact immutable operation, requester, target, parameters,
  expiry and preconditions; one-time consumption precedes mutation.
- A root-owned Unix-socket provisioner admits trusted service/admin peers and supports
  fixed identity create/disable, approved clone preparation/revocation, and health.
  Internal bounded source/Git helpers run after worker UID/GID drop. No shell,
  arbitrary path, package installation or service administration API exists.
- Stable UUID-derived `bsw-<hash>` accounts have private UID/GID, locked passwords,
  nologin shells and private homes under `/var/lib/botsquad-workers`. Central Codex
  authentication and existing runtime workspaces remain under the service account.
- Linux engineers use independent worker-owned clones; Grace reviews a trusted
  read-only exact-commit packet; trusted integration owns canonical product main.
- Retirement blocks unsafe active/unmerged work, disables dispatch, terminates the
  recorded UID's processes, revokes access and preserves homes/history.
- Root receipts and consumed intent recover across app/provisioner restart and reboot.

Acceptance passed 81 deterministic tests on macOS/hardened Ubuntu, real Nix tasks and
approvals, seven real identities, 100 UID probes, concurrent engineer turns, exact
review/integration, 8/8 product tests, safe engineer retirement, real lost-response
recovery, research regression and a bounded reboot with production history preserved.

The development backend remains simulated. This milestone does not move central
Codex processes/auth into worker homes or implement general projects, service upgrades,
remote/mobile APIs, Computer Use or multi-company persistence.

---

# Next implementation phase

## Prompt 05 — Generalized projects and repository lifecycle

**Status:** Next

Prompt 02–04 use a bounded fixed engineering product.

Prompt 05 should make BotSquad useful for real repositories.

Target concepts:

~~~text
Project
Repository
Workspace/Clone
Branch
Task allocation
Submission
Review
Revision
Integration
Release/deployment policy
~~~

Capabilities should include:

- register an existing repository;
- create a new project repository;
- GitHub remote configuration through trusted policy;
- per-worker clone allocation;
- task-to-branch ownership;
- project-level AGENTS/instructions;
- configurable acceptance commands;
- revision loops;
- Grace changes-required workflow;
- resubmission;
- multi-round review;
- conflict handling;
- integration queue;
- archive/cleanup;
- project-level capability policy.

Protected remote operations should use trusted approvals where required.

### Acceptance themes

- use at least one non-SquadStatus repository;
- two workers edit independent scopes safely;
- reviewer requests revision;
- engineer revises and resubmits;
- trusted integration advances only validated work;
- remote push policy is explicit and audited;
- restart preserves repository/task state;
- no worker gains arbitrary Git/system authority.

---

# Remote operator access

## Prompt 06 — Stable authenticated remote-client API

**Status:** Planned

Prompt 06 creates the foundation for native/mobile clients.

Do not begin by building an iOS UI against browser internals.

Create a stable, versioned, authenticated client API above the trusted control plane.

Target architecture:

~~~text
BotSquad Core
   |
   +-- versioned client API
   |      +-- Web UI
   |      +-- iOS client
   |      +-- future clients
   |
   +-- reconnectable event stream
   +-- device identity
   +-- human principal authorization
~~~

Major capabilities:

- versioned API;
- capability discovery;
- explicit human principals;
- remote device records;
- device pairing;
- device revocation;
- short-lived credentials;
- idempotent mutating requests;
- reconnect-safe events;
- audit by human/device/client request;
- private-network access mode;
- remote transport abstraction.

The Ubuntu HQ remains private by default.

Prompt 06 must not simply expose the current loopback UI port publicly.

### Secure transport

Initial supported remote paths may include:

- LAN/private network;
- operator-managed VPN;
- SSH tunnel as recovery/admin path.

A future outbound relay interface may be introduced here or prepared for Prompt 07.

### Acceptance themes

- pair one remote test client;
- authenticate a human/device principal;
- list workers/tasks;
- send message-only communication;
- assign an explicit objective;
- pause/resume;
- update one AI profile;
- reconnect event stream;
- revoke device;
- duplicate mutating request does not duplicate work;
- port 4310 remains private.

---

## Prompt 07 — Native iOS Remote MVP

**Status:** Planned

Build the first native iPhone/iPad operator client.

The app is a first-class BotSquad client, not:

- a WebView;
- an HTML scraper;
- an SSH terminal wrapper.

Initial views:

- HQ connection/status;
- company dashboard;
- organization;
- workers;
- tasks;
- chat;
- executions;
- AI profile controls;
- diagnostics/settings.

Initial actions:

- message Atlas/worker;
- assign objective;
- pause/resume;
- interrupt supported execution;
- inspect artifacts suitable for mobile;
- change worker model/reasoning/priority;
- pair/revoke device.

### No-manual-tunnel goal

Normal mobile operation should work without manually opening an SSH tunnel.

The HQ should still remain private by default.

Possible transport:

- private VPN/direct;
- outbound BotSquad relay.

### Relay direction

If an outbound relay is introduced:

~~~text
iOS app
   |
   v
BotSquad relay
   ^
   |
outbound HQ connection
   |
Ubuntu HQ
~~~

The relay must not become:

- company database;
- approval authority;
- Codex credential holder;
- worker credential holder;
- source of organizational truth.

End-to-end encryption is a design goal requiring a separate reviewed protocol before it
is claimed.

### Acceptance themes

- pair one real iPhone;
- connect remotely without manual SSH tunnel;
- HQ application port remains non-public;
- show live worker/task state;
- send message and explicit objective separately;
- show execution provenance;
- update AI profile safely;
- offline cached state marked stale;
- retries are idempotent;
- revoked phone loses access;
- SSH/browser admin path still works.

---

# Broader agent capabilities

## Prompt 08 — Bounded Computer Use

**Status:** Planned

Add explicit Computer Use capability after worker OS identity and approvals are reliable.

Preferred autonomous model:

~~~text
worker
   |
   v
isolated browser / desktop / VM / container
~~~

Do not make the human's personal workstation the default autonomous environment.

Capabilities should define:

- environment;
- allowed apps;
- allowed sites;
- filesystem scope;
- upload/download policy;
- maximum runtime;
- network policy;
- actions requiring approval.

A specialized Computer Operator role is preferred to granting GUI authority to every
worker.

### Acceptance themes

- worker without capability cannot obtain session;
- bounded browser workflow succeeds;
- disallowed site/action fails;
- screenshots/results attributable to execution;
- prompt injection cannot expand authority;
- protected action pauses for approval;
- session can be interrupted;
- restart/recovery is defined;
- no unrestricted access to personal credentials/data.

---

# Company layer

## Prompt 09 — Multi-company support

**Status:** Planned

Allow one BotSquad HQ to host multiple isolated companies.

Target:

~~~text
Human owner
└── BotSquad HQ
    ├── Company A
    ├── Company B
    └── Company C
~~~

Company becomes a first-class security/data boundary.

Company-scoped concepts include:

- workers;
- channels/messages;
- tasks;
- executions;
- artifacts;
- repositories/projects;
- approvals;
- external identities;
- policy;
- audit.

The data model must keep distinct:

~~~text
owner
runtime account
BotSquad instance/HQ
company
worker
runtime thread
execution
device/external identity
~~~

One runtime account may support several companies without merging company state.

### Acceptance themes

- create two companies in one HQ;
- company A cannot read/write company B;
- UI company switcher;
- active company is explicit for every protected action;
- worker belongs to one company;
- runtime settings remain separate;
- restart preserves isolation;
- migrations from one-company data remain correct.

---

## Prompt 10 — Company-to-company collaboration

**Status:** Planned

After company isolation is real, allow companies to collaborate explicitly.

Introduce a trusted connection object such as:

~~~text
CompanyConnection
  source company
  target company
  allowed message/task types
  artifact policy
  approval policy
  rate limits
  lifecycle/revocation
~~~

Example:

~~~text
Acme / Atlas
   |
   | research request
   v
ResearchCo / Atlas
   |
   v
Scout
   |
   v
ResearchCo result
   |
   v
Acme
~~~

Acme should not gain access to ResearchCo's internal Scout context or unrelated data.

Inter-company work should preserve separate internal tasks/audits on both sides.

### Acceptance themes

- explicit connection creation;
- bounded message;
- bounded task handoff;
- result/artifact return;
- provenance preserved;
- revocation stops new traffic;
- loops bounded;
- duplicate/replay protection;
- no cross-company authority escalation.

---

# External communication

## Prompt 11 — External identities and Telegram integration

**Status:** Planned

Add a generic ExternalIdentity model, then Telegram as the first concrete adapter.

A worker may have:

~~~text
internal BotSquad identity
+
optional external identities
~~~

Examples:

- Telegram bot;
- email;
- future Slack/Teams/Discord identity.

Telegram workers should use Telegram bot accounts, not simulated human accounts.

Not every worker needs an external identity.

### Trusted credential gateway

Raw Telegram tokens remain behind trusted integration code.

Workers request typed operations such as:

~~~text
send_external_message
~~~

They do not receive the token.

### Company-level identities

Support both:

- worker-level bot identity;
- company-level bot routed internally.

A company-level bot may be useful for:

- public contact;
- support routing;
- lower provider-account count;
- mobile conversation.

### Bot-to-bot collaboration

Telegram may be used as one transport for company-to-company communication.

Telegram is not the authority layer.

Incoming messages remain untrusted external content until mapped through known identity
and company-connection policy.

### Acceptance themes

- optional identity attach/detach;
- token hidden from normal worker context;
- outbound message;
- inbound message;
- correct worker/company mapping;
- rate limiting;
- loop prevention;
- bot-to-bot bounded exchange;
- audit/provider message IDs;
- credential rotation/revocation;
- internal BotSquad works when Telegram is unavailable.

---

## Prompt 12 — Cross-HQ federation

**Status:** Planned

Allow companies on separate BotSquad installations to collaborate directly.

Target:

~~~text
BotSquad HQ A
      |
      | authenticated federation
      v
BotSquad HQ B
~~~

Requirements should include:

- stable HQ identity;
- stable company identity;
- authenticated peers;
- signed/authenticated envelopes;
- replay protection;
- deduplication;
- rate limits;
- connection negotiation;
- revocation;
- artifact integrity hashes;
- bounded task/message loops;
- capability/policy negotiation.

Do not implement federation by:

- sharing SQLite;
- exposing internal DB access;
- trusting free-form bot messages;
- reusing Telegram identity as the sole authority mechanism.

Telegram remains one possible transport/integration; native BotSquad federation should
remain provider-independent.

---

# Prompt 13 and beyond — broader operating capabilities

**Status:** Later / intentionally not fixed yet

After the foundational security, project, remote-client, company, and federation layers
are proven, later prompts may add capabilities such as:

- deployment operator;
- infrastructure fleets;
- scheduled recurring work;
- customer support;
- email identities;
- CRM/sales integrations;
- accounting/metrics;
- cloud provider provisioning;
- secret-management integrations;
- bounded budgets;
- spending requests;
- billing;
- customer-facing deployment;
- specialized GPU/compute workers;
- portfolio-level company supervision.

These should not be assigned fixed prompt numbers until their dependencies and scope are
better understood.

---

# Cross-cutting rules for every future prompt

Every future milestone must preserve these invariants unless a new accepted decision
explicitly changes them.

## Human agency

The human owns company-level authority.

Bots may request protected actions but cannot create human approval through text.

## Communication is not execution

Messages communicate.

Tasks or other configured trusted triggers authorize work.

## Idle workers do not poll models

Use control-plane events and queues.

Do not consume model usage merely to check an empty inbox.

## Durable identities, replaceable runtime sessions

Worker, company, HQ, runtime account, thread, execution, Unix user, device, and external
identity are distinct concepts.

## Evidence over prose

Important completion claims require artifacts, commits, tests, logs, receipts, or other
inspectable evidence.

## Fail closed

Missing confinement, unsupported runtime settings, ambiguous authority, or invalid
credentials must not silently fall back to broader access.

## No credential exposure to normal workers

SSH keys, Codex auth, Telegram bot tokens, APNs secrets, infrastructure credentials, and
other sensitive provider secrets remain behind trusted boundaries.

## Idempotency

Retries/reconnects must not duplicate consequential operations.

## Explicit scope

A new capability does not imply authority over unrelated files, machines, companies,
accounts, or external systems.

---

# Dependency map

~~~text
01 Persistent organization
        |
02 Managed engineering
        |
03 Ubuntu HQ
        |
04 Nix + approvals + worker Unix identity
        |
05 General projects
        |
06 Authenticated remote client API
        |
07 iOS Remote MVP
        |
08 Computer Use
        |
09 Multi-company
        |
10 Company collaboration
        |
11 External identities / Telegram
        |
12 Cross-HQ federation
        |
13+ Broader company operations
~~~

Some later work may proceed in parallel once its dependencies are proven, but prompt
numbers above are the canonical planning order.

## Related documents

- Current State
- Project Vision
- System Architecture
- AI Organization Model
- Native iOS Remote Client and Secure Remote Access
- Multi-Company and Federation Model
- External Identities and Telegram Integration
- Computer Use Model
- Decision index
