# StudyPlan scenario

The operator identifies itself as **BotSquad Demo Operator**, an automated tutorial
operator. It operates the existing private development HQ through an ephemeral Chrome
session reached over the normal SSH tunnel. No second BotSquad instance is provisioned.

The user gives Atlas one understandable objective: build a dependency-free Node study
planner that orders tasks by priority, sums their estimated minutes, and produces a
readable daily plan. Higher numeric priority comes first; ties preserve input order.
The input fields are `subject`, `minutes`, and `priority`. `planStudy(tasks)` returns
`{tasks, totalMinutes}`, and `formatPlan(plan)` produces readable text. Empty input,
invalid values and input immutability need meaningful tests.

The operator configures named focused recipes for
`src/planner/planner.test.mjs` and `src/report/report.test.mjs`, plus a full recipe
running both. Tests live alongside their modules so two engineers can own separate
scopes. The default protected paths, including `test/`, remain protected. The operator
does not select worker assignments or manufacture a review defect.

1. Verify the exact deployed SHA, paused/idle HQ and absence of unrelated work or approvals.
2. Create a fresh Project, configure its policy, and create its real local repository.
3. Initialize Nix if needed; inspect and approve only its exact bootstrap operation.
4. Assign the objective to Atlas through the Project UI and resume dispatch.
5. Observe the real specification, allocations and worker executions. Where a reused
   assigned worker lacks an identity, ask Nix through Infrastructure.
6. Inspect exact approval envelopes. Permit only required identity creation and clone
   preparation tied to this run's workers, tasks, repository and allocation manifests.
   Any other approval stops automation.
7. Verify immutable submissions, exact independent review and trusted full-tested
   integration. If revision is requested, observe it normally without inventing a failure.
8. Inspect the final Project and report artifact; pause dispatch and preserve history.

Every attempt uses a new artifact directory and a new Project. Failed attempts are
retained and never spliced into the successful tutorial. Recovery uses the UI to deny
unused requests, cancel unfinished work and archive failed Projects. Archive retains
repositories, tasks and evidence.

See the reusable [scenario](../../../scripts/demo-operator/scenario.ts),
[browser driver](../../../scripts/demo-operator/driver.ts),
[assertions](../../../scripts/demo-operator/assertions.ts) and
[recorder](../../../scripts/demo-operator/recorder.ts).
