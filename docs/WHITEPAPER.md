# BotSquad: A Self-Hosted Control Plane for Persistent AI Organizations

**Technical White Paper**  
**Version:** 0.1  
**Date:** 2026-09-25  
**Project:** BotSquad  
**Repository:** eugenelin89/bot_messenger  
**Traditional Chinese (Taiwan):** [台灣繁體中文版](WHITEPAPER_ZH_TW.md)

## Abstract

BotSquad is a self-hosted control plane for organizing persistent AI workers into
observable, bounded, auditable teams.

The central premise is that useful multi-agent systems require more than several model
sessions exchanging text. They need durable organizational identity, explicit work
assignment, trusted authority boundaries, recoverable execution state, evidence-based
handoffs, and human control.

BotSquad models AI workers as persistent logical employees rather than continuously
running model processes. Workers sleep when idle, wake only when real work is queued,
retain durable roles and task history, and use replaceable runtime sessions such as
Codex threads to perform bounded executions.

The system began as a workstation-local experiment and has progressed to an always-on,
self-hosted Ubuntu headquarters. The current implementation demonstrates a real
hierarchical AI organization performing research and concurrent software engineering
with independent review, trusted integration, Linux confinement, per-worker model and
reasoning settings, restart recovery, and a private web interface.

The long-term architecture extends this foundation toward stronger per-worker operating
system isolation, generalized projects, secure native mobile access, bounded Computer
Use, multiple isolated companies, inter-company collaboration, external identities such
as Telegram bots, and federation between independent BotSquad headquarters.

The design principle throughout is:

> prompts explain policy; trusted systems enforce authority.

---

## 1. The problem

Modern model runtimes can perform sophisticated individual tasks, but coordinating many
long-lived AI workers introduces a different class of engineering problem.

A collection of chat windows does not naturally answer:

- Who is responsible for an objective?
- Which worker is allowed to delegate it?
- What exactly was assigned?
- Which model execution produced a result?
- Is a worker idle, blocked, working, or waiting for approval?
- Did a task already run before a crash?
- Can a message accidentally authorize an action?
- Which repository and branch does an engineer own?
- Which commit did a reviewer actually inspect?
- Can two workers safely work concurrently?
- Can the human interrupt or reprioritize work?
- Can a bot claim a human approved something?
- How is company state recovered after a restart?
- How can the same organization run continuously rather than only while a laptop is open?

These are control-plane questions, not language-generation questions.

BotSquad treats them as first-class product and systems problems.

---

## 2. Design thesis

BotSquad is based on several core ideas.

### 2.1 A worker is not a model process

A worker is a durable organizational identity.

A worker may have:

- stable ID;
- human-readable name;
- role/title;
- mission;
- reporting relationship;
- capabilities;
- delegatable capabilities;
- AI profile;
- workspace/project binding;
- current state;
- tasks;
- messages;
- artifacts;
- execution history;
- runtime-thread binding.

The worker can remain idle indefinitely without a running model process.

### 2.2 Work is explicit

Messages and tasks are different objects.

A message communicates.

A task assigns bounded work.

This distinction prevents ordinary conversation from accidentally triggering expensive
or consequential execution.

### 2.3 Authority is outside the prompt

The model can request an action.

The model cannot expand its own permissions by writing text.

Authority is enforced by trusted BotSquad code and later by operating-system and
infrastructure boundaries.

### 2.4 Runtime sessions are replaceable

A Codex thread is a runtime binding for a worker, not the worker itself.

The durable source of organizational truth remains BotSquad.

### 2.5 Evidence is stronger than status prose

A claim such as "done" is weaker than:

- commit;
- diff;
- report;
- test output;
- immutable review;
- artifact;
- audit event;
- external receipt.

BotSquad therefore associates outputs with the worker, task, and execution that
produced them.

### 2.6 Idle agents should not consume models

The control plane knows when work exists.

Workers do not repeatedly invoke an AI model to discover an empty inbox.

---

## 3. System model

At a high level:

