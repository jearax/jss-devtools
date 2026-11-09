---
title: "init touch-ups from the codebase review"
description: "init reports a failed write with what was written and the next step, rejects a bad folder before asking for a package manager, says which manager a dry run assumes, and shares its help helpers with the harness commands."
status: pending
priority: P2
effort: 4h
branch: main
tags: [init, cli]
blockedBy: []
blocks: []
created: 2026-11-03
---

# init touch-ups from the codebase review

## Outcome

Three small `init` fixes and one deduplication from the codebase review
([cooker-261103-0040-codebase-review.md](../reports/cooker-261103-0040-codebase-review.md),
"Smaller verified bugs" and S1). The user approved the planner's Plan 2 except the two `--force`
items: "Plan 2, đồng ý trừ 2 chỗ `--force`, vì đây là edges case và nó đang mang ý nghĩa -f" (user,
2026-11-03).

## Phases

| #   | Phase                                                      | Depends on                                      |
| --- | ---------------------------------------------------------- | ----------------------------------------------- |
| 1   | [init fixes](./phase-01-init-fixes.md)                     | none                                            |
| 2   | [Shared help helpers](./phase-02-shared-help-helpers.md)   | 1                                               |

The work runs on branch `init-touch-ups` in the worktree `/Users/tandm/Desktop/yyyy-init-touch-ups`,
in parallel with the [harness robustness plan](../261103-1021-harness-robustness/plan.md) on `main`:
"nếu sợ conflict thì nói glm code riêng branch, merge sau khi minimax xong" (user, 2026-11-03). Phase
2 edits `src/commands/harness/update.command.ts`, which that plan also edits; the planner merges the
branch after that plan is committed and resolves the overlap there.

## Acceptance

- Every phase's Acceptance holds.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- `--force`: it overwrites the harness seeds and drops `package.json` keys without a `-` line, and
  stays that way; `-f` means force.
- `npx --no-install` for the npm hooks: "Plan 2, trừ thêm 1 chỗ npx --no-install nữa, kệ nó" (user,
  2026-11-03).
- The `--framework` choice list (decision T3: the other presets exit 1 until built).
- The init e2e job in CI, a preset seam.
