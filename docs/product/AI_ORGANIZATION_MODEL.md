# AI Organization Model

**Status:** Product model; conversations, working groups, company loop and bounded supervised business operation implemented; broader organization concepts remain future scope
**Updated:** 2026-10-07

## Purpose

BotSquad should support more than a flat set of bots or a fixed delegation pipeline. It should represent a small **intelligent company** whose persistent employees can communicate, deliberate, take initiative within role, execute bounded work, learn from outcomes and adapt toward broad or specific human-defined goals.

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

The hierarchy is also **not the only thinking topology**. It defines responsibility,
assignment and escalation, while implemented direct conversations and bounded working groups allow
cross-functional reasoning.

See [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md) and
[Decision 016](../decisions/decision_016_intelligent_company_model.md).


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

Prompt 06 adds remote devices owned by the existing human principal. A device is an
operator client identity with an explicit capability ceiling, not a worker, Unix user,
Codex account or company. Pairing alone launches no work. Native messages remain
communication; explicit authenticated objectives create tasks through the same control
plane. [Decision 015](../decisions/decision_015_remote_client_trust.md) defines this boundary.

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

## Current human and bot interaction semantics

The current product supports both explicit assignments and first-class direct
Conversations. Prompt 07 adds bounded human↔worker and peer replies with separate
scoped runtime contexts. Communication, executable assignments and protected approval
remain different operations. See [conversation semantics and continuity](../architecture/CONVERSATIONS_AND_CONTINUITY.md).

### Human operator

Today the human normally enters executable work through Atlas:

~~~text
Human
  |
  | explicit objective
  v
Atlas
  |
  v
delegated tasks through the organization
~~~

The Web UI and Client API also support a message-only operation. That creates a durable
message in the Executive channel but does not assign work, wake Atlas, or cause an
automatic reply. Separately, the Conversations UI opens direct human-to-Maya,
human-to-Linus or other eligible worker sessions. Requesting a reply queues only that
worker; sending a passive message creates no execution. The owner administers and can
inspect all conversations; privacy is against unrelated workers and unauthorized readers.

A human who wants a specialist involved in actual work therefore assigns the objective
to Atlas and may state the desired specialist/goal in that objective. The trusted task
and role rules still decide what can actually be delegated.

### Bot-to-bot messages

Workers with the `internal_message` capability can address ordinary human-readable text
to any existing worker; messaging itself is not restricted to manager/subordinate edges.
The durable record retains sender, optional recipient, related task, execution and time.

That does **not** mean messages are a general worker inbox or dispatch mechanism. A worker
is started only for actual queued work, and its current runtime context includes recent
messages related to its active task. Merely addressing a message to an idle worker does
not wake it, create a task or guarantee a reply.

### Task assignment follows hierarchy

Executable work is stricter than communication. `assign_task` is enforced against the
reporting hierarchy: a manager may assign only a direct subordinate, with additional
role/stage limits for the supported research and product workflows.

So, for example:

~~~text
Linus -> message Ada        permitted when Linus has messaging capability
Linus -> assign Ada task    not permitted

Turing -> assign Ada task   permitted when Ada is Turing's direct report and workflow allows it
~~~

Messages cannot grant capabilities, approvals or filesystem/repository authority.

### Reliable task handoff

The task coordination path remains:

~~~text
manager assigns explicit child Task
        |
        v
worker executes and saves result/evidence
        |
        v
child becomes terminal
        |
        v
durable wake event queues manager follow-up
~~~

Conversation work is separate: one human request may ask one eligible peer, reserve the
peer reply and one initiating-worker continuation, then stop. Each step releases its slot;
the chain cannot recursively extend. Peer answers and continuations remain discoverable
in the peer transcript. They do not complete Tasks or wake task managers.

Operators can inspect those interactions through the Executive channel, linked Tasks,
Audit history and Executions. Audit records are the precise source for assignment and
result-return events; Executions show when workers actually ran and where work overlapped.

## Collaborative deliberation

Prompt 08 implements this bounded layer with frozen eligible participants,
separate actual worker turns, meaningful facilitator choices, explicit evidence exports,
owner interjections and versioned synthesis. It uses no scripted employee transcript.
Recommendations carry uncertainty and require a separate owner-submitted Task to become
assignments. Release evidence and limits are in the [validation record](../validation/PROMPT_08_VALIDATION.md)
and [Decision 021](../decisions/decision_021_bounded_working_groups.md).

Direct conversations, task delegation and **bounded group discussion** are implemented,
with explicit membership and synthesis. Prompt 09’s bounded company loop and durable
scheduler are also complete; [the execution plan](../exec-plans/prompt-09.md) records acceptance.
Prompt 11’s supervised real path is complete, and [Decision 026](../decisions/decision_026_personal_operator_stabilization.md)
prioritizes Personal Operator reliability before further expansion.

Hierarchy should govern responsibility, assignment authority and protected actions. It
should not prevent peers or cross-functional specialists from reasoning together.

