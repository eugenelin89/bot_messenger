# BotSquad — Personal Operator Stabilization 04
## Worker Portraits and Visual Employee Identity

This is an unnumbered Personal Operator / Daily Driver stabilization task.

This is NOT Prompt 12.

The owner has added illustrated faces for the canonical BotSquad employees on the public
Asymmetri BotSquad page and wants those same employee portraits used inside the actual
BotSquad application.

Primary product outcome:

> When an employee sends a message, owns a Task, performs an execution, participates in a
> discussion, or otherwise appears as the responsible worker, the UI should visually identify
> that employee with the same portrait used on the public BotSquad website.

The portraits are presentation only.

They must not change worker identity, authority, persistence, role semantics or runtime behavior.

===============================================================================
0. CURRENT VERIFIED BASELINES
===============================================================================

BotSquad repository:

    eugenelin89/bot_messenger

Current BotSquad main observed when this prompt was authored:

    18ecded2d5274ed022030618e77a7372cda5d629

Website repository:

    eugenelin89/asymmetri

Current website main observed when this prompt was authored:

    f572e31254079a493dac98279e161d85172bab29

Fetch both repositories before implementation.

Do not assume these SHAs remain current.

The website repository is SOURCE-ONLY for this task.

Do not modify:

    eugenelin89/asymmetri

unless the owner separately authorizes a website change.

BotSquad is the only implementation target.

===============================================================================
1. CURRENT PRODUCT DIRECTION
===============================================================================

Decision 026 remains authoritative:

    Personal Operator / Daily Driver

Prompts 01–11 are complete at their recorded scopes.

Personal Operator Stabilizations 01–03 are complete.

This task is UI polish selected from actual owner usage.

Do not create Prompt 12.

Do not add unrelated capabilities.

===============================================================================
2. PRESERVE THIS PROMPT IN THE NEW PROMPT STRUCTURE
===============================================================================

The repository now has a canonical prompt archive.

Create:

    prompts/stabilizations/personal-operator-04.md

Preserve the approved task specification there.

Link it to:

    docs/exec-plans/personal-operator-stabilization-04.md

and eventual validation:

    docs/validation/PERSONAL_OPERATOR_STABILIZATION_04.md

Do not confuse:

    task specification
    execution plan
    validation evidence

===============================================================================
3. WEBSITE PORTRAIT SOURCE
===============================================================================

The owner wants the SAME employee faces used at:

    https://asymmetri.co/botsquad

Do not generate replacements.

Do not use lookalikes.

Do not redraw them.

Do not hotlink the public website at runtime.

The website repository currently owns these exact assets:

    public/images/botsquad/atlas.webp
    public/images/botsquad/maya.webp
    public/images/botsquad/turing.webp
    public/images/botsquad/linus.webp
    public/images/botsquad/ada.webp
    public/images/botsquad/grace.webp
    public/images/botsquad/scout.webp

At the reviewed website revision they are 384 × 384 WebP portraits.

The website documentation describes them in:

    docs/BOTSQUAD_PORTRAITS.md

Read that document before copying assets.

It establishes that these are fictional illustrated AI-worker characters created for
BotSquad, not photographs of real employees.

===============================================================================
4. SOURCE PROVENANCE
===============================================================================

At prompt-authoring time Git reported these website blobs:

    Atlas
    af1b589bbb6505b556701ae240fc375071446df8

    Maya
    567f74b9fdf3849f2bfc549f82cf6017b2dc741c

    Turing
    5cbc70fd230e67b0ddb2fe796ececd0873490d07

    Linus
    4bb5e75915f68bd9264a77b0a9fa501640056ba3

    Ada
    6644825bd8ec94ddaf494475ac5cdebdea312e99

    Grace
    7a4ac913e854510fcbb80ae205ab5c737fe3e855

    Scout
    2e4c659c2c39d4beeda8cb4759c2d8d6599d7842

Verify current website main and exact source asset blobs before copying.

Record in the execution plan:

- source repository;
- source commit;
- source path;
- source Git blob SHA;
- destination path;
- copied-file hash.

The goal is exact portrait reuse.

===============================================================================
5. COPY ASSETS INTO BOT SQUAD
===============================================================================

