# Execution plan — Credit pilot account notification repair

**Status:** Source acceptance complete; integration receipt tracked in PR/final handoff

**Owner:** Parent Codex, sole writer; specialists read-only

**Branch:** `fix/credit-account-notifications`

**Worktree:** `bot_messenger-credit-pilot`

**Started:** 2026-10-10

**Base:** `90fdc3d22d6469a82d05dcd2f83ce50e4c373979`

**Initial ETA:** 1–2 hours for pinned protocol investigation, repair, serial validation and reviewed integration. Final validation finished within that estimate; integration remains a short final step.

## Objective and boundaries

Treat startup `account/updated` as authentication invalidation requiring authoritative rereads, while preserving rejection of real identity/provider/routing changes. This task permits source and fake-transport validation only: zero actual provider turns, no pilot preparation/reopening, no production or Asymmetri changes, purchases or schedules.

The October 10 first attempt remains stopped and its private scope revoked, with one consumed reservation, zero confirmed model turns and unavailable usage. Original temporary and archived private evidence is hashed before work and must remain byte-identical. No database migration or reservation mutation is needed.

## Plan and invariants

1. Verify clean local/remote main; inspect Codex `rust-v0.157.0` protocol/source and the original failure evidence.
2. Add generation-based account revalidation with authoritative account, requirements, configuration, routing and eligibility checks. Pin salted identity; never retain raw account information. Keep final verification/admission/write free of asynchronous gaps. Active-turn notifications stop tools and interrupt, never replay.
3. Reproduce normal startup and adversarial ordering with a fake app-server; cover actual switches, lookup failures, requirements, shutdown and ordinary runtime behavior.
4. Run check/build, focused usage/recovery/pilot regressions, serial full tests, contracts and diff checks. Keep native/device resources untouched.
5. Obtain independent read-only security, control-plane, recovery and acceptance reviews; resolve findings; commit source/tests and documentation, push PR, verify exact reviewed head/base, merge and synchronize main.
6. Record the incident closure and a proposed separately authorized next prompt without executing it. Source acceptance does not establish real employee inference.

## References and progress

Read AGENTS, runtime/transport/credit policy and supervisor/tests, Decision037, pilot acceptance/tutorial; preserve Decision029 and investment DECISIONS/ROADMAP/SIMULATION_RULES section7. Existing runtime/provider/tool confinement and durable allowance remain unchanged.

- Local/remote main verified at the expected base; clean owned worktree reused.
- Pinned README confirms routing-ready notifications on newly initialized connections; clients reread account and requirements.
- Implemented generation-based authoritative revalidation, unchanged historical identity fingerprint plus salted routing constraint pinning, synchronous final admission/write and conservative active interruption.
- Review findings fixed: audit authority exceptions cannot escape the stop path; closing account authentication is rechecked; late tool completion cannot reopen a stopped pilot.
- Check/build and focused runtime/pilot/ordinary-adapter suite pass:100/100. Original47 evidence files match baseline hashes without database opening; independent reviewer verified the same.
- Initial full regression hit restricted-environment loopback/Unix socket and nested macOS sandbox denials. Preserved its failed receipt and reran the unchanged serial suite with required local capabilities:1,031 pass/0 fail/6 skips (one Linux, five opt-in receiver);175 contracts and81 focused usage/recovery pass. Diff and85 changed-document local links pass.
- Security, control-plane, recovery and acceptance roles accepted exact implementation commit `77b2848e45332850072b3fe9167e215737902569` with no remaining material findings. Documentation follow-up has no executable changes; exact final-head/base/mergeability and main synchronization are recorded in the PR/final handoff.
- Concurrent Mac session confirmed no conflicting reservation; no native/device resource use. Disk remains above15GB. No Asymmetri changes.
- Closure and dated historical/current-status clarifications drafted. Future genuine attempt requires separate owner authorization and a reviewed durable remaining-budget mechanism; current CLI cannot carry the consumed reservation to a successor.

## Handoff

See the [incident closure and proposed owner prompt](../validation/investment/INV-CREDIT-ACCOUNT-NOTIFICATION-REPAIR.md). Implementation, tests and exact source review are accepted; Git integration is the final step. No real model execution is authorized by this repair, and the next prompt is not executed automatically.
