# Execution Plan — INFRA-02 private receiver acceptance

**Status:** Complete for private deployment; documentation PR handoff
**Owner:** INFRA-02 primary Codex writer; read-only specialist reviewers
**Branch:** `feature/infra02-receiver-acceptance`
**Worktree:** Existing infrastructure documentation checkout, reused after clean/idle ownership verification
**Started:** 2026-10-09
**Initial ETA:** 1–2 hours
**Current ETA:** Within initial estimate; final documentation integration

## Objective and scope

Install and synthetically validate the existing INV-02 receiver on the owner-selected
Ubuntu 22.10 Asymmetri host; finish stopped/default disabled. BotSquad changes are
only a documentation handoff. Preserve the exact v1 contract and historical INV-01/02
evidence. Do not access or change HQ runtime, start INV-03, collect market data,
create public ingress, authorize real publishers, buy resources or restart INFRA-01.

## Decisions and ownership

Read both AGENTS, required receiver/hosting/specification documents and Decisions
029/030. Market-data budget remains US$0. Main was fetched; Decision030 remains on
open PR35 at `e2f2caa0e3f267e412639a45e3c11cf7567134b8`. This documentation branch
stacks on that accepted owner-decision branch rather than duplicating its changes.
No other active writer owned the clean infrastructure checkout. Asymmetri uses its
own direct-main/two-commit Engineering Journal workflow. The primary writes and
integrates; reviewers inspect runtime/storage, signing/proxy and isolation/site risks.

## Steps

1. Verify Git, contract pin, unsupported-OS exception and original website baseline.
2. Isolated dependencies/native SQLite/tests; harden and verify systemd confinement.
3. Synthetic nginx, recovery, resource and CLI restart acceptance.
4. Empty operational archive and disabled installation; remove disposable authority/data.
5. Repeat original site/DNS/TLS/configuration checks; publish precise evidence and reviews.
6. Update infrastructure status, link exact Asymmetri commits and open documentation PR.

## Validation and limits

Asymmetri evidence owns real Linux commands/results and failure corrections.
BotSquad requires Markdown/relative-link/diff checks and independent status review;
no HQ or BotSquad runtime tests are warranted for this documentation-only handoff.
Public ingress/activation, real publisher traffic, recurring backup/retention policy,
source rights, later feature milestones and hardware-power-loss/offsite recovery
remain distinct gates. Private installation is not live investment publication.

## Evidence ledger

Actual-host private acceptance passed; see [the immutable evidence handoff](../validation/investment/INFRA-02.md).
Asymmetri implementation `2e663dd3f4281e29aa7e45bf34fbc54ad8a59559` and journal
`193dc1fcf9d973506dadb68b3732cf47d44d1b9a` are pushed and exact remote main verified.
Linux183/183, stream/restore42/42, actual confinement/recovery and bounded load pass.
Original198-request/15-host baseline, DNS/TLS, applications/configuration are preserved.
Operational unit finishes stopped/static, config disabled, authority/data empty;
temporary services/credentials/archives are removed. Three read-only reviewers
accepted corrected scope and evidence with no blockers. HTTP proxy normalization
failure remains an explicit public-ingress gate. BotSquad runtime/HQ unchanged.

## Integration disposition

Documentation-only branch remains based on PR35's accepted Decision030 branch;
the documentation handoff targets `feature/infra01-documentation-handoff` while PR35
is open. Review/merge remains separate. Do not start INV-03 or activate traffic.
The initial 1–2 hour estimate did not materially change.
