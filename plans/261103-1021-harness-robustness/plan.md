---
title: "Harness robustness: distrust what the repository holds"
description: "Fix the harness bugs the codebase review verified: unchecked manifest paths, 1 MiB output truncation, unguarded JSON state, stale base copies, a false index-drift row, and smaller doctor, log and hook-timeout gaps."
status: pending
priority: P1
effort: 1d
branch: main
tags: [harness, robustness]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Harness robustness: distrust what the repository holds

## Outcome

The harness treats files in the user's repository (the manifest, its JSON state, git output) as
input to check, not as output it wrote itself. A bad manifest path, a large file or diff, a
half-written state file or a stale base copy fails loudly with the next step, instead of deleting
outside the repository, truncating a file, or silently turning a hook off.

Source: the codebase review
[cooker-261103-0040-codebase-review.md](../reports/cooker-261103-0040-codebase-review.md), findings
B1, B3, B5, B6, B8, B9, B10, the smaller harness bugs and S3, S8; the planner verified B1, B3/B6,
B8, B9 and B10 in the source. The user approved the planner's proposal: "Duyệt, lên Plan 1 harness
rồi giao cooker" (user, 2026-11-03).

## Phases

| #   | Phase                                                                  | Depends on |
| --- | ---------------------------------------------------------------------- | ---------- |
| 1   | [Paths, output size and JSON state](./phase-01-paths-output-and-state.md) | none       |
| 2   | [Base copies, index drift, doctor, log, timeouts](./phase-02-base-index-doctor-timeouts.md) | 1 |

## Acceptance

- Every phase's Acceptance holds, each bug with a test that fails before the fix.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- The memory guard stays a `PostToolUse` report, not a `PreToolUse` block: "giữ nguyên" (user,
  2026-11-03).
- CRLF handling (B7), the init e2e job in CI (B4), the init bugs (Plan 2), a preset seam (S2).
- A lock around `skill-usage.json`: a lost update costs one skill one day of usage.
