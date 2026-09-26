# Prompt 03 Ubuntu validation

**Status: In progress — not accepted for main.**

Starting origin/main: `2239be6304495d583053f4ffabd8e900d4fb63f6`.
Feature branch: `feature/prompt-03-ubuntu-hq`. SSH alias: `botsquad`.

Read-only preflight confirmed Ubuntu 24.04.4, kernel 6.8.0-124-generic, x86_64,
1 vCPU, 1.9 GiB RAM, 48 GiB root disk with about 46 GiB available, and no swap.
Root bootstrap identity; no BotSquad account/source/data/service conflicts. Dpkg
health clean; updates pending. Only SSH and loopback DNS sockets were listening.
No SSH keys or Codex credentials were copied or recorded.

Baseline: 49 deterministic tests pass. Initial Prompt 03 suite: 56 pass, including
AI profiles, legacy migration, immutable provenance, priority/FIFO/concurrency,
HTTP protections, runtime protocol and actual macOS confinement. Local actual
Codex 0.157.0 preflight passes and advertises dynamic models/reasoning capabilities.

Ubuntu deployment, Linux tests, service-account authentication, real workflows,
resource measurements, restart/reboot/idempotency, final review and delivery remain.
Do not interpret this provisional record as completed acceptance.
