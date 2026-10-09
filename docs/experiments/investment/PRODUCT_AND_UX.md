# Product and public experience

**Version:** 1.1 | **Status:** Designed, not implemented | [Guide](README.md)

## 1. Purpose and success

A first-time visitor should understand BotSquad, the team's goal, what is actually running and why the visible result is credible. A returning visitor should see new discussion, evidence, decisions and portfolio changes. Through **Ask BotSquad**, a visitor can also ask a general question or question about a particular transaction and receive a reply from one relevant actual employee. The owner can trace claims to originating work without making HQ public.

The showcase tests persistent identity, delegation, meaningful collaboration, evidence handling, bounded action, review and continuity. Returns are a second scorecard. A rising market, attractive page, many messages or persuasive report does not independently prove organizational capability.

### Draft introductory copy

> **Watch an AI team work. Ask the team a question.**
>
> The BotSquad Investment Team is an ongoing paper-trading experiment. Persistent AI workers research public information, discuss competing ideas, challenge risks, make simulated investment decisions and review what happened afterward.
>
> Its purpose is to demonstrate how BotSquad coordinates accountable, long-running work. Follow the team's published discussions, inspect its research and see how the simulated portfolio changes. Use Ask BotSquad for a general question or an explanation of a specific decision. No real money is invested.

Show the configured investment objective immediately below, not a profit promise. An example is “Seek competitive returns against the stated benchmark while respecting the published risk limits.” Starting capital, currency, start date, methodology version and status come from the run configuration.

Distinguish implemented software, private trial, official paper experiment active, paused and ended. Do not claim “fully autonomous” when the owner intervened, “live prices” when marks are delayed, or learning merely because a retrospective paragraph exists. Do not advertise real employee chat based on canned answers or a disabled UI scaffold.

## 2. Routes and navigation

| Route | Purpose |
| --- | --- |
| `/botsquad/investment` | Current official experiment, or a truthful not-started state; includes Ask panel |
| `/botsquad/ask` | General Ask BotSquad entry, with no transaction/run required |
| `/botsquad/investment/runs/{runId}` | Exact run and archived history |
| `/botsquad/investment/discussions/{discussionId}` | Durable investment-team topic transcript, not visitor chats |
| `/botsquad/investment/artifacts/{artifactId}/versions/{version}` | Exact public investment deliverable |
| `/botsquad/investment/decisions/{decisionId}` | Evidence, decision, order and outcome chain |
| `/botsquad/investment/methodology` | Rules, methods, data rights and limitations |

The main route must not silently replace a losing run with a favorable new one. Trial/demo runs use separate identities and visible labels. No initial fictional numbers on an unstarted official run. Ask conversations have session-owned private routes, not public indexed/shareable transcript pages in v1.

Link from the existing `/botsquad` page and Asymmetri Work navigation. Preserve Motion's `/motion`, `/privacy`, `/support`, `/tutorial`, existing hostnames, tutorial canonical URL, hashes and original-image URLs. This is a scoped addition, not a company-site redesign. Add the necessary Ask privacy/processing notice without replacing Motion's policy.

## 3. Page hierarchy

| Order | Section | Required content |
| --- | --- | --- |
| 1 | Project introduction | Purpose, BotSquad explanation, objective, paper-only notice, configuration and source/methodology links |
| 2 | Experiment health | Team state, last publication, valuation as-of, market state, next authorized review, delays and gaps |
| 3 | Meet the team | Actual participating worker names, scoped responsibilities, status and limitations |
| 4 | Live Investment Desk | Real team discussion/activity, topic navigation, artifact links, pause-follow and new-message count |
| 5 | Ask BotSquad | General question composer, selected real employee, private session conversation, context chips and evidence links |
| 6 | Portfolio and charts | Equity, cash, returns, benchmark, drawdown, holdings and allocation |
| 7 | Decisions and evidence | Buy/sell/hold/rejected proposals, rationale, dissent, sources, artifacts and trades; Ask contextual actions |
| 8 | Research library | All investment-team deliverables, versions and related work; safe withheld/unavailable states |
| 9 | Transaction journal | Immutable fills, rejected/expired/cancelled orders, corrections, filters, export and Ask about this trade |
| 10 | How BotSquad works | Worker, Task, discussion, artifact, decision, simulator, scheduled review and bounded public answer explained plainly |
| 11 | Methodology | Rules, price/data assumptions, interventions, operational scorecard and investment limitations |

