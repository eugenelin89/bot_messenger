# Independent read-only review — a504807

Reviewer: separate `security_review` agent, exact frozen commit
`a504807f0e667802e026442d4dd4f609e3ebb012`. No edits, services or models were run by the reviewer.
Clearance withheld pending fixes and focused review. Semantic real-cycle review remains pending.

| Priority | Finding | Correction and regression |
| --- | --- | --- |
| P1 | Mandate internal Tasks reuse ordinary worker-wide provider history; later v1-visible work could reproduce private strategy | Separate per-Task private bindings, bidirectional reference denial, ordinary binding preserved with/without research grants |
| P1 | Schedule pause/expiry after queue is not rechecked before first execution | Hold paused queued reviews, deny/cancel expired ones, allow control of exhausted-but-pending occurrences |
| P1 | Withdrawing an observation does not revoke its group export/synthesis | Atomically revoke affected group scopes while preserving originals and fences |
| P2 | Linked Task runs beyond its cycle deadline | Shared dispatcher abort timer includes internal Task cycle deadline |
| P2 | Model hypothesis or unsupported prior decision satisfies factual grounding | Hypotheses cannot be evidence; prior decisions alone require explicit missingness |
| P2 | Repeated fresh reads bypass 48,000-character cumulative retrieval bound | Charge each distinct successful call separately from full-delivery coverage; exact replay stays idempotent |

The reviewer found no further direct v1 DTO/list/count/current-Task/interrupt/notification exposure
in that candidate. This does not constitute final clearance or real acceptance.
