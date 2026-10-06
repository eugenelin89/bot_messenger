# BotSquad — Project Vision

**Status:** Product vision; Prompts 01–10 and WE-01 complete; Prompt 11 implementation deployed; live gate pending
**Updated:** 2026-10-05

For a fresh planning session, read [Project Memory](../PROJECT_MEMORY.md), then verify
current repository status. [Decision 017](../decisions/decision_017_single_company_first.md)
and the [canonical roadmap](ROADMAP.md) define the accepted single-company-first priority.

## One-sentence vision

Build a self-hosted **intelligent company** where persistent AI employees can understand broad or specific human mandates, communicate and deliberate as a team, choose and execute bounded work, learn from outcomes, and adapt strategy from an always-on operator-controlled headquarters.

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

## Product north star — intelligent employees operating a company

The long-term goal is not a collection of agents arranged into a fixed assembly line.

The human may provide a broad objective such as:

~~~text
"Increase sustainable profit using the resources and authority I have approved."
~~~

or a specific mandate such as:

~~~text
"Manage and market Asymmetri Motion. Improve the product, adoption and revenue."
~~~

Both should be natural inputs.

The organization should decide what it needs to learn, which employees should participate,
what should be discussed, what Projects or experiments should run, what evidence matters,
and when the strategy should change. The human should not need to manually orchestrate
every internal handoff.

The target company loop is:

~~~text
mandate
  -> understand situation
  -> research / discuss
  -> decide
  -> execute bounded work
  -> review
  -> measure outcomes
  -> learn
  -> continue / iterate / pivot / stop / scale
  -> persist next follow-up / review
~~~

Hierarchy remains important for responsibility and authority, but should not restrict
who can exchange ideas. Strategic intelligence should become broad while operational
authority stays explicitly enforced.

See [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md) and
[Decision 016](../decisions/decision_016_intelligent_company_model.md).

## One useful operating company before many companies

The accepted priority is **one AI company that can actually operate a real business before
multiple companies or federation**. A technically impressive network of agents is not a
substitute for useful, accountable business operation.

Prompt 07 includes context rollover: persistent employees and BotSquad conversations
outlive replaceable provider threads/sessions. Prompt 09 includes a minimal durable
one-time/recurring company clock and Asymmetri Motion as the canonical specific-product
acceptance case, alongside a broad-objective scenario. Prompt 11 adds the smallest useful
business evidence, approved external-action and scheduled outcome-review capabilities.

Asymmetri Motion is reference configuration and evidence, not a hard-coded engine
assumption. A read-only/sanitized/fixture-based Prompt 09 test can prove organization
behavior, but only a separately authorized live pilot can prove external business
operation. Require real receipts, observations, at least two operating cycles and honest
limitations before reconsidering multi-company/federation. Do not invent revenue gains,
credentials or permission to publish merely to pass acceptance.

