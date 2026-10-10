# References and baseline evidence

**Reviewed:** 2026-10-06 | [Guide](README.md)

These references support current implementation facts and implementation constraints. The proposed investment design is not evidence that those new features already exist. Verify changing provider terms, software/runtime support and live deployment state again before implementation or activation.

## Current cross-repository implementation (October 9, 2026)

The dated 2026-10-06 repository snapshots below are historical feasibility baselines, not current implementation status. For living ownership and accepted handoffs, use:

- [BotSquad investment roadmap](ROADMAP.md) — authoritative milestone status and dependency sequence; INV-05 is implemented for synthetic-only local acceptance; INV-06 is next and not started.
- [BotSquad canonical contract](../../../contracts/investment/v1/PROTOCOL.md) — contract 1.0; the Asymmetri receiver vendors nine matching pinned files.
- [Asymmetri website and receiver repo](https://github.com/eugenelin89/asymmetri) and [cross-repo integration map](https://github.com/eugenelin89/asymmetri/blob/main/docs/BOTSQUAD_INTEGRATION.md) — current consumer code, runtime boundaries, operational state and release gates.
- [Asymmetri receiver runbook](https://github.com/eugenelin89/asymmetri/blob/main/docs/INVESTMENT_RECEIVER.md) — Ed25519, SQLite/CAS and disabled private installation.
- [INV-04 accepted Asymmetri validation](https://github.com/eugenelin89/asymmetri/blob/main/docs/INV-04-VALIDATION.md) and [BotSquad milestone handoff](../../validation/investment/INV-04.md) — the full synthetic UI exists in source, not on the public production website.
- [INV-03 private TLS ingress record](https://github.com/eugenelin89/asymmetri/blob/main/docs/INV-03-INGRESS.md) — isolated stream profile accepted, public shared-443 exposure unapproved.

## Repository baseline

### BotSquad

Reviewed main: `ce99212c882327ad8e04fd3603867ac18428e1a4`.

- [README at the reviewed commit](https://github.com/eugenelin89/bot_messenger/blob/ce99212c882327ad8e04fd3603867ac18428e1a4/README.md): current capability overview, private HQ and important limits.
- [Actual domain types](https://github.com/eugenelin89/bot_messenger/blob/ce99212c882327ad8e04fd3603867ac18428e1a4/src/domain/model.ts): worker profiles/capabilities, Task kinds and artifact records. Investment roles/tools are not present by merely naming a worker as an analyst.
- [System architecture](../../architecture/SYSTEM_ARCHITECTURE.md): trusted control plane, persistence, current role hierarchy and shared execution boundaries.
- [Working groups](../../architecture/WORKING_GROUPS.md): real discussion, participant context and explicitly shared evidence.
- [Company operating loop](../../architecture/COMPANY_OPERATING_LOOP.md): bounded mandates, authoritative observations and durable scheduling.
- [Public research tutorial](../../operations/PUBLIC_RESEARCH_TUTORIAL.md): eligible-worker grants, source provenance and separate discussion permission.
- [Decision 025](../../decisions/decision_025_bounded_business_operations.md): bounded supervised business-action scope; not a generic publication grant.
- [Decision 026](../../decisions/decision_026_personal_operator_stabilization.md): Personal Operator priority and no automatic core Prompt 12.
- [Canonical product roadmap](../../product/ROADMAP.md): completed core milestones and current priority.
- [Milestone prompt requirements](../../../prompts/authoring/MILESTONE_REQUIREMENTS.md): acceptance and preservation conventions for future Codex work.

### Asymmetri website

Verified main reference: `c8908b144c7e26aa737f0a74ed92b6fa08fc1309`. README content blob: `4ca8d95cddde51694cbc8ad7b18d2abf064e705c`.

- [README at the reviewed commit](https://github.com/eugenelin89/asymmetri/blob/c8908b144c7e26aa737f0a74ed92b6fa08fc1309/README.md): Next.js production behind Nginx/systemd, retained Vinext packaging, protected routes and absence of an existing experiment database/API.
- [Deployment guide](https://github.com/eugenelin89/asymmetri/blob/c8908b144c7e26aa737f0a74ed92b6fa08fc1309/docs/DEPLOYMENT.md): existing standard Next.js production path; inspect live state before changes.
- [CLI access](https://github.com/eugenelin89/asymmetri/blob/c8908b144c7e26aa737f0a74ed92b6fa08fc1309/docs/CLI_ACCESS.md): established Mac SSH access and scope boundaries.
- [Website agent instructions](https://github.com/eugenelin89/asymmetri/blob/c8908b144c7e26aa737f0a74ed92b6fa08fc1309/AGENTS.md): site preservation, Git/journal workflow and explicit deployment requirement.

Repository access is not fresh SSH verification. This design task did not inspect or change either live server, obtain credentials, or create a production grant.

## Primary implementation sources

| Source | Why it matters |
| --- | --- |
| [RFC 9421 — HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421) | Standard signature components and signature-base processing; define and test a narrow profile rather than inventing one |
| [RFC 9530 — Digest Fields](https://www.rfc-editor.org/info/rfc9530/) | Content-Digest semantics for exact message content integrity |
| [RFC 8785 — JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) | Canonical semantic event hashing, distinct from raw HTTP body hashing |
| [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) | HTTPS, authorization, input validation, bounded errors and content-type handling |
| [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Generated storage names, allowlisted types, limits and safe storage/rendering boundaries |
| [SQLite Online Backup API](https://www.sqlite.org/backup.html) | Supported consistent database snapshot/backup approach |
| [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Possible primary filing/company-fact evidence source; not an execution-price feed |
| [NYSE hours and calendars](https://www.nyse.com/trade/hours-calendars) | Regular sessions, holidays and early closes; use actual calendar semantics rather than weekdays |
| [NYSE market-data policies and contracts](https://www.nyse.com/market-data/pricing-policies-contracts-guidelines) | Market-data use/display/redistribution rights require specific review; public accessibility alone is insufficient |
| [Alpaca paper-trading documentation](https://docs.alpaca.markets/us/docs/paper-trading) | Example of a provider explicitly distinguishing paper behavior and limitations from live execution |

Alpaca is a limitations reference, not a selected provider or required account. The local simulator described here does not depend on a brokerage paper account. No market-data plan, price or right is presumed from these links. INV-01 documented historical candidate providers but did not select an operational market-data source. **[Decision 029](../../decisions/decision_029_zero_cost_market_data.md) now requires a US$0 incremental market-data budget and permits only rights-verified free APIs or bounded lawful web extraction.** INV-06 must establish actual free-source automated/internal use and separate public/derived/storage rights for the exact fields, charts, excerpts and retained history. Historical INV-01 paid-provider prices remain provenance, not the selected sourcing plan.

## Source discipline

Keep research facts, model interpretations, simulation assumptions and verified software results distinguishable. Do not reproduce paid news bodies or restricted datasets in public artifacts. Link and summarize only within applicable permissions. Public-domain or publicly accessible material still needs provenance and safe handling; a disclaimer does not create redistribution rights.

External references can change. Record date/version and relevant terms in the implementation evidence rather than treating this reference list as permanent legal or runtime clearance.
