# Architecture and integration boundaries

**Version:** 1.0 | **Status:** Proposed, not implemented | [Guide](README.md)

## 1. Ownership

| Layer | Owns | Must not do |
| --- | --- | --- |
| BotSquad workers | Research, discussion, recommendations, decisions, outcome interpretation | Invent prices/balances, hold credentials, bypass policy |
| Trusted HQ simulator | Orders, fills, cash, positions, basis, corporate actions, valuation, risk | Place real orders or accept prose as a balance change |
| Trusted HQ publisher | Scoped projection, public IDs, artifact copies, outbox, authenticated delivery | Export arbitrary HQ state or expand its own grant |
| Asymmetri receiver | Validate/retain public records and receipts, serve public views | Command HQ or become the financial authority |
| Asymmetri website | Explain and display the experiment | Mutate portfolio state or expose administration |
| MacBook Codex | Build, test and explicitly deploy both codebases | Be the continuing scheduler/data relay |

A receiver outage does not undo a paper trade. A public receipt does not create one. The HQ ledger is authoritative.

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

One-way means **no command or callback authority from the website to HQ**, not absence of HTTP responses. Treat acknowledgements only as bounded receipt data, never executable instructions or worker prompts. Do not expose HQ's listener or add an inbound webhook.

## 3. Repository responsibilities

### BotSquad — `eugenelin89/bot_messenger`

This repository owns the cross-repository specification and contract version. Suggested new modules are `src/domain/investment.ts`, `src/control/investment.ts`, market-data and publication adapters, additive migrations and private owner UI. These are proposed paths, not existing code.

Reuse the dispatcher, mandate scheduler, working groups, scoped evidence and context continuity. No second agent scheduler or independent investment-agent service. Paper-order tools are available only in eligible, explicitly granted execution contexts. Publication transport is trusted code, not a model calling arbitrary HTTP.

### Asymmetri — `eugenelin89/asymmetri`

The dashboard extends current `app/` routes and design tokens. The preferred backend is a small dedicated experiment receiver behind Nginx at the public `/api/experiments/v1/` prefix. It has a dedicated non-root identity and owns its database/content directory. This remains a REST API **on Asymmetri.co**; the service split is an implementation boundary, not a different product.

Next.js reads public data and does not own the archive database or publisher signing authority. The receiver gets no SSH/deployment credentials or access to unrelated websites. Avoid using the existing broad website application identity for this new stateful service.

INV-01 must inspect the actual host and select a supported minimal runtime, SQLite driver and unused loopback port. Do not silently upgrade the existing Node 22 website or assume HQ's SQLite API works on every runtime. Pin/test the chosen receiver runtime and driver. New service provisioning belongs to explicit deployment authorization.

Keep the Vinext/Cloudflare build working. Do not import a local SQLite driver into edge page code. A narrow public-read abstraction supports configured production, fixture and disabled states; builds must not require live network access. No Cloudflare receiver/storage deployment is implied.

## 4. Existing limits and fit

At reviewed baseline `ce99212c882327ad8e04fd3603867ac18428e1a4`, `src/domain/model.ts` has fixed capability profiles and Task kinds, not an investment role or trade tool. Changing a worker's display title cannot create the missing capability.

The documented baseline has eight workers, three direct reports per manager, two hierarchy edges, two global execution slots and one active execution per worker. Recheck implementation constants in INV-01. Reuse eligible workers with experiment-scoped responsibilities; preserve their normal engineering/research roles. Do not increase capacity to make acceptance easier.

Public research, group evidence sharing, Company Knowledge, paper-order authority and public publication are separate permissions. Membership in a discussion grants none of the others. Existing device Client API v1 and private owner boundaries remain unchanged.

Prompt 11's exact supervised GitHub-document adapter is not a general REST publisher. A standing experiment publication envelope is a new narrowly scoped feature requiring review and tests; it is not authority inherited from the prior pilot.

## 5. Persistence

Use additive, versioned migrations. Migration/startup/UI inspection creates no workers, runs, grants, schedules or model work.

### HQ records

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

Commit simulator journal changes and corresponding outbox entries in **one HQ database transaction**. Do not claim atomicity across two databases or HTTP. Stage artifact bytes durably before committing their references; publication waits for verified bytes.

### Receiver records

Use public-only `experiments`, `runs`, `publishers`, `events`, `snapshots`, `discussions`, `contributions`, `decisions`, `artifact_versions`, `content_objects`, `receipts`, `visibility_actions` and `projection_checkpoints` tables, or equivalent explicit schema.

Accepted immutable events/artifact versions are the public history; read models can be rebuilt. A snapshot is a versioned observation, not a balance-reset command. Enforce scoped uniqueness, foreign references and monotonic view advancement. Corrections preserve earlier records; exceptional visibility withdrawals are separately audited.

Proposed paths: `/var/lib/asymmetri-experiments/archive.sqlite` and `/var/lib/asymmetri-experiments/content/`. Verify/authorize actual paths before deployment. Runtime databases, credentials and generated artifacts never belong in Git, `.next/` or build output.

## 6. State boundaries

Readiness progresses through `draft`, `configured`, `private_trial`, `ready_for_public`, `active`, `paused`, `ended`, `archived`. A private trial and an official run always have distinct IDs and initial ledgers; readiness does not convert trial trades into official history. Ending a run is terminal for new orders.

Outbox states: `prepared`, `eligible`, `sending`, `acknowledged`, `retry_wait`, `blocked`, `withheld`, `revoked_before_send`. A missing HTTP response is not a new event or new investment decision.

Never hold a SQL transaction across model execution, price lookup, file upload or network delivery. Reserve limits durably; do I/O outside the transaction; recheck authority before commitment/delivery. Late receipts remain recorded after revocation without renewing permission.

## 7. Consistency and freshness

Use at-least-once delivery and immutable deduplication identities. Promise effectively-once accepted records, not exactly-once network or model invocation. [Public API](PUBLIC_API.md) owns batch, dependency and ordering behavior.

Separate contribution time, publication time, receipt time, price-observation time and browser-refresh time. Expose three health dimensions: **team activity**, **publication freshness**, **valuation freshness**. A healthy page connection does not establish fresh prices.

Initial targets to measure: new accepted contributions visible within 30 seconds in a visible browser tab; trusted heartbeat every 60 seconds without model calls; publication stale after three missed heartbeats. These are design targets, not measured guarantees. Market closure is not automatically a stale-price fault.

## 8. Failure containment

A compromised receiver could alter its displayed archive; signing does not prove investment correctness or make the website invulnerable. Its identity must not permit access to HQ, and HQ must reject all supposed callback commands.

On prolonged publication failure, retain history and stop new risk when configured backlog/time limits are reached. Do not discard unacknowledged records, fill disk, regenerate decisions or replay successful model work. Accounting uncertainty stops new orders. Unsupported corporate actions visibly degrade valuation.

No federation, multi-company tenancy, visitor accounts, arbitrary webhooks, general object-storage platform or treasury framework is required. Reuse a small versioned experiment envelope without prematurely building a platform.
