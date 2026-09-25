# Decision 006 — Computer Use is a bounded, preferably sandboxed capability

**Date:** 2026-09-24  
**Status:** Accepted

## Context

Some future BotSquad workers will need to interact with graphical applications and websites. Treating GUI control as an unrestricted property of every worker would expose unrelated applications, files, credentials, and consequential actions.

The organization/authority model already requires trusted capability enforcement outside agent-authored messages.

## Decision

Computer Use is an explicit bounded capability governed by the BotSquad control plane.

The preferred autonomous execution model is a sandboxed browser/desktop/VM/container with narrowly scoped applications, sites, files, runtime limits, and approval requirements.

Local desktop Computer Use may be supported when required, but it is higher risk and must not be treated as equivalent to an isolated sandbox.

Computer access does not itself authorize protected actions such as spending, financial transfers, account creation, external messaging, public publication, credential changes, private-file uploads, or destructive deletion.

Computer Use remains subject to the authority ceiling:

```text
child_effective_permissions
    ⊆ parent_delegatable_permissions
    ⊆ company_policy_ceiling
```

A bot message cannot create trusted approval or expand Computer Use scope.

## Consequences

- Workers without an approved Computer Use capability cannot obtain GUI sessions.
- A specialized Computer Operator role is preferred over granting every worker GUI access.
- Runtime/environment-specific GUI implementation belongs behind adapters.
- Computer session lifecycle and protected-action decisions must be auditable.
- Prompt injection or instructions displayed by websites/apps remain untrusted content.
- A future Computer Use milestone must test sandbox enforcement, authority inheritance, approval boundaries, interruption semantics, and artifact attribution.
- Computer Use is intentionally outside Prompt 01.
