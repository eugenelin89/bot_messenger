# BotSquad Client API v1

**Status:** Implemented and accepted on Ubuntu under Prompt 06. See the [validation record](../validation/prompt-06-remote-client-api.md).

This contract is independent of the browser `/api/...` implementation. The server
remains on its existing private loopback listener. Acceptance uses a workstation-side
SSH tunnel. There is no native app, relay, push service, public ingress or E2EE here.

## Transport and authority

Use a secure operator-managed transport. Plain HTTP is acceptable only on the
loopback segment of the SSH tunnel; do not transmit credentials over ordinary HTTP
on a network. A persisted `hq_<UUIDv4>` identifies the instance across upgrades,
restarts and host reboots. It is not cryptographic server authentication or TLS pinning.
SSH authenticates the acceptance transport.

The existing browser interface is a trusted operator surface. Access to its full
loopback/tunnel endpoint already permits local administration. A future transport
admitting devices with only device-level authority **must forward only `/api/v1/`**,
not `/api/session`, browser administration, static UI or arbitrary listener traffic.
Headers cannot distinguish a trusted SSH administrator from another program with
access to that same administrative tunnel. Device credentials themselves confer
no browser-session authority. This milestone adds no such transport/gateway.

The device API rejects browser `Origin`, `Cookie`, `Sec-Fetch-Site` and
`X-BotSquad-Token` headers and emits no CORS permissions. Native requests do not
need the browser's exact loopback Host/port. Browser routes retain their original
Host/Origin/session checks and reject Authorization headers.

## Encoding, envelopes and versioning

UTF-8 JSON; POST content type `application/json` (optional `charset=utf-8`). No
compressed bodies. Body limit 32,768 bytes; URL limit 2,048 characters. Unknown
fields, missing required fields, unexpected queries, duplicate credential headers,
wrong types, malformed JSON/UTF-8 and unsupported methods fail. Identifiers use
lowercase `<kind>_<UUIDv4>`; callers treat IDs as opaque. Times are UTC ISO-8601
with milliseconds. Boolean fields are JSON booleans.

Success:

```json
{"data":{"paused":true},"request_id":"request_<UUIDv4>"}
```

Error:

```json
{"error":{"code":"capability_denied","message":"Device does not have the required capability."},"request_id":"request_<UUIDv4>"}
```

`X-Request-ID` identifies the HTTP attempt. A replay returns the original response
body, including its original `request_id`; the new attempt still has a new header ID.
Never use error-message text for program logic. Responses have `Cache-Control:
no-store`; a native client may explicitly keep a protected, visibly stale read cache.

v1 fields/meanings remain stable. Clients should tolerate additional response fields
and feature flags, while requests remain strict. Incompatible semantics require a new
major API version. Unknown versions return `unsupported_version`/404. Feature discovery
is authoritative; do not infer capabilities from a server Git SHA.

## Discovery and capability discovery

`GET /api/v1/discovery` is unauthenticated and has no query parameters. Data contains
`hq_id`, `api_versions` (`["v1"]`), `server_version`, `commit` (or `unknown`) and
`authentication` (`Ed25519-challenge-opaque-token-v1`). No company data is returned.

`GET /api/v1/capabilities` requires an active authenticated device, but no particular
scope. Data contains API/HQ/device/owner IDs, granted `capabilities`, `features`,
`limits` and `limitations`. Current features include Project reads, artifact metadata,
reconnectable events and adapter-dependent interrupt. Artifact bodies, remote protected
approvals and remote device administration are false. One enabled human (`human`) and
one company per data root remain the current model.

## Pairing through the local Web UI

1. Open **Devices / Remote Clients** using the trusted browser/tunnel surface.
2. Select the capability ceiling. The default is `state:read` only.
3. Click **Create pairing**. Transfer the shown payload privately to the client.
4. The client creates its own Ed25519 key and claims the pairing.
5. Compare its public-key fingerprint with the pending device in the UI.
6. Click **Inspect and confirm**, then **Fingerprints match — confirm device**.

An open/claimed pairing expires ten minutes after creation. Its 32 random secret
bytes are unpadded base64url; only SHA-256 of that text is stored. It is scoped to the
HQ, existing human and one pairing. A claim consumes it; confirmation does not extend
the TTL. Denial/expiry cannot be reversed. A fresh pairing is required.

