# Investment process validation — October 17, 2026

Source packet: `codex/investment-mandate-research`, based on `17729d2`.
Sole writer: parent Codex. Independent advisory reviewers: control-plane architecture,
security, recovery and acceptance. No deployment, live source request, genuine worker
turn, paper trial or Asymmetri change was performed for this packet.

## Scope and evidence

The implementation uses the existing HQ setup/consent, finite journal, working group,
gateway, protected static reader and scheduler. New process scopes opt in; retained
scopes remain unchanged. [Decision057](../../decisions/decision_057_investment_objectives_research.md)
and the [owner guide](../../operations/INVESTMENT_OBJECTIVES_AND_RESEARCH.md) define the
capabilities, authority requirements and unsupported cases.

Tests use authored charts, primary-page responses, synthetic clocks and fake runtimes.
BUY/SELL fixtures deliberately cover those code branches; they are not proposed real
trades or acceptance instructions for a future genuine model. HOLD and research-blocked
outcomes are equally valid. No paid feed, broad web search or provider model was used.

## Validation receipts

Final source validation results are recorded below. Local validation used macOS, Node 24.10.0 and the existing pinned Python 3.12.12
environment; Ubuntu acceptance was not performed. Local full logs remain in
`/private/tmp/investment-*.log`; these are authored test logs, not production receipts.

- `npm run check`: passed. TypeScript build passes.
- `node scripts/investment-contracts/generate.mjs --check`: passed, contract 1.0
  generated types and eight file digests unchanged.
- First process/network run: **14 passed**, zero failed, 90.6 seconds.
- Expanded boundary run: seven new migration/recovery/numeric tests passed. The v2
  combined run was **21 passed, one failed**: a negative citation test selected a short
  primary page, whose first read correctly delivered the entire record. The corrected
  assertion selects history longer than 6,000 characters. No production guard was
  weakened. The retained broad-run receipt subsequently passed the cash dispatcher.
- Final HQ browser integration: **4 passed**, zero failed, 6.1 seconds, at 390/1440 widths with real
  disposable HTTP state and headless Chrome. Setup/consent/renewal remain inert;
  objective revision, no overflow/errors, financial record distinctions and publication
  hold are checked. Images were inspected locally under
  `/private/tmp/botsquad-inv-real-01-browser/`.
- Full repository run: **2,377 tests**, **2,344 passed**, **25 failed**, **8 skipped**,
  1,605.2 seconds. Every failure belongs to the corrected fixtures described below.
  Seven skips require explicitly pinned separate receiver checkouts; one is Linux-only.
- Final rebuilt affected-test rerun: **178 passed**, zero failed or skipped,
  160.9 seconds. This includes every failed file, all migration files, both new
  investment-process files and the public-reader boundary tests. Every earlier
  failure is resolved in this rerun. The whole long suite was not repeated after
  these targeted corrections.
- Existing HQ documentation checks: **2 passed**, zero failed.

Final affected-test command (after `npm run build`):

```sh
node --test --test-concurrency=1 dist/test/investment-process.test.js dist/test/investment-process-boundaries.test.js dist/test/research-network.test.js dist/test/finite-telemetry-recovery.test.js dist/test/ai-profile.test.js dist/test/ask-private-content.test.js dist/test/control.test.js dist/test/engineering.test.js dist/test/investment-recovery.test.js dist/test/*migration.test.js
```

Final logs: `/private/tmp/investment-final-tests.log` and
`/private/tmp/investment-final-browser.log`. The broader initial receipt is
`/private/tmp/investment-full-tests.log`.

The sandbox initially denied loopback listeners (`EPERM`); the authored browser and
repository suite were rerun with approved local-test execution. Initial focused tests
also exposed the simulator's old supported-schema ceiling and the absent local Python
venv link; both were corrected. Full regressions identified five stale schema-count/future-version
assertions and a pre-existing macOS `/var` versus `/private/var` fixture-path problem
in the telemetry-recovery tests. Fixtures now expect schema32 and canonicalize their
temporary custody root; trusted production path checks are unchanged. Failed logs are
retained rather than relabelled as passing runs.

## What the tests establish

