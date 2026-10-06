# Ask BotSquad — implementation packets

**Design version:** 1.1 | **Updated:** 2026-10-06 | **Status:** All packets Planned

[Feature specification](ASK_BOTSQUAD.md) · [Main implementation status](ROADMAP.md) · [Prompt launcher](../../../prompts/investment-experiment.md)

## Sequence and ownership

Keep existing INV-01–INV-12 identities stable. Add four feature packets, INV-ASK-01 through INV-ASK-04, before INV-10's integrated acceptance. The main roadmap table owns status and evidence; this file owns the detailed Ask packet briefs.

INV-01 must read the Ask design and capture versioned Q&A schemas/provider-use prerequisites alongside the portfolio contracts. No existing publisher key, deployment or research grant automatically enables Ask. INV-04 can reserve/render labelled inactive fixture UI, but public chat is not functional until all Ask packets and explicit activation pass.

| Packet | Repository | Depends on | Main result |
| --- | --- | --- | --- |
| INV-ASK-01 | Both, separate writers | INV-01, INV-02 | Versioned Q&A contract, private anonymous-session queue and abuse controls |
| INV-ASK-02 | BotSquad | ASK-01, INV-07, INV-08 | Authenticated HQ pull, relevant-employee routing and isolated answer execution |
| INV-ASK-03 | Asymmetri, HQ compatibility checks | ASK-02, INV-03, INV-04 | General and transaction-context chat with real employee responses |
| INV-ASK-04 | Both | ASK-03, INV-09 | Security, privacy, capacity and recovery acceptance; trial/activation package |

The default sequence is INV-01–INV-09, ASK-01–ASK-04, then INV-10–INV-12. Earlier parallel work is permitted only when actual dependencies pass and writer/repository ownership is separate. General chat does not logically require an investment run, but the combined showcase's launch gate includes both general and transaction questions.

Use the same single-packet launcher with an exact INV-ASK-NN identifier. Evidence lives at `docs/validation/investment/INV-ASK-NN.md`; no acceptance file is presumed to exist yet. All implementation is future owner-selected work, not authorized by this design amendment.

## INV-ASK-01 — Contracts and private website intake

**Goal:** Visitors can safely submit a session-owned question and see queue status, without invoking models or exposing chats publicly.

**Read:** ASK_BOTSQUAD.md sections 1–3 and 6–11, PUBLIC_API.md, API_SECURITY_AND_DELIVERY.md, website AGENTS/privacy/deployment guidance and actual current runtime constraints.

**Deliverables:** Define strict `/api/ask/v1` JSON Schema/OpenAPI and golden vectors for session/question/context/claim/status/answer/receipt/cancellation/deletion. Select a compatible typed HQ request discriminator, versioned signed transport profile, provider terms gate and actual anonymous/public-service permission model. Verify configured model/runtime terms for serving third-party visitors; no new subscription or account without authorization.

In Asymmetri, implement a separate private Q&A store, anonymous cookie sessions, ownership checks on every access/retry, CSRF defenses, request/idempotency handling, body/rate/global admission limits, expiring queue and safe status API. Add claim leasing and control-sync cancellation/deletion records with fake service identities for tests. Session creation, draft creation and polling start zero model work. Retain existing public archive serializers unchanged; do not permit their read endpoints to join private chat tables.

Implement expiry/deletion schedules and a documented backup-retention approach for both content and minimal suppression metadata. Configure disabled-by-default public admission and an accessible abuse-challenge strategy without silently purchasing a provider. All error responses are bounded and contain no chat from other sessions or private infrastructure data.

**Acceptance:** ASK-A04, A06–A08 and relevant A10/A12 (feature specification). Two anonymous sessions cannot read or mutate one another, including by ID guessing and idempotency-key reuse. Concurrent duplicates create one question. Expired/deleted data is not restored by a late claim. Flood tests hit global caps even when sessions rotate. Original portfolio API fixtures still pass.

