# Execution Plan — Prompt 04: Nix, approvals and worker Linux identity

**Status:** Runtime/host acceptance complete; final main delivery tracked in handoff
**Owner:** Codex task 01a0dcb8-a9f0-73e3-b41c-a1832f5b4727; sole implementation writer  
**Branch:** feature/prompt-04-nix-worker-identity  
**Worktree:** /Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger  
**Started:** 2026-09-26 07:58 UTC  
**Starting synchronized main:** a81dc576473196a3b1634fb4fbb49a0cd07d32d3  
**Initial ETA:** 6–10 hours including real Ubuntu acceptance and delivery  
**Current ETA:** 20–40 minutes remaining as of 09:28 UTC; documentation and final main delivery

## Objective and scope

Bind logical workers to isolated non-root Linux identities, introduce Nix with typed
infrastructure tasks, durable exact-scope human approvals and a small root provisioner,
and run worker-owned engineering mutations under their UID in independent clones.
Keep central Codex authentication, existing runtime workspaces, histories and all
Prompt 03 confinement controls. Preserve the macOS development regression path.

Prompt 05+ repository generalization, remote/mobile APIs, external identities,
Computer Use, general host administration and multi-company persistence are excluded.

## Preflight and ownership

- Fetched origin and inspected branch, status, worktrees and newer commits. Clean local
  main was 26 documentation commits behind; fast-forwarded before creating the branch.
- One worktree, no conflicting local changes or active ownership plan discovered.
  No delegated implementation writers. Preserve all prior branches and validation data.
- SSH target: `botsquad`; existing operator SSH authentication only.
- Observed host: Ubuntu 24.04.5 LTS x86_64, kernel 6.8.0-142-generic, 1 vCPU,
  1967 MiB RAM, 2047 MiB swap (unused), 48 GiB root disk with 43 GiB available.
- Deployed SHA: `630cb0a9bfe0ded02d99ef1b595dcfa4bf1ce058`, clean detached checkout.
- `botsquad.service` active/enabled, User/Group botsquad, NoNewPrivileges=yes,
  runtime ready, UI only 127.0.0.1:4310. Source root-owned 0755; data/auth 0700;
  company SQLite 0600. No production mutation performed during preflight.

## Implementation phases

1. Read required docs and inspect domain, persistence, runtime, engineering, HTTP and deployment.
2. Design immutable approval envelope, OS/project bindings and explicit migrations.
3. Add narrow provisioner protocol, durable root receipts, Linux UID execution and dev backend.
4. Add Nix initialization/infrastructure tasks, dispatch readiness and safe retirement.
5. Integrate independent clones, worker-owned writes/Git and trusted review/import.
6. Add trusted approval and infrastructure UI; update reproducible bootstrap/systemd.
7. Expand deterministic migration, authority, stale/replay, parser and regression tests;
   perform explicit security review before privileged deployment.
8. Back up production safely; push and deploy exact feature SHA; use a separate validation company.
9. Run actual Nix/approval/UID/canary/engineering/retirement/recovery/resource gates,
   plus bounded reboot and research regression. Fix and repeat affected gates.
10. Record Decision 013 (if still unused), validation evidence and current documentation.
11. Fetch/inspect current main, integrate accepted work normally, push without force,
    deploy final main and verify local/origin/deployed equality and production preservation.

## Security and persistence boundaries

- Worker, Unix user, runtime binding and execution remain distinct durable concepts.
- Schema migrations preserve IDs/history/profiles/workspaces and perform no OS operations.
  Existing workers begin unprovisioned. Provisioning requires explicit trusted action.
- Codex auth stays private to botsquad; worker homes have no copied authentication.
- Approval binds operation, exact parameters/hash, target, requester, task/execution,
  expiry and preconditions; trusted human decisions are one-time and auditable.
- Messages and Codex permission requests never grant infrastructure authority.
- Provisioner is local Unix socket only, root-owned code/state, fixed typed operations,
  strict bounds and ID-derived paths, no arbitrary command/path API, durable receipts.
- Worker accounts are locked, nologin, private UID/GID/home, no privileged groups.
- UID helper performs only bounded worker actions; trusted integration controls canonical main.
- Retirement reduces authority, checks active/unmerged work and preserves evidence.
- Unknown or ambiguous state fails closed; restart reconciles receipts without reapproval/replay.

## Validation and evidence

Run TypeScript, full deterministic tests, JS/shell syntax and git diff --check. Test
retained migration, forged authority, exact payload/target/requester, expiry/denial/
consumption, stale preconditions, root parser/bounds/symlinks/idempotency, dispatch,
retirement, clone ownership and existing scheduling/runtime/security regressions.

Real Ubuntu acceptance must establish kernel access denials using harmless canaries,
real Nix execution/thread/profile and approval through trusted HTTP, real distinct
engineer UIDs with overlap, exact review/tests/integration, preserved retirement data,
pending approval restart, completed receipt reconciliation, provisioner restart,
bounded reboot and measurements. Mock tests are never Linux isolation evidence.

