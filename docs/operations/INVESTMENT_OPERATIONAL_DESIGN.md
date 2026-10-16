# Investment operational design — HQ-READY-01

**Date:** 2026-10-11 America/Vancouver
**Status:** Source-audited proposal; no operating policy or activation approved
**Audited BotSquad main:** `da64089e12035a3e1ae7bfc504c80798dc4925bf`

[Readiness](INVESTMENT_READINESS.md) · [Acceptance](../validation/investment/HQ-READY-01.md) ·
[Execution plan](../exec-plans/investment-hq-ready-01.md) ·
[Proposed next implementation prompt](../../prompts/experiments/investment-hq-ready-02.md)

**Current amendment:** HQ-READY-02 source acceptance is complete (§12). The owner now selects
Yahoo Finance / Python `yfinance` for personal private research under
[Decision038](../decisions/decision_038_yahoo_finance_private_source.md), superseding this document's
Alpha Vantage-first recommendation. Reported permission is verbal personal-use permission from
Yahoo as reported by the owner; no independently verified writing or broader rights is claimed.
The [HQ-READY-03 source/fake acceptance](../validation/investment/HQ-READY-03.md) now implements
the inert gateway and pinned adapter. The [bounded live-probe proposal](YAHOO_FINANCIAL_GATEWAY.md)
remains separately unauthorized; live admission, retention/custody and prospective fills stay blocked.
Earlier HQ-READY-01 audit/status wording remains a dated snapshot; current source direction is
summarized in §13 and the updated03 packet below. No operational activation follows.

## 1. Decision-ready outcome — HQ-READY-01 snapshot

**Proceed with source-only HQ-READY-02 after owner selection. Block genuine operation now.**
The shortest path is a distinct finite, existing-credit-approved **private paper** mode in
normal HQ. Reuse existing employees, working groups, scheduler, dispatcher, usage records,
financial reducer and owner pages. Add the missing trusted authority/admission and private
run setup; do not extend or reset Decision037 or build a named Atlas/Maya pipeline.

Three blockers prevent normal operation:

1. **Technical and authority:** ordinary HQ lacks an operational investment adapter and a
   private scheduled paper audience. A separate owner policy must authorize any existing-credit
   consumption. Included-only guarantees remain unestablished.
2. **External evidence and technical:** no reviewed US$0 price source is fully qualified for
   this project's access, storage and financial semantics. The current adapter is fixture-only;
   operational action intake is absent. Public rights are an additional independent gate.
3. **Methodology and acceptance:** delayed opening-effective fills conflict with the stricter
   timing instruction in HQ-READY-01. A new live method requires owner approval, implementation
   and two actual elapsed private sessions; synthetic tests cannot meet these gates.

Fallback: implement/test the same HQ path with deterministic fake transport and clearly
synthetic evidence. A later genuine synthetic-data trial can prove employee orchestration
under separate model authority, but cannot qualify live market data. Strict metered API
execution is comparative only and presently unauthorized.

Decision037 is closed at **4/4 consumed**, three genuine settled turns, zero future releases.
Its **68,728 reported tokens and $0.00425440 partial API-equivalent estimate** do not establish
actual purchased-credit or Pro-allowance consumption. The original failed reservation has
unverified usage and is not priced as zero. Preserve the
[final historical acceptance](../validation/investment/INV-CREDIT-FINAL-ATLAS.md) unchanged.

## 2. Evidence vocabulary and current-state audit

Every capability below has an evidence class and a readiness status. **S** = verified in
current source; **T** = verified through accepted tests, not rerun here; **G** = genuinely
exercised privately; **E** = external primary documentation checked 2026-10-11; **P** = inferred
or proposed; **B** = unresolved/blocked. S/T never imply operational or Linux/live acceptance.
A capability can be implemented and verified generally while its investment integration is
only synthetic. Source links refer to the audited revision; symbols name the exact boundary.

