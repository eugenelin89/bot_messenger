# Public Experiment API v1 — resources and payloads

**Version:** 1.1 | **Status:** Contract1.0 and disabled receiver/archive implemented | [Guide](README.md)

This document specifies publication resources; [schema/OpenAPI and protocol](../../../contracts/investment/v1/PROTOCOL.md) own exact wire definitions. [Security and delivery](API_SECURITY_AND_DELIVERY.md) owns signing, receipts, ordering, errors and limits. INV-01 supplies versioned JSON Schema/OpenAPI, generated types and disposable golden fixtures.

Implementation status: [INV-02 receiver evidence](../../validation/investment/INV-02.md) records the exact Asymmetri consumer commit, manifest digest and supported route behavior. Public investment reads, signed ingestion/receipts/heartbeat and private content staging work locally; INV-03 now implements exact-version SHA256-verified byte downloads with current rights/visibility rechecks, alias suppression and no-store headers. [INV-03 evidence](../../validation/investment/INV-03.md) records tested behavior and inactive private installation. No Ask endpoints or public receiver listener are activated. This document revision does not change wire contract1.0.

The [website receiver's implementation and status](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md) and the [cross-repository map](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md) are maintained in Asymmetri. INV-04's source-only frontend expects the visibility/cursor headers added in that repository, without changing this canonical v1 JSON contract. The privately installed receiver has not been coordinated with the public website for real traffic.

## 1. Scope and routes

Base path: `/api/experiments/v1` on Asymmetri.co.

Below, `{prefix}` means `/experiments/{experimentId}/runs/{runId}`. Experiment is a trusted configured slug; run and record IDs are generated opaque IDs. A publisher is configured server-side for exact experiment/run IDs, event classes and quotas. A request cannot create publishers or widen its scope.

| Method and path after base | Access | Meaning |
| --- | --- | --- |
| `POST {prefix}/events` | Signed publisher | Atomic bounded event batch and public read-model update |
| `PUT {prefix}/content/{sha256}` | Signed publisher | Stage immutable allowed artifact bytes |
| `POST {prefix}/heartbeat` | Signed publisher | Last-contact record only; no financial or worker action |
| `GET {prefix}/receipts/{batchId}` | Signed publisher | Reconcile a missing acknowledgement |
| `GET /experiments/{experimentId}` | Public | Description, official run pointer, methodology and archive |
| `GET {prefix}/status` | Public | Run/team/publication/valuation health |
| `GET {prefix}/snapshot` | Public | Latest complete eligible valuation and consistency watermark |
| `GET {prefix}/events?after={cursor}&limit={n}` | Public | Bounded append-order feed |
| `GET {prefix}/performance?from={date}&to={date}&resolution=daily` | Public | Versioned portfolio/benchmark/drawdown series and coverage |
| `GET {prefix}/discussions` | Public | Paginated topics |
| `GET {prefix}/discussions/{id}` | Public | Charter summary, participants, contributions, synthesis |
| `GET {prefix}/decisions/{id}` | Public | Decision, dissent, evidence, order and outcome links |
| `GET {prefix}/artifacts` | Public | Deliverable registry including safe withheld records |
| `GET {prefix}/artifacts/{id}/versions/{version}` | Public | Exact artifact metadata |
| `GET {prefix}/artifacts/{id}/versions/{version}/content` | Public | Published, non-withdrawn bytes only |
| `GET {prefix}/records/{kind}/{id}/versions/{version}` | Public | Exact typed record or safe tombstone |
| `GET {prefix}/transactions` | Public | Paginated paper orders and journal with typed filters |

Unsupported methods return 405. Receipt GETs are not anonymous. No arbitrary URL fetcher, filesystem browser, SQL endpoint or public administration. Owner control stays local/private.

Snapshots are submitted as versioned events, not a separate mutable PUT that can race with trades. This is an intentional refinement of the initial conversation sketch.

## 2. Batch and event envelopes

A batch contains `schemaVersion`, `batchId`, `experimentId`, `runId`, `events`. `Idempotency-Key` equals `batchId`. Freeze membership and bytes after first transmission; retries use the same body and a fresh signature.

| Event field | Rule |
| --- | --- |
| `schemaVersion` | Exact supported version, initially `1.0` |
| `eventId` | Immutable generated public ID |
| `experimentId`, `runId` | Match path, batch and authenticated scope |
| `sourceSequence` | Positive decimal integer string, unique within run, durably allocated at HQ |
| `type` | Supported discriminator from the catalogue below |
| `occurredAt` | Original event time, RFC 3339 UTC |
| `recordedAt` | HQ durable recording time, RFC 3339 UTC |
| `actor` | Trusted projection: system, owner or registered public worker ID |
| `publicationPolicyVersion` | Exact granted publication policy |
| `evidenceMode` | `synthetic_fixture` or `observed_paper`, never inferred from prose |
| `references` | Bounded typed public IDs and exact artifact versions |
| `payload` | Strict type-specific schema; unknown fields rejected |

Receiver adds `receivedAt`, `receiverSequence`, event hash and receipt identity. Private origin mappings stay at HQ. Text saying “Atlas approved” is not proof of authorship.

Money, quantities, percentages and large sequences use bounded decimal strings. Nullable unknown values differ from zero. Reject duplicate JSON keys, invalid Unicode, excessive nesting, unsupported enums and unknown identity-bearing fields. Monetary precision is defined in [Simulation rules](SIMULATION_RULES.md).

## 3. Event catalogue

| Type | Required payload |
| --- | --- |
| `run.published` | Frozen description/configuration, rules hash, evidence mode and initial state |
| `team.published` | Participating public workers and scoped responsibilities |
| `run.status` | Lifecycle, reason, next review if known, effective time |
| `worker.activity` | Worker, real activity, public work reference, start/finish time |
| `discussion.opened` | Topic, public charter summary, audience policy, participants |
| `discussion.contribution` | Author, topic-local ordinal, body, reply-to and evidence links |
| `discussion.closed` | Outcome, dissent, unresolved concerns, exact synthesis version |
| `artifact.registered` | Deliverable identity, author, status, title and safe relationships |
| `artifact.published` | Version, content hash/type/size, sources and immutable links |
| `decision.published` | BUY/SELL/HOLD, rationale, alternatives, risks, independent review, evidence cutoff and artifact links |
| `paper.order` | ID, decision revision, instrument/quantity, status, price guard and reason |
| `paper.ledger_transaction` | Contiguous journal sequence, predecessor/current hashes, effect type, public entries and order/action link |
| `portfolio.snapshot` | Valuation revision, journal watermark/hash, marks, cash/holdings/equity, returns, benchmark, quality and source times |
| `review.published` | Original decisions, observations, interpretation, limitations, next disposition |
| `content.corrected` | Prior record/version, replacement reference and reason |
| `market.action` | Provider action evidence, including ticker changes; no duplicate journal mutation |
| `instrument.updated` | Stable identity, action-linked effective symbol history |
| `publication.notice` | Safe omission/delay/rights/withdrawal notice |

A fill is a ledger transaction with effect type `fill`; do not also apply a second financial mutation named “trade executed.” Other journal effects include initialization, dividends, splits and corrections. Feed labels can say BUY or SELL without changing ledger semantics.

The run's public configuration includes purpose, objective, initial capital/currency, selected benchmark label, methodology hash/version, data delay/attribution, start/end, official/trial status and limitations. No provider secrets or private operational paths.

A snapshot includes `valuationSequence`, `revision`, `journalSequence`, `journalHash`, `configurationHash`, `markSetId`, `valuationAsOf`, currency, cash, receivables, holdings, total equity, realized/unrealized result, return and benchmark fields, drawdown and `quality`. Each holding has stable public instrument ID, symbol, quantity, book cost, mark/value, price time and sector. Unsupported/missing values are null with reasons, not zero. Revisions never erase original observations.

## 4. Example contribution payload

The complete synthetic contribution, with required `contributionId`, ordinal, sources, evidence and prerequisite records, is in [golden.json](../../../contracts/investment/v1/golden.json). Use that named-schema-valid fixture rather than copying a partial illustrative object. It is not a real worker statement and must never be published as observed activity.

## 5. Artifacts and references

Stage content first using its exact SHA-256. Then accept `artifact.published` metadata containing public artifact ID, positive version, title, author, created/published times, content type/size/hash, exact public origin references, sources, rights status and supersedes relationship. Only then accept referring message/decision events.

An upload is not publication. Content becomes public only through authorized, non-withdrawn artifact metadata. Guessing a content hash cannot bypass that rule. Public content paths resolve metadata to generated keys; no worker-selected paths or server-side fetch of supplied URLs.

Public sources contain canonical HTTPS URL, title, publisher, original publication/event time when known, retrieval time, evidence limitations and permitted excerpt/summary. Unknown dates remain unknown. Private query strings and internal source histories are not exported.

Relationship types include `supports`, `challenges`, `summarizes`, `supersedes`, `reviews`, `results_in` and `produced_by`. Initial cyclic dependencies are avoided by publishing objects first and adding a later linking event. Every exact version reference must remain readable or resolve to an explanatory tombstone.

## 6. Public reads and compatibility

Collections use bounded cursor pagination, default 50 and maximum 100 rows. Cursors bind run, filters and archive epoch. Public responses include schema version, next cursor, consistency watermark and freshness/coverage. Invalid/reset cursor responses instruct clients to refetch status/snapshot and a bounded page. Never force a full archive download on each refresh.

Support ETags, reasonable short caching and same-origin reads. Protected receipt responses are never publicly cached. Anonymous reads are rate-limited. Downloads use type-safe headers and the visibility policy described in [Publication and artifacts](PUBLICATION_AND_ARTIFACTS.md).

Strict receivers reject unsupported versions/types. Do not silently change v1 semantics. Canonical schema/fixtures live in BotSquad; Asymmetri vendors a reviewed copy with commit/hash provenance. Both builds run identical golden contract cases. No live dependency on a mutable GitHub branch.

Deploy receiver compatibility before producer changes, then separately activate owner authority. Record both commits and contract versions. Rollback blocks new writes before incompatible code reverts; no destructive database downgrade. This API is unrelated to, and does not expand, BotSquad's existing authenticated native Client API v1.
