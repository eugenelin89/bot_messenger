# BotSquad prompts and task specifications

This directory is the navigation home for intended work: core milestone specifications,
unnumbered stabilization tasks, reusable operational prompts, experiment launchers and
prompt-authoring guidance. Reading a specification or launcher does not start work.

Prompts 01–10 are complete. Prompt 11 is complete **within bounded supervised scope**.
Personal Operator / Daily Driver is the current unnumbered priority under
[Decision 026](../docs/decisions/decision_026_personal_operator_stabilization.md), with
stabilizations 01–04 complete and deployed. There is no Prompt 12. Expansion remains deferred.

## Find the right kind of prompt

| Location | Purpose and placement rule |
| --- | --- |
| [milestones/](milestones/README.md) | Core numbered BotSquad milestone specifications only; index for Prompts 01–11 |
| [stabilizations/](stabilizations/README.md) | Unnumbered Personal Operator stabilization task specifications; 01–04 do not continue core milestone numbering |
| [operations/](operations/bootstrap-ubuntu.md) | Reusable operator/bootstrap/maintenance prompts, bounded to their explicit operational task |
| [experiments/](experiments/investment-showcase.md) | Optional experiment launchers outside the core roadmap |
| [authoring/](authoring/MILESTONE_REQUIREMENTS.md) | Rules and acceptance guidance for writing future prompts |
| [AGENTS.md](AGENTS.md) | Scoped instructions applying throughout this subtree |

Keep the root for navigation and instructions. New experimental prompts belong under
`experiments/`, never at the root. Do not create directories merely for symmetry.
Implementation code, full execution logs, runtime transcripts, secrets and private
conversational metadata do not belong here.

The investment showcase/Ask BotSquad launcher belongs to
[docs/experiments/investment/](../docs/experiments/investment/README.md). `INV-NN` and
`INV-ASK-NN` identify optional experiment packets; they do not create core Prompt 12+ or
replace Personal Operator priorities. The owner must select work before the launcher runs.

## Document roles and lifecycle

- **Prompt / milestone specification:** the intended goal, behavior, boundaries and
  acceptance expectations of a task. It is not proof the task ran or passed.
- **Execution plan:** how Codex approached and delivered work, including branch/worktree,
  changing plans, failed attempts, validation and integration history.
- **Validation evidence:** what was actually checked, with source/runtime provenance,
  results, retained failures and qualifications. It is not a product roadmap.
- **Decision record:** durable accepted rationale and boundaries; later decisions may
  explicitly supersede earlier ones without rewriting their historical reasoning.
- **Operational prompt:** a reusable instruction for a bounded operator procedure.
- **Experiment launcher:** a wrapper for one owner-selected optional packet; no implicit
  implementation, production activation or permission to execute the entire experiment.

```text
Prompt / milestone specification
        ↓
docs/exec-plans/
        ↓
implementation / PRs
        ↓
docs/validation/
        ↓
durable decision records where applicable
```

Decisions may also precede implementation and constrain the whole lifecycle.
`prompts/` ≠ execution history; `docs/exec-plans/` ≠ original prompt archive;
`docs/validation/` ≠ product roadmap. Existing plans and validation stay in place.

## Historical provenance

An **exact historical source** has verifiable committed provenance. Prompt 05’s full
original is preserved unchanged in its audit evidence; its [entry](milestones/prompt-05.md)
provides the source commit and digest rather than duplicating or modernizing it.

A **reconstructed canonical specification** is a concise editorial account derived only
from the accepted roadmap, applicable decisions, execution plan, validation and committed
requirements/evidence. The other ten milestone files and the first three stabilization files
carry a prominent historical note: they are not byte-for-byte original prompts. The
[history audit](../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records what was searched and recovered. Do not silently back-port later requirements.

## Preserve future substantial prompts

When the owner approves a substantial implementation prompt that becomes real work,
commit its canonical task specification to the appropriate directory before or during
execution whenever practical. Identify it as an authored specification and link its
separate execution plan and final validation. Exact transcript preservation and private
conversation metadata are unnecessary. Preserve originals faithfully; label later
clarifications and reconstructed material explicitly.

## Documentation map

[Repository README](../README.md) → [Current State](../docs/operations/CURRENT_STATE.md) →
[Roadmap](../docs/product/ROADMAP.md) → [Milestone specification index](milestones/README.md)
or [stabilization index](stabilizations/README.md) → linked
[execution plan](../docs/exec-plans/) → linked [validation](../docs/validation/) →
[decisions](../docs/decisions/README.md) / [architecture](../docs/architecture/SYSTEM_ARCHITECTURE.md).

This is navigation, not a competing roadmap or operational snapshot.

## Lightweight freshness gate

For substantial documentation/product changes:

1. Verify current main, roadmap, Current State and accepted sequencing decisions.
2. Search current-facing Markdown for `is next`, `next milestone`, `planned`, `pending`,
   `not implemented`, `future Prompt`, `Prompt 12`, `Prompt 13`, `Prompt 14` and
   `live acceptance pending` (including headings and diagrams).
3. Classify each hit as **current-facing**, **historical**, or **future architecture**.
   Correct stale current claims; preserve dated history and deferred design constraints.
   A pending approval or a future architecture requirement is not automatically stale.
4. Check moved paths, repository-relative links/anchors and both specification indexes.
5. Record commands, exact counts, corrections and intentional historical exclusions in
   the task’s execution plan. Run `git diff --check` and inspect the final scope.

Use available repository checks or a small temporary checker; no new documentation framework
is required. A documentation-only change needs no application build or production deployment.
