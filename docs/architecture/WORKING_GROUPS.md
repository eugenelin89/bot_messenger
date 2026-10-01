# Working groups: execution, visibility and continuity

Prompt 08 adds an owner-started bounded deliberation object. This implementation is under
acceptance; consult the [validation report](../validation/PROMPT_08_VALIDATION.md) for the
actual accepted revision rather than inferring acceptance from this design description.

A draft persists the question, desired output, constraints, initiating operation, roster,
facilitator, synthesizer, incomplete-result/research choices and limits. It creates no
Task or execution. Starting it is the trusted trigger. Every attributed employee
contribution is committed by that worker's own group-associated conversation execution.

## Ownership and progression

Tables added by schema 10 are `working_groups`, `discussion_turns`,
`discussion_contributions`, `discussion_questions`, `discussion_checkpoints`,
`group_evidence`, `group_syntheses`, `discussion_extensions`, `discussion_receipts`,
`discussion_retrieval_usage` and `discussion_assignments`. Migration only adds structure
and privacy filtering; it creates no workers, grants, groups, Tasks or provider activity.

The execution origin remains `conversation`; a SQL trigger additionally binds request,
group, worker, session/generation, scope and `discussion-v1`. Direct controls and tools are
excluded. Synthesis, evidence, checkpoints and contribution ownership have independent
SQL checks, and immutable evidence cannot be rewritten. Runtime identity comes from
trusted context, never model-authored names. Shared dispatch still allows at most two
employee executions and one per worker, including across Tasks and direct conversations.

Default progression:

1. Optional Atlas organizing execution selects two to six existing workers from the
   charter's eligible roster, including Atlas and a selected synthesizer. Its plan must
   settle before membership changes and opening turns are queued.
2. All participants give separately executed initial perspectives. Parallel turns record
   the different transcript/evidence revisions they actually received.
3. A facilitator chooses a material question and one or two responders citing prior
   contributions, or explains why the group can synthesize. Responses lead to a new
   facilitator decision while bounds permit. No required theatrical disagreement.
4. The synthesizer creates a structured draft. One other participant reviews for material
   omissions. The synthesizer creates a linked final artifact; trusted progression marks
   completion only after confirmed settlement and the correct artifact receipt.

Planning never starts a Task. Committing a turn ends that execution; a worker does not poll
or wait on peers. Failed batch scheduling rolls back both advancement and all queued work.
There are no recurring timers or autonomous business reviews. The sole group timer enforces
its deadline and aborts active work when that deadline is reached.

## Fixed budgets

| Resource | Default / hard bound |
| --- | --- |
| Participants | 2–6, persistent and currently eligible for internal messaging |
| Active/draft/paused/blocked groups | 8; 500 retained total |
| Turns and rounds | 24 turns / 3 rounds; hard 40 / 5 |
| Explicit extensions | At most 2, each +8 turns, +1 round, +30 minutes |
| Time | 60 wall-clock minutes from start; pause does not stop the clock |
| Reserved finish work | 3 turns reserved; at most 6 synthesis executions across versions |
| Contribution / transcript | 8,000 / 180,000 source characters, with reserved synthesis room |
| Charter | Topic 300, desired output 2,000, constraints 4,000; serialized envelope 8,000 |
| Owner interjections | 32 notes, 4,000 each, bounded cumulative source and serialized text |
| Delivered context | 48,000 serialized characters; optional previews compact before originals are lost |
| Tool work | 16 calls per execution; at most 3 explicit context refreshes |
| Original-record retrieval | 48,000 returned characters per turn, separate from refresh accounting |
| Evidence | 32 records, 6,000 chars each, 64,000 total retained excerpt chars |
| Research | One shared group scope: 32 operations, 8 search sessions, 160,000 returned chars; WE-01 daily/rate/time bounds also apply |
| Questions | 24 total, at most 2 new questions per contribution, 600 chars each |
| Synthesis | 12,000 serialized authored chars; 32,000 complete artifact chars |

Consumed turns are reserved at scheduling. Restart, context replacement and extensions do
not erase consumption. Group/source/context metadata and omitted-character notices explain
previews; original records remain reachable through bounded `read_group_history` and
`read_group_record` (contribution, question, shared evidence or synthesis ID).

## Scope and sharing

An owner export names and confirms the reviewed audience and scope. Atlas's unresolved
selection exposes the complete eligible roster as the prospective audience. A stale
confirmation is rejected if selection changes scope while a share form is open.

