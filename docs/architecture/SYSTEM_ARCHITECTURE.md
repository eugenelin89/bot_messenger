# BotSquad — System Architecture

**Status:** Through completed and deployed Prompt 10; evidence in milestone validation records
**Updated:** 2026-10-05

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
| Project policy, paths and recipe contracts | `src/domain/projects.ts` |
| Trusted operations and staged tasks | `src/control/company.ts` |
| Project/repository lifecycle and remote policy | `src/control/projects.ts`, `src/control/remote-git.ts` |
| Managed repositories, allocations, review, integration | `src/control/engineering.ts` |
| Legacy SquadStatus scaffold and contract | `src/control/product-scaffold.ts` |
| Confined named Node recipes and legacy runner | `src/control/product-runner.ts` |
| Atomic claims / execution lifecycle | `src/control/dispatcher.ts` |
| SQLite migration / constraints | `src/persistence/store.ts`, `src/persistence/projects-migration.ts` |
| Single service ownership | `src/persistence/lock.ts` |
| Runtime contract and tool schemas | `src/runtime/adapter.ts` |
| Codex protocol / transport | `src/runtime/codex.ts`, `src/runtime/rpc.ts` |
| Loopback API / browser UI | `src/http/server.ts`, `public/` |
| Startup / shutdown | `src/main.ts` |
| Deterministic and real validation | `test/`, `scripts/real-e2e.ts`, `scripts/real-engineering.ts`, `scripts/real-projects.ts` |

Node 24 supplies HTTP, SQLite, process control and tests. TypeScript checks the code.
Runtime dependencies are the pinned official Codex CLI and Playwright core for the isolated browser adapter. No distributed queue
or frontend framework is needed.

## Persistent domain

Prompt 01 retains Principals, Workers, runtime bindings, channels/messages, Tasks,
Executions, Artifacts, append-oriented Audit, Settings, tool receipts and wake events.
Worker identity, manager, lifecycle, capabilities and private runtime workspace remain
separate from Task and runtime-thread identity. Artifacts have generated paths and
SHA-256 integrity checks; messages and audit reject ordinary update/delete operations.

Historical migration 2 added the following fixed-fixture schema (generalized by migration 5):

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

Migration 5 adds first-class Projects and SQL-only table rebuilds that preserve original
identities, columns and history. Repositories have nullable legacy workflow/spec links,
source/remote identity and policy; allocations have immutable scopes/manifests; submissions
have commit lists and linked revision rounds; immutable review packets, revision requests,
integration queue attempts, release intents and non-root publication approvals/receipts
are persistent. Multiple repositories, deliveries, submissions and integrations are
supported. Legacy unknown metadata stays explicit rather than fabricated. Runtime-tool
schema versions protect retained bindings from silent incompatible resume.

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
| Engineer | bounded source read, scoped writes/deletes, named recipes, own Git inspection, immutable submission | none |
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

## Communication versus assignment

Worker messages use normal human-readable text inside durable structured records. A
worker with `internal_message` may name any existing worker as recipient; message routing
is not constrained to reporting edges. Messaging remains communication only: it does not
create a Task, wake an idle recipient, expand capabilities or create approval.

The legacy task execution context is Task-scoped. A running task worker receives recent messages
whose `related_task_id` matches its active Task rather than a general recipient inbox.
Therefore a recipient-addressed message is durable/auditable but is not guaranteed delivery
to a future worker turn unless it is also relevant to that worker's assigned Task.

Task creation is separately enforced. `assign_task` requires the target to be the
manager's direct subordinate and then applies the supported research/product role and
stage restrictions. Child completion is the dependable orchestration signal: durable
wake records queue manager follow-up after required children become terminal.

The existing human message endpoint posts to the Executive channel without dispatch.
Explicit objectives enter through Atlas. Prompt 07 adds a separate first-class direct
Conversation with participant-scoped history and explicit bounded reply requests.
Executions have checked task/conversation ownership; both share the same two-slot
dispatcher and one-active-execution-per-worker rule. Conversation tools cannot assign,
write source, approve or publish. Device API v1 continues to project task executions only.

Each worker/conversation pair has separate provider generations, never its legacy task
thread. A safe rollover persists a bounded handoff with original source references and
structured obligations, then prepares and activates a fresh provider context. Unknown
invocations block either work origin for that worker; stale generations cannot mutate
current work. Healthy task bindings retain their provenance. See
[Conversations and continuity](CONVERSATIONS_AND_CONTINUITY.md) and
[Decision 018](../decisions/decision_018_conversations_context_continuity.md).

Prompt 08 adds first-class bounded working groups on this substrate.
`discussion_turns` bind requests to one charter; SQL verifies group/worker/session ownership.
A facilitator chooses substantive follow-ups, then separate draft, review and final turns
produce immutable synthesis artifacts. Evidence exports, actual revision checkpoints,
shared research accounting and owner controls are durable. Passive material never dispatches;
only an explicit owner assignment converts a selected synthesis into a normal Task. See
[working-group details](WORKING_GROUPS.md) and [Decision 021](../decisions/decision_021_bounded_working_groups.md).

