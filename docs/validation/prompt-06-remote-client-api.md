# Prompt 06 — Authenticated remote-client API validation

**Status:** Accepted; Ubuntu protocol/restart/reboot, revocation and retained-HQ migration passed.
**Date:** 2026-09-29 UTC (work began 2026-09-28 in America/Vancouver)

## Revision and environment ledger

- Starting synchronized main/origin: `effba60f349778d82a37fbbb44bf4047a931d875`.
- Starting retained deployment: `c5712ca9b544105b9303aab76d2e4860c3d6be13`.
- Feature branch: `feature/prompt-06-remote-client-api`.
- Runtime/API feature tested: `011fd3874ae3483e87468ef21d1e5f1091a88224`.
- Accepted feature/harness revision deployed to the retained HQ: `23356dc0a6a155c04a79a22f4522bd0067a5c90d`; runtime/public files are byte-identical to the real tested implementation.
- Final main/origin/deployed SHA equality is recorded in the delivery handoff and the workspace `prompt06-delivery.json` after the documentation commit; a tracked document cannot contain its own future Git commit hash.
- Workstation: Node 24.10.0, independent Node HTTP/crypto reference client, isolated Chrome/Playwright.
- HQ: Ubuntu 24.04.5 x86_64, Node 24.21.0, Codex 0.157.0, existing non-root service identity.
- Fresh validation source `/opt/botsquad-client-validation`; data
  `/var/lib/botsquad/validation/client-20260929-prompt06`; private listener `127.0.0.1:4311`.
- Separate named unit inherits production service restrictions, central runtime authentication
  and existing provisioner boundary. This is not a new multi-tenant infrastructure feature.
- Workstation tunnel: `ssh -N -L 4311:127.0.0.1:4311 botsquad`.
- Retained HQ remains on loopback `127.0.0.1:4310`; no firewall, public ingress, CORS or relay changes.

The first live harness attempt clicked Pause before the browser finished connecting.
It timed out with zero workers/devices/tasks created. Its evidence was retained. The
successful continuation uses an explicit visible connection readiness wait; production
code was unchanged. This correction and subsequent operator evidence live in a later
commit; the server implementation accepted above remains byte-identical.

## Deterministic and browser evidence

| Check | Result |
| --- | --- |
| Pre-change local baseline | 120 pass, one Linux-only skip |
| Full feature local suite | 135 pass, one Linux-only skip; 44.26 seconds |
| Full feature under Ubuntu service restrictions | 136/136 pass, no skips; 113.82 seconds |
| Existing approval-dialog/expanded-scope browser regression | Pass |
| Actual browser Devices create/confirm/deny/revoke with independent client | Pass |
| Python provisioner adversarial suite | 9/9 pass |
| Actual child process exits before/after receipt commit | 2/2; rollback or same stored result, one durable effect |
| Strengthened active-token storage assertion on accepted Ubuntu revision | 12/12 focused protocol checks under unchanged service restrictions |
| Filled schema-5 retained database → schema 6 | Every original row/field preserved, no filesystem/host action |

Ubuntu deterministic evidence is retained at
`/var/lib/botsquad/validation/client-regression-deterministic-20260929T062045Z`.
Tests include migration, Project isolation, approval integrity, Linux confinement,
idempotency rollback/crash, bounded pagination/history, retention reset, crypto parsing,
rate/capacity ceilings, SSE limits/expiry/revocation and strict route/schema boundaries.

## Actual runtime regression and retained worker isolation

The existing real Atlas → Scout → Atlas research script passed in fresh data under the
same service restrictions, 06:23:08–06:24:15 UTC. It performed real hiring/research/report
submission, Atlas evaluation, service restart, persisted-thread resume and confirmed
real turn interruption. Final evidence contains two workers, four tasks, five executions
and one artifact. Both workers used advertised `gpt-6-sol` with low reasoning; priorities
were critical for Atlas and normal for Scout, human locked. No model/catalog pin changed.
Evidence: `/var/lib/botsquad/validation/client-regression-prompt01-20260929T062307Z`.

Separate harmless host probes exercised all seven retained ready worker UIDs: **189
expected denials** across sibling homes, central credential/database/provisioner/source
canaries, privileged socket, root UID and protected writes. UID/GID/supplementary groups,
locked password/nologin shell and absence of copied Codex credentials passed. Canaries
were removed in `finally`; credential contents were never read. Existing Project/clone
isolation also passed the full Linux suite. No fresh engineering model run is claimed.

