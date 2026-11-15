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

`init <dir> --framework react`, with or without `--monorepo`, goes through init's existing flow
(preflight, plan, dry run, confirmation, writes, install, sort, format, AgentKit) and writes the
React app.

## Files

- Modify: `src/commands/init/services/init.service.ts` — `react` is accepted with `<dir>`; without
  `<dir>` it throws `CliError` before any write: `Framework react needs <dir>`, hint
  `Create one with jss-devtools init <project-name> --framework react`. The hint for the unbuilt
  frameworks becomes `Only node, nest and react are`. `--no-sample` keeps its nest-only rule and
  its message.
- Create: `src/commands/init/services/react-plan.service.ts` — `reactCreateModeEntries` and
  `reactMonorepoAppEntries`, the react counterparts of `nest-plan.service.ts`.
- Create or modify: move what both plan services share (the manifest rename and merge of the shared
  devDependencies without `tsx` and `tsc-alias`, the `planEntry` helper) into one file both import.
  The nest output stays byte-identical.
- Modify: `src/commands/init/services/plan.service.ts` and `monorepo-plan.service.ts` — one
  dispatch line each. In the monorepo the template lands under `apps/react/` and the app is named
  `@<project>/react`.
- Modify: `src/commands/init/init.command.ts` — one example row,
  `jss-devtools init my-web --framework react -y` with `Create my-web as a Vite React app`, after
  the nest rows. Nothing else in the file.
- Modify: `tests/init.service.test.ts` (the "not supported yet" case moves from `react` to `rn`),
  `tests/init-plan.service.test.ts`, `tests/init.command.test.ts`, `tests/bundle.test.ts` (the
  `--help` snapshot), and `tests/monorepo-templates.test.ts` if needed.

## Steps

1. Argument rules and messages, with tests for: `react` with `<dir>` accepted; `react` without
   `<dir>` rejected; `--no-sample --framework react` rejected with today's message; `rn` and `next`
   still "not supported yet".
2. Plan entries for single and monorepo. The outro's dev command stays `<pm> run dev`.
3. Format step (decision 0046): init formats only the extensions in `PRETTIER_EXTENSIONS`
   (`init-format.service.ts`), which leaves out `.html`. Do not change that list; make sure
   `index.html` and every other template file already is Prettier output under the generated
   project's own config, so `prettier --check .` passes right after init.
4. Tests: sorted plan paths for react, single and monorepo; `node` and `nest` plans byte-equal to
   today; `--dry-run` writes nothing.

## Verification

- `pnpm vitest run tests/init.service.test.ts tests/init-plan.service.test.ts tests/init.command.test.ts tests/bundle.test.ts`
- `pnpm build`, then from the scratchpad
  `node <repo>/dist/cli.mjs init my-web --framework react --pm pnpm --dry-run` and the
  `--monorepo` form; paste both outputs in the report.
- The built bundle holds the React template: `grep -c "createAppRouter" dist/cli.mjs` is at least 1,
  and `dist/cli.mjs` grew; report the size before and after (452,975 bytes before this phase).
- `git diff --stat tests/` — the only expectation changes in existing tests are the `--help` block,
  the "Only node, nest and react are" hint and the moved "not supported yet" case.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
