# Investment objectives and research in HQ

Source capability: `investment-process-v1`, schema 32. This guide does not assert that
the installed HQ has this source. [Validation](../validation/investment/INVESTMENT_PROCESS.md)
separates source/browser evidence from deployment and genuine worker acceptance.

## Exact owner action

Open **Investment run** (`/investment-run`) and select the existing book's
**Revise objective and prepare a new finite scope** button. For a new book, open
**Create or renew a persistent portfolio**. Keep **Use the investment process for
this new finite scope** selected.

Set the objective in plain language, for example:

> Evaluate the strongest permitted investments against SPY and cash over the selected
> period. Seek a positive risk-adjusted outcome while preserving the existing risk
> limits. Investigate missing company evidence. HOLD is valid. Review the strategy
> after three eligible all-cash sessions. Do not expand any authority.

An optional percentage target is aspirational, never a promise or an order to trade.
Choose actual future exchange sessions and UTC evaluation dates within the book's
frozen calendar. The bundled calendar currently covers 2026; longer evaluation needs
a separately reviewed calendar/book. Historical results and policies are not edited.

The same form exposes capital, position/sector/minimum-cash limits, order limits,
drawdown attention, simulated commissions and slippage. An existing book rejects
changes to frozen risk, universe, benchmark, employee roles, retention or fill method.
A different benchmark or risk policy therefore requires a separately reviewed book;
the new process currently requires SPY, alongside zero-interest USD cash.

For evidence, choose a 30–180-day price-history lookback (120 proposed), a finite
primary-page allowance, and a finite missing-evidence request allowance. Add exact
company or regulator HTTPS URLs only after checking identity, quality and permission.
Record the review reference/date/expiry and explicitly confirm free automation,
permanent private retention and external model processing. Sources need not support
public release. Each chosen page is requested once per scheduled session. Eight
sources and eight sessions are the maxima, with at most 64 pages and 160 aggregate
chart/page request hashes. The exact preview shows all requests and model bounds.

Select **Preview persistent setup**, inspect the complete policy and then **Save this
setup**. Saving records the specified collection, processing and private retention
consent; it does not approve the independent runtime journal or start work. A revision
creates a future finite scope, not additional turns in an old one. Existing active,
failed or uncertain work must be inspected under its ordinary stop/recovery workflow.
Use the existing independent finite-authority approval and HQ start controls only
for the exact reviewed scope. Do not edit databases, timestamps or spent reservations.

### Retained books with acknowledged usage gaps

A book recovered through a special finite-authority exception may still contain
incomplete historical usage receipts. That history remains incomplete even when a
later bounded legacy session was separately approved and completed. Normal setup
Save and independent ordinary approval both require complete predecessor receipts.
The existing recovery/successor mechanism preserves the old tool envelope and cannot
add the new investment-process tools. Expiry does not remove this restriction.

This applies to the retained production book inspected on October17. Its objective
form can be drafted and previewed, but **the new process cannot yet be saved and
activated on that book through the supported normal route**. A running legacy scope
also prevents a competing renewal until it finishes or is explicitly stopped and
settled. Do not stop that scope, erase acknowledged gaps, create a replacement book,
or reset capital merely to make setup succeed.

The required next implementation is a separately reviewed, one-use process upgrade
that binds the unchanged portfolio head, independent custody checkpoint, predecessor
authorities and already acknowledged exception hashes to the exact new process
envelope. Preparation must remain inert, reject unknown settlement/new gaps/changed
custody/duplicate transitions, preserve every spent allowance, and disclose the
whole-book publication hold. New source permissions, numeric model limits, independent
approval and activation still require the owner's explicit future selection. This
limitation is separate from installing the private HQ interface.

## Which choices need explicit confirmation?

| Choice | Owner confirmation and effect |
| --- | --- |
| Objective, evaluation dates, threshold, history and request limits | Exact setup preview and Save. Old scope remains immutable. |
| Sources, automation, permanent private retention and external AI processing | Explicit source review/checkbox plus exact setup consent; existing Yahoo permission is separately retained. |
| Model/account, finite turn/day/session/worker limits, existing credits and reload status | Existing independent finite journal approval and runtime selection. No new grant from prose or Save alone. |
| Start/resume | Existing exact HQ control after authority checks. Unknown outcomes cannot be replayed. |
| Risk, universe, benchmark or accounting changes | Separately reviewed new book; never an objective-text exception. |
| Publication of new research-derived decisions | Separately reviewed source/derivative permission and Asymmetri integration. Saving this process holds further publication for the book. |
| Deployment/genuine paper trial | Separate bounded operational authorization; source completion is insufficient. |

Ordinary HQ conversation can discuss or draft this objective, but there is no new
investment slash command or chat-to-approval parser. Sending the example instruction
to Atlas does not change policy, grant tools, add model turns, start a Task, permit
publication or spend money. Use the named HQ control for the authoritative revision.

## What the owner sees

The book shows the current objective, configured research, latest decision/session,
cash comparison, strongest alternative, uncertainty, missing requests and next action.
`all_cash` means deliberate zero-holdings/no-pending-orders HOLD;
`retain_investments` means existing holdings are retained; `blocked` or
`research_or_execution_blocked` means the team cannot complete a supported decision.
A blocked stage is not a successful cash decision. Earlier decisions without this process assessment remain `legacy_unclassified`, with their original action/reason preserved; unsubmitted proposals are labelled explicitly. Proposals remain distinct from
independently reviewed submissions, paper orders, fills and valuations.

