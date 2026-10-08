# Prompt 03 — Ubuntu headquarters

**Status:** Complete. Historical milestone; reading this file starts no work.

**Specification type:** Reconstructed; editorial reconstruction dated 2026-10-07.

## Historical provenance

> **Historical note — reconstructed specification:** The exact original Codex prompt was
> not recoverable from the repository history inspected for this cleanup. This is a
> canonical reconstructed milestone specification derived from the accepted roadmap,
> execution plan, applicable decisions and validation evidence. It is not claimed to be
> a byte-for-byte copy of the original prompt.

The execution plan first appears at commit `d8e9894d5eefc397b64ffa250bdd308eeba0edc5`. Sources below were reviewed at
baseline `968a0e2b8c96eb1f1bde397227f4fab8e4e30c76`; the [history audit](../../docs/exec-plans/repository-documentation-prompt-cleanup.md#provenance-audit)
records the search. Requirements describe this milestone’s historical scope; later changes
are explicitly identified in the outcome, not silently added to its acceptance contract.

## Goal

Make BotSquad an always-on operator-controlled Ubuntu HQ with reproducible bootstrap and configurable worker AI profiles.

## Required behavior

- Use an existing SSH alias and deterministic installer for non-root systemd, durable data, private loopback UI and Linux confinement.
- Persist per-worker model/reasoning/priority/human lock and effective execution provenance; discover supported runtime choices.
- Preserve macOS regression support and validate service-account Codex workflows, restart, reboot and repeat bootstrap.

## Authority / safety boundaries

- Keep source separate from durable state; never copy SSH or workstation Codex credentials.
- Fail closed on unsupported confinement and AI profiles; priority never bypasses capability, pause or capacity.
- Keep the UI private through SSH tunnelling and workers unprivileged.

## Acceptance expectations

- Real Ubuntu research and concurrent engineering, Linux denial probes, profile/priority checks and state preservation across restart/reboot/reinstall.
- Record actual hardware/resource measurements and runtime versions; do not generalize a bounded host test into a universal capacity guarantee.

## Explicit non-goals

Nix, per-worker Unix users, broad protected grants, public hosting, mobile clients, Computer Use and cloud-provider provisioning APIs.

## Historical outcome

Accepted on Ubuntu 24.04 x86_64 with 1 vCPU, 2 GB RAM and 2 GiB swap for the measured workload. Later milestones reuse this topology without retroactively expanding its original certification.

## Related records

- [Roadmap section](../../docs/product/ROADMAP.md#prompt-03--ubuntu-headquarters)
- [Execution plan](../../docs/exec-plans/prompt-03.md)
- [Validation](../../docs/validation/prompt-03-ubuntu.md)
- Primary decisions: [009](../../docs/decisions/decision_009_ubuntu_bootstrap.md), [011](../../docs/decisions/decision_011_ubuntu_hq_profiles.md)
- [Architecture](../../docs/architecture/SYSTEM_ARCHITECTURE.md) (living document; later capabilities are separately identified)
- [Milestone index](README.md) · [Current state](../../docs/operations/CURRENT_STATE.md)
