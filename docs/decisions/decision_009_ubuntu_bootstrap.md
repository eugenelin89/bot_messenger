# Decision 009 — Ubuntu headquarters uses a checked-in Codex bootstrap prompt

**Date:** 2026-09-25  
**Status:** Accepted as the target architecture for Prompt 03

## Context

BotSquad is intended to become usable by people other than the original developer. Requiring users to manually configure Node, Codex, systemd, Linux isolation, service directories and BotSquad internals would make onboarding fragile and expert-only.

A one-time DevOps bot cannot solve installation cleanly because the BotSquad runtime must already exist before that worker can run.

The user can reasonably supply one primitive: a fresh supported Ubuntu host reachable through an existing SSH alias.

## Decision

The first Ubuntu onboarding path will be driven by a **checked-in Codex bootstrap prompt**.

The human prerequisite is:

```text
ssh <target-alias>
```

works from the machine running the bootstrap Codex task.

The bootstrap task uses the operator's existing SSH configuration and credentials; private SSH key material is not copied into BotSquad, prompts, the repository or retained evidence.

The bootstrap task will configure a supported Ubuntu host reproducibly, install/validate BotSquad and Codex, establish the non-root system service, validate Linux isolation, verify restart/recovery, and provide a loopback/SSH-tunnel UI access path.

The bootstrap process must leave checked-in deterministic scripts/configuration where practical; Codex orchestrates, diagnoses and validates rather than improvising an undocumented server setup.

**Nix** is reserved as the ongoing DevOps worker after BotSquad is operational. Nix is not required to bootstrap the first installation.

Prompt 03 also introduces a per-worker AI profile:

- model selected from the active runtime's advertised supported models;
- reasoning effort validated for the model/runtime;
- dispatcher execution priority;
- human lock/override;
- execution provenance recording the actual model/reasoning/priority/runtime.

The existing global model selection becomes a default/fallback, not the only worker configuration.

## Consequences

- Ubuntu becomes the intended always-on headquarters/runtime target.
- The Mac/local machine remains a control/bootstrap client rather than a permanent requirement.
- The initial web UI remains loopback-only and is accessed through an SSH tunnel.
- BotSquad itself runs non-root under systemd.
- Prompt 02's macOS-only engineering confinement must be replaced or complemented by a validated Linux isolation path before Ubuntu engineering is claimed.
- Runtime upgrades during the Ubuntu migration require App Server/security revalidation.
- Human-visible Codex thread names should use BotSquad/worker role context rather than opaque IDs.
- Future Nix/worker-account provisioning builds on the installed Ubuntu foundation instead of solving initial installation.
