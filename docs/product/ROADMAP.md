# BotSquad Roadmap

**Status:** Canonical prompt roadmap  
**Updated:** 2026-10-06

This document defines the current planned sequence of BotSquad implementation prompts.

Prompt numbers are roadmap identifiers, not product version numbers. A prompt may contain
multiple commits and may be split internally if evidence requires it. Decision 017
explicitly changes the previous future ordering after Prompt 10; completed milestones
and their historical evidence retain their original meaning.

## Roadmap at a glance

| Prompt | Milestone | Status |
| --- | --- | --- |
| 01 | Persistent workers, tasks, Codex runtime, research loop | Complete |
| 02 | Managed engineering organization and independent review | Complete |
| 03 | Ubuntu HQ, reproducible bootstrap, Linux confinement, worker AI profiles | Complete |
| 04 | Nix, trusted approvals, privileged provisioner, per-worker Linux identity | Complete |
| 05 | Generalized projects and repository lifecycle | Complete |
| 06 | Stable authenticated remote-client API and device identity | Complete |
| 07 | First-class conversations, direct worker interaction and context continuity | Complete |
| 08 | Collaborative working groups and deliberation | Complete |
| 09 | Strategic company operating loop, durable scheduling and Asymmetri Motion reference acceptance | Complete |
| 10 | Bounded Computer Use | Complete |
| 11 | Single-company business operations and a measured Asymmetri Motion pilot | Complete for bounded supervised scope |
| — | Personal Operator / Daily Driver Phase | Current priority; unnumbered |
| — | Multi-company support on one HQ | Deferred; after single-company evidence gate |
| — | Company-to-company collaboration | Deferred; after company isolation |
| — | Generic external identities / Telegram | Deferred; needed narrow business adapters may precede it |
| — | Cross-HQ federation | Deferred; after justified company collaboration |
| — | Native iOS Remote MVP / no-tunnel mobile transport | Deferred |
| — | Broader business platforms, treasury and infrastructure fleets | Later; scope by demonstrated need |

Demo Operator 01 is an unnumbered dogfood interlude after Prompt 05. Its bounded browser
operator and [StudyPlan tutorial](../tutorials/demo-01-studyplan/README.md) exercise the
existing development HQ. It remains an unnumbered historical interlude. **Prompts 10 and 11 are complete; Prompt 11 is qualified to bounded supervised scope.** See the [actual Prompt 10 acceptance and deployment](../validation/PROMPT_10_VALIDATION.md).