Desktop can place the live desk and portfolio overview side by side, with an accessible Ask panel. Mobile keeps purpose/freshness first and makes discussion/Ask discoverable without obscuring portfolio content. Use anchors and progressive disclosure rather than forcing all long conversations open at once.

## 4. Live Investment Desk

Show completed public-audience contributions from real BotSquad investment work and separately styled trusted activity events. Do not stream provider reasoning tokens or fabricate a transcript. “Scout is researching” requires a running execution; idle workers have no simulated typing animation.

Each contribution includes public message ID, author, experiment responsibility, topic, original contribution time, publication time, reply-to reference and evidence/artifact links. Mark owner contributions as Owner, software states as System, and generated summaries as AI-authored summary. A summary is never presented as a verbatim multi-worker exchange.

Support topic filtering, chronological thread view, Jump to latest, unread count and expandable sources. Preserve disagreement alongside the final synthesis. A quiet period and a well-supported HOLD are valid outcomes, not reasons to generate chatter.

When the reader scrolls upward, stop automatic scrolling and show N new updates. Resume only on request. Initial delivery polls about every 10–15 seconds while visible, with jitter and bounded backoff; reduce or stop polling in a hidden tab. This is near-live publication, not zero-latency trading. SSE is a later optimization.

| Condition | Required presentation |
| --- | --- |
| Working | Actual activity and latest committed contribution |
| Queued | Waiting for a worker slot, not thinking |
| No due work | Idle, with next scheduled review if one exists |
| Publication delayed | Last good content retained, lag visible |
| No recent HQ heartbeat | State unknown; do not imply continuing worker activity |
| Withheld content | Safe placeholder and category without private details |
| Ended run | Read-only archive and reason |
| Fixture replay | Persistent synthetic-demonstration label on all views |

The Live Investment Desk never automatically includes visitor questions or employee Ask replies. Public access to chat is not consent to broadcast its contents or use it as investment evidence.

## 5. Ask BotSquad

[ASK_BOTSQUAD.md](ASK_BOTSQUAD.md) is the normative behavior, routing, privacy, protocol and safety specification; this section owns placement and integration with the showcase.

Provide a general question entry and context-aware Ask about this trade/decision/artifact actions. Attach trusted record IDs and exact artifact versions; do not use visitor-authored balances as evidence. Keep the context chip visible and removable. General questions need no investment selection and are not limited to a stock FAQ.

Only Send creates an answer request. Opening chat, viewing a suggested question, typing or polling does not start a model. Show actual selected worker/name/responsibility and a short routing reason, then queued/answering/answered state from real activity. One employee answers each admitted question; a change of employee on a follow-up is explicitly disclosed. No fake personas, fabricated typing, immediate-response guarantee or whole-team fan-out.

Answers explain the recorded rationale for a trade and link to evidence. Later interpretation is labelled as new, not silently substituted for the original decision. Unknown facts stay unknown. Optional current research needs explicit scope and dates. A broad question can receive a useful general answer, clarification, limitation or appropriate refusal.

Use anonymous session-private chat by default: other visitors cannot read it. Explain operator and configured AI-service processing, retention, necessary session cookies and limits before submission; warn against sensitive information. Provide cancellation/delete-chat and understandable expiry/paused/full-queue/error states. No public transcript sharing, account registration, file uploads or automatic promotion into the team's discussion/artifact library in v1.

A visitor may ask why a trade happened, not instruct the simulator to buy/sell. Capability restrictions are enforced at HQ; a disclaimer or a model promise is not sufficient. The public queue gets bounded capacity and low priority so investment/owner work remains protected.

## 6. Artifact and evidence journey

Research reports, syntheses, reviews, rationales and retrospectives are inspectable deliverables, not just chat attachments. The feed, discussion, decision and library link exact public artifact versions.