BotSquad must serve its own copy.

Do NOT make the private BotSquad UI depend on:

    asymmetri.co
    raw.githubusercontent.com
    github.com

at runtime for employee portraits.

Suggested destination:

    public/images/workers/atlas.webp
    public/images/workers/maya.webp
    public/images/workers/turing.webp
    public/images/workers/linus.webp
    public/images/workers/ada.webp
    public/images/workers/grace.webp
    public/images/workers/scout.webp

Use exact source bytes.

Do not recompress or resize unless current BotSquad constraints genuinely require it.

The files are already small 384 × 384 WebP UI assets.

===============================================================================
6. IMPORTANT: NIX DOES NOT CURRENTLY HAVE A WEBSITE PORTRAIT
===============================================================================

At prompt-authoring time the website portrait set contains seven employees:

    Atlas
    Maya
    Turing
    Linus
    Ada
    Grace
    Scout

There is no:

    public/images/botsquad/nix.webp

Do not invent Nix's appearance.

Do not generate an image.

Do not assign another employee's portrait to Nix.

If, when executing this task, the current website repo now contains an explicitly documented
owner-approved Nix portrait, inspect its provenance and use it consistently.

Otherwise:

    Nix uses the existing initials-style fallback.

The same fallback must also support:

- future workers;
- custom workers;
- Computer Operators;
- workers whose names do not match a canonical portrait;
- Human owner;
- System identities.

Report this limitation clearly in the final handoff.

===============================================================================
7. PORTRAIT MAPPING MUST NOT BECOME IDENTITY AUTHORITY
===============================================================================

Portraits are display metadata only.

Do not add:

    portrait == identity

semantics.

The trusted worker identity remains:

    worker_id

and existing principal/domain records.

For the current canonical portrait set, a simple presentation registry keyed by exact
canonical display name is acceptable because the image mapping is cosmetic.

For example conceptually:

    Atlas  → /images/workers/atlas.webp
    Maya   → /images/workers/maya.webp
    Turing → /images/workers/turing.webp
    Linus  → /images/workers/linus.webp
    Ada    → /images/workers/ada.webp
    Grace  → /images/workers/grace.webp
    Scout  → /images/workers/scout.webp

Do NOT map by role alone.

There may eventually be multiple engineers, reviewers, researchers or operators.

A future engineer named something else must not automatically receive Linus's face.

Unknown/noncanonical names use fallback initials.

===============================================================================
8. NO DATABASE / SCHEMA CHANGE
===============================================================================

This task should not require persistent portrait fields.

Do NOT add:

    workers.avatar_url
    workers.photo
    workers.portrait

to the database merely for this canonical UI treatment.

No migration is expected.

The portrait registry belongs in presentation code/assets.

If investigation produces a strong reason for persistent per-worker avatar configuration,
do not expand scope silently.

Document it as future work instead.

===============================================================================
9. CURRENT BOT SQUAD AVATAR BEHAVIOR
===============================================================================

Current `public/app.js` uses an initials helper similar to:

    const avatar = name =>
      <span class="avatar ...">
        initials
      </span>

It currently appears in places including:

- left-side employee roster;
- Executive channel messages;
- direct-conversation messages;
- Organization tree.

Tasks and Executions currently identify employees mostly by text.

Working Groups have their own renderer in:

    public/groups.js

Other employee-bearing views exist in:

    public/mandates.js
    public/computers.js
    engineering/project rendering
    infrastructure rendering

Audit all current employee-identity surfaces before implementation.

===============================================================================
10. CREATE ONE SHARED PRESENTATION SEMANTIC
===============================================================================

Avoid sprinkling path logic everywhere.

Create one simple presentation helper/registry concept.

For example:

    portraitForWorker(worker)
    workerAvatar(worker, options)
    principalAvatar(principalId, options)

or another small equivalent.

It should support:

- known canonical portrait;
- fallback initials;
- compact sizing;
- optional CSS class;
- safe escaped visible name outside the image.

If modules need it, pass the helper into the existing module factories or introduce one
small explicitly served frontend helper module.

Do not create a frontend framework.

Do not add React/Vue/etc.

Keep the existing lightweight browser architecture.

