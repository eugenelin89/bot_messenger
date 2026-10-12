# Execution Plan — HQ-READY-03F bootstrap compatibility

**Status:** Offline implementation, validation and independent acceptance complete; final Git integration tracked in the PR/handoff

**Owner:** Parent Codex, sole implementation writer; read-only specialist reviewers

**Branch:** `codex/hq-ready-03f-bootstrap`

**Worktree:** `../bot_messenger-hq-ready-03f`

**Started:** 2026-10-12 America/Vancouver

**Initial ETA:** 60–90 minutes

**Current ETA:** Git integration and synchronization remain; approximately5–10 minutes

## Objective and scope

Investigate pinned yfinance1.7.0 bootstrap semantics, correct only a supported compatibility
mismatch with authored offline tests, obtain independent architecture/security/recovery/acceptance
review, integrate a scoped PR and prepare one later owner-approved AAPL proposal. No Yahoo I/O,
new live authority, employee inference, production, trading, publication or Asymmetri changes.

## Relevant instructions and invariants

Read AGENTS.md, product/architecture context, investment decisions/roadmap/simulation rules,
Decisions029/032/037–041, Yahoo runbooks and HQ-READY-03 through03E acceptance.
Base main fetched clean/synchronized at `2bca0e7db3d2acb54db45219b8f03684c4d335ee`.
Preserve all historical records, issuers, manifests and no-replay fences. Decision037 stays4/4.
Hash only the17 retained non-data03B/03D/03E files before/after; never recover deleted payloads.

## Implementation and validation

1. Compare requested upstream tag source with installed pinned wheel; inspect issue2456 as
   historical evidence only. Document actual cookie/crumb/fallback/status behavior.
2. Add a fixture-only compatibility profile through existing gateway/transport/adapter.
   Keep status404; allow only exact parameterless cookie operation, explicit minimal plain-text
   response forms and a newly received usable anonymous cookie. Unknown/barrier responses stop.
   Do not fake Python cookie state or broaden legacy live custody.
3. Exercise real pinned Python with authored HTTP, six actual requests, cookie/crumb failures,
   barriers, budgets, spacing, provenance, no-lookahead and cancellation/recovery regressions.
   Separately document upstream's unsupported no-crumb/fallback behavior using offline sessions.
4. Freeze source; run focused tests, typecheck/build, contracts and serial full regression.
   Resolve independent architecture/security/recovery/acceptance findings.
5. Commit acceptance and exact future proposal, open PR, verify reviewed head, merge and
   synchronize/rebuild main. Stop without preparing or executing any live probe.

## Evidence ledger

| Check | Result |
| --- | --- |
| Git preflight | Clean synchronized base verified; isolated branch/worktree created |
| Upstream source | GitHub tag data.py equals installed wheel byte-for-byte; SHA256 `5f41a4cec99d50be3a13c8ae5f2674e1b5e1582be1a861fcdbb57bba783629da` |
| Architecture investigation | Confirms mismatch; requires narrow verdict, actual cookie, unchanged legacy custody and upstream-only fallback tests |
| Frozen implementation | `d6a6fcbe5ab026db259a747a16c6765abffcd7a6`; source/build manifests verify |
| Authored compatibility | Final68/68 pass, focused250/250 pass; actual pinned library emits six calls and21 fictional bars |
| Preserved authorities | All17 retained non-data hashes equal;03B/03D/03E non-resumable, capsules absent |
| Independent reviews | Architecture/security/recovery/acceptance accept frozen source; no material findings remain |
| Typecheck/contracts | `npm run check` passed; contract generation check/build/175 tests passed with no failures/skips |
| Full serial regression |1561 tests:1555 pass,0 fail,6 existing environment skips;604.284s; no Yahoo I/O |

## Remaining work

Commit the completed acceptance/proposal/docs, verify their frozen acceptance review, open a
scoped PR and verify its exact head. Merge the accepted changes and synchronize/rebuild main;
the PR and final handoff provide immutable Git outcome SHAs without self-referential commits.
No live proposal preparation or execution follows. The original60–90 minute estimate did not
expand; review fixes and full regression fit within it.
