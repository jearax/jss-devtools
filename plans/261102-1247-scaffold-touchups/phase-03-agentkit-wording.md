---
phase: 3
title: "The CLAUDE block follows AgentKit"
status: completed
priority: P3
effort: "3h"
dependencies: []
---

# Phase 3: The CLAUDE block follows AgentKit

## Input

> "Ý tưởng ban đầu mang ý nghĩa là "delegate full cho ak nếu có ak"." and, on the templates README
> line, "thì tôi thấy vẫn còn chỉ định folder." (user, 2026-11-02)

> "trong `decision-log.md:155` tôi confirm là có quyết định, nhưng tôi và bạn đã hiểu sai 1 chút.
> Trong ngữ cảnh lúc đó, bạn thảo luận là lập plan cùng tôi, có quá nhiều files variant, gần như cho
> tất cả như .harness/{decisions/docs/plans/templates}/README.md,... nên tôi mới bảo thế." and
> "chỉnh sửa cho chỗ `CLAUDE.md` có nhận bởi flag --agent-kit được không?" (user, 2026-11-02)

> "Chọn 1, detect, nhưng quyết định này khá quan trọng / magic, nên docs rõ lại." (user,
> 2026-11-02), on how `harness update` learns whether AgentKit is in use.

Settled with the user on 2026-11-02:

- "No variant files" was about the many README variants. The `CLAUDE.md` block is the one place
  that varies with AgentKit; it is already the index agents always load, so the folder READMEs lose
  their AgentKit lines.
- `.harness/` splits in two: `bin`, `core` and `templates` belong to `jss-devtools harness update`;
  `docs` and `plans` are owned by AgentKit; AgentKit only works in `decisions`, because the hooks
  read decision file names, `status` and index rows, and AgentKit has no decision format of its
  own (`ak init --help` offers only `--docs-dir` and `--plans-dir`).
- `ak-*` stays in the wording: "khi `ak-*` skills thay đổi, mình sẽ maintenance theo ak".
- One "do not edit what an update replaces" rule, one line per updater, one shared correction route.
- No line about the learned-skill marker: the `## Where knowledge goes` table already sends every
  learned skill to `.harness/templates/skill.md`.

## How the AgentKit setting is known

| Moment               | Source                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `init`               | the `--agent-kit` flag (`HarnessInstallInput.agentKit`, already there) |
| `harness update`     | `usesAgentKit(root)`: `.agentkit/config.yaml`, the file `ak init` writes |
| `harness doctor`     | unchanged: it checks the block for its markers, not against the manifest hash |

Consequences, stated in the docs (below): turning AgentKit on after the install and running
`harness update` adds the AgentKit lines; removing `.agentkit/config.yaml` and running `harness
update` removes them. The manifest still records nothing about AgentKit.

## Target text

`src/modules/harness/templates/claude-block.template.ts`: `harnessClaudeBlockTemplate` becomes a
function of `agentKit: boolean`. Replace the two bullets that start "Do not edit `harness-*`
skills" and "When `ak-*` skills are present" with:

Without AgentKit:

```
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
```

With AgentKit:

```
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.
- AgentKit owns `.harness/{docs,plans}/`: follow its skills there. It also works in `.harness/decisions/`.
```

The rest of the block is identical in both.

Delete the AgentKit line, and the blank line it leaves, from:

- `harnessDocsReadmeTemplate` and `harnessPlansReadmeTemplate` in `harness-seeds.template.ts`;
- `harnessTemplatesReadmeTemplate` in `harness-template-files.template.ts`.

`harnessDecisionsReadmeTemplate` and the `harness-review` skill stay as they are.

## Code

- `install-plan.service.ts`: `OWNED_FILES` passes `input.agentKit` to the block template.
  `harnessRecordedFiles` takes the AgentKit setting as an argument instead of hard-coding `false`.
- `update-release.service.ts`: `harnessRelease(root)` passes `usesAgentKit(root)`.
- `src/commands/harness/update.command.ts`: pass the repository root.
- Keep `usesAgentKit` the single detector; it lives in `agent-kit.service.ts`, out of
  `index-drift.service.ts`, because the update flow, the index drift check and the doctor all
  read it.

## Tests

- The install entries contain the AgentKit lines with `agentKit: true` and none of them with
  `false`; nothing else in the block differs.
- `harness update` in a repository installed with AgentKit and still holding `.agentkit/config.yaml`
  keeps the AgentKit lines and reports no conflict.
- A repository installed without AgentKit that gains `.agentkit/config.yaml` gets the lines on
  `harness update`; one that loses it loses them.
- `init --agent-kit` followed by `harness update` keeps the lines: the case the `ak-*` detector
  got wrong, because `ak init` writes `.agentkit/config.yaml` and no `ak-*` skill.
- A repository with `.claude/skills/ak-*` but no `.agentkit/config.yaml` counts as no AgentKit.
- No generated folder README contains "AgentKit".

## Docs

The user asked for this to be documented clearly.

- New `docs/decisions/0034-claude-block-follows-agentkit.md`, in the format of 0033: the context
  (the README variants, the misread of "No variant files"), the decision (the block varies, the
  READMEs do not; `init` reads the flag, `harness update` detects `.agentkit/config.yaml`), the
  consequences above, the options considered (detection vs a recorded setting, which the user
  rejected), and the user quotes in this file.
- `docs/decisions/0031-init-installs-the-harness.md`: the "One copy of every file" paragraph and
  the "Variant files per AgentKit setting" row point to 0034 for the block; list
  `plans/README.md` as managed, as the code does (`install-plan.service.ts:95`).
- `docs/decisions/0032-harness-update.md`: one line that `update` renders the block for the
  AgentKit setting it detects, linking 0034.
- `docs/project-roadmap.md` and `docs/system-architecture.md` only where they describe the block
  or the AgentKit flag.

## Upgrade path

Installed repositories change on `harness update`: the block through its three-way merge, the
templates and plans READMEs as managed files. The docs README is a seed outside the manifest, so
installed repositories keep its old AgentKit line; it says the same as the block and needs no
migration.

## Steps

1. Template and code changes; `pnpm vitest run tests/harness*`.
2. The tests above, each seen failing once against the old code.
3. In two temp folders outside this repository: `init -y` and `init -y --agent-kit` (skip the
   second if `ak` is not installed and say so); paste the block section of each `CLAUDE.md`, then
   run `jss-devtools harness doctor` in each.
4. Docs.
5. Full gate.

## Acceptance

- The two block variants match the target text exactly.
- No folder README the harness writes mentions AgentKit.
- `harness update` keeps, adds or removes the AgentKit lines as the tests describe.
- Doctor reports no new issue in either step 3 folder.
- 0034 exists and 0031, 0032 point to it.

## Risk and rollback

Revert the commit. A repository updated in between keeps whichever block it last received, and the
next `harness update` renders it again.
