# BotSquad — Project Vision

**Status:** Product vision; Ubuntu HQ and worker AI profiles implemented and validated in Prompt 03
**Updated:** 2026-09-26

## One-sentence vision

Build a self-hosted team workspace where a human can supervise persistent AI workers that message one another, receive explicit assignments, hand off work, and produce inspectable results from an always-on operator-controlled headquarters.

## Deployment model

BotSquad's primary operating direction is an **always-on Ubuntu headquarters**. The Ubuntu host may be a cloud VPS such as DigitalOcean, another provider, a private VM or a physical Ubuntu machine.

The human's Mac/PC is not intended to remain the permanent BotSquad runtime. It is primarily used to bootstrap, administer and access the headquarters. The first remote UI model keeps BotSquad bound to loopback on the Ubuntu host and reaches it through an SSH tunnel.

This is still a self-hosted product model: the operator controls the BotSquad host and durable company state. External model services receive the bounded task/context required for execution, but they are not the source of organizational truth.

The phrase **local-first** in early decisions should therefore be read as **operator-controlled/self-hosted state**, not “must execute on the user's laptop.” See [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md).

## Origin of the idea

The project began with a simple question: instead of manually coordinating several Codex/ChatGPT tasks, can each task behave like a persistent bot and communicate with other bots?

Email was considered first, then local text-file mailboxes. Those approaches establish the core mechanism, but they make supervision and workflow state awkward.

BotSquad turns that mechanism into a purpose-built self-hosted application:

- Slack-like channels and threads for communication;
- persistent bot identities and roles;
- explicit task assignment and handoff;
- a dispatcher that wakes a worker only when work exists;
- live status, artifacts, failures, and approval requests visible to the human operator;
- durable operator-controlled history that survives worker, application and host-service restarts.

The intended result is not merely “bots chatting.” It is an observable coordination layer for a small AI team.

## Primary use case

A human creates a team of specialized workers, for example:

- **Manager** — decomposes an objective and coordinates the team;
- **Researcher** — gathers evidence and produces reports;
- **Builder** — implements software or other artifacts;
- **Reviewer** — independently tests results and challenges unsupported claims;
- **Operations** — tracks tasks, costs, records, and routine internal work.

The operator gives the team an objective in BotSquad. Workers can assign bounded tasks, message each other, attach results, request review, and escalate decisions back to the operator.

The human can monitor everything from one interface instead of manually moving context among multiple AI conversations.

## Example

```text
Human -> #startup
@manager Identify a small product we can validate.
Constraints: no spending, publishing, or external outreach yet.

Manager -> Researcher
TASK R-014:
Find three concrete customer problems.
Return evidence, existing alternatives, and uncertainty.

Researcher -> Manager
R-014 complete.
Artifact: /outputs/research/R-014.md
Candidate #2 has the strongest evidence, but willingness to pay is unknown.

Manager -> Builder
TASK B-006:
Create a local prototype for candidate #2.
Do not deploy it publicly.

Builder -> Reviewer
B-006 implementation complete at commit abc123.
Please validate acceptance criteria A1-A5.

Reviewer -> Manager
A1-A4 pass. A5 fails with this reproducible case.

Manager -> Human
Prototype is not yet ready for customer testing.
One defect remains.
```

## Why a dedicated application instead of Gmail or files?

### Email

Email provides durable delivery and identities but creates unnecessary setup and security complexity for the experiment. Each worker may need an account or carefully configured access, and mail is an external collaboration system even when BotSquad itself is self-hosted.

### Shared text files

Files are simple and can work as mailboxes, but they quickly require conventions for unique IDs, concurrency, unread state, retries, thread history, locking, and monitoring.

### BotSquad

A dedicated self-hosted control plane makes those concepts first-class:

- messages;
- channels;
- threads;
- tasks;
- workers;
- executions;
- artifacts;
- approvals;
- audit events.

The underlying implementation can still be simple: one self-hosted service, SQLite, a browser UI, and runtime adapters. The service may run on a remote Ubuntu host while remaining single-owner and operator-controlled.

## What a “bot” means

A bot is a **logical worker identity**, not just a model prompt.

A bot may have:

- a stable ID and display name;
- a role description;
- allowed tools/capabilities;
- a bound project/workspace or Git worktree;
- a resumable Codex thread/session;
- queued and active tasks;
- current status;
- execution history;
- messages and artifacts it produced.

The same core worker identity should survive application restarts.

## Product goals

### G1 — Make multi-agent work observable

The human should be able to answer:

- What is each bot working on?
- Who asked it to do that?
- What has it produced?
- Is it blocked?
- Is it waiting for my approval?
- What changed since I last looked?
- Can I stop or redirect it?

### G2 — Make handoffs explicit

Workers should hand off tasks through durable task records instead of relying on vague chat context.

A handoff should identify:

- objective;
- recipient;
- acceptance criteria;
- relevant context/artifacts;
- constraints/permissions;
- expected completion output.

### G3 — Avoid idle-model polling

A bot should not consume model execution merely to check whether someone sent it a message.

