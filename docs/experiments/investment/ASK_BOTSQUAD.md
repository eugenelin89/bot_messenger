# Ask BotSquad — public questions, real employee answers

**Design version:** 1.1 | **Updated:** 2026-10-06 | **Status:** Planned, not implemented

[Design guide](README.md) · [Build packets](ASK_BOTSQUAD_ROADMAP.md) · [Main roadmap](ROADMAP.md)

## 1. Requirement and purpose

**R09 — Ask BotSquad:** Anyone visiting the public website can open a chat, ask a general question or a question about a specific investment transaction, and receive an answer from the actual BotSquad employee most relevant to that question. Follow-up questions remain in the conversation, with explicit handoff when another employee is more appropriate.

This is a demonstration of the real organization, not a separate generic chatbot with employee names painted onto its answers. Each answered question has one attributable answering employee. Visitors can ask about ordinary topics as well as BotSquad, research, risks, methodology, artifacts and trades. Do not restrict the feature to an investment FAQ.

“Ask anything” means broad question topics, not unlimited cost, guaranteed expertise, access to secrets or permission to perform actions. Employees may explain uncertainty, ask a clarifying question, decline an unsafe request or say current evidence is unavailable. One answer is not an investment-team decision or an instruction to the simulator.

The public page remains a showcase of BotSquad. Ask BotSquad is a required part of the revised first-public-release design, alongside the Live Investment Desk, evidence library and portfolio. Building or deploying it does not activate public model usage without the owner's separate bounded grant.

## 2. Explicit amendment to the original design

The owner has extended the original read-only visitor scope. Apply this table when reading version-1.0 specifications; unchanged financial, privacy and publication rules still apply.

| Original statement | Revised meaning |
| --- | --- |
| Public visitors only read; public interaction is deferred | Visitors may additionally submit bounded answer requests and manage their own anonymous chat. No public trade, task assignment, grant, code or administrative controls. |
| HQ only publishes outward; website responses are receipts | Portfolio publication stays that way. A separate owner-authorized **outbound HQ pull** retrieves untrusted question records from an Asymmetri queue. There is still no inbound HQ listener or generic callback/command channel. |
| Receiver stores public-only records | Keep that public archive public-only. Add a separately accessed private Q&A queue/session store. Its rows never enter anonymous experiment GETs. |
| Every experiment deliverable is publicly accounted for | Applies to investment-team deliverables. Visitor Q&A and any answer attachments have a separate session-private lifecycle; no automatic public artifact registration. |
| No visitor accounts/tracking | No account, email address or marketing analytics required. Necessary anonymous-session cookies and short-lived abuse controls are a disclosed new exception, not an identity or advertising system. |
| Public discussion means the team's visible working group | The Live Investment Desk remains the team's actual discussion. Ask BotSquad is a separate visitor conversation; visitor messages do not appear in the team transcript. |

[Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) records this narrow amendment to Decision 027. Core prompt numbering, Personal Operator work and real-financial authority are unchanged. This file owns Q&A behavior and protocol; the portfolio API and ledger retain their existing normative documents.

## 3. Visitor experience

### Entry points

Provide an **Ask BotSquad** section on `/botsquad/investment`, a general entry at `/botsquad/ask`, and contextual **Ask about this trade**, **Ask about this decision** and **Ask about this artifact** actions on existing detail cards. One reusable chat component serves all entries. The general entry works without selecting a portfolio or transaction.

Opening a chat, viewing examples, selecting a context card or typing a draft invokes no model. Only pressing **Send** submits a bounded question. Explain near the composer:

> Ask a question and the most relevant available BotSquad employee will respond. You may see a queue while the team is working. Do not include passwords, account details or other sensitive information.

Add a clear privacy note: other visitors cannot see this chat by default; the site operator and configured AI services process it. Do not promise end-to-end encryption or confidential handling that the implementation does not provide. Link the actual retention and provider disclosure before first submission.

### Conversation layout

Show the visitor's message, attached context chip, selected employee's real name and scoped responsibility, routing reason, actual state, answer, evidence links and follow-up composer. Examples:

