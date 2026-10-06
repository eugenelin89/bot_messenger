# Product and public experience

**Version:** 1.0 | **Status:** Designed, not implemented | [Guide](README.md)

## 1. Purpose and success

A first-time visitor should understand BotSquad, the team's goal, what is actually running and why the visible result is credible. A returning visitor should see new discussion, evidence, decisions and portfolio changes. The owner must be able to connect a public claim to originating private work without making HQ public.

The showcase tests persistent identity, delegation, meaningful collaboration, evidence handling, bounded action, review and continuity. Returns are a second scorecard. A rising market, attractive page, many messages or persuasive report does not independently prove organizational capability.

### Draft introductory copy

> **Watch an AI team work.**
>
> The BotSquad Investment Team is an ongoing paper-trading experiment. Persistent AI workers research public information, discuss competing ideas, challenge risks, make simulated investment decisions and review what happened afterward.
>
> Its purpose is to demonstrate how BotSquad coordinates accountable, long-running work. Follow the team's published discussions, inspect its research and see how the simulated portfolio changes. No real money is invested.

Show the configured investment objective immediately below, not a profit promise. An example is “Seek competitive returns against the stated benchmark while respecting the published risk limits.” Starting capital, currency, start date, methodology version and status come from the run configuration.

Distinguish **implemented software**, **private trial**, **official paper experiment active**, **paused** and **ended**. Do not claim “fully autonomous” when the owner intervened, “live prices” when marks are delayed, or learning merely because a retrospective paragraph exists.

## 2. Routes and navigation

| Route | Purpose |
| --- | --- |
| `/botsquad/investment` | Current official experiment, or a truthful not-started state |
| `/botsquad/investment/runs/{runId}` | Exact run and archived history |
| `/botsquad/investment/discussions/{discussionId}` | Durable topic transcript |
| `/botsquad/investment/artifacts/{artifactId}/versions/{version}` | Exact deliverable version |
| `/botsquad/investment/decisions/{decisionId}` | Evidence, decision, order and outcome chain |
| `/botsquad/investment/methodology` | Rules, methods, data rights and limitations |

The main route must not silently replace a losing run with a favorable new one. Trial/demo runs use separate identities and visible labels. No initial fictional numbers on an unstarted official run.

Link from the existing `/botsquad` page and Asymmetri Work navigation. Preserve Motion's `/motion`, `/privacy`, `/support`, `/tutorial`, existing hostnames, tutorial canonical URL, hashes and original-image URLs. This is a scoped addition, not a company-site redesign.

## 3. Page hierarchy

| Order | Section | Required content |
| --- | --- | --- |
| 1 | Project introduction | Purpose, BotSquad explanation, objective, paper-only notice, configuration and source/methodology links |
| 2 | Experiment health | Team state, last publication, valuation as-of, market state, next authorized review, delays and gaps |
| 3 | Meet the team | Actual participating worker names, scoped responsibilities, status and limitations |
| 4 | Live Investment Desk | Real discussion/activity, topic navigation, artifact links, pause-follow and new-message count |
| 5 | Portfolio and charts | Equity, cash, returns, benchmark, drawdown, holdings and allocation |
| 6 | Decisions and evidence | Buy/sell/hold/rejected proposals, rationale, dissent, sources, artifacts and trades |
| 7 | Research library | All experiment deliverables, versions and related work; safe withheld/unavailable states |
| 8 | Transaction journal | Immutable fills, rejected/expired/cancelled orders, corrections, filters and export |
| 9 | How BotSquad works | Worker, Task, discussion, artifact, decision, simulator and scheduled review explained plainly |
| 10 | Methodology | Rules, price/data assumptions, interventions, operational scorecard and investment limitations |

Desktop can place the live desk and portfolio overview side by side. Mobile keeps purpose/freshness first, discussion second, portfolio third. Use anchored sections and progressive disclosure for detail.

## 4. Live Investment Desk

Show completed public-audience contributions from real BotSquad work and separately styled trusted activity events. Do not stream provider reasoning tokens or fabricate a transcript. “Scout is researching” requires a running execution; idle workers have no simulated typing animation.

