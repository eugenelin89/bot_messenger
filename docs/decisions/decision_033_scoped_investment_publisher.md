# Decision 033 — Scoped synthetic investment publisher

**Date:** 2026-10-10
**Status:** Accepted for source integration; isolated synthetic scope only, no deployment or operational authority

## Decision

Implement the INV-07 trusted publisher inside BotSquad. Canonical contract1.0 and Asymmetri source stay unchanged. Company startup injects no source, destination, key, transport or consent. Only the existing private owner-local HTTP session can preview, consent, capture, deliver, reconcile or control publication. Workers and device API v1 receive no publisher capability.

Schema17 adds passive channels, opaque identity/sequence mappings, previews, grants, journal-capture intents/highwaters, immutable jobs/attempts/results and controls. The original disabled INV-05 outbox remains intact. A journal trigger captures intent within the same accounting transaction. Consent and bounded capture atomically stage dependencies and their highwater; acknowledgement never changes paper accounting.

The owner reviews exact canonical bytes, public derivatives, private origin hashes/versions, destination, participants, classes, finite requests/bytes/backlog limits and expiry. Exact consent is idempotent. A separate unchecked `futureFinancial` option permits explicit subsequent bounded capture of trusted financial/order/lifecycle records. New decision/artifact prose, including corporate-action Source text nested inside ledger transactions, requires exact previous approval or a new preview. Captured and uncaptured backlog remain visible; uncaptured evidence, age/size limits, authority expiry and exhausted budgets expose a `newRiskBlocked` health signal. INV-08/09 must enforce that signal at admission; the standalone simulator has no publication-health dependency in this packet.

Use a separate public portfolio journal/hash chain and opaque identities. The trusted simulator source retains original nullable provider availability, public configuration hashes, order transitions, portfolio/benchmark values, incomplete nulls and supported correction revisions. Every preview/capture/send rechecks source/run binding and current market-use rights. Artifact derivatives bind an exact original version/hash through a trusted reader; original content is not exported.

Sign fixed-origin, bounded Ed25519 requests with fresh nonces. Ordinary HTTPS verification is mandatory except explicitly injected literal-loopback fixtures. Do not follow redirects. Immutable batch bytes survive errors. Unknown batches use authenticated receipt GET before retry; receipt authentication failure does not erase uncertainty. Permanent schema/media/authority errors block. Transient errors use bounded exponential delay/jitter and bounded Retry-After. Content refresh resends identical PUT bytes and retains original receiver receipts.

Every restarted publisher requires a higher receiver-owner-installed generation and renewed local consent. Reconciliation separately checks a signed batch receipt and current TLS receiver status, or authenticated absence plus current run absence. An absent final attempt can use the prior acknowledged watermark. Receiver-ahead or inconsistent history remains fenced. The durable unreconciled generation and process instance are checked before sending and atomically claimed after reconciliation; a losing restorer cannot replace a winner. Historical receipts alone never prove current receiver state.

## Qualified acceptance and remaining gates

[INV-07 evidence](../validation/investment/INV-07.md) owns exact tests and integration receipts. Accepted source scope remains **partial milestone acceptance**:

- The source adapter is synthetic-only. Explicit fixture decision/review copies are not real employee deliberation. Genuine scoped employees/discussion attribution belongs to INV-08.
- Distinct benchmark-only corporate actions and historical snapshots whose journal prefix includes later-effective financial effects cannot be represented faithfully by this v1 mapping. They fail explicitly, leave capture/backlog unresolved and require coordinated producer/receiver protocol review before full financial coverage. Do not alter or reset accounting to make publication succeed.
- Nonempty private decision evidence and multiorder decisions require a separate reviewed public derivative mapping; they fail closed here.
- No production credentials, grants, runtime, daemon, receiver, public website or official run was activated. Live price/publication rights and separate model/operational budgets remain unapproved. Actual Linux deployment/custody acceptance remains pending.

The owner-authorized source sequence may continue to INV-08/09 while these live/protocol gates remain explicit. This decision grants no deployment, release, paid source, Ask or later-milestone authority.
