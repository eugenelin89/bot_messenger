# Prompt 08 validation report

**Status: required real acceptance and workflow regressions passed; independent review passed; delivery pending.**

The accepted application candidate is `34779af89b141448c1b471b003d6ac00327216c1`.
Later commits contain documentation/evidence and an optional validation-only readiness
gate; application source and browser code remain unchanged. The owned
branch is `feature/prompt-08-working-groups`; baseline main/production is
`9f57f7fd67d52b13dd0feb50863994059a342aac`. Initial production deployment passed the host/build/preservation gates; a browser
loading correction found in its final preview is undergoing follow-up delivery. The [execution plan](../exec-plans/prompt-08.md) retains the progress history.

## Acceptance matrix

| Gate | Actual result |
| --- | --- |
| C08-1 A: supplied-material deliberation | Passed: four actual workers, owner constraint through Chrome, substantive responses/refinement, reviewed final, no Task |
| C08-1 B: Atlas organization and public evidence | Passed on `34779af`: five actual workers, 15 turns, two public-source exports, peer critique, draft/review/final; independently accepted |
| C08-2: continuity and recovery | Passed: actual provider-context replacement, safe restart, confirmed interrupts, deliberate in-flight crash, no replay and retained unknown fences |
| D: authority, isolation, bounds and idle | 211/211 actual Ubuntu tests; 210 local passes plus one Linux-only skip; real 30-second idle intervals with zero new work; repeated offline migration |
| E: separate assignment | Passed: explicit edited owner preview, normal Atlas Task, exact selected synthesis context and actual internal report |
| F: regressions and review | Direct/peer, live research/revocation, Prompt01 and Linux identity receipt recovery passed; engineering/Projects and Linux isolation passed; independent final evidence review passed |
| Preservation and delivery | Protected backup/offline migration and original-state checks passed; normal PR/merge, exact deployment, final comparison and cleanup pending |

## Checks and isolated environments

The current candidate passed **211/211 tests on actual Ubuntu**, zero skips, in 188.3
seconds under inherited production service restrictions. Local results are **211 total:
210 passed, zero failed, one Linux-only skip** (filesystem/buffer confinement). The focused
discussion suite passed **26/26**. Actual Chrome checks passed **6/6**: three group, two
direct-conversation and one research check. No browser code changed after that run.
Type checking and the complete diff whitespace check pass. See [check receipts](evidence/prompt08/checks.json).

| Fixture | Data root below `/var/lib/botsquad/validation/` | Loopback port |
| --- | --- | --- |
| Manual/recovery | `discussions-20261001-p08` | 4311 |
| Assignment/grounded partial | `discussions-20261001-p08-confirmation` | 4312 |
| Complete research | `discussions-20261001-p08-research-confirmation` | 4313 |

Each sequence verifies its HQ ID, workers and workspace root. Six persistent fixture roles
were created through trusted normal hierarchy/policy; setup is labelled separately from
actual model evidence. Each fixture uses the existing service confinement and configured
runtime account. These are application-data boundaries, not separate Unix/credential
security boundaries. Fresh fixtures do not repair or reuse failed worker identities.

Ubuntu uses Node 24.21.0 and Codex 0.157.0. Actual employees used `gpt-6-sol` with low
reasoning and normal execution priority. Maximum observed concurrency was two top-level
employees and one execution per worker. Nested WE-01 brokers remain provider activity
inside their parent slot; this count is not a claim about every provider-internal process.

## C08-1 A: useful supplied-material reasoning

Group `group_615eb29c-3d39-43e7-81a0-6566087e82a2` used actual Maya, Turing, Linus and
Grace executions: 11 turns and two immutable synthesis versions. The owner added
`cmessage_103518e0-641f-42ff-a32c-b1abd02e7e6d` through Chrome after two opening turns:
first useful action must work with keyboard only, offline and without personal-video import.

The initial local-file-first proposal did not meet the added constraint. Linus/Grace
argued for a precomputed synthetic result; Grace challenged a merely static screenshot,
and Turing explicitly revised his position. Final
`synthesis_57f66767-22bb-4633-a07e-b15f45cf6624` recommends a bounded interactive
inspection, conditional on that counting as the useful first action. It preserves the
unresolved distinction between inspecting results and executing the real pipeline,
one-week feasibility and untested accessibility. This was actual conditional convergence,
not scripted disagreement or invented user evidence. The discussion created no Task.

