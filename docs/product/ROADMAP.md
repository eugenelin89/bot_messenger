# BotSquad Roadmap

**Status:** Canonical prompt roadmap  
**Updated:** 2026-09-29

This document defines the current planned sequence of BotSquad implementation prompts.

Prompt numbers are roadmap identifiers, not product version numbers. A prompt may contain
multiple commits and may be split internally if evidence requires it, but the numbering
below should remain stable unless a later explicit roadmap update changes it.

## Roadmap at a glance

| Prompt | Milestone | Status |
| --- | --- | --- |
| 01 | Persistent workers, tasks, Codex runtime, research loop | Complete |
| 02 | Managed engineering organization and independent review | Complete |
| 03 | Ubuntu HQ, reproducible bootstrap, Linux confinement, worker AI profiles | Complete |
| 04 | Nix, trusted approvals, privileged provisioner, per-worker Linux identity | Complete |
| 05 | Generalized projects and repository lifecycle | Complete |
| 06 | Stable authenticated remote-client API and device identity | Complete |
| 07 | First-class conversations and direct worker interaction | Next |
| 08 | Collaborative working groups and deliberation | Planned |
| 09 | Strategic company operating loop | Planned |
| 10 | Bounded Computer Use | Planned |
| 11 | Multi-company support on one HQ | Planned |
| 12 | Company-to-company collaboration | Planned |
| 13 | External identities and Telegram integration | Planned |
| 14 | Cross-HQ federation | Planned |
| — | Native iOS Remote MVP / no-tunnel mobile transport | Deferred |
| 15+ | Broader operating capabilities | Later |

Demo Operator 01 is an unnumbered dogfood interlude after Prompt 05. Its bounded browser
operator and [StudyPlan tutorial](../tutorials/demo-01-studyplan/README.md) exercise the
existing development HQ. It remains an unnumbered historical interlude. **Prompt 06 is Complete; Prompt 07 is Next.**

The sequence now prioritizes making BotSquad behave like an **intelligent company**, not
an agent assembly line. Prompt 06 already provides the stable authenticated client
foundation; Prompt 07 builds direct conversation, Prompt 08 team deliberation, and
Prompt 09 proves an iterative company operating loop before broader action surfaces.
The existing SSH-tunnel browser path is acceptable while these semantics mature. See the
[Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md) and
[Decision 016](../decisions/decision_016_intelligent_company_model.md).

---

## Prompt 01 — Persistent AI organization

**Status:** Complete

Prompt 01 proved the smallest real organization loop:

~~~text
Human
  |
  v
Atlas — CEO
  |
  v
Scout — Researcher
  |
  v
Atlas
  |
  v
Human
~~~

Major capabilities:

- persistent logical worker identities;
- explicit tasks and durable messages;
- event-driven dispatch;
- no idle model polling;
- Codex App Server runtime adapter;
- persistent Codex thread binding;
- execution records per attempt;
- worker hiring within a trusted authority ceiling;
- restart/recovery without replaying completed work;
- artifacts and audit evidence.

Key lesson:

> A worker is a durable organizational identity, not a continuously running model process.

See the Prompt 01 plan, validation record, and Decision 007.

---

## Prompt 02 — Managed engineering organization

**Status:** Complete

Prompt 02 expanded the organization:

~~~text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    └── Turing — CTO
        ├── Linus — Engineer
        ├── Ada — Engineer
        └── Grace — Reviewer
~~~

Major capabilities:

- product specification before engineering;
- two concurrent real Codex engineers;
- task-bound branches/worktrees;
- narrow trusted source-editing tools;
- bounded product tests;
- exact-commit review;
- immutable review evidence;
- trusted integration only after tests;
- conflict/failure preservation;
- concurrency evidence;
- restart without duplicate work.

Prompt 02 used the fixed SquadStatus product as a bounded validation environment.

Key lesson:

> Multi-agent engineering becomes trustworthy when ownership, evidence, review, and
> integration are explicit control-plane objects instead of chat conventions.

See the SquadStatus case study and Decision 008.

---

## Prompt 03 — Ubuntu headquarters

**Status:** Complete and validated

Prompt 03 moved BotSquad from a workstation-local experiment to an always-on,
operator-controlled Ubuntu headquarters.

Major capabilities:

