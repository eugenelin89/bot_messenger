# Execution Plan — UX-01 HQ redesign

**Status:** Complete
**Owner:** BotSquad coordinating chat `01a14366-8ccb-72d2-a850-0c584c72ca39`; sole implementation writer  
**Branch:** implementation `codex/ux01-hq-redesign`; completion `codex/ux01-completion`
**Worktree:** `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-ux01`  
**Started:** 2026-10-15 America/Vancouver  
**Initial ETA:** 4–6 hours including independent reviews, browser acceptance, documentation and release.  
**Completion:** October 16, after final HQ and website activation/readback. Initial ETA was 4–6 hours; the final stage included correcting isolated test prerequisites and a production-discovered Home preview refinement.

## Objective and scope

Make HQ understandable to a beginner while retaining every existing workflow and exact operational evidence. Ship the UI and synchronized tutorials together. The owner's UX-01 brief and subsequent overnight authorization cover local/Ubuntu implementation and guarded deployment. This creates no additional runtime worker, investment or Ask authority.

## Boundaries

No backend/domain/schema change is planned. Preserve tasks, employee identities/portraits, permissions, exact approvals, provider fences, schedules, investment records and publication. Ask remains owner-paused; no eligibility probes or API spending. No production demonstration, fabricated progress, or automatic retry. Specialists are read-only; existing Asymmetri owner retains website ownership. Coordinate final deployment; avoid interrupting active investment work.

## Current source and evidence

- Baseline `7341ff09dc2e58e6ab8aab66c80e590cde58b2c1`, fresh `origin/main` in isolated worktree; unrelated checkouts untouched.
- Live read-only audit: source checkout `7341ff0`, running backend `dccf209`, PID `905617`; health/database/dispatcher ready. Static timestamp update intentionally did not restart backend.
- Live aggregates: eight employees, 30 completed/17 cancelled/one blocked Tasks, 84 completed/two failed/one approval-wait work sessions, 12 results, six Projects, two actionable blocked items. No running work session at that observation; it is not a claim that schedules are stopped.
- Isolated pre-change browser audit: all 14 shell views rendered, zero page errors, writes or model calls. Baseline captures in ignored `.validation/ux01/` use fake-runtime sample data.
- Asymmetri and public Trade owner chats notified directly; no relay required from owner.

## Steps

1. [x] Source/runtime audit and read-only specialist audit.
2. [x] Review concrete IA/design/feature-preservation proposal before implementation.
3. [x] Navigation + Home; verify truthful current/completed/attention states.
4. [x] Task creation/details, Activity, Team profiles and advanced evidence.
5. [x] Remaining surfaces, accessibility and investment navigation consistency.
6. [x] Update authoritative tutorials/help and capture actual sample UI screenshots.
7. [x] Browser/integration/regression tests and independent final review; resolve findings.
8. [x] PR, merge, guarded release, production readback and tutorial verification.

## Validation

TypeScript build, JS syntax, diff check; isolated real HTTP/UI with fake runtime for all core journeys and authority-preservation assertions. Browser tests explicitly invoked (ordinary npm test excludes them). Retained production records and read-only UI checks establish actual operation, separately from simulated task completion. No real participant study is available: label the usability evaluation as structured heuristic review. Verify focus, keyboard, contrast, responsive widths, text scaling, errors/reconnection and disclosure. Preserve historical evidence instead of rewriting it to look current.

## Review and evidence ledger

Initial architecture and acceptance specialists identified completion-vs-turn semantics, unknown execution origins, stale attention, profile runtime dependency, contrast failures, focus loss and outdated tutorials. Proposal and dispositions live in `docs/ux/hq-redesign/`. Final exact source/build/deployment identities belong in RELEASE-REPORT.md. Do not mark complete before release and documentation verification.

## Implementation review update — October 16

Navigation, Home, task flow, profiles, meaningful activity and investment orientation are
implemented. Existing controls have contextual homes and the authoritative tutorial now
uses a supplied-text summary. All captures are actual UI with labelled synthetic records.
Final review found and resolved: task confirmed but refresh failed; stale employee profile;
Home subset count terminology; exact investment review disposition; contextual Back history;
and delayed result/usage ownership. Focused 23/23 tests passed before final contrast tweaks.
At that review checkpoint, the complete unit suite and serial browser regression were
still in progress; their final results are recorded below. Initial browser
failures were stale selectors/moved controls plus the confirmation recovery edge; none are
silently waived. At that checkpoint, the Asymmetri owner was updating its guide and holding activation for HQ.

## Release acceptance — October 16

PR110 and PR111 merged; static source 8078a3434f455c73017c04178e8f9f6ba51defe3 deployed
without backend restart or pause. Final browser 83/83, docs 2/2 and 863 contrast samples pass.
Both releases preserve 188 table counts/content hashes and PID 905617/backend dccf209.
Initial asset permissions were corrected before acceptance; the repeat deployment uses
the corrected umask. Final production desktop/phone walkthrough passed with retained
genuine results and zero writes/probes. Complete backend 2,358-test run and targeted
33/33+86/86 reruns leave one reproduced baseline publication-age fixture failure and
eight explicitly unconfigured/platform skips; this is accurately documented, not waived
by altering policy. All material specialist findings are resolved. Final Home previews
were independently reviewed and their complete Task text is regression-tested. Website
owner deployed source e9b5ab1/build rrTJaSzqUzeWpt2fGqrCH at 07:58:47 UTC. Its six-width
readback, 22 regressions, 12 candidate routes and 15-table preservation pass. Parent public
readback confirms all five image hashes, desktop/mobile reflow and no browser errors.
The final documentation-only PR records these receipts; UI source remains 8078a34.