~~~text
Human
  |
  v
BotSquad control plane
  |
  +-- organization
  +-- messages
  +-- tasks
  +-- approvals
  +-- artifacts
  +-- executions
  +-- audit
  +-- projects
  +-- policy
  |
  v
dispatcher
  |
  v
runtime adapter
  |
  v
Codex App Server
~~~

The current implementation uses:

- TypeScript;
- Node.js 24;
- SQLite;
- static browser UI;
- HTTP/SSE;
- Codex App Server over private stdio;
- Git for product history;
- platform-specific engineering confinement.

---

## 4. Organizational model

BotSquad can represent a small hierarchy.

The validated reference organization is:

~~~text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    ├── Turing — CTO
    │   ├── Linus — Engineer
    │   ├── Ada — Engineer
    │   └── Grace — Reviewer
    └── Scout — Researcher
~~~

The hierarchy helps define:

- assignment authority;
- delegation ceilings;
- escalation;
- result routing;
- context summarization;
- responsibility.

Hierarchy alone is not a security boundary.

The trusted control plane decides what each role may actually do.

---

## 5. Execution model

BotSquad separates four concepts:

~~~text
Worker
Task
Execution
Runtime thread
~~~

### Worker

Persistent organizational identity.

### Task

Explicit work object.

A task contains concepts such as:

- creator;
- assignee;
- objective;
- acceptance criteria;
- constraints;
- state;
- parent relationship;
- artifacts;
- blocking reason.

### Execution

One attempt to perform work.

Executions provide:

- worker attribution;
- task attribution;
- start/end state;
- runtime metadata;
- effective AI profile;
- interruption/failure evidence.

### Runtime thread

Persistent model-session context associated with a worker.

One worker may eventually rotate among threads as context limits or runtime changes
require.

---

## 6. Event-driven scheduling

BotSquad dispatches workers only when work exists.

Typical flow:

~~~text
task queued
   |
   v
dispatcher claims eligible task
   |
   v
execution created
   |
   v
worker thread created/resumed
   |
   v
one bounded model turn
   |
   v
result/task transition
   |
   v
manager wake event if required
~~~

The current scheduler supports:

- one active execution per worker/task;
- two active executions globally;
- priority ordering;
- stable FIFO behavior within equal priority;
- pause-new-dispatch;
- explicit interrupt for active supported turns.

Priorities are:

~~~text
critical
high
normal
low
~~~

Priority does not bypass authority or concurrency controls.

---

## 7. Per-worker AI profiles

Prompt 03 makes runtime configuration part of the durable worker model.

Each worker may have:

- explicit model or inherited runtime/company default;
- reasoning effort or inherited default;
- execution priority;
- human lock.

Available model/reasoning settings come from the active Codex runtime/account.

BotSquad does not treat a hard-coded model list as authoritative.

Each new execution records the effective:

- model;
- reasoning effort;
- scheduling priority;
- runtime version/adapter.

Historical evidence is not rewritten when a worker's profile changes.

New threads use human-readable names such as:

~~~text
BotSquad · Atlas · CEO
BotSquad · Linus · Engineer
~~~

Durable IDs remain authoritative.

---

## 8. Managed engineering

The engineering workflow demonstrates that coordination can produce inspectable code
rather than only conversation.

Reference flow:

~~~text
Human
  |
  v
Atlas
  |
  v
Maya produces specification
  |
  v
Turing coordinates delivery
  |
  +------> Linus
  |
  +------> Ada
  |
  v
Grace independently reviews exact submissions
  |
  v
trusted integration runs combined acceptance tests
  |
  v
product main advances only on success
~~~

Important properties:

- engineer ownership is explicit;
- workers do not receive unrestricted Git shell authority;
- submission identifies exact commits;
- reviewer reads exact submitted evidence;
- reviewer cannot silently mutate the product;
- trusted integration runs acceptance tests;
- conflict/test failure prevents advancement;
- completed work is not replayed after restart.

---

## 9. Self-hosted Ubuntu headquarters

