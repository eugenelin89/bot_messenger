# Personal Operator stabilization 02 — startup and navigation

**Status:** Frontend/browser acceptance passed; exact merged deployment and production acceptance pending.

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
  24.04. Final two test-only assertions will be included in exact-merge verification.
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

Pending: normal PR merge, exact-revision build/Ubuntu verification, protected full backup,
deployment identity/preservation, repeated real private SSH-tunnel hard reload/navigation,
normal loaded navigation, reconnect and final idle verification. Do not infer deployment
from local or fixture acceptance.

## Limits and next candidates

No general offline mode, responsive redesign, full accessibility audit or live-agent
acceptance is claimed. The targeted fix preserves the lightweight architecture. Next:
owner attention/pending-action overview, broader status/error clarity, common workflow
simplification and maintenance UX, prioritized from real owner usage.
