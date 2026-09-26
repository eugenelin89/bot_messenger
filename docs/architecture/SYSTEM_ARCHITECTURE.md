# BotSquad — System Architecture

**Status:** Prompt 04 complete; real Ubuntu acceptance validated
**Updated:** 2026-09-26

## Runtime topology: implemented baseline and accepted target

Prompt 02 was implemented and validated on one macOS workstation:

```text
Human browser → local loopback HTTP/SSE → BotSquad + SQLite
                                      → Codex App Server
                                      → managed local Git / confined tests
```

The accepted primary operating topology for Prompt 03 and later is:

```text
Human workstation
    |
    | SSH / SSH tunnel
    v
operator-controlled Ubuntu HQ
    |
    +-- loopback BotSquad HTTP/SSE
    +-- SQLite / durable company state
    +-- dispatcher
    +-- Codex App Server
    +-- managed engineering/runtime isolation
```

“Self-hosted” is the architectural property that matters. The Ubuntu host may be in a cloud provider, VPS, private VM or physical machine. It is not equivalent to a multi-tenant hosted SaaS control plane.

Prompt 03 implements and validates this topology: 60 deterministic Ubuntu tests, real research and six-worker engineering, concurrent Codex turns, exact-commit review, confined integration and recovery checks pass. The [Prompt 03 validation record](../validation/prompt-03-ubuntu.md) contains model, resource and recovery evidence.

## Boundaries

```text
Human browser → loopback HTTP / SSE → Company + SQLite → event dispatcher
                                                     → RuntimeAdapter → Codex App Server
                                                     → managed Git / confined product tests
```

The company owns organizational truth. Workers persist while idle, runtime threads
are bindings, Tasks own execution attempts, and messages do not dispatch work.
Creating, messaging, assigning and executing remain separate operations.

| Concern | Implementation |
| --- | --- |
| Domain, profiles and validation | `src/domain/model.ts`, `src/domain/engineering.ts` |
| Trusted operations and staged tasks | `src/control/company.ts` |
| Managed repositories, allocations, review, integration | `src/control/engineering.ts` |
| Immutable product scaffold and contract | `src/control/product-scaffold.ts` |
| Confined Node test process | `src/control/product-runner.ts` |
| Atomic claims / execution lifecycle | `src/control/dispatcher.ts` |
| SQLite migration / constraints | `src/persistence/store.ts` |
| Single service ownership | `src/persistence/lock.ts` |
| Runtime contract and tool schemas | `src/runtime/adapter.ts` |
| Codex protocol / transport | `src/runtime/codex.ts`, `src/runtime/rpc.ts` |
| Loopback API / browser UI | `src/http/server.ts`, `public/` |
| Startup / shutdown | `src/main.ts` |
| Deterministic and real validation | `test/`, `scripts/real-e2e.ts`, `scripts/real-engineering.ts` |

Node 24 supplies HTTP, SQLite, process control and tests. TypeScript checks the code.
The only runtime dependency is the pinned official Codex CLI. No distributed queue
or frontend framework is needed.

## Persistent domain

Prompt 01 retains Principals, Workers, runtime bindings, channels/messages, Tasks,
Executions, Artifacts, append-oriented Audit, Settings, tool receipts and wake events.
Worker identity, manager, lifecycle, capabilities and private runtime workspace remain
separate from Task and runtime-thread identity. Artifacts have generated paths and
SHA-256 integrity checks; messages and audit reject ordinary update/delete operations.

Migration 2 adds:

- **Repository:** product, canonical local root, default branch, base/current commit,
  creator CTO, workflow task, spec artifact and lifecycle timestamps/status.
- **Allocation:** repository, worker, task, branch, worktree, base, module and lifecycle.
  Task/path/branch uniqueness and a partial unique active-worker index protect ownership.
- **Submission:** immutable producing execution/allocation, commit, changed paths,
  focused validation and summary. One submission per allocation/task.
- **Review:** immutable reviewer/task/execution, exact source commits, disposition and
  structured artifact. One review per review task.
- **Integration:** repository/review, base/source/candidate/final commits, strategy,
  full tests/output, status/error, requester/execution and timestamps. Unique per product.
