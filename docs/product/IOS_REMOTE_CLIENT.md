# BotSquad — Native iOS Remote Client and Secure Remote Access

**Status:** Future product architecture; not yet implemented  
**Date:** 2026-09-25

## Purpose

BotSquad should support a native iPhone/iPad client that acts as a mobile command center
for an operator-controlled BotSquad headquarters.

The native app should make normal mobile operation possible without requiring the user
to manually create an SSH tunnel every time.

The architectural goal is:

~~~text
iPhone / iPad
     |
     | authenticated BotSquad client protocol
     v
secure remote-access transport
     |
     v
operator-controlled BotSquad HQ
~~~

The iOS app is a **first-class BotSquad client**, not a wrapper around the current web UI.

This document intentionally focuses on product/technical architecture rather than
distribution or commercial model.

## Core principle: client API and transport are separate

Do not couple the native client to one network transport.

Conceptually:

~~~text
BotSquad Core
    |
    +-- versioned client API
    |       |
    |       +-- Web UI
    |       +-- iOS app
    |       +-- future desktop app
    |       +-- future CLI
    |
    +-- event stream
    |
    +-- authentication / authorization
~~~

and separately:

~~~text
Client transport
    |
    +-- local/LAN/private network
    +-- user-managed VPN
    +-- existing SSH tunnel
    +-- future BotSquad secure relay
~~~

The web UI and iOS app should call the same trusted control-plane operations.

The iOS app should not scrape HTML, automate the browser UI, or become dependent on
DOM structure.

## Current topology

Prompt 03 currently uses:

~~~text
Mac / PC
   |
   | SSH tunnel
   v
127.0.0.1:4310 on Ubuntu HQ
~~~

This is secure and remains a valid administrative/recovery path.

The native-client milestone should preserve that path while adding a better mobile path.

## Desired mobile topology

For day-to-day use:

~~~text
iPhone
   |
   | secure authenticated connection
   v
BotSquad remote-access layer
   |
   v
Ubuntu HQ
~~~

The user should be able to:

- open the app from Wi-Fi or cellular;
- see company and worker status;
- talk to Atlas or another allowed worker;
- assign an objective;
- inspect tasks and execution progress;
- receive results and alerts;
- review artifacts appropriate for mobile display;
- pause new dispatch;
- interrupt a supported active execution;
- inspect and update worker model/reasoning/priority where authorized;
- respond to trusted approval requests when the approval system exists;
- switch among multiple companies and multiple HQs when those features exist.

The app is an operator console. It must not create authority that the BotSquad control
plane would deny through another client.

## The HQ remains private by default

Do **not** solve mobile access by changing the default service binding to:

~~~text
0.0.0.0:4310
~~~

or by opening port 4310 on the public Internet.

The validated Ubuntu architecture should continue to bind the existing private UI/API
surface to loopback unless a future authenticated ingress layer explicitly changes the
network boundary.

Remote mobile access belongs behind a purpose-built authenticated transport.

## Connection modes

BotSquad should eventually support more than one connection mode.

### 1. Private-network / VPN mode

A user may connect the iPhone and HQ through a private network such as:

- a private LAN;
- WireGuard;
- Tailscale;
- another operator-managed VPN.

In this mode the iOS app can connect directly to an authenticated BotSquad API endpoint
that is reachable only through the private network.

This can work without BotSquad-operated relay infrastructure.

### 2. Existing SSH tunnel

The current SSH tunnel remains useful for:

- browser administration;
- recovery;
- debugging;
- development;
- environments where no native remote-access layer is configured.

The iOS product should not require the user to manually run an SSH tunnel for ordinary
mobile operation.

### 3. Future outbound BotSquad relay

A future BotSquad relay is the preferred zero-inbound-port remote-access design.

Conceptually:

~~~text
                         BotSquad Relay
                      +------------------+
                      | routing/session  |
iOS app ------------->| broker           |<------------ Ubuntu HQ
                      |                  |       outbound connection
                      +------------------+
~~~

The Ubuntu HQ initiates an outbound authenticated connection to the relay.

The iOS app authenticates to the same paired HQ/owner relationship and connects through
the relay.

This permits:

