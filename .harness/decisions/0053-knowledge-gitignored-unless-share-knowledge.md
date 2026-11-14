---
id: 0053
title: Harness knowledge is gitignored unless init is given --share-knowledge
status: Accepted
date: 2026-11-14
supersedes: none
---

# 0053: Harness knowledge is gitignored unless init is given --share-knowledge

## Context

The harness tells the agent to write memory, decisions, docs, plans and learned skills and to
commit them with the work. In a public repository that publishes whatever the agent wrote, and a
fresh clone of a private setup starts empty either way, so the default should not share.

## Decision

- `init` ignores harness knowledge by default; `init --share-knowledge` keeps it in git. The key
  is `knowledge.share` in `.harness/config.json` (default `false`).
- Knowledge is `.harness/MEMORY.md`, `.harness/BOOTSTRAP.md`, `.harness/curator.json`,
  `.harness/decisions/`, `.harness/docs/`, `.harness/archive/`, `.harness/plans/` and learned
  skills under `.claude/skills/` (the harness- and ak-owned folders stay tracked).
- Private mode cannot back knowledge up, cannot put it on a fresh clone or a second machine, and
  counts skill usage per machine.
- Migration rule: a live boolean wins, then the base copy's boolean, and an install that predates
  the key counts as sharing (`true`). `harness update` re-renders the two ignore files; going
  private afterwards needs `git rm -r --cached <paths>` from the user, and sharing needs `git add`.
- The two ignore files (`.harness/.gitignore` and `.claude/skills/.gitignore`) are the exception to
  the "No variant files" rule of [0031](./0031-init-installs-the-harness.md); they follow the key.

> "việc default value thì tôi nghĩ là tắt (tức là ignore á)" (user, 2026-11-13); the flag:
> "Dùng --share-knowledge" (user, 2026-11-13); documenting it: "phải docs rõ ràng, explain đầy đủ
> về flag đó" (user, 2026-11-13)

## Options considered

| Option                             | Consequence                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| Ignored by default, opt-in sharing | A public repository stays safe out of the box; teams opt in                       |
| Shared by default                  | Every new public repository publishes agent knowledge unless remembered otherwise |

## Consequences

- Easier: `init` is safe on a public repository without a second thought.
- Harder: a team that wants shared knowledge must pass the flag once, or flip the key and run
  `git add` after `harness update`.
- Enforced by: the ignore templates in `init` and `harness update`, the doctor `Knowledge` row,
  and review.
