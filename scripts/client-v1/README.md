# Client API v1 reference consumer

Build with `npm run build`. Node 24 and an existing secure SSH tunnel are required.
The client has no database, browser-admin or protected approval shortcut. All client
requests go through `/api/v1`. See the [complete contract](../../docs/api/CLIENT_API_V1.md).

Use an explicit canonical temporary directory owned by you, mode 0700. The following
commands use illustrative placeholders; never put pairing secrets in shell arguments:

```sh
node dist/scripts/client-v1/cli.js http://127.0.0.1:4310 PRIVATE_DIRECTORY key
node dist/scripts/client-v1/cli.js http://127.0.0.1:4310 PRIVATE_DIRECTORY pair
```

The `pair` command reads the one-time pairing URI from stdin until EOF. Prefer a
private programmatic pipe; avoid terminal recording and shell history. Compare the
printed public fingerprint against Devices in the browser and confirm there. The
client stores only its private key and public identity in 0600 files. It checks the
HQ ID from the pairing payload against discovery, which is an identity consistency
check, not a TLS pinning claim.

Read once:

```sh
node dist/scripts/client-v1/cli.js http://127.0.0.1:4310 PRIVATE_DIRECTORY get /overview
```

For a workflow, use `session`, which accepts newline-delimited JSON on stdin and keeps
one short-lived token in memory. It does not create a bearer credential file:

```json
{"method":"GET","path":"/overview"}
{"method":"GET","path":"/workers"}
{"method":"POST","path":"/messages","body":{"body":"Communication only"},"key":"<TIMESTAMP.UUIDv4>"}
```

Persist each real request key and exact intent before sending. Use the same key on
retry; timestamps are current 13-digit Unix milliseconds. Session can generate a key
when omitted, but a client that needs lost-response recovery must supply a retained
key explicitly. Every POST result includes its key. For one POST, the command is
`post API_PATH REQUEST_KEY`, with JSON body on stdin.

`events [CURSOR]` streams bounded parsed notifications. Reconnect with the last handled
cursor, refetch on `reset_required`, and authenticate again after token expiry. The
exported `ClientV1` class supports explicit authentication, reads, keyed mutations and
streaming for acceptance harnesses. It imports no server implementation.

The four-unexpired-token ceiling means repeatedly launching one-shot commands is not
appropriate for a long workflow: use one session or one `ClientV1` instance. Separate
process invocations can authenticate again after expired slots clear.

Capabilities determine which routes succeed. Profile updates require both the desired
profile and current `expected_profile`; pause/resume requires `expected_paused`.
Interrupt uses an exact active execution ID. Remote approvals and device administration
are unavailable. Never put credential material in objectives or messages.

After testing, revoke the test device through Devices, verify access is denied, then
delete exactly that temporary directory's `device.pem` and `identity.json` files. No
private key or token belongs in Git or the published acceptance report.

## Operator acceptance tools

`acceptance.ts` runs from the workstation against a fresh Ubuntu instance through
an SSH tunnel. It uses an isolated Chrome context for visible pairing/confirmation/
revocation and the independent client for every native operation. It records only
public identities, request keys, timings and checks. Pairing payloads, signatures,
access tokens and private keys are never evidence outputs. Its restart/reboot gates
wait for an operator-created `continue-restart` / `continue-reboot` file containing
`continue` in the chosen evidence directory. The operator must first complete the
corresponding host action and readiness/idle checks. A real ten-minute token/stream
expiry is observed between these gates. Successful acceptance revokes both devices
and deletes their exact private key/configuration files. Failed evidence is retained.

`validate-ubuntu.sh EXACT_PUSHED_SHA` is a root-only launcher for the fixed Prompt 06
validation source/data/unit. It preserves the installed service restrictions and
refuses to overwrite an existing attempt. `regression-ubuntu.sh deterministic|prompt01`
runs the selected existing suite against this fixed checkout under those restrictions.
`preservation.py snapshot|compare INVENTORY_PATH` hashes original retained rows and
identity/root records without copying secrets into reports. These are operator
acceptance helpers, not remotely callable administration APIs.

`isolation-ubuntu.py` checks the retained paused HQ workers using harmless temporary
canaries and actual UID/GID drops. It never reads credentials, writes domain state or
modifies account/permission records; its exact canaries are removed in `finally`.
