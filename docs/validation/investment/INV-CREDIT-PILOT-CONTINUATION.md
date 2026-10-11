# INV-CREDIT-PILOT-CONTINUATION — Remaining Decision 037 allowance

**Date:** 2026-10-10 America/Vancouver  
**Status:** Source implemented and deterministic acceptance passed; integration pending; no new genuine turn yet  
**Starting main:** `d1cbbea9f948c58555c59fd960d42caecc8e6b1d` (PR #48)

## Historical evidence remains unchanged

The original Decision 037 pilot remains stopped and its scope revoked. Its failed Atlas setup consumed **one of four reservations**, with zero confirmed provider turns, no employee response, no authoritative token usage or attributable credit deduction. Maya did not run. PR #48 repaired notification handling without reopening that scope or changing settlement. All 47 retained archive/original files matched the independently retained repair baseline before this work; no historical database was opened in place. New verification reads archive bytes and inspects a disposable read-only database copy. Raw evidence and IDs stay private.

The owner now explicitly authorizes durable continuation and **one new Atlas reservation**, following reviewed source integration. Three reservations are unused before that attempt, but only one is releasable. A consumed successor reservation makes the cumulative result **2/4**, with two unused and **zero further releases authorized**. Failed setup, local rollback and uncertain provider effects never refund it.

## Durable continuation and trust boundary

A dedicated SQLite schema 1 lives under the OS account's `.botsquad/decision037-authority`, outside disposable execution workspaces and Git. The home comes from the OS account, not `HOME`, `CODEX_HOME`, a manifest or CLI-selected database. Exclusive directory creation retains an initialization tombstone; missing/incomplete existing authority fails closed and has no reset/reinitialize command. Directory/file ownership, private modes, canonical paths, symlinks, hardlinks and open-file replacement are checked. This does not defend against the trusted host owner rewriting source or replacing all authority; owner-controlled backup custody remains an operational responsibility.

Atomic initialization records Decision 037, the original identity/archive digest and file hashes, original consumed reservation, explicit owner confirmation and one newly authorized release. A singleton binds one successor's canonical root, Atlas identity, scope/group/run, exact model, accepted source and expiry. Fresh non-inference provider checks pin salted account and routing fingerprints. The historical original fingerprint stays null: equality with the failed attempt's account cannot be retrospectively established.

Separate short `BEGIN IMMEDIATE`/FULL-synchronization transactions commit the external release and reservation before corresponding temporary-database commits. Local failure never rolls those external facts back. An independent one-use admission transition commits immediately before `turn/start`, after ordinary control-plane admission and generation verification. A module-issued opaque capability binds the runtime to the fixed durable registry; manifests, fixture databases, no-op admission callbacks and arbitrary registry objects cannot issue it. Repeated commands, copied local state and different processes cannot reuse admission.

Success, failure, expiry, pause, stop and uncertain restart end this successor's release authority permanently. Late completion appends a receipt without clearing an earlier uncertainty/stop. The supervisor checks external authority during active inference and interrupts on stop, disappearance or replacement. Emergency stop does not require a clean source checkout. A completed turn does not renew authority, and this implementation has no automatic replacement-workspace or third/fourth-release path.

The original `run.ts prepare/turn` commands now reject real use. Historical inspection/stop remain; the original archive must never be reopened through that migrating supervisor. Ordinary fixtures retain their historical local-budget tests, but production Codex requires the separate opaque permit. The fake-transport subclass is test code only and pins its local script; there is no production test flag.

## Account, billing and runtime safety

PR #48's generation-based account/requirements/configuration/eligibility checks remain. Ordinary startup snapshots with unchanged verified identity pass; active notifications conservatively interrupt. Current preflight pins both account and routing across process invocations. Exact model and official ChatGPT provider, disabled skills/MCP/native tools, no fallback, no API-key provider and existing one-investment/two-global-slot limits remain. Five minutes is a local supervisory deadline, not a guaranteed upstream billing cutoff.

The historical October 10 **06:04 Vancouver** screenshot confirmation remains owner-supplied evidence, not a queried billing result. During this continuation the owner freshly replied, “I checked: automatic reload is still OFF.” That confirmation is separately retained privately. Current policy requires confirmation within 24 hours at admission; no setting was mutated and no purchase authorized. Included allowance versus existing purchased credits cannot be promised or attributed from shared account observations. Provider-managed internal retries within the single turn are accepted.

## Deterministic validation and reviews

All tests use synthetic state and fake transport; none invokes the real provider's `turn/start`. Coverage includes inherited 1 / remaining 3, cumulative 2, no extra release, absolute fifth denial, transactional rollback, process kills during initialization/release/reserve/admit, simultaneous preparation/reservation/admission, copied execution state, removed workspace, unknown settlement, late completion, owner/external stop, registry replacement, OS-home anchoring, account/routing changes, deadline, fixture/forged-permit denial and immutable original archive inspection. Existing account repair, usage/recovery, ordinary runtime, shared slots and contract regressions remain required.

Initial focused run: 32/33 passed; the expiry fixture wrongly progressed the expired group before checking the lineage, removing its queued request. The corrected assertion directly tests retained release authority. Subsequent focused run passed 117/117 before final review fixes. The first active registry-replacement test exposed a completion exception after interruption; local completion now retains a stopped record even when the external authority is unavailable. A focused run also exposed a notification/audit revocation race: credit-mode notification rejection now requests explicit provider interruption instead of only closing transport, with a dedicated regression. A finalization test initially compared SQLite row prototypes against parsed JSON; its assertion was corrected to compare the exact serialized report bytes. These early runs are development evidence, not final acceptance.

Independent read-only control-plane/security, recovery/accounting and acceptance specialists requested: fixed OS identity lookup, external active-stop polling, emergency stop independent of source checks, initialization atomicity, preservation of the winning concurrent preparation, and integrated fake-transport lineage admission evidence. Review also caught repeated scope revocation preventing final evidence after an external stop. Finalization now serializes an idempotent revoke and has a regression that saves both evidence reports while retaining the original stop reason and uncertainty. All reviewers report no remaining material source findings. Final full-suite acceptance passed. Exact source review is pinned to `478c5b077ca2cbb5ef9e7660520b74a2a71c7c54`; all three read-only specialists approved that exact source with no remaining blocking or important findings: control-plane/security, crash/recovery/accounting, and acceptance/testing. None performed provider calls.

| Final check | Result |
| --- | --- |
| TypeScript check/build | Passed |
| Credit runtime, pilot and continuation | 111/111 passed, including 25 continuation tests |
| Contracts | 175/175 passed |
| Usage/activity/migration/investment recovery | 81/81 passed |
| Final full suite | 1,059 passed / 6 skipped / 0 failed (1,065 total), 309.293 seconds |
| Diff, privacy/secret scan, local links | Passed; 142 links resolve |
| Retained historical files | 47/47 byte-identical |

The six skips are existing external-receiver fixtures and a Linux-only build case outside this changed surface. Completed logs and source-review receipts are retained in the owner-private continuation evidence directory.

## Reviewed Git integration

Source/tests commit: `478c5b077ca2cbb5ef9e7660520b74a2a71c7c54`, based on `d1cbbea9f948c58555c59fd960d42caecc8e6b1d`. A separate acceptance documentation commit follows. Feature PR, accepted merge, clean local/remote main verification and rebuild remain pending. No inference may run from this feature worktree or unreviewed source. The [execution plan](../../exec-plans/credit-pilot-continuation.md) records progress.

## Actual provider execution and usage

Not started. Registration of real authority, successor preparation, official preflight and one Atlas release remain after integration. No fabricated response, model usage or credit deduction is claimed. The eventual private report must include exact execution/request/thread/turn identities, confirmation of `turn/start`, timestamps, duration, settlement, reported input/cached-input/output tokens, API-equivalent USD or unknown/partial status, observed retries, reservation counts and stop reason. Private transcript bytes stay out of Git.

## Residual authority and non-activation

Current historical consumption remains 1/4 until a genuine successor reservation is committed. The current owner request permits at most one new reservation. No Maya turn, automatic follow-up, paper-order mutation, production HQ deployment, official investment activation, live market data, brokerage, Asymmetri publication, new credit purchase, reload change or recurring model schedule is authorized or performed by source acceptance.