The textual payload is:

```text
botsquad://pair?v=1&hq_id=<HQ_ID>&pairing_id=<PAIRING_ID>&secret=<ONE_TIME_SECRET>
```

The endpoint/base URL is supplied separately through the trusted transport setup.
The client checks discovery's HQ ID before claiming. No QR renderer/scanner is supplied.

`POST /api/v1/pairings/claim` is unauthenticated, rate limited and accepts exactly:

```json
{
  "hq_id":"hq_<UUIDv4>",
  "pairing_id":"pairing_<UUIDv4>",
  "pairing_secret":"<32_RANDOM_BYTES_BASE64URL>",
  "public_key":{"kty":"OKP","crv":"Ed25519","x":"<32_PUBLIC_BYTES_BASE64URL>"},
  "display_name":"My reference client",
  "platform":"darwin",
  "app_version":"client-v1-1"
}
```

Metadata limits are 80/40/40 characters respectively, nonempty and without NUL.
JWK accepts exactly `kty`, `crv`, `x`; private `d`, extra fields, padding, wrong length,
noncanonical encodings and low-order keys are rejected. Fingerprint is `SHA256:` plus
unpadded base64url SHA-256 of the **32 raw public-key bytes** (not a JWK thumbprint).
The 201 response contains `hq_id`, `pairing_id` and the public device record, state
`pending`. No credential is issued. Active/pending reuse of one key is rejected.

Public device fields: `device_id`, `owner_principal_id`, `key_algorithm`, `fingerprint`,
`display_name`, `platform`, `app_version`, `state`, `capabilities`, `created_at`,
`confirmed_at`, `last_seen_at`, `revoked_at`. Last-seen writes are coalesced to at most
once per minute. The server never receives the private key. Device state is pending →
active → revoked, or pending → denied. Key, owner and capabilities are immutable.

Device administration uses only the local browser API and is not a v1 operation.
Revocation deletes token/challenge authority immediately and closes existing streams.
Device/security history remains retained.

## Proof of possession and short-lived access

`POST /api/v1/auth/challenge` accepts only `{"device_id":"device_<UUIDv4>"}`.
An active device with an enabled human owner receives:

```json
{
  "data":{
    "challenge_id":"challenge_<UUIDv4>",
    "hq_id":"hq_<UUIDv4>",
    "device_id":"device_<UUIDv4>",
    "nonce":"<32_RANDOM_BYTES_BASE64URL>",
    "expires_at":"2026-09-29T06:00:00.000Z",
    "signing_context":"botsquad-device-auth-v1"
  },
  "request_id":"request_<UUIDv4>"
}
```

Challenge lifetime is **60 seconds**. Sign exactly these UTF-8 bytes, with LF between
lines, **no trailing LF, no BOM and no JSON serialization**:

```text
botsquad-device-auth-v1
<hq_id>
<device_id>
<challenge_id>
<nonce>
<expires_at>
```

Use ordinary Ed25519, not Ed25519ph or a separately hashed message. Preserve exact
returned strings. `POST /api/v1/auth/token` accepts exactly `device_id`, `challenge_id`
and `signature` (64 raw signature bytes encoded as unpadded base64url). The challenge
is durable and can be consumed once. A validly encoded wrong signature also burns it.
Wrong device, consumed, expired or mismatched context cannot authenticate.

Success data contains `access_token`, `token_type: "Bearer"`, `expires_at`, HQ/device
IDs and capabilities. The token contains 32 random opaque bytes in base64url and lasts
**ten minutes**. Only its hash is persisted. Plaintext appears in that response once;
never persist it in logs, URLs, screenshots, source or worker prompts.

Send it only as `Authorization: Bearer <access_token>`. Cookies, query parameters,
body fields and browser CSRF tokens are not credentials. Each request checks token
expiry, active device, enabled human and the current capability ceiling. There is
no permanent bearer API key or refresh token: obtain a new challenge and prove key
possession again. Keep tokens only for their bounded session. Failed authentication
is not permission to silently pair a replacement identity.

## Read endpoints and explicit DTOs

All paths below are relative to `/api/v1`. No read query is accepted except `limit`
and `cursor` on collection endpoints.

