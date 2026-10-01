# Prompt 08 validation report

**Status: in progress — not accepted, merged or deployed.**

Owned branch: `feature/prompt-08-working-groups`. Baseline production/current main:
`9f57f7fd67d52b13dd0feb50863994059a342aac`. Initial candidate `ece0850`; real fixture
candidate `4e2a7eb`. Detailed gates and continuing evidence are in the
[execution plan](../exec-plans/prompt-08.md).

## Current evidence

- Local full candidate suite: 201 total, 200 passed, zero failed, one Linux-only skip.
  Later focused suite: 17 discussion tests passed. Final integrated full run still due.
- Actual Chrome: four group/direct-conversation tests passed. Screenshots visually checked.
- Independent read-only security/recovery review produced material findings and reproductions;
  fixes and affected retests are recorded in the plan. Final sign-off remains due.
- Protected offline production copy migrated schema 9→10 twice. All 58 original tables,
  1,760 original rows, original rowids and every original field preserved. Integrity and
  foreign keys clean. No Company/runtime/server opened the offline copy.
- Isolated Ubuntu service `/opt/botsquad-discussions-validation`, data
  `/var/lib/botsquad/validation/discussions-20261001-p08`, loopback 4311, inherited service
  confinement and existing configured account. This is data isolation, not a separate
  Unix/credential security boundary. Trusted roster setup is not model evidence.

## Retained failed attempts

- Initial full local sandbox run: 192 total, 146 passed, 45 failed, one skipped. Loopback
  permission and nested macOS sandbox execution failures were retained, then rerun with
  the required local capabilities; assertions and confinement were not weakened.
- First browser group test timed out because the app referenced `worker` before its
  initialization. Corrected and both group browser checks rerun successfully.
- First Ubuntu fixture setup correctly rejected Scout hiring from a product Task.
  Corrected by using the normal separately scoped research setup Task; the failed fixture
  is retained at `discussions-20261001-p08-setup-failed-0943`, never served as production.
- First real-browser harness start used the Playwright response method on native Fetch.
  It failed before creating any group; fixed and retained the log.

## Required real gates

C08-1 supplied-material deliberation, Atlas-selected public research, browser interjection,
substantive response, source inspection and final synthesis remain under execution.
C08-2 actual provider replacement, safe restart, injected in-flight uncertainty, no duplicate
work and retained obligations remain under execution. Assignment, actual idle interval,
Linux/real workflow regressions, final review and normal delivery remain required.
No prior milestone's test count or mock execution is substituted for these gates.
