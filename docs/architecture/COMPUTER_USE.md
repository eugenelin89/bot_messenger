# Bounded Computer Use

Implementation for Prompt 10; acceptance and deployment status live in
[the validation record](../validation/PROMPT_10_VALIDATION.md) and
[execution plan](../exec-plans/prompt-10.md). [Decision 024](../decisions/decision_024_bounded_computer_use.md)
records the boundary. This is one company per HQ, not a remote desktop or business adapter.

## Ownership and authority

A normal `kind=computer` Task owns one durable ComputerSession. Worker, Task, execution,
ComputerSession, provider context and browser process remain distinct. Each model execution
uses a fresh `computer_contexts` generation and provider thread; the approved continuation
receives the original policy, original intents/evidence and bounded operation metadata.
Old callbacks fail execution/worker/Task/generation checks. Provider references cannot cross
ordinary Tasks, conversations, research, mandates or another computer generation.

The owner explicitly creates a `computer_operator` with `computer_use_sandboxed`,
`internal_message` and `submit_artifact`. Those capabilities are outside the CEO delegation
ceiling. Operator creation respects existing eight-worker/manager-child limits. A full
retained roster is not silently expanded or replaced. Creation grants no browser session.

Owner request creates the Task and immutable policy; exact owner authorization adds the
worker/Task/session/policy-hash grant. Effective authority rechecks enabled owner and worker,
role/capability, current Task execution/generation, immutable policy, deployment fixture
ceiling, grant expiry/revocation, session deadline and unresolved-effect fence. Model text,
page content, a mandate or an internal message cannot grant or extend authority. Migration
13 creates zero operators, grants or sessions and preserves pause state.

A unique SQLite reservation covers provisioning, active, approval-waiting, unconfirmed
cleanup and active execution pointers. Only one session can reserve the browser per HQ,
including the interval before browser creation. This is separate from the shared two-model
execution limit. Every asynchronous tool reserves its call ID/attempt before I/O, drains
callbacks on success or failure, and rejects cross-tool/payload replay. Closed or revoked
work cannot acquire new browser actions.

## Browser and host boundary

Pinned `playwright-core` 1.63.0 controls its matching full Chromium. A dedicated non-root
`botsquad-browser.service` exposes only a filesystem Unix socket under a group-restricted
runtime directory. The HQ service, Codex authentication and root provisioner remain separate.
The broker has a private network namespace, strict read-only system mounts, private devices
and temporary directory, no home, no capabilities, NoNewPrivileges and resource limits.

The root-controlled executable adapter launches Chromium inside bubblewrap with fresh
user/PID/mount/network namespaces, private `/proc`, small tmpfs HOME/profile and `/tmp`,
read-only Chromium/libraries/fonts and a cleared environment. No `/var/lib/botsquad`, worker
homes, repositories, SSH agent, Codex credentials, service environment or control socket is
mounted inside Chromium. Profiles/cookies/storage are never reused. Chromium's own namespace
and seccomp sandbox stays enabled; `--no-sandbox` is rejected. No GNOME/KDE, desktop login,
VNC, display server or operator workstation control is involved.

The separate browser unit omits `ProtectKernelLogs`: its `/proc/kmsg` mask prevents an
unprivileged fresh proc mount on this Ubuntu host. Non-root/empty capabilities deny kernel
log access, and Chromium sees only its private PID namespace. The existing HQ unit retains
all its restrictions. Actual probes, rather than the presence of flags alone, establish
what ran. Bootstrap pins browser/control versions, installs only required runtime libraries,
registers the narrow bwrap AppArmor admission and includes a broker readiness gate.

Broker disconnect, owner stop or deadline owns cleanup independently of model response.
Pending connects/launches remain owned until their late result is closed. A five-second
cleanup watchdog exits the service if teardown cannot settle; systemd kills its entire
control group. HQ does not mark shutdown confirmed on a lost acknowledgement. A bounded
idle-status reconciliation may confirm that the old broker environment is gone. No periodic
idle model or browser launch occurs.

## Network and files

Chromium has no direct network path. Intercepted HTTP requests go through the private IPC
connection to trusted HQ forwarding. Each request rechecks active action ownership and
current policy, explicit canonical scheme/host/port/origin, method, resource type and budgets.
Public destinations require HTTPS/443, public IPv4/IPv6, conservative credential/control URL
exclusions and DNS answers pinned to the validated socket address. Every redirect is checked;
mutating redirects are refused. Responses are uncompressed and bounded to two MiB. Forwarded
headers are fixed; cookies, authorization, method overrides, arbitrary origin/referrer and
response cookies are not carried. Retained request URLs omit query/fragment/userinfo.

Only an explicit deployment-configured loopback fixture origin may use HTTP, and the owner
must separately select it in policy. Production's fixture ceiling is empty. Only exact
listed disposable fixture paths can capture a POST for approval. Other mutations fail closed.
Service workers, WebSockets, event streams, plugins, extensions, popups and child frames are
blocked or isolated from forwarding. Direct-network attempts such as WebRTC cannot leave
the network namespace. Worker navigation and element links deny non-HTTP(S)/unapproved origins.