===============================================================================
11. REQUIRED CORE SURFACES
===============================================================================

At minimum, portrait presentation must be applied consistently to these surfaces.

### A. Left employee roster

Current worker buttons show initials.

Replace known employees with portraits.

Keep:

- name;
- title;
- status dot;
- click behavior;
- loading semantics.

Nix/future workers use fallback.

### B. Executive channel messages

Every worker-authored message should show that worker's portrait.

Human owner/system messages retain appropriate fallback styling.

Do not assign Atlas's portrait merely because a worker lookup fails.

### C. Direct conversation messages

Worker-authored messages should display the worker portrait.

The human participant uses the existing human fallback.

Peer conversations must display the correct actual sender.

### D. Working Group discussion messages

`public/groups.js` currently shows worker names in attributable discussion history.

Add the matching portrait beside each worker contribution.

Owner interjections retain the human fallback.

Do not weaken attribution.

### E. Organization hierarchy

Known workers should show their portrait in the hierarchy.

Human owner remains a distinct human fallback.

Nix remains fallback unless an approved Nix asset exists.

### F. Task cards

A Task should visually show its ASSIGNEE.

The assignee's portrait should appear beside the employee name/task ownership information.

Do not make the portrait replace:

- task ID;
- requester;
- assignee name;
- status;
- objective.

A task can be requested by a worker and assigned to another worker.

Do not make it visually ambiguous which person owns the task.

Prefer the assignee portrait as the main task identity.

If requester identity is also visually represented, keep it subordinate and clear.

### G. Execution history

Each execution row should include the executing worker's portrait beside the worker name.

Preserve table readability.

Do not make the image so large that execution evidence becomes harder to scan.

### H. Worker inspector

When the owner opens a worker, show the portrait prominently in the inspector header/body
where practical.

Preserve model/profile/capability controls.

===============================================================================
12. SECONDARY SURFACES
===============================================================================

Audit other places where a specific worker is presented as the responsible actor.

Candidates include:

- engineering allocations;
- independent reviews;
- infrastructure operations;
- ComputerSession worker/operator;
- mandate coordinator/decision author;
- research-operation worker;
- group facilitator/synthesizer;
- approval target worker.

Use portraits where they materially improve identity recognition.

Do NOT turn every textual worker reference into an image.

For example:

- `<select>` options may remain text;
- compact metadata strings may remain text;
- raw evidence/details should remain factual text.

The purpose is recognizable employee presence, not visual clutter.

===============================================================================
13. TASKS AND MESSAGES ARE THE PRIORITY
===============================================================================

The owner's specific request is that:

    each employee's Task or message is accompanied by their picture.

Do not declare completion if only the sidebar/organization tree has portraits.

Acceptance must explicitly verify:

- worker Task ownership portrait;
- Executive-channel worker message portrait;
- direct-conversation worker message portrait;
- Working Group worker contribution portrait.

===============================================================================
14. ACCESSIBILITY
===============================================================================

The visible employee name normally appears beside the portrait.

Therefore employee portraits should generally be decorative to assistive technology:

    alt=""

or equivalent appropriate semantics.

Avoid causing a screen reader to announce:

    "Illustrated portrait of Atlas, Atlas, CEO"

when the visible name already supplies identity.

Fallback initials should likewise avoid redundant announcements when the full name is adjacent.

Do not remove the actual textual employee name.

Portraits must never be the only identity signal.

===============================================================================
15. VISUAL TREATMENT
===============================================================================

Reuse the current BotSquad visual language.

Current `.avatar` sizing is approximately:

    34 × 34

with rounded corners.

Use the square source portraits with:

    object-fit: cover

and consistent cropping.

Do not redesign the application.

Reasonable sizing:

- sidebar/messages/table rows: compact;
- organization/worker inspector: slightly larger if useful;
- Tasks: compact-to-medium.

Do not make giant profile cards.

Preserve information density.

===============================================================================
16. FALLBACK AVATARS
===============================================================================

The current initials system remains valuable.

Known portrait available:

    render image

No known portrait:

    render initials fallback

This fallback is required for:

- Nix;
- Human;
- System;
- custom workers;
- Computer Operators;
- future employees.

Do not show broken image icons.

