# Proposed one-shot AAPL historical qualification after HQ-READY-03F

**Status:** Proposal only — not approved, prepared or executed.

**Purpose:** One owner-inspected sample of private historical OHLCV through the existing
FinancialDataGateway, pinned Python adapter and accepted one-shot custody/watchdogs.

## Exact proposed envelope

| Item | Proposed bound |
| --- | --- |
| Instrument/read | One logical AAPL Apple common-stock/XNAS/USD daily OHLCV operation |
| History | September1,2026 inclusive through October1 exclusive;21 scheduled sessions, with actual closures/coverage unproven |
| Library | Python3.12.12, yfinance1.7.0 and existing hashed dependency lock; `auto_adjust=false`, `back_adjust=false`, `repair=false`, `rounding=false`, `actions=true`, `keepna=true`, `prepost=false`, `interval=1d` |
| Wire sequence | Exactly the six ordered slots below; early termination allowed; no extra financial requests |
| Attempts | Six total underlying requests maximum: three bootstrap, one crumb, one metadata chart and one historical chart. One request at a time; zero retries, alternate IPs/hosts or fallbacks |
| Spacing | At least5000ms after each completed response/receipt before the next wire request; bootstrap404s count normally |
| Bytes |262144 application body bytes per response,1048576 total; reserve a full per-response allowance before every attempt;16KiB parsed headers, identity encoding and strict UTF-8 |
| Deadlines |10000ms per wire including admission/spacing,120000ms from consume permission through data operation,180000ms whole supervised process including cleanup; admission expires600000ms after preparation and needs at least180000ms remaining |
| Network | Fixed pre-request query1 profile; validated public DNS, exactly one selected IP/family, ordinary certificate/hostname/SNI verification, fixed existing headers; no redirects, proxy/identity rotation, login or consent flows |
| Bootstrap |200 only with safe plain-text content and fresh usable anonymous A3 cookie;404 only if it matches the exact Decision042 grammar and cookie/header conditions. Preserve status404 and its bytes in every receipt; never label it a financial response |
| Cookie/crumb | Parent-memory-only Secure bounded cookie, valid on both crumb/chart paths and rechecked before wire; reject missing/expired/changed cookie. Validate nonempty bounded plain-text crumb and exact chart use. No invented cookie or authenticated-session claim |
| Stop |401/403/429, all unrecognized404s, any non-bootstrap404, all other non-200, barriers/denial/consent/CAPTCHA/login/redirect, malformed or oversized responses, missing cookie/crumb, timeout, cancellation, lost accounting or uncertain outcomes. Upstream no-crumb behavior is deliberately unavailable |
| Custody | Distinct create-only one-shot identity/OS-account anchor and expiry under reused accepted custody; spent before DNS, no rearm/resume. Memory SQLite; encrypted capsule with memory-only key; host encryption/swap/core-dump and backup-exclusion checks; immediate deletion after inspection or failure; verified dead process group before recovery |
| Reporting | Private fixed non-data counts/status/timing/quality summary; retain only non-data authorization/accounting/cleanup receipts. Never put raw prices, bodies, cookies/crumbs, private report or employee material in Git/public artifacts |
| Cost/activation |US$0 market-data spend; no employees/models/credits, paper fills, recurring collector, account/billing changes, production/Asymmetri deployment, public data or HQ-READY-04 |

The fixed ordered GET slots are:

1. `https://fc.yahoo.com/`, no parameters.
2. `https://fc.yahoo.com/`, no parameters.
3. `https://query1.finance.yahoo.com/v1/test/getcrumb`, no parameters.
4. `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`, `range=1d&interval=1d`, transient crumb.
5. `https://fc.yahoo.com/`, no parameters.
6. Same query1 chart path, `period1=1788235200&period2=1790827200&interval=1d&includePrePost=false&events=div,splits,capitalGains`, transient crumb.

Pinned-library fixtures establish these calls with parent-only cookies and disabled caches.
Slots1/2/5 are library bootstrap repetitions after allowed responses, not permission to retry a
failed request. There are at most **two chart requests**, only one of which requests the historical
range. An internal library attempt beyond these slots is a terminal scope violation, not spare
capacity to use differently. A failed metadata lookup never expands into quote/fundamental calls.

## Preconditions before any Yahoo I/O

1. The owner separately approves this exact small automated personal-use scope and confirms that
   their reported Yahoo permission covers these endpoints, rate, temporary private processing and
   non-data receipt retention, with any narrower conditions applied. Preserve the evidence as
   owner-reported verbal permission; do not infer written verification, unrestricted access or
   public rights.
2. Select a later source packet to extend the existing custody implementation with a distinct
   manifest/profile/anchor and validated nonfatal-bootstrap settlement. Do not build another data
   engine, reuse a spent issuer, modify the old receipt history or enable an environment switch.
   Propagate original404 status plus qualified-bootstrap classification through durable custody;
   unqualified404 remains terminal. Mirror the frozen six-slot qualifier and all existing watchdog,
   storage, stop, no-replay and cleanup gates.
3. Independently review architecture, security, recovery and acceptance; run authored complete
   adapter/custody fixtures and failure/crash cases. Merge reviewed source, rebuild clean
   synchronized main, verify source/build identity, calendar/instrument references and host custody
   before create-only preparation. Source integration alone is no execution permission.
4. Run once under supervision only after these gates, inspect the result privately, destroy data
   and key, verify normal/recovery cleanup and all historical receipt hashes, then stop permanently.

## Qualification limits and possible stopped outcome

Decision042 recognizes a deliberately tiny response class; it does **not** recognize arbitrary
HTML404s. The prior03E response had4585 bytes and cannot satisfy this grammar. Its destroyed
content/cookies cannot be inspected or reconstructed. If a future response is outside the reviewed
class, stop and report it unqualified; no follow-up endpoint, body-based evasion, ad hoc parser
widening or second approval consumption is permitted. Technical source mismatch is confirmed;
future successful access is not predicted.

If actual bars are obtained, assess identity/currency/timezone,21-session coverage, field and
corporate-action missingness, provider event times versus present retrieval, and raw/adjusted
meanings. Unknown availability stays unknown and current retrieval cannot become past knowledge.
History remains descriptive private research with `executionQualified=false`. A prospective
observed-price paper-order method needs separate semantics, source/calendar/action validation,
owner approval and a new run. Publication additionally needs independently assessed rights and
explicit authorization.03B/03D/03E remain spent and Decision037 remains4/4 throughout.
