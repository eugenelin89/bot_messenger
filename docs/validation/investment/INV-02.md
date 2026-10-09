# INV-02 — Authenticated REST receiver and durable archive

**Accepted:** 2026-10-09. **Scope:** implemented and locally validated, default
disabled. Synthetic data only. No production deployment, public activation, live
source connection, HQ runtime change, real grants or Ask implementation.

## Exact implementation and contract

- Asymmetri implementation: [457f9354b3f8daf5c4c75b8f5ac1946433da3ce0](https://github.com/eugenelin89/asymmetri/commit/457f9354b3f8daf5c4c75b8f5ac1946433da3ce0).
- Separate required Engineering Journal: [66a882d3f2c95deb1ac1a2808c36b4627742586b](https://github.com/eugenelin89/asymmetri/commit/66a882d3f2c95deb1ac1a2808c36b4627742586b), verified remote main after push; clean local main.
- [Full Asymmetri validation](https://github.com/eugenelin89/asymmetri/blob/457f9354b3f8daf5c4c75b8f5ac1946433da3ce0/docs/INV-02-VALIDATION.md) and [operational runbook](https://github.com/eugenelin89/asymmetri/blob/457f9354b3f8daf5c4c75b8f5ac1946433da3ce0/docs/INVESTMENT_RECEIVER.md).
- Canonical source: [BotSquad ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755](https://github.com/eugenelin89/bot_messenger/tree/ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755/contracts/investment/v1), contract 1.0.
- Manifest SHA-256: `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.
- BotSquad main documentation base: `b57c41ab423d4f21ddd14bbdba576649336fe935`; exact contract bytes unchanged since accepted INV-01. This handoff changes documentation only in isolated `codex/inv02-receiver-handoff`; original checkout and unrelated worktrees preserved.

The accepted package has 47 root DTOs, 18 event variants and 31 investment/Ask
operations. All nine vendored files, their manifest membership/hashes and generated
declarations are checked locally; no GitHub dependency at runtime. BotSquad's
canonical contracts and runtime remain unchanged. Decisions 027/028/029 and all
required repository/specification documents were reviewed. [Execution plan](../../exec-plans/investment-inv-02.md).

## Delivered implementation

Standalone Node22/24 HTTP service in Asymmetri `receiver/`, own package/lockfile,
SQLite migration **001**, better-sqlite3 **13.0.3** / SQLite **3.53.4**, AJV2020,
canonical JSON, strict JSON parser and exact decimal arithmetic. Explicit startup,
loopback binding, private data outside checkout, no automatic authority/listener
from installation/build/migration/import. Example config and future non-root
systemd template are disabled/uninstalled. Next remains the renderer; type/read
location helper has no network or startup side effects and no page is wired yet.

Atomic persisted events, batches and immutable receipts, publisher scopes/keys,
activation/revocation/generations, nonces, source order, financial journal/order/
valuation constraints, frozen run config, typed projections, versioned references,
discussions/reviews, private content reservations/metadata, visibility audit,
heartbeats and opaque cursors. Complete validation is bounded to16MiB/run;
default64MiB payload archive/256MiB DB and256MiB CAS. Explicit physical reserve,
finite retained receipt/nonce/cursor quotas and safe errors prevent silent history
loss. See runbook for exact ceilings and future capacity measurement requirements.

RFC9421 Ed25519/RFC9530 digest profile binds actual method/authority/path and signed
headers/bytes. Current scope/key/generation and trusted publication-rights approval
are rechecked at commit. Raw duplicates/framing/proxy assumptions fail closed.
Receipt lookup remains signed and current-authority protected. SQL transactions
never span network or lengthy filesystem work. Repackaging events cannot create
new financial identities. Receipts acknowledge the public archive, never a trade.

CAS uses bounded streaming, generated temporary names, SHA-256 keys, safe format
validation, fsync/atomic rename and metadata-controlled visibility. Hash guessing
cannot download staged content. No source URLs are fetched. Bounded offline cleanup
retains published objects and preserves durable transport receipts; retries restore
expired staging without changing the original receipt.

All17 investment OpenAPI operations are recognized. Signed POST events/heartbeat,
GET receipt and PUT content work. Public experiment/status/snapshot/event/performance/
transaction/discussion/decision/artifact metadata/exact-record GETs use exact named
DTOs, bounds, opaque cursors, safe errors and revalidated caches. Roster/activity is
in EventPage, not a competing invented route. Artifact byte GET explicitly returns
503 unavailable for published metadata,404 absent,410 hidden until INV-03. Exact
withdrawn records expose safe tombstones; current views suppress transitive scalar
dependencies and never revive a hidden obsolete revision/order/status. Fresh
transport does not establish fresh market data; no calendar invents expected marks.

## Validation commands and results

| Check | Result |
| --- | --- |
| Receiver contract check/regenerated declarations | Exact package and types pass |
| `npm run receiver:check` in Asymmetri | Pass |
| `npm --prefix receiver test`, Node24.10.0 macOS arm64 | **183/183 pass**, 0 fail/skip |
| Node22.23.1 `--test receiver/dist/test/*.test.js` | **183/183 pass**, 0 fail/skip |
| Actual native SQLite module on both runtimes | Pass, SQLite3.53.4 |
| Asymmetri `npm run check` | Pass; one existing tutorial navigation lint warning, no new receiver warning |
| Asymmetri `npm run build:next` and `npm run build` | Both pass; Next/Vinext preserved |
| Root and receiver `npm audit --omit=dev` | Both 0 vulnerabilities |
| No-config CLI start | Expected disabled exit1; no listener or publisher |
| `git diff --check` | Pass |

The initially failing website production audit identified existing Next16.3.6
advisories. Minimal Next/eslint-config-next16.3.8 patch and lockfile synchronization
resolved them; check, Next and Vinext builds were rerun successfully. No production
packages were changed. Early test scaffolding/type/path and synthetic restore clock
failures were corrected before final acceptance; no required tests were skipped.

Tests include all47 DTO shapes/required/unknown fields, all18 event types, invalid
JSON/versions, shared signature vectors, real loopback HTTP and raw TCP duplicate
headers, modified method/path/authority/body/digest/generation, signature/key/scope
expiry and activation, revoked/wrong-scope publisher, durable nonce replay, protected
receipts and pending-commit revocation. Private/public boundaries and safe cache
behavior are exercised.

Real SQLite tests cover empty/repeated migration, immutable identities, identical/
conflicting/repackaged batches, same-process and **separate-process** concurrent
duplicates, foreign keys/integrity, source/journal gaps, missing prerequisites,
synthetic BUY/HOLD/rejection/corrections, older valuation arrival, explicit partial
data, exact decimal arithmetic and source/market metadata.

Recovery uses **real SIGKILL** before/after SQL commit, before response and after CAS
rename; restart preserves committed receipts/nonces without partial batches. The
isolated backup/restore test checks copied artifact hashes/type/size, SQL integrity,
disabled/revoked old authority, new epoch/generation and fresh disposable key,
original receipt/retry reconciliation and cursor reset. Storage tests include
interrupted upload, disk-write failure, orphan cleanup, symlink/corrupt bytes,
metadata without bytes and expired staging retry. Capacity test denies new cursors/
writes near the DB reserve while signed accepted receipt GET still succeeds.

These183 tests include shared DTO/helper tests; they are not183 separate end-to-end
HTTP scenarios. Ask schema conformance validates vendor shapes only.

## Independent review and dispositions

Sole implementation/integration writer; independent read-only security, recovery
and acceptance/test reviewers. All inspected corrected sources and both final
runtime logs, and accepted local INV-02 with **no remaining blocking findings**.

Fixed with regressions: semantic/scalar withdrawal dependencies; latest hidden
valuation/order/status fallback; hardlink installation crash window; checkout
parent-prefix bypass; private PEM retention risk; expired-content receipt retry;
metadata/public-cursor reserve bypass and finite operational limits; delayed decision
revision ordering; effective instrument dependency; current publication-rights
commit race. No security/contract check was weakened to obtain green tests.

## Decision029, production and deferred scope

Receiver remains provider-independent. **US$0 incremental market-data budget** is
preserved; no paid fallback/provider account/scraper/collector/real market observation
was used. Observed-paper claims without trusted exact-config rights approval fail;
no real approval exists. Free-source automation, retention and public/derived rights
remain later verified decisions, not inferred from public accessibility.

No SSH/server access, cleanup/upgrade, production package/config/user/directory/key,
Nginx/systemd/HQ changes, restart, preview or deployment occurred. Historical INV-01
Ubuntu22.10/96% root usage is not claimed current. Asymmetri's separate October9
maintenance record reports ~13.63GiB free/44% usage after cleanup; supported OS and
fresh disk/RAM checks remain required. Linux native ABI/filesystem/proxy/TLS,
separate non-root service ownership, sustained shared-host capacity and verified
backup/restore must pass before separately authorized activation. Proposed256MiB
receiver memory ceiling is a test target, not measured production sizing.

Not performed: Linux/systemd/reverse-proxy integration, hardware power-loss,
production/sustained load, real offsite disaster recovery, live market sources,
HQ workers/publisher/trading or Ask execution. Process-kill tests are not power-loss
proof. Restoring an older backup must reconcile newer withdrawal controls before
reads, revoke old authority and use a generation newer than both sides' history.

Deferred: INV-03 public downloads/rendering/discussion pages and owner withdrawal
UI; later public dashboard, HQ simulator/collector/publisher/worker operations,
source/rights activation, official-run-selection UI and all private Ask records,
sessions, routing, budgets and deletion. No later milestone was begun.

## Acceptance and handoff

A02/A06/A07/A09 are satisfied for the authorized local synthetic receiver scope:
exact pinned contract, actual signed HTTP+durable SQLite service, atomicity and
reconciliation, financial ordering, safe public reads/storage, default-disabled
boundary, existing website regressions and independent review. No unresolved
INV-02 implementation acceptance item remains.

**INV-03 is ready for a separately requested local implementation.** Production
prerequisites do not block local synthetic artifact/discussion work. This record
is not a request to start it or authorize deployment. Initial3–5 hour estimate did
not materially change. The documentation PR records its own independent commit and
review/integration identity; Asymmetri uses the separate two-commit main workflow.
