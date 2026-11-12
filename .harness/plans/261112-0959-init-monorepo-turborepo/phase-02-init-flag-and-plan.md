---
phase: 2
title: "The flag, preflight and plan"
status: done
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: The flag, preflight and plan

## Goal

`init <dir> --monorepo` runs through init's existing flow (preflight, plan, dry run,
confirmation, writes, install, sort, AgentKit) and writes the monorepo tree.

## Files

- Modify: `src/commands/init/types/init-options.type.ts` — `monorepo?: true`.
- Modify: `src/commands/init/init.command.ts` — the option, one example row, and sorting both
  manifests. It is 273 lines already: keep the additions small, and move the sort helper into a
  service if it has to grow.
- Modify: `src/commands/init/services/init.service.ts` — argument rules.
- Modify: `src/commands/init/services/plan.service.ts` — a single dispatch line only.
- Create: `src/commands/init/services/monorepo-plan.service.ts` — the create-mode entries.
- Modify: `tests/init.service.test.ts`, `tests/init-plan.service.test.ts`,
  `tests/init.command.test.ts`, and `tests/init-command-wiring.test.ts` if the wiring list
  changes.

## Steps

1. **Option.** `--monorepo`, description
   `Create a Turborepo with the app under apps/<framework> (default: off)`. Example row:
   `jss-devtools init my-app --monorepo` with "Create my-app as a Turborepo monorepo".
2. **Argument rules** in `validateInitArguments`, before any write: `--monorepo` without `<dir>`
   throws `CliError('Option --monorepo needs <dir>', …)`, and the next step names
   `jss-devtools init <project-name> --monorepo`. Follow the shape of the existing `--pm`
   rule. `--monorepo` with `--force` is already rejected by the create-mode `--force` rule.
3. **Plan entries** in `monorepo-plan.service.ts`, used by `buildInitPlan` when
   `options.monorepo === true` in create mode:
   - root: `package.json`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs` (monorepo
     switch on), `.prettierrc.json`, `.editorconfig`, `.gitignore`, `.prettierignore`,
     `commitlint.config.mjs`, both husky hooks, `.vscode/*` unless `--no-vscode`, and
     `pnpm-workspace.yaml` (monorepo variant) for pnpm;
   - `apps/<framework>/package.json`, `apps/<framework>/tsconfig.json`,
     `apps/<framework>/src/main.ts` (reuse `srcMainTemplate`);
   - `packages/.gitkeep` (empty content).
   Reuse the single-package helpers (`hookCommands`, `derivePackageName`) instead of copying
   them; export them from where they live if needed. The harness entries stay as they are and
   land at the root.
4. **Preflight.** Create mode already requires a missing or empty folder; nothing new is needed.
   Do not touch existing mode: its monorepo rejection stays.
5. **Install and sort.** Install runs once at the root (`plan.targetDir`). Sort the root
   `package.json` and `apps/<framework>/package.json` with the project's own
   `prettier-package-json` and `prettier`, reusing `sortPackageJson` with a path parameter.
   A sort failure keeps today's message and `To finish` commands.
6. **Outro.** Unchanged commands: `<pm> run dev` at the root runs `turbo run dev`.
7. **Tests.**
   - `init.service.test.ts`: `--monorepo` without `<dir>` throws with the next-step command.
   - `init-plan.service.test.ts`: for pnpm, npm, yarn and bun, <!-- Updated: Validation Session 1 - bun supported --> the sorted entry paths equal the
     expected list; `pnpm-workspace.yaml` only for pnpm; `.vscode/*` absent with `--no-vscode`;
     harness paths present by default and absent with `--no-harness`.
   - `init.command.test.ts`: `--help` lists `--monorepo` and `(default: off)`;
     `init my-app --monorepo --dry-run --pm pnpm` prints `+ turbo.json` and
     `+ apps/node/package.json` and writes nothing; the existing counts without the flag are
     unchanged.

## Verification

- `pnpm test -- tests/init.service.test.ts tests/init-plan.service.test.ts tests/init.command.test.ts`
- `pnpm build`, then from a scratch folder outside the repository
  `node <repo>/dist/cli.mjs init my-app --monorepo --pm pnpm --dry-run`, showing the tree.
- `pnpm lint && pnpm typecheck && pnpm test`

## Risks

- `buildInitPlan` must keep returning the same entries when `monorepo` is unset; the existing
  plan tests are the guard and must pass without edits.
