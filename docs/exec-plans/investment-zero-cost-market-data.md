# Execution Plan — Zero-cost market-data policy for Investment Showcase

**Status:** Active — documentation decision only
**Owner:** ChatGPT, on direct instruction from repository owner
**Branch:** `feature/inv-zero-cost-market-data-policy`
**Worktree:** Remote GitHub branch; no local/Mac worktree access
**Started:** 2026-10-09
**Initial ETA:** Same-turn documentation, review and integration
**Current ETA:** Same-turn

## Objective

Record an explicit owner-approved **US$0 incremental market-data budget** for the BotSquad paper-investment showcase. Carry it into the roadmap, source/evidence rules and Codex launcher so every later investment implementation reviews and honors it.

## Scope

- New durable decision in `docs/decisions/` and linked decision index.
- Update investment decision log, simulation data-source guidance, future build packet requirements and required preflight references.
- Preserve the completed INV-01 test evidence and contract v1.0 unchanged.
- Documentation only: no paid data services, scraping execution, repo dependencies, worker grants, changes to either live server or code.

## Baseline and ownership

Started from `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755` on a dedicated remote branch; no open GitHub PRs reported in preflight. Relevant product constraints: Decisions 027–028, `docs/experiments/investment/{README,DECISIONS,SIMULATION_RULES,ROADMAP}.md`, `prompts/experiments/investment-showcase.md`, `docs/validation/investment/INV-01.md`.

## Invariants and risks

- Only **market-data acquisition/licensing costs** are fixed at $0; unrelated AI/provider/infrastructure budgets do not inherit a free-use assumption.
- Free-to-read is not automatically free to scrape or redistribute. Review source terms and public display/derived-data rights; do not bypass technical restrictions.
- Exchange calendar, raw/adjusted prices, price availability time, corporate actions and original evidence remain verifiable. Missing valid source means stale/blocked, not invented valuations or hindsight fills.
- If no permissible free source supports official launch/public disclosure, keep the gate blocked and present options; never buy a feed or quietly weaken methodology.
- Do not retroactively change INV-01 accepted testing or contract contents.

## Steps

1. Record the accepted policy in a numbered decision record.
2. Amend investment decision register and relevant simulation/roadmap requirements.
3. Require a decision review in the reusable Codex launcher and guide; include link navigation for future agents.
4. Read back, compare changes with baseline, verify doc references and scope, integrate normally.

## Validation and evidence

Documentation-only: inspect relevant source text, relative links and coverage across decision, roadmap and launcher; review GitHub changed-file listing for unrelated modifications. No runtime, scraper, site, data-provider or licensing acceptance is claimed.

## Completion handoff

Report decision path, changed documents, PR/merge and checks, and whether the accepted market-data constraint is reflected in future prompt preflight. All implementation statuses remain unchanged.