BotSquad's primary deployment is now an operator-controlled Ubuntu host.

~~~text
Human workstation
      |
      | SSH / SSH tunnel
      v
Ubuntu HQ
      |
      +-- botsquad.service
      +-- SQLite
      +-- dispatcher
      +-- Codex runtime
      +-- managed Git
      +-- Linux confinement
      +-- loopback web UI
~~~

Current production-style layout:

~~~text
/opt/botsquad
    application source/build

/var/lib/botsquad
    durable company state
    artifacts
    Codex service-account state
~~~

The BotSquad service runs non-root.

The initial UI remains bound to:

~~~text
127.0.0.1:4310
~~~

and is accessed through an SSH tunnel.

The server can live on:

- a cloud VPS;
- private VM;
- physical Ubuntu machine.

DigitalOcean is one example, not a product dependency.

---

## 10. Reproducible bootstrap

A central onboarding goal is that users should not manually reproduce a long Linux
configuration checklist.

The human supplies:

~~~text
supported Ubuntu host
+
working SSH alias
~~~

Then the checked-in bootstrap prompt and installer:

- inspect the host;
- install/update prerequisites;
- install pinned Node/Codex runtime;
- create non-root service identity;
- configure persistent directories;
- install systemd service;
- configure Linux confinement;
- configure swap where appropriate;
- run hardened tests;
- start the service;
- validate recovery;
- provide private UI access instructions.

The bootstrap is designed to be rerunnable and to preserve retained company state.

---

## 11. Linux confinement

Prompt 03 added a Linux engineering runner for Ubuntu 24.04 x86_64.

The current design combines:

- bubblewrap;
- user/mount/PID/network namespaces;
- read-only product/runtime mounts;
- hidden Git metadata;
- empty environment;
- seccomp filters;
- Node permission controls;
- systemd service restrictions;
- AppArmor user-namespace admission without disabling the global protection.

The runner fails closed.

There is no silent unrestricted fallback when confinement prerequisites fail.

Acceptance probes denied:

- filesystem escape;
- sensitive canary reads;
- network access;
- uncontrolled child processes;
- host signals;
- sibling allocation access;
- BotSquad source mutation;
- path/symlink escape.

The remaining limitation is important:

> arbitrary malicious processes already sharing the botsquad service UID are not yet
> isolated from one another.

This motivates Prompt 04.

---

## 12. Current validation evidence

Prompt 03 completed real Ubuntu acceptance.

Validated host:

~~~text
Ubuntu 24.04.4 x86_64
1 vCPU
2 GB RAM
approximately 50 GB disk
2 GiB configured swap
~~~

Acceptance included:

- 60/60 hardened deterministic tests;
- real Atlas → Scout → Atlas Ubuntu workflow;
- persistent thread resume;
- real-turn interruption;
- six-worker engineering;
- two overlapping Codex workers;
- exact-commit independent review;
- trusted integration;
- 8/8 integrated product tests;
- systemd restart without replay;
- host reboot recovery;
- repeat bootstrap;
- private browser access through SSH tunnel.

The real engineering run completed in approximately 146 seconds, with roughly
24.96 seconds of overlapping Linus/Ada model turns.

During the bounded real engineering workload:

- swap use was zero;
- available host memory remained above roughly 1.42 GiB;
- sampled CPU peaked around 74%.

This establishes a light-duty validated floor, not a universal capacity guarantee.

---

## 13. Human control and approvals

The current system supports:

- pause new dispatch;
- interrupt supported active executions;
- worker AI-profile updates;
- human locks;
- inspectable execution history.

A broader trusted approval system is intentionally deferred to Prompt 04.

The future rule is:

~~~text
bot requests protected action
        |
        v
trusted approval object
        |
        v
human reviews
        |
        +-- deny
        |
        +-- approve exact scope
                |
                v
        one-time trusted operation
~~~

A message saying "approved" is not approval.

---

## 14. Next security boundary: per-worker Unix identity

Prompt 04 will strengthen the current shared-service-UID architecture.

