---
id: 0046
title: init formats every file it writes with the project's own Prettier
status: Accepted
date: 2026-11-12
supersedes: none
---

# 0046: init formats every file it writes with the project's own Prettier

## Context

Templates rendered with `JSON.stringify` and hand-written strings did not match the generated
project's Prettier, so its first `format` or commit rewrote files the user never touched. Eleven of
thirteen template outputs were affected, including the single-package `tsconfig.json`. The user had
asked that generated root files be standard.

## Decision

After the install and the manifest sort, `init` runs the project's own `prettier --write` over every
file it wrote, in create, existing and monorepo mode. Files Prettier has no parser for are left out;
a failure keeps the "files are written" message and its `To finish` command.

> "turbo.json và package.json cũng như các generated files ở cấp root phải chuẩn đó nha." (user,
> 2026-11-12)

Offered the fix, the user chose "init tự format sau install" (2026-11-12), accepting that the
single-package `tsconfig.json` output changes.

## Options considered

| Option                             | Consequence                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| Format after install (chosen)      | Output always matches the pinned Prettier, in every mode     |
| Hand-format the new templates only | Leaves the single-package defect; drifts when Prettier moves |
| Accept the first-format diff       | A fresh project rewrites itself on its first commit          |

## Consequences

- Easier: a template can be written in any shape; the project's formatter has the last word.
- Harder: init depends on the installed Prettier; a format failure is one more post-install step.
- Enforced by: `tests/init.e2e.test.ts` and `tests/init-monorepo.e2e.test.ts` assert
  `prettier --check .` passes right after init, for each manager.
