# Decision 015 — Explicit device trust and stable Client API v1

**Date:** 2026-09-29  
**Status:** Implemented and accepted; real Ubuntu/restart/reboot validated

## Context

The local Web UI relies on a trusted loopback/SSH administrative path and an in-memory
browser session token. Native clients need a durable, independently revocable identity,
a stable domain contract, safe retry/reconnect semantics, and explicit restricted
authority. The control plane and single existing human remain the source of authority.

## Decision

Serve `/api/v1/` on the existing private listener, separately from browser `/api/...`
semantics. Native devices do not use CSRF tokens, cookies, browser CORS or UI snapshots.
A durable random HQ UUID is distinct from human, company, worker, runtime and device.
It survives restarts/upgrades but is not a TLS-pinning or end-to-end identity claim.

The trusted local browser creates a ten-minute pairing with 32 random secret bytes,
stored only as a hash. The human selects a fixed capability ceiling; state-read only
is the default. One claim binds one Ed25519 public JWK and bounded display metadata.
The operator compares a raw-public-key SHA-256 fingerprint and explicitly confirms or
denies. Devices cannot administer enrollment, enlarge scopes or resolve protected
infrastructure/Git approvals. Device owner/key/capabilities and terminal history remain
immutable. A revoked or denied device needs a new, explicit pairing.

An active device signs an exactly specified newline-delimited one-minute challenge.
Node crypto verifies ordinary Ed25519; canonical base64url/JWK parsing rejects private
fields, noncanonical and known low-order encodings. Direct testing showed that the
Node/OpenSSL verifier accepts the identity public key and an identity forgery; explicit
public encoding validation is therefore required in addition to signature verification.
A validly encoded failed signature burns the challenge. A valid proof yields one opaque
ten-minute bearer token; only its hash persists. There is no permanent bearer or refresh
secret. Each request rechecks owner/device state, expiry and required scope.

Stable explicit DTOs expose domain fields, bounded history and runtime choices without
filesystem/runtime credentials, internal exceptions, raw policy or giant receipts.
Artifact metadata is supported; artifact bodies are intentionally optional/deferred.
Messages and explicit objectives remain separate. All mutations use existing trusted
Company operations. Remote objectives require an already initialized CEO, avoiding
implicit filesystem provisioning inside their database transaction. Project objectives
bind both exact Project and repository IDs.

Every authenticated mutation has a timestamp.UUIDv4 request key and seven-day retry
window. Device/human/method/path/canonical-body hash, original status/response and
attribution persist with the domain mutation in the same transaction. Expired keys
remain invalid after receipt cleanup; stale intent cannot silently become new work.
Dispatch and profile updates compare expected current values. Runtime interruption
records accepted intent before signaling the exact active execution; restart recovery
already interrupts/blocks orphaned work without launching another execution. Exact
retries return the original receipt even if the target state has since changed, after
fresh authorization. Revocation prevents replay access too.

SQL triggers derive sanitized notifications from durable audit/message inserts in the
same transaction. HQ-bound monotonic cursors and event IDs survive restart/reboot;
last 10,000 notifications are retained independently of append-only audit. Reconnect
replays missed notifications, while an old cursor explicitly requires refetch. Events
are invalidation hints, not exactly-once replication. Streaming has bounded resources,
backpressure, expiry timers and repeated authorization checks; revocation closes it.

Application rate limits, persistent record ceilings and deterministic expiry cleanup
bound the small-HQ workload. Device/security/domain histories are retained. No new
service dependency, cryptographic algorithm, worker permission, OS account or public
port is introduced by the API/migration.

## Transport boundary and limits

Protocol and transport remain separate. SSH protects acceptance traffic. A program
with full access to the legacy administrative tunnel already has operator-level
browser access; a device token is not what grants that authority. Future device-only
transports must expose **only `/api/v1/`**, never forward the complete listener including
`/api/session` and browser administration. Header checks cannot replace this routing
boundary. This milestone supplies no VPN gateway, relay, public ingress or E2EE.

The single enabled human and one-company data root remain unchanged. iOS/Keychain,
APNs, QR scanning, multi-HQ UI, multi-company, federation, remote approvals and a relay
remain future work. No ordinary no-tunnel mobile access is claimed.

## Evidence and relationship to prior decisions

[Decision 012](decision_012_ios_remote_client.md) retains its historical product
rationale; this decision implements its protocol/device foundation only. Decisions
002, 013 and 014 still govern message authority, protected operations and Projects.
The [API contract](../api/CLIENT_API_V1.md), [execution plan](../exec-plans/prompt-06.md)
and [Prompt 06 validation record](../validation/prompt-06-remote-client-api.md) distinguish deterministic, browser,
real Ubuntu, restart/reboot and final deployment evidence.