- reproducible Ubuntu bootstrap;
- provider-neutral SSH target;
- non-root botsquad systemd service;
- source/build separated from durable company state;
- persistent swap policy for small hosts;
- boot/reboot recovery;
- repeat-install/idempotency;
- private loopback-only web UI;
- Codex authentication under the service identity;
- Codex CLI/App Server upgrade and revalidation;
- Linux engineering confinement;
- macOS regression path preserved;
- per-worker model selection;
- per-worker reasoning effort;
- per-worker execution priority;
- human AI-profile lock;
- immutable effective execution provenance;
- runtime-discovered model/reasoning choices;
- friendly Codex thread names;
- service health/readiness;
- real Ubuntu research and six-worker engineering acceptance.

Validated light-duty host:

~~~text
Ubuntu 24.04 x86_64
1 vCPU
2 GB RAM
approximately 50 GB disk
2 GiB configured swap
~~~

Prompt 03 proved that the bounded six-worker workflow can run on this small host while
two Codex workers overlap.

Key lesson:

> BotSquad can be a real self-hosted headquarters rather than a collection of local
> terminal sessions.

See Current State, Decision 011, and the Prompt 03 Ubuntu validation record.

---

## Prompt 04 — Nix, trusted approvals, and per-worker Linux identity

**Status:** Complete

[Decision 013](../decisions/decision_013_trusted_worker_infrastructure.md) and
[real Ubuntu acceptance](../validation/prompt-04-linux-identity.md) record the implementation.

- Nix is a persistent DevOps leaf under Atlas, with explicit tasks and no root/sudo.
- Human approvals bind exact immutable operation, requester, target, parameters,
  expiry and preconditions; one-time consumption precedes mutation.
- A root-owned Unix-socket provisioner admits trusted service/admin peers and supports
  fixed identity create/disable, approved clone preparation/revocation, and health.
  Internal bounded source/Git helpers run after worker UID/GID drop. No shell,
  arbitrary path, package installation or service administration API exists.
- Stable UUID-derived `bsw-<hash>` accounts have private UID/GID, locked passwords,
  nologin shells and private homes under `/var/lib/botsquad-workers`. Central Codex
  authentication and existing runtime workspaces remain under the service account.
- Linux engineers use independent worker-owned clones; Grace reviews a trusted
  read-only exact-commit packet; trusted integration owns canonical product main.
- Retirement blocks unsafe active/unmerged work, disables dispatch, terminates the
  recorded UID's processes, revokes access and preserves homes/history.
- Root receipts and consumed intent recover across app/provisioner restart and reboot.

Acceptance passed 81 deterministic tests on macOS/hardened Ubuntu, real Nix tasks and
approvals, seven real identities, 100 UID probes, concurrent engineer turns, exact
review/integration, 8/8 product tests, safe engineer retirement, real lost-response
recovery, research regression and a bounded reboot with production history preserved.

The development backend remains simulated. This milestone does not move central
Codex processes/auth into worker homes or implement general projects, service upgrades,
remote/mobile APIs, Computer Use or multi-company persistence.

---

## Prompt 05 — Generalized projects and repository lifecycle

**Status:** Complete and validated

Prompt 05 generalized the bounded SquadStatus workflow into reusable software Projects.
A Project can contain multiple repositories with independent configurable default branches.

Implemented capabilities:

- trusted local creation, bounded Git-bundle import and public GitHub registration/fetch;
- immutable per-worker scopes and private Linux-owned clones;
- bounded Project instructions and applicable read-only AGENTS guidance;
- named focused/full Node recipes in a confined disposable snapshot;
- multiple commits and immutable submissions;
- exact independent review packets, changes_required and bounded real revisions;
- durable integration queue, stale/conflict blocking and full validation before advance;
- non-root remote publication with exact old/new SHA human approval and receipts;
- lost-response reconciliation, divergence blocking and archive/access release;
- SQL-only history-preserving migration and compatible persistent worker threads.

Acceptance passed 105 hardened Ubuntu tests, a real imported LedgerBrief Project on
`trunk`, concurrent Unix-isolated engineers, genuine revision and second review,
full-tested integration, four restart gates, controlled bare publication/reconciliation,
100 UID probes and archive denials. Legacy SquadStatus, retirement, research, receipt
recovery and full reboot also passed with retained production paused and preserved.

Repository and command support remains deliberately bounded: Node test files only,
no dependency installation/general environment manager, unsafe Git features rejected,
and no deployment automation. Public GitHub fetch passed; authenticated GitHub push
remains unvalidated because no credential/disposable target was assumed. Historical
SquadStatus remains a regression fixture. No Prompt 06+ capability was implemented.

