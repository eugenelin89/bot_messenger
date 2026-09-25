# Prompt 02 validation — real engineering organization

Accepted run: **PASS**, 2026-09-25T09:57:47.326Z → 2026-09-25T10:01:16.885Z.

Validated with Node 24.10.0 on macOS ARM64, official Codex 0.142.4, advertised
gpt-5.5 and existing managed ChatGPT authentication. No credential copying or runtime
upgrade. Real workers used private persistent bindings and narrow company tools.

Executable source SHA-256: `431e5db9c6e7e6e39fb40ab425af4405b305f5a835b6eea3524dffbc446a8fb4`.
The digest covers sorted source/UI/scripts, package manifest/lock and TypeScript config,
with each relative path and NUL separator followed by file bytes. Later documentation
and test-only closeout changes do not alter this executable identity.

Retained local data: `.validation/engineering-real-2026-09-25T09-57-47-321Z`. Raw SQLite, worker sessions and Git
worktrees remain ignored. Checked-in evidence contains attributable IDs and relative
managed paths without authentication data.

## Organization

| Worker | Role | Reports to | Durable ID |
| --- | --- | --- | --- |
| Atlas | ceo | Human | `worker_6ae476e0-151c-4baf-a334-3fa9f993ece6` |
| Maya | product_manager | Atlas | `worker_fd46622d-7d58-4fd2-a2c7-742b52c43ffc` |
| Turing | cto | Atlas | `worker_b72b78d8-ad87-40f5-874a-397cda4737ad` |
| Linus | engineer | Turing | `worker_f8d91020-0f9d-4ddc-abb4-f2f43ff20ab2` |
| Ada | engineer | Turing | `worker_38863fa1-baab-4484-812a-14f70ec535e7` |
| Grace | reviewer | Turing | `worker_ab8ca0e0-5048-4689-adbf-7e3aaad7ecac` |

Six persistent workers, six tasks, ten completed executions and six distinct runtime
bindings. Five unique child results produced four manager follow-up stages.

## Concurrent engineering

Execution overlap: **46.477 seconds**. Actual Codex turn
overlap: **44.656 seconds**. Both equal the earlier finish
minus the later start for the applicable pair of timestamps.

### Linus

- Execution: `execution_bcce2c09-5744-41d7-93b1-13db5ec269d1`
- Worker: `worker_f8d91020-0f9d-4ddc-abb4-f2f43ff20ab2`
- Task: `task_dff31d62-59e1-41ea-8547-ce19059ae6ef`
- Start UTC: `2026-09-25T09:59:14.409Z`
- Codex turn start UTC: `2026-09-25T09:59:15.998Z`
- Finish UTC: `2026-09-25T10:00:00.886Z`
- Branch: `botsquad/calculate/task_dff31d62-59e1-41ea-8547-ce19059ae6ef`
- Allocation: `allocation_ca27e2d9-9496-4153-a4ab-8e3aae65f361`
- Worktree: `.validation/engineering-real-2026-09-25T09-57-47-321Z/products/repository_77b3c313-1c29-4a5d-9ec9-cd5bd10b1bd8/worktrees/allocation_ca27e2d9-9496-4153-a4ab-8e3aae65f361`
- Submitted commit: `2587469b2f7a8e798ef09b963189daa46a39f12c`

### Ada

- Execution: `execution_4f2ba558-306a-4e5c-a753-6f78424f15ec`
- Worker: `worker_38863fa1-baab-4484-812a-14f70ec535e7`
- Task: `task_9d7e324a-8fdb-4aca-99f9-1a8270fd7c96`
- Start UTC: `2026-09-25T09:59:14.326Z`
- Codex turn start UTC: `2026-09-25T09:59:16.230Z`
- Finish UTC: `2026-09-25T10:00:05.385Z`
- Branch: `botsquad/format/task_9d7e324a-8fdb-4aca-99f9-1a8270fd7c96`
- Allocation: `allocation_624bd171-a1c6-4e89-b829-016daf5403b0`
- Worktree: `.validation/engineering-real-2026-09-25T09-57-47-321Z/products/repository_77b3c313-1c29-4a5d-9ec9-cd5bd10b1bd8/worktrees/allocation_624bd171-a1c6-4e89-b829-016daf5403b0`
- Submitted commit: `bd96889fff8c4f34020199ae51835e2424279459`

## Maya specification

- Task: `task_1b0a4a61-8f1e-4a90-8796-9734a5cd8941`
- Execution: `execution_8c5a6209-b1d3-4354-8798-8d1eee411607`
- Artifact: `artifact_584976e7-8672-4710-9a94-6dd0b3886999`
- SHA-256: `6a3aa6d31dd9be44eb270c4b111931dfbe72269b30ec52b01b5e8934f7bf4b8d`

