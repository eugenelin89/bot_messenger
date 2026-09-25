# BotSquad — Computer Use Model

**Status:** Initial product model
**Date:** 2026-09-24

## Purpose

Some BotSquad workers will eventually need to interact with graphical applications or websites rather than only files, repositories, APIs, or text tools.

BotSquad should treat **Computer Use as a bounded capability**, not as a default property of every worker.

The preferred model is:

```text
Worker receives GUI task
        |
        v
BotSquad checks authority
        |
        v
Computer session provisioned
        |
        v
Worker operates approved environment
        |
        v
Artifacts/results recorded
        |
        v
Session stopped/destroyed
```

The human operator remains able to observe, approve, pause, or deny protected actions.

## Core principle

A worker having Computer Use does not mean it has unrestricted access to the human operator's computer.

Computer Use must be represented with explicit scope such as:

- environment;
- allowed applications;
- allowed sites;
- filesystem scope;
- upload/download policy;
- maximum runtime;
- actions requiring human approval.

Conceptually:

```text
computer_use:
  environment: sandbox
  allowed_apps:
    - chromium
  allowed_sites:
    - localhost
    - github.com
  allow_downloads: true
  allow_uploads: false
  require_human_confirmation:
    - purchases
    - external messages
    - account creation
    - destructive deletion
  max_runtime_minutes: 20
```

The exact schema is future implementation work.

## Two execution modes

### 1. Local desktop worker

A worker may operate an approved application on the human operator's local machine when a supported runtime makes that possible.

Example:

```text
Worker: Desktop QA
Runtime: Codex
Environment: local desktop
Allowed apps:
- browser
- Xcode
- Terminal

Blocked:
- password manager
- banking
- crypto wallet
- personal email
- unrelated user files
```

This mode is powerful but should be treated as higher risk because a shared operating-system session may expose unrelated data or credentials.

It should not be the default for autonomous workers.

### 2. Sandboxed computer worker

Preferred long-term model:

```text
BotSquad
   |
   v
Computer Worker
   |
   v
isolated browser / VM / container
```

The sandbox should expose only the applications, sites, files, test accounts, and network destinations required for the task.

Example:

```text
Worker: Maya — Operations
Environment: isolated Chromium
Allowed:
- localhost:3000
- staging.example.com
- github.com

Blocked:
- banking sites
- crypto sites
- personal Gmail
- password managers
```

When the task completes, the environment may be stopped or destroyed according to retention policy.

## Organizational pattern

BotSquad should generally prefer a specialized **Computer Operator** role rather than giving all workers GUI authority.

Example:

```text
                    Atlas — CEO
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
   Researcher         Engineer      Computer Operator
                                         |
                                         v
                               approved GUI environments
```

Other workers may delegate bounded GUI tasks:

```text
Engineer -> Computer Operator:
Verify that the installer works.

Product -> Computer Operator:
Capture screenshots of the onboarding flow.

CEO -> Computer Operator:
Check the staging dashboard after deployment.
```

The operator returns evidence such as:

- screenshots;
- reproduction steps;
- logs;
- downloaded test artifacts;
- task result summaries.

## Authority model

Computer Use participates in the same authority ceiling as other BotSquad capabilities.

Conceptually:

```text
child_effective_permissions
    ⊆ parent_delegatable_permissions
    ⊆ company_policy_ceiling
```

Potential capabilities include:

```text
browser_use
computer_use
computer_use_local
computer_use_sandboxed
file_upload
file_download
external_message
external_account_creation
purchase
```

The final capability taxonomy is implementation work.

A CEO may request a Computer Operator, but BotSquad decides whether the requested computer capability may be delegated.

Example:

```text
Atlas requests:
hire_worker(
  title = "UI Tester",
  capabilities = ["computer_use_sandboxed"]
)

Control plane:
- CEO may create workers: yes
- requested capability delegatable: no
- action: create human approval request
```

