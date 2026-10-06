# Architecture and integration boundaries

**Version:** 1.1 | **Status:** Proposed, not implemented | [Guide](README.md)

**Ask BotSquad:** [The feature specification](ASK_BOTSQUAD.md) owns the added general/contextual public-question lane, routing, private session store and `/api/ask/v1` protocol. Portfolio publication below remains separate. Visitors request scoped answers, never trades or owner commands. [Decision 028](../../decisions/decision_028_ask_botsquad_public_questions.md) records the explicit boundary amendment.

## 1. Ownership

| Layer | Owns | Must not do |
| --- | --- | --- |
| BotSquad workers | Research, discussion, recommendations, decisions, outcome interpretation; separately scoped public answers | Invent prices/balances, hold credentials, bypass policy or carry private work context into visitor chat |
| Trusted HQ simulator | Orders, fills, cash, positions, basis, corporate actions, valuation, risk | Place real orders or accept prose as a balance change |
| Trusted HQ publisher | Scoped investment projection, public IDs, artifact copies, outbox, authenticated delivery | Export arbitrary HQ state or expand its own grant |
| Trusted HQ Ask adapter | Bounded question retrieval/admission, worker routing, isolated answer work and private result delivery | Convert visitor requests into investment Tasks/actions or expose private context |
| Asymmetri receiver | Validate/retain public investment records and receipts, serve public views | Command HQ or become the financial authority |
| Asymmetri Q&A service | Session-owned private question queue/responses, abuse checks and privacy controls | Treat website admission as HQ authority or leak chats into the public archive |
| Asymmetri website | Explain/display the experiment and provide the bounded Ask interface | Mutate portfolio state, expose administration or show another visitor's chat |
| MacBook Codex | Build, test and explicitly deploy both codebases | Be the continuing scheduler/data relay |

A receiver outage does not undo a paper trade. A public receipt does not create one. The HQ ledger is authoritative. An Ask answer explains records but cannot change the ledger or its original rationale.

## 2. Runtime shape

```text
Public news/filings              Structured licensed market data
        |                                     |
scoped research broker                 trusted price adapter
        |                                     |
BotSquad workers ---- decisions ---- paper-trading simulator
        |                                     |
        +------ approved durable records -----+
                           |
                  HQ database + outbox
                           |
              scoped projection and signer
                           |
                    outbound HTTPS
                           v
        asymmetri.co /api/experiments/v1/...
                           |
          isolated receiver + public archive
                           |
               read-only JSON/artifact routes
                           |
             /botsquad/investment and details
```

Portfolio publication is one-way in authority: acknowledgements are bounded receipt data, never executable instructions or worker prompts. Do not expose HQ's listener or add an inbound webhook.

The new question lane is distinct:

```text
Visitor -> Asymmetri /api/ask/v1 -> private session/question store
                                      ^
                                      | authenticated outbound HQ pull
HQ local Ask grant -> admission -> relevant actual employee
                                      |
                                      | scoped private answer outbox / HTTPS
                                      v
Asymmetri private answer store -> only the requesting visitor
```

Unlike the publication lane, this adapter deliberately admits untrusted external questions as bounded answer requests. It has separate local grants, credentials/scopes, quotas and session-isolated contexts. No general callback, owner impersonation or website ability to force model/trading work exists. Even a compromised queue must pass independent HQ admission and budget checks. Questions and answers are not automatically investment evidence or company memory.

## 3. Repository responsibilities

### BotSquad — `eugenelin89/bot_messenger`

This repository owns the cross-repository specification and contract version. Suggested investment modules are `src/domain/investment.ts`, `src/control/investment.ts`, market-data and publication adapters, additive migrations and private owner UI. These are proposed paths, not existing code. Ask adds a separately typed public-service request/admission/routing adapter; select actual module names after inspecting current code.