- **Task scope and provenance:** product/research/spec/delivery/engineering/review kind,
  repository scope and creating execution to support bounded sequential handoffs.

The schema ledger, foreign keys, WAL, full synchronization and `BEGIN IMMEDIATE`
transactions preserve prior data. Migrations do not reset retained Prompt 01 history.

## Authority and runtime identity

```text
child effective capabilities ⊆ parent delegatable capabilities ⊆ company ceiling
```

Fixed profiles enforce depth and role constraints in addition to the capability sets:

| Role | May exercise | May create |
| --- | --- | --- |
| Atlas / CEO | messages, reports, approved docs, direct assignments | Researcher; Product Manager and CTO for product tasks |
| Maya / Product Manager | approved context, specification artifacts, messages | none |
| Turing / CTO | managed product creation/allocation, review assignment, integration request | two Engineers and one Reviewer |
| Engineer | owned source read/write, fixed tests, own Git inspection, verified submission | none |
| Reviewer | exact-commit read-only packet, structured review, artifacts/messages | none |

There are eight workers maximum, three direct children per manager and two hierarchy
edges. CTO cannot create another CTO. Leaf roles have no delegatable authority.
Managers do not acquire source-writing authority merely by being able to delegate it.
No role may alter company policy, supply a sender identity, grant human approval,
choose an arbitrary product path, modify remotes, force Git, browse or use Computer Use.

The dispatcher creates the execution context. Every tool rechecks active execution,
worker, task, enabled state and exact canonical private runtime workspace. The Codex
callback must also match the current thread and turn. Unknown input fields fail closed.
Worker-authored text never changes capabilities or approval state.

Each research execution allows 32 successful calls; engineering workflow executions
allow 64. Tasks allow four artifacts, each up to 20,000 characters. Source files are
bounded to 16 KB. There are no raw database or bot-authority HTTP endpoints.

## Task stages, dispatch and recovery

Task transitions remain explicit: queued → working → completed, with blocked, failed,
awaiting_approval and cancelled paths. Completed/cancelled tasks remain terminal.
Human retry requires acknowledgement that prior evidence was inspected and never
grants new authority. Temporary researchers accept one lifetime assignment and retire
when it becomes terminal; persistent workers retain their identity and history.

A manager's execution can complete while its task waits for children. Newly created
child tasks carry the creating execution ID. This lets a resumed Atlas delegate CTO
after evaluating Maya, and a resumed CTO delegate Grace after both engineers finish.
The service records each child-result wake once and queues a blocked manager only
when all required children are terminal. Final product/delivery completion also requires
a successful trusted integration record. No model polls for status.

The event-driven dispatcher coalesces changes with `setImmediate`. Transactional claims
and partial unique indexes enforce one running execution per worker/task; the sole
service dispatcher permits two globally. Engineering assignments are one batch and
wait until the CTO turn ends, making both execution slots available concurrently.
Pause holds queued tasks without interrupting running work. Interrupt uses the adapter's
AbortSignal path and preserves execution evidence.

One exclusive service lock owns a data directory. An exclusive startup gate serializes
stale-lock reclamation; ambiguous/live owners fail closed. Restart interrupts orphaned
running executions and blocks their tasks for inspection. Completed tasks are not
replayed. Queued safe work and pending completed-child wakes are reconciled locally.

## Managed engineering

A completed Maya spec is required before CTO delivery. The only template is the small
local SquadStatus product. Trusted code creates `products/<repository-id>/main`, a
separate Git repository with `main`, a clean base commit and no remote. Workers pass
a logical name, never a filesystem root. Product development never targets BotSquad.

Linus and Ada receive separate branches and task allocations. Linux production uses
independent clones in private worker homes; the development backend retains worktrees. Canonical
paths, regular files, symlinks/hardlinks, `.git` pointers/backlinks, registered repository,
branch/base and worker/task identity are checked on access. Engineers can edit only
`src/<module>.mjs` and optional `test/<module>.extra.test.mjs`. Scaffold acceptance tests,
composition and Git metadata are unavailable to write tools.

