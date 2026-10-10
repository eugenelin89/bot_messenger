# INV-CREDIT-ACCOUNT-NOTIFICATION-REPAIR

**Date:** 2026-10-10  
**Scope:** Source repair and deterministic acceptance only; no real model inference  
**Starting main:** `90fdc3d22d6469a82d05dcd2f83ce50e4c373979` (PR47)  
**Status:** Source accepted for integration; genuine employee inference remains unproven

## Incident and preserved outcome

The owner confirmed at **2026-10-10 06:04 America/Vancouver (13:04 UTC)** that ChatGPT automatic purchased-credit reload was OFF, reporting a Settings → Usage & billing screenshot and accepting existing-credit consumption, including provider-internal retries. This is owner-supplied confirmation, **not an independently queried billing-setting API result**. No purchase or reload-setting change was authorized. The owner also approved the exact minimal two-worker identity/profile export for Atlas and Maya.

The first Atlas attempt on accepted PR47 main ran from 13:18:30.384Z to 13:18:37.247Z, approximately 6.9 seconds of local setup. A startup `account/updated` at 13:18:31.234Z triggered the old unconditional `runtime_account_changed` guard. That guard treated a notification as proof of identity change and interrupted before confirmed provider admission.

The original outcome remains a genuine setup failure after this repair:

| Metric | Preserved result |
| --- | --- |
| Consumed pilot reservations | **1**, never refunded/reset |
| Confirmed genuine provider turns | **0** |
| Employee response / Maya execution | None / not started |
| Provider thread/turn identity, authoritative tokens, API-equivalent estimate | Unavailable |
| Attributable purchased-credit deduction | Not established |
| Execution / provider provenance | `awaiting_approval` / unresolved |
| Local reservation | Settled because it was never admitted; still consumed |
| Pilot / private scope | Stopped / revoked |
| Automatic replacement turn | None |

Original evidence remains private in the `decision037-20261010-first-attempt` archive and its original disposable directory. The repair reads bytes for integrity checks only, without opening either SQLite database. Parent and independent reviewer checks matched every baseline hash and filename across **47 files** in both locations. Raw employee context and account details are not copied into this source record. Decision037 and its original approval are unchanged.

## Pinned protocol evidence and root cause

