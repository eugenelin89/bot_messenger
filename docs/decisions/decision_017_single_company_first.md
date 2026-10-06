# Decision 017 — Prove one operational AI company before expanding to many

**Date:** 2026-09-29  
**Status:** Accepted product priority and future milestone requirements; not implemented  
**Extends:** [Decision 016](decision_016_intelligent_company_model.md)  
**Supersedes:** The previous future-roadmap ordering that placed multi-company, company collaboration, Telegram and federation ahead of practical single-company operations. Decision 010's isolation/federation boundaries remain accepted future constraints.

## Context and human decision

The human owner affirmed:

> one ai company that can actually run real business is more important than multi companies.

The accepted north star remains a team of persistent intelligent employees. The owner may provide a vague strategic objective or a specific mandate such as managing and marketing Asymmetri Motion. The team should decide what to investigate, who should participate, what to do next, and how to adapt from evidence, rather than require a human-scripted handoff chain.

The roadmap review identified four gaps: runtime context rollover was not a concrete acceptance requirement; periodic company review lacked an early durable scheduler; the specific-product test was generic despite an available Asymmetri Motion reference case; and most useful business integrations were deferred behind multi-company/federation.

## Decision

### 1. One useful company takes priority

Preserve Prompts 01–06 as completed history and 07 → 08 → 09 → 10 as the next architectural sequence. Add **Prompt 11 — Single-company business operations and a measured Asymmetri Motion pilot** before multi-company or federation.

Prompt 11 may be implemented in bounded internal slices. Do not turn it into a requirement to build every email, CRM, analytics, accounting, cloud or social integration at once. Select the smallest capability set that closes a real operating loop; expand only from demonstrated needs.

Multi-company isolation, company-to-company collaboration, Telegram as an optional external identity/transport, and cross-HQ federation remain valid later directions. They are **deferred and unnumbered**, not prerequisites to one useful company. Reconsider their priority after the single-company evidence gate, or after another explicit owner decision. Native iOS/no-tunnel convenience access remains deferred; use the existing private browser where sufficient.

A required business integration may be brought forward on its own merits. For example, a narrowly scoped email identity does not require a generic cross-company identity platform, and a direct metrics API does not require Computer Use. The roadmap is delivery order, not permission to invent unnecessary technical dependencies.

### 2. Prompt 07 includes durable context continuity

A worker is not a provider thread. A BotSquad conversation is not a Codex runtime thread. Execution attempts and runtime-session generations are separate records.

Prompt 07 must support and test replacing a bounded or exhausted runtime context while preserving employee identity, authorized conversation history, task ownership, decisions, artifacts and pending obligations. A handoff should include a bounded, versioned summary with source references, unresolved questions, active work, and explicit omissions. Durable records, not the summary, remain authoritative.

Rollover must use a safe dispatch boundary and lineage linking old/new sessions, reason, checkpoint and active work. Do not discard a healthy retained binding unnecessarily, detach an in-flight operation, or blindly replay an ambiguous operation. Reconcile outcomes first; block/escalate when they cannot be established. Delayed callbacks from the previous session cannot mutate the new generation.

Memory assembly must enforce current participant, worker and Project permissions. Private conversational context must not leak into a shared group or another worker's context. Missing context must be reported, not invented.

Use verified runtime capabilities and explicit configurable bounds; do not assume a universal maximum thread length or require an unsupported provider feature. Tests must include forced rollover, restricted-context denial, stale callback denial, crash/restart during handoff and preservation of completed results. Runtime compaction, when available, is not by itself evidence of durable organizational memory.

### 3. Prompt 09 includes a minimal durable company clock

Periodic review is part of the operating loop, not a distant convenience feature. Prompt 09 must persist one-time and recurring review/follow-up triggers, an owner and mandate/initiative link, due time/timezone semantics, occurrence identity, bounds, and cancellation state.

The control plane checks clocks and conditions without invoking a model to poll an empty inbox. A due, authorized review with a defined purpose may schedule bounded model work even when its correct conclusion is to wait or stop. Respect human pause, cancellation, revocation, execution capacity and usage budgets.

Define crash/restart recovery, duplicate-event handling, schedule edits, overlapping occurrences, bounded missed-run catch-up, expiry, and backoff/escalation. Revalidate authority at dispatch and at consequential execution. Never infer permission from the fact that a timer fired.

Prompt 09 needs a small reliable scheduling mechanism, not a general automation marketplace or large distributed scheduler. Later integrations reuse it rather than creating separate unsupervised loops.

### 4. Asymmetri Motion is the canonical specific-product acceptance case

Prompt 09 must exercise both a broad mandate and this concrete reference mandate:

> Manage and market Asymmetri Motion; improve product quality, adoption and sustainable revenue within the approved constraints.

The team should choose useful product, engineering, research, review and growth work. Names, roles and participants in an example are illustrative, not an exact transcript to reproduce. Asymmetri Motion-specific rules and identifiers belong in scoped product configuration and evidence, never hard-coded into the generic BotSquad engine.

