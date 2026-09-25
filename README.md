# BotSquad

BotSquad is a local-first messaging and orchestration workspace for humans and AI agents.

The goal is to make multiple Codex/ChatGPT-style workers behave more like a small team: each worker has a durable identity and role, can exchange messages and hand off tasks, and can be observed or interrupted by a human operator from one Slack-like interface.

This repository starts with **Codex workers as the first executable agent backend**. Other agent runtimes may be added later behind explicit adapters when their control surfaces are proven.

## Why this exists

Running several AI tasks in parallel is already useful, but coordination is usually manual:

- copy findings from one thread into another;
- remember which task owns which work;
- decide when another worker should wake up;
- track whether something is actually finished;
- monitor failures and approvals across many conversations.

BotSquad moves that coordination into a local control plane.

The product is intentionally **not** “a room full of bots that chat forever.” Messages are communication; tasks are explicit work objects; the dispatcher wakes a worker only when work exists.

## Core model

```text
                         +----------------------+
                         |   Human operator     |
                         | browser / local UI   |
                         +----------+-----------+
                                    |
                                    v
+-------------+        +------------+-------------+        +----------------+
|  Channels   | <----> | BotSquad control   | <----> | Task / approval |
|  & threads  |        | plane + local database  |        | state machine   |
+-------------+        +------------+-------------+        +----------------+
                                    |
                                    v
                         +----------+-----------+
                         | Dispatcher / runtime |
                         +----+-------------+---+
                              |             |
                  +-----------+             +-----------+
                  v                                   v
          +---------------+                   +---------------+
          | Codex worker  |                   | Codex worker  |
          | "Researcher"  |                   | "Builder"     |
          +---------------+                   +---------------+
```

A bot is a **logical worker identity**, not merely a chat window. A worker may have:

- a stable name and role;
- its own instructions;
- a workspace or Git worktree;
- a resumable agent/thread identifier;
- an inbox of assignments and mentions;
- current status and task ownership;
- bounded tools and permissions.

## Product principles

1. **Local-first control plane.** Messages, tasks, state, approvals, and audit history should live locally by default.
2. **Human-visible operation.** The operator can observe what each worker is doing, inspect artifacts, pause dispatch, and intervene.
3. **Explicit work, not endless polling.** Idle bots do not repeatedly invoke models just to check for messages.
4. **Messages do not grant authority.** A bot cannot expand its own permissions because another bot wrote “approved.”
5. **Evidence over status prose.** “Done” should point to a commit, report, test result, artifact, or other inspectable output.
6. **Reliable handoffs.** Every task, message, execution, and approval gets a durable identifier so retries can be idempotent.
7. **Replaceable runtimes.** The messaging/task model should not depend on one model provider or one agent runtime.

## Initial product scope

The first useful version should support:

- local channels and threaded messages;
- human and bot identities;
- explicit task assignment;
- worker states such as `idle`, `queued`, `working`, `blocked`, `awaiting_approval`, and `failed`;
- artifacts/links attached to results;
- a dispatcher that starts or resumes a Codex worker when work is assigned;
- a live execution/event view;
- pause/stop controls;
- human-only approval records for bounded consequential actions;
- an audit trail that survives restarts.

Not initial scope:

- recreating all of Slack;
- public multi-tenant hosting;
- autonomous financial trading or unrestricted payment authority;
- arbitrary external account access;
- mobile clients;
- complex organization/user administration;
- pretending separate agent roles are security isolation when they share the same machine or credentials.

## Example workflow

```text
Human -> Manager:
    Find a small software problem worth validating.
    No spending or external outreach.

Manager -> Researcher:
    Investigate three candidate problems and return evidence.

Researcher -> Manager:
    Report saved as artifact research-014.md.

Manager -> Builder:
    Build the smallest prototype for candidate 2.

Builder -> Reviewer:
    Prototype ready at commit abc123. Please test acceptance criteria.

Reviewer -> Manager:
    4/5 pass. One reproducible defect remains.

Manager -> Human:
    Validation evidence attached. Requesting permission for a customer test.
```

The operator can watch this exchange in one place and can interrupt or redirect the team at any time.

## Documentation

- [Project vision](docs/product/PROJECT_VISION.md)
- [AI organization model](docs/product/AI_ORGANIZATION_MODEL.md)
- [System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Decision index](docs/decisions/README.md)
- [Agent instructions](AGENTS.md)
- [Execution-plan template](docs/exec-plans/TEMPLATE.md)

## Status

**Stage: architecture / first implementation planning.**

The repository is intentionally starting small. The first milestone is to prove a reliable local message → task → Codex execution → result loop with two workers before adding richer “virtual startup” behavior.
