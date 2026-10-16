# UX-01 release report

Status: complete. Final HQ UI and synchronized public guide are deployed; production and documentation acceptance passed with the test limitations below.

## Source and release boundary

- Baseline source: `7341ff09dc2e58e6ab8aab66c80e590cde58b2c1`.
- Reviewed UI implementation: `5fb197d7a4496bc874ceed545dc0ee7196895e7d`.
- [PR110](https://github.com/eugenelin89/bot_messenger/pull/110) contains the redesign,
  current tutorials, captures and browser acceptance. [PR111](https://github.com/eugenelin89/bot_messenger/pull/111) adds bounded Home previews
  and the first production receipt. Final deployed static source is
  `8078a3434f455c73017c04178e8f9f6ba51defe3` (visual patch implementation
  `4ea4a71e3ec1ddb0c40a606ae3263844d0e84c4f`).
- Running Ubuntu backend: `dccf20909706dcc8e0731906d29c596a2ad48cbf`, PID 905617;
  service active since 2026-10-16 05:24:42 UTC. Preflight at 07:33 UTC confirms healthy
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
  confirmation link closes its dialog and is covered by the 83-test run.
- Complete backend run collected 2,358 tests: 2,330 passed, 20 failed, 8 skipped. Eighteen
  initial failures came from the absent pinned adapter; the configured 33-test observed
  suite now passes 33/33. One native-watchdog recovery failure passes in an isolated 86/86
  rerun. Eight tests explicitly require separate pinned receiver/Linux fixtures. The
  [regression receipt](evidence/backend-regression.json) records each run separately;
  this is not represented as one fully passing suite.
- One unchanged test, `publication-blocked second-cycle BUY does not erase an admitted
  risk-reducing SELL`, also fails on an untouched archive of baseline 7341ff0. It rejects
  the second BUY with `Publication health blocks new paper risk` before the test reaches
  its intended revocation assertion. Source review points to a calendar-dependent fixture:
  Friday-to-Monday exceeds its one-day undelivered-publication limit. No production policy
  or test assertion is weakened. This baseline failure prevents claiming a fully green
  backend suite; it does not indicate a changed UI/backend boundary.
- macOS tests require canonical `TMPDIR=/private/tmp` for custody checks. Twenty unchanged
  telemetry tests pass with that prerequisite; the custody enforcement stays intact.

## Initial production acceptance — October 16

PR110 merged as `4c0ec5db81b428b0880b467247e1a33b4c5c45ba` and was deployed without
restart. [The protected-release receipt](evidence/production-release-initial.json) records
all eight served asset hashes. SQLite online backup integrity is `ok`; all 188 table counts
and content hashes are identical before/after. Database/deployment credential permissions,
PID 905617 and backend dccf209 remain unchanged. No pause, worker grant or financial record
was changed. Protected rollback data is at `/var/backups/botsquad/ux01-20261016T073738Z`.

The first asset readback failed because the backup's restrictive umask propagated to Git
and gave new public files mode 0600. Tracked file modes were restored to 0644 (and directories 0755)
before acceptance. This briefly interrupted static-page loading; the backend service and
DB continued running. Future static updates must restore the normal checkout umask before
Git writes. All final asset HTTP reads returned 200 and matched accepted SHA256 values.

[Production browser evidence](evidence/production-browser-initial.json): at 1440/390px,
all 17 shell destinations, all three Investment routes, New task field/Start task readiness,
Help, employee details, and a genuine retained completed Task and saved artifact passed.
There were zero writes, runtime catalog probes or browser errors. The retained company
has eight employees, 48 Tasks (30 completed) and 12 artifacts. Production captures remain
private, outside published documentation. An alternate 14310 tunnel was correctly denied
by the Host guard; acceptance used the verified existing 4310 tunnel.

The supplied-text tutorial's exact submission/lifecycle was tested in disposable real
HTTP/SQLite with a fake runtime. On the released application its controls and text were
checked without submitting; retained genuine outcomes were inspected separately. No new
paid inference or production demonstration is claimed. Final visual inspection identified
long historic objectives making Home cards tall; the final patch bounds only Home previews,
with full text retained in Task details and a dedicated long-record regression.

## Final HQ release — 07:49 UTC October 16

[PR111](https://github.com/eugenelin89/bot_messenger/pull/111) merged as
`8078a3434f455c73017c04178e8f9f6ba51defe3`. The final static deployment succeeded
with the corrected checkout umask. A new protected online backup at
`/var/backups/botsquad/ux01-20261016T074906Z` passes integrity; all 188 tables again
match exactly, permissions are preserved, and PID 905617/backend dccf209 are unchanged.
[Final served-asset receipt](evidence/production-release-final.json) verifies all eight
assets against the regenerated 83-test capture manifest.

[Final production browser receipt](evidence/production-browser-final.json) repeats
both 1440/390px walkthroughs on the final files, including actual long Home previews,
complete retained outcomes and loaded Investment summaries. The read-only retained
Investment record contains one portfolio, three formal decisions, zero paper orders and
two valuations. This reports existing evidence; it does not claim a new investment run.
There are zero browser errors, writes or runtime discovery probes. The task-owned 14310
SSH tunnel was closed; the owner's pre-existing 4310 tunnel was preserved.
A [post-walkthrough comparison](evidence/production-after-walkthrough.json) again confirms
all 188 table counts/content hashes and the same healthy process; browser inspection did
not change retained state.

## Website guide

The existing Asymmetri owner has updated the stable
[HQ guide](https://asymmetri.co/botsquad/trade/hq-guide) with six-section navigation,
the same supplied-text exercise and five final actual sample captures. Seven historical
October 15 images/anchors remain explicitly historical. Its separate inventory and
traceability are `docs/BOTSQUAD_HQ_UX01_2026-10-16.md` in the website repository.
The website activated at 07:58:47 UTC October 16 from source
`e9b5ab1a4c8397d6ac0d484e69d489298a614d06` (implementation
`b6e50af506a221163b53a46d18e2a5800294aaa5`). Build `rrTJaSzqUzeWpt2fGqrCH`, artifact
SHA256 `0acd7e4d9edfed2d0d4910320fdf3e6726946395931e17352531e474839e68b0`, with 274
verified source hashes. The owner followed its existing main/two-commit journal workflow;
its final documentation receipt is commit `52bab1b477ac9a55f50bd271ab72c913262ac3e6`.

[Website release evidence](evidence/website-release.json): Node 22.23.1 build/type/lint,
22 regressions and 12 candidate routes passed. Live checks cover six widths, 20 sections,
12 figures and preserved anchors. All 15 captured receiver tables, configuration hashes,
Ask's closed/empty state and unrelated services are unchanged. Only the website service
restarted. Four existing unrelated IPv6 TLS failures/fallback fingerprints match baseline;
they were not represented as new release regressions. The existing lint warning is retained.

[Independent parent readback](evidence/website-readback.json) confirms the live title,
current instructions/provenance, desktop/phone reflow, zero browser errors and exact hashes
for all five final public PNGs. All ten HQ tutorial PNGs were regenerated and checked;
public copies use only labelled isolated sample data. No remaining UX-01 implementation
or documentation blocker was found. This final completion-record commit is documentation
only; deployed UI source remains 8078a3434f455c73017c04178e8f9f6ba51defe3.

## Limitations

The evaluation is a structured heuristic review, not a participant study or WCAG
certification. Screen-reader and broad cross-browser testing remain unperformed. No fresh
paid employee or investment run is claimed. Ask remains owner-paused. No eligibility probe,
grant expansion, financial authority change or historical evidence rewrite is included.
