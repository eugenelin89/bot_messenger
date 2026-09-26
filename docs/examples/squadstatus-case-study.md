# Case study: a bot team builds SquadStatus

> **Historical context:** This case study records the Prompt 02 macOS-local validation architecture. BotSquad's accepted operating direction is now an always-on self-hosted Ubuntu headquarters. The local worktrees described here remain valid evidence of Prompt 02; they are not the final deployment model.

SquadStatus is a small working program built by a six-bot team coordinated through
BotSquad. This real demonstration tested the path from a human objective to a
specification, concurrent coding, independent review and a tested product.

This walkthrough describes the successful run on **September 25, 2026**. The
[validation record](../validation/prompt-02.md) contains the detailed IDs, paths,
commits and test results.

## Two projects with different jobs

| Project | Purpose | Who changed its code? |
| --- | --- | --- |
| **BotSquad** (`bot_messenger` repository) | The application that manages workers, tasks, messages, permissions, worktrees and results | The development agent implementing BotSquad |
| **SquadStatus** | A separate local example product used to exercise that application | Linus and Ada, the engineering bots |

The demo bots could not write BotSquad's source. SquadStatus had its own Git history,
branches and worktrees, with no GitHub remote or deployment. It was stored inside
BotSquad's ignored validation-data directory, but remained a separate repository.

## What the product does

SquadStatus takes a list of workers and counts four possible statuses: `working`,
`idle`, `blocked` and `failed`. For this sample input:

```js
[
  { name: "Atlas", status: "idle" },
  { name: "Linus", status: "working" },
  { name: "Ada", status: "working" },
  { name: "Grace", status: "blocked" }
]
```

it produces:

```text
Total: 4
Working: 2
Idle: 1
Blocked: 1
Failed: 0
```

These four entries are fixed example data, not a live reading of the six-bot company.
The program has two small modules: one calculates the counts; the other formats
them. Invalid input must raise an error, and calculation must leave the input unchanged.

## Meet the team

A **bot** is a saved worker identity with a role, permitted tools, tasks and a
persistent Codex conversation. It runs when assigned work and can resume later.
Creating a bot leaves it idle; sending an ordinary message does not start a task.

| Bot | Reports to | Job in this example |
| --- | --- | --- |
| **Atlas — CEO** | Human owner | Receives the objective, creates Maya and Turing, evaluates their results and reports back |
| **Maya — Product Manager** | Atlas | Writes the product specification and acceptance criteria from the supplied contract |
| **Turing — CTO** | Atlas | Requests the managed repository, creates the engineering/review team and coordinates delivery |
| **Linus — Engineer** | Turing | Implements `calculateStatusSummary` and adds calculation tests |
| **Ada — Engineer** | Turing | Implements `formatStatusSummary` and adds formatting tests |
| **Grace — Reviewer** | Turing | Independently reviews the exact submitted commits and records findings |

The earlier research milestone used **Scout**, a researcher under Atlas. Scout was
not part of this six-worker engineering run.

## From objective to finished product

1. **The human assigns an objective.** The request is to build SquadStatus with a
   product and engineering team. BotSquad records an explicit task for Atlas.
2. **Maya specifies the work.** Atlas hires and assigns Maya. She saves a specification
   covering behavior, validation, module ownership and acceptance. Her result wakes
   Atlas, who evaluates it and assigns delivery to Turing.
3. **Turing sets up engineering.** Turing requests the local product repository and
   hires Linus, Ada and Grace. BotSquad allocates two engineering tasks, branches and
   worktrees. Turing ends his turn while the engineers work.
4. **Linus and Ada implement concurrently.** Each reads the contract and tests, edits
   the assigned module, adds tests and requests focused validation. BotSquad verifies
   ownership and changes, reruns tests and creates each submission commit. It then
   prevents further edits to the submitted worktree.
5. **Grace reviews.** Both engineering results wake Turing. He assigns Grace a read-only
   view of the specification, exact code changes and test evidence. Grace approves
   the commits and notes that full combined testing is still required.
6. **BotSquad integrates and verifies.** Turing requests integration. Trusted application
   code combines the approved commits in a separate candidate worktree and runs all
   tests plus the sample output check. Only success advances the product's `main`
   branch. Turing reports the evidence to Atlas, who reports to the human.
7. **The application restarts.** The validation stops and restarts BotSquad. Worker
   identities, ownership and results remain, and completed work does not run again.

Managers resume in response to saved child-task results. They do not keep invoking
models to ask whether the engineers have finished.

