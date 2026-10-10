# Simulation rules and market evidence

**Version:** 1.2 | **Status:** INV-05 fixture methodology implemented; official owner configuration still required | [Guide](README.md)

## 1. Scope and objective

This is a forward-running experiment with pretend money and observed market data, not a backtest, brokerage client or stock-recommendation service. There is no real-money mode, account connector or configurable real-trading endpoint.

Two independent questions are evaluated: can BotSquad coordinate accountable work, and how did its paper portfolio perform under the published assumptions? Profits alone do not establish coordination quality or investment skill. No particular return, strategy, trade or conclusion is required to pass software acceptance.

**Market-data budget is already decided:** the owner sets US$0 incremental spend. Follow [Decision 029](../../decisions/decision_029_zero_cost_market_data.md) for free APIs, permitted web extraction/scraping, evidence, public-display restrictions and blocked-source behavior. INV-01's paid Tiingo example is historical feasibility research, not a selected procurement plan. Other model/infrastructure budgets remain separate.

## 2. Frozen run configuration

The following is a design proposal, not an approved launch configuration.

| Setting | Proposed first-release default | Required launch decision |
| --- | --- | --- |
| Initial capital/currency | 100,000 USD | Owner selects amount and currency; v1 supports USD only |
| Universe | Versioned allowlist of liquid US-listed common equities | Exact instrument IDs, sectors, venue and classification source |
| Direction | Long-only, no leverage/shorts/options/crypto | Explicit immutable rule |
| Position/sector ceilings | 15% / 30% of equity at new-risk admission | Owner approves percentages and sector mapping |
| Decision cadence | One bounded review per trading session | Calendar, window, budget and end condition |
| Fill rule | Next regular-session opening price after timely commitment | Provider's exact raw opening-field definition |
| Quantity | Whole shares for discretionary orders | Corporate-action fractional handling still required |
| Slippage/commission | 10 basis points adverse slippage; zero modeled commission | Explicit assumptions; never claim these model actual broker costs |
| Benchmark | A named S&P 500-tracking ETF proxy | Exact instrument, rights and total-return convention; do not call it the index itself |
| Market-data source / spend | **US$0 incremental acquisition and licensing**, from verified free services or permitted low-frequency scraping | Confirm rights for automated internal collection and separately for each public/derived output; select actual source and fallback policy under Decision 029 |
| Cash | No interest, no tax, immediate simulated settlement | Disclose simplification; this is not a realistic cash-account compliance model |
| Official duration | Proposed 60 trading sessions | Owner chooses horizon; operational completion does not require a profitable result |
| Review budget | Proposed32 model executions per cycle,64 per session,3,840 per60-session run | Existing group reservation is24 plus coordinator; requires explicit finite grant/owner approval |
| Loss attention threshold | Proposed 10% observed drawdown | Hold new risk and notify owner; not a guaranteed loss limit |

Store an immutable configuration version/hash, universe version, methodology version, provider/feed identifier, calendar version, fees, limits, publication policy and consent. Dates are actual selected dates, not inferred from these examples. A rule change during an official run requires a visible amendment and analysis of comparability, or a new run. Never silently reset capital/history.

## 3. Deterministic records and arithmetic

Represent monetary amounts and prices as decimal strings in APIs; use fixed-point integer arithmetic internally. Contract 1.0 precision is six decimal places for USD and six for position quantities. Submitted discretionary quantity is a positive whole-share integer. Never use binary floating point for ledger balances, fees or cost allocation.

Use round-half-even at defined monetary posting boundaries; retain raw values and rounding adjustments. Any unrepresentable corporate-action quantity becomes an explicit unresolved fractional entitlement, not silently discarded wealth. Money fields include currency; numeric strings disallow NaN, infinity, exponent notation and excess precision.

Each journal transaction has a run-scoped sequence, unique transaction ID, source operation, event/effective/recorded times, configuration hash, entries and prior/resulting ledger version. Journal entries cover cash, security quantity, security cost, realized result, fees, income and receivables. Replay must reproduce derived positions and balances exactly.

Cash and quantity never become negative. Every derived balance references a journal checkpoint. Model-authored balance, price, return and cost-basis claims are ignored as accounting input.

## 4. Decision, order and fill

A public decision contains BUY, SELL or HOLD; evidence cutoff; thesis; alternatives; risks; independent review; invalidation condition; and original producing execution. A BUY/SELL proposal contains instrument ID, integer quantity, target session, decision revision and price guard. The guard limits acceptable execution; the model never supplies the authoritative fill price.

