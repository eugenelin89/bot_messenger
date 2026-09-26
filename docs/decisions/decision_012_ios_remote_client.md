# Decision 012 — Native clients use a stable authenticated API and private remote-access layer

**Date:** 2026-09-25  
**Status:** Accepted as future product architecture

## Context

Prompt 03 validates BotSquad as an always-on Ubuntu headquarters with a loopback-only
web UI reached through an SSH tunnel.

That is an appropriate administrative/security baseline, but ordinary mobile operation
should not require the human to manually establish a tunnel every time.

A future iPhone/iPad application should be able to act as a BotSquad dashboard and
operator control surface without turning the existing private UI port into a public
unauthenticated service.

## Decision

A native iOS client will be treated as a first-class BotSquad client.

BotSquad Core must expose trusted domain operations through a stable, versioned,
authenticated client API. The web UI and native app should consume the same control
plane rather than implementing separate authorization truth.

Network transport is a separate concern from the client API.

Supported/future transport modes may include:

- private LAN/VPN access;
- the existing SSH tunnel for administration/recovery;
- a future outbound BotSquad relay for zero-inbound-port mobile connectivity.

The Ubuntu HQ remains private by default. Prompt 03's loopback-only listener must not
be replaced with public 0.0.0.0:4310 exposure merely to support the native app.

A future relay is a routing/connectivity component, not the authority or company-state
store. End-to-end encryption through the relay is a design goal that requires an
explicit later security protocol; it is not assumed by this decision.

Remote devices must be explicitly paired to a human principal/HQ relationship, receive
revocable device-specific credentials, and store private credential material in
platform-protected storage.

Mutating client requests require trusted authorization and idempotency. Mobile
approvals require one-time scoped approval semantics and may not be represented by
free-form bot/user text.

Push notifications, when added, carry only minimal non-sensitive metadata and direct
the authenticated app to fetch canonical state from the HQ.

## Consequences

- future BotSquad APIs should avoid browser-only assumptions;
- the current web UI becomes one client of the control plane rather than the only
  privileged client surface;
- mobile/network reconnect behavior requires request IDs and duplicate-safe mutations;
- remote device identity becomes distinct from human, company, worker and runtime identity;
- device enrollment/revocation/audit become control-plane concepts;
- company/HQ identity must be explicit in multi-HQ/multi-company clients;
- APNs/push metadata must not contain secrets or canonical private artifacts;
- the iOS app should not scrape/embed the current web UI as its primary architecture;
- SSH remains the administrative/recovery path even after native remote access exists;
- Telegram remains a complementary external identity/transport integration;
- a hosted relay, if implemented, must not become the source of organizational truth
  or authorization.

See [Native iOS Remote Client and Secure Remote Access](../product/IOS_REMOTE_CLIENT.md).