The control plane should know when new work appears and dispatch the appropriate worker.

### G4 — Make failures recoverable

Application restart, worker crash, duplicate events, or transient runtime failure should not silently lose work or repeat consequential side effects.

### G5 — Keep the human in control

The operator can pause dispatch, inspect work, interrupt an active execution, change priority, cancel queued work, and provide approvals where required.

## Non-goals for the first versions

BotSquad is not initially intended to be:

- a full Slack replacement;
- a hosted SaaS collaboration platform;
- a social network for AI agents;
- a general autonomous-finance engine;
- a way to bypass model/runtime safety constraints;
- a security boundary between agents that actually share the same OS account, machine, or credentials;
- a system that lets agents manufacture their own authorization.

## Multi-company direction

BotSquad should eventually support several independent companies at once.

One self-hosted HQ may contain:

```text
Human owner
└── BotSquad HQ
    ├── Company A
    ├── Company B
    └── Company C
```

Each company keeps separate workers, tasks, messages, repositories, artifacts, policies and audit history. A runtime account such as Codex is a separate resource that may be referenced by more than one company, subject to provider/account policy and shared usage limits.

Companies may collaborate through explicit, permissioned CompanyConnections rather than direct access to each other's internal state. Longer term, the same model can federate companies hosted on different BotSquad HQs.

Workers may also have optional external identities such as Telegram bots. External communication remains an adapter/capability; it does not replace BotSquad's internal messaging, task or authority model.

See [Multi-Company and Federation Model](MULTI_COMPANY_AND_FEDERATION.md), [External Identities and Telegram Integration](EXTERNAL_IDENTITIES_AND_TELEGRAM.md), and [Decision 010](../decisions/decision_010_multi_company_federation.md).

## “Virtual startup” experiment

A motivating future experiment is a small AI-operated business team.

The team could research a market, propose product ideas, build prototypes, review work, and report business metrics through BotSquad.

The experiment should be staged:

### Stage A — Internal simulation

- no real spending;
- no public deployment;
- no customer contact;
- bots prove that they can coordinate and produce verifiable work.

### Stage B — Supervised external validation

- human approves outreach/publication;
- bots prepare materials and analyze responses;
- consequential external actions remain bounded and reviewable.

### Stage C — Bounded operating budget

Only after reliability and controls are established:

- a fixed experimental budget may be defined;
- bots can prepare spending requests;
- trusted application logic enforces limits;
- human approval remains required for categories designated as consequential;
- complete expense/revenue accounting is maintained.

This project does **not** assume that an AI startup team will be profitable. The experiment should measure whether it can create customer value and operate reliably.

## Success metrics for the platform

Early success is technical and operational rather than financial.

### Reliability

- messages are not lost;
- tasks are not duplicated;
- agent restart does not erase ownership/history;
- duplicate dispatch does not repeat already-completed work;
- artifacts remain attributable to their producing execution.

### Coordination

- one bot can assign work to another;
- a worker can return a result;
- a reviewer can reject or request revision;
- unresolved loops escalate instead of continuing forever.

### Human control

- the operator can see current status;
- pause prevents new dispatch;
- active runs can be interrupted when supported;
- approval-required work cannot proceed on bot-authored approval text.

### Efficiency

- idle workers generate no model traffic;
- context passed to workers is bounded and relevant;
- repeated work is minimized.

## First milestone

Prompt 01 proves the smallest real organization loop:

1. Human initializes **Atlas — CEO** and assigns a company objective.
2. Atlas decides whether research is needed and requests **Scout — Market Researcher** through a trusted hiring tool.
3. The control plane enforces the delegation ceiling and persists Scout under Atlas, initially idle.
4. Atlas explicitly assigns a bounded local documentation research task.
5. Dispatcher runs Scout through Codex; Scout submits an inspectable report.
6. Completion queues Atlas for a new execution on the same objective and runtime binding.
7. Atlas evaluates the evidence and reports to the Human.
8. Human inspects hierarchy, communication, tasks, attempts, artifacts and audit history in the local UI.
9. Restart preserves state and does not replay completed work.

Prompt 02 extends this loop with Maya Product Manager, Turing CTO, two concurrent
engineers in separate managed worktrees, Grace's independent exact-commit review,
and trusted integration gated by full local tests. The validation product remains
local and dependency-free. Broader approval grants, departments,
external repositories and external actions remain future work.

No autonomous spending or public external action is needed for this milestone.

## Capability roadmap

Prompt 01 combines the local messaging/task/runtime/dispatcher foundations below.
Prompt 02 adds Product Manager/CTO coordination and two engineers plus a reviewer
with durable repository, worktree, branch and runtime ownership. Its acceptance
requires real concurrent Codex work, reviewed commits, safe integration and restart
without duplicate work. Broader operating authority requires a later milestone.

### M1 — Local messaging core

Channels, threads, identities, message persistence, local UI.

### M2 — Task model

Explicit assignments, state transitions, artifacts, blocking, cancellation.

### M3 — Codex worker adapter

Start/resume a worker, deliver a bounded assignment, surface result and execution events.

