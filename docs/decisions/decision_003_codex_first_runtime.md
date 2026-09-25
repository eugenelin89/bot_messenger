# Decision 003 — Codex is the first executable runtime adapter

**Date:** 2026-09-24  
**Status:** Accepted

## Context

The long-term product should support logical AI workers without coupling the core domain to one runtime. A first real backend is still required to prove dispatch, resumability, artifacts, interruption, and worker handoff.

The project owner already uses Codex extensively for repository work.

## Decision

Codex will be the first executable agent runtime integrated with Bot Messenger.

The core message/task/approval model remains runtime-neutral. Codex-specific thread/session identifiers, transport details, events, and controls belong behind a runtime adapter.

Other runtimes, including ChatGPT Work where a suitable supported control surface exists, are future adapters.

## Consequences

- The first end-to-end milestone should use real Codex execution.
- Architecture must not model a Task as a Codex thread.
- Tests should use fake runtime adapters for most deterministic behavior and reserve real Codex for bounded end-to-end validation.
- Do not depend on unsupported assumptions about controlling arbitrary existing ChatGPT Work conversations.
