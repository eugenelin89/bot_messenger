# Prompt 09 validation — company operating loop and durable clock

**Status: Prompt 09 complete — actual acceptance passed, normally merged and deployed.** Updated 2026-10-05.
Implementation PR #10 merged and deployed as `9c9bdce50f5ec3bb7ec4931979dc9eed70bff260`. The final documentation
revision's exact identity is recorded in the delivery handoff/protected HQ journal after its deployment.
The [execution plan](../exec-plans/prompt-09.md) records all gates. This report separates
real workers, synthetic product evidence, deterministic application faults and production.

## Candidate and environment

Actual model acceptance used engine source `c6690a5b55fc1d1f9fdfe991626583dbc5d972fd`, following reviewed
authority/withdrawal fixes in `66c291a` and `fd6a755`. Ubuntu uses Node 24.21 and pinned Codex
0.157.0, with the existing service account and gpt-6-sol workers at low reasoning. Model
settings were not raised to conceal the failed tool-contract behavior. Checkpoint `7d1e1b7f14f1604d69174ed6212fc648e4a7f3f1` adds the final tests, owner result
links and evidence; its backend/dependencies are unchanged. Final code `f3ce1f6771bcd4f135215b1a6c03a22e10ae3c6a`
adds the three independently reviewed lifecycle/timezone fixes documented below; their affected
failure/browser paths and the complete suite were rerun. Provider, evidence, research, discussion
and persistence paths from the real runs are unchanged. All demonstrations
use separate data roots beneath `/var/lib/botsquad/validation`; production is not a fixture.

## Acceptance matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| C09-1 — broad and specific mandates | PASS | One actual broad cycle and two actual Asymmetri cycles; organization selected alternatives, participants, group and separate Task; scoped independent semantic PASS |
| C09-2 — durable schedules | PASS | Persisted one-time/interval/daily schedules, IANA zone, owner/purpose/count/end, version edits and cancellation; one actual one-time review |
| C09-3 — clock/recovery | PASS | Controlled before/exact/after due, overlap, catch-up, pause, revocation, atomic crash windows, database reopens, real elapsed-time invocation and idle service restart |
| C09-4 — two evidence-based cycles | PASS | Actual scheduled Asymmetri Cycle 2 evaluated attributable new simulated evidence and made an unscripted reasoned decision |
| Complete affected regressions | PASS | Local 258 passed/1 Linux-only skip; exact Ubuntu final code and integrated build 259/259; browser 11/11, original-result links 21/21, Python provisioner 9/9; all actual regressions below |
| Normal integration, exact deployment and preservation | PASS | PR #10 merged; protected fresh backup/migration, exact source/build/health, Chrome/idle and original/fresh preservation passed; seven owned temporary HQs stopped |

The scenario gates and the production delivery/preservation gates passed separately.

## Broad company result

Mandate `mandate_a946aa13-1e12-4065-a41a-bc58f9797b3f`, cycle
`cycle_6d5de761-2b34-4510-9949-a1ec702689b3`, ran on the isolated `20261005-contract` company.
Atlas chose a working group and Scout analysis Task. The Task proposed a collaboration
prototype; Grace challenged the assumed availability of underlying feedback, and the group
corrected its synthesis. Atlas selected a conditional cohort-linkage diagnosis before a
product intervention, with explicit alternatives, missing information and no causal claim.
One useful initiative and two append-only decisions were retained. The owner harness paused
this broad mandate after its first closed cycle. Its scheduled one-time review later expired
before dispatch and remains cancelled with its due time and reason; no second broad cycle
was manufactured. Broad baseline evidence is `simulated_fixture`.

## Asymmetri Motion two-cycle result

Mandate `mandate_b11fc003-dc05-43bb-9dfa-529e4e694484` contains product-specific fixture text;
the engine has no Asymmetri-specific strategy. Both admitted observations are explicitly
**`simulated_fixture`** in the source records, worker context and owner browser.

1. **Baseline:** observation `observation_55a4c364-1ab8-44d9-8e03-828c6346bf27` describes a
   hypothetical motion-analysis product. Its artificial values are 400 starts, 36% first
   successful analysis, 20% week-two return, and synthetic feedback split 30% setup clarity,
   25% speed, 15% export guidance, 15% unclear capabilities and 15% general interest. These
   are not private analytics or claims about the actual product.
