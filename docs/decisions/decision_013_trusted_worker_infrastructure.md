# Decision 013 — Trusted approvals and isolated worker infrastructure

**Date:** 2026-09-26  
**Status:** Implemented on the Prompt 04 feature branch; real Linux acceptance pending

## Decision

Keep logical worker identity, runtime workspace/thread, Unix identity and execution
separate. Central Codex authentication remains under `/var/lib/botsquad/.codex`;
no credential is copied into a worker home. Existing runtime paths are unchanged.
Migration 4 adds infrastructure records without user-management side effects. An
absent OS binding is explicitly unprovisioned, never a fabricated account.

Nix is a persistent DevOps leaf reporting to Atlas. Trusted human initialization
creates Nix and its one-time bootstrap request; the human approves that request
through the same protected-operation boundary. Subsequent lifecycle requests use
explicit Nix tasks. The CEO alone may have Nix as a fourth child; three ordinary
children, CTO limits, two hierarchy edges and the eight-worker ceiling remain.
Nix has inspection and typed request capabilities, no shell/root/sudo or delegation.

Approvals bind the immutable operation envelope: IDs, target, canonical parameters
and hash, reason, requester principal/worker, execution/task and preconditions. They
expire after one hour. Only the existing trusted loopback Host/Origin/session-token
HTTP boundary may decide; no payload actor or bot tool can approve. A transaction
records human approval, one-time consumption and running intent before any host
mutation. Consumed intent can reconcile the same operation ID after restart, without
reusing approval for a new request. Denial/expiry leave the target unprovisioned or
blocked. Runtime permission requests retain `approvalPolicy=never` and never become
infrastructure grants. SQLite guards preserve envelopes, terminal approvals and receipts.

The root provisioner uses systemd Unix socket activation and SO_PEERCRED, admitting
only root and the trusted botsquad UID. Its code is installed by the admin bootstrap
from an exact Git revision at `/opt/botsquad-provisioner`, root-owned and not writable
by the service or workers. Strict bounded JSON rejects unknown/duplicate fields,
unknown operations, arbitrary paths, usernames, executables and commands. Root-owned
receipts distinguish the same ID/payload from changed payload and survive restart.
No TCP listener or network is required.

A worker's persisted username is `bsw-` plus 24 SHA-256 hex characters derived from
its durable UUID, independent of display names. The root identity ledger reserves an
unused private UID/GID in 20000–59999 before creation; collisions fail closed. Accounts
have locked passwords, nologin shells, no keys or supplementary groups. Homes live
under `/var/lib/botsquad-workers`. Only a named read/traverse ACL for the trusted
botsquad account supplements private worker access. Workers share no read group.

Fixed project operations run in a separate Python child after UID/GID/group drop,
NoNewPrivileges, a clean environment and resource bounds. Workers have independent
clones seeded by a bounded local bundle. Owned source writes and Git add/commit run
under that worker UID. No worker can write canonical product main. Trusted code
imports an exact submitted commit through a bundle, rechecks parent/scope/clean state,
and retains the existing independent exact-commit review and tested integration.
Both clone approvals must be ready before either engineer starts, preserving the
existing two-worker concurrency gate.

Product JavaScript tests continue under the trusted service identity inside the
existing bubblewrap/namespaces/seccomp/Node-permission sandbox. The UID helper never
runs product JavaScript. This distinction avoids weakening the validated test boundary.
Independent-clone Git directories are hidden inside the test sandbox.

Retirement checks active, outstanding and unintegrated work, disables logical dispatch
before the host revocation, locks/expires the account, signals only the recorded UID
using pidfds, revokes home/project traversal, and retains data and audit history.
Ordinary retirement uses Nix plus trusted approval. Temporary terminal retirement is
an explicit authority-reduction policy with its own durable revocation intent; it
waits for safe integration before host disablement and never deletes evidence.
No ordinary `userdel -r` or home deletion exists.

## Privileged write surfaces

The root service has a private network, Unix-only address family, protected system/home/
kernel/cgroup surfaces, bounded memory/tasks/files, and only the capabilities needed
for account lifecycle, owner changes, UID/GID drop and UID-bound process termination.
It writes `/etc` because shadow-utils atomically replaces passwd/group/shadow files
and lock files; this filesystem allowance is constrained by the fixed operation code.
Other writes are confined to the managed worker and root receipt directories. The
ordinary BotSquad service retains NoNewPrivileges, an empty capability set and its
existing state-only write scope. `/etc/botsquad` is root-private.

## Development and limits

The explicit development backend simulates bindings without creating Unix users.
It is not a security-equivalent isolation claim. The full historical Git/worktree
regression path remains available on macOS and in deterministic tests on Ubuntu.
Production Linux uses the actual socket backend and fails closed when it is unavailable.

This remains one company per data directory and one fixed SquadStatus template.
General projects, service/package administration, Computer Use, mobile APIs, external
identities and federation are deferred. The control plane/admin root are trusted;
SQLite/root receipts are durable application evidence, not cryptographic tamper-proofing.

## Evidence

See [execution plan](../exec-plans/prompt-04.md). Deterministic tests and actual Ubuntu
acceptance are recorded separately in the forthcoming Prompt 04 validation report;
this decision does not claim kernel isolation from mocks.
