# Execution Plan — Worker Empowerment 01

**Status:** Complete: all six gates passed, accepted application merged/deployed/verified
**Owner:** Codex task `01a0f625-65b7-7d70-aa35-152913df3147`
**Branch:** `feature/worker-empowerment-01`
**Worktree:** `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger-we01`
**Started:** 2026-10-01 UTC (September 30 Vancouver)
**Initial ETA:** 8–12 hours including Ubuntu acceptance, review and deployment
**Latest ETA:** 30–60 minutes remaining at 08:04 UTC; application verified at 08:09 UTC, then documentation closure

## Objective and ownership

Deliver real public research in existing conversations and delegated Tasks, explicit
standing authority and scoped company-document reading. WE-01 is a Decision 019 follow-up;
Prompt 08 remains next, followed by 09 scheduling, 10 Computer Use and 11 operations.
No business publication, outreach, purchases, additional paid provider or host expansion.

Fetched origin/main is `c6a65aeb44a7e49db763bf862390d434bcd7333c`.
The main checkout remains at `542a867`; other audit, Prompt 07 and empowerment-docs
worktrees are preserved. GitHub reports no open PRs. No other active BotSquad writer
was found in the app inventory. Local `gh` is unavailable; GitHub connector is available.

## Current host evidence

Read-only inspection: Ubuntu HQ active, runtime ready, loopback 4310, deployed/running
revision `2ef552af797a3fe150b990d4127d499bdc519ac2`, Codex **0.157.0**. The actual
retained data root is `/var/lib/botsquad`. **Dispatch is unpaused**, unlike the old
report. All 43 Tasks are terminal (26 completed, 17 cancelled), no active execution;
seven workers, 58 executions, seven task bindings, one conversation/session, five
completed replies, 63 legacy messages and ten artifacts. Preserve actual state.
No production validation work or standing grant has been created.

## Reading and implementation investigation

Applicable AGENTS, README, PROJECT_MEMORY, product vision/model/single-company/roadmap,
milestone requirements, Decisions 015–019, architecture/continuity, operations/access/
multiple instances, API v1 and Prompt 07 plan/report reviewed for changed boundaries.
Pinned binary experimental schemas generated into `/private/tmp/botsquad-we01-schema`.
Official app-server/config documentation consulted, but matching schemas and live
runtime probes govern implementation. Public source tag fetch returned 404; do not
claim matching source inspection. Generated schema supports live/cached/disabled
search, domain configuration and webSearch items with optional structured results.

Existing dynamic tools are synchronous and fixed at thread creation. Existing
conversation rollover supplies compatible generations; task bindings cannot be
implicitly overwritten. Native worker tools remain disabled. A minimal unauthenticated
DuckDuckGo HTML readiness probe returned 202/challenge with zero results; no bypass
attempted. Native isolated live search succeeded against the existing account in a protected Ubuntu probe. This is provider readiness evidence, not worker acceptance.

## Design gates

- Separate implemented capability, provider readiness, owner grant, eligibility, work
  scope and outcome. No grants from names, titles, messages, migrations or managers.
- Persist grant issuer, version, resource/mode scope, limits, expiry and revocation.
  Public research and approved internal documents remain separate.
- Explicit promise-capable callback contract; atomic reservation then bounded I/O
  outside transactions; current ownership/grant validation before delivery.
- Durable attempts and receipts, duplicate-call handling, revocation/cancellation,
  restart recovery and shared runtime uncertainty fences.
- Isolate outbound public briefs from private runtime context. Source snippets,
  retrieved text, provider summaries and model recommendations must be distinguishable.
- Preserve task/conversation identity, old session provenance, API v1 privacy and all
  engineering/infrastructure boundaries. Grant changes cannot erase budget usage.

## Implementation and numerical limits

Selected one isolated Codex live-search broker on the existing account, with only the
public query (500 characters) and current UTC time. General native tools, MCP, account
integrations and local execution remain disabled. The parent occupies the shared
execution slot throughout its awaited broker call. Native provider search/open/find
is opaque; BotSquad does not claim to enforce its internal request count or DNS rules.
Managed page opening uses pinned validated public DNS, HTTPS GET, normal TLS checks,
no cookies/auth/proxies, three redirects, 1 MiB identity responses, 15-second total
fetch timeout, static extraction and a 24,000-character retained excerpt.

