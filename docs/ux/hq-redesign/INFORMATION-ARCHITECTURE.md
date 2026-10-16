# HQ information architecture

## Implemented navigation

Six persistent destinations: **Home, Tasks, Team, Activity, Projects, Settings**. A local navigation row exposes related views; the primary rail highlights the parent. Existing API/HTTP routes and permission controls stay intact. URL fragments support direct section links, refresh and Back. Help and New task stay available from the header.

| Main destination | Related screens |
| --- | --- |
| Home | Current work, Needs your attention, Recently completed, AI team, Investment shortcut |
| Tasks | All tasks; Needs your attention; Browser work |
| Team | Employee roster / profile; Conversations; Discussions; hierarchy disclosure |
| Activity | Meaningful recent activity; Team updates (executive channel); Work sessions; Advanced audit |
| Projects | Software projects; Ongoing goals and schedules; Investment (existing route) |
| Settings | Permissions orientation; Approvals; Infrastructure; Devices; employee AI settings through profiles |

Investment retains `/investment-run`, `/investment-team`, `/investment-publication` with shared links back to Projects and explanatory text. Setup forms remain explicit and contextual; legacy/synthetic setup is collapsed initially. Ask is labelled paused and has no activation action.

## Representative layout

Home header: “Your team at a glance” + New task. Four small counts distinguish running work sessions, active or waiting tasks, completed tasks and owner attention; absent/stale data is labelled. First row: current work and attention. Next: recent completed tasks with actual summaries/results. Team cards show identity, role and recorded work. No permanent engineering tutorial sidebar.

Task details: request → responsible employee / actual state → next step or reason → results → recorded milestones → related assignments → collapsed Advanced details. No invented plan, percentage or promise of completion. Existing inspected retry/cancel controls remain conditional and server-enforced.

New task: one natural-language field, “Atlas will coordinate this task”; fixed permissions explained accurately; one Start task action; success opens the actual returned Task. Advanced settings are contextual links, never required fields. A failed/unknown submission never automatically retries.

Team profile opens immediately from snapshot: portrait/name/role/mission, recorded work sessions and assignments, recent completed work, Conversations and Permissions & research. AI settings load only on explicit request and retain existing controls.

## Rationale

Organize by user goals while preserving distinct backend entities. Show useful state before diagnostics; keep all operational controls discoverable and exact. Software Projects retain their existing semantics; ongoing goals and investment are explicit related workspaces, not fictitious generalized task folders. Investment summaries are not claimed to be part of generic Task counts.

## Review status

The concrete proposal was independently reviewed before implementation. Final UX, accessibility/documentation and security reviews cleared the implementation after findings were resolved; see IMPLEMENTATION-PLAN.md and USABILITY-VALIDATION.md.