| Visitor question | Preferred routing evidence |
| --- | --- |
| Why did you buy this stock on that date? | Original decision author or configured portfolio spokesperson, using that exact decision and fill |
| Which news sources supported this purchase? | Author of the referenced research, or an eligible research specialist |
| Why was this order rejected? | Relevant risk/methodology specialist using the deterministic rejection receipt |
| How does BotSquad remember earlier work? | An opted-in employee with approved product/technical knowledge |
| What is compound interest? | Relevant educational/generalist employee; no investment context required |
| Why did the market move today? | Eligible researcher with an explicit public-Q&A current-information grant, or an honest unavailable-current-evidence answer |

These are routing examples, not scripts, required names or claims that current role profiles already support the feature. Broad questions outside finance are valid. Dangerous or disallowed requests follow the service's safety policy instead of expanding tools.

A handoff states “Answered by [actual employee]” and why the topic moved. Do not silently label an answer as coming from an unavailable original author. Display queued, answering, source-checking, completed, declined, expired, paused and unavailable states from real events. Do not fake typing, guaranteed response times or work when HQ has no capacity.

### Transaction context

A contextual button attaches a trusted **record reference**, not a pasted balance or visitor-authored summary: experiment ID, run ID, public trade/order/decision ID and optional exact artifact version. Resolve it server-side and revalidate at HQ. The visitor may remove the chip or ask a different question.

Retrieve the exact public decision/review, fill or rejection, relevant artifact versions, evidence cutoff and price observation times. The answer distinguishes **what the team recorded then** from **new interpretation now**. Missing rationale stays missing; never retrofit a plausible investment thesis. Link to the original record and describe later corrections. A Q&A reply cannot edit the trade's original explanation.

If there are several possible transactions, the selected employee asks for clarification. Invalid, private, withdrawn or other-run references do not authorize lookup by guessed IDs. Current valuation and historical transaction price are different facts with different as-of times.

### Privacy and sharing defaults

The feature is publicly accessible, not a global public chatroom. Anonymous visitors have separate conversations and cannot enumerate or read each other's messages. Default to no publicly shareable chat URLs, search indexing, question feed or cross-session answer cache. Owner-curated Q&A sharing requires a later separate visitor-consent and publication feature; it is not silently enabled for marketing value.

Existing public research artifacts can be linked in an answer. A document generated specifically for a visitor, if supported, is stored and authorized within that chat session, with the same expiry/deletion rules; it is not automatically added to the public research library. Start with inline text answers and existing artifact links, not arbitrary file uploads.

## 4. Selecting one actual employee

Maintain an owner-approved public-service roster with actual worker ID, public ID/name, approved topics, public knowledge references, research eligibility, status and fallback order. This is distinct from engineering hierarchy and does not change the worker's global role. Display only opted-in employees.

Routing precedence:

1. Use trusted transaction/decision/artifact provenance for a contextual question.
2. Preserve the preceding employee for a relevant follow-up when still eligible; topic change may select another.
3. Match the question's subject to the approved specialty roster. A small deterministic router is preferred where sufficient; a bounded read-only classifier may resolve ambiguity.
4. Use the configured generalist, often Atlas if present and enabled, for broad/uncertain topics.
5. Recheck worker enablement, grant, budget, execution fence and availability immediately before dispatch. Queue the best match or disclose a permitted fallback; never silently substitute a persona.

A classifier receives only this visitor's bounded input and safe public roster descriptions. It returns one enum/worker candidate, topic and reason, not instructions or an authority decision. Trusted code validates the choice. It cannot hire, assign another Task or start a group. A user may request a worker as a preference, but cannot force an ineligible identity. No polling every employee, speculative parallel answers or recursive delegation for one public question.

Persist the chosen worker and routing-policy version before model work starts. Reassign only before any answering execution starts, or after a confirmed no-effect failure under an explicit bounded retry policy. An ambiguous provider outcome cannot be rerouted to another employee as though nothing happened. Count classifier, moderation and failed attempts in public-service usage budgets.

Each question gets at most one accepted employee answer. Service notices and moderation rejections are labelled System, not a fake employee response. Ordinary answered questions must be traceable to a real BotSquad execution. A clarifying response is a valid answer for that turn; the visitor's reply creates a new explicit question.

