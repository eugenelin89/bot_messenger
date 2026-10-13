# Direct Yahoo chart assessment after HQ-READY-03G

**Original status:** Proposal only after03G.
**Current selection:** Owner selected HQ-READY-03H on2026-10-12; [Decision044](../decisions/decision_044_one_shot_direct_yahoo_chart.md) and [03H acceptance](../validation/investment/HQ-READY-03H.md) supersede the approval/implementation status below. The original assessment remains provenance and grants no additional requests.
**Date:** 2026-10-12 America/Vancouver

## Evidence and conclusion

Do not recommend an unchanged bootstrap repeat. The current evidence cannot support
expecting the exact Decision042 grammar:9–15 accepted bytes versus the previous4,585-byte
complete response, whose body/cookies were destroyed.03G therefore made zero Yahoo requests.
This does not retrospectively classify that response as benign, a barrier or an access ban.

Pinned [yfinance1.7.0 data.py](https://github.com/ranaroussi/yfinance/blob/1.7.0/yfinance/data.py#L440-L465)
can construct a target request without a crumb after certain crumb/bootstrap exceptions.
Its source comments specifically identify the chart API as potentially not requiring one.
Existing upstream-only authored tests demonstrate that branch. The normal history entrypoint
still attempts bootstrap/crumb acquisition first, and may switch cookie strategies/retry
after a target error despite retries0. Thus it provides **technical plausibility**, not a
supported public “skip bootstrap” interface or proof of current anonymous chart availability.
The installed source SHA256 remains
`5f41a4cec99d50be3a13c8ae5f2674e1b5e1582be1a861fcdbb57bba783629da`.
The tag source and [maintainer documentation](https://ranaroussi.github.io/yfinance/) were
reviewed again without querying Yahoo endpoints. The library is not provider permission.

**Permissibility is not established by that code.** The owner reports verbal personal-use
permission and authorized the specific six-slot03G test, including temporary private
processing. Neither claim becomes independently verified endpoint permission or approval
for an alternate direct request. No written agreement is imposed as the only possible
evidence. A later explicit owner approval must address this changed initial request and
record the available permission evidence accurately; any actual denial/barrier remains
terminal. No automatic alternate request follows a failed bootstrap or access denial.

## Smallest concrete proposed envelope

One initial HTTPS GET, parameter order irrelevant:

```text
https://query1.finance.yahoo.com/v8/finance/chart/AAPL
period1=1788235200
period2=1790827200
interval=1d
includePrePost=false
events=div,splits,capitalGains
```

No bootstrap, metadata lookup, cookie, crumb, authorization header, alternate host, retry,
redirect, proxy/identity rotation, login/consent flow or second request. The query uses the
same AAPL/XNAS/USD September1 inclusive–October1 exclusive history range; the returned
chart must itself provide sufficient identity/timezone metadata. Missing metadata stops
qualification instead of triggering another endpoint.

Retain normal TLS, public DNS validation and a single pinned IP/family, existing fixed
headers/identity encoding,16KiB parsed-header cap,262144 application bytes total and a
10-second per-request deadline. Proposed operation/lifetime ceilings stay120/180 seconds
with independent supervision. Single-request spacing is vacuous; no second request is
available. Stop on any non200, challenge/redirect/barrier, invalid UTF-8/JSON/schema,
oversize, timeout, cancellation, uncertain effect or accounting failure. No fallback.

Reuse the FinancialDataGateway, exact one-shot custody, immutable originals, normalization
and encrypted immediate-deletion capsule. Before proposing execution, prove offline that
the pinned library's existing chart parsing can consume this single captured response
without additional I/O or fabricated bootstrap success. Do not manufacture a timeout/429,
pretend a cookie exists, invoke the forbidden fallback path, or create another financial
data engine. If that integration cannot be proved cleanly, retain the technical block.

A later accepted implementation needs its own distinct immutable manifest/owner anchor,
spend-before-DNS, fault/concurrency/no-replay tests, independent reviews, reviewed merge,
clean-main rebuild and host custody checks. This document creates none of them.03G
authority remains unprepared/unconsumed, and03B/03D/03E remain permanently spent.

## What a successful sample could establish

Only private descriptive historical research: actual symbol/currency/exchange/timezone,
session coverage, OHLCV nulls, raw versus adjusted fields, returned action events, and
provider event times versus first local retrieval.21 sessions are scheduled from the
[Nasdaq calendar](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule),
including the September7 holiday closure; this does not prove actual openings or absence
of halts. [Apple's FAQ](https://investor.apple.com/faq/default.aspx) confirms AAPL/Nasdaq.
Current retrieval cannot establish past availability, as-traded adjustment meaning,
corporate-action completeness, observed-price paper fills or public rights. US$0,
Decision0374/4 and all employee/public/production/later-milestone gates remain.
