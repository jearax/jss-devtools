---
id: 0032
title: harness update follows the old prototype's decision 0001 unchanged
status: accepted
date: 2026-11-01
---

# 0032: harness update follows the old prototype's decision 0001 unchanged

## Context

Phase 5 of the
[harness plan](../../plans/261101-0204-init-harness/phase-05-harness-update.md) adds
`jss-devtools harness update`. The behavior was decided with the user in the
[harness decision log](../../plans/261031-2325-init-harness-discussion/decision-log.md) and
carried over from the previous prototype's
`.harness/decisions/0001-update-conflicts-human-decided-install-collisions-overwrite.md`.

## Decision

**Without a conflict, `update` applies the change; with a conflict it stages and exits 1.** The
merge never touches the live tree on a conflict. It stages `base/`, `local/`, `upstream/` and a
`resolved/` copy pre-filled with the merge proposal under `.harness/update/`, exits 1 and names
`harness update --continue` and `harness update --abort`. The agent proposes a resolution by
editing the staged copies; the user decides and continues.

> "Tôi nhớ bản harness đang triển khai lần trước ... có quyết định như sau: update bình thường nếu
> không có xung đột, exit 1 và gợi ý --abort|--continue nếu có xung đột" (user, 2026-11-01)
>
> "Giống 0001 nguyên vẹn, tự commit sau khi update thành công, đơn giản hoá thao tác là strategy
> của thiết kế harness cũ, giờ vẫn giữ tinh thần đó." (user, 2026-11-01)

**The CLI never commits and suggests no commit.** `init` and `update` write files; the user
commits. So `update` needs no git identity and no clean tree in its preflight — the same as init.

> "Tôi vừa kiểm tra lại jss-devtools init mới, sau khi tạo chưa commit gì, thôi thì nếu update thì
> cũng không commit luôn nha" (user, 2026-11-01)
>
> "đổi ý lại - không outro không gợi ý commit" (user, 2026-11-01)

**What update covers.** Everything the harness recorded in `.harness/core/manifest.json`:
managed files by three-way merge, the `CLAUDE.md` block merged and staged in unit space (the text
between the markers), `config.json` key by key, the harness entries in `.claude/settings.json`
replaced while every other hook is kept, and the hook bundle `.harness/bin/hooks.mjs` always
overwritten — it is minified build output; nobody edits it by hand. Seeds, learned skills,
`.harness/archive/`, `.harness/curator.json` and the toolchain init installed are never touched.
The upstream text is always the templates inside the installed CLI; update downloads nothing.
The `CLAUDE.md` block is rendered for the AgentKit setting update detects in the repository
(`.agentkit/config.yaml`), see
[0034](./0034-claude-block-follows-agentkit.md).

**The edge cases carry over from the prototype.** A managed file deleted locally is a conflict,
not recreated; a file dropped upstream is deleted when untouched and a conflict when edited; a
downgrade is refused with the CLI install command; a missing base copy exits with "restore
`.harness/core` from git"; invalid `config.json` exits in preflight naming the line; a missing
config key is written back with its default even at the same version; `--continue` refuses staged
copies that still hold conflict markers or block markers; a lock file in `.harness/update/` keeps
two updates from running at once, and a crashed run leaves it — deleting it is the way back.

## Consequences

- A conflict run asks no question and stages even without a terminal, because the staged copies
  are the agent's proposal workspace: the agent runs `update`, resolves, continues. Only the
  live write asks.
- The line merge is `git merge-file` behind the same adapter every other git call uses, with
  labelled markers (`yours` / `the installed version` / `the new version`); no new dependency.
- Staging validates the resolved copies on `--continue` and refuses while they hold markers, so
  a half-resolved conflict cannot reach the live tree.