- no public BotSquad application port;
- NAT-friendly connectivity;
- mobile access from cellular networks;
- push-driven wake/connect behavior;
- multiple HQs behind ordinary consumer/provider firewalls.

The relay should be designed as transport infrastructure, not as the source of
BotSquad company truth.

## Relay privacy goal

The strongest long-term design is that the relay routes encrypted traffic without
needing plaintext company content.

Conceptually:

~~~text
iOS device
   |
   | encrypted for paired HQ
   v
relay
   |
   | opaque application payload
   v
BotSquad HQ
~~~

End-to-end encryption is a design goal, not yet an implemented claim.

A future relay design must explicitly specify:

- device/HQ key agreement;
- key rotation;
- forward secrecy expectations;
- metadata visible to the relay;
- reconnect/session semantics;
- replay protection;
- device revocation;
- recovery after key loss.

Do not claim E2EE until those properties are implemented and reviewed.

## Native client API

The existing HTTP UI API was designed for one local browser session. A native-client
milestone should define a stable versioned API boundary.

Possible shape:

~~~text
/api/v1/...
~~~

or an equivalent typed RPC surface.

The API should expose domain operations rather than UI implementation details.

Examples:

~~~text
list_companies()
get_company_status()
list_workers()
get_worker()
update_worker_ai_profile()
list_tasks()
get_task()
assign_objective()
send_message()
pause_dispatch()
resume_dispatch()
interrupt_execution()
list_approvals()
resolve_approval()
get_artifact_metadata()
fetch_artifact()
~~~

Only implement operations whose control-plane semantics already exist.

A native client must not bypass trusted Company/control logic by writing SQLite or
calling internal implementation functions directly.

## API versioning

Mobile clients will not always update in lockstep with the server.

The remote-client API therefore needs:

- explicit versioning;
- feature/capability discovery;
- backwards-compatible additive changes where practical;
- clear unsupported-version errors;
- server/app version exposure;
- schema validation;
- documented deprecation policy.

The iOS app should query capabilities rather than assume every HQ supports every feature.

## Event delivery

The browser currently uses server-sent events for local state changes.

A remote/native client needs a reconnectable event model.

Possible transports include:

- WebSocket;
- HTTP streaming;
- relay-proxied event channel;
- another typed bidirectional stream.

The semantics matter more than the transport:

- events have stable IDs;
- reconnect can resume from a cursor where practical;
- duplicate delivery is harmless;
- event loss can be repaired by refetching authoritative state;
- notifications do not themselves grant authority;
- the app can distinguish stale cached data from current server state.

The server remains authoritative.

## Device pairing

A native app needs explicit enrollment with a BotSquad HQ.

Preferred flow:

~~~text
BotSquad Web UI / admin
        |
        | Add mobile device
        v
short-lived pairing record
        |
        +-- QR code / one-time pairing code
        |
        v
iOS app scans/enters
        |
        v
device public key registered
        |
        v
human confirms device
        |
        v
paired device credential issued
~~~

The pairing secret should:

- be short-lived;
- be one-time use;
- be scoped to one HQ/human principal;
- not itself become a permanent bearer credential;
- be invalidated after success/expiry.

## Device identity and credential storage

Each mobile device should have its own durable identity.

Conceptually:

~~~text
RemoteDevice
  id
  owner_principal_id
  public_key
  display_name
  platform
  app_version
  created_at
  last_seen_at
  revoked_at
  capabilities
~~~

Private device credentials belong in iOS Keychain / Secure Enclave-compatible storage
where appropriate.

Server-side secrets belong in BotSquad's trusted credential layer.

Do not store long-lived remote credentials in:

- UserDefaults;
- application logs;
- analytics payloads;
- push notification bodies;
- Git;
- worker prompts.

## Human principal and authorization

Remote access requires a real human-authentication boundary.

A paired phone is not automatically equivalent to unrestricted human authority.

The server should evaluate:

~~~text
authenticated human principal
        +
paired device
        +
company/HQ permissions
        +
operation-specific policy
~~~

for each protected request.

The native app is simply another trusted user interface to the same authorization
rules used by the web UI.

## Approval actions

Mobile approvals are a high-value use case, but they require stronger semantics than
ordinary chat.

Example:

~~~text
Nix requests:
Create Linux account for Charlie
        |
        v
iPhone notification
        |
        v
