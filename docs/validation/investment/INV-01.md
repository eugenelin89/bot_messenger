# INV-01 — Contracts and feasibility evidence

**Inspected:** 2026-10-08 America/Vancouver (2026-10-09 UTC). **Scope:** BotSquad contracts, offline validation and read-only feasibility; no INV-02, deployment, operational run or authority activation.

## Baseline and deliverables

BotSquad began at clean fetched main `a72cee080989960d2a9e1e74d9236157ce1a0448`. Dedicated branch `codex/inv01-contracts-feasibility`, worktree `bot_messenger-inv01`; one writer and three read-only specialists. Unrelated branches/worktrees were preserved. Asymmetri local and production both reported clean `745a92c676bcbe85c3aa675a1099d26321f1c1e2`; that repository remained read-only. Required repository/specification/ADR 027/028 and website architecture/deployment/access documents were reviewed. Current source overrides stale prose. See [execution plan](../../exec-plans/investment-inv-01.md).

Canonical [contract package](../../../contracts/investment/v1/PROTOCOL.md): JSON Schema 2020-12, OpenAPI 3.1, version **1.0**, with independent investment/Ask version definitions. One schema owns shapes; generated TypeScript is not a second editable model. Manifest hashes the eight package files. Asymmetri must vendor an exact commit and manifest digest.

Coverage: 18 event types, 47 root request/response DTOs, 31 operations; frozen run/methodology, workers/discussions/artifacts/sources, proposal/review/orders, journal/holdings/valuations/performance, corrections/actions/ticker history, signed ingestion/receipts/errors/pagination/status, and private Ask session/claim/control/routing/answer/recovery. Exact typed record lookup and unpublished/withheld artifact registry entries close wire gaps. General Ask public sources are separate from exact investment references.

[Fixtures](../../../contracts/investment/v1/golden.json) are synthetic: $1, 000 capital, two invented workers, two-share BUY, HOLD, rejected SELL, artifacts and valuation. They do not approve the recommended $100, 000 official capital. Split/dividend/rational cases use disposable in-memory records. Static [Ed25519 vector](../../../contracts/investment/v1/signature-vector.json) retains only a disposable public key/signature. Offline helpers in `scripts/investment-contracts` are not imported by production `src`; no runtime/migration/tool changes were made.

## BotSquad implementation findings

Source and HQ baseline: `a72cee0`. Read-only HQ health: alive/database/dispatcher true, runtime ready; active `botsquad` user/service PID 652496, Node 24.21.0. Corrected read-only Codex login-status command returned **Logged in using ChatGPT**. No auth file, credential or private transcript was read/exported.

| Actual source | Reuse and future integration |
| --- | --- |
| Fixed Task kinds/capabilities; no investment or Ask tools | Add narrow types/capability later; a display title cannot grant authority. |
| Eight workers; depth2; three ordinary reports, CEO exception permits Nix as fourth | Preserve roles/hierarchy, correcting stale universal-three text. |
| Research eligibility: CEO/researcher/product manager | CTO/reviewer discussion participation does not imply native research permission. |
| `Research.taskSession()` in `src/control/research.ts` reuses one private provider session per worker, not per Task/run | New audience-scoped public contexts; do not reuse private Company bindings. |
| Conversations include company knowledge/peer tools, owner/worker participants and immutable retention | New anonymous-service subtype/store/tool boundary with deletion; visitor text is never an ordinary Task/Conversation trigger. |
| Working groups retain contributions and separate synthesis; Tasks cap artifacts at4/20k characters | Register both origins and export authorized derivatives with provenance; lower existing limits prevail. |
| Dispatcher2 global slots, 1 per worker, priority/FIFO; worker-wide unresolved-provider fences | Join existing dispatcher/fences. Ask fairness, deadline protection, duty cycle and token/dollar reservation are new work; no second scheduler. |
| Mandate working-group action reserves24 executions plus coordinator overhead; interval/daily recurrence is not an exchange calendar | Old12/cycle, 24/day proposal conflicts. Recommend32/cycle, 64/day with finite run cap, pending approval; add calendar due-work later. |
| Codex 0.157.0, read-only sandbox, native tools/network off, dynamic tools installed at thread creation | New public context/tool-schema generation. Current default240-second deadline/max10min does not prove token/dollar caps. |
| Research source provenance exists; broker cost/search count may be unknown | Separate approved public-service broker with bounded calls, retention and verified costs. |
| GitHub Markdown business adapter has narrow document-specific grants and durable intent/attempt/receipt patterns | Reuse patterns only; no implicit publication or Ask permission. |
| SQLite migrations1–14, WAL/FULL/FK, immediate transactions and durable execution ownership | Later additive migrations start disabled and join existing recovery fences. INV-01 creates none. |