Do not attempt remote fallback downloads.

===============================================================================
17. STATIC FILE SERVING
===============================================================================

Important current implementation detail:

`src/http/server.ts` serves UI files through an explicit static allowlist.

It does NOT currently expose arbitrary nested files from `public/`.

Do not add a broad unsafe "serve anything under public/" route just to make portraits work.

Preferred approach:

- extend the existing static allowlist with the exact portrait files;

or:

- add a narrowly validated fixed portrait manifest/prefix with strong path validation.

Security requirements:

- no `..`;
- no arbitrary filesystem path;
- no URL-decoding bypass;
- no symlink traversal;
- no arbitrary extension;
- correct `image/webp` Content-Type;
- unknown portrait route → 404.

Do not append inappropriate UTF-8 charset metadata to WebP if the current static helper does
so for textual files.

Keep existing security headers.

===============================================================================
18. NO RUNTIME WEBSITE DEPENDENCY
===============================================================================

After deployment, opening BotSquad should not cause requests to:

    asymmetri.co
    github.com
    raw.githubusercontent.com

for employee portraits.

All portrait requests must resolve from the private BotSquad HQ.

Test this.

===============================================================================
19. CROSS-REPOSITORY SOURCE HANDLING
===============================================================================

Use Git to obtain the website source assets.

Do not scrape them from rendered HTML.

Do not download from production if the committed source asset is available.

Record the exact source commit used.

The website repository remains read-only for this task.

Do not commit temporary website clones/worktrees into BotSquad.

===============================================================================
20. ASSET PROVENANCE DOCUMENTATION
===============================================================================

Create a concise durable record such as:

    docs/product/WORKER_PORTRAITS.md

It should document:

- portraits are fictional AI-worker illustrations;
- source repository;
- source commit;
- exact source paths;
- BotSquad destination paths;
- canonical name mapping;
- Nix currently has no approved portrait;
- fallback semantics;
- portraits are UI presentation, not worker identity/authority;
- future replacement procedure.

Do not copy the entire website generation prompt unless useful.

Link to the website's:

    docs/BOTSQUAD_PORTRAITS.md

as provenance.

===============================================================================
21. DO NOT MODIFY WORKER MODEL
===============================================================================

Do not change:

- Worker IDs;
- worker names;
- titles;
- roles;
- manager relationships;
- capabilities;
- delegatable capabilities;
- Unix identities;
- Codex threads;
- model/reasoning profiles;
- execution priority;
- lifecycle.

This is presentation only.

===============================================================================
22. DO NOT CHANGE AUTHORITY
===============================================================================

No changes to:

- approvals;
- Tasks;
- delegation;
- research grants;
- Computer Use grants;
- business grants;
- repository access;
- external actions;
- schedules;
- devices;
- Client API v1 scopes.

Images grant nothing.

===============================================================================
23. DO NOT CHANGE CLIENT API V1
===============================================================================

Do not add portrait binary content or URLs to Client API v1 in this task.

This request is for the actual trusted BotSquad Web UI.

A future native/mobile client can define its own worker portrait contract if that becomes
necessary.

Do not expand API scope now.

===============================================================================
24. FRONTEND REGRESSION TESTS
===============================================================================

Add focused browser tests.

At minimum verify:

### Known portrait mapping

For:

    Atlas
    Maya
    Turing
    Linus
    Ada
    Grace
    Scout

the correct local image is used.

Do not merely assert that "an image" exists.

Verify worker → expected path.

### Nix fallback

If no approved Nix portrait exists:

    Nix renders initials fallback
    no broken image
    no other worker portrait

### Future/custom worker fallback

A synthetic noncanonical worker should render initials safely.

### Sidebar

Known worker portrait appears.

### Executive message

A worker-authored message has correct portrait.

### Direct conversation

Worker reply has correct portrait.

Human message does not use worker portrait.

### Working Group

Attributable worker contribution has correct portrait.

### Task card

Task assignee has correct portrait.

### Execution row

Execution worker has correct portrait.

### Organization

Worker node has correct portrait.

### Accessibility

Visible name remains present.

Portrait does not introduce redundant/misleading accessible identity.

### Narrow viewport

Run a representative:

    390 × 844