[Actual specification](artifacts/prompt-02-maya-specification.md). It completed before
either engineer started. Acceptance defines four valid statuses, non-mutating counts,
empty-array zeros, TypeError for invalid input, safe nonnegative integer totals,
exact five-line formatting, separate module ownership, focused/full tests and independent
review of the exact submitted commits.

## Grace independent review

- Execution: `execution_d2297e29-7165-4e71-9e05-d00d06abf2b5`
- Review: `review_e5a1fc30-be11-459b-94ca-3339943c5452`
- Artifact: `artifact_012c5264-fd69-46b7-bab7-d3b70efa1019`
- Disposition: **approved**
- Reviewed commits: `2587469b2f7a8e798ef09b963189daa46a39f12c, bd96889fff8c4f34020199ae51835e2424279459`

[Actual structured review](artifacts/prompt-02-grace-review.json). A durable receipt
proves Grace read the exact review packet in this execution. She had no source-write,
commit or integration tool. Findings below are her actual assessment, not independent
claims that the pre-integration focused tests covered every possible input.

**linus findings:** Commit 2587469b2f7a8e798ef09b963189daa46a39f12c changes only src/calculate.mjs and test/calculate.extra.test.mjs. The implementation uses a fixed Set of allowed statuses, exact string matching, initializes all counters, increments total and the matching status, and rejects invalid input with TypeError. The extra tests usefully cover case/whitespace invalid statuses and no mutation of optional fields. Focused calculate validation evidence passed: confined-node --test --test-isolation=none test/calculate.test.mjs test/calculate.extra.test.mjs, 4 tests passing.

**ada findings:** Commit bd96889fff8c4f34020199ae51835e2424279459 changes only src/format.mjs and test/format.extra.test.mjs. The implementation validates summary is a non-null non-array object, requires all specified own fields, uses Number.isSafeInteger plus nonnegative checks, verifies total equals working + idle + blocked + failed, and returns the exact required label order/capitalization without a trailing newline. The extra test usefully covers unsafe integer and array rejection. Focused format validation evidence passed: confined-node --test --test-isolation=none test/format.test.mjs test/format.extra.test.mjs, 3 tests passing.

**integration risks:** The two commits touch disjoint owned modules and optional owned tests, so merge conflict risk is low. The implementations are dependency-free Node ESM and compatible with the existing src/index.mjs composition. The review packet contains focused module test evidence only; it does not show a trusted full integrated test run after combining both commits, so integration should run the immutable integrated/full test suite before final product success is claimed. No source-level defect was identified in the submitted diffs.

**acceptance assessment:** The submitted diffs align with the SquadStatus specification and engineering contract for their owned modules. Linus implemented calculateStatusSummary in src/calculate.mjs only, with an optional calculate extra test; it returns the required {total, working, idle, blocked, failed} shape, handles empty arrays with zero counts, rejects non-arrays, null/array/non-object workers, missing status, and non-exact statuses with TypeError, and does not mutate inputs. Ada implemented formatStatusSummary in src/format.mjs only, with an optional format extra test; it requires a non-array object, validates presence of all five required fields as nonnegative safe integers, enforces total consistency, and emits exactly the five required lines with no trailing newline. No third-party dependencies or cross-module imports were introduced.

**recommended disposition:** approved for integration of the exact submitted commits; run the trusted full integrated test suite after integration before reporting product success.

## Product integration

- Repository: `repository_77b3c313-1c29-4a5d-9ec9-cd5bd10b1bd8`
- Local main: `.validation/engineering-real-2026-09-25T09-57-47-321Z/products/repository_77b3c313-1c29-4a5d-9ec9-cd5bd10b1bd8/main`
- Base: `21654f9108f9923433b799483cbbf6a7d36b87ca`
- Source commits: `2587469b2f7a8e798ef09b963189daa46a39f12c, bd96889fff8c4f34020199ae51835e2424279459`
- Integration: `integration_a523aa4f-04e0-494d-b4c7-6137a700b93a`
- Strategy: `cherry-pick-then-fast-forward`
- Candidate: `fe85321b9c7dc22efe6cd01e3ae847fcdd5df8f8`
- Final product main: `fe85321b9c7dc22efe6cd01e3ae847fcdd5df8f8`
- Integrated command: `confined-node --test --test-isolation=none test/calculate.test.mjs test/format.test.mjs test/integrated.test.mjs test/calculate.extra.test.mjs test/format.extra.test.mjs`
- Result: 9/9 passed, exit 0; complete TAP output retained in acceptance JSON.

The service combined the exact two approved commits in a separate retained candidate,
ran full tests and CLI output, checked unchanged clean default HEAD, then fast-forwarded.
Engineer branches remained frozen at their submitted commits. The product has no remotes.

```text
Total: 4
Working: 2
Idle: 1
Blocked: 1
Failed: 0
```

