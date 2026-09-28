# StudyPlan — Demo Operator 01

**Result:** Demo Operator 01 passed and produced a truthful recorded tutorial.

The clearly labeled **BotSquad Demo Operator** used the real web UI on the existing
Ubuntu development HQ to create **StudyPlan Demo 01**, give Atlas one goal, inspect exact
Nix requests, and observe real specification, engineering, independent review and
trusted integration. The finished Project remains active; new dispatch is paused.
Earlier history and five failed operator attempts are retained.

## Watch and follow

The continuous raw recording is already within the requested 5–10 minute tutorial
range. It is the tutorial video; no edited duplicate or removed waiting time is claimed.
Large video remains outside Git. There are 17 live milestone screenshots plus one
unaltered frame decoded at 03:00 from the same raw video, showing both engineers active. The [timestamped transcript](transcript.md),
[narration script](narration.md), [events](events.json), [selected screenshots](screenshots/)
and [exact evidence ledger](evidence.json) all describe this same successful run.

- Exact local path: `/Users/eugenelin/Documents/ChatGPT/Bot Messenger/outputs/demo-operator-01/run-06/demo-raw.webm`
- Format: WebM, VP8, 1600×1000, silent native Playwright recording.
- Duration: **346.48 seconds** (5.77 minutes).
- Size: **27,656,290 bytes**.
- SHA-256: `bcb56787f4be8b96f72a249610452e7e84cb342f7634183012b7d457a8249a98`.


## Versions and scope

- Starting audited main: `50ba2931b21b99c2a9be14916fb6bcb042ea458d`.
- Actual deployed BotSquad during recording: `1f177f0cb2aeddc75582405bb47827e3e3b50fde`.
- Operator source: `25cc544b9700f5a06f03451485b158a2b8b1518a` on `feature/demo-operator-01`.
- Recorded run: `run-06`; completed `2026-09-28T10:34:55.178Z`.
- Project: `project_7309f229-5151-4b17-af86-5bb991760932`.
- Repository: `repository_b22a536f-b730-4aae-8a7e-5090d321e8cd`; local managed Git, branch `main`, no remote.
- Root objective: `task_0776bc45-c0bf-4537-86cc-846a0239640e`.
- Maya specification: `artifact_499bb629-473a-454e-bd33-7d9140efcc29`.

The goal was to sort study tasks by descending priority with stable ties, total their
minutes, and format a readable plan. Empty/invalid input and immutability had to be
covered. [Scenario](scenario.md) explains the bounded recipes and actions; the exact
machine-readable input is [scenario.json](scenario.json).

## Actual organization and engineering

| Worker | Role | ID |
| --- | --- | --- |
| Atlas | ceo | `worker_c5d3c228-ef9f-4b20-b951-2ac9dab48ac1` |
| Nix | devops | `worker_6e4d2e0a-3574-4386-83c8-9d3c8b1ee388` |
| Maya | product_manager | `worker_85bebccd-fb82-48c3-abfa-bc62117f8746` |
| Turing | cto | `worker_394966d5-571d-4706-9b5a-70eb81e8b5d7` |
| Linus | engineer | `worker_65c26d53-7f48-44a8-bb3c-b22ed8d113a8` |
| Ada | engineer | `worker_db8bec3a-61e1-4690-b42a-de6456f63a7d` |
| Grace | reviewer | `worker_df13cd75-1718-400a-b60c-c2a114c1d9a3` |

| Worker | Allocation | Write scope |
| --- | --- | --- |
| Linus | `allocation_2064d95a-2460-4231-afd3-caccd8dd0ef0` | `src/planner/` |
| Ada | `allocation_8ede61eb-a60e-4f7f-87d5-d4ca33e8cb59` | `src/report/` |

The actual engineering executions overlap by **89.863 seconds**;
model turns overlap by **89.000 seconds**. No worker was held
back to manufacture overlap. Full execution IDs, runtime references, tasks, approvals,
scopes and source commits are preserved in [evidence.json](evidence.json).

Submissions:

