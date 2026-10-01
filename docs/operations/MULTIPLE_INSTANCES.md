# Running Multiple BotSquad Instances

**Status:** Architecture/operator note; separate data roots and ports work conceptually today, but full production-grade multi-instance worker/provisioner infrastructure is not yet automated  
**Updated:** 2026-09-29

## Demo 01 deployment exception

The [Demo Operator 01 tutorial](../tutorials/demo-01-studyplan/README.md) uses a fresh
Project in the explicitly authorized existing development HQ, with a protected backup,
UI-only actions and retained evidence. It does not create a second service or
provisioner namespace. The separate-instance recommendations below describe stronger
isolation for future or protected-production use, not what Demo 01 implements.

## Why run more than one instance?

Useful cases include:

- retained production company;
- disposable demo/tutorial company;
- validation environment;
- development instance;
- experimental state that must not modify production.

The most important rule is:

> An instance is more than a TCP port.

At minimum, each instance needs a distinct durable BotSquad data root. Stronger
separation may also require a distinct service identity and Prompt 04 provisioner/worker
namespace.

## Projects within each data root

Prompt 05 Project/repository identities are persisted in the configured data root and
are independent of production paths and port 4310. Each instance manages its own
canonical repositories, policy, review/integration history and remote approvals. Archive
reduces access within that instance and retains evidence. A different data root does not
create a new root provisioner, service identity or credential boundary; the host-infrastructure
limitations below still apply. Prompt 05 did not implement either capability; the later Demo Operator 01 interlude
adds the bounded UI client, and Prompt 06 adds device-authenticated Client API v1 within
a single HQ/data root. Neither change creates a second provisioner namespace. Full multi-instance service
provisioning remains unimplemented.

## HQ and device identities

Prompt 06 persists one `hq_id` per company database/data root. Restarting or upgrading
the same data root preserves it. A fresh root receives a different HQ ID; copying the
whole database intentionally copies that identity and its device trust records. Do not
run a copied backup as an independently trusted HQ without a separately reviewed recovery
procedure. The API does not implement multi-company or multi-HQ client management.

Prompt 06 acceptance uses a fresh data root and a loopback port, with a separately named
unit inheriting production restrictions. It shares the existing service identity and
central runtime authentication; it is validation isolation, not a supported multi-tenant
host provisioning feature. Retained company/Project databases remain untouched.

## Current application boundary

The BotSquad entrypoint reads two important environment values:

~~~text
BOT_DATA_DIR
PORT
~~~

Conceptually:

~~~text
BOT_DATA_DIR=/var/lib/botsquad
PORT=4310
~~~

is one control-plane instance, while:

~~~text
BOT_DATA_DIR=/var/lib/botsquad-demo
PORT=4311
~~~

is another.

Each process takes a lock on its own data directory and opens:

~~~text
<BOT_DATA_DIR>/company.sqlite
~~~

## What the data directory separates

Given:

~~~text
production:
/var/lib/botsquad

demo:
/var/lib/botsquad-demo
~~~

the two instances have different control-plane state, including:

- SQLite database;
- workers;
- tasks;
- messages;
- executions;
- artifacts;
- AI profile configuration;
- pause state;
- runtime-binding records;
- project/control metadata stored below the data root.

The data root is the primary state boundary.

## What the port separates

Given:

~~~text
production:
127.0.0.1:4310

demo:
127.0.0.1:4311
~~~

the port answers:

> Which BotSquad HTTP server am I talking to?

It does not choose the database. BOT_DATA_DIR chooses the database.

Think of it as:

~~~text
4310 ---> production process ---> /var/lib/botsquad/company.sqlite

4311 ---> demo process ----------> /var/lib/botsquad-demo/company.sqlite
~~~

Separate ports let both processes listen at the same time.

A different port by itself does not make a safe demo.

For example, this would still target production data:

~~~text
PORT=4311
BOT_DATA_DIR=/var/lib/botsquad
~~~

So a Demo Operator must verify the data root, not merely the port.

## SSH tunnels

If both instances remain loopback-only on the Ubuntu host:

~~~sh
# production
ssh -N -L 4310:127.0.0.1:4310 botsquad

