# Decision 048 — Private Ask content custody

**Date:** 2026-10-13
**Status:** Accepted for the dormant source component; operational integration remains incomplete
**Scope:** Dormant INV-ASK-02 storage component; no operational admission or employee authority

Visitor questions and employee answers must not enter ordinary Company databases, audit logs
or backups. Retrying after a crash must preserve question ownership and the exact answer;
missing bytes or a restored database must never authorize another model execution.

## Storage and commit boundaries

Schema27 adds passive Company service, import and control-application metadata. Explicit
columns contain IDs, hashes, immutable deadlines, lifecycle state and the canonical minimal
answer receipt. Claim/prepared-request JSON, visitor text, answer text and arbitrary errors
are excluded. Startup and migration create no content directories, services, grants or work.

`AskPrivateContent` coordinates a separate `AskContentStore` with no attached or nested
cross-database transaction. Import first commits Company identity, then private content, then
verified availability. Answer generation is outside this component: it accepts supplied bytes,
reserves one immutable answer identity in Company, atomically commits its body and disabled
outbox privately, then records completion. An exact duplicate can converge an interrupted
commit. A reservation without its answer remains unresolved and cannot regenerate it.

Every prior history ID must belong to the same service, session and conversation. Only
accepted completed turns are included, with bounded history size and explicit omitted expired
turns. No visitor HTTP endpoint or Company/dispatcher/runtime caller is installed.

## Custody and deletion

The operator must provide a canonical private directory outside the actual Company directory
and every configured ordinary backup root. Paths are owned/private; files are regular,
single-link and inode-bound; dangling symlinks and unexpected WAL/SHM are rejected. SQLite
uses DELETE journals, secure_delete, full synchronous commits and memory temporary storage.
A persistent store UUID binds both databases. Missing/mismatched custody fails closed. An
orphan persists a service hold before cleanup and cannot become fresh work after its deletion.

Every retained privacy control, including already acknowledged controls, is applied by
Company suppression, then an atomic private tombstone/deletion, then an application receipt.
A discarded/withheld answer receipt also closes local access and deletes bodies/outbox without
waiting for another control page. Corrupt, missing or contradictory committed content remains
held, including after privacy suppression and retention expiry. Held identities cannot be
pruned merely because their raw content has been deleted.

Cleanup binds the exact Company Store, service, journal instance and generation. It remains
possible when admission is disabled or limits tighten; it supplies no freshness or authority.
Content access additionally requires matching current scope/limits, enabled permission and a
fresh control barrier verified against the content clock. Restart invalidates old callbacks.

Retention starts at the original receipt time and can only shorten. Pending imports count
against the 512 active-import cap. Raw question+answer UTF-8 payloads are capped at 8 MiB,
Company import identities at 10000, services at 8, and control/tombstone records at 100000.
Private SQLite also has a 4096-page cap. Expired reconciled identities can be retired after
the suppression horizon; uncertainty is retained and capacity fails closed.

## Explicit limits

SQLite row deletion does not prove filesystem, swap, backups or provider erasure. Path
exclusion does not prove the host's backup configuration. Simultaneous rollback of both
stores cannot be detected without independent custody. `contentPurgeVerified` and
`restorationVerified` remain false; no claim of full physical purge or restore acceptance is
made. Exact finite Ask grants, consumed-budget custody, frozen signed attempts, genuine
employee attribution, safe execution contexts, host retention guards and recovery-generation
coordination remain required before wiring this component.

See [acceptance](../validation/investment/INV-ASK-CONTENT-01.md),
[execution plan](../exec-plans/investment-inv-ask-content-01.md) and
[current operations](../operations/INV-REAL-01.md).
