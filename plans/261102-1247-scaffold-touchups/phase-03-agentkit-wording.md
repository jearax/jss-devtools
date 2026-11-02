---
phase: 3
title: "AgentKit wording in the harness"
status: pending
priority: P3
effort: "1h"
dependencies: []
---

# Phase 3: AgentKit wording in the harness

## Input

> "Ý tưởng ban đầu mang ý nghĩa là "delegate full cho ak nếu có ak"." and, on the templates README
> line, "thì tôi thấy vẫn còn chỉ định folder." (user, 2026-11-02)

The wording was settled line by line with the user on 2026-11-02:

- `.harness/` splits in two. `bin`, `core` and `templates` belong to `jss-devtools harness update`;
  `decisions`, `docs` and `plans` are where AgentKit's skills write.
- `ak-*` stays in the wording: "khi `ak-*` skills thay đổi, mình sẽ maintenance theo ak".
- AgentKit owns `docs` and `plans`, but only "works in" `decisions`, because the hooks read the
  decision file names, `status` and index rows. AgentKit has no setting or skill for a decision
  format (`ak init --help` offers only `--docs-dir` and `--plans-dir`), so agents keep the format of
  `.harness/templates/decision.md` already linked from `decisions/README.md`.
- No extra line about the learned-skill marker: the `## Where knowledge goes` table already sends
  every learned skill to `.harness/templates/skill.md`.
- One "do not edit" bullet with the shared correction route, and one line per updater.

## Target text

`src/modules/harness/templates/claude-block.template.ts`: replace the two bullets that start
"Do not edit `harness-*` skills" and "When `ak-*` skills are present" with exactly:

```
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.
- When `ak-*` skills are present, AgentKit owns `.harness/{docs,plans}/`: follow its skills there.
  It also works in `.harness/decisions/`.
```

`src/modules/harness/templates/harness-seeds.template.ts`, `harnessDecisionsReadmeTemplate`: after
the "Write one from …" paragraph and before the table, add a paragraph:

```
When `ak-*` skills are present, AgentKit also works in this folder.
```

`src/modules/harness/templates/harness-template-files.template.ts`,
`harnessTemplatesReadmeTemplate`: delete the line "When `ak-*` skills are present, AgentKit owns
`../docs/` and `../plans/`: follow its skills there." and the blank line it leaves.

Unchanged: the AgentKit line in the docs and plans READMEs, and the `harness-review` skill.

## Upgrade path

The CLAUDE block (`block`) and the templates README (`managed`) reach installed repositories
through `jss-devtools harness update`. The decisions README is a `seed`, outside the manifest
(`install-plan.service.ts:111`), so only new installs get its line; the CLAUDE block carries the
same fact for installed repositories. No migration.

## Files

- The three template files above.
- Tests that print these texts, if any (`grep -rn "AgentKit owns\|replaces them" tests`).
- `docs/` only if a doc quotes these lines.

## Steps

1. Apply the target text exactly.
2. `pnpm vitest run tests/harness*` and fix only expected text.
3. Run `init -y` in a temp folder outside this repository and paste the generated CLAUDE block
   section, `.harness/decisions/README.md` and `.harness/templates/README.md`.
4. Full gate.

## Acceptance

- The generated files contain the target text and no other change.
- `jss-devtools harness doctor` on the step 3 folder reports no new issue.

## Risk and rollback

Template text only; revert the commit. Installed repositories change only when they run
`harness update`, through its usual three-way merge.
