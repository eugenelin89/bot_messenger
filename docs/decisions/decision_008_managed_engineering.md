# Decision 008 — Managed engineering, independent review and tested integration

**Date:** 2026-09-25
**Status:** Accepted; validation evidence recorded in the Prompt 02 validation record

## Context

Prompt 01 proved persistent workers and event-driven handoffs. Prompt 02 requires
two engineers to work concurrently on one local product while retaining independent
ownership, review and restart evidence. Shared Git metadata makes unrestricted
workspace shell access unnecessarily broad for this bounded milestone.

## Decision

Keep the pinned Codex 0.142.4 App Server adapter, private worker runtime workspaces,
read-only sandbox, empty environments and disabled shell/MCP/browser/Computer Use.
Engineering authority is supplied through narrow company tools bound to the active
execution, worker, task and allocation. Runtime workspace identity remains stable;
an engineering allocation is a separate task-specific product workspace.

SQLite migration 2 adds repositories, allocations, submissions, reviews, integrations,
task scopes and task kind/creating-execution provenance. It preserves Prompt 01
records and histories. A trusted startup policy update extends the CEO's delegatable
ceiling; worker-authored content cannot perform that update.

Fixed profiles allow Atlas to create Product Manager/CTO, and CTO to create two
engineers and one reviewer. Research remains compatible with the Scout workflow.
Maximum hierarchy depth is two manager edges, eight workers total and three direct
children per manager. Leaf roles have no onward delegation. Effective child authority
must fit the parent's delegatable set and company ceiling. Delegatable authority
does not imply the manager may exercise every leaf operation itself.

The only product template is dependency-free **SquadStatus**. A completed Product
Manager spec must precede CTO delivery. Trusted code creates a separate local Git
repository under `<data>/products/<repository-id>/main`, without remotes, on `main`
with an initial clean commit. Managers supply a logical product name, never a path.

CTO requests an atomic pair of engineering assignments. Trusted code allocates
distinct `botsquad/<module>/<task-id>` branches and worktrees. Allocation eligibility
waits until the CTO's turn ends, leaving both global execution slots available.
Each engineer may edit its one module and one optional extra-test file, up to 16 KB
per file. Immutable scaffold tests and composition cannot be changed through tools.
Canonical roots, regular files, symlinks/hardlinks, Git metadata/backlinks, repository,
branch, task, worker and base are checked before operations. Shared Git metadata is
changed only by the service using fixed argv, clean configuration and disabled hooks.

Product tests execute in a separate process with a ten-second deadline, bounded
output, empty environment, Node permission controls and a macOS Seatbelt profile.
The OS profile denies network, filesystem writes, process signals, child processes and regular-file
reads outside the product/runtime locations. Node further restricts filesystem reads
to the product worktree and denies addons/worker/child-process permissions. There is
no unsandboxed fallback. Prompt 02 engineering is macOS-only; another platform must
provide and validate an equivalent runner before product tests can execute there.

Submission reruns focused tests, verifies changed paths and expected base, makes one
trusted commit, verifies a clean worktree, then freezes the allocation. Immutable
submission records retain IDs, SHA, branch, base, changed paths and test evidence.
Review receives the spec, contract, base files, exact submitted diffs and focused evidence.
Grace has no source-write/commit/integration tools. Its structured artifact and exact
source commit list are immutable. `changes_required` prevents integration; automatic
revision loops are deliberately absent.

Integration requires a completed approved review and matching verified submissions.
It cherry-picks the exact two commits onto a separate retained candidate branch,
runs full tests and deterministic CLI output, then fast-forwards the clean product
default branch. It never force-updates, pushes or modifies remotes. Conflict/test
failure retains candidate evidence and leaves default unchanged. An integration
record is unique per repository/review, so repeated requests cannot repeat it.

Git/filesystem operations persist intent before side effects instead of hiding the
intent inside a receipt transaction. Crash windows cannot be made atomic across Git
and SQLite: ambiguous creating/allocating/submitting/integrating state is blocked for
inspection, never silently replayed. Completed branches/worktrees remain retained.
Automatic cleanup and general recovery mutation tools are future work.

Manager tasks can have bounded sequential stages. A child's creating-execution ID
distinguishes newly delegated work from previously evaluated children. Unique child
wake events plus transactional parent transitions resume managers once per completed
stage. Final manager completion requires a successful trusted integration record;
prose alone cannot complete delivery. Completed engineering, review and integration
survive restart without replay. Denied engineering access records classify protected
scopes without storing rejected content or raw paths.

## Consequences and limits

- Real engineering and concurrency without widening general Codex tool access.
- Six persistent logical workers, six tasks and ten real turns in the reference flow.
- Local Git and SQLite evidence are attributable and independently inspectable.
- Test containment and review reduce risk; this is not a hostile same-OS-user security
  boundary or proof that arbitrary submitted JavaScript is correct.
- The pinned resume protocol cannot replace an existing thread’s dynamic tool schema.
  Legacy Prompt 01 bindings retain research support and fail explicitly for engineering;
  use a fresh company data directory rather than silently replacing a worker thread.
- Synchronous bounded Git/test operations can briefly delay the HTTP event loop.
- One fixed local template, two modules, one review and one integration attempt per
  product. General repositories, revision cycles, deployment and cleanup are deferred.
- Decision 006 remains in force: engineering filesystem tools grant no Computer Use.
- This extends Decision 007's initial authority and one-child review limit. Its runtime
  confinement, managed authentication, binding checks and conservative recovery remain.

## Evidence

- [Prompt 02 plan](../exec-plans/prompt-02.md)
- [Prompt 02 validation](../validation/prompt-02.md)
- Installed 0.142.4 protocol schemas and actual runtime preflight.
- Deterministic real-Git tests for ownership, security, review, conflict, test failure,
  integration idempotency and recovery; bounded real Codex acceptance is required.
