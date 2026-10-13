# Execution Plan — HQ-READY-03F offline reverification

**Status:** Offline implementation and acceptance complete; exact-head integration tracked in PR71

**Owner:** Parent Codex, sole writer; independent read-only architecture, security, recovery and acceptance reviewers

**Branch/worktree:** `codex/hq-ready-03f-accounting` / `../bot_messenger-hq-ready-03f-reaudit`

**Date:** 2026-10-12 America/Vancouver

**Base:** `dad7e765c8335c8cc74073f661dadcb5cf52d3de`, freshly fetched clean synchronized main

**Initial ETA:** 20–40 minutes for reverification; an additional 25–35 minutes for the discovered correction, regression and integration

## Objective and boundaries

The owner resubmitted HQ-READY-03F after PR66 and later 03G/03H/04A were already merged.
Verify the completed work, preserve later integrations and correct only a material remaining
offline accounting defect. No Yahoo request, new live authority, employee inference, deployment,
paid API, paper trading, Asymmetri change or publication. Historical records and receipts are immutable.

Read AGENTS.md, investment decisions/simulation rules/roadmap, Decisions029/032/037–043,
Yahoo runbooks and03–03F acceptance. Current03G/03H evidence contextualizes the original proposal.
The existing03F head065ce61 passes a fresh check/build, 175 contract tests,71 compatibility tests
and its source/build manifests. PR66 is confirmed merged as2be9ae0.

## Findings and implementation

1. Architecture review found no boundary issue. Security identified historical BOM stripping;
   current main already preserves the BOM and has a custody/gateway byte/hash regression.
2. Recovery identified a remaining complete-response settlement gap: malformed Retry-After on
   an offline compatibility refusal throws before ledger insertion. Reproduce with authored
   transport responses, then preserve status/bytes/hash and terminal behavior while conservatively
   fencing that scope. Do not change normal valid-header backoffs or legacy live transport checks.
3. Run focused gateway/bootstrap/recovery/custody tests, check/build/contracts and full regression.
   Freeze source for independent revised reviews; resolve material findings.
4. Add an additive acceptance record with current proposal limitations; preserve original records.
   Commit, open scoped PR, verify reviewed head, merge and synchronize main. Stop offline.

## Validation and remaining work

- Authored regression must fail before the fix and pass after it, retain known response data,
  prevent replay/new wire requests, and preserve existing cookie404/barrier/budget controls.
- Verify all 17 historical03B/03D/03E receipt hashes, spent/noResume and absent capsules without
  reading or reconstructing financial payloads. Decision 037 stays exhausted 4/4.
- Reuse existing Node24 and pinned Python3.12.12/yfinance 1.7.0; no dependency installation.
- Implementation frozen at `e0f0596f1df8c3d595457c7fefb9d7e0bd6d558d`. All 8 initial authored
  reproductions failed as expected. Independent review required a shared strict retry-header
  validator to close parseable-but-invalid values; final 20 targeted and 207 focused cases pass.
  Check/build and 175 contracts pass. Architecture/security/recovery clear final source;
  acceptance verifies these checks and the source/build manifests.
- Final full regression passed:1751 total,1745 passed,0 failed/cancelled,6 existing environment
  skips,726.681 seconds. Four source and four compiled hashes match after the run. All17 original
  receipt names/hashes remain identical, all three authorities noResume, capsules absent.
- Additive [acceptance](../validation/investment/HQ-READY-03F-REVERIFICATION.md) records the
  existing03F completion, this correction, historical preservation and current proposal limits.
  [PR71](https://github.com/eugenelin89/bot_messenger/pull/71) carries exact-head review, merge
  and final synchronized-main receipts without rewriting historical03F records. The final
  integration owner must verify the documentation-only head and rebuilt main before stopping.
