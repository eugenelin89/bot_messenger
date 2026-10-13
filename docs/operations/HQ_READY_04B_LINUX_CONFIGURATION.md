# HQ-READY-04B — proposed Linux configuration

**NOT INSTALLED / NOT LINUX-VALIDATED.** This appendix makes the proposed systemd and
filesystem changes reviewable. [B1 and D1](HQ_READY_04B_APPROVAL_PACKET.md) block deployment.
The exact replacement source, fixture driver, independent backup destination and verified
Linux Python distribution remain prerequisites. These files are documentation, not host tools.

## HQ trial drop-in

Proposed `/etc/systemd/system/botsquad.service.d/90-hq-ready-04b.conf`:

```ini
[Service]
LimitCORE=0:0
MemoryHigh=768M
MemoryMax=1G
MemorySwapMax=0
KillMode=control-group
TimeoutStopSec=25
ReadWritePaths=/run/botsquad-private-research/hq-ready-04b-aapl-20261014
```

This adds to the existing `/var/lib/botsquad` write allowance; it does not reset the list
or weaken other hardening. Create the tmpfs path first. Keep runtime selection in a
**separate** root-controlled drop-in, created only after real finite approval:

```ini
[Service]
Environment=BOTSQUAD_FINITE_HQ_AUTHORITY=hq-ready-04b-aapl-20261014
```

Removing the selector does not erase external consumption or authorize an ordinary-runtime
fallback for the research scope. Keep global owner Pause through setup and collection;
release it explicitly only as specified in the approval packet.

## Independent guard and failure stop

Proposed `/etc/systemd/system/botsquad-research-guard-hq-ready-04b.service`:

```ini
[Unit]
Description=Finite private research guard for HQ-READY-04B
After=systemd-tmpfiles-setup.service
StartLimitIntervalSec=120
StartLimitBurst=5
OnFailure=botsquad-research-failure-stop.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/botsquad
Environment=PATH=/opt/botsquad-runtime/node/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/opt/botsquad-runtime/node/bin/node /opt/botsquad/dist/scripts/private-research-guard.js hq-ready-04b-aapl-20261014
ExecStopPost=/usr/bin/systemctl stop botsquad.service
Restart=on-failure
RestartSec=1
TimeoutStopSec=40
KillMode=control-group
LimitCORE=0:0
MemoryHigh=192M
MemoryMax=256M
MemorySwapMax=0
UMask=0022
StandardOutput=null
StandardError=null
```

Proposed `/etc/systemd/system/botsquad-research-failure-stop.service`:

```ini
[Unit]
Description=Stop whole HQ when private research supervision fails

[Service]
Type=oneshot
User=root
Group=root
ExecStart=/usr/bin/systemctl stop botsquad.service
TimeoutStartSec=40
LimitCORE=0:0
StandardOutput=null
StandardError=null
```

No `PartOf=botsquad.service`, shared Slice or mutual stop dependency: the guard must survive
HQ stopping and remain able to perform later cleanup. No `NoNewPrivileges`/capability drop
is assumed for this root unit: its accepted helper uses `runuser`. Root runtime/import
custody is mandatory before start. Source writes only sanitized state; null output avoids
accidental content logging, and non-content lifecycle/unit-status receipts must still be
captured independently. Test SIGKILL, stop failures, restart limits, root→service UID drop,
helper descendants and deadline completion. An exit/status alone cannot prove deletion.

Do not enable automatic production startup during the maintenance/trial window. Record
and temporarily disable the existing HQ boot enablement after D1; no implicit reboot
resume is approved. After reboot or guard identity loss, keep HQ stopped and let the
reviewed cold-recovery procedure establish expiry/cleanup before any HTTP listener or
dispatch. Starting a restarted guard may enforce stop/cleanup but never renews its
original approval identity. Restore original boot enablement only after verified closure.
These proposed failure units need actual Linux acceptance; they are not a tested guarantee.

## Exact path and access intent

| Path | Proposed access |
| --- | --- |
| `/opt/botsquad`, guard/imported modules and Node target/ancestors | Root-owned, no service/group/other write, no untrusted ACL, canonical target chain; same-version Node reinstall required because observed binary is UID1001 |
| `/run/botsquad-private-research` | Separate256MiB tmpfs, root0755, `nodev,nosuid,noexec` |
| `/run/botsquad-private-research/hq-ready-04b-aapl-20261014` and `codex`, `tmp` | UID997/GID987 mode0700; service writable through exact HQ drop-in |
| `/etc/botsquad` | Preserve root0700 plus a named botsquad traversal-only ACL; no directory listing or unrelated file read |
| `/etc/botsquad/private-research` | Root-owned, botsquad traversal/read of nonsecret manifests only, no service write; retain no writable ancestors |
| Exact authority manifest | Root-owned0644 under protected traversable ancestors; no secrets |
| `/run/botsquad-research-guard` and exact lease | Root0755 directory/0644 file; service read, no service write |
| Finite authority/checkpoint under service passwd home | Existing fixed paths; service0700 directories/0600 files; independent current custody excluded from rollback |

Do not issue recursive ACL/chown against `/etc/botsquad` or worker homes. Record exact
prechange ACLs and restore trial-only additions. Set manifest schema1, authority ID,
`hqRoot=/var/lib/botsquad`, `hqUid=997`, service `botsquad.service`, expiry02:00Z and
retainUntil02:50Z October15 only after verified host/exclusion evidence. Initial guardPid0
is bound once by the guard; hash the resulting canonical manifest after initialization.

Fixture substitution must use its own passwd home and HQ/data/auth paths. The accepted
code hardcodes `botsquad.service`; do not mistake an alternate service name or only a
BOT_DATA_DIR change for equivalent coverage. The actual fixture UID, unit override, short
fixture manifest times and driver must be reviewed before the stopped-service substitution.
Do not place real credentials, production transcripts or Yahoo observations in fixtures.

## Verification and reversal

Before data: `systemd-analyze verify` the exact files, inspect effective `systemctl show`,
`/proc` soft/hard core limits, cgroup memory/swap settings and descendants, globally empty
`/proc/swaps`, tmpfs type/size/permissions, root code ACLs, actual service manifest readability
and Git trust. Test guard failure with authored markers and verify cold cleanup plus
database/WAL/runtime absence. Record peak memory and cleanup durations. No actual Linux
acceptance has been run in04B.

After verified purge: retire guard and failure unit while HQ remains stopped, remove exact
trial drop-ins, unmount the empty research tmpfs, restore saved ACLs/resource/boot/swap/broker/
pause settings, retain non-content manifest/custody/closure evidence, then start ordinary
schema24-compatible HQ. Never delete a spent journal or use this reversal to downgrade a
post-consumption database. A failed cleanup keeps the service stopped.
