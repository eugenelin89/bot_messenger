# Bounded browser work: operator tutorial

Use the private HQ through its existing SSH tunnel. Production deployment initially
creates **zero Computer Operators, ComputerSessions and Computer Use grants**. Opening
**Computer Sessions** only reads state. [Architecture and limits](../architecture/COMPUTER_USE.md)
and [acceptance evidence](../validation/PROMPT_10_VALIDATION.md) define the supported contract.

## Prepare the host and an operator

The supported browser host is Ubuntu 24.04 x86_64. The checked-in
`scripts/bootstrap-browser.sh --service` installs the pinned matching Chromium runtime
and separate non-root broker from an exact built `/opt/botsquad` deployment. It needs no
GNOME/KDE, X server, VNC or workstation access. Treat host installation as administration;
workers never run the installer. For an existing HQ, use this narrow installer rather than
rerunning unrelated host upgrades. Production has no loopback fixture exception by default.

Open **Computer Sessions → Create Computer Operator**, enter a name and save. This
owner-only operation creates a persistent worker with bounded browser, internal-message
and report capabilities. It creates no grant or browser. Atlas cannot grant this profile
through hiring or a mandate. Existing eight-worker and manager-child limits still apply.
The retained production roster is already full; do not disable, replace or delete a
worker merely to try this tutorial. Use a separately approved roster change or a fresh
isolated validation HQ.

## Assign and authorize

Choose **Assign bounded browser Task**. Select the operator and write a concrete objective,
acceptance criteria and constraints. Supply exact origins, one per line, including scheme
and optional port. Public sites require HTTPS/443 and public addresses. Choose only vetted,
unauthenticated read-only sites; a GET request can still have effects. Account, mail,
admin, payment and credential-bearing URLs are not supported.

For example, ask for an onboarding review on a disposable approved test site, a useful
report and screenshots. The local C10-1 fixture requires an administrator to configure
that exact loopback origin in the *isolated validation HQ* first. Do not copy its fixture
ceiling into retained production. Leave mutation paths empty for ordinary read-only work.

Review the saved session's worker/Task, immutable policy, exact origins, action/time/file
limits and hash. **Authorize exact session** creates the scoped grant and queues its Task.
**Deny session** cancels it without launching a model or browser. Editing a proposal means
creating and reviewing a new session; an existing grant cannot silently widen.

## Observe work and denials

The page displays current URL, state, remaining usage, shutdown confirmation, network
requests and owner-private PNG evidence. Open a screenshot to inspect it. Each image has
worker/Task/execution/session attribution, action sequence, time, bytes and SHA-256. The
worker understands **structured rendered text and element metadata**; it does not receive
these screenshot pixels and must not claim visual reasoning.

On the disposable fixture, ask the worker to exercise the forbidden-destination probe.
The recent request list should show a trusted denial, and the forbidden server should
record zero requests. Text on a webpage cannot add sites, obtain credentials, access host
files or create approval. File/password inputs, uploads, downloads, popups and direct
network access remain unavailable.

## Decide an exact protected fixture request

Only explicitly configured disposable fixture POST paths are supported. A first attempt
captures method, URL, fixed headers and body **without transmission**. The worker requests
that intent and ends its turn. The session waits, and the settled worker releases its
model slot. Review the exact request body, page fingerprint, policy hash and expiry in the
owner UI. This is a harmless enforcement fixture, not business-action authority.

- **Deny request** closes the environment with no effect.
- **Approve this exact fixture request** queues a fresh provider context. Trusted code freezes and
  rechecks the page, durably consumes the approval, sends the exact request once and
  returns the actual HTTP receipt. A changed page or expired scope fails closed.

Approval is not a reusable permission. Text saying “approved” is ineffective. Do not infer
success from the page's own JavaScript; the durable trusted receipt and fixture recorder
are the evidence. Production publication, spending, outreach and account actions need a
separately reviewed future integration.

## Stop, revoke and recover

**Interrupt session** closes the browser and interrupts its active worker. **Revoke Computer
Use** also revokes the scoped grant. Verify **Browser shutdown confirmed: Yes**. Global
**Pause** only prevents new dispatch; use interruption to stop an active environment.
Neither action reverses a request already transmitted or recalls data already delivered.

The browser closes on runtime, idle, action, navigation, request/byte or screenshot bounds.
A browser crash becomes a failure; completion is never inferred. Restart closes an old
active or waiting environment and cancels untransmitted intents, preserving policy and
evidence. An authorized Task that never reserved an execution may remain queued under its
original unexpired policy; pause before maintenance if it must stay queued.

If transmission started but its durable receipt is missing, the result is **unknown**.
All new Computer Use is fenced, even for a new Task/operator/grant. Inspect the original
request, effect recorder and retained history. There is no generic force-retry or fence-clear
button. Reconcile externally before designing any separate recovery action; never replay
an unknown mutation just to obtain a success message.

Prompt 10 supplies a bounded browser. Prompt 11 must separately demonstrate approved real
business action, external receipt, measured result and scheduled review.
