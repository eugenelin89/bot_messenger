# Decision 007 — Prompt 01 runtime, authority and recovery

**Date:** 2026-09-25
**Status:** Accepted

## Context

Prompt 01 needs one local vertical slice with dynamic CEO hiring, real Codex work,
durable results and a resumed manager. Decisions 001–004 remain in force. The current
task prioritizes Atlas → Scout → Atlas over the earlier proposed Builder/Reviewer
acceptance sequence. The architecture's proposed SDK starting point did not provide
the direct session-bound callbacks and UI lifecycle controls as naturally as App Server.

## Decision

Use TypeScript with Node 24.x HTTP/SQLite, a static browser UI and the official Codex
App Server over private stdio. Pin the tested CLI version (`0.142.4`) in the project;
dynamic tools and environment controls are experimental. Version changes require
adapter/security validation. The SDK and supported non-interactive CLI were considered
as fallbacks; neither is needed for the chosen surface.

The official runtime owns ChatGPT authentication. The control plane never reads or
copies credential files. Use the default from `model/list` unless the operator explicitly
selects another advertised model. Local desktop configuration can name a model that
the pinned CLI cannot run, as the initial real preflight demonstrated.

Each Worker owns a canonical service-created workspace and a uniquely named Codex
thread binding. A Task owns zero or more Executions; it is not a Codex thread. Each
Execution creates a short-lived App Server process, loads/creates the worker thread,
starts one turn, handles bounded dynamic tools, and closes the transport. Idle workers
have no running model/process. Thread IDs, names and workspaces are checked before
resume, and server requests must match the active thread/turn.

The initial capability model is a small explicit set. Atlas may hire/assign but may
delegate only messaging, approved document reads and controlled report submission.
No shell execution or unrestricted workspace write is in the company ceiling.
Inherited MCP servers and unrelated runtime features are disabled; no environment
access is supplied. Permission requests are denied and preserved for inspection.
Messages never manufacture human approval or permissions.

Use SQLite transactions plus unique partial indexes for one running execution per
worker/task. The event-driven dispatcher limits global concurrency to two. Hiring,
messaging and assignment are distinct operations. A child result atomically records
its wake event; when all direct children are terminal, it requeues the parent's
objective in a bounded review phase. The same Task can have multiple execution
attempts without confusing it with the runtime session.

Persist tool-call receipts to deduplicate delivery within an execution. Preserve
execution/artifact evidence and block interrupted/ambiguous work on restart. Require
human inspection before retry, using the same capabilities. Never automatically
replace a missing runtime binding, delete previous attempts or repeat completed work.
One process lock owns recovery per data directory. Artifact file writes can leave
unreferenced files on crash; metadata never references a partially written report.

## Consequences

- One supported, inspectable local workflow without a framework or distributed queue.
- Real model usage is required for the acceptance gate; deterministic tests use fakes.
- SQLite migrations and domain/runtime boundaries remain useful for later milestones.
- Runtime confinement and managed authentication are properties of the validated
  official tooling, not isolation between different OS users.
- UI Host/Origin/session-token checks protect the local browser boundary, not against
  an attacker sharing the owner's OS account.
- Approval grants, arbitrary engineering tools, manager retirement, scalable history
  pagination and artifact cleanup remain deferred.
- Future engineering workers need explicit repository/worktree/branch ownership
  alongside workspace/runtime bindings, with concurrency tests before tools expand.

## Sources and evidence

- [Official App Server documentation](https://learn.chatgpt.com/docs/app-server)
- [Official SDK documentation](https://learn.chatgpt.com/docs/codex-sdk)
- [Official non-interactive CLI documentation](https://learn.chatgpt.com/docs/non-interactive-mode)
- [Official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)
- Installed 0.142.4 generated protocol schemas: thread start/resume, dynamic tools,
  turn start/interrupt, sandbox and environment parameters.
- [Execution plan](../exec-plans/prompt-01.md) and [validation record](../validation/prompt-01.md).
