# Personal Operator Stabilization 04 — Validation

**Original Stabilization 04 status:** Complete and deployed — exact merged Ubuntu validation, production UI acceptance and preservation passed.

**Post-Stabilization-04 Nix sync:** Local validation passed; exact merged Ubuntu and production delivery gates pending.

[Specification](../../prompts/stabilizations/personal-operator-04.md) · [Execution plan](../exec-plans/personal-operator-stabilization-04.md) · [Portrait semantics](../product/WORKER_PORTRAITS.md)

## Source integrity

BotSquad baseline `18ecded2d5274ed022030618e77a7372cda5d629`; website source-only main
`f572e31254079a493dac98279e161d85172bab29`, both fetched before editing.
Read the website portrait provenance before copying. Seven exact 384 × 384 WebP files,
131,666 bytes total; SHA-256 and Git blob identity match source/destination.
[Full manifest](evidence/personal04/portraits.json) records paths, blobs, sizes and hashes.
At original acceptance Nix had no approved source portrait and retained initials.
The post-Stabilization-04 sync below records the later approval. No website write or deployment.

## Local evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript build | Pass | [Build](evidence/personal04/local-build.txt) |
| Exact bytes/MIME/headers; unknown/traversal/prototype/symlink denial; encoded ID compatibility | 5/5 | [Static](evidence/personal04/local-static.txt) |
| HTTP owner boundary, SSE, runtime settings, project/research boundaries and Attention | 58/58 | [HTTP/Attention](evidence/personal04/local-http-attention.txt) |
| Portraits, startup/ready/degraded, immediate navigation, reconnect/stale reads, Attention source/count, direct/group/mandate/research | 47/47 | [Affected browser batch](evidence/personal04/local-browser.txt) |
| Final portraits after System fallback style correction | 4/4 | [Focused browser](evidence/personal04/local-portraits-final.txt) |

Browser fixtures use the real local HTTP server and isolated durable state with dispatch
paused; no real model or external business/computer work. Both 1440 × 1100 and 390 × 844
check exact worker paths, Nix fallback, actual Executive/direct/peer/group sender, human
fallback, explicit Task assignee versus requester, executions, organization, inspector,
visible names, decorative semantics and decoded images. Synthetic names include HTML and
prototype keys; a bot principal lacking a worker cannot borrow Atlas's portrait.
Aborted image requests reveal initials while readiness and Attention remain unchanged.
Browser assertions require zero external portrait requests, zero mutation requests and
zero runtime calls. Parent visually inspected fixture Tasks and Groups screenshots.

## Review and retained failures

[Specialist review and failure dispositions](evidence/personal04/reviews.md). Read-only
`security_reviewer` and `test_reviewer` report no remaining implementation blockers.
Initial failures are retained beside the passing logs; assertions were not weakened to
hide product defects. No runtime, schema, Client API v1 or authority change occurred.

## Exact merged Ubuntu and production acceptance

