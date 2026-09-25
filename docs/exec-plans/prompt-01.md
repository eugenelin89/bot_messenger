# Execution Plan — Prompt 01: Atlas → Scout → Atlas

**Status:** Validated — Git delivery pending
**Owner:** Codex task 01a0d730-98d4-7a93-b17c-049bea185f48 (sole implementation writer)
**Branch:** codex/prompt-01-control-plane
**Worktree:** /Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger
**Started:** 2026-09-25 06:11 UTC
**Starting commit:** 9f1d07c421b5f16b6a0adc908a869c2d1d1f17a0
**Initial ETA:** 3–5 hours (09:11–11:11 UTC)
**Current ETA:** 10–15 minutes remaining at 07:10 UTC, including integration of the concurrent rename and repeated real validation

## Objective

Prove a persistent local organization in which Human assigns Atlas an objective,
Atlas hires and assigns Scout through trusted operations, Scout produces a report,
and a completion event resumes Atlas to evaluate and report. All AI work must use
real Codex in the final bounded validation.

## Scope and ownership

Implement TypeScript/Node, SQLite migrations, control plane, bounded worker tools,
event-driven dispatcher, Codex adapter, browser UI, tests and current documentation.
Exclude engineering teams, external actions, payments, hosting and multi-user support.
The supplied workspace was an empty unborn Git repository without a remote. Cloned
the authorized repository into `bot_messenger/`; fetched and verified clean main
against origin. One worktree, no ownership plans or lock files discovered. Process
inspection is sandbox-restricted. This newly cloned directory has one writer.
Preserve the outer repository. Leave the completed feature branch pushed for review.

## Relevant docs and invariants

Read AGENTS, README, product vision, organization model, architecture, decision index,
accepted Decisions 001–004 and the plan template. User Prompt 01 changes the first
acceptance scenario from Builder/Reviewer to CEO/subordinate; update current docs.

- Create, assign, message, start/resume remain separate operations.
- Text never grants authority. Identity derives from trusted execution context.
- Child capabilities are a subset of manager delegatable capabilities and policy.
- One execution per worker; transactional claims; no idle model polling.
- Runtime bindings never define domain task identity and cannot cross workers/workspaces.
- Crash recovery retains attempts/artifacts and blocks ambiguous work for inspection.
- Audit is append-only through ordinary application operations.

## Implementation steps

1. Repository/preflight and architecture review (~20 min).
2. Codex runtime and security-surface investigation (~30–45 min).
3. Persistent domain, tools, dispatcher and recovery (~60–90 min).
4. Local HTTP/UI and live operations (~30–45 min).
5. Adapter implementation, deterministic validation (~40–60 min).
6. Bounded real end-to-end and restart/UI validation (~20–40 min).
7. Documentation, security/diff review, commit and push (~20–30 min).

## Runtime preflight

- Installed Node 24.10.0, npm 11.6.0, official Codex CLI 0.142.4.
- `codex login status`: ChatGPT login is available; no credentials copied or printed.
- First choice: App Server stdio JSON-RPC. Official docs and installed generated
  experimental TypeScript schemas examined (temporary output outside repository).
- App Server supports thread/start, thread/resume, streamed turn/item events and
  turn/interrupt. Thread creation/resume does not itself run a model.
- Dynamic tools are documented **experimental** APIs requiring explicit opt-in.
  These permit session-bound tool handling with no bot-supplied sender identity.
- SDK inspected as second choice; non-interactive `exec --json` / `exec resume`
  available as fallback. No arbitrary ChatGPT Work conversation control assumed.
- Verified: tool confinement, approval refusal, binding checks, bounded timeout and
  real App Server start/resume/interruption. Official CLI pinned locally at 0.142.4.
- SDK is the documented programmatic alternative (thread creation/resume and streamed
  runs); it was not installed because App Server satisfies the requirements. Supported
  non-interactive CLI execution remains an unimplemented fallback, not a claimed path.
- The inherited desktop model gpt-6-astra was rejected by this CLI. The adapter now
  resolves the runtime-advertised default (gpt-5.5 here), with an explicit BOT_MODEL
  override only for advertised models. npm PATH shadowing was resolved by the local pin.
- Managed ChatGPT auth stays with Codex. Each Worker has a named persistent thread;
  each Execution uses a short-lived process and one turn. Resume checks thread/name/
  workspace; unknown/missing history fails visibly. Events and interruption are supported.
  Permission requests are denied and retained as awaiting_approval, with no grant API.