# demo
ssh -N -L 4311:127.0.0.1:4311 botsquad
~~~

Then locally:

~~~text
http://127.0.0.1:4310 -> production
http://127.0.0.1:4311 -> demo
~~~

The local port may differ from the remote port. For example:

~~~sh
ssh -N -L 9001:127.0.0.1:4311 botsquad
~~~

would expose the server's demo port 4311 locally as port 9001.

## Same source code is fine

Two BotSquad instances do not require two source-code installations.

Both can execute the same installed code:

~~~text
/opt/botsquad/dist/src/main.js
~~~

while using different environment/configuration.

Code version and instance state are separate concerns.

## Current systemd limitation

The production service currently grants write access specifically to:

~~~text
/var/lib/botsquad
~~~

Therefore a hardened second systemd service cannot safely be created merely by changing
BOT_DATA_DIR in the existing unit.

A real demo unit using:

~~~text
/var/lib/botsquad-demo
~~~

needs matching systemd filesystem policy, environment and lifecycle.

Conceptually:

~~~text
botsquad.service
botsquad-demo.service
~~~

## Important Prompt 04 caveat

Prompt 04 added host-level infrastructure:

~~~text
/run/botsquad-provisioner/control.sock
/var/lib/botsquad-provisioner
/var/lib/botsquad-workers
~~~

plus real worker Unix accounts.

Therefore:

~~~text
different BOT_DATA_DIR
+
different PORT
~~~

separates the BotSquad databases, but does not automatically isolate every Prompt 04
host resource.

If production and demo both use the same Linux identity backend and same provisioner,
they may still share:

- root provisioner;
- provisioner receipt namespace;
- Unix account namespace;
- worker-home root;
- host UID/GID resources.

That is not the preferred architecture for a disposable demo that exercises real
worker provisioning.

## Isolation levels

### Level 1 — Demo/development state separation

~~~text
same installed code
different BOT_DATA_DIR
different PORT
development/simulated identity backend
~~~

Good for:

- UI walkthroughs;
- research demos;
- tutorials that do not need real Linux worker provisioning;
- development.

Example:

~~~text
production data: /var/lib/botsquad
demo data:       /var/lib/botsquad-demo
production port: 4310
demo port:       4311
~~~

If simulated worker identity is used, the tutorial must not claim real Prompt 04
Unix-account isolation.

### Level 2 — Separate BotSquad service process

~~~text
same installed source
separate systemd service
separate BOT_DATA_DIR
separate PORT
possibly same service account
~~~

This gives separate lifecycle/process state, but sharing the same Unix service account
is not complete filesystem isolation.

Systemd filesystem policy must explicitly grant the demo service only the paths it needs.

### Level 3 — Strong same-host production/demo isolation

For demos that exercise real Prompt 04 infrastructure, a stronger design is:

~~~text
production:
  service user:        botsquad
  data:                /var/lib/botsquad
  port:                4310
  provisioner state:   /var/lib/botsquad-provisioner
  worker home root:    /var/lib/botsquad-workers
  provisioner socket:  /run/botsquad-provisioner/control.sock

demo:
  service user:        botsquad-demo
  data:                /var/lib/botsquad-demo
  port:                4311
  provisioner state:   /var/lib/botsquad-demo-provisioner
  worker home root:    /var/lib/botsquad-demo-workers
  provisioner socket:  /run/botsquad-demo-provisioner/control.sock
~~~

These demo path names are illustrative.

The current provisioner/worker-home stack, unchanged by Prompt 06, is not yet
parameterized/documented as a supported multi-instance production stack. This level
therefore needs deliberate future implementation rather than ad-hoc manual edits.

### Level 4 — Separate VM/server

The strongest simple boundary is another VM/server.

~~~text
production VM:
  /var/lib/botsquad
  127.0.0.1:4310

demo VM:
  /var/lib/botsquad
  127.0.0.1:4310
~~~

Because the hosts differ, identical internal path/port names are safe.

This is attractive when:

- the demo intentionally exercises root provisioning;
- reset/destructive testing is frequent;
- zero chance of touching production is preferred;
- the extra VM cost is acceptable.

