# HQ-READY-04C — fresh-authority recovery source acceptance

**Date:** 2026-10-13 UTC
**Base:** `fd3358d64edb4e1f6a4288de15f454362d116a18`, verified clean synchronized main
**Scope:** Authored source/fixture/browser acceptance and reviewed Git integration only
**Status:** Source accepted by all four independent reviews and integrated through PR73

## B1 reproduction and correction

Dispatcher.start calls Company.recover, FiniteHQ.recover and FiniteJournal.recover. A fresh
approved authority acquires a hold while holdFinite leaves its research loop draft. First
collection and Start fail on the hold; draft Resume fails its state check, while Pause then
Resume fails because collection evidence is absent. The original
[04B offline receipt](../evidence/hq-ready-04b/fresh-authority-recovery.json) is unchanged.
The new regression repeats these denials with zero wire calls and zero model executions.

The owner now has an explicit **Release recovery hold for first collection** control. The
existing auth/CSRF route checks the exact digest and uses the independent journal's atomic
release/receipt transaction. It admits only a future, untouched approved research draft with
current consents, source/rights/retention/host/account/reload identity and no global fence.
Both loop and group remain draft; release itself reserves nothing and performs no financial
or model request. Account preflight is non-inference. See
[Decision046](../../decisions/decision_046_fresh_research_recovery_release.md).

Untyped historical holds cannot be upgraded by another recovery. Owner/failure holds,
prior scoped reservations, unknown outcomes and consumed allowances remain ineligible.
No direct journal operation is exposed to HTTP or employees. No database schema, public
contract, model profile, worker role, financial methodology or authority ceiling changes.

## Complete authored restart path

Both broad and specific research mandates run through the actual Company, Store, Dispatcher,
independent finite journal and normal owner controls. After the first Dispatcher has run,
the test consents/provisions, stops it, closes Company storage/journal, reopens the same HQ
and authoritative journal and calls Dispatcher.start. It proves pre-release collection
and draft Resume fail, then releases the exact owner receipt and repeats it safely.
Draft loop/group, zero reservations and no dispatch are asserted before collection.

One authored direct-chart collection admits evidence; explicit Start then runs eight fake
model turns through normal worker tools, complete evidence delivery, attributed openings,
peer interaction, full draft read, independent critique read and revision. Both reopened
cases finish, stop the Dispatcher and advance to retention expiry. Cleanup leaves eight
delivery records, eight permanently consumed model reservations and one collection, with
content redacted and a purge receipt. These are structural tests, not genuine reasoning.

## Negative and persistence evidence

The tests deny changed owner/worker/workspace/symlink/membership, scope/config/preview,
source/processing rights, retention/consents, account/routing/eligibility, reload, stopped,
expired/due authority, missing/replaced/copied/restored/corrupt custody, every prior collection
or model reservation state, incomplete usage and unrelated provider/global fences. Pending
account checks revalidate pause/stop/recovery/reload/shutdown/identity changes. A synchronous
accounting check crossing startsAt denies without release or receipt.

Two actual child processes contest one hold with different receipts; exactly one release
commits. Four SIGKILL boundaries cover insertion of resume before receipt/COMMIT (both roll
back), COMMIT before custody (fails closed), after custody and before response (durable
receipt). A duplicate/newer-hold interleave proves a no-op cannot rewind custody. Reopened
recovery invalidates old receipts. Restored HQ cannot erase independently consumed collection.
Coordinated rollback of all external copies is outside these checks; independently current
custody remains mandatory in deployment.

## Validation ledger

Implementation is frozen at `e0b9288416d4ef378d244182c7fdbf24dc29f6f9`.
All financial and model data are authored. Serial heavy validation uses Node24.10.0 on Mac;
no genuine CLI login, model turn, Yahoo call or production SSH is part of04C.

| Check | Result |
| --- | --- |
| Build and focused account/recovery/reopened dispatcher | 91/91 passed; zero failures/skips;32.664seconds |
| Full serial npm test |1,834 passed, zero failed, six existing skips of1,840;789.419seconds |
| Focused existing authority/recovery/dispatcher/research/Python/migration |67/67 passed; zero failures/skips;44.707seconds |
| Typecheck / build / canonical contracts | Passed; contracts175/175, canonical v1 unchanged |
| Browser private research plus existing finite controls,390/1440 | Final8/8 passed; refreshed status, CSRF/origin rejection, draft/no-dispatch, no overflow/JS errors;9.477seconds |
| Independent reviews | Architecture, security, recovery and acceptance all accepted frozen source |
| Historical preservation / diff whitespace | Original04B receipt unchanged; adapters/contracts/Decision037/history unchanged; diff checks passed |

The six skips are the existing opt-in four actual isolated team receiver cases, standalone
actual receiver integration, and Linux generic-recipe resource-limit case. None is claimed
as accepted by this Mac run. Browser results are local authored acceptance, not Ubuntu.

Commands and non-content results are retained in
[acceptance evidence](../evidence/hq-ready-04c/acceptance.json).

The first full serial attempt recorded1,832 passes, two failures and six existing skips
of1,840. Both failures were the existing Python direct-profile tests: this isolated worktree
had not yet linked the ignored pinned adapter environment, so neither reached its authored
HTTP fixture. The existing Python3.12.12/yfinance1.7.0 environment was linked without code
or dependency changes; final acceptance uses the complete fresh serial rerun recorded above.

Earlier development runs exposed an unused import, a harness Stop after an already finished
loop, and a cleanup expectation that incorrectly expected an empty string instead of the
redaction marker. Those test/harness errors were corrected. A final account notification
properly invalidates the snapshot and is now asserted as denial. These earlier runs are not
counted as acceptance passes.

## Independent review dispositions

One implementation writer; four read-only specialists. Architecture found the final synchronous
deadline crossing, now denied. Security found workspace symlink replacement and earlier RPC
closure during another workspace's check, both fixed and covered. Recovery found duplicate
no-op custody overwrite risk, fixed by skipping unchanged custody writes; strengthened the
crash fault to occur after release insertion before the receipt. All four final source verdicts are accepted for the frozen implementation. Acceptance
independently matched the final log hashes/totals and original04B receipt.

[PR73](https://github.com/eugenelin89/bot_messenger/pull/73) merged exact reviewed head
`de9e973116062601c311bb40b32eafee25061aee` at `7c5f3bceb831668c7c0e7d1b4e01f859b0e1d76d`.
The merge tree equals the reviewed head; primary main was clean and synchronized before
the owner package was updated. Closure documentation does not change the tested source.

## Operational boundary

B1 source acceptance does not approve Ubuntu installation or the genuine trial. After source
integration the [updated04B package](../../operations/HQ_READY_04B_APPROVAL_PACKET.md) pins
`7c5f3bceb831668c7c0e7d1b4e01f859b0e1d76d`, retaining five unapproved owner decisions and every
root Node, Linux swap/core/tmpfs/guard, migration/restore, source rights, account/credit and
retention gate. Its [complete next prompt](../../operations/HQ_READY_04B_EXECUTION_PROMPT.md)
is future conditional execution material, not authorization. The package passed independent
acceptance after verified source integration. October14 remains conditional; missed prerequisites
require cancellation and new proposed times, never silent rescheduling.

Decision037 remains4/4. All prior03B/03D/03E/03H authorizations and historical records remain
unchanged/spent. No production change, Yahoo request, genuine employee inference, credit
expenditure, paper trade, recurring collector, Asymmetri modification or publication occurred.
