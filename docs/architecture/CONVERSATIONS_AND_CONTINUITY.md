# Conversations and context continuity

Prompt 07 introduces direct conversations independent of Tasks. The browser's
**Conversations** tab and each worker's **Open conversations** action select a worker
and a durable transcript. Multiple conversations can involve the same worker.
The owner has administrative oversight of all transcripts; privacy means isolation
from unrelated workers and unauthorized clients, not secrecy from the owner.

## Work and authority

**Send passive message** only appends a message. **Send & request reply** appends a
message and queues one reply by its intended participant. Neither creates a Task.
Assignments still use existing trusted Task operations. The executive channel and
its historical passive messages are preserved.

An Execution is either task-owned (`task_id`, no conversation ownership) or
conversation-owned (`request_id`, `session_id`, `generation`, no task). SQL constraints
and trusted context checks enforce the combinations. Historical execution IDs,
rowids, links and provenance remain unchanged. Migration 7 introduces these tables
and constraints; migration 8 adds shared provider invocation intents without inventing
metadata for historical attempts.

Both origins share priority/FIFO scheduling, global capacity two, and worker exclusion.
Conversation completion cannot complete a Task, wake a task manager, require an
artifact, retire a temporary worker, or acquire task tools. Conversation tools are
only scoped source retrieval, exact source bookmarks, one peer question and final reply.
Normal runtime confinement remains read-only/no network/no shell/no inherited MCP,
with provider goals, subagents, memories and native broad tools disabled.

The model can select a peer only from currently eligible worker identities. Trusted
code derives its sender from the live execution and checks membership, enabled state,
communication capability, lifecycle and current scope again on every operation.
The question creates a separate two-worker conversation. It reserves a peer request
and one continuation immediately, so later queue pressure cannot discard delivery.
The initiating turn ends; no slot waits or polls. The answer queues that continuation
in the peer transcript. The original human thread contains the initial worker's
attributable response and pending delivery metadata; peer answers are inspectable in
their own conversation, rather than silently copied between scopes.

## Controls and bounds

| Control | Meaning |
| --- | --- |
| Global pause | Holds new dispatch; running turns continue |
| Cancel request | Cancels unstarted work; completed replies remain committed |
| Interrupt reply | Requests provider interruption; UI reflects confirmation or uncertainty |
| Mute | Holds reply dispatch for that conversation; passive messages remain possible |
| Archive | Holds dispatch and prevents new messages; transcript remains readable |
| Resume conversation | Deliberately restores active state; global pause still applies |
| Replace worker's context | Marks safe replacement for the next authorized reply; requires no active or unresolved worker attempt |

Mute/archive require active conversation work to finish or be interrupted first.
Cancellation does not undo replies, tool receipts or other committed operations.
No control automatically retries a blocked request. A fresh explicit request is
permitted only if no unresolved provider attempt remains for that worker.

Finite limits: 8,000 characters per human message, 12,000 per reply, 32,000 serialized
context characters, 12 runtime tool attempts per conversation turn, 24,000 aggregate
retrieval-result characters, 32 queued/active/reserved requests globally, 8 per worker,
12 requests per worker per minute, 40 human messages per minute, 1,000 conversations,
and 50,000 retained human-send receipts. One causal chain permits at most four
requests/two hops; the implemented initial+peer+continuation path consumes three.
Budgets and reservations are durable across restart and session replacement.
Runtime deadline remains bounded by the adapter. Hitting a limit is explicit failure,
not permission to reset consumed budget or discard evidence.

## Context and memory

Worker identity, Conversation identity, provider session, execution, HQ/account and
Unix identity remain distinct. A session is scoped to one worker and one conversation,
with its generation, predecessor, tool schema/hash, participant-scope hash, creation
reason, original-source range, versioned handoff/hash, timestamps and disposition.
Conversation sessions never reuse a task provider thread, and task bindings cannot
reuse a conversation provider reference.

The handoff includes identity/mission, purpose, constraints, up to 6,000 characters of
recent original messages, up to eight exact source-linked bookmarks, structured pending
requests and linked outstanding peer delivery metadata. Each excerpt reports omissions.
The full original transcript remains durably reachable through bounded same-conversation
pagination or `read_message`. Bookmarks cannot fabricate quotations or reference another
conversation. They preserve attributed claims, not verified conclusions or authority.
Other conversation bodies, task history, repository data, artifacts and approvals are
excluded. Access is revalidated when building context and on each callback/tool call.

Rollover occurs after eight completed turns, 64,000 submitted context/output characters,
an operator request, changed scope/tool compatibility, or an observed input/context-window
ratio of at least 65%. Exact provider accounting can be unavailable; conservative local
limits remain in effect. Rollover does not need the old model to write a summary, and
native provider compaction is not counted as replacement.

## Failure and recovery

Persist checkpoint intent before provider creation. Persist a known replacement reference
before naming/activation. Atomically supersede the previous active generation and activate
the replacement. Persist invocation intent before starting a turn. Every tool, event,
configuration/binding update and reply checks live execution ownership and current scope.
The adapter correlates callbacks with the returned provider thread and turn, buffers early
messages until the authoritative turn ID arrives, and rejects stale output/approvals.

On restart, requests whose executions were in flight become visibly blocked; completed
response receipts remain completed. Previously queued/reserved work retains its state,
subject to global pause, current authorization and provider fences. Restart alone does
not hold every queued reply. Preparing/prepared or unresolved sessions retain evidence
and become blocked.
There is no blind provider replay. If no invocation began, a new human request can create
a fresh generation from authoritative records. If an invocation may have begun, a durable
shared worker fence prevents task or conversation dispatch until the outcome is investigated.
The current operator UI does not clear ambiguous provider fences. Inspect the execution,
session, recorded provider reference and provider history; preserve evidence and use a
reviewed repair only after establishing settlement. Creating another conversation, retrying
a Task or asking for rollover cannot bypass the fence.

Replies are committed transactionally with unique response correlation and durable tool
receipts. A lost acknowledgement does not duplicate the reply. This gives idempotent
control-plane effects, not an exactly-once guarantee for provider invocation.

## Browser-only API and runtime contract

New `/api/conversations` list/detail and `/api/conversations/{open,send,control,cancel,
rollover,participation}` mutations use the existing private Host/Origin/browser-CSRF
boundary. Device Authorization headers are rejected. List/history pages are bounded;
the owner can inspect execution metadata and concise session lineage. Text is escaped.
Drafts and delayed history results are tied to their original conversation.

Client API v1 omits conversation executions from task execution DTOs and filters their
audit notifications from its event stream. Old message-only operations remain passive;
no device scope gains reply or interruption authority over conversation work. Worker
status remains a coarse shared worker-availability indicator (it may show busy/blocked
from chat); it contains no transcript, request, provider context or conversation identifier.

Pinned Codex 0.157.0 remains unchanged. Generated matching experimental schemas were
inspected for dynamic tool creation, thread read/resume, turn start/interrupt, and
`thread/tokenUsage/updated`. Dynamic tools attach at thread creation; conversation
schema changes create a separate compatible context. Optional native compaction is
unused. Runtime-specific protocol handling remains in the adapter.

Repeatable real validation uses `scripts/conversations/validate-ubuntu.sh` (operator),
`npm run validate:conversations -- PHASE` with explicit private URL and evidence directory,
and `scripts/conversations/regression-ubuntu.sh`. Fixtures, real responses and deterministic
faults are distinguished in the [validation record](../validation/prompt-07-conversations-continuity.md).
