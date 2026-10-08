# Repository documentation and prompt structure cleanup

**Status:** Documentation complete; validation and independent review passed. Integration identity is recorded by the PR and final handoff.
**Owner:** Parent Codex thread; sole writer/integrator
**Branch:** `codex/repository-documentation-prompt-cleanup`
**Worktree:** `bot_messenger-docs-cleanup`
**Started:** 2026-10-07
**Initial ETA:** 60–90 minutes, including provenance audit, documentation edits, validation, review and merge.

## Objective and scope

Give core milestones, Personal Operator stabilizations, operations, experiments and
authoring guidance distinct homes. Preserve the distinction between task specification,
execution history, validation evidence and accepted decisions. Correct current-facing
status without changing historical requirements or future architecture semantics.

Markdown and Git organization only. No application, schema, authority, production,
worker-state or external-system changes; no build, deployment, SSH or new milestone.
Decision 026 remains the sequencing authority. Investment/Ask design stays separate.

## Baseline and ownership

- Fetched origin before editing: `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`.
- Inspected all local/remote branches, tags and 12 existing worktrees; created an isolated
  worktree without changing those checkouts. GitHub open-PR search returned zero results.
- The repository is not shallow. History initially contains 370 reachable commits and no tags.
- Read root/scoped instructions, product vision, intelligent company model, system
  architecture, roadmap, decision index and relevant milestone evidence.

## Classification and method

- **Current-facing:** front doors, current state/memory, scoped instructions, authoring
  guidance, product boundary statements and operator guidance. Correct stale status.
- **Historical:** execution plans, validation/evidence, accepted decision bodies and
  recorded tutorials/case studies. Preserve facts, failures, measurements and old sequencing.
  Only migrate moved-file navigation references where required.
- **Future architecture:** multi-company, federation, Telegram, iOS and broader organization
  designs. Correct status/numbering while retaining design constraints.
- Whitepaper Version 0.4 remains a September 29 historical snapshot; add aligned English
  and Traditional Chinese notices, not a Version 0.5 rewrite.

## Work plan

1. Audit reachable history, renamed/deleted paths and candidate prompt sources.
2. Create provenance-labelled milestone/stabilization specifications and indexes.
3. Move the three existing prompt files with `git mv`; migrate inbound/outbound references.
4. Correct evidence-backed current-facing status and add preservation/freshness rules.
5. Run whitespace, repository-relative links, index, old-path, freshness and scope checks.
6. Obtain focused read-only documentation/test review, resolve findings, create PR,
   merge normally and verify main. No production deployment.

## Provenance audit

Audited all 370 commits reachable from the fetched local/remote branch refs; no tags and no
shallow-history boundary. Used `git log --all -- prompts/`, full `--name-status` history,
`-S "Prompt 01"` / `-S "Prompt 10"`, add/delete/rename history, `git show` of the first
committed plans and original-source candidate, and all historical Markdown/text blobs.
The object inventory contained 3,636 objects; 869 Markdown/text blob versions were searched
(including evidence logs). The focused plan/prompt/provenance inventory contained 363 blob
versions across 65 candidate paths. No deleted Markdown/text original was found. Search
scope is reachable repository history, not private conversations or unavailable Git objects.

**Recovered exact source:** Prompt 05, already retained as
[the original request](../validation/artifacts/prompt-05-original-request.md), first committed
at `3dd7de7df39b14ea08de15f547c11e85ae8feba1`. The independent audit explicitly identifies
it as the unaltered original, with SHA-256
`2f1fd31c39248226b863e7a475f873307e4d7066cc85ca449486966fe94208dc`; this cleanup verified
those bytes. The new [Prompt 05 entry](../../prompts/milestones/prompt-05.md) is a provenance
and navigation wrapper, not a replacement or duplicate of the 125-section original.

**Reconstructed:** Prompt 01–04 and 06–11 (10 files), plus Personal Operator 01–03 (3 files).
Each names its first execution-plan commit, this audit baseline and related roadmap,
validation, decisions and architecture. Each prominently states:

> Historical note — reconstructed specification: The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The stabilization variant says “stabilization specification.” Later changes are explicitly
separated, notably WE-01 after Prompt 07, scheduler admission after Prompt 09 and credential
retirement after Prompt 11. No original-source claim is made for an execution plan or worker
product specification. Decision 026 governs present sequencing; it is not back-ported into
earlier milestone requirements.

## Changes and historical preservation

- Added the prompt landing page, 11-row milestone index and 3-row stabilization index;
  canonical roadmap/current state continue to own sequencing and operational truth.
- Used `git mv` for the root bootstrap, investment launcher and authoring-guidance files
  into `operations/`, `experiments/` and `authoring/`, respectively. Root now contains only
  navigation and scoped instructions. Migrated 28 old-path references in 18 files and
  corrected 23 moved-file outbound Markdown destinations for their new depth.
- Added future specification-preservation and lightweight freshness rules; fixed the
  malformed scoped reading list and used risk-based specialist routing. Parent remains
  sole writer/integrator/deployer; specialists remain read-only.
- Corrected stale current-facing status in authoring guidance, product and architecture
  boundaries, bootstrap guidance, tutorials, README, agent guide, project memory and the
  decision index. Computer Use authority and future architecture semantics are unchanged.
- Kept all 11 milestone execution plans, all 3 stabilization plans and every validation/
  evidence file byte-identical. Their old “next” wording, failed attempts, production counts
  and private-evidence qualifications remain history.
- Accepted decision bodies are unchanged except Decision 027’s launcher destination.
  Three other historical documentation plans receive only migrated navigation references;
  the September 29 plan explicitly says the guidance is “now at” its new path.
- Investment/Ask design files receive only launcher/authoring link migration. Decisions
  027/028 keep their numbers and semantics; no new decision or experiment is implemented.
- Both Version 0.4 whitepapers retain their version, September 29 date and historical
  bodies. Added semantically aligned English/Traditional Chinese notices linking current
  state, roadmap, Decision 026 and qualified Prompt 11 validation.
- The link scan found one pre-existing README anchor in the historical SquadStatus case
  study. Repointed only that navigation link to the current local-development section;
  historical case-study prose remains intact.

### Inspected current-facing / future-architecture surfaces

Reviewed every requested candidate: authoring and prompts/AGENTS; multi-company, external
identities/Telegram, iOS, Demo Operator, Computer Use, AI organization and Ubuntu product
models; Computer Use/company-loop/system architecture; both Computer Use/company-loop
operator tutorials; both bootstrap guides; specialist guide, engineer primer and first
assignment tutorial; both whitepapers. Verified README, root AGENTS, Project Memory,
roadmap, vision, intelligent-company model, single-company operations, Current State,
decision index and Decision 026 against the bounded closure and stabilization evidence.

Code spot-checks confirmed the local-owner Attention route and current scheduler implementation;
no code was edited. Broader runtime revalidation is unnecessary for prose/navigation changes.

### Freshness dispositions

The old multi-company/Telegram/federation numbers are removed from current assignments;
roadmap supersession notes retain former numbers explicitly as history. Prompt 11’s current
authoring status now says C11-1/2/4 PASS and C11-3 PASS within supervised scope. Future mobile
access depends on demonstrated owner need. Bootstrap wording acknowledges later use of the
same topology without re-certifying historical hardware measurements. Tutorials state their
own scope. Legitimate pending approvals, unknown outcomes, future design and historical
acceptance requirements are retained, not mechanically replaced.

Exact scan counts and final reviewer disposition follow in the validation ledger.

## Validation and review ledger

No Markdown/link checker or Markdown CI workflow exists in this repository; package.json
contains application checks only. Used temporary Python standard-library scripts under
`/tmp/`; no dependency or checked-in script added. The relative-link scan covers Markdown
inline/reference destinations and HTML href/src outside code fences, validates files and
GitHub-style heading fragments, and compares with the original Git baseline.

