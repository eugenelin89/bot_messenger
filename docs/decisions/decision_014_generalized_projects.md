# Decision 014 — Generalized software Projects and repository lifecycle

**Date:** 2026-09-28

**Status:** Accepted, implemented and validated on Ubuntu

**Scope:** Prompt 05; extends [Decision 008](decision_008_managed_engineering.md) and
[Decision 013](decision_013_trusted_worker_infrastructure.md). Their historical
acceptance records remain unchanged.

## Context

SquadStatus established trustworthy engineering, independent review and tested
integration. Its fixed modules and one-delivery schema cannot represent reusable
software repositories. Generalization must preserve the host and approval boundaries,
not turn source content or model instructions into new authority.

## Decision

A persistent Project owns description, instructions, protected paths, named validation
recipes and bounded policy. It contains multiple repositories. Each repository owns
its managed canonical Git directory, configurable default branch, current trusted SHA,
source kind and optional normalized remote identity/policy. Repository identity is
independent of any one task, specification or delivery.

Only trusted human operations create/register Projects and repositories, change policy,
configure remotes or archive Projects. Models receive an existing repository task scope.
Maya writes the actual specification; Turing narrows allocations inside Project policy.
A local-new repository starts with a minimal README. Import accepts a bounded Git bundle
or the trusted public GitHub adapter, never an arbitrary host path.

The service owns canonical Git. Linux engineers receive independent Unix-owned clones,
with no external remotes, through the existing Nix/exact-approval/provisioner path.
Allocation manifests bind worker, repository, task, branch, base, write scopes,
protected paths and bounds. Both the application and root ledger retain the immutable
manifest/hash. The provisioner performs source and Git actions only after dropping
UID/GID, groups and capabilities; later requests cannot supply a new grant. Retained
protocol-1 grants retain their narrow historical module limits.

Scopes are exact repository-relative files or directory prefixes, without globs.
Concurrent scopes cannot overlap, including case-folded overlap. Paths use a conservative
ASCII alphabet; traversal, `.git`, links, special entries and case collisions fail
closed. Root and applicable nested AGENTS are bounded, read-only guidance. Guidance
never changes enforced scope, recipes, remote policy or credentials.

Initial context includes bounded instructions, guidance, tree, selected relevant files,
recipes and prior feedback. Trusted read tools can retrieve other bounded UTF-8 files
in the assigned clone. Read permission does not grant write permission. Project changes
reuse persistent logical workers and their current compatible Codex threads.

## Validation and bounds

The initial executable allowlist is the installed Node runtime and literal named test
files (`node --test ...`). Policy stores ID, display name, focused/full stage, cwd,
argv, deadline, output bound and isolated environment. Workers select approved IDs;
they cannot select commands, arbitrary flags, environment variables or credentials.
There is no dependency installer or general build/package environment.

Every generic recipe runs in a disposable copy with no Git metadata. Node permissions,
Linux namespaces/seccomp or macOS Seatbelt deny host/state/auth reads, network,
subprocesses and signals. Only `build/` is writable. Linux uses one 64 MiB tmpfs;
Node runs without JIT/WebAssembly, with a 96 MiB heap and 512 MiB data limit, core dumps
disabled, bounded CPU, wall time and output. These restrictions are acceptance-tested
on Ubuntu; development backend tests alone are not Linux identity evidence.

The independent Prompt 05 audit found that raw TAP-looking stdout could falsely
satisfy the completion check. The corrected runner accepts only a completed Node test
summary with at least one passing test, no failures/cancellations, exit zero and no
runner error. A fixed service-owned reporter emits a one-use authenticated receipt on
a dedicated pipe; source stdout remains diagnostic. Its invocation key is consumed
before source modules load, cleared from the buffer, and absent from files, arguments
and environment. Missing, forged, skipped-only and premature-exit runs fail closed.
This authenticates runner completion; tests and code review still determine whether
application behavior is correct. It does not prove arbitrary JavaScript semantics.
See the [independent audit](../validation/prompt-05-independent-audit.md).

Hard ceilings are 16 MiB repository/object contents, 4 MiB bundles, 1,000 files,
128 KiB per file, 256 KiB diff, 100 changed paths and 16 commits per submission range.
Imports additionally limit 10,000 objects and 1,000 commits. Up to 16 recipes may run
for 100–30,000 ms each with 1–64 KiB output. Policy can lower ceilings. Git transfer
processes have fixed argv/environment, time/output/file/CPU limits and Linux address
space limits. Submodules, symlinks, custom attributes/LFS, alternates, grafts,
replacement refs, active hooks and arbitrary Git configuration are unsupported.
These conservative limits target the measured small Ubuntu HQ and bounded source work.

## Submissions, review and integration

Submissions are immutable allocation/base/head/range/path/validation/execution records.
Git computes the changed paths. Every commit in the range must be linear, descend from
the assigned base, satisfy bounds and stay inside the original scope; a later revert
does not excuse an earlier out-of-scope commit. An engineer may retain multiple commits
and multiple explicitly linked submission rounds.