Prompt 09 may use owner-approved read-only exports, scoped repository snapshots, sanitized evidence or clearly labelled fixtures when real integrations are unavailable. It must label data provenance, dates and missing information, and perform at least two bounded operating cycles with an intervening outcome that affects or explicitly confirms the next decision. Human-approved observed updates can supply this evidence before live adapters exist.

Passing that bounded test proves the operating model, **not** live product management, publication, spending or commercial success. Do not alter the Asymmetri Motion release workflow, send messages, publish material or provision credentials merely to satisfy acceptance.

### 5. Prompt 11 must close a real business operating loop

Implement the smallest approved set of practical capabilities needed for the pilot: useful business evidence/metrics, a bounded external action path, scheduled follow-up and auditable outcome review. Likely candidates include product/website analytics, scoped product or website publishing/deployment, customer feedback/support, and email or another relevant approved outreach channel. App Store/product data is an optional adapter subject to supported interfaces and explicit authorization, not an assumed capability.

Direct typed APIs are preferred where they are reliable and available; bounded Computer Use remains an explicit alternative, not a universal integration shortcut. Support legitimate non-engineering roles through reviewed role/capability policy rather than granting every worker broad tools or pretending current fixed roles already support them.

Each consequential action needs a typed intent, exact target/scope, policy and approval requirements, idempotency/reconciliation behavior, attribution, receipt, revocation and appropriate compensation/rollback limitations. Unknown outcomes must not be retried blindly. A successful tool call does not establish a successful business outcome.

## Evidence gate before multi-company/federation

Require a documented single-company pilot showing:

1. A human mandate, explicit resource/risk limits, baseline metrics, sources, missing-data declarations and success/stop criteria.
2. Team-selected work, useful deliberation or independent review where warranted, and inspectable decisions linked to evidence.
3. At least one explicitly authorized real external operating action with a provider/deployment receipt and observed result. Drafts, mocks and unapproved actions do not meet this gate.
4. At least two operating cycles, including a scheduled follow-up without the owner manually re-prompting each handoff, and an evidence-based continue/iterate/pivot/stop decision.
5. Recovery from a restart and a context rollover, without losing ownership or duplicating committed business effects; ambiguous provider outcomes are reconciled or visibly blocked.
6. Enforced permissions, approval denials, revocation, budgets, human interruption and bounded idle behavior; report usage/costs where available and mark unknown values.
7. A human-readable account of outcomes, failures, limitations and remaining supervision. Commercial improvement is measured, not guaranteed or fabricated.

A lower-scope dry run can pass its own tests, but the live gate remains pending until its missing evidence exists. Do not use this gate as permission for unapproved real-world actions. Multi-company must solve an evidenced need after this gate, not become the default next feature merely because the gate passed.

## Numbering and compatibility

| Previous future identifier | Current disposition |
| --- | --- |
| Prompt 07 conversations | Retained; add runtime-context continuity |
| Prompt 08 deliberation | Retained; reuse continuity and scoped memory |
| Prompt 09 company loop | Retained; include minimal durable scheduling and Asymmetri Motion acceptance |
| Prompt 10 Computer Use | Retained; bounded capability, not all workers' default |
| Prompt 11 multi-company | Replaced by Prompt 11 single-company business operations; multi-company deferred, unnumbered |
| Prompt 12 company collaboration | Deferred, unnumbered |
| Prompt 13 external identities/Telegram | Deferred, unnumbered; needed narrow business adapters may precede it |
| Prompt 14 federation | Deferred, unnumbered |
| Prompt 15+ business capabilities | Minimal useful subset pulled into 09/11; broader platforms remain later |

Historical prompts, decisions and validation records retain their original meaning. Current planning uses the canonical [Roadmap](../product/ROADMAP.md), not old numbered tables in historical notes.

## Documentation and continuation

[Single-Company Business Operations](../product/SINGLE_COMPANY_OPERATIONS.md) specifies scope, evidence and acceptance in detail. [Project Memory](../PROJECT_MEMORY.md) is the concise repository-backed handoff for subsequent chats and Codex tasks. Future substantial milestone prompts must read these alongside the roadmap and Decision 016.

This record updates project knowledge in Git. It does not claim to modify ChatGPT account memory, a running HQ, or an already-running Codex task. A task already in progress must reconcile these requirements on its own branch without discarding work or silently broadening its authorized scope.

## Consequences

The product sequence now favors demonstrated customer/business usefulness over organizational scale. Runtime continuity and scheduling receive earlier explicit engineering and recovery tests. Asymmetri Motion supplies a realistic test without making BotSquad product-specific. Multi-company and federation are delayed, not rejected. Strategic freedom remains distinct from operational authority, and no financial credential or spending permission is granted by this decision.

## October 6 priority clarification — append-preserved

[Decision 026](decision_026_personal_operator_stabilization.md) clarifies the priority after
Prompt 11's bounded supervised completion: stabilize one owner's Personal Operator / Daily
Driver before further capability expansion. This supersedes any inference of automatic
post-gate expansion; the original context, milestone requirements and security constraints
above remain historical/architectural records. There is no automatic Prompt 12.
