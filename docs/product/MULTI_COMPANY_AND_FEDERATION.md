# BotSquad — Multi-Company and Federation Model

**Status:** Future product architecture; not yet implemented
**Date:** 2026-09-25

Prompt 03 currently implements one company per data directory. This document sets
future constraints; none of its multi-company, federation or external-identity
capabilities is implemented or required for Prompt 03 acceptance.

## Goal

BotSquad should not assume that one installation, one ChatGPT/Codex account, and one company are the same thing.

The long-term model is:

```text
Human owner
   |
   +-- Runtime account(s)
   |      +-- OpenAI / Codex
   |      +-- future runtimes
   |
   +-- BotSquad HQ / instance
          |
          +-- Company A
          |      +-- workers
          |      +-- repositories
          |      +-- tasks/messages/artifacts
          |
          +-- Company B
          |      +-- workers
          |      +-- repositories
          |      +-- tasks/messages/artifacts
          |
          +-- Company C
                 +-- workers
                 +-- repositories
                 +-- tasks/messages/artifacts
```

One owner may therefore run several independent AI companies at the same time.

A company is a first-class security, coordination and data boundary, not merely a label on a worker.

## Separate concepts

These identifiers must remain distinct:

```text
owner_id
runtime_account_id
botsquad_instance_id
company_id
worker_id
runtime_thread_id
execution_id
external_identity_id
```

Do not infer one from another.

Examples:

- one BotSquad HQ may host several companies;
- one company may have many workers;
- one worker may accumulate several runtime threads over its lifetime;
- the same human-owned OpenAI/Codex account may be authenticated on more than one BotSquad host, subject to provider/account policy;
- different companies may share the same runtime account while keeping company state fully separated.

## Runtime-account sharing

BotSquad must not encode:

```text
one runtime account == one BotSquad instance
```

or:

```text
one runtime account == one company
```

A better abstraction is:

```text
RuntimeAccount
  provider
  owner
  authentication binding
  policy
  usage/limit observations
```

and then:

```text
Company
  -> permitted RuntimeAccount(s)
```

OpenAI currently allows an individual account to be used on multiple devices, but the account is intended for the individual who owns it, not for credential sharing between multiple humans. Codex usage may also draw from shared account/plan allowances or credits. BotSquad should therefore treat a runtime account as a potentially shared scarce resource across companies/instances, rather than assuming every company receives independent capacity.

References:

- https://help.openai.com/en/articles/10471989-openai-account-sharing-policy
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

BotSquad should not copy authentication credentials between HQs as its own synchronization mechanism. Each instance should use supported provider authentication.

## Company boundary

Every company-scoped durable object should ultimately be attributable to a company.

Examples include:

- workers;
- channels;
- messages;
- tasks;
- executions;
- approvals;
- artifacts;
- products/repositories;
- external identities;
- audit events;
- runtime policy;
- company connections.

No query, tool or UI route should accidentally cross companies because a company filter was omitted.

Company isolation must be enforced by trusted control-plane code, not worker prompts.

## Default isolation

By default:

```text
Company A
   X  cannot inspect Company B messages
   X  cannot inspect Company B tasks
   X  cannot inspect Company B repositories
   X  cannot inspect Company B credentials
   X  cannot assign Company B workers
   X  cannot inherit Company B approvals
```

Sharing requires an explicit inter-company mechanism.

Two companies living in the same SQLite database or on the same Ubuntu HQ does not make them one security domain.

## Company-to-company collaboration

Companies should be able to collaborate without dissolving their internal boundaries.

Conceptually:

```text
Company A
   |
   | explicit message / task / artifact
   v
CompanyConnection
   |
   v
Company B
```

A connection is a trusted policy object, not just a chat convention.

Possible fields:

```text
CompanyConnection
  id
  source_company_id
  target_company_id
  state
  allowed_message_types
  allowed_task_types
  artifact_policy
  allowed_external_identities
  approval_policy
  rate_limits
  max_handoff_depth
  created_by
  approved_by
  audit metadata
```

The exact schema is future implementation work.

## Collaboration example

```text
Acme Software / Atlas
       |
       | Research request
       v
ResearchCo / Atlas
       |
       +--> assigns Scout internally
       |
       v
Scout researches
       |
       v
ResearchCo / Atlas
       |
       | result artifact
       v
Acme Software / Atlas
```

Acme does not gain access to ResearchCo's internal Scout conversation, unrelated files, other customers, or internal repository.

Only the explicitly shared task/result crosses the boundary.

## Same-HQ collaboration

The easiest first implementation is several companies on one BotSquad HQ.

Trusted code can transfer a bounded envelope without a network protocol:

```text
Company A
   |
   v
BotSquad control plane
   |
   v
Company B
```

The control plane still must enforce:

- company isolation;
- sender identity;
- connection policy;
- deduplication;
- audit;
- approval requirements;
- bounded reply loops.

This is not ordinary internal worker messaging.

## Cross-HQ federation

