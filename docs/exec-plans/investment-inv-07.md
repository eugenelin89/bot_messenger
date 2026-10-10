# Execution Plan — INV-07 scoped publisher

**Status:** Accepted source subset merged; full/live milestone partial. **Owner:** sequence parent, sole writer. **Started:**2026-10-10. **ETA:**2–3 hours including integration/review. **Branch/worktree:** `codex/inv07-scoped-publisher`, `../bot_messenger-inv07`, base `e6f27ec6164936d92015bc83d2df2e53fe92931f`.

[Authored specification](../../prompts/experiments/investment-inv-07.md) defines requirements and the [sequence ledger](investment-autonomous-sequence-06-09.md) preserves controlling owner authority. INV-06 source was merged after760 tests/759pass/1skip and two reviews; live price/public-rights gates remain blocked. Canonical v1 remains fixed. No production or Asymmetri source change permitted.

## Implementation and validation plan

- Inspect actual v1 helpers/receiver and existing owner UI/authentication, simulator outbox and market rights boundaries; record design before edits.
- Implement typed owner-approved projections/derivatives with exact origins and opaque public identities, current rights and audience fences.
- Add empty additive storage for grant/preview/outbox/attempt/receipt state; no startup authority.
- Add owner preview/consent/revocation/health controls and finite single-step signed transport with dependency ordering/reconciliation.
- Validate A02/A03/A06/A07/A09 using synthetic simulator data and real disposable receiver, failure/restart/rights/privacy/migration cases.
- Read-only security/recovery/architecture reviews; disposition findings with focused tests. Run serial regression/contracts, inspect full diff and secrets/links.
- Commit/push/PR, verify exact remote head/base/checks, merge accepted source and verify main; produce INV-08 prompt from actual results.

## Current risks and boundaries

Private simulator projection is not canonical wire data. Receiver acknowledgement never changes accounting. Public grant/owner consent must not flow from worker prose, research permissions or normal group membership. Official/live evidence remains blocked; synthetic scopes must stay explicit. Unknown transmitted outcomes and generation/rotation/revocation must survive restart without uncontrolled resend. No daemon or operational credential is created for validation. Preserve resource headroom and shared two-slot runtime.

## Evidence and remaining work

2026-10-10 00:50 Vancouver checkpoint: schema17/passive source configuration, typed synthetic simulator projections, exact owner preview/consent, immutable outbox/attempt/receipt records, Ed25519 bounded transport and private owner UI implemented. First actual isolated Asymmetri receiver test passed simulator accounting/artifact bytes/lost-response reconciliation and generation fence. Focused14 tests passed. Reviews drove consent replay, late acknowledgement retention, independent uncertainty flag, source binding, action provenance and MIME scope fixes. Additional current-watermark restore proof, per-instance generation binding and artifact source/version integrity tests are in progress. Remaining: expanded receiver/restore/browser/migration/privacy acceptance, review closure, full serial regression/docs/PR/merge. Original2–3h estimate remains plausible; no live operational claim.

2026-10-10 01:18 Vancouver checkpoint: actual receiver/restart/backup/content-refresh, browser390/1440, migration, SIGKILL and37 focused tests passed. Full serial795 tests passed794/0fail/1existingLinuxskip (170309ms), after correcting three legacy schema16 assertions. Security/recovery/architecture reviews cleared the documented synthetic scope. Final test reviewer requested malicious receipt and post-consent expiry coverage; added25 focused cases now running. Documentation qualifies newRiskBlocked as a signal pending08/09 admission enforcement. Canonical pin, remote base, links, secret-pattern scan and diff whitespace checked; disk23GiB. Remaining: final focused/test-review closure, source PR/merge and actual08 successor. ETA still within2–3h for07.

Final focused62/62 passed (15270ms), no skips. Review dispositions and full795/794pass/1Linuxskip evidence are in INV-07 validation. No runtime changes after full regression;25 added adversarial tests and two browser widths passed in the final focused run. Ready for source integration, with health enforcement deferred explicitly to08/09 and full milestone/live gates partial.

Integration: PR#42 merged reviewed `cc11527b48f011c7084df37276aa73fd1e77fca8` as `61287e51c64706a1120b6a94e0009e98a6eb90c3` at2026-10-10T08:19:21Z; fetched main/tree verified. INV-08 continues in its new owning worktree. Source development took about58min, below initial2–3h estimate.