Fixed-argv Git operations use a clean environment, ignore global/system configuration
and disable hooks, fsmonitor, signing and external diff/attributes configuration. Local
repository configuration is allowlisted; remotes and replacement refs are rejected.
Engineers have no general Git command or shell tool.

Product code runs in a separate Node process with permissions restricting reads to
the worktree, no addons/worker/child-process permission, an empty environment, a
96 MB old-space limit, ten-second timeout and 64 KB captured-output limit (16 KB retained).
On macOS, Seatbelt additionally denies network, writes, process signals, child processes and regular-file
reads outside product/runtime locations. Inherited pipes remain usable. On Ubuntu x86_64, bubblewrap instead supplies user/mount/PID/network namespaces,
read-only product/runtime mounts and seccomp denial of network sockets, non-thread
clones, host signals and namespace/mount escape. A dedicated service-only AppArmor
userns grant preserves global Ubuntu restrictions. No unsandboxed fallback exists.

Submission verifies a real module change, allowed paths, the expected base HEAD,
passing focused tests and a clean trusted commit. It freezes the worktree and persists
immutable evidence. Grace receives the spec, base files, exact submitted diffs, immutable
tests and focused evidence through a read-only packet. Its structured review binds
approval/changes_required to exactly those two commits. It cannot mutate source or
request integration.

CTO integration checks completed approval and re-verifies the submissions. A retained
candidate worktree cherry-picks the exact two commits, runs all acceptance/extra tests
and checks deterministic CLI output. The clean default branch advances by fast-forward
only after success. Conflict/test failure leaves default unchanged. Repeated requests
return the recorded completed integration; failed/ambiguous attempts require inspection.

Git/filesystem side effects and SQLite cannot form one atomic transaction. Durable
creating/allocating/submitting/integrating intent is recorded first. Restart blocks
unfinished intent instead of replaying it. Completed branches and worktrees stay
retained; automatic repair, revision cycles and cleanup are deferred.

## Codex adapter

Decision 011 retains Decision 007's private App Server stdio architecture and upgrades the validated pin to `0.157.0`. Each
execution owns a short-lived process and one turn. Codex owns managed authentication;
BotSquad never copies credentials. Preflight reports version/auth mode/advertised model.
Persisted worker model/reasoning settings override inherited company/runtime defaults. The runtime discovers model-specific reasoning choices; unsupported combinations fail before a turn. `BOT_MODEL` is only the inherited default.

All roles keep read-only sandbox, no sandbox network, empty environments, approval
policy `never`, disabled inherited MCP servers and disabled shell/browser/computer,
apps/plugins/hooks/subagents and other unrelated runtime tools. Role-specific dynamic
company tools supply engineering access without broadening the runtime sandbox.

A new thread is named `BotSquad · <name> · <title>` and its exact name is persisted in the binding. Resume verifies exact thread ID, stored name and canonical UUID workspace, including compatible pre-rename names on legacy bindings. Existing bindings are never silently replaced. Migration records pre-Prompt-02 bindings:
the pinned resume protocol cannot change their dynamic tool schemas, so they retain
research support and fail explicitly on engineering objectives. Use fresh company
data for engineering until an explicit binding-migration workflow exists. Runtime permission requests are
denied and retained as awaiting_approval. Four-minute deadlines and acknowledged
interruption remain. Raw credentials, reasoning and arbitrary transport data are not logged.

Context is limited to the current assignment/profile, direct child evidence, recent
task messages, selected documents and relevant product/spec/allocation/review records.
The entire database is not sent to a worker. Task content and selected evidence are
sent to the external model service; self-hosted/operator-controlled describes the control plane and durable coordination state.

## Human UI and host security

The browser shows organization, durable messages, tasks, executions, artifacts, audit,
products, allocations, submitted commits, reviews and integration test evidence. Active
engineers are visibly identified together. Friendly managed paths replace absolute
paths in product summaries. Controls preserve initialization, explicit assignment,
message-only posting, pause/resume, interruption, inspected retry and cancellation.

HTTP binds `127.0.0.1`, checks exact Host/Origin/cross-site state and requires an
unguessable session token for JSON writes. Static files are allowlisted. CSP, text
escaping and plain-text artifact delivery prevent report/message HTML execution.
SSE signals control-plane state changes without model calls.

