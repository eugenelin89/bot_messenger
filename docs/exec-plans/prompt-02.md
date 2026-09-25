# Execution Plan — Prompt 02: bounded engineering organization

**Status:** Complete; implementation delivered, documentation closeout recorded here
**Owner:** Codex task 01a0d730-98d4-7a93-b17c-049bea185f48, sole implementation writer
**Branch:** codex/prompt-02-engineering-org
**Worktree:** /Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger
**Started:** 2026-09-25 09:01 UTC
**Starting / synchronized main:** aa889f7dde7283bf92fbf3acab223c399b246419
**Initial ETA:** 3–5 hours, including real validation and main delivery
**Actual implementation delivery:** 10:05 UTC, 64 minutes elapsed; documentation closeout follows

## Objective

Extend the proven control plane with a real Atlas → Maya / Turing → Linus + Ada →
Grace workflow. Two concurrent engineers develop a separate local SquadStatus
repository, submit verified commits, receive independent review, and integrate
through trusted operations with full acceptance tests before main advancement.

## In scope

Bounded profiles and workflow stages, SQLite migration, managed repositories and
exclusive worktree allocations, confined edit/test/Git tools, submissions, review,
integration, UI evidence, deterministic/security tests, real validation and restart,
current documentation, feature push and validated main integration.

## Out of scope

Computer Use, browser access, arbitrary shell/network/filesystem, external product
repositories, deployment, spending, accounts, unlimited delegation and cleanup.

## Relevant current docs / decisions

Read AGENTS, README, all three product models, architecture, Decisions 001–007,
plan template, Prompt 01 plan/validation and implementation/tests/scripts.
Fresh origin fetch proves Prompt 01 is on main. One checkout/worktree, clean main,
no other active BotSquad writer discovered. Preserve historical Prompt 01 branch
and its retained validation data. Outer unborn repository remains untouched.

## Invariants / risks changed

- Preserve messages versus tasks, event dispatch, identity, audit, pause/interrupt.
- Child effective ⊆ parent delegatable ⊆ company ceiling; fixed profiles/depth/limits.
- Service owns repository paths, branches, allocations, commit verification and integration.
- Runtime threads retain private worker workspaces; narrow tools bind engineering
  access to the current task allocation, never arbitrary paths or shared Git metadata.
- Engineer code is untrusted during tests: OS confinement is a required gate.
- Migration preserves Prompt 01 records; ambiguous filesystem/Git side effects
  must block for inspection rather than replay after a crash.
- Default product branch advances only after exact-commit review and full tests.

## Implementation steps

1. Preflight, complete architecture review and confinement investigation.
2. Durable models/migration, role profiles, staged parent wakes.
3. Managed scaffold, allocation, confined filesystem/test/Git, submissions/review/integration.
4. Role-specific runtime instructions and UI evidence views.
5. Deterministic hierarchy, migration, Git, security, recovery and regression tests.
6. Fresh real concurrent engineering, independent review, integration and restart;
   rerun Prompt 01 real behavior and inspect UI.
7. Security/diff review, documentation/evidence, feature commit/push, current-main
   integration, post-integration checks, normal push and exact remote verification.

## Validation plan

### Fast checks

Strict TypeScript, JS syntax, full deterministic suite and git diff --check.

### Local integration

Real local Git repos, exact ownership/path/branch verification, distinct allocations,
submission integrity, conflict/test-failure preservation, idempotent integration.

### End-to-end agent execution

Required real Codex 0.142.4: six persistent workers, Maya spec before engineering,
timestamp overlap for Linus/Ada, immutable commits, real Grace review, tested product
integration, Atlas final report. Retain sanitized evidence and actual artifacts.

### Restart / recovery

Forward migration from Prompt 01; completed workflow unchanged after process restart;
interrupted engineers/Git operations retained and blocked, no automatic replay.

### Security checks