A review round freezes exact submission IDs, heads, base, specification, diffs, trusted
validation and prior feedback in a hashed packet. Grace must read that exact packet
in the current execution and submit an independent disposition with exact provenance.
Changes required identifies affected allocations and source submissions. Only those
existing engineer tasks are requeued with explicit feedback, retaining worker/thread
and scope. A revised submission must extend the prior head. Default review ceiling is
three, configurable only within one to five; exhaustion blocks for human inspection.

An approved current packet permits a durable queued integration intent. The event-driven
service serializes canonical mutation per repository, revalidates exact review/sources
and base, cherry-picks all approved commits into a candidate, and runs every full recipe.
Only a passing candidate can fast-forward the canonical branch. Failed/stale attempts
retain evidence without resetting canonical Git. Terminal attempts are immutable;
multiple deliveries and attempts can exist for one repository. Restart reconciles an
already advanced, persisted passing candidate or blocks ambiguity; it never blindly
repeats a completed integration.

## Remote Git and credentials

Only normalized credential-free `https://github.com/owner/repository.git` identities
are accepted. Provider and identity are separate persisted fields for future adapters.
Policy defaults to `none`; `fetch_only` permits explicit trusted fetch; `approved_push`
adds exact human-approved publication. There is no polling, worker remote tool, force
push, deletion, automatic merge or history reset. Unexpected branch/history changes
block and preserve integration evidence.

Remote Git is a non-root service concern, outside the root provisioner. Git runs with
fixed executable/argv, no ambient config/helpers/proxies/credentials, disabled hooks,
replacement refs and redirects, and bounded resources. Public fetch needs no credential.
Optional authenticated publication reads only an operator-selected canonical service-owned
0600 file via `BOTSQUAD_GITHUB_TOKEN_FILE`. Token contents never enter URLs, SQLite,
worker homes, prompts or logs. Workstation Git/gh/SSH authentication is not copied.
Private authenticated fetch is not supported in this milestone.

Publication has separate immutable operation/approval/receipt tables. The envelope binds
Project, repository, normalized remote, target branch, exact expected old SHA, integrated
new SHA and integration ID. The trusted human API ignores prose approval and rejects
caller-supplied actor identity. Approval expires after one hour and is consumed before
execution. Pending publication prevents policy changes and new repository objectives.

The receiver is sent exactly the approved old/new/ref update using Git's receive-pack
protocol, so an intervening remote update is rejected atomically, even if the raced head
is an ancestor of the new commit. The upstream [Git pack protocol](https://git-scm.com/docs/gitprotocol-pack)
describes this old/new/ref verification and status response. A mere `ls-remote` followed
by ordinary unconstrained push would not preserve this exact approval envelope.

After a lost response, new SHA reconciles success; old SHA waits for explicit retry of
the same approved operation; another SHA blocks. Startup only inspects running operations,
never republishes. The validation-only local bare transport exercises the same packet
and executor and cannot be selected through production HTTP or model tools. Authenticated
live GitHub publication remains unvalidated unless a disposable authorized repository
and securely configured credential are actually available.

## Archive, migration and compatible runtimes

Archive first rejects unresolved work, queued/running integration and pending publication.
It persists an archiving intent, idempotently revokes exact worker clone access, then
marks the Project archived. Worker identity and compatible runtime thread remain reusable.
Canonical Git, clones, submissions, reviews, integrations, messages and audit survive.
There is no physical clone/home cleanup. Restart resumes pending authority reduction;
archived Projects cannot receive new work.

Migration 5 is SQL-only. It rebuilds constrained engineering tables, preserves original
columns/IDs/counts, validates replacement rows before retiring old tables and checks
foreign keys before commit. Existing repositories receive explicit legacy Projects.
Unknown historical commit lists and packets remain null/legacy, not invented. Worker
profiles, runtime bindings, Unix identities, approvals and receipts remain unchanged.
No migration Git, filesystem, network or privileged operation occurs.

Pinned Codex 0.157.0 persists dynamic tools with threads; its generated resume parameters
do not provide tool-schema replacement. The [App Server documentation](https://learn.chatgpt.com/docs/app-server)
likewise describes restored dynamic tools on resume. Retained old bindings receive
explicit schema markers and remain inspectable. They cannot silently become generic
engineering threads; unsupported generic use fails clearly without replacing a thread.
New Prompt 05 bindings retain the compatible tool schema through revision and Project
reuse. SquadStatus is an explicit legacy fixture using the generalized review/integration
engine, with its original validation adapter retained for historical compatibility.

## Consequences and evidence

The system supports bounded dependency-free Node software projects, not arbitrary
language/framework repositories or a general command runner. Current limitations are
explicit and fail closed. Prompt 06+ mobile APIs, pairing, federation, Computer Use,
external identities and Demo Operator remain deferred.

See the [execution plan](../exec-plans/prompt-05.md) and
[validation record](../validation/prompt-05-general-projects.md) for acceptance status,
actual host measurements and explicit validation limitations.