In the Prompt 02 macOS implementation these are single-owner application boundaries, not protection against a hostile process
sharing the owner's OS account. Ubuntu binds worker-owned mutations to private Unix
identities through a narrow provisioner. The service/root remain trusted. Git/SQLite
files can be changed by their owner. Audit
triggers preserve normal application integrity, not cryptographic tamper-proofing.

## Validation and deferred work

`npm test` covers both milestones, real local Git, migration, authority, ownership,
confinement, concurrency, exact-commit review, conflicts, failed acceptance, idempotency
and recovery. `npm run validate:prompt01` exercises actual research/restart/resume/
interruption. `npm run validate:real` exercises the actual six-worker engineering flow,
positive execution/turn overlap, denied boundary probes, independent review, product
acceptance and restart without replay. See the milestone validation records.

Decision 006 remains authoritative: Computer Use is disabled in Prompt 01 and 02.
Engineering tools grant no GUI/desktop authority. Approval grants are limited to the
implemented worker infrastructure operations. Generalized external products, revision
loops, cleanup, scalable history,
payments, outreach, deployment and distributed orchestration remain deferred.


## Worker configuration, migration and dispatch

Migration 3 adds inherited model/reasoning, normal priority and a human lock to existing
workers, without replacing bindings. Historical executions remain NULL/legacy. Each
new claim snapshots priority; before the turn the adapter records effective model,
reasoning, version and adapter once. SQL triggers prevent rewriting provenance.
Startup failures without a configured runtime remain unresolved.

Authenticated human profile updates use a narrow HTTP/control-plane method. Neither
bot tools nor payload-supplied actor names can mutate profiles. Manager-requested
profiles are deferred; unlocked profiles still have only human updates today.

Eligible queue order is priority then creation time/insertion FIFO. Global capacity
is checked inside the claim transaction, with unique active worker/task constraints.
Pause, enabled-state, task/engineering eligibility and capabilities remain authoritative.
Strict priority has no aging and can starve low-priority work under continuous load.

## Accepted Ubuntu headquarters boundary

Prompt 03 implements the accepted supported Ubuntu deployment/bootstrap path without changing the core rule that BotSquad owns organizational truth and Codex threads remain replaceable runtime bindings.

The initial remote-host architecture is:

```text
Human workstation
  -> checked-in bootstrap Codex prompt
  -> existing SSH alias
  -> fresh supported Ubuntu host
  -> non-root BotSquad systemd service
  -> SQLite / dispatcher / Codex App Server
  -> loopback-only web UI accessed through SSH tunnel
```

Linux isolation is validated directly on Ubuntu under the production systemd restrictions. Prompt 02's macOS Seatbelt evidence remains separate historical evidence.

Prompt 03 persists per-worker AI profiles and effective execution provenance. Worker inspectors load model/reasoning options from the active runtime. A narrow health endpoint exposes liveness, database/dispatcher readiness, cached runtime status and deployed commit without company state or credentials.

Nix coordinates bounded worker infrastructure after the Ubuntu HQ exists; the bootstrap
prompt installs the root-owned provisioner and does not depend on Nix.

See [Ubuntu HQ and Bootstrap Model](../product/UBUNTU_HQ_AND_BOOTSTRAP.md) and [Decision 009](../decisions/decision_009_ubuntu_bootstrap.md).

The installer, service account, root-owned source, persistent swap and systemd hardening
are specified in [Decision 011](../decisions/decision_011_ubuntu_hq_profiles.md) and the
[operator guide](../bootstrap/UBUNTU_BOOTSTRAP.md). [Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md)
defines worker Unix accounts, infrastructure approvals and provisioning. Broad approval
grants and Computer Use remain deferred.

## Worker infrastructure and trusted approvals

Migration 4 adds OS bindings, project bindings, infrastructure tasks, immutable
protected-operation envelopes, approvals, host receipts and retirement revocations.
Existing workers honestly remain unprovisioned; migrations never create Unix users.
The worker UUID, private Codex workspace/thread, Unix binding and execution are
independent. Neither migration nor provisioning moves retained runtime workspaces.