Target:

~~~text
root
└── narrow trusted provisioner

botsquad
└── control plane

botsquad-atlas
botsquad-nix
botsquad-turing
botsquad-linus
botsquad-ada
botsquad-grace
~~~

Nix becomes the ongoing DevOps worker.

Nix remains non-root and requests typed privileged operations through a minimal trusted
provisioner.

This enables:

- separate worker homes;
- separate worker processes;
- separate project clones;
- access revocation;
- retirement lifecycle;
- stronger containment.

---

## 15. Generalized projects

The current engineering flow intentionally uses a fixed bounded product.

The next project milestone will support real repositories through first-class:

- Project;
- Repository;
- Clone/workspace;
- Branch allocation;
- Submission;
- Review;
- Revision;
- Integration;
- Release policy.

This turns BotSquad from a validation environment into a general software-engineering
organization.

---

## 16. Native remote clients

The current web UI is private and requires an SSH tunnel for remote use.

The long-term client architecture separates:

~~~text
client API
~~~

from:

~~~text
network transport
~~~

Target:

~~~text
BotSquad Core
   |
   +-- versioned authenticated API
   |       +-- Web UI
   |       +-- iOS app
   |       +-- future clients
   |
   +-- reconnectable event stream
   +-- device identity
   +-- human authorization
~~~

The iOS app should be a native operator client, not a WebView or SSH terminal wrapper.

---

## 17. Secure remote mobile access

The native mobile goal is to operate BotSquad from an iPhone without manually creating
an SSH tunnel for ordinary use.

The HQ should remain private by default.

Potential transports:

- LAN/private network;
- operator-managed VPN;
- SSH tunnel for administration/recovery;
- future outbound BotSquad relay.

Relay concept:

~~~text
iPhone
   |
   v
relay
   ^
   |
outbound connection
   |
Ubuntu HQ
~~~

The relay is transport infrastructure.

It must not become:

- the company database;
- approval authority;
- source of organizational truth;
- holder of arbitrary worker credentials.

End-to-end encryption through the relay is a design goal pending a concrete reviewed
protocol.

---

## 18. Device identity and mobile authorization

A future native client should use explicit device pairing.

~~~text
HQ admin
   |
   v
short-lived pairing record
   |
   v
iPhone registers device identity
   |
   v
human confirms
   |
   v
revocable device credential
~~~

Device identity is separate from:

- human identity;
- company;
- worker;
- runtime account;
- HQ.

Mutating mobile requests require:

- authenticated human principal;
- paired device;
- operation authorization;
- idempotency;
- audit.

Protected approvals require exact one-time scoped approval objects.

---

## 19. Computer Use

Computer Use is intentionally not a default worker property.

Preferred model:

~~~text
worker
  |
  v
approved isolated browser/desktop environment
~~~

Capabilities should explicitly bound:

- apps;
- sites;
- filesystem;
- uploads/downloads;
- network;
- runtime;
- protected actions.

The human's personal workstation should be an exception, not the default autonomous
environment.

---

## 20. Multi-company architecture

A future BotSquad HQ may host multiple independent companies.

~~~text
Human owner
└── BotSquad HQ
    ├── Company A
    ├── Company B
    └── Company C
~~~

Company becomes a first-class domain/security boundary.

One company must not gain access to another company's:

- messages;
- tasks;
- repositories;
- credentials;
- approvals;
- artifacts;
- policies

merely because both live in the same database or use the same runtime account.

The architecture keeps separate:

~~~text
human owner
runtime account
BotSquad HQ
company
worker
runtime thread
execution
device
external identity
~~~

---

## 21. Company-to-company collaboration

Once company isolation exists, explicit collaboration becomes possible.

~~~text
Company A
   |
   | explicit trusted connection
   v
Company B
~~~

The connection determines:

- allowed communication;
- allowed task types;
- artifact sharing;
- approval requirements;
- rate limits;
- lifecycle/revocation.

A company can request work from another company without gaining direct access to the
other company's internal organization.

---