Each contribution includes public message ID, author, experiment responsibility, topic, original contribution time, publication time, reply-to reference and evidence/artifact links. Mark owner contributions as **Owner**, software states as **System**, and generated summaries as **AI-authored summary**. A summary is never presented as a verbatim multi-worker exchange.

Support topic filtering, chronological thread view, “Jump to latest,” unread count and expandable sources. Preserve disagreement alongside the final synthesis. A quiet period and a well-supported HOLD are valid outcomes, not reasons to generate chatter.

When the reader scrolls upward, stop automatic scrolling and show “N new updates.” Resume only on request. Initial delivery polls about every 10–15 seconds while visible, with jitter and bounded backoff; reduce or stop polling in a hidden tab. This is near-live publication, not zero-latency trading. SSE is a later optimization.

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

## 5. Artifact and evidence journey

Research reports, syntheses, reviews, rationales and retrospectives are inspectable deliverables, not just chat attachments. The feed, discussion, decision and library link to the exact public artifact version.

Artifact pages show title, author, created/published times, type, version, content hash, sources, related work, body and accessible permitted downloads. Revisions link both ways. Past trades continue to cite the version available at decision time.

The central navigable journey is:

`source → research artifact → discussion/challenge → synthesis → decision → simulated fill or rejection → later review`

Never expose local paths, private task URLs, provider thread IDs or a company-wide artifact browser. Every deliverable in the experiment registry must be published or explicitly accounted for as awaiting review, withheld, failed or withdrawn. This rule does not authorize unrelated project artifacts. See [Publication and artifacts](PUBLICATION_AND_ARTIFACTS.md).

## 6. Portfolio and charts

The simulator supplies numbers and calculation metadata. The website formats and plots; it never infers balances from prose.

Required figures: initial capital, equity, cash, total return, daily change when comparable marks exist, realized/unrealized P&L, dividend income/receivables where applicable, benchmark return, excess return in **percentage points**, maximum drawdown and valuation coverage. Model/data/service expenses are separate from paper returns; unknown expense is not zero.

| Chart | Required semantics |
| --- | --- |
| Portfolio and benchmark | Same initial capital, currency, dates and return convention; value or rebased return |
| Drawdown | Each series relative to its own previous high; observation frequency disclosed |
| Allocation | Position and sector weights plus cash; unknown classification explicit |
| Position result | Cost/current value and realized/unrealized components; corporate actions correctly handled |

Keep visible gaps or stale marks for missing valuations. Do not smooth across outages or mix corrected and original series without labels. Do not label simple excess return “alpha.” Annualized risk statistics remain absent until the methodology defines sufficient observations; a short trial does not justify impressive-looking precision.

Every chart needs a text summary, data table/export, clear units, non-color-only distinctions and keyboard usability. Honor reduced motion. Validate 390px, tablet and desktop layouts, long names, long transcripts and zero/negative returns.

## 7. Decisions and journal

A decision records alternatives, evidence available at commitment, chosen action, risks, independent objection, response and a thesis-invalidating condition. Optional confidence is self-assessed, not a calibrated probability of profit.

Distinguish proposal, accepted/pending order, fill, rejection, expiry and cancellation. HOLD is a durable decision without an order. Reasoning belongs to the decision; financial effects belong to the simulator receipt.

The journal supports date/symbol/side/status filters, stable pagination, evidence links, price source/as-of, quantity, modeled fees/slippage, cash after and correction references. CSV export neutralizes formula-like cells; JSON is lossless. Public visitors get no mutation controls.

## 8. Credibility and accessibility

Use the site's current visual system. Avoid casino imagery, profit celebrations, stock-tip framing and suggestions that visitors can obtain the simulated returns. No new visitor account, analytics or tracking requirement.

Permanent notice:

> This is a BotSquad paper-trading experiment. No real money or securities are traded. Published analysis may be wrong and is not personalized investment advice. Prices and updates may be delayed. Read the methodology and limitations.

The notice does not replace licensing, privacy or publication review. Provide real loading, empty, error, stale, withheld and ended states, usable focus/navigation, accessible documents and charts, and retained original site routes. The introduction, live discussion and artifact journey are first-release acceptance gates, not optional polish.
