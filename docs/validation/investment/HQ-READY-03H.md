# HQ-READY-03H — direct chart qualification

**Date:** 2026-10-12 America/Vancouver
**Base:** `3141b390f5b4fa7ecd8a79ca8d809449ef307aa7`, freshly fetched clean synchronized main
**Branch/worktree:** `codex/hq-ready-03h` / `../bot_messenger-hq-ready-03h`
**Status:** Offline validation accepted; reviewed integration and clean-main rebuild precede live preparation

## Authority and gate order

The owner explicitly selected the [direct-chart proposal](../../operations/YAHOO_DIRECT_CHART_PROPOSAL.md)
and authorized exactly one chart request/temporary private processing, conditional on offline
feasibility, independent review, complete regression, accepted PR merge and clean-main rebuild.
[Decision044](../../decisions/decision_044_one_shot_direct_yahoo_chart.md) records the durable
boundary. Reported verbal personal-use permission remains owner-reported, not independently
verified writing or unrestricted automation/public rights.

The new request is `GET https://query1.finance.yahoo.com/v8/finance/chart/AAPL`, with only
`period1=1788235200`, `period2=1790827200`, `interval=1d`, `includePrePost=false`, and
`events=div,splits,capitalGains`. One DNS lookup, one validated public IP/family, one TCP/TLS
connection and one response; normal TLS verification,16KiB parsed headers,262144 application
bytes,10/120/180-second request/operation/whole-process limits and zero retries.

37/37 actual pinned-parser/gateway offline checks passed before adding live authority.
There is no `Ticker`/`YfData`, cookie, crumb, fake authentication or provider success in the
direct parser. One captured original response is consumed once by pinned `PriceHistory`;
a second/alternate data-source call raises a stop that bypasses yfinance ordinary `Exception` fallbacks. The existing gateway,
normalization, null restoration, provenance, encrypted custody and watchdogs are reused.
The direct transport constructs no cookie jar and stops at the first non200, informational,
upgrade or barrier response; denials retain actual status with zero consumed body bytes.
Strict original metadata/JSON/numeric/action checks precede library coercion.

## Offline evidence and findings

| Check | Result |
| --- | --- |
| Initial feasibility |37/37 passed,0 skipped,18.819s; `/private/tmp/hq-ready-03h-feasibility-final.log` |
| Final direct parser/custody/transport |89/89 passed,0 skipped,48.327s; `/private/tmp/hq-ready-03h-direct-final.log` |
| Shared focused checkpoint |428 tests,426 passed,2 local TLS setup failures (`listen EPERM` under sandbox); no test skipped |
| Local TLS rerun |4/4 passed,0 skipped,0.842s; `/private/tmp/hq-ready-03h-local-tls.log`; authored loopback only |
| Full serial regression |1,703 tests:1,697 passed,0 failed/cancelled,6 existing skips,850.400s; `/private/tmp/hq-ready-03h-full-resumed.log` |
| Typecheck/build/contracts |`npm run check` and build passed; contracts generated check/build and175/175 tests passed |
| Historical preservation |Independent acceptance review matched all17 names/hashes;03B/D/E spent/noResume and capsules absent;03G/H anchors/capsules absent before integration |

All financial test values are authored. Actual pinned Python3.12.12/yfinance1.7.0 parses
those fixtures, including21 scheduled September dates, missing/null fields and actions.
Fake DNS/HTTPS prove enforcement but establish no provider access or observed coverage.
Shared real local TLS/process tests establish platform mechanics only, not provider rights,
Linux/production readiness or observed data. No dependency was installed or upgraded.

Tests exercise exact query and raw crumb rejection, second invocation/ordinal denial before
DNS, status201/3xx/401/403/404/429/5xx,100/102/103/101 termination, HTML/empty-barrier headers,
byte caps,10-second timeout, cancellation/late response, encrypted evidence, race consumption,
reservation/settlement fsync failure, SIGKILL recovery and identity-safe cleanup. Invalid JSON,
nonfinite literals/duplicate keys, duplicate timestamps/session dates, multiple results,
missing/wrong metadata and malformed numeric/action types cannot become qualified records.
No-lookahead, current-retrieval knowledge, unknown provider availability and unqualified
adjustment semantics remain; observed employee delivery is denied.