| Scenario | Evidence |
| --- | --- |
| Justified all-cash HOLD | Four authored dispatcher sessions; independent review/submission; threshold at three; next authorized turn investigates and records a concrete step; remains HOLD. |
| Supported BUY, retaining HOLD, SELL | Three authored sessions, independent roles, actual simulator order/fill/accounting path and explicit cost assertions. |
| Research blocked / request budget | Missing primary evidence requests, duplicate request identity, exhausted request limit, blocked decisions excluded from cash streak. |
| Source unavailable / stale / unauthorized | Pre-DNS/wire/commit guards, expired permission, unapproved request hash and new tools under legacy authority denied; no network fallback. |
| Known versus unknown effects | HTTP/redirect/type/encoding/size refusals known; interrupted wire unknown; one consumed request, no replay. |
| Duplicate ticks / restart | Repeated scheduler kicks and duplicate submission remain one effect; complete-session restart preserves records. |
| Abrupt collection windows | Reserved, wired, evidence-written and independently-settled-before-local-receipt persisted states reopen without replay or admission of unfinished work. |
| Failed review recovery | Immutable attempt survives failed turn and database reopen; fresh known-settled attempt can satisfy the review; incomplete/unknown usage cannot. |
| Provenance | Whole relevant paged record required in the current execution; partial, other-execution and prior-session reads/citations rejected. |
| Historical preservation | Schema31→32 compares all pre-existing rows/rowids on repeated opens; all three new tables reject UPDATE and DELETE. |
| Honest evaluation | Authored varying values assert 5% portfolio versus 10% SPY on exact matched dates, unavailable benchmark mark, missing dates, 20% average sampled exposure and 50% sampled cash. Beyond-calendar period rejected. |
| Bounded worker context | 500 retained request obligations yield eight bounded summaries and an omitted count; owner originals remain available. |
| Private publication boundary | Actual producer projection and delivery-rights checks reject process-enabled books before emission; no public jobs created. |

Legacy runtime compatibility was checked against source `17729d2` using its transpiled
`paperTools` and `FiniteHQ.frozen` implementation on the same authored legacy fixture.
The entire 25-field frozen envelope matched. Legacy tool-schema hashes are pinned in
tests: observed `30d3f488cbecb468072667b7bf815f83ef8ad07e503a8f0a7aff6cee21eee286`,
non-observed `ca11e60dd76d61e7df8565fee61b7ac254b053a057e31fdf5878694f6cc40809`.

## Independent review disposition

All four specialists completed read-only source review and focused follow-up; no
material implementation finding remains. The parent fixed and tested:

- reviewer/strategy-review complete usage settlement;
- exact current-session review/submission, including HOLD;
- immutable review attempts recoverable after known failure;
- run-wide missing requests with attributable reviewed resolution links;
- known static-reader refusal classification;
- canonical decimal percentage targets;
- bounded accumulated worker context and explicit omitted counts;
- evaluation calendar-horizon rejection, equivalent UTC endpoint forms and exact numeric comparisons.

The final rebuilt regression receipt and refreshed browser assertions close the
reviewers' remaining source-validation condition. They did not modify files, approve
runtime authority, operate production or establish Level3 acceptance.

## Remaining operational limits

Source and browser evidence are not deployed behavior. The production host, current
account/reload attestations, source automation/retention/processing rights and actual
provider tool behavior were not verified here. A real future paper trial needs the
exact existing independent authority workflow, retained unresolved-attempt inspection,
finite approved model allowance and genuine source receipts. It must accept the actual
HOLD/BUY/SELL/blocked conclusion. The [bounded owner request](../../operations/INVESTMENT_OBJECTIVES_AND_RESEARCH.md#bounded-operational-request-still-needed)
is prepared; it is not an approval.

Only primary static text/HTML/XML/JSON pages and approved chart transport are supported.
PDF, authenticated/dynamic sites, broad search and generic Yahoo fundamentals endpoints
are unavailable. Insufficient history or evidence must be requested, never fabricated.
The current default calendar ends in 2026. SPY is the process comparator; existing
book risk/accounting/benchmark definitions remain immutable. New public derivatives
remain held pending the [Asymmetri handoff](../../operations/INVESTMENT_PROCESS_ASYMMETRI_HANDOFF.md).
Ask remains paused and unchanged.
