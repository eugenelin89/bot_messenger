# Execution plan — Ask BotSquad design amendment

**Status:** Design complete — documentation only; integration result recorded in final handoff
**Owner:** Repository owner's ChatGPT design task
**Started / completed:** 2026-10-06
**Branch:** `feature/ask-botsquad-design`
**Worktree:** Authenticated GitHub branch; owner's Mac worktrees are not accessible
**Baseline:** `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5`

## Objective and outcome

Added the owner's Ask BotSquad requirement: public website chat for general or specific simulated-transaction questions, one relevant actual employee response and follow-up. This amends the investment showcase design/roadmap; no application code or runtime authority changes.

## Completed documentation

- Added R09, the normative ASK_BOTSQUAD.md specification and four detailed INV-ASK packets with ASK-A01–ASK-A12 acceptance.
- Integrated all new status/dependency/launch gates in the existing roadmap, preserving INV-01–INV-12 and core numbering.
- Updated design hub, public UX, architecture, decision log and single-packet Codex launcher.
- Added Decision 028 and index entry; explicitly marked Decision 027's affected scope as partially amended with links both ways.
- Preserved unrelated Personal Operator source/history and all deterministic investment methodology.

## Reviewed boundaries

Actual worker identity is distinct from a website persona. Broad general topics are supported. Questions carry trusted public record references rather than supplied balances. Historical rationale and new interpretation stay distinct. HQ fetches questions outbound under an independent grant; visitors cannot trade, assign Tasks, obtain private data or create approval.

Anonymous-session conversations and answer attachments are separate from the public team discussion/artifact archive. No private worker runtime is reused and no visitor content becomes investment memory automatically. Local HQ budgets protect shared capacity even if the website is hostile. Stable identities, provider uncertainty, cancellation/deletion and delivery receipts prevent blind model replay or resurrection of deleted chat.

## Validation evidence and limits

| Check | Result |
| --- | --- |
| Main reference and changes since original design | Read through GitHub; intervening Personal Operator work preserved |
| Existing guidance/design fit | Reviewed current AGENTS, guide/roadmap, architecture/types context and original documents; no existing Ask implementation claimed |
| Requirement/packet coverage | R09 maps to four packets and ASK-A01–ASK-A12; general/contextual actual-worker cases included before launch |
| Supersession and navigation | Manual review of relative paths, stable IDs, linked normative ownership and Decision 027/028 cross-references |
| Changed scope | GitHub comparison `c6c8f0b...` to `9092b9b...` confirms twelve Markdown paths only; subsequent change is this completion record |
| Primary security references | OWASP prompt injection, API resource consumption, session/CSRF sources checked 2026-10-06 |
| Local Git retrieval | `git ls-remote` failed because container DNS could not resolve github.com; connector reads/writes used instead |
| Automated Markdown/link/Git whitespace checks | Not run; manual review is not represented as automated validation |
| Runtime, live-provider, browser, SSH, security execution tests | Not run; feature is only a design and tests remain future gates |
| Independent specialist review | Not performed for this documentation task; future authority/runtime packets require risk-appropriate review |

Normal PR integration and final main read-back are performed separately; exact merge identity belongs in the final handoff, not a self-referential commit field.

## Remaining decisions and implementation

All INV and INV-ASK implementation rows remain Planned. Actual eligible roster, provider permission for third-party public service, quotas/cost bounds, session/backup retention, optional research, privacy wording and public activation are explicit future decisions. Proposed defaults are not owner-approved live settings.

No website implementation/deployment, credentials, grants, public question processing, model invocations or investment activity occurred. Continue from the [design guide](../experiments/investment/README.md), [Ask specification](../experiments/investment/ASK_BOTSQUAD.md) and [status roadmap](../experiments/investment/ROADMAP.md) using the [single-packet launcher](../../prompts/investment-experiment.md).
