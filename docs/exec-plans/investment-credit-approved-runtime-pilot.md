# Execution Plan — Credit-approved runtime and finite private pilot

**Status:** Source accepted for integration; genuine pilot pending explicit owner reload confirmation
**Owner:** Codex parent, sole writer; specialists read-only
**Branch:** `feature/investment-credit-approved-runtime`
**Worktree:** `bot_messenger-credit-pilot`
**Started:** 2026-10-10
**Base:** `35409a0127ef735f90ac75b61fe1cd8a46f0f456`
**Initial ETA:** 3–5 hours, dependent on confinement and review findings. **Latest estimate:** another1–2 hours for serial regression and reviewed integration; live inference remains gated on owner confirmation.

## Objective and authorization

Implement a distinct credit-approved supervised subscription capability for one disposable private synthetic pilot. The owner accepts existing purchased credits and provider-managed retries within each supervised turn. No additional purchase, automatic reload, API-key account, production deployment, official run, real market data, brokerage, public publication or recurring operation is authorized.

Maximum four real turns for the whole pilot, five minutes each, one investment execution and the existing two global slots. Outer activity ceilings remain. BotSquad never replays an uncertain turn. Each subsequent real turn requires inspection of the previous settled response and durable usage. Source implementation, synthetic tests, independent review and reviewed merge must precede inference. Automatic reload must be verified disabled or explicitly confirmed by the owner; confirmation is currently pending.

## Boundaries and references

Follow AGENTS.md, Decisions029/031/034/035/036, investment DECISIONS/ROADMAP/SIMULATION_RULES section7, runtime and usage architecture. Preserve Decision036 and its historical evidence; create Decision037. Preserve immutable reservations, current authorization, worker/session provenance, private usage, decimal reference costs, financial correctness and public contracts. Existing private company state and Asymmetri remain untouched.

## Work sequence

1. Verify supported pinned0.157.0 provider/authentication/confinement contracts and design a default-disabled pilot capability.
2. Implement exact policy, durable four-turn admission, sequential supervision, account checks, absolute deadline and finite transport termination. Add an explicit disposable pilot harness with no public transport or recurring activation.
3. Validate fake transports, denials, retries, interruption, missing settlement, resumed identity, usage, crash/restart, quota, expiry/pause/revoke, migration and UI. Run resource-safe serial full regression.
4. Obtain control-plane, security, recovery, accounting and acceptance reviews; fix material findings and obtain exact-head approval.
5. Commit/push/PR/merge accepted source; verify local and remote main.
6. Only after all gates: run sequential genuine employee turns from the accepted local build, inspect each result, stop at uncertainty or four reservations. If reload confirmation is unavailable, leave inference pending.
7. Record real versus synthetic evidence, per-worker usage, provider limitations, exact Git receipts and operational non-activation; stop after this milestone.

## Validation and evidence ledger

Required: check, build, full tests, contracts, focused runtime/admission/usage/recovery/team/publication tests, browser acceptance, populated migration preservation, diff check. Fakes establish local enforcement only. Genuine inference must retain response provenance, identifiers, timestamps and unknowns without account secrets or balance disclosure.

| Check | Result |
| --- | --- |
| Local/remote base and clean main | Verified expected35409a0 |
| Isolated branch/worktree | Created |
| Automatic reload disabled | Owner confirmation requested; no inference |
| Source and specialist design/source reviews | Implemented; material findings fixed |
| Read-only hardened Codex preflight | ChatGPT, official backend, verified disabled skills; zero model turns |
| Focused runtime/control tests | 79/79 final focused run; also included in full regression |
| Browser checks | 8/8 at390/1440px; screenshots inspected |
| Full serial regression |1,001 pass/1 Linux-only skip/0 fail out of1,002;276.6s |
| Contracts |175/175 pass |
| Exact-head reviews | All five roles accepted clean394ff8cc90a9b177900bc7587e41756499b24a4a |
| Integration | [PR47](https://github.com/eugenelin89/bot_messenger/pull/47); final merge/main receipt in PR and handoff |
| Genuine pilot | Pending reload confirmation; zero real turns |

## Current decisions and remaining work

Provider-managed retries are accepted only within the new private-test mode. Included-only and strict policies remain unchanged. Read-only control-plane, security, recovery, accounting and acceptance reviews completed; material findings addressed. All five roles accepted the exact source commit; the documentation-only closure is reviewed before merge. No actual model turn has run for this pilot.

## Handoff boundary

No genuine worker roster was exported or live pilot created. Actual BotSquad model turns are0. The unfulfilled owner reload-confirmation gate intentionally leaves PhaseD pending; no model schedule, deployment, purchase, market-data acquisition or publication follows. Required deterministic checks are complete. After source merge, confirm the setting, build exact accepted main and supervise one turn before considering the remaining allowance.
