# BotSquad Investment — authoritative status

Audit date: 2026-10-14. **PARTIALLY OPERATIONAL.** Initial HQ evidence was captured at 19:23–19:25 UTC; the post-cutoff checkpoint is 19:32:48 UTC. Website observations are 19:25:03–19:27:01 UTC. Later checkpoints, when present, supersede these observations explicitly. All times are UTC unless marked Vancouver (UTC−07:00 on these dates).

The process is healthy and real research has run. A genuine employee proposal → independent review → submission has not completed. Initialization is preserved; no portfolio trade has occurred. The deployed scheduler has a specific next-day admission defect described in [readiness](OCTOBER-15-READINESS.md). Source tests and a merged change do not establish deployment or genuine acceptance.

## Evidence and identities

| Item | Exact identity / evidence |
|---|---|
| HQ live source | `846d2220791a6f1d89732a458e3521341b61f9a1` (PR #98); schema 29; PID 868817; started17:44:57; runtime ready |
| Main at audit start | `629358968eba8701daf1c43d531c3665bf15d97d` (PR #99 documentation); no runtime difference inferred from merge alone |
| Audit branch | `codex/investment-audit-20261014`, isolated worktree; historical runtime checkout `codex/inv-real-01` is preserved; owner transferred coordination to this audit chat |
| Private run | `observed_f78ef11e-88dd-45fe-ba47-ac6694ed184f` |
| Configuration hash | `6325475ddff642609f324a90b2053c7161e9c8a9acb9206147edb2722ae71a7e` |
| Initial audit head | version 5, `4da55bb215c9fdbba18cbf6bcd586beefc6c62cef6d76963257a67bb1ee9b380` |
| Active successor scope | `68ab0223-32b5-4a02-a7aa-a70ee9bc20dc` |
| Independent authority | `observed_recovery_ce449d62-bc45-416a-af72-6e1a06bd100a`; control revision77; expiry2026-10-15T23:40Z |
| Active loop | `6a8ca917-3dec-414e-ad33-a31eea6cb194`; generation 2, plan 2 |
| Original scope | `35226635-d0dc-4d6e-8c51-f90e7efb3894`, revoked; original loop stopped, retained |
| Public experiment / run | `16496aa38732845beeea0a75f4614b93136be792accbb4e0` / `0f6ea49caee91243f2f028a8ddde55abaa68faaaa2de453c` |
| Public config hash | `4658b4d6b435595e6ab15151713eb6a284d7ea29217d6786120868963da52fe3`; public projection identity differs from private config intentionally |
| Website | `e13a4ffea660fd8448e2b46f378d1d421cf652f5`, build`L7Kf_x7BQ5EzPAWBXdBxD`, PID 2416842, started17:47:54 |
| Investment receiver | `7dcbf3bea400f6a71d01927bc174d97692ee4e78`, PID 2414008, started16:02:27 |
| Ask receiver | `6a194f040b70714de3b1281de5b58c1b8ad29579`, PID 2407630, started05:29:56; public admission disabled |
| Ingress | `8a539d1dc48caeab35364e187830e2a9bca853d8`, PID 2375255, started2026-10-13T17:08:43 |

Primary evidence: [HQ initial](evidence/hq-1926.json), [verified inventory](evidence/inventory-verified.json), [post-cutoff](evidence/hq-after-cutoff.json), [host metadata](evidence/host-metadata.txt), [independent website packet](evidence/website-owner-packet.txt). The initial HQ filename is a collection label; its `checkedAt` is authoritative. `inventory-initial.json` contains an invalid first hash check against raw text; the corrected canonical JSON-string calculation in `inventory-verified.json` verifies all nine evidence hashes. That diagnostic is not evidence of production corruption.

## Component acceptance matrix

“Synthetic” means authored fixture behavior, including real local SQLite/HTTP where documented. “Genuine” means actual provider or market work. “Production verified” states the observed operation, never a blanket certification.

| Component | Implemented | Synthetic tested | Genuine tested | Deployed | Production verified / remaining gap |
|---|---|---|---|---|---|
| HQ, database, dispatcher | Yes | Yes, extensive retained acceptance | Yes, genuine employee executions | Yes | Health/database/dispatcher ready, SQLite quick check ok/FK0; full disaster restore unverified |
| Eight employee identities | Yes | Roles/tools tested | Execution history present; all-role genuine acceptance not re-probed | Yes | All enabled/idle; this run grants only Atlas and Maya investment roles |
| Codex finite routing | Yes | Admission, isolation, recovery tests | Seven turns, six complete usage records | Yes | Three fresh recovery turns complete; historical Maya gap retained |
| Yahoo research | Yes | Normalization, limits, one-use custody | Nine actual requests, seven bars per security | Yes | Historical Oct 5–13 observations; no Oct 14 fill qualification in morning data |
| Typed proposal/review/submit | Yes | Tool/ledger and discovery tests | **No completed live chain** | Yes | No formal decision as of cutoff; handoff fix deployed17:45, not genuinely exercised afterward |
| Paper fill/accounting | Yes | BUY/SELL/HOLD, risk, replay, actions | Initialization only at initial checkpoint | Yes | Cash100000/positions empty/orders empty; actual-market fill acceptance absent |
| Benchmark and valuation | Yes | Authored opening/closing/action paths | Initial snapshot only before close | Yes | Genuine scheduled close outcome must be checked separately |
| Finite scheduler | Yes | Multi-session/recovery tests | Morning and recovery research, cutoff | Yes | Oct 15 rolling start defect; PR #100 correction merged; approved deployment preparing |
| Publication and receiver | Yes | Signed HTTP, idempotency, restart tests | Actual initialization/status/amendment events | Yes | Source8/journal 1/no gaps; eight hashes preserved; no live decision/fill projection yet |
| Trade UI | Yes | Browser/layout/helper tests | Actual live archive reads | Yes | Truthful unavailable performance; desktop/mobile release evidence; no new screen-reader certification |
| Ask BotSquad | Installed, isolated components | Prior authored acceptance | No genuine answers | Closed deployment | Public disabled; zero questions/claims/answers/keys; owner pause remains in force |
| Continuing daily operation | Bounded sessions only | Finite successor scenarios | Not proven | Through Oct 15 only | Ordinary same-portfolio renewal rejects retained incomplete history; reviewed policy/code and new authority required after expiry |

## Roster and execution meaning

Atlas (CEO), Maya (Product Manager), Turing (CTO), Ada/Linus (Engineers), Grace (Independent Reviewer), Nix (DevOps), and Scout (Market Researcher) are durable workers using `codex-app-server`. Historical completed execution counts in the database are Atlas27, Maya8, Turing7, Ada2, Linus2, Grace2, Nix25, Scout2; Atlas also has one failed execution. Counts establish connected execution history, not competence in every listed capability. The audit did not spend new turns probing every role.

For this investment scope Atlas proposes/submits/facilitates/synthesizes and Maya independently reviews. Generic staff titles do not grant investment authority. Unassigned staff cards are not evidence of extra active research. Tools are constrained by actual execution origin, scope and role.

## Documentation reconciliation

The requested `docs/operations/INV-REAL-01-PAPER-HANDOFF.md` does not exist. Its authoritative location is [validation/investment/INV-REAL-01-PAPER-HANDOFF.md](../../validation/investment/INV-REAL-01-PAPER-HANDOFF.md). Historical sections in README/AGENTS/architecture describe earlier source-only milestones and must not override live receipts. Current navigation is updated by this audit; historical decisions and validation failures remain preserved.

See [workflow](INVESTMENT-WORKFLOW-AUDIT.md), [architecture](ARCHITECTURE-AUDIT.md), [findings](FINDINGS.md), [costs](COST-AND-CAPACITY.md), [next session](OCTOBER-15-READINESS.md), [roadmap](ROADMAP.md), and [owner summary](EXECUTIVE-SUMMARY.md).

## Coordination correction discovered19:45UTC

The owner stopped the former15-minute chat automation and transferred HQ coordination to “V - Audit BotSquad operations” in direct messages to the prior chat. [Exact handoff](evidence/coordination-handoff.json) supersedes initial audit/website assumptions about that heartbeat. Server-side investment scheduling remains active; no replacement chat automation is created.

The scheduler correction merged normally as [PR #100](https://github.com/eugenelin89/bot_messenger/pull/100), `0fabbbac0a1bb8e180556bcbe837076ca341f9c3`, with authored acceptance and independent review. It is not yet deployed. The owner explicitly approved its guarded deployment in this audit chat; staging and preservation review are in progress. The restart is planned after the close stages settle.
