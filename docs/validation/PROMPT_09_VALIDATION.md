# Prompt 09 validation — company operating loop and durable clock

**Status: acceptance in progress; not released.** Updated 2026-10-05. Production remains
`ccf85629493b4d839d98c73a2e3ed1742304843b` until the final delivery gate below is recorded.
The [execution plan](../exec-plans/prompt-09.md) tracks outstanding work. This report separates
real workers, synthetic product evidence, deterministic application faults and production.

## Candidate and environment

The implemented source is `c6690a5b55fc1d1f9fdfe991626583dbc5d972fd`, following reviewed
authority/withdrawal fixes in `66c291a` and `fd6a755`. Ubuntu uses Node 24.21 and pinned Codex
0.157.0, with the existing service account and gpt-6-sol workers at low reasoning. Model
settings were not raised to conceal the failed tool-contract behavior. All demonstrations
use separate data roots beneath `/var/lib/botsquad/validation`; production is not a fixture.

## Acceptance matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| C09-1 — broad and specific mandates | PASS | One actual broad cycle and two actual Asymmetri cycles; organization selected alternatives, participants, group and separate Task; scoped independent semantic PASS |
| C09-2 — durable schedules | PASS | Persisted one-time/interval/daily schedules, IANA zone, owner/purpose/count/end, version edits and cancellation; one actual one-time review |
| C09-3 — clock/recovery | PASS | Controlled before/exact/after due, overlap, catch-up, pause, revocation, atomic crash windows, database reopens, real elapsed-time invocation and idle service restart |
| C09-4 — two evidence-based cycles | PASS | Actual scheduled Asymmetri Cycle 2 evaluated attributable new simulated evidence and made an unscripted reasoned decision |
| Complete affected regressions | Pending | Local 255 passed/1 Linux-only skip; browser 10/10; Ubuntu c6690a5 246/246; expanded Ubuntu and remaining real regressions pending |
| Normal integration, exact deployment and preservation | Pending | Fresh production preflight/backup/migration, PR/main, build identity and cleanup required |

The four scenario gates passing does not by itself complete the milestone.

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
- Expanded current suite: [local 255/256, one Linux-only skip](evidence/prompt09/local-256.txt);
  [all 10 browser checks](evidence/prompt09/browser-10.txt). Expanded Ubuntu rerun pending. All nine Python provisioner protocol tests passed.
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
  A fresh backup/offline migration and post-deployment comparison remain mandatory.

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

Other failed reports are retained: sandbox-restricted local runs, obsolete latest-schema test
expectations corrected while preserving original-field assertions, and an engineering attempt
that missed the existing root operator probe window. The runner now starts the authorized
operator companion immediately. None is counted as acceptance or repaired by clearing state.

## Delivery gate and scope

PR, merge commit, exact local/origin/deployed source and running build identity: **pending**.
Production health, browser surface, no-startup-work, roster/grant/pause preservation and
temporary-service cleanup: **pending**. Production must receive zero demonstration mandates,
zero schedules, no new grants and no roster changes.

Prompt 09 demonstrates bounded internal strategic operation. It does **not** prove live
marketing, live product management, publication, customer outreach, revenue improvement,
autonomous spending or unrestricted computer operation. Prompt 10 owns bounded Computer Use;
Prompt 11 owns approved real business actions, receipts and measured Asymmetri outcomes.
