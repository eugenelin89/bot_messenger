# BotSquad — System Architecture

**Status:** Prompt 01 implementation
**Updated:** 2026-09-25

## Boundaries

```text
Human browser
  → loopback HTTP + server-sent events
  → Company control plane + SQLite
  → event-driven dispatcher
  → RuntimeAdapter
  → Codex App Server (private stdio)
  → model service
```

The company owns organizational truth. Codex threads are replaceable runtime bindings, not Tasks. A worker persists while its model is idle. Creating, messaging, assigning and executing are separate operations.

## Implemented stack and source map

| Concern | Implementation |
| --- | --- |
| Domain types, validation, authority | `src/domain/model.ts` |
| Persistent operations and narrow worker tools | `src/control/company.ts` |
| Atomic claim and execution lifecycle | `src/control/dispatcher.ts` |
| SQLite migration and constraints | `src/persistence/store.ts` |
| Single service ownership | `src/persistence/lock.ts` |
| Runtime contract and tool descriptions | `src/runtime/adapter.ts` |
| Codex protocol and transport | `src/runtime/codex.ts`, `src/runtime/rpc.ts` |
| Local HTTP and human session boundary | `src/http/server.ts` |
| Browser interface | `public/` |
| Application lifecycle | `src/main.ts` |
| Deterministic and real validation | `test/`, `scripts/real-e2e.ts` |

Node 24.x supplies HTTP, SQLite, process control and tests. TypeScript supplies static checking. The only runtime package is the pinned official Codex CLI. No distributed queue or web framework is needed.

## Persistent domain

- **Principal:** human, bot or system identity. Human/System seed once; a Worker has a distinct bot Principal.
- **Worker:** name, title, mission, role, manager Worker FK, lifecycle, runtime type, canonical workspace, effective/delegatable capability arrays, enabled flag, creator and timestamps.
- **Runtime binding:** separate unique Worker ↔ runtime reference ↔ workspace association. Codex owns the referenced thread; tasks never use its ID as their domain identity.
- **Channel/Message:** one executive channel with immutable messages, trusted sender, optional recipient/reply/task/execution linkage. Messages never dispatch work.
- **Task:** requester Principal, assignee Worker, objective, acceptance criteria, constraints, optional parent, validated status, blocking reason and result.
- **Execution:** independent attempt ID, task, worker, runtime reference, status, start/end, error and interruption reason. Retrying creates an additional row.
- **Artifact:** producing task/execution, type, generated filesystem reference, description, timestamp and SHA-256. UI serves Markdown as plain text after verifying confinement and integrity.
- **Audit:** append-oriented event ID, actor, task/worker/execution and bounded details. SQLite triggers reject ordinary update/delete operations.
- **Tool receipt / wake event:** persisted idempotency keys for tool replay and child-result linkage.
- **Settings:** application pause state survives restart.

The schema has an explicit `schema_migrations` ledger. Startup applies missing migrations transactionally; it does not reset retained data. Foreign keys, `BEGIN IMMEDIATE`, WAL, full synchronization and unique indexes enforce relational and claim invariants.

## Authority and tool identity

Decision 004 is enforced in trusted code:

```text
child effective capabilities ⊆ manager delegatable capabilities ⊆ company ceiling
```

| Capability | Atlas | Atlas may delegate | Concrete Prompt 01 authority |
| --- | --- | --- | --- |
| `internal_message` | yes | yes | Durable executive-channel messages |
| `create_worker` | yes | no | Bounded direct research worker provisioning |
| `create_task` | yes | no | One direct child research assignment per objective |
| `read_workspace` | yes | yes | Read allowlisted document snapshots, max 40,000 characters each |
| `write_workspace` | yes | yes | Submit bounded report content; service chooses path |
| `run_local_tools` | no | no | Recognized but excluded from company ceiling |

Capabilities are explicit string sets. A child receives no onward delegation. Hiring always derives `reports_to` and creator from the active manager; workers cannot supply arbitrary manager, workspace, runtime, sender, principal or execution fields. Runtime type inherits the company adapter; workspace paths are generated and canonicalized by the service.

