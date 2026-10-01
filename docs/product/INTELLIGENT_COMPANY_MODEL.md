# BotSquad — Intelligent Company Operating Model

**Status:** Product north star and future architecture
**Updated:** 2026-09-29

## Purpose

BotSquad is intended to model a **team of intelligent employees operating a company**, not
an assembly line of agents that only pass work down a fixed hierarchy.

The human owner should be able to provide either:

- a broad strategic mandate; or
- a specific operating mandate.

The organization should then use its persistent workers, specialties, conversations,
working groups, Projects, evidence, tools and bounded authority to decide how to pursue
that mandate intelligently.

Examples:

~~~text
Broad strategic mandate

"Find a legal, sensible way to grow this business and increase long-term profit using
the resources I have made available."
~~~

~~~text
Specific operating mandate

"Manage and market Asymmetri Motion. Improve acquisition, activation, retention and
revenue while protecting the product's reputation and staying within the approved
operating budget."
~~~

These are different levels of specificity, but both should be valid inputs.

The user should not have to manually decompose every goal into:

~~~text
ask Scout
then ask Maya
then ask Turing
then ask Linus
then ask Grace
~~~

The organization itself should decide which people need to participate, what evidence is
missing, what options deserve discussion, which experiments are worth running, what work
must be assigned, and when strategy should change.

## North-star mental model

The target is:

~~~text
Human Owner
    |
    | broad or specific mandate
    v
AI Company
    |
    +-- understand objective and constraints
    +-- inspect current company state
    +-- discuss possible strategies
    +-- research unknowns
    +-- challenge assumptions
    +-- generate alternatives
    +-- choose experiments / projects
    +-- assign accountable owners
    +-- execute bounded work
    +-- review quality and risk
    +-- observe outcomes / metrics
    +-- compare outcome to objective
    +-- learn
    +-- revise strategy
    +-- repeat
~~~

This is an **operating loop**, not a one-shot pipeline.

## Employees, not interchangeable agents

A BotSquad worker should behave like a persistent employee with:

- a stable identity;
- role and specialty;
- manager/reporting relationship;
- mission;
- capabilities and authority;
- durable conversation relationships;
- work history;
- relevant organizational memory;
- model/runtime profile;
- current responsibilities;
- accumulated evidence and artifacts;
- ability to ask questions, challenge assumptions and propose work;
- ability to participate in meetings/working groups;
- accountability for decisions and results.

Workers should not be treated as anonymous model calls that happen to have names.

Persistent identity matters because a useful company develops:

- role expertise;
- context;
- working relationships;
- ownership;
- accountability;
- continuity across Projects;
- institutional memory.

## Hierarchy governs authority, not thought

The reporting hierarchy remains important, but its job is primarily to answer questions
such as:

- Who is responsible for this area?
- Who may assign work to whom?
- Who evaluates this person's result?
- Who may make or request a particular decision?
- Where does an unresolved issue escalate?

It should **not** mean:

> Workers may only communicate with their manager or direct reports.

A healthy company may have:

~~~text
Maya <-> Turing
Maya <-> Grace
Linus <-> Ada
Scout <-> Maya
Grace <-> Turing
Human <-> any worker
~~~

for discussion and clarification, while trusted assignment and approval rules remain
separate.

A worker may disagree with its manager in a design discussion without gaining any new
authority.

## Communication, deliberation, decisions and execution are different

BotSquad should distinguish at least four organizational concepts.

### Conversation

Human-readable communication between participants.

Examples:

- asking a question;
- clarifying a requirement;
- sharing a concern;
- requesting an explanation;
- offering an idea.

A conversation may cause an explicitly requested bounded reply turn, but does not itself
grant authority.

### Deliberation

A bounded multi-participant reasoning process.

Examples:

- design review;
- strategy meeting;
- product/engineering trade-off discussion;
- research synthesis;
- pre-mortem;
- incident room;
- pricing discussion;
- growth experiment review.

A deliberation should preserve:

- proposals;
- critique;
- alternatives;
- evidence;
- dissent;
- uncertainty;
- unresolved questions;
- final synthesis.

