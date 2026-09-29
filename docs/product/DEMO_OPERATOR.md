# BotSquad Demo Operator and Guided Tutorials

**Status:** Implemented; Demo 01 passed on the existing Ubuntu development HQ
**Updated:** 2026-09-29

BotSquad's Demo Operator is a clearly labeled automated tutorial operator. It uses the
human-facing web UI, verifies real state, and records the same browser session. It does
not impersonate a named human or fabricate a more successful organization.

The implementation was the unnumbered dogfood interlude after Prompt 05 and before
Prompt 06. **Prompt 06 is now complete; Prompt 07 is next.** Demo Operator remains a
separate bounded browser test client, not general Computer Use, the Client API itself,
or multi-instance provisioning.

## Implemented boundary

The [StudyPlan scenario](../tutorials/demo-01-studyplan/scenario.md) runs against the
existing operator-controlled development HQ. Each attempt creates a fresh Project and
local managed repository. Retained Projects, validation databases, worker identities,
Codex threads, receipts and historical evidence remain intact. Failed attempts are
retained and are not used as successful tutorial footage.

Earlier design discussions preferred a disposable separate HQ. Demo 01 intentionally
uses the explicitly authorized development installation instead, with a protected backup
and before/after preservation checks. Separate production/demo stacks remain future
operations work; changing a port alone does not create infrastructure isolation. See
[Multiple Instances](../operations/MULTIPLE_INSTANCES.md).

## Implementation

- [Scenario](../../scripts/demo-operator/scenario.ts): domain actions, understandable
  objective, policy and explicit bounded recipes. No fixed worker assignment.
- [Driver](../../scripts/demo-operator/driver.ts): isolated Playwright/Chrome browser
  context, UI clicks/forms, same-origin requests and native WebM recording.
- [Assertions](../../scripts/demo-operator/assertions.ts): read-only state inspection,
  exact Project/repository/task association, non-overlapping allocations, immutable
  submissions, exact independent review and completed full-tested integration.
- [Recorder](../../scripts/demo-operator/recorder.ts): separate operator/system events,
  bounded artifact paths, credential-pattern redaction, screenshots and transcript.
- [Offline finalizer](../../scripts/demo-operator/finalize.ts): derives narration and readable
  evidence only from a passing run; failed runs cannot become tutorials.
- [Entrypoint](../../scripts/demo-operator/run.ts): sequential fail-stop execution and
  recording finalization, preserving failed-run evidence.

Playwright is a pinned development dependency, not a worker capability or service
runtime adapter. The driver uses installed Chrome in an ephemeral profile and the
small Playwright recording helper; no desktop stack or browser is installed on the HQ.
See the upstream [video documentation](https://playwright.dev/docs/videos) and
[Chrome support](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge).

## Authority and approvals

Consequential actions use visible UI controls: create/configure a Project, create its
repository, initialize Nix if needed, request required worker identities, assign the
objective, resume/pause, inspect and decide exact approvals, and inspect final evidence.
Read-only HTTP checks verify the UI's results. The driver has no database connection,
shell, private control-plane mutation or direct Git-writing path.

Only declared identity creation and clone preparation may be approved. The operator
checks exact operation/approval IDs, target worker, Nix requester and execution, scoped
infrastructure task and, for clones, repository/allocation/base/manifest. Newly hired
workers may need identities before assignment; their hiring must be attributable to an
execution in this Project's task tree. Reused workers must actually be assigned to the
current Project. Publication, retirement, revocation or unrelated approvals stop the run.
The trusted server still enforces immutable envelopes, preconditions and one-time use.

Administrative backup/deployment/checks are separate from the Demo Operator. The owner
explicitly authorized the existing root SSH alias for those operations only. No demo
worker or browser action gains root, credentials or direct provisioner access.

## Truthful acceptance

An attempt passes only after its own fresh UI-created Project completes real Codex
execution, exact review, trusted integration and authenticated full validation, with
screenshots, events, transcript and finalized video. A failed assertion stops later
scenario actions and attempts to pause new dispatch through the UI. Active turns may
finish; pausing does not undo their actions.

Grace may approve the first submission or request a legitimate revision. Neither the
scenario nor driver forces a review disposition. The tutorial must state what happened.
Canonical advancement is checked against trusted completed integration; raw TAP-looking
stdout never establishes success. The Prompt 05 service-owned completion reporter and
authenticated invocation receipt remain unchanged.

## Running and artifacts

The command is `npm run demo:tutorial -- NEW_ARTIFACT_DIRECTORY EXPECTED_DEPLOYED_SHA
[PROJECT_NAME] [SCENARIO_JSON]`. It refuses an existing artifact directory, another web
origin, an unpaused/busy HQ, unrelated unfinished work or pending approvals. It does
not create the tunnel, purchase a host, reset the HQ or install server software.

The artifact directory contains `events.json`, `transcript.md`, scenario/baseline/result
records, milestone screenshots, `demo-raw.webm`, video metadata and pass/fail status.
Narration and concise tutorial documentation are authored from the accepted run's
actual evidence. Large video stays outside Git with exact path, size, hash and duration.

See the [Demo 01 tutorial](../tutorials/demo-01-studyplan/README.md) for acceptance status,
reproduction instructions, findings and artifact locations. Browser regressions run
explicitly with `node --test test/demo-ui.browser.mjs` after building and require local
Chrome; the ordinary deterministic suite does not launch a browser.

## Remaining scope

A structured recipe editor, Project-history filtering and a clearer result overview
would improve onboarding. Full isolated HQ provisioning, arbitrary site/desktop control,
credential automation, remote pairing and native/mobile drivers remain separate work.
No new durable architectural decision is introduced beyond Decisions 006, 013 and 014.
