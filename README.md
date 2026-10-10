# BotSquad

BotSquad is a self-hosted workspace for coordinating persistent AI workers through
explicit tasks, durable messages, bounded authority, inspectable artifacts, and real
Codex execution.

The primary deployment is now an **always-on Ubuntu headquarters** under the operator's
control. Your Mac/PC is the bootstrap, administration, development, and browser client.

**Current product priority:** make one BotSquad a dependable, clear and pleasant personal
daily tool for its owner. Reliability, smooth workflows and simple maintenance come before
feature expansion. The [Personal Operator / Daily Driver phase](docs/product/ROADMAP.md#personal-operator--daily-driver-phase)
is intentionally unnumbered; no Prompt 12 is implied.

**Continuing from another chat or Codex task?** Read
[Project Memory](docs/PROJECT_MEMORY.md), the [canonical roadmap](docs/product/ROADMAP.md)
and [Decision 017](docs/decisions/decision_017_single_company_first.md), then verify current
repository status. [Decision 026](docs/decisions/decision_026_personal_operator_stabilization.md)
owns current sequencing. Find canonical specs in the [prompt directory guide](prompts/README.md).
Future milestone prompts also use
[Milestone Prompt Requirements](prompts/authoring/MILESTONE_REQUIREMENTS.md).

## Current state

**Prompt 10 — Bounded Computer Use — is Complete and deployed.** [Its validation record](docs/validation/PROMPT_10_VALIDATION.md) records C10-1, independent review, exact deployment and retained-state verification. Production has zero ComputerSessions, computer grants and Computer Operators. **Prompt 11 is complete for the bounded supervised single-company milestone.** One exact approved real GitHub document action, receipt/read-back and durable Cycle 2 ended in STOP. The pilot branch stayed unmerged; one timing correction and one failed model turn/backoff are retained. No business improvement or broad unattended operation was proven, and no further external authority follows. The new typed GitHub document evidence/action slice, exact approvals and outcome review are described in [business operations](docs/architecture/BUSINESS_OPERATIONS.md), the [operator tutorial](docs/operations/BUSINESS_OPERATIONS_TUTORIAL.md) and [validation](docs/validation/PROMPT_11_VALIDATION.md). Deployment alone creates no authority.

The [operating-loop architecture](docs/architecture/COMPANY_OPERATING_LOOP.md),
[learn-by-doing tutorial](docs/operations/COMPANY_OPERATING_LOOP_TUTORIAL.md) and
[completed execution plan](docs/exec-plans/prompt-09.md) describe owner-activated mandates,
company-selected internal work, labelled evidence, durable decisions and scheduled reviews.
Mandates add no publication, outreach, spending or Computer Use authority. Browser work has a separate explicit owner policy.

**Worker Empowerment 01 is accepted and deployed:** the scoped public-research and
standing-knowledge slice passed real Ubuntu acceptance; evidence is in the
[WE-01 report](docs/validation/worker-empowerment-01.md). A deployment does not activate
production grants. Start with the [public research tutorial](docs/operations/PUBLIC_RESEARCH_TUTORIAL.md).

BotSquad currently supports:

- a non-root, boot-enabled Ubuntu `botsquad.service`;
- durable SQLite company/task/message/execution state;
- deterministic owner Attention with current approvals, uncertainty and recoverable work linked to existing controls;
- persistent logical workers with resumable Codex threads;
- direct human/worker and bounded peer conversations, separate from Tasks;
- explicit reply requests, passive messages, pause/cancel/interrupt and retained transcripts;
- scoped context replacement with source-backed handoffs and durable session lineage;
- Atlas → Scout → Atlas research, with optional owner-granted public lookup and scoped company knowledge;
- Atlas → Maya/Turing → Linus + Ada → Grace engineering coordination;
- two concurrent real Codex executions;
- owner-created Computer Operators and immutable bounded browser Task/session grants;
- isolated headless Chromium, trusted request forwarding, exact fixture approvals and private PNG evidence;
- interruption, revocation and conservative unknown-effect recovery;
- first-class software Projects with multiple bounded repositories and configurable branches;
- local creation, Git-bundle import and trusted public GitHub registration/fetch;
- explicit non-overlapping write scopes and named focused/full validation recipes;
- immutable submissions, independent review rounds and bounded revision/resubmission;
- durable tested integration queues and exact human-approved remote publication;
- archive/release that revokes clone access while preserving engineering history;
- per-worker model selection;
- per-worker reasoning effort;
- per-worker scheduling priority;
- human-locked AI profiles;
- immutable execution provenance for effective model/reasoning/priority/runtime;
- runtime-discovered Codex model/reasoning choices;
- friendly Codex thread names;
- hardened Ubuntu engineering confinement;
- restart, reboot, and repeat-bootstrap recovery;
- Nix infrastructure tasks and exact-scope trusted human approvals;
- a narrow root provisioner with durable operation receipts;
- private worker Unix identities and independent Linux engineering clones;
- worker-UID source writes/commits and evidence-preserving retirement;
- a stable, versioned `/api/v1/` client contract with explicit sanitized DTOs;
- paired remote-device identity with Ed25519 proof of possession, fixed capability ceilings, and revocation;
- durable idempotent client mutations and reconnectable HQ-bound SSE event cursors.

The generalized lifecycle and acceptance status are recorded in
[Decision 014](docs/decisions/decision_014_generalized_projects.md) and
[Prompt 05 validation](docs/validation/prompt-05-general-projects.md). The
[independent audit](docs/validation/prompt-05-independent-audit.md) records the complete
requirement matrix, validation-verdict correction and fresh 108/108 Ubuntu acceptance.

The historical Prompt 04 runtime acceptance revision is
`9af2db810b71ec9ca1097767a61ae0aa2edb43d8`. Later documentation commits preserve its
accepted source digest. See the [Linux identity validation record](docs/validation/prompt-04-linux-identity.md).

The bounded [Demo Operator](docs/product/DEMO_OPERATOR.md) exercises the real web UI
and records the [StudyPlan tutorial](docs/tutorials/demo-01-studyplan/README.md). It is an
interlude between Prompt 05 and Prompt 06; worker desktop/browser authority is unchanged.

Completed milestones provide conversation/context continuity, team deliberation, a strategic
loop with durable scheduling and one bounded supervised business path. Personal Operator
stabilizations 01–04 are complete and deployed: scheduler reliability, startup/navigation,
owner Attention and worker portraits. See the [stabilization index](prompts/stabilizations/README.md). The
SSH-tunnel browser remains the preferred operator path; native iOS and multi-company/federation
remain deferred under Decision 026.

Use the worker inspector or **Conversations** tab to open a direct conversation.
**Request reply** queues bounded model work; **Passive message** only records context.
The owner can inspect peer exchanges, stop queued work and interrupt active replies.
See [Prompt 07 acceptance](docs/validation/prompt-07-conversations-continuity.md) and
[conversation controls and continuity](docs/architecture/CONVERSATIONS_AND_CONTINUITY.md).

Prompt 08 adds **Working Groups**: create a charter, select participants
or explicitly let Atlas organize, share selected material, then start. Owner interjections
remain visible alongside attributable worker responses and immutable synthesis versions.
Research requires a separate discussion-mode opt-in for each eligible researcher. A saved
recommendation becomes work only through **Prepare assignment** and an explicit owner
submission. Follow the [working-group tutorial](docs/tutorials/working-groups.md); release
and deployment gates are tracked in the [acceptance report](docs/validation/PROMPT_08_VALIDATION.md).

For the detailed snapshot, measured resource evidence, and deferred features, see
[Current State](docs/operations/CURRENT_STATE.md).

For the numbered implementation sequence, see the
[BotSquad Roadmap](docs/product/ROADMAP.md).

For the architecture and design rationale in one place, see the
[BotSquad Technical White Paper](docs/WHITEPAPER.md). Current roadmap/decision records
supersede historical future-numbering summaries.

## Product north star

BotSquad is being built to behave like a **company of intelligent persistent employees**,
not an assembly line of agents.

The human should eventually be able to give either a broad mandate:

~~~text
"Increase sustainable profit within these constraints and resources."
~~~

or a specific operating mandate:

~~~text
"Manage and market Asymmetri Motion; improve the product, adoption and revenue."
~~~

and let the organization decide what to research, who should discuss the problem, what
Projects/experiments to run, how to review the result, and whether to continue, iterate,
pivot, stop or scale.

The implemented sequence and current priority are:

~~~text
07 direct conversations + runtime-context continuity
08 working groups / deliberation
09 strategic company loop + durable scheduling + Asymmetri Motion reference test
10 bounded Computer Use
11 practical single-company business operations + measured live pilot
--- current: unnumbered Personal Operator / Daily Driver stabilization ---
later: multi-company / company collaboration / federation
~~~

Worker and BotSquad Conversation identities must outlive replaceable provider sessions.
Due reviews/follow-ups belong to trusted durable scheduling, not idle model polling.
Asymmetri Motion is a reference configuration, never a hard-coded engine assumption.

Prompt 09’s acceptance used clearly labelled fixture evidence. Prompt 11 subsequently
closed one real approved action → receipt → observation → scheduled review loop within
bounded supervised scope. That result proves no profitability or broad unattended
operation. Strategic reasoning remains separate from trusted capabilities and approvals.

See [Intelligent Company Operating Model](docs/product/INTELLIGENT_COMPANY_MODEL.md),
[Single-Company Business Operations](docs/product/SINGLE_COMPANY_OPERATIONS.md),
[Decision 016](docs/decisions/decision_016_intelligent_company_model.md) and
[Decision 017](docs/decisions/decision_017_single_company_first.md).

## Architecture at a glance

```text
Human workstation
      |
      | SSH / SSH tunnel
      v
operator-controlled Ubuntu HQ
      |
      +-- botsquad.service           non-root systemd service
      +-- SQLite/company state
      +-- dispatcher
      +-- Codex App Server
      +-- managed Git/engineering
      +-- Linux confinement
      +-- root Unix-socket provisioner
      +-- private worker homes/UIDs
      +-- 127.0.0.1:4310 web UI
      +-- /api/v1 authenticated Client API on the same private listener
```

BotSquad is **self-hosted**, not a hosted multi-tenant SaaS. Assigned model/task context
may be sent to the configured external model runtime, but BotSquad coordination state
remains on the operator-controlled host.

## Open an existing BotSquad HQ

If your SSH alias is `botsquad`:

```sh
ssh -N -L 4310:127.0.0.1:4310 botsquad
```

Leave that terminal open, then browse to:

```text
http://127.0.0.1:4310
```

The browser URL looks local, but the application is running on the Ubuntu server.

The UI is intentionally **not exposed directly to the public Internet**.

Before starting Linux engineering, open **Infrastructure → Initialize Nix**, then
review and approve its bootstrap identity in **Approvals**. Nix coordinates subsequent
worker/clone requests; approve each exact operation there. Existing workers remain
unprovisioned after migration until explicitly requested. Research remains available
without worker-local filesystem actions. See [Decision 013](docs/decisions/decision_013_trusted_worker_infrastructure.md).

Useful checks:

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'curl -fsS http://127.0.0.1:4310/api/health'
ssh botsquad 'journalctl -u botsquad --since "15 minutes ago" --no-pager'
```

For restart, runtime login, updates, backups, troubleshooting, and deeper validation,
see [Access and Operations](docs/operations/ACCESS_AND_OPERATIONS.md).

## Set up a brand-new BotSquad server

BotSquad is provider-neutral. The Ubuntu machine may be:

- a DigitalOcean Droplet;
- AWS EC2;
- Hetzner;
- Azure;
- Google Cloud;
- another VPS;
- your own VM;
- a physical Ubuntu computer.

### 1. Create the Ubuntu host

The currently certified Linux contract is:

```text
Ubuntu 24.04 LTS
x86_64
SSH access
Internet access for packages/GitHub/Codex
root or usable sudo for bootstrap
```

The smallest configuration actually validated for the bounded Prompt 03 workload is:

```text
1 vCPU
2 GB RAM
~50 GB disk
2 GiB swap
```

A 2-vCPU / 4-GB host is a more comfortable starting point for heavier work.

See [Set Up a Minimal Ubuntu Host](docs/bootstrap/SETUP_UBUNTU_HOST.md) for a
DigitalOcean example and provider-neutral SSH setup.

### 2. Create an SSH alias

Your workstation should be able to run:

```sh
ssh my-botsquad
```

without giving BotSquad or Codex your private-key contents.

Example `~/.ssh/config`:

```text
Host my-botsquad
    HostName 203.0.113.10
    User root
    IdentityFile ~/.ssh/id_ed25519
```

Root is acceptable for the initial fresh-server bootstrap. BotSquad itself is installed
to run continuously as the separate non-root `botsquad` service account.

### 3. Clone BotSquad on your workstation

```sh
git clone https://github.com/eugenelin89/bot_messenger.git
cd bot_messenger
git fetch origin
```

You do **not** need to manually install Node, Codex, BotSquad, systemd units, swap, or
Linux sandboxing on the server.

### 4. Run the checked-in bootstrap prompt

Open:

```text
prompts/operations/bootstrap-ubuntu.md
```

Set:

```text
SSH_TARGET=my-botsquad
```

Run that prompt from Codex against your local BotSquad checkout.

Codex will inspect the host first, then use the checked-in reproducible installer to
configure the Ubuntu headquarters.

Experienced operators can inspect and invoke the installer directly:

```sh
./scripts/bootstrap-ubuntu.sh my-botsquad "$(git rev-parse origin/main)" --preflight-only
./scripts/bootstrap-ubuntu.sh my-botsquad "$(git rev-parse origin/main)"
```

### 5. Sign the Ubuntu service account into Codex

The bootstrap will tell you when this interactive step is required.

Generic form:

```sh
ssh -t my-botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser authorization privately.

If ChatGPT blocks device-code login, enable the available device-code authentication
setting in ChatGPT Security settings (or ask the relevant workspace administrator to
enable it). **Never share a device code.**

### 6. Open BotSquad

```sh
ssh -N -L 4310:127.0.0.1:4310 my-botsquad
```

Then open:

```text
http://127.0.0.1:4310
```

The full bootstrap, service layout, update policy, login procedure, and validation
commands are documented in [Ubuntu HQ Bootstrap](docs/bootstrap/UBUNTU_BOOTSTRAP.md).

## Validated Ubuntu deployment

The accepted Prompt 03 host used:

- Ubuntu 24.04.4 x86_64;
- kernel 6.8.0-142 after reboot;
- Node.js 24.21.0;
- Codex CLI/App Server 0.157.0;
- 1 vCPU;
- 2 GB RAM;
- approximately 50 GB disk;
- 2 GiB persistent swap.

Real acceptance proved:

- 60/60 hardened deterministic tests;
- real Ubuntu research/restart/resume/interruption;
- real six-worker engineering;
- 146-second engineering completion;
- about 24.96 seconds of overlapping Linus/Ada model turns;
- exact-commit Grace review;
- 8/8 integrated product tests;
- no completed-work replay;
- service restart;
- host reboot;
- repeat bootstrap;
- private tunnel UI;
- no swap use during real workflows.

See [Prompt 03 Ubuntu validation](docs/validation/prompt-03-ubuntu.md).

## Start a software Project

In **Projects & repositories**, create a Project and configure its instructions and
trusted policy. Add named focused and full Node recipes with literal test paths. Create
a minimal repository, import a Git bundle, or register a public GitHub HTTPS repository;
choose its actual default branch. Repositories live under managed storage, never an
arbitrary worker-selected host path.

Assign a Project objective with acceptance criteria. Maya specifies it; Turing assigns
non-overlapping scopes; Linus/Ada use approved clones and recipes; Grace reviews exact
submissions and can request bounded revisions. Integration is queued and advances the
canonical branch only after full tests pass. Approve each Linux identity/clone grant
through Nix and the trusted Approvals UI.

Remote policy starts at `none`. Configure `fetch_only` for explicit synchronization or
`approved_push` to request a separate publication approval binding branch, expected old
SHA and integrated new SHA. Workers receive no credentials or remote Git tool. Archive
after work/publication is resolved to revoke clone access and retain history. See
[Access and Operations](docs/operations/ACCESS_AND_OPERATIONS.md).

## Worker AI settings

Open a worker inspector in the UI to configure:

- **Model** — inherit or choose a model advertised by the active Codex runtime;
- **Reasoning** — inherit or choose a supported effort for that model;
- **Priority** — critical, high, normal, or low;
- **Human lock** — prevents bot/manager profile mutation.

Profile changes apply to future executions.

Execution history records the actual effective model, reasoning, priority, and runtime
used for that execution.

Priority controls scheduling among otherwise eligible tasks. It does not bypass pause,
authority, capability, or concurrency limits.

## Current limits

BotSquad is not yet a general autonomous company platform.

Current important limits include:

- one company per data directory;
- eight workers maximum;
- three direct children per manager;
- two hierarchy edges;
- two active executions globally;
- bounded dependency-free Node test recipes; no general language/package environment;
- repositories capped at 16 MiB object contents, 4 MiB bundle, 1,000 files and 128 KiB/file;
- no submodules, symlinks, LFS, custom Git attributes or arbitrary host-path registration;
- public GitHub fetch only; optional authenticated push remains unvalidated live;
- no arbitrary deployment or broad permission-granting approval workflow;
- retained older Codex engineering bindings cannot silently adopt new tool schemas;
- no general worker desktop access: Computer Use is a separate owner-granted isolated browser capability;
- no public Internet UI/login;
- no multi-company runtime implementation yet;
- no cross-HQ federation;
- no Telegram/external-identity implementation;
- no autonomous financial authority;
- the live pilot proves one bounded supervised loop; readability/business improvement and monetary costs remain unknown.

Nix, exact human grants and private Unix identities are implemented. Project policy,
remote publication and archive remain trusted human operations. SquadStatus remains a
regression fixture using the generalized engineering engine.

A possible later native client could add a secure iPhone/iPad dashboard that connects
to BotSquad without requiring a manual SSH tunnel for normal mobile use. The HQ remains
private by default; the mobile architecture uses a stable authenticated client API and
a separate secure transport layer rather than exposing port 4310 publicly. See
[Native iOS Remote Client and Secure Remote Access](docs/product/IOS_REMOTE_CLIENT.md).

## Authenticated native-client API

`/api/v1/` is a separate stable contract on the existing private listener. The local
**Devices / Remote Clients** screen creates a ten-minute pairing; compare the client's
Ed25519 fingerprint and explicitly confirm its capability ceiling. Devices prove key
possession for ten-minute access tokens. Mutations have durable seven-day retry receipts;
SSE reconnects by persistent HQ-bound cursor. Messages never implicitly create tasks.

Read the [v1 contract](docs/api/CLIENT_API_V1.md),
[reference-client guide](scripts/client-v1/README.md), and
[acceptance record](docs/validation/prompt-06-remote-client-api.md).
Browser administration stays on its original local API. A future device-only transport
must forward only `/api/v1/`, never the complete administrative listener. No iOS app,
relay, public listener, remote protected approvals or artifact-content API is included.

## Local development

Ubuntu HQ is the primary deployment, but local development/regression remains supported.

Requirements:

- Node.js 24.x;
- Git;
- Codex login;
- macOS Seatbelt or the bootstrapped Ubuntu confinement adapter for engineering tests.

```sh
npm ci
npm run codex:preflight
npm run dev
```

Open:

```text
http://127.0.0.1:4310
```

Local development state defaults to `.data/`; production-style Ubuntu state uses
`/var/lib/botsquad`.

## Validate

```sh
npm run check
npm test
npm run validate:prompt01
npm run validate:real
npm run validate:projects
```

The real validation commands consume Codex usage.

Ubuntu HQ also includes the production-restriction validation launcher:

```sh
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh deterministic'
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh prompt01'
ssh my-botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh engineering'
```

Run real-model scenarios only when you intentionally want to consume Codex usage.

## Documentation

### Start here

- [Project Memory and Continuation Handoff](docs/PROJECT_MEMORY.md)
- [Prompt Directory and Documentation Map](prompts/README.md)
- [Core Milestone Specifications 01–11](prompts/milestones/README.md)
- [Personal Operator Stabilizations 01–04](prompts/stabilizations/README.md)
- [Milestone Prompt Requirements](prompts/authoring/MILESTONE_REQUIREMENTS.md)
- [BotSquad Engineer Primer — From Demo Operator to Prompt 05](docs/guides/BOTSQUAD_ENGINEER_PRIMER.md)
- [Current State](docs/operations/CURRENT_STATE.md)
- [Access and Operations](docs/operations/ACCESS_AND_OPERATIONS.md)
- [Running Multiple BotSquad Instances](docs/operations/MULTIPLE_INSTANCES.md)
- [Set Up a Minimal Ubuntu Host](docs/bootstrap/SETUP_UBUNTU_HOST.md)
- [Ubuntu HQ Bootstrap](docs/bootstrap/UBUNTU_BOOTSTRAP.md)
- [Prompt 03 Ubuntu Validation](docs/validation/prompt-03-ubuntu.md)

### Architecture and product

- [BotSquad Roadmap](docs/product/ROADMAP.md)
- [Technical White Paper](docs/WHITEPAPER.md)
- [技術白皮書｜台灣繁體中文版](docs/WHITEPAPER_ZH_TW.md)
- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Computer Use Model](docs/product/COMPUTER_USE_MODEL.md)
- [Bounded browser architecture](docs/architecture/COMPUTER_USE.md)
- [Computer Use operator tutorial](docs/operations/COMPUTER_USE_TUTORIAL.md)
- [Prompt 10 validation](docs/validation/PROMPT_10_VALIDATION.md)
- [Project Vision](docs/product/PROJECT_VISION.md)
- [Intelligent Company Operating Model](docs/product/INTELLIGENT_COMPANY_MODEL.md)
- [Single-Company Business Operations](docs/product/SINGLE_COMPANY_OPERATIONS.md)
- [AI Organization Model](docs/product/AI_ORGANIZATION_MODEL.md)
- [Ubuntu HQ and Bootstrap Model](docs/product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Decision 011 — Ubuntu service, confinement and worker AI profiles](docs/decisions/decision_011_ubuntu_hq_profiles.md)
- [Decision 013 — Trusted worker infrastructure](docs/decisions/decision_013_trusted_worker_infrastructure.md)
- [Decision 015 — Remote client trust](docs/decisions/decision_015_remote_client_trust.md)
- [Decision 016 — Intelligent company model](docs/decisions/decision_016_intelligent_company_model.md)
- [Decision 017 — One operational company first](docs/decisions/decision_017_single_company_first.md)
- [Client API v1](docs/api/CLIENT_API_V1.md)
- [Decision Index](docs/decisions/README.md)

