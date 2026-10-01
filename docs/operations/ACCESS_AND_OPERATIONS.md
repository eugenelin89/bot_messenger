# Access and Operate a BotSquad Ubuntu HQ

**Status:** Current operator guide, including Prompt 06 client API and retained Project/infrastructure boundaries
**Supported host:** Ubuntu 24.04 x86_64

This guide assumes BotSquad has already been bootstrapped on a server and that your
workstation has an SSH alias for it.

Examples below use:

```text
botsquad
```

Replace that with your own SSH alias.

For creating a new host, see [Set Up a Minimal Ubuntu Host](../bootstrap/SETUP_UBUNTU_HOST.md)
and [Ubuntu HQ Bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md).

## Remote client administration

Keep the listener on `127.0.0.1:4310`. Through the trusted browser/tunnel, open
**Devices / Remote Clients**, select the minimum capability ceiling and create a pairing.
Transfer the one-time payload privately to the client. Compare the displayed SHA-256
public-key fingerprint, inspect the requested capabilities, then explicitly confirm or deny.
Pairing expires after ten minutes. Revoke an active device from the same screen; existing
tokens and streams lose authority and future challenges are denied. Device history remains.

The [reference client](../../scripts/client-v1/README.md) stores a mode-0600 private key
inside an owned mode-0700 directory; its bearer stays in memory. Lost keys require a new
explicit pairing. No credential appears in command-line arguments or acceptance evidence.
After a service restart or host reboot, use the same key/device and obtain a new challenge;
HQ identity and unexpired retry/event history persist. Preserve the company database in
backups. Never enroll by editing SQLite or copy a device private key onto the HQ.

Read [API v1](../api/CLIENT_API_V1.md) for seven-day retry keys, scopes, retention and limits.
The full administrative tunnel is trusted operator access; future device-only transport
must forward only `/api/v1/`. Native protected approvals, iOS, relay and public ingress
remain unavailable.

## Open the BotSquad UI

BotSquad listens only on the server loopback interface:

```text
127.0.0.1:4310
```

From your workstation, start an SSH tunnel:

```sh
ssh -N -L 4310:127.0.0.1:4310 botsquad
```

Leave that terminal open.

Then open:

```text
http://127.0.0.1:4310
```

The UI is running on the Ubuntu server even though the browser URL looks local.

Do not open TCP 4310 to the public Internet.

## Follow bot interaction

BotSquad currently coordinates primarily through explicit Tasks and manager handoffs,
not through always-on private bot chats.

For a readable completed workflow such as StudyPlan:

1. Open **Executive channel** to read human-readable progress and handoff messages.
2. Use **↗ Task** beneath a message to inspect the exact assignment, acceptance criteria,
   parent relationship, result and execution attempts.
3. Open **Audit history** for precise control-plane transitions such as task assignment,
   child-result receipt, manager follow-up, approval and integration.
4. Open **Executions** to see when each worker actually ran, including concurrent work.

The human normally assigns executable objectives to Atlas. The message-only control adds
durable Executive-channel communication but does not start a worker or create a Task.
Direct private human-to-Maya/Linus/etc. chat is not implemented through Prompt 06.

Workers may use human-readable messages to address other existing workers when their
capabilities allow it, even across hierarchy edges. That message does not wake the
recipient or grant authority. Actual work assignment is stricter: a manager can assign
only a direct subordinate, subject to the supported workflow's role/stage constraints.

A recipient-addressed worker message is durable and auditable, but current worker context
is Task-centric rather than a general personal inbox. The reliable orchestration path is
an explicit child Task, completed result/artifact, and the durable child-result event that
queues the manager to continue.

See [AI Organization Model](../product/AI_ORGANIZATION_MODEL.md) for the complete semantics.

## SSH into the headquarters

For ordinary administration:

```sh
ssh botsquad
```

The bootstrap SSH user may be root or a sudo-capable administrator. The BotSquad
application itself runs separately as the non-root `botsquad` system account.

## Quick health check

```sh
ssh botsquad 'curl -fsS http://127.0.0.1:4310/api/health'
```

The health endpoint reports only bounded operational status such as:

- application liveness;
- database readiness;
- dispatcher readiness;
- cached runtime status;
- application version/deployed commit.

It does not expose company messages, credentials, session tokens, or thread transcripts.

