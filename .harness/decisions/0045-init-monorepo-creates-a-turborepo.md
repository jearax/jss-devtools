---
id: 0045
title: init --monorepo creates a Turborepo with one app under apps/<framework>
status: Accepted
date: 2026-11-12
supersedes: 0030 (the monorepo non-goal, for create mode only)
---

# 0045: init --monorepo creates a Turborepo with one app under apps/<framework>

## Context

[0030](./0030-init-node-preset.md) made monorepos a non-goal. The user wants `init` to scale to
monorepos through a `--monorepo` flag (default off) using Turborepo, modelled on design-system
([0014](./0014-toolchain-modelled-on-design-system.md)). The contract and the docs check are in
the [brainstorm report](../plans/reports/brainstorm-261112-1616-init-monorepo-turborepo.md).

## Decision

`init <dir> --monorepo` creates a Turborepo root with one app at `apps/<framework>` (`apps/node`)
and an empty `packages/`. It works in create mode only; existing mode, including its rejection of
an existing monorepo, is unchanged. pnpm, npm, yarn 1 and bun are supported. The toolchain and the
harness are written once, at the root. The root files follow the Turborepo docs, except where the
user chose this repository's conventions: the `typecheck` task name and the top-level
`packageManager` field. The app's package name is scoped by the root's name, `@my-app/node`.

> "--monorepo (default false, use behaivior turborepo)" (user, 2026-11-12)

> "dùng tên apps/<framework_mode> nha, để sau này scale theo react|nest|..." (user, 2026-11-12)

> "turbo.json và package.json cũng như các generated files ở cấp root phải chuẩn đó nha." (user,
> 2026-11-12)

> "Dùng `@my-app/node` nhưng repo folder chỉ là node" (user, 2026-11-12)

The user also chose, among offered options: create mode only; pnpm, npm and yarn 1, and later bun ("Hỗ trợ bun", user, 2026-11-12, when
planning found `--pm` also accepts bun); one toolchain
at the root; `typecheck`; top-level `packageManager`.

## Options considered

| Option                               | Consequence                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| Root + `apps/<framework>` (chosen)   | One runnable app proves turbo's graph; frameworks sit beside |
| Empty root                           | Rejected: turbo has nothing to run, nothing to prove         |
| Shared config packages               | Rejected: more files, departs from design-system             |
| `check-types`, `devEngines`, `@repo` | Rejected: docs defaults that split from the preset's names   |

## Consequences

- Easier: adding `react` or `nest` later means another `apps/<framework>`.
- Harder: three package managers each need a monorepo e2e branch.
- Enforced by: the init plan and e2e tests the implementing plan adds.