## Strategic company operating loop

Prompt 09 implements durable owner-activated mandates above individual Tasks. Typed
`mandate-review-v1` turns share the existing dispatcher and worker fences, with fresh Prompt 07
generations reconstructed from strategic records. Company-selected groups use explicit
coordinator provenance; separate decision-linked internal Tasks retain hierarchy and private
provider contexts. Observations preserve mode/time/provenance; decisions require current
original-delivery evidence or explicit missingness. A trusted clock persists versioned
one-time/interval/daily schedules, stable occurrences, hold-one overlap and coalesced missed
intervals. Idle time invokes no models. See [complete semantics](COMPANY_OPERATING_LOOP.md),
[Decision 022](../decisions/decision_022_company_operating_loop.md) and
[completed release acceptance](../validation/PROMPT_09_VALIDATION.md).

This layer must reuse the conversation, deliberation, Task, Project, review and authority
boundaries below it rather than bypassing them. A vague goal does not expand capabilities.
Real financial/payment/wallet authority remains a separate trusted capability/policy
problem; ordinary workers never receive raw financial credentials.

See [Intelligent Company Operating Model](../product/INTELLIGENT_COMPANY_MODEL.md) and
[Decision 016](../decisions/decision_016_intelligent_company_model.md).

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

A trusted human creates a Project with instructions, policy and named validation recipes,
then creates/imports/registers its managed repositories. Repository identity, default
branch and canonical SHA are independent of delivery tasks. A completed Maya specification
precedes Turing's allocations. Existing compatible worker identities/threads can work on
later deliveries and Projects. SquadStatus remains an explicit regression fixture.

Canonical Git stays service-owned. Linux engineers receive independent private clones;
the development backend uses worktrees. Immutable allocation manifests bind worker,
repository, task, base, branch, exact-file/directory-prefix scopes, protected paths and
bounds. Application and provisioner verify ownership, normalized paths, links, metadata
and scope on each action. Concurrent scopes cannot overlap. AGENTS/context is guidance.

Imports are bounded Git bundles or trusted GitHub fetches, never host paths. Fixed Git
commands disable ambient config, helpers, hooks, replacement refs and redirects. Unsafe
Git features are rejected. Source reads are bounded UTF-8; writes/deletes cannot cross
scope or protected paths. Workers have no shell, arbitrary Git command or remote tool.

Generic named Node test recipes run in disposable snapshots. Only build/ is writable;
Linux uses a 64 MiB tmpfs plus namespaces/seccomp and Node permissions. JIT/WebAssembly
are disabled, with 96 MiB heap, 512 MiB data, 30-second maximum deadline and 64 KiB maximum
output. macOS uses Seatbelt and Node permissions for development. There is no unsandboxed
fallback or dependency installation. Policy may lower all bounds; see Decision 014.

Submissions freeze a verified base/head/linear commit range, Git-computed changed paths,
focused results and execution provenance. Every commit must stay inside the original
scope. A hashed review round freezes exact submissions, specification, diffs, validation
and previous feedback. Grace must read the packet and bind its disposition to those IDs
and commits. Changes required requeues only affected existing engineer tasks with exact
feedback; a revised immutable submission extends its predecessor. Review rounds are bounded.

An approved current packet permits a durable queued integration. The service serializes
canonical mutation per repository, checks the base and approval again, retains a candidate,
cherry-picks the exact ranges and runs all full recipes before fast-forward. Failed or
stale attempts preserve canonical Git and evidence. Restart reconciles persisted passing
candidates already advanced or blocks ambiguity; completed work never replays.

Remote policy is none/fetch_only/approved_push. Explicit trusted fetch verifies identity,
branch and ancestry; unexpected divergence blocks. Publication uses separate non-root
operation/approval/receipt tables, exact human authority and an atomic receiver update
bound to approved old/new SHA and branch. Lost responses reconcile before any retry.
Operator credentials remain service-private, never in repository URLs or worker context.

Archive persists authority-reduction intent, rejects unresolved work/publication, revokes
exact clone bindings and blocks future Project work. Repositories, clones, reviews and
history remain retained. Worker identities and compatible threads remain reusable.
See [Decision 014](../decisions/decision_014_generalized_projects.md).

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
research support and fail explicitly on incompatible engineering objectives. Migration 5
also marks retained pre-Project engineering schemas; generalized engineering fails clearly
for those bindings. New compatible Prompt 05 threads resume through revision and reuse.
Use fresh validation workers until an explicit binding-migration workflow exists. Runtime permission requests are
denied and retained as awaiting_approval. Four-minute deadlines and acknowledged
interruption remain. Raw credentials, reasoning and arbitrary transport data are not logged.

Context is limited to the current assignment/profile, direct child evidence, recent
task messages, selected documents and relevant product/spec/allocation/review records.
The entire database is not sent to a worker. Task content and selected evidence are
sent to the external model service; self-hosted/operator-controlled describes the control plane and durable coordination state.

## Human UI and host security