2. **Cycle 1:** `cycle_86236e8d-4cdc-4270-858d-242182da1221` selected setup clarity provisionally,
   then evaluated its separate Scout Task and group. Decision
   `decision_678e29f3-3914-460b-8075-2fe5e90b5ddb` narrowed the next step to an internal
   first-analysis diagnostic measurement proposal, leaving processing speed as a close
   alternative. No implementation, instrumentation or marketing was approved or performed.
3. **Intervening observation:** `observation_aa9dd4da-831d-47bf-a641-bf09fbcf8112` was admitted
   by the trusted harness after Cycle 1. Twelve synthetic descriptions were fixed neutrally:
   seven consistent with the chosen mechanism, three inconclusive, two with accessibility
   or edge-case concerns. There was no customer experiment or implemented intervention.
4. **Cycle 2:** `cycle_0c0f88a4-ad8b-4e86-9247-bfa40ad31b0b` was opened by the durable scheduler,
   not a second owner review command. Decision `decision_025103ab-6e76-4e59-a0d6-a00f2fa831ba`
   evaluated the 7/3/2 evidence, rejected causal or scaling claims and stopped under the
   owner two-cycle limit. Setup clarity remains a low-confidence unimplemented hypothesis
   for separate owner consideration. Stop reflects the bounded mandate, not a claim that
   the hypothesis was disproved. The disposition was not prescribed by the harness.

Occurrence `occurrence_14146a00456b5d1bf910be24b27cd04327fb6179c2fcb74294fec5fe224f00e0`
was due at **2026-10-05 19:36:45.000 UTC**. Its cycle was created at `.019` and first worker
execution began at `.085`. Exactly one completed occurrence maps to one cycle; no execution
preceded the due time. Full decisions, groups, Task artifacts, contexts, schedules and citation
proofs are in [the actual-worker export](evidence/prompt09/real-company-c6690a5.json).

## Independent review and limitations of summaries

[The independent security and semantic report](evidence/prompt09/independent-review-c6690a5.md)
covers all 16 group contributions, both final syntheses, two complete Task artifacts and five
decisions. All 15 cited-record hashes were reconstructed independently, with complete
contiguous delivery in the same execution before commitment. Evidence export into Tasks and
groups matched the original labelled observations. The reviewer found useful interaction and
evidence-responsive alternatives without invented dissent or live business claims.

One non-blocking original summary calls Scout's completed Task a “Maya analysis Task.” Its
authoritative Task/worker/execution records and decision citations are correct. The immutable
summary is retained unchanged. Derived summaries are fallible and cannot grant authority.

Earlier separate security review found six material issues: private Task provider reuse,
queued schedule pause/expiry, evidence withdrawal, Task deadlines, hypothesis-only grounding,
and deduplicated retrieval charging. Follow-up found withdrawal through derivatives/provider
history and unexecuted Task metadata. All were fixed and independently reviewed, with focused
regressions. Fresh strategic generations preserve durable identity and old provider references;
they do not clear unknown-outcome fences or change ordinary direct/Task continuity.

## Clock and recovery evidence

The focused mandate suite has 45 tests. These use an injected application clock and, where
labelled, a simulated runtime; they do not claim every crash point was induced on an external
provider. Atomic occurrence/consumption and cycle/request claim boundaries roll back together.
Actual Store/Company reopens cover persisted occurrences, before-due scheduling and provider
reference persistence both before and after invocation. A known settled failure waits 30 then
60 seconds; the third failure blocks. An ambiguous invocation is never retried automatically.
Confirmed decision/cycle completion reconciles without another model execution.

Fixed intervals use elapsed seconds. Daily local schedules use the mandate's IANA timezone:
Vancouver's spring gap resolves to the first valid minute, and its autumn repeated minute
uses the earlier instant. Missed runs coalesce into one occurrence with a retained count and
through-time; overlap holds one bounded pending review rather than opening concurrent cycles.
Owner/global/schedule pause and current expiry/capabilities/grants are rechecked before claim.
Version edits supersede old pending callbacks; cancellation cannot resurrect a schedule.

