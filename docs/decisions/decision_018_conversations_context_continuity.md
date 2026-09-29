# Decision 018 — Conversations and scoped context continuity

**Status:** Accepted and implemented
**Date:** 2026-09-29
**Extends:** Decisions [016](decision_016_intelligent_company_model.md) and
[017](decision_017_single_company_first.md)

Persistent employees need direct communication across reporting lines without making
every question an assignment or reusing a task thread with broader tools and history.

Use durable direct Conversations with explicit participants, immutable attributed
messages, and explicit bounded reply requests. Executions have a checked `task` or
`conversation` origin; SQL and TypeScript enforce ownership. Passive messages remain
non-dispatching. The existing task/executive channel history stays intact.

All work shares two execution slots and one slot per worker. An initial human reply
may ask one peer question, reserving both the peer reply and one initiating-worker
continuation. These turns release their slots between steps; neither peer nor
continuation can extend the chain. Communication grants no assignment, repository,
infrastructure, approval or external-action authority.

Each worker/conversation pair owns separate versioned runtime sessions. Compatible
legacy task bindings retain their original provider references and workspaces.
Rollover prepares a bounded source-backed handoff, creates a new provider context,
persists its reference before further setup, and atomically activates the generation.
Original messages and structured requests remain authoritative; attributed extractive
bookmarks are fallible memory aids, not new authority. Scope changes invalidate context.

Persist provider invocation intent before `turn/start` in a shared execution fence.
Unknown outcomes block both work origins for that worker. No automatic replay or
exactly-once provider guarantee is claimed. Known replacement contexts created before
activation remain inspectable after a crash. Confirmed completion/interruption can
settle the intent; an ambiguous outcome requires operator investigation.

The browser owner can inspect all conversations, including peer transcripts. Device
API v1 retains its existing authority and task-only execution projection. This
milestone adds no remote conversation endpoint or scope.

Tradeoffs: direct conversations only; finite source bookmarks and retrieval; no broad
semantic memory service; no automatic reconciliation of ambiguous provider outcomes;
no working groups, scheduling, Computer Use, integrations or multi-company support.
See [technical/operator details](../architecture/CONVERSATIONS_AND_CONTINUITY.md) and
[Prompt 07 acceptance](../validation/prompt-07-conversations-continuity.md).
