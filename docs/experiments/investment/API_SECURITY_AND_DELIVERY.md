# API security, consistency and delivery

**Version:** 1.0 | **Status:** Contract 1.0 implemented; runtime enforcement pending | [API resources](PUBLIC_API.md) | [Guide](README.md)

## 1. Authentication profile

Use HTTPS and a narrowly profiled implementation of RFC 9421 HTTP Message Signatures with Ed25519, and RFC 9530 Content-Digest using SHA-256. The exact [INV-01 profile and vectors](../../../contracts/investment/v1/PROTOCOL.md) are implemented and tested; do not invent delimiter-based signature canonicalization. [References](REFERENCES.md) lists the sources.

For writes, sign `@method`, `@authority`, `@path`, `botsquad-generation`, `content-type`, `content-digest` and `idempotency-key`. The path includes experiment/run identity. Forbid query strings on writes. Authenticated receipt GETs sign method, authority, path and `botsquad-generation`, carry no body/query and use the same key/freshness rules. The receiver validates the configured public authority through its trusted reverse-proxy configuration, not arbitrary forwarded headers.

Require signature parameters `created`, `expires`, `keyid`, `alg="ed25519"` and a cryptographically random per-attempt nonce. Validity is at most 300 seconds with at most 60 seconds clock tolerance. Check current key activation, algorithm, run/event scope, nonce and expiry before returning an idempotent receipt. Keep nonce records for the full accepted freshness interval; retries use fresh signatures/nonces over the original frozen body.

The trusted HQ publisher holds its signing credential outside worker access. The receiver holds verification material, not HQ's signing credential. Key rotation allows a deliberate overlap under the same stable publisher identity; retire the old key explicitly. Revoked keys cannot fetch receipts or replay accepted writes. Never place credentials/signatures in worker context, public errors, logs, repository fixtures or screenshots. Generate disposable test keys during tests rather than committing operational secrets.

Sign exact transmitted bytes. For immutable per-event hashes, use RFC 8785 canonical JSON excluding receiver-added fields. Money and large sequences remain strings. A request body digest and a canonical event hash are different checks. Golden vectors cover whitespace, Unicode, duplicate JSON keys, invalid numbers and altered method/path/body/header values.

## 2. Authorization and threat boundaries

Authentication does not imply unlimited publication. A server-side publisher record binds exact experiment/run, event classes, content types, audience-policy version, expiry and quotas. Current owner grant and source eligibility must also be rechecked at HQ before transmission. Worker text, a research grant, a discussion membership or an old GitHub-document approval cannot manufacture this authority.

No public route forwards to HQ. Receiver responses are bounded receipts/errors, never commands or model instructions. A receiver compromise can affect its own public display; signatures alone do not prevent that or prove analysis correctness. The design prevents it from obtaining HQ signing material or an authorized control channel into HQ.

Protect public reads and writes with body/page/rate limits, timeouts, exact content types, safe errors and process isolation. CORS or an unguessable URL is not write authorization. Do not offer arbitrary remote-fetch, file-path, shell or database-query parameters. Private admin/withdrawal operations are separate from publisher credentials and anonymous visitors.

## 3. Atomic batch acceptance

Perform bounded parsing and current signature/scope checks; validate schemas and references; verify staged artifact content; then open a short database transaction. Check uniqueness, insert accepted events, advance only consistent read models, persist a receipt and commit before acknowledging. Never make a network request while the transaction is open.

Unique constraints include:

| Key | Purpose |
| --- | --- |
| Publisher identity + run + batch ID | One immutable request receipt |
| Run + event ID | One immutable semantic event |
| Run + source sequence | A source position cannot be replaced by another event |
| Run + artifact ID + version | Exact immutable public artifact metadata |
| Run + journal sequence | One financial effect at each ledger position |

Same batch ID and identical body digest returns the original receipt, without another mutation. Different bytes under the same batch ID return 409. A new batch may contain an identical already-accepted event and receive a duplicate acknowledgement; changed content under the same event ID is a conflict. Validate the entire batch before accepting any new event. Concurrent duplicates converge through SQL constraints rather than process-local caches.

First acceptance returns 201; an identical completed retry returns 200. Receipt contains batch ID, body digest, receipt ID, received time, accepted/duplicate IDs, highest receiver cursor and current complete journal watermark. This proves public storage, not a new trade or verified investment thesis.

## 4. Ordering and dependent records

`receiverSequence` is append-order pagination. `sourceSequence` preserves HQ ordering, and topic-local ordinals preserve discussion order. Never use timestamps alone as cursors. Independent out-of-order activity can be retained with original times; do not imply source gaps are complete.

Dependencies must be accepted previously or earlier in the same batch. Missing prerequisites return retryable 409 `DEPENDENCY_NOT_READY` without partial effects. Upload bytes first, then publish artifact metadata, then referring contributions/decisions. A cycle of references is resolved through a later link/correction event, not impossible mutual initial prerequisites.

Financial journal sequences are contiguous from initialization with matching predecessor hashes. Missing predecessors block acceptance of later financial effects and complete snapshots. A snapshot names journal sequence/hash, configuration version, valuation sequence and mark-set ID. Receiver checks references and basic arithmetic as consistency validation; it does not originate accounting effects.

