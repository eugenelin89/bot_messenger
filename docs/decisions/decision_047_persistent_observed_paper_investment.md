# Decision 047 — Persistent observed paper investment

**Date:** 2026-10-13
**Status:** Implemented on `codex/inv-real-01`; acceptance and deployment pending
**Scope:** INV-REAL-01, owner-authorized personal noncommercial project

The owner requests a functioning, persistent paper portfolio using real Yahoo observations,
genuine existing employees and public presentation on asymmetri.co. The owner explicitly
authorizes deployment and public release when ready, and an overnight continuation loop.
No brokerage order, paid market subscription, credit purchase or reload-setting change is authorized.

## Owner-reported Yahoo confirmation

The owner reports direct communication with Yahoo covering automated financial research,
simulated investing and publication through the owner's personally registered website.
Yahoo reportedly confirmed that the complete project is acceptable as a personal,
noncommercial hobby project. The owner retains permission and compliance responsibility.
This is recorded as **owner-reported**, not independently verified documentation. No further
licensing investigation, written-proof demand or provider-rights approval milestone is needed.
Technical source integrity, provenance, request limits and access-denial handling remain enforced.

## Method and point-in-time interpretation

`inv-real-open-v1` is distinct from unchanged `inv05-v1`. The existing fixed-point ledger,
reducer, market admission, employee tools, discussion engine and HQ dispatcher are reused.
The observed path accepts one to eight selected US equities plus SPY, USD, long-only cash
accounting, no leverage and editable frozen capital, commissions, slippage and risk limits.
Default capital is USD100,000, commission zero and one-way slippage10basis points.

Research uses ten-day daily Yahoo history retrieved before the decision cutoff; the compact
employee packet includes the latest three rows per instrument. Historical provider publication
time and historical split adjustment basis are unknown. Those rows are research evidence,
never execution quotes. Every decision freezes the evidence actually known at commitment.
The cutoff is30minutes before the selected regular open. The initial benchmark opening is
frozen to the first explicitly selected session, which may be later than the next exchange day.
A missed frozen benchmark opening is never backdated or silently moved. An exact prospective owner renewal can defer unused initial funding under the disclosed cash-then-benchmark recovery below.

After the same regular session closes, the gateway obtains its direct raw daily chart. A
paper OPEN/CLOSE reference qualifies only if the original quote values, timestamp, currency,
provider regular-session bounds, calendar, instrument and normalized records agree, coverage
is complete and the response was retrieved on that session after close. The precommitted
order is then modeled at that session's OPEN plus adverse slippage. This is delayed paper
accounting, not a claim that an executable quote was captured at market open. A session
missed prospectively cannot be backfilled as if its original knowledge existed.

Missing or uncertain records block price-dependent effects and produce explicit unavailable
valuation. Whole-share splits preserve basis. Dividends accrue receivables using held units;
unknown payment dates never create cash or reinvestment. Historical adjustments/revisions
retain normalized originals and links; a later adjusted history never rewrites an earlier
qualified fill. Qualified current-session corrections use append-only price lineage.

## Persistence and finite operation

One immutable portfolio configuration and one continuing ledger survive renewed operational
scopes. Renewal creates a new bounded authority and discussion, never capital, performance,
loss, historical approval or consumption resets. Initial scope has1–8future sessions within
31days. The independent fsynced authority journal and separate custody checkpoint remain
outside the HQ snapshot. Exact source request hashes are one-use, with5second provider-wide
spacing, one direct request per collection,262144byte response bound,10second wire timeout,
120second collection bound and no retries after uncertain transmission. Access denial or
unknown outcome closes the source circuit. Source occurrences recheck durable ownership,
generation, expiry and Stop before DNS, wire and evidence admission.

Existing finite model controls remain: at most24turns per authority,8rolling24hour admissions,
one investment turn, two global turns, exact model/account/roles, duration and per-cycle/day/
worker bounds. Actual measured usage and existing-credit exposure remain separate from paper
P&L. A local interruption cannot guarantee an upstream billing cutoff. No credit purchase or
reload mutation is added. Idle scheduling invokes no models.

