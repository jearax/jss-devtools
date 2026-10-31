---
phase: 1
title: "Layout: the modules layer and the hook entry"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Layout: the modules layer and the hook entry

## Goal

Amend decision 0024 so the harness has a home that both commands import, and so the hook code has
its own entry point, before any harness code lands.

## Context

Decided in the decision log, section "Harness is a feature of `jss-devtools`": a new
`src/modules/` layer between commands and core. Not yet decided in words: where the hook entry
lives. `src/cli.ts` is today the only entry and the only file allowed to write the terminal and
set the exit code; hooks need the opposite rule (always exit 0).

## Layout after this phase

```
src/
├─ cli.ts                 the program; failures stay non-zero
├─ core/                  infrastructure; imports no module and no command
├─ modules/
│  └─ harness/            one folder per feature; no commander, clack or output,
│                          except harness-hook.entry.ts
└─ commands/
   ├─ init/
   └─ harness/            added in phase 5
```

Imports flow `cli.ts` → `commands/` → `modules/` → `core/`. `harness-hook.entry.ts` is the entry of
the hook bundle Claude Code runs in an installed repository (phase 3); it imports only its own
module and `core/`.

## Roles

| Suffix | Folder | Role |
|---|---|---|
| `.service.ts` | `modules/<name>/` root | the feature's logic; returns data, prints nothing |
| `.constant.ts` | `modules/<name>/constants/` | constant values the feature owns |
| `.template.ts` | `modules/<name>/templates/` | the content of one file the feature writes |
| `.type.ts` | `modules/<name>/types/` | types |
| `.hook.ts` | `modules/<name>/hooks/` | the handler of one Claude Code hook event: payload in, result out |
| `.entry.ts` | `modules/<name>/` root | the entry of a program built on its own from the module; reads stdin, prints, sets `process.exitCode` |

Add them to `ROLE_SUFFIXES` in `tests/support/architecture-rules.ts` before any broader pattern.

## Rules, each with a negative fixture under `tests/fixtures/architecture/src/`

| Id | Rule | Fixture |
|---|---|---|
| `core-imports-no-module` | `core/` imports nothing from `modules/` | `core/utils/imports-module.util.ts` |
| `module-imports-no-command` | `modules/` imports nothing from `commands/` | `modules/harness/imports-command.service.ts` |
| `module-imports-no-other-module` | a module imports nothing from another module | `modules/other/imports-harness.service.ts` |
| existing `commander-in-command-files-only`, `clack-in-ui-layer-only`, `output-in-ui-layer-only` | widened so `modules/` match them; `*.entry.ts` is allowed stdout and stdin, never commander or clack | one fixture each under `modules/harness/` |
| existing `no-process-exit-outside-entry-point`, `no-global-process-handlers-outside-entry-point` | unchanged: the entry sets `process.exitCode`, never calls `process.exit` or installs a global handler | none new |
| `entry-imports-own-module-and-core-only` | a `*.entry.ts` imports only its own module and `core/` | `modules/harness/imports-command.entry.ts` |
| `file-role-suffix` | extended to the new folders | `modules/harness/legacy-helper.ts`, `modules/harness/hooks/legacy-helper.ts` |

## Files

- Modify: `tests/support/architecture-rules.ts`, `tests/architecture.test.ts` if it lists fixtures.
- Create: the fixtures above.
- Modify: `docs/decisions/0024-core-and-command-layout.md` (amendment note with date and the user's
  quote "modules/harness/ ngay từ đầu"; the record keeps its original date),
  `docs/code-standards.md` (roles table), `docs/system-architecture.md` (layers, two entries),
  `CLAUDE.md` (the `src/cli.ts` row says "the only entry point"; add the `src/modules/` row and one
  line for `src/modules/harness/harness-hook.entry.ts`: the entry of the hook bundle Claude Code runs
  in an installed repository; the "Failures stay non-zero" rule gains one line that this entry is
  the deliberate exception, because a hook must never block a session).
- No `src/` file yet: an empty `modules/harness/` is not committed.

## Validation

```bash
pnpm vitest run tests/architecture.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Every new fixture fails its rule; the real tree passes.

## Risk and rollback

Pure tests and docs; revert the commit.
