# Publication, discussion and artifacts

**Version:** 1.0 | **Status:** Proposed, not implemented | [Guide](README.md)

## 1. Public by deliberate scope

Existing BotSquad conversations, working groups, research histories and artifacts are private unless explicitly shared under their current rules. The investment experiment adds a separate **public audience permission**. A research grant, group membership, strategic mandate, prior GitHub-document approval or model-authored `public: true` is insufficient.

The owner grants one publisher access to one destination/run, specifies eligible record classes, worker participation, source/export policy, limits and expiry, and sees a projection preview before activation. Signing and transport remain trusted operations. New software and migrations create no grant.

Compose experiment work in a dedicated public-audience scope, persist real contributions, validate provenance/content and publish approved projections automatically within the standing envelope. The owner need not approve each ordinary message after deliberately granting that envelope. Suspect material remains withheld for review.

Private direct conversations and unrelated project contexts are excluded. Selected private material needs a separate reviewed export before entering a public discussion. A public session must not inherit private provider context from an unrelated task or conversation. Automated secret scanning is defense in depth, not proof that arbitrary private text is safe; the primary control is intentionally public source/context selection.

## 2. Genuine discussion

Publish explicit contributions and public-facing explanations, not hidden model reasoning, system instructions, provider traces or raw context. Preserve actual text, author and original contribution time. Trusted started/completed events are visually distinct from worker speech.

No invented participants, fabricated back-and-forth, prewritten conclusions or artificial chatter during idle time. A public summary is a separately labelled artifact linked to real contributions, never a simulated verbatim exchange.

Private provenance maps each public record to the originating worker, execution, work object and exact committed source version. Public identity is assigned by trusted code from the authorized roster, not free-form identity fields. Publication checks the run binding, active grant, audience, current source rights, type/length limits, safe rendering and allowed references.

Retrieved content is untrusted evidence. An article cannot alter publication rules or request export of files. A rejected/suspicious output gets a safe state and owner attention rather than bypassing the gate to make the live panel more engaging.

## 3. Every experiment deliverable is accounted for

Register research reports, analyses, group syntheses, independent reviews, decision rationales, retrospectives and generated charts. Registry states are `registered`, `awaiting_publication`, `published`, `withheld`, `failed`, `superseded` and `withdrawn`.

A deliverable is publicly accounted for only when its registry entry has an exact-version link or a safe explicit reason it cannot be shown. Feed and related work link to that entry. Unsuccessful or inconvenient analysis is not silently omitted. This requirement never authorizes every artifact on the HQ or unrelated projects.

A public derivative is distinct from its source. A reviewed excerpt has a new ID/hash and is labelled partial; it is not presented as the complete original. Source/derivative correspondence remains in private provenance, with safe public origin descriptions.

## 4. Metadata and URLs

Published versions contain public artifact ID, positive version, title, author, created/published times, content type, byte size, SHA-256, related public work, sources, rights status, limitations and supersedes reference. Exclude private paths, credentials, provider thread IDs and private query histories.

Canonical human URL:

`/botsquad/investment/artifacts/{artifactId}/versions/{version}`

An unversioned index may point to latest, but past decisions always link exact versions. A revised report retains the original and explains why it changed. Content-addressed storage provides integrity, not authorization to retrieve a guessed hash.

## 5. Storage

Use SQLite for public metadata, relationships, event bodies and receipts; use a generated content-addressed filesystem store for larger artifact bytes. Small text in SQLite is acceptable, but the selected split makes file lifecycle and a future object-storage adapter explicit.

Proposed root: `/var/lib/asymmetri-experiments/content/`, outside Git and not directly exposed as a directory. A storage interface owns verified write, published read, stat, withdrawal and integrity checks. Object storage can later implement the same interface without changing public artifact URLs. No external storage account is required for v1.

Stream to a generated temporary file under size limits, verify hash/type, flush bytes and atomically rename on the same filesystem. Commit metadata only after durable bytes exist. No database transaction spans upload. A crash before metadata creates a nonpublic orphan, not a broken public link.

Uploads require authenticated exact run scope. Never fetch an arbitrary supplied artifact URL or use its filename as a disk path. Serve through metadata-aware routes that enforce type and visibility. Direct hash URLs must not bypass withdrawn/unpublished state.

## 6. Allowed formats

| Type | First-release policy |
| --- | --- |
| Plain text / Markdown | Bounded UTF-8; raw HTML disabled; safe sanitized rendering |
| JSON | Validated structure and formatted/table rendering; never executed |
| PNG | Type/signature/dimension checks and metadata-safe normalization; hash the actual public bytes |
| CSV | Generated from validated data with formula-like cells neutralized |
| HTML, uploaded SVG, executable files, archives | Not accepted as artifact bodies |
| PDF, office files and other types | Explicit unsupported/withheld state until a reviewed renderer/sanitizer exists |

This does not prohibit trusted website chart code from rendering SVG; it prohibits arbitrary active uploaded content on the site origin. Disable remote image embeds in Markdown. Allow only safe HTTPS source links, without credential-bearing URLs. Use correct Content-Type, download disposition where appropriate, `nosniff`, restrictive content policy and safe errors. See [References](REFERENCES.md).

Proposed public limits are 128 KiB text/JSON and 4 MiB normalized PNG, always bounded by any lower existing HQ limit. Each transformation creates a derivative hash/version. Oversized content is rejected or explicitly reauthored, never silently truncated under its original identity.

## 7. Publication sequence

1. Register the experiment deliverable and resolve its exact source version.
2. Recheck source/audience rights; create immutable public-safe bytes and metadata.
3. Retain the derivative and outbox dependencies at HQ.
4. Upload bytes; receiver verifies and stages them, still nonpublic.
5. Send artifact metadata through the signed event contract.
6. Receiver atomically commits metadata/read models after confirming durable bytes.
7. Publish referring messages/decisions afterward, or later in the same valid batch.
8. Show exact-version links and retain receipts without changing the original task result.

Retries reuse the same hash/version. A lost upload response does not regenerate the report. Missing bytes block links. A failed website upload does not replay a successful research execution.

## 8. Corrections, withdrawal and retention

Ordinary analytical errors are corrected through new versions and review events. Bad reasoning, losing trades and genuine disagreement remain history.

Privacy/security/rights problems require a separate owner-only withdrawal path: disable public body/downloads, replace with a safe tombstone, invalidate caches and preserve an appropriate protected audit. Retention of sensitive bytes itself must follow the applicable requirement; append-only financial accountability is not a reason to retain prohibited material forever.

Revocation stops future transmission and late delivery but cannot recall data already downloaded. Explain this during consent. Emergency withdrawal must work despite HQ backlog and cannot be performed with ordinary publisher authority. Safe public withdrawal notices preserve the fact of intervention without repeating sensitive details.

Trial and official runs have distinct IDs/storage references. Never overwrite a trial to make an official record. Retain published history by default. Unreferenced staging objects may be cleaned after a documented grace period, proposed seven days, only after checking upload/outbox dependencies. Published objects are never deleted simply for being old.

## 9. Acceptance

Prove authentic author/time attribution, preserved dissent, public/private separation, every-deliverable accounting, exact-version links, duplicate upload safety, crash-safe bytes/metadata ordering, unsafe-content denial, emergency withdrawal/cache invalidation and restoration of both metadata and bytes. See [Validation](VALIDATION.md).