### Decision

A durable conclusion attributable to a person/role or trusted process.

A decision should record:

- what was decided;
- who owned the decision;
- evidence considered;
- alternatives;
- important risks;
- confidence/uncertainty where relevant;
- follow-up actions.

Discussion does not automatically imply that everyone agrees.

### Task / operation

Authorized work with an owner and bounded authority.

Examples:

- perform research;
- implement a feature;
- create a marketing landing page;
- run an approved experiment;
- prepare campaign assets;
- request a protected external action.

A discussion can recommend work, but actual execution still enters through trusted task,
capability and approval boundaries.

## Two valid ways a human can lead the company

### 1. Broad objective

The human may specify primarily:

- desired outcome;
- constraints;
- resources;
- time horizon;
- risk tolerance;
- protected actions requiring approval.

Example:

~~~text
"Increase the company's sustainable profit. You may explore products, marketing,
pricing and operations. Keep me informed of material choices. Do not spend or publish
outside the approved policies."
~~~

The company should then determine:

1. what the current situation is;
2. what information is missing;
3. what strategic alternatives exist;
4. which workers should investigate them;
5. which alternatives deserve discussion;
6. which experiment should run first;
7. how success will be measured;
8. whether to stop, iterate, pivot or scale.

### 2. Specific mandate

The human may already know the business/product.

Example:

~~~text
"Operate Asymmetri Motion as a product team. Improve the app, create and test marketing,
understand user problems, increase adoption and revenue, and report important decisions."
~~~

In this case the organization does not need to invent a new business. It should instead
behave like an intelligent product/company team:

~~~text
market/user research
      |
      v
product discussion
      |
      v
priorities / roadmap
      |
      +-- engineering
      +-- marketing
      +-- support / feedback
      +-- analytics
      |
      v
results
      |
      v
team review / new decisions
~~~

The same company model should support both broad and specific mandates.

## Initiative

An employee-like worker should be able to identify useful next actions rather than only
answer the literal last sentence it received.

Appropriate initiative may include:

- ask for missing information;
- request research;
- suggest a working group;
- identify a risk;
- propose a Project;
- suggest an experiment;
- recommend stopping weak work;
- escalate a protected decision;
- notice that results invalidate the current plan;
- recommend a strategy revision.

Initiative remains bounded by role and authority.

An AI worker should not infer that "take initiative" means "take unrestricted external
action."

## Company operating loop

A future company-level operating loop should be explicit:

~~~text
Mandate
   |
   v
Situation model
   |
   v
Strategy / hypotheses
   |
   v
Discussion + evidence gathering
   |
   v
Decision
   |
   v
Projects / Tasks / approved operations
   |
   v
Execution
   |
   v
Review / QA
   |
   v
Observed outcomes and metrics
   |
   v
Company review
   |
   +--> continue
   +--> iterate
   +--> pivot
   +--> stop
   +--> scale
~~~

The loop must be event-driven. Workers should not continuously poll models just to
simulate being "awake."

## Measuring success

A sophisticated team needs feedback from reality.

Depending on the mandate, useful evidence might include:

- user feedback;
- product usage;
- conversion;
- retention;
- support issues;
- revenue;
- cost;
- campaign performance;
- build/test results;
- operational incidents;
- research evidence;
- experiment results.

Metrics are evidence, not authority.

The company should be able to say:

> "Our original hypothesis was wrong because retention did not improve; here is the
> evidence, and here are the alternatives we now recommend."

That is more valuable than mechanically completing a predefined workflow.

## Resource and financial authority

BotSquad's long-term company model may include operating resources such as:

- cloud credits;
- software budgets;
- advertising budgets;
- approved service accounts;
- a treasury account or crypto wallet;
- revenue accounts;
- external tools.

However:

> **The AI team should reason broadly about resources while trusted systems enforce the
> actual authority to use them.**

Do not hand ordinary workers raw wallet private keys, seed phrases, bank credentials or
unrestricted payment credentials.

A future treasury/resource layer should look conceptually like:

~~~text
AI Company
   |
   | typed request
   v