After real acceptance, 30 idle seconds produced no model invocation. A subsequent actual
systemd restart preserved all 24 execution IDs, three cycles, five decisions and two occurrence
IDs through more than four minutes of wall time, with no replay or idle dispatch. See
[real restart evidence](evidence/prompt09/real-restart-c6690a5.json). Maximum observed employee
concurrency was two, with one per worker. The completed Asymmetri mandate remained stopped;
the broad mandate remained paused.

## Regression and preservation ledger

- Full c6690a5 suite: [Ubuntu 246/246](evidence/prompt09/linux-c6690a5.txt) and
  [local 245/246, one Linux-only skip](evidence/prompt09/local-c6690a5.txt).
- Historical 7d1e1b7 checkpoint suite: [local 255/256, one Linux-only skip](evidence/prompt09/local-256.txt);
  [all 10 browser checks](evidence/prompt09/browser-10.txt). [Exact Ubuntu checkpoint 256/256](evidence/prompt09/linux-7d1e1b7.txt), zero skips. All nine Python provisioner protocol tests passed.
- Actual engineering: hierarchy, independent review, integration and restart passed.
  [Engineering receipts](evidence/prompt09/engineering-c6690a5.json),
  [100 Linux isolation probes](evidence/prompt09/engineering-isolation-c6690a5.json) and
  [retirement receipts](evidence/prompt09/retirement-c6690a5.json) preserve independent UID,
  private home and root boundary evidence. Retired homes remain retained and inaccessible.
- Actual Projects: revision/re-review, integration, local bare-remote approved publication and
  exact lost-response reconciliation, archive and access revocation passed. See
  [Projects](evidence/prompt09/projects-c6690a5.json),
  [isolation](evidence/prompt09/projects-isolation-c6690a5.json), and
  [archive access](evidence/prompt09/projects-archive-c6690a5.json). This publication fixture
  does not publish a product or push an external commercial repository.
- Actual Prompt 01 CEO→Scout→CEO, restart/resume and interruption passed;
  [receipt](evidence/prompt09/prompt01-c6690a5.json). Real host completion with deliberately
  lost transport response recovered the same consumed approval/UID/receipt and rejected
  changed payload replay; [receipt](evidence/prompt09/identity-recovery-c6690a5.json).
- Offline schema 10→12 and 11→12: repeated open, integrity and foreign keys passed; every
  original field and rowid was preserved. The production schema-10 snapshot has 2,231 rows
  across 69 original tables. See [offline reports](evidence/prompt09/offline-schema12.txt).
  Fresh protected backup/offline migration and post-deployment comparison passed again during delivery.

## Actual direct, research and working-group regressions

[The phase ledger](evidence/prompt09/regression-acceptance.json) records the actual isolated
c6690a5 worker runs. New crash fixtures are explicitly operator-injected at provider turn-start;
these were not spontaneous outages. All original requests, provider references and fences remain.

- Manual group: two opening contributions before safe pause, owner constraint, actual service
  restart/context replacement, four-worker interaction and 11 turns, final synthesis. No Task
  was created by discussion. A 30-second idle check preceded an explicit separate Atlas Task,
  which completed with one internal artifact and no child assignments.
- Atlas-organized public group: 15 turns across five workers, two distinct retrieved public
  sources explicitly exported, peer response and reviewed synthesis citing the owner brief.
  Independent review confirmed Grace's substantive correction and retained evidence limits.
- Direct peer exchange completed; a new passive correction caused zero dispatch, then neutral
  context-replacement retrieval recovered 53 hours and the unresolved audit-tombstone question
  without either answer in the follow-up. The older hinted test remains in the ledger but is
  not the proof used for retained-context acceptance.
- Source rollover generation 1→2 used retained scoped research_read with no new search/open.
  Source ID, original content/hash, publication/observation/retrieval metadata, kind and freshness
  matched. The reply preserved 19:52:49.568 UTC as the original retrieval time.
