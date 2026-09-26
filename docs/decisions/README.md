# Decision Records

Durable product, architecture, security, data, and workflow decisions belong here.

## Rules

- Use filenames `decision_NNN_<slug>.md`.
- Decisions are append-preserving history.
- If a later decision changes an earlier one, mark the old decision as superseded/partially superseded and link both directions.
- Do not create a decision record for every implementation detail.
- Record a decision when future agents would otherwise be likely to reopen or accidentally violate an important choice.

## Current decisions

| ID | Decision | Status | Date |
| --- | --- | --- | --- |
| [001](decision_001_local_first_control_plane.md) | Local-first control plane | Partially superseded / clarified by 009 | 2026-09-24 |
| [002](decision_002_messages_do_not_grant_authority.md) | Messages do not grant authority | Accepted | 2026-09-24 |
| [003](decision_003_codex_first_runtime.md) | Codex is the first executable runtime adapter | Accepted | 2026-09-24 |
| [004](decision_004_delegated_worker_creation.md) | Delegated worker creation with an authority ceiling | Accepted | 2026-09-24 |
| [005](decision_005_rename_to_botsquad.md) | Rename product from Bot Messenger to BotSquad | Accepted | 2026-09-24 |
| [006](decision_006_bounded_computer_use.md) | Computer Use is a bounded, preferably sandboxed capability | Accepted | 2026-09-24 |
| [007](decision_007_prompt_01_runtime_and_recovery.md) | Prompt 01 App Server, bounded authority and recovery | Accepted | 2026-09-25 |
| [008](decision_008_managed_engineering.md) | Managed engineering, independent review and tested integration | Accepted | 2026-09-25 |
| [009](decision_009_ubuntu_bootstrap.md) | Ubuntu HQ uses a checked-in Codex bootstrap prompt | Accepted | 2026-09-25 |
