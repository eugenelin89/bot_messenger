# BotSquad Project Memory and Continuation Handoff

**Updated:** 2026-10-01
**Purpose:** Short repository-backed continuity record for a fresh chat, Codex task or interrupted planning session. This is not runtime employee memory or ChatGPT account-memory storage.

## What we are building

BotSquad is an operator-controlled, self-hosted AI company: a team of persistent intelligent employees, not a fixed assembly line of model calls or a chat UI around Codex. The team should communicate, deliberate, take bounded initiative, delegate, review, measure outcomes, learn and adapt.

The owner may give either a broad goal or a specific mandate. The concrete reference is: **manage and market Asymmetri Motion, improving product quality, adoption and sustainable revenue within approved constraints**. The organization should select useful people and work; the owner should not have to prescribe every internal handoff. Human control and approvals remain policy-based.

## Accepted decisions from the September 29 continuation

1. **One AI company that can actually operate a real business is more important than multiple companies or federation.** Keep multi-company/federation as later options, not near-term prerequisites.
2. Keep **07 → 08 → 09 → 10**. Add **11 — Single-company business operations and a measured Asymmetri Motion pilot**. The old future 11–14 numbering is superseded; multi-company, company collaboration, Telegram and federation are now deferred/unnumbered.
3. **Prompt 07:** include runtime-context rollover and scoped rehydration. Employee and BotSquad Conversation IDs survive replacement of provider threads/sessions. Preserve history, ownership, evidence and unresolved work; reconcile in-flight operations instead of replaying them blindly.
4. **Prompt 09:** include a minimal durable one-time/recurring scheduler and the Asymmetri Motion reference scenario, alongside a broad-objective scenario. Demonstrate two bounded operating cycles and evidence-based follow-up. Read-only/sanitized/simulated acceptance must be labelled honestly.
5. **Prompt 11:** prioritize the smallest practical metrics/evidence + approved external action + scheduled observation loop. Require real receipts and outcomes before claiming live operation. Do not build every connector or assume unavailable credentials.
6. Durable organizational state is authoritative; summaries are bounded, scoped, fallible derived artifacts. Worker ≠ BotSquad conversation ≠ runtime thread/session ≠ execution attempt ≠ company ≠ HQ ≠ runtime account ≠ Unix user ≠ device ≠ external identity.
7. Broad reasoning does not expand operational authority. No raw financial credentials, unapproved outreach/publication, spending, contracts or unsafe desktop access. Bots cannot manufacture approval in text.
8. Native iOS/no-tunnel access remains deferred while the private browser is sufficient. Asymmetri Motion is a reference product configuration, never a hard-coded assumption in the generic engine.
9. **Very near-term follow-up after Prompt 07: give bots appropriate power and authority.** Employees need public research/current information, relevant company knowledge, useful tools and standing authority for routine work within role, scope and budget. Avoid per-lookup micromanagement. Plan the first useful slice alongside Prompt 08 preparation; do not defer basic public research to Prompt 11. This is planned work, not a live permission grant. See [Decision 019](decisions/decision_019_near_term_worker_empowerment.md) and the [roadmap task](product/ROADMAP.md#near-term-task--give-bots-appropriate-power-and-authority).

## Verified implementation baseline at this decision

Repository: `eugenelin89/bot_messenger` (product name: BotSquad).

The GitHub documentation baseline was `a1532d3359223f4047d28f9a3c054dd1369108db`: **Prompts 01–06 complete; Prompt 07 next.** That is the historical Decision 017 baseline. Prompt 07 implementation and actual Ubuntu acceptance are now recorded in [the validation report](validation/prompt-07-conversations-continuity.md) and [Decision 018](decisions/decision_018_conversations_context_continuity.md). The final source/deployment equality is recorded in the delivery handoff and private HQ journal; do not infer it from an older baseline SHA.

Always reread current main, relevant execution plans and active branches before asserting current implementation/deployment status. Preserve historical records and concurrent writers. Use a dedicated branch/worktree, normal reviewed integration, and no force push or destructive history rewrite.

## Read these to continue

- [Canonical roadmap](product/ROADMAP.md): current sequence and milestone acceptance.
- [Decision 017](decisions/decision_017_single_company_first.md): authority, rationale, supersession map and live-business evidence gate.
- [Single-Company Business Operations](product/SINGLE_COMPANY_OPERATIONS.md): context continuity, company clock, Asymmetri Motion test and practical operating scope.
- [Decision 016](decisions/decision_016_intelligent_company_model.md) and [Intelligent Company Operating Model](product/INTELLIGENT_COMPANY_MODEL.md): employee-like initiative, broad/specific mandates and authority distinctions.
- [Future milestone prompt requirements](../prompts/MILESTONE_REQUIREMENTS.md): requirements that must flow into Codex prompts.
- [Current State](operations/CURRENT_STATE.md) and [decision index](decisions/README.md): implementation evidence and accepted boundaries.

## Next planning action

Prepare Prompt 08 working groups from the accepted direct-conversation foundation. Reuse its scoped sessions, source-backed handoffs, durable obligations, shared dispatcher and unknown-outcome fence. Do not expand conversation tools into assignment or approval authority. Preserve the 08 → 09 → 10 → 11 order, minimal scheduling in 09 and the single-company evidence gate before federation. Verify current main and the Prompt 07 delivery record before starting; do not discard concurrent work.

WE-01 implements the first public-research/standing-knowledge slice from Decision 019. Read [Decision 020](decisions/decision_020_scoped_public_research.md), the [active execution plan](exec-plans/worker-empowerment-01.md), [validation record](validation/worker-empowerment-01.md) and [owner tutorial](operations/PUBLIC_RESEARCH_TUTORIAL.md). Live acceptance and delivery remain open until that report records them. Separate owner activation is required at the retained HQ; do not confuse deployed code with active permission. Broader empowerment remains future work.

## Maintaining this record

Update this handoff when the owner changes a decision or a milestone is genuinely accepted. Keep rationale in decision records and detailed status/evidence in execution plans. Do not duplicate secrets or private customer data here. Current owner instructions and accepted decisions take precedence over an old handoff. This file makes the conversation recoverable from the repository; it does not claim that every future chat automatically loads it.