| Endpoint | Scope | Data |
| --- | --- | --- |
| `GET /overview` | state:read | HQ ID, paused, runtime_status, worker/task/queued/active-execution counts, pending-approval count, event_cursor |
| `GET /workers`, `/workers/:worker_id` | state:read | Worker DTO |
| `GET /tasks`, `/tasks/:task_id` | state:read | Task DTO |
| `GET /executions`, `/executions/:execution_id` | state:read | Execution DTO |
| `GET /messages`, `/messages/:message_id` | state:read | Message DTO |
| `GET /projects`, `/projects/:project_id` | projects:read | Project DTO |
| `GET /repositories`, `/repositories/:repository_id` | projects:read | Repository DTO |
| `GET /projects/:project_id/repositories` | projects:read | Paginated repositories within that exact Project |
| `GET /artifacts`, `/artifacts/:artifact_id` | artifacts:read | Artifact metadata DTO |
| `GET /runtime` | state:read | Advertised default model and bounded model/reasoning choices |
| `GET /events` | state:read | Authenticated SSE, described below |

- **Worker:** worker_id, display_name, title, role, manager_worker_id, status,
  lifecycle, enabled, created_at, updated_at, current_task_id, configured_profile,
  last_execution_profile. Configured profile is ai_model/reasoning_effort (nullable
  inheritance), execution_priority and boolean ai_profile_locked. Last profile is
  model/reasoning_effort/execution_priority/runtime_version/runtime_adapter or null;
  it describes the last recorded execution, not a promise about the next one.
- **Task:** task_id, requester, assignee_worker_id, objective, acceptance_criteria,
  constraints, parent_task_id, status, kind, created_at, updated_at, repository_id,
  attention_required, has_result. Detailed internal blocking/error text and giant
  evidence/results are deliberately omitted. Use artifact metadata and the local UI.
- **Execution:** execution_id, task_id, worker_id, status, model, reasoning_effort,
  execution_priority, runtime_version, runtime_adapter, provenance_status, started_at,
  finished_at, has_error, interrupted. Unknown historical profile values remain null.
- **Message:** message_id, channel_id, sender_principal_id, recipient_worker_id, body,
  reply_to_message_id, related_task_id, execution_id, created_at.
- **Project:** project_id, name, description, status, created_at, updated_at,
  repository_count. No raw policy editor or giant policy JSON is required.
- **Repository:** repository_id, project_id, name, default_branch, current_commit,
  status, source_kind, remote_policy, remote_state, created_at, updated_at,
  latest_integration (integration_id/status/final_commit or null), latest_review
  (review_id/status or null).
- **Artifact:** artifact_id, task_id, execution_id, type, description, sha256,
  created_at, content_available (false). Content retrieval is deferred; no filesystem
  download route is exposed by v1.
- **Runtime:** default_model, models (up to 100), each with id/model/display_name,
  default_reasoning_effort and reasoning_efforts. Runtime authentication/account details
  are not exposed.

DTOs use explicit field allowlists. They do not serialize Company snapshots, raw SQL
rows, clone/workspace/credential paths, Codex thread IDs, approval envelopes, receipts
or internal error strings. Domain text deliberately supplied by the operator remains
normal domain content; do not put credentials in messages/objectives.

Collections return `{items:[...],next_cursor:null|"opaque"}` inside data. Default page
size 50, maximum 100. Cursor binds HQ, resource, optional Project, insertion offset and
initial high-water mark. New rows after page one appear on a fresh listing. Updates to
existing rows are authoritative current values; pagination is not a database snapshot.
Cursors contain no secret and cannot broaden the endpoint's scope. Refetch a list to
refresh its high-water mark. Invalid/foreign/future cursors fail, rather than resetting
silently.

## Mutations and capabilities

Every authenticated mutation requires a fresh or exactly retried `Idempotency-Key`.
JSON fields in this table are all required; extra fields fail.

| POST endpoint | Scope | Body / result |
| --- | --- | --- |
| `/messages` | messages:send | `{body}` → 201 Message DTO; creates no Task |
| `/objectives` | objectives:create | `{objective,acceptance_criteria,constraints}` → 201 Task DTO |
| `/projects/:project_id/repositories/:repository_id/objectives` | objectives:create | Same objective fields; exact registered Project/repository scope → Task DTO |
| `/dispatch` | dispatch:control | `{paused:boolean,expected_paused:boolean}` → `{paused}` |
| `/workers/:worker_id/profile` | profiles:update | `{profile,expected_profile}` → Worker DTO |
| `/executions/:execution_id/interrupt` | executions:interrupt | `{}` → `{execution_id,requested:true}` |

