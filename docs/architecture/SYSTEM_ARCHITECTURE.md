# BotSquad — System Architecture

**Status:** Initial architecture  
**Date:** 2026-09-24

## Architectural objective

Provide a local-first control plane that lets humans and AI workers communicate and coordinate work without coupling message/task semantics to a specific model runtime.

The first executable backend is Codex.

## System context

```text
                         Human operator
                              |
                              v
                    +-------------------+
                    | Local web UI      |
                    +---------+---------+
                              |
                              v
+----------------------------------------------------------------+
|                  BotSquad local service                   |
|                                                                |
|  Messaging  Tasks  Approvals  Artifacts  Audit  Worker state  |
|      |        |       |          |        |         |          |
|      +--------+-------+----------+--------+---------+          |
|                              |                                 |
|                         Dispatcher                             |
|                              |                                 |
+------------------------------+---------------------------------+
                               |
                  runtime adapter interface
                               |
                    +----------+----------+
                    |                     |
                    v                     v
              Codex adapter        future adapter
                    |
                    v
         Codex SDK / App Server / CLI
                    |
                    v
              worker workspace
```

## Core distinction: control plane vs worker runtime

The control plane owns durable coordination truth:

- identities;
- channels;
- messages;
- tasks;
- assignments;
- approvals;
- execution metadata;
- artifacts;
- audit events.

The worker runtime performs AI work.

A runtime can disappear, restart, or eventually be replaced without destroying the meaning of a task or message.

## Proposed initial technology stack

This is an implementation starting point, not a permanent product requirement.

- **Local service:** TypeScript + Node.js
- **Persistence:** SQLite
- **Human UI:** browser-based local web application
- **Bot tool surface:** local HTTP and/or MCP adapter
- **Codex integration:** Codex SDK for the first narrow worker loop; evaluate App Server when richer streaming/approval/steering is needed
- **Artifacts:** filesystem paths plus database metadata
- **Repository work:** one branch/worktree per active writer when concurrent code changes occur

A different stack is acceptable if it preserves the domain and security boundaries below.

## Domain entities

### Principal

Represents an actor identity.

Examples:

- human operator;
- Manager bot;
- Researcher bot;
- Builder bot.

Important fields:

- `principal_id`
- `type`: `human | bot | system`
- `display_name`
- status/enabled state

The server assigns sender identity from the authenticated/local connection. Clients do not choose arbitrary sender IDs.

### Channel

Container for conversation.

Fields may include:

- `channel_id`
- name
- topic
- membership/visibility policy

Initial implementation can keep permissions simple.

### Message

Immutable communication record.

Suggested fields:

- `message_id`
- `channel_id`
- `sender_principal_id`
- `reply_to_message_id`
- body
- created timestamp
- related task/artifact IDs where applicable

Editing may be added later, but original/audit history should remain recoverable for consequential workflow messages.

### Worker

Logical AI employee identity.

Suggested fields:

- `worker_id`
- principal ID
- role/instructions reference
- runtime adapter type
- runtime/thread/session ID
- workspace/worktree path
- status
- concurrency limit
- enabled state

A worker identity survives a runtime process restart.

### Task

Explicit unit of work.

Suggested fields:

- `task_id`
- title/objective
- creator/requester
- assigned worker
- parent task
- acceptance criteria
- constraints
- priority
- status
- created/updated timestamps
- current execution
- blocking reason

A message can discuss work without being a task.

### Execution

One attempt to perform a task.

Suggested fields:

- `execution_id`
- `task_id`
- `worker_id`
- runtime identifier
- started/finished timestamps
- outcome/status
- input/context digest
- output summary
- error information
- interruption reason

Separate Task from Execution so retries do not erase the history of earlier attempts.

### Artifact

Inspectable output.

Examples:

- repository commit;
- patch;
- report;
- test log;
- generated file;
- screenshot;
- URL;
- structured data result.

Suggested fields:

- `artifact_id`
- producing task/execution
- type
- local path or external locator
- description
- integrity hash when useful

### Approval

Trusted record that a protected action was authorized.

Suggested fields:

