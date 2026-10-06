# Execution Plan — Prompt 10 bounded Computer Use

**Status:** Complete — C10-1 and application release accepted; final documentation identity recorded in delivery handoff
**Owner:** Parent Codex chat, sole writer/integrator/deployer; specialists read-only
**Branches:** `feature/prompt-10-computer-use` (implementation PR #13); `codex/prompt10-completion-record` (verified completion record)
**Worktree:** `bot_messenger-prompt10`
**Started:** 2026-10-05 15:43 America/Vancouver
**Initial ETA:** 4–8 hours, subject to browser isolation and real Ubuntu acceptance
**Application release accepted:** 2026-10-05 18:03 America/Vancouver, about 2 hours 20 minutes after start
**ETA outcome:** Faster than the initial 4–8 hour range; the existing typed-tool path and bounded Chromium environment worked without a desktop. Final completion-document delivery follows the accepted release.

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
| C10-1 | PASS | Final real employee, 12 integration and 18 fault gates; private evidence packet |
| Specialist review | PASS — four required roles | Every material finding closed; source and actual UI/bypass evidence reviewed |
| Migration/preservation | PASS | Offline 85 tables / 2,233 rows, every field/rowid; production 74 databases / 53,670 original rows, 381 account/group mappings, 634 root records, 189 homes |
| Merge/deployment | PASS | Normal PR #13 merge a4cfbc4, independent 294/294 Ubuntu, all 228 built files identical, exact source/health identity and ready private HQ |
| Repeat install / inactive / idle | PASS | Broker PID replacement and readiness; actual private UI; 30.27 seconds no model/browser work; zero production computer authority |

## Remaining work and handoff

Implementation, actual runtime/UI acceptance, independent review and production delivery pass.
Final Ubuntu suite and independently merged revision: 294/294 each; local: 293 passes and
one Linux-only skip. The completion-documentation PR carries the verified release evidence;
its exact final source/build/health receipt is recorded outside Git in the delivery handoff
and protected host journal. That revision must also be normally merged and deployed before
the final handoff. No production Computer Use authority is activated by this milestone.

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

### Final candidate gates — 2026-10-05 17:40 Vancouver

- Four required specialist reviews found no blocking authority defect. Their material
  lifecycle/UI/evidence findings are fixed and tracked separately from release acceptance.
- Product revision fc775af passed 294/294 Ubuntu tests, 293 local passes plus one Linux-only
  skip, 18 actual browser fault gates including pending launch loss and immediate handoff.
- db7492b preserves all tested product/deployment/unit sources and corrects only fixture
  observation/provenance. All 12 real browser integration gates now pass with per-mechanism
  redirect, XHR, image, WebSocket, valid service-worker and popup denial evidence. Failed
  integration6 remains; fixture DOM-ID collision and asynchronous status interpretation
  were corrected without changing the browser policy or weakening assertions.
- Exact-checkout Projects passed with 104 UID/archive checks; all existing-mode real
  regressions are complete. Fresh worker3 safe/approved continuation and UI lost-close-ack
  confirmation are in progress. PR #13 is draft; production is still the baseline revision.

### Pre-release acceptance — 2026-10-05 17:48 Vancouver

Security and test final reviews close all material implementation/runtime evidence findings.
Test reviewer explicitly supports normal merge/deployment. Final worker3 safe22actions/five
PNGs and exact approved one-effect continuation passed; actual owner UI lost-ack cleanup
recheck passed after 55.37 seconds without authority restoration or effect. All validation
services are stopped. Fresh protected inventory covers 74 databases, 634 provisioner records
and 189 worker homes; offline migration preserves all2,233 original fields/rows/rowids.
PR13 will progress through normal merge; production/inactive/idle gates remain open.

### Accepted production deployment — 2026-10-05 18:03 Vancouver

PR #13 merged normally as a4cfbc40ffe1929ddc6c84f7da92166a55eac9b4. The exact merged revision
passed 294/294 Ubuntu tests under the service restrictions; independent and production
dist/public manifests match all 228 files. Local main, origin/main, deployed checkout and
running health identity matched. The narrow browser service installer ran twice, replacing
PID 500829 with 501369 and confirming readiness; no OS/package upgrade occurred in either run.
The retained HQ unit is byte-identical, runtime ready, listener only 127.0.0.1:4310.

The actual private UI opens Computer Sessions without a session, operator or model execution.
The 30.27-second idle gate preserves all counts and PIDs with zero Chromium processes.
All eight workers remain enabled/idle; 48 Tasks, 65 completed executions, one original
research grant, seven identities, pause=false, zero mandates/schedules and all computer
tables empty. All task-owned temporary services are stopped. The 74-database preservation
comparison passes for 53,670 original rows, account/group mappings, homes and root records;
only the live workers.updated_at heartbeat is excluded. Offline migration preserves every field.

Two verification-helper mistakes (ss peer column; symlink versus canonical Node path) are
retained and corrected without changing production or weakening the asserted boundaries.
Current-facing docs now mark Prompt 10 Complete and Prompt 11 Next. The final docs-only
merge/deployment uses the same application/build and repeats identity, preservation and idle
gates. Final exact SHA is supplied by the handoff/protected journal to avoid self-reference.
