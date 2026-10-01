# Single-Company Business Operations

**Status:** Accepted future requirements; not implemented  
**Updated:** 2026-09-29  
**Authority:** [Decision 017](../decisions/decision_017_single_company_first.md)  
**Companion model:** [Intelligent Company Operating Model](INTELLIGENT_COMPANY_MODEL.md)

## Product priority

Prove one AI company can do useful, accountable work for a real business before building multiple companies or federation. An organization that can coordinate internally but cannot observe results or perform approved business actions has not yet met this goal.

Both owner inputs remain first-class:

> Explore a sensible way to grow the business within these resources and constraints.

> Manage and market Asymmetri Motion; improve product quality, adoption and sustainable revenue within the approved constraints.

The owner supplies the mandate, constraints, authority and desired outcomes. The organization selects useful research, workers, discussions, decisions, Projects, Tasks and experiments. It should ask for material missing facts or protected decisions, not require the owner to choreograph every handoff.

## Milestone responsibility

| Milestone | Required contribution | What it does not prove |
| --- | --- | --- |
| 07 | Direct conversations and durable continuity across replaceable runtime contexts | Company strategy or external business authority |
| 08 | Bounded cross-functional deliberation with useful disagreement and synthesis | Permission to execute the group's recommendations |
| 09 | Mandates, decisions, outcome review, minimal durable scheduling and two-cycle Asymmetri Motion reference acceptance | Live integrations, publication, customer contact or commercial success |
| 10 | Bounded Computer Use in isolated environments | Unrestricted browser/account access or a requirement that all integrations use a GUI |
| 11 | A minimal practical operating capability set and a measured live single-company pilot | Multiple companies, federation, arbitrary spending or a complete business-platform suite |

The canonical [Roadmap](ROADMAP.md) owns numbering and status. These are delivery stages; direct API adapters may reuse earlier trust/scheduling foundations without depending technically on GUI automation.

## Continuity contract — employee identity outlives model context

Keep Worker, BotSquad Conversation, Task, ExecutionAttempt and provider RuntimeSession/Thread distinct. One conversation may involve several workers; a worker may participate in several conversations and use several runtime-session generations. No one-to-one relationship is assumed.

The control plane should assemble bounded context from current authorized records: mandate and constraints, relevant role instructions, current work and owners, recent turns, accepted decisions, artifacts, observations, unresolved questions and pending approvals. Source references and provenance must remain retrievable under current permissions. Do not stuff the entire organization history into every prompt.

A context handoff must record its version, source/checkpoint range, old/new session lineage, reason, omitted information and active-work disposition. Model-generated summaries are fallible derived artifacts. They cannot grant permissions, override a decision, rewrite a receipt, or make missing evidence true. Corrections and superseded conclusions need provenance rather than silent replacement of history.

Rollover occurs at a safe boundary. If a turn or external operation is in flight, reconcile or safely block it before switching ownership. Lease/generation checks must reject late callbacks from the former session. Preserve healthy legacy bindings until a deliberate compatible rollover is needed. Rehydration must not leak a private conversation into another participant's context.

Acceptance should force a low context budget to test rollover, resume the same employee/conversation, recover across a crash, retain outstanding work, reject stale callbacks and denied context, and prove committed results are not replayed. Verify provider/runtime behavior at implementation time; do not invent fixed context limits or claim exactly-once provider invocation when the provider outcome is unknown.

## Minimal durable scheduling — Prompt 09, not a distant add-on

Persist enough state to answer: who requested the review, which mandate/initiative it belongs to, why it should run, when it is due, how often it may recur, what evidence it needs, what limits apply, and whether it was cancelled, completed or blocked.

The initial design should cover:

- One-time follow-ups and recurring reviews, explicit due-time/timezone and daylight-saving semantics, recurrence/end conditions and a stable occurrence key.
- Transactional claiming, durable dispatch/retry state, single active ownership, bounded overlap and missed-run catch-up policies.
- Human pause/cancel, schedule edit/versioning, current authorization checks, expiry, cost/turn budgets, backoff and visible escalation.
- Source-event deduplication and restart reconciliation. An old timer must not revive a cancelled mandate or a revoked action.

Clock/condition checks run in trusted ordinary code. Models run only for a due authorized work item, explicit conversation request, Task, material event or bounded review. A scheduled review is legitimate work; repeatedly asking a model whether it has messages is not.

Tests should advance a controlled clock for deterministic cases and separately exercise at least one real short scheduled occurrence. Cover restart before/after claim, duplicate occurrences, missed runs, overlapping reviews, revocation, cancellation and a no-work interval with zero model invocations. A test clock demonstrates schedule logic, not elapsed real-world business performance.

## Asymmetri Motion reference case — Prompt 09

### Inputs

Use an explicit product brief and owner-approved scoped evidence. Record dates, provenance, access limits and missing values. Possible inputs are a permitted repository snapshot, existing roadmap/release notes, public product material, anonymized feedback and owner-provided product metrics. Availability must be checked, not assumed.

Asymmetri Motion configuration belongs in a Project/mandate fixture or an approved product workspace. Do not put its repository name, business rules, app identifiers or publishing account into BotSquad's generic engine.

### Expected behavior

