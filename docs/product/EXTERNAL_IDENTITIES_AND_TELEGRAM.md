# BotSquad — External Identities and Telegram Integration

**Status:** Future product architecture; not yet implemented  
**Date:** 2026-09-25

## Goal

A BotSquad worker should be able to have optional external communication identities without making those identities the worker's core identity or the source of authority.

Conceptually:

```text
Worker
  |
  +-- internal BotSquad identity        always
  |
  +-- ExternalIdentity[]                optional
         |
         +-- Telegram bot
         +-- email address
         +-- Slack/Teams identity
         +-- future channels
```

Telegram is the first concrete external-identity candidate because Telegram supports bot accounts that do not require phone numbers, managed bot creation, and explicit bot-to-bot communication.

Official references:

- https://core.telegram.org/bots
- https://core.telegram.org/api/bots
- https://core.telegram.org/api/bots/managed-bots
- https://core.telegram.org/api/bots/bot-to-bot

## Telegram bot, not human Telegram account

BotSquad workers should use Telegram **bot accounts**, not simulated human/user accounts.

Telegram documents bots as special accounts that do not need phone numbers.

This gives a worker a recognizable external identity such as:

```text
@Atlas_Acme_bot
@Maya_Acme_bot
@Scout_ResearchCo_bot
```

without requiring a SIM/phone number for every worker.

Do not design BotSquad around automated creation or operation of ordinary human Telegram accounts.

## Optional, not universal

Not every worker needs Telegram.

Example:

```text
Atlas       Telegram ✓
Maya        Telegram ✓
Sales       Telegram ✓
Support     Telegram ✓
Linus       Telegram -
Ada         Telegram -
Grace       Telegram -
```

Internal engineers may never need a public/external messaging identity.

Telegram identity is a capability attached to a worker, not a requirement for worker existence.

## Data model

A future model could be:

```text
ExternalIdentity
  id
  company_id
  worker_id
  provider
  provider_identity_id
  public_handle
  credential_ref
  status
  inbound_policy
  outbound_policy
  allowed_peers
  created_at
  retired_at
```

For Telegram:

```text
TelegramBotIdentity
  external_identity_id
  telegram_bot_id
  username
  manager_bot_id?
  bot_to_bot_enabled
```

Secrets do not belong in normal worker/profile records.

## Credentials

Telegram bot tokens must be held by trusted BotSquad credential/integration code.

Do NOT expose raw Telegram bot tokens to:

- Codex prompts;
- worker messages;
- artifacts;
- logs;
- Git repositories;
- other companies.

Preferred flow:

```text
Atlas
   |
   | send_external_message(...)
   v
BotSquad Telegram Gateway
   |
   | credential_ref -> secret store
   v
Telegram API
```

The AI requests an action. Trusted BotSquad code selects the credential, validates policy, sends the request and records the result.

This is the same architectural principle planned for SSH/infrastructure credentials.

## Managed bots

Telegram now documents **managed bots**: a user can create bots owned by that user and controlled by a designated manager bot.

This could map naturally onto a future BotSquad Telegram integration:

```text
Human Telegram owner
       |
       v
BotSquad Telegram Manager Bot
       |
       +--> Atlas bot
       +--> Maya bot
       +--> Support bot
       +--> Sales bot
```

Telegram's current API still keeps bot creation under user ownership/consent. Only users invoke the low-level create-bot method; bots/Mini Apps can request a managed-bot creation flow.

BotSquad should therefore model creation as a human-authorized onboarding action rather than pretending a worker can silently manufacture unlimited Telegram identities.

Official reference:

https://core.telegram.org/api/bots/managed-bots

## Ownership limits

Telegram exposes bot ownership limits through platform configuration and may apply different limits depending on account status.

Do not hard-code a permanent numeric ownership limit into BotSquad.

Instead:

- treat Telegram bot count as an external provider constraint;
- surface creation failures clearly;
- allow company policy to assign Telegram only to workers that need it;
- support one company-level Telegram identity where individual identities are unnecessary.

Reference:

https://core.telegram.org/api/config

## Bot-to-bot communication

Telegram documents an explicit Bot-to-Bot Communication Mode.

Depending on Telegram context/configuration, bots can communicate:

- in groups/supergroups;
- in private bot-to-bot chats when the required mode is enabled;
- through supported business-account chat flows.

This creates an interesting future BotSquad federation transport:

```text
Acme / Atlas bot
      |
      | Telegram
      v
ResearchCo / Atlas bot
```

Official reference:

https://core.telegram.org/api/bots/bot-to-bot

## Telegram is not the internal BotSquad message bus

Do NOT replace internal BotSquad messaging with Telegram.

Internal work remains:

```text
BotSquad
  messages
  tasks
  events
  artifacts
  audit
```

Telegram is an external adapter:

```text
Worker
  |
  +--> BotSquad internal communication
  |
  +--> Telegram external communication
```

If Telegram is unavailable, internal BotSquad coordination should continue.

Telegram delivery should never become the only durable record of a company task.

## Telegram and company federation

Telegram may be one transport for inter-company collaboration, but it is not the authority layer.

Example:

```text
Acme Atlas
   |
   | BotSquad creates external envelope
   v
Acme Telegram Gateway
   |
   v
Telegram
   |
   v
ResearchCo Telegram Gateway
   |
   | authenticate/map sender
   v
ResearchCo BotSquad intake
```