Source inspection uses Codex **`rust-v0.157.0`**, Git tree `00c972ed5d6ff6499317fd41b7f23605b8e6850d`, matching the installed/pinned adapter version. The [app-server README, selected workspace routing](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server/README.md#selected-workspace-routing) documents that a newly initialized connection receives an account snapshot after saved workspace routing is ready, including when discovery finished before initialization. Clients must reread account and configuration requirements. The notification contains authentication-mode/plan observations; it is not authoritative identity evidence.

The [account notification implementation](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server/src/account_notifications.rs) and [account request processor](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server/src/request_processors/account_processor.rs) establish the ordering and authoritative account-read behavior. The [account protocol](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server-protocol/src/protocol/v2/account.rs) defines optional workspace routing and its official backend origin. [Requirements protocol](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server-protocol/src/protocol/v2/config.rs) distinguishes explicit null requirements from malformed/missing responses, managed constraints and independent residency requirements. The [configuration processor](https://github.com/openai/codex/blob/rust-v0.157.0/codex-rs/app-server/src/request_processors/config_processor.rs) supplies effective configuration and managed requirements.

Thus ordinary startup **can** produce the observed notification without an account switch. The original evidence does not independently prove unchanged identity; no authoritative fingerprint was recorded before that failed setup. The deterministic reproduction proves the old interpretation was too strong and the corrected unchanged-identity path can proceed.

## Corrected verification and event ordering

`CreditAccountVerifier` attaches before `initialize`, including the skill-isolation connection. Each account notification synchronously increments a generation and invalidates prior verification. It never uses notification payload fields to establish identity.

Each fresh pass reads `account/read` → `configRequirements/read` → exact-workspace `config/read` → `account/rateLimits/read` → a closing `account/read`. Both account observations must pass ChatGPT authentication/eligibility and identity/routing consistency. The closing round trip also reconciles notifications queued behind the eligibility response. A changed generation discards the entire in-flight pass. Concurrent recheck callers share only the pending read; completed reads are not reused as fresh admission evidence. Eight unstable passes or the bounded absolute deadline fail closed.

The historical pilot-salted account fingerprint format is preserved. A separate in-memory salted digest pins applicable routing requirements across isolation/runtime connections and later rechecks. Effective official-provider/backend settings, disabled tools/features, allowed authentication/approval/sandbox/web-search modes, forced workspace membership, managed constraints and personal-account eligibility are rechecked. This narrow private pilot rejects managed provider/model overrides and nonempty managed instructions rather than accepting unreviewed context. Residency and account routing override are checked as separate protocol concepts. No raw account email, routing identifier, requirements, tokens or arbitrary provider error text is persisted by the verifier.

Before thread creation, startup resolves pending verification. After thread creation/naming/configuration, the runtime rereads all authority state again. It checks the final generation, performs synchronous durable admission, rechecks the generation and writes `turn/start` without an intervening `await`. A synchronous invalidation inside admission denies transmission and retains the consumed reservation/uncertainty. A notification processed after transmission begins stops tools and requests interruption even if authoritative identity later proves unchanged. Diagnostics may reverify but cannot resume/replay the turn. Audit authority failures are contained after the stop latch. A late provider completion or pending tool completion cannot restore successful pilot continuation after a local stop. Shutdown detaches the verifier.

Actual switches, logout/API-key mode, foreign backend/provider, changed routing requirements, unavailable identity, failed/malformed lookups, unverifiable configuration, lost eligibility and notification storms still deny admission. Model-reroute protection, usage observations, durable reservation accounting, supervisor limits and ordinary non-pilot adapter behavior remain in place. There is no provider-atomic read-and-admit API claim: an event arriving after transmission takes the conservative active-turn interruption path, with any upstream settlement uncertainty retained.

## Deterministic acceptance

All transport tests execute a local fake app-server, never the actual provider's `turn/start`.

| Requested category | Evidence in `test/credit-runtime.test.ts` unless stated |
| --- | --- |
| 1. Ordinary startup snapshot | `startup-snapshot`, unchanged identity, exactly one simulated turn |
| 2–3. Before account read / routing discovery | `before-account-read`, delayed `routing-discovery` |
| 4. Immediately before admission | `before-admission`, `after-verification`, reentrant admission invalidation |
| 5–7. Repeated / in-flight / stale notification | `multiple-identical`, `recheck-inflight`, `stale-verification`, storm bound |
| 8–10. Identity / API key / backend and routing changes | Identity, logout, API key, provider/config, backend, required backend/workspace and routing override fixtures |
| 11–12. Lookup and requirements fail closed | Lookup failure/timeout; missing/malformed/error requirements; explicit null valid; direct confinement/managed-policy matrix |
| 13. Notification after turn start | During-start, active same-identity and pending-tool-drain fixtures |
| 14. Timeout/interruption uncertainty | Missing settlement, audit revocation and store reopen/recovery preserve uncertainty |
| 15–16. No duplication or automatic retry | Exact one reservation and zero/one simulated starts; stopped state cannot claim replacement |
| 17. Privacy | Audit assertions exclude fixture account identifiers; errors exclude raw account/requirements errors |
| 18. Ordinary behavior unchanged | `test/codex.test.ts` startup/active snapshots complete normally without credit-only reads |

Additional review-driven cases verify closing-read authentication loss and audit failure during an active notification. Tests also cover the earlier pilot's durable stop/recovery and usage gates.

Validated on macOS arm64 with Node24.10.0. Executable source and tests were fixed throughout the accepted run.

| Check | Accepted result |
| --- | --- |
| `npm run check` / `npm run build` | Pass |
| Focused credit-runtime, private-pilot and ordinary Codex tests | **100/100**,58.99s |
| `npm test`, serial file concurrency | **1,037 total:1,031 pass,0 fail,6 skip**,287.33s |
| `npm run contracts:test` | **175/175**; generated contracts unchanged |
| Focused usage, activity, migration and investment recovery | **81/81**,9.53s |
| `git diff --check` / changed Markdown local links | Pass /85 links valid |
| Original private evidence integrity | **47/47** byte-identical; no SQLite opening |

The six full-suite skips are one Linux-only filesystem-bound test and five opt-in standalone-receiver integrations (`INV07_RECEIVER_ROOT` was not configured). They are not counted as passes. No isolated Linux runtime, standalone-receiver integration or new browser acceptance is claimed for this runtime-only change. The contract suite remains fully passing. Local receipts are `/private/tmp/botsquad-account-repair/focused.log`, `full.log`, `contracts.log`, `usage-recovery.log` and `evidence-check.json`; Codex transport evidence is fake only.

The initial restricted-environment full run reported 971 passes, 60 failures and 6 skips. Loopback/Unix socket binding and nested macOS `sandbox-exec` were denied with `EPERM`/`sandbox_apply: Operation not permitted`, also preventing dependent integration fixtures from running. Its receipt is retained as `full-restricted-environment.log`. The unchanged suite then passed with the required local test capabilities; the restricted run is not counted as acceptance.

## Independent review and disposition

Parent Codex is the sole writer. Security, control-plane, recovery and acceptance roles review read-only. Findings corrected before final acceptance:

- A revoked audit callback could throw before interruption or from asynchronous diagnostics: interruption now latches first and diagnostic emission contains errors.
- The closing account observation initially skipped `requiresOpenaiAuth` eligibility validation: both observations now receive it.
- Pending tool completion could finalize an earlier success after account invalidation: finalization respects the permanent local stop.
- An initial fixture put the stale response before establishing the expected identity; it now changes identity during a post-thread in-flight read. A queued notification behind the rate response prompted the closing account round trip. These corrections preserve the intended assertions; early failed focused runs are not accepted as passes.

Security, control-plane, recovery and acceptance roles independently accepted exact implementation commit **`77b2848e45332850072b3fe9167e215737902569`** against `90fdc3d22d6469a82d05dcd2f83ce50e4c373979`, inspected the passing receipts and found no remaining material issues. Recovery and acceptance are separate verdicts from the same read-only reviewer; no reviewer edited source. This documentation follow-up changes no executable files. The final documentation head, base, mergeability and integration result are checked separately and recorded in the resulting PR and final handoff. Source acceptance does not authorize inference or a budget reset.

## Readiness and proposed next owner prompt

Passing source acceptance makes the runtime repair eligible for a separately authorized real experiment; it does **not** establish successful real employee inference. The original stopped pilot cannot be reopened by the current CLI. There is no durable successor/remaining-budget mechanism. A new `prepare` would create a fresh local four-turn approval and must not be used to recover the consumed allowance.

The next owner decision must explicitly permit a reviewed continuation mechanism that carries the original **one consumed reservation**, preserves its immutable evidence and revoked scope, enforces at most **three remaining reservations across the original four-turn authorization**, and releases at most **one** new Atlas attempt. No such mechanism is implemented or executed in this repair. The following is a proposed prompt for owner review, not an instruction executed by this task:

> Resume Decision037 only after verifying the merged account-notification repair and clean synchronized accepted main. Preserve the original stopped pilot, revoked scope, execution and one consumed reservation; zero confirmed genuine turns remains the historical result. First implement and independently review a durable remaining-budget continuation that links to the original pilot, carries its consumed reservation, prevents duplicate successor/release after restart, and caps cumulative reservations at four. I authorize source work for that mechanism and, only after its tests, reviews and accepted integration, exactly one new supervised genuine Atlas turn using existing credits. Do not reopen the old scope or reuse its failed request, and do not grant a replacement four-turn allowance. The three remaining reservations are an absolute ceiling, not permission to release three turns in this continuation. Use the previously approved minimal Atlas/Maya identities, but release Atlas only, with clearly synthetic investment evidence. Reverify current ChatGPT authentication, approved model, build/disk/resource conditions and non-inference preflight. Record my October 10, 2026 06:04 Vancouver automatic-reload-OFF confirmation as owner-supplied screenshot confirmation, not an API result; if its continued accuracy cannot be established, obtain my fresh confirmation before release. I accept existing purchased-credit consumption and provider-internal retries within this one turn. Apply the five-minute local deadline, one investment turn at a time and no BotSquad automatic retry. Preserve the genuine result, execution/provider IDs, usage, settlement and API-equivalent estimate or explicit unavailable status. Stop after that single attempt. No purchases/reload changes, production deployment, real market data/brokerage, public publication, Asymmetri changes or recurring execution are authorized.

This proposed authorization is broader than simply rerunning today's CLI because the consumed-budget handoff is not currently supported. The owner may instead request that mechanism as a separate source-only task before authorizing any real turn.