The browser shows organization, durable messages, tasks, executions, artifacts, audit,
Projects/repositories, policy/recipes, scopes, submission history, exact review rounds,
integration queue/results, remote approvals and archive state. Active
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

`npm test` covers retained milestones and generalized Projects, real local Git, migration, authority, ownership,
confinement, concurrency, exact-commit review, conflicts, failed acceptance, idempotency
and recovery. `npm run validate:prompt01` exercises actual research/restart/resume/
interruption. `npm run validate:real` exercises the actual six-worker engineering flow,
positive execution/turn overlap, denied boundary probes, independent review, product
acceptance and restart without replay. `npm run validate:projects` adds real imported-repository
work, revision/re-review, four durable restart gates, publication reconciliation and archive.
The Linux operator companion verifies actual UID and revoked-clone access. See the milestone
validation records.

The [Demo Operator](../product/DEMO_OPERATOR.md) is a separate, bounded development/test
client in `scripts/demo-operator/`. Scenario, Playwright UI driver, read-only assertions
and artifact recorder are separated. Its consequential actions use the human-facing UI;
it never imports private control-plane mutation functions or receives worker credentials.
The isolated browser records the same session. Exact scenario checks restrict automated
approval decisions while the existing trusted service/provisioner enforces authority.

Decision 006 is implemented for bounded browser work by Decision 024. An owner-created
Computer Operator may receive an immutable Task/session grant. A separate headless Chromium
broker has its own UID, namespace/filesystem/network boundary and resource limits. Trusted
HQ forwarding gates every request; exact protected fixture requests need owner approval and
unknown outcomes never replay. The model sees structured rendered snapshots; real PNGs are
private owner evidence. Native worker tools, engineering, Demo Operator and remote devices
grant no general GUI/desktop authority. See [Computer Use](COMPUTER_USE.md).

Business actions, personal accounts, secrets, payments and outreach remain separate Prompt 11
or later integrations. No full desktop or workstation access is part of this adapter.

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
grants remain deferred; Computer Use has its separate Decision 024 boundary.

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

The implementation through Prompt 08 still has one company per configured data directory. The service UID, Codex
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
These requirements constrain future work; they are not implemented through Prompt 06.


## Stable native-client boundary

The existing private browser HTTP/SSE surface retains its local session, exact Host and
Origin checks. Prompt 06 adds `/api/v1/` on the same loopback listener with a separate
header-only device authentication boundary and explicit sanitized DTOs. Both invoke the
existing trusted control-plane operations. See the [v1 contract](../api/CLIENT_API_V1.md)
and [Decision 015](../decisions/decision_015_remote_client_trust.md).

SQL migration 6 adds HQ, public device keys/capabilities, hashed one-time pairings,
one-use challenges, hashed ten-minute tokens, atomic mutation receipts and bounded
notification events. Application initialization creates the stable HQ UUID. No migration
creates accounts, modifies Projects, performs networking or replays work. Device
confirmation/revocation uses the local browser. Private keys stay with the client.

Every request checks enabled human, active device, token expiry and endpoint capability.
Seven-day timestamp/UUID request keys prevent stale replay becoming new work after
receipt cleanup. Mutations and sanitized result receipts share a transaction; interruption
commits intent before signaling, and existing orphan recovery blocks execution after a crash.
Persistent HQ-bound SSE cursors replay the last 10,000 notification hints independently
of retained audit history. Old cursors require authoritative refetch. Streams close at
expiry/revocation and obey device, connection and backpressure limits.

The full SSH administrative tunnel still confers legacy local administration. A future
transport limited to device authority must forward only `/api/v1/`; it must never forward
`/api/session` or other local browser/admin paths. No relay or public ingress is implemented.

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

## WE-01 public research and standing knowledge

[Decision 020](../decisions/decision_020_scoped_public_research.md) defines the implemented
bounded slice. `src/control/research.ts` owns current grants, eligibility/work scope,
durable budget reservation, receipts, source provenance and task-binding compatibility.
`src/runtime/research.ts` isolates the minimal public query in a native live-search
session on the existing account. `src/research/public-fetch.ts` provides DNS-pinned
bounded HTTPS GET with static extraction. Ordinary worker native broad tools remain
disabled. Public research no longer means only approved local-document analysis.

Schema 9 adds empty grant/evidence tables; trusted owner operations activate a worker.
The public and company-knowledge presets remain separate. All network waits occur outside
SQLite transactions; the promise-capable runtime awaits tool results and rechecks authority
before delivery. Unresolved broker invocation independently fences both work origins.
Source reads are worker/work scoped, outputs and attempts bounded across retries and
rollover. Preserved legacy Task bindings are distinct from research Task and conversation
bindings. Browser-only capability and evidence routes extend no device v1 capability.

Provider-internal network/cache behavior remains opaque. Managed fetch protections are
not described as provider protections. A source's retrieval time is not its observation
time. The [tutorial](../operations/PUBLIC_RESEARCH_TUTORIAL.md) and
[validation report](../validation/worker-empowerment-01.md) distinguish user operation,
synthetic fault tests, real worker evidence and retained-HQ activation.
