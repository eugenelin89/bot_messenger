# Execution Plan — Independent Prompt 05 audit

**Status:** Active  
**Owner:** Codex task 01a0e73e-0330-7303-bd1c-99f7e91c10b1; sole audit writer  
**Branch:** codex/prompt-05-independent-audit  
**Worktree:** ../bot_messenger-audit  
**Started:** 2026-09-28 09:00 UTC  
**Initial ETA:** 45–60 minutes; updates every 15 minutes requested by user.

## Objective and scope

Independently compare the actual original Prompt 05 with implementation, migration,
tests, acceptance artifacts and documentation. Record the complete matrix and gaps
before fixing anything. Preserve main and production throughout evidence gathering.
No Prompt 06 or Demo Operator expansion; no unnecessary real-model rerun.

## Baseline and sources

- Fetched origin/main: 8883cd95becbb0ce716504ba4fc91162542f0e96.
- Local main and directly inspected Ubuntu deployment match that SHA; main clean.
- Original 3,389-line request recovered through task 01a0e69b-1e7f-7c30-9f3a-1504bf23a188,
  attachment ef06da8a-14cd-4d6a-8524-ced16bb77f08/pasted-text.txt.
- AGENTS, original execution plan, Decision 014, Decisions 008/013, validation record,
  current product/architecture/operations docs and raw sanitized evidence are inputs.

## Steps

1. Recover original requirements and verify Git/deployment state.
2. Trace each requirement through implementation/schema, actual test assertions and
   raw retained acceptance evidence; distinguish fixture fixes from production fixes.
3. Inspect security/recovery boundaries and hard-coded occurrences; run full suite,
   Python provisioner tests, syntax/link/diff checks. Use smallest Ubuntu reproduction
   if existing evidence is insufficient or code exposes a credible gap.
4. Write requirement matrix and classified findings before any implementation changes.
5. Correct justified gaps on this branch with focused regression/acceptance checks;
   integrate/deploy normally if required, preserving production history.
6. Report confidence by evidence level, limitations, final Git/deployment state and ETA.

## Evidence ledger

- 09:00–09:07 UTC: preflight, original request recovered, clean baseline/deployment
  verified. Strict TypeScript passed. Initial local suite encountered sandbox-related
  runner failures; diagnosis and an appropriately permitted rerun are pending.

## Risks

No audit finding is assumed resolved by a green test name. Linux identity tests,
real Codex, reboot and live GitHub are separate evidence classes. Existing summaries
must agree with inspectable records and code. Any fixes must retain immutable scope,
approval, receipt, packet and source-history protections.

- 09:07–09:14: independently checked raw successful host databases/exit codes and prior
  fixture corrections; recovered all 125 original sections and wrote the baseline matrix.
  Fresh baseline suite 104 pass / 1 Linux skip; Python 9/9. Reproduced IMPORTANT H01 on
  macOS and actual Ubuntu service UID: forged TAP plus exit zero falsely passed.
- 09:14–09:29: corrected H01/H02 and added H03 assertions after recording findings.
  Reporter startup ordering caught by its own probe and corrected. Final local suite
  107 pass / 1 Linux skip, Python9/9, strict TypeScript/syntax/diff checks green.
  217 relative links in 17 documents resolve; every production hard-coding match classified.
- ETA updated near 09:15 to 60–90 minutes remaining due to implementation gap; near
  09:30 to 30–45 minutes remaining. Next: Ubuntu gate, final report and normal integration.
