# Independent read-only security/recovery review

Reviewer: separate `security_review` agent, frozen `fd6a755`, 2026-10-05.
Method: source inspection and retained focused 35/35 check log; reviewer did not execute tests
or providers, mutate state or supply employee responses. Real semantic acceptance remains open.

Result: scoped security clearance; no remaining material findings in reviewed withdrawal,
grounding, checkpoint, privacy and recovery paths.

The earlier frozen `a504807` review found six material issues: private Task history reuse,
queued schedule pause/expiry, evidence withdrawal, Task deadline enforcement, hypothesis-only
support and deduplicated read charging. Candidate `66c291a` fixed four fully; follow-up review
found remaining withdrawal paths through provider context, derivative results/previews, and
unexecuted Task metadata counting as factual support. All were corrected in `fd6a755`.

Verified findings on the final follow-up candidate:

- Withdrawal invalidates coordinator scope, blocks stale derivatives and selected Task evidence,
  and preserves owner history (`src/control/mandates.ts:100`).
- Unexecuted Task metadata cannot satisfy decision grounding (`src/control/mandates.ts:180`).
- Fresh strategic generations retain lineage and stay behind execution/uncertainty fences
  (`src/control/conversations.ts:206`). They do not reuse failed worker identities or clear
  either actual failed attempt's fence.
- Private Task bindings and v1 exclusions remain intact (`src/control/mandates.ts:375`,
  `src/client/dto.ts:12`). Ordinary compatible bindings retain their behavior.

The reviewer explicitly accepted fresh per-turn strategic generations as a bounded continuity
policy: durable mandate/cycle/request identity, source records, budgets and provider lineage
survive, while current evidence still requires full same-execution delivery. Actual real runs
must separately prove useful continuation and evidence responsiveness.

Tradeoff: withdrawal conservatively withholds all older derivatives, including unrelated ones.
This is a usability cost, not a remaining security blocker. No final release or semantic
clearance is implied by this report.