[PR #28](https://github.com/eugenelin89/bot_messenger/pull/28) merged normally as
`21e8def939126828bf4c472a2cb19131dd5ad62a`. Local and origin/main matched that revision.
Ubuntu separately built the exact merge using unchanged locked dependencies: **63/63**
[static/HTTP/Attention tests](evidence/personal04/ubuntu-merged-http.txt) and **38/38**
[portrait/startup/Attention browser tests](evidence/personal04/ubuntu-merged-browser.txt).

[Deployment receipt](evidence/personal04/deployment.json): protected backup at
`/var/backups/botsquad/personal04-20261007-production`; only the application service was
stopped/restarted. No running/queued work before deployment; pause=false preserved.
Two offline Store openings preserved the database's logical rows; persistence source and
schema unchanged. Independent and deployed builds match across **269 files**; source,
health and deployment receipt report the exact merged SHA. Listener remains loopback-only.

All **59,909 original rows across 82 databases**, 427 account/group mappings,
702 infrastructure records and 212 worker homes are preserved (only the existing
`workers.updated_at` exclusion). Retained production has eight workers, 48 Tasks,
69 executions, one Prompt 11 action/approval/attempt/receipt, two closed operating cycles
and one completed scheduled occurrence. Its provider/temporary credential and grant remain
retired; zero ComputerSessions. No new business/computer/research authority.

[Real private-tunnel UI evidence](evidence/personal04/production-ui.json), driven by the
[read-only acceptance script](evidence/personal04/production-ui.mjs), passed at **1440 × 1100**
and **390 × 844** using native production HTTP/SSE. Both checked:

- Eight roster/organization workers and the worker inspector; seven exact local portraits,
  Nix initials, visible names, decorative semantics and fully decoded 384px images.
- **37 worker-authored Executive messages**, **48 Task assignee cards**, **69 execution rows**
  and **10 retained direct messages** against their actual persisted worker/principal IDs.
- Correct Attention count **1**, responsive navigation and no document overflow.
- All seven deployed responses: status 200, `image/webp`, exact byte count and SHA-256.
- **Zero external portrait requests, zero mutation requests, zero page errors.**

Production has **no retained peer-conversation or Working Group history**. Those tabs were
inspected without creating data. Peer actual-sender and attributable group/owner rendering
are proven by isolated desktop/narrow browser fixtures, not claimed as live-history evidence.

Parent visually inspected non-sensitive production [desktop](evidence/personal04/organization-1440.png)
and [narrow](evidence/personal04/organization-390.png) organization captures; private Tasks/messages
were not screenshotted. Synthetic [Task](evidence/personal04/fixture-tasks-390.png) and
[Group](evidence/personal04/fixture-groups-1440.png) captures show those layouts without private data.

[Post-UI preservation/idle](evidence/personal04/production-ui-idle.json) repeats full original-row
preservation and a separate 30-second idle sample: every count and pause value unchanged,
all active-work checks zero. Deployment's own 30-second idle sample also passed.

[Source integrity](evidence/personal04/source-integrity.json): website main still
`f572e31254079a493dac98279e161d85172bab29`; temporary bare clone was source-only.
No website commit, PR, push, working-tree edit or deployment. Source/destination checks 7/7.

## Completion delivery and limitations

The evidence/current-status follow-up is documentation-only; it will repeat protected exact
merged deployment and read-only acceptance without changing the accepted runtime bytes.
Its final source/build/health identity is recorded in the protected completion receipt at
`/var/backups/botsquad/personal04-20261007-completion/result.json` and final handoff.

At original acceptance Nix had no approved source portrait and retained initials.
After the follow-up below, custom/future workers, Human, System and Computer Operators
continue to retain safe initials. No appearance was invented. Production has no peer/group
history to inspect beyond its honest empty state. No Prompt 12, schema, Client API v1,
worker identity/role/profile, authority or runtime change was introduced.


## Post-Stabilization-04 Nix portrait sync

October 8, 2026 follow-up; this is neither Stabilization 05 nor Prompt 12.
Both repositories were fetched before editing: BotSquad main
`cb2fd43b8ffbec274df294f483d242a90385765e`, website main
`322b67acd785735dd2ffac9c5c082c684fbee836`. The website was read only.

Nix is added to the existing canonical registry and exact local static allowlist at
`public/images/workers/nix.webp`. [Provenance](evidence/personal04-nix/portraits.json):
blob `624172e3eb7767e8e12cfa8f55366f26eaf04141`, 14,912 bytes, source and destination
SHA-256 `977687061d10f7df1bc9379bb76b731039f4c5fadcb9b0ee9be6a37fa026fc12`.
The original seven assets and their historical acceptance manifest remain unchanged.
Human/System/custom/unknown/Computer Operator fallback and broken-image initials remain.
No per-view rendering, schema, worker identity/role, authority, Client API, scheduling or
runtime change. Validation and delivery are tracked in the
[follow-up plan](../exec-plans/post-stabilization-04-nix-portrait.md).


Follow-up local checks:

- [Build](evidence/personal04-nix/local-build.txt): passed using the unchanged dependency lock.
- [Static/HTTP/Attention](evidence/personal04-nix/local-http.txt): **63/63** passed,
  including all eight exact WebP responses, unknown/Human 404 and traversal/symlink denial.
- [Portrait browser](evidence/personal04-nix/local-portraits.txt): **4/4** passed at
  1440 × 1100 and 390 × 844, including actual Nix Executive/direct/peer/group senders,
  Nix Task/execution/organization/inspector, Human/custom/operator fallback, failed-image
  Nix initials and zero external portrait requests/mutations/model calls.
- [Startup/reconnect, Attention and secondary browser regressions](evidence/personal04-nix/local-browser-regressions.txt): **43/43** passed.
- [Source integrity](evidence/personal04-nix/source-integrity.json): Nix exact source/destination
  bytes and all seven previous assets unchanged against the BotSquad baseline and website main.
- Initial HTTP tests could not bind sandboxed loopback listeners; the
  [environment failure](evidence/personal04-nix/initial-sandbox-listener-denial.txt) is retained.
  The same tests passed with listener permission; no assertions were weakened.

The existing read-only production acceptance script accepts the Nix manifest as its fourth
argument; its original seven-portrait behavior remains available. Exact merged Ubuntu and
production results are recorded after merge in the protected deployment receipt and final
handoff (the source cannot contain its own eventual merge SHA).