See [Decision 014](../decisions/decision_014_generalized_projects.md) and
[Prompt 05 acceptance](../validation/prompt-05-general-projects.md).

---

# Remote operator access

## Prompt 06 — Stable authenticated remote-client API

**Status:** Complete

Prompt 06 implements a separate `/api/v1/` contract on the existing private listener.
The original browser session API remains local and continues to call the same trusted
control plane. Stable HQ identity and public-key devices belong to the existing human;
pairing, fingerprint confirmation and revocation are explicit local browser operations.

Implemented and accepted:

- Ed25519 proof over a one-minute challenge; ten-minute opaque tokens, hash-only storage;
- immutable capability ceilings checked with human/device state on every request;
- explicit sanitized DTOs, discovery, capabilities and bounded pagination;
- message-only communication, general/exact-Project objectives, dispatch/profile/interrupt;
- atomic seven-day idempotency receipts and safe retry across lost response/restart;
- durable bounded SSE cursors, reconnect/reset and expiry/revocation closure;
- independent workstation client through SSH, actual UI pairing, read-only denials,
  real runtime interruption, service restart, full host reboot and final device revocation;
- full Linux/browser/research/isolation regressions and retained-HQ migration preservation.

Read [API v1](../api/CLIENT_API_V1.md),
[Decision 015](../decisions/decision_015_remote_client_trust.md) and
[Prompt 06 acceptance](../validation/prompt-06-remote-client-api.md).

No public port, CORS, relay, APNs, iOS project, remote protected approvals, Project-policy
editor, multi-company implementation or artifact-content API was added. A future
transport limited to device authority must route only `/api/v1/`, never the full legacy
administrative listener. HQ UUID is not cryptographic server identity or E2EE.

---

# Next implementation phase

# Interaction layer

## Prompt 07 — First-class conversations and direct worker interaction

**Status:** Next

Prompt 07 fixes the basic interaction model before adding more client surfaces.

The current system has durable messages, but ordinary messages are Task-centric and do
not provide a general recipient inbox or reliable conversational wake/reply behavior.
The human also cannot yet open a real private conversation with Maya, Turing, Linus,
Ada, Grace or Nix.

Prompt 07 should introduce a first-class Conversation/Thread model distinct from Tasks
and passive Messages.

Target:

~~~text
Human
  |
  +-- direct conversation with Atlas
  +-- direct conversation with Maya
  +-- direct conversation with Turing
  +-- direct conversation with Linus / Ada / Grace / Nix
  |
Workers
  +-- direct worker-to-worker conversations across hierarchy
~~~

Hierarchy remains authoritative for **assignment and protected actions**, not for who is
allowed to exchange ideas.

### Required semantics

Separate at least three ideas:

~~~text
passive message
    communicates / records context
    does not wake a model

conversation turn requesting a reply
    explicit bounded model work
    may wake the addressed participant

Task
    executable assignment with ownership / acceptance / authority
~~~

A conversation reply must never silently become a Task or grant new authority.

### Major capabilities

- persistent Conversation/Thread identity;
- one-to-one human ↔ worker conversations;
- worker ↔ worker conversations not restricted to reporting edges;
- durable participant-oriented inbox/history independent of a worker's current Task;
- explicit reply-request / conversation-turn semantics that can wake a worker;
- passive/non-dispatching messages retained for announcements/context;
- bounded conversation turns with no idle polling;
- reply/mention loop prevention and turn/rate budgets;
- thread context included only where the participant is authorized to see it;
- human ability to observe, stop, mute/archive and resume conversations;
- clear UI distinction among conversation, assignment and approval;
- durable attribution of every turn to worker/execution/principal;
- restart/recovery without replaying completed conversation turns;
- existing Executive channel and historical messages preserved.

### Authority rules

Conversation participation does not imply task-assignment, approval, repository,
filesystem, worker-management, Project-policy, Computer Use or external-service
authority.

For example, Linus may ask Ada a technical question and Ada may answer, while Linus still
cannot assign Ada a Task if the hierarchy forbids it.

### Acceptance themes

- human opens a direct conversation with Maya and receives a real reply;
- human opens a direct conversation with an engineer without routing through Atlas;
- Linus and Ada exchange a bounded technical conversation across normal peer roles;
- a passive message does not wake the recipient;
- an explicit conversation turn does wake exactly the intended participant;
- conversation does not create a Task unless a separate trusted assignment action occurs;
- worker without assignment authority still cannot assign the conversation partner;
- conversation history survives service restart;
- duplicate/retried conversation-turn requests do not duplicate model work;
- loops are bounded;
- audit/execution evidence clearly distinguishes conversation work from Task work;
- existing research/engineering/Project workflows remain correct.

