# BotSquad

A local workspace for a human to coordinate persistent AI workers through explicit tasks, durable messages and inspectable evidence.

Prompt 02 adds **Human → Atlas → Maya / Turing → Linus + Ada → Grace → tested integration → Human**. Two real Codex engineers work concurrently in separate branches/worktrees of a managed local SquadStatus repository. Prompt 01’s **Atlas → Scout → Atlas** research workflow remains available. Atlas decides to request a specialist; trusted company tools validate the hire and assignment. The dispatcher runs real Codex only when work exists. Creating a worker or posting a message does not invoke a model.

**New to BotSquad?** Read the [SquadStatus case study](docs/examples/squadstatus-case-study.md)
for a simple walkthrough of the bots, their separate product repository and worktrees,
and how an objective became reviewed, tested code.

## Run locally

Requirements: **Node.js 24.10+ (24.x)**, local Git, macOS for confined engineering tests, and a Codex login with model access. The official Codex CLI is pinned as a project dependency because this adapter uses version-specific experimental App Server fields.

```sh
npm ci
npx --no-install codex login        # only if not already signed in
npm run codex:preflight
npm run dev
```

Open [BotSquad](http://127.0.0.1:4310). After the first build, `npm start` is sufficient.

1. Click **Initialize Atlas**.
2. Select **Build SquadStatus** in the executive channel, then **Assign objective**.
3. Maya produces a specification; Atlas hands delivery to Turing.
4. Linus and Ada implement separate modules in distinct managed branches/worktrees.
5. Grace reviews the exact submitted commits. Trusted integration runs full tests
   before advancing the product's local `main`.
6. Inspect **Products & engineering**, organization, tasks, executions and artifacts;
   Atlas reports the actual product commit, tests and remaining limits.

**Research coordination risks** selects the compatible Scout research workflow.
The engineering workflow is intentionally a fixed, local validation product.

**Send message only** persists communication without creating a task. **Pause new dispatch** holds queued work; active runs continue. Use **Interrupt** in Executions to stop an active Codex turn. Stopping a run never erases its history or artifacts.

State lives in `.data/company.sqlite`, with reports in `.data/artifacts/`, worker runtime workspace bindings in `.data/workspaces/`, and separate product Git repositories/worktrees in `.data/products/`. Restarting with the same data directory preserves the organization and does not repeat completed work. Back up the whole data directory while the application is stopped; Codex session history is separately managed by the official runtime.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4310` | Loopback-only HTTP port |
| `BOT_DATA_DIR` | `.data` in this repository | Persistent company database, workspaces and artifacts |
| `CODEX_BIN` | `codex` on npm's PATH | Optional explicit binary; must be the validated version `0.142.4` |
| `BOT_MODEL` | Default advertised by Codex `model/list` | Optional advertised model ID; unavailable IDs fail closed |
| `BOT_VALIDATION_DIR` | New timestamped directory under `.validation/` | Retained real-validation evidence; must be fresh |

`npm` scripts resolve the pinned local CLI. A global/desktop CLI can differ. Preflight prints the effective version, authentication mode and model without credentials. This environment's advertised model is `gpt-5.5`; the adapter deliberately does not inherit an incompatible model name from a desktop configuration.

Codex owns authentication and credential refresh. BotSquad does not copy credentials or control unrelated ChatGPT/Codex conversations. Assigned task content, selected local documents and report evidence are sent to the external Codex model service. Coordination state remains local.

## Validate

```sh
npm run check
npm test
npm run validate:prompt01
npm run validate:real
```

Deterministic tests use a fake worker runtime and a simulated App Server transport. They cover authority, identity, task transitions, claims, duplicate delivery, crash recovery, retained evidence, pause/interrupt, the complete handoff, HTTP protections and live events. Engineering tests also use real local Git repositories and the actual confined product runner for scope, review, integration, failure and recovery checks. Tests need permission to bind loopback ports.

`validate:prompt01` runs the real research/restart/resume/interruption regression.
`validate:real` runs the real six-worker engineering organization in fresh data,
asserts actual engineer/runtime-turn overlap, exact-commit review, tested integration,
deterministic product output and restart without replay. Both consume Codex usage.
Each turn has a four-minute deadline; the engineering scenario has a fifteen-minute
observation deadline. Artifacts, SQLite/Git state and evidence remain under ignored
`.validation/` directories. See [Prompt 01](docs/validation/prompt-01.md) and
[Prompt 02 evidence](docs/validation/prompt-02.md).

## Architecture

- **Domain/control plane:** TypeScript, trusted operations and centrally validated task transitions.
- **Persistence:** Node SQLite, versioned migrations, foreign keys, WAL, transactions and unique active-execution constraints.
- **Dispatch:** local events and transactional claims; maximum one execution per worker, two globally. No model polling or interval dispatch loop.
- **Runtime:** official Codex App Server over private stdio. Dedicated persistent thread binding per logical worker; a separate execution record per attempt.
- **Tools:** explicit profile hiring, staged assignment, messages/reports, managed repository allocation, owned source editing, fixed confined tests, verified submissions, read-only review and trusted integration. Identity and allocation scope come from the active execution.
- **UI:** static browser JavaScript/CSS, Node HTTP and server-sent state-change events. No frontend framework or hosted service.

[System architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) describes lifecycle, enforcement, recovery and extension boundaries. [Decision 007](docs/decisions/decision_007_prompt_01_runtime_and_recovery.md) records the original runtime choices; [Decision 008](docs/decisions/decision_008_managed_engineering.md) records the engineering extension.

## Current limits

This is a single-owner local research and engineering milestone. Eight workers,
three direct children per manager, two hierarchy edges, and two active executions
globally. Atlas may delegate Product Manager/CTO profiles; CTO may delegate two
engineers and one reviewer. Leaf roles cannot hire. One fixed SquadStatus template,
two editable modules, one review and one integration attempt per product; no external
repository registration, shell, browser, Computer Use, network, remotes or publishing.

Engineers use task-bound source/test/Git tools; their Codex runtime remains read-only.
Source writes are limited to the assigned module and optional extra tests, 16 KB each.
Test processes use macOS Seatbelt plus Node permissions, empty environment, ten-second
timeout and bounded output. Tests cannot write files, spawn processes, signal host processes or use network.
Unsupported test environments fail closed. This runner was validated with Homebrew
Node on macOS ARM64; other platforms require a validated isolation adapter.

Submission freezes the engineer's worktree. Grace can inspect exact diffs and focused
evidence but cannot edit or integrate. Full tests run on a retained candidate before
fast-forwarding product `main`. A rejected review, conflict or failed test prevents
advancement. Completed branches/worktrees stay retained; cleanup is manual future work.

Runtime approval requests are denied and preserved as `awaiting_approval`. There is no permission-granting approval workflow yet. **Retry inspected task** reruns the same authority envelope after you inspect prior attempts, artifacts and child tasks; it does not grant the rejected permission. Interrupted/ambiguous work is never automatically replayed. Missing/corrupt runtime sessions fail visibly rather than silently binding to another worker.

Dynamic tools and environment controls are experimental and tied to Codex 0.142.4. Node's SQLite API emits an experimental warning in Node 24.10. Local HTTP checks Host/Origin and requires a session token for writes, but this is not isolation from a malicious process running as the same OS user. There is no multi-user login, audit tamper-proofing against the file owner, artifact retention automation or large-history pagination.

Temporary researchers accept one lifetime assignment and retire when it becomes terminal; persistent workers remain available. Retired workers cannot be retried. A child result already handed back to its manager cannot be reopened; assign a new objective for further work. Optional manager retirement and approval-request tools are not implemented. Ambiguous engineering/Git operations are blocked for inspection; this milestone does not automatically repair or replay them. General revision loops and trusted human approval grants remain future work.

Retained Prompt 01 databases migrate without losing history. An existing Codex thread
retains its original dynamic tool schema, which this pinned runtime cannot replace on
resume. Such bindings continue to support research; engineering fails visibly with
guidance to use a fresh `BOT_DATA_DIR` (for example `BOT_DATA_DIR=.data/prompt02 npm run dev`).
No old worker thread is silently replaced. Keep the original directory for inspection.

## Project references

- [Project vision](docs/product/PROJECT_VISION.md)
- [AI organization model](docs/product/AI_ORGANIZATION_MODEL.md)
- [Computer Use model](docs/product/COMPUTER_USE_MODEL.md)
- [Decision index](docs/decisions/README.md)
- [Agent instructions](AGENTS.md)
- [Prompt 01 execution plan](docs/exec-plans/prompt-01.md)
- [Prompt 02 execution plan](docs/exec-plans/prompt-02.md)
