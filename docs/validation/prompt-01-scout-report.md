# Three Largest Risks to Reliable Multi-Agent Coordination

## 1. Authority leakage through delegation, messages, or runtime context

**Why it matters:** Bot Messenger’s safety model depends on a hard separation between communication and authorization: messages communicate, tasks authorize bounded work, and trusted code enforces capability ceilings. The organization hierarchy is explicitly not a security boundary.

**Likely failure mode:** A manager creates a child worker with capabilities beyond its delegatable set, or writes instructions in a task/message that imply extra authority such as approvals, policy changes, shell access, spending, publication, or access to arbitrary workspace files. If trusted checks are incomplete, the child could act outside the company policy ceiling.

**Mitigation:** Keep worker creation, task assignment, tool identity, and approval grants as trusted control-plane operations only. Enforce `child effective capabilities ⊆ parent delegatable capabilities ⊆ company ceiling`; reject unknown tool fields; bind tool calls to the active execution, worker, task, runtime thread, and canonical workspace; test privilege-escalation attempts as a required acceptance gate.

## 2. Duplicate, lost, or incorrectly replayed work across dispatch and recovery

**Why it matters:** The product’s reliability goals require that tasks are not duplicated, messages are not lost, artifacts remain attributable, and restarts do not replay completed work. Multi-agent coordination becomes unreliable if the same assignment can run twice or a child result fails to wake its parent.

**Likely failure mode:** A crash, duplicate event, or restart leaves a task/execution in an ambiguous state. The dispatcher might reclaim already-completed work, run two executions for one worker or task, miss a child-result wakeup, or auto-retry failed work without human inspection, causing repeated side effects or stale executive conclusions.

**Mitigation:** Preserve the current event-driven dispatcher design: transactional claims, unique active-execution constraints per worker/task, persisted idempotency keys for tools and child-result linkage, durable task/execution/artifact records, startup reconciliation of orphaned executions into inspectable blocked states, and no automatic retry after failure/interruption. Require human-inspected retry and keep completed/cancelled tasks immutable.

## 3. Context, evidence, and artifact integrity gaps in handoffs

**Why it matters:** The system aims to make handoffs explicit and results inspectable. If workers receive excessive, missing, stale, or unverifiable context, coordination degrades into confident prose rather than evidence-based execution.

**Likely failure mode:** A worker acts from vague chat history instead of a bounded task; a manager evaluates a child result without the relevant artifact content; artifact files are misattributed, corrupted, or served without integrity checks; or accumulated history overwhelms future workers and causes unsupported conclusions or loops.

**Mitigation:** Continue passing bounded assignment context: objective, acceptance criteria, constraints, relevant task-linked messages, direct child results, and approved document/artifact references rather than entire company history. Store artifacts with producing task/execution metadata and SHA-256 integrity; serve them read-only/plain text after confinement checks. Use explicit reviewer/revision loops with escalation limits before expanding beyond the current CEO→Researcher pattern.

## Summary

The biggest coordination risks are not model quality alone; they are failures of control-plane enforcement, idempotent execution/recovery, and evidence-preserving handoffs. The approved architecture already addresses these with capability ceilings, trusted tools, transactional dispatch, persistent records, and bounded context, but those invariants should remain the primary validation focus as Bot Messenger expands to larger organizations and engineering workers.