## What was prepared, and what the bots produced

The demonstration supplied the product contract, named roles, module boundaries,
repository structure, command-line entry point, code connecting the two modules,
and six fixed acceptance tests. The two implementation modules started as stubs.

The real bots produced Maya's specification, both module implementations, three
additional tests, the engineering submissions, Grace's review and the managers'
reports. BotSquad enforced access and performed the actual Git and test operations.
Role names such as CEO or CTO did not grant unrestricted machine access.

## Where the files and worktrees live

A **Git worktree** is a checked-out copy of a repository on its own branch. Both
engineers started from the same base commit in separate folders. Each could edit
only the assigned module and optional tests, with no access to write the other's files.

The portable layout is:

```text
<company-data>/
├── company.sqlite                         # workers, tasks, messages and ownership
├── workspaces/<worker-id>/                 # private runtime folder for each bot
├── artifacts/                             # specification and review documents
└── products/<repository-id>/
    ├── main/                              # final combined product, after acceptance
    ├── worktrees/<linus-allocation-id>/    # Linus's branch and submitted code
    ├── worktrees/<ada-allocation-id>/      # Ada's branch and submitted code
    └── integrations/<integration-id>/     # combined candidate used for full tests
```

All six bots have runtime folders. Only Linus and Ada have engineering worktree
allocations. Atlas, Maya, Turing and Grace work through task context, documents and
restricted tools. Runtime folders may be empty: identities and work records are in
SQLite, reports are in the artifact store, and Codex manages conversation history.

The engineer branches follow `botsquad/calculate/<task-id>` and
`botsquad/format/<task-id>`. Their retained folders show individual submissions.
**Open the product's `main/` folder to see the finished code from both engineers.**

For ordinary use, `<company-data>` is `.data` under the BotSquad checkout, unless
`BOT_DATA_DIR` overrides it. The recorded run used
`.validation/engineering-real-2026-09-25T09-57-47-321Z`. Its full allocation paths are
in the [validation record](../validation/prompt-02.md#concurrent-engineering).
Each validation directory represents a separate company/run. Raw directories are
ignored by Git, so cloning BotSquad retrieves the checked-in evidence, not those
local worktrees or the already-created company.

## What the run demonstrated

| Observation | Recorded result |
| --- | --- |
| Real organization | Six persistent workers, six tasks and ten executions; managers resumed across stages |
| Concurrent engineering | Linus and Ada's executions overlapped for **46.477 seconds**, including **44.656 seconds** of actual Codex-turn overlap |
| Independent review | Grace approved the exact two submitted commits, with full combined testing still required |
| Product acceptance | **9/9 tests passed** and the CLI produced the sample output above |
| Restart | Completed engineering, review and integration stayed recorded without duplicate execution |

Both engineers tried controlled writes outside their permitted files; BotSquad
rejected them. Separate automated tests covered rejected reviews, Git conflicts and
failing combined tests. Those failure cases leave the product's default branch unchanged.

## Read the evidence or try it yourself

- [Maya's actual specification](../validation/artifacts/prompt-02-maya-specification.md)
- [Grace's actual review](../validation/artifacts/prompt-02-grace-review.json)
- [Product test output and commit evidence](../validation/artifacts/prompt-02-acceptance.json)
- [Complete run record](../validation/prompt-02.md) and [machine-readable evidence](../validation/prompt-02-evidence.json)

To run a new example, follow the [README setup and requirements](../../README.md#local-development-and-prompt-02-demo),
then select **Build SquadStatus** and **Assign objective**. Watch **Organization**,
**Products & engineering**, **Tasks** and **Executions**; open the specification,
submission evidence, review and integration results as they appear.

`npm run validate:real` runs the automated scenario in fresh company data. It launches
real Codex workers and consumes model usage. Each run creates new IDs and commits.
Existing Prompt 01 runtime bindings need fresh company data for engineering; see the README.

This case study demonstrates the fixed local Prompt 02 workflow. General existing repositories,
external pushes/deployment, Computer Use and automatic revision loops remain future
work. Permissions are enforced by BotSquad's trusted code; passing tests and review
did not establish protection against a malicious process sharing the same OS account. Prompt 03's Ubuntu migration introduces a separate host/service boundary; per-worker Unix-user isolation remains later work.

For implementation details, see the [system architecture](../architecture/SYSTEM_ARCHITECTURE.md)
and [Decision 008](../decisions/decision_008_managed_engineering.md).
