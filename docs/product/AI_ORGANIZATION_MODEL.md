# AI Organization Model

**Status:** Product model; initial CEO/Researcher slice implemented
**Updated:** 2026-09-25

## Purpose

BotSquad should support more than a flat set of bots. It should be able to represent a small AI organization in which a human owner creates an initial executive worker, and that executive can create and manage subordinate workers within a bounded authority envelope.

The motivating example is a virtual software startup:

```text
                         Human owner
                             |
                             v
                         Atlas — CEO
                    /          |          \
                   v           v           v
             Research Lead   Product      CTO
                               |          /   \
                               v         v     v
                         Product Mgr   Eng 1  Eng 2
                                             |
                                             v
                                          Reviewer
```

The organizational hierarchy is a coordination model. It is not, by itself, a security boundary.

## Core distinction: create, start, message, assign

These are four separate operations and should remain separate in the product.

### Create a worker

Creates a persistent logical employee record:

- identity;
- name/title;
- role and mission;
- manager/reporting relationship;
- runtime type;
- workspace/worktree binding;
- authority/capability profile;
- lifecycle policy;
- current state.

Creating a worker does **not** require an AI model to be actively running.

### Start or resume a worker

Invokes the configured runtime because the worker has actual work.

A worker can exist for days in an idle state without consuming model execution. The dispatcher starts/resumes it only when a valid trigger exists.

### Message a worker

Creates a durable communication event.

A message may notify or provide context, but a normal message should not automatically become an assignment or expand authority.

### Assign a task

Creates explicit work with an objective, owner, acceptance criteria, constraints, and expected output.

Task assignment is one of the events that may wake an idle worker.

## Initial CEO

The human owner creates the first executive manually.

Example:

```text
Name: Atlas
Title: CEO
Reports to: Human owner
Runtime: Codex initially

Mission:
Discover, build, and operate useful software products.

May:
- create subordinate internal workers;
- create departments/product initiatives;
- assign/reassign tasks;
- retire workers;
- request research, engineering, review, and operations work.

May not independently:
- expand the company's global permission ceiling;
- create trusted human approvals;
- obtain new credentials;
- spend or transfer money unless an explicit trusted policy permits it;
- publish externally when publication requires human approval;
- change protected audit records.
```

The human may give the CEO broad strategic discretion while still keeping consequential authority in the control plane.

## CEO-driven hiring

A manager may request a new worker through a trusted control-plane operation such as:

```text
hire_worker(
    title,
    mission,
    reports_to,
    capability_profile,
    runtime_preference,
    workspace_scope,
    lifetime,
    justification
)
```

This is a conceptual product API. Prompt 01's narrower `hire_worker` accepts name,
title, mission, capabilities, lifecycle and justification. The service derives the
manager, runtime and workspace from trusted execution/company context; the worker
does not choose them freely.

The requesting manager proposes the worker. BotSquad performs policy checks and provisions it.

Example:

```text
CEO decides:
"I need someone to investigate small sports software markets."

CEO -> hire_worker(
    title = "Market Research Lead",
    mission = "Find underserved software problems and produce evidence",
    reports_to = CEO,
    capability_profile = "research",
    lifetime = "persistent"
)

Control plane checks:
- Is CEO allowed to create workers? yes
- Is the worker-count limit exceeded? no
- Are requested tools/capabilities delegatable by CEO? yes
- Is human approval required for this capability? no

Result:
Scout — Market Research Lead
status: idle
reports_to: Atlas
```

## Authority ceiling

A parent can delegate only authority the control plane marks as delegatable.

Conceptually:

```text
child_effective_permissions
    ⊆ parent_delegatable_permissions
    ⊆ company_policy_ceiling
```

Some permissions may always remain human-only.

A manager cannot bypass this rule by writing stronger permissions into a worker prompt or a message.

Example:

```text
CEO may delegate:
- public-web research
- internal messaging
- task creation
- repository work in approved workspaces

Human-only / approval-gated:
- new payment credentials
- bank or crypto-wallet authority
- protected external publication
- contracts
- changes to company-wide authority policy
```

This is a product invariant, not merely prompt guidance.

## Persistent employees and temporary specialists

BotSquad should support both.

### Persistent employees

Useful for durable responsibilities:

- CEO;
- CTO;
- Product Manager;
- Lead Engineer;
- Research Lead;
- QA/Reviewer.

They keep a stable identity and role across many tasks.

### Temporary specialists

Useful for bounded work:

- payments researcher;
- database specialist;
- security reviewer;
- pricing analyst;
- accessibility reviewer.

A temporary worker can be created with a lifecycle such as:

```text
active until TASK-017 reaches a terminal state
```

After retirement, its messages, task history, artifacts, and audit records remain available.

## Reporting hierarchy

A worker may have a manager:

```text
worker.manager_worker_id
```

The hierarchy helps determine:

- who may assign work to whom;
- where status summaries flow;
- who receives escalations;
- which manager can retire/reassign a worker;
- how context is summarized before reaching the CEO.