The browser/SSH path is sufficient for this milestone. Do not build iOS merely to expose
these semantics.

---

## Prompt 08 — Collaborative working groups and deliberation

**Status:** Planned

After direct conversation semantics are trustworthy, add explicit bounded multi-worker
discussion.

The goal is to let specialists reason **with one another**, rather than reducing every
complex problem to manager → delegate → result.

Target:

~~~text
Human / Atlas opens Design Working Group
        |
        +-- Maya    product/user perspective
        +-- Turing  architecture
        +-- Linus   implementation practicality
        +-- Grace   reviewer / risk
        |
        v
proposal -> critique -> questions -> refinement -> synthesis
        |
        v
design artifact + alternatives + dissent + unresolved risks
        |
        v
normal hierarchy may create implementation Tasks
~~~

Introduce a first-class bounded DiscussionSession / WorkingGroup / Deliberation object
with a topic, desired output, participants, facilitator, synthesizer, round/turn budget,
time budget, status, transcript, synthesis artifact and preserved dissent/unresolved
questions.

### Interaction rules

- participants may come from different branches of the hierarchy;
- discussion uses human-readable language;
- every turn is explicitly scheduled and attributable;
- no participant receives new authority merely by joining;
- ordinary messages still do not automatically wake models;
- the working-group object itself is the explicit work trigger;
- discussion cannot silently create implementation Tasks;
- follow-on Tasks use the existing trusted hierarchy/assignment rules;
- human may observe, interject, pause, stop or request another bounded round;
- unresolved disagreement should be preserved rather than fabricated into consensus.

Useful initial modes include design roundtable, architecture review, product/engineering
trade-off discussion, pre-mortem/red-team review, research synthesis,
reviewer/implementer clarification and incident/problem-solving.

### Acceptance themes

Run at least one real design discussion with several existing workers, preferably
Maya + Turing + engineer + Grace.

Verify:

- participants see the bounded shared discussion context;
- participants challenge/respond to one another rather than producing isolated reports;
- multiple viewpoints and alternatives are retained;
- facilitator/synthesizer produces an inspectable final artifact;
- dissent/unresolved risk survives synthesis;
- human can inject one question mid-session;
- discussion respects global execution capacity and queues safely;
- restart/recovery resumes without duplicating completed turns;
- a disallowed discussion message cannot expand capability;
- no implementation Task is created until a separately authorized assignment occurs;
- discussion terminates at its configured bound rather than becoming an infinite bot loop.

This milestone should make BotSquad feel more like a real team thinking together, while
preserving the distinction between **communication, deliberation and execution authority**.

---

# Company intelligence layer

## Prompt 09 — Strategic company operating loop

**Status:** Planned

Prompts 07 and 08 make workers capable of direct conversation and genuine team
deliberation. Prompt 09 proves that those capabilities can operate as an ongoing company
rather than isolated conversations or one-shot workflows.

The human may give either:

~~~text
Broad mandate
"Increase sustainable profit within these constraints and resources."
~~~

or:

~~~text
Specific mandate
"Manage and market this existing product; improve quality, adoption and revenue."
~~~

The organization should decide which workers, research, discussions, decisions, Projects,
Tasks and experiments are useful. The human should not have to prescribe every handoff.

Target loop:

~~~text
human mandate
      |
      v
situation / evidence
      |
      v
strategy / hypotheses
      |
      v
research + working-group deliberation
      |
      v
durable decision
      |
      v
Projects / Tasks / approved operations
      |
      v
execution + independent review
      |
      v
outcomes / metrics
      |
      v
company review
      |
      +--> continue
      +--> iterate
      +--> pivot
      +--> stop
      +--> scale
~~~

### Major capabilities

- durable company mandate / strategic objective distinct from one Task;
- support for broad and specific human objectives;
- explicit situation/goal state and important constraints;
- worker initiative within role: ask questions, request research, propose Projects,
  identify risks, recommend experiments and escalate protected choices;
- durable strategy hypotheses and decision records;
- company-selected participation rather than human-scripted every handoff;
- outcome/metric observations attributable to sources;
- periodic/event-driven company review when material evidence changes;
- durable strategic memory: what was tried, why, what happened and what was learned;
- stop/continue/iterate/pivot/scale decisions;
- bounded operating cycles and escalation;
- no idle model polling;
- no authority expansion from a vague objective.