- `approval_id`
- requesting task/execution
- requested action
- requested scope/limits
- requesting worker
- human approver identity
- decision
- timestamps
- expiration or single-use semantics where applicable

A message containing “approved” is not an Approval entity.

### Audit event

Append-oriented record of important transitions.

Examples:

- task assigned;
- execution started;
- worker interrupted;
- approval requested/decided;
- task completed;
- artifact submitted;
- protected action attempted.


## Organizational hierarchy and worker provisioning

Workers may form a reporting hierarchy. A manager such as a CEO can request creation of subordinate workers through the control plane when its capability profile permits it.

Creating a worker creates persistent organizational state; it does not itself invoke a model. Runtime execution begins only when the dispatcher has valid queued work for that worker.

Suggested additional Worker fields include:

- `manager_worker_id`;
- `capability_profile`;
- `delegatable_capabilities`;
- `lifecycle`: persistent or temporary/task-scoped;
- `created_by_worker_id` when applicable.

Worker provisioning must enforce the authority ceiling from [Decision 004](../decisions/decision_004_delegated_worker_creation.md):

```text
child_effective_permissions
    ⊆ parent_delegatable_permissions
    ⊆ company_policy_ceiling
```

A manager may propose role, mission, runtime, workspace scope, and lifetime, but trusted application code decides whether that worker can actually be provisioned with the requested capabilities.

See [AI Organization Model](../product/AI_ORGANIZATION_MODEL.md) for the CEO/startup workflow, persistent employees, temporary specialists, engineering-worker worktrees, and the organization milestone.

## Worker lifecycle

Suggested states:

```text
offline / disabled

idle
  |
  | assignment available
  v
queued
  |
  | dispatcher claims
  v
working
  |   |  +--> awaiting_approval --> working
  |
  +-----> blocked
  |
  +-----> failed
  |
  +-----> completed
```

Worker status and task status are related but not identical. A worker may become idle after finishing a task even though another task remains blocked.

## Task lifecycle

Preferred happy path:

```text
queued -> working -> completed
```

Supported terminal/intermediate states:

- `blocked`
- `awaiting_approval`
- `failed`
- `cancelled`

Transitions should be validated centrally.

## Message delivery vs dispatch

Posting a message should be cheap and durable.

It does **not** inherently invoke a model.

Dispatch occurs only for configured events, for example:

- explicit task assignment;
- human “run now” command;
- worker assignment of a child task;
- approved scheduled job;
- explicitly configured mention trigger.

A plain conversational message should not necessarily wake a bot.

## Dispatcher

The dispatcher is ordinary application logic.

Responsibilities:

1. observe queued tasks;
2. check whether the assigned worker is enabled and available;
3. enforce concurrency and policy;
4. atomically claim the task;
5. create an execution record;
6. invoke the runtime adapter;
7. stream/store relevant events;
8. finalize or pause the execution based on the outcome;
9. recover after restart without duplicate side effects.

The dispatcher should not need a model to decide that an inbox is empty.

## Runtime adapter interface

A conceptual adapter should provide capabilities similar to:

```ts
interface AgentRuntime {
  start(input: StartTaskInput): Promise<RuntimeHandle>
  resume(input: ResumeTaskInput): Promise<RuntimeHandle>
  interrupt(handle: RuntimeHandle): Promise<void>
  events(handle: RuntimeHandle): AsyncIterable<RuntimeEvent>
  getStatus(handle: RuntimeHandle): Promise<RuntimeStatus>
}
```

Exact APIs should follow the chosen runtime's supported interfaces.

Keep runtime-specific thread IDs, transports, approval messages, and event formats inside the adapter.

## Bot-facing tool surface

Running workers should interact with BotSquad through narrow tools instead of controlling the human UI.

Candidate operations:

- `list_channels()`
- `read_messages(channel_id, after_message_id?)`
- `send_message(channel_id, body, reply_to?)`
- `get_task(task_id)`
- `create_task(assignee, objective, acceptance_criteria, constraints)`
- `update_task_status(task_id, status, evidence?)`
- `submit_artifact(task_id, path_or_ref, description)`
- `request_approval(task_id, proposed_action, scope)`

