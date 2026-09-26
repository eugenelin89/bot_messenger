# AI Organization Model

**Status:** Product model; bounded research and engineering organization validated on Ubuntu HQ
**Updated:** 2026-09-26

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

## Deployment context

The organizational model is independent of where BotSquad runs. The accepted primary topology is an always-on, operator-controlled Ubuntu headquarters. The human workstation connects for bootstrap, administration and UI access rather than hosting the company permanently.

A logical worker remains a durable BotSquad identity. It is not the same thing as:

- a Codex thread;
- a process;
- a Git worktree;
- a bound Unix user.

Prompt 03 moves the control plane/runtime to Ubuntu and adds per-worker AI profiles.
Prompt 04 binds workers to separate Unix accounts and independent project clones
without changing their logical identity, original runtime workspace or Codex thread.

Historical Prompt 01/02 examples below describe the local validation architecture that proved the organization model.

## Companies above workers

The organization model should eventually support a company boundary above the worker hierarchy.

```text
Human owner
├── Company A
│   └── Atlas -> workers...
└── Company B
    └── Atlas -> workers...
```

Workers belong to a company and cannot cross that boundary merely because both companies run on the same BotSquad HQ or use the same runtime account.

Cross-company collaboration is a separate operation governed by a trusted CompanyConnection. The sending company should share only the explicit request/artifact/result envelope; the receiving company retains its own internal task hierarchy and audit trail.

A worker may later have optional external identities such as a Telegram bot. That external identity is attached to the worker and company; it is not the worker's durable identity and does not grant authority by itself.

See [Multi-Company and Federation Model](MULTI_COMPANY_AND_FEDERATION.md) and [External Identities and Telegram Integration](EXTERNAL_IDENTITIES_AND_TELEGRAM.md).

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

Codex is the initial runtime. Prompt 01 proves research and executive evaluation;
Prompt 02 proves managed engineering and independent review using the same App Server. Prompt 03 validates that runtime/control plane on Ubuntu HQ and makes model, reasoning effort and scheduler priority configurable per worker.

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

```text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    ├── Turing — CTO
    │   ├── Linus — Engineer
    │   ├── Ada — Engineer
    │   └── Grace — Reviewer
    └── Scout — Researcher (optional compatible research workflow)
```

Atlas creates the approved Product Manager and CTO profiles; CTO creates at most two
engineers and one reviewer. There are eight workers maximum, three ordinary direct
children per manager (the CEO may additionally have Nix), two hierarchy edges and two
simultaneous executions. Leaf roles receive
no onward delegation. Effective and delegatable capabilities are separate; profile
checks enforce the company ceiling outside model text.

In the Prompt 02 reference flow, Maya produces the spec before engineering. Turing creates a managed local SquadStatus
repository and assigns both engineers as a batch. Each owns one branch/worktree/task
allocation and can edit only its module and optional extra tests. Source editing,
fixed confined tests and commit submission use narrow trusted tools; no worker gets
an unrestricted shell or filesystem. Grace receives a read-only exact-commit packet
and records an immutable approved/changes_required review. Only Turing may request
trusted integration, which tests a candidate before fast-forwarding product main.

Managers end their turns while children work. Durable child-result events wake Atlas
for spec evaluation/delivery and Turing for review/integration. No model polls an
inbox. Creating a worker and sending messages remain distinct from assigning work.

The real reference organization is persistent; temporary researchers remain supported
and retire after one terminal assignment. Runtime bindings keep their original private
workspace; engineering allocations are separately bound to current tasks. No implicit
thread replacement is permitted. Restart retains completed ownership and results;
ambiguous source/Git work is blocked for inspection rather than automatically replayed.

The fixed Prompt 02 Git/worktree layout remains the development regression path.
Prompt 04 uses private Unix identities and independent clones on production Linux.

The fixed product, two modules, one review and one integration attempt keep this
milestone bounded. Automatic revision cycles, generalized product repositories,
manager retirement, broad approval grants, cleanup and Computer Use are deferred.
See [Decision 008](../decisions/decision_008_managed_engineering.md).


## Prompt 03 worker AI configuration

Each logical worker has a persisted model and reasoning setting (or inherit), bounded
execution priority and human lock. The human inspector discovers the active runtime's
choices and rejects unavailable combinations. Global BOT_MODEL is only a default.
A running execution retains the profile it claimed; later profile changes never rewrite
its effective model/reasoning/priority/runtime evidence. Legacy evidence stays unknown.

Human-locked profiles cannot be changed by bot prose or tools. Manager-requested
profile mutation is deferred, so even unlocked profiles currently have only trusted
human updates. Priority reorders eligible work; it never grants capabilities, bypasses
pause or expands the two-execution global limit. New Codex threads use friendly names
while UUID/workspace/thread bindings remain the identity boundary.

Ubuntu HQ retains one trusted botsquad control-plane/Codex account. Prompt 04 added
private Unix identities for worker-owned actions; credentials remain central. See
Decision 013 for the exact implemented boundary. The CEO may have Nix as a fourth
child; all other manager, hierarchy, concurrency and company limits stay unchanged.
