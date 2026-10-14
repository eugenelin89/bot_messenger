# October 15 readiness and bounded handoff

**Current readiness: CONDITIONAL — ready to attempt the existing finite schedule.** Reviewed PR 100 is deployed at `0fabbbac0a1bb8e180556bcbe837076ca341f9c3`; runtime ready, retained loop active and four family calls available. Today's close stages and public accounting passed. Genuine next-day admission and proposal/review/submission remain unverified; the overall system stays partially operational.

## Exact schedule

| Stage | UTC October 15 | Vancouver | Required evidence |
|---|---|---|---|
| Research collection |11:45, expires 12:00 |04:45–05:00 | Nine new approved request hashes, one use each, valid fresh normalized research |
| Research due |12:00, expires 13:00 |05:00–06:00 | Same pending occurrence, new current-session decision, complete settled usage |
| Earliest four-turn capacity |12:01:13.039, if no intervening consumption |05:01:13.039 | Third old reservation exits strict 24 h window; no family refund |
| Decision cutoff |13:00 |06:00 | Eligible submitted decision before cutoff; HOLD/rejection acceptable |
| Market OPEN / CLOSE |13:30 /20:00 |06:30 /13:00 | Normal session; next regular OPEN methodology applies Oct 15 |
| Close collection |20:05, expires 20:20 |13:05–13:20 | Same-session raw OPEN/CLOSE qualified; no duplicate spent fetch |
| Delayed OPEN accounting |20:20 |13:20 | Eligible precommitted order, guard/risk/source checks and exact ledger |
| Valuation |20:25 |13:25 | Cash/positions/equity/benchmark and quality linked to actual observations |
| Order expiry |23:30 |16:30 | Pending orders expired once; no replay |
| Authority/publication expiry |23:40 |16:40 | Stop new authorized work; no silent renewal |

Source: plan 2 occurrences in [post-cutoff HQ evidence](evidence/hq-after-cutoff.json). Stable research occurrence: `loop_d9f680b6cbaa717c3ab2ba43b2e98725999eb0a68f86a5830775e981849fac36`. Oct 14-only closing amendment does not change Oct 15's OPEN methodology.

## Corrected blocker and deployed behavior

At 12:00 the retained reservations are still seven inside 24 hours. The original 846d222 planning reserved one facilitator plus three finalization turns, so 7+4>8 would throw. The occurrence could become blocked after start, requiring recovery; ordinary resume does not replay the ended occurrence. Capacity actually becomes available at 12:01:13.039, well before the 13:00 cutoff.

The merged correction checks startup allocation **before** changing the group or occurrence. Only a never-started pending occurrence may wait until enough settled reservations age out. It persists `retry_at` on the same occurrence, capped by the original expiry. It rechecks scope/membership/evidence/runtime/custody/permanent budgets at retry. At expiry it becomes missed. Active or unknown work cannot become a waiting retry. Run/family/day/worker/cycle caps, frozen schedule, source hashes and provider fences are unchanged. No budget is restored and no new authority is created.

[Actual guarded deployment](evidence/deployment-receipt.json) and [final readback](evidence/hq-postdeploy.json) establish the installed correction. [Validation](VALIDATION.md) distinguishes authored Linux acceptance from the still-future genuine outcome.

## Remaining acceptance conditions

1. **Met today:** all close stages complete, qualified observations and complete valuation, no hold/new-risk block and public readback consistent. Recheck current health tomorrow; today's success does not waive future fences.
2. **Met today:** exact merged correction deployed after close, with 180 unchanged tables, financial head 16 retained, finite prefix preserved and fresh one-use publication handoff completed. Genuine Oct 15 waiting/start remains an acceptance condition.
3. Keep exactly four family calls available. The minimal final-day path is facilitation/synthesis/review/finalize, with paper tools before terminal tools. No spare optional discussion or revision is assumed. Exact live provider time/limits may still prevent completion.
4. Verify actual fresh proposal, attributed independent review and submission IDs, current occurrence/session, exact hashes and complete usage. HOLD is valid; absent proposal is not formal HOLD. Review rejection remains explicit, with no forced trade.
5. For an order, verify real session timing, qualified delayed data, cash/position/price limits, immutable fill/expiry and benchmark distinction. Reconcile public events and valuation with HQ. A passed source test is not this acceptance.
6. Preserve the historical Maya gap, seven consumed attempts, original $100,000 initialization and source/publication custody. Additional uncertainty remains held; do not recycle Decision 052's exception.

## Owner decisions and continuity

The owner explicitly approved guarded PR 100 deployment, and the 20:26:33 preservation receipt confirms completion. No further deployment approval is pending. The earlier automatic-review rejection was resolved by direct approval of the concrete reviewed change. Limits, authority, spent consumption, source hashes and the original research window remain unchanged.

No additional model authority or limit increase is required by the deployed waiting correction. The four remaining calls can fit the minimum path, but cannot guarantee successful genuine behavior. If they are exhausted or the authority expires, stop and report actual state. Sustained operation after Oct 15 requires a separately owner-authorized and reviewed renewal policy that explicitly carries forward the exact historical telemetry exception, then implementation, acceptance evidence and new finite source/model/publication authority. Current ordinary same-portfolio renewal is blocked by the original incomplete record at both consent (`observed-investment.ts:82`) and independent approval (`finite-journal.ts:103`). The one-use recovery cannot be repeated, and reload-attestation renewal does not extend authority. Successful completion tomorrow does not remove this blocker; this audit does not reset the portfolio or issue new authority. Ask remains paused with no spending or activation decision pending.

The owner subsequently deleted the former chat's `botsquad-investment-completion-loop` automation and transferred coordination to **“V - Audit BotSquad operations”**. Direct owner messages and the deletion action are retained in [coordination handoff](evidence/coordination-handoff.json). This supersedes initial audit assumptions that the 15-minute chat heartbeat remained active. **BotSquad's server-side investment schedule remains active.** No replacement chat automation is created; future prompts are owner-driven. The audit chat now owns HQ coordination and due-stage verification; the previous “U - Coordinate BotSquad investment” chat is historical. The approved guarded deployment belongs to the current coordinator; the old chat remains historical.