An order has states `proposed → validated → pending → filled`, with terminal `rejected`, `expired` or `cancelled` alternatives. Validation rejection remains an inspectable receipt. HOLD creates no order. Submission identity is unique by run, decision revision and order index, not just a model-generated random ID. Retrying a successful tool call returns the same order/receipt.

Before accepting an order, verify active run/grant/execution, complete current risk inputs, supported instrument, valid evidence references, review of the same proposal revision, known calendar, available cash/quantity, risk ceilings, remaining operation budget and submission deadline. Serialize competing submissions using expected ledger version and a short database transaction.

Reserve cash for a buy's maximum guarded notional plus modeled fees; reserve shares for sells. Pending buys count toward risk limits. Unfilled sell proceeds cannot fund a buy. A new decision can use actual sale proceeds after commitment. Release reservations exactly once on a terminal outcome.

### Default next-open model

The trusted calendar identifies a target regular-session open. A decision and order must be durably committed before a configured deadline, proposed as 30 minutes before that open. A late queued model response expires or targets a future session through a new decision; it cannot trade retroactively.

Use the first verified raw opening observation for that target session. Apply adverse slippage: buy price = raw open × (1 + rate); sell price = raw open × (1 − rate). Round at the documented precision. Require the guarded price, cash and current risk checks to remain valid at fill time. A gap beyond a guard rejects the order; do not silently resize it, choose a favorable price or substitute yesterday's close.

The order is already locked before the price event occurs. A delayed feed may cause processing later, but record both market-effective time and actual processing time and label the delayed simulation. Evidence and analysis learned after the deadline must not change the already locked order.

An observation must be the provider's documented raw regular-session open, not an adjusted historical bar, article price, midpoint, extended-hours trade or invented “official” price. A missing/halted/unsupported opening observation leaves a visible pending/data-blocked state until its finite deadline, then expires. No substitute close, adjusted bar, article quote or alternative free site unless that exact field/source transition is already allowed by the frozen, versioned policy or receives a separately approved methodology amendment. A paid fallback is prohibited by Decision 029.

Risk checks at execution need valid contemporaneous marks for relevant holdings. Incomplete marks block new-risk orders. An explicitly authorized risk-reducing sale may proceed only under a separately specified degraded-data policy; v1 has no such exception by default. No discretionary partial fills in v1; fill all or reject, with the liquidity simplification disclosed.

## 5. Cost basis and profit/loss

Use weighted-average book cost, not tax reporting. Buy basis includes modeled buy fees. On sale, release the same fraction of pre-sale basis as quantity sold; a final full exit releases the entire remaining basis to avoid rounding residue.

- Cash after buy = cash before − quantity × fill price − buy fee.
- Cash after sell = cash before + quantity × fill price − sell fee.
- Realized P&L = net sale proceeds − released basis.
- Unrealized P&L = marked position value − remaining basis.
- Equity = cash + marked security value + recognized receivables − recognized liabilities.

Fees, slippage and dividends must not be counted twice. Slippage is already embedded in fill price. There are no deposits/withdrawals after official initialization in v1; a new capital amount requires a new run.

A simple accounting fixture, with fees/slippage explicitly set to zero: start with $1,000, buy two shares at $100, leaving $800 cash. At $110, equity is $1,020. Sell one at $110: cash $910, remaining value $110, realized profit $10, unrealized profit $10, equity still $1,020. This proves arithmetic, not a real investment outcome.

## 6. Corporate actions are launch requirements

Do not defer all corporate actions while claiming credible portfolio performance.

| Event | Required handling |
| --- | --- |
| Split/reverse split | Adjust quantity and per-share basis without changing total basis or creating profit; preserve exact source and effective date |
| Cash dividend | Determine entitlement from holdings at the applicable ex-date boundary; accrue receivable/income and later move receivable to cash on payment |
| Ticker change | Preserve stable instrument identity and symbol history |
| Merger/spinoff/delisting/complex distribution | Stop affected new orders, flag valuation uncertainty and require a verified explicit event policy; never delete or value the holding at a favorable guessed price |
| Provider correction | Preserve original observation; add correction and recomputed valuation revision with explanation |

Accruing a dividend receivable prevents a pay-date-only artifact in returns. Entitlements need provider-confirmed ex/effective/payment semantics, not model guesses. Missing payment date or uncertain entitlement remains explicitly unresolved.

