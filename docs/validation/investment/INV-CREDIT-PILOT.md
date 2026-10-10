# INV-CREDIT-PILOT — Private credit-approved runtime acceptance

**Date:** 2026-10-10  
**Status:** Deterministic source acceptance complete; integration review in progress; real inference pending owner reload confirmation  
**Accepted starting point:** `35409a0127ef735f90ac75b61fe1cd8a46f0f456` (PR46)

## Authorization and evidence classes

[Decision037](../../decisions/decision_037_credit_approved_private_pilot.md) permits existing purchased Codex credits and provider-managed retries for one private synthetic pilot of at most four supervised turns. This does not reopen included-only or strict investment dispatch. No purchase, production, official run, real market data, brokerage, public delivery or recurring operation is authorized.

- **Implemented source:** distinct opt-in runtime, immutable schema21 approval, exact one-request release, existing activity reservations and private usage reporting, permanent pilot stop, read-only paper inspection, explicit disposable supervisor.
- **Deterministic evidence:** fake app-server responses and fictitious fixture identities/market packet. These are not employee inference or live financial evidence.
- **Read-only real runtime:** pinned `codex-cli 0.157.0` initialized with hardened settings and verified ChatGPT authentication. Catalog advertised `gpt-6-astra`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`; `gpt-5.3-codex` was absent. Catalog presence is not successful inference or entitlement proof. Model turns: **0**. A preflight initially rejected a path-bearing backend-origin assumption; pinned source confirmed this field contains only `https://chatgpt.com`. The corrected guard passed the actual read-only preflight and rejects foreign origins in fixtures.
- **Genuine employee demonstration:** pending. Automatic credit reload cannot be established through the supported account API; explicit owner confirmation was requested and is not inferred.
- **Operational/public readiness:** not established. This is neither a full investment cycle nor deployment acceptance.

## Local control design

A singleton immutable approval binds the exact private scope, pilot ID, model, once-bound salted account fingerprint and canonical disposable directory. No HTTP or worker tool creates/releases that approval. Every release requires the previous execution ID to have been inspected and reconciled; each claim consumes the release and reserves one of four total turns atomically. All pilot reservations across runs count, including failures. Existing eight/24h, twenty-four/run, one investment and two global ceilings remain. Restart discards unused releases and fences active uncertainty. Scope/group/global pause stops the finite pilot permanently.

`runSubscriptionInvestment` is present only on an explicitly configured credit-pilot adapter. It independently validates policy/root/model/tools, verifies ChatGPT and the official provider, rechecks current account eligibility and control-plane authority immediately before one `turn/start`, and records actual notifications. Fresh/resumed threads use exact model/provider, no fallback, standard tier, no native environments, inherited MCP disablement and no external tool capability. Unauthorized tool/native approval, model reroute and account change interrupt; provider retries are observed without starting a replacement turn.

The absolute deadline derives from the durable reservation. Timeout aborts tools and requests interruption, closes transport after six seconds and allows one second before forced termination. This local bound does not guarantee upstream billing cutoff. Unknown settlement retains usage and consumed allowance. Read-only account eligibility does not measure actual per-pilot credit deductions.

## Validation ledger

Validated on macOS arm64, Node24.10.0, pinned Codex0.157.0. No isolated Linux runtime acceptance was performed.

| Check | Result |
| --- | --- |
| `npm run check` and `npm run build` | Pass |
| `npm test` with default serial file concurrency | 1,002 tests:1,001 pass,0 fail,1 Linux-only skip;276.6s |
| `npm run contracts:test` |175/175 pass; generated contracts unchanged |
| Focused runtime/activity/usage/recovery/team/publication | Full regression plus79/79 final focused Codex/activity/pilot tests |
| Populated schema20→21 upgrade, repeat open and foreign keys | Pass; existing rows preserved, zero automatic approvals |
| Browser: private pilot/usage/team/run at390/1440px |8/8 pass; no page errors/external requests, keyboard/overflow checked; pilot screenshot inspected |
| `git diff --check` and changed Markdown local links | Pass |
| Real hardened account/catalog/skill preflight | Pass,0 model turns; official ChatGPT origin and disabled skill inventory |

Local development receipts are `/private/tmp/credit-full-tests.log`, `/private/tmp/credit-contracts.log`, `/private/tmp/credit-focused-final.log`, `/private/tmp/credit-browser.log` and sanitized `/private/tmp/credit-readonly-preflight.json`. Browser images are in `/private/tmp/botsquad-credit-browser/`. These are local test artifacts, not published pilot transcripts.

Control plane, security, recovery, budget/accounting and acceptance roles reviewed read-only. Exact-head review and accepted main merge must precede any real turn.

Early fixture corrections: unique session-derived test thread IDs replaced an invalid shared binding; facilitator fixture references now cite a delivered prior contribution; timeout fixture allows startup before exercising unacknowledged interruption. These failures and causes are recorded in the development transcript; the reusable local log paths were overwritten by later runs. Corrections did not weaken controls.

## Pilot evidence and usage

No genuine employee turns have run. No worker collaboration, token consumption, API-equivalent pilot cost or attributable purchased-credit deduction is claimed. Preparation and catalog checks are read-only provider operations, not model turns. If the live gate remains pending, there is no active model runner or recurring pilot schedule.

When authorized gates pass, retain the private manifest, exact accepted source SHA, minimal roster hash, original execution/worker/request/thread/turn IDs, timestamps, contributions, runtime events, usage and settlement in the disposable pilot directory. Inspect each result before a new explicit CLI release. A failed or uncertain first turn ends the pilot; do not spend the remainder to make the demonstration pass. Do not publish private transcript content as source acceptance evidence.

## Integration and operational status

Implementation commit/PR/main receipts pending. Production HQ and Asymmetri are unchanged. No official run, live stock-data acquisition, external brokerage, public publication, additional credit purchase or recurring model schedule has occurred.

The smallest next step is completing review/integration and the explicit automatic-reload-disabled gate, then one genuine supervised synthetic discussion turn. A complete investment cycle needs separately scoped authority after this finite pilot; no quota expansion follows automatically.

## Review findings and disposition

Control plane, security, recovery, budget/accounting and acceptance roles reviewed source read-only. Material findings fixed: cross-turn account identity binding; account changes during admission; inherited host skills/global instruction context; completed notification arriving after local timeout; retry token coverage falsely appearing complete; and test fixtures whose missing contribution obscured usage-gate coverage. Cross-process stop was verified to poll durable state and abort the owning dispatcher, so the initial contrary finding was withdrawn. Emitted CLI root resolution was verified with the URL API and a compiled inspection smoke test; a contrary path-count finding was also withdrawn.

Confinement now suppresses skill catalog/bundled/search features, enumerates metadata for the exact disposable workspace, relaunches with exact disabled skill paths, and verifies every skill disabled before a thread. Context JSON escapes literal skill sigils while round-tripping unchanged. Nonempty global Codex AGENTS files block the pilot without reading their contents. A trusted compact prompt replaces inherited compaction prose. Account fingerprints retain no raw email/account identifier. Internal retry observations keep reported tokens but mark coverage/estimate partial; absent or conflicting authoritative response telemetry denies continuation. Optional missing cached/cache-write/reasoning categories remain visibly partial but do not alone imply unknown provider settlement.
