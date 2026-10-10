# Execution Plan — INV-06 market evidence and calendar

**Status:** Active. **Owner:** sequence parent, sole writer. **Branch:** `codex/inv06-market-evidence`.
**Worktree:** `../bot_messenger-inv06`. **Started:** 2026-10-09 America/Vancouver.
**Initial packet ETA:** 90–150 minutes plus review. **Sequence ETA:** 6–10 hours.

## Objective and scope

Implement trusted typed evidence, durable provenance/failure handling and versioned exchange calendar compatible with INV-05. Verify current US$0 source feasibility independently; only verified permissions can admit live data. A01/A05/A08 are accepted only to the scope actually evidenced. Owner authorizes subsequent packets under the [sequence ledger](investment-autonomous-sequence-06-09.md), which controls all boundaries.

No production deployment/migration/collector, provider account, paid fallback, fabricated price, model workload, website edit or methodology substitution. Preserve synthetic-only simulator activation fence until later explicit trusted capability work. Canonical public contract stays pinned.

## Required records read

Repository AGENTS, README, PROJECT_MEMORY, product vision/intelligent-company model, system and investment architecture, decision index, Decisions029/031, investment README/DECISIONS/SIMULATION_RULES/ROADMAP/VALIDATION, launcher, INV-05 evidence and simulator code. Counterpart AGENTS, architecture, INV-04/receiver handoff and integration map at remote `ac53b11`. Counterpart local checkout remains `3d9e1ad`; Git metadata fetch only. Documentation's prior single-selection wording is superseded for this bounded source sequence by the owner request.

## Implementation decisions and risks

1. Separate source/rights, instrument identities, normalized evidence and calendar modules from workers and accounting. Every right is independent and default unknown; no live provider is enabled absent verified evidence.
2. Implement deterministic JSON fixture provider and bounded one-shot loopback HTTP fixture transport. No generic scraper or autonomous live collector. If research finds no suitable live source, record that limitation and leave provider activation absent.
3. Store immutable registry/calendar/evidence and attempt/result receipts in additive schema16; request identity, finite attempts, cache TTL and backoff survive restart. Network I/O stays outside transactions. Unknown interrupted requests consume allowance and are not automatically repeated.
4. Use official 2026 scheduled NYSE/Nasdaq equity calendar with finite validity, provenance and explicit versioned exceptional closures/halts. Scheduled session existence is not evidence of an actual opening event.
5. Bridge only verified, policy-matched raw synthetic observations into INV-05, with unknown source availability preserved separately and conservative knowledge time. Missing/invalid/restricted data never manufactures a simulator observation. Corrections preserve originals and immutable fills. Typed action evidence normalizes without guessed payment/fractional values.

## Steps and validation

- [x] Verify heads, capacity and authorization; create ledger/worktree.
- [x] Source rights matrix and decision record.
- [x] Types, validation, calendar, registry/storage, bounded provider/collector, simulator bridge.
- [x] Deterministic malformed/quality/rights/correction/DST/holiday/early-close/cutoff/failure/quota/cache/HTTP/restart/no-lookahead/action tests.
- [x] TypeScript, full regression, pinned contracts, populated migration preservation, privacy/secrets and whitespace checks. Use serial test execution to limit Mac load; do not run model tests.
- [x] Read-only risk review, fix defects, repeat affected tests.
- [ ] Commit/push/PR; verify exact head/base and checks; merge passing source scope.
- [ ] Record merge receipt, actual limitations and generated INV-07 prompt; continue.

## Evidence ledger

Preflight: BotSquad fetched main `20cc21c`; Asymmetri remote `ac53b11`; ~25GiB available; Node24.10.0. Existing INV-05 dependency tree may be read through a local ignored symlink to avoid duplicate installation; no package changes planned. Source-rights specialist is read-only. No permitted price probe yet.

## Remaining gates

Live source permissions/raw-field availability, current exceptional-closure/halt evidence, corporate-action completeness, public rights, actual Linux operation and all production/owner configuration gates remain unproven. Fixtures do not satisfy those gates. Detailed report: `docs/validation/investment/INV-06.md` when written.

### Final source validation — 2026-10-10

760 total tests:759 pass,0 fail,1 existing Linux-only skip;167740ms serial. Focused40 evidence tests pass, including six overlapping-cache regressions added after review. Build/check, nine-file contract pin, populated migration, actual SIGKILL, local Markdown links, diff/whitespace and credential-pattern review pass. One credential-pattern hit was a pre-existing roadmap anchor substring, not a secret. Current-facing investment status was amended in README, PROJECT_MEMORY, investment README/ROADMAP/DECISIONS/VALIDATION and launcher; historical INV-05 evidence/selection wording remains dated history. All read-only security/recovery blockers resolved; live price and public financial rights remain blocked. No production or employee test. Ready for source PR/integration; next prompt must use actual accepted merge.