### Broad-objective acceptance

Use a safe scenario with simulated or non-financial operating resources.

Give Atlas a deliberately broad mandate with outcomes and constraints, but **do not**
hard-code the internal plan or every participant.

Acceptance should show the organization:

- inspects the current situation;
- chooses what it needs to learn;
- convenes useful workers/discussions;
- generates and compares multiple strategies;
- makes an attributable decision;
- creates appropriate bounded Projects/Tasks;
- reviews the resulting evidence/outcome;
- changes or confirms its next action based on what happened.

A successful test is not "the bots produced lots of chat." The resulting plan and next
action should be traceable to evidence and team reasoning.

### Specific-product acceptance

Also run a specific existing-product scenario representative of a real operating team,
for example managing a small software product.

The organization should coordinate product, engineering, research/review and growth work
toward explicit product/business metrics rather than inventing a new business.

Acceptance should prove that the same operating model works when the human gives a
specific mandate rather than a vague strategic goal.

### Financial/resource boundary

Prompt 09 does **not** grant raw bank, payment or crypto-wallet authority.

Workers may reason about budgets/resources and propose expenditures or transactions, but
real financial execution requires a separately implemented trusted treasury/resource
capability. Ordinary workers must never receive wallet private keys, seed phrases, bank
credentials or unrestricted payment credentials.

A future financial capability must define typed intents, budgets/limits, provider or
destination policy, audit/receipts, idempotency/reconciliation, approval thresholds and
emergency revocation before real financial autonomy is claimed.

### Acceptance philosophy

Do not make the scenario deterministic by scripting every worker message, participant,
strategy or conclusion. Validate the trusted invariants, bounds, evidence and operating
outcome while leaving meaningful organizational choices to the team.

See [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md) and
[Decision 016](../decisions/decision_016_intelligent_company_model.md).

---

# Broader agent capabilities

## Prompt 10 — Bounded Computer Use

**Status:** Planned

Add explicit Computer Use capability after worker OS identity, approvals and the core
interaction model are reliable.

Preferred autonomous model:

~~~text
worker
   |
   v
isolated browser / desktop / VM / container
~~~

Do not make the human's personal workstation the default autonomous environment.

Capabilities should define environment, allowed apps/sites, filesystem scope,
upload/download policy, maximum runtime, network policy and actions requiring approval.

A specialized Computer Operator role is preferred to granting GUI authority to every
worker.

### Acceptance themes

- worker without capability cannot obtain session;
- bounded browser workflow succeeds;
- disallowed site/action fails;
- screenshots/results attributable to execution;
- prompt injection cannot expand authority;
- protected action pauses for approval;
- session can be interrupted;
- restart/recovery is defined;
- no unrestricted access to personal credentials/data.

---

# Company layer

## Prompt 11 — Multi-company support

**Status:** Planned

Allow one BotSquad HQ to host multiple isolated companies.

Company becomes a first-class security/data boundary. Company-scoped concepts include
workers, conversations/messages, discussions, tasks, executions, artifacts,
repositories/projects, approvals, external identities, policy and audit.

Acceptance must prove two companies cannot read/write one another, conversations and
discussions are company-scoped, active company is explicit for protected actions, and
restart/migration preserves isolation.

---

## Prompt 12 — Company-to-company collaboration

**Status:** Planned

After company isolation is real, allow companies to collaborate explicitly through a
trusted CompanyConnection defining allowed message/task/discussion types, artifact
policy, approval policy, rate limits and lifecycle/revocation.

One company must not gain access to the other's internal worker conversations,
working-group transcripts or unrelated data.

Acceptance includes bounded messaging/task handoff, explicitly permitted collaborative
discussion, result/artifact return, provenance, revocation, loop bounds,
deduplication/replay protection and no cross-company authority escalation.

---

# External communication

## Prompt 13 — External identities and Telegram integration

**Status:** Planned

Add a generic ExternalIdentity model, then Telegram as the first concrete adapter.
Workers use Telegram bot identities, never simulated human accounts. Raw provider
credentials stay behind trusted integration code; external communication remains
untrusted content and never becomes authority.

Acceptance includes attach/detach, hidden tokens, inbound/outbound mapping, rate limits,
loop prevention, audit/provider IDs, rotation/revocation and continued internal operation
when Telegram is unavailable.

---

