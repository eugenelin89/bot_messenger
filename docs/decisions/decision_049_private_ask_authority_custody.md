# Decision 049 — Separate finite Ask authority and attempt custody

**Date:** 2026-10-13
**Status:** Accepted for dormant source; operational integration remains incomplete
**Scope:** Metadata-only authority/transport component of INV-ASK-02

Public questions must not spend investment allowance or gain investment/action tools. A crash,
restored Company database, lost model response or lost delivery acknowledgement must not create
fresh allowance or a second employee answer. This component implements custody; it creates no
operational grant, initializer, runtime permit, Company execution origin or dispatcher caller.

## Finite metadata and trusted capabilities

`AskGrant` binds the exact canonical service scope, limits, roster, generation, selected workers,
profile/account/routing/eligibility/context/tool/cost evidence and approval digest. Closed schemas
reject arbitrary private text. Grants last at most24hours; duration is at most240seconds, with
finite execution/token/micro-dollar bounds. Router and research allowance are zero. Exact integer
micro-dollar strings avoid floating-point accounting. Admission binds one reservation and provider
session, fresh capability evidence and the grant digests immediately before possible transmission.
Only a future trusted adapter can supply those assertions; this module does not establish them.

The initial strict modes are included-only or verified monetary cap, with enforced input/output
bounds and complete usage receipts. These modes cannot be inferred for deployed Codex0.157.
The feature specification's activity-capped subscription alternative requires a coordinated
canonical/capability amendment with honest unknown monetary cost and monitored token thresholds;
never satisfy strict fields with fixture booleans, zero invented cost or output truncation.
No provider or paid-account purchase is implied by this component.

## Independent consumption and recovery

Authority is held in a private immutable SQLite hash chain plus an atomically replaced checkpoint
in a separate private directory, excluded from supplied Company/ordinary backup roots. Open validates
owned canonical paths, modes, inodes, sidecars, schema, integrity, the full semantic replay and exact
checkpoint. Creation exists only as explicit fixture genesis. Missing custody or commit/checkpoint
disagreement fails closed and cannot be reinitialized. Process ownership prevents old reservations
from being transmitted, refunded or settled by a new handle.

Reserve worst-case strict-mode usage before effects and never refund it, including known no-send.
Enforce both UTC-day and rolling24hour limits across grants/services as well as per-grant limits.
Only one model reservation may remain unsettled anywhere. Service/question identity survives renewal;
provider sessions are never reused for another answer. Newer service generations fence older grants.
Confirmed late settlement remains attributable even after revocation; uncertainty is never success.

## Network attempts are separate from model execution

The transport supplies frozen metadata at the last synchronous pre-wire boundary: service,
generation, operation, idempotent intent, signed wire digest and exact safe answer identity where
applicable. No prepared request/body/claim text is included. A failed/non-synchronous persistence
hook sends no HTTP bytes and is conservatively unknown. Current authority/key/clock and a monotonic
total deadline are rechecked after the hook, covering event-loop blocking during durable writes.

Each physical attempt has one immutable response observation. A503,404 or successful response
cannot clear earlier uncertainty by itself. A trusted consumer must supply a matching decoded
immutable answer receipt from an observed successful attempt. Reconciliation names each exact
answer/receipt attempt to clear, binds complete answer identity and preserves the historical
receipt across all retries. It cannot clear a claim, privacy control or unknown model execution.
Other operation-specific reconciliation is deliberately absent and held pending integration.

## Bounded capacity and limitations

The journal allows10000 events and16KiB per new event. A4096-byte page size and131072-page
ceiling allow512MiB maximum physical SQLite capacity, conservatively exceeding the maximum payload
plus row/index overhead. Actual storage grows on demand. Before accepting work, reserve three
completion entries for a reserved model, two for admitted, one for transmitted, two for each
unobserved unknown wire, one after observation, and one revocation entry per live grant.
Tests reach the exact10000-event boundary while finishing accepted effects and denying new work.
Disk exhaustion or multi-file commit failure remains a hold, never permission to repeat an effect.

This proves neither independent off-host backup custody nor simultaneous rollback detection of
both authority/checkpoint files. It does not prove provider eligibility, hard caps, raw-content
purge, genuine routing, host isolation, public intake or service capacity. Those remain explicit
integration work under the existing owner implementation/release authority.

See [acceptance](../validation/investment/INV-ASK-AUTHORITY-01.md),
[ASK-02 plan](../exec-plans/investment-inv-ask-02.md) and
[current morning handoff](../operations/INV-REAL-01.md).
