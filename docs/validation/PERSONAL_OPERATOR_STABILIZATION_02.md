# Personal Operator stabilization 02 — startup and navigation

**Status:** Complete — exact merged code deployed; startup/navigation, native reconnect and retained-state acceptance passed.

This is unnumbered Daily Driver work under Decision 026. No Prompt 12, backend semantic
change, schema migration, dependency, worker authority or new product capability.

## Original defect and corrected lifecycle

Baseline `1e5581a236e62bb9c712dc5753c984d61548437d` installed navigation before awaiting
session/state. A click called `render()` with undefined `state`; its first `state.workers`
read threw. [The held-state baseline](evidence/personal02/baseline.txt) reproduces this
exact exception at both **1440×1100** and **390×844**. No timing sleep is involved.

`public/app.js` now explicitly distinguishes booting, ready and degraded. The HTML shell
starts with truthful loading text, unknown counts and disabled mutation controls.
Top-level navigation remains available; selected styling, accessible current-page state
and headings update immediately. One guard prevents all state-dependent rendering before
a snapshot exists. Loading, actual empty data and request failure have distinct UI.

Session/state failures show an alert and Retry loading. EventSource exists independently
of initial success; ready renews session then refreshes state. A previously loaded snapshot,
selected tab and drafts survive interruption. Connected is reported only with a loaded
snapshot and live stream. No blanket renderer catch hides programming errors.

Refresh retains a single serialized owner and one coalesced follow-up pass. A connection
generation plus AbortController cancels obsolete session/state/auxiliary reads on ready/error;
an indefinitely held old request cannot block recovery or install stale state. Rendering
always uses current navigation intent. Conversations guards filter/selection identity;
Working Groups retains its existing safe roster loader; mandates and Computer Sessions
check selection generations. First auxiliary loads and failures are visible, including
Computer Sessions on navigation. Worker model-discovery results cannot reopen a closed
inspector or replace a newer one.

All JSON writes use one readiness prerequisite. Static pause/initialize controls and
inherited disabled fieldsets gate unavailable state without overwriting each control's
intrinsic disabled state. The inspector and drafts survive a failed in-flight request and
recover without a permanently disabled submit button. No initialization mutation is automatic.

## Validation and review

- [Final focused browser suite](evidence/personal02/startup-final.txt): **21/21 pass**.
  All 13 tabs are clicked with initial state blocked at both widths; final Company Mandates
  intent survives release. Session/state failure each recover via SSE ready and explicit
  retry, including narrow failure visibility. Normal startup uses real SSE. Reconnect,
  aborted stale reads, refresh coalescing, auxiliary loading/error, conversation filters,
  inspector ownership and mutation readiness are covered.
- [Affected/representative browser run](evidence/personal02/browser-final.txt): **32/32 pass**,
  including the overlapping 21 startup cases and 11 existing Devices, Conversations,
  Working Groups, Mandates, research and inspector/approval regressions. The final focused
  rerun adds narrow failure and forced stale-form assertions; application source is unchanged.
- [HTTP checks](evidence/personal02/http.txt): **6/6 pass**; TypeScript `npm run check` passes.
- [Ubuntu browser run](evidence/personal02/ubuntu-reviewed.txt): **21/21 pass**, installed
  Node **24.21.0** and Chromium, non-root `botsquad`, isolated fixture servers/data on Ubuntu
  24.04. [Exact-merge rerun](evidence/personal02/ubuntu-exact-merge.txt): **27/27 pass**
  (21 latest startup + 6 HTTP), including both final test additions. Chrome for Testing
  **153.0.8010.12**, exact merge `ee4f0992603b21c902f06e348db0bc88a479c802`.
- Desktop/narrow loading and narrow error screenshots were visually checked; no navigation,
  loading text or recovery control is hidden. Screenshots contain synthetic fixture UI only.
- New navigation scenarios produce zero model calls, executions, ComputerSessions and
  business actions, and zero mutation requests. One explicitly intercepted profile-write
  failure case creates a synthetic POST that is aborted before reaching the fixture HQ;
  its forced stale-form submit creates no second POST. Existing suites use their existing
  isolated fixtures/fake adapters; they do not prove live model or business outcomes.

The read-only test reviewer identified transient disabled-state restoration and a stalled
pre-disconnect read blocking recovery. Fieldsets and abortable reads resolve both, with
regressions; [follow-up review](evidence/personal02/test-review.txt) found no pre-merge blocker. Other specialists were not needed for this frontend-only correction.

Failure history is retained: the original red regression; sandbox loopback denial;
local disk exhaustion before fixture setup; an aria-busy boolean defect (fixed); replacement
of existing Working Groups loading (corrected by preserving its renderer); and a test-route
cleanup error after intentional cancellation (corrected by awaiting request failure and not
continuing a cancelled route). Assertions were not weakened or delayed to conceal the race.
The final changed-source/test hashes are in [source manifest](evidence/personal02/source-manifest.json).

## Production gates

