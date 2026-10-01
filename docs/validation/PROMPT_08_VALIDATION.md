# Prompt 08 validation report

**Status: in progress — not accepted, merged or deployed.**

Owned branch: `feature/prompt-08-working-groups`. Baseline production/current main:
`9f57f7fd67d52b13dd0feb50863994059a342aac`. Initial candidate `ece0850`; real fixture
candidate `4e2a7eb`. Detailed gates and continuing evidence are in the
[execution plan](../exec-plans/prompt-08.md).

## Current evidence

- Candidate `34779af`: local full suite **211 total, 210 passed, zero failed, one
  Linux-only skip**. The prior `509a4a4` candidate passed **211/211** on actual Ubuntu;
  the current `34779af` rerun also passed **211/211**, no skips (188.3 seconds).
  Focused discussion suite: **26/26**.
- Actual Chrome: **6/6** group, direct-conversation and research browser checks passed.
  Screenshots were visually inspected; real workflow screenshots are linked below.
- Independent read-only review accepted the manual discussion, normal assignment scope,
  full-excerpt citation enforcement and corrected partial recovery. The fresh complete research final is independently accepted; release regressions
  and final delivery sign-off remain due.
- Protected offline production copy migrated schema 9→10 twice, preserving all 58 original
  tables, 1,760 original rows, rowids and fields. Integrity and foreign keys are clean.
  Only the storage migration opened this copy; it was never served as an authenticated HQ.
- Pre-delivery comparison still preserves **34 original databases / 23,958 rows**,
  **249 account/group mappings, 411 root records and 123 homes**. The sole excluded field
  is the pre-existing heartbeat field `workers.updated_at`; audit/schema growth is allowed.
- Three strictly isolated fixture roots use loopback 4311–4313 and inherit the existing
  service restrictions and configured account. These are application-data boundaries,
  not separate Unix/credential security boundaries. Trusted roster setup is not model evidence.

## Retained failed attempts

- Initial full local sandbox run: 192 total, 146 passed, 45 failed, one skipped. Loopback
  permission and nested macOS sandbox execution failures were retained, then rerun with
  the required local capabilities; assertions and confinement were not weakened.
- First browser group test timed out because the app referenced `worker` before its
  initialization. Corrected and both group browser checks rerun successfully.
- First Ubuntu fixture setup correctly rejected Scout hiring from a product Task.
  Corrected by using the normal separately scoped research setup Task; the failed fixture
  is retained at `discussions-20261001-p08-setup-failed-0943`, never served as production.
- First real-browser harness start used the Playwright response method on native Fetch.
  It failed before creating any group; fixed and retained the log.

## Required real gates

| Gate | Current result |
| --- | --- |
| C08-1 A supplied-material reasoning and owner interjection | Passed: four actual workers, substantive revision, final unresolved concerns, no Task |
| C08-1 B Atlas-organized public evidence | Passed: five workers, 15 turns, two sources, draft/review/final; independent semantic review accepted; earlier failures retained |
| C08-2 continuity/recovery | Passed: actual contexts replaced, safe restart, confirmed interruptions, deliberately injected in-flight crash and retained unknown fences |
| D deterministic/privacy/budgets/idle/migration | Local and current actual Linux suite passed; real 30-second idle passed |
| E separate assignment | Passed: explicit edited preview, normal Atlas Task, exact selected synthesis context, real internal report |
| F regressions/review | Direct/peer, live grants/revocation and Prompt01 passed; identity recovery passed; engineering/Projects pending |
| Delivery/preservation | Offline migration and original-state checks passed; normal PR/merge/deploy and final cleanup pending |

No historical test count or mock execution substitutes for a required actual gate.

### Research run timeout and bounded recovery candidate (2026-10-01 10:22 UTC)

The Atlas-organized research group `group_6494eb28-0ff8-4264-a199-cd7361458056`
selected Atlas, Maya, Turing and Grace, retrieved two public documentation pages through
WE-01, exported bounded excerpts, and produced separately attributed opening/response
turns. Its Atlas synthesis execution `execution_c8d1a256-0ad4-4dfa-ab43-8cba07b64c0d`
timed out after 240 seconds without committing a synthesis. The original research phase
is **failed**, not relabeled as passed. Atlas's unresolved-provider fence remains.

