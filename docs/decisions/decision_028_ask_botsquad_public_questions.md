# Decision 028 — Ask BotSquad public questions

**Date:** 2026-10-06
**Status:** Owner-requested design amendment; implementation/activation planned
**Amends:** [Decision 027](decision_027_public_investment_showcase_design.md), only its read-only-visitor and publication-only assumptions

## Context

The owner adds Ask BotSquad to the public Asymmetri website: visitors may ask general questions or ask about a specific investment transaction, and one relevant BotSquad employee answers. This extends the showcase from observing workers to interacting with a real employee. It must not become a separate chatbot merely impersonating employee names.

## Decision

Adopt [Ask BotSquad](../experiments/investment/ASK_BOTSQUAD.md) as the normative feature amendment. Add R09 and [INV-ASK-01–INV-ASK-04](../experiments/investment/ASK_BOTSQUAD_ROADMAP.md) before integrated INV-10 acceptance. Preserve INV-01–INV-12 and core milestone numbering. This is part of the revised complete first-public-release scope, with a separate owner activation gate.

Questions are broad in topic, not restricted to investment FAQs. Choose one actual opted-in eligible worker using exact record provenance, conversation continuity and approved topic responsibility. Persist authentic attribution and any fallback/handoff. A generalist handles questions without a narrower eligible specialist. One public question does not convene the whole team or grant new authority.

Keep HQ private. A dedicated owner-granted adapter initiates outbound authenticated pulls from a private Asymmetri question queue; it does not expose HQ or allow arbitrary website callbacks. A visitor submission authorizes no trade, Task assignment, worker creation, private-data access, publication or financial action. Local HQ admission, budgets and least-privilege public-service contexts enforce this even if the receiver or input is hostile.

Use separate visitor-session conversations and provider contexts, never resume an employee's private work thread. Knowledge is limited to approved public material and exact visible experiment records, with separately authorized public-Q&A research if enabled. Questions and answers do not automatically enter investment memory or influence trading decisions.

Public accessibility does not imply a public transcript. Anonymous-session chat is visible to its requester, authorized operator and configured processing services, not other visitors or the Live Investment Desk. Keep a private Q&A store and `/api/ask/v1` contract separate from the public portfolio archive/API. No account is required; necessary session/abuse mechanisms, processing, retention and deletion are disclosed. No automatic public sharing or artifact publication of visitor text.

Use bounded request/queue/turn/research/cost limits, at most one Ask execution inside existing shared capacity, fair low-priority scheduling, safe output handling and an owner shutoff. Retain durable question/answer identities and unknown-provider fences; transport retries do not repeat employee work. Historical investment rationales remain immutable; new Q&A interpretation is labelled separately.

## Supersession map

The feature specification's amendment table is authoritative for the affected version-1.0 product, architecture, publication, API, operations and validation prose. Portfolio publication remains outward-only. Only the separate typed question-retrieval lane carries untrusted input into a bounded answer request. Existing public investment serializers remain public-only; private Q&A records are never added to them.

Decision 027's paper-only ledger, real discussion, artifact history, private HQ and activation constraints remain intact. Decisions 016, 020, 021, 022, 025 and 026 retain their other boundaries. This is not a generic webhook, treasury platform, owner-device API extension or multi-company/federation feature.

## Consequences and launch gates

Verify provider/runtime terms for anonymous third-party use, current roster/tool eligibility, privacy disclosures, actual source rights, finite budgets, recovery and anti-abuse behavior before activation. Security screening supplements enforced context/tool restrictions; it does not prove arbitrary inputs safe. A selected worker may answer with uncertainty, clarification or a justified refusal.

ASK-A01–ASK-A12 supply specific acceptance checks. Real employee general/contextual/follow-up evidence is required; canned answers cannot pass. Trial and official activation remain distinct. Deployment, a merged design or a visitor request creates no production grant.

## Current scope

Documentation only in BotSquad. No website implementation, live service change, credentials, grants, public question processing or investment activity is performed by this amendment.