- A real one-shot missing-page request recorded one known failed operation, no fake content,
  no retry and no unresolved provider fence. Scout's research grant was revoked after actual
  search/open; the subsequent attempted lookup was denied before reservation or I/O (two
  operations before and after). Engineer eligibility and discussion-mode grant boundaries held.
- Direct and group interruptions received provider-confirmed interruption. Separate controlled
  group and direct service crashes after actual provider start retained unknown-outcome fences
  through restart, produced no invented answer/contribution and did not replay during separate
  30-second observations. See [group fault](evidence/prompt09/group-actual-crash.json),
  [direct fault](evidence/prompt09/direct-actual-crash.json) and their phase records.
- [Actual privacy checks](evidence/prompt09/actual-group-privacy.json) inspected 26 completed-group
  contexts and transcripts against four private conversations and 26 private sources; no private
  IDs or synthetic private sentinels leaked. Direct and group research share origin=conversation,
  so classification used work-scope ownership, not the origin label alone.
- Deterministic callback tests separately cover asynchronous grant, mandate, membership and
  observation withdrawal, preserving consumed attempts while denying late source delivery.

## Failed attempts retained

The `initial`, `review1` and `review2` isolated companies are retained and stopped; their
ambiguous provider fences have not been cleared. Their coordinator continuations exhausted
the 20-call limit. Inspection of specific retained operational tool programs (excluding hidden
reasoning and credentials) showed one nested loop reading `next_offset` from the runtime
content envelope rather than its contained JSON. The model could not see corrective tool
feedback before that loop completed. The final contract requires displaying the return and
reading the actual JSON before dependent pagination; it resolved the failure on the same
profile. See [failed programs](evidence/prompt09/failed-read-programs.jsonl) and
[delivery diagnosis](evidence/prompt09/failed-read-delivery.txt).

Two new clock-test construction failures are retained: final cycles initially omitted the
required explicit stop when no future review remained, and a test object needed a TypeScript
annotation. Corrected tests preserve the earlier-edit, exact-due and end-exhaustion assertions.
A read-only privacy-check attempt initially classified every conversation-origin source as
private, including group-owned research. The corrected check follows actual scope ownership
and preserves the same private-history denial standard.

Other failed reports are retained: sandbox-restricted local runs, obsolete latest-schema test
expectations corrected while preserving original-field assertions, and an engineering attempt
that missed the existing root operator probe window. The runner now starts the authorized
operator companion immediately. None is counted as acceptance or repaired by clearing state.

## GitHub review follow-up

The automated review of PR #10 found three P2 lifecycle/browser issues. Expired or otherwise
blocked cycles now cancel unstarted linked Tasks through the existing Task control path;
original records and unresolved provider outcomes remain retained. Owner retry explicitly
rejects one-shot mandate analysis Tasks before any transition, preserving private session
ownership and uncertainty fences. Daily owner schedules accept a first calendar date and
clock time that trusted code resolves in the mandate timezone; the browser no longer turns
that date into a browser-zone instant. Existing absolute-time schedule callers are unchanged.

48 targeted tests and all 11 browser tests pass, including UTC-browser creation and editing
of Vancouver daily reviews on ordinary, spring-gap and autumn-repeat dates. A new test used
an incorrect runtime-event method name at first, and a browser assertion expected a closed
form to be removed rather than hidden; those failed construction reports are retained, and
the corrected checks preserve all behavioral assertions. Full-suite and independent
follow-up results: local 258 passed, zero failed, one Linux-only skip (259 total);
[48 targeted tests](evidence/prompt09/review-fixes-targeted.txt),
[11 browser tests](evidence/prompt09/review-fixes-browser-all.txt), and
[full local suite](evidence/prompt09/review-fixes-local-all.txt). The independent read-only
review found no material regression. The generic Task inspector still presents Retry for a
failed internal Task, then displays the explicit rejection; this is a retained nonblocking
UX limitation. Exact-candidate Ubuntu validation passed 259/259 with no skips; see
[Linux report](evidence/prompt09/linux-f3ce1f6.txt) and
[independent follow-up review](evidence/prompt09/independent-review-f3ce1f6.md).

## Accepted production delivery and preservation

