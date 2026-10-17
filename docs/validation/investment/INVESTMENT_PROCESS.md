# Investment process validation — October 17, 2026

Current status: private HQ installation and unsubmitted owner-form inspection passed.
The [deployment follow-up](#october-17-deployment-follow-up) records fresh Ubuntu and
production evidence. The retained book still needs a separate process upgrade;
genuine process acceptance remains outstanding. Earlier source receipts below are
preserved as historical evidence.

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
in the telemetry-recovery tests. Fixtures now expect schema 32 and canonicalize their
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
| Historical preservation | Schema 31→32 compares all pre-existing rows/rowids on repeated opens; all three new tables reject UPDATE and DELETE. |
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
HOLD/BUY/SELL/blocked conclusion. The [bounded owner request](../../operations/INVESTMENT_OBJECTIVES_AND_RESEARCH.md#bounded-next-request-and-unactivated-trial-proposal)
is prepared; it is not an approval.

Only primary static text/HTML/XML/JSON pages and approved chart transport are supported.
PDF, authenticated/dynamic sites, broad search and generic Yahoo fundamentals endpoints
are unavailable. Insufficient history or evidence must be requested, never fabricated.
The current default calendar ends in 2026. SPY is the process comparator; existing
book risk/accounting/benchmark definitions remain immutable. New public derivatives
remain held pending the [Asymmetri handoff](../../operations/INVESTMENT_PROCESS_ASYMMETRI_HANDOFF.md).
Ask remains paused and unchanged.

## October 17 deployment follow-up

This addendum preserves the earlier source report and failed-test evidence above.
The private installation and the separate legacy recovery are coordinated with
“Review this morning’s run”; that chat is the sole production writer. This writer
owns independent read-only verification. The INV-113 authorization does not grant
genuine process execution, new source permissions or new public derivatives.

PR113 merged normally as `03acc675b8c9bb0e189d0868371e3e2ed373c4ad` from reviewed
head `2fed952470a5c6766f2c049e5a98d3d937941ba6`. The combined PR114 candidate is
`c862c38768e04fc8dc64bb9c60c622a21ab3634c`. Its new Linux observer diagnostics and
owner guide do not change application, public, adapter, contract or dependency bytes
from the independently reviewed integration. PR114 merged normally as
`addbb83ee7e8a3d15490903f4b0caf2b39febad4`, with the same tree as that candidate.
Both merge identities were independently confirmed through GitHub.

Fresh acceptance includes:

| Check | Actual result |
| --- | --- |
| Save with a running dispatcher and restart, without independent approval | Passed; no model, source, publication, independent-custody or execution effect. |
| Old publication restart target against changed deployment SHA | Passed; helper rejects before custody, permit claim or transport. This is not a claim that all startup code is inert. |
| Added two tests together | 2 passed, no skips. |
| Disposable desktop/mobile HQ and guide checks | 4 browser and 2 documentation checks passed, no skips. |
| Retained-book ordinary approval after acknowledged gaps and successor expiry | Negative probe passed: approval denied and original journal retained. This demonstrates a limitation, not an upgrade. |
| Unchanged cash process case on macOS | 1 passed in 38.44 seconds, original 60-second stage observer. |
| Initial combined Ubuntu selection | 82 passed, 2 failed, 10 cancelled, 4 skipped in 845.3 seconds. Explicitly interrupted before its watchdog; not a full-suite pass. |
| Final Ubuntu regression selection | 78 passed, 0 failed/cancelled, 1 external-receiver skip in 103.24 seconds. |
| Final Ubuntu process cash/trade reruns | 2 passed, 0 failed/cancelled/skipped in 438.80 seconds. Cash 245.85 seconds; trade 191.98 seconds. |
| Final Ubuntu observed workflow cases | 5 passed, no failures/cancellations/skips, in 1348.27 seconds. Integrated successor 355.93 seconds; full-universe plain workflow 962.97 seconds. |
| Separate actual receiver fixtures on macOS | All 5 previously skipped cases passed, no skips, in 4.94 seconds. Receiver source `040835c2b3c5f4185c8c6a539a1f34d0722f1a16`; isolated build and nine-file contract check passed. Temporary keys/storage and loopback only; counterpart checkout unchanged. |

The two original Ubuntu failures were exactly the fixture stage observer's timeout,
with no domain assertion error. The blocked scenario passed in 176.96 seconds. The
reviewed correction changes only the Linux test observer to 180 seconds and adds
per-stage timing/failure diagnostics. Both reruns passed, with final research stages
taking 73.05 seconds (cash) and 67.21 seconds (trade). Production deadlines, synthetic timestamps, finite budgets,
retry rules and outcome assertions are unchanged. No 60-second Linux performance
acceptance is claimed. Original failure and cancellation logs remain retained.

The independent recovery reviewer required strict stopped backups, exact historical
rows, exact finite recovery holds/checkpoint, unchanged publication custody during the
fenced boot, no queued work and no source-only downgrade after schema 32. The deployment
writer incorporated these checks. Installing a new binary does not convert old scopes.

The retained production book has three historically incomplete usage receipts that
were acknowledged by special legacy recovery. Ordinary setup Save and ordinary
independent approval still reject those gaps; the legacy successor pins its old tools
and cannot enable the new process. Expiry does not resolve this. The guide now contains
the exact bounded request for an independently reviewed, append-only process upgrade
and a separate unactivated October 22 planning proposal. It selects no model ceiling,
primary-source permission or performance target, and authorizes zero process turns.

### Independent installed-state verification

The guarded private installation passed independent read-only verification at
2026-10-17T16:53:36Z, before any separate owner recovery mutation:

- Source and backend both `addbb83ee7e8a3d15490903f4b0caf2b39febad4`, clean source
  checkout; 768 built files and 25 public files exactly match the final stage manifest.
  Manifest SHA256: `5a4f3772e1c0eb4525c0cbf8b2a7566e06f37f917d476661a01d2cc6c96ed064`.
- Service `botsquad.service`, user `botsquad`, PID 925370, started at 16:53:02 UTC;
  alive/database/dispatcher true, runtime ready.
- Schema 31→32; current and stopped Company/finite databases pass integrity and
  foreign-key checks. Every original application rowid and field is preserved except
  ordinary worker `updated_at`; exactly one schema 32 migration row was appended.
- All 253 earlier finite events and the backup checkpoint are unchanged; exactly one
  expected recovery hold is appended at 254. Old publication custody and restart
  selector remain unchanged. No model, market-data or publication attempt was made
  by installation. All three new process tables remain empty and no existing scope
  gained a process policy. Ask configuration remains disabled.
- Protected stopped backup:
  `/var/backups/botsquad/close-recovery-20261017T165300Z`. Independent private receipt:
  `outputs/inv113-deployment-private/fenced-independent.json`. These paths contain
  operational evidence, not repository artifacts or public exports.

The actual deployed UI was inspected through the private tunnel. Existing USD 100,000
cash/no holdings, original decisions, independent reviews and valuation history remain
visible. The retained scope is explicitly legacy. Opening its revision form populated
the same book, risk, universe and employees; objective/evaluation/source controls,
SPY/cash explanation, proposed 120-day lookback and threshold 3 were present. The source
permission checkbox was unchecked. No owner target, dates, permissions or model budget
were selected; no production Preview/Save POST was submitted. The unsubmitted inspection
draft was cleared by reload. Actual Preview/Save acceptance remains disposable-fixture
evidence, not a claim of successful retained-book setup.

### Final coordinated recovery readback

A second independent read-only proof passed at 2026-10-17T16:59:24Z, after the other
chat's separately authorized recovery and clean restart. Source/backend remain
`addbb83`, all 793 build/public files still match, and schema/integrity checks pass.
Final service PID 926485 started at 16:56:39 UTC. Original rows, financial records, source
results, execution/usage receipts and the 253-event finite prefix remain unchanged, with
only the reviewed lifecycle, portfolio-head and publication fields updated. The
finite head is 261; its exact added kinds are hold, stop×3, approve_renewal, attest,
hold and resume. No new model/source reservation or wire event exists. Lifetime
model reservations remain 18 and source wires 45. The three old incomplete usage
receipts remain present. New process tables and process policies remain empty.
Private receipt: `outputs/inv113-deployment-private/recovered-independent.json`.

Read-only scope inspection confirms a legacy scope
`9d43aa35-4e9b-421d-a528-267ea2d159ee` for October 19–21, with active loop
`39a12ca9-9d70-4a94-ba02-48c82ad17733` and independent authority
`observed_successor_dbef024b-4fc6-4722-9024-e256f7d2b3a4`.
It permits eight turns per session/day/rolling 24 hours, 24 total, one concurrent turn,
five-minute turn deadlines and zero uncertainty retries; expiry October 21 23:40 UTC.
These are separately authorized, unconsumed **legacy** allowances, not new process
turns. The process upgrade remains unsupported and no genuine process trial ran.

The final deployed UI independently shows USD 100,000 cash/equity, no holdings or
paper orders, and zero commission/slippage. Existing October 14 valuations remain;
recovery appends October 15 with SPY benchmark 100275.442078 and complete quality,
and October 16 with benchmark **Unknown** and partial quality. Recovery recorded
these later; it did not rewrite original valuation timestamps or fabricate SPY.

The separate legacy publication repair renewed its grant through October 22 00:40 UTC,
rotated the key and reconciled generation 2. Its newly selected private restart custody
completed while the original custody checkpoint remained unchanged. All 297 publication
jobs are delivered. Consequently, do not describe the combined work as leaving all
publication credentials/expiry unchanged: that separate renewal occurred. New
research-derived publication rights were not granted, canonical contract bytes and
the process producer hold remain unchanged, and Ask remains disabled.

Two planned HQ restarts occurred with no active investment/model/source work to
interrupt; no scheduled session was replayed. The model/data budget gained no authority
from deployment, no new model/market-data request was made during recovery, and the
US$0 incremental market-data constraint remains. Genuine future worker decisions,
research and new process acceptance remain unverified until separately authorized
session receipts exist. See the [recovery execution record](../../exec-plans/20261017-investment-close-recovery.md).
