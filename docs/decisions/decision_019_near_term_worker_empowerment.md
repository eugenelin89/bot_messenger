# Decision 019 — Make useful worker capabilities and authority a near-term priority

**Date:** 2026-09-29  
**Status:** Accepted near-term product priority; implementation planned  
**Extends:** [Decision 016](decision_016_intelligent_company_model.md) and
[Decision 017](decision_017_single_company_first.md); preserves their numbered milestone
order and existing authority boundaries.

## Context and owner direction

After Prompt 07, the owner asked Atlas about current weather and found that conversation
alone did not give Atlas the means to look it up. The owner emphasized that employees
need to be trusted and empowered with useful capabilities, and requested that giving
bots appropriate power and authority become a very near-term repository task.

At this decision's baseline, `src/runtime/codex.ts` explicitly disables web search,
browser/Computer Use and inherited integrations; `src/runtime/adapter.ts` exposes only
bounded conversation tools for direct replies. Using Codex does not automatically expose
its broader capabilities to BotSquad workers. These are current implementation limits,
not a requirement that the company remain unable to gather public information.

## Decision

Make useful worker capabilities and standing authority a very near-term follow-up after
Prompt 07. Scope and schedule it alongside Prompt 08 preparation. Basic public research
must not wait for Prompt 11 or depend on implementing Computer Use.

Workers should have access to current public information, relevant company knowledge,
role-appropriate tools and execution environments, and standing authority to perform
routine work within approved scope and budgets. The owner should not need to approve
every lookup or internal step. Review disabled capabilities individually and deliver
small useful slices based on actual employee needs.

Authority must remain explicit, enforceable, inspectable and revocable. Escalate work
outside the standing grant and protected actions that require approval. Preserve existing
credential, publication, financial, infrastructure and company-data boundaries until
their applicable policies and trusted adapters are implemented. Conversation content
cannot grant itself new authority.

## First delivery evidence

- Atlas answers a current-weather question for a known location in a direct conversation
  using a real current source and includes its source link.
- A research worker completes a useful public-web research task with verifiable sources.
- Routine lookups use standing authority without per-lookup approval; unavailable sources
  are reported honestly, tool use is attributable, and actions outside the grant are denied.

This decision records planned work. It changes no runtime configuration or production
permissions and does not claim these capabilities are already available. Detailed scope
and acceptance belong to the [roadmap task](../product/ROADMAP.md#near-term-task--give-bots-appropriate-power-and-authority)
and the subsequent implementation prompt.