Inspect the [charter/audience](evidence/prompt08/manual-charter.png),
[owner constraint and Grace response](evidence/prompt08/owner-constraint-and-response.png),
[exchange](evidence/prompt08/manual-exchange.png),
[recommendation](evidence/prompt08/manual-synthesis.png),
[unresolved concerns](evidence/prompt08/manual-unresolved-concerns.png), and
[execution/continuity records](evidence/prompt08/manual-and-recovery-evidence.json).

## C08-1 B: Atlas-organized research and refinement

On `34779af`, Atlas selected Scout, Maya, Turing, Grace and itself in group
`group_bb493eb1-d9a4-4a76-8f79-effba7d8090c`. Fifteen actual completed conversation
executions produced two substantive response rounds, a draft, independent Grace review
and final `synthesis_bf130459-893c-4562-b4d1-fedeb64e5960`. There were no failed employee
turns or unresolved outcomes. Only the three cancelled trusted setup Tasks exist.

Atlas made six group research operations: two searches completed, one search failed with
a known settled outcome, and three managed page reads completed. The failure is retained.
Two actual excerpts were shared:

| Source | Retrieval UTC, October 1 | Shared/retained characters | Evidentiary scope |
| --- | --- | --- | --- |
| Audacity basic-editing manual | 11:09:59 | 350/10,343 | Direct record/import entry and format caveats |
| Blender demo-files page | 11:10:00 | 254/10,912 | Sample size, licensing and version requirements |

Original source IDs, URLs, hashes, retrieval times and omissions are preserved. Source
publication and page-observation times remain unknown. These are retrieved-page excerpts,
not search snippets. Neither demonstrates effectiveness, privacy or accessibility for the
hypothetical video-analysis product. Peers explicitly recognized their narrow relevance,
including Blender's different domain, and inspected exports without lookup authority.

Turing/Grace established technical, privacy and accessibility conditions. Maya/Scout
then explicitly narrowed their sample-first positions. The final recommends a skippable
local-file baseline, with a sample only after affirmative rights, size, ordinary-path
processing, accessibility and privacy checks. Grace's review materially clarified that
avoiding uploads does not prohibit selecting a local file. The final preserves two
unanswered questions, missing evidence, conditional confidence and separate owner authority.

Independent semantic review accepted this run. It verified **36 causal prior-contribution
references and 28 same-execution full-excerpt citation checks**, linked draft/final hashes,
the actual owner brief and current-execution receipts for every final citation. Only Atlas
has a research grant; other participants receive no lookup tools. Captured contexts exclude
private conversation sentinels and source IDs. A subsequent **30-second idle interval**
produced zero new execution, research, discussion or synthesis work.

Inspect the [charter](evidence/prompt08/research-charter.png),
[exchange](evidence/prompt08/research-exchange.png),
[source inspector](evidence/prompt08/research-shared-source.png),
[final](evidence/prompt08/research-synthesis.png),
[execution/source/citation proof](evidence/prompt08/research-complete-evidence.json), and
[idle receipt](evidence/prompt08/research-idle-evidence.json).

## C08-2: actual continuity and honest failure recovery

A settled, globally paused restart after two manual openings retained two completed and
two queued turns; continuation finished without replay. The operator-only low-turn fixture
requested normal rollover after one actual completed turn. Recorded runtime inputs and
provider references prove new scoped generations retained group/worker identity, original
evidence, unresolved questions, owner constraints and pending work. No fake provider-usage
event or deliberately exhausted context window was used.

A separate actual Linus→Grace→Linus peer exchange completed. Two real group interruptions
were confirmed by Codex; explicit stop created zero syntheses.

For controlled crash recovery, the operator terminated only the first validation service
after actual `runtime_turn_started` for
`execution_c22d36ae-b719-48c8-a5be-4b7deccbe407` at 10:46:37Z. This is deliberate fault
injection, not a spontaneous outage. Systemd recorded exit 75/MainPID0. After restart,
both in-flight sessions in `group_a1cf1948-aa47-4beb-8264-dc3e27701d1a` were blocked
with unresolved outcomes; charter, material and owner constraint remained. No employee
contribution or synthesis was invented. Thirty seconds produced zero new executions,
and explicit stop retained both fences. The earlier Atlas timeout fence also remains.