The dispatcher constructs an execution context; the adapter closes over it. Every tool call verifies the running execution, assigned worker, working task, enabled identity and exact workspace. The payload is strictly validated, with unknown fields rejected. Runtime requests must also match the current Codex thread and turn. Bots have no HTTP endpoint for unrestricted database/policy access.

Each execution permits 32 successful company tool calls and each task four reports of at most 20,000 characters. A hire does not create a runtime binding or start work. Tool-call receipts reject replay with different payloads. Ordinary messages and task text cannot create trusted approval, mutate capability sets or alter history.

## Task and worker lifecycle

```text
queued → working → completed
            ├→ failed → queued (human inspected retry)
            ├→ blocked → queued (result event or inspected retry)
            ├→ awaiting_approval → queued (same-authority inspected retry)
            └→ cancelled
```

Completed/cancelled tasks are immutable terminal states. Non-running work can be cancelled. Working tasks must be interrupted first. Unresolved child tasks must be dealt with before a parent is cancelled/retried.

Atlas's initial execution can hire and assign Scout, then end. Its **execution** completes, but its objective **task** becomes blocked with `waiting_children`. When the direct child reaches a terminal state, the company records a unique result event and queues the same parent task with reason `child_results`. This also works if Scout finishes before Atlas's initial execution ends. Atlas's next execution receives the child's status, summary and artifact content, evaluates it and completes the objective. The review phase cannot delegate again, bounding the loop.

Worker runtime activity is separate from task outcome. A worker returns to idle after a run if it has no queued assignment, even when a task needs inspection. Task and execution views retain the blocked/failed state. Temporary workers accept one lifetime assignment and are disabled after it becomes terminal; history is retained. Persistent workers remain available.

## Event-driven dispatcher

The company emits local state-change events after operations. The dispatcher coalesces notifications with `setImmediate`; there is no timer that invokes idle models. Startup checks existing queued work once. Assignment, result completion and resume-dispatch events trigger further checks.

A claim transaction verifies pause, worker enablement and absence of a running execution, then changes queued → working, inserts the Execution and appends events. Partial unique indexes permit one running execution per Worker and Task across database connections. Each dispatcher additionally limits global concurrency to two. Extra assignments queue behind a busy worker.

Completion stores outcome/message/events, resolves child wakeups and updates availability in a transaction. Failure does not auto-retry. Pause is durable and prevents future claims; it does not abort existing turns. Interrupt uses an AbortSignal to request `turn/interrupt`, waits for acknowledgement, and retains a blocked task for review. If a runtime fails to acknowledge, it is closed and the ambiguous state stays inspectable.

## Codex adapter

[Decision 007](../decisions/decision_007_prompt_01_runtime_and_recovery.md) selects App Server over SDK/CLI fallback because direct tool callbacks, events, durable resume and interruption are needed together.

- Private newline-delimited stdio JSON-RPC, one App Server process per execution.
- Official managed ChatGPT login is reused; the company never reads/copies tokens. Preflight reports only auth mode.
- The adapter validates CLI version `0.142.4`, opts into experimental dynamic tools, checks feature controls, disables inherited MCP servers, and uses the default advertised by `model/list` unless `BOT_MODEL` selects another advertised model.
- Shell, browser, computer use, apps, plugins, hooks, subagents, image generation, code execution and workspace dependencies are disabled. Threads/turns receive `environments: []`, read-only sandbox and no sandbox network; approval policy is `never`. Approved reads/writes occur only through company tools.
- A first execution creates a thread, gives it a Worker-specific name and persists the binding before starting a turn. Resume reads and checks the exact thread ID, name and canonical workspace before loading it. Existing bindings are not silently replaced. Exact worker-specific thread names from before the BotSquad rename remain accepted for retained data.
- Context includes role, authority, current assignment, up to eight task-linked messages, direct child results and prior artifact references. Approved documents are retrieved individually. Entire company history is not dumped into prompts. Codex separately retains/compacts its worker conversation history.
- Turn/item notifications become sanitized audit events; final text becomes a durable result message. Raw runtime stderr, credentials, reasoning and arbitrary transport payloads are not logged.
- A four-minute execution deadline bounds a turn. Runtime permission requests are denied and preserved as `awaiting_approval`; Prompt 01 has no permission-granting approval UI.

