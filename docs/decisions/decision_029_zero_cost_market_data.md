# Decision 029 — Zero-cost market-data sourcing for the BotSquad Investment Showcase

**Date:** 2026-10-09
**Status:** Accepted owner requirement; source integration and external permissions not yet implemented or verified
**Applies to:** BotSquad Investment Showcase (INV-01–INV-12), especially INV-06, and any Asymmetri.co public projections derived from market observations

## Context

The owner clarified that the Investment Showcase is a **paper-trading demonstration of BotSquad's persistent AI teamwork**, not a professional trading platform. There is **no budget for market-data services**. INV-01 explored Tiingo's conditional paid redistribution option beginning near US$250/month; that was a feasibility recommendation, not an owner-approved purchase or source selection.

The owner explicitly directs the project to use **free resources and web scraping** for market information. This decision supersedes the proposed paid-provider path as the default implementation strategy, while preserving the project’s integrity, privacy and authority boundaries.

## Decision

1. **Hard budget: US$0 incremental spend for market-data acquisition, subscriptions, API tiers and redistribution licenses.** No future Codex implementation task may purchase, subscribe, initiate a paid trial with automatic billing, introduce a paid-only dependency, or presume owner approval to raise this limit. Any proposed change requires a **new explicit owner decision recorded before implementation**.
2. **Source strategy: free APIs, freely accessible public information and permitted automated extraction/scraping.** Prefer official/public open-data endpoints and documented free API tiers, then limited low-frequency scraping of publicly available webpages where automated access is allowed. Maintain a source registry with actual terms, attribution, robots directives where relevant, access restrictions, rate limits and availability.
3. **Automated access must be allowed.** Being able to read a webpage without payment does not itself grant permission for scraping, automated reuse, retaining records or redistribution. Respect applicable terms, technical restrictions and reasonable request rates. Never evade login/paywalls, CAPTCHAs, access controls, anti-bot blocks or paid licensing; do not rotate identities to bypass limits.
4. **Private computation and public release are distinct rights.** Verify permission separately for obtaining/retaining data and for each public projection (raw prices, historical quotes, transaction fill values, per-stock series, benchmark, derived portfolio-value/return charts, JSON/downloads and permanent archived records). Publish source links, timing and allowable high-level commentary where permitted; withhold or reduce unlicensed fields rather than assuming “paper trading” or “derived data” exempts them. If rights remain unresolved for a proposed public field, mark its public release blocked.
5. **Initial cadence is low-frequency, not real-time.** Aim for a small frozen universe (around 10–15 stocks plus a benchmark as a proposal) and daily exchange-session observations with bounded caching, retries and fallback sources. Prioritize correctness, low load and feasibility over live quotes; never design a high-volume scraper.
6. **Source integrity is non-negotiable.** Every market observation retains its exact instrument/venue, currency, field, provider/source URL or licensed endpoint, raw/adjusted semantics, market event/session time, retrieval/availability time where known, source/version and correction history. Cross-check inconsistent observations where practical. Do not allow an AI worker’s free-form answer, snippet or article summary to become the authoritative fill price.
7. **No fabricated or retrospective fills.** Current planned fills use a verified raw next-session opening observation after a previously committed decision and cutoff. A free source may offer only delayed/daily closing prices or lack reliable corporate actions/calendar. In that case, leave fills pending/expired or amend the trading methodology by an **explicit owner-approved, versioned change before operational use**; never silently substitute another field, reuse stale prices or pretend a historical quote was available at decision time.
8. **Graceful degradation.** If a free source is unavailable, rate-limited, disallows required use, lacks sufficient provenance or fails price/action verification, show stale/unavailable state and stop affected new-risk operations. Do not fall back to a paid provider or unpermitted scraper. If no suitable free source can satisfy official-run or public-display requirements, retain the launch gate as blocked and describe safe reduced-display or delayed-simulation alternatives for owner review.

The market-data budget applies specifically to external **market-data costs**. It does not silently change separate budgets for AI model usage, compute, hosting, or public Ask BotSquad; these remain governed by their own approvals and limits.

## Relationship to existing decisions and evidence

- Extends [Decision 027](decision_027_public_investment_showcase_design.md) with a definite cost and source-method constraint. [Decision 028](decision_028_ask_botsquad_public_questions.md) remains unchanged.
- The [INV-01 report](../validation/investment/INV-01.md) accurately records paid options that were researched. Preserve it as historical evidence; **its conditional Tiingo recommendation is no longer the selected forward strategy**.
- The [investment decision log](../experiments/investment/DECISIONS.md) owns updated configuration status, and the [simulation methodology](../experiments/investment/SIMULATION_RULES.md) owns source/evidence/fill semantics.
- Contract v1.0, finalized under INV-01, remains unchanged. Source adapter work and checks are assigned to [INV-06](../experiments/investment/ROADMAP.md#inv-06--market-evidence-and-calendar); other phases must preserve this requirement.

## Acceptance requirements for future implementation

Before selecting a source or activating market-based paper operation, verify and record:

- **Zero recurring/incremental market-data fee** and no billing or license purchase.
- Source-by-source terms governing automation, frequency, retention and public redistribution, including derived data; list unknown rights as blocked rather than assumed.
- Reliable structured extraction/validation of price field, instrument identity, source date, exchange calendar, delays, corrections and relevant corporate actions.
- Error, rate-limit, downtime, site-layout change and conflicting-source behavior: no fabricated values or trading.
- Honest labels on the public Asymmetri showcase describing observed prices, delays, missing data and simulation assumptions.
- No changes to prior transaction rationale, historical filled orders or frozen method without an attributable versioned correction/amendment.

## Mandatory future Codex review

Every new investment-showcase Codex task or prompt—including website work, simulator, market-data collection, public projection, integrated validation, private trial and activation—must explicitly read and respect:

1. This **Decision 029**.
2. The [investment decision log](../experiments/investment/DECISIONS.md).
3. The [market observations and licensing requirements](../experiments/investment/SIMULATION_RULES.md#7-market-observations-and-licensing).
4. The [current investment roadmap](../experiments/investment/ROADMAP.md).

The [shared Codex launcher](../../prompts/experiments/investment-showcase.md) must include this mandatory preflight even for tasks not directly building the price adapter, so that website/publication work does not quietly require paid or unlicensed data.

## Consequences and trade-offs

A zero-dollar data constraint may limit data freshness, instrument coverage, corporate-action completeness, public display rights and reliability. It may require a smaller universe, postponed fills, less-detailed public charts, or a methodology change that the owner separately approves. Those compromises must be visible, not concealed.

This documentation decision authorizes **no scraping execution**, external account change, live provider connection, financial action, public activation or server deployment. Later implementation remains explicitly selected one packet at a time.
