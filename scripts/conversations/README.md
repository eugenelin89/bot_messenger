# Prompt 07 real validation

These are explicit operator tools, not worker tools or production startup hooks.
They require the configured private Ubuntu HQ and Chrome on the workstation. No new
dependencies or runtime pin are introduced.

1. Push an exact owned feature revision. Review the fixed source/data/unit paths in
   `validate-ubuntu.sh`; it refuses to overwrite an existing run. Execute it as root
   on the existing HQ with that 40-character SHA. It inherits the production unit's
   restrictions, uses loopback 4311 and fresh validation data, and leaves dispatch paused.
2. Copy only `fixture.json` from that new data directory to a local evidence directory.
   Open `ssh -N -L 4311:127.0.0.1:4311 botsquad`. This is data isolation within the same
   service UID/runtime account/provisioner namespace, not a separate security tenant.
3. Set `BOT_CONVERSATIONS_URL=http://127.0.0.1:4311` and optionally
   `BOT_CONVERSATIONS_EVIDENCE=/absolute/evidence/directory`. Run
   `npm run validate:conversations -- direct`, then `peer`, `rollover`, `controls`.
   Each phase uses actual Chrome interactions for primary actions and trusted read-only
   APIs to verify state. It verifies roster/workspace and stable HQ identity before work,
   writes request IDs immediately, refuses completed-phase replay, and retains failures.
4. For the controlled prepared-context crash, write `arm-prepared-crash.json` only in
   the validation root, containing `{"conversation_id":"THE_RECORDED_MAYA_ID"}` with
   mode 600 and ownership `botsquad:botsquad`. Run phase `crash`. The fixture wrapper
   records the actual newly created provider reference, renames the marker and exits
   75 before activation/turn invocation. Wait for that evidence and the unit's stopped
   state, then explicitly restart it and run phase `recovery`. Run `idle` last; it
   observes ten idle seconds and pauses validation dispatch.
5. Run `regression-ubuntu.sh MODE` on the host for `deterministic`, `prompt01`,
   `identity`, `projects`, and `recovery` as applicable. It creates fresh evidence roots
   and bounded systemd jobs under the same validation restrictions. Inspect `exit-code`
   and `console.log`; source changes require rebuilding before rerunning affected checks.
6. Preserve databases, provider transcripts, runtime-input captures, manifests, screenshots
   and failed attempts. Stop/disable the temporary service when done. Do not delete old
   runs or reset their IDs to repeat a demonstration. A new complete run needs explicitly
   chosen fresh validation paths/fixture expectations; review those paths before launch.

The roster is an explicitly labelled trusted fixture using normal role/hiring rules.
No model generated those setup executions; their interrupted/cancelled status says so.
All conversation turns and the before/after task use the real pinned Codex adapter.
No expected transcript is supplied. Assertions concern attribution, ownership, bounds,
substantive answers and preserved facts, rather than a canned answer.

`migrate-offline.mjs` opens only a protected `/var/backups/botsquad/prompt07-*/offline/company.sqlite`
copy. It checks every original row/column/rowid, foreign keys and repeat-start migration.
It never starts Company, HTTP, a runtime or a second authenticated HQ. Create the copy
with SQLite's backup API to account for WAL correctly.