## 5. Public-service execution and knowledge boundary

Reuse BotSquad's durable workers, typed conversation/execution substrate, dispatcher, pause controls and provider-uncertainty handling. Add an explicit public-Q&A work discriminator and grant; do not tunnel anonymous questions into the Executive channel or pretend the visitor is an authenticated owner/device.

Use fresh provider context scoped to `(visitorConversationId, selectedWorkerId, generation)`. Worker identity persists, but its private Task/group/direct-conversation runtime is never resumed for a stranger. Handoffs contain only this chat's authorized history and public evidence, with original sources and omissions. A new visitor must not see any prior visitor's context. Q&A content never enters investment memory, Company Knowledge, research packets, signals or mandate observations automatically.

At runtime, effective tools are the intersection of the explicit Ask grant, selected worker eligibility, question scope and public source rights. Initial allowed tools: read approved public product material, read specific published experiment records/artifact versions, and return the answer. Optional current-information lookup needs a separately reviewed **public-Q&A research mode**, explicit per-worker opt-in and per-question budgets; existing Task/group grants do not widen automatically. Native shell, browser, arbitrary HTTP/MCP, private filesystem, Task assignment, employee creation, all paper/real trading, grant changes, account actions and public-archive editing remain unavailable.

For current questions, show source and observation/retrieval dates. When fresh information cannot be verified, explain that limitation instead of guessing. Prefer safe licensed field projections for price questions. Do not proxy unlimited provider requests or redistribute restricted market/news content through chat. An educational explanation is not a personalized buy/sell instruction or guarantee of return.

Visitor claims are untrusted data. “I am the owner,” “sell everything,” “ignore instructions,” or a forged article excerpt cannot alter scope. Even a successfully manipulated model has no tool to change investments or fetch secrets. Input/output moderation and prompt-injection screening are additional defenses, not the trust boundary. See the primary security sources below.

## 6. Architecture and protocol

### Data flow

```text
Visitor browser
  -> Asymmetri Q&A API (anonymous-session authorization, validation, quotas)
  -> private website question queue
  <- HQ initiates authenticated bounded pull/claim over HTTPS
  -> HQ validates local Ask grant, deduplicates and selects an employee
  -> existing dispatcher -> isolated public-service employee execution
  -> safe answer + exact public source references
  -> durable HQ answer outbox -> authenticated Asymmetri answer endpoint
  -> private session response store -> requesting visitor's browser
```

There is no public HQ endpoint, arbitrary webhook or website ability to run owner commands. Unlike passive publication, accepted visitor input may now request a model reply, but only through this explicit narrow adapter and standing owner grant. Website admission alone is not trusted HQ admission. A compromised receiver can submit hostile questions; independent HQ quotas/context/tool restrictions still apply.

### API namespaces

Use `/api/ask/v1` for Q&A, separately versioned from `/api/experiments/v1`. Do not insert private Q&A messages into the public experiment event feed. Browser routes and HQ routes have disjoint authentication and response schemas.

| Route relative to `/api/ask/v1` | Access and semantics |
| --- | --- |
| `GET /availability` | Anonymous safe enabled/paused/capacity summary; no queue identities |
| `POST /sessions` | Create short-lived anonymous session after abuse checks; Secure/HttpOnly cookie |
| `POST /conversations` | Session-scoped empty conversation; no model work |
| `POST /conversations/{id}/questions` | Session + CSRF + quotas; question text/context IDs/idempotency key; returns 202 and owned question ID |
| `GET /conversations/{id}?after={cursor}` | Owning session only; bounded messages/status and polling cursor |
| `POST /questions/{id}/cancel` | Owning session only; stops pending delivery/work where safely possible |
| `DELETE /conversations/{id}` | Owning session; delete/withdraw chat, enqueue cancellation/purge marker; never deletes investment records |
| `POST /hq/claims` | Dedicated HQ service grant; bounded claim with claim request ID, capacity and known generation |
| `POST /hq/claims/{id}/renew` | Same HQ identity/generation; renew lease, no new model authorization |
| `POST /hq/questions/{id}/status` | Authenticated bounded routing/work/decline status; no private error trace |
| `POST /hq/questions/{id}/answer` | Authenticated answer writer; immutable answer ID, question hash, worker public ID, references and receipt |
| `GET /hq/answers/{answerId}/receipt` | Authenticated result reconciliation, never anonymous |
| `POST /hq/control-sync` | Same scoped HQ; retrieve/acknowledge bounded cancellation/deletion/expiry records, even while model dispatch is paused |