Implementation [PR #10](https://github.com/eugenelin89/bot_messenger/pull/10) merged normally
as **`9c9bdce50f5ec3bb7ec4931979dc9eed70bff260`**. Exact local integration main = origin/main =
deployed source = health commit was verified. A protected independently built source archive and
the installed `dist`/`public` tree matched across **197 files**; manifest SHA-256:
`3ba1149a6733e2f99d22891d49c2f11ed05a8593ac62ea4f640bcffd21ed2f02`. The integrated build passed **259/259** tests under actual
production service restrictions before startup ([integrated suite receipt](evidence/prompt09/initial-production-suite.txt)). Running service, ready runtime, non-root identity
and `127.0.0.1:4310` listener passed. No OS, dependency, provisioner or credential update was made.

The protected backup at `/var/backups/botsquad/prompt09-delivery-20261005-first` contains consistent
original/offline SQLite copies, inventories, expected/actual build manifests, health, no-pending-work
checks, source revision and running-process receipts. Offline migration schema 10→12 reopened twice,
with all **2,231 original rows across 69 tables**, every original field and rowid, integrity and foreign
keys preserved. Fresh preservation passed **55 databases / 44,415 original rows / 337 account and group
mappings / 557 root records / 167 worker homes**. The original preflight comparison independently
passed **43 databases / 33,607 rows / 293 mappings / 484 root records / 145 homes**. Only the pre-existing
heartbeat field `workers.updated_at` is excluded; no historical row or receipt was discarded.

Production remains eight enabled idle workers — Atlas, Nix, Maya, Turing, Linus, Ada, Grace, Scout —
48 Tasks, 65 executions, one direct conversation, six Projects, zero working groups and pause=false.
The original blocked infrastructure Task and Atlas Task/direct Public Research grant are retained;
no discussion grant was enabled. **Mandates, cycles, initiatives, decisions, observations, schedules
and occurrences all remain zero.** Actual Chrome loaded Mandates and passive draft controls without
any POST. A further 30 seconds produced no new execution, Task, permission or domain object.
See [bounded production receipt](evidence/prompt09/initial-release.json),
[browser/idle receipt](evidence/prompt09/initial-browser.json) and
[deployment log](evidence/prompt09/initial-deployment.txt).

All seven task-owned temporary HQ services are stopped, with consistent root-owned retained-release
snapshots. Successful/failed transcripts, actual crash receipts, provider fences, Unix identities,
homes and root evidence remain. The original five validation tunnels are closed. The temporary
production verification tunnel is closed after the final completion-documentation deployment.
See [earlier cleanup](evidence/prompt09/temporary-company-cleanup.jsonl) and
[final candidate cleanup](evidence/prompt09/reviewed-company-cleanup.json).

This completion record is integrated with a separate normal documentation PR. Its final local/origin/
source/build identity, unchanged production state, browser/idle verification and tunnel cleanup are
recorded outside Git in the task delivery handoff and protected HQ journal after deployment. This
avoids trying to embed a commit's own SHA inside that commit. The application code is unchanged.

## Known limits and next milestones

- Strategic summaries remain fallible: Cycle 1 names Maya for a Task actually assigned to Scout.
  The original Task and artifact IDs retain correct ownership and are authoritative.
- Withdrawal conservatively withholds older derived material; already transmitted provider
  context cannot be recalled. Unknown provider outcomes remain fenced and are never auto-replayed.
- Internal analysis Tasks are single-attempt. The generic inspector still offers Retry, but the
  trusted operation rejects it explicitly without queuing work or clearing a fence.
- All Asymmetri baseline/outcome measurements were **simulated_fixture**. No intervention or
  customer experiment occurred, and no revenue/conversion/retention lift is established.
- The supported clock is finite one-time, elapsed interval and daily wall time, with explicit
  IANA/DST, one-held-overlap and coalesced-missed-run semantics; it is not unrestricted automation.

Prompt 09 is complete. **Prompt 10 — Bounded Computer Use — is next.** Prompt 11 later owns approved
real business actions, receipts and measured Asymmetri Motion outcomes. Prompt 09 does **not** prove
live marketing, live product management, publication, customer outreach, revenue improvement,
autonomous spending or unrestricted computer operation.
