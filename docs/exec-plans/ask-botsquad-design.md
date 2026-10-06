# Execution plan — Ask BotSquad design amendment

**Status:** Active — documentation only
**Owner:** Repository owner's ChatGPT design task
**Started:** 2026-10-06
**Branch:** `feature/ask-botsquad-design`
**Worktree:** Authenticated GitHub branch; owner's Mac worktrees are not accessible
**Baseline:** `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5`

## Objective and scope

Add the owner's Ask BotSquad requirement: public website chat accepting general questions or questions about a specific simulated transaction, answered by one relevant actual BotSquad employee. Amend the investment showcase design and implementation roadmap, not application code or runtime authority.

## Steps

1. Read current repository guidance, design and intervening changes; preserve concurrent Personal Operator work.
2. Specify visitor experience, authentic employee routing, scoped evidence, outbound HQ question retrieval, session privacy, abuse/cost controls and recovery.
3. Reconcile the earlier read-only/publication-only design with a narrowly authorized answer-request path; preserve all financial and private-HQ boundaries.
4. Add stable prompt packets and acceptance checks before public launch; retain existing INV numbering.
5. Review changed Markdown, links, references and requirement coverage; integrate through a normal PR and read back the result.

## Invariants

One real employee answer per admitted question; no scripted personas. General questions remain supported, not restricted to investments. Visitor text cannot grant trade/task/research/publication authority. Public-service contexts never reuse private worker threads. Visitor chats are session-private by default, not part of the public investment archive. No questions or Q&A answers become investment evidence or team memory automatically.

## Validation

Documentation review and remote diff/read-back only unless a check is actually run. The local `git ls-remote` attempt failed because the container could not resolve github.com; GitHub connector reads/writes remain available. Do not claim a local clone, SSH inspection, runtime tests or deployments. External security references were checked through primary OWASP pages on 2026-10-06.

## Evidence

- Main and comparison against design merge `d87c3a6...` read through GitHub; investment design files are unchanged, intervening Personal Operator changes preserved.
- Existing guidance/readme/roadmap and prior architecture/types reviewed; no Ask BotSquad implementation claimed.
- Final document coverage, diff and PR read-back: pending.

## Out of scope

Implementation, website modification/deployment, creating credentials, enabling grants, running public questions, changing investment decisions, purchasing services or launching the experiment.
