# INV-06 — Market evidence and calendar acceptance

**Date:** 2026-10-10. **Disposition:** source-only synthetic scope accepted by local tests and independent review; live price and public financial-data gates remain blocked. This is partial INV-06 acceptance, not operational completion.

**Ownership:** BotSquad branch `codex/inv06-market-evidence`, owned `../bot_messenger-inv06`, base `20cc21c6032273f1f8ead6c854d04075b1aff450`. Implementation/PR/merge receipts are recorded below when available. The parent alone edited; specialists reviewed read-only. [Plan](../../exec-plans/investment-inv-06.md), [source feasibility](INV-06-SOURCES.md), [Decision032](../../decisions/decision_032_market_evidence_boundary.md), and [continuation authorization](../../exec-plans/investment-autonomous-sequence-06-09.md) define scope.

## Implemented boundary and evidence

Schema16 adds empty immutable policy/instrument/calendar/price/action records and collection attempts/results, preserving every previous table. Eight separately evidenced rights govern automation, internal calculation, retention, raw public display, derived portfolio, benchmark, exports and permanent archive. Policies are finite, immutable, zero incremental cost and expiry checked at admission and after network I/O. Migration/startup enables no source or worker authority.

`MarketCollector` is a one-shot trusted API without timer. Its only price adapter accepts labelled synthetic JSON; the bounded HTTP fixture adapter accepts the literal loopback endpoint only. Request identity is snapshotted before await. Durable reservations consume finite allowance before I/O; pending duplicate IDs never retry or settle another request. Timeouts, size/content/schema/duplicate-key failures, rate backoff, restart and cache expiry retain explicit failure. Cache examines the newest matching attempt, including failures and pending requests, so an overlapping older success cannot hide newer uncertainty. No paid fallback, scraper or live price adapter exists.

Normalized evidence retains stable instrument/symbol interval, venue/currency, exact field/raw adjustment, six-decimal positive value, session, event/source availability/retrieval/knowledge times, quality, source version, correction lineage, policy hash and provenance. Unknown provider availability stays null. Unchanged versions retain original identity and retrieval even after cache expiry. Corrections are checked inside the committing write lock and never rewrite originals or executed fills. Unsupported/unknown corporate-action data remains explicit; payment dates and cash-in-lieu values are not invented. Action corrections require reconciliation.

`MarketFixtureSimulator` imports original/correction lineage atomically into the disconnected INV-05 simulator and enforces the frozen exact source policy. Observation and price-dependent submit/fill/benchmark/valuation operations fence superseded evidence, conflicts, undelivered corrections and current rights. Known data failures never manufacture an opening fill. Tests exercise actual synthetic order reservations/fills and prove a later correction preserves previously committed cash/fill history. The legacy `FixtureSimulator` remains a disconnected fixture facade, not operational authority.

The versioned calendar covers scheduled2026 NYSE/Nasdaq weekdays, ten full holidays, November27/December24 early closes, New York DST and finite-range rejection. July2 is a full session. Immutable exceptional-closure revisions preserve the original. Calendar tests establish251 scheduled open sessions. Scheduled opening time is not a real opening-price observation or proof of no halt; dynamic emergency notices and actual halt feeds remain unimplemented.

## Actual external observation and unresolved rights

One bounded, keyless OpenFIGI mapping request queried the provider's documented example identifier. The receipt at [evidence/inv06-openfigi-probe.json](evidence/inv06-openfigi-probe.json) records actual time, digest and distinct identifier fields. This proves a real identity response only, not price/venue/market-field semantics. Later parser hardening was fixture tested without repeating the live probe. No provider account was created, no price data acquired, no fee incurred and no raw provider prose archived.

The [primary-source matrix](INV-06-SOURCES.md) evaluates Alpha Vantage, Yahoo, Stooq, Twelve Data, Alpaca, FRED, historical Nasdaq WIKI, official calendars, OpenFIGI, SEC and halt references. None qualifies all current project raw-opening, organizational automation, retention and public derivative/export/archive requirements under the no-new-account/US$0 constraints. Unknown permission is not approval. Alpaca historical SIP after15 minutes is distinct from its free live IEX coverage, but account/redistribution/field gates remain unresolved. Calendar schedules do not close these price gates.

