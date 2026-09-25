# BotSquad — Project Vision

**Status:** Initial product definition  
**Date:** 2026-09-24

## One-sentence vision

Build a local-first team workspace where a human can supervise multiple AI workers that message one another, receive explicit assignments, hand off work, and produce inspectable results.

## Origin of the idea

The project began with a simple question: instead of manually coordinating several Codex/ChatGPT tasks, can each task behave like a persistent bot and communicate with other bots?

Email was considered first, then local text-file mailboxes. Those approaches establish the core mechanism, but they make supervision and workflow state awkward.

BotSquad turns that mechanism into a purpose-built local application:

- Slack-like channels and threads for communication;
- persistent bot identities and roles;
- explicit task assignment and handoff;
- a dispatcher that wakes a worker only when work exists;
- live status, artifacts, failures, and approval requests visible to the human operator;
- a durable local history that survives agent and application restarts.

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

Email provides durable delivery and identities but creates unnecessary setup and security complexity for a local experiment. Each worker may need an account or carefully configured access, and mail is an external system even when the agents and repositories are local.

### Shared text files

Files are simple and can work as mailboxes, but they quickly require conventions for unique IDs, concurrency, unread state, retries, thread history, locking, and monitoring.

### BotSquad

A local messaging application makes those concepts first-class:

- messages;
- channels;
- threads;
- tasks;
- workers;
- executions;
- artifacts;
- approvals;
- audit events.

The underlying implementation can still be simple: a local service, local database, browser UI, and agent runtime adapter.

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

Prove the smallest real loop with two workers:

1. Human creates an assignment for **Builder**.
2. Dispatcher starts/resumes the Builder Codex worker.
3. Builder creates a small artifact and posts a result.
4. Builder assigns **Reviewer**.
5. Dispatcher starts/resumes Reviewer.
6. Reviewer validates the artifact and posts evidence.
7. Human sees the complete thread, task states, executions, and artifacts.
8. Restart BotSquad and confirm the history/state remains correct.

No autonomous spending or public external action is needed for this milestone.

## Follow-on milestones

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
