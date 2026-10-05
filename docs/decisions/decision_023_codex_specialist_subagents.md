# Decision 023 — Risk-routed read-only Codex specialist subagents

**Date:** 2026-10-05  
**Status:** Accepted and implemented development workflow

## Context

BotSquad milestones increasingly cross several high-risk development surfaces at once:
typed execution ownership, worker/runtime session isolation, authority and grants,
SQLite migrations, asynchronous provider callbacks, restart/reconciliation, durable
scheduling, public network access, Computer Use, and evidence-heavy acceptance.

One parent Codex thread should remain accountable for implementation and integration, but
a single long-running thread can miss boundary-specific failure modes. The owner asked
whether Codex subagents would help future BotSquad work and requested using the actual
[Asymmetri Motion repository](https://github.com/eugenelin89/asymmetri-motion) as the
reference implementation.

Asymmetri Motion uses persistent project-scoped reviewers in `.codex/agents/`, routes
them by changed risk surface, keeps them read-only, gives them focused review packets, and
leaves the parent agent as the sole writer/integration owner. That pattern is appropriate
for BotSquad, but the specialist roles must match BotSquad's own risks rather than copying
the iOS-specific roster.

## Decision

Adopt persistent **development-time Codex specialist subagents** for BotSquad.

Initial specialist set:

- `control_plane_architect`
- `security_reviewer`
- `recovery_reviewer`
- `product_strategy_reviewer`
- `test_reviewer`

All configs use `sandbox_mode = "read-only"` and intentionally omit model/reasoning
overrides so they inherit the current project configuration.

The parent Codex thread remains the sole writer, Git owner, integrator, deployer, finding
disposition owner, and final decision-maker. Specialists may inspect source/evidence and
recommend changes, but they must never edit files, stage, commit, merge, deploy, mutate an
HQ, or take overlapping write ownership.

Routing is risk-based, not mechanical. Do not run all specialists on every task.

Normal expectations:

- authority, secrets, network, external action or Computer Use changes → security review;
- execution/domain/dispatcher/runtime boundary changes → control-plane architecture review;
- persistence, async callback, scheduler, retry, restart or uncertainty changes → recovery review;
- material roadmap/business/generic-platform scope choices → product-strategy review;
- substantial milestone/production acceptance → validation review before closure.

Low-risk documentation work can use no specialist. A specialist can be omitted when the
risk is clearly absent; record the reason only when the omission would be non-obvious.

Reviewers receive the smallest sufficient packet: objective/non-goals, changed risk,
applicable acceptance requirements, exact diff/files/commit, relevant decisions,
validation already run and open questions. They expand context only as evidence requires.

Independent read-only reviewers may run concurrently. The parent alone edits after
considering their findings.

## Important distinction

This decision changes the **Codex development workflow**, not BotSquad runtime behavior.

Codex development specialists are not:

- BotSquad employees;
- BotSquad working-group members;
- runtime authority principals;
- a new multi-agent execution origin;
- permission for BotSquad workers to spawn provider subagents.

No product capability, grant, production state or migration changes because these
development reviewers exist.

## Consequences

Future substantive BotSquad prompts should explicitly route appropriate Codex specialists
when the changed risk warrants them. Prompt authors should not paste every specialist's
full instructions into each prompt; the persistent project config and
[Specialist Guide](../agents/README.md) are the source of truth.

Prompt 10 Computer Use is expected to use control-plane, security, recovery and validation
review by default because it changes runtime/external-action/security boundaries.
Product-strategy review is added only if Prompt 10 begins making material product/business
scope decisions.

This workflow should reduce blind spots without creating noisy reviewer theater or
parallel-writer merge conflicts. New persistent specialists require demonstrated recurring
need and a distinct review contract.
