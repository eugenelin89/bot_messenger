# UX-01 release report

Status: initial static release and production readback passed; final Home preview refinement and website activation are being completed.

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
- Complete serial browser regression: **83/83 passed**, including A–H scenarios,
  authority-preservation checks and exact beginner exercise. [Passing test names](evidence/browser-release.txt).
- Documentation check: **2/2 passed**. Ten actual UI PNGs regenerated with safe synthetic
  data; all asset/image hashes recorded in the [manifest](screenshots/manifest.json).
- Rendered text contrast: **863 samples, zero failures**. Keyboard, modal focus, responsive
  widths and 200% text checks passed within the [documented scope](USABILITY-VALIDATION.md).
- Three read-only specialists reviewed design and final implementation. All material
  findings resolved: completion semantics, exact review matching, stale profiles/async
  inspector responses, contextual Back, task-create uncertainty, dialog focus, count labels,
  mobile connection status, contrast and screenshot captions. The final same-page
  confirmation link closes its dialog and is covered by the83-test run.
- Complete backend run collected2,358 tests:2,330 passed,20 failed,8 skipped. Eighteen
  initial failures came from the absent pinned adapter; the configured33-test observed
  suite now passes33/33. One native-watchdog timing failure passes in an isolated86/86
  rerun. Eight tests explicitly require separate pinned receiver/Linux fixtures. The
  [regression receipt](evidence/backend-regression.json) records each run separately;
  this is not represented as one fully passing suite.
- One unchanged test, `publication-blocked second-cycle BUY does not erase an admitted
  risk-reducing SELL`, also fails on an untouched archive of baseline7341ff0. It rejects
  the second BUY with `Publication health blocks new paper risk` before the test reaches
  its intended revocation assertion. Review identified a calendar-dependent fixture:
  Friday-to-Monday exceeds its one-day undelivered-publication limit. No production policy
  or test assertion is weakened. This baseline failure prevents claiming a fully green
  backend suite; it does not indicate a changed UI/backend boundary.
- macOS tests require canonical `TMPDIR=/private/tmp` for custody checks. Twenty unchanged
  telemetry tests pass with that prerequisite; the custody enforcement stays intact.

## Initial production acceptance — October16

PR110 merged as `4c0ec5db81b428b0880b467247e1a33b4c5c45ba` and was deployed without
restart. [The protected-release receipt](evidence/production-release-initial.json) records
all eight served asset hashes. SQLite online backup integrity is `ok`; all188 table counts
and content hashes are identical before/after. Database/deployment credential permissions,
PID905617 and backenddccf209 remain unchanged. No pause, worker grant or financial record
was changed. Protected rollback data is at`/var/backups/botsquad/ux01-20261016T073738Z`.

The first asset readback failed because the backup's restrictive umask propagated to Git
and produced600 public files. Tracked file modes were restored to644 (and directories755)
before acceptance. This briefly interrupted static-page loading; the backend service and
DB continued running. Future static updates must restore the normal checkout umask before
Git writes. All final asset HTTP reads returned200 and matched accepted SHA256 values.

[Production browser evidence](evidence/production-browser-initial.json): at1440/390px,
all17 shell destinations, all three Investment routes, New task field/Start task readiness,
Help, employee details, and a genuine retained completed Task and saved artifact passed.
There were zero writes, runtime catalog probes or browser errors. The retained company
has eight employees,48 Tasks (30 completed) and12 artifacts. Production captures remain
private, outside published documentation. An alternate14310 tunnel was correctly denied
by the Host guard; acceptance used the verified existing4310 tunnel.

The supplied-text tutorial's exact submission/lifecycle was tested in disposable real
HTTP/SQLite with a fake runtime. On the released application its controls and text were
checked without submitting; retained genuine outcomes were inspected separately. No new
paid inference or production demonstration is claimed. Final visual inspection identified
long historic objectives making Home cards tall; the final patch bounds only Home previews,
with full text retained in Task details and a dedicated long-record regression.

Final visual-patch source and website activation receipts will be appended after release.

## Limitations

The evaluation is a structured heuristic review, not a participant study or WCAG
certification. Screen-reader and broad cross-browser testing remain unperformed. No fresh
paid employee or investment run is claimed. Ask remains owner-paused. No eligibility probe,
grant expansion, financial authority change or historical evidence rewrite is included.
