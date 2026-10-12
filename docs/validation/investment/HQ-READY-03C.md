# HQ-READY-03C — first Yahoo failure diagnosis and source repair

**Date:** 2026-10-11 America/Vancouver
**Base:** `bd7a0b62300323503e522d9f283b28894a17f517`, clean local/remote main verified
**Branch/worktree:** `codex/hq-ready-03c-transport-diagnostics` / `../bot_messenger-hq-ready-03c`
**Status:** Source/offline acceptance complete; accepted for reviewed Git integration
**Authority:** Source-only diagnosis, offline fixtures, independent reviews and accepted Git
integration. Zero Yahoo requests, external DNS probes or financial observations.

## What the retained evidence supports

The original private non-data receipts were inspected read-only. There is one reservation for
`fc.yahoo.com:cookie`, one `wire_started` intent, one incomplete receipt with no HTTP status,
zero consumed body bytes, `transport_unknown`, and terminal `financial_transport_unknown`.
Cleanup records key destruction/capsule deletion, recovery confirms spent retention/no resume,
and the capsule is absent. Original approval/spent/accounting/cleanup files are untouched.
No key/payload recovery, old-authority reset or retry was attempted.

Source ordering at PR59 matters: `wire_started` is recorded **after the DNS promise resolves,
a nonempty public-address list validates and custody/rate checks pass**, but **before
`https.request()` is called**. The incomplete receipt follows intent by14ms. Therefore:

| Stage | Original evidence |
| --- | --- |
| Endpoint qualification / durable reservation | Confirmed |
| DNS lookup / public-address validation | Completed by source ordering; individual stage timestamps were not retained |
| Request-construction intent | Confirmed durable `wire_started`; misleading if read as an actual connected socket |
| ClientRequest/socket creation, TCP connection, TLS handshake, local request write | Indistinguishable from old receipts; no event milestones retained |
| HTTP response headers/status | None confirmed |
| Application body / financial observations | Zero confirmed; no financial read completed |
| Timeout / cancellation / local network restriction / remote reset | Original exception code and stage were discarded; cannot assign a definitive cause |

## Most likely supported cause, and its limit

The old custom pinned DNS callback always called `callback(null, address, family)`. Node24 can
invoke that callback with `all:true`, which requires an address array. An offline reproduction
on Node24.10.0 with `fixture.invalid`, injected loopback resolution and no system DNS produced
**`ERR_INVALID_IP_ADDRESS`** before connection. The callback mismatch is a concrete local
configuration defect and the leading explanation consistent with the immediate post-intent
failure. The old message-regex sanitizer discarded that uppercase error code/raw message into
`transport_unknown`; no retained record proves it was the original exception.

**The original cause remains unknown.** The14ms interval argues against the configured10-second
transport deadline, but cannot exclude cancellation, local configuration/sandbox/OS failure or
an immediate network/TLS error. The initial GitHub fetch in this diagnostic task failed DNS inside
the sandbox and succeeded with authorized host access; that establishes an environment limitation
for that separate command only. It is not a Yahoo test. DNS failure is not the supported location
of the original attempt, since the retained wire intent followed successful DNS validation.
No evidence establishes Yahoo refusal, successful Yahoo connectivity, a transmitted HTTP request,
financial coverage or data quality. A start intent is not a network receipt.

## Source corrections

- Pinned lookup honors both scalar and `all:true` callback forms, returning exactly one previously
  validated address. IP family/address agreement is checked. No alternate address or host is tried.
- Non-data diagnostics use fixed categories and an exact error-code allowlist. Arbitrary exception
  text—even lowercase strings matching the former regex—cannot enter the new diagnostic receipt.
  Known DNS, local permission/configuration, TCP, TLS, write/reset, HTTP refusal/rate, cancellation,
  stage timeout and settlement failures remain distinguishable without IPs, certificates or secrets.
- Each confirmed milestone is synchronously fsynced with an ordinal, UTC timestamp and elapsed
  milliseconds. Terminal receipts include the last observed stage and its original timestamp.
  Crash recovery can inspect the last durable stage even when a terminal receipt was impossible.