Apply each action exactly once using stable provider/instrument/action identity. Reverse splits with unrepresentable fractions create a cash-in-lieu entitlement whose value stays unknown until verified. Unsupported actions can visibly pause the experiment; they cannot be ignored to keep charts green.

Use raw prices with explicit action accounting. Never apply split/dividend effects again to an already fully adjusted series. Benchmark accounting uses the same convention.

## 7. Market observations and licensing

Price data comes from a structured trusted adapter. Public-research output supplies reasoning, not execution prices. Each observation contains instrument/venue/currency, provider/feed, field, value, raw/adjusted mode, market event time, provider availability time when known, retrieval time, delay policy, calendar session and source/version identifiers. Unknown times remain unknown.

Store exchange calendar versions with holidays, early closes and timezone `America/New_York`; do not equate weekdays with trading days. The UI may also show the owner's `America/Vancouver` time. Check calendar freshness and unexpected closures; do not infer an open market from a cron schedule.

**Zero-cost source policy:** No fee-based market-data API tier, redistribution license, paid trial with auto-billing or other incremental market-data spend is an option without a new explicit owner decision. Prefer free documented APIs/public open data and then permitted low-frequency extraction/scraping from publicly accessible webpages. Check current provider/site terms, automated-use rules, robots directives where relevant, licensing and rate limits; do not bypass authentication, paywalls, CAPTCHAs, anti-bot limits or blocks. A source being free to view or technically scrape does not establish permission to use it automatically or to retain and redistribute its output.

Source selection must separately establish **internal/non-display/automated use**, **retention**, **public display/redistribution**, and **derived-data/archival rights**, including portfolio values, simulated fill records, per-security and benchmark histories, charts, JSON/downloads and retained artifacts. Record access terms and last verification, approved endpoints or page selectors, exchange/field semantics, source attribution, publication delay, rate bounds, available corporate actions, correction policy and expected data freshness. No published field becomes permitted merely because the trades are fictional or the website links to its source.

The adapter should support a **small frozen universe and daily exchange-session observations**, cache bounded source responses, back off politely on rate limits, detect HTML/layout changes, and optionally compare with independent permitted sources. Capture the exact observed value and provenance, not an AI worker's paraphrase. Alternate sources may be used only under a frozen versioned source-selection policy with equivalent rights/semantics; otherwise require an explicit owner-approved policy/methodology change before use. More sources cannot be combined opportunistically to manufacture missing information.

A free source offering only delayed daily closes might not meet the planned **next-open raw price** execution rule. Do not silently change to same-day/previous-day close, fill after seeing a favorable movement or retroactively change commitment timing. If no reliable free source provides the necessary fields, leave affected fills unavailable/expired, or propose a different no-lookahead execution convention for explicit owner approval and new methodology version **before** an operational run. If valid free data or public derived-display rights cannot be established, keep corresponding live/public gates blocked; show missing/stale labels or omit restricted fields rather than paying or scraping against restrictions. External AI and infrastructure budgets are separate from this market-data constraint.

News and filing records retain publication/event/retrieval times, sources, excerpts and limitations. A recently fetched old article is not new evidence. Prefer primary company releases/filings for factual financial claims; distinguish secondary interpretation. SEC APIs are possible filing sources, not a replacement for a market-price feed. See [References](REFERENCES.md).

## 8. Valuation and performance

Initial official valuation is cash-only at a frozen start instant. The benchmark buys its documented proxy at the first eligible opening event under an explicitly published fill convention, with fractional virtual units permitted for comparability. Keep residual cash and distributions. Benchmark cash distributions are reinvested at the next eligible open after payment under a fixed rule; the portfolio's dividends become cash unless a new decision reinvests them.

Value portfolio and benchmark at matched session marks. If one series is unavailable, show the limitation instead of comparing mismatched periods. Price freshness is based on the relevant session/delay contract; a previous Friday close can be the latest expected mark on Sunday, not a live quote.

For fixed initial capital C and valid equity E(t):

- Total return = E(t) / C − 1.
- Daily return = E(t) / E(previous comparable session) − 1.
- Excess return = portfolio return − benchmark return, in percentage points.
- Drawdown = E(t) / max(E(s), s ≤ t) − 1.
- Maximum drawdown = most negative observed drawdown, with sampling frequency disclosed.

Do not label simple excess return alpha. Do not claim risk-adjusted superiority from a brief run. Sharpe/annualized volatility are deferred until observation count, risk-free-rate convention and frequency are defined and supported.

