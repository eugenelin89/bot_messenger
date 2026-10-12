# HQ-READY-02 source acceptance

**Date:** 2026-10-11 America/Vancouver (tests continue into 2026-10-12 UTC)
**Scope:** Owner-selected finite normal-HQ source, additive inert migration, deterministic synthetic/fake tests and reviewed Git integration.
**Base:** `276d918f07d9dd9919a09f698f6fdae51831a0a9`
**Reviewed production source:** `c715085e5fd05fd7c96ef4798462c749afc6ccca`
**Migration compatibility tests:** `4c5261a02c6f44eb474faa531c60256006e96f87`
**Status:** Source and deterministic acceptance complete. No operational acceptance.
**Integration:** [PR56](https://github.com/eugenelin89/bot_messenger/pull/56) records the final reviewed head, merge commit and remote checks; the parent verifies clean synchronized main after merging.
**Acceptance documentation:** `8f3445e5064ff950d90c07f49500b97ae7f7dcd6`, followed only by this closure link/status update.

## Implemented boundary

The [selected specification](../../../prompts/experiments/investment-hq-ready-02.md) is implemented through existing Company claims, typed working groups, InvestmentLoop/Mandates scheduling, shared Dispatcher, AIUsage, paper simulator and private owner pages. There is no additional employee engine or fixed employee dialogue. Owner-selected staffing is explicit; automatic staffing remains deferred.

`credit_approved_finite_hq` has separate fixed-location service authority and independently retained custody, an immutable scoped AI profile, external reservation before local claim, one-use admission/transmission, current identity checks and permanent unknown fences. Once authority storage exists, all investment modes mirror consumption there for cross-mode rolling accounting; this grants no new execution capability. Missing or conflicting custody stops investment work. Ordinary unrelated task/conversation completion remains isolated from that failure.

`private_paper` permits only static synthetic evidence, approved discussion tools and the five typed paper tools. Exact owner preview/consent creates truthful initial cash state and an inert draft schedule atomically. It creates no genuine authority and changes no employee defaults. Financial/source/runtime health gates subsequent work; private records fail generic and committed publication routes. The pinned CLI, contracts and Asymmetri are unchanged.

## Deterministic evidence

All prices, account identities, employee outputs and provider traffic below are authored fixtures. No genuine employee inference or credit consumption was run. Manual typed execution, actual Dispatcher integration and fake stdio transport are separate evidence layers.

| Requirement | Evidence |
| --- | --- |
| 1. Inert migration/old modes | New populated schema21→22 repeated migration compares every old row/rowid and old migration record, foreign keys, filesystem inventory and zero provider calls; existing strict/included-only/pilot suites retained. Synthetic downgrade fixtures remove only empty new tables before reconstructing older schemas. |
| 2. Exact owner setup | Idempotent consent, actual start, initial cash, exact normalized configuration/source/calendar hashes, full mandate, old worker defaults, expired/conflicting/drifted previews and invalid limits. |
| 3. Authority and limits | Wrong worker/workspace root/profile/request/generation/thread/tool/account/scope/deadline denied; per-worker/cycle/day/run/rolling limits, backwards clock, independent handles and simultaneous separate-process reservation race; seven finite plus one legacy rolling restore counterexample. |
| 4. Financial workflow | Manual deterministic normal-HQ two-session HOLD and separate valid BUY/SELL branches retain proposal→settled independent review→settled submission; price guard, unavailable opening/marks, expiry and prior financial-failure holds. These are not employee investment conclusions. |
| 5. Progression | Actual Dispatcher finite adapter/positive telemetry progression, ordinary second global slot, no idle calls, protected future/final three turns, excess debate, incomplete/late review and bounded session progression. |
| 6. Usage | Positive settled token telemetry, incomplete/conflicting usage, partial pricing, absent actual credit attribution and permanent unknown are distinguished. No unknown reservation is refunded. |
| 7. Crash/races | SIGKILL at external reserve, local claim, external admission, transmission marker, actual fake stdio turn/start, local settlement and external settlement; additional external DB commit before custody fault. Duplicate/lost receipt, stale callback, pause/stop and corrupt custody tested. |
| 8. Restore | Dispatch-disabled copied/restored HQ, old external+HQ snapshots against independently current custody, missing/replaced/corrupt authority and offline financial journal/hash continuity. No stale replay or refill. |
| 9. Browser/private boundary | Fake setup, explicit preview consent, controls, budgets, unknown/blocked outcomes, reload without refill, terminal stop and disabled publication at 390px and 1440px; prior team/run browser regressions retained. |

### Commands and outcomes

Initial focused receipts: 63 existing investment tests passed; expanded finite checks passed after correcting two ordinary-task fixtures to submit their required artifact. The first browser run passed 8/8 after sandbox loopback denial required host execution; no application change bypassed the sandbox result.

The first full serial `npm test` run completed in 480.181s: 1,253 tests, 1,237 passed, 10 failed and 6 skipped, retained at `/tmp/hq-ready-02-full.log`. Its schema-version fixtures still expected21 and its deliberately future-schema test used22; these are updated to current22/future23 with original row-preservation assertions retained. A synthetic pilot downgrade fixture must remove empty22 additions before reconstructing20. The private-pilot publication assertion now expects the earlier generic private-scope denial. Production pilot authority/schema and historical records are unchanged.

`npm run check` and `npm run build` passed on the repaired tree. The affected rebuilt suites (`ai-profile`, `business-migration`, `client-migration`, `control`, `credit-pilot`, `engineering`, `finite-hq-migration`, `investment-migration`, `investment-recovery`, `usage-migration`) passed 84/84 in 41.336s (`/tmp/hq-ready-02-migrations.log`). The recovery reviewer independently accepted this follow-up without weakening historical assertions. The final full `npm test` rerun at test commit `4c5261a02c6f44eb474faa531c60256006e96f87` passed: **1,254 tests, 1,248 passed, 0 failed, 6 skipped** in 486.408s (`/tmp/hq-ready-02-full-final.log`). The six pre-existing environment gates are four actual isolated committed-team receiver variants, one actual standalone receiver integration, and one Linux-only generic-recipe resource test. They were not silently counted as passes; no receiver/Asymmetri or Linux deployment was attempted. The final browser command `node --test --test-concurrency=1 test/finite-hq-ui.browser.mjs test/investment-loop-ui.browser.mjs test/investment-team-ui.browser.mjs` passed **8/8**, with zero failures/skips in 10.942s (`/tmp/hq-ready-02-browser-final.log`). It ran against the same frozen production source after all owner-control fixes; screenshots were visually inspected for desktop/mobile control, budget and private-publication states. Host resource checks preceded heavy work; builds/tests ran serially. Browser evidence is local synthetic-only at `/private/tmp/botsquad-hq-ready-02-browser/`.

Local Markdown validation checked 406 links with no missing files/anchors. `git diff --check` passed. Added-line secret-pattern review found no private keys/provider tokens; scope review found zero changes to historical Decision037 authority, canonical contracts or dependencies.

## Independent review and dispositions

Read-only specialists reviewed the fixed production checkpoint above. Parent remained sole writer/integrator. Control-plane architect, security reviewer and recovery reviewer reported no remaining blocking/important findings. Test reviewer accepted HQ-READY-02 source acceptance after inspecting the final full/migration/browser receipts and documentation; no blocking or important acceptance finding remains. Reviewed Git integration may proceed.

Material findings were resolved and covered before source freeze:

- Reject ordinary adapter calls carrying investment context/paper tools; require the distinct finite capability. A caller-supplied no-op admission callback cannot bypass module-owned one-use transmission.
- Bind the actual observed provider thread and model at final transmission, including resumed generation checks.
- Persist reload and owner-control receipts externally. Lost local reload receipts return the original timestamp; an old resume receipt cannot clear a newer hold.
- Preserve protective local pause/stop even when custody is corrupt; resume fails closed.
- Reconcile externally approved histories without allowing an unrelated unapproved setup to block ordinary work; ordinary finish does not consult custody.
- Use one captured accounting instant for cross-mode reservation identity and preserve original chronology across restore.
- Bind the full mandate and derived configuration/source/calendar in exact preview consent; only declared at-consent fields resolve later.
- Gate subsequent model work on private source/financial health while retaining deterministic expiry/cleanup.
- Discover existing external history independently of finite runtime selection so legacy-mode claims cannot evade shared rolling consumption after company restore.

## Preserved limits and operational gates

Decision037 remains permanently completed and exhausted at **4/4**, with its three historical genuine settled turns unchanged. No archived real pilot database was opened through Store. No authority was provisioned, environment selector enabled, genuine provider called, market data acquired, credit/billing setting changed, production deployed or Asymmetri modified.

Source/fakes do not prove isolated Ubuntu confinement, filesystem custody administration, full-machine restore protection or genuine elapsed-session H1–H9. Local hashes cannot defeat an administrator replacing every copy. These remain separately authorized operational gates. The adapter's finite supervision cannot guarantee precise upstream charges or instantaneous billing cutoff.

The next recommended task is separately selected **HQ-READY-03 — source qualification and prospective methodology**, under the US$0 incremental market-data rule. A later explicit HQ-READY-04 decision must bind the exact HQ/account/routing/profile/participants/source/method/limits/expiry, fresh authentic reload-OFF evidence and acceptance of existing-credit/provider-retry risk, with Linux/custody prerequisites. Neither a setup receipt nor this source acceptance grants that authority. Public rights, publication, deployment, HQ-READY-05 and INV-10+ remain blocked. No next packet or automation is started.
