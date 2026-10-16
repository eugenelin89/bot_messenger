# UX-01 release report

Status: implementation accepted for static release; production and website receipts pending.

## Source and release boundary

- Baseline source: `7341ff09dc2e58e6ab8aab66c80e590cde58b2c1`.
- Reviewed UI implementation: `5fb197d7a4496bc874ceed545dc0ee7196895e7d`.
- [PR110](https://github.com/eugenelin89/bot_messenger/pull/110) contains the redesign,
  current tutorials, captures and browser acceptance. Final merge/deployment identity will
  be appended after acceptance.
- Running Ubuntu backend: `dccf20909706dcc8e0731906d29c596a2ad48cbf`, PID905617;
  service active since2026-10-16 05:24:42UTC. Preflight at07:33UTC confirms healthy
  database/dispatcher/runtime and a clean source checkout at the baseline.
- No `src/`, contract, dependency or runtime-configuration change from either baseline or
  running backend. The release updates public assets, documentation, browser tests and the
  development demo navigation driver. The live server reads public assets on each request.
  The documented static-release exception avoids restarting or pausing investment work.

## Validation and independent review

- TypeScript build, public JavaScript syntax and whitespace checks passed.
- Complete serial browser regression: **82/82 passed**, including A–H scenarios,
  authority-preservation checks and exact beginner exercise. [Passing test names](evidence/browser-release.txt).
- Documentation check: **2/2 passed**. Ten actual UI PNGs regenerated with safe synthetic
  data; all asset/image hashes recorded in the [manifest](screenshots/manifest.json).
- Rendered text contrast: **863 samples, zero failures**. Keyboard, modal focus, responsive
  widths and 200% text checks passed within the [documented scope](USABILITY-VALIDATION.md).
- Three read-only specialists reviewed design and final implementation. All material
  findings resolved: completion semantics, exact review matching, stale profiles/async
  inspector responses, contextual Back, task-create uncertainty, dialog focus, count labels,
  mobile connection status, contrast and screenshot captions. The final same-page
  confirmation link closes its dialog and is covered by the82-test run.
- Broader backend regression remains in progress. The isolated checkout initially lacked
  the required ignored Python adapter environment; restored Python3.12.12/yfinance1.7.0
  now passes normalization and the full authored observed workflow. The affected test files
  are rerunning; these initial environment failures are not product regressions.
- One unchanged test, `publication-blocked second-cycle BUY does not erase an admitted
  risk-reducing SELL`, also fails on an untouched archive of baseline7341ff0. It rejects
  the second BUY with `Publication health blocks new paper risk` before the test reaches
  its intended revocation assertion. Review identified a calendar-dependent fixture:
  Friday-to-Monday exceeds its one-day undelivered-publication limit. No production policy
  or test assertion is weakened. This baseline failure prevents claiming a fully green
  backend suite; it does not indicate a changed UI/backend boundary.
- macOS tests require canonical `TMPDIR=/private/tmp` for custody checks. Twenty unchanged
  telemetry tests pass with that prerequisite; the custody enforcement stays intact.

## Deployment acceptance still required

Exact merged SHA, protected online SQLite/public-asset/receipt backup, integrity result,
before/after table hashes/counts and file modes, served asset hashes, unchanged service
PID/backend identity, released desktop/mobile read-only walkthrough and website guide
activation receipt will be recorded here. No production task or API spend is created by
the walkthrough. The exact task lifecycle is exercised in a disposable backend with fake
runtime; genuine retained production Tasks/results are inspected separately.

## Limitations

The evaluation is a structured heuristic review, not a participant study or WCAG
certification. Screen-reader and broad cross-browser testing remain unperformed. No fresh
paid employee or investment run is claimed. Ask remains owner-paused. No eligibility probe,
grant expansion, financial authority change or historical evidence rewrite is included.