| Check | Result |
| --- | --- |
| `git diff --check` and staged equivalent | PASS; initial new-file hard-break whitespace was removed before final verification |
| Repository-wide link scan | 163 Markdown files; 1,517 parsed links, including 1,452 relative destinations and 47 Markdown fragments; zero missing paths/anchors |
| Baseline link comparison | 145 Markdown files, 1,160 relative destinations, 15 fragments; one pre-existing case-study anchor repaired |
| Milestone index | 11 rows; all 66 relative links pass |
| Stabilization index | 3 rows; all 18 relative links pass |
| Old moved-path search across repository files | Zero references |
| Freshness phrase scan | 162 input Markdown documents (excludes this report to avoid self-count); 273 matching lines / 287 phrase occurrences |
| Classified freshness hits | A current-facing: 68 lines / 76 occurrences; B historical: 143 / 147; C future architecture: 62 / 64 |
| Current stale sequencing after classified review | Zero unresolved current-facing milestone/expansion status findings |
| Change scope | 59 Markdown changes including 18 new files and 3 moves; zero application/runtime/schema/test/script/deployment/dependency changes |
| Git move detection | Authoring 73%, experiment launcher 90%, bootstrap 84% similarity |
| Historical preservation | All 14 original milestone/stabilization plans and all 360 validation/evidence files byte-identical to baseline |
| Decision preservation | 27 decision bodies byte-identical; Decision 027 differs only by migrated launcher destination; no renumbering/new decision |
| Whitepapers | Both historical bodies byte-identical after removing only the new notices; Version 0.4/date retained |
| Investment launcher | Copyable task wrapper byte-identical; only navigation/category/current-priority context changed |
| Provenance | Prompt 05 digest/source verified; all 13 reconstruction first-plan commit claims verified |

Freshness scan used case-insensitive whole-phrase matches for `is next`, `next milestone`,
`planned`, `pending`, `not implemented`, `future Prompt`, `Prompt 12`, `Prompt 13`,
`Prompt 14` and `live acceptance pending`. It includes fenced sequencing diagrams.
A second focused search inspected completed-milestone language paired with next/pending/
future/will/must/should. Remaining hits describe explicit history, original acceptance
contracts, unimplemented future designs, workflow states or negative sequencing guards.
No unresolved product/roadmap ambiguity required product-strategy review.

The read-only `test_reviewer` independently checked the 163-file link/fragment scan,
both indexes, old paths, all 13 first-plan commits, Prompt 05 bytes/hash, historical
preservation, scope and moves. **BLOCKING: none. IMPORTANT: none. OPTIONAL: none.**
The parent inspected the complete change and owns all edits/integration. No security,
recovery or control-plane review was needed because technical semantics did not change.

Application builds, runtime tests, live-model acceptance and production access were not
run: they provide no additional evidence for this Markdown-only change. No deployment,
restart, SSH, worker-state change or external business action occurred.

## Directory handoff

Before:

```text
prompts/
├── AGENTS.md
├── MILESTONE_REQUIREMENTS.md
├── bootstrap-ubuntu.md
└── investment-experiment.md
```

After:

```text
prompts/
├── AGENTS.md
├── README.md
├── milestones/
│   ├── README.md
│   └── prompt-01.md … prompt-11.md
├── stabilizations/
│   ├── README.md
│   └── personal-operator-01.md … personal-operator-03.md
├── operations/bootstrap-ubuntu.md
├── experiments/investment-showcase.md
└── authoring/MILESTONE_REQUIREMENTS.md
```

## Delivery and remaining documentation debt

The reviewed documentation uses one owned short-lived branch and normal PR integration;
no force push or history rewrite. Refetched main before publication; it remained the
recorded baseline. The PR and final handoff record the resulting merge SHA and main
verification, avoiding a document that claims to contain its own future commit hash.
Other worktrees and the separate investment/Ask documentation remain preserved.

No cleanup acceptance blocker or unresolved historical-source ambiguity remains. Exact
original prompts other than Prompt 05 remain unavailable in inspected Git history; the
reconstruction labels retain that limitation. A substantive whitepaper Version 0.5 remains
separate optional documentation work, not part of this task. No Prompt 12, stabilization
04, new decision, implementation task or production deployment is created by this cleanup.
