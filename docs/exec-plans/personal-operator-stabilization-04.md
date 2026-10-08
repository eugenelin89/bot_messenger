# Personal Operator Stabilization 04 — Worker portraits

**Status:** Active — implementation accepted locally; production acceptance pending
**Owner:** Parent Codex, sole writer/integrator/deployer
**Branch:** `codex/personal-operator-stabilization-04-worker-portraits`
**Worktree:** `bot_messenger-personal04`
**Started:** October 7, 2026 (America/Vancouver)
**Initial ETA:** 2–3 hours including browser review and production acceptance.

[Specification](../../prompts/stabilizations/personal-operator-04.md) · [Validation](../validation/PERSONAL_OPERATOR_STABILIZATION_04.md)

## Scope and baselines

BotSquad baseline after fetch: `18ecded2d5274ed022030618e77a7372cda5d629`.
Website source-only baseline after clone/fetch: `f572e31254079a493dac98279e161d85172bab29`.
No open BotSquad PRs at preflight; existing worktrees and investment/Ask documents retained.
Read AGENTS, README, project vision, architecture, Decision 026, prompt archive instructions,
and operation/deployment guidance. Decision 026 remains authoritative; no Prompt 12.

Copy fictional illustrated workers from the website Git source, verified against its
[provenance](https://github.com/eugenelin89/asymmetri/blob/f572e31254079a493dac98279e161d85172bab29/docs/BOTSQUAD_PORTRAITS.md).
No identity, worker model, schema, API v1, authority, runtime or dispatch changes.
Nix has no documented approved source image: retain initials, as for unknown workers,
Computer Operators, Human and System. No website edits or deployment.

## Source manifest

Source repository: `eugenelin89/asymmetri`. All copies byte-identical, 384 × 384 WebP.

| Name | Source path | Git blob | Destination path | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| Atlas | public/images/botsquad/atlas.webp | af1b589bbb6505b556701ae240fc375071446df8 | public/images/workers/atlas.webp | 15844 | 76bf6d9e4c9f79676da9e1836bf22ff042a9867e845ca2a21ea799fe59970e01 |
| Maya | public/images/botsquad/maya.webp | 567f74b9fdf3849f2bfc549f82cf6017b2dc741c | public/images/workers/maya.webp | 20636 | 4c1ab0fba07ae7f79e2aee6c8ab0539ba6e5b7002b80ce81f38e2f304202b514 |
| Turing | public/images/botsquad/turing.webp | 5cbc70fd230e67b0ddb2fe796ececd0873490d07 | public/images/workers/turing.webp | 19742 | d8e3c490d4c01b6ea82646f8da6903a027763dc91d1b860a1973b9b54559d16f |
| Linus | public/images/botsquad/linus.webp | 4bb5e75915f68bd9264a77b0a9fa501640056ba3 | public/images/workers/linus.webp | 19000 | da69e895eb3291a1999ae18c1f4cb38c48c57d1468007c4130f1188d560999fd |
| Ada | public/images/botsquad/ada.webp | 6644825bd8ec94ddaf494475ac5cdebdea312e99 | public/images/workers/ada.webp | 18174 | fdbbd2a6224d8891fbfa358f9b32aeb2617e3f3d30df828e2344743194b08834 |
| Grace | public/images/botsquad/grace.webp | 7a4ac913e854510fcbb80ae205ab5c737fe3e855 | public/images/workers/grace.webp | 19860 | f87f7b472a13f9fcfeaea754c66c2c10a87b1e16ddbd5dce85431ce7234bdeab |
| Scout | public/images/botsquad/scout.webp | 2e4c659c2c39d4beeda8cb4759c2d8d6599d7842 | public/images/workers/scout.webp | 18410 | d485a4e498683a0a1715b9587b6b5278b5396da41988a943e2a03198569982fa |

## Implementation / audit

Core: roster, Executive sender, direct actual sender (including peers), group contribution,
organization, Task assignee, execution worker, worker inspector. Secondary actor surfaces:
engineering allocations/reviews, infrastructure identity/operations/approval target, research
inspector, ComputerSession operator, mandate coordinator and group facilitator/synthesizer.
Keep selectors, compact metadata and raw evidence textual.

One presentation registry with exact canonical-name mapping and typed worker/principal
adapters. Names never confer authority. Visible names remain escaped; images/initials are
decorative. Shared image error listener reveals initials. Exact static allowlist entries;
WebP MIME has no charset, existing security headers remain. No external requests.

## Validation and delivery gates

1. Focused static tests: all seven exact bytes/MIME/headers, unknown and raw encoded path
   probes, no symlink traversal. Browser assertions cover all required surfaces, each mapping,
   fallback, load failure, escaped custom names, actual peer sender and 390 × 844 layout.
2. Run startup/reconnect/stale reads, Attention count/source and affected browser/server tests.
3. Read-only test_reviewer challenges evidence; parent inspects exact-route security.
4. Recheck/fetch main, diff/check, commit/push/PR, review and normal merge.
5. Verify exact merged source/build on Ubuntu; inspect active work and preserve pause;
   root-private protected backup and retained-state comparison; code-only deployment.
6. Real private tunnel read-only acceptance at desktop/narrow; zero external portraits,
   mutations or unexpected model/business/computer work; idle sample and preservation.
7. Record production acceptance, update current-facing status and deliver evidence.

## Remaining work

Normal merge, exact merged Ubuntu validation/deployment, real production acceptance and completion documentation.
No completion claim until all gates pass.

## Local evidence and review

Build passed; static 5/5, HTTP/Attention 58/58, affected browser 47/47; final portrait
rerun 4/4 after preserving System fallback tone. Both specialists cleared implementation;
[review and failed-attempt dispositions](../validation/evidence/personal04/reviews.md).
Parent inspected Tasks/Groups screenshots. Final source-byte comparison 7/7 passed;
origin/main re-fetched and remains `18ecded`. Production currently `b6c3928`, read-only
health inspection ready; no production changes yet.

Secondary audit: compact labels added to engineering allocations/reviews, infrastructure
identity and protected approval target, research-operation inspector, ComputerSession
operator, mandate coordinator and group facilitator/synthesizer. Decision histories,
selectors, audit strings, session metadata and raw details remain textual to avoid clutter.
No independent persistent image field or new decision record is warranted.