## Service status

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'systemctl is-active botsquad'
ssh botsquad 'systemctl is-enabled botsquad'
```

Expected normal state:

```text
active
enabled
```

The live service should run as the `botsquad` user, not root.

## Verify private listener

```sh
ssh botsquad 'ss -ltnp | grep 4310 || true'
```

Expected binding:

```text
127.0.0.1:4310
```

A public `0.0.0.0:4310` listener is not the supported current configuration; Prompt 03 established and Prompts 04–06 retained the loopback-only UI/API boundary.

## View recent logs

```sh
ssh botsquad 'journalctl -u botsquad --since "15 minutes ago" --no-pager'
```

Follow logs live:

```sh
ssh -t botsquad 'journalctl -fu botsquad'
```

Press `Ctrl+C` to stop following logs.

Do not paste authentication tokens or device codes into bug reports.

## Restart BotSquad

Use a normal systemd restart:

```sh
ssh botsquad 'systemctl restart botsquad'
```

Then verify:

```sh
ssh botsquad 'systemctl is-active botsquad && curl -fsS http://127.0.0.1:4310/api/health'
```

Completed work and company state are durable. BotSquad does not intentionally replay
completed executions after restart.

Interrupted or ambiguous work is retained for inspection rather than blindly replayed.

## Check Codex runtime/login

Run the checked-in preflight under the actual service identity:

```sh
ssh botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin CODEX_BIN=/opt/botsquad/node_modules/.bin/codex sh -c "cd /opt/botsquad && node dist/scripts/codex-preflight.js"'
```

If runtime authentication is missing, the BotSquad UI can remain available while the
runtime reports degraded/not ready.

## Re-authenticate Codex

Use device authorization under the service account:

```sh
ssh -t botsquad 'sudo -u botsquad env HOME=/var/lib/botsquad CODEX_HOME=/var/lib/botsquad/.codex PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin /opt/botsquad/node_modules/.bin/codex login --device-auth'
```

Complete the browser authorization privately.

If ChatGPT rejects device-code login, enable the available device-code authentication
setting in ChatGPT Security settings, or have the relevant workspace administrator
enable device-code authentication. Never share a device code; it can be phished.

OpenAI documents device-code authentication for non-interactive Codex CLI environments:
<https://developers.openai.com/docs/enterprise/access-tokens>

After login, rerun the preflight and health check.

## Pause and resume work

The UI separates:

- **Pause new dispatch** — prevents new queued work from starting;
- **Interrupt** — stops a currently running supported Codex turn.

These are not equivalent.

Pausing does not undo actions that already happened.

The current accepted HQ remains intentionally handed off with production dispatch
paused during Prompt 05 acceptance. That is an operator handoff choice, not a requirement for every fresh install.

Before resuming an existing HQ, inspect queued/blocked/awaiting-approval work in the UI.

## Worker model/reasoning/priority

Open a worker inspector in the UI to configure:

- model;
- reasoning effort;
- execution priority;
- human lock.

Choices are discovered from the signed-in Codex runtime/account.

Changes apply to future executions, not already-running work.

Execution history records the actual effective settings that ran.

## Update BotSquad to a newer main commit

Run updates from a trusted local BotSquad clone.

First inspect/fetch:

```sh
git fetch origin
git status --short --branch
git rev-parse origin/main
```

Then bootstrap/update the desired pushed commit:

```sh
./scripts/bootstrap-ubuntu.sh botsquad "$(git rev-parse origin/main)"
```

The installer:

- preserves `/var/lib/botsquad`;
- preserves Codex service-account auth;
- preserves operator environment overrides;
- stops the service before changing source/build;
- runs the hardened validation gate;
- restarts only after validation succeeds;
- refuses dirty/unrelated deployment state;
- does not force-reset retained company data.

If the update fails after the service has been stopped, the failure remains visible
rather than automatically running a partially updated build.

Database migrations do not currently have an automatic rollback mechanism.

## Initialize and operate worker infrastructure

Open **Infrastructure → Initialize Nix**. This creates a logical DevOps worker and
one pending bootstrap approval. In **Approvals**, inspect the worker, requester,
task/execution, exact parameters, preconditions and expiry, then approve or deny.
An approval grants only that operation once. Bot messages and artifacts never approve.

Once Nix is ready, **Ask Nix to provision** creates a real infrastructure task for
existing unprovisioned workers. New workers automatically receive such a task on
production Linux. Engineering waits for identity and clone grants; the UI exposes
the waiting reason without model polling. Existing companies are not auto-provisioned
by migration. Codex credentials and original runtime workspaces stay under botsquad.

Use **Ask Nix to retire** only after outstanding and unintegrated work is resolved.
Approval disables logical dispatch, locks/expires the Unix account, terminates its
recorded UID processes and revokes home/project traversal. Homes and evidence remain.
Protected CEO/CTO/Nix retirement is outside this bounded workflow.

**Check provisioner health** reads the local protocol status. **Reconcile interrupted
operations** retries only already-consumed exact intent under the same operation ID.
Pending, expired and denied approvals cannot be used to create new authority. An
unavailable provisioner leaves recoverable intent and blocks dependent work; repair
the service and reconcile instead of editing SQLite or making replacement accounts.

```sh
ssh botsquad 'systemctl status botsquad-provisioner.socket botsquad-provisioner.service --no-pager'
ssh botsquad 'journalctl -u botsquad-provisioner --since "15 minutes ago" --no-pager'
```

The socket is enabled at boot; its service starts on demand. Do not add worker users
to the botsquad group or give them sudo, socket access or central credentials. Root
code is updated only by the operator bootstrap from an exact pushed revision.

## Back up the headquarters

The durable/sensitive directory is:

```text
/var/lib/botsquad
```

It contains company state, artifacts, runtime state, and service-account Codex data.

For a consistent backup, stop BotSquad first:

```sh
ssh botsquad 'systemctl stop botsquad'
```

Use your operator-controlled backup/snapshot mechanism to protect the full
`/var/lib/botsquad` tree. Prompt 04 also requires `/var/lib/botsquad-provisioner`,
`/var/lib/botsquad-workers`, `/etc/botsquad` and the host account/UID mapping. Preserve
ownership and ACLs. A consistent whole-host snapshot is suitable; copying SQLite
alone cannot restore worker accounts or root receipts. Keep the provisioner idle
while capturing these related state directories.

Then restart:

```sh
ssh botsquad 'systemctl start botsquad'
```

Treat the backup as sensitive credential-bearing material. Do not commit or upload it
to ordinary project storage.

Provider snapshots can also protect the whole VM, but the provider's snapshot/security
model is outside BotSquad.

## Host reboot

The service is enabled at boot.

A normal reboot should return BotSquad automatically:

```sh
ssh botsquad 'reboot'
```

After the machine returns:

```sh
ssh botsquad 'systemctl is-active botsquad && curl -fsS http://127.0.0.1:4310/api/health'
```

Prompts 03–06 validated full reboot recovery on Ubuntu 24.04 x86_64. Prompt 06 additionally preserved HQ/device keys, idempotency receipts and event cursors, then revoked the test devices; see its [acceptance record](../validation/prompt-06-remote-client-api.md). Prompt 05
rechecked original production history, worker identities, root receipts, archived
Project state and retired access. Production remained paused and central Codex
authentication ready. See the [acceptance record](../validation/prompt-05-general-projects.md).

## Troubleshooting

### SSH works but the browser does not

Check:

1. the tunnel terminal is still running;
2. `botsquad.service` is active;
3. the server listens on `127.0.0.1:4310`;
4. local port 4310 is not already occupied by a development instance.

Useful commands:

```sh
ssh botsquad 'systemctl status botsquad --no-pager'
ssh botsquad 'ss -ltnp | grep 4310 || true'
```

### Runtime says not logged in

Run the device login command above under the `botsquad` service identity, then run
the Codex preflight again.

### Engineering fails closed

Do not bypass the confinement gate.

Inspect:

```sh
ssh botsquad 'journalctl -u botsquad --since "30 minutes ago" --no-pager'
```

The supported Linux contract is Ubuntu 24.04 x86_64. Missing/failed confinement is
intentionally treated as unsupported rather than falling back to unrestricted tests.

### Need deeper acceptance checks

The installed host includes:

```sh
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh deterministic'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh prompt01'
ssh botsquad 'bash /opt/botsquad/scripts/validate-ubuntu-host.sh engineering'
```

Run the real-model scenarios only when you intentionally want to consume Codex usage.

## Related documentation

- [Current State](CURRENT_STATE.md)
- [Ubuntu HQ Bootstrap](../bootstrap/UBUNTU_BOOTSTRAP.md)
- [Set Up a Minimal Ubuntu Host](../bootstrap/SETUP_UBUNTU_HOST.md)
- [System Architecture](../architecture/SYSTEM_ARCHITECTURE.md)
- [Prompt 04 Validation](../validation/prompt-04-linux-identity.md)
- [Decision 013 — Trusted worker infrastructure](../decisions/decision_013_trusted_worker_infrastructure.md)
- [Prompt 03 Historical Validation](../validation/prompt-03-ubuntu.md)
- [Decision 011 — Ubuntu HQ and worker AI profiles](../decisions/decision_011_ubuntu_hq_profiles.md)


## Software Projects and trusted repository operations

In Projects & repositories, create a Project, configure instructions/policy, and register
one or more repositories. New local repositories start with README; imports accept a Git
bundle up to 4 MiB, or a normalized public GitHub HTTPS URL. Choose the actual default
branch. Host paths, credentials in URLs, submodules, symlinks, LFS and unsafe Git metadata
are rejected. Inspect the error and narrow or sanitize the input outside BotSquad.

Configure focused and full named recipes before assigning an objective. The supported
command is the installed Node test runner with literal repository-relative test files,
no shell/globs/custom executable/environment or dependency installation. Recipes run in
disposable snapshots, with only build/ writable. Linux caps scratch at 64 MiB, Node heap
at 96 MiB and data at 512 MiB; JIT/WebAssembly are disabled. Deadline/output can be lowered
within 30 seconds/64 KiB. Project bounds can be lowered from the ceilings in Decision 014.

Maya produces the actual spec; Turing assigns disjoint scopes and Nix requests exact
Linux grants. Review scope/UID/clone evidence before approving each host operation.
The UI shows all immutable submissions, review packets, revisions and integration attempts.
Changes required returns only affected tasks to their existing worker/thread. Review-limit,
stale-base or ambiguous integration failures require inspection; do not reset Git or alter
history to make a status green. Pause stops new dispatch, including queued integration.

Remote policy defaults to none. Explicit fetch_only synchronization verifies identity,
default branch and ancestry; divergence blocks without merging/resetting. approved_push
permits requesting publication of the current completed integration. Review the exact
remote, branch, expected old/new SHA and source integration before approving. This is a
non-root service operation with its own receipt, separate from provisioner approvals.
If a response is lost, use Reconcile & retry this operation. Intended new SHA reconciles
success; expected old SHA permits the same approved retry; another SHA blocks. Startup
inspects running operations without republishing. There is no force push or branch delete.

Optional GitHub publication credentials must be configured privately on the HQ host by
an operator. Set BOTSQUAD_GITHUB_TOKEN_FILE in the protected service environment to an
absolute canonical, service-owned regular file with mode 0600 in a private directory.
Use a narrowly scoped credential for the explicitly authorized repository. Never paste
its value into chat, logs, URLs, project instructions or SQLite; never copy workstation
Git/gh/SSH authentication automatically. Restart the service after configuration. Public
fetch is credential-free; authenticated private fetch is unsupported. Live authenticated
GitHub publication remains unvalidated unless the acceptance record explicitly says otherwise.

Resolve work and pending publication before archive. Archive retains canonical repositories,
clones and all evidence, revokes exact worker clone access, and blocks new Project work.
A completed allocation may also be released individually. Worker identity and compatible
Codex thread remain reusable; archive is not worker retirement or physical cleanup.

Retained pre-Project Codex engineering tool schemas cannot be changed on resume by the
pinned runtime. They remain intact and fail clearly on generic engineering; use compatible
new workers/fresh validation state rather than replacing a retained thread implicitly.

For fresh real Ubuntu acceptance, the projects launcher uses the same service restrictions:

```sh
sudo bash /opt/botsquad/scripts/validate-ubuntu-host.sh projects
sudo python3 /opt/botsquad/scripts/validate-projects-operator.py /var/lib/botsquad/validation/projects-TIMESTAMP
```

The operator companion performs harmless UID canary and archived-clone denial probes.
Both commands are validation-only and consume real Codex usage. Preserve the actual production pause state.
Evidence and limitations are in [Prompt 05 validation](../validation/prompt-05-general-projects.md).

## Direct conversations and recovery

Use the private browser's worker inspector → **Open conversations**. Passive messages
do not wake workers; **Send & request reply** queues one bounded turn. Global pause
holds queued turns. Interrupt requests active provider cancellation; mute/archive hold
conversation dispatch, and archive also prevents new messages. History is retained.

**Replace worker's context** requests safe replacement at the next authorized reply.
The same worker/conversation remains; task bindings stay separate. A blocked ambiguous
provider attempt is an inspection gate for both task and chat work. Creating a new
conversation or retrying a Task cannot clear it. The UI does not offer a blind retry or
fence reset. Inspect provider references and retained execution evidence first. See
[full lifecycle/recovery semantics](../architecture/CONVERSATIONS_AND_CONTINUITY.md).

Prompt 07 validation scripts explicitly distinguish fixture roster setup, real model
responses and controlled process faults. Never arm a fault marker in retained HQ data.
Use SQLite backup for an offline migration copy; never serve that copied production DB
as a second authenticated HQ. Preserve the owner's pause state during deployment.

## Public Research and Company Knowledge standing permissions

Use the private browser worker inspector → **Capabilities & research**. Public Research
and selected Company Knowledge documents require separate explicit confirmations. Revoke
from the same view. The [learn-by-doing tutorial](PUBLIC_RESEARCH_TUTORIAL.md) explains
questions, delegated reports, source inspection and revocation. Do not edit SQL for normal
activation. New deployments and migrations leave existing grants/denials unchanged and
do not automatically enable retained workers.

The existing pinned Codex account must advertise the worker's configured model and support
native live search. No extra subscription/API key is assumed. Provider configured status
is not proof of a successful lookup; inspect actual outcomes. Managed public pages may
reject compression, dynamic content, oversized responses or protected/control URLs.
Source outage/rate limit/timeout is a tool failure; provider uncertainty is a worker-wide
fence. Inspect retained operation, execution and provider references before a reviewed
repair; never clear a fence or replay an ambiguous query simply to unblock a demonstration.

Browser routes `/api/research/workers/:id`, `/api/research/operations/:id` and POST
`/api/research/{grant,revoke}` use the existing Host/Origin/browser token boundary.
Grant input is an explicit worker ID, `public_research` or `company_knowledge` preset,
null/future `expires_at` and explicit `document_paths` (empty for public research).
Authority fields are immutable; revoke then create a replacement to alter scope.
Device v1 intentionally supplies none of these routes or research history/event payloads.

Keep query/conversation evidence private even when source URLs are public. Export only
necessary bounded excerpts, metadata and hashes. Hard defaults, residual query-disclosure
limitations and opaque-provider boundaries are recorded in
[Decision 020](../decisions/decision_020_scoped_public_research.md).

## Working groups and scoped application updates

Use **Working Groups** to create a draft, explicitly start it, interject, pause future
turns, interrupt active work, stop without summarizing, or authorize one more bounded
round. The wall-clock deadline continues while paused. **Finish with current evidence**
authorizes one final synthesis after active work settles. A blocked incomplete group can
use a different current unfenced participant; this does not repair the failed worker.
Saved versions, failures, source omissions and unanswered questions remain inspectable.
See [controls and recovery](../architecture/WORKING_GROUPS.md).

For a code-only update on an already provisioned host, first inspect current source and
build identity, active/runnable work, actual pause/grants, and all retained state. Take a
consistent SQLite backup and exercise migration twice on an offline copy. Quiesce work,
stop only the application service, check out the exact accepted revision, build with the
unchanged validated dependencies, update the deployment SHA receipt, then restart and
verify health/listener/build/preservation. Do not run full bootstrap merely to deploy code:
its provisioning and OS-package operations require their own justified scope. No worker
roster, new grant, pause reset, or demonstration belongs in production deployment.

Prompt 08 isolated scripts are explicitly restricted to validation roots and loopback
ports; their manifests distinguish trusted roster setup, real model output and deliberate
fault injection. Preserve failed attempts and all unknown-outcome fences. Stop temporary
services/tunnels after evidence collection. No acceptance script imports production data.