The human initializes Nix once, then approves its bootstrap identity. Ready Nix
receives explicit infrastructure tasks, inspects their trusted scope and requests
create/disable identity or prepare/revoke project access. Nix has no arbitrary shell,
root, sudo, approval-decision or delegation tool. Task completion waits for the
requesting turn to finish, human approval and a durable host receipt, then resumes
Nix on the existing thread to evaluate the result.

Each one-hour approval binds target, requester principal/worker, task/execution,
canonical parameters/hash and current preconditions. Only the token-authenticated
human HTTP endpoint decides. Approval consumption and running intent commit before
host mutation; pending grants, denial, expiry and exact consumed intent survive restart.
Messages, artifacts and unsupported Codex approval requests confer no authority.

The root-owned socket provisioner admits only the trusted botsquad UID and root,
rejects unknown fields/operations and accepts IDs instead of arbitrary names/paths.
Root receipts bind a unique operation ID to its exact request. Same-ID retry returns
the durable result; changed payload fails. Root handles account lifecycle, ownership,
ACLs and recorded-UID termination. A separate child drops UID/GID/groups before fixed
source/Git actions, uses a clean environment and cannot regain privilege.

Worker accounts have locked passwords, nologin shells, private groups and homes.
The service alone has named read/traverse ACLs; sibling workers and Nix do not.
Each engineer gets an independent clone with no shared Git metadata, seeded through
a bounded bundle. Canonical product main stays service-owned. Trusted import verifies
the submitted parent, paths and exact commit before independent review and integration.
Product tests remain under the service UID inside the existing hardened sandbox.
Engineering/review dispatch fails closed until the required real identity and clone
bindings are ready. Managers with no local worker-owned actions may coordinate first.

Ordinary retirement requires safe outstanding-work checks, a Nix request and human
approval. It disables dispatch before revocation, locks/expires the account, signals
only its recorded UID, revokes home/project traversal and preserves history/home data.
Temporary terminal retirement may reduce authority automatically through a durable
revocation intent; it waits for unfinished integration and reconciles on restart.

The development backend creates no accounts and retains prior worktree regressions.
See [Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md).

## Future company and external-identity boundaries

The implementation through Prompt 04 still has one company per configured data directory. The service UID, Codex
account, logical worker and thread remain distinct; current worker priority is local
to this control plane. No multi-company isolation or cross-HQ quota coordinator is
implemented or implied by the Ubuntu deployment.

[Decision 010](../decisions/decision_010_multi_company_federation.md) sets future company
isolation and explicit connection policy. A future migration must scope company data
and authority before enabling cross-company communication. Same-HQ collaboration
precedes authenticated/replay-resistant federation. Optional external identities and
Telegram remain trusted integration adapters with protected credentials and untrusted
inbound content; they never replace internal records or grant authority.

See [Multi-company and federation](../product/MULTI_COMPANY_AND_FEDERATION.md) and
[External identities and Telegram](../product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md).
These requirements constrain future work; they are not implemented by Prompt 04.


## Future native-client boundary

The private HTTP/SSE surface established in Prompt 03 and retained through Prompt 04 is validated for a browser session through
an SSH tunnel. A future native-client milestone should extract/define a stable,
versioned, authenticated client API above the existing control-plane operations.

Target shape:

~~~text
                     BotSquad Core
                   /      |       \
                  /       |        \
             Web UI    iOS app   future clients
                  \       |        /
                   \      |       /
                 trusted control plane
                         |
                 company/runtime state
~~~

Transport is independent:

~~~text
client
  -> private LAN/VPN
  -> SSH tunnel
  -> future outbound relay
  -> authenticated BotSquad API
~~~

Do not expose the current loopback service publicly merely to support a mobile client.

Remote devices require explicit pairing, revocable device identity, human-principal
authorization, idempotent mutations, reconnect-safe event delivery and server-side
audit.

A future relay may assist NAT traversal, session routing and push connectivity, but it
must not become the authority boundary or canonical company-state store. End-to-end
encryption is a design goal pending an explicit protocol/security review.

See [Native iOS Remote Client and Secure Remote Access](../product/IOS_REMOTE_CLIENT.md)
and [Decision 012](../decisions/decision_012_ios_remote_client.md).