**Excluded:** Real model answers, public activation, changing financial records, account/SSO product, uploads, public transcript sharing and an arbitrary webhook.

**Handoff:** Both contract commits/digests, receiver migration/version, exact tested cookie/retention/queue limits, tests and unresolved runtime/provider/legal-privacy configuration. Do not claim a functional employee chat from a fake queue test.

**Codex brief:** “Execute INV-ASK-01 only. Create and test the bounded Q&A contract and private website intake. Preserve anonymous-session isolation and the public experiment archive. No model work, production grant or public activation.”

## INV-ASK-02 — HQ admission, routing and real employee answer

**Goal:** An admitted question produces one response from the relevant real opted-in employee, without private context or action authority.

**Read:** Feature sections 4–8; actual worker/capability/conversation/dispatcher/research code; existing grant, session-rollover and uncertain-outcome invariants.

**Deliverables:** Implement the dedicated owner Ask grant, public-service roster/topic mappings, bounded authenticated outbound question claim/control-sync client, unique local import and usage reservation. Recheck local permission/capacity even when website says admitted. Add the smallest compatible public-Q&A conversation execution type; no owner impersonation, Executive objective, new unrestricted Task or parallel agent engine.

Build routing using exact public record authorship first, relevant follow-up second, approved topics/classifier third, configured generalist last. Persist choice/reason/policy version, handle busy/ineligible workers and disclose fallback. One worker answers; no worker fan-out, recursive consulting or role-name-only attribution. Optional classifier work is bounded and counted.

Reconstruct fresh scoped contexts using only this visitor's authorized chat and public evidence. Add read-only published-record/approved-product retrieval. If current-information questions are supported at launch, add an explicit separately opted-in public-Q&A research mode with safe query minimization; otherwise provide an honest unavailable-source response. Never inherit private research or engineering tools. Store safe answer/outbox atomically, deliver via dedicated answer authority and reconcile lost receipts without rerunning the model.

Implement cancellation, expiration, lease recovery, restored-consumer fences, local/global pause, permission revocation and deletion suppression. Current worker and provider uncertainty fences remain intact.

**Acceptance:** ASK-A01–A03, A05–A09 with actual employees in isolated test state. Answer a general non-financial question and one contextual question using authentic records. Demonstrate exact author provenance, follow-up continuity, true handoff and one accepted answer. Test a visitor claiming owner identity, requesting trades/private chats, and supplying malicious evidence. Trusted tools deny actions regardless of model wording. Unknown provider results never reroute to another employee automatically.

**Excluded:** Extra global execution capacity, new worker hiring to mask limitations, unbounded live search, ingestion of visitor suggestions into investment memory and production activation.

**Handoff:** Actual employee/execution evidence kept privately with safe public IDs, tool-schema migration/compatibility evidence, counters/budgets, denial/recovery results and missing prerequisites. A canned response labelled Atlas fails this packet.

**Codex brief:** “Execute INV-ASK-02 only. Admit questions through outbound HQ retrieval and answer with one actual relevant employee in a least-privilege public-service context. Prove routing, context isolation, budget and no-replay behavior.”

## INV-ASK-03 — Ask experience and transaction context

**Goal:** A visitor can ask a general question or click a real trade and understand who replied, why that employee was selected and which evidence supports the reply.

**Deliverables:** Build `/botsquad/ask`, the investment-page Ask panel and reusable contextual actions on trade, decision and artifact pages. Support question drafts, context chips, Send, session-owned status/messages, follow-ups, real routing/employee labels, sources/exact-version links, retry of the same submission, cancellation and delete-chat. General entry works with null investment context.

Maintain separation from the Live Investment Desk. Do not display visitor chat in that feed or auto-publish it as an artifact. Render safe text, readable source links, queue/full/paused/expired/declined/unknown states and honest timestamps. No fabricated typing, immediate-response promise or stale fake success. Include privacy/provider/retention notice before first submission and clearly distinguish interpretation today from the trade's recorded original reason.