human opens approval
        |
        v
BotSquad verifies:
- principal
- paired device
- approval ID
- requested operation
- current state
- expiry
        |
        v
one-time approve / deny
~~~

Approval tokens/callbacks must be:

- scoped to one approval object;
- one-time consumable;
- expiry-bounded;
- non-forgeable by bot-authored text;
- rejected after state changes that invalidate the request;
- audited with principal/device/time.

Do not allow a generic message such as "approved" to substitute for a trusted approval
record.

## Push notifications

A native iOS app should eventually use Apple Push Notification service (APNs) for
important operator-visible events.

Examples:

- approval requested;
- worker blocked;
- execution failed;
- objective completed;
- review rejected;
- deployment/infrastructure alert;
- company summary ready.

Push payloads should contain the minimum necessary information.

Prefer:

~~~text
event type
opaque event/approval ID
company/HQ display hint
non-sensitive summary
~~~

and fetch authoritative detail after the app opens an authenticated connection.

Do not put:

- model credentials;
- SSH secrets;
- repository secrets;
- private artifacts;
- full task prompts;
- sensitive company data

into notification payloads.

## Notification architecture

APNs requires a server-side sender.

This sender may eventually be:

### HQ-direct

The HQ owns APNs sending credentials and talks directly to APNs.

Advantages:

- fewer BotSquad-operated services;
- stronger self-hosted model.

Tradeoffs:

- each installation needs push setup/credentials;
- harder onboarding.

### Relay-assisted

A BotSquad notification/relay service sends APNs notifications for registered devices.

Advantages:

- easier onboarding;
- natural fit with managed remote connectivity.

Tradeoffs:

- requires a hosted metadata/notification service;
- careful privacy boundaries are required.

The product should keep push notification metadata separate from the canonical company
database.

## Multiple HQs

A single iOS app should eventually pair with multiple BotSquad installations.

Example:

~~~text
BotSquad
├── Personal HQ
├── Research HQ
└── Company HQ
~~~

Each HQ has an independent:

- server identity;
- device pairing;
- remote credential;
- trust root;
- company set;
- connection health;
- software version.

Compromise/revocation of one HQ pairing should not grant access to another.

## Multiple companies

When multi-company support exists, the mobile UI should always make the active company
clear before consequential actions.

Example:

~~~text
HQ: Vancouver
Company: Asymmetri Labs
~~~

The app should support:

- company switcher;
- company-scoped worker/task views;
- company-specific approvals;
- cross-company items clearly marked as external/federated.

The app must not merge company data merely because the same phone/HQ/runtime account is
used.

## Suggested mobile information architecture

A first native dashboard could contain:

### Home

- HQ connection state;
- selected company;
- active workers;
- blocked workers;
- open tasks;
- pending approvals;
- recent failures;
- recent completed objectives.

### Organization

- hierarchy;
- worker status;
- model/reasoning/priority;
- current task;
- manager/reporting relationships.

### Tasks

- queued;
- working;
- blocked;
- awaiting approval;
- failed;
- completed.

### Chat

- company/worker conversations;
- assign explicit objective separately from message-only communication.

### Executions

- worker;
- task;
- status;
- effective model;
- reasoning;
- priority;
- runtime version;
- timings;
- interruption/failure state.

### Approvals

- trusted request details;
- approve/deny;
- evidence/context;
- expiration/current-state checks.

### Settings

- paired HQs;
- companies;
- notification policy;
- device identity;
- logout/revoke;
- diagnostics.

The exact iOS navigation is future UX work. These domain boundaries should remain.

## Offline behavior

The app may cache recent read-only state for usability, but the server remains canonical.

Consequential actions should not be blindly replayed from an offline queue.

Rules:

- read-only cached content must be visibly stale when offline;
- queued messages/tasks require idempotency keys;
- approvals must be revalidated online before acceptance;
- pause/interrupt/profile changes should confirm current state;
- duplicate retries must not duplicate tasks/actions;
- cached sensitive data should use platform-protected local storage;
- logout/device revocation should clear protected local state as appropriate.

## Idempotency

Mobile networks reconnect and retry frequently.

Every mutating native-client request should support safe deduplication where practical.

Conceptually:

~~~text
client_request_id
device_id
principal_id
operation
target
created_at
result
~~~