The first version should avoid forcing every message through the hierarchy. Direct collaboration can still occur where policy permits.

## Why hierarchy matters for AI workers

A CEO should not need to absorb every low-level message from every engineer.

Example:

```text
Engineer
   |
   v
Engineering Lead
   |
   v
CTO
   |
   v
CEO
   |
   v
Human owner
```

Each layer can summarize, resolve routine issues, and escalate only material decisions.

This reduces unnecessary context growth and makes responsibility clearer.

## Engineering workers

Engineering bots need stronger workspace semantics than general conversational workers.

A typical engineering worker may have:

```text
Title: Lead Engineer
Runtime: Codex
Repository: ~/company/products/example
Worktree: ~/company/worktrees/lead-engineer
Branch: feature/core-engine

May:
- read the approved repository;
- edit its owned worktree;
- run tests;
- commit scoped work;
- message teammates;
- submit artifacts/results.

May not:
- overwrite another worker's worktree;
- force-push;
- deploy publicly without authorization;
- expand its own repository/tool access.
```

Concurrent engineer workers should use explicit branch/worktree ownership, consistent with repository-level `AGENTS.md` rules.

## CEO operating loop

A typical executive cycle is event-driven:

```text
Human gives CEO objective
        |
        v
CEO starts/resumes
        |
        +--> creates workers if needed
        |
        +--> assigns tasks
        |
        v
CEO becomes idle

Researcher finishes
        |
        v
result event queues CEO
        |
        v
CEO resumes
        |
        +--> evaluates evidence
        +--> assigns next work
        +--> requests human approval if required
        |
        v
CEO becomes idle
```

There is no need for the CEO model to remain active while waiting.

## Suggested CEO management tools

The smallest useful executive tool surface is:

```text
hire_worker()
retire_worker()
assign_task()
message_worker()
list_company_status()
request_human_approval()
```

Later additions may include:

- move_worker();
- create_department();
- set_worker_priority();
- pause_worker();
- request_budget_change().

Do not expose unrestricted policy mutation through these tools.

## Company dashboard

A future operator view could combine organization and execution state:

```text
BOT LABS
------------------------------------------------

Objective
Build and validate useful niche software products

RUNNING
● Atlas       CEO               Reviewing market report
● Maya        Product Manager   Writing MVP requirements
● Linus       Lead Engineer     feature/scheduling-engine
● Ada         Engineer          feature/web-ui

IDLE
○ Scout       Market Research
○ Grace       QA / Reviewer

BLOCKED
! Payments Researcher
  Awaiting human approval for external account creation

------------------------------------------------
Products             1
Open tasks           13
Completed tasks      38
Pending approvals     1
```

The dashboard should show operational truth, not just self-reported chat status.

## Runtime choice

The organization model must remain runtime-neutral.

A worker should conceptually bind to:

```text
Worker
  |
  +-- Runtime: Codex
  +-- Runtime: OpenAI agent/API
  +-- Runtime: future adapter
```

Codex is the initial runtime. Prompt 01 proves local research and executive evaluation;
engineering workers are the next target. The adapter uses the official App Server.

A later implementation may choose different runtime types for different roles, for example:

```text
CEO / researchers / operations
        -> general agent runtime

engineers / code reviewers
        -> Codex + Git worktrees
```

That choice should be based on supported interfaces, cost, reliability, and measured product needs rather than hard-coded into the organization domain model.

## Initial organization milestone

Prompt 01 makes the organization loop the first executable milestone, before the
earlier proposed Builder/Reviewer expansion:

1. Human creates one CEO.
2. Human assigns a company-level objective.
3. CEO creates one subordinate worker through the control plane.
4. CEO assigns the subordinate a task.
5. Dispatcher starts/resumes the subordinate.
6. Subordinate returns an artifact/result.
7. Result wakes/resumes CEO.
8. CEO evaluates the result and reports to the human.
9. Restart preserves the hierarchy, worker identities, tasks, and history.
10. A test verifies that the CEO cannot create a child with authority above its delegatable ceiling.

Only after this works should the project expand into larger autonomous company structures.

## Current implementation boundary

Atlas is seeded as a persistent CEO reporting to the Human owner. It may hire direct
research workers, assign one child task per objective, inspect company state and post
messages. Its initial delegatable capabilities are internal messaging, approved
document reads and controlled report writes. Workers do not have arbitrary shell,
filesystem, account, policy or financial authority.

Scout is requested dynamically by Atlas; the reference workflow uses a persistent
Market Researcher. Temporary workers are also represented and retire after a terminal
task. Retirement retains identity and history. The suggested `retire_worker` and
`request_human_approval` tools, departments and reassignment are deferred. Runtime
approval requests are denied and surfaced for inspection; ordinary text never grants
the rejected permission.

The company can hold eight worker records, executes at most one run per worker and
two globally, and bounds delegation/review to prevent runaway loops. See
[system architecture](../architecture/SYSTEM_ARCHITECTURE.md) for the implemented
capability meanings, recovery and future Git ownership extension point.
