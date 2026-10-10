# INV-04 — Public showcase source and local acceptance

Date: 2026-10-09. Status: **complete in source and local synthetic validation;
not deployed or activated**. This is a documentation-only BotSquad handoff.
No HQ runtime, worker, authority, schedule, simulator or provider is changed.

## Exact accepted evidence

| Evidence | Immutable reference |
| --- | --- |
| Asymmetri starting main | `e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03` |
| Implementation and validation | [c31f500c6ebb063341bca7444dac6782df7a7b17](https://github.com/eugenelin89/asymmetri/commit/c31f500c6ebb063341bca7444dac6782df7a7b17) |
| Separate Engineering Journal | [3d9e1ad55dc5ad1861393e63d05370a2a1a7b054](https://github.com/eugenelin89/asymmetri/commit/3d9e1ad55dc5ad1861393e63d05370a2a1a7b054) |
| Detailed checks, limits and preservation | [INV-04 validation at accepted source](https://github.com/eugenelin89/asymmetri/blob/c31f500c6ebb063341bca7444dac6782df7a7b17/docs/INV-04-VALIDATION.md) |
| Safe request/decision journal | [Journal 056](https://github.com/eugenelin89/asymmetri/blob/3d9e1ad55dc5ad1861393e63d05370a2a1a7b054/docs/prompts/056-design.md) |
| Screenshots, six-width measurements and downloaded CSV | [Synthetic acceptance evidence](https://github.com/eugenelin89/asymmetri/tree/c31f500c6ebb063341bca7444dac6782df7a7b17/docs/validation/inv04) |
| BotSquad handoff baseline | `db8875573ad40bafa3d9eeac352562be274cc117` |

Both Asymmetri commits were pushed to main and verified before this handoff.
The containing BotSquad PR records its exact source/merge commits and independent
review; this file does not claim an atomic cross-repository release.

## Implemented scope

The complete `/botsquad/investment` experience includes introduction, goal, truthful
official-run state, roster, Live Investment Desk, artifact/discussion catalogs,
decisions/dissent, return/benchmark/drawdown charts, table/CSV/JSON alternatives,
holdings/allocation, transaction journal and health. Exact run/decision routes and
existing immutable artifact/discussion/record pages preserve the research →
discussion → decision → order/receipt → review journey. Methodology and general,
embedded and contextual Ask previews are static; questions cannot be submitted.
The BotSquad landing page gains one discovery section. Motion routes are preserved.

The author-created 53-event demonstration is permanently marked synthetic. Signed
batches pass the real receiver's schema/financial/relationship checks in disposable
local state; test keys are revoked after seeding and local servers are cleaned up.
No employee execution, real market price, official capital or investment skill is
implied. No operational publisher, visitor store, model call or paid source is used.

Canonical contract 1.0 remains at `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755`, manifest
`7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`; schema002 is unchanged.
Receiver response headers add a visibility epoch witness and a standard bounded
latest-window cursor without modifying v1 JSON. The website fails closed without
that witness, so a future receiver/site release must coordinate it. Server reads
remain allowlisted, schema-validated, finite and scoped to configured public data.

## Validation and limitations

Asymmetri acceptance records **202/202 receiver tests**, **3/3 focused helper tests**,
TypeScript/ESLint, Next webpack and Vinext builds, both production audits with zero
vulnerabilities, and local Node/Worker unconfigured-route smoke checks. Default
Turbopack remains blocked by local sandbox EPERM; it is not counted as passing.
An existing tutorial lint warning and 23 dev-toolchain audit findings remain explicit.

Browser widths 320/390/768/1024/1440/1920 passed without horizontal overflow/broken
images. Keyboard focus/skip, readable typed records, chart windows/gaps/tables and
actual CSV download, full evidence navigation, paused/unread/jump behavior, cursor
expiry over 100 events, open-page withdrawal, outage/recovery, stale/ended and empty
states were exercised. Reduced-motion rendered CSS was inspected; OS emulation
and a screen-reader audit were not claimed. JSON download was not separately saved.
Two independent read-only development reviewers accepted corrected source; browser
actions are attributed to the primary writer, not falsely repeated by reviewers.

Visibility polling hides stale records at the next verification, not instantly, and
cannot retract already downloaded content. Reads/exports describe their finite
loaded-page scope. Derived benchmark drawdown is unavailable without complete peak
history. No live capacity, real source rights or actual employee acceptance is inferred.

## Production preservation

Fresh read-only observations recorded in Asymmetri's evidence confirm the website
still serves `745a92c676bcbe85c3aa675a1099d26321f1c1e2`, unchanged build/process/activation
time and Nginx digest. No service restarted and no production website/receiver was
deployed. The receiver remains inactive, static, config-disabled, enable marker
absent, with operational events/publishers/keys/batches each 0 and no listener.
No new public ingress, DNS/certificate, paid infrastructure, OS, unrelated site or
HQ modification occurred. Protected apex/www Motion pages remain available.
These are dated observations from the source evidence, not a new BotSquad runtime test.

## Handoff and later gates

**INV-05 is ready for a separate owner request in BotSquad and is not started.**
Use deterministic fixture prices/clocks and frozen simulator/accounting rules.
Decision 029's US$0 incremental market-data budget remains binding, with actual
automation/retention/redistribution rights and reliable timestamped prices still
required at INV-06. INV-07 owns trusted HQ publishing/key/receipt reconciliation;
INV-08/09 own actual collaboration and scheduling. All four Ask packets, INV-10
cross-system acceptance, INV-11 forward trial and explicit INV-12 public activation
remain planned. Shared HTTPS/TLS ingress, rejected Nginx HTTP proxy behavior, real
sustained capacity, live-data backup/retention/independent custody, source rights
and the unsupported Ubuntu 22.10 exception are not closed by frontend completion.
Future OS migration remains a separate owner decision. No new recovery milestone.
