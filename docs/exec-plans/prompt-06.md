# Execution Plan — Prompt 06 authenticated client API

**Status:** Active  
**Owner:** Prompt 06 Codex task (sole implementation writer)  
**Branch:** feature/prompt-06-remote-client-api  
**Worktree:** /Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger  
**Started:** 2026-09-29 05:31 UTC  
**Initial ETA:** 10–16 hours active work; 18–24 if material integration issues emerge  
**Current ETA:** At ~06:01 UTC, 3–5 hours remaining. Reuse of existing trusted operations is simpler than the initial conservative estimate. User requested ETA updates every 30 minutes.

## Objective and scope

Implement a stable /api/v1 contract with persistent HQ/human/device identity,
explicit local-browser pairing and revocation, Ed25519 proof of possession,
short-lived opaque credentials, capability enforcement, durable idempotency and
reconnectable events. Prove the actual browser/reference-client workflow through
an SSH tunnel to a fresh hardened Ubuntu validation instance, then deploy accepted
main while preserving retained HQ evidence.

No iOS app, relay, public listener, CORS, remote protected approvals, recursive
device enrollment, Project policy editor, worker identity expansion or multi-company.

## Starting state

- Synchronized clean main/origin/main: effba60f349778d82a37fbbb44bf4047a931d875.
- Retained Ubuntu deployment: c5712ca9b544105b9303aab76d2e4860c3d6be13.
- Newer MIT-license commit is retained. Other audit worktree remains untouched.
- Ubuntu 24.04.5, kernel 6.8.0-142-generic; app/provisioner/socket active.
- HQ paused; no active executions; seven workers, six Projects, 43 tasks,
  53 executions, 63 messages, ten artifacts and seven runtime bindings.
- Listener 127.0.0.1:4310 only; approximately 1,582 MiB available RAM,
  zero displayed swap use, 43 GiB disk free at initial inspection.
- Pending approvals, full identity/history inventory and runtime readiness are
  additional preservation checks before any host mutation.

## Architecture and invariants

Read AGENTS, README, required product/operation/architecture documents, Decisions
002/009/010/012/013/014, Demo 01 findings, and Prompt 05 acceptance/audit records.
Current code is authoritative. Existing browser token/Host/Origin behavior and
approval-inspection rendering remain intact. /api/v1 is a separate boundary on the
same private listener and calls existing trusted Company methods.

### Schema and migration

Add SQL-only migration 6: HQ identity table, device and pairing records, persistent
challenges/token hashes, idempotency receipts and client notification events. Existing
tables/history/bindings retain their identity. Generate HQ UUID only in trusted
application initialization. Preserve domain/security audit indefinitely. Use
transactional domain operations and receipts; no migration networking/accounts/Git.

### Identity, pairing and authentication

Single existing enabled human principal remains authoritative. Devices retain public
Ed25519 JWK (OKP/Ed25519/x) only, immutable owner/key/capability ceiling and terminal
denied/revoked history. Local session-authenticated browser creates a ten-minute,
32-byte random secret, stored only as SHA-256. One claim binds one key; explicit
fingerprint inspection and confirmation precede authentication. Stable botsquad://
pair payload carries version/HQ/pairing/secret, never server paths or credentials.

One-minute persistent one-use challenges use documented UTF-8 newline canonical
bytes. Signature verification uses Node crypto. Opaque 32-byte access tokens last
ten minutes, with hashes only persisted and Authorization-header-only acceptance.
Every request rechecks enabled owner, active device, expiry and capability; stream
authorization ends at expiry/revocation. HQ UUID is not TLS pinning/E2EE identity.

### Client API contract and scopes

Explicit allowlisted DTOs for overview, workers/profiles/runtime choices, tasks,
executions, Projects/repositories, messages and artifact metadata. Bounded deterministic
cursor pagination; safe stable response/error envelopes and strict input/query schemas.
Fixed scopes: state:read, projects:read, artifacts:read, messages:send,
objectives:create, dispatch:control, executions:interrupt, profiles:update.
Pairing defaults to read authority; only local human sets the ceiling.