The latest snapshot advances only for a greater eligible valuation sequence. Older delayed snapshots remain history, not current state. Corrected historical valuations carry a new explicit revision and prior reference. Journal and corresponding snapshot may be accepted in one atomic batch.

Revocation/withholding can leave source gaps; do not create fake messages to fill them. A missing financial predecessor prevents a newer complete public portfolio until reconciled. Privacy withdrawal can intentionally reduce public reconstructability; disclose the resulting limitation.

## 5. HQ outbox and retries

Commit ledger effects and their public outbox entries in one HQ database transaction. Other committed public contributions/artifacts similarly get durable publication mappings. The publisher performs I/O later. A crash after commitment cannot lose the trade or require another model decision.

Freeze batch ID, membership and exact bytes after first transmission. A timeout triggers authenticated receipt lookup and bounded retransmission of the same batch with a fresh signature. It never creates a fresh financial order, new source event or replacement AI report. A 404 receipt is not proof there is no in-flight first request; identical retries remain safe because the receiver enforces uniqueness.

Use exponential backoff with jitter and Retry-After, finite attempt/admission budgets and a durable next-attempt time. Prioritize already committed financial records and dependencies. Stop new risk when configured backlog age/bytes exceeds the run's limit; preserve unsent history and show owner attention. Do not delete unacknowledged events to reclaim space.

Recheck authorization before each attempt. Revocation blocks unsent work but retains late acknowledgements and attempt evidence. It does not recall downloaded content or erase local trades. Key rotation must not change event/batch IDs or defeat deduplication.

A single active publisher lease and generation fence prevent two restored HQs from publishing diverging history. Restore requires reconciliation against remote receipts/journal watermark before authority resumes. Hash/sequence conflicts block and require investigation; no force-overwrite API.

## 6. Error contract

Use a bounded problem response with `code`, `requestId`, `retryable` and safe detail. Never return private body content, keys, stack traces or database paths.

| HTTP | Meaning | Required behavior |
| --- | --- | --- |
| 400 | Invalid request/JSON | Inspect immutable batch; no blind content rewriting |
| 401 | Invalid/missing/stale signature | Correct signing only while current authority exists |
| 403 | Wrong scope, expiry or revocation | Block and notify owner |
| 404 | Missing authorized resource/receipt | Reconcile; not proof no request is in flight |
| 409 | Conflict, dependency gap, sequence gap or replay | Retry only explicitly retryable codes |
| 413 / 415 / 422 | Size/type/schema failure | Block/fix contract; never silently truncate |
| 429 | Rate or quota | Honor bounded Retry-After and backoff |
| 500 / 503 / timeout | Potentially uncertain acceptance | Look up receipt/retry same frozen batch |

Public cursor resets return a bounded resynchronization instruction. Clients refetch status/snapshot and a bounded event page, not the entire archive.

## 7. Initial limits and monitoring

Proposed limits, to tune through measured acceptance: 50 events and 1 MiB per batch; 8,000 characters per contribution; 16 KiB artifact metadata; 128 KiB text/JSON; 4 MiB normalized PNG; JSON nesting depth 16; default 50/max 100 list rows; 60 publisher writes/minute plus explicit byte/day and storage quotas. Lower existing HQ work/artifact budgets always prevail. Limits never silently authorize larger model outputs.

Heartbeat is a signed small operational write with an attempt-specific idempotency key. It updates last-contact state and bounded operational audit, not an append-only investment event every minute. It creates no model work and proves neither a fresh valuation nor ongoing worker thought. Suggested heartbeat 60 seconds and stale-after-three misses remain design targets until measured.

Track acceptance/error counts, delivery latency, oldest outbox age, bytes pending, missing dependencies, ledger watermark, content integrity, grant expiry and storage headroom. Logs contain safe IDs and codes, not private research or credentials. Public status exposes only safe freshness/state summaries.

## 8. Compatibility, recovery and verification

Deploy compatible receiver before producer and activate separately. Both repositories pin contract versions and pass the same golden fixtures. Unsupported schemas fail explicitly. Rollback disables new admission before incompatible readers return; preserve database history rather than downgrade destructively.

Use SQLite-supported consistent backup methods with content manifests; an arbitrary copy of a live database without its transactional context is not a verified backup. Test isolated restore, content hashes, cursor-epoch reset, duplicate reconciliation and publisher generation fencing. See [Operations](TEAM_AND_OPERATIONS.md) and [Validation](VALIDATION.md).

Required tests include wrong-run identity, altered bodies, expired/revoked keys, nonce replay, concurrent duplicate batches, changed-content conflict, out-of-order snapshots, missing artifact content, lost response after commit, crash before receipt, key rotation, receiver outage and restore without duplicated paper effects.

## INV-01 conformance boundary

The versioned profile defines canonical serialization, current generation/key checks, exact hash recipes, no-store for every protected response, immutable answer versus delivery-wrapper identity and vendor pinning. Offline helpers are not an HTTP server or durable nonce store. INV-02 must prove raw-header/proxy behavior, commit-time scope/nonce/receipt atomicity, concurrent uniqueness, restore/cursor fencing and production-safe rendering. See [evidence](../../validation/investment/INV-01.md).
