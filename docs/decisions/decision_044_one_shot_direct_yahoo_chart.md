# Decision044 — One-shot direct Yahoo chart qualification

**Date:** 2026-10-12 America/Vancouver
**Status:** Accepted and completed; single direct qualification succeeded, authority spent

The owner explicitly selects HQ-READY-03H and authorizes the exact direct chart request
and temporary private processing on the basis of reported verbal Yahoo permission for
personal, noncommercial use. That report remains owner-reported; no independent writing,
unrestricted automation, commercial rights or public redistribution is inferred.

## Exact new authority

One GET to `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`, with only
`period1=1788235200`, `period2=1790827200`, `interval=1d`, `includePrePost=false`,
`events=div,splits,capitalGains`. No bootstrap, metadata lookup, cookie, crumb,
credentials, redirects, fallback or retry. One resolver invocation, one validated
public address/family, one TCP/TLS connection and one response. Normal certificate
and hostname verification,16KiB parsed headers,262144 application response bytes,
10-second request,120-second operation and180-second whole-process ceilings remain.
Informational/upgrade and every other non200 response stop at headers with actual
status, zero consumed body bytes and incomplete-body accounting.200 redirect/auth
headers or non-JSON content type stop before body consumption. The parent HTTP transport
creates no cookie jar.

A distinct create-only OS-account anchor `BotSquad-Yahoo-HQ-READY-03H` and capsule
`/private/tmp/botsquad-yahoo-HQ-READY-03H` reuse reviewed history custody, encrypted
AES-256-GCM evidence, memory-only key/SQLite, source/host identity, backup exclusion,
exclusive fsynced spending, process groups and independent supervision. The new
manifest is immutable. Spending precedes all network effects. Scope, custody,
transport, supervisor and native watchdog independently constrain one request.
Cancellation during watchdog startup closes admission before spawning a data child.
Preparation or failure never authorizes reissue, reset or replay.

## Offline parsing feasibility and original evidence

Pinned Python3.12.12/yfinance1.7.0 `PriceHistory` accepts a captured-response data
source. The adapter sends one exact request through the existing gateway bridge,
validates the captured chart identity/timezone/schema, and gives that same response
once to the unmodified pinned parser. It never constructs `Ticker` or `YfData`,
manufactures bootstrap success or causes an exception to enter a fallback branch.
Any further parser access terminates. The existing socket/write guards remain.

Direct validation rejects malformed JSON, nonfinite literals, duplicate keys,
multiple results, missing/wrong critical identity metadata and duplicate timestamps/
session dates. Original numeric types, integral safe volume, and action operands/times are
validated before library coercion; unsupported nonempty capital gains fail closed. Existing null restoration, original provider event times, adjusted
close separation, gateway normalization, quality and no-lookahead controls remain.
Authored fixtures prove code behavior only, not provider access or observed coverage.

## Retention, recovery and unchanged boundaries

Only the encrypted temporary capsule and original data process hold financial data.
Immediate destruction removes the key and capsule after inspection or failure;
recovery requires original process-group termination and recorded capsule ownership.
An inherited crash between empty-directory creation and its ownership receipt can
leave an empty orphan; deletion is refused without proof, spent remains and cleanup
must be reported incomplete. No data or DNS exists in that window. Trusted host
owner/encryption/backup controls remain assumptions; no forensic RAM erasure or
malicious whole-host rollback immunity is claimed.

Retained receipts contain authorization, accounting, transport stages, aggregate
quality and cleanup only. No financial values, rows, raw headers, IPs, cookies or
payloads enter Git or public outputs.21 scheduled September sessions are a reference
expectation. Provider availability and as-traded adjustment basis remain unknown;
current retrieval cannot be backdated or authorize paper fills. Missing information
is blocked/incomplete, never fabricated.

All17 old receipts remain byte-identical.03B/03D/03E remain spent,03G unprepared,
Decision037 exhausted4/4 and Decision029 US$0. No employee inference, credits,
trading, collector, production deployment, Asymmetri, public publication or
HQ-READY-04 activation follows. Reviewed merge and matching clean-main rebuild
precede any new owner preparation/consumption. Stop after the single outcome.

See [acceptance](../validation/investment/HQ-READY-03H.md) and
[execution plan](../exec-plans/investment-hq-ready-03h.md).


## Outcome

The accepted PR68 source executed once from rebuilt clean synchronized main. HTTP200 returned
21/21 complete scheduled September sessions. Private inspection retained unknown historical
availability and unqualified adjustment semantics; no fill/employee/public authority followed.
The key/capsule were immediately destroyed and process termination verified.03H is permanently
spent and cannot be replayed. Acceptance records only non-data quality and receipt evidence.