The first-class `WorkingGroup` provides the bounded foundation for these requirements:

- one explicit topic/question and desired output;
- a bounded participant list selected by the human or an authorized coordinator;
- participants from different branches of the hierarchy;
- ordinary human-readable discussion messages;
- explicit facilitator/synthesizer responsibility;
- bounded rounds, wall time and model-turn budget;
- optional human observation/intervention;
- durable transcript and attribution by worker/execution;
- explicit conclusion/synthesis artifact;
- preserved dissent, alternatives, risks and unresolved questions;
- conversion of an accepted conclusion into Tasks only through normal trusted assignment
  authority.

Example:

~~~text
Human asks for a new feature design
        |
        v
Atlas opens Design Working Group
        |
        +-- Maya  — product/user perspective
        +-- Turing — architecture/engineering
        +-- Linus — implementation practicality
        +-- Grace — risks/review
        |
        v
Round 1: proposals
Round 2: critique and questions
Round 3: synthesis
        |
        v
Design artifact + alternatives + unresolved risks
        |
        v
normal hierarchy creates implementation Tasks
~~~

Discussion participation must not grant task-assignment, approval, filesystem, repository
or external authority. A worker can disagree with its manager inside a discussion without
gaining authority to act outside its role.

This should **not** be implemented by simply making every ordinary message wake a model.
That would blur communication and execution and could create unbounded bot-to-bot loops.
A discussion session itself should be the explicit bounded work object that schedules
turns. Ordinary `message_worker` remains non-dispatching communication.

Useful discussion modes may eventually include:

- design roundtable;
- architecture review;
- product/engineering trade-off discussion;
- incident/problem-solving room;
- pre-mortem / red-team review;
- research synthesis;
- reviewer/implementer clarification.

The human should be able to watch the transcript live, ask a participant a question,
pause/stop the session, and inspect the final synthesis. Prompt 07 first establishes
first-class direct conversations and explicit bounded reply/wake semantics; Prompt 08
then implements this collaborative working-group/deliberation layer.

## From team discussion to company operation

Conversation and deliberation are foundations, not the end state.

Prompt 09 implements an ongoing company operating loop above Prompt 07 direct conversations
and Prompt 08 working groups. The human may provide a broad mandate or a specific product
mandate, explicitly activating a typed internal envelope. Actual broad/two-cycle acceptance and production deployment passed.
See [the bounded implementation](../architecture/COMPANY_OPERATING_LOOP.md) and
[Decision 022](../decisions/decision_022_company_operating_loop.md). Its automatic work is
limited to analysis/research Tasks, groups and reviews; Project/external operations in the
long-term model below still require their separate authority paths.

Example broad mandate:

~~~text
"Increase sustainable profit within the approved constraints and resources."
~~~

Example specific mandate:

~~~text
"Manage and market Asymmetri Motion. Improve product quality, adoption and revenue."
~~~

The organization should then choose useful internal work:

~~~text
mandate
  -> inspect situation
  -> identify unknowns / risks
  -> research + deliberate
  -> make durable decision
  -> create Projects / Tasks / approved operations
  -> execute + review
  -> observe outcomes / metrics
  -> company review
  -> continue / iterate / pivot / stop / scale
~~~

This operating loop should preserve persistent employee roles and accountability. A
worker should be able to propose useful next work, request evidence, challenge a plan or
recommend a strategy change without receiving new authority merely for showing
initiative.

The loop remains event-driven and bounded. Metrics/results wake relevant review work;
idle employees do not continuously invoke models to simulate an always-running company.

Real financial or other consequential external authority is separate. Workers may reason
about budgets/resources, but raw wallet private keys, seed phrases, bank credentials or
unrestricted payment credentials must never become ordinary worker context. A future
treasury/resource capability must enforce typed intents, budgets, limits, approvals,
audit, reconciliation and revocation outside worker-authored prose.

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

Development worktrees support both generic Projects and the historical SquadStatus
fixture. Production Linux retains Prompt 04 private identities/independent clones, now
with generic immutable allocation manifests.

Prompt 05 replaces that fixed-fixture limit with trusted human-defined software Projects,
multiple repositories, configurable branches and named focused/full Node recipes. Turing
assigns exact-file or directory-prefix write scopes inside immutable Project policy.
Grace freezes and reviews exact submission packets; changes_required requeues affected
engineers in their existing task/thread, with a bounded number of independent review
rounds. Approved current submissions enter a durable tested integration queue.

Remote fetch/publication is trusted application work. Exact human approval gates each
publication; workers receive no GitHub credentials or remote tool. Archive revokes clone
access while retaining identity, threads and evidence. Retained incompatible Codex tool
schemas fail explicitly instead of silently replacing old threads. General environments,
manager retirement, broad approval grants, physical cleanup and Computer Use remain
outside this milestone. See [Decision 014](../decisions/decision_014_generalized_projects.md)
and the [acceptance record](../validation/prompt-05-general-projects.md).


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