Roadmap remains Prompt 04 Next until all applicable gates pass. Production is not
used as the test company. Check pause/active work and take a protected backup before
deployment. Do not expose session tokens or credentials in evidence.

## Progress / ETA ledger

- 07:58 UTC: started preflight and required reading.
- 08:00 UTC: initial ETA 6–10 hours; current-main feature branch created.
- 08:02 UTC: read-only Ubuntu preflight passed; production unchanged.

## Remaining work

Runtime and all real host gates passed; finish evidence/documentation, integrate main,
run the final bootstrap and verify local/origin/deployed equality.

- 08:25 UTC: implementation covers Nix/bootstrap, durable approvals, provisioner and
  UID helper, clone allocation/import, infrastructure UI and retirement revocation.
  Expanded suite passes 80/80 on macOS plus eight Python protocol/receipt cases.
  Security review tightened clone configuration checks, no-follow revocation and
  immutable approval envelopes. Real Linux acceptance is still pending; no isolation
  or milestone completion claim yet.
- 08:28 UTC: protected production backup at `/var/backups/botsquad/prompt04-20260926T082822Z`;
  paused production had one Atlas worker and one completed execution. ETA revised
  to 2–4 hours remaining after implementation and local regression checks.
- 08:31 UTC: feature `378940296adc09b73810b10b0ce5c81af1ffff4f` deployed;
  all 80 deterministic tests passed under the production service restrictions.
- 08:37 UTC: first real bootstrap exposed a colon-invalid GECOS comment. Approval
  remained consumed with recoverable operation and reserved UID; no user was created.
  Corrected comment and added real lost-response, canary and process-retirement gates.
  Development UI smoke verified exact approval scope and simulated completion.
- 08:40 UTC: real lost-response acceptance passed: completed Linux account operation,
  withheld client response, consumed-intent restart reconciliation, same receipt and
  changed-payload rejection. Production task/message/execution/binding histories match
  backup exactly; Atlas remains unprovisioned and dispatch paused.
- 08:49 UTC: real Nix turns created all validation identities. Clone launch exposed
  systemd 255's explicit User=root/seccomp capability drop. Confirmed effective caps
  and upstream source; default-root unit retains the same bound and NoNewPrivileges,
  with startup/child capability assertions. A temporary bypass diagnostic was rejected
  by automatic review; diagnosis continued through normal socket and read-only state.
  Clone bundle then exposed Git's default master selection; now pins main explicitly.
  Every deployment continued to pass 80 hardened deterministic tests.
- 08:56 UTC: fresh run created both independent clones but control-plane traversal
  failed because mkdir(0700) masked the inherited named service ACL on their parent.
  Explicitly restored only service read/traverse; readiness now verifies actual service
  access before activating a clone. No worker fallback or broader group access added.
- 08:58 UTC: 30-minute update; ETA 90 minutes–3 hours remaining. Local 80/80 passes;
  deploying the ACL correction for fresh complete workflow, isolation/retirement,
  research regression, reboot and main delivery. Production history remains preserved.
- 09:04 UTC: full real identity run on `a8c7b9055d6e60c8109a9dcab0b59a7d55f5f2a3`
  passed: seven accounts/workers, exact review/integration, 25.012 seconds of actual
  engineer-turn overlap, 88 root/operator UID canary checks, Grace retirement killed
  the recorded sleep process, and process restarts preserved durable state. Final
  readiness guard adds an 81st test and rejects development bindings as Linux readiness.
  Final run will retire integrated Linus to additionally prove clone access revocation.

- 09:18 UTC: final gate on `9af2db810b71ec9ca1097767a61ae0aa2edb43d8` passed:
  100 isolation checks, 20.285 seconds of real engineer-turn overlap, 8/8 product tests,
  exact review/integration and Linus retirement with clone revocation/process kill.
  The preceding run passed host checks but failed a SQLite-vs-JSON prototype assertion;
  correcting JSON normalization changed only the harness. Evidence retains that failure.
- 09:20 UTC: actual lost-response recovery and provisioner restart passed with identical
  receipts/UIDs; real research, same-thread resume and interruption regression passed.
- 09:25 UTC: bounded reboot passed after a complete root-private backup; all root
  ledgers, receipts, accounts, disabled state, closed validation databases and original
  production history match. Service/socket auto-started; runtime is ready and UI private.
- 09:28 UTC: ETA 20–40 minutes remaining. All runtime/security/recovery gates passed;
  final evidence review, normal main integration and exact final deployment remain.

- 09:33 UTC: automatic review rejected publication of the full collected host/account
  inventory. Reduced repository evidence to the prompt's requested sanitized acceptance
  facts and bounded validation identities; raw inventories stay in private operator data.
