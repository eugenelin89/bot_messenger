# BotSquad Project Memory and Continuation Handoff

**Updated:** 2026-10-01
**Purpose:** Short repository-backed continuity record for a fresh chat, Codex task or interrupted planning session. This is not runtime employee memory or ChatGPT account-memory storage.

## What we are building

BotSquad is an operator-controlled, self-hosted AI company: a team of persistent intelligent employees, not a fixed assembly line of model calls or a chat UI around Codex. The team should communicate, deliberate, take bounded initiative, delegate, review, measure outcomes, learn and adapt.

The owner may give either a broad goal or a specific mandate. The concrete reference is: **manage and market Asymmetri Motion, improving product quality, adoption and sustainable revenue within approved constraints**. The organization should select useful people and work; the owner should not have to prescribe every internal handoff. Human control and approvals remain policy-based.

## Accepted decisions from the September 29 continuation

1. **One AI company that can actually operate a real business is more important than multiple companies or federation.** Keep multi-company/federation as later options, not near-term prerequisites.
2. Keep **07 → 08 → 09 → 10**. Add **11 — Single-company business operations and a measured Asymmetri Motion pilot**. The old future 11–14 numbering is superseded; multi-company, company collaboration, Telegram and federation are now deferred/unnumbered.
3. **Prompt 07:** include runtime-context rollover and scoped rehydration. Employee and BotSquad Conversation IDs survive replacement of provider threads/sessions. Preserve history, ownership, evidence and unresolved work; reconcile in-flight operations instead of replaying them blindly.
4. **Prompt 09:** include a minimal durable one-time/recurring scheduler and the Asymmetri Motion reference scenario, alongside a broad-objective scenario. Demonstrate two bounded operating cycles and evidence-based follow-up. Read-only/sanitized/simulated acceptance must be labelled honestly.
5. **Prompt 11:** prioritize the smallest practical metrics/evidence + approved external action + scheduled observation loop. Require real receipts and outcomes before claiming live operation. Do not build every connector or assume unavailable credentials.
6. Durable organizational state is authoritative; summaries are bounded, scoped, fallible derived artifacts. Worker ≠ BotSquad conversation ≠ runtime thread/session ≠ execution attempt ≠ company ≠ HQ ≠ runtime account ≠ Unix user ≠ device ≠ external identity.
7. Broad reasoning does not expand operational authority. No raw financial credentials, unapproved outreach/publication, spending, contracts or unsafe desktop access. Bots cannot manufacture approval in text.
8. Native iOS/no-tunnel access remains deferred while the private browser is sufficient. Asymmetri Motion is a reference product configuration, never a hard-coded assumption in the generic engine.
9. **Very near-term follow-up after Prompt 07: give bots appropriate power and authority.** Employees need public research/current information, relevant company knowledge, useful tools and standing authority for routine work within role, scope and budget. Avoid per-lookup micromanagement. Plan the first useful slice alongside Prompt 08 preparation; do not defer basic public research to Prompt 11. This is planned work, not a live permission grant. See [Decision 019](decisions/decision_019_near_term_worker_empowerment.md) and the [roadmap task](product/ROADMAP.md#near-term-task--give-bots-appropriate-power-and-authority).

## Verified implementation baseline at this decision

Repository: `eugenelin89/bot_messenger` (product name: BotSquad).

The GitHub documentation baseline was `a1532d3359223f4047d28f9a3c054dd1369108db`: **Prompts 01–06 complete; Prompt 07 next.** That is the historical Decision 017 baseline. Prompt 07 implementation and actual Ubuntu acceptance are now recorded in [the validation report](validation/prompt-07-conversations-continuity.md) and [Decision 018](decisions/decision_018_conversations_context_continuity.md). The final source/deployment equality is recorded in the delivery handoff and private HQ journal; do not infer it from an older baseline SHA.

Always reread current main, relevant execution plans and active branches before asserting current implementation/deployment status. Preserve historical records and concurrent writers. Use a dedicated branch/worktree, normal reviewed integration, and no force push or destructive history rewrite.

## Read these to continue

- [Canonical roadmap](product/ROADMAP.md): current sequence and milestone acceptance.
- [Decision 017](decisions/decision_017_single_company_first.md): authority, rationale, supersession map and live-business evidence gate.
- [Single-Company Business Operations](product/SINGLE_COMPANY_OPERATIONS.md): context continuity, company clock, Asymmetri Motion test and practical operating scope.
- [Decision 016](decisions/decision_016_intelligent_company_model.md) and [Intelligent Company Operating Model](product/INTELLIGENT_COMPANY_MODEL.md): employee-like initiative, broad/specific mandates and authority distinctions.
- [Future milestone prompt requirements](../prompts/MILESTONE_REQUIREMENTS.md): requirements that must flow into Codex prompts.
- [Current State](operations/CURRENT_STATE.md) and [decision index](decisions/README.md): implementation evidence and accepted boundaries.

## Next planning action

Complete the remaining Prompt 09 acceptance and release gates in
[the active execution plan](exec-plans/prompt-09.md). Its strategic operating loop and durable
clock are implemented on the owned branch, but release is not complete. Reuse accepted Prompt 07 continuity, WE-01 authority and Prompt 08 deliberation,
shared evidence, immutable synthesis and explicit assignment boundaries. Cover both a broad
mandate and the bounded Asymmetri Motion reference scenario with two evidence-based cycles.
Do not imply live marketing/publication authority or implement Computer Use early. Preserve
09 → 10 → 11 and the single-company evidence gate before federation. Verify current main,
active worktrees and the delivery receipt; never discard concurrent work.

WE-01 completed and deployed the first public-research/standing-knowledge slice from Decision 019. Read [Decision 020](decisions/decision_020_scoped_public_research.md), the [completed execution plan](exec-plans/worker-empowerment-01.md), [validation record](validation/worker-empowerment-01.md) and [owner tutorial](operations/PUBLIC_RESEARCH_TUTORIAL.md). All six gates passed; PR #5 merged and its exact application revision was deployed and verified on October 1. Separate owner activation is required at the retained HQ; do not confuse deployed code with active permission. At that historical WE-01 release, the retained HQ had zero grants and was unpaused with no runnable work; the fresh Prompt 08 state below supersedes its grant count. Atlas and Maya are present; Scout was the isolated validation researcher and is not yet in the retained roster. Broader empowerment remains future work.

## Maintaining this record

Update this handoff when the owner changes a decision or a milestone is genuinely accepted. Keep rationale in decision records and detailed status/evidence in execution plans. Do not duplicate secrets or private customer data here. Current owner instructions and accepted decisions take precedence over an old handoff. This file makes the conversation recoverable from the repository; it does not claim that every future chat automatically loads it.

## Prompt 08 accepted and deployed — October 1

Working groups now support manual teams or explicit Atlas organization, actual attributed
employee turns, shared evidence, owner interjections, bounded continuation, reviewed immutable
synthesis and separately submitted assignments. C08-1/C08-2, actual research, context replacement,
restart/crash recovery, direct/peer, engineering/Projects and Linux isolation passed. Backend
suite: 211/211 Ubuntu; local 210 plus one Linux-only skip. Final Chrome suite: 7/7. Independent
read-only security/recovery and semantic review accepted the results. Earlier research failures,
fences, failed overlap attempt and the corrected initial browser-loading race remain recorded.

Implementation PR #7 and browser correction PR #8 merged normally. The accepted application
revision `f82235835a0dcc3473678d6f6bf9780d93709223` was deployed with matching local/origin/source,
all 182 build hashes, ready runtime, private listener and actual Chrome verification. The final
documentation revision’s exact equality receipt will be saved after its deployment outside
Git in the task handoff and protected HQ backup journal, avoiding a self-referential hash commit.

Production: seven enabled idle workers (Atlas, Nix, Maya, Turing, Linus, Ada, Grace), unpaused,
43 terminal Tasks, 58 executions and zero working groups. One existing Atlas Public Research
grant covers Task/direct conversation only; no Company Knowledge or discussion grant was added.
For group lookup, the owner must explicitly revoke/regrant an eligible worker with discussion
mode and permit research in the charter. Supplied-material groups need no research grant.

Protected backups, repeated offline migration and original/fresh preservation checks passed.
Exact pause/resume audit notifications are separately accounted for; every original row/cursor
is retained, excluding only the pre-existing worker heartbeat timestamp. Temporary services
and task-owned tunnels are stopped; all fixture roots, identities, homes, receipts and fences
remain. No OS/provisioner upgrade, public ingress or production demonstration was performed.

Read the [validation report](validation/PROMPT_08_VALIDATION.md),
[execution plan](exec-plans/prompt-08.md), [Decision 021](decisions/decision_021_bounded_working_groups.md),
[technical guide](architecture/WORKING_GROUPS.md) and [tutorial](tutorials/working-groups.md).
**Prompt 09 is in progress; WE-01 remains complete.**


## Prompt 09 implementation checkpoint — October 5

The current implementation is on `codex/prompt09-company-operating-loop`, based on retained
production/main `ccf8562`. Schema 12 adds durable strategic records, schedules and private
internal Task contexts without activating domain work. Actual production preflight found eight
workers including Scout, 48 Tasks, 65 executions and one retained Atlas research grant; this
supersedes older October 1 roster/grant counts. Production remains unchanged at this checkpoint.

Three real failed broad attempts are retained with their unknown fences. The diagnosed failure
was a generated pagination loop reading domain fields on wrapped dynamic-tool responses.
Candidate `c6690a5` corrects the contract and completed a broad real cycle. Asymmetri two-cycle
acceptance and other release gates remain open. Independent security review cleared the
candidate; semantic review remains required. See Decision 022, the architecture/tutorial and
execution plan for authoritative progress. Do not infer full completion from this checkpoint.