Hierarchy/authority escalation, cross-worker/sibling/source writes, canonical paths,
symlinks, shared Git metadata, remote/force commands, unsafe tests, readonly review,
review/commit mismatch and default branch compare-and-swap safety.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Preflight | aa889f7 | Pass | Fresh fetch, clean main, one writer; Prompt 01 present |
| Deterministic / main | 582c6ea | 49/49 pass | Original 31 plus 18 engineering tests |
| Real research regression | accepted source | Pass | Hire/report/evaluate, restart/resume, acknowledged interrupt |
| Real engineering | accepted digest | Pass | Six workers, 44.656 s actual turn overlap, review, 9 product tests, integration/restart |
| Main delivery | 582c6ea | Pass | Preflight, fast-forward, normal push, exact remote equality |

## Decisions made during execution

Accepted Decision 008 records the verified narrow-tool design, managed Git policy,
macOS test confinement, legacy binding limitation and conservative crash recovery.

## Documentation freshness

Update README, vision, organization model, architecture and decision index to actual
Prompt 02 behavior; clarify Computer Use remains deferred. Preserve Decisions 001–007
history. Add validation record, sanitized JSON, Maya spec, Grace review and acceptance.

## Remaining work / blockers

No implementation blocker or unfinished milestone scope. All feature and main gates
passed, main was pushed normally and local/remote equality verified. This documentation
closeout retains the delivery facts without changing executable source.

## Completion handoff

Actual IDs/timings, acceptance evidence, architecture, limits, ETA revisions and Git
delivery are in [validation](../validation/prompt-02.md). Validated implementation
`582c6ea5794547bd0fd63eb2a806b068e1272d17` was fast-forwarded from `aa889f7`,
passed 49/49 tests and Codex preflight on main, then pushed and fetched with matching
local/remote SHA. Feature and Prompt 01 historical branches remain preserved.
This documentation-only closeout preserves that executable identity.

## Progress and ETA ledger

- 09:01 UTC: initial 3–5 hour estimate, preflight and complete architecture review.
- 09:07–09:10 UTC: verified confined Node startup; regular-file read restrictions
  must preserve inherited pipes. Final runner combines Seatbelt with Node permissions.
- 09:26 UTC: core, UI and 45 deterministic tests pass, including actual conflict,
  failed acceptance preservation, confinement and restart. Estimate revised to 60–100
  minutes remaining because implementation progressed faster than planned.
- 09:31 UTC checkpoint: real fresh six-worker validation running; actual Atlas hired
  Maya, spec completed and Atlas resumed to hire Turing. Pinned runtime preflight passes.
  No hard blocker. Real acceptance, browser inspection, review/docs and Git delivery remain.

- 09:35 UTC: first fresh real trial stopped on Atlas’s resumed turn deadline after
  a successful CTO hire. Runtime log confirms the tool result was received; no later
  model response/protocol error was recorded. Failed state retained, no automatic retry.
- 09:39 UTC: review corrected post-commit interrupted retry eligibility, requires test
  runner completion evidence, and explicitly handles legacy dynamic-tool schemas.
  Deterministic suite rerunning before the next bounded real trial. ETA unchanged.

- 09:47 UTC: second real trial passed all six workers, exact-commit review, 8/8
  integrated tests, candidate fast-forward and restart. Real runtime turns overlapped
  29.699 seconds. UI inspected during live engineering and Maya artifact opened.
- 09:55 UTC: final review added manager completion evidence guards, attributed denied
  scope records, stronger retained-worker migration coverage and OS signal denial.
  Final acceptance will rerun on this hardened source. ETA 40–60 minutes remaining.

- 10:01 UTC: final hardened real run PASS, 46.477 seconds execution overlap and
  44.656 seconds actual Codex-turn overlap; Grace approved exact commits, full product
  tests 9/9 pass, candidate safely fast-forwarded, process restart preserved all records.
  Prompt 01 real research/resume/interruption regression PASS; deterministic suite 49/49.
- 10:03 UTC: accepted UI inspected live and after restart: organization, concurrent
  executions, spec, allocations, submission commits, Grace findings and integration
  test/output JSON. Source/security diff reviewed; no new dependencies or scope expansion.

- 10:05 UTC: feature pushed, current main fast-forwarded without conflict, full
  post-main suite 49/49 and Codex preflight passed; normal main push and fetch verified
  matching `582c6ea` locally/remotely. Reused accepted real evidence on explicitly
  identical executable source. Implementation delivery elapsed 64 minutes.