The candidate adds an explicit owner finish option for another existing unfenced member
only when the group is blocked and its immutable charter permits incomplete results.
Independent read-only review confirmed artifact predecessor integrity across recovery,
rejection of stale callbacks, and retention of the old worker fence. Review found and
fixed browser receipt identity/selector persistence across failed control requests.
Focused tests: 24/24 passed. Affected group/direct browser checks: 5/5 passed; a subsequent
3/3 group run includes a failed-control retry. The delayed-research test now waits for
actual provider invocation before changing membership, evidence scope, stop or grant.
Earlier test-authoring failures remain in protected local logs. At that checkpoint, real incomplete finish and assignment were still pending; the
subsequent results below record their separate actual outcomes.

## Actual deliberation results

| Case | Actual evidence | Result |
| --- | --- | --- |
| Supplied-material group | `group_615eb29c-3d39-43e7-81a0-6566087e82a2`; Maya, Turing, Linus, Grace; 11 actual turns; draft/review/final | Passed |
| Browser owner constraint | `cmessage_103518e0-641f-42ff-a32c-b1abd02e7e6d`; keyboard-only, offline, no personal video | Subsequent workers and final synthesis address it |
| Manual final | `synthesis_57f66767-22bb-4633-a07e-b15f45cf6624` | Conditional recommendation; unresolved meaning of useful first action/accessibility/one-week feasibility retained |
| Atlas organization and public evidence | `group_6494eb28-0ff8-4264-a199-cd7361458056`; actual Atlas selection, four workers, two retrieved pages, peer critiques | Research/exchange passed; original synthesis timed out and remains failed |
| Explicit incomplete finish | Owner selected existing Maya; `synthesis_5bbd242c-2fca-496c-8ecd-c67b659af972` | Passed on `d65ea45`; original Atlas fence and failed turn retained; no Task |
| Safe restart and actual replacement | Paused boundary after two completed openings; resumed queue; actual new provider references for scoped generations | Passed; completed work not replayed |
| Context/source isolation | 23 captured group inputs across both groups | Private sentinel and private source IDs absent; task/private tool authority excluded |
| Capacity | Full settled execution intervals | Maximum two top-level employees, one execution per worker |
| Separate assignment | Fresh confirmation company, group `group_04186982-e5f6-4dcf-bd93-0770c5aa8bd3`, synthesis `synthesis_d4b7a8eb-b45c-4cef-bf3c-8aceecb76b3c` | Real two-worker discussion; no automatic Task |
| Actual idle interval and owner Task | 30 seconds without new executions/research/synthesis; explicit edited preview creates `task_d3ccd213-8107-437c-b9b9-06995e38306a` | Atlas completed internal report; no child Tasks or external actions |

The manual group's initial local-file-first proposal did not satisfy the later owner
constraint. Linus/Grace argued for inspecting a precomputed synthetic result; Grace
challenged a merely static screenshot, and Turing explicitly revised his position.
The final recommendation is conditional on interpreting output counting as useful; it
would be insufficient if first use must run the actual analysis pipeline. This is actual
convergence with stated uncertainty, not mandatory disagreement.

The research group narrowed sample-first assumptions after challenges about representative
work, reversibility and one-week feasibility. Its incomplete final favors an offline
quickstart plus direct local entry, adding an optional synthetic sample only if a concrete
feasibility/accessibility gate is met. It distinguishes public documentation analogies
from evidence of user outcomes. GitHub Desktop and VS Code pages were retrieved at
10:01:17Z and 10:01:41Z; source publication/observation times are unknown. Only 298 and
268 characters, respectively, were shared from retained bounded pages. Private queries,
producer histories and full source pages are excluded from public evidence exports.

A second confirmation company was necessary for the healthy Atlas assignment run because
the first company's Atlas remains fenced. This did not reset/reuse/repair the failed
identity, and the original failure remains in its original data root. Fixture setup
used trusted normal hierarchy, while every reported discussion and Task output came
from actual models. Both companies share the existing Unix/runtime account boundary.

### Independent semantic review and grounding correction

Review accepted the manual group's substantive reasoning and verified the separate Task
context against the actual recorded provider input. It found a material quality gap in
the first research final: the final claimed the product category was unknown, even though
the owner packet identified a local video-analysis prototype. Workers read both public
excerpts but did not retrieve the owner brief, which they still cited. That artifact is
retained unchanged and is **not accepted as fully grounded in supplied material**.

The corrected candidate requires a same-execution full-excerpt delivery receipt for every
evidence citation and explicitly identifies the catalog as metadata without bodies.
It distinguishes unread material from absent evidence in runtime instructions. Twenty-five
focused tests pass, including metadata-only, partial, other-worker, previous-turn and
producer-export cases. A new actual Atlas-organized research run is pending; the earlier
flawed final will not be relabeled or overwritten. The first group's actual organization,
lookup, sharing and incomplete recovery evidence remains valid for those narrower checks.

