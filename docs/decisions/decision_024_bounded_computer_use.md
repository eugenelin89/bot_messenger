# Decision 024 — Bounded browser-first Computer Use

**Status:** Proposed implementation; final C10-1/review/release gates pending
**Date:** 2026-10-05

Decision 023 was the latest record when this number was allocated. Prompt 10 needs real
rendered browser interaction from a small headless Ubuntu HQ, without a desktop environment,
workstation control, unrestricted native browser tools or Prompt 11 business authority.

Use BotSquad-managed headless Chromium with pinned Playwright core. A separate non-root
broker and nested bubblewrap environment own browser lifetime, ephemeral profile, minimal
mounts and no direct network. Preserve Chromium's own sandbox and the existing HQ service
confinement. A full desktop, X server and VNC are unnecessary for rendered DOM interaction
and real screenshot evidence. The installed Codex dynamic-tool schema supports this narrow
adapter without relaxing its disabled native tools.

ComputerSession is a durable resource of an ordinary bounded Task, with immutable owner
policy/grant and separate model generations. A specialized owner-created Computer Operator
has only computer, internal-message and report capabilities. No migration creates authority.
One session reservation per HQ covers prelaunch, active/waiting and unconfirmed cleanup.
Existing worker/manager ceilings remain unchanged.

Network is deny by default: exact origins, pinned public DNS/address checks, method/redirect/
subresource gates, bounded requests/responses, no inherited cookies/auth, explicit isolated
fixture exception only. Uploads/downloads are disabled and host/private files are not mounted.
GET effects cannot be inferred; authorization is limited to vetted read-only sites. General
accounts, secrets, financial actions, messaging and business integrations remain Prompt 11
or separately reviewed later work.

A harmless controlled fixture POST demonstrates protected approval. Capture exact request
and page/policy identity before transmission; release the model slot while waiting. On owner
approval, freeze and revalidate the page, consume once in trusted code, forward the captured
request, and retain a trusted response. Page JavaScript cannot redeem authority or report
its own fabricated receipt. Unknown transmission outcomes fence future Computer Use and
never replay. Restart explicitly closes old pages, preserves evidence and provider fences,
and reconciles every execution reservation.

Workers initially observe structured rendered snapshots. Real attributed PNGs remain
owner-private; do not claim model screenshot vision. Client API v1 gains no Computer Use
administration, screenshots or private content. The trusted local UI exposes exact session
and fixture decisions, evidence, stop/revoke and visible uncertainty.

The [architecture](../architecture/COMPUTER_USE.md) defines implementation and bounds;
[the tutorial](../operations/COMPUTER_USE_TUTORIAL.md) defines operator workflow;
[validation](../validation/PROMPT_10_VALIDATION.md) distinguishes scripted probes, actual
workers, controlled faults, independent reviews and production preservation.