The control plane sends task/document content to an external model service. It remains local in its storage and coordination. Different worker names and threads do not create separate OS users or credentials. Confinement depends on this validated official runtime configuration; a different runtime version requires verification, not bypassing the guard.

## Restart, ownership and recovery

An exclusive per-data-directory process lock prevents a second service from running startup recovery over live work. Stale service locks are reclaimed only after the recorded process no longer exists; malformed or ambiguous locks fail for inspection. An exclusive startup gate serializes reclamation. If startup itself crashes while holding that gate, inspect its recorded PID before manually removing `startup.lock`.

Startup converts orphaned running executions to interrupted, marks their tasks blocked, and records existing artifacts. Completed work and durable messages are untouched. Valid queued work can dispatch; already finished tasks cannot be reclaimed. A pending child result is reconciled locally and queues the parent once.

Human retry requires an explicit inspection acknowledgement. It keeps earlier executions, artifacts and children. A parent with terminal children resumes in review mode; it does not blindly reassign the work. Retired workers cannot be retried, and child results cannot reopen once the manager's review is queued or the parent is terminal. Further research needs a new objective. Retrying never grants an approval or permission. Missing/unavailable Codex history fails visibly; there is no automatic rebinding that might attach the worker to another conversation.

Artifact content is written exclusively before its metadata transaction commits. A process crash in that narrow window can leave an unreferenced file; it cannot create a false committed artifact. There is no automatic orphan cleanup. Backups should include the database and artifact/workspace directories while stopped, plus normal Codex history backup where resumability is required.

## Human UI and local security

The UI shows workers, dynamic hierarchy, messages, tasks, executions, reports and audit events. Task/worker detail dialogs expose full IDs and policy/bindings. Human controls initialize Atlas, post communication, assign objectives, pause/resume dispatch, interrupt active work, cancel tasks and retry inspected work.

The server binds only `127.0.0.1`, checks exact Host/Origin, rejects cross-site requests and requires an unguessable in-memory local session token on JSON mutations. Static files are allowlisted. Content security policy and text escaping prevent message HTML from executing; artifact downloads use `text/plain` and `nosniff`. SSE signals changes; browser refreshes state without an AI invocation.

This is a single local owner trust boundary, not a hosted multi-user authentication design. A hostile process with the same OS file/account access can tamper with storage or credentials; audit triggers are application integrity controls, not cryptographic tamper-proofing. No secrets should be placed in objectives/reports.

## Acceptance and validation

The executable acceptance path is Human → real Atlas → validated Scout hire → explicit Scout assignment → real Scout report → completion event → resumed Atlas evaluation → Human. SQLite organization, messages, tasks, attempts, artifacts and bindings survive a stopped/restarted service without repeating completion.

Use `npm test` for deterministic domain, dispatcher, HTTP and transport tests. Use `npm run validate:real` for the bounded actual runtime/process-restart/interruption gates. See [the validation record](../validation/prompt-01.md) for actual evidence and limits.

## Computer Use capability (deferred)

Prompt 01 supplies no Computer Use capability or GUI sessions to workers.

Computer Use is an optional worker capability, not a default runtime property.

Prefer sandboxed browser/desktop environments for autonomous GUI tasks. Local desktop control is higher risk because workers may share an OS account, files, browser sessions, and credentials.

Computer sessions must remain subject to the normal authority ceiling and trusted approval model. GUI access does not imply authority to spend money, create accounts, send external messages, publish publicly, change credentials, upload private files, or perform destructive actions.

Runtime-specific computer/browser control belongs behind environment/runtime adapters. The control plane should own the durable session/task/approval/audit records.

See [Computer Use Model](../product/COMPUTER_USE_MODEL.md) and [Decision 006](../decisions/decision_006_bounded_computer_use.md).

## Deferred extension points

Future engineering workers should add a validated workspace allocation containing repository, worktree, branch and runtime ownership. That allocation belongs beside the Worker/runtime binding, independently of Tasks. A future adapter can provide shell/Git capability only after exclusive worktree and permission enforcement. This milestone does not allocate repositories or worktrees to workers.

Further work includes trusted scoped human approval, manager retirement, larger organizations, artifact retention, history pagination and stronger OS isolation. None is implied by current worker capabilities. Payments, outreach, public deployment and distributed orchestration remain out of scope.