## Security review

This was a security-focused implementation review, not an independent-agent audit.

| Boundary | Evidence and conclusion |
| --- | --- |
| Pairing | Fixed human/capability ceiling, 32 random bytes, SHA-256 only, ten-minute TTL, one claimant; pending/denied/expired/replayed and private-JWK claims fail |
| Crypto | Exact UTF-8 newline signing vector; wrong key/context/signature, malformed lengths/base64 and replay fail. Validly encoded failed proof burns the challenge |
| Weak public keys | Reproduced Node/OpenSSL identity-key forgery, then rejected noncanonical/known low-order public encodings before enrollment; standard Node crypto still does signature mathematics |
| Tokens | One-minute challenge, ten-minute opaque token, hash-only storage, header-only acceptance, no refresh secret; enabled human and active device checked on every request and replay |
| Browser/device separation | Origin/Cookie/browser-CSRF rejected by v1; device Authorization rejected by browser admin; no CORS; native forwarded Host accepted without weakening browser Host checks |
| Capabilities | Endpoint-specific server checks, immutable enrollment ceiling; actual read-only device denied objective/message/dispatch/profile/interrupt and then revoked |
| Mutations | Exact target/current-state validation; shared DB transaction for domain/audit/receipt; crash tests and lost-result retry prove no duplicate effect; profile/dispatch CAS reject stale intent |
| Events | Durable transactional triggers, changed notifications queued after synchronous transaction, bounded safe ID/type payload, cursor replay/reset, expiry/revocation checks and backpressure |
| DTOs | Explicit allowlists exclude raw snapshots/SQL, runtime references, private paths, policies, approvals, error details and credential records; artifact content deliberately unavailable |
| Resource abuse | Bounded body/URL/page/header/connection/stream counts, fixed rate buckets and persistent device/pairing/challenge/token/receipt/event ceilings; throttled failure audit |
| Retention | Authentication/retry/event cleanup preserves device/domain/security history; stale timestamp keys remain invalid after receipt deletion |
| Local-only operations | No remote enrollment administration, scope expansion, protected approval, policy editor, credential access or worker provisioning endpoint |

A crucial trust limit remains explicit: an operator with the **full legacy SSH/admin
listener** can use the existing browser administration. Header checks cannot turn that
already privileged tunnel into a device-only transport. A future restricted mobile
transport must route **only `/api/v1/`**, never `/api/session` or other administrative
paths. This milestone does not implement that transport, TLS pinning or E2EE.

Live validation storage/log inspection verified public JWK fields only and 64-hex secret
hashes. A pattern scan of 633 persisted values and 671 journal bytes found no private-key
PEM, pairing URI or Bearer-token encoding; it printed no values. Deterministic tests also
compare known generated pairing/token/signature/private-key values against persisted
records while the token is active. This is bounded evidence, not a claim that arbitrary
operator-authored message text can never contain a secret.

## Resource observations

Before pairing the fresh service reported approximately 76.4 MB cgroup memory, including
startup residency. After its restart and bounded runtime interruption, one native SSE
stream plus the local browser were idle from 06:25:39 to 06:28:47 UTC:

- process RSS: 78,636 → 78,824 KiB (188 KiB growth);
- cgroup memory: 38,002,688 → 38,207,488 bytes;
- service CPU: 1.597411 → 1.750864 seconds (0.153453 CPU seconds / 188 wall seconds,
  approximately 0.082% of one CPU);
- seven service tasks, no model polling;
- two device records, two pairings, zero retained challenges, two unexpired token hashes,
  seven mutation receipts and 42 events; counts unchanged during this idle window;
- SQLite database: 565,248 bytes; after acceptance, client tables/indexes occupied 77,824 bytes, including one 4,096-byte event page for 46 notifications and seven durable receipts;
- browser pairing creation plus claim: 1,147 ms; challenge/proof/token round trip: 171 ms
  through the workstation SSH tunnel (network and browser latency included).

These observations detect obvious small-HQ regressions. RSS and cgroup accounting differ
because of shared pages; this is not a controlled memory benchmark or large-client claim.
After reboot, fresh authentication and revocation with no native stream, the service reported 116,125,696 bytes cgroup memory, 0.980830 total CPU seconds and seven tasks. The different boot/page-cache residency makes this a post-recovery observation, not an isolated SSE memory delta.