The receiving BotSquad must map the Telegram identity to a known CompanyConnection/peer policy before treating the message as a trusted federation message.

An arbitrary Telegram bot message cannot:

- grant repository access;
- create human approval;
- expand capability;
- create credentials;
- spend money;
- change company policy.

Telegram proves transport identity only to the extent BotSquad has securely bound that provider identity. BotSquad policy still determines authority.

## Public/user conversations

Telegram bots generally cannot initiate ordinary conversations with arbitrary human users; users normally need to contact the bot or add it to a relevant chat first.

BotSquad should not treat Telegram as an unsolicited-outreach/spam channel.

External messaging should remain:

- user-initiated where Telegram requires it;
- policy-controlled;
- rate-limited;
- auditable;
- subject to Telegram terms and platform limits.

Reference:

https://core.telegram.org/bots

## Inbound messages

A Telegram update should enter BotSquad as untrusted external content.

Conceptually:

```text
Telegram update
    |
    v
verify webhook/update source
    |
    v
map bot identity + chat + peer
    |
    v
apply ExternalIdentity/CompanyConnection policy
    |
    v
create bounded inbound event/message
    |
    v
optional task creation only through configured rule
```

A raw inbound message should not automatically wake expensive workers or create consequential tasks unless policy says it is a valid trigger.

This preserves the core invariant:

> communication is not execution.

## Outbound messages

A worker should request a typed operation such as:

```text
send_external_message(
  external_identity,
  destination,
  message,
  related_task,
  justification
)
```

Trusted code should validate:

- the worker owns/may use that identity;
- the destination is allowed;
- the company connection permits the message;
- approval requirements are satisfied;
- rate limits are satisfied;
- the message is associated with an execution/task;
- no secret is being unintentionally exposed where practical.

## Loop prevention

Telegram bot-to-bot communication can create infinite reply loops. Telegram explicitly recommends deduplication, rate limits, maximum interaction depth and timeouts.

BotSquad should additionally enforce:

- message IDs / deduplication keys;
- max reply depth;
- max bot-to-bot messages per task;
- max elapsed conversation duration;
- cooldowns;
- company connection quotas;
- escalation when a loop limit is reached.

Reference:

https://core.telegram.org/api/bots/bot-to-bot

## Audit model

Every Telegram action should be attributable.

Outbound audit fields may include:

```text
company_id
worker_id
execution_id
task_id
external_identity_id
provider
destination
provider_message_id
timestamp
policy/approval reference
delivery state
```

Inbound messages should record analogous provenance.

Do not log raw bot tokens.

## Human controls

The human should eventually be able to:

- attach/detach a Telegram identity;
- rotate/revoke a bot token;
- disable inbound messages;
- disable outbound messages;
- restrict allowed peers/chats;
- require approval for new contacts;
- inspect recent external communication;
- suspend all external communication for a company.

Retiring a worker should not silently orphan an active external identity. The retirement workflow should explicitly transfer, disable or archive it.

## Company-level versus worker-level identities

Support both eventually.

### Worker identity

```text
@Atlas_Acme_bot
```

Useful when the external party should know which worker is speaking.

### Company identity

```text
@Acme_Bot
```

Useful when:

- Telegram bot ownership limits matter;
- the company wants one public contact;
- BotSquad should route inbound messages internally.

The company identity could internally route:

```text
@Acme_Bot
    |
    +--> sales -> Sales worker
    +--> support -> Support worker
    +--> partnership -> Atlas
```

BotSquad should not require one external account per internal worker.

## Federation transport versus canonical protocol

Even if Telegram works well for initial company-to-company experiments, it should not become BotSquad's canonical federation protocol.

Telegram is:

```text
one ExternalTransport adapter
```

A future direct BotSquad federation API may offer:

- stronger structured task semantics;
- richer artifact transfer;
- explicit capability negotiation;
- stronger replay/deduplication controls;
- provider independence.

The company-federation domain model should therefore sit above Telegram.

## Acceptance criteria for a future Telegram milestone

A future implementation should not be called complete until it proves:

1. Telegram identity is optional;
2. worker identity and Telegram identity are separate records;
3. token material is never exposed to normal worker prompts/logs;
4. one worker can send a permitted outbound Telegram message through trusted code;
5. one inbound Telegram message maps to the correct company/worker/channel;
6. arbitrary inbound text does not grant authority;
7. internal BotSquad messaging works if Telegram is unavailable;
8. identities cannot be used across company boundaries without policy;
9. rate limiting and loop prevention work;
10. provider message IDs/delivery results are auditable;
11. token rotation/revocation is supported;
12. worker retirement handles external identity lifecycle;
13. bot-to-bot communication is bounded;
14. restart does not duplicate outbound consequential messages;
15. no Telegram token appears in retained evidence.

## Sequencing

Telegram should come after the core Ubuntu/infrastructure and company-boundary foundations.

Recommended direction:

```text
Ubuntu HQ
   ↓
Nix / worker Unix identity / approvals
   ↓
multi-company company_id isolation
   ↓
company connections
   ↓
external identity framework
   ↓
Telegram adapter
   ↓
optional Telegram-based inter-company experiment
   ↓
direct cross-HQ BotSquad federation
```

This keeps Telegram useful without making the core product dependent on one external communication provider.
