# INV-ASK-AUTHORITY-01 — Dormant finite authority and attempt acceptance

**Status:** Final bounded source checks pass. Delivery: [PR85](https://github.com/eugenelin89/bot_messenger/pull/85); its GitHub record is authoritative for final head/checks/merge. This is one component
of ASK-02, not genuine employee routing or public Ask readiness.

Implementation: `79944d158362e07287c052c2b0e8c60e07cdd59d`.

## Implemented and reviewed boundary

[Decision049](../../decisions/decision_049_private_ask_authority_custody.md) records separate
strict finite Ask metadata, independent SQLite/checkpoint custody, consumed budget across grants
and services, exact worker/provider ownership and distinct model/network uncertainty. The transport
adds a synchronous metadata-only pre-wire hook, frozen safe answer identity and post-hook authority
and monotonic-deadline rechecks. No dependency, canonical contract or Company schema changes.
No operational initializer, runtime permit, caller, grant, model execution or public intake exists.

The [machine receipt](../evidence/inv-ask-authority01/acceptance.json) binds all424 exact source/reference-document hashes and14 complete raw-log wrappers. Final
build/typecheck/contracts pass; focused69/69 and affected regression316/316 pass (**385/385**,
zero failures/cancellations/skips). The initial regression315/316 failed because the disposable
checkout lacked README at Company construction; all actual reference documents were supplied
for the final rerun, without changing implementation or assertions. The original failure is retained. Linux tests use the botsquad service user, Node24.21.0, a512MiB heap
and nice10 in disposable `/var/tmp/botsquad-ask-authority-AatS9Q` on the production host, as the
owner requested. They never address the retained production Company/authority/content files.
The live investment service remains the existing d262a8d build and is not restarted for this packet.

## Review findings and disposition

- Lost-wire response observations cannot resolve earlier effects. Transient503/404 outcomes remain
  unknown; later polls require fresh attempts. Matching receipts resolve only named attempts with
  the same frozen answer identity, using an observed successful source and one immutable disposition.
- Model uncertainty is separate. Successful answer reconciliation leaves unknown model/claim work
  held, without refund, regeneration or worker substitution.
- Per-process ownership, revocation-before-wire, global spent limits across midnight, semantic replay,
  immutable rows, path/sidecar/inode/mode checks and committed-SQL/failed-checkpoint custody are tested.
- The original16MiB physical ceiling could not accommodate10000 maximum-sized events. It is now a
  bounded512MiB ceiling, with page-size assertion and conservative row/index overhead comparison.
- The first near-cap test had already observed its wire response and missed a required durable slot.
  Final capacity accounting reserves both observation and reconciliation. The revised fixture starts
  unobserved at9994 and uses normal admit/transmit/settle/observation/receipt/revoke APIs to10000,
  while new work is rejected. The long setup is explicitly authored fixture history, not real traffic.
- The transport's monotonic deadline catches synchronous persistence stalls that delay timer callbacks.
  Hook failure or a returned thenable sends zero HTTP bytes and reports conservative uncertainty.

Read-only architecture, security, recovery and test specialists reviewed their respective risks.
The test reviewer independently verified all424 source/reference hashes and14 wrapper/raw-log
hashes, exact final counts and the retained staging failure with no discrepancy. Final exact-head GitHub checks/reviews and merge result remain distinct from advisory reviews and
will be recorded with the delivery PR. Historical intermediate logs are preserved, not overwritten.

## Operational limits and concrete continuation

The strict proof schema is not evidence that a deployed provider supports hard token/cost caps or
public service. Pinned Codex0.157 has no included-only switch or turn/start output-token parameter;
its current adapter monitors tokens. The product's subscription activity-cap alternative therefore
needs an explicit coordinated contract/authority variant, with unknown actual cost, honest monitored
thresholds/overshoot and a hold on missing usage or threshold violation. Preserve strict modes.
A paid API account is a historical recommendation, not a new mandatory owner approval milestone.

Continue through actual existing workers and the ordinary shared dispatcher: typed Ask origin,
separate finite permits, isolated ephemeral public context, deterministic provenance/topic/follow-up
routing, private-content/control integration, one immutable answer/outbox and exact signed receipt
reconciliation. Confirm provider context retention, actual capability/eligibility, host backup/privacy
custody, restart generation and genuine general/contextual/follow-up/denied-action acceptance before
public intake. No canned answer or supplied test proof establishes those results.

Production investment activation and initial public archive publication occurred independently using
already-deployed d262a8d. Exact real evidence is in the [morning handoff](../../operations/INV-REAL-01.md).
Historical Linux observed actions/revision stage timing failure remains unresolved; these Ask tests
do not convert it to a pass. No actual market/model work had occurred at the activation checkpoint.