| Capability | Current source/evidence | Class and operating status |
| --- | --- | --- |
| Persistent workers, roles, hierarchy and bindings | [Company](../../src/control/company.ts), [runtime contract](../../src/runtime/adapter.ts), [architecture](../architecture/SYSTEM_ARCHITECTURE.md) | S/T: implemented and verified in the core. G: pilot used authentic existing identities in disposable workspaces. No ordinary HQ investment proof. |
| Strategic mandate and delegation | [Mandates](../../src/control/mandates.ts), `convene_working_group`; [team](../../src/control/investment-team/service.ts), `previewWithin` | S/T: generic mandate operation exists. B: investment preview rejects mandate-bound groups; generic convening reserves 24 turns. Autonomous mandate-to-investment team formation is not implemented. |
| Conversations, groups, original evidence and independent return | [Conversations](../../src/control/conversations.ts), [Discussions](../../src/control/discussions.ts), `progress`, `enqueue` | S/T: participant isolation, authentic reads, facilitator choices, draft→independent review→final synthesis. G: Decision037 proved asynchronous historical reasoning only. |
| Scoped paper team and financial tools | [team service](../../src/control/investment-team/service.ts), [tool schema](../../src/runtime/investment-team.ts), [INV-08](../validation/investment/INV-08.md) | S/T: implemented, synthetically verified. B: no genuine proposals/reviews/submissions in the completed pilot. |
| Runtime/model/authentication | [CodexRuntime](../../src/runtime/codex.ts), [credit confinement](../../src/runtime/credit-policy.ts), [account verifier](../../src/runtime/credit-account.ts) | S/T/G: pinned0.157.0 genuine confined pilot. B: `runSubscriptionInvestment` only accepts exact pilot; strict `runBoundedInvestment` is absent. No ordinary-run fallback. |
| Usage and estimates | [AIUsage](../../src/control/usage/service.ts), [tokens](../../src/domain/usage/tokens.ts), [pricing](../../src/domain/usage/pricing.ts), [methodology](AI_USAGE.md) | S/T/G: genuine completed token reporting and partial reference estimates. B: actual attributable credits/quota unavailable. |
| Activity reservations and concurrency | [InvestmentActivity](../../src/control/usage/activity.ts), [policy](../../src/domain/usage/policy.ts), [Dispatcher](../../src/control/dispatcher.ts) | S/T: 8/rolling24h,24/run,1 investment,2 global; claim and usage are transactional, clock high-water persisted. G: pilot reservations. P: per-worker operational caps and new authority. |
| Deadline, interrupt, retries and settlement | [runtime](../../src/runtime/codex.ts), [RPC](../../src/runtime/rpc.ts), [pilot authority](../../src/control/usage/pilot-lineage.ts) | S/T: absolute deadline, finite interrupt/kill, no replay on unknown. G: successful settled turns, not real timeout/crash. B: local stop cannot cap provider billing or hidden retry work. |
| Schedule, restart and owner controls | [InvestmentLoop](../../src/control/investment-loop/service.ts), [company clock](../../src/control/company-clock.ts), [INV-09](../validation/investment/INV-09.md) | S/T: finite research/cutoff/open/expiry/mark occurrences, atomic queueing, real process-kill and short elapsed timer tests. B: no two elapsed genuine market sessions. |
| Instrument identity | [OpenFIGI adapter](../../src/control/market/openfigi.ts), [identity](../../src/domain/investment/identity.ts), [INV-06](../validation/investment/INV-06.md) | S/T plus real non-inference identifier probe. B: no price, listing/sector/action completeness from FIGI alone. |
| Evidence/provenance and rights | [MarketStore](../../src/control/market/store.ts), [normalization](../../src/domain/market/normalize.ts), [validation](../../src/domain/market/validation.ts) | S/T: immutable observations, corrections and separate use rights. B: external price/use qualification missing. |
| Source collection | [collector](../../src/control/market/collector.ts), [fixture adapter](../../src/control/market/fixture-adapter.ts), [market types](../../src/domain/market/types.ts) | S/T: bounded collection/rechecks; only `synthetic-json-v1`, loopback fixture origin. Live price adapter not implemented. |
| Calendar/open/close | [calendar](../../src/domain/market/calendar.ts), [calendar tests](../../test/market-evidence.test.ts) | S/T: finite2026 New York scheduled reference, DST/holidays/early closes. B: operational freshness/emergency closure verification and live field semantics. |
| Frozen run/capital/risk | [simulator](../../src/control/investment.ts), [policy](../../src/domain/investment/policy.ts), [types](../../src/domain/investment/types.ts) | S/T: immutable synthetic `inv05-v1` configuration, exact initialization time. P: trusted normal-HQ run preview/consent/create. Owner capital/universe/benchmark remain unselected. |
| Proposal, review, submit, order and rejection | [team service](../../src/control/investment-team/service.ts), [reducer](../../src/domain/investment/reducer.ts), [INV-05](../validation/investment/INV-05.md) | S/T: authenticated facade, revision-bound independent review, guarded cash/share reservations, expiry and durable rejections. G: no pilot paper action. |
| Cash/positions/valuation/continuity | [accounting](../../src/domain/investment/accounting.ts), [valuation](../../src/domain/investment/valuation.ts) | S/T: fixed-point books, matched marks, missing values null, append-only restatements and effective-time history. B: no live marked portfolio/two-session proof. |
| Corporate actions and benchmark | [reducer](../../src/domain/investment/reducer.ts), [market admission](../../src/domain/market/admission.ts), [loop intake](../../src/control/investment-loop/service.ts) | S/T: raw-price split/dividend/benchmark arithmetic; unsupported events block. B: action normalization/admission has test callers only; loop intake is prices only, no operational payment/action reconciliation. |
| Replay and durable financial recovery | [simulator replay](../../src/control/investment.ts), [INV-05](../validation/investment/INV-05.md), [INV-09](../validation/investment/INV-09.md) | S/T: journal/checkpoint/receipt validation, concurrent reservations and real process-kill tests. B: production backups/restoration and independent custody are separate. |
| Private owner controls/Attention | [team UI](../../public/investment-team.js), [run UI](../../public/investment-run.js), [usage UI](../../public/usage.js), [Attention](../../src/control/attention.ts), [HTTP](../../src/http/server.ts) | S/T: existing private surfaces/browser tests. P: new mode, frozen run setup and per-worker budgets on these pages. No new dashboard needed. |
| Outbox, signed publisher and receiver | [publication service](../../src/control/publication/service.ts), [INV-07](../validation/investment/INV-07.md), [INFRA-02](../validation/investment/INFRA-02.md), [INV-03](../validation/investment/INV-03.md) | S/T: signed synthetic integration and receiver actual-host acceptance; stopped/default disabled. B: live rights, grant, audience and release authority. |
| Canonical/public mapping | [team projection](../../src/control/publication/team-source.ts), [simulator projection](../../src/control/publication/simulator-source.ts), [contract](../../contracts/investment/v1/PROTOCOL.md) | S/T with explicit B: standalone price evidence, multiorder decisions, distinct benchmark-only actions, mixed-effective historical prefixes. |
| Public Asymmetri showcase | [INV-04](../validation/investment/INV-04.md), [receiver runbook](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md) | S/T: source/local synthetic UI; existing installation remains a historical stopped private receiver. No current server inspection or public deployment claimed here. |

## 3. Runtime feasibility and recommendation

### Option A — enforceable included-only operation: BLOCK

S: [package pin](../../package.json) and `SUPPORTED_CODEX_VERSION` are **0.157.0**. Decisions036/037
and source reject API-key/custom-provider fallback. The supported pinned account observations
establish current eligibility, not no-credit execution throughout a turn. The pinned adapter
cannot suppress uncertain built-in retry consumption; optional activity capability remains absent
except for the exact pilot. A newer unversioned manual does not establish a changed pinned contract.