## Prompt 14 — Cross-HQ federation

**Status:** Planned

Allow companies on separate BotSquad installations to collaborate through authenticated
provider-independent federation with stable HQ/company identity, signed/authenticated
envelopes, replay protection, deduplication, rate limits, revocation, artifact integrity
and bounded task/message/discussion loops.

Do not implement federation by sharing SQLite, exposing databases, trusting free-form bot
messages or using Telegram identity as the sole authority mechanism.

---

# Deferred convenience client

## Native iOS Remote MVP

**Status:** Deferred / intentionally unnumbered

Prompt 06 already established the stable authenticated Client API, HQ/device identity,
pairing, idempotency and reconnectable events.

For the current phase, the existing private browser over SSH tunnel is an acceptable
operator experience. A native iPhone/iPad application and no-manual-tunnel mobile
transport are useful convenience features, but they are lower priority than getting
worker conversation and deliberation semantics correct.

The iOS direction remains valid: native first-class client, Client API v1 rather than
browser internals, explicit paired/revocable device identity, private HQ by default, SSH
as admin/recovery, and possible future VPN/direct or outbound relay transport.

Revisit this milestone when the interaction model is stable enough that the mobile client
will not simply reproduce semantics that are about to change.

---

# Prompt 15 and beyond — broader operating capabilities

**Status:** Later / intentionally not fixed yet

After the foundational organization, security, project, interaction, remote-client,
company and federation layers are proven, later prompts may add capabilities such as:

- native iOS Remote MVP / managed no-tunnel mobile access if it has not been pulled forward;
- deployment operator;
- infrastructure fleets;
- scheduled recurring work;
- customer support;
- email identities;
- CRM/sales integrations;
- accounting/metrics;
- cloud provider provisioning;
- secret-management integrations;
- bounded budgets;
- spending requests;
- billing;
- customer-facing deployment;
- specialized GPU/compute workers;
- protected treasury/payment/wallet adapters with bounded budgets, accounting and approval policy;
- portfolio-level company supervision;
- broader guided tutorials and release walkthroughs beyond the bounded Demo Operator 01.

These should not be assigned fixed prompt numbers until their dependencies and scope are
better understood.

---


# Cross-cutting rules for every future prompt

Every future milestone must preserve these invariants unless a new accepted decision
explicitly changes them.

## Human agency

The human owns company-level authority.

Bots may request protected actions but cannot create human approval through text.

## Communication is not execution

Messages communicate.

Tasks or other configured trusted triggers authorize work.

## Idle workers do not poll models

Use control-plane events and queues.

Do not consume model usage merely to check an empty inbox.

## Durable identities, replaceable runtime sessions

Worker, company, HQ, runtime account, thread, execution, Unix user, device, and external
identity are distinct concepts.

## Evidence over prose

Important completion claims require artifacts, commits, tests, logs, receipts, or other
inspectable evidence.

## Fail closed

Missing confinement, unsupported runtime settings, ambiguous authority, or invalid
credentials must not silently fall back to broader access.

## No credential exposure to normal workers

SSH keys, Codex auth, Telegram bot tokens, APNs secrets, infrastructure credentials, and
other sensitive provider secrets remain behind trusted boundaries.

## Idempotency

Retries/reconnects must not duplicate consequential operations.

## Explicit scope

A new capability does not imply authority over unrelated files, machines, companies,
accounts, or external systems.

---

# Dependency map

~~~text
01 Persistent organization
        |
02 Managed engineering
        |
03 Ubuntu HQ
        |
04 Nix + approvals + worker Unix identity
        |
05 General projects
        |
06 Authenticated remote client API
        |
07 Direct conversations + worker interaction
        |
08 Working groups + deliberation
        |
09 Strategic company operating loop
        |
10 Computer Use
        |
11 Multi-company
        |
12 Company collaboration
        |
13 External identities / Telegram
        |
14 Cross-HQ federation
        |
15+ Broader company operations

Native iOS / no-tunnel mobile access is deferred and can be pulled forward later without
changing the interaction-layer priorities.
~~~

Some later work may proceed in parallel once its dependencies are proven, but prompt
numbers above are the canonical planning order.

## Related documents

- Current State
- Project Vision
- System Architecture
- AI Organization Model
- Native iOS Remote Client and Secure Remote Access
- Multi-Company and Federation Model
- External Identities and Telegram Integration
- Computer Use Model
- Decision index
- Demo Operator and Guided Tutorials
- Running Multiple BotSquad Instances