Group membership authorizes only this transcript and designated packet. Owner document
exports must be exact excerpts of approved documents; worker reading permission alone
never permits export. A worker's public-source export must be its own research from this
group, with current discussion-mode permission. Original URL/source ID, source kind,
retrieval and source times, SHA-256 and omissions survive. Private query, operation/grant
IDs and unrelated histories are not exported. A peer may inspect the export without a
lookup grant. Retrieval revalidates membership/scope and the delivered revision.

Research and Company Knowledge stay distinct. Existing grants are not broadened. An
owner who wants to extend an old public-research grant revokes it and explicitly grants
again with the working-group option. The group's own charter must also permit research.
Organization, synthesis, review and finalization turns cannot perform new research.
WE-01's async broker lifecycle remains authoritative: reserve before I/O, await callbacks,
recheck authority before commit/delivery, retain unknown broker fences after parent exit.

A new interjection does not imply a running worker already saw it. Ordinary contributions
retain their actual checkpoint. Facilitation and synthesis must refresh when a newer
transcript/evidence revision exists. Sharing a source alone advances no whole-context
checkpoint. Final artifacts freeze their revisions; later notes do not mutate them.

## Controls and recovery

| Control | Meaning |
| --- | --- |
| Create draft / passive note | Records material; no model dispatch |
| Start | Explicitly authorizes the bounded group protocol |
| Pause future turns | Holds new group dispatch; active work may commit; deadline continues |
| Interrupt | Separately requests cancellation; inspect confirmation or uncertainty |
| Stop | Cancels queued work and denies future callbacks; never launches a summarizer |
| Resume | Continues valid retained intent, subject to global pause, scope, deadline and worker fences |
| Finish with current evidence | Explicitly queues one final synthesis after active work settles |
| Another bounded round | Adds the recorded finite extension and retains history/usage |
| Archive | Makes a settled group read-only |
| Revoke member / withdraw evidence | Blocks future delivery and continuation; create a new reviewed group |
| Replace context | At a safe idle boundary, requests a new scoped provider generation on the next turn |

Provider session lineage is per worker/group and distinct from direct/private and Task
sessions. Context is reconstructed from authorized originals with charter, owner notes,
unresolved question IDs, failures, pending turns, evidence packet and latest synthesis.
Completed turns never replay. A safe restart keeps queued work and the persisted pause
state. Ambiguous runtime or broker outcomes block that worker across work modes. No UI
control clears an uncertainty fence.

A final synthesis committed before an unknown provider settlement remains inspectable but
the group stays blocked. With explicit incomplete-result authority, a safe synthesizer may
produce a clearly partial result while other-worker fences remain. Failed/absent workers
are listed; model prose cannot manufacture their approval. Model explanations are public
operational outputs, not requested/stored hidden provider reasoning traces.

## Owner, device and assignment boundaries

Only the existing local browser/Host/Origin/session boundary exposes group routes. API v1
has no group controls, new device scopes, grants or private group DTO/event contents.
Browser text and source links use the established safe rendering/URL helpers. Drafts and
in-flight history results are bound to selected group IDs.

The owner can inspect/download immutable synthesis JSON, including recommendation,
alternatives, findings, challenges, dissent/risks, evidence limits, approvals needed and
question/contribution/evidence references. Its context can be explicitly previewed and
submitted as a normal Atlas Task. Only that selected artifact plus edited Task fields are
attached; no group transcript is implicitly copied. The original artifact remains intact.
All existing Task hierarchy, Project, repository and protected-approval rules still apply.

See [Decision 021](../decisions/decision_021_bounded_working_groups.md),
[conversation continuity](CONVERSATIONS_AND_CONTINUITY.md) and
[WE-01 research](../operations/PUBLIC_RESEARCH_TUTORIAL.md).

For a blocked group whose original charter permits incomplete results, the owner can
select another current, unfenced participant when choosing **Finish with current evidence**.
This queues one bounded final synthesis and records the previous and selected authors.
It does not alter membership, grant permissions, or clear the original worker fence.
The resulting artifact lists failed participation; prior artifacts stay immutable.

## Evidence receipt versus catalog visibility

The shared-evidence catalog contains metadata, not bodies. Seeing its revision does not
prove the worker read an excerpt. Every cited evidence ID now additionally requires a
trusted receipt delivering that exact complete immutable excerpt to the same execution:
`read_group_record` at offset zero or the worker's own explicit source export result.
Partial reads, peer/previous-turn reads and private research-source receipts do not qualify.
A failed retrieval-budget transaction leaves no qualifying receipt. Relevant owner material
must be inspected before claiming a product fact is missing; material not inspected within
budget is **unreviewed**, not absent. This prevents unsupported catalog-only citations,
but does not make model interpretations or claimed facts automatically correct.