See [restart continuation](evidence/prompt08/restart-continuation.png),
[blocked crash](evidence/prompt08/controlled-crash-blocked.png),
[stop without replay](evidence/prompt08/stopped-no-replay.png), and
[retained records](evidence/prompt08/manual-and-recovery-evidence.json).

## Separate assignment and existing regressions

A fresh two-worker group `group_04186982-e5f6-4dcf-bd93-0770c5aa8bd3` produced
`synthesis_d4b7a8eb-b45c-4cef-bf3c-8aceecb76b3c` without a Task. A real 30-second idle
interval produced no new work. Only the owner's separately edited preview/submission
created `task_d3ccd213-8107-437c-b9b9-06995e38306a`, which Atlas completed as an internal
report without children or external action. Actual runtime input contains the exact selected
synthesis ID/content/hash and Task-scoped messages, with no whole-group transcript.
See the [preview](evidence/prompt08/assignment-preview.png) and
[assignment proof](evidence/prompt08/assignment-and-grounded-partial-evidence.json).

Live WE-01 regression used Scout's own Task/direct grant: actual search/page retrieval,
then revocation and a subsequent trusted denial, with no new operation and prior sources
retained. The denial reason is “No active Public Research standing permission. Ask the
owner to enable it once.” Scout's grant was never extended to discussions. Ineligible
engineer controls remained [disabled](evidence/prompt08/ineligible-research-control.png).
Actual Prompt01 CEO/Scout Task research, restart/resume and confirmed interruption passed.

Real Linux identity receipt recovery passed at
`/var/lib/botsquad/validation/recovery-prompt08-20261001T110806Z` (exit 0). The actual
provisioner completed an approved identity operation before injected response loss.
Restart reconciled the consumed approval to the same UID/receipt; exact replay returned
that receipt, and changed payload was rejected. Identity, home and root receipt remain.
See [receipt evidence](evidence/prompt08/identity-recovery-evidence.json).

Real engineering/identity acceptance passed on `04ff797` in
`identity-prompt08-20261001T113419Z`: 14 Tasks, 26 workflow executions, independently
reviewed exact commits, confined six-test integration, safe restart without duplicates,
and an additional real retirement Task. Linus/Ada overlapped for 24,651 ms by execution
and **23,053 ms by provider turn after operator-controlled readiness admission**. The
fixture first waited for infrastructure Tasks and their executions to settle; this is
not a claim about unconstrained production priority ordering. All **100 actual Linux
UID isolation checks** passed. Retirement signalled the one harmless probe process,
revoked project/home access and preserved identity history and home. See
[accepted engineering evidence](evidence/prompt08/engineering-accepted.json).

Real generalized Projects acceptance passed on the same revision in
`projects-prompt08-20261001T114202Z`: imported LedgerBrief on `trunk`, two real engineers,
three submissions across two independent review rounds, requested revision, exact-commit
integration and retained restart checkpoints at pending approval, submission, revision,
resubmission and queued integration. Runtime turns overlapped **17,043 ms after
operator-controlled readiness admission**. Lost-response publication reconciled to one
actual attempt against a disposable local bare remote; an independent divergence was
blocked. This does not validate live authenticated employee GitHub publication. All
**100 actual UID isolation checks and four archived-clone read/write denials** passed;
archived Git history, homes and reusable identities remained. See
[Projects evidence](evidence/prompt08/projects-accepted.json).

## Independent review and retained failed attempts

The separate read-only reviewer accepted the manual reasoning, complete research final,
normal assignment context, grounded partial recovery and security/recovery boundaries.
It inspected the packaged evidence for credentials, private histories/queries, raw runtime
contexts and full-source leakage. No material finding remains in the reviewed application. The reviewer also accepted
the actual engineering/Projects evidence, selected exports and scoped delivery scripts.

