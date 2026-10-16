# HQ terminology

Authoritative UX-01 wording for UI and current tutorials. Technical entity names remain in advanced evidence and APIs.

| Entity / old wording | Normal wording | Required distinction |
| --- | --- | --- |
| Worker / bot | AI employee; Team | Persistent identity, not one provider thread |
| Objective | Task description; what you want done | Explicit Start task creates a Task; ordinary message does not |
| Task | Task / assignment | Recorded job; a completed response is not its completion |
| Execution | Work session | One attempt, possibly contributing to a longer Task |
| Artifact | Result or file | Saved output; not necessarily the final deliverable |
| Organization | Team; Reporting hierarchy | Responsibility and assignment authority persist |
| Executive channel | Team updates | Company messages, separate from direct conversations |
| Working group | Discussion (working group) | Deliberation/recommendation, not approved decision or Task |
| Mandate | Ongoing goal (mandate) | Explicit bounded authority and review schedule; not a normal Task |
| Thread | Conversation only for BotSquad conversations | Provider thread is a technical identity in advanced details |
| Dispatch | Starting queued work | Pause new work holds queued starts; active sessions continue |
| Queued | Waiting to start | Does not mean work is running |
| Working | In progress | Pair with recorded current session / latest event |
| Blocked: waiting_children | Waiting for related tasks | Not owner attention unless attention projection says so |
| Blocked: waiting_integration | Waiting for project integration | Not a failed task by itself |
| Other blocked | Waiting / Needs review, with exact reason | Owner action comes from attention service, not label inference |
| Awaiting approval | Waiting for approval | Point to exact originating workflow |
| Failed | Could not finish | Explain next inspection step; original error in details |
| Completed | Completed | Only authoritative Task completion for task outcomes |
| Idle | No work session running | Does not assert no unresolved assignments or eligibility |
| Provider failure | AI service problem, where established | Preserve exact evidence; do not guess fault category |
| Investment run | Investment workspace / schedule (contextual) | Active schedule can be waiting; not evidence employee is working |
| Paper order / valuation | Paper order / portfolio valuation | Distinct from discussion, formal decision and research output |
| Advanced details | Original records and technical evidence | Exact identity, scope, provider data and audit retained |

Use full local date and time for activity, with original ISO value available. Unknown/unavailable/stale is never silently zero. Historical docs keep their original terminology with a current-guide notice.
