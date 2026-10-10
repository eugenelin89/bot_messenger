# Decision 031 — Trusted deterministic paper simulator

**Date:** 2026-10-09

**Status:** Accepted for INV-05 synthetic source/local acceptance; no deployment or operational activation

## Decision

The owner selected INV-05 implementation and reviewed merge. Financial arithmetic belongs to trusted software in BotSquad; Asymmetri remains the receiving/display system. The [acceptance record](../validation/investment/INV-05.md) describes tests and limits.

Use an internal `FixtureSimulator` over the existing SQLite Store and a pure deterministic domain reducer. Accept only `synthetic_fixture` configuration and explicit fixture actors/data. No Company, HTTP, dispatcher, scheduler or worker tool invokes this facade. Fixture names confer no employee capability.

Schema15 adds frozen runs, immutable command journal, request receipts and disabled private outbox. Short `BEGIN IMMEDIATE` transactions replay/check history and persist the whole mutation, using existing WAL/FULL synchronization. No external I/O occurs in the transaction. Every command/rejection has a journal sequence; financial `ledgerVersion` advances only for nonempty postings. Reservations serialize against current books even when financial version is unchanged.

Use bounded BigInt millionths and half-even rounding. Discretionary orders use whole shares, weighted-average basis and full-exit residue. Benchmark units round down to affordable millionths; unresolved split fractions remain exact rational entitlements. The separate benchmark book uses raw prices, explicit dividends and next-open reinvestment with zero commission/slippage. No adjusted series is accepted.

Freeze eligible opening, cutoff, guard and finite expiry. Late original evidence can fill only while the whole portfolio can still be evaluated at that opening; later economic state fails closed. Corrected openings cannot replace original fills. Late economic effects/corrections append valuations and downstream return/drawdown revisions. Financial `ledgerVersion`/`ledgerHash` identify the accepted accounting-history prefix; `asOf` selects effective-time postings. Journal version/hash identify the prior committed anchor. The enclosing journal commits the snapshot without circular hashes.

`inv05-private-projection-v1` is private staging evidence, not canonical contract1.0 JSON or public authorization. INV-07 owns canonical projection, privacy review, authority, signing and transport. Canonical contracts/receiver pins stay unchanged. Reuse pinned `canonicalize`2.1.0 at runtime; no new package/version is introduced.

## Limits and consequences

- Fixture source/actor labels establish no live provider authenticity or authenticated worker authority.
- Every read/write replays bounded history and checks hashes, references, checkpoint and outbox. The 100,000-command admission bound is not a throughput claim. Real scale/retention and independent backup custody need activation evidence.
- Unsupported actions, unresolved fractions, ambiguous simultaneous split/dividend units and out-of-order splits block the affected instrument without guessed prices/cash.
- Missing marks/comparisons are null. First-time historical values that would reuse later books/reservations/uncertainty reject; existing snapshots can be revised from saved orders and dated evidence.
- Hashes detect retained-history corruption, not an administrator replacing the entire database and all hashes. Process kills do not establish disk-failure or production backup recovery.
- Decisions029/030 remain unchanged. No official run, provider, worker tool, publisher, brokerage or INV-06 work follows automatically.
