# UX-01 — Existing HQ audit

Baseline: `7341ff09dc2e58e6ab8aab66c80e590cde58b2c1`. Audit began October 15, 2026 (Vancouver). Source: `public/index.html`, all imported UI modules, HTTP routes, Company snapshot and attention projections. Runtime: healthy private Ubuntu HQ plus isolated browser inspection of 14 shell views. Isolated capture data is explicitly sample data; no provider calls or writes occurred during navigation. Live source/running build identities are recorded in the execution plan.

## Navigation and capability inventory

The opening screen is Executive channel. The rail has 17 equally prominent destinations, followed by the employee roster. There is no Home or global New task control.

| Existing page / capability | Observed classification | Main issue / proposed location |
| --- | --- | --- |
| Executive channel; passive message and Atlas objective | Functional local HTTP/UI; real retained tasks/messages | Two different actions in one composer; Activity → Team updates, New task separately |
| Attention and exact-source actions | Functional source and browser; two live actionable records | Useful operational truth buried as one of 17 destinations; Home + Tasks |
| Tasks / task details | Functional with retained completed results | Full technical fields and attempts precede results; Tasks |
| Employee roster, profiles and hierarchy | Functional; difficult to discover responsibilities | Profile initially waits on model catalog and leads with settings; Team |
| Direct and peer conversations | Functional UI and retained history | Thread/context vocabulary dominates; Team → Conversations |
| Working groups | Functional isolated UI; retained accepted runtime evidence | Discussion vs assignment needs explanation; Team → Discussions |
| Company mandates, cycles and schedules | Functional isolated UI and existing backend | Advanced lifecycle mixed with basic navigation; Projects → Ongoing goals |
| Software Projects/repositories, scopes, reviews and integration | Functional UI; operation-specific controls require approved policy | Projects are software repositories, not arbitrary task folders; keep that distinction |
| Work sessions / executions and usage | Functional retained records | Completed response can be mistaken for completed Task; Activity → Work sessions |
| Audit events | Functional display of authoritative event records | Too noisy for ordinary progress; Activity → Advanced audit |
| Approvals and publication reconciliation | Functional exact-envelope controls | Beginner cannot tell where approval originates; contextual attention + Settings |
| Infrastructure / Nix / identities | Functional controls; protected actions not executed by audit | Technical operation details dominate; Settings → Infrastructure |
| Devices / remote clients | Functional pairing UI; enrollment not exercised in audit | Administration belongs in Settings |
| Computer sessions | Functional UI; no production browser authority inferred | Advanced bounded browser assignment; Tasks → Browser work |
| Investment run / portfolio / private research / legacy setup | HTTP 200 on live HQ; retained observed-paper operation | Many separate kinds of evidence and authority need an orientation; Projects → Investment |
| Investment team | HTTP 200; exact scope/permission setup retained | Configuration should be contextual to Investment |
| Investment publication | HTTP 200; retained signed publication evidence | Exact byte consent must remain explicit; contextual to Investment |
| Onboarding / help | Markdown tutorial exists; no useful in-app beginner workflow | Add contextual Help; update authoritative first-assignment tutorial |
| Ask BotSquad | Installed but owner-paused; not an active HQ workflow | Accurately state paused; no activation or probes |

“Functional” above is bounded to the named observation. Page availability does not prove a protected action, provider turn, financial operation or complete user journey. Detailed pre-existing acceptance is retained in `docs/validation/`; UX-01 adds its own final evidence.

## Current journeys and unnecessary complexity

New task: Executive channel → distinguish Assign objective from Send message only → task list → Inspect task → raw fields → artifacts. Employee: rail portrait → runtime catalog → AI settings before useful work. Outcome: executive messages or task list → inspect → scroll past records. Problem: Attention → exact source control, already a sound pattern. Investment: three peer destinations with similar names and multiple setup forms.

Users must learn objective, Task, execution, thread, runtime, mandate, artifact and dispatch before a simple assignment. Every screen repeats engineering workflow and runtime authority even when irrelevant. Task lists have no search/status filtering; dates were recently repaired for messages but other screens still use time alone. Snapshot data has no reliable percentage, plan, ETA or generic final-file flag; those must not be fabricated.

## Operational truth findings

- Use Task status for completion. A completed model turn may leave a parent waiting for children/integration; its result_summary is only the latest update.
- Use `/api/attention`, not all blocked tasks, for owner action. Normal child/integration waits are not necessarily problems.
- An idle employee can have unresolved assignments. State actual recorded assignments and whether a work session is running.
- Conversation-origin work can include mandate work. Without an authoritative association, call it a team work session and retain original identity in details.
- Investment schedules, proposals, decisions, orders and valuations are separate records. An active schedule does not establish an employee is currently working.

## Accessibility and usability priorities

P0: truthful Home, unmistakable task action, usable results, preserved authority and all routes. P1: coherent six-destination navigation, task search/filter, employee work profiles, meaningful activity, errors inside modal forms, tutorial synchronization. P1 accessibility: name the dialog, restore focus across refresh, add skip link and small live announcer, ensure visible input/select/summary focus and text status. P2: restrained spacing/type, consistent buttons and disclosures.

Source contrast measurements: muted text 2.90–3.90:1 on white; completed 3.37:1; blocked 3.56:1. These fail normal-text AA. Focus blue on white is 2.09:1. Most labels are only 9–12px. Whole-view aria-live and repeated innerHTML replacement can disrupt keyboard/screen-reader use. Existing mobile rules are useful but 320px and text scaling need final validation. This is an audit, not accessibility certification or participant testing.

See [feature mapping](FEATURE-PRESERVATION.md), [design](INFORMATION-ARCHITECTURE.md), and [final validation](USABILITY-VALIDATION.md).