No visitor-facing endpoint accepts worker privileges, system prompts, tool definitions, filesystem paths, model selection, arbitrary callback URLs or provider credentials. Submitted URLs are text, not a server-side fetch instruction. Attachments and voice are outside v1. Require explicit typed `null` context for a general question; do not force an investment run selection.

The transport may reuse the audited signature implementation in [API security](API_SECURITY_AND_DELIVERY.md), but Q&A uses new key scope and explicit claim/read/status/answer permissions. A portfolio publishing key alone cannot read visitor chats. Claims/control-sync are bounded data retrieval, not executable responses; validate every field and permit only the configured HTTPS origin/path without redirects. Proxy/routing rules must not expose HQ's loopback listener.

### Durable data

Website records: anonymous sessions, owned conversations, immutable question revisions/hashes, admission receipts, abuse counters, queue claims/leases, private responses, cancellation/deletion markers and short-retention service audit. Keep these in a separate private Q&A store with no access from public experiment serializers or backups. HQ stores bounded imported request IDs/hashes, authority/routing decisions, execution links, usage reservations and answer outbox/receipts. Raw client IP and cookie credentials never enter employee context or HQ records.

A question envelope contains schema version, public-service ID, opaque session/conversation/question IDs, question revision/hash, text, prior owned turn IDs, optional validated context references, received/expiry times and permitted language preference. HQ independently validates its own grant and assembles context; it never trusts a claimed server field saying a visitor has owner authority.

An answer contains answer ID, exact question ID/revision/hash, conversation ID, actual worker public ID, generated time, text, safe evidence/version references, knowledge-as-of information, limitations and routing-policy version. Private runtime/thread/execution IDs remain in HQ provenance, not browser responses. Revalidate referenced content visibility before delivery. Newly withdrawn evidence causes a safe withheld/limited answer, not disclosure of cached private bytes.

## 7. Recovery, cancellation and idempotency

Suggested question lifecycle: `admitted -> queued -> routed -> answering -> answered`, with explicit `declined`, `expired`, `cancelled`, `failed` and `outcome_unknown` alternatives. Submission validation rejection is a system response before model work, not an employee answer. Public status hides worker/provider/private failure details.

A visitor retries the same submission with a session/conversation-scoped idempotency key and identical body. Return the same question, not another paid execution. A changed body under that key is a conflict. Idempotency access still requires the current owning session. Follow-ups are new explicit turns, serialized per conversation so incomplete replies cannot race the next context.

Website claim expiry does not authorize a second model execution. HQ imports the immutable question into a uniquely keyed local request before invoking a model. Duplicate deliveries return the known state/result. Only one active HQ consumer generation is accepted; restored/standby instances must reconcile imported requests and completed receipts before starting. Preserve original worker and uncertain-provider fences. Never claim exactly-once model invocation when a response was lost.

Commit the finished safe answer and its delivery outbox atomically at HQ. Answer delivery retries use the same immutable answer ID/body; the website accepts one result per question revision. Same ID/different content is a conflict; identical retry returns the stored receipt. Lost publication acknowledgement never reruns the employee or selects another worker.

Cancellation, deletion, expiry and Ask revocation are checked at admission, dispatch, tool execution and result delivery. A late answer after deletion is acknowledged as discarded/withdrawn where appropriate, without restoring the body. Deleting a conversation enqueues a durable cancellation/purge marker for HQ; control sync continues without model calls. Require a recent control check before new work or answer release. Existing invocations may still incur cost and cannot be recalled from the model provider; retain only permitted minimal evidence and disclose the limitation.