## Preservation and delivery gates

The root-private preflight inventory covers 21 original databases, 11,292 original rows,
171 account/group mappings, 281 root records and 84 worker homes. The comparison after
real validation passed; only `workers.updated_at` is deliberately excluded. It verifies
original values/counts while allowing append-only audit/migration rows. This includes
Prompt 05 Project histories, Demo 01 StudyPlan, original worker/Codex bindings, approvals,
root receipts and home ACL/ownership. The same comparison passed after migration of the retained HQ to schema 6 and accepted feature deployment. No retained task/execution was replayed.

Root-private inventory: `/var/backups/botsquad/prompt06-20260929T0531Z/inventory.json`.
No private-key/token/pairing payload is committed. The two screenshots show fingerprint
inspection and final revocation, after the one-time secret was cleared from the dialog.

## Actual protocol evidence

The following public IDs, retry keys and cursors identify actual HTTP operations. Request
keys are correlation/idempotency identifiers, not credentials. The completed run includes service restart, actual expiry, full host reboot, fresh authentication and revocation.

```json
{
  "started_at": "2026-09-29T06:22:16.886Z",
  "feature_sha": "011fd3874ae3483e87468ef21d1e5f1091a88224",
  "transport": "workstation HTTP through SSH to Ubuntu loopback:4311",
  "status": "passed",
  "stage": "complete",
  "pairing_claim_ms": 1147,
  "pairing_replay_denied": true,
  "token_round_trip_ms": 171,
  "identity": {
    "hq_id": "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab",
    "device_id": "device_a3abfa64-be78-4877-8969-60393be9943b",
    "fingerprint": "SHA256:0FnSIZ2bR70dAxGiDSuFU3cXEuFF9qHn6LHhFUT07Tg",
    "pairing_id": "pairing_b5c601d2-a126-4ca4-992d-cae8f916a105",
    "owner_principal_id": "human",
    "states": [
      "open",
      "pending",
      "active"
    ],
    "pairing_states": [
      "open",
      "claimed",
      "confirmed"
    ],
    "device_states": [
      "pending",
      "active",
      "revoked"
    ]
  },
  "initial_session_expires_at": "2026-09-29T06:32:22.787Z",
  "capabilities": [
    "artifacts:read",
    "dispatch:control",
    "executions:interrupt",
    "messages:send",
    "objectives:create",
    "profiles:update",
    "projects:read",
    "state:read"
  ],
  "message": {
    "key": "1790662943420.2d748718-7372-4feb-b762-98768958e773",
    "message_id": "message_1f9fe9cd-b8bd-4d5f-872e-a597b99f764c",
    "request_id": "request_6f6472c3-3a12-4d52-97e6-55abc0de5c4e",
    "tasks_unchanged": true
  },
  "profile": {
    "key": "1790662944814.4878684c-df67-4a5c-9e9c-7b513070da9a",
    "worker_id": "worker_c0a54579-8de6-41e7-b951-16392f3d80bf",
    "profile": {
      "ai_model": "gpt-6-sol",
      "reasoning_effort": "low",
      "execution_priority": "high",
      "ai_profile_locked": true
    },
    "request_id": "request_293d0be2-c43a-4e3e-98c6-f4dcb65026ce"
  },
  "objective": {
    "key": "1790662945921.3537d2bc-fcf7-4c6f-99ff-ab1b53c2357d",
    "task_id": "task_9cbacaae-f3f7-48d6-8f1b-c256bf00b63d",
    "request_id": "request_da23e3a9-925e-4f11-adb0-4db7ae482cd0",
    "lost_response": true,
    "restart_retry_same_task": true
  },
  "disconnect_cursor": "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab:16",
  "restart": {
    "hq_id_unchanged": true,
    "device_still_active": true,
    "new_session_expires_at": "2026-09-29T06:32:57.586Z"
  },
  "reconnect": {
    "from": "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab:16",
    "replayed": [
      "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab:17",
      "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab:18"
    ]
  },
  "dispatch": {
    "resume_key": "1790662978121.ce87f29e-3175-449d-988a-3e90133e0bb0",
    "pause_key": "1790662980316.94b12d12-fcb5-4da8-b10a-e8b97c296f4c",
    "final_paused": true,
    "resume_request_id": "request_fefff8b1-d6e1-4bbb-8c5e-8a47005e0541",
    "pause_request_id": "request_124a909e-89ed-4290-96a9-f0b9379d0d4a"
  },
  "interrupt": {
    "key": "1790662979917.ce79a62c-7e98-4f96-a519-b0c1a3785cd7",
    "execution_id": "execution_db35810f-aae7-454f-8994-9b82219730fb",
    "request_id": "request_08da1c3f-b102-449e-9115-8e39d2e49c56",
    "final_status": "interrupted",
    "codex_confirmed": true
  },
  "capability_denial": {
    "device_id": "device_22db5f60-fb3e-4fc6-86aa-17dcf2766bf4",
    "scopes": [
      "state:read"
    ],
    "mutations_denied": 5,
    "revoked": true,
    "private_key_deleted": true
  },
  "real_token_expiry_denied": true,
  "real_stream_expiry_closed": true,
  "reboot": {
    "hq_id_unchanged": true,
    "device_unchanged": true,
    "old_expired_token_denied": true,
    "fresh_authentication": true,
    "idempotency_preserved": true,
    "event_cursor": "hq_40960aeb-7a7c-47f1-a86a-8f731f41e7ab:45",
    "reconnect_preserved": true
  },
  "revocation": {
    "state": "revoked",
    "existing_token_denied": true,
    "mutation_denied": true,
    "new_authentication_denied": true,
    "stream_closed": true
  },
  "private_key_deleted": true,
  "completed_at": "2026-09-29T06:36:06.764Z"
}
```

