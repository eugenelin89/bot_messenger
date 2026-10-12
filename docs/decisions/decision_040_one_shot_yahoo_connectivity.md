# Decision040 — Separate one-shot Yahoo connectivity

**Date:** 2026-10-12 America/Vancouver
**Status:** Owner-authorized bounded implementation and one supervised attempt; actual acceptance recorded separately

The owner explicitly selected HQ-READY-03D, approved the exact
[reviewed connectivity proposal](../operations/YAHOO_CONNECTIVITY_PROPOSAL.md), and confirmed
that their reported verbal Yahoo permission covers this minimal automated personal-use GET
and non-data diagnostic receipt retention, to the best of their understanding. This remains
owner-reported verbal evidence, not independent verification, writing or a broader license.

This new approval is independent of Decision039/HQ-READY-03B. The old authority is permanently
spent, its five retained files remain unchanged, its capsule remains deleted and noResume stays
true. Decision037 remains permanently exhausted at 4/4. Neither authority can be reset or reused.

## Exact capability

The dedicated owner CLI permits only GET `https://fc.yahoo.com/`, with the reviewed fixed
User-Agent/Accept/identity encoding headers and normal Host/TLS/SNI verification. It invokes
one all-address resolver, rejects any nonpublic/malformed/mixed answer, selects only the first
validated address, fixes that family and disables automatic family selection. One connection
and one request maximum; no retries, redirects, alternate IPs, fallback, login, cookies, crumb,
Python/yfinance or financial reads. There is no app startup, gateway or worker entrypoint.

A separate OS-account anchor `BotSquad-Yahoo-HQ-READY-03D` is create-only, with new approval UUID,
exact frozen scope, source/build identity, root identity, UID and 60-second lifetime. Clean
synchronized main, disabled core dumps, FileVault, encrypted swap and verified backup exclusion
are required. Consumption creates and fsyncs one exclusive spent reservation before DNS.
Stages are private durable non-data records, and the last-confirmed pointer advances only after
successful fsync. Any custody/accounting failure permanently stops the original process.
Cleanup never deletes authority. Missing/partial/conflicting files never cause repair or refund.

The implementation tightens the maximum body allowance to **zero consumed body bytes**: it
closes immediately on the first HTTP headers, including interim headers, and never reads,
decodes, retains or evaluates body content. The 16 KiB parsed-header cap and 4 KiB declared-body
ceiling remain; malformed/compressed/oversized response headers stop. Cookies/header contents
are discarded. Body completeness and content/challenge qualification are explicitly unproven.
Unread buffers and TCP/TLS overhead are not application consumption or a claimed wire-byte cap.

The transport has a 10-second deadline with synchronous elapsed checks after durable stages and
before DNS/request/end. An independent parent kills and joins the child at most 10 seconds after
allowing consumption, **including** child host/source checks, reservation and cleanup; this is
stricter than the proposal's 30-second overall process ceiling. A separate 30-second startup/overall
watchdog remains. Lost supervisor IPC terminates the child. A hard kill can prevent a terminal
receipt; the spent reservation and last available stages still prohibit replay. Explicit recovery
records only original-process termination and non-data custody, never a successful response.

Private retained evidence is approval, spent reservation, stage log, terminal accounting, normal
cleanup and optional recovery cleanup. No raw response, header value, DNS answer/IP, certificate,
exception text, credentials, financial observation or financial capsule is written. A closed
allowlist of endpoint/stages/error categories/codes and status/counts/timestamps identifies the
actual outcome. Local custody assumes a trusted OS owner: deliberate in-place rollback to an
approval-only snapshot or whole-host rollback by that owner is outside its protection. No tool
or cleanup path performs that rollback, and no hardware rollback-proof guarantee is claimed.

## Interpretation and unchanged gates

Any validated HTTP status establishes HTTP connectivity only for this endpoint at that time.
A 403/429 is explicit refusal/rate evidence; no status triggers follow-up. A terminal receipt may
be incomplete or uncertain without restoring the single reservation. Stop after the attempt.

US$0 market-data spend, HQ-READY-02/`inv05-v1` synthetic-only status, private financial-data
qualification, observed fills, employee/model authority, recurring collection, trading, public
redistribution, production/Asymmetri deployment and HQ-READY-04 gates remain unchanged.

[Acceptance](../validation/investment/HQ-READY-03D.md) distinguishes source/fixtures, integration,
one actual attempt and cleanup. Passing source tests creates no live authority by itself.

Admission additionally requires at least 10 seconds remaining in the 60-second manifest lifetime,
so the independent consumption ceiling cannot outlive absolute expiry. Final wall/monotonic
checks after filesystem reads prevent a synchronous read stall from hiding expiry.
