# Decision 027 — Public BotSquad investment showcase design

**Date:** 2026-10-06
**Status:** Owner-requested design recorded; implementation and activation remain planned. Visitor interaction/publication-only scope partially amended by [Decision 028](decision_028_ask_botsquad_public_questions.md).

**October 6 amendment:** The owner subsequently added Ask BotSquad. [Its specification](../experiments/investment/ASK_BOTSQUAD.md) permits bounded general or contextual public questions answered by one real relevant employee, using anonymous-session privacy and separate HQ-initiated question retrieval. This does not grant visitor trading/Task/private-data authority or change this decision's paper-only ledger and protected-publication principles. The original rationale below is preserved as history.

## Context

The owner wants a simulated investment team as a public demonstration of BotSquad. Workers should research news/companies, discuss ideas, produce inspectable artifacts, make explained paper buy/sell/hold decisions and review outcomes. Asymmetri.co should receive authenticated REST updates from HQ and show the project purpose/goals, genuine live discussion, artifact links, portfolio charts and transaction history.

The principal purpose is demonstrating persistent, accountable AI teamwork, not promoting a stock-picking service. Earlier suggested capital, risk limits, benchmark and schedules were examples, not approved launch configuration.

## Decision

Record a detailed subject-organized [design guide](../experiments/investment/README.md) and [INV-01–INV-12 build roadmap](../experiments/investment/ROADMAP.md), with a [shared Codex launcher](../../prompts/investment-experiment.md). The roadmap is an owner-selected experimental track, not core Prompt 12 and not a renumbering of completed milestones.

BotSquad HQ remains authoritative for organization state and a new deterministic paper ledger. Workers reason; trusted code enforces accounting and constraints. A separately owner-granted publisher sends only approved public projections and artifact copies to a bounded Asymmetri REST receiver/archive. The website cannot command HQ. Genuine discussion and durable artifact links are required in the first public release.

Preserve existing roles, hierarchy, execution limits, private contexts, source permissions and uncertainty fences. Research, group sharing, paper-order authority and public publication are distinct. No grant follows from a title, message, migration, deployment or this document.

Use real public-audience contributions, never fabricated transcripts or hidden provider reasoning. Preserve analytical mistakes and losses through versioned records. Provide exceptional owner-only privacy/security/rights withdrawal without pretending downloaded copies can be recalled.

## Relationship to prior decisions

This records the explicit owner-requested design permitted by Decision 026's demonstrated-need/owner-priority boundary. It does not displace Personal Operator stabilization or activate broad portfolio-management, real financial, treasury, federation or multi-company functionality. Decisions 016, 020, 021, 022 and 025 retain their current authority boundaries.

The current Prompt 11 GitHub-document adapter is not a general REST publisher. The proposed paper simulator/publication capabilities need their own implementation, tests and owner activation. Existing company/device APIs do not silently expand.

## Consequences and gates

The design owns proposed architecture and requirements; current implementation facts remain in existing source and accepted validation. Machine-readable contracts, provider rights/runtime feasibility and owner configuration are first implementation work. Every later packet has dependencies, acceptance and non-goals. A private trial and an official public run have separate identities; no trial history is reset to improve displayed results.

Public launch requires separate explicit authorization, data-rights evidence, frozen configuration, finite grants/budgets, tested recovery, compatible exact repository commits and an operator handoff. No real-money mode, brokerage credentials or spending is part of this experiment.

## Current delivery scope

Markdown documentation in `eugenelin89/bot_messenger` only. No Asymmetri code edits, deployments, worker changes, credentials, grants, schedules, simulated trades or public activation. The investment roadmap status table is the sole implementation-status ledger for this track.