Reuse the dispatcher, mandate scheduler, working groups, scoped evidence and context continuity. No second agent scheduler or independent investment-agent service. Paper-order tools are available only in eligible, explicitly granted execution contexts. Publication transport is trusted code, not a model calling arbitrary HTTP. Ask contexts have read-only answering tools and cannot inherit those paper-order or engineering tools.

### Asymmetri — `eugenelin89/asymmetri`

The dashboard extends current `app/` routes and design tokens. The preferred investment backend is a small dedicated receiver behind Nginx at `/api/experiments/v1/`, with a dedicated non-root identity and owned database/content directory. This remains a REST API on Asymmetri.co; the split is an implementation boundary.

Add `/api/ask/v1` as a separately authorized Q&A surface with a private session/queue/response store. Public investment GET routes must never expose its rows. Anonymous-session access, necessary cookies, short-lived abuse controls, retention/deletion and operator/provider processing require explicit website disclosures. No visitor account, global chatroom or marketing tracking is required.

Next.js reads public investment data and owns neither the archive database nor publisher signing authority. The receiver gets no SSH/deployment credentials or access to unrelated websites. Avoid the existing broad website deployment identity for this new stateful service. Session-owned Q&A reads must be no-store/private and cannot pass through the public caching layer.

INV-01 must inspect the actual host and select a supported minimal runtime, SQLite driver and unused loopback port. Do not silently upgrade the existing Node 22 website or assume HQ's SQLite API works on every runtime. Pin/test the chosen runtime and driver. Provisioning belongs to explicit deployment authorization. Ask provider/public-service use must also be verified before activation.

Keep the Vinext/Cloudflare build working. Do not import local SQLite drivers into edge page code. Narrow configured public-read and private-session clients support production, fixture and disabled states; builds must not require live network access. No Cloudflare backend/storage deployment is implied.

## 4. Existing limits and fit

At the original reviewed baseline `ce99212c882327ad8e04fd3603867ac18428e1a4`, `src/domain/model.ts` has fixed capability profiles and Task kinds, not investment or public-Q&A tools. Changing a worker's display title cannot create the missing capability. This amendment was prepared from `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5`, preserving intervening Personal Operator work.

The documented baseline has eight workers, three direct reports per manager, two hierarchy edges, two global execution slots and one active execution per worker. Recheck implementation constants in INV-01. Reuse eligible workers with experiment/public-service responsibilities; preserve their normal roles. Ask uses at most one shared slot and finite low-priority budgets; do not increase capacity or let public traffic starve owner/market-deadline work.

Public research, group evidence sharing, Company Knowledge, paper-order authority, public publication and Ask answering are separate permissions. Membership in a discussion or the public-service roster grants none of the others. Existing device Client API v1 and private owner boundaries remain unchanged.

Prompt 11's exact supervised GitHub-document adapter is not a general REST publisher or public-question adapter. Each new standing envelope requires review, testing and explicit owner activation, not authority inherited from a prior pilot.

## 5. Persistence

Use additive, versioned migrations. Migration/startup/UI inspection creates no workers, runs, grants, schedules or model work.

### HQ investment records

| Record | Invariant |
| --- | --- |
| Experiment/run | Frozen configuration hash, official/trial identity, lifecycle and times |
| Scoped assignment | Existing worker IDs and experiment responsibilities, not role rewrites |
| Decision/review | Immutable author/execution, evidence cutoff, alternatives, dissent and references |
| Order/receipt | Unique intent, rules version, risk result, target session and terminal outcome |
| Journal/position | Append-only effects; derived balances replay exactly |
| Instrument/market evidence | Stable ID, symbol history, calendar, source, event/available/retrieval times, adjustment mode |
| Corporate action | Source version, effective/pay times, entitlement and idempotent effects |
| Valuation | Ledger version, marks, coverage, benchmark state and revision |
| Deliverable/public mapping | Exact private origin to public version; mapping stays private |
| Publication grant | Owner, destination, run, audience, record classes, limits, expiry/revocation |
| Outbox/attempt/receipt | Public projection, dependencies, attempt state and acknowledgement |