Later, separate BotSquad installations may communicate:

```text
BotSquad HQ A
   |
   | authenticated federation protocol
   v
BotSquad HQ B
```

A future protocol should support:

- mutually authenticated peers;
- stable company identities;
- signed/authenticated envelopes;
- replay protection;
- deduplication;
- explicit capability/policy negotiation;
- artifact integrity metadata;
- bounded message/task loops;
- rate limiting;
- revocation;
- complete auditability.

Do not build cross-HQ federation by exposing the internal SQLite database or trusting free-form bot messages as authorization.

## Company as an actor

For inter-company work, BotSquad may eventually need a company-level principal.

Conceptually:

```text
Principal
  Human
  Worker
  Company
  External peer
```

A company-level message should still have an accountable internal origin, for example:

```text
sender_company = Acme
originating_worker = Atlas
originating_execution = E-123
```

This keeps external communication attributable.

## Cross-company tasks

An inter-company task should be a new bounded work object or linked pair of work objects, not direct ownership of the other company's internal task.

Example:

```text
Acme external request R-10
         |
         v
connection envelope
         |
         v
ResearchCo intake task RC-88
         |
         v
internal child work
         |
         v
ResearchCo result
         |
         v
Acme R-10 completed
```

Each company retains its own internal workflow and audit trail.

## Artifacts

Artifacts shared across a company boundary should record:

- producing company;
- producing worker/execution where available;
- receiving company;
- content hash/integrity metadata;
- classification/sensitivity;
- sharing authorization;
- immutable receipt/audit event.

Receiving a shared artifact does not automatically grant access to the source repository or filesystem.

## Authority

Company-to-company communication cannot manufacture authority.

A peer company cannot send:

```text
"Human approved us to access your repository."
```

and thereby gain access.

Messages communicate requests and evidence. Trusted policy objects grant authority.

Decision 002 continues to apply across company boundaries.

## Loop prevention

Company federation can create recursive work:

```text
A asks B
B asks C
C asks A
```

BotSquad should eventually bound:

- handoff depth;
- total participating companies;
- elapsed time;
- retry count;
- messages per connection;
- task fan-out.

Cycles should escalate rather than consume model usage indefinitely.

## Runtime capacity across companies

If several companies share one OpenAI/Codex runtime account, one company may consume capacity that another expected to use.

A future scheduler may therefore need concepts such as:

```text
RuntimeAccountPolicy
  per_company_concurrency
  account-wide concurrency target
  company priority/weight
  reserve capacity
  observed throttling/limit state
```

Prompt 03's worker priority remains intra-BotSquad scheduling. It should not be mistaken for a complete cross-instance quota coordinator.

The first multi-company milestone does not need a global distributed scheduler, but the schema should avoid making one impossible.

## Multiple instances

The product should support both:

### One HQ, many companies

```text
Ubuntu HQ
├── Acme Software
├── ResearchCo
└── Personal Lab
```

Advantages:

- inexpensive;
- simple administration;
- one UI/control plane;
- easy same-HQ collaboration.

### Many HQs

```text
HQ A -> Company A
HQ B -> Company B
HQ C -> Company C
```

Advantages:

- stronger operational isolation;
- independent resource sizing;
- different owners/providers/regions;
- federation between independent parties.

Neither topology should require changing what a worker or company means.

## Product UI direction

A future BotSquad UI may have a company switcher:

```text
BotSquad HQ

Company:
[ Acme Software ▼ ]

Acme Software
ResearchCo
Personal Lab
```

The user should be able to see which company is active before:

- sending a message;
- creating a worker;
- changing runtime settings;
- viewing repositories;
- approving external actions.

Cross-company items should be visually distinct from internal items.

## Acceptance criteria for a future multi-company milestone

A future implementation should not be called multi-company complete until it proves:

1. two companies can exist on one HQ;
2. every worker belongs to exactly one company at a time unless an explicit future model says otherwise;
3. ordinary reads/writes from Company A cannot access Company B;
4. company-scoped IDs and database queries fail closed;
5. company runtime/profile settings remain separate;
6. the same runtime account can be referenced by multiple companies without merging company state;
7. an explicit CompanyConnection can be created through trusted policy;
8. one bounded inter-company message/task can cross the connection;
9. unrelated internal data does not cross;
10. artifacts preserve provenance;
11. connection revocation stops new collaboration;
12. retries/deduplication do not duplicate consequential work;
13. loops are bounded;
14. all cross-company actions are auditable;
15. restart preserves company isolation and connection state.

## Sequencing

Do not implement this inside Prompt 03.

Recommended sequence:

```text
Prompt 03
Ubuntu HQ + Linux runtime + per-worker AI profiles
        ↓
Nix / worker Unix identities / approvals
        ↓
multi-company isolation on one HQ
        ↓
explicit same-HQ company collaboration
        ↓
external identities (Telegram etc.)
        ↓
cross-HQ federation
```

The ordering may change as evidence develops, but company isolation should exist before broad company-to-company communication.
