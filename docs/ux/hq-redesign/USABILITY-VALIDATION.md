# Usability and regression validation

This is a structured heuristic evaluation plus browser/integration testing. No independent
nontechnical participants or screen-reader study were available. These checks do not certify
WCAG conformance. Production evidence is separate from authored fixtures.

## Evidence and provenance

Baseline `7341ff09dc2e58e6ab8aab66c80e590cde58b2c1`: 14 original shell destinations rendered
against disposable real HTTP/SQLite and fake runtime with no page errors, writes or model
calls. The live audit independently found eight employees, 30 completed Tasks, 12 saved
results, two actionable blocked items and all three Investment pages reachable. Those dated
aggregates are retained evidence, not a claim of newly generated results.

The implemented browser gate passes **83/83** on local installed Chrome with Node24.10.0.
Each fixture uses disposable state. The tutorial test invokes the actual objective endpoint,
dispatcher, task lifecycle and artifact storage with an explicitly **fake runtime** supplying
the documented three-point result. No external provider or market service is called. A
completed browser screenshot is not genuine employee or investment performance evidence.

## Scenario traceability

| Scenario | Actual verification | Result / evidence limit |
| --- | --- | --- |
| A: first visit | Home sections, six destinations, exact attention, no invented availability; parent waiting despite completed delegation response | Pass, 1440/390px; retained production checked separately |
| B: task creation | One-field New task → Start task; actual returned Task, exactly one objective POST; lost response and confirmed-create/refetch failure | Pass; no model/options/grant changes required; fixture response |
| C: employee | Task-to-profile identity, roles/mission/current/recent work; no implicit runtime read; open profile updates on completion | Pass; focus and open disclosure preserved |
| D: problem | Authored service interruption, actual failed Task/attention projection, exact reason and inspected retry; stale/disconnected UI gates | Pass; failure explicitly simulated, zero external requests |
| E: result | Completed original Task → recorded outcome → actual persisted artifact content; related task distinction | Pass; readback matches fixture report |
| F: advanced | Original Task IDs/attempts, work-session origins/usage, audit, explicit AI settings and all old destinations | Pass; provider catalog only after explicit AI settings |
| G: tutorial | Exact supplied-text exercise in maintained first-assignment guide; keyboard submit/open/close and saved report | Pass in disposable real backend with labelled fake runtime; no claim of new paid inference |
| H: investment | Authored read DTOs on real inert setup: committed decisions with exact approved/rejected/missing reviews (wrong revision/hash ignored); filled/pending/cancelled paper orders; complete history vs blocked latest valuation; held instrument; active schedule and future occurrence with zero running employee | Pass, 1440/390px; no financial journal/authority change or market/model call |

## Regression and accessibility checks

- The complete `test/*.browser.mjs` suite preserves direct conversation drafts/lineage,
  discussion start/pause/finish, mandates and Vancouver/DST schedules, exact approvals,
  device fingerprints/revocation, research grants, publication, finite/private/observed
  investment setup and recovery, usage, portraits and existing readiness controls.
- 17 shell destinations, direct fragments, browser Back/Forward and contextual
  profile/attention links. Late result reads cannot overwrite a newer inspector.
- Keyboard skip link, named native dialogs, no focus on background controls while modal,
  Escape/invoker return, visible CSS focus, stable task search selection and disclosures
  during SSE, including duplicate employee buttons inside dialogs.
- Rendered text contrast scan: **863 samples, zero failures**, across 16 sections and
  profile/help dialogs. Threshold 4.5:1 or 3:1 for qualifying large text; calculated from
  computed colors/backgrounds. Decorative icons are excluded. The fixture does not populate
  every legacy state and does not establish non-text/placeholder/focus-ring conformance.
- Home/Tasks reflow at 320,390,768,1440px, desktop/mobile workflows, and 200% text scaling
  at 768px. Existing complex tables scroll within panels. Reduced-motion CSS and preference
  are checked. Human screen-reader and broader cross-browser checks remain unperformed.
- No browser page errors in passing suites; navigation/profile assertions require no
  unintended writes, model calls or automatic catalog/eligibility probes.

## Reproduction

```sh
npm run build
TMPDIR=/private/tmp node --test --test-concurrency=1 dist/test/*.test.js
node --test --test-concurrency=1 test/*.browser.mjs
node --test test/ux01-docs.test.mjs
BOTSQUAD_UX_SCREENSHOTS=docs/ux/hq-redesign/screenshots node --test test/ux01-ui.browser.mjs
```

The explicit temporary path is for macOS: its default `/var/folders` spelling traverses
`/var` rather than canonical `/private/var`, which correctly fails owner-private custody
checks. The 20 unchanged telemetry tests pass with canonical `/private/tmp`; the production
custody check is not weakened. Full integration and production results belong in the
[release report](RELEASE-REPORT.md).

[Capture manifest](screenshots/manifest.json) records source asset hashes, dimensions,
locale, time zone and synthetic provenance. Captures are actual UI, visually inspected;
mobile dialogs show only their viewport and scroll normally. No production-private text,
credentials or real investment data is used in tutorial screenshots.