Validate the exact contextual record on both hosts; do not trust a symbol/quantity/price supplied by a visitor. Keep pending conversational turns serialized. Where an actual source is withdrawn, show safe limitations, not cached sensitive content. Browser navigation/refresh retains only correctly authorized chat access; session expiration has an understandable restart flow without reviving deleted conversations.

**Acceptance:** ASK-A02–A04, A07, A09–A10. Actual general question and transaction-specific explanation have working exact-version links and authentic author badges. Test long questions, mobile 390px/tablet/desktop, keyboard/focus, reduced motion, no new-message scroll theft and hidden-tab polling backoff. Existing Motion routes, privacy disclosures and both website packaging builds remain valid.

**Excluded:** Global public chatroom, visitor registration, public answer sharing, comments affecting investments, arbitrary attachments, custom model selection and cross-session answer caches.

**Handoff:** Website commit/build checks, accessibility/browser evidence, exact API version, tested privacy/error states and instructions for later activation. Fixture demonstrations remain labelled; real answer tests identify actual evidence.

**Codex brief:** “Execute INV-ASK-03 only. Deliver the reusable general/contextual Ask BotSquad interface using real eligible-employee replies. Preserve visitor privacy, historical investment evidence and the existing company website.”

## INV-ASK-04 — Abuse, recovery and release readiness

**Goal:** Prove the public channel cannot take over the company, leak visitor/private data, duplicate replies or consume unbounded resources before anonymous access is enabled.

**Deliverables:** Run ASK-A01–ASK-A12 and applicable base A02/A03/A06/A07/A09/A10 checks against frozen producer/receiver commits. Use read-only security, recovery and test specialists when available. Exercise direct/indirect injection, cross-session object access, stale/withdrawn evidence, forged owner/employee identities, denial of trades/Task creation, attacker-provided URLs and attempts to poison future investment memory.

Fault-inject send/claim/answer lost responses, lease expiry during a real model turn, restored older HQ, duplicate consumer generation, worker revocation, deletion/cancel while answering, output moderation failure, frozen global dispatch and receiver/HQ outages. Verify one durable answer and unknown-outcome holds, not retry-until-answer behavior.

Stress multiple rotating anonymous sessions while time-sensitive investment and owner work is queued. Measure local HQ budget enforcement, public-slot/duty limits and visible backpressure. Count routing/moderation/research attempts and unknown monetary cost honestly. No extra slots or blank-check budget to pass a test.

Deliver operator controls and runbook: enable/disable admission, local Ask dispatch, research and delivery; inspect blocked work/costs; expire grants; delete/purge; restore backups without resurrecting conversations; rotate scoped keys; and shut off public workload without stopping the investment ledger. Verify website privacy copy, session/backup retention and configured provider-use permission.

**Acceptance:** All ASK-A checks have actual evidence or explicit remaining gates. Real employee general/contextual/follow-up/disallowed-action scenarios run privately; no official public traffic is needed to test them. Missing provider permission, privacy, costs, security or recovery evidence blocks public activation. Independent failures are retained and corrected; neither profitable trades nor entertaining chatter is required.

**Integration:** INV-10 includes this suite in combined system acceptance. INV-11 observes public-Q&A test traffic during the private forward trial and confirms investment deadlines remain protected. INV-12 separately records owner Ask activation, roster/grant expiry, quotas, privacy settings and emergency switch. A deployed but disabled Ask page is not a completed public capability.

**Codex brief:** “Execute INV-ASK-04 only. Prove actual public-question routing, isolation, fairness and recovery against the frozen cross-repository candidates. Prepare the bounded activation handoff, but do not enable anonymous public work without explicit owner authorization.”

## Documentation and continuation

Update the status/evidence rows in ROADMAP.md, the relevant contract and normative Ask sections, and the selected validation record. Retain stable IDs and previously tested evidence. Do not rewrite base ledger methodology for this feature. The [single-packet launcher](../../../prompts/investment-experiment.md) applies equally to INV-ASK-NN, including separate repository release rules and no automatic deployment or grant activation.