check.

Portraits must not break layout.

===============================================================================
25. STATIC-ASSET TESTS
===============================================================================

Verify every copied portrait route:

    200
    Content-Type: image/webp
    non-empty exact expected bytes

Verify unknown route:

    404

Verify traversal probes:

    404 / denied

Examples:

    /images/workers/../app.js
    encoded traversal variants
    unrelated image name

Do not weaken the static boundary.

===============================================================================
26. SOURCE ASSET INTEGRITY
===============================================================================

For each copied portrait:

compare source and destination.

At minimum:

    byte count
    cryptographic hash

Prefer:

    SHA-256

Record the manifest in validation evidence.

The BotSquad copy should be byte-identical to the selected website source.

===============================================================================
27. EXISTING STARTUP / ATTENTION REGRESSIONS
===============================================================================

Preserve Personal Operator Stabilizations 02 and 03.

Run relevant regressions for:

- booting/ready/degraded lifecycle;
- immediate tab navigation;
- reconnect;
- stale auxiliary reads;
- Attention count;
- Attention source navigation.

Portrait loads must not:

- block application readiness;
- turn image failure into HQ failure;
- create false Attention items;
- create mutation requests.

Images are optional presentation resources, not control-plane dependencies.

===============================================================================
28. IMAGE LOAD FAILURE
===============================================================================

If a known local portrait fails to load unexpectedly, the UI should degrade gracefully.

Do not leave a broken-image icon as the employee identity.

A simple fallback to initials is preferred.

Implement this without adding complicated client state.

Do not silently substitute a different person's portrait.

===============================================================================
29. PERFORMANCE
===============================================================================

The seven website assets are already small.

Do not introduce:

- image-processing dependencies;
- client-side base64 blobs;
- giant embedded data URIs;
- remote CDN dependency;
- lazy-loading machinery that makes 34px avatars flicker unnecessarily.

Use ordinary local image requests.

Avoid materially slowing initial UI load.

===============================================================================
30. CACHE BEHAVIOR
===============================================================================

Do not overcomplicate caching.

Portrait filenames are human-readable and may be replaced later.

Do not use a one-year immutable cache policy unless filenames become content-addressed/versioned.

Existing normal browser caching is sufficient for this task.

===============================================================================
31. PRODUCTION PRESERVATION
===============================================================================

No schema migration is expected.

Before deployment follow normal BotSquad production practice:

- inspect active work;
- preserve pause state;
- protected backup;
- verify retained data.

After deployment verify:

- original database state preserved;
- workers preserved;
- Tasks preserved;
- executions preserved;
- Prompt 11 receipt/history preserved;
- Attention state still correct;
- zero unexpected model/business/computer work.

Do not mutate production data to test portraits.

===============================================================================
32. REAL PRODUCTION UI ACCEPTANCE
===============================================================================

After exact merged deployment, use the private production UI through the normal SSH tunnel.

Verify real employees visually.

At minimum inspect:

1. left worker roster;
2. Executive channel;
3. Tasks;
4. Executions;
5. Organization;
6. Conversations;
7. Working Groups if retained history provides attributable worker messages.

Confirm known workers use the same portraits as the website source.

Confirm Nix uses fallback if still no approved portrait exists.

Confirm no external portrait network requests.

Run desktop and narrow viewport.

Capture non-sensitive screenshots as validation evidence if consistent with existing practice.

===============================================================================
33. SOURCE REPOSITORY MUST REMAIN UNCHANGED
===============================================================================

At completion verify:

    eugenelin89/asymmetri

was not changed by this task.

No website PR.

No deployment of asymmetri.co.

This task copies already-approved portrait assets into BotSquad only.

===============================================================================
34. SPECIALIST REVIEW
===============================================================================

Use:

    test_reviewer

for UI/static-asset coverage and regression completeness.

Use:

    security_reviewer

if static file routing is changed beyond explicit fixed entries, or if any generalized
asset-serving mechanism is introduced.

A straightforward exact-route allowlist may only need focused security inspection by the
parent plus test review, but route by actual changed risk.

No product-strategy reviewer is required unless scope expands.

No recovery reviewer is required unless persistence/recovery semantics change.