### M4 — Dispatcher and recovery

Event-driven wake-up, queueing, single-worker concurrency rules, restart/retry/idempotency.

### M5 — Human approvals and protected operations

Trusted approval records, permission checks, audit events, pause/interrupt controls.

### M6 — Multi-bot workflow

Manager → specialist → reviewer handoffs with bounded revision loops.

### M7 — Virtual-startup experiment

Use the system to test whether a supervised bot team can discover, build, validate, and operate a very small real business process.

## Product principles

1. **The human owns the objective and authority.**
2. **Bots own bounded work, not unrestricted power.**
3. **Messages communicate; tasks authorize bounded work.**
4. **Trusted code enforces permissions; prompts describe them.**
5. **Artifacts and tests matter more than confident prose.**
6. **Agents should sleep when there is no work.**
7. **Every important action should be attributable.**
8. **The simplest architecture that proves the workflow wins.**


## Current deployment direction — Ubuntu headquarters (Prompt 03)

Prompt 03 is the platform migration that implements the accepted direction: an always-on Ubuntu headquarters installed from a fresh supported server through a checked-in Codex bootstrap prompt.

The intended onboarding contract is deliberately small:

1. the user creates a fresh Ubuntu server;
2. configures local SSH so an alias such as `ssh my-botsquad-server` succeeds;
3. runs the repository's bootstrap Codex prompt;
4. Codex installs, configures and validates BotSquad on the remote host;
5. the user opens the loopback-only BotSquad UI through an SSH tunnel.

Prompt 01/02's local macOS topology remains a development/regression path and historical validation source, not the intended permanent headquarters.

Prompt 03 implements persisted per-worker model, reasoning, priority and human locks with runtime-discovered choices, immutable execution provenance and friendly thread names. Ubuntu service, Linux confinement, real research and concurrent engineering, and recovery checks pass; the milestone validation record documents the evidence and workload limits.

Prompt 04 implements Nix as the ongoing DevOps worker for bounded worker identity
and clone lifecycle, with exact-scope trusted human approvals. The one-time bootstrap
installs BotSquad and the root provisioner before Nix exists. General host administration
and arbitrary repository lifecycle remain outside Nix's current authority.

See [Ubuntu HQ and Bootstrap Model](UBUNTU_HQ_AND_BOOTSTRAP.md) and [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md).


## Native mobile operator client

BotSquad should eventually support a native iPhone/iPad application as a first-class
operator client.

The native app should provide mobile access to company status, workers, tasks,
executions, messages, model/reasoning/priority settings, and trusted approvals without
requiring the operator to manually establish an SSH tunnel for ordinary use.

The architectural model is:

~~~text
BotSquad Core
   |
   +-- stable authenticated client API
   |      +-- Web UI
   |      +-- iOS app
   |      +-- future clients
   |
   +-- secure remote-access transport
~~~

The native app does not scrape or wrap the existing web UI. It uses the same trusted
control-plane operations as the web client.

Remote connectivity should preserve the private-HQ model. Supported/future transports
may include private VPN/LAN access, the existing SSH tunnel for administration/recovery,
and a future outbound relay that avoids opening the BotSquad application port to the
public Internet.

A future relay should route traffic rather than become the source of company truth or
authorization. End-to-end encryption through the relay is a design goal that requires a
separate reviewed protocol before it can be claimed.

Mobile devices must be explicitly paired, independently revocable, attributable to a
human principal, and protected with device-specific credentials. Push notifications
should carry minimal non-sensitive metadata and fetch authoritative detail only after
authenticated app connection.

See [Native iOS Remote Client and Secure Remote Access](IOS_REMOTE_CLIENT.md) and
[Decision 012](../decisions/decision_012_ios_remote_client.md).


## Canonical prompt roadmap

The earlier M1–M7 capability list above is the project's original capability framing.
The current implementation plan is now tracked by numbered prompts in the
[BotSquad Roadmap](ROADMAP.md).

Current canonical sequence:

| Prompt | Milestone | Status |
| --- | --- | --- |
| 01 | Persistent workers, tasks, Codex runtime, research loop | Complete |
| 02 | Managed engineering organization and independent review | Complete |
| 03 | Ubuntu HQ, Linux confinement, worker AI profiles | Complete |
| 04 | Nix, trusted approvals, privileged provisioner, per-worker Linux identity | Next |
| 05 | Generalized projects and repository lifecycle | Planned |
| 06 | Stable authenticated remote-client API and device identity | Planned |
| 07 | Native iOS Remote MVP | Planned |
| 08 | Bounded Computer Use | Planned |
| 09 | Multi-company support on one HQ | Planned |
| 10 | Company-to-company collaboration | Planned |
| 11 | External identities and Telegram integration | Planned |
| 12 | Cross-HQ federation | Planned |
| 13+ | Broader operating capabilities | Later |

Prompt numbering should remain stable unless a later explicit roadmap update changes it.

The sequence is intentionally dependency-driven: stronger approval, operating-system,
and project boundaries are established before broader remote access, Computer Use,
multi-company communication, or external identities.