The first live revocation harness used the wrong assertion tool name (`research_open_url`
instead of the actual `research_open`) after real research completed. The failed attempt
is retained. The continuation checked the existing actual search/page operations, revoked
Scout's grant, and obtained a real trusted-code rejection on the next requested lookup.
No new operation was created and prior source evidence remained. Permission was never
extended to discussion mode for Scout. Ineligible engineer grant controls were disabled.

Current full checks before the grounding delta: 209/209 Ubuntu tests passed, 208 local
plus one Linux-only skip. Actual direct/peer continuation and both real group interrupts
passed; both interrupts were confirmed by Codex and stop created zero syntheses. The
controlled crash draft is armed but has not dispatched; remaining real regressions and
final suite/review are still required.

### Controlled crash recovery

The operator deliberately terminated only the first validation service after the actual
`runtime_turn_started` notification for `execution_c22d36ae-b719-48c8-a5be-4b7deccbe407`
at 10:46:37Z. This is fault injection, not a spontaneous service outage. Systemd recorded
exit75/MainPID0. Provider settlement remains unconfirmed despite control-plane termination.
After restart, both in-flight group sessions were blocked with unresolved outcomes,
charter/material/owner constraint remained, no employee contribution or synthesis was
invented, and 30 seconds produced zero new executions. Explicit stop then closed group
`group_a1cf1948-aa47-4beb-8264-dc3e27701d1a` without clearing either fence. The earlier
Atlas synthesis timeout fence also remains. Captured SQLite integrity and foreign keys
are clean; original group histories and completed outputs did not replay.

### Grounded retry and bounded tool guidance (11:03 UTC)

The second Atlas research run on `509a4a4`, group
`group_81587f52-3167-486c-bd7f-b37fcd80a842`, is also recorded as **failed**:
Atlas exhausted the existing 16-call allowance before committing its opening. Five
actual research operations completed and two public excerpts were shared. Other
participants read and correctly used the hypothetical local-video-analysis brief.
Four rejected calls (two non-exact excerpts and two source IDs supplied to the group
record reader) and redundant rereads consumed the remaining allowance. Atlas's
unknown-outcome fence remains; no limit was increased or consumed budget reset.

The correction makes exact-excerpt and source/group-ID errors actionable, exposes
the unchanged call/retrieval bounds in context, and explains that a successful own
export already proves excerpt delivery. A separately named owner-authorized partial
finish will test grounded recovery. A third isolated fixture will test a fresh
complete Atlas path after this reviewed correction, preserving both previous roots,
identities, failures and fences. It uses loopback 4313 and the same service confinement.

Current candidate checks: 211 total locally (210 passed, one Linux-only skip) and
211/211 on actual Ubuntu under inherited service confinement. Actual Prompt01
CEO/Scout research, restart/resume and confirmed interruption passed. Engineering,
Projects and identity-recovery regressions remain pending.

### Grounded partial recovery accepted (11:05 UTC)

Explicit owner-selected Maya produced `synthesis_a3e88d57-ff09-49ea-844a-207f36d771fd`
for the second research group. The original Atlas failure/fence remains. Independent
review accepted this as partial recovery evidence: all three citations have distinct
same-execution full-excerpt receipts, and the actual final correctly retains the local
video-analysis brief, source relevance limits, conditional feasibility/accessibility,
failed participation and three unanswered questions. It does not replace the failed
original phase or establish the fresh complete research gate.

## Independent review and fixes

The separate read-only security/recovery reviewer reproduced or verified the following
material corrections before release. These are actual review findings, not a claim that
finite tests prove every possible model behavior.

| Finding | Correction and verification |
| --- | --- |
| Invalid later scheduling item could leave earlier work enqueued | Atomic scheduling savepoint; rejected plans leave no partial work |
| Export or retrieval could falsely advance the delivered checkpoint | Separate immutable checkpoint, refresh and original-retrieval ledgers; actual execution delivery proof |
| Escaped content and many owner notes could exceed the context envelope | Serialized admission bounds; optional previews omitted with counts, mandatory constraints/references retained |
| Group/current-worker ownership or stale scopes could be confused | Trusted checks plus SQL association triggers; changed scopes and stale callbacks denied |
| Unknown synthesis completion and failed synthesizer recovery | Artifact commitment preserved separately from provider settlement; explicit incomplete finish selects only an existing safe participant and retains fences |
| Failed browser control retry could reuse the wrong payload | Control receipt identity includes the full immutable request; per-group synthesizer selection survives rerender |
| Catalog-only citations enabled an unsupported missing-fact claim | Each cited full excerpt must have a same-execution trusted delivery receipt; unread material is explicitly unreviewed |
| Misleading research source errors wasted the finite tool allowance | Exact-excerpt/source-ID guidance and visible unchanged budgets; own export avoids redundant reads |