## Codex authentication

CODEX_HOME is separate from BOT_DATA_DIR.

Production currently uses:

~~~text
CODEX_HOME=/var/lib/botsquad/.codex
~~~

A future demo could use the same external runtime account or its own local authentication
state.

### Same runtime account

Production and demo may intentionally use the same operator-owned Codex account.

Advantages:

- one account;
- simpler model availability.

But both consume the same external account allowance.

Separate BotSquad databases do not create separate Codex usage pools.

### Separate local CODEX_HOME

Conceptually:

~~~text
production CODEX_HOME=/var/lib/botsquad/.codex
demo CODEX_HOME=/var/lib/botsquad-demo/.codex
~~~

This separates local credential/session storage, but if both are authenticated to the
same ChatGPT account, they still use the same external runtime account.

Do not copy credential files between instances. Use the supported login flow.

## Instance identity

A future implementation should give every HQ/service instance an explicit stable
instance ID, separate from company ID.

Example:

~~~text
botsquad_instance_id = production-hq
botsquad_instance_id = demo-hq
~~~

That would help with:

- logs;
- remote clients;
- approvals;
- backups;
- federation;
- push notifications;
- demo safety guards.

## Demo safety checks

Before an automated demo starts, verify:

~~~text
expected role = demo
data root = exact configured demo root
port = expected demo port
production data root is not the target
demo approval policy is loaded
~~~

If any check fails, stop.

Never infer safety from PORT=4311 alone.

## Reset and cleanup

Production reset target:

~~~text
/var/lib/botsquad
~~~

Demo reset target:

~~~text
/var/lib/botsquad-demo
~~~

Never use broad cleanup such as:

~~~sh
rm -rf /var/lib/botsquad*
~~~

because it could match both.

Use exact canonical paths plus an explicit instance-role guard.

## Historical first-demo recommendation

The original design recommendation below predates Demo 01. The explicitly authorized
existing-development-HQ exception above supersedes it for that tutorial; stronger
isolation remains appropriate for protected production use. The original proposal was:

~~~text
same installed BotSquad code
separate demo BOT_DATA_DIR
separate demo PORT
fresh demo database
development/simulated worker-identity backend
dedicated browser profile
no real root provisioning
no production approvals
~~~

This is sufficient for a truthful UI/tutorial workflow while minimizing risk.

For a dedicated Nix/approval tutorial that must demonstrate real provisioning, first
upgrade the isolation to either:

- a separately namespaced provisioner/worker stack; or
- a separate VM/server.

Do not use production worker identities merely to make the tutorial look realistic.

## Multiple instances versus multiple companies

These are different concepts.

Today:

~~~text
production instance -> one company/data directory
demo instance       -> one separate company/data directory
~~~

Deferred multi-company support, after the single-company operating evidence gate, may target:

~~~text
one BotSquad HQ
  ├── Company A
  ├── Company B
  └── Company C
~~~

Even after multi-company support, a disposable demo instance remains useful because it
provides a system boundary for tutorials/tests rather than just another company inside
production.

## Summary

Think about instance separation in layers:

~~~text
different PORT
    = different HTTP endpoint

different BOT_DATA_DIR
    = different BotSquad control-plane state

different service/systemd identity
    = stronger process/filesystem boundary

different provisioner/worker namespace
    = separate Prompt 04 host infrastructure

different VM/server
    = strongest simple infrastructure boundary
~~~

For ordinary tutorials, data-root + port separation is the starting point.

For demos that exercise privileged Prompt 04 provisioning, use a stronger boundary.

## Prompt 08 validation topology

The first group fixture uses `/var/lib/botsquad/validation/discussions-20261001-p08`
and loopback 4311. Its separate confirmation company uses the `-confirmation` suffix
and loopback 4312. Both inherit existing `botsquad` service confinement and configured
runtime account, but use independent HQ IDs, data and workers. This is data isolation,
not a new credential/Unix security boundary. Verify each fixture's HQ and workspace root
before every sequence. Original failed attempts and fenced workers are retained; a fresh
acceptance company never repairs their state. Production remains on loopback 4310.
