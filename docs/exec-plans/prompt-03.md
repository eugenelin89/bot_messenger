# Execution Plan — Prompt 03: Ubuntu HQ and worker AI profiles

**Status:** Active  
**Owner:** Codex task 01a0db2e-25ef-7d21-9950-0a35ef034ff4, sole writer  
**Branch:** feature/prompt-03-ubuntu-hq  
**Worktree:** /Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger  
**Started:** 2026-09-26 00:47 UTC  
**Starting origin/main:** 2239be6304495d583053f4ffabd8e900d4fb63f6  
**Initial ETA:** 45–90 minutes before reading the attachment; revised to 5–8 hours after full scope review.  
**Current ETA:** 2–4 hours remaining at 01:03 UTC, excluding human authorization wait.

## Objective and scope

Reproducibly bootstrap the dedicated Ubuntu host using only its existing SSH alias,
run BotSquad non-root under systemd with durable data and loopback UI, validate Linux
engineering and real Codex workflows, and persist configurable worker AI profiles
with scheduling priority, human locks and execution provenance. Deliver through a
validated feature branch, normal main integration and final main deployment.

No other worktrees or uncommitted changes found. Existing main fast-forwarded from
e5ceeee to the freshly fetched origin/main before creating the feature branch.
No delegated implementation agents. Preserve existing branches and retained data.

## Host and security boundaries

- SSH target: `botsquad`, using existing local SSH config; no key copying.
- Expected and observed: Ubuntu 24.04.4 LTS, kernel 6.8.0-124-generic, x86_64,
  1 vCPU, 1.9 GiB RAM, 48 GiB root disk, no swap; bootstrap login root.
- Dedicated service identity only; logical workers do not become Unix users here.
- Keep SSH and unrelated host configuration; UI must bind 127.0.0.1:4310.
- Durable data outside checkout; immutable source readable but not writable by service.
- Linux runner must fail closed; no broad tools or unsandboxed fallback.
- Human profile control is trusted HTTP/control-plane authority, never bot prose.
- Preserve IDs, bindings and historical evidence in explicit SQLite migrations.
- No Nix, Computer Use, broad approval grants, public hosting or provider API.

## Phases and validation

1. Repository and complete project/prompt review; remote read-only preflight.
2. Investigate installed/latest stable Codex protocol, model/reasoning discovery and auth.
3. Reusable deployment/bootstrap architecture, systemd, health and persistent swap.
4. Platform confinement adapter and actual denied Linux/macOS security probes.
5. Worker AI profile migration, trusted controls, provenance and friendly thread naming.
6. Priority dispatch and UI using runtime-discovered settings.
7. Deterministic static, migration, authority, scheduling, HTTP and runtime tests.
8. Commit/push feature; bootstrap exact SHA; complete service-account Codex login if needed.
9. Real Ubuntu Prompt 01 and Prompt 02 workflows with overlap/resource measurements.
10. Restart, one bounded reboot and second-run bootstrap preservation checks.
11. Security review, current docs, decision and sanitized validation evidence.
12. Fetch current main, integrate normally, validate and push without force.
13. Deploy final main SHA and verify health, state, loopback sockets and runtime.

Run `npm run check`, `npm test`, shell syntax, JS syntax and `git diff --check`.
Exercise unsupported profiles, locks, immutable provenance, stable FIFO, pause,
concurrency/atomic claims, capability checks and legacy migration. Real workflows
must use actual Codex as botsquad, exact submitted-commit review and trusted tests.
Record all unexercised gates honestly; incomplete acceptance must not merge to main.

## Evidence and progress

| Time UTC | Finding / result |
| --- | --- |
| 00:47 | Initial ETA provided before tools. |
| 00:50 | Network sandbox required escalation; Git/SSH read-only retries succeeded. |
| 00:52 | Clean current-main feature branch; host identity/resources match expectation. |
| 00:55 | 15-minute ETA heartbeat created; full documentation and code review underway. |

## Remaining work / blockers

Implementation and acceptance phases above remain. No host conflict found so far.
Codex login under the new service account may require the operator; finish all
noninteractive setup before requesting that step. Do not transfer local auth files.

## Documentation freshness and handoff

Update README, setup/bootstrap, vision/organization/Ubuntu model, architecture,
decision index and a new Decision 010. Preserve historical Decision 009 rationale.
Record sanitized evidence in docs/validation/prompt-03-ubuntu.md and JSON, including
Git identity, host/runtime, actual AI profiles/executions, security, resource,
restart/reboot/idempotency and final deployed/main equality.

- 01:03 UTC: 56/56 deterministic tests and actual Codex 0.157.0 discovery pass.
  Revised ETA 2–4 hours. Bootstrap implementation ready for first exact-SHA deployment.
- Concurrent PR #1 (`docs/ubuntu-hq-direction`, eed6353) inspected; all direction
  changes will be merged into the feature branch and reconciled against evidence.
  Prompt 01/02 execution plans and validation records remain untouched.
