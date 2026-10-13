# INV-ASK-SUBSCRIPTION-01 — Explicit subscription activity capability

**Status:** Bounded source validation, specialist evidence review and pinned candidate consumer review pass.
This is a dormant ASK-02 component, not operational worker routing or public intake.

[Decision050](../../decisions/decision_050_ask_subscription_activity_limits.md) adds an explicit
activity-capped subscription mode while preserving included-only and verified-cap behavior.
Its canonical policy discloses monitored token thresholds, possible overshoot/internal retries,
unavailable cost and a hold on missing usage or threshold breach. Cost is null, never fabricated
zero. Complete excessive usage is atomically retained and blocks later admission across grants,
services, restarts and answer reconciliation. Token reservations are never refunded.

The [machine receipt](../evidence/inv-ask-subscription01/acceptance.json) binds424 exact source and
reference-document hashes and15 complete log wrappers. The affected Ask/contract suite ran397
checks:396 passed, zero failed, one optional synthetic receiver interop case skipped because its
separate fixture was unconfigured. After review added one included-only lifecycle/reopen test,
the final rebuild typechecked all source and the affected authority file passed32/32. The rest of
the suite was unchanged; the32 include31 cases already counted. Typecheck and canonical generation
checks passed. This is neither a full repository regression nor a receiver integration pass.

Validation used Node24.21.0, service user botsquad, serial tests,512MiB heap and nice10 in disposable
`/var/tmp/botsquad-ask-subscription-tcQava` on the production host. The retained Company, portfolio,
independent investment authority, live publisher and service PID759078 were untouched.

Two earlier failures are preserved. The first suite had185 failures because AJV strictRequired
rejected an allOf conditional; a direct conditional with an explicit policy schema fixes the source.
The next passed253/254, with only the root example catalogue check failing: the nested policy had
incorrectly been added as a root response. Removing that example restores the unchanged wire roots.
No assertion was relaxed. Missing telemetry, component-only overruns, mixed-mode null money,
rolling24hour boundaries, late settlement, checkpoint failure, receipt independence and both
strict legacy paths are covered in the final source.

Canonical manifest SHA256:
`27f73af2099dc086ebf1893bb2613c5a8f18200b752d8d48960107386cb40264`.
Only AskLimits changes and AskSubscriptionActivityPolicy is added. Every other schema definition,
root, route, signature vector and prior golden/response example remains unchanged. The new enum is
an explicit pinned-package extension in the existing1.0 family; older consumers reject it. The
website writer receives the exact manifest and must adopt matching validation/disclosures before
this mode is selected. Actual provider eligibility and capability proofs cannot be fixture booleans.

Next implement the real employee path: private import and control synchronization, deterministic
roster routing, typed shared dispatcher origin, isolated ephemeral provider context, real telemetry,
private immutable answer/outbox and signed receipt reconciliation. Claim/renew/status/control
success needs narrow durable reconciliation tied to committed local effects; HTTP200 alone cannot
clear unknown wire state. Keep investment and Ask authority separate. Historical observed-workflow
Linux timing acceptance, provider retention/eligibility, operational backup custody and genuine
visitor trials remain incomplete. No deployment or public opening is claimed by this packet.

Security and recovery specialists found no source blockers. The test specialist independently
verified all424 source hashes,15 wrapper/raw hashes and counts, including the added legacy case.
The website writer reports236 receiver and15 browser-logic tests against the frozen candidate
in an isolated copy, with the expected strict/new-mode rejection behavior. Those are counterpart-
reported checks, not a parent rerun or production adoption; final vendoring awaits the merged HQ commit.
