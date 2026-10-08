# Post-Stabilization-04 — Approved Nix portrait sync

**Status:** Portrait sync complete and deployed; completion-documentation delivery in progress
**Owner:** Parent Codex, sole writer/integrator/deployer
**Branch:** `codex/post-stabilization-04-nix-portrait`
**Worktree:** `bot_messenger-nix-portrait`
**Started:** October 8, 2026
**Initial ETA:** 45–75 minutes

## Objective and scope

Sync the exact approved Nix asset into the existing shared portrait registry and exact
static allowlist. Preserve all fallback rules and the original seven portrait bytes.
This is a post-Stabilization-04 presentation follow-up, not Stabilization 05 or Prompt 12.
No website changes, per-view special cases, schema/runtime/authority changes or new features.

Read `AGENTS.md`, README, product vision, architecture, Decision 026, worker portrait
semantics, Stabilization 04 acceptance, operations/deployment and specialist review guidance.
Identity remains worker/principal based. No migrations or runtime acceptance work needed.

## Steps and validation

1. Fetch both main branches, verify source commit/blob/size/hash, create dedicated worktree.
2. Copy the exact file, add shared mapping/allowlist entries, extend existing tests/docs.
3. Build; existing static/HTTP/Attention and portrait/startup/reconnect/secondary browser tests.
4. Inspect diff, independent read-only acceptance review, PR, normal merge, verify main.
5. Exact merged Ubuntu build/tests, protected stopped-service backup and offline Store check.
6. Code-only deployment, health/source/build identity, read-only desktop/390×844 UI and idle.

## Evidence ledger

- Fetched BotSquad main `cb2fd43b8ffbec274df294f483d242a90385765e` and website main
  `322b67acd785735dd2ffac9c5c082c684fbee836`; website source-only bare clone.
- Source blob `624172e3eb7767e8e12cfa8f55366f26eaf04141`, 14,912 bytes.
- Source/destination SHA-256 `977687061d10f7df1bc9379bb76b731039f4c5fadcb9b0ee9be6a37fa026fc12`.
- Initial build found the main worktree dependency path absent; reuse the unchanged
  Stabilization 04 installed dependencies after lock equality verification.

- Local build passed; 63/63 static/HTTP/Attention, 4/4 portrait browser and 43/43
  startup/reconnect/Attention/secondary browser regressions passed.
- All seven prior assets match the baseline and current website Git blobs; Nix exact
  source/destination byte equality. Narrow synthetic Working Group screenshot inspected.
- First HTTP run hit sandbox listener EPERM; the same suite passed with listener permission.

- PR #30 opened; independent test reviewer found no merge blocker. Historical/current
  acceptance wording clarified as requested; postmerge gates remain explicit.

## Acceptance and completion delivery

PR #30 merged as `cd43d4ffef96d1892123259d1025d950b59d8a4d`. Exact Ubuntu build,
63/63 static/HTTP/Attention and 38/38 portrait/startup/Attention browser checks passed.
Protected consistent backup, two offline Store openings, 270-file independent/deployed
build equality and health/source identity passed. All 59,909 original rows across 82
DBs, 427 account/group mappings, 702 root records and 212 worker homes preserved.

Real desktop and 390×844 acceptance confirmed Nix and all eight exact local portraits,
62 Executive worker portraits, 48 Tasks, 69 executions, 10 direct messages, Human fallback
and Attention=1. No external portrait requests, browser writes, page errors or overflow.
Peer/group history is absent in production and covered honestly by fixtures. Parent
visually inspected both production Organization screenshots. Post-UI full preservation
and separate 30-second idle sample passed; all counts/pause unchanged and active-work zero.
Website final read-only fetch unchanged. Full evidence links are in Stabilization 04 validation.

Remaining: merge the evidence-only completion documentation, deploy its exact merged source
with the same protected backup/build gate, repeat UI/idle and record final identity outside
Git. Application source/assets/tests/dependencies are unchanged by this completion commit.
No further feature or stabilization is included.