Standing public and knowledge grants are separate owner operations, explicit worker
IDs, policy-versioned, revocable and optionally expiring. No migration enables grants.
Eligibility is trusted role/capability policy; source histories are worker/work scoped.
Attempt budgets: 32 calls and eight broker invocations per work scope, 120 calls per
worker UTC day, 12 calls per minute, 90-second broker deadline plus bounded interrupt,
16,000 serialized result characters, 160,000 aggregate work output, 6,000-character
source slices, 10,000-character document excerpts (shortened for serialization), at
most 12 sources per lookup. Delegated research shares the root Task budget. Grant
replacement and context replacement do not reset attempts. Global evidence ceiling:
20,000 operations before operator retention review. No monetary totals invented.

Schema 9 retains grants, operations, sources and task research-session lineage.
Compatible conversation replacement uses existing generations; affected task workers
receive a separate research binding preserving the old binding. Async callbacks reserve
before I/O, recheck ownership/authority before delivery and prevent premature completion.
Independent broker uncertainty survives a settled parent and blocks further work.
Browser owner controls support separate activation/revocation and source inspection;
API v1 grants no new capability and research audit events stay outside device projections.

## Progress and review evidence

- Baseline suite: 158 passed, one Linux-only skip. Outer sandbox confinement failure
  retained separately; escalation runs the existing nested-confinement tests normally.
- Provider readiness: protected Ubuntu unit `botsquad-we01-provider-probe-2` completed
  in 17.55 seconds; actual structured Environment Canada URLs returned. Stale search
  snippets led to a live page read; observation and retrieval time remain distinct.
- Protected SQLite backup/inventory: `/var/backups/botsquad/we01-20261001/`, consistent
  backup API, mode 0600; 28 database files, 354 root records and 105 worker homes.
- First focused integration suite passed 49/49. Read-only reviewer found five defects:
  further lookup after broker uncertainty; old source IDs outside latest 24; source-list
  output limit bypass; lost confirmed parent settlement during callback drain; cross-store
  call-ID reuse. All five patched with targeted regression tests. Follow-up focused tests passed 28/28; independent re-review confirms all five fixes
  and found no additional material defect. Final accepted-revision review remains open.
- HTTP tests inside the outer sandbox failed to bind loopback (EPERM); no assertion
  weakened. Full suite runs with the established escalated test boundary.
- Full local suite: 178 passed, one Linux-only skip (179 total). Initial full run
  exposed four old schema-version assertions and one test expecting a route denial
  before the existing browser-header denial; corrected those expectations and added
  authenticated device route/DTO/event privacy coverage. Enforcement unchanged.
- Browser: existing conversation/draft/history checks pass 2/2; new separate grant,
  research reply, safe source inspection and revocation check passes 1/1. First source
  inspector assertion raced its loading state; wait for actual source response added.
- Live pre-grant conversation and Atlas → Scout internal Task passed. Actual weather
  conversation passed after UI grants: Environment Canada 11.4°C/cloudy observed 07:00 UTC,
  fetched 07:19:41 UTC, no Task; native stale snippets were superseded by a managed live read.
  Delegated public research is running; other live gates remain open.
- Offline migration 8→9 and repeated opens preserved 1,756 original rows/fields/rowids
  across 53 tables, with integrity/foreign keys and zero implicit grants/activations.
  No production grant or retained domain mutation.

## Acceptance matrix

| Gate | Required evidence | Status |
| --- | --- | --- |
| WE01-1 | Actual Atlas conversation, live Vancouver weather, observation time/source, no Task | Passed candidate eb96508 |
| WE01-2 | Actual delegated non-weather multi-domain research and supported artifact/report | Passed candidate eb96508 |
| WE01-3 | Repeated grant use; missing/revoked/expired/self-grant denials; document scope | Passed tests + actual UI/worker use and revocation |
| WE01-4 | Source failures/stale data/limits and synthetic network/injection boundaries | Passed deterministic boundaries + real recovery/fixture response |
| WE01-5 | Real rollover/restart, async ownership, retries/revocation/cancellation/budgets/idle | Passed: rollover/restart/idle/in-flight crash plus deterministic async/limits |
| WE01-6 | Full checks, browser/Ubuntu regressions, independent review, merge/deploy/preservation | Passed; PR #5 deployment checkpoint d6463fb |

## Sequence and remaining gates

1. Establish transport viability and provider boundary; preserve failure evidence.
2. Implement grants/evidence/reservations, async runtime, scoped tools and compatibility.
3. Add browser-only owner controls/source inspection and precise API privacy tests.
4. Protected consistent retained backup/inventory and offline migration/repeated-open.
5. Fresh Ubuntu validation under inherited service restrictions and unused loopback port.
6. Separate read-only security/recovery review; fix findings and rerun affected checks.
7. Current docs, Decision 020 (if still unused), validation report and tutorial.
8. Normal PR/merge/push, exact-revision deployment and running-build verification;
   preserve actual pause state, inactive production research grants and close validation.

