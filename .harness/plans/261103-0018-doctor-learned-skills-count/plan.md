---
title: "harness doctor counts learned skills in one row"
description: "The doctor summary shows one Learned skills row with the count instead of one row per learned skill."
status: completed
priority: P3
effort: 30m
branch: main
tags: [harness, doctor]
blockedBy: []
blocks: []
created: 2026-11-03
---

# harness doctor counts learned skills in one row

## Outcome

The `harness doctor` summary prints one row, `Learned skills  <count>`, in place of one
`<name>  last used <date>` row per learned skill. A repository keeps 10 to 30 learned skills once
the curator runs, and a row per skill pushes the warnings down. The user chose the count alone:
"Chỉ 1 dòng `Learned skills <số>`" (user, 2026-11-03). A date beside the count was dropped because
it does not say whose date it is.

## Change

- `src/commands/harness/services/doctor.service.ts`, `summaryRows`: replace the per-skill loop with
  one row `{ label: 'Learned skills', status: 'ok', detail: String(learnedSkillNames(root).length) }`,
  placed after `Decisions`. Shown also when the count is 0.
- Remove `usageOf` and the `foldSkillUsage` import there; nothing else in the command uses them.
- Unchanged: the learned-skill warnings from `learnedSkillIssues` (for example "unused for N days"),
  which name the skill that needs attention.
- `tests/harness-doctor.test.ts`: a fixture with two learned skills prints `Learned skills` with
  `2` and prints neither skill name as a summary row; a fixture with none prints `0`.

## Acceptance

- The summary has exactly one `Learned skills` row; no per-skill rows remain.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- The skill-usage log and the curator, which still read last-use dates per skill.
- Any other summary row, including the "1 decisions" wording.