## Reboot, revocation and final operational state

Actual token expiry denied requests and closed the active native SSE before reboot.
The root-private backup was verified (17,118,664 compressed bytes). Both instances were
paused with no active work/pending approvals, and other validation jobs had completed.
Full host reboot changed boot ID `a512ca67-d0bd-4a28-9206-c7ded90becf6` to
`1c040fff-e666-4119-ab01-43e6f8ab2cf3`. At 06:35:37 UTC both applications and Codex were
ready; a non-mutating service-user `inspect_host_health` activated the provisioner and
returned protocol 2/ready. The socket's initially idle service was normal socket activation.

Root comparison proved unchanged HQ record and exact device public keys/owner/capabilities/
states, seven receipts and durable event history (cursor 43 before reboot). The client
then rejected the expired token, authenticated with the same key, recovered the original
objective receipt and reconnected at cursor 45. UI revocation closed the live stream and
denied an existing-token read, mutation and fresh authentication. Both device records are
retained as revoked; token/challenge counts are zero; final notification cursor is 46.
Both private key/configuration directories were removed from the workstation.

The retained HQ is healthy/paused after its separate migration, with zero enrolled devices. Its persisted identity is `hq_1cfe3e8d-dcca-47a4-8090-b79c3470b9f9`; the validation HQ is deliberately a different identity.
The validation service is stopped and disabled, its loopback 4311 listener removed,
and its source/data/evidence preserved. Port 4310 remains loopback only.

- [Public protocol evidence](prompt-06-assets/protocol-evidence.json)
- [Fingerprint inspection screenshot](prompt-06-assets/01-fingerprint-confirmation.png)
- [Revoked devices screenshot](prompt-06-assets/02-revoked-device.png)

Backup/inventory/reboot evidence stays root-private under
`/var/backups/botsquad/prompt06-20260929T0531Z`; credentials are not copied into this repo.
The backup preserves application data, central auth, worker homes/ACLs, provisioner records
and installed service/provisioner configuration. No account or credential replacement occurred.

## Documentation, scope and timing

Decision 015, API v1, reference-client guide, README/AGENTS, roadmap, vision, organization,
iOS model, system architecture, current state, access/multiple-instance guides and both
whitepapers now distinguish implemented protocol from deferred app/transport work.
Prompt 06 is Complete; Prompt 07 is Next. Historical Prompt 01–05 validation and Demo 01
media/findings were not rewritten. The relative Markdown-link check passed across 70 files with zero missing links. The targeted stale-current-prose scan returned no matches before final integration. Remaining future statements concern iOS,
relay, APNs, mobile protected approvals, multi-company/federation and Computer Use.

Initial ETA: 10–16 active hours at 05:31 UTC. At 06:01 it became 3–5 hours remaining;
at 06:31 it became 60–90 minutes remaining. Reuse of existing trusted operations and
passing regression/recovery gates reduced the initial conservative estimate. Actual
elapsed time and final Git equality are stated in the delivery handoff after deployment.