**Completed first empowerment slice after Prompt 07:** [give bots appropriate power and authority](#near-term-task--give-bots-appropriate-power-and-authority).
WE-01 supplied bounded public research and approved company knowledge; Prompt 08 reuses
those boundaries. Broader business integrations remain scoped future work.

## Personal Operator / Daily Driver Phase

**Status:** Current priority after Prompt 11 — intentionally unnumbered; no Prompt 12.

Make the existing BotSquad reliable, understandable and pleasant enough that the owner
naturally uses it as a daily tool. For now it is primarily the owner's personal AI
company/tool. Optimize in this order: reliability, operator clarity, smooth daily workflows,
maintenance simplicity, polish, and only then reconsider broader capabilities.

Prioritize actual-use reliability defects; loading/status/error clarity; smoother
conversations, Tasks, mandates and approvals; what needs owner attention; easier recovery;
backup/update/credential maintenance; and operator UX polish. Consider easier remote/mobile
access only when actual usage shows the SSH tunnel is painful. Real owner experience chooses
future work; these are candidates, not committed numbered milestones or a giant backlog.

**Current task:** scheduler due/end validation and reliable bounded dispatch windows. See
[stabilization plan](../exec-plans/personal-operator-stabilization-01.md) and
[validation](../validation/PERSONAL_OPERATOR_STABILIZATION_01.md).

**Next candidates:** the pre-existing early-navigation/initial-state UI race; clearer
loading/status/error presentation; pending approvals and blocked-work overview; simpler
common operator flows; credential lifecycle/rotation/revocation UX; backup/update/health
maintenance UX; possible easier remote/mobile access later if demonstrated friction warrants it.

Feature expansion stays deferred: multi-company, company-to-company collaboration, cross-HQ
federation, Telegram/external identities, general CRM, broad email, accounting suites,
autonomous spending, treasury/payment/wallet, broad App Store automation, additional generic
business connectors, portfolio management, and a native iOS client solely because an older
roadmap included it. Keep their architecture documents as future possibilities. This changes
sequencing, not existing security boundaries or the possibility of later features.

[Decision 026](../decisions/decision_026_personal_operator_stabilization.md) records the owner
priority. Passing Prompt 11 does not automatically trigger capability growth or external actions.

## Foundational priority: one operational company first

**One AI company that can actually operate a real business is more important than
multiple companies or federation.** BotSquad should become a company of persistent
intelligent employees, not an agent assembly line or a distributed-agent platform without
a proven business use.

Prompt 07 establishes conversation and runtime-context continuity; 08 team deliberation;
09 an iterative company loop with a minimal durable company clock; 10 bounded Computer
Use; and 11 a small practical operating capability set with measured live acceptance.
Both broad strategic objectives and specific mandates remain first-class. Asymmetri
Motion is the canonical specific-product test, not a hard-coded engine dependency.

The existing SSH-tunnel browser is sufficient while these capabilities mature. Strategic
reasoning may be broad; authority remains enforced outside model-authored text. Read
[Decision 017](../decisions/decision_017_single_company_first.md),
[Single-Company Business Operations](SINGLE_COMPANY_OPERATIONS.md),
[Project Memory](../PROJECT_MEMORY.md) and
[Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

### Numbering change

The old future 11 multi-company, 12 company collaboration, 13 Telegram and 14 federation
assignments are superseded. Prompt 11 now means single-company business operations;
the former scale/transport milestones are deferred and unnumbered. Minimal scheduling is
pulled forward into 09, and the useful first business-integration subset into 11 rather
than an unspecified post-federation 15+. Historical records remain history. This is the
current sequence even when an older document reproduces the previous table.

## Near-term task — give bots appropriate power and authority

**Status:** WE-01 public-research/standing-knowledge slice accepted and deployed on
2026-10-01; see the [WE-01 report](../validation/worker-empowerment-01.md). Broader
empowerment remains open. Grants require explicit owner activation; implementation and
deployment alone do not grant retained workers new authority.

Employees need useful tools, access to information and standing authority to do their
jobs. BotSquad should let them carry out routine work independently within their role,
scope and budget, without making the owner approve every lookup or internal step.

Deliver this in small useful slices:

- Enable public web research and current-information lookup, including source links and
  honest reporting when information is unavailable.
- Provide role-appropriate access to company knowledge, tools and execution environments.
  Review today's disabled capabilities individually against actual job needs.
- Define standing authority for routine actions within approved scope and budgets, with
  clear escalation when an action exceeds that authority or requires protected approval.
- Make capabilities, limits, actions and results inspectable by the owner, with attribution,
  revocation and recovery. Enforce these grants in trusted code, not worker-authored text.

The first acceptance slice should let Atlas answer a current-weather question for a known
location in a direct conversation using a real current source, and let a research worker
complete a useful public-web research task. Both should run within standing authority
without per-lookup approval. Verify sources, unavailable-source behavior, recorded tool
use and denial of actions outside the granted scope; canned answers do not count.

See [Decision 020](../decisions/decision_020_scoped_public_research.md) and the
[owner tutorial](../operations/PUBLIC_RESEARCH_TUTORIAL.md) for the bounded implementation.
Preserve the numbered 08 → 09 → 10 → 11 sequence. Public research does not depend on
Computer Use or a full business-integration platform. Broader external actions still need
their applicable trusted policy and approval implementation.

See [Decision 019](../decisions/decision_019_near_term_worker_empowerment.md) for the owner
direction and current implementation boundary.

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

# Implementation phases

# Interaction layer

## Prompt 07 — First-class conversations and direct worker interaction

**Status:** Complete

Prompt 07 fixes the basic interaction model and establishes runtime-context continuity
before adding more client surfaces.

The implemented Conversation model is distinct from Tasks, passive legacy Messages and
provider-specific runtime threads/sessions. The browser supports direct human↔worker and
bounded peer exchanges, explicit versus passive sends, lifecycle controls and durable
context replacement. See [Prompt 07 acceptance](../validation/prompt-07-conversations-continuity.md),
[Decision 018](../decisions/decision_018_conversations_context_continuity.md) and
[technical/operator semantics](../architecture/CONVERSATIONS_AND_CONTINUITY.md).

The requirements below remain the acceptance contract; group deliberation is Prompt 08.

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

- persistent BotSquad Conversation identity independent of provider runtime threads;
- one-to-one human ↔ worker conversations;
- worker ↔ worker conversations not restricted to reporting edges;
- durable participant-oriented inbox/history independent of a worker's current Task;
- explicit reply-request / conversation-turn semantics that can wake a worker;
- passive/non-dispatching messages retained for announcements/context;
- bounded conversation turns with no idle polling;
- reply/mention loop prevention and turn/rate budgets;
- conversation context included only where the participant is currently authorized to see it;
- human ability to observe, stop, mute/archive and resume conversations;
- clear UI distinction among conversation, assignment and approval;
- durable attribution of every turn to worker/execution/principal;
- restart/recovery without replaying completed conversation turns;
- existing Executive channel and historical messages preserved;
- bounded runtime-context handoff/rollover with durable session lineage and scoped rehydration.

### Context continuity is part of acceptance

Worker identity, BotSquad Conversation, Task, ExecutionAttempt and provider RuntimeSession
are distinct. A worker can use several sessions over its lifetime; a conversation may
involve several workers. Do not assume a one-to-one mapping.

At a safe boundary, checkpoint authorized work and assemble a bounded, versioned handoff
with source references, decisions, active obligations, unresolved questions and omissions.
Link the old/new runtime generation and rollover reason. Durable records remain the
source of truth; a summary does not replace transcript/artifact history or grant authority.

Use verified runtime capabilities and configurable bounds rather than assuming a universal
thread limit. Preserve healthy compatible legacy bindings. Reconcile in-flight operations
before changing session ownership; ambiguity must block/escalate rather than cause blind
replay. Reject stale callbacks and unauthorized context retrieval after rollover.

Acceptance must force a small context budget, continue the same employee/conversation in
a fresh runtime context, retain pending work, recover through an interrupted handoff, deny
private-context leakage and reject stale-session writes. Prove completed results and
committed effects are not replayed. Do not claim exactly-once provider invocation when a
provider response is lost and cannot be reconciled.

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
- conversation history survives service restart and runtime-context rollover;
- duplicate/retried requests do not create duplicate committed conversation turns;
- loops are bounded and ambiguous runtime outcomes are reconciled or visibly blocked;
- audit/execution evidence clearly distinguishes conversation work from Task work;
- existing research/engineering/Project workflows remain correct.

The browser/SSH path is sufficient for this milestone. Do not build iOS merely to expose
these semantics. Apply C07-1 through C07-4 in
[Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

---

## Prompt 08 — Collaborative working groups and deliberation

**Status:** Complete

Actual C08-1/C08-2 acceptance, regression, independent review, preserved-state deployment
and browser verification passed. See the [validation report](../validation/PROMPT_08_VALIDATION.md),
[Decision 021](../decisions/decision_021_bounded_working_groups.md) and
[tutorial](../tutorials/working-groups.md). The requirements below remain the acceptance contract.

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
- unresolved disagreement should be preserved rather than fabricated into consensus;
- reuse Prompt 07 scoped memory, session lineage and safe context handoff.

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
- discussion terminates at its configured bound rather than becoming an infinite bot loop;
- participant/context changes cannot leak a worker's private conversational memory.

This milestone should make BotSquad feel more like a real team thinking together, while
preserving the distinction between **communication, deliberation and execution authority**.

---

# Company intelligence layer

## Prompt 09 — Strategic company operating loop

**Status:** Complete and deployed. See [accepted evidence](../validation/PROMPT_09_VALIDATION.md), [architecture](../architecture/COMPANY_OPERATING_LOOP.md) and [Decision 022](../decisions/decision_022_company_operating_loop.md).

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
"Manage and market Asymmetri Motion; improve product quality, adoption and sustainable revenue within the approved constraints."
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
      |
      v
persist bounded follow-up / next review
~~~

### Major capabilities

- durable company mandate / strategic objective distinct from one Task;
- support for broad and specific human objectives;
- explicit situation/goal state and important constraints;
- worker initiative within role: ask questions, request research, propose Projects,
  identify risks, recommend experiments and escalate protected choices;
- durable strategy hypotheses and decision records;
- company-selected participation rather than human-scripted every handoff;
- outcome/metric observations attributable to sources, periods and evidence modes;
- periodic/event-driven company review with a minimal durable scheduler;
- durable strategic memory: what was tried, why, what happened and what was learned;
- stop/continue/iterate/pivot/scale decisions;
- bounded operating cycles, follow-up and escalation;
- no idle model polling;
- no authority expansion from a vague objective.

### Minimal durable company clock

One-time follow-ups and recurring reviews are required here, not deferred behind
multi-company/federation. Persist owner, mandate/initiative, purpose, due time/timezone,
recurrence/end conditions, occurrence identity, schedule version, bounds and cancellation.

Clock/event checks run in ordinary trusted code. A due authorized review is bounded work;
a model is not repeatedly called to discover an empty inbox. Recheck authority and policy
at dispatch and consequential execution. Respect pause, cancellation, revocation and
concurrency/usage budgets.

Define restart recovery, transactional claiming, duplicate-event handling, overlap,
bounded missed-run catch-up, expired schedules, edits, backoff and escalation. Test these
with a controlled clock and at least one real short scheduled occurrence. Record the
difference between clock simulation and elapsed real-world operation. Later adapters reuse
this mechanism; a general automation platform is not required.

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
- changes or confirms its next action based on what happened;
- persists a useful follow-up rather than requiring the owner to prompt every handoff.

A successful test is not "the bots produced lots of chat." The resulting plan and next
action should be traceable to evidence and team reasoning.

### Specific-product acceptance — Asymmetri Motion

Use Asymmetri Motion as the canonical real-product reference. The organization should
coordinate useful product, engineering, research/review and growth work toward explicit
product/business metrics rather than inventing a new business.

Use owner-approved read-only material, scoped repository snapshots, sanitized exports or
clearly labelled fixtures as available. Record provenance, dates, access limits and missing
data. Asymmetri Motion-specific configuration must not be hard-coded into the engine.

Run at least two bounded operating cycles with intervening evidence and a persisted
follow-up. The second decision should change or explicitly confirm its course based on
the outcome; do not script a required pivot or fabricate analytics/revenue. Keep meaningful
participant and strategy choices with the team.

Read-only/sandbox acceptance is valid for Prompt 09 but is not evidence of live product
management or marketing. Do not change the app's release process, publish, contact users
or access private systems without separate explicit authorization. Prompt 11 owns the
live-business evidence gate.

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

See [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md),
[Single-Company Business Operations](SINGLE_COMPANY_OPERATIONS.md), and C09-1 through
C09-4 in [Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

---

# Broader agent capabilities

## Prompt 10 — Bounded Computer Use

**Status:** Complete and deployed; C10-1 and delivery evidence in [Prompt 10 validation](../validation/PROMPT_10_VALIDATION.md).

The implemented slice uses owner-created Computer Operators, immutable ordinary Task/session
grants, isolated headless Chromium, structured rendered snapshots and private real PNGs.
Only one bounded environment is reserved per HQ. Uploads/downloads are disabled; trusted
forwarding gates every request; exact disposable fixture approval never becomes business
authority. See [architecture](../architecture/COMPUTER_USE.md) and [tutorial](../operations/COMPUTER_USE_TUTORIAL.md).

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
worker. Direct typed APIs may be preferable for business integrations; Computer Use is
not a mandatory technical dependency for every adapter.

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

# Single-company business operation

## Prompt 11 — Single-company business operations and measured pilot

**Status:** Complete for the bounded supervised single-company milestone. C11-1/2/4 PASS; C11-3 PASS within supervised scope. See [qualified live closure](../validation/PROMPT_11_VALIDATION.md#bounded-supervised-live-closure--october-6-2026).

One exact approved README action, provider receipt/read-back and durable fresh-context Cycle 2 ended in STOP. The pilot branch is unmerged. One owner timing correction and one failed model turn with bounded backoff are retained; readability/business benefit is unmeasured and monetary costs unknown. No broad unattended operation or further external authority is implied.

The requirements below are the historical milestone contract. They do not create additional work after this bounded acceptance.

Make one company useful in the real world before multiplying companies. Implement a small
vertical slice connecting **evidence → decision → approved action → receipt → observed
outcome → scheduled review**. A connector catalog, persuasive plan or dry-run transcript
alone does not satisfy this milestone.

### Bounded implementation slices

1. **Business evidence and worker scope.** Ingest the smallest useful product/business
   evidence set with source, period, units, baseline, freshness, privacy scope and explicit
   missing values. Review current role/tool limitations and add only necessary bounded
   growth/support/operations capabilities; role names never grant authority by themselves.
2. **Useful protected action.** Select at least one approved operating path, such as a
   reviewed website publication/deployment, scoped customer-support action or approved
   communication to an explicit audience. Define typed intent, exact target/content,
   policy/approval, credentials boundary, idempotency/reconciliation, receipt and revocation.
3. **Repeated supervised operation.** Reuse 07 continuity and 09 scheduling to run a
   measured Asymmetri Motion pilot across at least two cycles without the human scripting
   every handoff. Separate completed work, successful delivery and actual business outcomes.

Potential adapters include analytics/product data, feedback/support, email or another
relevant communication channel, and product/website publishing. App Store data is optional
and must be checked for supported interfaces and authorization. Do not implement every
provider, CRM, accounting platform or cloud integration at once. A minimal direct API may
be enough; a GUI-only workflow still requires the bounded Computer Use capability.

No publication, outreach, app release, spending or account access is authorized by naming
this milestone. A consequential action is allowed only when a trusted implemented policy
and applicable human approval permit its exact scope. Ordinary workers never receive raw
credentials. Ambiguous provider outcomes must be reconciled or blocked, not blindly retried.

### Evidence gate before multi-company/federation

Acceptance must show:

- a mandate, resource/risk limits, baseline metrics/sources and success/stop criteria;
- team-selected initiatives, inspectable decisions and meaningful independent review;
- at least one explicitly authorized **real external operating action**, its receipt and
  an observed result; drafts/mocks alone do not meet the live gate;
- at least two operating cycles, including a scheduled follow-up and an evidence-based
  continue/iterate/pivot/stop decision;
- restart and runtime-context rollover without losing ownership or duplicating committed
  effects; uncertain outcomes are reconciled or visibly blocked;
- permission denial, expiry/revocation, human stop/cancel, cost/turn bounds and no idle
  model polling;
- reported usage/costs where available, explicit unknown values, limitations, failures and
  remaining human supervision; no guaranteed or fabricated commercial improvement.

A labelled dry run can pass its own bounded acceptance while live credentials or approvals
are unavailable, but the live-business gate remains pending. The human may authorize a
smaller pilot rather than broaden permissions merely to pass a test.

See [Single-Company Business Operations](SINGLE_COMPANY_OPERATIONS.md),
[Decision 017](../decisions/decision_017_single_company_first.md), and C11-1 through
C11-4 in [Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

---

# Deferred company scale and external transports

These directions retain their architecture/security constraints but no longer have fixed
prompt numbers. Reconsider them only through demonstrated owner need or a later
explicit priority change, after Personal Operator stabilization. Passing a gate does not itself establish a need to scale.

## Multi-company support

**Status:** Deferred / unnumbered; formerly future Prompt 11

Allow one BotSquad HQ to host multiple isolated companies when a demonstrated need exists.
Company must become a first-class security/data boundary. Company-scoped concepts include
workers, conversations/messages, discussions, tasks, executions, artifacts,
repositories/projects, approvals, external identities, policy and audit.

Acceptance must prove two companies cannot read/write one another, conversations and
discussions are company-scoped, active company is explicit for protected actions, and
restart/migration preserves isolation. Until then, one company per data directory remains
the implemented boundary, not a claim of multi-company isolation.

## Company-to-company collaboration

**Status:** Deferred / unnumbered; formerly future Prompt 12

After company isolation is real and collaboration is justified, use a trusted
CompanyConnection defining allowed message/task/discussion types, artifact policy,
approval policy, rate limits and lifecycle/revocation.

One company must not gain access to the other's internal worker conversations,
working-group transcripts or unrelated data. Acceptance includes bounded handoff,
explicitly permitted discussion, result/artifact return, provenance, revocation, loop
bounds, deduplication/replay protection and no cross-company authority escalation.

## External identities and Telegram integration

**Status:** Deferred / unnumbered; formerly future Prompt 13

A later generic ExternalIdentity model may use Telegram as a concrete adapter. Workers
use Telegram bot identities, never simulated human accounts. Raw provider credentials
stay behind trusted integration code; external communication remains untrusted content
and never becomes authority.

Acceptance includes attach/detach, hidden tokens, inbound/outbound mapping, rate limits,
loop prevention, audit/provider IDs, rotation/revocation and continued internal operation
when Telegram is unavailable. This platform is not a prerequisite for an earlier narrow
email/customer-support/other business adapter needed by one company.

## Cross-HQ federation

**Status:** Deferred / unnumbered; formerly future Prompt 14

Only after justified company collaboration, allow companies on separate BotSquad
installations to collaborate through authenticated provider-independent federation with
stable HQ/company identity, authenticated envelopes, replay protection, deduplication,
rate limits, revocation, artifact integrity and bounded task/message/discussion loops.

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
transport are useful convenience features, but they are lower priority than proving
conversation, continuity, team reasoning and useful single-company operation.

The iOS direction remains valid: native first-class client, Client API v1 rather than
browser internals, explicit paired/revocable device identity, private HQ by default, SSH
as admin/recovery, and possible future VPN/direct or outbound relay transport.

Revisit it when operator needs and stable interaction semantics justify its priority.

---

# Later operating capabilities

**Status:** Later / intentionally unnumbered

The minimal durable scheduler is part of Prompt 09. A useful first metrics/evidence,
external-action and recurring operating slice is part of Prompt 11. These do **not** wait
for federation. Broader capabilities are selected later from demonstrated business need:

- additional customer support, email, CRM/sales and analytics providers;
- richer accounting, billing, budgets and spending-request workflows;
- cloud provisioning, deployment fleets, secret-management integrations and specialized compute;
- protected treasury/payment/wallet adapters with separately reviewed limits, accounting,
  approval, receipts, reconciliation and revocation;
- portfolio-level company supervision after company isolation is justified;
- broader guided tutorials and release walkthroughs beyond Demo Operator 01.

Do not assign these fixed prompt numbers or build a large platform before dependencies
and scope are understood. No financial authority follows automatically from a company
mandate or this roadmap.

---

# Cross-cutting rules for every future prompt

Every future milestone must preserve these invariants unless a new accepted decision
explicitly changes them.

## Intelligent-company acceptance

Future milestones should improve BotSquad as a company of persistent intelligent
employees, not merely add another deterministic pipeline.

When a milestone changes organization behavior, its Codex prompt should ask whether:

- the human can give a broad or specific mandate without micromanaging every handoff;
- workers can decide who needs to participate, ask questions and challenge assumptions;
- conversation, deliberation, decision and Task/operation remain distinct;
- initiative remains bounded by role and authority;
- decisions and important outcomes are attributable and inspectable;
- evidence/metrics can cause strategy to change;
- model turns remain event-driven and bounded;
- acceptance leaves meaningful choices to the organization instead of scripting the
  transcript or conclusion;
- work and memory survive context replacement and scheduled/retried operation;
- real external/business outcomes are distinguished from simulations and completed tool calls.

Where relevant, include both an open-ended company scenario and the Asymmetri Motion
specific-product scenario. Read [Project Memory](../PROJECT_MEMORY.md) and apply the
acceptance IDs in [Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md).

## Human agency

The human owns company-level authority.

Bots may request protected actions but cannot create human approval through text. A broad
mandate such as "grow the business" or "maximize sustainable profit" does not grant new
financial, publication, account, contract or external-system authority. Those actions
still require explicit trusted capabilities/policies and applicable human approvals.

## Communication is not execution

Messages communicate. Tasks or other configured trusted triggers authorize bounded work.
Neither a conversation reply nor a scheduled review silently grants external authority.

## Idle workers do not poll models

Use control-plane events, queues and ordinary clock/condition checks. Do not consume
model usage merely to check an empty inbox. A due authorized review is explicit work and
must have a purpose, owner and bounds.

## Durable identities, replaceable runtime sessions

Worker, company, HQ, runtime account, BotSquad Conversation, provider RuntimeSession/Thread,
ExecutionAttempt, Unix user, device and external identity are distinct concepts. Summaries
are scoped derived artifacts; durable records and current permission checks remain
truth. Handoff/restart must not discard work, leak context or replay committed effects.

## Evidence over prose

Important completion claims require artifacts, commits, tests, logs, receipts, or other
inspectable evidence. Label simulated, sanitized historical and live evidence separately;
state unknown metrics instead of inventing them.

## Fail closed

Missing confinement, unsupported runtime settings, ambiguous authority, or invalid
credentials must not silently fall back to broader access. Unknown provider outcomes
must be reconciled or blocked before another consequential attempt.

## No credential exposure to normal workers

SSH keys, Codex auth, provider tokens, infrastructure credentials and other sensitive
secrets remain behind trusted boundaries. Neither a broad mandate nor a memory summary
may introduce them into ordinary worker context.

## Idempotency

Retries/reconnects, timer occurrences and session handoffs must not duplicate committed
consequential operations. Explicitly represent unknown outcomes; do not promise provider
exactly-once behavior that cannot be established.

## Explicit scope

A new capability does not imply authority over unrelated files, machines, companies,
accounts or external systems. This roadmap is a plan, not an implementation or deployment
receipt.

---

# Dependency and delivery map

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
07 Direct conversations + runtime-context continuity
        |
08 Working groups + deliberation
        |
09 Company operating loop + durable clock + Asymmetri Motion reference test
        |
10 Bounded Computer Use
        |
11 Single-company business operations + measured live pilot
        |
Current: Personal Operator / Daily Driver stabilization (unnumbered)
        |
Demonstrated owner need / explicit priority change
        |
Deferred, unnumbered: company isolation -> company collaboration -> cross-HQ federation

Optional later transports: Telegram/external identities; native iOS/no-tunnel client.
Needed narrow business adapters may precede those generic platforms.
~~~

The numbered sequence is delivery priority, not a requirement that every API adapter use
Computer Use or that every future integration depend on federation. Some work can proceed
in parallel once its actual trust/data dependencies are proven and scope is authorized.

## Related documents

- [Project Memory](../PROJECT_MEMORY.md)
- [Single-Company Business Operations](SINGLE_COMPANY_OPERATIONS.md)
- [Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md)
- [Current State](../operations/CURRENT_STATE.md)
- [Project Vision](PROJECT_VISION.md)
- [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [AI Organization Model](AI_ORGANIZATION_MODEL.md)
- [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md)
- [Native iOS Remote Client and Secure Remote Access](IOS_REMOTE_CLIENT.md)
- [Multi-Company and Federation Model](MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
- [Computer Use Model](COMPUTER_USE_MODEL.md)
- [Decision index](../decisions/README.md)
- [Demo Operator and Guided Tutorials](DEMO_OPERATOR.md)