Text fields are nonempty, at most 8,000 characters. Initialize Atlas locally before
assigning remote objectives. Project policy/recipes/infrastructure must already permit
the requested operation. Prose cannot choose a different Project or grant authority.
Profile objects both contain ai_model/reasoning_effort (string or null),
execution_priority (`low|normal|high|critical`), ai_profile_locked (boolean). New choices
must be advertised by the current runtime. `expected_profile` and `expected_paused`
are compare-and-set preconditions against current server state; mismatch returns
`state_conflict`. A profile change applies to future executions and retains human-lock
semantics. Refresh and obtain current values before creating a new consequential
request. Do not blindly replay stale offline intent using a new key.

Interrupt requires an execution currently active in this dispatcher and a supporting
adapter. It does not undo completed external effects. Its durable accepted intent and
receipt precede the runtime signal. The same key returns the original accepted result;
restart recovery blocks/interruption-marks orphaned work instead of launching it again.

Remote approval decisions, worker provisioning/retirement, Project policy/remotes,
Git publication, repository creation/import, device administration and general retry/
cancel are deliberately absent. Messages saying “approved” do not approve anything.

## Idempotency and crash recovery

Key format: **13-digit Unix milliseconds, dot, lowercase UUIDv4**, for example
`1790650000000.12345678-1234-4234-8234-123456789abc`. Clients generate the key once and
persist it with the exact intent before sending. The server allows at most two minutes
of future clock skew and a **seven-day** retry window. Retain the same method/path/body
and device for retries. Key timestamps require a reasonably synchronized client clock.

The server binds a receipt to device, human, key, method, path and SHA-256 of canonical
JSON (object keys sorted recursively; arrays retain order). Whitespace/JSON property
order do not matter. Same key and same request return the exact original status/body.
A different method/path/body with the same key returns 409 `idempotency_conflict`.
Authorization is checked again before replay, so revocation prevents retrieving old
results too. Keys from another device have a separate namespace.

Database mutation, normal domain evidence, client event notifications, remote attribution
and result receipt commit in one transaction. A crash before commit rolls them back;
after commit the receipt survives a lost response/restart. Interrupt's external signal
is handled by the exact execution recovery rule above.

Expired keys are rejected even after their receipts are cleaned up. An old key never
silently becomes a new action. Outside the retry window, inspect authoritative state
before deciding whether a genuinely new request is appropriate. Receipt capacity is
bounded and fails clearly rather than discarding live deduplication history.

## Reconnectable events

`GET /events` uses Authorization and optional `Last-Event-ID`. Do not put bearer tokens
in the URL. Omit Last-Event-ID to start at the current cursor; use the cursor returned
by `/overview` to cover changes after a state snapshot. Cursors have format
`<hq_id>:<monotonic_integer>`, and also serve as stable event IDs.

```text
event: ready
data: {"cursor":"<HQ_ID>:42","expires_at":"<TOKEN_EXPIRY>"}

id: <HQ_ID>:43
event: task.changed
data: {"event_id":"<HQ_ID>:43","cursor":"<HQ_ID>:43","type":"task.changed","worker_id":"<WORKER_ID>","task_id":"<TASK_ID>","execution_id":null,"created_at":"<UTC_TIME>"}
```

Types: `state.changed`, `worker.changed`, `task.changed`, `execution.changed`,
`message.created`. References are bounded opaque IDs. Audit payloads and message bodies
are never streamed. Notifications are generated transactionally from audit/message
inserts; they tell clients to refetch authoritative resources. A Project change can be
`state.changed`; refetch relevant permitted collections. This is not exactly-once
state replication. Duplicate deliveries are harmless and must be tolerated.

Persist the last successfully handled cursor. Reconnect with that cursor to receive
subsequent retained events. Last 10,000 notifications are retained independently of
append-only audit. An older cursor returns HTTP 409 `reset_required` before streaming;
if a slow live stream falls behind retention it receives `event: reset_required` and
closes. Refetch state and reconnect from a fresh cursor. Foreign/future/malformed cursors
are rejected. Cursor allocation survives cleanup, restart and reboot.