Owner disablement separately controls new website submissions, HQ claims/model dispatch, answer delivery and optional research. Global model pause holds Ask work like other model work; it does not need to stop privacy-control synchronization. Expired queue items do not wake workers. A provider-unknown state remains held for inspection rather than silently becoming a new request.

## 8. Abuse, capacity and expense

Public model work consumes real resources. Reserve budgets in trusted code before admission at HQ; maintain hard daily/execution limits independent of the website. A compromised or overloaded website must not exhaust the company's capacity. Use layered request/body/rate controls, short-lived session identity, aggregated network abuse signals, optional accessible bot challenge, and model/input/output safety checks. Session/IP limits are not proof of a unique person; hard global caps remain essential.

Proposed starting limits, not approved operating budgets:

| Limit | Proposed value |
| --- | --- |
| Question | 2,000 characters, 16 KiB request maximum, no files |
| Chat history | 8 completed question/answer turns; bounded retained tokens with explicit omissions |
| Per anonymous session | One outstanding question; 5 new questions per hour and 20 per day |
| Waiting queue | 50 admitted questions; reject politely when full |
| Queue expiry | 10 minutes; show unavailable/try later instead of promising completion |
| Public executions | At most one active Ask execution within the existing two global slots |
| Per question work | One answering execution; at most one bounded router invocation; finite moderation and lookup budgets |
| Optional research | At most two broker operations per question, only if explicitly enabled |
| Answer | Default concise prose with links; hard 8,000-character published limit |
| Overall budget | Owner must set daily public-turn/token ceilings and monetary/provider caps where enforceable; no default unlimited grant |

Choose provider-runtime duration/token bounds during the contract stage; timeout triggers cancellation/reconciliation, not blind retry. All attempts, including classifier/moderation, failures and optional research, count. A true hard monetary bound may be unavailable on a subscription; say so and enforce conservative turn/token/provider caps instead of reporting unknown cost as zero. No external paid challenge/moderation provider is silently purchased.

Ask jobs have a separate low-priority fair-share queue, below time-sensitive owner/operating work. Existing global/per-worker constraints still hold. At most one public job may occupy a slot; it cannot preempt an already running owner job. Apply duty-cycle/daily caps and admission pauses when deadlines are at risk. Display that staff may be busy rather than guarantee instant replies or hire more workers. Idle queue checks, polling and heartbeats invoke no models.

## 9. Session security, retention and safety

Use strong random session secrets stored hash-only server-side, Secure/HttpOnly/SameSite cookies, same-origin access and CSRF protection for cookie-authorized writes. Validate conversation/question ownership on every read, mutation and idempotent retry. Do not place session/bearer secrets in URLs or localStorage. No anonymous listing, shared-cache storage or referrer leakage for private chats; use private/no-store responses, noindex and safe link behavior. Plain text and safe Markdown only; no unsanitized employee or visitor HTML.

Proposed session lifetime is 24 hours absolute; proposed raw question/answer retention is seven days maximum, or earlier on visitor deletion. Retain minimal non-content dedupe/cancellation metadata for a bounded 30 days so delayed jobs cannot resurrect deleted content. Retention timers cover both hosts, logs, generated Q&A attachments and backups; document backup expiry/restoration suppression. A deletion marker must be applied when restoring a backup. These are design defaults requiring review, not a claim of regulatory compliance or deletion from external providers.

No email/name/account required. Show actual operator/provider access, research sharing and retention before Send. Optional external search does not automatically receive full chat history, personal details or raw IP: send only the minimum safe query under the separate grant. Public questions are not training/company-memory input by default and are not automatically exported as public content. Abuse logs use minimal short-lived identifiers and avoid question bodies/cookie secrets; no advertising tracking is added.

Answer general topics under an explicit safety policy. Distinguish educational financial explanations from individualized financial instructions; do not solicit real brokerage credentials or execute requests. Decline requests for secrets or dangerous actions without revealing protected information. Refusal or uncertainty is a valid employee response. The showcase should show accountability, not suggest universal expertise or risk-free advice.

## 10. Acceptance and launch prerequisites

These checks extend A01–A12 in [Validation](VALIDATION.md). They remain future acceptance, not evidence of current capability.

