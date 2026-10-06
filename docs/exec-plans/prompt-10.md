# Execution Plan — Prompt 10 bounded Computer Use

**Status:** Active — implementation and actual Ubuntu validation; C10-1 not yet accepted
**Owner:** Parent Codex chat, sole writer/integrator/deployer; specialists read-only
**Branch:** `feature/prompt-10-computer-use`
**Worktree:** `bot_messenger-prompt10`
**Started:** 2026-10-05 15:43 America/Vancouver
**Initial ETA:** 4–8 hours, subject to browser isolation and real Ubuntu acceptance
**Current ETA:** Unchanged

## Objective and scope

Satisfy **C10-1**: an explicitly authorized Computer Operator performs real bounded
browser work from Ubuntu, with enforced authority, network/filesystem/action/time
limits, attributable evidence, exact protected-fixture approval and safe interruption,
revocation and recovery. Carry accepted implementation through normal PR merge,
exact-revision deployment and retained-state verification.

One browser session per HQ. Browser-first, headless Chromium preferred. No desktop
environment, workstation control, real business integrations, production grants or
operators, unrestricted browser APIs, secret management or Prompt 11 operations.

## Baseline and preflight

- Fetched origin; source baseline `b8f412085900801dfa47ef5bfa580bede38ab384`.
- Original clean local main and deployed source: `2185a71d968bc22e32a37160972a399f62262922`.
  The difference is the accepted specialist development workflow. Other worktrees retained.
- GitHub open-PR search returned none. Dedicated new branch/worktree owns this change.
- Live Ubuntu 24.04.5, kernel 6.8.0-142, one CPU, 1,967 MiB RAM, approximately
  1,545 MiB available, 2,047 MiB unused swap, 41 GiB available disk.
- `botsquad.service` active; health database/dispatcher true and runtime ready;
  application listener `127.0.0.1:4310`. Node 24.21.0; Codex 0.157.0.
- Production: eight enabled idle workers (Atlas/Nix/Maya/Turing/Linus/Ada/Grace/Scout),
  48 Tasks (30 completed, 17 cancelled, one blocked), 65 completed executions,
  pause=false, one unchanged Atlas public-research grant (Task/conversation), zero
  mandates/schedules; seven OS identity records. No runnable Task/model work found.
- No Chromium executable or Playwright browser cache found. Bubblewrap 0.9.0,
  AppArmor, namespace tools and nftables available. Existing service uses
  NoNewPrivileges, ProtectSystem=strict, ProtectHome, PrivateTmp/Devices, empty
  capabilities and TasksMax=256. Existing engineering seccomp is not a browser profile.
- Initial sandboxed fetch/SSH failed due to network sandbox; normal approved network
  escalation succeeded. An initial guessed health port and PATH omitted pinned Node;
  corrected reads verified port 4310 and the pinned runtime. No service change made.

## Relevant instructions and decisions

Apply AGENTS.md, the specialist guide/Decision 023, Decision 006, decisions 013–022
for existing authority, continuity, Projects, research and operating-loop boundaries,
the Computer Use model and current source. Official App Server documentation is
advisory; inspect the installed 0.157.0 schema before choosing its observation format.

## Architecture questions under review

- Durable ComputerSession as a resource of an ordinary Task/execution, with immutable
  owner-approved policy, generation fences and no conversation/group authority.
- BotSquad-managed Chromium; deny direct browser networking through a network namespace.
  Trusted request forwarding must revalidate exact origin, DNS/address, request method,
  bytes, redirects and current authorization. No native-browser feature-list relaxation.
- Fresh private browser profile; explicit minimal mounts, no credentials/worker homes;
  Chromium's own sandbox stays enabled. Validate proc/user-namespace requirements
  without weakening the retained HQ service.
- Uploads and downloads initially disabled. Screenshots retained privately with hash,
  session/Task/execution provenance and bounded count/bytes. Structured observation
  acceptable; never claim image understanding unless actually delivered and validated.
- Durable exact protected-fixture intent, payload/page fingerprint, single-use approval;
  release model slot while awaiting approval. Unknown transmitted effects never replay.

## Implementation and delivery gates

1. Finish required source/document/schema reading and live isolation proof; obtain
   focused control-plane/security/recovery design challenges.
2. Implement minimal domain/schema, browser adapter, enforcement, lifecycle and tools.
3. Integrate owner UI/API, private evidence, Task continuity and dispatcher interruption.
4. Add reproducible narrow browser installation/deployment and disposable fixture.
5. Run deterministic authority/recovery/migration tests and actual isolated Ubuntu C10-1,
   including unscripted real worker actions and server-side zero/exactly-one effects.
