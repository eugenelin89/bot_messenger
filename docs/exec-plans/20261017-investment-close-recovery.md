# October 17 investment close recovery and continuity

**Status:** Active  
**Owner:** Review this morning’s run, sole writer; read-only security/recovery reviewers  
**Branch:** codex/investment-close-recovery-20261017  
**Worktree:** bot_messenger-close-recovery  
**Started:** 2026-10-17, America/Vancouver  
**Initial ETA:** 1–3 hours, dependent on source qualification and receiver coordination

## Objective and authorization

The owner instructed: “investigate and fix. just make it work” after the October 17 live review identified the failed October 16 close, expired publication and absent next-session schedule. Repair the bounded paper experiment and verify operational recovery. Preserve its actual history, decisions and cash portfolio. No real trading, paid market data, Ask activation, invented prices, or erased failures.

## Initial evidence

- Live loop is blocked after October 16 20:07:05 UTC collection: SPY request returned known `unavailable / financial_ohlc_order`. Eight equity responses were retained.
- The latest formal decision is approved/submitted HOLD for October 16. No pending orders or holdings; cash USD100,000.
- Last complete valuation is October 14. October 16 open/mark occurrences remain pending after their windows; expiry completed.
- Publication authority expired October 16 23:40 UTC; delivery blocked. Public page still says Active/Stale.
- No occurrences are scheduled after October 16.
- PR113 investment objectives/research is a separate, undeployed draft. Do not absorb it into this operational repair.

## Relevant requirements

AGENTS.md, README, product vision/intelligent-company model, architecture; Decision029, investment DECISIONS/SIMULATION_RULES/ROADMAP; decisions047 and052–056; website AGENTS and INVESTMENT_RECEIVER runbook. Existing source and actual retained receipts prevail over historical summaries.

## Work sequence

1. Inspect rejected-source diagnostics, collection/qualification, independent authority and current receiver custody. Establish reproducible cause without substituting prices.
2. Implement the smallest bounded recovery for known source failures and overdue accounting, retaining original timestamps and disclosing unavailable valuations. Establish a finite prospective trading-week schedule under the owner instruction.
3. Restore existing publisher scope using a fresh key/explicit grant with bounded expiry; retain old keys and all signed receipts. Make public state accurately reflect operational condition.
4. Test normalization negatives, authority/custody, idempotency, missed windows and restart. Obtain independent security/recovery review.
5. Deploy exact validated source with consistent backups and preservation checks. Activate approved recovery through supported controls, verify actual outcomes/publication, and validate the next schedule.

## Invariants

No direct SQL edits to bypass holds, no refunds of consumed attempts, no blind replay of unknown effects. No retroactive fills, hidden methodology changes or overwritten valuations. New observations retain their actual retrieval time. No old private key or token is emitted. Public deployment preserves unrelated website routes and owner-paused Ask.

## Validation and evidence

Private operation evidence lives outside Git under outputs/investment-close-recovery-20261017. Source acceptance remains separate from actual provider results. Focused regressions precede live activation; restart and predecessor-table preservation are required. Track findings and material ETA changes here.

## Remaining work

Investigation, exact recovery design, implementation, independent review, Linux validation, coordinated renewal/deployment, genuine recovery and next-session readiness.

## October 17 implementation checkpoint

- Recovery uses retained qualified closes only, appends missing benchmark values as null, and adds no calls/fills. Snapshot/checkpoint changes fail; a simulated interruption after the first valuation rolls the entire local transaction back.
- Distinct `bounded_successor_v1` supports one to three future sessions at eight attempts/session, max24; preserves raw rolling consumption and only carries independently acknowledged gaps. No new exceptions. Process-enabled books are excluded.
- New scopes can omit exactly settled `financial_ohlc_order` packets after durable receipt; no replay. Unknown outcomes and newer holds block. Review found and fixed owner-pause-before-settlement and previous-close/current-research disclosure races.
- Future fatal collection failures now pause the portfolio lifecycle. Public operating snapshots append fixed status/next-review information, with separate standing-summary permission and preview hash binding.
- Coordinated with AA - Improve investment research workflow, per verified owner instruction there. PR113 merged03acc675; integrated06e5860. This chat owns the sole production window. Other chat does independent read-only verification and provides test-only inert setup probe.
- Initial focused results: 53 independent journal tests, 27 legacy observed workflow tests pass. Expanded combined tests and recovery/security review remain in progress. No production mutations yet. Current estimate remains within original1–3h range; expect another60–90m for Linux validation and guarded operations.

## Ubuntu validation checkpoint

- Candidate94a7fb5: schema31→32 applied twice to a live read-only copy; all187
  existing application tables retain every rowid and field. New3tables empty,
  all6immutable/retained triggers present.
- Initial combined Ubuntu run deliberately stopped after845.3s:82passed,2failed,
  10cancelled remaining file tasks,4external-receiver fixtures skipped. Cash and
  trade process cases failed only at the60s fixture observer (`until`); the blocked
  case passed176.96s. Original log is retained in the isolated stage.
- An active disposable fixture showed third-session research progressing, prior
  executions complete, no errors or hold, and88.7%CPU. Unchanged cash locally passed
 38.44s. Full retained evidence is materially slower on this Ubuntu host.
- Test-only Linux observer deadlines become180s for process cases and the new
  five-session successor, with per-stage/failure diagnostics for process cases.
  Production deadlines, budgets, clocks, retries and functional assertions are
  unchanged. No60sLinux performance claim. Targeted Ubuntu reruns must pass.
- Final deployment scripts include stopped/quiescent backups, exact artifact and
  verifier hashes, stale-SHA fenced startup, unchanged old custody, generation2
  receipt/current-watermark reconciliation and a new private restart directory.
  Fresh keys stay private on HQ. Independent recovery/security reviews found no
  remaining code blocker; operational proof is still pending.
- Revised remaining estimate30–45minutes for focused Ubuntu validation and guarded
  operations. Production remains unchanged at this checkpoint.
