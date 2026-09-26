# Decision 010 — Companies are isolated first-class domains with explicit federation

**Date:** 2026-09-25  
**Status:** Accepted as future product architecture

## Context

BotSquad is evolving from one demonstration company into a platform that may run several independent AI companies for one human owner.

One BotSquad HQ may host multiple companies, and a human may also operate multiple BotSquad HQs. The same human-owned runtime account may be usable from multiple supported clients/hosts, so runtime authentication must not be conflated with company identity.

Companies may eventually need to collaborate, including across separate BotSquad instances.

Without an explicit boundary, multi-company support could accidentally leak messages, tasks, repositories, credentials, approvals or runtime authority between organizations.

## Decision

A **Company** will be treated as a first-class coordination/security domain.

Company-scoped data and authority must be explicitly attributable to `company_id` or an equivalent trusted boundary.

Default behavior is isolation.

Cross-company collaboration requires an explicit trusted connection/policy object. Messages, tasks and artifacts may cross that boundary only through allowed operations; ordinary worker messages cannot manufacture cross-company authority.

The domain model must not assume:

```text
one BotSquad instance == one company
one runtime account == one company
one runtime account == one BotSquad instance
```

A future same-HQ implementation may support several companies in one control plane. A later federation protocol may connect companies on different HQs.

External transports such as Telegram may carry federation messages, but they remain adapters. They are not the source of company authority or organizational truth.

## Consequences

- future persistence migrations must make company scope explicit;
- internal queries/tools must fail closed across company boundaries;
- a company switcher/active-company context will eventually be required in the human UI;
- runtime-account configuration must be separate from company identity;
- shared runtime capacity may need future account-level scheduling/usage policy;
- inter-company tasks should preserve independent internal workflows on both sides;
- shared artifacts require provenance and explicit sharing authority;
- connection revocation must stop new cross-company collaboration;
- bot-authored messages cannot create company connections or human approvals;
- loop prevention/rate limiting is required for inter-company automation;
- cross-HQ federation must use authenticated/replay-resistant protocols rather than database sharing;
- Telegram or another messaging provider may be an integration transport, not the canonical domain model.

See:

- [Multi-Company and Federation Model](../product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](../product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)
