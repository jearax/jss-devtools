---
id: 0059
title: Harness knowledge is ordinary tracked content, and the share mode is gone
status: Accepted
date: 2026-11-18
supersedes: 0053
---

# 0059: Harness knowledge is ordinary tracked content, and the share mode is gone

## Context

[0053](./0053-knowledge-gitignored-unless-share-knowledge.md) made harness knowledge gitignored by
default with an opt-in `--share-knowledge`. The private mode turned out to cost more than it
protected: knowledge could not reach a fresh clone or a second machine, skill usage counted per
machine, and the variant ignore files added a second install shape that every reader had to handle.
This repository itself ran in shared mode, so the shipped default was not the mode the product's own
repository uses.

## Decision

- Harness knowledge is ordinary tracked content. `init` has no `--share-knowledge` option; the
  `knowledge.share` key, the doctor `Knowledge` row, the session-start shared/private line and the
  private-mode seeding are gone. Every install behaves the way shared mode did under 0053.
- `.harness/.gitignore` keeps ignoring only the machine-local state (`state/`, `update/`). The
  `.claude/skills/.gitignore` variant file is gone.
- An old install whose `.harness/config.json` still holds `knowledge.share` keeps working: every
  reader ignores the key silently — no warning, no rewrite.
- Completed plans and old decision records stay untouched as historical records. This repository's
  own `.harness/config.json` drops the key, and its git index is refreshed against the new ignore
  files.

> "Bỏ hẳn key knowledge.share" (user, 2026-11-18); the scope of the removal: "Fix tất cả mọi thứ
> liên quan, nói chung là bỏ chức năng đó, git repo này --cached lại" (user, 2026-11-18); old
> installs: "Bỏ qua key im lặng" (user, 2026-11-18); old plans: "Giữ nguyên plan cũ" (user,
> 2026-11-18)

## Options considered

| Option                     | Consequence                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| Remove the whole feature   | One install shape again; knowledge reaches clones and second machines    |
| Keep both modes            | Every reader keeps handling two ignore variants and the migration ladder |
| Flip the default, keep key | Still two install shapes; the key remains a trap for team setups         |

## Consequences

- Easier: `init`, `harness update`, doctor and the hooks lose the share branch; knowledge backs up
  and travels with the repository.
- Harder: an install that relied on private mode must untrack its knowledge itself; the harness
  will not gitignore it again.
- Enforced by: the acceptance grep over `src`, `tests`, `site/src`, `README.md`, `CLAUDE.md` and
  `.harness/docs`, plus the init, update and hook tests.