- Sources: https://learn.chatgpt.com/docs/app-server,
  https://learn.chatgpt.com/docs/codex-sdk,
  https://learn.chatgpt.com/docs/non-interactive-mode.

## Validation plan

### Fast checks

Strict TypeScript, domain/capability/state-machine tests, schema/constraints, diff check.

### Local integration

Fake adapter workflow; atomic claims and duplicate kicks; one active run/worker;
pause; failure/interruption; messages versus tasks; artifact linkage; HTTP security/UI.

### End-to-end agent execution

Required: real Atlas hire/assign → real Scout report → real Atlas resumed evaluation.
Capture sanitized IDs/events/report evidence and reproducible command, not credentials.

### Restart / recovery

Reopen durable database and verify organization, messages, tasks, attempts, artifacts,
bindings and pause. Do not repeat completed tasks. Ambiguous executions require review.

### Security checks

Ceiling escalation, forged sender/approval text, hostile input, protected audit,
runtime thread/worker/workspace swaps, artifact path confinement, local API boundary.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Git preflight | 9f1d07c | Pass | Clean synchronized main; scoped branch created |
| Codex availability | installed CLI 0.142.4 | Pass | App Server + ChatGPT auth available |
| Deterministic suite | `npm test` | Pass | 31 tests; strict TypeScript build |
| Real workflow + restart | 2026-09-25 07:09:01–07:10:04 UTC | Pass | Persistent Scout, three real workflow turns, resume after restart, real interrupt |
| Browser UI | local app, 1280×720 | Pass | Organization, task/execution/audit views, report dialog, pause, message, queued/cancel, reconnect |
| Static checks | `npm run check`, JS syntax, diff check | Pass | Final scoped diff review before commit |

## Decisions made during execution

Decision 006 records App Server stdio, experimental version pin, model selection,
managed authentication, small capabilities, transactional claims and conservative
recovery. Accepted Decisions 001–005 are preserved from current main. No future engineering teams implemented.

## Documentation freshness

Updated README, PROJECT_VISION, AI_ORGANIZATION_MODEL, SYSTEM_ARCHITECTURE and decision
index to describe the actual CEO/researcher slice. Added Decision 006 and reproducible
validation evidence, actual Scout report and Atlas evaluation. Accepted history preserved.

## Remaining work / blockers

The implementation commit is complete. Integration of the concurrent rename, refreshed validation evidence and final push remain. No hard blocker. Validation details and
known limits are in `docs/validation/prompt-01.md`. Network operations and loopback tests
required environment escalation; they succeeded without changing application policy.

## Completion handoff

Implementation and validation complete; final commit/push IDs will be recorded after
delivery. Local launch: `npm ci`, `npm run codex:preflight`, `npm run dev`. Human initializes
Atlas and assigns the prefilled objective. Tests: `npm test`; real gate: `npm run validate:real`.
Next milestone: explicit repository/worktree/branch/runtime ownership for two engineers
and a reviewer, coordinated by Atlas/CTO/Product Manager. It was not implemented here.

## Progress and ETA ledger

- 06:11 UTC: initial estimate 3–5 hours; new documentation-only repository.
- ~06:40 UTC checkpoint: domain/dispatcher/UI and 27 tests passed; npm selected an older
  CLI. Revised estimate to 60–90 minutes remaining because core work was ahead of plan.
- ~06:43 UTC: real turn failure diagnosed as a desktop-model/CLI mismatch. Kept failed
  history; pinned the official CLI and chose its advertised model instead of weakening
  confinement. No permissions were expanded.
- 06:46–06:54 UTC: real trial workflows, final persistent Scout/title assertions,
  process restart, same-binding resume and acknowledged real interruption passed.
- ~07:00 UTC: browser verification complete; an embedded-browser raw-artifact block
  was resolved with an escaped in-app report viewer. Review fixed a temporary-worker
  queue edge case and stale-lock startup race; 29 tests pass. ETA 10–15 minutes remaining.
- Estimate shortened because the small standard-library stack and working App Server
  surface made implementation faster than the conservative initial allowance. Scope
  and required acceptance gates were preserved.

- ~07:07 UTC: complete scoped source/documentation review finished. Added a retry guard
  for retired workers and child results already handed to the manager; 30 tests pass.
- 07:07 UTC: pre-push fetch found ten documentation commits on main, including the
  accepted BotSquad rename and Decision 005. Preserve those changes through a merge
  into this feature branch, renumber runtime decision to 006, and verify updated naming.
- 07:10 UTC: integrated BotSquad code passes 31 deterministic tests and a fresh
  63-second real workflow, process restart/resume and acknowledged interruption.