The retained company must receive a clear one-time owner activation control; authorized
development and isolated validation do not themselves activate production grants.

## Live acceptance progress at 07:29 UTC

Useful delegated research passed: Scout chose GitHub, Linear and Sentry, read multiple
actual domains, saved an evidence-qualified report, and Atlas evaluated it. A known broker
timeout, 404 and inaccessible support route were handled without provider uncertainty.
Atlas actual context replacement preserved source ID/hash/timestamp and read README
under its separate knowledge grant, without refreshing public sources. Real Scout then
attempted both lookups in the clearly labeled isolated outage fixture and reported no
retrieved facts; no query/page request was transmitted by that fixture. Browser revocation
was followed by a real denied Atlas tool attempt, verified in conversation_tool_rejected
audit, with the extended schema still present. Real Linux lost-response recovery passed.

The native source collector now retains a bounded rolling set so late opened sources are
not discarded after 48 early search results. A dedicated protocol test confirms the final
source survives; first fixture attempt used a noncanonical macOS temp path and correctly
failed workspace validation, then canonical-path correction passed. Four explicit durable
budget tests and a hostile-source/private-query boundary test were added. No enforcement
was relaxed. Restart will exercise the next committed candidate; final checks remain open.

## Candidate 05ce3e2 follow-up at 07:39 UTC

Latest full suite: local 184/185 with one Linux-only skip; Ubuntu 185/185 under service
restrictions. Final read-only review found no material findings. Browser regressions total
five passed (research, two conversation, device pairing and protected-approval stability).
Actual restart compared all relevant rows/DTOs exactly and resumed Atlas's knowledge-only
conversation with public revocation intact. Normal Scout search recovered; two real Python
page 503s were reported honestly and retained as a failed page-read acceptance attempt.
A bounded alternative fetched official PostgreSQL documentation successfully. One passive
message plus 30 seconds of idle research HQ produced zero model/research work or Tasks.
An independent engineering regression was starting during that interval; host-wide idle
is not claimed. Real engineering/UID regression is running; Projects remains next.

Source bodies and raw contexts are excluded from the public evidence export. Actual UI
screenshots, metadata/hashes and worker-authored synthesis are in `docs/validation/evidence/we01`.
The remaining work is an in-flight research crash/recovery probe, existing real engineering/
Projects regressions, normal integration/deployment and final preservation/cleanup.

At 07:50 UTC the immediate-stop in-flight crash probe passed: unknown broker receipt,
interrupted parent/blocked reply, preserved prior records and no automatic replay.
The first manual crash had missed the active interval and remains a recorded failed
probe. Engineering first run hit the unchanged four-minute model deadline; a fresh
unchanged retry is running with the original failure retained.

At 07:54 UTC the unchanged fresh engineering retry passed integration, exact review,
restart and 100 harmless UID isolation probes, including retirement/process kill.
Real turn overlap: 41,938 ms. Projects validation is running with its established
operator probe companion. Final read-only evidence/security audit found no new issue.

At 08:00 UTC real Projects passed staged recovery, revision/re-review, integration,
remote reconciliation and archive with 100 UID probes plus four archive-denial checks.
A final fresh legacy Task hire/research/resume/interruption regression is running.
Deployment preflight passed; unchanged host/runtime configuration allows the established
application update stages without unrelated pending OS package upgrades.

At 08:02 UTC the fresh legacy Task regression passed real hire/artifact/evaluation,
restart/resume and confirmed interruption. All pre-merge gates and independent review
are complete. Remaining work: normal PR merge, exact-revision application update,
production browser/build/preservation verification and final documentation closure.

## Accepted delivery checkpoint — October 1

PR #5 merged normally at `d6463fbee0e3459c81c636818f0c86acba482ddb`. Local main,
origin/main, deployed source and running health matched exactly. The deployment suite
passed 185/185 again; actual browser controls, runtime readiness and all 81 compiled/public
file hashes matched the local build. Retained comparison passed 18,400 original rows in
28 databases, 213 account/group mappings, 354 root records and 105 worker homes. Actual
dispatch remains unpaused, with no runnable work and zero new standing grants.

The research validation unit is disabled/stopped, all regression processes completed,
and its temporary 4311 tunnel is closed. Evidence, backup and worker homes remain. The
production 4310 tunnel was left in place. The external GitHub Codex review bot could not
run because its review quota was exhausted; the separate read-only reviewer completed
code/security/evidence review and all five findings were resolved before merge.

A documentation-only closure PR records these observed results and clarifies that Scout
is not yet in the retained roster. Its final revision will be deployed and reverified
without changing the accepted application tree. Prompt 08 remains next.
