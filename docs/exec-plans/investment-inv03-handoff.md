# Execution Plan — INV-03 archive and infrastructure remediation

**Status:** Complete implementation/private acceptance and documentation handoff; public activation disabled.

**Owner:** INV-03 integration writer; independent reviewers read only.

**Branch:** codex/inv03-archive-handoff

**Worktree:** Separate task-owned BotSquad checkout; no HQ runtime writes.

**Started:** 2026-10-09

**Initial ETA:** Several hours; security and actual-host recovery gates drive timing.

**Current ETA:** About 25–35 minutes for final documentation review/integration after actual-host acceptance. Additional fault fixes, sustained testing and review extended the initial estimate.

## Objective and scope

Implement INV-03 in Asymmetri and record exact evidence here. Resolve PR35 and PR36,
retain Decision029's US$0 market-data rule and Decision030's existing-host exception.
No public release, real publisher, market collection, Ask, OS replacement or paid service.

## Steps and evidence

1. PR35 independently reviewed and merged at 7cd52672ab1de1dc687d6aeebc718919760ac2e5.
2. PR36 status/whitespace findings corrected; retargeted to main; independently reviewed
   head b6701c1051ccb8aae574283615f95569d9976dc0 merged at 8a150eb47cd1f1cbc9b5cb3178775ae656052fdf.
3. Asymmetri sole writer implements archive, local controls/pages, additive migration,
   TLS ingress and stronger synthetic recovery/capacity acceptance.
4. Read-only reviewers inspect authority, storage, recovery, ingress and product evidence.
5. Pin Asymmetri implementation/journal and private-install source, update only relevant
   documentation, validate links/diff and open a separately scoped reviewed documentation PR.

## Risks and validation

Immutable evidence, exact-version references, rights distinct from transport, withdrawal
and stale-backup nonresurrection are required. Tests must cover real receiver HTTP/SQLite,
Node22 on retained Ubuntu22.10, isolated TLS, existing-site preservation and labelled UI.
Real worker/HQ outbox acceptance belongs to INV-07/08/10; no runtime suite is claimed here.

## Integration record

Asymmetri implementation `6a80e28494274b3fce1d51a45b7bf012cf2ae97e` and separate
journal `e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03` are pushed, main clean. The installed
receiver source receipt matches the implementation; schema002/all operational counts0,
configfalse/markerabsent/unitinactive-static/no listener. Public website unchanged.
[INV-03 evidence](../validation/investment/INV-03.md) owns results and future gates.
The separate handoff uses a focused reviewed documentation PR; its final merge SHA is
reported after GitHub integration, avoiding self-referential commit receipts. Independent
review corrected stale architecture, launcher and acceptance status text; relative-link,
whitespace, documentation-only scope and unchanged contract/Decision029/030 checks pass.
No runtime test is claimed from these documentation checks. No future milestone starts.
