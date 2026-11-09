---
id: 0040
title: The repository runs on its own harness
status: Accepted
date: 2026-11-09
supersedes: 0012
---

# 0040: The repository runs on its own harness

## Context

The harness shipped to consumers without dogfooding: this repository still kept its knowledge in
`docs/` and `plans/`, so `init`'s output was never exercised against a real, messy repository. The
repo is stable enough to migrate.

## Decision

`jss-devtools init -f -y --agent-kit` is applied to this repository in existing mode, and the
project knowledge moves where the harness and AgentKit expect it: `docs/decisions/` →
`.harness/decisions/`, `docs/` → `.harness/docs/`, `plans/` → `.harness/plans/`. Decision records live in `.harness/decisions/`, one file per decision; this
supersedes [0012](0012-decision-records-location.md), whose `docs/decisions/` home no longer
exists.

> "Repo này xem như stable rồi. Nhưng tôi muốn apply chính `jss-devtools` vào repo này, chủ yếu là
> port/migrate qua. Dùng `jss-devtools` với --pm pnpm" (user, 2026-11-09)

Asked how deep the migration goes:

> "--agent-kit, dời hết" (user, 2026-11-09)

The `--pm pnpm` in the first quote is moot: existing mode rejects `--pm` by design
([0030](0030-init-node-preset.md)), and pnpm is detected from `packageManager`.

## Options considered

| Option                           | Consequence                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--agent-kit`, move all (chosen) | Harness and AgentKit both manage the moved knowledge                                                                                 |
| Harness only, no AgentKit        | Plans stay outside the harness; `harness update` would later drop the AgentKit block ([0034](0034-claude-block-follows-agentkit.md)) |
| Do not dogfood                   | `init` keeps shipping unexercised against a real repository                                                                          |

## Consequences

- Easier: the harness is exercised by its own development; `harness doctor` and
  `harness update` run against a real install.
- Harder: `.claude/settings.json`, `.claude/skills/harness-*` and `.agentkit/config.yaml` must be
  committed (the default `.gitignore` entries for `.claude/` and `.agentkit/` were narrowed), so
  hooks and the AgentKit block follow on every clone.
- Enforced by: `node dist/cli.mjs harness doctor` (index drift) and `harness update --dry-run`.
