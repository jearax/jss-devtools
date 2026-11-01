---
id: 0024
title: A core folder, one folder per command, and role suffixes
status: accepted
date: 2026-10-21
---

# 0024 A core folder, one folder per command, and role suffixes

## Context

`src/` held one file, `src/cli.ts`. Before the first product command lands, the layout has to be
settled, or every later command invents its own shape. The old prototype had `.harness/decisions/`
and a flat source tree, and neither carried over.

The boundaries have to be enforceable, not a convention: the previous release shipped a global
process handler that turned a crash into exit 0, and a comment in the source did not stop it.

## Decision

`src/` has two folders, and a file name says what the file is.

```
src/
├─ cli.ts                     the program, the exit code, the global handlers
├─ core/                      shared; imports no command and no commander
└─ commands/
   └─ doctor/                 one folder per command
```

| Suffix         | Folder              | Role                                                             |
| -------------- | ------------------- | ---------------------------------------------------------------- |
| `.command.ts`  | command folder root | commander wiring, argument parsing, rendering through clack      |
| `.ui.ts`       | `ui/`               | terminal rendering built on `@clack/prompts`, shared by commands |
| `.service.ts`  | command folder root | the command's logic; returns data, prints nothing                |
| `.check.ts`    | `checks/`           | one doctor check                                                 |
| `.adapter.ts`  | `adapters/`         | the only knowledge of one external tool's command line           |
| `.util.ts`     | `utils/`            | stateless helpers                                                |
| `.constant.ts` | `constants/`        | constant values                                                  |
| `.error.ts`    | `errors/`           | error classes                                                    |
| `.type.ts`     | `types/`            | types only                                                       |

The rules live in `tests/support/architecture-rules.ts` and each has a negative fixture that breaks
exactly that rule:

| Id                                               | Rule                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `file-role-suffix`                               | Every file under `src/` except `cli.ts` has a suffix from the table, in its folder                  |
| `core-imports-no-command`                        | `src/core/**` never imports from `src/commands/**`                                                  |
| `command-imports-no-other-command`               | `src/commands/<a>/**` never imports `src/commands/<b>/**`; logic two commands share goes to `core/` |
| `commander-in-command-files-only`                | `commander` only in `*.command.ts` and `cli.ts`                                                     |
| `clack-in-ui-layer-only`                         | `@clack/prompts` only in `*.ui.ts`, `*.command.ts` and `cli.ts`                                     |
| `output-in-ui-layer-only`                        | `process.stdout`, `process.stderr`, `console.` only in `*.ui.ts`, `*.command.ts` and `cli.ts`       |
| `child-process-in-runner-only`                   | `node:child_process` only in `core/utils/run-command.util.ts`                                       |
| `runner-in-adapters-only`                        | the command runner is called only by an adapter                                                     |
| `no-process-exit-outside-entry-point`            | `process.exit` only in `cli.ts`                                                                     |
| `no-global-process-handlers-outside-entry-point` | global process handlers only in `cli.ts`                                                            |

H0 decision 0010's rule, one adapter per external tool, carries over: the strings `git --version` and
`git rev-parse` appear only in `src/core/adapters/git.adapter.ts`.

## Amendment 2026-10-27: two command-owned roles

Approved by the user on 2026-10-27 for the init command. The record keeps its original date.

| Suffix         | Folder                       | Role                                                                     |
| -------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `.constant.ts` | `commands/<name>/constants/` | constant values one command owns, such as the version table              |
| `.template.ts` | `commands/<name>/templates/` | the content of one file a command generates, as a function of its inputs |

## Amendment 2026-11-01: the modules layer and the hook entry

Approved for the harness feature before any harness code lands. The record keeps its original date.

`src/` gains a `modules/` layer between `commands/` and `core/`. Imports flow `cli.ts` →
`commands/` → `modules/` → `core/`.

| Suffix         | Folder                      | Role                                                                                                  |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.service.ts`  | `modules/<name>/` root      | the feature's logic; returns data, prints nothing                                                     |
| `.constant.ts` | `modules/<name>/constants/` | constant values the feature owns                                                                      |
| `.template.ts` | `modules/<name>/templates/` | the content of one file the feature writes                                                            |
| `.type.ts`     | `modules/<name>/types/`     | types                                                                                                 |
| `.hook.ts`     | `modules/<name>/hooks/`     | the handler of one Claude Code hook event: payload in, result out                                     |
| `.entry.ts`    | `modules/<name>/` root      | the entry of a program built on its own from the module; reads stdin, prints, sets `process.exitCode` |

New rules, each with a negative fixture:

| Id                                       | Rule                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `core-imports-no-module`                 | `src/core/**` never imports from `src/modules/**`            |
| `module-imports-no-command`              | `src/modules/<name>/**` never imports from `src/commands/**` |
| `module-imports-no-other-module`         | `src/modules/<a>/**` never imports `src/modules/<b>/**`      |
| `entry-imports-own-module-and-core-only` | a `*.entry.ts` imports only its own module and `src/core/**` |

The `commander`, `clack` and `output` rules now match `modules/` too: a module prints nothing and
wires no CLI. `*.entry.ts` is the one module file allowed `stdout`, `stderr` and `stdin`; it never
touches `commander` or `@clack/prompts`, and it sets `process.exitCode` — it never calls
`process.exit` and installs no global handler. `src/modules/harness/harness-hook.entry.ts` will be
the entry of the hook bundle Claude Code runs in an installed repository; a hook must never block a
session, so the entry exits 0 no matter what the module decided.

## Amendment 2026-11-01: services move into `services/`

Approved by the user on 2026-11-01 for every command and module, doctor included — one rule, no
count threshold. The record keeps its original date.

Every `*.service.ts` lives in the `services/` folder of its command or module. The root of
`src/commands/<name>/` holds only `*.command.ts` files; the root of `src/modules/<name>/` holds
only `*.entry.ts` files. The architecture rules enforce both.

| Suffix        | Folder                      | Role                                              |
| ------------- | --------------------------- | ------------------------------------------------- |
| `.service.ts` | `commands/<name>/services/` | the command's logic; returns data, prints nothing |
| `.service.ts` | `modules/<name>/services/`  | the feature's logic; returns data, prints nothing |

The two root rows in the earlier tables ("command folder root", "`modules/<name>/` root") are
superseded by this amendment. The `file-role-suffix` fixtures gain a misplaced `.service.ts` at a
command root and at a module root, each failing the rules.

## In the user's words

> "Cần modular hoá kiểu nestjs theo phân loại file nha, ví dụ: src/core/utils/abc.util.ts" (user,
> 2026-10-20)
>
> "IMHO, i think `src/modules` -> `src/commands`" (user, 2026-10-21)
>
> "modules/harness/ ngay từ đầu" (user, 2026-11-01)
>
> "Chuyển luôn, không ngoại lệ (Recommended)" (user, 2026-11-01)
>
> "Layout and rules: Approved as previewed, including H0 decision 0010's one-adapter-per-external-tool
> rule" (user, 2026-10-21)

## Consequences

- A new role needs an entry in the table, in `docs/code-standards.md` and in the rules, together. The
  rules are the contract, so a file with a suffix nothing allows fails the architecture test.
- A command cannot reach into another command. Two commands that need each other share something in
  `core/`, or they are one command.
- `core/` cannot import a command, so it stays free of product knowledge and a test proves it.
- The rule table and the fixtures are the source of truth. The table above is a copy; if the two
  disagree, the code wins.
