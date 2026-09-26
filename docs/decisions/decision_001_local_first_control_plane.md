# Decision 001 — Local-first control plane

**Date:** 2026-09-24  
**Status:** Partially superseded / clarified by Decision 009

## Context

The project needs a communication and coordination layer for multiple AI workers that can be monitored by one human. Email and external collaboration services introduce account setup and unnecessary external dependencies for the initial experiment.

## Decision

BotSquad's coordination state will be local-first.

Messages, tasks, worker state, execution metadata, approvals, and audit history should be stored locally by default. The initial user interface should connect to a local service.

Using an external AI/model service does not make the control plane itself non-local; however, documentation must accurately state when message/file content is transmitted to an external model runtime.

## Consequences

- A local database such as SQLite is the preferred starting point.
- The system must survive local application restart without losing coordination state.
- Hosted/multi-user deployment is future scope.
- External runtime integrations remain adapters rather than becoming the source of product truth.


## 2026-09-25 clarification

[Decision 009](decision_009_ubuntu_bootstrap.md) changes the primary deployment direction from a service running on the operator's workstation to an always-on, operator-controlled Ubuntu headquarters.

The durable intent of this decision remains:

- coordination state is controlled by the BotSquad operator rather than a third-party collaboration/SaaS control plane;
- SQLite/local-host storage remains the preferred starting persistence model;
- external model runtimes are adapters and are not the source of organizational truth.

In current terminology, **local-first does not mean “must run on the user's laptop.”** It means the control plane and durable company state are self-hosted on an operator-controlled BotSquad host. The human workstation may be only a bootstrap/administration client connected over SSH.