Commit simulator effects and corresponding outbox entries in one HQ database transaction. Do not claim atomicity across databases or HTTP. Stage artifact bytes durably before committing references; publication waits for verified bytes. Ask imports/answers have separate scope/retention and no financial journal effects; its answer/outbox commit is likewise atomic within HQ.

### Public investment receiver records

Use public-only `experiments`, `runs`, `publishers`, `events`, `snapshots`, `discussions`, `contributions`, `decisions`, `artifact_versions`, `content_objects`, `receipts`, `visibility_actions` and `projection_checkpoints`, or equivalent explicit schema.

Accepted immutable events/artifact versions are public history; read models can be rebuilt. A snapshot is a versioned observation, not a balance-reset command. Enforce scoped uniqueness, references and monotonic view advancement. Corrections preserve earlier records; exceptional withdrawals are separately audited.

Proposed investment paths: `/var/lib/asymmetri-experiments/archive.sqlite` and `/var/lib/asymmetri-experiments/content/`. Verify/authorize actual paths before deployment. Ask requires a distinct private store, response authorization and separate backup/retention policy; see its normative specification. Runtime databases, credentials and generated artifacts never belong in Git, `.next/` or build output.

## 6. State boundaries

Investment readiness progresses through `draft`, `configured`, `private_trial`, `ready_for_public`, `active`, `paused`, `ended`, `archived`. Trial and official runs have distinct IDs/initial ledgers; readiness does not convert trial trades into official history. Ending a run is terminal for new orders.

Investment outbox states: `prepared`, `eligible`, `sending`, `acknowledged`, `retry_wait`, `blocked`, `withheld`, `revoked_before_send`. A missing HTTP response is not a new event or investment decision. Ask question/answer/claim lifecycles are specified separately; lease expiry or lost answer receipt never implies permission to repeat model work.

Never hold a SQL transaction across model execution, lookup, upload or network delivery. Reserve limits durably, perform I/O outside the transaction and recheck authority before commitment/delivery. Late receipts remain recorded after revocation without renewing permission. Visitor cancellation/deletion additionally suppresses late answer content without changing investment history.

## 7. Consistency and freshness

Use at-least-once delivery and immutable deduplication identities. Promise effectively-once accepted records, not exactly-once network or model invocation. [Public API](PUBLIC_API.md) and [API security](API_SECURITY_AND_DELIVERY.md) own investment transport semantics; [Ask BotSquad](ASK_BOTSQUAD.md) owns Q&A protocol and answer receipts.

Separate contribution, publication, receipt, price-observation and browser-refresh times. Expose team activity, publication freshness and valuation freshness separately. A healthy page connection does not establish fresh prices. Ask shows actual routed/queued/answering status and evidence dates, not invented thinking or guaranteed instant replies.

Initial investment targets to measure: accepted contributions visible within 30 seconds in a visible tab; trusted heartbeat every 60 seconds without model calls; publication stale after three missed heartbeats. These are design targets, not measured guarantees. Market closure is not automatically a stale-price fault.

## 8. Failure containment

A compromised receiver can alter its displayed archive or submit hostile questions through the new lane. Signing does not prove analysis correctness or make the website invulnerable. It must not reveal HQ signing material or gain control over HQ. Independent Ask admission, context/tool isolation and caps enforce that boundary even for authenticated queue data.

On prolonged investment publication failure, retain history and stop new risk at configured backlog/time limits. Do not discard unacknowledged records, fill disk, regenerate decisions or replay successful model work. Accounting uncertainty stops new orders. Unsupported corporate actions visibly degrade valuation. Ask overload expires/rejects queued questions under its own budgets rather than stealing investment capacity.

No federation, multi-company tenancy, visitor accounts, general webhooks, object-storage platform or treasury framework is required. The narrow Ask exception admits questions and returns answers; it does not authorize public tasks, company-wide transcript access or automatic promotion of visitor content into investment evidence.