Proposed, **not implemented**, locations: `src/domain/investment.ts`, `src/control/investment.ts`, `src/investment/market-data.ts`, `src/investment/publication.ts`, `src/domain/ask.ts`, `src/control/ask.ts`, `src/runtime/ask.ts`, additive persistence/migrations. Preserve reasoning → trusted operation → committed records → separately authorized publication.

## Website host and minimal receiver

Read-only inspection 03:32–03:35UTC (20:32–20:35Vancouver):

| Observed | Implication |
| --- | --- |
| Ubuntu 22.10/kernel 5.19/x64; 1 vCPU, 956 MiB RAM, 474 MiB available, 2 GiB swap | Modest separate receiver plausible, not load-tested. OS reached EOL July20 2023 ([Ubuntu](https://lists.ubuntu.com/archives/ubuntu-announce/2023-July/000293.html)); remediation required before public activation. |
| 25 GiB root, 96% used, about1.1 GiB free; `/var/tmp` about6.7 GiB | Deployment blocked on approved capacity/backup-headroom remediation. Historical free-space docs stale. No cleanup authorized/performed. |
| `/var/www/asymmetri`, owner `django-user`, mode0700; service active/enabled, PID 2304100, started02:48:45UTC | Existing release unchanged; build ID `Ic-zxi4WHpmgjiSDnsJCw`. |
| Node 22.23.1, npm 10.9.8, Next 16.3.6, React 19.2.6, Vinext 0.0.50; Next loopback 3001, nginx `/` proxy | Preserve marketing runtime. Proxy narrow experiment/Ask prefixes to dedicated loopback backend(s). |
| Next `.next` via `build:next`, Vinext `dist`,`.nvmrc`24; empty D1/R2 bindings, no app API routes | Keep backend outside website import graph; no build-time receiver/network dependency; both builds need later tests. |
| NoNewPrivileges/PrivateTmp yes; ProtectSystem/Home and memory cap absent; broad shared app UID | New dedicated service identity/storage, root-owned configuration and measured systemd caps/hardening. |
| Candidate3101/3102 unused; proposed users/roots absent | Recheck before deployment; nothing provisioned/reserved. |
| Apex/www and `/privacy/`,`/support/`,`/tutorial/`,`/motion/` returned200 | Preserve all protected/unrelated sites and routes. |

Recommend small Node 22-compatible publication receiver on loopback 3101, UID `asymmetri-experiments`, `/var/lib/asymmetri-experiments/archive.sqlite` plus hash-addressed content. Later Ask can share package code in a distinct small3102 unit/UID with `/var/lib/asymmetri-ask/private.sqlite`; public archive process cannot read private Q&A. No Redis, broker, container platform or hosted DB needed initially. Capacity must be measured after remediation.

Candidate driver: pinned `better-sqlite3`13.0.3 ([upstream manifest](https://raw.githubusercontent.com/WiseLibs/better-sqlite3/v13.0.3/package.json), Node>=22). Not installed/tested on production; INV-02 must prove Node 22/Linux x64 ABI/build compatibility in isolated state. Node 22.23.1 `node:sqlite` ran an in-memory read-only SELECT, exposes DatabaseSync/StatementSync/backup, but emits ExperimentalWarning ([versioned docs](https://nodejs.org/download/release/v22.23.1/docs/api/sqlite.html)); do not assume HQNode 24 API behavior or upgrade marketing Node incidentally.

Artifacts: generated CAS paths, hash/type/size verification, fsync/atomic rename before metadata, metadata-gated downloads, immutable versions, bounded orphan cleanup. Enforce quotas/free-space admission; object storage waits for measured need. Back up SQLite consistently with content manifest/hash verification and encrypted off-host copies; existing release backups do not prove DB recovery. Test Ask backup expiry and deletion suppression independently. HQ holds signing secrets; receiver holds verification keys outside Git/web roots/logs/worker context. No server packages, directories, users, configs, services or files changed.

## Market-data providers

Primary sources inspected on this date; no accounts, purchases, credentials or provider API calls. USD/month headline pricing excludes taxes/exchange/negotiated extras. Documented coverage is not measured reliability. Written rights for this exact publication plan remain mandatory.

| Provider | Data and operational fit | Cost, quota and rights |
| --- | --- | --- |
| **Tiingo EOD: conditional preferred** | US stocks/ETFs historical raw open/close, adjusted fields, splits/dividends; dividend records expose permaTicker, but EOD stable-ID mapping, ticker history and Security Master entitlement remain unverified. [EOD](https://www.tiingo.com/documentation/end-of-day): most data5:30 PM “EST”, corrections8 PM “EST”; confirm DST and exact regular-open eligible trade/auction definition. [Dividends](https://www.tiingo.com/documentation/corporate-actions/dividends): ex/pay/record/declaration dates, permaTicker; entitlement/action IDs/corrections/null pay dates unresolved. No verified complete exchange calendar. | [Redistribution](https://www.tiingo.com/products/end-of-day-stock-price-data):Startup$250, Enterprise$500, 80k requests/hour, 1.2m/day, 1TB. [Individual$30/internal$50](https://www.tiingo.com/about/pricing) are separate licenses. Header-token authentication; obtain exact rights quote. |
| **Massive: technical alternative** | US raw daily open/close with `adjusted=false`, default split-adjusted ([daily summary](https://massive.com/docs/rest/stocks/aggregates/daily-ticker-summary)); separate pre/after-market, exact auction semantics unverified. [Dividend IDs/ex/pay dates](https://massive.com/docs/rest/stocks/corporate-actions/dividends),[dated ticker/FIGI/CIK/delist](https://massive.com/docs/rest/stocks/tickers/ticker-overview),[forward holidays](https://massive.com/docs/rest/stocks/market-operations/market-holidays); historical calendar/merger/spinoff gaps remain. | [Personal](https://massive.com/pricing):0/29/79/199 is not public permission. [Business](https://massive.com/business):base$2, 499, delayed full-market+$499 or live+$1, 999, exchange extras; baseFMV is not raw opening feed. Ask for EOD-only quote. Basic 5/min, paid advertised unlimited; Bearer key ([quickstart](https://massive.com/docs/rest/quickstart)); negotiated SLA. |
| **Twelve Data: additional alternative** | Raw `adjust=none` vs split default needs endpoint/plan recheck; monolithic docs retrieval incomplete. [Coverage](https://support.twelvedata.com/en/articles/9935903-us-equities-market-data):cheap live subset~5%volume vs full EOD next trading day midnight ET; confirm weekends/holidays and compatibility with the proposed24-hour execution-data deadline; otherwise select another feed or explicitly amend the methodology before activation. [EOD guidance](https://support.twelvedata.com/en/articles/12682324-end-of-day-eod-pricing-market-data) distinguishes preliminary/confirmed data. Exchange schedule exists; [April update](https://twelvedata.com/news/april-2026-updates) calls dividend date ex-date, so pay-date coverage unresolved. | [Business](https://twelvedata.com/pricing-business):Venture$499, Enterprise$1, 099; conflicting “from$149” fragment requires quote ([March update](https://twelvedata.com/news/march-2026-updates) supports$499). Basic 8 credits/min, 800/day; endpoint credits and API-key handling matter. Exact redistribution tier/agreement required. |

Tiingo [terms updated2026-10-06](https://app.tiingo.com/tos/): Starter/trial bars durable raw/derived storage; paid raw retention tied to subscription, deletion on termination. Derived exceptions exclude reconstructable/substitutive data, explicitly rebased single-security curves absent written exception. Section7.3 requires redistribution permission and linked “Data sourced by Tiingo.” Permanent public fills/positions/benchmark curves need written clearance. [Symbology](https://www.tiingo.com/documentation/appendix/symbology) and [quality process](https://www.tiingo.com/blog/tiingo-data-quality-how-we-find-and-fix-market-data-errors/) establish documentation, not verified action completeness/SLA.

Massive [terms](https://massive.com/legal/market-data-terms-of-service) restrict personal/non-display/derivative/public use without appropriate business licensing, including termination restrictions on derived charts/research. Twelve [terms](https://twelvedata.com/terms) require proper non-display/display authorization, constrain reconstructable derived data and deletion after termination; 30-day/compliance exceptions do not establish public archive rights. [Commercial guidance](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage) requires redistribution agreement/add-on; [attribution](https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data) requires visible linked credit. No provider is cleared yet.

Written questions: automated paper/non-display/AI fees; public positions/quantities/fill/cash/equity/benchmark JSON/charts/downloads; perpetual archive/backups after cancellation; exact raw opening/close/halts/corrections/availability timestamps; frozen universe/stable IDs/action pay dates/calendar; all-in quote/delay/attribution/reporting/SLA. Reversible slippage does not make fill prices non-reconstructable. Do not substitute adjusted prices, articles, scraped quotes or free consumer licenses.

Ten proposed stocks plus one benchmark at daily cadence is modest volume, but history/actions/corrections still need caching/quotas. Expected preferred data cost is **at least $250/month**, conditional on rights/extras; all-in price unresolved. No live data quality, pricing fields or historical response was tested. Owner approval precedes spending.

## Ask runtime and account gate

Current ChatGPT-authenticated Codex is **not cleared for anonymous public questions**. [Official authentication guidance](https://developers.openai.com/codex/auth/) recommends API keys for programmatic workflows and warns against exposing Codex to untrusted public callers. [Sign in with ChatGPT terms](https://openai.com/policies/sign-in-with-chatgpt-terms/) concern authenticated-user use and disallow one subscription powering other users' activity. Exact app/account applicability should be confirmed; current evidence blocks using the owner subscription for anonymous Ask.

Recommend a separately approved API-backed application. The [Services Agreement](https://openai.com/policies/services-agreement/) contemplates customer applications for end users subject to its terms/policies; this does not authorize a model/account/budget here. Preserve actual BotSquad worker identity with an isolated public-service context. Verify model/tool compatibility, token caps, measured costs, retention/deletion and abuse obligations before admission. An API key alone does not clear exposing Codex execution to public callers: a reviewed bounded application adapter is required. Verify applicable age/parental-consent and supported-country/trade-control obligations in the Services Agreement before public access. Current cost-unknown subscription execution cannot prove requested dollar/token controls. [API data controls](https://developers.openai.com/api/docs/guides/your-data) describe default abuse logs up to30 days and Responses application state retention; approved modified/zero-retention programs are separate. Operator deletion timers do not promise provider deletion; select, configure and disclose the exact provider retention before launch.

Feasible design: website private session queue; outbound HQ claims; independent HQ grant/quota admission; relevant opted-in actual worker routing; trusted exact public context and bounded owned follow-ups; signed actual-worker result. No private company memory/peer/repository/provider-thread access. Visitor text cannot become a Task, investment action or grant. Optional public research uses a separate approved broker. Unknown model outcome keeps worker-wide fences; lease expiry never reruns work. Durable question/result identities, receipts, current generations and fully applied deletion-control barriers govern recovery. These interfaces are offline-tested, not activated.

## Validation and review

Coverage: strict schemas/versions/required/unknown fields; all event variants; identities, financial references/arithmetic/hash/ordering; artifacts/safe content; duplicate/conflicting deliveries; signatures/digests/nonces/time/generation/key rotation; session ownership/CSRF/expiry and cross-visitor references; worker attribution; contextual withdrawal/cancellation/deletion; unknown-outcome non-reexecution; control barriers; safe errors and package drift. Static signature verifies through Node crypto and WebCrypto.

Specialists reproduced and reviewed fixes for mixed-run history, millisecond expiry, deep JSON recursion, stale-order fills, fill/split entry contamination, valuation sequence collision, ticker history, dividend mismatch, unsafe Markdown references, omitted-citation withdrawal bypass, incomplete control barriers and missing no-store retry responses. Final results appear below.

**Limitations:** financial/model examples are synthetic. No retained trades, broker access, actual workers/models, live market API, public Q&A, receiver HTTP/SQL concurrency/crash/restore, production signatures, load tests, runtime context/tool isolation or website builds were performed. Existing tests use their documented fake runtimes. Actual evidence: source/host/health/login-status inspection, website HTTP checks and primary documentation. No server mutations, purchases, accounts or deployment.

## Next milestone

**INV-02 is ready for separately requested local, disabled, synthetic implementation in Asymmetri.** Vendor exact contract; verify Node 22 driver/HTTP parsing/signatures/SQL uniqueness/atomic receipts/checkpoints/restart/generation/content prerequisites and preserve both website builds. No live data/model/official-capital approval is needed for that packet. Ask intake/runtime remains INV-ASK-01/02. Do not proceed automatically.

Deployment requires authorized OS/disk remediation, rechecked UID/port allocations, resource measurements and backup restore. INV-06 live acceptance requires licensed data/credentials and observed semantics. Ask activation requires approved provider account, enforceable budgets/retention, actual-worker isolation, eligible roster/grants, privacy/abuse controls and real recovery acceptance. Owner still approves official capital/universe/risk/horizon, spend, separate budgets, audience/expiry, retention, trial/start and activation. See [specific recommendations](../../experiments/investment/DECISIONS.md).

Sequence adjustment: host remediation precedes deployment, not local INV-02; provider contracting and Ask-account approval are parallel external gates. New public-service context/adapter replaces private-thread reuse. Resolve group reservation budgets before real cycles. All later packets remain planned.

## Integration record

Validated on macOS Node24.10.0/npm11.6.0:

| Check | Result |
| --- | --- |
| `npm run contracts:check` | Generated types and8 package digests match |
| `npm run check` | Type checking passes |
| Focused contract suite |175 passed,0 failed,0 skipped |
| `npm test` with local loopback access |624 tests:623 passed,0 failed,1 expected Linux-only generic-recipe filesystem/buffer test skipped;103.9 seconds |
| `npm audit --json` |0 known vulnerabilities, including development dependencies |
| Changed-document relative links |251 checked,0 missing |
| Schema/OpenAPI `$ref` resolution |920 references resolved |
| `git diff --check`; production import scan |Clean whitespace; no `src` imports of offline helpers |
| Independent architecture/security/recovery and provider fact review |All concrete findings resolved; operational acceptance remains deferred as specified |

The initial sandbox run had57 failures: existing local HTTP tests could not bind127.0.0.1 and two newly added future-clock fixtures used an expired synthetic publisher grant. The fixture authorities were corrected without weakening expiry validation; the authorized local-loopback rerun above passes. Initial compiler errors in intentionally malformed test objects were fixed with explicit negative-test mutation; no failed assertion was removed to obtain a pass.

Development-only exact pins: Ajv8.20.0/formats3.0.1 for strict2020-12 validation, json-schema-to-typescript15.0.4 for generated types, canonicalize2.1.0 for JCS, jsonc-parser3.3.1 for strict duplicate-key inspection. These are reviewed conformance-tool versions, not an implicit latest-version policy; lockfile/audit/type/vector checks cover the chosen set. Production dependencies remain unchanged.

Pre-integration recheck: remote main still a72cee0; primary checkout and Asymmetri clean; active worktrees preserved; no competing writer/open PR. Implementation is on `codex/inv01-contracts-feasibility`. The linked PR and Git history record exact candidate/merge commits; no server deployment follows integration.


Source implementation commit: `5ea318f41cfd9c87b8d7f1a2afa467b7b7045aee`. Reviewed integration: [PR32](https://github.com/eugenelin89/bot_messenger/pull/32), targeting main from `codex/inv01-contracts-feasibility`; its final merge status/SHA is authoritative. A following documentation-only commit records this link and checks. GitHub reported no configured checks/statuses for the tested implementation head; local full validation and independent specialist reviews provide this packet's acceptance evidence, not a fabricated CI approval.

Contract manifest SHA-256: `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`. Vendor the package from the final merged commit containing this unchanged manifest. No production deployment is part of PR32.
