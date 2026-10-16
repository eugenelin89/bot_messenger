# Decision 056 — Publication renewal and clean restart

Date: 2026-10-15. Status: accepted; PR 106 deployed at `dccf209`, actual clean restart verified. Receiver renewal explicitly approved and applied; the new-key heartbeat and clean restart under the renewed grant passed on October 16 at 05:24 UTC.

The genuine Trade rerun completed and published its reviewed HOLD decision. Its next accounting stages are on October 16, but the existing publisher key and grant expire October 15 at 23:40 UTC. The owner authorized the repairs and allowances needed to finish the run.

The protected observed publisher configuration may contain one optional `additionalKey` with exactly `keyId`, `privateKeyPath`, `notBefore`, and `notAfter`. Both keys use the same canonical private-file checks, Ed25519 validation and independent validity intervals. IDs must differ. Worker messages and HTTP input cannot configure these keys. The existing owner rotation control selects the active key; receiver registration remains a separately coordinated operation. No private key leaves HQ.

Clean restart authenticates the last delivered receipt using the **current active grant** and channel key. It charges two new receipt/status read attempts to that grant, checks the existing rights/scope/expiry/allowance and independent custody boundaries, and never rewrites the delivered anchor's historical grant, body or receipt. This matches ordinary restore reconciliation. Otherwise renewing consent revokes the historical grant and strands the next clean restart before it can use the current authorization.

A renewal keeps the same publisher, experiment, run, generation, event allowlist, audience and content scope. Old attempts remain consumed. New publication allowance is recorded by a new explicit grant; financial/source/model history is not changed. The receiver retains old keys and receipts, with the old key expiring at its original boundary. No fabricated event is emitted to manufacture a newer anchor.

Validation covers legacy and overlapping configuration, exact expiry boundaries, unsafe files/keys, successful rotated-key renewal restart with immutable old rows, and no-wire denial for expired grant/key, narrower event scope and insufficient allowance. Existing restart tamper and watermark tests remain required. Genuine deployment and renewal evidence belong in the October 15 owner-renewal record.
