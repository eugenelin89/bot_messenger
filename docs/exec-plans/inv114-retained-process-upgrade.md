# INV-114 — retained portfolio research-process upgrade

Status: source validated; normal PR integration. Owner: parent Codex, sole writer.
Branch: `codex/inv114-retained-process-upgrade`.
Worktree: `bot_messenger-investment-mandate`.
Started October 17, 2026. Initial estimate: 2–4 hours.
Base: `3f777c727e0b37415d2ccbe873de8575c7fbbff7` (merged PRs #113–115).

## Scope and authority

Implement, independently review, test and normally integrate one explicit, append-only
transition from the retained legacy paper book to `investment-process-v1`. Preserve
the portfolio and exact already acknowledged gaps; ordinary approvals remain strict.
Prepare deployment and owner approval instructions. No deployment, live setup,
authority renewal, activation, model/data execution, trade or publication change is
authorized. Ask stays paused and incremental market-data cost remains US$0.

The recovery coordinator, “Review this morning’s run”, confirmed no overlapping edits
or production actions since PR115. October 19–21 legacy scope
`9d43aa35-4e9b-421d-a528-267ea2d159ee` and its active schedule remain untouched.
Its last verified state is evidence, never a future authorization checkpoint.

## Design and invariants

- Explicit upgrade/descendant-renewal types, distinct from ordinary approval and the
  legacy bounded-successor policy. No implicit inheritance of invalid-OHLC omission.
- Derive the three exceptions from independent historical acknowledgements. Bind
  predecessor envelopes, reservation/usage hashes, source history, current custody,
  portfolio head, exact process policy, tools, finite limits and future occurrences.
- Initial upgrade consumed once in the independent approval transaction. Local
  previews/receipts never establish independent authority. Descendants must preserve
  the original exception set and exact process tools and require fresh approval.
- Reject active/future legacy work, unresolved or unknown effects, new gaps, changed
  custody/head/account/rights, spent requests and conflicting duplicate transitions.
- Save remains non-executing. Its whole-book publication hold is explicit and cannot
  interrupt the active legacy scope. Approval and activation remain separate.
- Preserve all records and consumed allowances across restart, local rollback and
  lost response. Cross-file custody failure remains blocked for offline inspection.

## Work plan

1. Audit current code and the exact three retained production gaps read-only.
2. Review design with architecture, security and recovery specialists.
3. Implement trusted transition, HQ setup/approval/activation controls and lineage.
4. Validate isolated migration, inert setup, denials, duplicates and crash recovery.
5. Complete all four independent reviews and fix material findings.
6. Update guides, decision record and guarded deployment/October 22 proposal.
7. Normally merge reviewed source and report deployment/activation as unperformed.

## Validation

Use authored fixtures and fake runtimes only. Cover real Company/Dispatcher restart,
retained three-gap lineage, exact approval, later process renewal, source/model budget
boundaries, publication hold and unknown outcomes. Verify earlier records byte-for-byte
and test rollback/custody failures. Browser checks use a disposable HQ. No genuine
worker or market acceptance is claimed. Broaden affected legacy approval/recovery
tests because shared finite-journal code changes.

## Evidence and decisions

- Clean source branch created from synchronized main. Existing worktrees preserved.
- All four independent specialists reviewed. Earlier authority, receipt/reload and
  publication quiescence findings were fixed; the final fixture receipt passed.
- Recovery coordinator confirmed no overlap and reiterated fresh future custody/head
  binding, inactive preparation and separate operational approvals.

## Remaining work

Implementation and read-only audit are complete. TypeScript, 128 boundary tests,
185 broader regressions, three legacy recovery scenarios, six existing browser
checks and two documentation checks pass. The retained-process Company fixture
and its final rebuilt publication-race/browser run passed end to end. All four
specialists cleared source integration; integrate the reviewed PR.

Ubuntu source transfer was rejected by automatic approval review; nothing was sent.
The exact export/test request is prepared in the guarded plan. Linux is a future
operational gate and is not claimed by local tests. No deployment is authorized.
Guarded deployment and a genuine future session remain separately owner-authorized
milestones. October 22 is a proposal only; objective, evaluation dates, primary sources
and numeric model limits remain owner choices.
