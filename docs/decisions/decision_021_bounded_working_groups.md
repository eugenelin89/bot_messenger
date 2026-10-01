# Decision 021: Bounded working groups and scoped deliberation

**Date:** 2026-10-01  
**Status:** Implemented candidate; real acceptance and integration pending

## Context

[Decision 016](decision_016_intelligent_company_model.md) and
[Decision 017](decision_017_single_company_first.md) prioritize one useful operating
company. Prompt 08 adds collaborative reasoning before Prompt 09's strategic loop.
[Decision 018](decision_018_conversations_context_continuity.md) supplies conversation
execution, causal scheduling and replaceable scoped contexts.
[Decision 019](decision_019_near_term_worker_empowerment.md) and
[Decision 020](decision_020_scoped_public_research.md) establish explicit public research
and separate company knowledge. None of those capabilities imply group sharing.

## Decision

Use a first-class `working_groups` record associated with one separate conversation.
A group turn remains `origin=conversation`, has `task_id=null`, and must have a matching
`discussion_turns` row, worker, request, session generation, scope and `discussion-v1`
tool schema. Trusted checks and SQL triggers enforce those associations. Direct-chat
controls cannot start group work, and existing device DTOs exclude this origin.
A third execution origin would duplicate the already proven dispatcher, binding and
recovery lifecycle without adding a different scheduling resource.

Creation only records a draft. Explicit owner start authorizes a finite protocol:
actual individual opening executions, facilitator-selected substantive responses,
draft synthesis, one other-worker review, final synthesis. The facilitator commits a
plan and releases its execution slot; trusted code schedules its selected workers only
after settlement. No participant waits while occupying a slot. Scheduling a group turn
never invokes `assign_task`. Ordinary notes and mentions remain passive.

The owner either freezes two to six existing eligible persistent workers or explicitly
asks Atlas to select within a frozen eligible roster. Until selection settles, the
sharing audience is that entire eligible roster, and every owner export binds the
reviewed audience and scope version. Atlas cannot hire or grant permissions. Membership
revocation or evidence withdrawal blocks future delivery and requires a newly reviewed
group to continue; historical owner access remains. Delivered provider context cannot
be erased retroactively.

Evidence is an immutable, bounded export. Owner-supplied material, exact approved-document
excerpts and exact retained public-source excerpts require explicit selection. Workers
may export only their own public research from this same group, with current permission.
Peers get the selected content/provenance, never the private query, source history or
company-document authority. Citation IDs must belong to the checkpoint actually delivered
to that execution. A source export does not falsely advance its author's whole checkpoint.

Existing standing grants retain their exact modes. Public research in a group requires
a new, explicit owner opt-in for `discussion`; membership itself grants nothing. Reuse
WE-01's broker, reader, reservations, call IDs, late-delivery checks and uncertainty fence.
The group's conversation ID is one shared work scope, so adding workers cannot multiply
its work budget; per-worker daily/rate bounds still apply. Company knowledge is not an
implicit group tool. Public queries contain a minimal public research brief, not the
shared packet or private transcript.

`group_syntheses` owns append-only, integrity-tagged draft/final artifacts, independent of
Tasks. Each version fixes the author, execution, transcript/evidence/scope revision and
predecessor. A synthesis distinguishes recommendation, factual support, alternatives,
challenges, dissent, missing evidence and proposed next actions from an owner decision or
protected approval. A separate owner preview/edit/submit operation creates a normal Task
for Atlas with only the selected synthesis plus explicit Task fields.

## Bounds, continuity and recovery

The technical guide specifies finite limits and control semantics. Wall-clock deadlines
continue during pause. Explicit extensions add bounded allowances and retain usage.
Context uses bounded previews plus reachable original contributions, questions, evidence
and artifacts. Serialized charter/owner-note admission and preview compaction prevent
escaped text from silently losing constraints. Context refreshes and original-record
retrieval have separate finite accounting.

Every group worker has separate conversation session lineage from its private chats and
Task runtime. Tool-schema, visibility or conservative context changes require a new
compatible provider session; durable obligations and original evidence stay in SQLite.
No mutable model-generated summary is authorization truth.

Committed turns are not replayed. Queued work can continue after safe restart under the
retained pause state. Unknown employee or nested research-broker outcomes keep the shared
worker fence. A committed final artifact with an unknown synthesizer outcome is retained
but does not make the group completed. Explicit incomplete finalization may use a safe
synthesizer despite another participant's fence, without clearing or impersonating that
participant. A failed scheduling batch rolls back advancement and all queued turns before
blocking for owner inspection.

## Consequences

This is bounded deliberation, not unrestricted chat, automatic implementation, recurring
meetings, a strategic company loop or employee Computer Use. Human controls are trusted
browser operations; Client API v1 acquires no group/grant authority. Opaque provider
internals remain outside the application's observability claims. The application bounds
top-level employee executions and nested broker requests, not every provider-internal
process or search.

See [technical details](../architecture/WORKING_GROUPS.md),
[tutorial](../tutorials/working-groups.md) and
[acceptance record](../validation/PROMPT_08_VALIDATION.md).

For a blocked group whose original charter permits incomplete results, the owner can
select another current, unfenced participant when choosing **Finish with current evidence**.
This queues one bounded final synthesis and records the previous and selected authors.
It does not alter membership, grant permissions, or clear the original worker fence.
The resulting artifact lists failed participation; prior artifacts stay immutable.