A partially marked portfolio does not receive a falsely precise current total. Retain a labelled last-good valuation and coverage/status; charts show gaps or explicit carry-forward marks. Corrections append revised valuations, never erase earlier published numbers without a notice.

## 9. Risk and stop conditions

Evaluate position/sector ceilings on admission and again at fills, including pending risk, fees and actual marks. Market movements may later push a position over its ceiling; publish the breach and prevent additional risk. Do not claim the ceiling can prevent gaps or automatically sell unless the owner enabled an explicit deterministic rule.

Pause new orders for unknown accounting state, unavailable essential data, unsupported corporate action, expired authority, exhausted budget, excessive publication backlog or owner stop. The proposed drawdown threshold triggers attention and blocks new risk, not a guarantee against further losses. Existing holdings still move in value.

Freeze the method before official launch. Preserve losses, failed proposals and human interventions. The public methodology states all simplifications and that simulated outcomes do not establish executable real-world returns.

## INV-01 wire foundation

[Contract 1.0](../../../contracts/investment/v1/PROTOCOL.md) freezes decimal/JCS hash recipes, journal/order/valuation identities, finite order expiry, typed action references and exact rational residuals. Split fractional entitlement is in shares; price/basis rounding residual is in micro-USD. Ticker changes preserve stable instrument identity and half-open symbol-history dates; snapshots resolve the symbol effective at valuation time. The disposable oracle checks representative consistency only. [INV-05](../../validation/investment/INV-05.md) now implements reservation/risk/concurrency and deterministic fixture calendar, benchmark and correction replay; real source/calendar integration remains INV-06. No operational ledger exists from INV-01.

## INV-05 frozen fixture methodology

The implemented `inv05-v1` envelope is immutable and synthetic-only. `test/fixtures/investment/support.ts` labels invented instruments, prices and calendar. Its $1,000 small arithmetic fixtures and optional policy overrides are not approved production defaults. The proposed $100,000/15%/30%/10bps/10% drawdown envelope above remains subject to a separate official run decision.

- Financial outputs have six decimal places; bounded BigInt millionths, half-even rounding, checked intermediate range and explicit fill price/notional/basis residuals. BUY capitalizes fees; SELL deducts fees from proceeds and releases weighted-average basis. Final exits release all basis residue.
- BUY/SELL commitments and matching independent review precede the frozen 30-minute cutoff in standard fixtures. Whole shares and guards reserve cash/shares. Missing original raw opening remains data-blocked only until finite expiry (at most24h). Corrections never replace locked fills. Late fills fail closed if later portfolio economic effects prevent accurate opening-time risk.
- Risk includes pending buys, current marks, sectors, available cash/shares, fee/slippage loss and posttrade concentration. Existing market-created breaches are labelled; drawdown attention blocks added risk, while an otherwise valid reducing SELL remains possible. Pause/end cancels pending orders without forced sales. A stalled outbox cannot send anything and total journal admission is bounded.
- Split quantity changes retain basis. Unrepresentable fractions remain exact rational shares and block valuation/trading; no guessed cash-in-lieu is booked. Dividends use pre-ex-boundary holdings, accrue receivable/income, then move receivable to cash exactly once at payment. Same-instant split/dividend units, unsupported actions and out-of-order split history remain blocked. Action corrections require future reviewed reconciliation; they do not overwrite evidence.
- Benchmark initial investment uses the same frozen next eligible session/cutoff as initialization. Dividend reinvestment uses the next regular opening strictly after actual payment time, with zero benchmark fee/slippage. Funding lots prevent future cash funding earlier opens; tiny amounts remain residual cash. Opening/action uncertainty suppresses comparison.
- Noninitial scheduled valuations require each held instrument's exact session raw close. Portfolio and benchmark match sessions; missing values/comparisons are null, aggregate quality is partial/blocked and last-good retains its timestamp. Returns/drawdowns are decimal ratios; excess return is percentage points. Daily return requires the immediately preceding eligible valuation.
- Late financial effects and explicit `revise_valuations` append revisions, preserving original books, fills, marks and snapshots. Latest revisions recompute later daily/peak/drawdown values. Financial checkpoint version/hash bind the accepted accounting-history prefix; the prior journal anchor and enclosing journal hash provide noncircular provenance. New historical values reject when present books/reservations/uncertainty would leak backward.

These guarantees are verified only with [deterministic INV-05 acceptance](../../validation/investment/INV-05.md). INV-06 must prove real calendar/source provenance, completeness, freshness and permitted zero-cost use before operational evidence is accepted.