## 22. External identities and Telegram

Workers may eventually have optional external identities.

~~~text
Worker
  |
  +-- internal BotSquad identity
  |
  +-- optional external identities
         +-- Telegram bot
         +-- email
         +-- future providers
~~~

External identity is not worker identity.

Provider credentials remain behind trusted BotSquad integration code.

Telegram can serve as:

- conversational mobile access;
- company/worker external identity;
- notification channel;
- one possible company-to-company transport.

Telegram is not the internal BotSquad message bus and is not the authority layer.

---

## 23. Cross-HQ federation

Longer term, independent BotSquad installations may communicate.

~~~text
HQ A
  |
  | authenticated federation
  v
HQ B
~~~

A native federation protocol should provide:

- authenticated peer identity;
- company identity;
- replay protection;
- deduplication;
- revocation;
- bounded loops;
- rate limiting;
- artifact integrity;
- explicit connection policy.

Federation should not expose internal databases or derive authority from free-form
agent text.

---

## 24. Runtime-account independence

BotSquad should not assume:

~~~text
one runtime account == one company
~~~

or:

~~~text
one runtime account == one HQ
~~~

A human may operate several companies or HQs using runtime accounts according to the
runtime provider's supported account and usage rules.

Runtime-account capacity is a resource concern.

Company identity and company security are BotSquad concerns.

The two should remain separate.

---

## 25. Security philosophy

BotSquad's security model is layered.

### Control-plane enforcement

Trusted code decides:

- who may assign;
- who may hire;
- what capabilities are allowed;
- which task may run;
- which project belongs to whom;
- whether approval is required.

### Runtime confinement

Model runtime receives only bounded tools/context.

### Operating-system confinement

Linux/macOS boundaries limit what engineering test processes can access.

### Future worker identity

Separate Unix accounts further reduce same-UID exposure.

### External integration boundaries

Credentials for infrastructure, Telegram, remote devices, and future services remain
outside normal worker prompts.

### Human approvals

Consequential protected operations require trusted human authorization.

No single prompt is treated as the security boundary.

---

## 26. Reliability philosophy

BotSquad assumes:

- processes crash;
- network requests time out;
- models fail;
- servers restart;
- clients reconnect;
- messages may be duplicated;
- users may interrupt work.

Therefore:

- state is durable;
- claims are transactional;
- retries are bounded;
- consequential operations should be idempotent;
- interrupted work is inspected;
- completed work is not blindly replayed;
- runtime sessions are recoverable bindings, not organizational truth.

---

## 27. Why self-hosting matters

Self-hosting provides a useful architectural property:

> the operator controls the coordination plane and durable company state.

This does not mean every computation is local.

Model inference may be provided by an external runtime.

Future relay/push services may assist connectivity.

But the canonical company/task/worker/audit state remains under the operator's BotSquad
control plane unless a later architecture explicitly changes that boundary.

---

## 28. Why a dedicated control plane matters

Email, chat applications, and files can carry messages, but they do not naturally
provide:

- task authority;
- worker identity;
- execution state;
- concurrency control;
- approval semantics;
- retry/recovery;
- model runtime bindings;
- repository ownership;
- artifact provenance;
- reviewer/integration gates.

BotSquad makes those concepts first-class.

---

## 29. Roadmap

The canonical roadmap is:

| Prompt | Milestone |
| --- | --- |
| 01 | Persistent organization |
| 02 | Managed engineering |
| 03 | Ubuntu HQ |
| 04 | Nix, approvals, per-worker Linux identity |
| 05 | Generalized projects/repositories |
| 06 | Stable authenticated remote-client API |
| 07 | Native iOS Remote MVP |
| 08 | Bounded Computer Use |
| 09 | Multi-company support |
| 10 | Company-to-company collaboration |
| 11 | External identities and Telegram |
| 12 | Cross-HQ federation |
| 13+ | Broader company operations |

See the full Roadmap document for dependencies and acceptance themes.

---

## 30. What BotSquad is not yet

The current validated system does not yet provide:

- per-worker Unix accounts;
- Nix DevOps;
- general trusted approval grants;
- arbitrary repository/project lifecycle;
- native remote API;
- iOS client;
- Computer Use;
- multi-company runtime;
- company federation;
- Telegram integration;
- cross-HQ federation;
- autonomous spending;
- arbitrary production deployment.

These are roadmap items, not current claims.

---

## 31. Long-term vision

The long-term architecture is a portfolio of independently governed AI organizations
that can operate continuously while remaining observable and bounded by human authority.

A possible future topology:

~~~text
Human owner
   |
   +-- iPhone / Web / desktop clients
   |
   +-- BotSquad HQ A
   |      +-- Company A
   |      +-- Company B
   |
   +-- BotSquad HQ B
          +-- Company C

Companies
   +-- persistent workers
   +-- projects
   +-- isolated computers
   +-- external identities
   +-- infrastructure
   +-- approvals
   +-- other company connections
~~~

The goal is not unrestricted autonomy.

The goal is a system in which increasingly capable AI organizations can do useful work
while authority, evidence, security boundaries, and human control remain explicit.

---

## 32. Project principles

1. Human authority is explicit.
2. Messages do not manufacture permissions.
3. Tasks make work explicit.
4. Idle workers do not consume models.
5. Durable identities outlive runtime sessions.
6. Trusted code enforces policy.
7. Evidence outranks confident prose.
8. Concurrency requires ownership.
9. Recovery must not blindly replay side effects.
10. Credentials stay behind trusted boundaries.
11. New capabilities are bounded by default.
12. External connectivity must not silently weaken self-hosting.
13. Company boundaries are explicit.
14. Mobile clients are clients, not alternate sources of truth.
15. The simplest architecture that proves the next capability wins.

---

## 33. References within the repository

Primary current-state references:

- [README](../README.md)
- [Current State](operations/CURRENT_STATE.md)
- [Access and Operations](operations/ACCESS_AND_OPERATIONS.md)
- [System Architecture](architecture/SYSTEM_ARCHITECTURE.md)
- [Project Vision](product/PROJECT_VISION.md)
- [AI Organization Model](product/AI_ORGANIZATION_MODEL.md)
- [Ubuntu HQ and Bootstrap Model](product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Prompt 03 Ubuntu Validation](validation/prompt-03-ubuntu.md)
- [Decision index](decisions/README.md)

Future architecture references:

- [Roadmap](product/ROADMAP.md)
- [Native iOS Remote Client and Secure Remote Access](product/IOS_REMOTE_CLIENT.md)
- [Computer Use Model](product/COMPUTER_USE_MODEL.md)
- [Multi-Company and Federation Model](product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)

Historical evidence:

- [Prompt 01 plan](exec-plans/prompt-01.md) / [validation](validation/prompt-01.md)
- [Prompt 02 plan](exec-plans/prompt-02.md) / [validation](validation/prompt-02.md)
- [Prompt 03 plan](exec-plans/prompt-03.md) / [validation](validation/prompt-03-ubuntu.md)
- [SquadStatus case study](examples/squadstatus-case-study.md)

---

## Conclusion

BotSquad treats multi-agent autonomy as an organizational systems problem.

Language models provide reasoning and execution capability, but a functioning AI
organization also requires durable identity, explicit work, authority boundaries,
scheduling, isolation, review, evidence, recovery, and human governance.

The first three milestones demonstrate that this model is practical:

- persistent AI workers can coordinate through a durable control plane;
- real engineers can work concurrently under bounded ownership and independent review;
- the organization can operate continuously on a small self-hosted Ubuntu server with
  real model execution, confinement, restart recovery, and per-worker AI profiles.

The remaining roadmap systematically expands that foundation rather than bypassing it:
stronger Unix isolation, generalized projects, secure native clients, bounded computer
control, multiple companies, external identities, and federation.

BotSquad's central architectural commitment remains:

> Increasing capability should not require surrendering observability, provenance,
> recoverability, or human authority.
