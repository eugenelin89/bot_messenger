# INV-CREDIT-PILOT-CONTINUATION — Remaining Decision 037 allowance

**Date:** 2026-10-10 America/Vancouver
**Status:** Reviewed and merged; one genuine Atlas turn completed and settled; lineage stopped and scope revoked

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

Source/tests commit: `478c5b077ca2cbb5ef9e7660520b74a2a71c7c54`, based on `d1cbbea9f948c58555c59fd960d42caecc8e6b1d`. Separate acceptance documentation commit: `9c06324b02ee721276bdb31ecfb088e39e3c7559`. All three specialists approved the exact source. [PR #49](https://github.com/eugenelin89/bot_messenger/pull/49) had the expected head/base and was mergeable; GitHub published no commit-status contexts. It merged as **`4db927f02925adb7d86c9a5c7d6e3bbca3f030b5`**.

Clean local and remote main matched that merge, its tree matched the reviewed head exactly, and check/build passed again before registration or provider preflight. The genuine turn used that accepted merge SHA, never the feature worktree. Private integration/build/review receipts are retained. This later outcome documentation changes no executable source. The [execution plan](../../exec-plans/credit-pilot-continuation.md) records the completed sequence.

## Actual provider execution and usage

Official non-inference preflight verified current ChatGPT authentication, confinement/routing and the exact `gpt-6-luna` catalog entry with low reasoning. Durable account/routing fingerprints matched again immediately before the single provider admission. No fallback or account switch occurred.

Atlas then performed the genuine opening analysis of clearly fictional ACME/BETA evidence, comparing HOLD/all cash with a hypothetical small position, identifying missing information and conditions for reconsideration. One genuine contribution was retained privately; its conclusion was not scripted. This establishes one employee response, not two-worker collaboration or a completed investment cycle. Raw task/response bytes, minimal identities and execution/request/thread/turn IDs are retained only in the owner-private evidence directory.

| Actual successor observation | Retained result |
| --- | --- |
| Accepted executable source | `4db927f02925adb7d86c9a5c7d6e3bbca3f030b5` |
| Model / reasoning / runtime | `gpt-6-luna` / low / Codex CLI 0.157.0 |
| Execution start / finish, UTC | 2026-10-11 06:06:50.537 / 06:07:05.423 |
| Vancouver local time | October 10, 23:06:50–23:07:05 |
| Durable one-use admission | 06:06:55.055 UTC; one `turn/start` confirmed with exact thread/turn IDs |
| Completion / settlement | Completed / settled; no retained uncertainty |
| Local usage duration, including startup | 14.883 seconds |
| Input tokens / cached-input subset | 18,878 / 10,752 |
| Output / total tokens | 538 / 19,416 |
| Reported token completeness | Complete; no missing-usage reasons reported |
| API-equivalent USD | **$0.00118912, partial base-token estimate** |
| Pricing basis | Retained `openai-2026-10-10-fdc607e42c34c9a1`; additional/long-context dimensions unverified |
| Actual purchased-credit deduction / included allowance use | Unavailable and not attributable |
| Provider-managed retries | None observed; unreported internal retries cannot be excluded |
| Atlas / Maya executions | 1 / 0 |
| Formal proposals / reviews / paper submissions | 0 / 0 / 0 |
| Final local pilot / external lineage / scope | Stopped / stopped / revoked |
| Stop reason | Single authorized attempt finished; no renewed release authority |

The reference estimate is not subscription billing or a measured purchased-credit charge. No credit purchase or reload change occurred. Final evidence in the external authority and disposable environment matched. Independent private copies of both databases and their reports, exact task/response, usage summary, confirmation and validation receipts are retained outside Git. Post-stop inspection found one execution, no rejected tools or observed provider-retry events, and a revoked scope. All 47 original historical files remained byte-identical after execution.

## Residual authority and non-activation

The original historical consumption remains 1/4 with zero original confirmed turns. The successor consumed one further reservation and completed one confirmed turn: **cumulative 2/4, two unused reservations, zero further authorized releases**. Both pilots remain stopped and both scopes revoked. There is no retry, Maya release or automatic use of the unused allowance.

No new credit purchase, billing-setting mutation, production HQ deployment, official investment activation, live market data, brokerage access, public Asymmetri publication, paper-order mutation or recurring model schedule was performed. No execution blocker remains; the continuation is stopped as required. Further inference requires new owner authorization and a separately reviewed mechanism; this implementation exposes no restart/reset path.

## 2026-10-11 addendum — separately authorized Maya review

The completed Atlas results above remain historical and unchanged. A later owner request
now authorizes exactly one Maya review from the same remaining allowance, implemented by
an additive schema2 extension rather than reopening the stopped Atlas successor. See
[Maya acceptance](INV-CREDIT-MAYA-REVIEW.md) for source gates and subsequent outcome.
The new review imports the authentic complete Atlas contribution as explicitly historical
evidence. It does not rewrite Atlas's execution or authorize a fourth reservation.

Maya subsequently completed and settled one genuine review from PR #51 merge `2f13f93`,
fully reading/citing both historical records. The [Maya outcome](INV-CREDIT-MAYA-REVIEW.md)
records 3/4 cumulative reservations, one unused and zero further release authority. Atlas's
original response, cost, receipts and revoked scope above are unchanged.

## Final Atlas authorization — 2026-10-11

The opening Atlas execution and its original pricing, text and identities remain immutable.
Following the settled Maya review, the owner separately authorizes only the final original
reservation for an Atlas response after source and runtime gates. Its three full historical
imports include this authentic opening, the original fictional packet and Maya's actual
review. [Final acceptance](INV-CREDIT-FINAL-ATLAS.md) distinguishes source delivery and
substantive asynchronous feedback from synchronous or autonomous operation. No earlier
stopped scope reopens; cumulative reservation four ends all pilot execution permission.
