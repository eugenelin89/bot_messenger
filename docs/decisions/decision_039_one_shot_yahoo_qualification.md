# Decision039 — One-shot private Yahoo qualification

**Date:** 2026-10-11 America/Vancouver
**Status:** Owner-selected bounded implementation and qualification; source acceptance recorded separately

The owner explicitly selected HQ-READY-03B and the existing Yahoo runbook proposal: implement
trusted admission and private custody, validate with independent reviews and fixtures, integrate
accepted source, rebuild synchronized main, then perform one supervised non-model probe. The
reported Yahoo personal-use permission remains owner-reported verbal evidence. No independent
writing, broader automation, indefinite storage, commercial use or public rights are inferred.

The exact AAPL/XNAS/USD envelope remains nine logical reads, daily history2026-09-01 inclusive
through2026-10-01 exclusive, at most50 underlying attempts, at least five seconds between actual
requests, at most two transient retries per logical read,262144 body bytes per response,8MiB total,
120 seconds per logical read,10 seconds per transport and ten minutes overall. Only previously
reviewed endpoint families and their stricter frozen parameter intersection are admitted. A valid
empty actions result over complete validated daily coverage may continue; all other missing-status/error,
denial, consent, login, redirect, rate refusal, permission conflict or uncertain outcomes stop.
Nonempty partial observations may continue with explicit missingness and quality limitations.

## Trusted admission and custody

- A dedicated owner CLI is separate from app startup, employees, APIs, scheduler and simulator.
  Source must be clean synchronized main with source/build identity, core dumps disabled,
  FileVault/encrypted swap and verified Time Machine exclusion. No environment enable flag.
- `prepare` creates one exact immutable manifest under the operating-system account's fixed
  private Application Support path. `run` requires that existing approval; it never creates or
  repairs missing authority. An exclusive spent marker and containing directory are fsynced before
  DNS. Concurrent or repeated consumption loses; no resume/rearm/reset is exposed.
- The resulting capability exists only in its original process, bound to the exact memory-only
  store, transport, policy/instrument/calendar, versions, ordered requests and absolute expiry.
  Independent process counters and durable non-data accounting prevent capsule/database copies,
  deletion or restoration from refilling limits. Same-owner malicious whole-host/anchor rollback
  is outside this local trusted-owner boundary; no claim of rollback-proof hardware exists.
- Original responses, safe original provider headers, processed adapter output and private report
  are encrypted in an isolated capsule using AES-256-GCM and an exclusively memory-held key.
  SQLite stays in memory. The parent and child disable core dumps; Python has no persistent cache
  and denies filesystem writes during data processing. Credentials/bootstrap bodies never persist.
- Retention is tightened from the allowed seven days to immediate key destruction and whole
  capsule deletion at completion; a ten-minute process timer also closes custody. Crash remnants
  are ciphertext without an application-persisted key. Recovery cleanup removes ciphertext only,
  fsyncs deletion and records a non-data receipt; it never removes spent authority. RAM forensic
  erasure, malicious host administration and storage snapshots outside the declared host controls
  are not claimed.

Durable reservations precede DNS and HTTP. Actual next request waits five seconds after previous
response/receipt completion, covering variable DNS/TLS/write latency. Receipts distinguish reserved
attempts, socket-start intents, known HTTP status and consumed application body bytes. Discarded
unread buffers and HTTP/TCP/TLS overhead are not counted as retained response-body data; uncertain
outcomes never become exact successful-request claims or refundable allowance.

## Evidence and publication boundary

The owner expressly requests a private final report of actual attempts/status/bytes/timing and
aggregate coverage, missingness, currency, adjustment and timestamp quality. That report may
contain these quality findings, never raw prices, metrics, financial records, cookies or payloads.
Only a non-data outcome/request-count summary and source/test/review evidence may enter Git.
Original financial payloads and the full private report are destroyed with the capsule.

The probe grants owner inspection only. `FinancialAdmission` continues denying observed employee
delivery; market/simulator/public admission is unchanged. Historical availability remains unknown,
adjustment/as-traded execution semantics remain unqualified, and a prospective observed-price
method requires a separate decision. Decision029 US$0, Decision037 exhausted4/4, HQ-READY-02
synthetic-only operation and all production/public/trading/credit/recurring-operation gates remain.

See [runbook](../operations/YAHOO_FINANCIAL_GATEWAY.md), [execution plan](../exec-plans/investment-hq-ready-03b.md)
and [acceptance](../validation/investment/HQ-READY-03B.md). Stop after this single qualification.
