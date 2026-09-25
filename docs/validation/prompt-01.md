# Prompt 01 validation record

**Date:** 2026-09-25
**Environment:** macOS ARM64; Node 24.10.0; npm 11.6.0; official Codex CLI 0.142.4.
**Authentication:** existing managed ChatGPT login; no credentials copied or recorded.
**Model:** `gpt-5.5`, advertised by the pinned runtime's `model/list`.

## Deterministic checks

`npm test`: **30 passed, 0 failed**. Includes strict TypeScript build.

- Persistent worker identity, manager, lifecycle, minimal/delegatable capabilities.
- Rejection of child authority above the parent ceiling, unknown capabilities and forged sender fields.
- Bot-authored approval text and malformed/hostile message content do not alter policy or trusted approvals.
- Direct worker/context/thread/workspace swaps rejected, including Atlas ↔ Scout swaps.
- Protected audit and immutable messages; no ordinary tool for approval/policy/database mutation.
- Valid/invalid state transitions; task assignment, parent/result and artifact linkage.
- Temporary workers accept one lifetime assignment and retire without losing history; concurrent startup is serialized.
- Retry rejects retired workers and child results already handed back to the manager, preserving the review outcome.
- Two SQLite connections cannot claim the same worker/task; duplicate tool delivery does not repeat hiring.
- No idle model traffic; paused work stays queued; active work is not implicitly interrupted by pause.
- Complete fake Atlas → Scout → Atlas workflow with artifact content consumed by the manager.
- Restart retains messages/tasks/executions/artifacts/bindings; completed tasks do not run again.
- Interrupted execution evidence retained, requiring human inspection before a new attempt.
- Runtime failure and approval-required states remain visible without automatic retry.
- Confinement configuration, App Server thread identity, streaming, resume, interruption, timeout and unexpected process exit.
- Loopback HTTP Host/Origin/JSON/session-token boundary, static UI serving and SSE updates.
- Artifact/document confinement, SHA-256 verification and symlink substitution rejection.

`npm run check`, `node --check public/app.js`, and `git diff --check` also pass.

## Real Codex execution

Command: `npm run validate:real`.

Final accepted run: **06:53:24–06:54:36 UTC (72 seconds)**. Both Atlas and Scout are
persistent, enabled workers. Scout's title is **Market Researcher**, reporting to Atlas.
The app started with a fresh database and no pre-provisioned Scout.

| Step | Execution | Result |
| --- | --- | --- |
| Real Atlas requests hire and assignment | `execution_2426b743-1af3-4a6b-882b-9330175b571d` | Completed |
| Real Scout reads approved docs and submits report | `execution_935596a9-2e7c-4e1d-89a2-e52ccfb21cb4` | Completed; artifact saved |
| Completion event queues and resumes Atlas | `execution_945b41f2-7951-46b9-8f40-ddcf81277539` | Completed; evidence evaluated |
| App stops/restarts, then Atlas resumes again | `execution_63d78d23-38c1-485d-b9a2-6d9c1620cfa2` | Completed using the original binding |
| Separate real turn is interrupted | `execution_24aaf49b-58d3-4b34-b39e-ad7004daa90d` | Codex acknowledged interruption; test task subsequently cancelled |

Main objective: `task_b8d0120b-d9a5-43ee-8957-1cc4c9d54ec4`.
Scout task: `task_5ae45b84-ac89-4a7e-b709-31b15f5c495f`.
Report: `artifact_b62ee206-5a01-4257-9c6d-2fc97e1bfe7d`.

The original workflow has two tasks and three successful executions. The additional
restart and interrupt probes bring retained validation state to four tasks, five
attempts and one report. Equality assertions verify that restart preserves task,
message, execution, artifact and binding records and produces no duplicate run.
The same Atlas runtime reference is used before and after restart. Pause is also
verified before the first task starts.

Evidence retained in the checkout:

- [Sanitized IDs, timings, hierarchy and checks](prompt-01-evidence.json)
- [Scout's actual report](prompt-01-scout-report.md)
- [Atlas's actual evaluation](prompt-01-atlas-evaluation.md)

Full local database and snapshots are in the ignored directory
`.validation/real-2026-09-25T06-53-24-209Z/`. No authentication data is included in the
checked-in evidence. To inspect that retained local state, stop any current instance
on port 4310 and run:

```sh
BOT_DATA_DIR=.validation/real-2026-09-25T06-53-24-209Z npm start
```

On another checkout, `npm run validate:real` creates its own evidence directory and
fresh IDs; the local retained directory is intentionally not distributed with Git.

## Browser verification

Inspected the running application in the Codex in-app browser at 1280×720:

- Dynamic Atlas/Scout hierarchy and persistent lifecycle visible.
- Durable Human/Atlas/Scout/System messages visible.
- Task detail shows requester, assignee, criteria, parent, result and execution attempts.
- Report opens inside a safe text-only inspection dialog with provenance and hash.
- Execution view shows completed attempts and acknowledged interruption.
- Audit view shows provisioning, assignment, result, wake/resume and lifecycle events.
- Pause/resume displays the correct semantics. A browser-submitted objective stayed
  queued while paused and was cancelled before dispatch, with no execution created.
- Message-only submission rendered literal HTML-like text without creating a task.
- Browser reconnected after server replacement and mutation controls still worked
  with a refreshed local session token.

An initial raw text artifact navigation was blocked by the embedded browser. The UI
was changed to fetch and display escaped report content in its own dialog, then
retested successfully. UI-only tests used an earlier retained validation dataset;
the final accepted dataset was separately checked for the exact Scout name/title.

## Findings and limits

Initial real attempts failed because desktop configuration selected `gpt-6-astra`,
which this CLI rejected as requiring a newer version. npm also initially found an
older CLI through PATH. The implementation now pins the verified CLI locally and
chooses its advertised model default. Failed attempts remain in separate ignored
validation directories; they are not counted as success.

Earlier successful trial runs selected a temporary Scout or a different research
title. The initial worker instructions and real assertions now specify the requested
persistent **Scout — Market Researcher**. The final accepted run passes those assertions.

No external accounts, spending, publishing or engineering repositories were used.
Actual permission grants are intentionally unavailable; approval refusal is tested
with a deterministic protocol fixture. No multi-user, hostile same-OS-user, large-scale
load, Windows/Linux or mobile-browser certification is claimed. Node SQLite and the
pinned App Server experimental controls require version-aware maintenance.