Messages do not create tasks. General and exact Project/repository objectives remain
separate from communication. Pause/resume, profile updates and supported interrupts
validate current state. Protected operations remain local-only.

### Idempotency and events

Bind persisted receipt to device/principal, request key, method/path/canonical body,
status and sanitized response. Pure database operations and receipts share one SQLite
transaction. Avoid implicit worker provisioning inside remote mutations by requiring
an already initialized CEO. Interrupt records durable intent/result before dispatching
its runtime signal; restart reconciles that exact execution without launching work.
Bound retry lifetime explicitly so cleanup cannot turn stale keys into new operations.

Persist bounded notifications transactionally from domain audit/message changes;
no raw detail/secret streaming. Stable HQ-bound cursors replay missed notifications;
expired cursors explicitly require refetch. Clients refetch authoritative DTOs and
tolerate duplicates. Bounded streams, output/backpressure, history and resource limits.

## Steps and validation

1. Complete baseline/preservation inspection and deterministic/Chrome regression.
2. Implement migration, trust protocol and adversarial identity/auth tests.
3. Implement DTO contract, authorized mutations, receipts, streams and contract tests.
4. Add local Devices UI and small independent reference client; browser acceptance.
5. Explicit security review: crypto parsing/replay, cross-auth/origin, scopes,
   sanitization, rate/resource bounds, redaction, crash/restart and revocation.
6. Push exact feature and deploy fresh validation source/data under equivalent systemd
   restrictions. Run full Ubuntu suite and workstation-side SSH-tunnel workflow.
7. Record lost-response/reconnect/restart evidence; bounded idle host reboot; fresh
   authentication after reboot; revoke validation device through UI and remove key.
8. Compare retained Projects/workers/Codex bindings/Unix identities/approvals/root
   records before and after final migration/deployment. Keep retained HQ paused.
9. Update current-facing documentation, Decision 015 if still available, API contract,
   validation evidence; stale-prose and relative-link checks. Only then mark roadmap
   Prompt 06 Complete / Prompt 07 Next, integrate normally and verify SHA equality.

## Evidence ledger

| Check | Source/commit | Result | Notes |
| --- | --- | --- | --- |
| Git preflight | effba60 | Pass | Clean, fetched, checkpoint/newer history preserved |
| Read-only HQ check | c5712ca | Pass | Paused, idle, private listener; retained counts above |

## Documentation freshness

Review README, AGENTS, roadmap, vision, organization, iOS architecture, current state,
access/operations, multiple instances, system architecture, decision index and both
whitepapers wherever implementation truth changes. Preserve historical Prompt 01–05
and Demo 01 evidence. Add docs/api/CLIENT_API_V1.md and
docs/validation/prompt-06-remote-client-api.md with sanitized exact evidence.

## Remaining work / blockers

Implementation and acceptance pending. No current blocker. Network operations require
the environment's normal escalation; initial sandbox DNS failure was resolved by an
approved fetch. No credentials were read or changed.

## Progress — 06:10 UTC

Core migration/authentication/API/DTOs/receipts/events, Devices UI and independent reference client implemented. Baseline 120 pass/1 Linux skip; first full implementation run 129 pass/1 skip. Existing Chrome approval regression and actual new browser pairing/deny/revoke workflow pass. Expanded protocol tests 12/12; retained v5 migration and real process exits before/after receipt commit pass. Additional checks will run on the final feature SHA. Public-key identity forgery reproduced with Node crypto, then blocked through canonical/low-order encoding validation.

Initial root-private preservation inventory saved at `/var/backups/botsquad/prompt06-20260929T0531Z/inventory.json`: 21 original databases, 281 root records, 84 worker homes. HQ runtime ready, no pending approvals, retained identities ready. No production deployment or domain mutation has occurred.