The team inspects the situation, proposes and compares useful initiatives, chooses participants, records a decision, performs permitted work and obtains independent review where it matters. It records the evidence/outcome and a reasoned next step, then persists a follow-up.

Supply an intervening outcome and run a second bounded operating cycle. The evidence might support continuing, changing scope, rejecting a hypothesis or waiting for more information. Acceptance must not force a pivot simply to make the demo dramatic. Conversely, an unchanged recommendation must explain why the new evidence does not change it.

The same harness should also accept a deliberately broad mandate with meaningful internal choices left to the team. Validate bounds, authority, provenance and outputs rather than an exact roster or transcript.

### Honest evidence modes

Record one of: real approved read-only evidence, sanitized historical snapshot, or simulated fixture. Mark synthetic numbers clearly and do not mix them with production results. Missing analytics is a visible blocker or research question, not permission to fabricate revenue or usage.

Prompt 09 may succeed in a read-only/sandbox mode. It must not claim that BotSquad has actually marketed, deployed or operated the product. Any release/publication/customer action remains separately authorized; this documentation grants none.

## Practical operating capabilities — Prompt 11

Implement a small vertical slice that connects **evidence → decision → approved action → receipt → observation → scheduled review**. A catalog of connectors without that loop is not sufficient.

### Slice A — Business evidence and worker scope

Choose relevant sources for product quality, adoption, customer feedback or business outcomes. Support immutable observations with source, observed period/time, units, data freshness, missingness and privacy scope. Define the metric and baseline before interpreting movement. Treat causation as uncertain unless the experiment design supports it.

Review current fixed worker roles and tool-schema compatibility. Add only the role/capability extensions needed for actual growth/support/operations work; preserve existing workers and authority ceilings. A job title is not a permission grant. No new employee is assumed already implemented.

### Slice B — One useful protected external action path

Choose the smallest useful approved action: for example, publish a reviewed website change to a designated target, send an approved communication to an explicitly permitted audience, or resolve an approved support workflow. A model-generated draft alone does not count as an external action.

Use a typed API adapter where appropriate. Use Computer Use only through the validated isolated capability when an interface genuinely requires it. A new adapter must specify provider identity, account/target scope, permitted verbs, data minimization, network/file boundaries, credential storage, rate limits, timeout and approval policy.

The trusted executor binds exact intent, content/version, recipient or target and policy. Record provider IDs, timestamps and receipts; reconcile uncertain responses before retry. Denials, expired approvals, changed targets and revocation must fail closed. Sending an email cannot be undone by stopping a worker; document compensation limits instead of promising rollback for irreversible actions.

### Slice C — Repeated supervised operation

Reuse Prompt 09 scheduling and Prompt 07 continuity. Let the company execute and review a real bounded initiative across at least two cycles, including a persisted follow-up that does not require the owner to re-prompt each task. Human approval at a policy gate is compatible with autonomy; human scripting of every internal handoff is not the target.

Observe outcomes from real sources after the approved action. Separate task success, publication/delivery success, observed business metrics and uncertain attribution. Include costs/usage where available, unmeasured values, failures, human interventions and pending work.

### Deliberately not required for the first pilot

Do not build every CRM, email provider, ad platform, accounting system, cloud fleet, social network or App Store integration. App Store/product-data access is an optional scoped adapter, not a promise of supported APIs or available credentials. Do not add financial/payment/wallet authority; any such future capability requires its own reviewed policy and trusted executor. Multi-company and federation are not pilot dependencies.

## Operational maturity and exit gate

Maintain separate labels for planning, sandbox validation, approved pilot and ongoing supervised operation. Never promote one label solely because a demonstration produced persuasive prose.

The Prompt 11 evidence packet must contain the original mandate, policy envelope, baseline/source definitions, decisions and alternatives, reviewed outputs, at least one approved real external-action receipt, observed result, two-cycle history, scheduled follow-up, usage/cost information or explicit unknowns, and a next-step decision.

It must also show restart/context-continuity recovery, deduplication or safe blocking of uncertain outcomes, permission-denial/revocation cases, human stop/cancel behavior and no idle model polling. Report what still requires supervision. No acceptance condition should require fabricated profitability or statistically unsupported claims.

Only after this packet supports a useful bounded operating company should multi-company/federation be reconsidered. Scaling remains a product choice justified by need, not an automatic reward for completing a demo.

## Future prompt checklist and continuity

Use [Milestone Prompt Requirements](../../prompts/MILESTONE_REQUIREMENTS.md) to carry these requirements into executable Codex tasks. Start new planning sessions with [Project Memory](../PROJECT_MEMORY.md), then verify current repository status rather than trusting a stale chat recap. Preserve earlier milestone evidence; accepted future requirements must never be presented as completed implementation.

## Deliberation boundary for later operating cycles

Prompt 08's accepted working groups can compare options using explicitly shared material
and granted public research, then save a traceable recommendation. The owner separately
selects and submits that artifact as a normal Task. This capability alone does not create
an operating mandate, recurring schedule, outreach permission or measured business result.
Prompt 09 must reuse these ownership, evidence, budget and uncertainty boundaries while
adding its separately accepted durable loop. See [working-group semantics](../architecture/WORKING_GROUPS.md).
