---
phase: 3
title: "Init wiring"
status: done
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 3: Init wiring

## Goal

`init <dir> --framework nest`, with or without `--monorepo`, goes through init's existing flow
(preflight, plan, dry run, confirmation, writes, install, sort, format, AgentKit) and writes the
Nest app.

## Files

- Modify: `src/commands/init/services/init.service.ts` — `nest` is accepted; with existing mode
  (no `<dir>`) it throws `CliError` before any write, naming `jss-devtools init <project-name>
  --framework nest`. The other unbuilt frameworks keep today's message.
- Create: `src/commands/init/services/nest-plan.service.ts` — plan entries: the embedded map with
  the project name substituted at the paths phase 1 listed, plus the shared toolchain entries from
  the existing templates, minus any path the template provides itself.
- Modify: `src/commands/init/services/plan.service.ts` and `monorepo-plan.service.ts` — one
  dispatch line each. In the monorepo, the template lands under `apps/nest/`, its root-only files
  (husky, commitlint, Prettier and ESLint config, `.vscode`) stay at the root as for `node`, and
  `@<project>/nest` is the app's name.
- Modify: `src/commands/init/init.command.ts` — the `--framework` description stops saying "only
  node for now"; one example row. Keep the change to those lines (the file is 340 lines; its split
  is deferred by the user).
- Modify: `tests/init.service.test.ts`, `tests/init-plan.service.test.ts`,
  `tests/init.command.test.ts`, `tests/monorepo-templates.test.ts` as needed.

## Steps

1. Argument rule and message; the `--help` snapshot changes only in the `--framework` line and the
   example row.
2. Plan entries for single and monorepo; the outro's dev command is `<pm> run dev`, which the
   template's `package.json` maps to `nest start --watch` (root: `turbo run dev`).
3. Format step (decision 0046): every written file Prettier can parse is formatted; check the
   template already is Prettier output, so the step changes nothing.
4. Tests: sorted plan paths for nest per manager, single and monorepo; `node` plans byte-equal to
   today; existing mode with nest throws before any write; `--dry-run` writes nothing.

## Verification

- `pnpm vitest run tests/init.service.test.ts tests/init-plan.service.test.ts tests/init.command.test.ts`
- `pnpm build`, then from the scratchpad
  `node <repo>/dist/cli.mjs init my-api --framework nest --pm pnpm --dry-run` and the monorepo form.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