- `submission_29b612ba-cc92-4285-aeba-9932c1f87b7b`: `d71a7c5b64e53ec476a7e852ecc09f5d2bd012f9`; execution `execution_db1e771c-d667-415c-a13f-2d5b28ad4e2d`.
- `submission_2ebef3b1-cb63-4431-a4ab-2a58289217cd`: `5631378bd688f6b1642941425b1368d21a4ba671`; execution `execution_90f1830d-d83f-4630-a083-f81135036032`.

Review:

- `review_5fded869-097e-4896-99df-16dccf26848a` — approved; round `round_5799ffe4-1caa-423b-b7e5-b553f36d22bb`.

**Grace approved the first submission; no fake revision was introduced.**

Integration `integration_5e0dd01f-0642-4995-89ae-1cd46c822f3c` combined exactly those approved submissions.
Canonical Git advanced from `3268848ccaa39a3aedb61151a9960f075b525817` to
**`fb74dc7a8304b19830108ccb001c3dc5fe39bd13`** only after **24/24 full-recipe tests passed**. The authenticated
service-owned completion boundary is unchanged; TAP-looking output alone is insufficient.
Full validation and its actual test output are included in the evidence ledger.
[Atlas's final artifact](studyplan-output.md) is committed beside this README and shown in the recording.
It reports the sample product result; no separate unsandboxed product command was run.

## Exact operator actions

Through visible UI controls, the operator opened Projects, created a fresh Project,
configured instructions and focused/full recipes, created its local repository,
assigned the objective to Atlas, resumed dispatch, opened exact Nix approval scopes,
approved **2 clone-preparation operations**, inspected task artifacts,
submissions, Grace's review and integration evidence, opened Atlas's final output,
and paused new dispatch. Existing logical workers and identities were reused.
The current run did not initialize Nix, create worker identities, publish remotely or
archive the successful Project. Failed attempts were separately archived through the UI.

Read-only API assertions checked actual state; administrative SSH was limited to the
owner-authorized backup, deployment and read-only host checks. There were no direct
SQLite mutations, canonical Git edits, unexpected approvals, credential reads, worker
root bypasses or generated-Project GitHub pushes.

## Reproduce

1. Use the existing authorized development HQ; back up retained state first. Start
   paused with no active executions, unfinished work or pending approvals.
2. Open its normal SSH tunnel to `http://127.0.0.1:4310`. Confirm its deployed commit.
3. Run `npm ci --ignore-scripts` and `npm run build` in the BotSquad source checkout.
   Use installed Google Chrome and the supported Playwright recording helper. The
   recording used `PLAYWRIGHT_BROWSERS_PATH` pointing to the private local helper cache.
4. Run `npm run demo:tutorial -- NEW_ARTIFACT_DIRECTORY EXPECTED_DEPLOYED_SHA 'StudyPlan'`.
   The artifact directory must not exist. An optional fourth argument supplies a
   validated scenario JSON. All consequential demo actions remain in the UI.
5. Only after a passing run, generate its readable evidence with
   `node dist/scripts/demo-operator/finalize.js RUN_DIRECTORY`. Inspect screenshots,
   recording, hashes and metadata before publishing lightweight artifacts.

Run `npm test` for deterministic coverage. After building, run
`node --test test/demo-ui.browser.mjs` for the explicit Chrome approval-inspection
regression. See [operator architecture](../../product/DEMO_OPERATOR.md).

See [validation and security review](validation.md) and [host preservation evidence](host-preservation.json)
for the retained-state comparison and deterministic checks.

## Findings and limits

[Dogfood findings](DOGFOOD_FINDINGS.md) record the fixed approval live-update blocker,
policy-JSON onboarding friction, retained-history clutter, worker readiness and long
evidence views. Operator assertion defects and all earlier failed recordings remain
explicitly distinguished from this tutorial. This is a bounded browser test client;
worker Computer Use, remote pairing, a second HQ, general package environments and
live authenticated GitHub publication were not added. **Prompt 06 remains Next.**