Latest read-only delta review found no material issue. The reviewer separately accepted
the manual reasoning, normal assignment's actual context and the grounded partial final.
The fresh complete research final was subsequently accepted. Final release regression
and delivery checks remain pending.

## Inspectable evidence

All linked screenshots come from isolated hypothetical fixtures. Provider reasoning,
credentials, private production transcripts, private queries and full source pages are
excluded. Full protected failure logs and databases remain on the operator's host.

- [Charter and audience](evidence/prompt08/manual-charter.png)
- [Actual owner constraint and Grace's response](evidence/prompt08/owner-constraint-and-response.png)
- [Real exchange](evidence/prompt08/manual-exchange.png) and [restart continuation](evidence/prompt08/restart-continuation.png)
- [Manual recommendation](evidence/prompt08/manual-synthesis.png) and [unresolved concerns](evidence/prompt08/manual-unresolved-concerns.png)
- [Grounded partial final](evidence/prompt08/grounded-partial-synthesis.png) and [source inspector](evidence/prompt08/grounded-partial-source.png)
- [Ineligible research control](evidence/prompt08/ineligible-research-control.png), [crash blocking](evidence/prompt08/controlled-crash-blocked.png), [explicit stop without replay](evidence/prompt08/stopped-no-replay.png)
- [Separate assignment preview](evidence/prompt08/assignment-preview.png)
- [Manual/recovery records](evidence/prompt08/manual-and-recovery-evidence.json), [assignment and citation receipts](evidence/prompt08/assignment-and-grounded-partial-evidence.json), [actual checks](evidence/prompt08/checks.json), [original preservation comparison](evidence/prompt08/original-preservation-before-delivery.json)

### Existing infrastructure recovery

The unchanged real Linux identity-recovery acceptance passed on `34779af` at
`/var/lib/botsquad/validation/recovery-prompt08-20261001T110806Z` (exit 0). The actual
root provisioner completed an explicitly approved identity operation before the fixture
injected transport-response loss. Restart reconciled the consumed approval to the exact
existing UID/receipt; replay returned the same receipt and changed payload was rejected.
This is labelled transport fault injection, not a fabricated provider result. The identity,
home and root receipt remain retained. See the [receipt evidence](evidence/prompt08/identity-recovery-evidence.json).

### Fresh complete research acceptance (11:17 UTC)

On `34779af`, group `group_bb493eb1-d9a4-4a76-8f79-effba7d8090c` completed normally
with Atlas, Maya, Turing, Scout and Grace: 15 separately attributed turns, two bounded
response rounds, draft, independent Grace review and final
`synthesis_bf130459-893c-4562-b4d1-fedeb64e5960`. Three original fixture setup Tasks
remain cancelled; the discussion created zero Tasks. Observed capacity was two employees,
one per worker. Every citation has current-execution excerpt delivery proof. Actual private
research source IDs and sentinels are absent from recorded group runtime inputs.

Atlas made six group research operations: two searches completed, one search failed with
a known settled outcome, and three managed page reads completed. Two relevant excerpts
were shared: Audacity's basic-editing manual (350/10,343 retained characters, retrieved
11:09:59Z) and Blender's demo-files page (254/10,912, 11:10:00Z). Source publication and
page-observation times remain unknown. Peers inspected the group exports without lookup
authority. The final explicitly treats the pages as analogies, not product-effectiveness,
privacy or accessibility proof. The earlier failed identities and fences remain untouched.

The final recommends a skippable local-file baseline and a sample only after affirmative
rights, size, processing, accessibility and privacy checks. It records Maya/Scout's
actual refinement after Turing/Grace challenges, unresolved evidence and separate owner
approval requirements. Grace's review added the distinction between forbidden uploads
and permitted local file selection. Independent semantic review accepted this run, including 36 valid causal references and
28 same-execution evidence checks. A subsequent
30-second real idle observation recorded zero new model/research/discussion work.

Inspect the [charter](evidence/prompt08/research-charter.png),
[exchange](evidence/prompt08/research-exchange.png),
[shared-source inspector](evidence/prompt08/research-shared-source.png),
[final](evidence/prompt08/research-synthesis.png),
[sanitized execution/source/citation proof](evidence/prompt08/research-complete-evidence.json),
and [idle interval](evidence/prompt08/research-idle-evidence.json).
