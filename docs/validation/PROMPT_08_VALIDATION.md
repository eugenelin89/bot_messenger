# Prompt 08 validation report

**Status: in progress — not accepted, merged or deployed.**

Owned branch: `feature/prompt-08-working-groups`. Baseline production/current main:
`9f57f7fd67d52b13dd0feb50863994059a342aac`. Initial candidate `ece0850`; real fixture
candidate `4e2a7eb`. Detailed gates and continuing evidence are in the
[execution plan](../exec-plans/prompt-08.md).

## Current evidence

- Local full candidate suite: 209 total, 208 passed, zero failed, one Linux-only skip.
  Later focused suite: 24 discussion tests passed. Final integrated full run still due.
- Actual Chrome: five group/direct-conversation tests passed, then three group tests
  passed with failed-control retry coverage. Screenshots visually checked.
- Independent read-only security/recovery review produced material findings and reproductions;
  fixes and affected retests are recorded in the plan. Final sign-off remains due.
- Protected offline production copy migrated schema 9→10 twice. All 58 original tables,
  1,760 original rows, original rowids and every original field preserved. Integrity and
  foreign keys clean. No Company/runtime/server opened the offline copy.
- Isolated Ubuntu service `/opt/botsquad-discussions-validation`, data
  `/var/lib/botsquad/validation/discussions-20261001-p08`, loopback 4311, inherited service
  confinement and existing configured account. This is data isolation, not a separate
  Unix/credential security boundary. Trusted roster setup is not model evidence.

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

C08-1 supplied-material deliberation, Atlas-selected public research, browser interjection,
substantive response, source inspection and final synthesis remain under execution.
C08-2 actual provider replacement, safe restart, injected in-flight uncertainty, no duplicate
work and retained obligations remain under execution. Assignment, actual idle interval,
Linux/real workflow regressions, final review and normal delivery remain required.
No prior milestone's test count or mock execution is substituted for these gates.

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
identities, failures and fences. It uses loopback4313 and the same service confinement.

Current candidate checks: 211 total locally (210 passed, one Linux-only skip) and
211/211 on actual Ubuntu under inherited service confinement. Actual Prompt01
CEO/Scout research, restart/resume and confirmed interruption passed. Engineering,
Projects and identity-recovery regressions remain pending.