For this recurring observed purpose, an authentic owner reload-OFF attestation may remain
valid for31days; previous one-day legacy policies are unchanged. The actual confirmation time
and evidence hash must be retained and the same account bound. Activation must not relabel
old confirmation as a new check or invent API verification. A reported change, account
mismatch or expired attestation holds work. This is an explicit usability tradeoff for the
owner-authorized persistent project, not a real-time billing-state guarantee.

Known settled failures can be retired and a fresh prospective scope authorized, with the
old attempt still consumed. Unknown settlement never becomes retry authority. Stop works
for drafts and finished observed scopes, including when damaged external custody prevents
an external stop receipt. Ordinary and legacy recovery behavior remains unchanged.

The initial frozen exchange calendar covers2026. Renewal beyond it is rejected. A reviewed
prospective calendar amendment is remaining work before claiming calendar-spanning operation.

## Retention, publication and accounting display

Normalized observations, source hashes, private original decisions/reviews and ledger history
form a permanent owner-private audit archive. `retainUntil` is a processing/access horizon
(up to six years), not deletion of financial history. Raw response bodies and Python adapter
output exist in the bounded collection's memory and are discarded. Persistent service memory
is not claimed to be a tmpfs-only/no-swap one-shot environment. Host hardening and root-owned
runtime code are separate deployment checks.

Employees provide separately designated public thesis, facts, assumptions, alternatives,
risks, horizon, invalidation, change reasons and independent review summaries. Only settled,
completed, attributed original proposal/review pairs project publicly. Ordinary private
conversation text, raw evidence and private reports never become publication artifacts.
The standing owner grant permits future reviewed summaries and financial journal events.
The canonical v1 schema is unchanged. Its receiver capability requires a nonempty content
format list, so events-only authority advertises JSON to the receiver while retaining a local
empty content allowlist. No content job can be staged or sent under that local grant.

Public identities, signed ordered outbox, finite delivery grant, receipts and restart generation
reconciliation reuse the existing publication service. A failed capture does not prevent
already-authorized queued jobs from being delivered. Benchmark actions appear in benchmark
snapshots; canonical v1's separate portfolio action feed does not represent benchmark-only
actions. Public configuration describes the initial authority, not the budgets of every renewal.

The owner view shows USD cash, equity, basis, realized/unrealized P&L, benchmark and excess
return, drawdown, receivables, positions and sectors as percentages of latest marked equity,
commission, modeled slippage, traded notional and cumulative turnover. Turnover counts buys
and sells divided by initial capital; it is neither annualized nor an average-NAV measure.
Unavailable marks remain unknown rather than zero.

## Historical preservation and acceptance

Decision037's4/4spent allowance and all historical Yahoo03B/D/E/H receipts remain spent.
Schema25 migrates retained data without granting any authority. Historical decisions and
source/probe outcomes remain evidence for their original scope.

Required source gates: three-session authored employee/ledger/publication integration,
renewal and restart continuity, market-action/missing/correction cases, immutable migration
preservation, interruption/unknown-effect cases, owner browser checks, complete serial
regression and independent architecture/security/recovery/acceptance review. Fixture prices
and fake runtime receipts never establish real operation. Deployment claims require verified
accepted source/build/schema, bounded real Yahoo receipts, genuine employee receipts,
signed receiver acceptance and actual public page verification. Elapsed sessions cannot be
manufactured to make a release appear complete.


## Missed initial benchmark recovery

A missed initial opening cannot be allocated retroactively from historical prices. An exact
owner-selected renewal may prospectively defer unused initial benchmark funding only after
its old opening window expires and before the selected future source window. The append-only
`benchmark_defer` record preserves the original configuration, cash and unavailable comparisons.
Its resulting comparator is **cash followed by SPY**, not full-period SPY buy-and-hold. Public
status and subsequent snapshot limitations disclose both dates. No deferral is allowed after
any benchmark allocation. Only that scheduled benchmark allocation may recover through a
benchmark-only missing valuation; discretionary BUY stays blocked until healthy valuation.
Known-settled employee failures and interruptions remain retained through renewal/restart;
unknown or incomplete provider outcomes still prohibit it.