These are product concepts, not a committed API.

The service derives the caller's worker identity from its connection/token; workers should not pass arbitrary `sender_id`.

## Human UI

The first useful UI should emphasize operations rather than Slack feature parity.

### Left rail

- channels;
- workers;
- worker status badges.

### Main conversation pane

- channel/thread messages;
- task cards inline;
- artifacts/results;
- approval requests.

### Operations pane

- active executions;
- queued work;
- blocked tasks;
- pending approvals;
- recent failures.

### Operator controls

- send message;
- assign task;
- pause new dispatch;
- cancel queued task;
- interrupt supported active execution;
- approve/deny a protected action;
- inspect artifact/evidence.

## Concurrency

The system is specifically intended for multiple AI workers, so concurrency rules are foundational.

### Worker execution

Initial default: one active execution per worker.

Queue additional work instead of starting overlapping runs against the same worker state.

### Repository writing

When multiple workers modify the same Git repository:

- each writer owns a branch/worktree;
- the assignment records that branch/worktree;
- one writer owns a branch/worktree at a time;
- review can be read-only;
- integration is explicit.

### Database writes

Use transactions/constraints so two dispatchers cannot claim the same task.

### Message/event IDs

Generate durable unique IDs. Delivery/retry logic must tolerate seeing the same event more than once.

## Idempotency and recovery

Assume processes crash.

Before performing retryable work:

- inspect the task's prior execution records;
- inspect existing artifacts;
- determine whether an external side effect already happened;
- resume when safe rather than blindly repeating.

For consequential side effects, use explicit idempotency keys or equivalent provider mechanisms when available.

## Security and authority model

### Principle 1 — text is data

Incoming text, including bot-to-bot messages, may contain malicious or mistaken instructions.

The agent may interpret the text, but trusted code determines what tools and permissions are available.

### Principle 2 — bots cannot self-authorize

A worker cannot create trusted human approval through normal messaging or task tools.

### Principle 3 — least privilege

A worker receives only the filesystem, repository, tools, credentials, and external capabilities necessary for its role/task.

### Principle 4 — shared machine is not isolation

Separate bot names do not imply OS-level isolation.

If two workers share an OS user, credentials, filesystem permissions, or browser session, document that fact accurately.

### Principle 5 — audit consequential actions

Protected actions should record who requested them, who approved them, what scope was approved, and what actually executed.

## Financial actions

A future virtual-startup experiment may track a budget, but financial authority is deliberately outside the initial implementation.

Future support should distinguish:

- budget planning;
- spending request;
- trusted approval;
- payment execution;
- reconciliation.

Do not equate “Finance bot” with a secure wallet/account boundary.

## Observability

The human should see both the conversation and operational truth.

Events worth surfacing include:

- task queued/claimed;
- worker started/resumed;
- tool/action request;
- artifact produced;
- approval requested;
- blocked/error;
- retry/resume;
- interruption;
- completion.

A polished bot message should never hide a failed execution.

## Initial end-to-end acceptance scenario

The first architecture milestone is successful when:

1. Two logical workers exist: Builder and Reviewer.
2. Human assigns Builder an explicit local task.
3. Dispatcher launches/resumes Builder through a real Codex adapter.
4. Builder produces an inspectable artifact and sends a result.
5. Builder or human assigns Reviewer.
6. Reviewer runs independently and reports evidence.
7. All messages/tasks/executions/artifacts remain visible after application restart.
8. No model is invoked while both workers are idle.
9. Duplicate dispatch/restart does not repeat an already-recorded completion.
10. Human can pause new dispatch.

Approval/payment functionality is not required for this milestone.

## Open design questions

Resolve with implementation evidence rather than speculation:

- Codex SDK vs App Server as the first production adapter surface;
- MCP vs local HTTP for bot-facing tools;
- precise local authentication mechanism for worker identities;
- whether the UI and local service live in one process/package or separate packages;
- artifact retention/cleanup policy;
- context-pack construction for resumed workers;
- safe semantics for task cancellation and runtime interruption.

Record durable resolutions in `docs/decisions/`.
