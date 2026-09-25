I reviewed Scout’s saved report (`artifact_fff76a3a-7942-46d8-8887-5d7e9bc67e84`). The evidence is sufficient and aligned with the requested documents. My assessment: the three largest reliability risks are real control-plane risks, not just prompt-quality issues.

## Top 3 risks and recommendations

### 1. Authority drift through prompts, messages, or delegated workers

**Why it matters:** BotSquad depends on a hard distinction between communication and authorization. Messages and prompts can describe work, but only trusted control-plane operations should grant authority.

**Likely failure:** A worker interprets text instructions, messages, or delegated role descriptions as permission to perform actions outside its actual capability ceiling.

**Recommendation:** Treat this as the highest-priority safety invariant.

- Enforce capability checks only in trusted code.
- Reject unknown or extra tool fields.
- Test that messages, task text, and worker mission text cannot expand authority.
- Keep the invariant:
  `child effective capabilities ⊆ manager delegatable capabilities ⊆ company ceiling`.
- Make human-only approvals impossible to manufacture through text.

---

### 2. Duplicate, lost, or incorrectly replayed work across dispatcher/runtime boundaries

**Why it matters:** Multi-agent coordination is only reliable if tasks, executions, child results, and restarts are durable and idempotent. The handoff between the control plane and runtime is a central failure point.

**Likely failure:** A crash or duplicate event causes a parent to wait forever, starts the same task twice, replays completed work, or produces conflicting artifacts.

**Recommendation:** Prioritize execution-state correctness before adding more agent behaviors.

- Use transactional task/execution state transitions.
- Enforce unique active execution per worker/task where appropriate.
- Add idempotency keys for tool receipts, child-result delivery, and artifact linkage.
- Build startup reconciliation for orphaned or incomplete executions.
- Prefer explicit inspected retry over automatic replay when state is ambiguous.
- Maintain end-to-end restart tests for flows like: Human → Atlas → Scout → Atlas.

---

### 3. Evidence and artifact trust gaps

**Why it matters:** BotSquad’s managers make decisions from subordinate reports and artifacts. If artifact provenance, integrity, or context delivery is weak, the system can make confident decisions from stale, incomplete, or tampered evidence.

**Likely failure:** A manager receives an artifact without reliable task/execution linkage, misses a corrupt artifact, or proceeds with incomplete child evidence after a crash.

**Recommendation:** Make artifact provenance a first-class reliability boundary.

- Require controlled artifact submission only.
- Bind every artifact to task ID, execution ID, hash, creator, and timestamp.
- Surface missing, corrupt, or ambiguous artifact state instead of silently proceeding.
- Include bounded artifact references and child-result summaries in parent review context.
- Add tests for artifact integrity, missing artifact recovery, and stale evidence prevention.

## Overall conclusion

The biggest reliability risk is not model reasoning quality; it is whether BotSquad’s control plane consistently enforces authority, task lifecycle correctness, and evidence integrity despite crashes, restarts, delegation, and ambiguous text.

## Recommended next step

Create a small reliability test suite focused on these three invariants:

1. **No text can grant authority.**
2. **No task is lost, duplicated, or replayed incorrectly across restart.**
3. **No manager decision proceeds from missing, corrupt, or unlinked evidence.**
