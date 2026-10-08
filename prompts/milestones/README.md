# Core milestone specifications

This is the canonical navigation home for Prompts 01–11. The [roadmap](../../docs/product/ROADMAP.md)
owns sequencing; [Current State](../../docs/operations/CURRENT_STATE.md) owns the operational
snapshot. Prompts 01–10 are complete; Prompt 11 is complete within bounded supervised scope.
Decision 026 makes [Personal Operator / Daily Driver](../stabilizations/README.md) the current
unnumbered priority. There is no Prompt 12.

A specification describes intended work; its execution plan records how work proceeded;
validation establishes what actually passed. Decision links below were mapped from the
records, not inferred from numbering. Foundational boundaries also apply where cited by
those records.

| Prompt | Milestone | Current status | Prompt / specification | Execution plan | Validation | Primary decisions |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Persistent workers, tasks and research loop | Complete | [Reconstructed spec](prompt-01.md) | [Plan](../../docs/exec-plans/prompt-01.md) | [Validation](../../docs/validation/prompt-01.md) | [002](../../docs/decisions/decision_002_messages_do_not_grant_authority.md), [003](../../docs/decisions/decision_003_codex_first_runtime.md), [004](../../docs/decisions/decision_004_delegated_worker_creation.md), [007](../../docs/decisions/decision_007_prompt_01_runtime_and_recovery.md) |
| 02 | Engineering, review and integration | Complete | [Reconstructed spec](prompt-02.md) | [Plan](../../docs/exec-plans/prompt-02.md) | [Validation](../../docs/validation/prompt-02.md) | [008](../../docs/decisions/decision_008_managed_engineering.md) |
| 03 | Ubuntu HQ, bootstrap and worker profiles | Complete | [Reconstructed spec](prompt-03.md) | [Plan](../../docs/exec-plans/prompt-03.md) | [Validation](../../docs/validation/prompt-03-ubuntu.md) | [009](../../docs/decisions/decision_009_ubuntu_bootstrap.md), [011](../../docs/decisions/decision_011_ubuntu_hq_profiles.md) |
| 04 | Trusted worker infrastructure | Complete | [Reconstructed spec](prompt-04.md) | [Plan](../../docs/exec-plans/prompt-04.md) | [Validation](../../docs/validation/prompt-04-linux-identity.md) | [013](../../docs/decisions/decision_013_trusted_worker_infrastructure.md) |
| 05 | Generalized Projects and repository lifecycle | Complete | [Exact source / provenance](prompt-05.md) | [Plan](../../docs/exec-plans/prompt-05.md) | [Validation](../../docs/validation/prompt-05-general-projects.md); [audit/final matrix](../../docs/validation/prompt-05-requirements-final.md) | [014](../../docs/decisions/decision_014_generalized_projects.md) |
| 06 | Client API and device identity | Complete | [Reconstructed spec](prompt-06.md) | [Plan](../../docs/exec-plans/prompt-06.md) | [Validation](../../docs/validation/prompt-06-remote-client-api.md) | [012](../../docs/decisions/decision_012_ios_remote_client.md), [015](../../docs/decisions/decision_015_remote_client_trust.md) |
| 07 | Direct conversations and continuity | Complete | [Reconstructed spec](prompt-07.md) | [Plan](../../docs/exec-plans/prompt-07.md) | [Validation](../../docs/validation/prompt-07-conversations-continuity.md) | [016](../../docs/decisions/decision_016_intelligent_company_model.md), [017](../../docs/decisions/decision_017_single_company_first.md), [018](../../docs/decisions/decision_018_conversations_context_continuity.md) |
| 08 | Bounded working groups | Complete | [Reconstructed spec](prompt-08.md) | [Plan](../../docs/exec-plans/prompt-08.md) | [Validation](../../docs/validation/PROMPT_08_VALIDATION.md) | [016](../../docs/decisions/decision_016_intelligent_company_model.md), [017](../../docs/decisions/decision_017_single_company_first.md), [020](../../docs/decisions/decision_020_scoped_public_research.md), [021](../../docs/decisions/decision_021_bounded_working_groups.md) |
| 09 | Mandates and durable scheduling | Complete | [Reconstructed spec](prompt-09.md) | [Plan](../../docs/exec-plans/prompt-09.md) | [Validation](../../docs/validation/PROMPT_09_VALIDATION.md) | [016](../../docs/decisions/decision_016_intelligent_company_model.md), [017](../../docs/decisions/decision_017_single_company_first.md), [022](../../docs/decisions/decision_022_company_operating_loop.md) |
| 10 | Bounded Computer Use | Complete | [Reconstructed spec](prompt-10.md) | [Plan](../../docs/exec-plans/prompt-10.md) | [Validation](../../docs/validation/PROMPT_10_VALIDATION.md) | [006](../../docs/decisions/decision_006_bounded_computer_use.md), [024](../../docs/decisions/decision_024_bounded_computer_use.md) |
| 11 | Bounded supervised business operations | Complete; bounded supervised | [Reconstructed spec](prompt-11.md) | [Plan](../../docs/exec-plans/prompt-11.md) | [Validation](../../docs/validation/PROMPT_11_VALIDATION.md) | [017](../../docs/decisions/decision_017_single_company_first.md), [022](../../docs/decisions/decision_022_company_operating_loop.md), [025](../../docs/decisions/decision_025_bounded_business_operations.md) |

## Provenance and use

Prompt 05’s exact original survives in committed audit evidence; its entry links to those
unaltered bytes and their source commit/hash. The other ten entries are explicitly labelled
reconstructed specifications. They summarize historical scope without claiming to reproduce
what the owner typed. See the [search and provenance ledger](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit).

Later architecture documents are living references, not evidence that their later features
were original requirements. Preserved historical acceptance wording does not restart work
or replace current priorities. WE-01 and Demo Operator are separate unnumbered interludes,
with their own [WE-01 validation](../../docs/validation/worker-empowerment-01.md) and
[Demo Operator record](../../docs/product/DEMO_OPERATOR.md).
