# Decision041 — Separate one-shot AAPL history qualification

**Date:** 2026-10-12 America/Vancouver  
**Status:** Owner-selected; source and live gates recorded separately in acceptance

The owner selects HQ-READY-03E: implement safeguards, offline acceptance and independent
security/recovery/architecture/acceptance review, integrate accepted source and rebuild clean
synchronized main, then perform one supervised private historical-data qualification. Yahoo
personal-use permission remains owner-reported verbal evidence; no written verification,
unrestricted automation, commercial use, redistribution or public archive right is inferred.

## Exact capability

Only one AAPL Apple common-stock/XNAS/USD daily OHLCV operation, September 1, 2026 inclusive
through October 1 exclusive. Pinned yfinance1.7.0/Python3.12.12 retains explicit
auto_adjust=false, back_adjust=false, repair=false, rounding=false, actions=true, keepna=true,
prepost=false, interval=1d. These settings do not prove as-traded split adjustment semantics.

The distinct03E adapter entrypoint pins both audited imported chart-base globals to query1
before creating Ticker. It never changes host after a response. The exact source-derived and
fixture-verified ordered sequence is:

1. GET `https://fc.yahoo.com/`, no parameters.
2. GET `https://fc.yahoo.com/`, no parameters.
3. GET `https://query1.finance.yahoo.com/v1/test/getcrumb`, no parameters.
4. GET `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`, `range=1d&interval=1d`.
5. GET `https://fc.yahoo.com/`, no parameters.
6. GET the same query1 chart path, `period1=1788235200&period2=1790827200&interval=1d&includePrePost=false&events=div,splits,capitalGains`.

Only chart requests carry the transient in-memory crumb. The bridge keeps cookies in the
trusted parent's memory and disables Python caches; the pinned library consequently requests
cookie bootstrap more than once. These calls follow successful responses and all count toward
six; no failed response is retried. The metadata chart is an internal timezone lookup within
the single logical operation, not a separate historical read. No query2, alternate endpoint,
consent/login request, repair, fallback or quote/fundamental/statement request is permitted.

Strict existing non-200 stop remains, including bootstrap404.03D's prior404 is evidence of a
possible obstacle, not grounds to waive it or a prediction that this run will succeed. Any
denial, malformed schema, barrier, timeout or unknown effect ends the one-use operation.

## Authority, bounds and custody

Separate fixed OS-account anchor `BotSquad-Yahoo-HQ-READY-03E`, immutable UUID, source/build
hash and exact manifest. Create-only preparation has a ten-minute admission lifetime; consumption
requires at least three minutes remaining and irreversibly fsyncs spent before data or DNS.
This lifetime is not an extra operation allowance. No reset/reissue/resume path exists.

Six underlying HTTPS requests maximum, one at a time, at least five seconds after a response
completes before the next wire;262144 application body bytes/request and1MiB across bootstrap
and charts. Reserve full per-response capacity before admitting each next request. Ten seconds
per wire (including its admission/spacing overhead),120 seconds from the supervisor's consume
permission through data operation,180 seconds for the whole supervised process including
cleanup. Zero provider retries. Independent parent timers precede consume/DNS permissions;
post-filesystem monotonic checks prevent event-loop stalls from admitting late network I/O.
Normal TLS, validated public DNS, one pinned IP/family, disabled auto-family selection,
no redirects and safe stage diagnostics are retained.

Separate opaque03E issuance extends only the existing trusted storage/transport union.03B and
03D issuers, anchors and historical receipts are unchanged and remain spent; Decision037 is
exhausted4/4. Existing FinancialDataGateway, memory FinancialStore and normalization are reused.
FinancialAdmission remains synthetic-only: no observed employee delivery or simulator fill.

The only data capsule is `/private/tmp/botsquad-yahoo-HQ-READY-03E`, outside Git, production,
sync and backups. Anchor and capsule are explicitly Time Machine-excluded and verified.
FileVault/encrypted swap and disabled core dumps are admission requirements. Directories0700,
files0600; memory SQLite; AES-256-GCM originals/report with a memory-only key; no persistent
Python caches or data writes. No response, price, credential or provider exception text appears
in logs/terminal. Owner inspection produces only a fixed non-data quality summary. Data and key
are destroyed immediately; this is tighter than seven days. Ciphertext after a crash cannot
resume and is removed by recovery once the original data process group is gone. Cleanup never
removes spent authority. Failed/uncertain cleanup must be reported, never called successful.

The independent supervisor controls a dedicated Node/Python process group; normal exit also
checks for descendants, and unexpected supervisor disconnect terminates the child group.
A separate native Python watchdog acknowledges data/wire deadlines before permissions, survives
supervisor loss and kills a blocked Node/Python group before bounded recovery. Capsule deletion
requires the durable approval/path/device/inode receipt. A crash between directory creation and
that receipt can leave an empty orphan; recovery refuses unproven deletion. This precedes data
or network access, preserves spent authority and must not be reported as complete cleanup.
Trusted OS owner, responsive kernel and working host encryption/backup controls remain the
local boundary; whole-host malicious rollback, unobservable external snapshots and forensic
RAM erasure are not claimed. A catastrophic machine shutdown cannot promise immediate physical
deletion; retained ciphertext has no application-persisted key and recovery cannot rearm.

## Qualification limits

Preserve originals, raw versus processed meanings, action events, missing fields, exact session
coverage, exchange timezone and provider event versus first local retrieval. Provider availability
and release/payment timestamps remain unknown when absent. A current retrieval is never earlier
decision evidence. Quality is per field/sample; no general source SLA or complete investment run
is established. Adjusted history is not qualified execution evidence. Public Asymmetri display,
observed fills, employee inference/credits, recurring collection, trading, HQ-READY-04, production
deployment and paid providers remain outside this task. Decision029's budget is US$0.

See [acceptance](../validation/investment/HQ-READY-03E.md) and
[execution plan](../exec-plans/investment-hq-ready-03e.md). Stop permanently after this attempt and cleanup.