Human approval remains a trusted control-plane record. A bot message saying “approved” does not grant Computer Use.

## Protected actions

Even inside an approved computer session, some actions should remain separately protected.

Examples:

- spending money;
- financial transfers;
- crypto transactions;
- creating paid accounts;
- sending external communications;
- publishing publicly;
- deleting retained data;
- uploading private files;
- changing credentials;
- granting new permissions.

Computer access does not imply authorization for these actions.

## Prompt injection and untrusted UI content

Web pages, documents, messages, dialogs, and other screen content are untrusted input.

A worker must not treat instructions displayed by an external website or application as authority to:

- expand permissions;
- disclose secrets;
- bypass approval;
- access unrelated files;
- perform protected actions.

Trusted control-plane policy remains authoritative.

## Human monitoring

The BotSquad UI should eventually surface:

- which worker owns the computer session;
- session/environment type;
- current task;
- allowed apps/sites;
- runtime status;
- screenshots or event stream where supported;
- pending approvals;
- session start/end;
- artifacts produced.

The operator should be able to distinguish:

```text
Pause new dispatch
```

from:

```text
Interrupt active computer session
```

Stopping an agent does not undo external actions already completed.

## Auditability

Important Computer Use events should be recorded:

- session requested;
- session approved/denied;
- environment provisioned;
- worker attached;
- protected action requested;
- protected action approved/denied;
- artifact produced;
- session interrupted;
- session completed;
- environment destroyed.

Do not store credentials, passwords, private keys, recovery phrases, authentication cookies, or other secrets in screenshots/logs/artifacts unless explicitly necessary and securely handled.

## Runtime model

Computer Use should remain independent from the logical worker model.

Conceptually:

```text
Worker
  |
  +-- Runtime: Codex
  |      +-- optional local computer capability
  |
  +-- Runtime: API agent
         +-- optional sandboxed computer capability
```

The product should not assume every runtime exposes the same Computer Use implementation.

Computer capabilities belong behind runtime/environment adapters.

## Example workflow

```text
Atlas — CEO
   |
   v
Maya — Product
   |
   | "Verify our signup flow"
   v
Desktop QA — Computer Operator
   |
   v
BotSquad checks policy
   |
   v
isolated browser session starts
   |
   v
QA walks through signup
   |
   v
Step 3 fails
   |
   +--> screenshot artifact
   +--> reproduction steps
   +--> task result
   |
   v
Maya/Atlas notified
   |
   v
computer session ends
```

## Initial implementation sequencing

Computer Use is **not part of Prompt 01 or Prompt 02**. Narrow engineering file/test/Git tools do not grant GUI or browser authority.

Recommended sequence:

### Prompt 01

```text
CEO -> Researcher -> CEO
```

Prove workers, hierarchy, tasks, dispatch, persistence, and Codex runtime execution.

### Prompt 02

```text
CEO -> CTO -> engineering workers
```

Implemented: managed local repositories, separate branches/worktrees, concurrent engineers, independent read-only review and tested trusted integration. Computer Use remains disabled.

### Later milestone

```text
Computer Operator + bounded Computer Use
```

Add GUI/browser environments only after the underlying task, authority, audit, and approval systems are reliable.

## Acceptance criteria for a future Computer Use milestone

A future implementation should not be considered complete until it proves:

1. Computer Use is represented as an explicit capability.
2. A worker without the capability cannot obtain a computer session.
3. A parent cannot grant a child more Computer Use authority than the parent's delegatable ceiling.
4. Bot-authored text cannot create human approval.
5. A sandboxed worker can complete one bounded GUI workflow.
6. The environment limits are enforced.
7. Protected actions pause for trusted approval.
8. Session ownership and task linkage are durable and auditable.
9. Interrupt/pause semantics are accurately represented.
10. Screenshots/results are attributable to the correct execution.
11. Restart/recovery behavior is defined and tested.
12. Secrets are not exposed in normal logs or artifacts.