Artifact pages show title, author, created/published times, type, version, content hash, sources, related work, body and accessible permitted downloads. Revisions link both ways. Past trades continue to cite the version available at decision time. Ask about this artifact uses that same version.

The central navigable journey is:

`source → research artifact → discussion/challenge → synthesis → decision → simulated fill or rejection → later review`

Never expose local paths, private task URLs, provider thread IDs or a company-wide artifact browser. Every investment-team deliverable must be published or explicitly accounted for as awaiting review, withheld, failed or withdrawn. This does not authorize unrelated project artifacts or visitor Q&A/attachments. Existing public artifacts can be linked in Ask without making the visitor's question public. See [Publication and artifacts](PUBLICATION_AND_ARTIFACTS.md) and the Ask amendment.

## 7. Portfolio and charts

The simulator supplies numbers and calculation metadata. The website formats and plots; it never infers balances from prose or chat answers.

Under [Decision 029](../../decisions/decision_029_zero_cost_market_data.md), underlying market observations must come from verified free APIs or permitted low-frequency extraction. Show the observed source, market session, delay and valuation quality; do not imply real-time exchange data. **Source rights are checked separately for public raw prices, transaction records, per-security/benchmark charts and derived portfolio results.** Withhold unsupported public values or display an honest unavailable/stale state rather than rendering unlicensed or fabricated charts. The site does not quietly rely on a paid data feed.

Required figures: initial capital, equity, cash, total return, daily change when comparable marks exist, realized/unrealized P&L, dividend income/receivables where applicable, benchmark return, excess return in percentage points, maximum drawdown and valuation coverage. Model/data/service expenses are separate from paper returns; unknown expense is not zero. Ask usage has its own bounded operating budget and does not alter portfolio equity.

| Chart | Required semantics |
| --- | --- |
| Portfolio and benchmark | Same initial capital, currency, dates and return convention; value or rebased return |
| Drawdown | Each series relative to its own previous high; observation frequency disclosed |
| Allocation | Position and sector weights plus cash; unknown classification explicit |
| Position result | Cost/current value and realized/unrealized components; corporate actions correctly handled |

Keep visible gaps or stale marks for missing valuations. Do not smooth across outages or mix corrected and original series without labels. Do not label simple excess return alpha. Annualized risk statistics remain absent until sufficient observations are defined; a short trial does not justify impressive-looking precision.

Every chart needs a text summary, data table/export, clear units, non-color-only distinctions and keyboard usability. Honor reduced motion. Validate 390px, tablet and desktop layouts, long names/transcripts and zero/negative returns.

## 8. Decisions and journal

A decision records alternatives, evidence available at commitment, chosen action, risks, independent objection, response and a thesis-invalidating condition. Optional confidence is self-assessed, not a calibrated probability of profit.

Distinguish proposal, accepted/pending order, fill, rejection, expiry and cancellation. HOLD is a durable decision without an order. Reasoning belongs to the decision; financial effects belong to the simulator receipt. Ask replies may explain but never amend either record.

The journal supports date/symbol/side/status filters, stable pagination, evidence links, price source/as-of, quantity, modeled fees/slippage, cash after and corrections. CSV export neutralizes formula-like cells; JSON is lossless. Add Ask about this trade as a question-context action, not a financial mutation. No public trading/edit/delete controls.

## 9. Credibility and accessibility

Use the existing visual system. Avoid casino imagery, profit celebrations, stock-tip framing and suggestions visitors can obtain simulated returns. No visitor account or marketing analytics requirement; only disclosed necessary session/privacy/abuse mechanisms for Ask.

Permanent investment notice:

> This is a BotSquad paper-trading experiment. No real money or securities are traded. Published analysis may be wrong and is not personalized investment advice. Prices and updates may be delayed. Read the methodology and limitations.

The notice does not replace licensing, privacy or publication review. Ask adds a separate processing/retention/limits notice; broad question access is not unlimited expertise or action authority. Provide real loading, empty, error, stale, withheld, queued and ended states, usable focus/navigation, accessible documents/charts/chat and preserved original routes. Introduction, live team discussion, artifact journey and actual relevant-employee Ask replies are all first-public-release gates.