| ID | Required evidence |
| --- | --- |
| ASK-A01 | A real general non-investment question gets one authentic employee answer; opening/typing/polling creates zero model work. |
| ASK-A02 | Trade-context button resolves exact run/decision/receipt/artifact versions; answer cites contemporaneous evidence and separates later interpretation. No hindsight rewriting. |
| ASK-A03 | Topic/provenance routing, relevant follow-up, busy employee, disclosed fallback and handoff preserve actual worker identity and one accepted answer. |
| ASK-A04 | Anonymous ownership/cookie/CSRF controls prevent cross-session reads and ID guessing; private Q&A never appears in public events, search, caches or artifacts. |
| ASK-A05 | Injection/owner impersonation/tool requests cannot read private worker/visitor state, alter trades, start Tasks/groups or pollute investment memory. Test enforced tool/context denial, not just compliant wording. |
| ASK-A06 | Duplicate send/claim/answer, lost response, lease expiry, restart and restored consumer cause no duplicate accepted reply or blind model replay. Unknown provider work stays fenced. |
| ASK-A07 | Cancellation/deletion/expiry/revocation racing dispatch or delivery withholds late bodies; privacy-control sync and backup restore honor deletion markers. |
| ASK-A08 | Flood/concurrent sessions/busy queue/malicious receiver cannot exceed HQ budgets or two-slot/per-worker limits, nor starve time-sensitive investment work. |
| ASK-A09 | Optional public-Q&A research permission is explicit; restricted/unavailable/stale sources produce honest limited answers and correct citation visibility. |
| ASK-A10 | General page + embedded/contextual chat works on mobile/keyboard, shows genuine queue/error/offline states, and offers privacy/retention/clear-chat controls. |
| ASK-A11 | Private trial uses actual employees and at least general, contextual, follow-up and disallowed-action cases; record costs, interventions and evidence provenance. |
| ASK-A12 | Separate owner activation, finite quotas, approved eligible roster, privacy notice, moderation settings and emergency shutoff are verified before anonymous public access. |

Launch needs the completed Ask build packets, shared contract fixtures, security/recovery review, genuine employee evidence and an explicit public-service grant. It is permissible to deploy a disabled feature while prerequisites are pending, but not to advertise working chat based on canned fixture responses. Portfolio launch and Ask activation are separately controlled even though both are required for the revised complete showcase.

## 11. Primary references

Checked 2026-10-06. These support risk controls, not a claim that the proposed system is already secure.

- [OWASP Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/): malicious direct/indirect inputs can affect output and tool use; constrain privileges and test the boundary rather than relying only on prompts.
- [OWASP API resource consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/): set time, request, size and provider-expense limits for public workloads.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): protect session secrets/cookies and enforce lifecycle/ownership controls.
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): SameSite is defense in depth, not a replacement for appropriate CSRF defenses.

Do not use this document as provider-subscription approval. Implementation must verify that the configured runtime and provider terms permit anonymous third-party service use and fit the owner's account/plan before enabling Ask BotSquad. Preserve the existing licensed/approved account boundary; do not assume a development login automatically authorizes a public AI service.

## INV-01 contract and feasibility result

[Contract 1.0](../../../contracts/investment/v1/PROTOCOL.md) supplies private Ask DTOs/OpenAPI, session ownership, claims/control sync, routing/actual-worker response identity, general public-source citations, exact contextual records, suppression receipts and offline recovery cases. It also adds a safe eligible-worker roster route. Complete paginated control application/acknowledgment is required before dispatch/release; immutable answers survive refreshed delivery wrappers without another model call. Withdrawn original question context suppresses output even when citations omit it.

The observed HQ runtime is ChatGPT-authenticated and is not cleared for anonymous third-party use. A separately approved API-backed adapter/account with verifiable token/cost/retention controls is the recommended prerequisite; current private worker sessions and CompanyKnowledge tools are unsuitable. [Evidence and official terms](../../validation/investment/INV-01.md) distinguish verified facts from pending approval. Actual worker identity remains mandatory. No public Ask runtime or provider execution was activated; INV-ASK packets remain planned.