E: Current [pricing](https://learn.chatgpt.com/docs/pricing) documents credits continuing work after
included limits. [App Server](https://learn.chatgpt.com/docs/app-server) documents thread/turn,
interrupt and account/usage reporting; [configuration](https://learn.chatgpt.com/docs/config-file/config-reference)
documents provider retry knobs but establishes no included-only billing switch applicable to this
pin. The newer [ChatGPT-plan integration](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server)
is a different authentication/provider configuration, not evidence that existing HQ is entitled,
compatible or included-only. Its [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)
exclude `max_output_tokens` on that route. All accessed 2026-10-11.

**Conclusion B:** no supported enforceable included-only path was established for the selected
runtime. Do not upgrade, use an undocumented switch or repeatedly probe models to search for one.
Reconsider only on a specific versioned documented capability plus non-inference contract tests;
genuine validation would still need separate authority.

### Option B — finite owner-approved existing credits: preferred PROPOSAL

P: add a new policy (working name `credit_approved_finite_hq`) and a separate `private_paper`
audience. Neither is an alias for `credit_approved_private_pilot` or `private_synthetic`.
Freeze consent to one HQ/run/group, exact existing workers and responsibilities, exact model,
reasoning, service tier, CLI version, authentication/account routing, evidence mode, paper
permissions, calendar sessions and expiry. Account fingerprints remain private. No authority
flows from a charter, imported message, migration, test harness or a successful previous turn.

| Control | Reuse / smallest extension | Required behavior |
| --- | --- | --- |
| Explicit approval/expiry | New immutable owner envelope and exact preview digest on existing private HTTP boundary | Inert draft until trusted consent and separately enabled runtime authority. Expiry checked at claim, admission, tool delivery and completion. |
| Nonrefillable budget | Reuse `InvestmentActivity`; new authority journal outside rollbackable company data | Permanent reservation before possible provider effect; restored/copied HQ state cannot recreate allowance or one-use admission. Missing authority holds. |
| Model/authentication | Reuse pinned runtime, account verifier and confinement helpers under a new capability | Immutable scoped AI profile; do not edit worker global preferences; no model/provider/API-key fallback. Startup notification triggers authoritative reread; unresolved/change interrupts. |
| All turn kinds | Existing typed discussion ownership | Opening, response, facilitation, draft, independent review, finalization and any separately resumed turn each reserve once. Broker inference, peer continuations, coordinator turns and delegated Tasks stay denied. |
| Local limits | Shared dispatcher, worker exclusion, activity high-water and loop counters | ≤8 rolling24h across investment runs; ≤24/run outer ceiling; 1 investment and2 global slots. Unknown investment settlement holds the investment slot. No new timer service. |
| Trial recommendation | New per-worker caps and budget-aware discussion progression | Proposed10 total, ≤8 rolling24h, ≤7 per cycle/New York day and ≤7 cumulatively per worker in the run, ≤5min/turn. These are maxima, not permission or expected consumption. |
| Completion reserve | `Discussions.enqueue/progress`, loop preview | Reserve future-session participation and final three turns before discretionary debate. Reject an infeasible preview, then hold/escalate without exceeding limits. |
| Stop/deadline | Existing abort, interrupt and RPC termination | Absolute deadline is min(reservation+5min, scope expiry, applicable stage cutoff); retain six-second settlement grace and one-second kill fallback. Stop does not guarantee upstream cessation. |
| Usage/settlement | `AIUsage` and immutable invocation records | Deduplicated authoritative response totals, incomplete/retry coverage, original pricing; permanent consumed count. Missing/conflicting required telemetry or unknown settlement blocks continuation. |
| Automatic continuation | Normal dispatcher after settled outcome | Continue only if current authority, verified identity, complete required usage, future reserve and financial/data health pass. No manual employee-by-employee release and no uncertain replay. |
| Reload/billing | Fresh owner evidence before activation | Explicit reload-OFF confirmation and timestamp, renewed when stale or changed. Default proposed validity24h at each admission; expiry holds future sessions until new authentic confirmation. Renewal is append-only, bound to the same account/run/immutable authority; no authority replacement, consumption reset or expiry extension. No invented timestamps or API verification claim. |

Two workers/two sessions need at least **seven turns** under current progression: two openings
and a facilitator, then next-session facilitation, draft synthesis, independent review and final
synthesis. [Loop preview](../../src/control/investment-loop/service.ts), `preview`, reserves the
corresponding floor; [discussion constants](../../src/domain/discussions.ts) reserve three final
turns. Ten permits one additional two-speaker response/facilitation round. Exact calendar and
rolling-window feasibility must be checked; ten/run does not make all ten eligible in24hours.
Seven is a discussion floor, not a guarantee of two complete typed paper decisions: proposal and review executions must settle before subsequent review/submission. Test that exact progression, not only synthesis. If extra review/revision is needed, finish with an explicit incomplete result or seek a new
separate authority, never silently grow the existing envelope.

**Consumption limit:** turn counts, local deadlines and reload-OFF do not enforce an exact
provider-side token/USD/credit ceiling. Internal provider retries can consume additional credits;
processing may outlive local cancellation. Shared-account balance changes are not attributable
billing receipts. The owner must explicitly accept that residual risk before genuine execution. For the new activity mode, reconcile `InvestmentLoop.settle/unknown` with common usage: positive tokens must not be classified against zero strict token/cost ceilings, and partial reference pricing alone does not mean unknown provider settlement. Missing/conflicting required telemetry still holds continuation.
No genuine permission exists today; Decision037's four reservations remain permanently exhausted.

### Option C — metered provider execution: comparative, NOT authorized

E: The [Responses API](https://developers.openai.com/api/reference/python/resources/responses/methods/create)
has `max_output_tokens` including reasoning output. Current [API spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
support organization/project hard monthly limits, but explicitly allow a small excess while
enforcement propagates; alerts alone do not stop traffic. Accessed2026-10-11. These are API-account
controls, not a supported conversion of the current personal subscription into a strict run budget.

P: a distinct trusted Responses adapter could pre-reserve worst-case input/output/tool cost per
request, constrain full input and output, use exact model/rate dimensions, bound tool iterations,
disable automatic retries or reserve each attempted request, serialize spending and never refund
uncertain attempts. No open-ended provider tool loop is allowed. This can enforce a conservative
application budget only after exact billable dimensions and failure semantics are verified;
provider monthly limits alone do not guarantee an exact dollar ceiling. Current strict investment
capability remains unimplemented. New API account/key/billing authority, budget, retention and
model selection are missing and **not authorized**. Create nothing for this comparison.

## 4. US$0 market-source assessment

**E/B at the HQ-READY-01 audit:** reviewed primary documentation established no complete price/action source with
all required project-use rights. Free access does not imply automated, organizational, retained,
derived or public use. The following is the historical qualification shortlist; Decision038 now
selects Yahoo for the owner’s personal private scope. No
market-price request, download, account registration or collector was performed by HQ-READY-01.
All external sources in this section were accessed **2026-10-11 America/Vancouver**.

### Capability, price, timestamps and reliability

| Source and primary documentation | Confirmed free scope/access/coverage | Field/time/action semantics | Limits, continuity and remaining evidence |
| --- | --- | --- | --- |
| Alpha Vantage — [API](https://www.alphavantage.co/documentation/), [free limits](https://www.alphavantage.co/support/) | Free API key;25 calls/day; compact raw daily OHLCV,100 observations. Broad listed-equity coverage; selected US stocks/ETF coverage still requires qualification. | `TIME_SERIES_DAILY` raw as-traded OHLCV; dividend/split endpoints documented. Session date is not first publication time; exact regular opening, adjustment/action/payment completeness unverified. | Full daily history is premium;11–16 symbols consume most daily quota before actions/retries. No proven SLA, correction sequence or outage/backfill recovery. Technically simplest daily candidate; rights and prospective-fill method blocked. |
| Twelve Data Basic — [pricing](https://twelvedata.com/pricing), [API](https://twelvedata.com/docs/mcp), [US equities](https://support.twelvedata.com/en/articles/9935903-us-equities-market-data), [EOD](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data) | Free account/key,8 credits/minute,800/day; US equities included subject to venue/tier coverage. Time series1 credit/symbol. | Choose `adjust=none`; default split adjustment is unsuitable for explicit action accounting. Currency/timezone/MIC metadata. Default realtime venues ≈5% of US volume; full-market historical/EOD after midnight ET next trading day. | Basic lacks dividends/splits endpoints (20 credits/symbol, Grow/Venture+). Preliminary/confirmed EOD differs. Weekend/holiday late arrival can exceed frozen24h expiry; no verified correction/availability chain. Not complete US$0 action source. |
| Massive (formerly Polygon) — [Stocks Basic](https://www.massive.com/stocks), [daily summary](https://massive.com/docs/rest/stocks/aggregates/daily-ticker-summary), [dividends](https://www.massive.com/docs/rest/stocks/corporate-actions/dividends) | $0 Basic account/key;5 calls/minute,two years,EOD US stocks,reference/actions. Plans advertised for individual nonprofessional use. | Daily ticker summary supports `adjusted=false`; separate pre/after-market fields. Dividend dates include ex,record,declaration,pay; daily updates. A date-only pay date is not actual payment time. | Broadest documented free price/action combination examined. Exact opening eligibility, first availability, correction identifiers and selected benchmark still unqualified; no tested outage/backfill behavior. Rights block this project. |
| Nasdaq Data Link WIKI — [official product](https://data.nasdaq.com/databases/WIKIP) | Public-domain historical data,around3,000 US companies; current API/export login requirement. Current no-cost account access/quota unverified. | Historical prices/dividends/splits; not a present-session observation source. | Active support ended2018-04-11; provider discourages investment/analysis use. Historical reuse does not satisfy fresh price/action/benchmark gates. |
| SEC EDGAR — [API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [fair access](https://www.sec.gov/about/developer-resources), [reuse](https://www.sec.gov/files/about/webmaster-faq.htm) | No API key; submissions/issuer metadata/XBRL and nightly bulk. Identified bounded automation; shared10requests/sec maximum, use much less. | Filing publication/acceptance,event,retrieval dates are distinct. CIK identifies filer, not a security/venue. | Qualified supplemental public filing/government-content use; no OHLC, full corporate-action calendar or verified payment feed. Fair-access/outage handling still applies. |
| OpenFIGI — [API](https://www.openfigi.com/api/documentation), [terms](https://www.openfigi.com/docs/terms-of-service), [FAQ](https://www.openfigi.com/about/faq) | Free identifier mapping; no-key25requests/minute,10jobs/request; search/filter5requests/minute. | FIGI identifier strings; exchange code is not proof of MIC/current listing. No price/session/action feed. | Perpetual public-domain dedication for identifiers. Associated metadata requires pinned notice/terms review before expanding existing conservative projection. Prior one-job probe proves mapping only. |

### Rights are evaluated for the actual project and exact output

**Allowed** below means the stated narrow content/use is documented. **Restricted** means a
standard-term condition or prohibition prevents present project qualification. **Unverified**
means no sufficient permission was established and affected use stays blocked. None of these
rows asserts a privately negotiated grant. No provider contact is authorized by this milestone.

| Source/terms | Automation | Internal use and calculations | Persistent storage | Derived analytics | Public display | Redistribution/export/archive | Attribution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [Alpha Vantage §2](https://www.alphavantage.co/terms_of_service/) | API supported conditional on eligible use | Restricted: personal/noncommercial; acting for an association/nonindividual is commercial under terms, needs writing | Unverified for required durable period | Project/public scope restricted; no presumed exemption | Restricted absent applicable written grant | Restricted/unverified, including permanent financial history | Any notice must be fixed in a written permission; a link does not cure restrictions |
| [Twelve Data §§2.2–2.4,12.5,16](https://twelvedata.com/terms) | API supported under plan | Restricted: free-tier commercial use prohibited; internal/non-display only as tier permits | Conditional caching; needed retention duration unverified; deletion on termination | Internal scope conditional; public derived rights unverified | Restricted without express permission/tier | Redistribution restricted; required permanent archive not established | Preserve required provider/exchange notices if a permitted scope is later established |
| [Massive §§5,8](https://massive.com/legal/market-data-terms-of-service) | Documented API, use-specific restrictions | Restricted business/non-display use absent license/writing | Retention during term unverified; deletion required on termination/restriction | Restricted creation/dissemination absent applicable permission | Restricted | Restricted; permanent archive conflicts with deletion obligation | Provider/exchange notices are additional to, not substitutes for, permission |
| [WIKI product](https://data.nasdaq.com/databases/WIKIP) | Current account route unverified | Allowed historical public-domain content | Allowed historical content | Allowed historical content | Allowed historical content | Allowed historical content; never label current | Preserve provenance and obsolete-data disclosure |
| [SEC reuse](https://www.sec.gov/files/about/webmaster-faq.htm) | Allowed subject to fair access | Allowed public filings/government-created material | Allowed same content | Allowed same content | Allowed same content, no market-price claim | Allowed same content; third-party non-filing images/marks not covered | Original issuer/filing/time provenance; do not imply SEC endorsement |
| [OpenFIGI terms](https://www.openfigi.com/docs/terms-of-service) | Allowed within API limits | Allowed identifier strings | Allowed identifier strings | Allowed identifier strings | Allowed identifier strings | Allowed identifier strings | Preserve mapping provenance; review metadata MIT notices separately |

**Historical recommendation P — superseded for primary-source selection by Decision038:**
HQ-READY-01 recommended qualifying Alpha Vantage first, with Massive as an alternative. The owner
has now selected Yahoo Finance with `yfinance`; focus HQ-READY-03 on that path. The owner reports
verbal personal-use permission from Yahoo, not independently verified writing or unrestricted
automated/public rights. Assess automation and retention for the exact private use separately.
The historical organizational/public-use analysis above must not be treated as an assessment of
this newly specified personal scope. Source/field/method qualification and public release remain
separate gates. SEC/OpenFIGI remain possible narrowly scoped supplements, not silent replacements.

Separate outcomes: (1) permitted private observation can proceed only after access/internal/
retention checks pass; (2) public or derived display requires its own exact field permission;
(3) unknown/prohibited fields stay blocked; (4) independently authored synthetic data can support
a labelled public demonstration only under separately approved publication, never a live-data claim.
Reducing public display does not cure an internal-use restriction. Holdings, fills and a single
benchmark return series can reveal prices; do not assume they are harmless derived outputs.

### Qualification record and ingestion contract — proposed

Before any future data call, freeze source identity/URL/terms version/access date, approved
project/account/use, US$0 tier, exact instruments/venues/currency, endpoint and fields, raw/adjusted
semantics, delay, first-availability meaning, bounded requests/retries/history, correction rules,
retention/deletion horizon, public fields and required notices. Unverified fields remain denied
in the existing eight-use rights policy. Record no key or account identifier in public docs.

Preserve provider record/version, original bytes hash, event/session timestamp, publication time
if known, first retrieval and normalization time. Unknown availability stays null; first retrieval
is a conservative local knowledge bound, not fabricated provider publication time. Repeated
retrieval never refreshes an old observation. Exact duplicate is idempotent; changed data is an
append-only correction with predecessor and affected results. Recheck authority/rights after I/O.
Use bounded backoff, no provider/account rotation, no paid fallback and no silent alternate source.
No source SLA or complete action coverage has been demonstrated by reading documentation.

## 5. Time, fills, actions and valuation

### Existing method versus requested restriction

S/T: `inv05-v1` requires a committed decision/order before the frozen cutoff (normally30minutes
before the target open), then permits delayed processing of its verified raw opening. Inventory
and fill effects are dated to `observation.marketAt`; journal processing time remains distinct.
The [simulator regression](../../test/investment-simulator.test.ts) explicitly processes a14:30
opening at20:00 after19:59 availability. [Accounting](../../src/domain/investment/accounting.ts),
`trade`, and [simulator](../../src/control/investment.ts) implement that accepted synthetic method.
[Reducer](../../src/domain/investment/reducer.ts) separately rejects decision evidence unavailable
or unretrieved at cutoff. Thus protection against hindsight decisions exists, but it does not
satisfy the stricter new ban on retroactive opening fills first known after cutoff.

**B:** an actual opening is unknown before it occurs. Do not claim that a daily bar fetched later
was available for an earlier decision or that the modeled fill was an executable real order.
No wording change can resolve this mismatch. Preserve Decision029/031 and old tests; do not
silently amend their method or enable observed mode.

**Proposed owner choice T1 (recommended):** approve a distinct prospective method for a future
run. Lock decision, independent review, guard and quantity before a subsequent eligible **new**
raw observation. Use its qualified price with explicit modeled slippage; effective execution time
must be no earlier than actual eligible observation/processing, with freshness and session rules
frozen in advance. Old historical opens/closes cannot masquerade as current quotes. This requires
a qualifying quote/trade field and changes to reducer/accounting/benchmark/valuation, not merely
renaming a timestamp. It remains a simplified paper execution model, not demonstrated brokerage
fillability. No source presently qualifies it.

Alternative T2: keep the entire trial synthetic, labelled with the existing `inv05-v1` method.
This is the default for HQ-READY-02. An owner could separately reconsider delayed locked-next-open
simulation, but doing so requires an explicit versioned amendment to the stricter request; this
plan neither chooses nor authorizes it. Live fills remain blocked until one exact method is approved.

| Timing/financial issue | Required future behavior |
| --- | --- |
| Exchange timezone/DST | `America/New_York` via versioned timezone/calendar; UTC persistence; Vancouver only a display conversion. Scheduled regular09:30–16:00ET, explicit early closes; never fixed UTC offsets or weekdays-only logic. Verify official [NYSE calendar](https://www.nyse.com/trade/hours-calendars) (accessed2026-10-11) before selected dates. |
| Holidays/emergency closures | Frozen qualified calendar covers all selected dates and finite expiry. Unknown closure/halts block affected work; append approved calendar revision without replaying completed occurrences.2026 reference is not a perpetual calendar. |
| Open/close observations | Provider-defined field and venue must be exact. Retrieval after open does not prove regular opening auction semantics. Close availability may lag the session. No same-day close known before decision cutoff. |
| Decision eligibility | Both publication/availability when known and first retrieval precede cutoff; bound research packet by source event/publication too. Reject future sessions and unverifiable timestamps. |
| Delayed/late/missing/stale data | Finite pending/backoff then expire; no stale substitute/favorable hindsight/paid source. Missed research is retained, not backdated. Friday/holiday EOD delays must fit the actual frozen expiry or fail. |
| Splits/dividends | Raw prices plus explicit exactly-once actions. Freeze ex/effective/payment semantics; date-only payment is not an invented instant. Preserve basis/fractions/receivables; unsupported or uncertain actions block new risk and mark valuation uncertain. |
| Benchmark | Separate equal initial capital, exact ETF identity (not the index), cash/residual units and raw marks. Existing next-open allocation/reinvestment cannot be carried into T1 unchanged; approve matching prospective funding/reinvestment times and costs. |
| Valuation | Match portfolio and benchmark session/field/delay convention; partial marks produce null comparable return. Preserve last-good time; no fake zero profit/loss. Cash/holdings carry forward through journal, not model prose. |
| Corrections | Preserve original observations, fills, decisions and journals; append correction/valuation revisions and downstream return/drawdown restatements. No replacement favorable fill or erased loss. |

Observed prices, modeled fill prices and simulator-generated valuation are separate typed records.
Risk limits apply at admission and fill with pending exposure; market moves can exceed them.
Proposed100,000USD/SPY/15%position/30%sector/10%drawdown values remain unapproved historical
recommendations. The owner must explicitly choose capital, security/benchmark IDs, sectors, horizon,
fees/slippage and allowed actions; a small trial may choose a smaller universe. No leverage,
shorts, real brokerage, taxes or actual settlement claim is introduced.

## 6. Normal HQ owner and employee workflow — proposed

Use existing **Investment team**, **Investment run**, **Activity → Work sessions → Usage & cost**, worker
inspectors and **Owner Attention**. No additional operational dashboard or service is needed.

1. Owner enters a broad or specific mandate/charter and chooses eligible existing employees,
   facilitator, independent reviewer and proposer/submitter subsets. Suggest responsibilities
   without changing global roles/hierarchy. The first packet uses this owner-selected group;
   autonomous strategic coordinator/team formation remains explicitly deferred because its
   executions do not inherit investment admission today.
2. One trusted preview freezes run configuration, source/evidence mode, responsibilities,
   runtime policy, two exact future sessions, per-worker/run limits, expiry and paper permissions.
   Show all authority and expected required-turn reserve. Consent binds the exact revision.
   Trusted run creation selects its actual start instant atomically and records initial cash-only
   valuation, hash and idempotent receipt; do not backdate initialization to satisfy the simulator.
3. Until separate genuine runtime authority exists, status is **Awaiting runtime authorization**.
   A migration or UI selection cannot enable a real adapter. Synthetic tests use explicit fakes.
4. At an eligible occurrence the normal dispatcher reserves work. Existing group participants
   read the permitted packet, contribute independently and choose useful follow-ups. Review may
   agree, challenge or return a recommendation for revision; no required conclusion or named script.
5. The scoped proposer records narrative, alternatives, risk, invalidation and exact evidence.
   A different authenticated reviewer reviews that exact revision. The selected submitter can
   submit only allowed HOLD/BUY/SELL within the frozen envelope. The frozen owner envelope authorizes only its permitted paper submissions; employee speech never expands it. Optional per-order human approval is not implemented in this path and is deferred unless separately scoped.
6. Trusted code validates orders, records fills/rejections/expiry, computes books/risk and
   attaches outcomes to next-session context. HOLD requires no trade. Missing data or disagreement
   can yield no-trade/incomplete outcomes. Do not force a BUY/SELL to demonstrate collaboration.
7. Owner sees next permitted session, original evidence, contributions/review, cash/holdings,
   pending orders/approvals, rejected/blocked reasons, reserved/consumed/remaining turns by worker,
   actual reported tokens, partial reference cost and unknown settlement. Finite expiry stops work.

### Operating state machine

This is a proposed UX/control model mapped onto existing scope/loop/occurrence states, not a
claim that these exact enum strings already exist.

| State | Entry/next transition | Authority effect |
| --- | --- | --- |
| Draft | Build preview → exact owner consent | Zero model/data/paper authority |
| Awaiting gates | Missing runtime/source/method/host approval → explicit evidence/approval | No provider admission; show each blocked gate |
| Armed/waiting | Gates pass; future finite occurrence → due eligible work | Trusted clock only, zero idle model calls |
| Research/review | Claimed reserved worker → settled evidence/review/decision | Every turn charged to same run; only scoped tools |
| Pending financial stage | Valid HOLD/order → eligible observation/validation | No model polling; deterministic bounded intake and simulator |
| Valued/waiting next session | Journal/valuation/context committed → next selected session | Same balances/history/budget; no reset |
| Blocked/uncertain | Missing data, invalid rights, conflicting usage, unknown provider or journal fault | No new risk/model replay; retained receipts and Attention |
| Paused | Owner investment pause | Hold new work, interrupt active scoped runtime, cancel pending orders; release cash/share reservations exactly once; retain fills, consumed model-turn reservations and uncertainty |
| Stopped/expired/completed | Owner terminate, expiry, exhausted allowance or final session | No new inference/orders/schedule extension; preserve terminal reason and all history |

Global model pause and investment pause differ: global pause holds new model dispatch; explicit
investment pause also cancels pending paper orders and signals active scoped runtime. Stop ends
future run work, including valuation under the existing loop contract. Deterministic expiry cleanup
may finish already-authorized pending-order cleanup without a model. Resume needs unchanged/current
authority, known settlement, valid future occurrences and healthy financial/data state; no old
orders, missed sessions or exhausted allowances revive. A new run is not a budget reset mechanism.

## 7. Recovery, uncertainty and resources

P: preserve the existing authority/usage boundary and extend it with a separate service-owned
finite-HQ authority journal. One fixed canonical authority store per HQ installation is outside
ordinary company restore paths; it binds immutable HQ/run identity, consent and cumulative
reservations, monotonic clock high-water and one-use admission. External authority owns run/worker/rolling counts and the active/unknown slot, not only a run total. It must not accept a worker-,
request- or copied-manifest-selected path. Do not write to Decision037's private authority store.

Reserve there before possible provider effects and before treating a local claim as usable;
local rollback may waste an allowance but cannot refund it. Recheck current stop/model/auth
immediately before `turn/start`. Single service ownership plus authority locking prevents two
processes admitting the same claim. Persist consumed reservation even if startup fails. Any
crash after possible admission without authoritative terminal evidence is permanently unknown
for replay purposes; show partial telemetry, keep the investment concurrency fence and stop.
A confirmed late receipt may add evidence, never retroactively authorize a replacement turn.

Restore reconciles company usage/claims against the authority high-water before dispatcher startup or enabling adapters. Joint restoration of old authority and company snapshots requires independently retained monotonic custody evidence; without it, stay stopped.
Restored queues alone cannot start. Missing/mismatched/corrupt authority fails closed; no automatic
reconstruction from older backups. A privileged administrator can replace all local stores; hashes
are corruption detection, not protection against that administrator. Independent backup custody,
restore procedures and explicit owner reauthorization remain operational requirements. A new
run/instance cannot silently avoid global rolling or unresolved-provider fences.

Reuse deterministic SIGKILL/fault tests around reservation, admission, callbacks, financial stage
commit and stop. Replay must reproduce cash/positions/journal hashes; it must not replay provider
effects. Rollback means disable the new capability, preserve additive data/receipts, and restore
compatible executable code only after schema compatibility review. Never restore an old database
to regain budget or erase paper losses. No downgrade may reopen Decision037.

Resource requirements: existing Node/SQLite and pinned Codex, one lightweight company clock,
1 investment invocation within2 shared model slots; no extra worker daemon/database service.
Source development uses one writer worktree and serial focused tests. Inspect disk/CPU/RAM and
other sessions before build/browser/Linux work; no iPhone/native work or model-polling schedule.
At HQ-READY-01 preflight the Mac had ~17GiB free, not an operational capacity certificate.

## 8. Future private trial acceptance — not execution instructions

The first genuine trial is owner-private. Require a new exact authorization specifying employees,
synthetic versus qualified observed evidence, approved capital/universe/benchmark/risk/method,
model/authentication, turn limits, local deadline, two actual selected future exchange sessions,
expiry, permitted paper actions, host, recovery point and reload-OFF evidence. Ten turns is a
proposal, not an extension of Decision037. Public publication remains denied throughout.

**Seven-turn workflow floor does not prove meaningful reasoning.** If budget/timing cannot support
independent contributions, challenge and outcome review, acceptance is incomplete; no scripted
filler, fabricated voice, forced disagreement or forced trade can repair it.

| Acceptance ID | Required evidence | Classification and failure behavior |
| --- | --- | --- |
| H1 — consent/setup | Exact consent/configuration hashes; same worker IDs/roles; initial cash-only journal; source rights and selected schedule | Deterministic setup first; later real owner approval. Missing values block start. |
| H2 — due wake and idle | Actual timestamps/occurrence/request IDs from normal scheduler; idle counter remains unchanged | Two distinct **real elapsed** scheduled exchange sessions with intervening evidence. Fake clocks or immediate calls cannot pass. |
| H3 — evidence eligibility | Original record hashes/read receipts, market event/availability/retrieval and research publication/cutoff times | Fresh eligible evidence or explicit unavailable-data state. Never count old retrieval as fresh. |
| H4 — genuine employees | Provider execution identities, settled original contributions, full source reads/citations, independent review and response to review | Genuine only after separate approval; deterministic transcript fixtures prove tool contracts only. Preserve dissent/continued HOLD. |
| H5 — decision/financial path | Attributed proposal/review/submission receipts, guards/limits, journal and modeled fills or HOLD/no-trade | Fake tests must cover HOLD, valid BUY/SELL, rejection, expiry and no trade. Genuine chosen outcome is unconstrained; HOLD twice can pass orchestration while genuine order handling remains unexercised. |
| H6 — valuation/continuity | Cash, units, basis, receivables, reservations, benchmark and hashes after each stage; next-session context reads | Session2 starts from session1 plus only recorded intervening events. Missing marks/comparisons remain null. No new capital/history reset. |
| H7 — controls/recovery | Pause between settled work, normal restart between sessions, stop after final stage, retained receipts/fences | Do not deliberately interrupt a genuine provider just to test uncertainty. Fake crash cases establish adverse-path controls; a naturally uncertain real turn stops the trial. |
| H8 — consumption | Every reservation and execution, authoritative reported usage/completeness, original pricing, duration and terminal settlement; any attributable provider billing evidence | Actual credit/Pro attribution can remain unavailable and must say so. Two-session scheduling does not establish an exact credit ceiling. |
| H9 — privacy/closure | Zero public channels/grants/jobs/transports for the private lane; final expired/stopped state; no further admissions | No public receiver access or Asymmetri mutation. Archive private transcript/account evidence outside Git. |

Do not claim completion until session2 actually elapses and its journal/context/stop evidence is
reviewed. An installed HQ scheduler owns any future approved wake; a Codex chat does not imply
unowned background work. Missing data, market closure or a model failure can make the trial
incomplete; retain the event and request a separately bounded continuation only if the owner
chooses it. No automatic extension or replacement allowance.

If live rights/method remain blocked, a separately approved **genuine-employee, synthetic-data,
real-elapsed-session** trial may exercise exactly these orchestration controls with clearly invented
intervening observations. It does not pass the live-data, live-action completeness, financial
methodology, public-performance or official-launch gates.

## 9. Private readiness versus publication/deployment gates

| Gate | Private synthetic HQ trial | Qualified observed private trial | Public showcase/release |
| --- | --- | --- | --- |
| New runtime policy/owner approval | Blocking before genuine turns | Blocking | Blocking |
| HQ private audience/setup and budget-aware progression | Blocking source work HQ-READY-02 | Blocking | Reused; no private scope promoted to public |
| Allowed source access/calculation/retention | Synthetic authored packet only | Blocking HQ-READY-03 | Blocking, plus public/derived/export/archive rights and notices |
| Timing/benchmark/action method | Existing labelled fixture method only | Blocking owner versioned choice and source changes | Blocking; precise public disclosures |
| Actual two elapsed sessions/history | Blocking genuine orchestration acceptance | Blocking genuine observed trial | Required predecessor, not launch authority |
| Isolated Linux, service/auth/secrets, backups/restore | Blocking on selected trial host before genuine activation | Blocking | Revalidate exact release/host and independent custody/retention |
| Canonical v1 mapping/signing/receiver | Not a private execution dependency | Not a private execution dependency | Blocking selected cases: price evidence, multiorder, benchmark-only actions, historical prefix |
| Public audience/consent, resource/capacity/ingress | Prohibited | Prohibited | Blocking explicit approval, signed publisher/receiver, reconciliation and load acceptance |
| Asymmetri website/Ask/INV-10–12 | Separate tracks | Separate tracks | Separately authorized; synthetic UI does not complete genuine Ask or launch |

[Decision030](../decisions/decision_030_defer_ubuntu_migration.md) retains the current unsupported
Ubuntu22.10 exception, reviewed before deployment/public exposure; no OS migration is authorized.
Before a later release, inspect current host inventory, Node22/native SQLite compatibility,
authentication/secrets, least privilege, resource limits, CPU/RAM/swap/disk, preservation of all
sites, independently held backups with tested restoration, rollback and exact revision. Prior
receiver Linux/TLS tests are historical evidence, not present server verification. Current backup
custody must be reestablished; historical archive verification does not undo the later documented
backup deletion. Do not reinstate cancelled RECOVERY-01.

Public v1 must be pinned in both repositories and unsupported mappings resolved or explicitly
excluded in a reviewed public scope. Reconcile receiver generations/current watermarks after
restore, verify signed receipt/read-back and withdrawals, then separately approve audience,
source rights, retention and public disclosures. A private run may never become public by changing
an audience flag after collecting restricted material.

The current [Asymmetri integration map](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md)
was read from remote main on2026-10-11 (blob `67e556815e0b74585a9ce9288a0f802e01fbbdc8`).
It records a concrete consumer compatibility gate: INV-04 expects verified `X-Archive-Visibility`
and optionally bounded `X-Archive-Latest-Cursor`, while the installed INV-03 receiver predates
those headers. Coordinate and test that interface before live website reads. Its older “INV-05
next” navigation is stale; current BotSquad source/accepted INV-05–09 evidence governs HQ status.
The local counterpart checkout was inspected read-only and was behind remote; no counterpart
source or installation was changed.

## 10. Prioritized implementation packets

These packets originated as HQ-READY-01 proposals. HQ-READY-02 is now source-accepted (§12).
HQ-READY-03 below reflects the Yahoo selection; source/fake integration is accepted, while live
qualification and HQ-READY-04/05 operation remain unstarted and separately authorized.

### HQ-READY-02 — finite real-employee HQ runtime, synthetic source acceptance

- **Objective/dependency:** enable an inert normal-HQ private-paper path through existing workers,
  dispatcher and scheduler. Depends on reviewed HQ-READY-01 and owner selecting the prepared prompt.
- **Exact modules:** `src/runtime/{adapter,codex,credit-policy,credit-account}.ts`,
  `src/control/{company,conversations,discussions,dispatcher}.ts`, `src/domain/usage/policy.ts`,
  `src/control/usage/{activity,service}.ts`, `src/control/investment.ts`,
  `src/control/investment-team/service.ts`, `src/domain/investment-team/types.ts`,
  `src/control/investment-loop/service.ts`, `src/persistence/store.ts`, a new additive finite-HQ
  authority/migration module, `src/http/server.ts`, existing `public/investment-{team,run}.js` and
  `public/usage.js`. Preserve pilot supervisors/lineage and canonical contracts.
- **Source changes:** new policy/audience/authority; scoped pinned runtime capability; trusted
  frozen run preview/create; private financial health; per-worker caps and completion reserve;
  existing UI controls. New source files only where authority ownership requires them.
- **Authority/expenditure:** source, fake/local synthetic tests and reviewed integration only;
  **zero genuine BotSquad model turns, zero market-data requests, no deployment or billing changes**.
- **Tests:** exact consent, model/auth drift, all discussion turn kinds, no ordinary fallback,
  synthetic-only, HOLD/valid/rejected order paths, budget closure, private publication rejection,
  clock/cutoff/expiry, concurrent claims, copied/restored DB and crash/stop/no replay. Preserve pilot
  regressions. Check/build/focused suites and affected shared regressions; no real validation scripts.
- **Genuine criterion:** explicitly deferred to HQ-READY-04; source success does not grant it.
- **Recovery/resources:** separate durable authority high-water, failed setup consumes; serial
  fake tests on current resources; preserve migration/rollback evidence and old history.
- **Stops:** any need for genuine inference, live data, production mutation, new spend, pilot
  alteration, unbudgeted execution origin or missing restore fence stops that dependent work.
- **Deliverables/DoD:** reviewed code/tests/validation, private UI walkthrough using fakes,
  disabled-default capability, exact consent contract and next genuine gate. No production grant.
- **Owner decision:** select source-only prompt; policy approval and activation remain separate.

### HQ-READY-03 — Yahoo evidence gateway and prospective method qualification

- **Objective/dependency:** implement the selected Yahoo Finance / Python `yfinance` path behind
  the controlled Financial Data Gateway, reusing02/INV-06 boundaries; qualify supported private
  data and retain explicit gaps. [Full prepared plan](../exec-plans/investment-hq-ready-03.md).
- **Modules:** existing `src/control/market/{collector,admission,store}.ts` and
  `src/domain/market/{types,normalize,admission,calendar,validation}.ts`, a narrow versioned Python
  adapter and typed OHLCV/fundamentals/statement/action records; financial/loop modules only for
  a separately approved prospective method. This is not an implemented live gateway.
- **Source changes:** historical OHLCV, company fundamentals, annual/quarterly statements, splits
  and dividends as available. Preserve original output/source IDs, timestamps, adjustments,
  quality, missingness and append-only revisions. Current/restated data cannot leak into past decisions.
- **Authority/expenditure:** Decision038 settles primary-source selection and records owner-reported
  verbal personal-use permission. Automation/retention scope and each public use are separate.
  US$0, zero models; source coding requires later selection and live probes need exact bounded
  request/use/retention authorization. No production, paid subscriptions or recurring collector.
- **Controls/tests:** conservative aggregate request rate, gateway cache and actual underlying
  library-request/retry accounting, finite deadlines/bytes, 429/403/provider failure, stale/schema/
  missing data, concurrent attempts, lost results and restart. No hidden parallel download or bypass.
  Authored fixtures prove point-in-time decisions, adjustments/actions and private-public separation.
- **Method:** preserve HQ-READY-02 synthetic-only `inv05-v1`. Yahoo history is useful research but
  not automatically valid prospective fill evidence. New observed method/run, benchmark and valuation
  semantics need explicit approval; missing raw/fresh/action evidence leaves execution blocked.
- **Deliverables/DoD:** reviewed inert adapter/gateway, source dossier with reported versus verified
  evidence, deterministic tests and explicit private research/live-fill/public gate dispositions.
  Separately permitted non-model probe receipts may qualify fields; no inferred genuine H1–H9 pass.
- **Stops:** unresolved automation/retention, cost, unbounded internal I/O, unavailable provenance,
  unsupported adjustment/action/time or absent method approval. Continue authorized offline work;
  no indefinite provider search, paid fallback, silent source substitution or public release.

### HQ-READY-04 — private end-to-end paper cycle

- **Objective/dependency:** run/review two actual elapsed scheduled sessions after02, isolated Linux,
  restore and new runtime authority; observed-data variant also requires03 and approved T1.
- **Modules:** normally no new engine; existing run/team/dispatcher/usage/market/simulator surfaces;
  bounded private acceptance harness/runbook and sanitized validation report. Defects return to
  a reviewed source fix before any separately authorized further execution.
- **Planned work:** owner-selected frozen portfolio, original evidence, independent contributions,
  review, HOLD/order, trusted journal/valuation and second-session outcome learning (H1–H9).
- **Authority/expenditure:** explicit fresh authority, proposed10/run,8/rolling24h,7/cycle/day/worker,
  five-minute local turn bound; existing credits risk accepted, reload OFF, no purchases. Approved
  data requests only at US$0. No public transport, real money or recurring run beyond chosen sessions.
- **Tests/genuine acceptance:** deterministic adverse paths precede activation; actual timestamps,
  execution/read/settlement receipts and portfolio continuity establish H1–H9. Fake time cannot
  finish this packet. A genuine HOLD result is valid; unexercised order paths remain labelled.
- **Recovery/resources:** exact release on isolated approved Linux host, private backup/restore,
  normal between-session restart, no uncertain replay; one investment/two total model slots.
- **Stops:** owner stop/pause, scope/reload expiry, missed cutoff, unavailable data, unknown provider,
  quota exhaustion, financial mismatch. Retain incomplete outcome without automatic extension.
- **Deliverables/DoD:** private evidence inventory, sanitized outcome/usage report and independent
  review after both elapsed sessions, permanent finite stop; or precise incomplete/blocked result.
- **Owner decisions:** exact host/revision, employees/model, existing-credit policy, dates/expiry,
  portfolio/evidence/method, paper permissions and recovery acceptance. Synthetic variant explicitly
  leaves live-data gates unsatisfied. No official run or launch follows.

### HQ-READY-05 — publication and launch readiness

- **Objective/dependency:** map exact remaining public needs to existing INV-10 onward; private
  runtime progress does not depend on this packet. Requires the selected scope and new owner request.
- **Modules:** `contracts/investment/v1/`, `src/control/publication/{service,team-source,simulator-source}.ts`,
  publication domain/tests; read-only counterpart review of Asymmetri receiver/vendor/UI/runbooks.
  Any consumer source/deployment work requires its own explicitly selected scope.
- **Planned changes:** pin agreed canonical protocol; resolve selected unsupported mappings or
  reject them; verify archive visibility/cursor header compatibility; exact audience/source-field
  consent, signing/receipt/recovery and release checklist.
- **Authority/expenditure:** documentation/fixtures by default; zero model/data spend and no public
  release. Neither source rights nor deployment permission comes from this packet name.
- **Tests/genuine acceptance:** schema/consumer conformance, signed replay/withdrawal, protocol
  rejection and restoration reconciliation. Later real publication needs separate consent and
  receipts; genuine Ask remains an independent track.
- **Recovery/resources:** preserve installed websites, secrets and receiver state; independent
  backup/restore/capacity and Decision030 review before any later deployment; rollback exact pins.
- **Stops:** unresolved raw/derived/archive rights, missing audience consent, incompatible v1 case,
  unreconciled receiver or unqualified host; no dummy public grant for private operation.
- **Deliverables/DoD:** exact release blockers and reviewed compatible source scope ready for owner
  review, not an activated service. INV-10–12, Ask and website launch remain separately authorized.
- **Owner decisions:** public content/audience/retention, protocol amendment if needed, operational
  OS-risk review, exact deployment and separate activation. RECOVERY-01 remains cancelled.

## 11. Exact owner choices and next step — HQ-READY-01 snapshot

| Proposed choice | Approval needed before dependent effect |
| --- | --- |
| P1 — source work | Select [HQ-READY-02 prompt](../../prompts/experiments/investment-hq-ready-02.md); authorizes code/fakes/review only |
| P2 — finite existing-credit policy | Explicitly accept potential existing-credit/internal-retry consumption and imperfect provider cutoff; freeze exact run/model/account/limits/expiry and fresh reload-OFF evidence before any genuine invocation |
| P3 — portfolio/roles | Select actual workers/responsibilities, capital/security/benchmark IDs, risk/actions, sessions and end condition; no historical illustrative defaults silently selected |
| P4 — data and timing | Approve exact US$0 source rights/request/retention scope and separately versioned T1, or select synthetic-only T2; owner preference cannot override provider restrictions |
| P5 — host/recovery | Select isolated host/revision and accept restore evidence before real trial; production deployment remains a separate approval |
| P6 — public release | Separate exact audience/data/protocol/deployment/Ask approvals; not needed for private synthetic progress |

The **one next executable task** is HQ-READY-02 source implementation. It has exact modules,
authority boundaries and deterministic acceptance in the linked prompt. No further discovery
milestone is required before coding that synthetic private HQ bridge. Its completion must still
say genuine operation is unactivated until P2–P5 and the relevant evidence gates are satisfied.

## 12. HQ-READY-02 implementation checkpoint

The proposal above remains the operational decision record; it does not approve live operation.
The owner subsequently selected its [HQ-READY-02 source packet](../../prompts/experiments/investment-hq-ready-02.md).
The normal-HQ finite runtime, private-paper lane, truthful owner setup, existing scheduler/group
integration and recovery accounting are implemented and exercised with fakes. See
[validation](../validation/investment/HQ-READY-02.md) and
[current readiness gates](INVESTMENT_READINESS.md#hq-ready-02-source-status).

The source template proposes ten turns per run, eight per rolling24h, seven per cycle and
New York day, seven cumulatively per worker in the run, five minutes per turn, and one investment
within two global executions. These are configuration values, not
permission to consume credits. Lower feasible allocations are supported; seven discussion turns
alone does not guarantee two typed decisions. The fake HOLD and BUY/SELL paths use nine turns;
other choices can end incomplete without extending any budget. No employee name or conclusion
is programmed into the runtime sequence.

The local service must retain its independent authority journal and custody checkpoint beyond
ordinary company backups. A restore must reconcile offline before dispatch. Missing/replaced/
corrupt evidence or joint old snapshots disagreeing with custody stay stopped; no repair creates
fresh allowance. Replacing every retained copy as a local administrator remains outside what local
hashes can prove. No operational provision/approval command was executed in this milestone.

## 13. Yahoo source selection and private scope — 2026-10-11

The primary source is now **Yahoo Finance**, using preferred **Python `yfinance`** behind the
implemented, inactive **controlled Financial Data Gateway**. The owner says they spoke directly with Yahoo and
received personal-use permission. Record this as owner-reported verbal permission only: no written
verification, contact identity, call date or unrestricted automated/public grant is established.
[Decision038](../decisions/decision_038_yahoo_finance_private_source.md) and the
[HQ-READY-03 acceptance](../validation/investment/HQ-READY-03.md) govern source-only integration.
Live data remains gated by the [dossier/probe proposal](YAHOO_FINANCIAL_GATEWAY.md).

Private research support and observed paper-execution qualification are separate outcomes.
Fundamentals/statement period end is not publication time; split-adjusted history is not necessarily
raw execution evidence; available dividend history is not guaranteed payment completeness. Keep
first-retrieval knowledge, provider availability and later corrections distinct, and block unsupported
financial effects. Reuse trusted source policy and finite collection receipts; workers gain no
arbitrary network, Python or public-export authority.

The current selection does not fetch data, install dependencies, start a recurring collector,
change production or authorize public redistribution. US$0, unchanged synthetic HQ-READY-02
acceptance, permanently exhausted Decision0374/4 and separate genuine/deployment gates remain.
