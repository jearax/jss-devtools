---
title: Cooked the dogfood harness migration
date: 2026-11-09
summary: Applied init --agent-kit to the repo itself and moved docs/decisions/plans into .harness/
---

# Cooked the dogfood harness migration

## What happened
Ran plans/261109-1618-dogfood-harness-migration/plan.md end to end. init -f -y --agent-kit exited 0 but (as the plan's trial run predicted) added caret deps (tsx, tsc-alias), let pnpm write a literal placeholder into pnpm-workspace.yaml, and wrote .claude/.agentkit paths the old .gitignore ignored. Restored eslint.config.mjs from HEAD then narrowed IGNORED_PATHS to .harness/{plans,bin,core}; removed the caret deps and reset lockfile; narrowed .gitignore (.agentkit/ removed, .claude/* + negations, !.env.example moved below the appended .env.*). git mv'd docs/decisions, docs and plans into .harness/ and fixed every relative link (throwaway checker in /tmp). Wrote decision 0040, regenerated the three seed indexes, rewrote CLAUDE.md/README paths, seeded MEMORY.md, deleted BOOTSTRAP.md.

## Decision
Accepted decisions stayed immutable; evergreen docs (code-standards, codebase-summary) were updated instead of history. A doctor "secret" hit on prose (a credential word immediately followed by a colon) was reworded in the doc rather than touching src/; logged as CLI follow-up. Planner later decided 0040 supersedes 0012.

## Next steps
Planner reviews .harness/plans/reports/cooker-261109-1635-dogfood-harness-migration.md (prompted via herdr, fire-and-forget). Work staged, nothing committed. CLI follow-ups: caret deps in existing-mode merge, silent .gitignore conflicts in init, .env.example re-ignore, secret-scanner prose false-positive.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