## Acceptance and preservation

| Requirement | Established scope | Remaining gate |
| --- | --- | --- |
| A01 frozen configuration/method | Exact source identity and raw opening/session admission; no method substitution | Official owner configuration and verified live source |
| A05 financial correctness | Synthetic no-lookahead fills, corrections, missing/stale/conflicting evidence, typed actions | Real raw-open/action completeness and operational reconciliation |
| A08 provenance/rights | Immutable provenance, eight rights, real identifier receipt, researched limitations | Live price/public-derived/export/archive permission |
| A07/A09 supporting recovery/preservation | Actual child-process SIGKILL after durable request reservation; replay no I/O; schema15→16 preservation | Linux deployment, power loss, backup custody, production retention |

The populated15→16 test compares every old table row/rowid/field including an actual simulator ledger after upgrade/reopen three times; the existing14→current test also preserves representative workers, executions, private conversations, groups, grants, schedules and unrelated state. New authority tables remain empty after migration. Existing worker roles, tools, dispatcher capacity/two slots, runtime sessions, HTTP/client APIs and canonical contracts have no authority expansion.

Correction contention is tested with two SQLite handles in one event loop. It is not claimed as simultaneous independent-process correction contention. Actual process-kill recovery is a separate genuine child-process test. No real employee or actual Linux acceptance was run.

## Validation and review

Local macOS arm64, Node24.10.0. Disposable databases and fixture clocks; serial full regression to preserve shared Mac capacity. Approved unsandboxed local tests are needed for loopback and existing confined-recipe checks. Dependencies reuse the ignored INV-05 tree; no new package, installation or upgrade.

| Check | Observed result |
| --- | --- |
| TypeScript build / check | Passed |
| Final market-evidence focused regression |40 pass,0 fail |
| Final full serial regression | 760 tests:759 pass,0 fail,1 skip;167740ms |
| Canonical generation/digests | Passed; unchanged nine-file v1 pin |
| Full diff/privacy/whitespace | Passed;41 changed files checked, no missing local Markdown links, no new credential patterns (one existing anchor false positive) |

The full suite includes the focused market, migration, crash, HTTP and175 canonical-contract tests; counts are not additive. The pre-existing skip concerns Linux-only generic recipe capacity on this macOS host. Earlier full receipts:752 total/751 pass/1 skip, then755 total/754 pass/1 skip before the final cache correction. Initial focused26 had25 pass and one expected status mismatch (`blocked` versus actual `data_blocked`); corrected the expectation without changing runtime behavior. Subsequent review-driven code fixes gained regression cases. The weak initial cache test was replaced with six genuinely overlapping cases within TTL (429,503,malformed schema,conflict,missing,pending).

Independent security and recovery specialists reviewed frozen implementation. Findings resolved: repeated-source identity/first retrieval, correction admission/use fences and atomic lineage, exact policy binding, submission rights, request mutation across await, and newest failed/pending attempt cache handling. Final security review reports no remaining blocking/important finding; recovery review accepts the synthetic disconnected scope. The source-rights specialist provided primary-source distinctions/limitations only. None is a BotSquad employee execution or production approval.

## Integration and continuation

No HQ host was contacted/deployed/migrated; no website/receiver source or configuration changed; no signing credential, operational grant, investment schedule, model workload, official portfolio or public publication was created. Asymmetri documents were inspected at fetched `ac53b11dfc915979d6a7074ebfb27dce9aefa8a0`, while its checkout remained `3d9e1ad55dc5ad1861393e63d05370a2a1a7b054`. Historical evidence says its schema002 receiver is stopped/default disabled; this task does not claim a fresh production-state probe.

Canonical v1 pin stays `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755`, manifest SHA256 `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`. No real market result or publication permission is inferred from fixtures.

After reviewed source integration, inspect actual merged main, record its receipt and author the complete INV-07 successor prompt. INV-07 may implement privacy-reviewed synthetic public projections and isolated transport without resolving live market-data rights; live/public financial activation remains blocked. The owner's source sequence continues through INV-09. Ask and INV-10–12, official activation, spending and production deployment remain outside scope.