- The new milestones are `request_reserved`, `dns_started`, `dns_resolved`,
  `destination_validated`, `wire_intent`, `request_created`, `socket_assigned`, `tcp_connected`,
  `tls_established`, `request_finished`, `response_headers`, `response_complete`.
  Validation/exchange entry are available before a reservation; no fictional intermediate stage
  is backfilled when an injected transport omits an event. `request_finished` means local stream
  completion, not proof that Yahoo received or processed the request.
- One terminal latch freezes receipt/body/cookie/stage handling before request destruction.
  Late DNS, socket or response callbacks cannot mutate settled evidence or create another request.
  Stage-write errors are caught inside callbacks. Custody cancellation is combined directly with
  caller cancellation, independently of gateway forwarding. Deadline reasons preserve timeout
  classification rather than becoming indistinguishable from an owner cancellation.
- Safe Date/Retry-After validation occurs before encrypted header capture. A16KiB header cap is
  explicit. TLS verification/SNI, exact hosts/paths/parameters, cookie/redirect restrictions,
  body/attempt/rate/retry limits, one-shot issuance and no-replay behavior remain intact.

No schema or migration, manifest/authority ID, admission path, deployment, Python dependency,
employee capability, financial normalization, public contract or production state changed.
`financial_transport_unknown` remains the conservative gateway outcome for uncertain settlement;
diagnostic classification adds evidence, never a refund, retry, continuation or new authority.

## Offline validation

Validation uses authored values, injected DNS/HTTPS and loopback TLS with a newly generated
fixture certificate. Tests never call system DNS for Yahoo or open a Yahoo/public socket.
Existing pinned Python fixtures run against authored responses; no financial-data collection.
Heavy jobs run serially with shared Mac capacity checked.

| Check | Result |
| --- | --- |
| Node old-callback reproduction + repaired pin + real loopback TLS/trust denial |3/3 passed, `/tmp/hq-ready-03c-local-tls.log` |
| Initial diagnostic/failure fixtures |33/33 passed, `/tmp/hq-ready-03c-diagnostics-v3.log` |
| Expanded transport/gateway/custody/recovery/Python/protocol |154/154 passed, zero skips,59.231s; `/tmp/hq-ready-03c-focused.log` (before final header-settlement classification delta) |
| Final diagnostic suite covering header-settlement delta |38/38 passed, zero skips; `/tmp/hq-ready-03c-diagnostics-final.log` |
| Final typecheck/build and generated contract integrity |Passed; `/tmp/hq-ready-03c-check.log`, `/tmp/hq-ready-03c-build.log`, `/tmp/hq-ready-03c-contracts.log` |
| Full serial regression on final frozen source |**1,409 tests:1,403 passed,0 failed,6 existing skips**,525.281s; `/tmp/hq-ready-03c-full.log` |
| Independent security/recovery/acceptance |All three reviewed final source manifest and proposal with no source blockers; final full-suite acceptance confirmed before integration |

Development failures are retained: the first existing transport/probe run failed two assertions
that expected raw fixture error text; assertions now check stable sanitized errors. Initial new
test builds exposed TypeScript overload/excess-property typing errors, repaired without altering
runtime limits. No failed run is claimed as acceptance. A review found a fault test failed at
synchronous request construction despite its asynchronous title; it now injects the fsync fault
after socket assignment so the TCP event handler is exercised.

New coverage includes every failure stage, unknown-code privacy canaries, late DNS and
request/response events, preabort, write/response timeout, receipt and async stage fsync failures,
custody destruction during I/O, consumed gateway charging, no-replay and SIGKILL after an authored
durable transport milestone. Real local Node TLS confirms API/event behavior but proves no Yahoo
availability. No Level3 employee, live provider, production, Linux or browser acceptance is claimed.

## Next step and preserved gates

The separate [second connectivity proposal](../../operations/YAHOO_CONNECTIVITY_PROPOSAL.md)
requires fresh owner approval and a distinct reviewed one-shot capability. Its smallest scope is
one GET to `https://fc.yahoo.com/`, one resolver invocation/selected IP/connection, no retries,
10-second transport deadline,16KiB headers/4KiB consumed body, immediate disposal, non-data
receipts only. It does not repeat the nine financial reads and has not been prepared or executed.

