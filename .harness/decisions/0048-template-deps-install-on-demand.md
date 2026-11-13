---
id: 0048
title: Local installs give every template its dependencies; CI and production never install them
status: Accepted
date: 2026-11-13
supersedes: none
---

# 0048: Local installs give every template its dependencies; CI and production never install them

## Context

`templates/nest/` ([0047](./0047-init-nest-preset.md)) had no `node_modules`: the editor read its own
`tsconfig.json` and reported every `@nestjs/*`, `zod` and `nestjs-pino` import as missing. More
templates (rn, next, react) will follow. Production installs nothing: the site image copies built
files, the package is private, and the bundle embeds template files without `node_modules`.

## Decision

The root `prepare` installs every `templates/<framework>/` outside the workspace, with no lockfile,
unless `CI` is set. `pnpm template:install [framework]` reinstalls on demand and
`pnpm template:clean <framework>` removes `node_modules` and `dist`. `pnpm-lock.yaml`, the root
install in CI and the release never carry template dependencies.

> "Sau này còn nhiều framework và libs khác nữa, như nest, rn, next, react,... cách 1 install hết lun à" (user, 2026-11-13)

> "Dev thì cài hết, còn prod thì tìm cách bỏ (ngầm) ra, hoặc làm gì đó để behaivior là không install
> các templates/<framework> tránh ảnh hưởng prod." (user, 2026-11-13)

## Options considered

| Option                                    | Consequence                                                    |
| ----------------------------------------- | -------------------------------------------------------------- |
| `prepare` install, skipped in CI (chosen) | Dev gets every template; lockfile, CI and production unchanged |
| Workspace member (tried, undone)          | Locked, but every install and CI run carries every template    |
| Manual install only (tried, replaced)     | Nothing implicit: each developer must remember to install      |

## Consequences

- Easier: a fresh clone's `pnpm install` makes every template editable.
- Harder: pnpm 11 skips `prepare` when an install changes nothing, so after `template:clean` or a pin
  run `pnpm template:install`; template versions resolve unlocked from carets, as a generated
  project's do.
- Enforced by: `scripts/template-deps.mjs` (the `CI` check); `scripts/framework-template.mjs` skips
  `node_modules` and `dist`, so an installed template never reaches the bundle.