Resource / Treasury Policy
   |
   +-- available operating budget
   +-- permitted action classes
   +-- per-operation limits
   +-- daily / project limits
   +-- approved destinations/providers
   +-- human-approval thresholds
   +-- accounting / receipts
   +-- revocation / emergency stop
   |
   v
trusted executor / provider adapter
~~~

For example, a vague mandate such as:

~~~text
"Use this approved pool of business capital to increase sustainable profit."
~~~

may lead the company to discuss products, marketing, hosting, pricing and experiments.

That does **not** mean Atlas receives unrestricted custody of a wallet. Actual transfer,
purchase, contract, account-creation or other consequential external authority requires a
separately designed trusted capability/policy and whatever explicit human authorization
that policy requires.

Investment/speculative trading should not be silently inferred from "maximize profit."
The company should consider business-building alternatives, risk, legality, evidence and
the owner's stated policy rather than optimizing a single financial metric without bounds.

## Company intelligence should include disagreement

A good AI company should not optimize for superficial consensus.

Different employees should bring different perspectives.

Example:

~~~text
Scout:
"The market looks attractive."

Maya:
"The user pain is real, but the proposed product is too broad."

Turing:
"The full version is expensive; we can test a smaller implementation."

Grace:
"The proposed acquisition tactic has reputational and compliance risk."

Atlas:
"Run the smaller experiment first; retain the rejected alternative and Grace's risk."
~~~

The system should preserve meaningful dissent and uncertainty in decision evidence.

## Human relationship to the company

The human is the owner/operator, not necessarily the project manager for every task.

The human should be able to choose different levels of involvement:

### High-level owner

~~~text
"Grow the company. Keep these risk/budget constraints. Escalate material decisions."
~~~

### Product owner

~~~text
"Run Asymmetri Motion. Here is the product direction; improve product and growth."
~~~

### Hands-on collaborator

~~~text
"Invite me to the design discussion. I want to decide between these alternatives."
~~~

### Direct specialist interaction

~~~text
"Maya, explain why you think this feature matters."
"Grace, challenge this launch plan."
"Linus, what makes this hard to build?"
~~~

The product should support all of these without changing the underlying authority model.

## Strategic autonomy versus operational authority

BotSquad should aim for **high strategic intelligence** and **bounded operational
authority**.

~~~text
Broad reasoning                     Trusted enforcement
--------------                     -------------------
What should we build?              What repositories can be changed?
Which market looks promising?      Which external sites/accounts are allowed?
Should we change strategy?         What can be published?
What experiment would teach us?    What money may be spent?
Which risk matters?                What action requires human approval?
~~~

The left side should become increasingly employee-like.

The right side should remain explicit and enforceable.

## Implications for Prompt 07

Prompt 07 is not merely "chat UI."

It establishes the interpersonal layer required by intelligent employees:

- human ↔ any worker direct conversation;
- worker ↔ worker conversation across hierarchy;
- durable participant-oriented inbox/history;
- explicit bounded reply/wake turns;
- passive announcements distinct from reply requests;
- clarification/follow-up;
- conversation context independent of a current Task;
- attribution and recovery;
- loop/rate bounds;
- no authority expansion from conversation.

Acceptance should demonstrate workers using conversation for genuine clarification and
idea improvement, not only exchanging status messages.

Prompt 07's implementation uses explicit direct conversations, finite reply chains and
worker/conversation context generations. The authoritative state is the transcript,
source-linked bookmarks and structured requests, with a shared unresolved-provider
fence across work modes. See [Decision 018](../decisions/decision_018_conversations_context_continuity.md)
and the [acceptance record](../validation/prompt-07-conversations-continuity.md).
This establishes communication and continuity; it does not implement recurring company
operation, deliberation groups, Computer Use or live business authority.

## Implications for Prompt 08

The implementation candidate now makes deliberation a separate bounded object rather
than a side effect of chat or Tasks. Actual employees cite earlier contributions, respond
to challenges, and can revise positions. The owner approves the charter and evidence
sharing audience, not every speaker. A synthesis records a recommendation with dissent,
missing evidence and next approvals; it does not authorize implementation. See
[actual evidence and remaining gates](../validation/PROMPT_08_VALIDATION.md).

