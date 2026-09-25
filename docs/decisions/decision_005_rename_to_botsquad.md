# Decision 005 — Rename product from Bot Messenger to BotSquad

**Date:** 2026-09-24
**Status:** Accepted

## Context

The original working name, **Bot Messenger**, accurately described the messaging layer but understated the broader product: a local operating environment for teams of AI workers with hierarchy, delegation, tasks, execution, supervision, and organizational state.

The product owner selected **BotSquad** as the new name because it better captures the idea of a coordinated, somewhat playful team of bots working together.

## Decision

The product/project name is **BotSquad**.

Current-facing documentation, UI copy, package/application naming, and future implementation should use **BotSquad** rather than **Bot Messenger**, except where the historical name is necessary to explain provenance.

The intended GitHub repository name is:

`eugenelin89/BotSquad`

The GitHub repository administrative rename is separate from this documentation decision. Until that rename is performed, the existing repository slug may remain reachable as `eugenelin89/bot_messenger`.

## Consequences

- New code and user-facing copy should use `BotSquad`.
- Future prompts should use the canonical BotSquad repository URL after the GitHub rename is completed.
- Existing historical commit messages do not need rewriting.
- Do not rewrite Git history merely to remove the old project name from historical commits.
- After the GitHub rename, local clones should update `origin` to the new canonical URL even if GitHub redirects the old URL.