| Material finding | Correction and verification |
| --- | --- |
| Invalid later scheduling item could leave earlier work enqueued | Atomic savepoint; rejected plans leave no partial work |
| Export/retrieval could falsely advance delivered checkpoint | Separate immutable checkpoint, refresh and retrieval accounting |
| Escaped content/many owner notes could overwhelm context | Serialized admission bounds; mandatory constraints/references retained while optional previews report omissions |
| Group/request/session or stale-scope confusion | Trusted checks and SQL association triggers; changed scopes/stale callbacks denied |
| Unknown synthesis settlement or failed synthesizer recovery | Artifact commitment survives; explicit incomplete finish selects only an existing safe member and retains old fences |
| Failed browser-control retry could reuse the wrong payload | Receipt identity includes the full immutable request; per-group selection survives rerender |
| Catalog-only citations allowed unsupported missing-fact claim | Full same-execution excerpt delivery required; unread material is explicitly unreviewed |
| Misleading source errors wasted finite tool calls | Actionable exact-excerpt/source-ID guidance, unchanged bounds, no redundant own-export reread |

Failed attempts are retained, never renamed as successes:

- The initial production browser preview on `01f5b76` exposed a loading race: opening
  New working group before the roster response arrived displayed no participants, although
  the server returned seven eligible workers. The browser check failed without a POST or
  model invocation. Creation now waits for a current initial roster; a delayed-response
  regression covers the race. See the [failed receipt](evidence/prompt08/production-browser-first-failed.json).

- Actual engineering/identity attempt `identity-prompt08-20261001T111722Z` completed all
  14 Tasks but failed real overlap: execution overlap was −203 ms and runtime-turn overlap
  was −1,568 ms. Nix follow-ups occupied a dispatcher slot while the first engineer finished.
  UID canaries/retirement were not reached. The [failed receipt](evidence/prompt08/engineering-failed-overlap.json),
  original root, clones, identities and host receipts remain. A reviewed, explicitly enabled
  fixture-only gate now additionally holds engineering admission until infrastructure Tasks
  and executions settle. It preserves original eligibility, the two slots, model work and
  overlap assertions. The successful fresh rerun demonstrates actual overlap after operator
  readiness admission, not unconstrained production priority ordering. It changes no
  production scheduling, permissions or Task status.
- Initial sandbox full run: 192 total, 146 passed, 45 failed, one skipped. Loopback and nested
  sandbox permissions caused failures; authorized rerun preserved assertions/confinement.
- Initial browser startup exposed a `worker` initialization error; corrected and rerun.
  First browser harness also used the wrong Fetch response API before creating any group.
- First fixture correctly rejected hiring Scout from a product Task. A separate research
  setup Task fixed the policy error; the failed root remains `...-setup-failed-0943`.
- First research group `group_6494eb28-0ff8-4264-a199-cd7361458056` retrieved/shared real
  GitHub Desktop and VS Code excerpts and exchanged critiques, but Atlas synthesis timed
  out after 240 seconds with no artifact. Its fence remains. Explicit Maya recovery saved
  `synthesis_5bbd242c-2fca-496c-8ecd-c67b659af972`; its mechanism passed, but independent
  review rejected its claim that the product category was unknown despite an unread owner
  brief. That historical artifact is immutable and is not accepted as fully grounded.
- Second research group `group_81587f52-3167-486c-bd7f-b37fcd80a842` correctly read the
  owner brief, but Atlas exhausted the unchanged 16-call budget after two excerpt errors,
  two source/group-ID mistakes and redundant reads. No budget was reset or increased;
  Atlas remains fenced. After corrected guidance, explicitly selected Maya produced
  `synthesis_a3e88d57-ff09-49ea-844a-207f36d771fd`, independently accepted as grounded
  **partial** recovery. Three complete excerpt receipts, failed participation and three
  unanswered questions remain. See the [partial final](evidence/prompt08/grounded-partial-synthesis.png),
  [source inspector](evidence/prompt08/grounded-partial-source.png) and
  [receipts](evidence/prompt08/assignment-and-grounded-partial-evidence.json).
- The first revocation harness asserted `research_open_url` instead of actual
  `research_open` after real retrieval. A separately named continuation inspected that
  same research, revoked permission and verified the real denial; it did not fabricate calls.
- A fixture installation preflight ran before restarted port 4312 was ready and stopped
  before new fixture mutation. Readiness was checked before the guarded retry.

