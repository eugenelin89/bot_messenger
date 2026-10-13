# HQ-READY-03F — offline reverification and refusal accounting

**Date:** 2026-10-12 America/Vancouver

**Base:** `dad7e765c8335c8cc74073f661dadcb5cf52d3de`, clean freshly fetched synchronized main

**Branch/worktree:** `codex/hq-ready-03f-accounting` / `../bot_messenger-hq-ready-03f-reaudit`

**Implementation:** `e0f0596f1df8c3d595457c7fefb9d7e0bd6d558d`

**Status:** Offline source and full regression accepted; exact-head integration receipt tracked in PR71

## Existing completion and current scope

The owner resubmitted the original 03F packet after it and later work had been integrated.
GitHub confirms [PR66](https://github.com/eugenelin89/bot_messenger/pull/66) merged reviewed head
`065ce61f4088c639669cc35f156c59681cafde3f` as
`2be9ae0cfbad0e8e4e7bc6c8eed4c664716955a1`. Its implementation commits were
`d6a6fcbe5ab026db259a747a16c6765abffcd7a6` and cookie-continuity correction
`533b412c17d802c6146f43fc990fd6d8101f3cbe`.
The [original acceptance](HQ-READY-03F.md), all earlier decisions, receipts and acceptance records
remain unchanged. This additive audit preserves 03G/03H/04A rather than replaying an older baseline.

Fresh checks on the original isolated03F worktree passed typecheck/build, 175 contract tests and 71
compatibility tests, with no skips. Its 9 source / 6 build manifest entries matched. The retained
original full-regression log matches the committed digest:1564 total, 1558 passed, 6 existing skips.
That is historical full-regression evidence, distinct from this correction's validation below.

Only GitHub was contacted for source/Git verification. Fresh pinned tag `data.py` and the installed
yfinance 1.7.0 wheel both hash to
`5f41a4cec99d50be3a13c8ae5f2674e1b5e1582be1a861fcdbb57bba783629da`.
No Yahoo request, dependency installation, live authority, employee inference, paid API, trading,
deployment, Asymmetri change or public financial publication is part of this task.

## Upstream semantics and corrected gateway

The [pinned source](https://github.com/ranaroussi/yfinance/blob/1.7.0/yfinance/data.py) confirms the
original mismatch. `_get_cookie_basic` does not inspect a returned HTTP status/body, attempts
cookie persistence and returns True even if saving an empty jar returns False. That Boolean is
not proof of a cookie or authenticated session. `_get_cookie_and_crumb_basic` and
`_get_crumb_basic` can repeat bootstrap before the crumb request. `_make_request` can attempt
an uncrumbed chart after rate-limit/transient crumb errors and can switch strategy/retry an
HTTP error even when configured network retries are zero. The authored upstream tests exercise
these paths; BotSquad blocks them after rejection or uncertainty.

[Issue #2456](https://github.com/ranaroussi/yfinance/issues/2456) is historical 0.2.59 evidence of
bootstrap404 followed by crumb/chart200, not evidence of current access or a source of fixtures.
Decision 042's exact literal plain-text404/cookie grammar remains unchanged. Original status404,
parent-only cookie continuity, valid crumb binding, six attempts, five-second completion spacing,
limits and denied fallbacks remain enforced. The full authored path still yields 21 fictional
AAPL bars with statuses `[404,404,200,200,404,200]`: three cookie calls, one crumb and two charts.
Unknown availability, present retrieval, explicit missingness and `executionQualified=false`
preserve historical research versus paper-execution distinctions.

## Discovered defect and correction

Independent recovery review found an inherited offline accounting gap. A completed compatibility
429/502/503/504 with malformed `Retry-After` could reach gateway backoff parsing before result
insertion. Parsing threw, leaving an unknown attempt instead of its known HTTP status, byte count
and body hash. Replay stayed blocked. Eight authored fixtures reproduced this before correction.

Compatibility completion now validates retry metadata and marks a complete invalid response as
rejected. Gateway settlement preserves the original status/bytes/hash; for such rejected 429/5xx
responses whose retry metadata is invalid, it fences requests through the existing scope expiry.
It neither guesses a shorter delay nor retries. Transport and gateway share the strict existing
wire grammar: 1–10 decimal digits, at most 315360000 seconds, or an exact canonical HTTP date.
Valid-header backoffs, owner-custody header checks, unknown transport accounting and authority
boundaries remain unchanged. No schema, manifest, issuer, CLI, dependency or live capability changes.

Review caught an intermediate validator mismatch: ISO dates, negative strings and overlong
zero-padded numbers could fail transport validation yet pass permissive gateway parsing. The shared
validator and 20-case matrix close that gap. Cases advance the clock 60 seconds before proving that
a new transport still cannot issue another request. They also verify immutable logical replay,
one actual authored wire/DNS call, no observation, terminal transport and exact settlement.

Security also identified BOM stripping in the historical03F decoder. Current main already fixed
it in 03G, preserving captured bytes and rejecting BOM outside the literal grammar. The existing
`bom404` custody/gateway regression is retained; no duplicate fix or historical rewrite was made.

## Validation and independent review

All response bodies are authored. Pinned Python uses the existing isolated environment, delegated
fixture transport and network-denying audit hook. Local TLS tests use loopback only. Development
specialists are read-only; the parent is the sole writer and integration owner.

| Check | Result |
| --- | --- |
| Original defect reproduction |8/8 new cases failed with unknown outcomes, as expected; retained in `/private/tmp/hq-ready-03f-reaudit-repro.log` |
| Final malformed-header cases |20/20 pass, no skips; `/private/tmp/hq-ready-03f-reaudit-targeted-final.log` |
| Final check/build/contracts |Passed;175/175 contracts, no skips |
| Focused gateway/bootstrap/recovery/history |207/207 pass, no skips, 129.162 seconds; `/private/tmp/hq-ready-03f-reaudit-focused-final.log` |
| Full serial regression |1751 total:1745 pass,0 fail/cancel,6 existing environment skips;726.681 seconds; `/private/tmp/hq-ready-03f-reaudit-full-final.log` |
| Historical preservation |17/17 original 03B/03D/03E file names/hashes match; all spent/noResume and capsules absent |
| Security/recovery review |Both clear exact implementation e0f0596 after shared-validator correction |
| Architecture review |Clears exact implementation e0f0596; shared parser resolves the reported gap |
| Acceptance review |Clears source/tests and targeted/focused/contracts evidence; independently verifies the completed full regression before integration |

The [source manifest](HQ-READY-03F-REVERIFICATION-source.sha256) and
[compiled manifest](HQ-READY-03F-REVERIFICATION-build.sha256) each freeze four changed files.
[PR71](https://github.com/eugenelin89/bot_messenger/pull/71) tracks this scoped correction and
its final reviewed-head integration. All source/build entries and17 historical receipt hashes
were rechecked after the passing full suite. No runtime/test drift from implementatione0f0596.

The six skips are four isolated team receiver scenarios, the standalone receiver requiring
`INV07_RECEIVER_ROOT`, and one Linux-only generic recipe resource-limit check. No Yahoo or
new regression case skipped. The run used Node24.10.0 and the existing pinned Python3.12.12/
yfinance1.7.0 environment. The initial20–40 minute audit estimate grew to include this
material correction, independent review and the12-minute full regression; no live scope expanded.
All19 relative documentation links and `git diff --check` pass.

Non-data test-log SHA256 digests:

```text
438044e39954c38f36ca6ec593fcae7edcef72a99384af5c77bbcd52830d2b06  hq-ready-03f-reaudit-targeted-final.log
bcc3b953ef17134022588492db30d68e429978b3b5994d94d8a90ed4024a765f  hq-ready-03f-reaudit-focused-final.log
c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652  hq-ready-03f-reaudit-check-final.log
b6b918dbf80741f74482deebee052d3091ede3adf68fadf0a9ebbc8a29f3014a  hq-ready-03f-reaudit-contracts-final.log
c6b2f11b29f5dc4143e5d827ce8ec67bd8ef167885d1718234dce6bd0b19d44c  hq-ready-03f-reaudit-full-final.log
```

The original SIGKILL compatibility fixture uses a stub adapter and an existing reader connection,
not an actual pinned-Python crash/reopen. Broader unchanged custody fixtures cover their separately
stated restart/watchdog/cleanup scenarios. No live provider, genuine employee, Linux production or
public receiver qualification is claimed from local fixtures.

## Current qualification proposal and stop

The exact [six-request03F proposal](../../operations/YAHOO_AAPL_QUALIFICATION_PROPOSAL.md) remains
preserved. Its envelope is one September2026 AAPL/XNAS/USD daily history operation, six fixed slots
(three bootstrap, one crumb, one metadata chart, one history chart), at least 5000 ms after completion,
262144 bytes per response / 1 MiB total,10/120/180-second wire/operation/process deadlines, zero retries,
strict cookie404 grammar and parent cookie/crumb continuity, reused one-shot custody and immediate
destruction. Missing cookie/crumb, unknown/barrier404,401/403/429, redirects and uncertainty stop.

Its current disposition is **withheld**, not ready for automatic execution: Decision 043 / 03G found
no independent evidence that actual bootstrap responses meet the tiny accepted grammar. The old
4585-byte 03E response cannot qualify and its destroyed payload is never reconstructed. Any later
bootstrap qualification needs new supporting technical evidence, separate exact-scope owner
approval, reviewed extension of existing custody under a distinct identity, current source/build/
host checks and independent acceptance. This task prepares or consumes none of those authorities.

Separately, [03H](HQ-READY-03H.md) already completed one direct-chart qualification, destroyed its
sample and permanently spent its authority. [04A](HQ-READY-04A.md) already implements source-only
private employee research; its operational trial is a separate unapproved gate. This task does
not execute either path or enable normal employees/collectors; later authority, manifests and
deployments remain unchanged. The corrected gateway/transport are shared infrastructure. Any new actual
sample still needs new bounded authority; historical research does not qualify paper-order execution
or public publication. 03B/03D/03E/03H stay spent and Decision 037 stays exhausted 4/4.

Stop after reviewed offline Git integration. No later probe follows automatically.
