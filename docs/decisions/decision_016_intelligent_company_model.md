# Decision 016 — BotSquad models an intelligent company, not an agent assembly line

**Date:** 2026-09-29  
**Status:** Accepted product/architecture direction; interaction and operating-loop milestones pending

## Context

The implemented Prompt 01–06 system proves durable workers, hierarchical assignment,
managed engineering, trusted approvals, Project/repository lifecycle, Ubuntu operation
and an authenticated Client API.

Those foundations are necessary but insufficient for the intended product.

A workflow can satisfy all of those properties while still behaving like an assembly
line:

~~~text
manager -> subordinate -> result -> manager -> next subordinate
~~~

The product objective is broader. BotSquad should model a company of persistent
intelligent employees that can solve sophisticated problems together and operate toward
human-defined goals with initiative, discussion, accountability and learning.

The human may provide a broad mandate such as improving sustainable profit with available
resources, or a specific mandate such as managing and marketing an existing product.
The human should not have to manually prescribe every internal handoff.

## Decision

BotSquad's product north star is an **intelligent company operating model**.

Workers are persistent organizational employees, not interchangeable model calls.

The system will distinguish:

- conversation;
- deliberation;
- decision;
- Task/operation;
- protected external authority.

Hierarchy governs responsibility, assignment and authority. It does not define the only
allowed communication graph.

Workers may communicate, ask questions, disagree and participate in cross-functional
working groups without gaining new assignment, approval, filesystem, repository,
financial or external-service authority.

The company should eventually support an event-driven operating loop:

~~~text
human mandate
  -> situation/evidence
  -> strategy/hypotheses
  -> research + deliberation
  -> decision
  -> Projects/Tasks/approved operations
  -> execution/review
  -> outcomes/metrics
  -> company review
  -> continue / iterate / pivot / stop / scale
~~~

The loop must remain bounded and inspectable. Idle workers do not poll models.

## Broad and specific mandates

Both are first-class.

Examples:

~~~text
Broad:
"Increase sustainable profit within these constraints and resources."

Specific:
"Manage and market Asymmetri Motion; improve product quality, adoption and revenue."
~~~

BotSquad should decide which workers, discussions, research, Projects and experiments are
appropriate, subject to policy and authority.

## Strategic intelligence versus operational authority

The product should pursue high strategic intelligence while keeping operational authority
explicit.

Workers may reason broadly about products, marketing, budgets, pricing, infrastructure or
other resources. They may not infer unrestricted authority to spend, publish, create
accounts, transfer money, sign contracts, use a wallet or expose credentials.

Consequential resources require separately implemented trusted capability/policy layers.

For financial resources in particular, ordinary workers never receive raw wallet private
keys, seed phrases, bank credentials or unrestricted payment credentials. A future
treasury capability must use typed intents, budgets/limits, trusted executors, receipts,
reconciliation, revocation and explicit approval thresholds.

## Roadmap consequence

The roadmap prioritizes organization intelligence before convenience clients.

- Prompt 07: first-class direct conversations and worker interaction.
- Prompt 08: collaborative working groups and deliberation.
- Prompt 09: strategic company operating loop.
- Later milestones add broader action surfaces such as Computer Use, multiple companies,
  external identities, federation and protected financial/resource capabilities.
- Native iOS remains deferred while the SSH-tunnel browser is sufficient.

## Acceptance philosophy

Future organization milestones should prove behavior using realistic company-level
scenarios, not only isolated API actions.

Acceptance should leave meaningful choices to the organization. It should validate
authority, evidence, bounded execution, recovery and outcomes rather than scripting every
worker message or conclusion.

Where practical, acceptance should cover both:

1. an open-ended mandate requiring the team to decide what to do; and
2. a specific existing-product mandate requiring coordinated operation and improvement.

## Consequences

Positive:

- BotSquad can evolve toward real team problem-solving rather than fixed workflow
  choreography.
- Reporting hierarchy remains useful without suppressing peer/cross-functional reasoning.
- Product, engineering, research, review and future business roles can collaborate
  naturally.
- Vague goals become legitimate inputs.
- Evidence and metrics can drive strategy changes over time.

Costs/risks:

- Conversation and deliberation scheduling become first-class orchestration problems.
- Context, model-turn cost and loop control require explicit bounds.
- Organizational memory needs careful scope and provenance.
- Initiative increases the importance of authorization and external-action boundaries.
- "Autonomy" becomes harder to test because correct behavior is not one predetermined
  transcript.

These costs are accepted because solving them is central to the product rather than
optional polish.

## References

See:

- [Intelligent Company Operating Model](../product/INTELLIGENT_COMPANY_MODEL.md)
- [AI Organization Model](../product/AI_ORGANIZATION_MODEL.md)
- [Project Vision](../product/PROJECT_VISION.md)
- [Roadmap](../product/ROADMAP.md)