GET/HEAD are not inherently free of effects. This adapter cannot infer a site's business
semantics. Grant only vetted unauthenticated read-only sites; do not authorize account,
control or production business endpoints. Conservative URL filtering reduces common hazards
but is not a semantic proof. Prompt 11 implemented a separately reviewed
[typed business-action integration](BUSINESS_OPERATIONS.md) and completed one bounded
supervised real path. That does not broaden browser authority.

Uploads and downloads are disabled. File/password controls are unavailable; no arbitrary
path or file chooser API exists. Attachment responses and browser downloads are cancelled.
There are no session input mounts. Private PNG evidence is written by HQ to canonical,
mode-restricted files with exclusive creation, fsync, SHA-256 and integrity-checked retrieval;
bytes stay outside SQLite. No downloaded file executes or becomes permission.

## Tools, observation and evidence

The worker gets typed status, navigate, snapshot, click/type/press/scroll, request-protected-
action, execute-approved and finish tools. References are handles from bounded rendered
snapshots; selectors, arbitrary JavaScript, CDP, launch flags, shell and paths are unavailable.
Actions remeasure the page fingerprint and reject stale refs. The broker's internal trusted
code uses DOM/CDP to implement bounded observation/freeze, never worker-authored programs.

Installed Codex 0.157.0 supports text/image dynamic-tool response items. This implementation
supplies **structured rendered text and element metadata**, not screenshot pixels. The model
must not claim visual reasoning. Actual PNGs are retained for owner inspection with session,
worker, Task, execution/generation, URL, viewport, action sequence, capture time, hash, bytes
and `owner_private` classification. Status/context includes bounded operation metadata,
never recursive old result payloads. Tool outputs have a 192 KiB serialized ceiling.

Computer records, related Task/execution/message/artifact DTOs and notifications are excluded
from Client API v1. Its scopes and protected authority do not expand. The trusted local UI
retains Host/Origin/session enforcement, rejects device Authorization, and provides session
inspection, exact decisions, screenshots, interruption and revocation through the private
loopback/SSH tunnel. Viewing the page starts neither a model nor Chromium.

## Exact protected fixture action

1. A permitted click/keypress causes an allowed fixture POST. Trusted code canonicalizes
   method/URL/fixed headers/body, captures its hash plus session/worker/Task/generation,
   immutable policy hash, page fingerprint and expiry, and transmits **zero** bytes.
2. The worker requests the exact captured intent. The session stops accepting page network;
   the worker ends its turn. Only after provider settlement does the Task enter approval
   waiting, freeing the model slot. Generic Task retry cannot bypass this state.
3. The owner approves or denies the displayed exact request and page hashes. Approval queues
   a fresh execution of the same Task; denial closes the browser without transmission.
4. The broker freezes the page and revalidates the fingerprint. Ordinary page callbacks
   cannot redeem approval. Trusted HQ code rechecks scope, consumes the intent durably, then
   transmits the exact captured request once through the bounded forwarder. It records the
   actual HTTP receipt before delivering a result; page-world `fetch` cannot fabricate it.
5. The page resumes only after a trusted receipt. Changed/expired page or scope closes the
   failed continuation. A confirmed HTTP response is evidence of that response, not a general
   assertion that an external business operation succeeded.

Normal fixture acceptance proves one expected effect. The broader guarantee is at most one
transmission per consumed intent, with conservative uncertainty: loss after consumption and
before a committed receipt becomes `unknown`, fences Computer Use and is never replayed.
A new Task, operator, grant, model generation or parent Task failure cannot clear this fence.
Owner inspection/reconciliation is required; no generic override/retry endpoint is provided.

## Recovery and bounds

Restart closes old active/approval-waiting environments, cancels untransmitted intents,
retains evidence/policy, clears stranded execution reservations, and marks transmitting
intents unknown. It never restores a page or browser profile from a database checkpoint.
Unstarted authorized work without an execution reservation can remain queued under the same
unexpired policy. Existing provider uncertainty is independent and remains retained.

Browser/worker failure cannot fabricate completion. Finish requires a closed confirmed
environment and no outstanding approved/transmitting/unknown effect. Already committed
receipts survive lost model output. Interrupt/revoke stops future actions and signals the
runtime; it cannot reverse transmitted requests or recall observations already delivered.
The service retains all session and approval history after teardown.

| Bound | Default | Hard ceiling |
| --- | --- | --- |
| Reserved browser sessions per HQ | 1 | 1 |
| Wall-clock session | 600 s | 900 s |
| Idle browser interval | 120 s | 300 s |
| Actions | 80 | 100 (Codex also has its existing 64-call turn limit) |
| Document requests/navigations | 20 | 30 |
| Screenshot count / total bytes | 12 / 10 MiB | 20 / 20 MiB |
| Request attempts / response bytes | 200 / 16 MiB | 400 / 32 MiB |
| Concurrent forwarding / one response | 4 / 2 MiB | 4 / 2 MiB |
| HTTP/DNS timeout | 10 s | 10 s |
| Browser cgroup memory / swap / CPU / tasks | 768 MiB / 128 MiB / 75% / 128 | fixed service policy |
| Profile and temporary tmpfs | 128 MiB each | fixed launcher policy |
| Grant expiry | owner-selected | within 24 hours |

Attempt budgets are durable and conservative; failed responses may retain their reserved
byte allowance. Expiry, action, navigation, screenshot and request/byte exhaustion terminate
the environment. Review actual measured resource evidence before changing fixed bounds.