If the same request is retried after a timeout, the control plane should return the
existing result rather than perform the action twice.

This is especially important for:

- task creation;
- approvals;
- interrupt;
- external messages;
- future infrastructure actions.

## Secure session behavior

Remote sessions should have:

- short-lived access credentials;
- refresh/re-pair semantics;
- device revocation;
- idle/session expiration where appropriate;
- server-side audit;
- HQ/server identity pinning;
- replay resistance;
- rate limiting;
- lockout/backoff for repeated authentication failures.

Do not rely on a single permanent API token embedded in the iOS app.

## Relay trust boundary

A future relay should have the minimum authority necessary to route connections.

It should not become able to:

- create workers;
- approve actions;
- read/write SQLite;
- mutate company policy;
- impersonate the human;
- obtain Codex credentials;
- obtain worker SSH credentials;
- manufacture a trusted BotSquad request.

The HQ control plane remains the authorization authority.

## Web UI remains supported

The iOS app does not replace the web UI architecturally.

The intended model is:

~~~text
                     BotSquad Core
                    /             \
                   /               \
              Web UI              iOS app
            full/admin           mobile/remote
~~~

The web UI remains valuable for:

- setup/bootstrap;
- deep execution inspection;
- large artifacts;
- repository details;
- security/diagnostics;
- development/debugging;
- recovery.

The native client should optimize mobile operation rather than duplicate every web
screen immediately.

## Telegram remains complementary

A native BotSquad app and Telegram integration solve different problems.

### Native app

Best suited for:

- structured dashboard;
- approvals;
- worker/task state;
- multiple companies/HQs;
- execution inspection;
- model/reasoning/priority controls;
- secure operator actions.

### Telegram

Best suited for:

- conversational entry point;
- quick notifications;
- external worker/company identity;
- inter-company/external communication.

Telegram should remain an external identity/transport adapter. It should not become the
canonical operator API merely because it is convenient on mobile.

See [External Identities and Telegram Integration](EXTERNAL_IDENTITIES_AND_TELEGRAM.md).

## Recommended implementation sequence

This architecture depends on several authority boundaries.

Recommended direction:

~~~text
Prompt 04
Nix + trusted approvals + per-worker Linux identity
        ↓
Generalized project/repository lifecycle
        ↓
Stable/versioned authenticated remote client API
        ↓
Device pairing + secure remote transport
        ↓
iOS Remote MVP
        ↓
Push notifications + richer approvals
        ↓
Multi-company-aware mobile UI
        ↓
Optional managed outbound relay / direct federation evolution
~~~

The exact prompt numbering may change.

The important sequencing principle is:

> establish authorization and stable API semantics before making remote mobile access
> able to trigger protected operations.

## Initial iOS MVP acceptance criteria

A first native-client milestone should not be called complete until it proves:

1. the app connects to one paired Ubuntu HQ without manually creating an SSH tunnel;
2. port 4310 remains non-public by default;
3. the app authenticates as a specific human/device principal;
4. device enrollment is explicit and revocable;
5. the app can fetch company/worker/task state through a versioned API;
6. live state changes reconnect/recover safely;
7. the app can send a message without accidentally creating a task;
8. the app can assign one explicit objective through the trusted control plane;
9. pause/resume works through the same domain operation as the web UI;
10. one worker AI-profile update is authorized/audited correctly;
11. execution model/reasoning/priority provenance is visible;
12. retries do not duplicate a mutating request;
13. cached offline state is clearly marked stale;
14. secrets do not appear in app logs or push payloads;
15. device revocation prevents further access;
16. the web UI and SSH-tunnel path continue to work unchanged.

A later milestone can add trusted mobile approvals, multiple HQs, push notifications,
and multi-company switching once the core remote-client path is proven.

## Non-goals for the initial native-client milestone

Do not require the first iOS version to provide:

- full IDE/repository editing;
- arbitrary shell;
- unrestricted SSH;
- Computer Use streaming;
- every web admin screen;
- cross-HQ federation;
- Telegram replacement;
- public BotSquad HTTP exposure;
- autonomous device enrollment;
- permanent bearer-token authentication.

The first goal is a secure mobile operator dashboard and control surface for an existing
self-hosted BotSquad HQ.
