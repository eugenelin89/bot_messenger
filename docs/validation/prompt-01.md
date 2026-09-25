# Prompt 01 validation record

**Date:** 2026-09-25
**Environment:** macOS ARM64; Node 24.10.0; npm 11.6.0; official Codex CLI 0.142.4.
**Authentication:** existing managed ChatGPT login; no credentials copied or recorded.
**Model:** `gpt-5.5`, advertised by the pinned runtime's `model/list`.

## Deterministic checks

`npm test`: **31 passed, 0 failed**. Includes strict TypeScript build.

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
- Exact worker bindings using the previous product name remain valid after the accepted rename.
- Loopback HTTP Host/Origin/JSON/session-token boundary, static UI serving and SSE updates.
- Artifact/document confinement, SHA-256 verification and symlink substitution rejection.

`npm run check`, `node --check public/app.js`, and `git diff --check` also pass.

## Real Codex execution

Command: `npm run validate:real`.

Final accepted run after integrating the BotSquad rename: **07:09:01–07:10:04 UTC (63 seconds)**. Both Atlas and Scout are
persistent, enabled workers. Scout's title is **Market Researcher**, reporting to Atlas.
The app started with a fresh database and no pre-provisioned Scout.

| Step | Execution | Result |
| --- | --- | --- |
| Real Atlas requests hire and assignment | `execution_fa1368c5-ac6c-4125-be38-5cad0b70180f` | Completed |
| Real Scout reads approved docs and submits report | `execution_7bbdc472-ee0c-41ad-bf6a-4b1ae504d1a0` | Completed; artifact saved |
| Completion event queues and resumes Atlas | `execution_4303e1eb-998b-4cc5-8e54-cdfd11402270` | Completed; evidence evaluated |
| App stops/restarts, then Atlas resumes again | `execution_1f3323e3-9738-4177-917a-0773b03d1d07` | Completed using the original binding |
| Separate real turn is interrupted | `execution_2ad7403e-f1ce-425f-9e4d-a2b8fd71f727` | Codex acknowledged interruption; test task subsequently cancelled |

Main objective: `task_5b50ba99-f480-444f-ad49-7dac18c4802c`.
Scout task: `task_1a9d7783-d65b-4756-bd33-3a6df39a6b50`.
Report: `artifact_fff76a3a-7942-46d8-8887-5d7e9bc67e84`.

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
`.validation/real-2026-09-25T07-09-01-532Z/`. No authentication data is included in the
checked-in evidence. To inspect that retained local state, stop any current instance
on port 4310 and run:

```sh
BOT_DATA_DIR=.validation/real-2026-09-25T07-09-01-532Z npm start
```

On another checkout, `npm run validate:real` creates its own evidence directory and
fresh IDs; the local retained directory is intentionally not distributed with Git.

## Browser verification

Inspected the running application in the Codex in-app browser at 1280×720:

- Dynamic Atlas/Scout hierarchy and persistent lifecycle visible.
- Final BotSquad branding, hierarchy and pause/resume controls rechecked on the post-merge dataset.
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

During final Git delivery, `origin/main` advanced to `bfb5efc` with the accepted
BotSquad rename (Decision 005). Those changes were merged into the feature branch;
UI, package, prompts and protocol naming now use BotSquad. Runtime Decision 006
avoids the concurrent decision-number collision. The 31-test suite and the complete
real workflow/restart/interruption gate were rerun successfully after integration.
