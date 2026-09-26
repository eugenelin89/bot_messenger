# Decision 010 — Ubuntu service, Linux confinement and worker AI profiles

**Date:** 2026-09-26  
**Status:** Implemented; final real Ubuntu acceptance pending

## Context

Decision 009 establishes operator-controlled Ubuntu HQ as the primary topology.
Prompt 03 implements that contract and incorporates PR #1's clarification of
“local-first” as self-hosted state. Historical Prompt 01/02 execution plans, reports
and macOS results remain unchanged. The 1-vCPU/2-GB DigitalOcean host is the real
acceptance candidate, not a reason to add a provider API or reduce concurrency.

## Decision

Use the existing SSH alias solely from the bootstrap workstation. Install on Ubuntu
24.04 x86_64 as root/passwordless sudo, then run one systemd service as `botsquad`
(UID 997 on the acceptance host). Logical workers remain separate from Unix identity.
The source/build is root-owned at `/opt/botsquad`, durable data is mode 0700 at
`/var/lib/botsquad`, and the UI binds only `127.0.0.1:4310` through an SSH tunnel.

The deterministic installer installs available non-removing Ubuntu updates, verified
Node 24.21.0 and the exact locked npm dependencies. Source updates must preserve
history and reject dirty/unrelated checkouts. Retain operator environment settings,
authentication and data. Add a single persistent 2-GiB mode-0600 swap file when useful
swap is absent; do not equate swap with RAM. Phased packages remain under Ubuntu's
normal policy. Reboot and second-run acceptance are required before completion.

Systemd enables boot startup, uses a ten-second restart delay and three attempts per
120 seconds, drops capabilities, denies privilege acquisition and protects system,
home, kernel and control-group paths. Source is read-only to the service. Namespace
creation, V8 JIT and Codex outbound HTTPS remain available because they are required.
All service children are terminated on stop. Journald owns service logs.

### Platform confinement

Preserve the macOS Seatbelt adapter. Linux x86_64 uses a root-owned, service-group-only
bubblewrap binary with mount/user/PID/network/IPC/UTS namespaces, dropped capabilities,
read-only product/runtime mounts, hidden Git metadata, an empty environment, seccomp
and Node permissions. Ubuntu 24.04 AppArmor grants userns admission only to that
specific executable. Global `apparmor_restrict_unprivileged_userns=1` remains enabled.

The seccomp filter rejects wrong/x32 ABIs, network socket creation, non-thread process
clones, host signals, ptrace, namespace/mount operations, kernel key/BPF/perf interfaces
and other escape mechanisms. clone3 returns ENOSYS so libc can create permitted Node
threads with clone. Node denies arbitrary filesystem reads, addons, workers and child
process APIs. Ten-second deadlines and output limits remain. Missing or failed
confinement never falls back to ordinary execution. Other Linux architectures are
not yet certified.

The AppArmor admission policy is not itself the product sandbox. The executable is
not setuid, grants no sudo, and is writable only by root. OS namespaces/mounts/seccomp
and trusted narrow tools enforce the actual product constraints. This still does not
isolate malicious arbitrary processes sharing the service UID from company state;
per-worker Unix identities remain the next infrastructure milestone.

### Runtime and AI profiles

Upgrade the exact Codex CLI pin from 0.142.4 to **0.157.0**, the stable npm version
investigated for this milestone. Generated schemas, safety flags, actual model/list,
thread naming/resume, tools and interruption are revalidated. Alpha/latest floating
installs are not a deployment policy. This supersedes the pin in Decisions 007/008
while preserving their narrow runtime authority and conservative recovery principles.

Migration 3 adds `ai_model` and `reasoning_effort` (NULL means inherit), bounded
`execution_priority` (low/normal/high/critical, default normal), and
`ai_profile_locked` (default true). It retains worker IDs and all runtime bindings.
The runtime catalog supplies model choices, default reasoning and supported reasoning
options. Invalid explicit choices fail visibly before a turn; they never silently
fall back. `BOT_MODEL` is only the default for inherited workers. An explicit valid
worker model can operate even if the configured company default becomes unavailable.

Human updates use the existing authenticated Host/Origin/session-token HTTP boundary.
No actor identity is accepted from the payload. Bots have no profile mutation tool,
even when a human unlocks a profile. Manager-requested settings are explicitly deferred
under Prompt 03's optional scope; adding them later requires delegation ceilings and
lock enforcement. Profile changes affect future claims, not running executions.

Claims sort eligible workers by priority, then creation time and insertion order.
Pause, enabled-state/task/allocation checks, one active execution per worker/task and
a two-execution global limit still apply transactionally across database connections.
Strict priority can starve lower-priority work under a continuous higher-priority
queue. No aging policy is claimed; operators may reprioritize or pause work.

Each claimed execution snapshots priority. Before a turn, the adapter validates and
persists effective model/reasoning/version/adapter exactly once; an SQL trigger prevents
later provenance rewriting. Legacy attempts remain NULL/legacy. A startup failure before
configuration remains unresolved rather than pretending a model ran.

New threads are named `BotSquad · <name> · <title>`. Their persisted exact name, thread
reference, runtime and canonical UUID workspace are checked on resume. Old opaque
BotSquad/Bot Messenger names remain accepted only for legacy bindings; old sessions
are never replaced or renamed automatically.

### Health and observability

A narrow health endpoint reports liveness, database/dispatcher readiness, cached
runtime discovery status, app version and deployed commit. It does not include session
tokens, company state, transcripts, credentials or private environment variables.
`/api/runtime` explicitly discovers the current catalog without executing a model.
Worker controls display configured settings and recent effective execution settings;
execution records retain immutable historical provenance.

## Evidence and remaining gates

See [Prompt 03 validation](../validation/prompt-03-ubuntu.md). At implementation time,
60 deterministic tests pass on both macOS and Ubuntu, including actual Linux denial
probes. The real Mac research/restart/resume/interruption regression also passes.
Ubuntu service-account login, real workflows/resources and recovery acceptance must
finish before main integration or declaring the hardware a validated minimum.

## Deferred scope

Nix DevOps, worker Unix users and independent clones, privileged provisioner, general
human approval grants, Computer Use/browser automation, public UI, provider APIs,
fleet management, customer deployment automation and financial authority.

## Primary references

- [App Server and dynamic model catalog](https://learn.chatgpt.com/docs/app-server)
- [Official device authentication](https://learn.chatgpt.com/docs/auth)
- [Bubblewrap namespace/mount/seccomp implementation](https://github.com/containers/bubblewrap/blob/main/bwrap.xml)
- [Ubuntu AppArmor user namespace protection](https://documentation.ubuntu.com/security/security-features/privilege-restriction/apparmor/)
- Installed Codex 0.157.0 generated experimental protocol types and the actual Ubuntu denial logs/probes.
