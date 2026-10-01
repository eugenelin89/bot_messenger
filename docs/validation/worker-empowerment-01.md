# Worker Empowerment 01 — Validation and delivery

**Status:** All pre-merge acceptance and review checks pass. Normal integration and
retained-HQ deployment/preservation remain open.

This is the Decision 019 follow-up WE-01, not Prompt 08. The
[execution plan](../exec-plans/worker-empowerment-01.md) tracks remaining work, and
[Decision 020](../decisions/decision_020_scoped_public_research.md) defines exact bounds.

## Candidate and environment

Implementation candidate `05ce3e2183a150ffac6126ed32327c7a3cbd37d9` and subsequent
test/harness/evidence commit `a9a241e` are on the owned `feature/worker-empowerment-01`
branch, based on `c6a65ae`. Runtime source/public assets are unchanged after `05ce3e2`.
Fresh validation HQ: `/var/lib/botsquad/validation/research-20261001-we01`, loopback 4311,
unit `botsquad-research-validation.service`, source `/opt/botsquad-research-validation`.
HQ identity `hq_1f8daefb-bd16-4dad-a88d-075e581bf3e7` was checked against the copied
roster/data-root manifest before browser interactions and is distinct from retained HQ.
The validation service inherits production confinement and uses the existing account;
a separate data directory/port is not a separate Unix credential boundary.

Roster setup is explicitly a trusted fixture, with one cancelled setup Task and no
model invocation. Actual worker turns use advertised `gpt-6-sol`, low reasoning, locked
profiles and pinned Codex 0.157.0. Answers and research conclusions are not scripted.

## Acceptance gates

| Gate | Status | Evidence |
| --- | --- | --- |
| WE01-1 Current weather conversation | Passed on candidate | Actual Atlas lookup, observation/source verified, no Task created |
| WE01-2 Useful delegated public research | Passed on candidate | Actual Atlas → Scout → Atlas report on GitHub, Linear and Sentry |
| WE01-3 Standing authority/knowledge | Passed on candidate | Tests plus real separate browser grants, repeated use, README read and denied revoked tool call |
| WE01-4 Failure/network boundaries | Passed on candidate | Synthetic boundaries plus real timeout/page-error recovery and labeled outage limitation reply |
| WE01-5 Async/continuity/budgets | Passed on candidate | Actual replacement/restart/idle and in-flight crash recovery, plus async/budget tests |
| WE01-6 Regression/delivery | Open | Local/Ubuntu suites, engineering/Projects and independent review pass; legacy Task passes; integration/deployment pending |

## Completed checks and meaningful failures

- Latest local type check and full suite: **184 passed, one Linux-only skip (185 tests)**.
  Baseline before implementation was 158 passed, one Linux-only skip. Earlier candidate
  passed 178 plus one skip; six additional source-collection/budget/privacy tests now pass.
- Browser: existing direct conversation, draft/history isolation tests **2/2**; new
  separate public/knowledge grants, sourced reply, safe links, source inspector and
  revocation **1/1**. These use a labeled synthetic provider, not live research proof.
- Latest Ubuntu full suite under inherited service restrictions: **185/185 passed**, no skips;
  includes the Linux-only heap/filesystem confinement check. Protected evidence:
  `deterministic-we01-20261001T073228Z`, exit code 0. Earlier candidate passed 179/179.
- Separate read-only review found five material issues: uncertainty did not stop the
  next call in the same execution; old source IDs fell outside latest-24 retrieval;
  source listings bypassed serialized bounds; known parent settlement could be lost
  while awaiting callbacks; call IDs could cross the ordinary/research receipt stores.
  All fixed; focused rerun **28/28**, and re-review found no further material defect.
  A final read-only acceptance audit of candidate `05ce3e2` plus the evidence/harness
  changes found no additional material requirement gap or misleading security claim.
- Public network tests use injected isolated responses/DNS, never real protected
  destinations. They cover private/special IPv4/IPv6 and unusual encodings, mixed DNS,
  pinned sockets, every redirect, credentials/control endpoints, unsafe schemes,
  TLS/GET settings, compression/content type/size bounds, rate limits, outage, cancellation,
  stale source content and malicious instructions treated as data.
