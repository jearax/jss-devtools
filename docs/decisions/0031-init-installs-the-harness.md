---
id: 0031
title: init installs the harness
status: accepted
date: 2026-11-01
supersedes: none
---

# 0031: init installs the harness

## Context

Phase 4 of the
[harness plan](../../plans/261101-0204-init-harness/plan.md) wires the harness into `jss-devtools init`.
The behaviors were decided with the user in the
[harness decision log](../../plans/261031-2325-init-harness-discussion/decision-log.md): the
defaults, the flags, the file table and kinds, the preflight rules, the manifest and the base
copies. This record is what an agent reads instead of replaying that log.

## Decision

**The harness is part of init's flow, not a second flow.** `jss-devtools init` installs the
toolchain and the harness, in both modes, through init's existing preflight, plan, dry run,
confirmation and writes. When init exits 1 at any step, the harness part never runs. Every
harness check runs in preflight, before the first write; a harness failure after the writes is
handled like an install failure, with `To finish:` commands.

**Defaults and flags.** The harness is installed by default; `--no-harness` installs the
toolchain only. `--agent-kit` (default off) only runs `ak init --docs-dir .harness/docs
--plans-dir .harness/plans` after the install, and it decides the `CLAUDE.md` block variant; it
changes no other file the harness writes, and the manifest records nothing about AgentKit. The
same setting is detected later from `.agentkit/config.yaml`, the file `ak init` writes. See
[0034](./0034-claude-block-follows-agentkit.md). `--agent-kit` with `--no-harness` exits 1 before
any write. Both defaults are stated in `--help`.

> "--harness trong command init giá trị default là true. --agent-kit gía trị default là false."
> (user, 2026-11-01)

**Files and kinds.** One copy of every file in the design proposal's table: the `CLAUDE.md` block
(kind `block`), the `.harness/` seeds (`MEMORY.md`, the mode's `BOOTSTRAP.md`, the `decisions/` and
`docs/` READMEs), the managed `.harness/plans/README.md` and `.harness/templates/README.md`, the
managed templates, the three `harness-*` skills, `config.json` (kind `config`),
`.harness/.gitignore`, the hook shim and the hook bundle, and the merge entries in
`.claude/settings.json`. The `CLAUDE.md` block is the one file that varies with AgentKit; see
[0034](./0034-claude-block-follows-agentkit.md). The manifest `.harness/core/manifest.json`
records the CLI version and each managed, block and config path with its kind and sha256;
`.harness/core/base/**` holds the installed text of each of those. Nothing is installed into
`.harness/state/`, `.harness/archive/` or `.harness/curator.json`; the CLI writes none of them.

**Preflight rules.** An existing harness path (`.harness/`, a `harness-*` skill, the block markers
in `CLAUDE.md`, a harness entry in `.claude/settings.json`) joins init's owned conflicts, so it
exits 1 listing it unless `-f`. `CLAUDE.md` or `.claude/settings.json` that is a symlink exits 1.
`.claude/settings.json` that is not valid JSON exits 1, naming the parse error. With
`--agent-kit`, `ak --version` must succeed in preflight, or init exits 1 with the install hint;
`ak` is never run without the flag.

**The CLI never commits, and the outro suggests no commit.** The outro names the harness once and
the next step: open Claude Code in the project folder.

## Options considered

| Option                              | Consequence                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Harness inside init's flow (chosen) | One flow, one plan, one confirmation; failures before the first write                                                                                                                        |
| A second `harness install` flow     | Two flows to keep in step; the prototype suffered this coupling                                                                                                                              |
| Variant files per AgentKit setting  | Rejected: "No variant files" (2026-11-01) — one copy, AgentKit lines as run-time conditions; the `CLAUDE.md` block is the one exception, see [0034](./0034-claude-block-follows-agentkit.md) |

## Consequences

- Easier: one command sets up a repository fully; `harness update` (phase 5) can merge against the
  manifest and base copies written in the same run.
- Harder: init's default plan grew from 13 to 48 files in create mode; `--no-harness` is the
  user-side escape, proven byte-for-byte by the existing tests rerun with the flag.
- Enforced by: `tests/harness-install-plan.service.test.ts`,
  `tests/init-preflight.service.test.ts`, `tests/init.command.test.ts` (`--no-harness` keeps the
  previous counts), `tests/bundle.test.ts` (the embedded hook bundle equals `dist/hooks.mjs`).