The third complete research run followed reviewed corrections in a distinct root with new
fixture identities; both earlier companies, failures and fences remain intact. Full protected
logs retain additional development/check-authoring failures. Public exports omit source bodies,
private queries, production transcripts, credentials and hidden provider reasoning.

## Preservation, limits and remaining delivery

Original production preflight: seven enabled workers (Atlas, Nix, Maya, Turing, Linus, Ada,
Grace), dispatch unpaused, 43 terminal Tasks (26 completed/17 cancelled), no runnable work,
one existing Atlas Public Research grant for Task/direct modes, no Company Knowledge grant.
This supersedes the older WE-01 zero-grant release snapshot. No production activation is
implied: discussion research requires a separate explicit owner scope change.

Protected backup/inventory: `/var/backups/botsquad/prompt08-20261001T0904Z/`.
An offline copy migrated schema 9→10 twice with all 58 original tables/1,760 rows, original
rowids and fields unchanged, clean integrity/foreign keys and zero working groups. Only
storage migration opened it; it was never served as a second authenticated HQ.
The post-regression [original-state comparison](evidence/prompt08/original-preservation-before-delivery.json)
preserves 34 original databases/23,958 rows, 249 account/group mappings, 411 root records and
123 homes. Only the pre-existing `workers.updated_at` heartbeat field is excluded; audit
and schema-migration growth is allowed. New isolated fixture records are additional.
A fresh pre-delivery backup at `/var/backups/botsquad/prompt08-delivery-20261001T115043Z/`
again preserved all 58 production tables/1,760 original rows and rowids through two offline
opens. Its protected whole-host inventory additionally covers all newly retained fixtures:
43 databases, 484 root records and 145 homes. All three discussion fixture services are
stopped/disabled with no active work; their data, identities, failures and fences remain.
The task-owned tunnels on 4311–4313 are closed; the existing production tunnel is preserved.

The implementation has finite participants, turns, rounds, context/retrieval/research budgets,
a wall-clock deadline that continues while paused, and at most two explicit extensions.
Evidence delivery is provable; interpretation quality is still model-dependent and requires
honest limitations. Known source errors can settle; ambiguous provider outcomes remain
fenced. Revocation stops future delivery and cannot recall already delivered information.
The managed reader does not inspect scripts/images/interactive behavior. Provider-internal
search behavior is opaque. Recurring company work, Computer Use, live business publication,
and authenticated employee GitHub publication remain outside this acceptance.

Remaining delivery: refresh current main and review
the complete diff, normal PR/merge/push, exact application-only deployment, running-build
correspondence/private-browser health, original pause/grant/state comparison and temporary
service/tunnel cleanup. No OS upgrade, provisioner replacement, public ingress or production
demonstration group/worker/grant is authorized by this release. Mark Prompt 08 complete and
Prompt 09 next only after those checks. Save the final exact revision receipt outside Git.

## Initial integrated deployment and follow-up

PR [#7](https://github.com/eugenelin89/bot_messenger/pull/7) merged normally as
`01f5b76b533d6fc715fba669e7c139fcafd566c5`. Local main, origin/main and deployed source
matched; all 182 built files matched the candidate manifest. Its production-confinement
suite passed **211/211**, zero skips (159.6 seconds), before startup. The process started
after the build; health/runtime and loopback-only listener passed. Actual original pause,
seven-worker roster, 43 terminal Tasks, 58 executions and the single Atlas grant were
preserved. Schema 10 has zero production groups.

The unchanged legacy inventory comparator reported client-event growth from the two
explicit owner pause/resume operations. Its diagnostic is retained. A separately reviewed
operator proof verified every original row hash/cursor plus a one-to-one match of the two
new `state.changed` notifications to the exact captured human pause/resume audit records.
No other production audit or domain growth was permitted. The original 34 databases/
23,958 rows and fresh 43 databases/33,136 rows, account mappings, receipts and homes all
passed. See [host delivery evidence](evidence/prompt08/deployment-initial-host.json).

The actual production Chrome preview then found the loading race above. Completion
remains pending its reviewed browser-only correction, normal integration and exact
production browser recheck. Backend files and all previous actual-model evidence remain
unchanged. GitHub's optional automated Codex review could not run because its review quota
was exhausted; separate read-only review was completed and repository checks were not bypassed.
