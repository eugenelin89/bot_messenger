# Feature preservation

| Old destination / feature | New location | Preserved contract |
| --- | --- | --- |
| Executive channel / objective | Activity → Team updates; global New task | Passive message and explicit Task remain different writes |
| Attention | Home summary; Tasks → Needs your attention | Same authoritative projection and exact destination |
| Tasks / artifacts / retry / cancel | Tasks → task details | Same IDs, result reads, inspected retry and restrictions |
| Organization / roster / hierarchy | Team / Reporting hierarchy | Persistent identities, portraits and relationships |
| Employee AI profile / usage | Team → profile → Advanced employee details → AI settings; AI usage and cost | Same model discovery, human lock and future-work semantics |
| Research / knowledge permissions | Team → profile → Permissions & research | Separate explicit grants, scope and revocation |
| Conversations / threads | Team → Conversations; profile shortcut | Passive vs requested reply, retained history, context lineage |
| Working Groups | Team → Discussions | Charter, explicit start, bounded turns, synthesis, separate assignment |
| Company Mandates / schedules / business actions | Projects → Ongoing goals | Exact envelope, decisions, approvals and schedule identities |
| Projects & repositories | Projects → Software projects | Create/import/register, scopes, reviews, integration, release/archive |
| Executions | Activity → Work sessions; task advanced details | Exact attempts, origins, runtime, usage and interruption |
| Audit history | Activity → Advanced audit | Original event records retained |
| Approvals | Settings → Approvals; attention links | Exact immutable infrastructure/publication scope |
| Infrastructure | Settings → Infrastructure | Nix, provision/retire/reconcile/health controls |
| Devices / Remote Clients | Settings → Devices | Pairing secret, fingerprint review, ceilings, revocation |
| Computer Sessions | Tasks → Browser work | Exact session authorization, screenshots, revoke/interrupt/cleanup |
| Investment run | Projects → Investment | Existing portfolio, schedule, orders, valuations and evidence |
| Investment team | Investment → Team permissions | Existing scope/preview/consent; no new authority |
| Investment publication | Investment → Publication | Exact bytes, grants, receipts, fences and reconciliation |
| Historical tutorials / screenshots | Original locations labelled historical | Preserve original evidence; link current guide |
| Ask | Settings / Investment explanatory text | Remains owner-paused; no calls or activation |

All 17 shell destinations and three existing Investment routes remain available. The 82-test browser gate verifies navigation plus existing conversation, discussion, mandate, Computer, approval, device, research, publication, investment and usage controls. Navigation/profile tests assert zero unintended writes, model calls and runtime catalog probes. Source changes do not touch backend/domain/schema/contracts. Production preservation and served-asset evidence are recorded separately in RELEASE-REPORT.md.