Prompt 08 establishes team reasoning:

- working groups;
- structured meetings;
- brainstorming;
- critique;
- design review;
- strategy discussion;
- research synthesis;
- preserved dissent;
- human participation;
- synthesis/decision artifacts.

Acceptance should demonstrate that a multi-worker discussion produces a materially
better or more robust result than isolated parallel reports.

The test should include workers challenging one another and revising a proposal in
response to another participant's reasoning.

## Implications for Prompt 09 — company operating loop

After conversation and deliberation work, BotSquad should prove the first persistent
company-level operating cycle.

Prompt 09 should support:

- broad or specific human mandates;
- company situation/goal state;
- strategic hypotheses;
- team-selected research/discussion/Projects;
- explicit decisions;
- initiative within role;
- outcome/metric ingestion;
- review against the original goal;
- iterative next-action selection;
- stop/pivot/continue/scale decisions;
- durable strategic memory;
- bounded cycles and escalation;
- no model polling while idle.

A safe first acceptance scenario should use non-financial or simulated operating
resources. It should prove organization intelligence before giving the company broader
external authority.

A second acceptance scenario should use a **specific existing product mandate**, such as
managing a small software product, so the operating model proves it can execute both
open-ended strategy and focused product management.

## Future financial/treasury capability

Real financial execution is a separate protected capability, not an automatic consequence
of Prompt 09.

Before BotSquad can safely act on a bank account, payment account, crypto wallet or similar
resource, a future milestone must define and validate:

- typed transaction intents;
- no raw secret exposure to workers;
- identity/account binding;
- budgets and limits;
- allow/deny policy;
- destination/provider policy;
- exact audit and receipts;
- lost-response/idempotency behavior;
- approval thresholds;
- emergency revoke/stop;
- accounting/reconciliation;
- legal/compliance boundary;
- adversarial/prompt-injection tests.

Until such a capability exists, workers may reason about budgets or propose transactions
but cannot claim real financial authority.

## Requirements for future Codex milestone prompts

Every future substantial Codex milestone that changes organization behavior should ask:

1. Does this make BotSquad behave more like a team of persistent intelligent employees,
   or merely add another fixed pipeline?
2. Can the human provide both broad and specific objectives?
3. Can workers decide who needs to participate instead of requiring the human to
   micromanage every handoff?
4. Can workers ask questions, challenge one another and preserve dissent?
5. Is strategic reasoning distinct from execution authority?
6. Does the feature preserve communication ≠ deliberation ≠ decision ≠ Task/operation?
7. Are model turns event-driven and bounded?
8. Are important decisions/results attributable and inspectable?
9. Does restart/retry preserve the organizational process without duplicating work?
10. If the feature touches external systems/resources, is authority enforced outside
    worker-authored text and are credentials hidden from ordinary workers?
11. Can the company observe outcomes and revise its strategy?
12. Does acceptance include a realistic organization-level scenario rather than only
    isolated unit actions?

Future prompts should not hard-code every participant, conclusion or handoff merely to
make acceptance deterministic. The organization should retain meaningful room to decide
how to pursue the mandate; acceptance should validate invariants and outcomes, not script
the reasoning.

## Non-goal: theatrical autonomy

BotSquad should not fake company intelligence by:

- auto-generating chat between bots with no decision consequence;
- forcing every worker to speak in every meeting;
- manufacturing disagreement;
- creating fake "strategy" artifacts around a predetermined workflow;
- using prose claims as evidence of successful operation;
- silently broadening authority to make an ambitious demo work.

The goal is useful organizational intelligence grounded in real evidence and bounded
execution.

## Summary

BotSquad's destination is:

> **A persistent AI company whose members behave like intelligent employees: they
> communicate, form working groups, investigate, debate, plan, delegate, execute, review,
> learn from outcomes and adapt strategy toward broad or specific human-defined goals,
> while trusted systems enforce real authority, resources and accountability.**