- Control tests cover no implicit grant, self-grant rejection, separate document scope,
  expiry, policy ceiling, worker eligibility, cross-conversation privacy, duplicate calls,
  revocation/cancellation during I/O, output/rate/day/work budgets, compatible bindings,
  and independent broker uncertainty after parent settlement/recovery.
- Device tests use a genuinely enrolled device: no research management/history route,
  no new capability/DTO field and no research event payload. Browser authorization
  rejects device credentials, forged owner fields/tokens and foreign origins.
- Outer sandbox runs initially failed on nested confinement or loopback binding (EPERM).
  The established escalated test boundary passes; no enforcement assertion was weakened.
  The first full implementation run exposed four old schema-version expectations and
  one denial-order expectation; schema-9/403 expectations corrected with additional
  authenticated device tests. Initial source-inspector browser assertion raced loading;
  it now waits for actual source content.
- The first live browser harness missed the existing **Assign objective ↗** arrow in
  its exact selector. No Task was submitted. The already-completed real conversation
  and failed log were preserved, then the harness resumed at Task submission.

## Provider readiness versus worker acceptance

Generated experimental schema from the installed 0.157.0 binary supports native
live/cached/disabled search and structured webSearch results. Official documentation
was consulted; a matching upstream source URL returned 404, so matching source inspection
is not claimed. A credential-free search-page probe returned a bot challenge; no bypass.

The separate protected native provider readiness probe completed in 17.55 seconds using
the existing account. It encountered stale snippets and opened Environment Canada,
returning actual URLs and a Vancouver observation. That developer-operated readiness
probe is **not** WE01-1. Worker gates require actual BotSquad execution and browser evidence.

## Real current-information reply

On October 1, owner UI activated Public Research separately for validation Atlas and
Scout, and Company Knowledge for Atlas's README. Atlas's existing conversation retained
its ID and changed from provider generation 1 to 2. No Task was created by the weather
request. Actual execution `execution_75043047` (full ID retained in evidence) called
`research_search`, then `research_open` without additional approvals.

