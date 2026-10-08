# Worker portraits

The portraits are fictional illustrated AI-worker characters, not photographs of human
employees. They are cosmetic display metadata; `worker_id` and existing principal records
remain identity and authority. No schema field, API v1 contract or runtime behavior changed.

## Source and mapping

Original seven portraits: [eugenelin89/asymmetri](https://github.com/eugenelin89/asymmetri), commit
`f572e31254079a493dac98279e161d85172bab29`.
[Website provenance](https://github.com/eugenelin89/asymmetri/blob/f572e31254079a493dac98279e161d85172bab29/docs/BOTSQUAD_PORTRAITS.md).

| Exact canonical name | Source in website repository | Local BotSquad asset |
| --- | --- | --- |
| Atlas | `public/images/botsquad/atlas.webp` | `public/images/workers/atlas.webp` |
| Maya | `public/images/botsquad/maya.webp` | `public/images/workers/maya.webp` |
| Turing | `public/images/botsquad/turing.webp` | `public/images/workers/turing.webp` |
| Linus | `public/images/botsquad/linus.webp` | `public/images/workers/linus.webp` |
| Ada | `public/images/botsquad/ada.webp` | `public/images/workers/ada.webp` |
| Grace | `public/images/botsquad/grace.webp` | `public/images/workers/grace.webp` |
| Scout | `public/images/botsquad/scout.webp` | `public/images/workers/scout.webp` |
| Nix | `public/images/botsquad/nix.webp` | `public/images/workers/nix.webp` |

The original seven 384 × 384 WebP files are copied byte-for-byte (131,666 bytes total), without
recompression. [Manifest](../validation/evidence/personal04/portraits.json) records each
Git blob, size and SHA-256; the [execution plan](../exec-plans/personal-operator-stabilization-04.md)
records source, destination and validation provenance.

**Post-Stabilization-04 portrait sync (October 8, 2026):** Nix was copied from website
commit `322b67acd785735dd2ffac9c5c082c684fbee836`, blob
`624172e3eb7767e8e12cfa8f55366f26eaf04141`, without resizing or recompression.
The [Nix manifest](../validation/evidence/personal04-nix/portraits.json) records its
14,912 bytes and identical source/destination SHA-256. All eight 384 × 384 WebP files
total 146,578 bytes; the original seven are unchanged. The website
[provenance](https://github.com/eugenelin89/asymmetri/blob/322b67acd785735dd2ffac9c5c082c684fbee836/docs/BOTSQUAD_PORTRAITS.md)
records the alt text “Illustrated portrait of Nix, a BotSquad AI worker.” BotSquad keeps
its existing decorative-image semantics beside visible worker names.

## Display and fallback

`public/worker-portraits.js` owns exact canonical-name mapping for actual worker records.
Role alone never supplies a portrait. Computer Operators retain initials even if their
name matches a pictured employee. Principal callers first resolve the actual bot worker;
Human, System and unmatched principals keep fallback. Names are safely escaped and remain
visible alongside decorative (`alt=""`, `aria-hidden="true"`) portraits/initials.

Nix now uses his approved local portrait. Future/custom employees and unknown workers
use initials. A failed image request removes only the image and reveals
initials; it changes no readiness, Attention, authority or model state. No remote fallback.
Normal avatars are 34px; dense actor labels use 26px and the inspector uses 48px.

Core surfaces: roster, Executive messages, direct/peer messages, group contributions,
organization, Task assignee, execution worker and worker inspector. Secondary actor labels:
engineering allocations and reviews, infrastructure identities and approval targets,
research-operation inspector, ComputerSession operator, mandate coordinator and group
facilitator/synthesizer. Select options, compact history metadata and raw evidence stay text.

## Serving and replacement

The HQ serves an exact allowlist of eight local image routes and the helper module.
WebP has `image/webp` without a charset, existing security headers/cache policy remain,
and unknown paths, normalized traversal aliases and symlinked portrait components are denied.
There is no public-website/GitHub/CDN dependency after deployment.

For a future replacement: obtain owner-approved source via Git; read its provenance;
record the exact commit/blob and compare byte counts and SHA-256; copy the exact file;
update this mapping and the manifest; update explicit routes only if names change; run
static, browser fallback/attribution and narrow-layout checks. Never infer a new employee's
appearance or assign an existing face by role. Persistent custom portrait configuration
is future work requiring a separate request.