[Full acceptance evidence](artifacts/prompt-02-acceptance.json).

## Validation matrix

| Gate | Evidence/result |
| --- | --- |
| Strict build and deterministic suite | 49/49 pass; final signal-denial addition also passed focused verification |
| Hierarchy | Valid CEO/PM/CTO/engineer/reviewer, depth, role, capability and manager checks |
| Managed repository/worktrees | Actual Git, distinct branches/paths, owner/task/base identity, arbitrary/source/sibling paths, symlink and branch substitution rejected |
| Submissions | Dirty/unrelated history rejected, focused tests, immutable exact commits and frozen source |
| Concurrency | Two fake runtime executions plus two actual overlapping Codex turns; duplicate kicks do not duplicate allocation |
| Review | Read-only exact packet, required read receipt, immutable attribution, mismatched commits and changes_required block integration |
| Integration | Actual conflict and failing full tests leave default unchanged; successful candidate and duplicate-call idempotency |
| Recovery | Retained v1 worker/task/binding migration; interrupted source blocks; inspected post-commit retry does not create a second commit |
| Product process confinement | Actual host/sibling/source read, write, spawn, signal-zero and loopback network probes denied; early exit cannot count as passing tests |
| Real runtime confinement | Each engineer actually attempted denied traversal read/write, BotSquad source write and sibling allocation write; attributed scope events retained |
| Real policy surface | Every turn recorded readonly/no-network/empty environments and disabled broad tools/MCP; Grace lacked write/commit/integration tools |
| Prompt 01 deterministic regression | Original 31 tests pass |
| Prompt 01 real regression | PASS: hire, report, Atlas evaluation, pause, process restart, same-binding resume, acknowledged interruption |
| Prompt 02 real end-to-end | PASS: six workers, spec, concurrent source/tests/commits, exact review, acceptance, integration and Atlas report |
| Real process restart | Tasks/messages/executions/artifacts/bindings/repositories/allocations/submissions/reviews/integrations/wakes unchanged; six workers idle, no replay |
| UI | PASS on accepted run: live simultaneous engineers, spec, persisted hierarchy, branches/worktrees/submissions, Grace review and full acceptance JSON |
| Diff hygiene | JS syntax and git diff --check pass; scoped source/security diff reviewed |

[Sanitized runtime evidence](prompt-02-evidence.json) and
[real research regression](prompt-02-research-regression.json).

## Trial history and limits

- Trial 1 (`09:30:36`) hit Atlas’s four-minute resume deadline after a successful CTO hire.
  The runtime log contained the tool result but no subsequent response/protocol error.
  Cause was not established. Failed state was retained, no automatic retry or weakening.
- Trial 2 (`09:43:05`) passed end to end with 8 product tests and 29.699 seconds of
  actual turn overlap. Final review then added delivery evidence guards, classified
  denial audit, stronger migration coverage and OS signal denial. It is not the final
  source acceptance run.
- The accepted run above uses the hardened source; no source fix was substituted after it.
- Security validation combines actual denied source-tool calls, actual OS probes and
  verified tool absence. It does not claim real attempts at every unavailable browser,
  Computer Use, force-Git or external action; those tools are deliberately absent.
- Crash cases are deterministic recovery tests, not a power-loss test at every Git/SQLite
  instruction. Ambiguous operations remain blocked for manual inspection.
- No other OS/Node distribution, hostile same-OS-user boundary, arbitrary third-party
  repository, external remote/push/deployment, automatic revision cycle or cleanup was tested.
- Fixed dependency-free SquadStatus only; two editable modules, optional extra tests,
  one review/integration attempt per product. Synchronous Git/test operations can delay HTTP.
- Pinned experimental Codex dynamic tools cannot replace legacy Prompt 01 tool schemas
  on resume; retained research bindings work, engineering requires fresh company data.
- Model reliability and test/review coverage remain limits. A passing test suite is not
  proof that arbitrary malicious JavaScript is correct.

## Next milestone

**Recommend Option A — Human approval system.** Prompt 02 proved useful local autonomy
while intentionally withholding every external action. The next missing trusted boundary
is an attributable, scoped approval grant with expiry/replay protection and auditable use.
That should precede external repositories/deployment or Computer Use. Neither is implemented
here; Decision 006 remains in force.

## Git delivery and closeout

Feature validation is complete. Authorized feature push, current-main integration,
post-integration checks and normal main push are the remaining delivery gates.
Starting main: `aa889f7dde7283bf92fbf3acab223c399b246419`.
Feature: `codex/prompt-02-engineering-org`; sole worktree:
`/Users/eugenelin/Documents/ChatGPT/Bot Messenger/bot_messenger`.
Remote: `https://github.com/eugenelin89/bot_messenger.git`.