The native broker returned stale snippets and an older summary. Atlas opened the actual
Environment Canada page through the managed reader and used its newer observation:
**cloudy, 11.4°C at Vancouver International Airport, 12:00 a.m. PDT October 1, 2026
(07:00 UTC)**. Retrieval was **07:19:41.152 UTC**. The final reply explicitly separated
observation time from its check time and linked the actual accessed
[Vancouver source](https://weather.gc.ca/en/location/index.html?coords=49.25,-123.12).
The retained page excerpt independently contains the reported conditions/time; its
metadata remains `observed_at: null` because the generic parser does not infer timestamps.

Conversation `conversation_21eb2d54-4e5c-4013-a653-7a2c8efc7adc`, reply
`reply_e73ff461-cb74-4b8f-b85d-666ba9d9af64`; search operation
`research_4f549ecd-b57e-49a6-ba27-5ab62403a459`; managed read
`research_41da271a-9cde-4967-b7f2-c2df6ca348f3`; source
`source_ac31d55d-ae93-463e-b0e8-95c7e822a8a6` (7,383 retained characters).
Browser grant, reply and source-inspection screenshots were captured. This is actual
BotSquad worker acceptance, distinct from the earlier provider readiness probe.

## Useful delegated research and context replacement

Task `task_8c034906-cf51-431c-83ff-e5fd975eab23` delegated to Scout's Task
`task_322acf4b-069e-4392-8cda-e8e7a428e3b4`. The team selected GitHub, Linear and Sentry
without scripted queries or conclusions. Scout used native search to discover material,
then read actual official public pages across `docs.github.com`, `linear.app`,
`docs.sentry.io`, `sentry.io` and `www.sentry.help`. Report
`artifact_6a4dea26-7a0b-4727-ac73-48a3e629bf8b` separates retrieved facts from practical
recommendations and explicitly excludes snippet/provider summaries from factual evidence.
Atlas evaluated the report and recommended a first-value onboarding milestone, layered
information and clear support escalation. Neither signup nor support quality was claimed
to be tested. Existing Atlas/Scout Task bindings matched the pre-grant baseline exactly.

The run encountered a confirmed broker timeout, a missing Linear page and an inaccessible
Sentry support route. Scout continued within budget, found other permitted sources, and
recorded verification limits. No access-control bypass or contact occurred.

Atlas then underwent actual provider-context replacement. Reply
`reply_54fcd303-4ffe-414a-bf1e-411b7917d4ce` used `research_sources`, `research_read` and
`read_company_document` for README, with no new public lookup. Source ID, retrieval time,
SHA-256 and null observation metadata exactly matched the original snapshot. Atlas
reported the original weather observation as earlier evidence, not current conditions,
and a concise internal-document takeaway without sending the document externally.

## Outage and revocation

Real Scout attempted one search and one page read in the explicit isolated outage fixture.
Both returned `source_unavailable` without transmitting network/provider requests; Scout
reported no retrieved facts and did not retry. This tests a real worker response to
synthetic failure, not live source evidence. The fixture was then disabled and retained
as a consumed marker. The earlier substantive assignment independently encountered real
source failures and recovered through other sources.

Owner UI revoked Atlas's Public Research while retaining Company Knowledge. Atlas's
existing context still had research tool descriptions, attempted `research_search` once,
and received an actual `conversation_tool_rejected` denial. Its final reply accurately
reported that denial and did not infer weather. Audit confirmed the same provider context
was resumed. Revocation was not merely a hidden button or a model-written assertion.

Real Linux infrastructure recovery also passed: host completion before a lost response,
consumed-approval restart reconciliation, same receipt replay and changed-payload rejection.
Evidence directory: `recovery-we01-20261001T072522Z`, exit code 0.

## Retained-state preservation

Before any retained migration, a consistent SQLite backup and actual inventory were
stored under `/var/backups/botsquad/we01-20261001/` (directory 0700, backup 0600). Inventory:
28 database files, 354 root provisioner records, 105 worker homes. Actual HQ was active,
unpaused, with seven workers, 43 terminal Tasks and no running execution.

An offline protected copy migrated from schema 8 to 9 and reopened twice: all **1,756
original rows/rowids/fields across 53 tables** preserved, foreign keys/integrity passed,
zero standing grants and zero research tool activations. The copied database was never
served as another authenticated HQ. Final deployed preservation comparison remains open.

## Restart, restored provider access and idle behavior

Candidate `05ce3e2183a150ffac6126ed32327c7a3cbd37d9` passed an actual controlled service
restart. Exact before/after comparisons preserved both workers' grants, revocations and
research activity, plus Tasks, executions, artifacts, original bindings, conversation
sessions, transcript and pause state. Atlas resumed in the real provider, read README,
and public permission remained revoked. Old sources remained inspectable in the browser.

A first post-restart Scout search succeeded, but both Python page reads returned real
HTTP 503. Scout reported search recovery only and did not claim page verification. That
failed acceptance attempt is retained. A bounded follow-up selected PostgreSQL and read
its official reference page successfully at 07:34:40 UTC; Scout distinguished the verified
page fact from the unresolved Python-site outage. This exercises the later native-source
collector on the updated candidate as well as ordinary post-outage recovery.

The isolated research HQ then had no runnable work. One passive message and a 30-second
idle interval caused **zero new model executions, zero research operations and zero Tasks**.
This measures that HQ; an independent engineering regression service was starting on the
same host. It is not a claim that the entire host had no model processes.

## In-flight recovery and retained failed attempts

An initial manual crash landed after the broker and parent had already completed; it
is retained as a missed in-flight test, not counted as recovery acceptance. The next
harness stopped only the fixed isolated validation service immediately after observing
durable broker invocation intent. At **07:50:25 UTC**, restart recovered operation
`research_14d57077-575a-455b-9b66-aa9b2849951e` as `unknown`, unresolved 1, with parent
`execution_fb4a8c4a-0b2e-49fb-b230-ab226d04167d` interrupted and its reply blocked.
Prior grants, revocation and receipts matched exactly. Five seconds of observation
showed no automatic model or research replay. The intentionally unresolved fixture
remains fenced for inspection; its receipt was not manually cleared.

The first unrelated engineering regression (`identity-we01-20261001T073624Z`) reached
Maya's existing four-minute runtime deadline without further output. Its failed state
and logs are retained. The fresh unchanged retry (`identity-we01-20261001T074831Z`)
passed full engineering/review/integration/restart and 100 harmless UID isolation probes.
The actual runtime turns overlapped by 41,938 ms (execution overlap 43,613 ms). Retirement
killed the test UID process, denied its preserved home, revoked project access and
preserved history. No deadline or assertion was weakened; the failed company was not replayed.

## Broader Ubuntu regressions

The unchanged Projects scenario passed in `projects-we01-20261001T075423Z`: real
LedgerBrief work, requested revision and exact-commit re-review, all four staged
restart checkpoints, trusted integration, remote-operation lost-response reconciliation
and archive. Actual engineer turns overlapped by 18,008 ms (execution overlap 19,879 ms).
The operator companion passed 100 harmless UID checks and four archived-clone read/write
denials. Worker identities remained reusable; clones and history were preserved.

The [regression summary](evidence/we01/regression-evidence.json) includes pass/fail
results, original protected evidence paths and measured resource aggregates. It retains
the first engineering timeout. No process arguments, environment or credentials are exported.

The fresh legacy Task scenario (`prompt01-we01-20261001T080017Z`) also passed: real
dynamic hiring, Scout artifact, Atlas evaluation, pause, restart preservation, reuse of
the persisted provider binding, no replay and provider-confirmed interruption.

Deployment preflight found the production checkout clean and host healthy. OS updates
were pending; they are outside this feature update. Runtime, dependencies, service units
and privileged helper sources are unchanged, so delivery uses the established Git/build/
confined-validation/restart stages without unrelated package upgrades.

## Evidence locations and limits

Raw validation logs, recordings and screenshots remain under the ignored local
`.validation/we01-real` directory and protected Ubuntu validation roots. Export only
bounded supporting excerpts, metadata/hashes and non-secret fixture identifiers into
this repository. Do not publish complete copyrighted page bodies, account credentials,
production transcripts or provider reasoning.

Managed-fetch checks do not cover opaque provider DNS/network/cache behavior. A broker
budget counts broker sessions, not every native lookup; monetary cost is unknown. Query
minimization and injection tests are defenses, not a guarantee against all semantic
leakage. Source retrieval time never establishes observation freshness. Production grant
activation and exact local/origin/deployed/running equality will be recorded after delivery.

## Inspectable evidence

The [structured export](evidence/we01/research-evidence.json) retains fixture identities,
phase revisions, outcomes, usage where measured, public requests and source metadata/hashes.
It omits all source bodies, snippets, provider summaries, raw runtime inputs and retained
production data. The [saved Scout report](evidence/we01/scout-public-research-report.md) contains the worker's synthesis and explicit verification limits.

- [Owner public grant](evidence/we01/weather-grant-atlas.png) and [separate knowledge grant](evidence/we01/weather-separate-knowledge.png).
- [Actual weather reply](evidence/we01/weather-current-weather-reply.png) and [source inspection](evidence/we01/weather-source-inspection.png).
- [Delegated result](evidence/we01/task-delegated-report.png) and [context replacement](evidence/we01/rollover-retained-source-after-rollover.png).
- [Labeled outage response](evidence/we01/outage-honest-outage.png) and [revoked tool denial](evidence/we01/revoke-denial-after-revocation.png).
- [Evidence after restart](evidence/we01/restart-evidence-after-restart.png), [normal page recovery](evidence/we01/source_followup-normal-provider-after-restart.png), and [idle HQ](evidence/we01/idle-idle-no-work.png).

- [Unresolved broker after controlled crash](evidence/we01/pending_recovery-unknown-after-crash.png).
