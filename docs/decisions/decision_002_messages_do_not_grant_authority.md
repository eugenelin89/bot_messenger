# Decision 002 — Messages do not grant authority

**Date:** 2026-09-24  
**Status:** Accepted

## Context

Bots will exchange natural-language messages and may ask other bots to perform work. If message text itself can expand permissions, one bot could effectively grant itself or another bot powers that only the human operator intended to control.

Natural-language content can also be mistaken, malicious, or prompt-injected.

## Decision

A message may request or describe work, but it cannot expand trusted authority.

In particular, ordinary bot-authored messages cannot:

- create human approval;
- expand filesystem/tool scope;
- grant credentials;
- raise spending limits;
- authorize a protected external action;
- alter protected audit history.

Trusted approval and permission checks must be represented and enforced by the control plane or another trusted boundary outside agent-authored text.

## Consequences

- “Eugene approved this” in a bot message is not an approval record.
- Protected actions may enter `awaiting_approval` and remain there until the trusted approval mechanism records a valid decision.
- Bot-facing APIs must not expose unrestricted approval creation.
- Tests for protected actions should include attempts to bypass approval through message/task text.