Original HQ-READY-03B authority remains spent and unchanged with `noResume=true`; Decision037
remains exhausted4/4. Genuine financial-data qualification remains blocked. HQ-READY-02 and
`inv05-v1` stay synthetic-only; observed fills, employee inference, recurring collection, spending,
production/Asymmetri deployment and public publication remain unauthorized and unstarted.

## Source identity and independent review

The [eight-file source/test manifest](HQ-READY-03C-source.sha256) has SHA256
`4e9c5b1833f201d38600f119e419bd6e2c5cd121bfbbe6408c7e6246d0430dde`.
Security, recovery and acceptance specialists independently verified all entries and inspected
final diagnostic/loopback/focused logs. Security accepted closed tokens, pin/TLS controls,
capability isolation and the new proposal's narrow scope. Recovery accepted frozen callbacks,
stage/receipt durability, conservative charging, cleanup and no replay. Acceptance distinguished
injected stages and actual local Node TLS from the still-unknown original Yahoo outcome.

The recovery suggestion to classify encrypted header-receipt write failure as settlement
uncertainty was implemented and passed its own fixture before the full-suite freeze. The
acceptance wording suggestion now explicitly distinguishes new **live owner authority** from
authored fixture capabilities. No remaining source finding requires a change. Reviewers were
read-only and made no Git, network, production or original-authority changes.

A final read-only equality check verified all five original approval/spent/accounting/normal
cleanup/recovery-cleanup files against their pre-edit SHA256 values: byte-identical. The capsule
remains absent and the original spent receipt still says `noResume=true`. These private files
were not copied into Git. Documentation local-path validation checked122 links with no missing
files; whitespace, changed-file secret-pattern and source-manifest checks also passed. Git integration is recorded separately below.

The full suite ran after the final header-settlement delta, rebuilding unchanged source. Its six
pre-existing skips are five external standalone-receiver integration variants and one Linux-only
filesystem/resource test. No Yahoo transport, custody, Python or diagnostic fixture was skipped.
Existing market/financial/contract/accounting/benchmark/worker-runtime/recovery regressions passed
with fakes. Source files were held fixed throughout final validation and all hashes reverified.
The source build used Node24.10.0; no dependency or environment installation was required.

Only non-data test-log hashes are committed; full logs remain local.

| Final local evidence | SHA256 |
| --- | --- |
| `hq-ready-03c-full.log` | `6ca30038fa18e847c891c15a6c5e7e5c619ffb7a333c70a55c0cdfab77509c6b` |
| `hq-ready-03c-focused.log` | `cd2aa8eab80869ce2b8af2420bd6bd0db3b63e414b12aa9653e561a38d6a7cca` |
| `hq-ready-03c-diagnostics-final.log` | `39710d67d20771223ae4311a6dd685c6b96b3fad5b5648722605ab961a33fc10` |
| `hq-ready-03c-local-tls.log` | `0a8dc77c0e0af2b0a145c8c7a09df4e189a7491142f85f8bc9eedd520359f297` |
| `hq-ready-03c-check.log` | `c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652` |
| `hq-ready-03c-build.log` | `6950d327ee1d7a372a870ceff93a12f68ec7b5f3f31860c660a343e80b7b0047` |
| `hq-ready-03c-contracts.log` | `d918d028251e4d2b5ef144341ceffc8155f5baf1eda87fdbcbe040dd282085f5` |

The corresponding [compiled eight-file build manifest](HQ-READY-03C-build.sha256) has SHA256
`7dae5b9aaac6ebfb5488d1bf54c60f7ca9e30722f7f0d8f9617a0ee26ef0846d`.
These hashes identify the JavaScript exercised by the final full suite; generated JavaScript
itself is not committed. The integrated-main rebuild must match them before this task closes.

## Git integration

Implementation/source acceptance commit: `60caf32cbac330e2e3a4951be73b8cd839b06bc0`.
[PR61](https://github.com/eugenelin89/bot_messenger/pull/61) records the final reviewed head,
remote review/status/mergeability disposition and merge identity. The only follow-up change is
this documentation link and execution-plan handoff; source/test/build manifest bytes remain fixed.
The parent verifies clean synchronized main and matching rebuilt JavaScript after merge, then
stops without preparing or executing the connectivity proposal.