6. Run applicable regression, resource, Linux isolation, UI and idle checks; retain failures.
7. Obtain final security/recovery/control-plane and test-reviewer disposition; fix blockers.
8. Update current docs, decision, architecture, tutorial and validation report; inspect
   full diff and diff-check; reconcile latest origin/main; normal commit/push/PR/merge.
9. Protected consistent production backup, repeated offline migration and original-field
   comparison; deploy exact merged source/build; verify equality, health/private UI,
   preserved roster/grants/pause, zero Computer Use activation and idle work; cleanup.

## Evidence ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| Live preflight | PASS | Read-only SSH health/version/resources and SQLite inventory above |
| C10-1 | Functional gates PASS; final review pending | Real employee, 12 integration and 10 fault gates; private evidence packet |
| Specialist review | Rereview active | Three design + two implementation reviews; fixes retained; three final reviews active |
| Migration/preservation | Offline PASS; final inventory pending | 85 tables / 2,233 original rows, all fields/rowids; production untouched |
| Merge/deployment | PENDING | No milestone changes deployed |

## Remaining work and handoff

Core implementation and UI are present. Local regression: 272 passed, zero failed, one platform skip (273 total). Real Chromium launch/render/input/screenshot and namespace/seccomp status probes passed. Full browser/worker/fault acceptance and delivery remain. Do not infer completion from this
plan. Final handoff must identify exact revision equality, architecture and limits,
worker observation format, real evidence and resources, findings/dispositions, actual
test counts, retained failures, production preservation and temporary-process cleanup.

## Progress — 16:29 Vancouver

- Three read-only specialist design reviews completed; findings retained under
  `docs/validation/evidence/prompt10/design-*.txt`. Incorporated owner-only capability
  ceiling, independent browser lifetime, awaited asynchronous receipts, mutation
  uncertainty fence and private device projections. Implementation rereview pending.
- Added migration 13, policy/grants/contexts, Unix IPC broker, pinned Playwright core,
  request forwarding, exact fixture intents, owner UI and private screenshot evidence.
- Narrow runtime installed twice on Ubuntu without desktop or OS upgrade. Chromium
  153.0.8010.12 uses namespace/PID/network/seccomp sandbox; no `--no-sandbox`.
- Failures retained: unsupported bwrap flag and missing cairo/pango corrected before
  launch proof; full-unit probe exposed ProtectKernelLogs proc masking. Separate
  browser unit omits that mask to permit its fresh proc mount; non-root, empty caps,
  private network/filesystem, Chromium seccomp and other service bounds retained.
  Exact probe then passed. Existing HQ service remains unchanged.
- Initial integration hit service readiness race; explicit broker readiness gate added.
  No C10-1 claim yet. Current overall ETA remains 4–8 hours.

## Progress — 17:06 Vancouver

Actual worker safe/approve/deny/interrupt/browser-kill and HQ restart/lost-receipt gates passed.
Approved continuation has two distinct real provider references. Unknown transmission has one
recorded effect, no replay and a global new-session fence. Ten adversarial browser probes pass.
Resources peak at 257.2 MiB cgroup memory / 15 processes with healthy production responses.
Actual direct/peer/rollover/research/revoke/group/separate-assignment regressions pass; scheduled
review and Linux identity/Projects are in progress. First Ubuntu upload passed 273 tests; local
latest passed 278 plus one skip; added HTTP test passes and final synchronized suite remains.
Current overall ETA remains 4–8 hours. Normal PR/review/preservation/deployment still required.

### Candidate validation update — 2026-10-05 17:21 Vancouver

- Local full suite: 292 pass, zero fail, one Linux-only skip (293 total). Focused
  computer 26/26 and forwarder 7/7 include the second rereview corrections.
- Real mandate two-cycle schedule and idle regression passed; identity and identity
  recovery passed on Ubuntu. First Projects run reached all behavioral gates then failed
  final source-SHA collection because the development upload lacked Git metadata. Original
  state and 104 passing isolation/archive probes retained. Fresh exact-checkout run required.
- Security/recovery correction reviews and independent acceptance review are running.
- Production application remains unchanged. Initial 4–8 hour estimate remains appropriate;
  exact candidate browser/fault/Projects confirmation, merge and preserved deployment remain.