Three **eligible exchange-session decisions**, by default, trigger the strategy review.
Retries, duplicate ticks, multiple messages and model calls do not increment it. The
next already approved discussion must investigate the strongest alternative, strategy
fit and persistent gaps, then name a concrete next step. If no approved turns remain,
HQ requests one future bounded review session. Review does not compel a purchase.
Known failed reviews remain visible; a new authorized attempt can address them.
Incomplete or unknown provider outcomes remain held for owner inspection.

Missing-evidence requests persist across renewals. A subsequent eligible reviewed
decision can cite current evidence and list `assessment.addressedRequestIds`; this
retains both the request and its attributable response. Until then it remains
unaddressed. Worker context includes the newest eight bounded request summaries and
an omitted count; owner history contains all originals. The owner can select a bounded
follow-up when earlier obligations need attention.

## Research limits and recovery

Charts provide complete bounded daily history, including missing rows and provenance,
not fundamentals or executable quotes. The gateway's generic fundamental schemas do
not make the approved chart-only transport capable of fetching them. Relevant filings,
earnings and material developments use approved primary static pages. Employees must
assess source timeliness and relevance; unknown publication/fiscal times stay unknown.
Only static HTML/text/XML/JSON is supported, with no scripts, authentication, PDF
extraction, redirect following or broad web search. A source may refuse access.

The reader caps response bytes at 1 MiB and retains at most 12,000 extracted page
characters, with explicit omissions. Complete paginated relevant evidence must be read
before citation; the existing discussion retrieval/tool limits still apply. If this
is insufficient, request a specific smaller primary source or separately reviewed
capability. A request itself does not perform I/O. There is no automatic paid fallback.

Known HTTP/type/encoding/size refusals are retained as unavailable. Lost responses or
interrupted wire effects stay uncertain. Attempt budgets are consumed permanently;
restarts never replay a request. Inspect the precise failure first. Known-source
replacement requires an exact future scope and separate approval. An unknown effect
needs reconciliation under the existing fence and cannot be cleared by changing URLs.
The old one-use OHLC continuation does not authorize this new page workflow.

## Reading performance honestly

Portfolio fees and modeled slippage follow the frozen simulator. Existing SPY accounting
uses zero benchmark commissions/slippage and explicit dividend/reinvestment conventions.
The UI labels any deferred benchmark opening and retained amendments. Matched returns
use the first and last **common complete closing marks** in the requested window;
there is no return until two such marks exist. These endpoints may differ from the
requested period. Missing and unmatched sessions remain listed.

The cash baseline is fixed USD capital with zero interest, deposits, withdrawals or
cash fees. Time in cash and average exposure are fractions of available closing
samples, not elapsed hours. Drawdown is closing-mark simulator drawdown, not intraday
risk. Never treat partial coverage or different methods as comparable full-period
results. Original decisions, source records, failed attempts and valuations remain in
advanced private details.

## Bounded next request and unactivated trial proposal

Private deployment and genuine acceptance are separate. No genuine process trial is
authorized by installing this source. For the retained production book, the next
bounded request is:

> Implement and independently review a one-use, append-only process upgrade for the
> existing retained paper book. Preserve all decisions, benchmark amendments, failed
> attempts, consumed allowances and the three previously acknowledged incomplete
> receipts. Bind the transition to the exact current custody checkpoint, portfolio
> head, predecessor authorities and exception hashes. Allow only the explicitly
> reviewed process tools and source policy; retain US$0 incremental market-data
> spending. Do not approve, activate, collect research, call models, change account or
> reload settings, or grant publication authority. Present the exact future sessions,
> numeric limits, source permissions and frozen envelope for separate owner approval.

The following is a planning proposal, not a saved preview, grant or scheduled run:

| Item | Proposed scope / still required |
| --- | --- |
| Book | Existing retained portfolio; preserve capital, history, risk, costs, employees and universe. No replacement book. |
| Session | October 22, 2026, after the separately coordinated October 19–21 legacy sessions. Recheck their actual settlement and available future windows before preparing. |
| Times | Under the existing 60-minute research window and 30-minute cutoff: collection 11:45 UTC, research 12:00, cutoff 13:00, regular open 13:30 and close 20:00. The exact preview must also show close collection, delayed-open processing, valuation and expiry. |
| Research | Propose 120 calendar days of bounded Yahoo daily history for AAPL, MSFT, GOOGL, AMZN, JPM, JNJ, XOM, WMT and SPY, under retained source permission and a separately approved exact request envelope. Research bars are not executable quotes. |
| Company evidence | No primary-page permission selected. Owner must choose exact company/regulator URLs, permission receipts, expiry and numeric request limits; absence or refusal must be reported as a research gap. |
| Objective and evaluation | Owner selects objective, optional aspirational target and evaluation dates within the frozen 2026 calendar. Compare common complete closing marks against SPY and zero-interest cash. One session cannot establish a full-period result. |
| All-cash review | Propose three eligible all-cash decision sessions; no mandatory purchase or automatic extension. |
| Model allowance | **Zero turns currently authorized for this new process.** No new numeric ceiling selected. Legacy allowances are scope-bound and cannot be transferred. Owner must select and independently approve the exact model/account, finite limits and required current attestations. |
| Public output | No new process-derived publication; retain the whole-book producer hold until separate source-rights and Asymmetri review. Ask remains paused. |

If October22 is no longer eligible when the upgrade is ready, prepare a new future
date for explicit review; never replay the missed session. Even after the upgrade,
review the exact preview, Save the inert setup, separately approve its independent
finite envelope and then use the existing activation control. Accept the team's real
HOLD, BUY, SELL or blocked conclusion without prescribing a trade. Retain collection,
decision, independent review, settlement and accounting receipts.

The source does not supply genuine access, rights, account or reload attestations for
the owner. Publication remains held pending the [separate handoff](INVESTMENT_PROCESS_ASYMMETRI_HANDOFF.md).
