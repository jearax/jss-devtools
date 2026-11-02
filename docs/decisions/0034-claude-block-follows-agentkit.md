---
id: 0034
title: the CLAUDE block follows AgentKit, the folder READMEs do not
status: accepted
date: 2026-11-02
supersedes: none
---

# 0034: the CLAUDE block follows AgentKit, the folder READMEs do not

## Context

Decision [0031](./0031-init-installs-the-harness.md) installed the harness with "one copy of every
file" and rejected "variant files per AgentKit setting", because the user had said "No variant
files". That sentence was read as covering every file, including the `CLAUDE.md` block, which
carried the AgentKit lines as a run-time condition: "When `ak-*` skills are present, AgentKit owns
`.harness/docs/` and `.harness/plans/`".

The user corrected the reading on 2026-11-02: the original remark was about the many README
variants that were on the table while the plan was being written, not about the block.

> "Ý tưởng ban đầu mang ý nghĩa là "delegate full cho ak nếu có ak"." and, on the templates README
> line, "thì tôi thấy vẫn còn chỉ định folder." (user, 2026-11-02)

> "trong `decision-log.md:155` tôi confirm là có quyết định, nhưng tôi và bạn đã hiểu sai 1 chút.
> Trong ngữ cảnh lúc đó, bạn thảo luận là lập plan cùng tôi, có quá nhiều files variant, gần như cho
> tất cả như .harness/{decisions/docs/plans/templates}/README.md,... nên tôi mới bảo thế."
> (user, 2026-11-02)

> "chỉnh sửa cho chỗ `CLAUDE.md` có nhận bởi flag --agent-kit được không?" (user, 2026-11-02)

The `CLAUDE.md` block is the one place agents always load, so it is the one place where the
AgentKit ownership has to be stated. The folder READMEs point at their own folder; an AgentKit
line in each of them repeated the same rule in four places and named a folder that the reader
was already in.

## Decision

**The `CLAUDE.md` block has two variants; the folder READMEs have none.** Both variants carry the
rule that the `harness-*` skills and `.harness/{bin,core,templates}/` belong to
`jss-devtools harness update`. The AgentKit variant adds two lines: the `ak-*` skills and
`.claude/{hooks,rules,agents,output-styles,scripts}/` belong to `ak update`, and AgentKit owns
`.harness/{docs,plans}/` and also works in `.harness/decisions/`.

**How the setting is known.** `init` reads the `--agent-kit` flag it already takes;
`harness update` detects it from `.agentkit/config.yaml`, the file `ak init` writes and the
project commits. The detector is one function, `usesAgentKit`, used by the update flow, the index
drift check and the doctor alike. The manifest records nothing about AgentKit.

> "Chọn 1, detect, nhưng quyết định này khá quan trọng / magic, nên docs rõ lại." (user,
> 2026-11-02)

> "2 vì khi init với --agent-kit, behaivior là ak init. Như vậy dựa vào ak đó, suy ngược lại."
> (user, 2026-11-02)

The first detector was any `.claude/skills/ak-*` entry, and it was wrong: `ak init` writes no
skill, it points AgentKit at the folders, so a repository installed with `--agent-kit` lost the
AgentKit lines on its next `harness update` while `.agentkit/config.yaml` still named
`.harness/docs` and `.harness/plans`. The config file is the evidence that AgentKit is in use
_in this repository_; AgentKit's own skills live in the user's global directory and say nothing
about this repository.

**The folder READMEs lose their AgentKit lines.** `.harness/docs/README.md`,
`.harness/plans/README.md` and `.harness/templates/README.md` say nothing about AgentKit. The
`decisions` README and the `harness-review` skill are unchanged.

## Options considered

| Option                                | Consequence                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Detect the setting (chosen)           | The block always states the ownership that holds now; a repository that gains or loses the AgentKit config changes                |
| Record the setting in the manifest    | Rejected: the setting is a fact about the working tree, and a recorded copy goes stale the moment the config is added or removed  |
| One block for both cases              | The previous state: one conditional line in every repository. Replaced at the user's request, so the block states only what holds |
| Keep the AgentKit line in the READMEs | Rejected: it repeats the block's rule in four files and names the folder the reader is already in                                 |

## Consequences

- Turning AgentKit on after the install and running `harness update` adds the AgentKit lines;
  removing `.agentkit/config.yaml` and running `harness update` removes them. The change reaches
  the block through its three-way merge, so it is a normal update, not a conflict.
- Installed repositories change on `harness update`; the templates and plans READMEs change as
  managed files. The docs README is a seed outside the manifest, so an installed repository keeps
  its old AgentKit line until the next install; that line names the folder AgentKit owns, which
  stays true in a repository that uses AgentKit.
- Easier: the block is the only place an agent has to read to learn who owns what.
- Harder: the block is a function of a detected setting, so the manifest records a hash of one
  variant while the block may name the other; the doctor checks the block for its markers, not
  against the manifest hash, so it reports nothing until `harness update` runs.
- Enforced by: `tests/harness-install-plan.service.test.ts` (the two variants, and no README that
  mentions AgentKit) and `tests/harness-update.test.ts` (the update keeps, adds and removes the
  lines; `init --agent-kit` followed by an update keeps them; `ak-*` skills without the config
  count as no AgentKit).
