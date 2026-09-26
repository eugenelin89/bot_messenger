# BotSquad Demo Operator and Guided Tutorials

**Status:** Accepted future product/testing direction; not yet implemented  
**Updated:** 2026-09-26

## Purpose

BotSquad should support an automated **Demo Operator**: a clearly labeled simulated
human operator that interacts with BotSquad through the same user-facing control
boundaries as a real person and records a truthful tutorial/demo of the resulting
workflow.

The goal is not to impersonate a real human. The goal is a reproducible operator
simulation that can:

- demonstrate BotSquad to a new user;
- generate tutorial screenshots/video;
- produce a readable transcript;
- verify that the UI and workflow still behave as documented;
- exercise supported human-facing interfaces rather than hidden database shortcuts.

## Core rule

The Demo Operator should use the same supported operator surfaces that a person would use.

Preferred:

~~~text
Demo Operator
     |
     | browser / trusted human-facing API
     v
BotSquad UI / control plane
     |
     v
disposable demo instance
~~~

Avoid direct SQLite mutation, private internal shortcuts, fabricated state, or bypassing
authorization merely to make a demo succeed.

## Separate demo instance

Automated demonstrations should run against a dedicated BotSquad instance rather than
the retained production company.

Conceptually:

~~~text
production instance
  data: /var/lib/botsquad
  UI:   127.0.0.1:4310

demo instance
  data: /var/lib/botsquad-demo
  UI:   127.0.0.1:4311
~~~

A separate data directory gives the demo its own database, tasks, messages, workers,
executions, artifacts, pause state and runtime-binding records. A separate port lets
the two HTTP servers run simultaneously.

This is control-plane isolation, not automatically complete Prompt 04 host-infrastructure
isolation. See [Multiple BotSquad Instances](../operations/MULTIPLE_INSTANCES.md).

## Demo modes

### Text-first walkthrough

Run a scripted scenario and record each meaningful operator action and observed state.

~~~text
00:00 Opened BotSquad demo HQ
00:06 Initialized Atlas
00:13 Assigned product objective
00:40 Maya started specification
01:17 Turing accepted delivery
01:42 Linus and Ada began engineering
02:26 Grace reviewed exact submissions
03:02 Trusted integration passed
~~~

### Browser-driven tutorial

Drive the actual BotSquad web UI. Capture screenshots at meaningful stages and verify
the state being narrated.

If observed state differs materially from the scenario, stop and record the failure
instead of continuing with a false tutorial.

### Recorded walkthrough

A browser-driven run can also capture video while producing synchronized text and
machine-readable evidence.

Suggested artifacts:

~~~text
docs/tutorials/<demo-name>/
├── README.md
├── transcript.md
├── events.json
├── screenshots/
│   ├── 01-dashboard.png
│   ├── 02-objective.png
│   ├── 03-workers.png
│   ├── 04-approval.png
│   ├── 05-review.png
│   └── 06-complete.png
└── demo.mp4
~~~

Large binary video does not necessarily belong in Git. Keep the script, transcript,
selected screenshots and reproducible generation instructions in the repository; video
storage/release policy can be decided separately.

## Story-driven scenarios

### Product walkthrough

A first tutorial could:

1. start a fresh demo instance;
2. initialize Atlas;
3. assign a small product objective;
4. show Maya preparing requirements;
5. show Turing coordinating delivery;
6. show Linus and Ada working concurrently;
7. show execution provenance;
8. show Grace reviewing exact commits;
9. show trusted integration;
10. show final company/task status.

Until Prompt 05 generalizes repositories, this scenario should stay compatible with the
currently supported bounded engineering workflow.

### Nix and approval walkthrough

A second tutorial can explain Prompt 04 visually:

~~~text
worker needs infrastructure
        |
        v
Nix receives infrastructure task
        |
        v
Nix requests typed protected operation
        |
        v
trusted approval appears
        |
        v
Demo Operator reviews exact scope
        |
        v
Approve
        |
        v
provisioner performs bounded operation
        |
        v
worker infrastructure becomes ready
~~~

This is useful because it makes the difference between a bot request, human approval
and trusted root execution visible.

## Approval policy for demos

The Demo Operator may approve only operations explicitly declared by the demo scenario.

A demo must never become a general automatic approver.

Example conceptual allowlist:

~~~text
allowed_demo_approvals:
- create validation worker identity X
- prepare validation clone Y
~~~

Anything outside the exact scenario should stop the demo for inspection.

## Self-verifying tutorials

Each scripted step should include an expected state.

Example:

~~~text
action:
  assign objective

expect:
  task exists
  assignee = Atlas
  status in [queued, working]
~~~

Later:

~~~text
expect:
  Linus execution completed
  Ada execution completed
  source commits exist
  Grace reviewed exact commits
  integration tests passed
~~~

If an assertion fails, capture evidence and mark the demo failed.

This turns the tutorial into an end-to-end UI acceptance test.

## Recording model

A single run should ideally produce:

~~~text
human-readable transcript
+
machine-readable event log
+
screenshots
+
optional video
~~~

Suggested event fields include timestamp, step ID, operator action, UI target, expected
state, observed state, result, screenshot reference and related task/execution/approval
IDs.

Never include secrets, session tokens, Codex authentication material or production data.

## Demo instance lifecycle

Preferred lifecycle:

~~~text
create fresh demo state
      |
      v
start demo service
      |
      v
run scripted tutorial
      |
      v
verify final state
      |
      v
retain selected sanitized artifacts
      |
      v
stop/archive/reset demo instance
~~~

Demo cleanup must never target production.

## Operator identity

Automation should identify itself in logs/evidence as something like:

~~~text
BotSquad Demo Operator
automated simulated human
~~~

Do not represent automated actions as actions personally performed by a named human.

A future implementation may introduce a dedicated demo/test human principal or bounded
automation principal if authorization requires it. Do not weaken the existing
trusted-human boundary just to enable automation.

## Security invariants

The Demo Operator must not:

- touch production data;
- mutate production SQLite;
- reuse production approvals;
- approve unexpected protected operations;
- use root directly;
- access the provisioner outside its normal trusted path;
- fabricate result state;
- expose credentials in screenshots/transcripts;
- disable sandboxing, approval, identity or idempotency controls.

## Relationship to Computer Use

The Demo Operator can eventually use the bounded Computer Use infrastructure planned
for Prompt 08.

Do not pull Prompt 08 into an earlier milestone merely to build tutorials.

Before then, a dedicated test-browser driver is acceptable if it stays inside the same
human-facing application boundary.

## Relationship to native clients

The same tutorial scenario should eventually be executable through the web UI or future
iOS client.

Keep scenarios expressed as domain actions where possible:

~~~text
initialize company
assign objective
inspect workers
review approval
inspect result
~~~

Then separate drivers can map those actions to browser selectors or native UI controls.

## Possible developer command

A future implementation may provide a command such as:

~~~text
npm run demo:tutorial
~~~

Conceptually it would create an isolated demo instance, start it, open a dedicated
browser, run the scripted operator, capture artifacts, verify assertions, and shut the
demo instance down.

This command does not exist yet.

## Roadmap placement

The Demo Operator does not yet have a fixed prompt number.

It depends primarily on safe instance isolation and stable supported UI/control-plane
operations. It becomes especially useful after Prompt 05 generalizes projects and can
later benefit from Prompt 08 Computer Use.

Treat it as a reusable testing/tutorial capability without renumbering the canonical
Prompt 05–12 roadmap unless an explicit roadmap decision changes that sequence.