Read-only preflight: baseline revision healthy, pause=false, eight idle workers, 48 Tasks,
69 executions, two closed cycles, one completed occurrence, one retained action/approval/
attempt/receipt, zero ComputerSessions, no runnable work or active provider. Prompt 11
history, revoked grant and retired credential remain intact. Protected preflight is outside Git.

[PR #19](https://github.com/eugenelin89/bot_messenger/pull/19) merged normally as
`ee4f0992603b21c902f06e348db0bc88a479c802`. No configured status/workflow check was bypassed.
The [production checkpoint](evidence/personal02/production-checkpoint.json) confirms all
**251 compiled/public files** equal a separate exact-revision build. HQ, broker and provisioner
were stopped for a protected full backup retaining ownership/ACLs and account mappings.
No bootstrap, credential change, migration or demonstration was used for deployment.

Preservation passed for **59,909 original rows in 82 databases**, **212 worker-home ownership/mode/ACL records**,
**702 root records**, and **427 account/group mappings**, excluding only ordinary
`workers.updated_at`. This includes Prompt 11's failed model turn/backoff, both schedule
versions, completed occurrence, evidence, approved action/attempt/receipt and final STOP.
Pause=false, eight idle workers, 48 Tasks, 69 executions, one receipt and zero ComputerSessions
remain. The provider stays unconfigured, the retained business grant revoked and temporary
credential absent. Runtime/database/dispatcher are healthy on loopback. A **30-second idle**
interval added no work and preserved all counts after restart.

[Real production browser acceptance](evidence/personal02/production-ui.json) passed through
a task-owned SSH tunnel at **1440×1100** and **390×844**: **eight uncached hard reloads**,
immediate rapid navigation on six and controlled held-state navigation on two, all **13 tabs**
before release and after loaded state, with **zero page errors and zero mutation requests**.
Company Mandates remained selected after startup. A real tunnel termination/recreation
proved native EventSource reconnect, retained content/tab, disabled stale controls and recovery.
Only non-sensitive boolean/count/identity evidence was captured; no production screenshots
or private record content was exported. The task-owned tunnel was stopped afterward.
An additional [30-second post-UI idle check](evidence/personal02/production-ui-idle.json)
confirmed every table count and pause state stayed unchanged, with all active-work checks zero.

This is the executed code-deployment checkpoint. The documentation completion merge `ad0d105120e113367902b1e11b9cb1a72122bc5e` kept
the same application/test/dependency trees and passed exact build/preservation/idle checks.
The final application differs by the bounded status-order follow-up below; final
local/origin/deployed equality is verified in the handoff and protected delivery receipt.

## Final reconnect-status ordering follow-up

The [final documentation-revision browser rerun](evidence/personal02/production-final-reconnect-timeout.txt)
ended in an assertion timeout waiting for the exact reconnect label; that incomplete run is
not counted as a pass. A [deterministic regression](evidence/personal02/reconnect-status-baseline.txt)
confirmed that a failed state request immediately before EventSource error left “Could not
refresh headquarters” masking the active reconnect status. Cached state and write gates
remained safe. One precedence condition now reports Reconnecting while the stream is
reconnecting, retaining the request-error alert until successful recovery.

[Follow-up affected browser run](evidence/personal02/browser-status-final.txt): **33/33 pass**,
including **22 startup cases** and 11 existing cases. The new case explicitly orders failed
state → stream error → ready and verifies cached content, tab, disabled writes and recovery.
The read-only test reviewer found no blocker in this correction. The original timeout is
retained. Exact follow-up merge/build, Ubuntu, production tunnel and idle results accompany
the final delivery receipt; they must not be inferred from the earlier code checkpoint.
No backend, dependency or authority change was added.

## Boot-test scheduling follow-up

The first exact PR #21 Ubuntu run passed 27/28; the boot mutation case timed out after
simultaneously releasing an intercepted state read and emitting ready. The
[failed run](evidence/personal02/ubuntu-boot-timeout.txt) and
[buffered diagnostic](evidence/personal02/ubuntu-boot-diagnostic.txt) are retained.
The diagnostic reproduced one failure in ten: the browser issued a renewed session GET,
but neither that request nor the released state request reached the fixture server before
timeout. No page error or unintended write occurred. Exact transport attribution remains
unresolved; this is not proof of a general browser defect or a harmless production failure.

The boot mutation test now completes initial loading before separately emitting ready.
Both blocked-session and blocked-state forced-control assertions remain unchanged.
The dedicated reconnect case still requires aborting the held old read and recovering
before releasing it. This is test scheduling stabilization, with no added sleeps, extended
timeouts or application change. Read-only specialist review accepted that separation.
Final exact Ubuntu real-SSE startup and production reconnect on an un-routed browser
context are required in the delivery receipt, alongside the normal repeated navigation.
The [affected browser rerun](evidence/personal02/browser-test-order-final.txt) passes **33/33**
(22 startup plus 11 existing cases); application code remains exactly PR #21.

## Limits and next candidates

No general offline mode, responsive redesign, full accessibility audit or live-agent
acceptance is claimed. The targeted fix preserves the lightweight architecture. Next:
owner attention/pending-action overview, broader status/error clarity, common workflow
simplification and maintenance UX, prioritized from real owner usage.