### Future architecture

Multi-company/federation and optional transport models below retain their design
constraints, but their former prompt numbers are superseded by Decision 017. Needed narrow
business integrations do not depend on first implementing these larger platforms.

- [Multi-Company and Federation Model](docs/product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](docs/product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
- [Native iOS Remote Client and Secure Remote Access](docs/product/IOS_REMOTE_CLIENT.md)

### Recorded tutorial

- [StudyPlan Demo 01](docs/tutorials/demo-01-studyplan/README.md)
- [Demo Operator and Guided Tutorials](docs/product/DEMO_OPERATOR.md)

### Examples and history

- [SquadStatus Case Study](docs/examples/squadstatus-case-study.md)
- [Prompt 01 Plan](docs/exec-plans/prompt-01.md)
- [Prompt 02 Plan](docs/exec-plans/prompt-02.md)
- [Prompt 03 Plan](docs/exec-plans/prompt-03.md)
- [Prompt 04 Plan](docs/exec-plans/prompt-04.md)

## License

BotSquad is open source under the [MIT License](LICENSE).
Copyright (c) 2026 Eugene Lin. Third-party dependencies retain their own licenses.

## Investment showcase contract foundation

**Two repositories, one pinned protocol.** This BotSquad repository owns private employees/HQ, the [canonical investment contract](contracts/investment/v1/PROTOCOL.md), and the synthetic-only paper simulator (INV-05), typed fixture market-evidence/calendar boundary (INV-06), trusted publisher (INV-07), team/scheduling and HQ Ask. The separate [Asymmetri.co website/receiver repository](https://github.com/eugenelin89/asymmetri) owns the signed public archive, exact artifacts, user-facing Showcase and later private visitor-Q&A service. See the [Asymmetri integration map](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md), [website receiver runbook](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md), and [authoritative BotSquad investment roadmap](docs/experiments/investment/ROADMAP.md). They are not one shared codebase, and cross-repository deployment is never automatic.


[INV-01 evidence](docs/validation/investment/INV-01.md) records contract1.0, offline tests and read-only feasibility for the paper investment showcase and private Ask BotSquad. Run `npm run contracts:test` to check the canonical package. [INV-02](docs/validation/investment/INV-02.md) implements the receiver; [INFRA-02](docs/validation/investment/INFRA-02.md) records its private Ubuntu 22.10 installation and synthetic acceptance. [INV-03](docs/validation/investment/INV-03.md) adds exact artifact/discussion views, downloads, owner controls and stronger TLS/capacity/recovery acceptance. [INV-04](docs/validation/investment/INV-04.md) completes the full showcase UI, charts, discussion/decision/evidence journey and disabled Ask preview in local synthetic/browser testing; its [website implementation](https://github.com/eugenelin89/asymmetri/blob/main/docs/INV-04-VALIDATION.md) remains source-only, not publicly deployed. The privately installed schema002 receiver is stopped/static, configuration disabled, and operational authority/data empty. [INV-05](docs/validation/investment/INV-05.md) implements the deterministic synthetic-only HQ simulator: exact accounting, reservations/risk, actions, benchmark, valuation revisions, crash replay and an atomic disabled outbox. Schema15 is additive; no deployment or authority is activated. [INV-06](docs/validation/investment/INV-06.md) adds schema16 evidence/rights, a finite scheduled calendar, bounded fixture collection and market-aware simulator admission. One real OpenFIGI identity probe passed; no live price source or public financial-data right is qualified. [INV-07](docs/validation/investment/INV-07.md) adds the owner-scoped synthetic publisher, exact previews, immutable delivery and current-watermark restore fencing. It remains partial source acceptance, with explicit v1 benchmark-action/historical-prefix gaps. [INV-08](docs/validation/investment/INV-08.md) adds passive schema18 team scopes, typed independent paper review, BUY publication admission and committed discussion/artifact projections. Actual employee execution remains held without an enforceable token/cost adapter. The owner authorized source development through INV-09; live gates remain blocked. Public ingress, independent backup custody, data rights, real HQ publishing and anonymous-model activation remain later gates; installation creates no operational authority.
