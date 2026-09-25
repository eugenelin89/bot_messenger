# Decision 004 — Delegated worker creation with an authority ceiling

**Date:** 2026-09-24  
**Status:** Accepted

## Context

The virtual-startup use case requires an executive worker such as a CEO to create specialists and engineering workers dynamically rather than requiring the human owner to instantiate every worker manually.

Allowing a manager to create arbitrary worker definitions without trusted enforcement would also let that manager attempt to grant new permissions, credentials, or approval authority to its children.

## Decision

Authorized manager workers may request creation and retirement of subordinate workers through the Bot Messenger control plane.

Worker creation is a trusted control-plane operation, not a free-form prompt convention.

A child worker's effective authority must remain within the delegatable authority of its parent and the global company policy ceiling.

Conceptually:

```text
child_effective_permissions
    ⊆ parent_delegatable_permissions
    ⊆ company_policy_ceiling
```

Human-only or approval-gated capabilities remain outside this delegation path.

Worker creation and model execution are separate operations. Creating a worker produces a persistent logical identity; the dispatcher starts/resumes its AI runtime only when valid work is queued.

## Consequences

- A CEO can dynamically construct a team without the human manually creating each bot.
- A manager may define a child's role, mission, reporting relationship, requested capability profile, runtime preference, and lifecycle.
- Trusted application code validates the request before provisioning.
- Bot-authored text cannot grant permissions above the authority ceiling.
- The system should support both persistent employees and temporary task-scoped specialists.
- Tests must include attempted privilege escalation through worker creation.
- Organization hierarchy belongs in the domain model and must survive restart independently of runtime sessions.