See [Single-Company Business Operations](SINGLE_COMPANY_OPERATIONS.md),
[Decision 017](../decisions/decision_017_single_company_first.md) and
[Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

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

This is an illustrative handoff, not a required employee roster or scripted acceptance
transcript. Real organization acceptance leaves meaningful internal choices to the team.

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
- resumable and, when necessary, replaceable runtime threads/sessions;
- queued and active tasks;
- current status;
- execution history;
- messages and artifacts it produced.

The same core worker identity should survive application restarts and runtime-context
replacement. BotSquad Conversation IDs, provider session IDs and execution attempts are
distinct. Bounded source-linked handoffs preserve decisions, unresolved questions and
active obligations without copying unauthorized private context. Durable records remain
authoritative; summaries are derived, fallible context. Reconcile an in-flight operation
before rollover rather than blindly replaying its effects.

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

### G2 — Make collaboration and handoffs explicit

Workers should communicate and deliberate naturally, while executable handoffs use durable task records instead of relying on vague chat context.

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
It should also persist and schedule bounded authorized reviews/follow-ups. Ordinary code
checks clocks and conditions; models do not poll an empty inbox. Scheduling belongs to
Prompt 09's company loop, not a distant post-federation feature.

### G4 — Make failures recoverable

Application restart, worker crash, context rollover, duplicate events, or transient runtime
failure should not silently lose work or repeat consequential side effects. Unknown
provider outcomes must be reconciled or visibly blocked before another attempt.

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

## Multi-company direction — deferred

BotSquad may eventually support several independent companies at once. Under Decision 017,
this is deferred until a useful single-company operating pilot is proven and scale is
justified. It is not a prerequisite to business metrics, email/support, publishing or
other needed narrow adapters.

One self-hosted HQ may later contain:

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

See [Multi-Company and Federation Model](MULTI_COMPANY_AND_FEDERATION.md), [External Identities and Telegram Integration](EXTERNAL_IDENTITIES_AND_TELEGRAM.md), [Decision 010](../decisions/decision_010_multi_company_federation.md), and [Decision 017](../decisions/decision_017_single_company_first.md).

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

The existing-product counterpart uses Asymmetri Motion: Prompt 09 proves a bounded
reference operating loop; Prompt 11 requires an approved live operating action, observed
results and repeated scheduled follow-up. Stage C financial authority remains separately
reviewed future scope, not an automatic part of either milestone.

## Success metrics for the platform

Early success is technical and operational rather than financial. The later single-company
pilot also measures actual business observations without guaranteeing improvement.

### Reliability

- messages are not lost;
- tasks are not duplicated;
- agent restart or context rollover does not erase ownership/history;
- duplicate dispatch does not repeat already-completed work;
- artifacts remain attributable to their producing execution;
- due reviews survive restart while cancelled/revoked work stays stopped.

### Coordination

- the human can speak directly with the relevant specialist;
- workers can ask questions and challenge one another across hierarchy;
- a working group can improve a proposal through critique and synthesis;
- one bot can assign work to another where authority permits;
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
- repeated work is minimized;
- usage/costs and remaining supervision are reported where measurable, with unknowns explicit.

### Useful business operation

- approved external actions have receipts and observed results;
- metrics have sources, periods, definitions and baselines;
- at least two operating cycles show a scheduled follow-up and a justified next decision;
- simulated evidence and actual business outcomes are never conflated;
- a successful tool call is not mistaken for proven customer or revenue impact.

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
external repositories and external actions remain future work at that historical milestone.

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
9. **One useful operating company before multiple companies or federation.**
10. **Employee identity and institutional knowledge outlive replaceable runtime contexts.**

## Current deployment foundation — Ubuntu headquarters (Prompt 03, extended in Prompt 04)

Prompt 03 established the accepted deployment direction: an always-on Ubuntu headquarters installed from a fresh supported server through a checked-in Codex bootstrap prompt. Prompt 04 kept that topology and added trusted worker infrastructure on top of it.

The intended onboarding contract is deliberately small:

1. the user creates a fresh Ubuntu server;
2. configures local SSH so an alias such as `ssh my-botsquad-server` succeeds;
3. runs the repository's bootstrap Codex prompt;
4. Codex installs, configures and validates BotSquad on the remote host;
5. the user opens the loopback-only BotSquad UI through an SSH tunnel.

Prompt 01/02's local macOS topology remains a development/regression path and historical validation source, not the intended permanent headquarters.

Prompt 03 implemented persisted per-worker model, reasoning, priority and human locks with runtime-discovered choices, immutable execution provenance and friendly thread names. Ubuntu service, Linux confinement, real research and concurrent engineering, and recovery checks passed at that milestone.

Prompt 04 then implemented and validated Nix as the ongoing DevOps worker for bounded worker identity
and clone lifecycle, exact-scope trusted human approvals, private per-worker Unix identities,
and the narrow root provisioner. The one-time bootstrap installs BotSquad and the root
provisioner before Nix exists. General host administration remains outside Nix's authority. Prompt 05 adds trusted
human-defined Projects, bounded local/imported/GitHub repositories, immutable write scopes,
named recipes, revision/review rounds, durable integration and approval-gated remote
publication. Nix retains only its bounded identity/clone role; remote Git is non-root
application work. Archive reduces clone access and preserves evidence. See
[Decision 014](../decisions/decision_014_generalized_projects.md).

See [Ubuntu HQ and Bootstrap Model](UBUNTU_HQ_AND_BOOTSTRAP.md), [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md), and [Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md).

## Conversation-first collaboration

Prompt 07 implements direct human↔worker and bounded worker↔worker conversations:
persistent conversation identity, participant-oriented history, explicit bounded reply
turns that can wake the intended worker, and clear separation from passive messages and
Tasks. The human can talk directly to Maya, Turing, engineers, Grace or Nix without
creating an assignment. The browser owner can inspect these transcripts; unrelated
workers cannot read them merely because they know a conversation ID.

It also establishes context continuity: safe replacement with a fresh provider session
preserves employee/conversation identity, source references and pending work. Context
retrieval is scoped, session lineage is retained, stale callbacks are rejected, and
unknown provider outcomes block work for inspection. Memory is bounded and source-backed,
not perfect recall. See [actual acceptance](../validation/prompt-07-conversations-continuity.md)
and [controls and limits](../architecture/CONVERSATIONS_AND_CONTINUITY.md).
Prompt 08 and later operating loops reuse this foundation.

Prompt 08 then adds collaborative AI working groups.

BotSquad should evolve beyond a purely delegation-shaped organization.

The reporting hierarchy remains important for responsibility, assignment authority and
security, but workers should also be able to participate in explicit, bounded
cross-functional discussions. A product decision may benefit from Maya, Turing, an
engineer and Grace challenging one another before anyone receives implementation work.

The desired model is:

~~~text
Hierarchy
  -> who owns the decision
  -> who may assign work
  -> who may exercise authority

Working group
  -> who should reason together
  -> proposals / critique / alternatives
  -> synthesis and documented dissent
~~~

A future discussion/working-group object should schedule bounded model turns, persist the
human-readable transcript, enforce participant/round/time budgets, permit human
intervention, and finish with an inspectable synthesis artifact. Discussion messages
must not silently become Tasks or expand authority; any follow-on execution still enters
through normal trusted assignment.

This capability is intentionally **not** implemented by making ordinary worker messages
wake recipients. The current communication-is-not-execution invariant remains.

Direct conversations/continuity in Prompt 07 and working groups in Prompt 08 lead into
Prompt 09's strategic loop, durable company clock and Asymmetri Motion reference test.

## Native mobile operator client — deferred

BotSquad should eventually support a native iPhone/iPad application as a first-class
operator client, but it is no longer the next milestone. The private browser over SSH
tunnel is sufficient while conversation and useful single-company operation are proven.

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

Prompt 06 implements the [stable v1 protocol](../api/CLIENT_API_V1.md), durable HQ/device
identity, explicit local pairing, Ed25519 challenge authentication, fixed capabilities,
idempotent mutations and reconnectable events. The browser API remains separate. Native
app UI, no-tunnel transport, protected mobile approvals and push remain future work.

Mobile devices must be explicitly paired, independently revocable, attributable to a
human principal, and protected with device-specific credentials. Push notifications
should carry minimal non-sensitive metadata and fetch authoritative detail only after
authenticated app connection.

See [Native iOS Remote Client and Secure Remote Access](IOS_REMOTE_CLIENT.md) and
[Decision 012](../decisions/decision_012_ios_remote_client.md).

## Canonical prompt roadmap

The earlier M1–M7 capability list above is the project's original capability framing.
The current implementation plan is tracked by numbered prompts in the
[BotSquad Roadmap](ROADMAP.md), which is the single sequence/status authority.

Prompts 01–06 are complete. The accepted future delivery order is:

| Prompt | Milestone | Status |
| --- | --- | --- |
| 07 | Direct conversations, worker interaction and runtime-context continuity | Complete |
| 08 | Collaborative working groups and deliberation | Complete |
| 09 | Strategic company loop, minimal durable scheduler and Asymmetri Motion reference acceptance | Complete |
| 10 | Bounded Computer Use | Complete |
| 11 | Single-company business operations and measured Asymmetri Motion pilot | In progress; live gate pending |
| — | Multi-company, company collaboration, generic Telegram identities and federation | Deferred / unnumbered |
| — | Native iOS / no-tunnel mobile access | Deferred |
| — | Broader business, infrastructure and treasury platforms | Later / scope by demonstrated need |

Decision 017 explicitly supersedes the former future 11–14 assignments and the practice of
putting all useful business integrations after federation. Completed history is unchanged.
Practical single-company usefulness and its evidence gate precede organizational scale;
direct API adapters need not depend technically on Computer Use. No new capability or
external action is claimed implemented by this documentation change.
