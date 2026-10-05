# Codex Specialist Agents

BotSquad uses project-scoped read-only Codex specialists to challenge high-risk development
work without turning every future milestone prompt into a giant architecture handbook.

This workflow is adapted from the actual Asymmetri Motion repository's
`.codex/agents/`, `AGENTS.md`, and `docs/agents/README.md` pattern. BotSquad keeps the
same useful properties—persistent project-scoped specialists, read-only authority,
risk-based routing, focused review packets, and one parent integration owner—while using
specialists matched to BotSquad's own control-plane risks.

See [Decision 023](../decisions/decision_023_codex_specialist_subagents.md).

## Authority and ownership

The **parent Codex thread is the sole writer and integration owner**. It owns:

- implementation and documentation edits;
- branch/worktree and Git state;
- test execution and deployment;
- finding disposition;
- final completion judgment.

Specialists inspect and advise. They do not edit, stage, commit, merge, deploy, mutate a
validation/production HQ, or receive overlapping write responsibility.

Every checked-in specialist config uses:

    sandbox_mode = "read-only"

Do not broaden that sandbox just because the parent has a wider permission envelope.
If a live session cannot guarantee the read-only boundary, use a fresh read-only specialist
review session instead.

The specialist configs intentionally do not pin or downgrade model/reasoning settings.
They inherit the current Codex project's configured model/reasoning unless a later
evidence-backed decision changes that policy.

These specialists are a **Codex development workflow**. They are not BotSquad workers,
company employees, working-group participants, or a new runtime multi-agent feature.

## Current specialist set

| Changed risk surface | Specialist | Typical timing |
| --- | --- | --- |
| Task/conversation/group/mandate/execution ownership, dispatcher/runtime boundaries, tool schemas, session lineage, control-plane architecture | `control_plane_architect` | Before architecture is locked; after implementation when ownership/boundary risk remains |
| Grants, approvals, secrets, public network, external actions, prompt injection, device/client trust, Computer Use | `security_reviewer` | Before high-risk design and after implementation |
| SQLite migration, async callbacks, retries/idempotency, restart/crash windows, lost responses, uncertainty fences, scheduler occurrences | `recovery_reviewer` | Before recovery design and after fault/restart implementation |
| Product/business architecture, milestone scope, generic engine vs product fixture, one-company-first sequencing, avoiding premature multi-company/federation | `product_strategy_reviewer` | Before scope/roadmap architecture is locked; after when product boundary materially changes |
| Acceptance evidence, real vs simulated claims, Linux/browser/provider tests, preservation, failure retention, evidence gaps | `test_reviewer` | Before closing substantial milestone or production work |

Do **not** invoke every specialist by habit.

Documentation-only, archival and low-risk changes normally need none. Route by changed
risk, not file count. Record why a seemingly relevant specialist was omitted only when the
omission would otherwise be surprising.

BotSquad deliberately starts with these five. There is no dedicated operator-UX,
performance, database, or business-ops specialist yet. Add a new persistent specialist
only when repeated work shows a distinct, durable review domain that is not being covered
well by the current set.

## Likely routing for upcoming milestones

These are defaults, not mandatory fixed rosters:

- **Prompt 10 — Bounded Computer Use:** normally
  `security_reviewer` + `control_plane_architect` + `recovery_reviewer` +
  `test_reviewer`. Add `product_strategy_reviewer` only if the work starts deciding
  business-connector/product scope rather than merely implementing the bounded capability.
- **Prompt 11 — real single-company operations:** normally
  `security_reviewer` + `recovery_reviewer` + `test_reviewer`, plus
  `product_strategy_reviewer` for business-operating scope and
  `control_plane_architect` when new typed adapters/execution origins change the core
  architecture.
- **Low-risk documentation or tutorial updates:** usually no specialist.

The parent may add or omit a reviewer when the actual diff changes the risk surface.
Document the reason when that decision is non-obvious.

## Review packet contract

Give a specialist the smallest sufficient packet:

1. objective and explicit non-goals;
2. changed risk surface;
3. applicable requirements and acceptance IDs;
4. exact changed files, diff, or commit;
5. only relevant decisions/architecture docs;
6. validation already run and evidence available;
7. open questions, suspected failure modes, or claims to challenge.

Do not preload the whole project history, old prompt transcripts, all validation logs, or
unrelated decisions. Let the specialist expand context when a finding actually requires it.

The parent should ask for a concrete review question, for example:

- "Can a discussion/mandate callback cross execution ownership after restart?"
- "Can this Computer Use grant escape its site/action/file/network envelope?"
- "Does the migration preserve old uncertainty fences and occurrence identities?"
- "Do these tests actually prove the production claim, or only a fixture?"

## Output contract

Specialists return concise evidence-backed findings:

- **BLOCKING** — correctness, authority, privacy, data-loss, recovery, security, or required
  acceptance defect that must be resolved before completion.
- **IMPORTANT** — material risk or evidence gap that should be fixed or explicitly
  dispositioned.
- **OPTIONAL** — bounded improvement outside the required acceptance bar.
- **REQUIRED EVIDENCE** — a specific validation item needed to support a claim.

Each finding should identify the exact source/evidence, issue, consequence, and recommended
direction or smallest adequate test. Do not invent findings to fill categories.

When there are no material findings, say so briefly and list only genuine remaining
evidence.

## Using multiple specialists

Independent read-only reviews may run in parallel when their questions do not depend on
one another. Examples:

- security reviews a Computer Use policy while recovery reviews session/crash semantics;
- control-plane architecture reviews execution ownership while test review challenges the
  proposed acceptance evidence.

The parent collects findings, makes the implementation decision, performs all edits, and
can ask a specialist for a focused follow-up after fixes.

Do not use subagents to create several concurrent writers in the same repository. BotSquad
already has explicit branch/worktree ownership rules for concurrent development; specialist
reviews are not a bypass.

## Relationship to product-level BotSquad agents

Keep these concepts separate:

    Codex development specialist
        reviews how BotSquad is built

    BotSquad worker / employee
        is a runtime product identity managed by BotSquad

    BotSquad working group
        is a runtime deliberation object among workers

    provider/runtime subagent
        is a model-provider capability, currently not a generic BotSquad authority source

A Codex specialist review must never be represented as a BotSquad employee decision,
production approval, working-group vote, or runtime acceptance result.

## Maintenance

Configs live in `.codex/agents/*.toml`.

After materially changing a config:

1. parse every TOML file;
2. verify every specialist remains `sandbox_mode = "read-only"`;
3. verify there are no unintended model/reasoning overrides;
4. reopen/start a fresh Codex project session when necessary to verify agent discovery;
5. update this guide/Decision 023 only if the durable workflow changed.

Do not add more specialists merely because Codex supports them. Add one only when there is
a recurring, separable review responsibility with a useful stable packet/output contract.
