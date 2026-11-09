---
title: Cooked the doctor learned skills count
date: 2026-11-03
summary: "harness doctor now prints one Learned skills row with the count instead of one row per learned skill."
---

# Cooked the doctor learned skills count

## What happened

The [doctor learned skills count plan](../261103-0018-doctor-learned-skills-count/plan.md) was
cooked as written. `jss-devtools harness doctor` now prints one summary row,
`Learned skills  <count>`, after `Decisions`, in place of the loop that printed one
`<name>  last used <date>` row per learned skill. The row is shown when the count is 0 as well.

The local `usageOf` helper and the `foldSkillUsage` import went with it; nothing else in the
command read the usage log. The learned-skill warnings from `learnedSkillIssues` are untouched and
still name the skill that needs attention. The report is
[cook-261103-0018](../reports/cook-261103-0018-doctor-learned-skills-count.md).

## Findings

- **The warning rows share the `Learned skills` label.** `learnedSkillIssues` already emits
  `label: 'Learned skills'` for every learned-skill problem, so the label was not free to take.
  The summary row keeps that label on purpose: one label, one meaning, and the warnings read as
  problems with that same group.
- **A never-used learned skill still prints its name.** The summary no longer names skills, but
  the "never used — consider `harness-curate`" warning does. The first test therefore dates both
  skills to today in `.harness/state/skill-usage.json`, so the assertion that no skill name
  reaches the output measures the summary rows rather than the warnings.
- **The first lint run failed on the new test.** The inline `JSON.stringify` call for the usage
  fixture broke the Prettier line width and the `object-curly-newline` rule. `pnpm format` fixed
  it and the gate was rerun from the top.

## Measurements

Gate on Node 24.22.0: lint clean, typecheck clean, `Test Files 28 passed | 1 skipped (29)`,
`Tests 443 passed | 7 skipped (450)`, build green (`dist/cli.mjs` 323.40 kB, gzip 84.37 kB).

The doctor was run against a real `jss-devtools init` install carrying two learned skills, both
dated today in the usage log:

```
┌   jss-devtools harness doctor
│  ✔ Version         0.0.1
│  ✔ Memory          488/4800 chars, 5 entries
│  ✔ Decisions       0 decisions in force
│  ✔ Learned skills  2
│
└  Harness is healthy
```

## Follow-up: the Decisions row became a bare count

After the phase landed, the user asked for the `Decisions` row to match the `Learned skills` row:
`detail` is now `String(decisionsInForce(root).length)` instead of `N decisions in force`. The
fresh-install test asserts `/Decisions\s+0/` and that `decisions in force` is gone from the output.

The plan had listed the "1 decisions" wording as a non-goal for that phase. The user reversed that
after seeing the table, so the row changed. The `decisions in force` wording in the CLAUDE block
template and the harness skills template stays; those are harness prose, not the doctor table.

## Next steps

- Nothing was committed or pushed; the working tree holds the change for review.
- The count row says nothing about freshness. A repo with 30 learned skills and 25 of them
  stale still prints `Learned skills  30`; the staleness lives in the warnings, which list the
  names. That is the split the plan chose, and it is worth watching if the warning list grows
  long enough to push the warnings off the screen.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