Parent Codex thread remains sole writer/integrator/deployer.

===============================================================================
35. EXECUTION PLAN
===============================================================================

Create:

    docs/exec-plans/personal-operator-stabilization-04.md

Record:

- BotSquad baseline;
- website source baseline;
- portrait source manifest;
- copied asset hashes;
- exact UI surfaces changed;
- mapping semantics;
- Nix decision/fallback;
- static-serving design;
- tests;
- reviewer findings;
- production acceptance;
- limitations.

===============================================================================
36. DOCUMENTATION
===============================================================================

Create:

    docs/validation/PERSONAL_OPERATOR_STABILIZATION_04.md

Update current-facing docs only as appropriate:

    docs/operations/CURRENT_STATE.md
    docs/PROJECT_MEMORY.md
    docs/product/ROADMAP.md

Record Stabilization 04 as completed only after acceptance passes.

Do not rewrite historical milestone evidence.

Do not create Decision 029 merely for employee pictures unless implementation introduces a
genuinely durable architecture rule not already captured elsewhere.

===============================================================================
37. GIT / DELIVERY
===============================================================================

Use a dedicated branch/worktree.

Suggested branch:

    codex/personal-operator-stabilization-04-worker-portraits

Before editing:

- fetch origin;
- inspect current main;
- inspect current branch/worktree;
- inspect open PRs/concurrent writers;
- preserve unrelated investment/Ask BotSquad work;
- inspect repository AGENTS instructions.

When complete:

1. inspect full diff;
2. `git diff --check`;
3. verify website source asset hashes;
4. run focused tests;
5. run affected browser/static/server regressions;
6. fetch latest BotSquad main;
7. reconcile legitimate concurrent work;
8. rerun final affected checks;
9. commit;
10. push;
11. open PR;
12. obtain relevant review;
13. fix material findings;
14. merge normally;
15. verify origin/main;
16. build exact merged revision;
17. protected production backup;
18. deploy exact merged revision;
19. verify source/build/health identity;
20. run real tunnel portrait acceptance;
21. verify idle behavior.

No force push.

Do not modify the website repository.

===============================================================================
38. COMPLETION STANDARD
===============================================================================

Personal Operator Stabilization 04 is complete when:

- the exact approved website portraits are copied locally into BotSquad;
- source provenance is recorded;
- Atlas uses Atlas's portrait;
- Maya uses Maya's portrait;
- Turing uses Turing's portrait;
- Linus uses Linus's portrait;
- Ada uses Ada's portrait;
- Grace uses Grace's portrait;
- Scout uses Scout's portrait;
- Nix/future workers safely use fallback unless an approved portrait exists;
- Task cards visibly identify the assignee with portrait/fallback;
- Executive worker messages have portraits;
- direct worker messages have portraits;
- Working Group worker contributions have portraits;
- execution rows identify workers visually;
- sidebar and organization hierarchy use portraits;
- visible text names remain;
- no portrait changes identity or authority;
- no schema change;
- no Client API v1 change;
- no external image dependency;
- static serving remains tightly bounded;
- image failure degrades to initials rather than broken UI;
- desktop and narrow UI pass;
- startup/reconnect/Attention regressions pass;
- production state is preserved;
- exact merged revision is deployed;
- website repository remains unchanged;
- no Prompt 12 is created.

===============================================================================
39. FINAL HANDOFF
===============================================================================

Report:

- PR number(s);
- merge SHA;
- local/origin/deployed identity;
- website source commit;
- portrait source/destination manifest;
- SHA-256 checks;
- worker → portrait mapping;
- Nix handling;
- UI surfaces updated;
- static-serving implementation;
- accessibility behavior;
- fallback behavior;
- tests and counts;
- specialist review;
- production screenshots/evidence;
- production preservation;
- idle verification;
- confirmation of zero external portrait requests;
- confirmation website repo was unchanged;
- remaining portrait gaps.

Do not start another feature.

Execute Personal Operator Stabilization 04.

---
Preserved owner-approved specification, October 7, 2026.
[Execution plan](../../docs/exec-plans/personal-operator-stabilization-04.md) · [Validation](../../docs/validation/PERSONAL_OPERATOR_STABILIZATION_04.md).
