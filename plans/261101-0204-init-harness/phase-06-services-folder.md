---
phase: 6
title: "Services move into services/"
status: pending
priority: P2
effort: "0.5d"
dependencies: [5]
---

# Phase 6: Services move into `services/`

## Goal

Every `*.service.ts` lives in a `services/` folder of its command or module. The root of
`src/commands/<name>/` holds only `.command.ts` files; the root of `src/modules/<name>/` holds only
`.entry.ts` files. No behavior changes.

## Context

> "Gom / gộp thành src/{commands/modules}/<command_name>/services/<service_name>.service.ts, có lẽ
> codebase đang flollow từ src/commands/doctor/doctor.serice.ts, đó là edge case vì command doctor
> chỉ có 1 mình doctor.service.ts" (user, 2026-11-01)

Doctor moves too: "Chuyển luôn, không ngoại lệ (Recommended)" (user, 2026-11-01). One rule, no
count threshold.

## Changes

- `git mv` every `src/commands/<name>/*.service.ts` to `src/commands/<name>/services/` (doctor,
  init, harness) and every `src/modules/<name>/*.service.ts` to `src/modules/<name>/services/`.
  Update every import; keep file names.
- `tests/support/architecture-rules.ts`: `ROLE_SUFFIXES` gains `commands/<name>/services/` and
  `modules/<name>/services/` with `.service.ts`; the command root allows only `.command.ts`, the
  module root only `.entry.ts`. Every rule that names a service by path follows the move.
- Negative fixtures: a `.service.ts` at a command root and at a module root each fail; move the
  existing service fixtures under `services/`.
- Docs: decision 0024 gains an amendment quoting the user; `docs/code-standards.md` roles table,
  `docs/system-architecture.md` layout tree, `docs/codebase-summary.md`, `CLAUDE.md` "Where things
  are" where they name a service path.

## Validation

```bash
pnpm vitest run tests/architecture.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

`git diff --stat -M` shows the moves as renames; no line of logic changes.

## Risk and rollback

A pure move; revert the commit.
