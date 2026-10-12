# Decision 038 — Yahoo Finance for private personal research

**Date:** 2026-10-11 America/Vancouver  
**Status:** Accepted owner source selection and implementation direction; HQ-READY-03 implementation and operational activation remain unstarted  
**Scope:** The owner's personal, non-commercial BotSquad investment hobby project

## Owner decision and evidence

The owner selects **Yahoo Finance as the primary financial-data source**, with Python
**`yfinance` as the preferred adapter behind BotSquad's controlled Financial Data Gateway**.
This replaces the open-ended primary-source choice and HQ-READY-01's Alpha Vantage-first
recommendation. Qualification should now focus on Yahoo, rather than repeat a provider bake-off.

The owner reports having spoken directly with Yahoo and receiving permission for personal use.
Record the evidence as **owner-reported verbal permission**. No written permission was supplied
or independently verified in this task. The date of the conversation, Yahoo representative,
exact wording, endpoints, automation frequency, retention period and public-use terms were not
provided; do not invent them. The date above is the owner's report/selection date, not the call date.

Accept that report as the basis for the owner's personal-use source selection. It is not evidence
of an unrestricted license, independently verified automated access, commercial/organizational use,
public redistribution or permanent public archives. This decision does not require written proof
as the only possible evidence: assess the specific intended automated use and retention separately,
record any further owner-reported clarification accurately, and distinguish it from independent
verification. Unknown scope remains unknown, not silently promoted to an allowed runtime policy.

## Implementation direction

1. Build the Yahoo adapter within the existing trusted market-evidence boundary. The Financial
   Data Gateway is the controlled facade planned for HQ-READY-03, reusing INV-06 policies,
   immutable evidence, collection receipts, normalization and admission. It is not implemented
   by this documentation decision and is not a second worker engine or unrestricted Python tool.
2. Support historical OHLCV, company fundamentals, annual/quarterly financial statements,
   splits and dividends **as available**. Missing coverage, uncertain meanings and incomplete
   action/payment data remain explicit. Documented library accessors are not a completeness SLA.
3. Preserve original observations and available source identifiers, request parameters, provider
   and adapter versions, timestamps, adjustment flags, original payload/hash and quality status.
   Distinguish provider identifiers from locally generated content IDs. Append revisions and
   corrections; never overwrite what a prior decision saw. Do not call normalized adapter output
   raw provider bytes when the library did not expose those bytes.
4. Enforce conservative aggregate request rates, bounded history/universe, caching, finite retry
   and timeout budgets and visible provider-failure states in trusted code. Count underlying
   requests, including library-internal requests/retries, rather than assuming one Python call
   is one request. No bypass of access controls/rate blocks, identity rotation or paid fallback.
5. Preserve point-in-time correctness. Fiscal period/session dates are not availability times;
   current fundamentals and restated history must not enter earlier decisions. Missing release
   times remain unknown, with first retrieval as a conservative local knowledge bound. Adjusted
   history is distinct from raw execution evidence; changing library flags alone does not prove
   unadjusted as-traded values. Preserve the existing synthetic `inv05-v1` method and approve any
   different observed-data fill/benchmark method prospectively, before use.
6. Keep Yahoo data and derived research inside the owner's private personal scope. Automated
   access, internal calculation, retention, public display, derived portfolio, benchmark, exports
   and permanent archive remain distinct assessments under Decision032. Public outputs (including
   fills/returns/charts that reveal prices) remain denied without separate verified rights and
   explicit publication authorization. Private data must not enter Git fixtures, public artifacts,
   Asymmetri or public Ask merely because the source is selected.
7. Preserve Decision029's **US$0 incremental market-data budget**. No paid subscription, license,
   automatic-billing trial, source/account switch or budget increase follows from this decision.

## Relationships and authority

- [Decision029](decision_029_zero_cost_market_data.md) remains binding. This partially supersedes
  only its generic primary-source preference/pre-selection sequencing: Yahoo is selected now,
  while exact automated-use, retention and operational-data qualification remain future gates.
- [Decision032](decision_032_market_evidence_boundary.md) remains the trusted evidence/rights
  foundation. Existing observed-mode denials stay in force until separately reviewed source work.
- [HQ-READY-02 acceptance](../validation/investment/HQ-READY-02.md), its frozen synthetic method,
  runtime limits and default-inactive authority are unchanged. Decision037 stays exhausted at4/4.
- The [HQ-READY-03 plan](../exec-plans/investment-hq-ready-03.md) is prepared, not executed. This
  task authorizes documentation and reviewed Git integration only: no dependency installation,
  Yahoo data call, production mutation, recurring collector, genuine employee inference, billing
  change, public publication or deployment. Those require their own applicable authorization.

## Technical references and limits of this review

The [yfinance documentation](https://ranaroussi.github.io/yfinance/) describes an independent
open-source project, not a Yahoo-endorsed SDK; its software license is not a data redistribution
license. Its [Ticker reference](https://ranaroussi.github.io/yfinance/reference/api/yfinance.Ticker.html)
provides the relevant price, financial-statement and action interfaces. The
[download reference](https://ranaroussi.github.io/yfinance/reference/api/yfinance.download.html)
and [repair documentation](https://ranaroussi.github.io/yfinance/advanced/price_repair.html)
make adjustment/repair settings a qualification concern. These pages were reviewed on the date
above without fetching financial data. They do not verify the owner's conversation or its scope.
