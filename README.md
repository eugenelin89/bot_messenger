# Bot Messenger

A local workspace for a human to coordinate persistent AI workers through explicit tasks, durable messages and inspectable evidence.

Prompt 01 implements **Human → Atlas (CEO) → Scout (Researcher) → Atlas → Human**. Atlas decides to request a specialist; trusted company tools validate the hire and assignment. The dispatcher runs real Codex only when work exists. Creating a worker or posting a message does not invoke a model.

## Run locally

Requirements: **Node.js 24.10+ (24.x)** and a Codex login with model access. The official Codex CLI is pinned as a project dependency because this adapter uses version-specific experimental App Server fields.

```sh
npm ci
npx --no-install codex login        # only if not already signed in
npm run codex:preflight
npm run dev
```

Open [Bot Messenger](http://127.0.0.1:4310). After the first build, `npm start` is sufficient.

1. Click **Initialize Atlas** (or assign an objective, which initializes Atlas automatically).
2. Use the prefilled harmless local research objective, or enter your own bounded company objective.
3. Click **Assign objective**. Atlas can hire Scout and assign a research task through validated tools.
4. Watch Scout appear in the team and organization views. Inspect tasks, execution attempts, report artifacts and audit history.
5. Scout's result queues Atlas to resume, evaluate the evidence and report to you.

**Send message only** persists communication without creating a task. **Pause new dispatch** holds queued work; active runs continue. Use **Interrupt** in Executions to stop an active Codex turn. Stopping a run never erases its history or artifacts.

State lives in `.data/company.sqlite`, with reports in `.data/artifacts/` and worker workspace bindings in `.data/workspaces/`. Restarting with the same data directory preserves the organization and does not repeat completed work. Back up the whole data directory while the application is stopped; Codex session history is separately managed by the official runtime.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4310` | Loopback-only HTTP port |
| `BOT_DATA_DIR` | `.data` in this repository | Persistent company database, workspaces and artifacts |
| `CODEX_BIN` | `codex` on npm's PATH | Optional explicit binary; must be the validated version `0.142.4` |
| `BOT_MODEL` | Default advertised by Codex `model/list` | Optional advertised model ID; unavailable IDs fail closed |
| `BOT_VALIDATION_DIR` | New timestamped directory under `.validation/` | Retained real-validation evidence; must be fresh |

`npm` scripts resolve the pinned local CLI. A global/desktop CLI can differ. Preflight prints the effective version, authentication mode and model without credentials. This environment's advertised model is `gpt-5.5`; the adapter deliberately does not inherit an incompatible model name from a desktop configuration.

Codex owns authentication and credential refresh. Bot Messenger does not copy credentials or control unrelated ChatGPT/Codex conversations. Assigned task content, selected local documents and report evidence are sent to the external Codex model service. Coordination state remains local.

## Validate

```sh
npm run check
npm test
npm run validate:real
```

Deterministic tests use a fake worker runtime and a simulated App Server transport. They cover authority, identity, task transitions, claims, duplicate delivery, crash recovery, retained evidence, pause/interrupt, the complete handoff, HTTP protections and live events. Tests need permission to bind loopback ports.

`validate:real` launches the actual service in a fresh directory, runs real Atlas/Scout/Atlas, stops and restarts the process, checks retained state and no replay, resumes Atlas once after restart, and interrupts a final real turn. It consumes Codex usage. Each turn has a four-minute deadline. Evidence and the Scout report are retained under `.validation/`; no mocks count as real-runtime success. See [validation evidence](docs/validation/prompt-01.md).

## Architecture

- **Domain/control plane:** TypeScript, trusted operations and centrally validated task transitions.
- **Persistence:** Node SQLite, versioned migrations, foreign keys, WAL, transactions and unique active-execution constraints.
- **Dispatch:** local events and transactional claims; maximum one execution per worker, two globally. No model polling or interval dispatch loop.
- **Runtime:** official Codex App Server over private stdio. Dedicated persistent thread binding per logical worker; a separate execution record per attempt.
- **Tools:** `hire_worker`, `assign_task`, `message_worker`, `list_company_status`, `read_document`, `submit_artifact`. Identity is bound to the active execution, never supplied by tool payloads.
- **UI:** static browser JavaScript/CSS, Node HTTP and server-sent state-change events. No frontend framework or hosted service.

[System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) describes lifecycle, enforcement, recovery and extension boundaries. [Decision 006](docs/decisions/decision_006_prompt_01_runtime_and_recovery.md) records the implementation choices.

## Current limits

This is a single-owner, local research milestone. Eight worker records maximum, one direct research assignment per objective, no recursive delegation, and no shell, browser, external accounts, spending, publishing, or engineering worktrees. `read_workspace` means reading approved document snapshots; `write_workspace` means submitting bounded report content to the controlled artifact store. These capabilities do not grant arbitrary filesystem access.

Runtime approval requests are denied and preserved as `awaiting_approval`. There is no permission-granting approval workflow yet. **Retry inspected task** reruns the same authority envelope after you inspect prior attempts, artifacts and child tasks; it does not grant the rejected permission. Interrupted/ambiguous work is never automatically replayed. Missing/corrupt runtime sessions fail visibly rather than silently binding to another worker.

Dynamic tools and environment controls are experimental and tied to Codex 0.142.4. Node's SQLite API emits an experimental warning in Node 24.10. Local HTTP checks Host/Origin and requires a session token for writes, but this is not isolation from a malicious process running as the same OS user. There is no multi-user login, audit tamper-proofing against the file owner, artifact retention automation or large-history pagination.

Temporary researchers accept one lifetime assignment and retire when it becomes terminal; persistent workers remain available. Retired workers cannot be retried. A child result already handed back to its manager cannot be reopened; assign a new objective for further work. Optional manager retirement and approval-request tools are not implemented. Next: explicit repository/worktree/branch/runtime ownership for concurrent engineering workers, with independent review. That expansion is outside Prompt 01.

## Project references

- [Project vision](docs/product/PROJECT_VISION.md)
- [AI organization model](docs/product/AI_ORGANIZATION_MODEL.md)
- [Decision index](docs/decisions/README.md)
- [Agent instructions](AGENTS.md)
- [Prompt 01 execution plan](docs/exec-plans/prompt-01.md)