Streams have token-expiry timers and recheck authorization before every batch and at
least once per second. Revocation triggers immediate recheck; disabled humans also lose
access. An `authorization_expired` terminal event means reconnect only after successful
authentication. No data is emitted after failed authorization. Scheduling can delay TCP
closure while the process is busy, but cannot extend authority. Comments provide a
15-second keepalive. Backpressure is bounded; excessively slow clients disconnect and
recover by cursor.

## Error mapping and resource policy

| Status | Representative codes | Meaning |
| --- | --- | --- |
| 400 | invalid_request, invalid_json, invalid_profile, invalid_public_key, invalid_cursor, invalid_idempotency_key | Strict request/schema/encoding failure |
| 401 | unauthenticated, challenge_invalid, signature_invalid | Missing, expired or invalid proof/session |
| 403 | browser_context_denied, device_unavailable, principal_disabled, capability_denied, pairing_invalid | Authority denied |
| 404 | not_found, unsupported_version | Missing resource/route/version |
| 405 | method_not_allowed | Unsupported method |
| 408 | request_timeout | Body did not arrive within ten seconds |
| 409 | invalid_state, state_conflict, idempotency_conflict, idempotency_key_expired, initialization_required, reset_required, key_already_paired | State/retry/reconnect conflict |
| 410 | pairing_unavailable | Pairing expired or consumed |
| 413 | request_too_large | Request body exceeded bound |
| 415 | unsupported_content_type | Non-JSON or encoded body |
| 429 | rate_limited, device_limit, pairing_limit, challenge_limit, token_limit, receipt_limit, stream_limit | Bounded resource/rate ceiling; Retry-After: 60 |
| 500 | internal_error | Safe generic failure; use request ID for local investigation |

Per-minute fixed windows: 600 total v1 requests; 20 pairing claims; 60 challenge requests
and 60 token verifications globally, with 12 of each per known device; 300 reads and
60 mutations per device; ten local pairing creations. Unknown-device requests share
fixed global buckets. Buckets are memory-bounded and restart-reset; durable state limits
remain enforced after restart. Repeated denial audit is aggregated to at most one event
per 30 seconds to prevent log amplification. Successful security/mutation audit persists.

Ceilings: 16 active/pending devices, 128 retained device identities, eight outstanding
pairings, four outstanding challenge records per device, four unexpired tokens per
device, two streams per device (32 total), 10,000 retry receipts globally and 2,000 per
device. Consumed challenges occupy their slot until the one-minute expiry. Reuse a token
within a client session instead of minting a new token for each request. The service
also bounds HTTP connections to 64 and headers to 64; request/header timeouts apply.

Expired challenges/tokens/receipts are cleaned every 30 seconds and on relevant writes.
Terminal pairing rows are removed one day after their expiry; device history and all
security/domain audit remain. These are small-HQ safety ceilings, not licensing or a
large-client capacity claim. At retained-identity capacity, new enrollment fails closed;
no API deletes historical identities.

## Reference client

See [reference-client usage](../../scripts/client-v1/README.md). It uses only serialized
HTTP and Node crypto, with no server imports, direct database access, admin flag or
approval shortcut. Its Ed25519 private key lives in an explicit owned mode-0700 test
directory, in a mode-0600 file. Tokens stay in memory. Delete its private key after
acceptance and revoke the corresponding test device through the UI.

Protocol sources: [RFC 8037 public Ed25519 JWK](https://www.rfc-editor.org/rfc/rfc8037.html),
[Node 24 crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html), and the published
[low-order encoding constants](https://github.com/jedisct1/libsodium/blob/1.0.18/src/libsodium/crypto_core/ed25519/ref10/ed25519_ref10.c#L966).
No custom signature algorithm or encryption is implemented.

## Prompt 07 compatible projection

Conversations and reply generation are browser-only. `/api/conversations` routes retain
the existing local Host/Origin/CSRF boundary and reject device Authorization headers.
No v1 capability or passive message operation acquires reply authority.

Execution list/detail/interrupt and effective execution profiles remain task projections;
conversation-owned executions have no fictitious task ID and are omitted. Their audit
notifications are also excluded from v1 SSE. Worker status remains coarse shared worker
availability and may reflect chat activity; no conversation IDs, transcripts or provider
contexts are included. The browser owner can inspect peer exchanges. See
[conversation authority and recovery](../architecture/CONVERSATIONS_AND_CONTINUITY.md).