Independent architecture review found upstream coercion of boolean/string/fractional volume
and boolean split operands. Direct-only original JSON validation and13 regressions fix that
before `PriceHistory` runs. Recovery review found cancellation during watchdog startup could
later admit work; a stopping latch at startup and awaited permission boundaries fixes it,
with a regression proving no data spawn. Security requested transport-level invalid-first
invocation and empty-header checks; these now pass with zero further DNS/request effects.

An inherited crash between empty capsule-directory creation and its ownership receipt leaves
an empty orphan. The explicit crash test proves spent/noResume, absent accounting/data and
refused replay/deletion without ownership proof. This is cleanup incomplete, not successful
destruction; no network or financial data exists at that point. Host trust, FileVault/encrypted
swap and backup exclusion remain required live checks, not properties proved by authored data.

## Independent reviews and frozen artifacts

Architecture, security, recovery and acceptance reviewers are independent read-only development
subagents, not BotSquad employees. All four found no remaining implementation blocker after
repairs. Recovery/security verified89/89 direct tests; acceptance independently checked all17
historical receipts and stressed the authored/observed distinction. Final regression,
documentation, merge and clean-main identity remain required before owner preparation.

The [source manifest](HQ-READY-03H-source.sha256) freezes43 files and the
[build manifest](HQ-READY-03H-build.sha256) freezes28 compiled outputs. Source/build digests,
full-suite outcome and final review evidence must be recorded before integration. Source manifest
digest is `0c541ec6ff1bc3abfa7396f51550a79daff5453f8e6daf5c9e94974eb37010c4`;
build manifest digest is `54f46751a0272c3084cad0b4cd14554341da1024854e83ca3eba8f0a0be9651f`.
Independent acceptance verified every entry, relative documentation link and whitespace check. Installed
pinned upstream `data.py` SHA256 is
`5f41a4cec99d50be3a13c8ae5f2674e1b5e1582be1a861fcdbb57bba783629da`;
`scrapers/history.py` is
`063a569905cddc7b7dd93420d05163d1afdae5936bef4beb468bee365c1f9d3a`.

## Live outcome

Not executed at this source checkpoint. No03H owner anchor/capsule has been prepared or
consumed. No Yahoo DNS/request, HTTP status, timing or financial coverage is claimed.
After all gates, this section will record the single actual result and verified cleanup.
All17 historical receipts and03G nonpreparation must be rechecked afterward. Decision037
remains exhausted4/4; Decision029 budget remains US$0. No employees/credits, paper or real
trading, recurring collector, production, Asymmetri, public publication or HQ-READY-04 follows.


## Final pre-integration validation

The full resumed serial suite completed successfully on the frozen source. Its six existing
skips are four isolated receiver scenarios, the standalone receiver requiring
`INV07_RECEIVER_ROOT`, and one Linux-only generic resource test. No Yahoo, actual pinned
Python, custody, transport, normalization or recovery check was skipped. The earlier run
was intentionally interrupted for owner shutdown and is not counted as acceptance.

All43 source/28 build entries and all17 historical receipts match after full regression.
Historical decisions and03–03G acceptance remain unchanged;03G/H owner anchors/capsules are
absent. The existing host preflight independently confirmed the OS account, FileVault,
encrypted swap and core-dump restrictions; preparation/consumption recheck them. Parent
reviewed the complete scoped diff; relative document links and `git diff --check` pass.

Only non-data log digests are retained here. Complete authored-test logs remain locally.

| Log | SHA256 |
| --- | --- |
| `hq-ready-03h-feasibility-final.log` | `bf20054d7a1652ff12ed1cb7e96bf17dbfa653b076977f1cd258823b1479102a` |
| `hq-ready-03h-direct-final.log` | `21faeffb043af8e320c6234771602e7b3cbf6617a83c8431a77dca458753dc70` |
| `hq-ready-03h-focused.log` | `80dba9dfe00bb7137aabba62e28de2e61e4636e434c7a4a9f2709590b777490d` |
| `hq-ready-03h-local-tls.log` | `21086d581cc687c54b8b0fc806305807d8cafb7b6a21a7ddf8cacae90617298f` |
| `hq-ready-03h-check-final.log` | `c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652` |
| `hq-ready-03h-contracts-final.log` | `a9d88236cd255f2a17b3d7d48f9e79b677caea11f0d6e38bb60e192523048693` |
| `hq-ready-03h-full-resumed.log` | `77399ce8cf8ed56d633d2ea29be7c2afd2bf35079ed6a4d429f1ece0875c21c2` |
