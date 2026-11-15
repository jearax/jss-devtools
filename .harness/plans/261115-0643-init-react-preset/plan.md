---
title: "init --framework react creates a Vite React app"
description: "Add the react preset to jss-devtools init, in create mode and with --monorepo, copied from the real project kept in templates/react/."
status: in-progress
priority: P1
effort: 4d
branch: main
tags: [feature, cli, init]
blockedBy: []
blocks: []
created: 2026-11-15
---

# init --framework react creates a Vite React app

## Overview

`init <dir> --framework react` (and with `--monorepo`, the app at `apps/react`) writes a Vite,
React, TypeScript and React Compiler app with the jss toolchain and the harness. Without
`--framework react`, init writes exactly what it writes today.

- Policy: [decision 0057](../../decisions/0057-init-react-preset.md), which partly supersedes
  [0030](../../decisions/0030-init-node-preset.md).
- Contract and evidence: [brainstorm report](../reports/brainstorm-261115-1232-init-react-preset.md).
  Read it before phase 1: the "Settled so far" list, the "Outcome so far" tree and the evidence.
- File map of the nest preset this plan mirrors:
  [scout report](../reports/scout-261115-1201-init-react-preset.md).
- Approach: `templates/react/` at the repository root is a real project, the pinned `create-vite`
  output edited to the contract. The build embeds it in the bundle; init copies it, substitutes
  the project name, and adds the shared toolchain from the existing templates. init never runs
  `create-vite`.
- The model for every step is the nest work: plan
  [261112-1647](../261112-1647-init-nest-preset/plan.md) and its journals under
  `.harness/plans/journals/` (read the journals first, they hold the failures).

## Phases

| #   | Phase                                                        | Status  |
| --- | ------------------------------------------------------------ | ------- |
| 1   | [The templates/react project](./phase-01-template-project.md) | Done    |
| 2   | [Embedding and pins](./phase-02-embedding-and-pins.md)       | Done    |
| 3   | [Init wiring](./phase-03-init-wiring.md)                     | Done    |
| 4   | [End-to-end proof, site and docs](./phase-04-e2e-site-and-docs.md) | Done    |

Phases run in order; each depends on the one before. Phase 1 changes no file under `src/`; it
creates `templates/react/`. Stop after each phase and report to the planner before the next.

## Success Criteria

- [ ] `init my-web --framework react --pm <pm> -y` for pnpm, npm, yarn 1 and bun writes the tree in
      the report; `--dry-run` lists the same paths with `+` and writes nothing.
- [ ] In the generated app: install, `lint`, `typecheck` and `build` exit 0; `vite preview` answers
      `GET /` and a nested route with 200 and HTML; the built JavaScript carries the React Compiler
      runtime. Proven by `INIT_E2E=1` per manager.
- [ ] The same with `--monorepo --framework react` through turbo, app at `apps/react`.
- [ ] Existing mode with `--framework react` exits 1 before any write, naming the create command.
- [ ] `init` with `node` and with `nest` (every mode) is byte-for-byte unchanged: existing plan,
      template and e2e tests pass without edits to their expectations, except the `--help` block
      and the "Only node and nest are" hint.
- [ ] Generated project passes `prettier --check .` right after init (decision 0046).
- [ ] The built `dist/cli.mjs` still runs with no `node_modules` beside it (`tests/bundle.test.ts`).
- [ ] Every React version has one home: the pin script writes `templates/react/package.json`.
      ESLint stays at 10 and TypeScript at the shared pin; `eslint-plugin-react` is not installed.
- [ ] `templates/react/` holds no binary file, no test runner and no `test` script.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, plus the site sequence.

## Constraints

- One concern per file; split a file that passes roughly 200 lines
  (`.harness/docs/code-standards.md`). `plan.service.ts`, `init.command.ts` and
  `scripts/pin-node-preset.mjs` are already long: put React logic in new files and add only a
  dispatch line to them.
- Versions move only through the pin script, older than `minimumReleaseAge`. Never add
  `minimumReleaseAgeExclude`, `overrides` or `peerDependencyRules` to make an install pass.
- The repository's own lint, typecheck, architecture tests and Prettier do not reach into
  `templates/` (already configured); the template is checked as a generated project.
- Decisions 0024 (role suffixes), 0025 (`@/`), 0028 (no file extension on imports), 0031 (the CLI
  never commits), 0043 (JSX conditional rendering), 0046 (format step), 0048 (template installs).
- Never commit, never push: a push to `main` deploys the site. Leave every change in the working
  tree for the planner.
- No scope beyond the contract: no Tailwind, no test runner, no sample, no form, query or table
  library, no language routes, no theme, no CSS framework.

## Reference code

Outside this repository, in the user's own workspace beside it; read-only, never copied verbatim:

- `dokploy/design-system/apps/site/src/`: `main.tsx`, `app.tsx`, `contexts/FeatureFlags/`,
  `router/`, `hocs/`, `components/{AppErrorBoundary,RouteErrorBoundary,ErrorState}/`,
  `services/error-reporting.service.ts`. This is the layout and the feature flag setup to follow.
- `js-stack/react/react-boilerplate/src/components/providers/`: the idea behind `Providers`. It
  does not compile and is typed with `any`; rewrite it.

If a reference path cannot be read, work from the descriptions in the brainstorm report and say so
in the phase report.

## Failure protocol

Stop and report to the planner (`hc send t58 -- "..."`) with the command and its real output,
instead of working around it, when:

- a package fails to install on npm or on pnpm with `strictPeerDependencies: true`;
- React Compiler or `@openfeature/react-sdk` does not build or run on the pinned React;
- a step would need a file, a library or a flag the contract does not name;
- the same check fails twice after two different fixes.

## Validation Log

### Planner review of phase 4 (2026-11-15)

- The e2e marker was tightened by the planner before acceptance: the three lazy page chunks must
  each carry `memo_cache_sentinel` (the index chunk always does, because React itself does). The
  pnpm pair was re-run green under the stricter rule; the other managers are the cooker's runs.
- Planner gates: `tsc --noEmit` reports 0 errors outside `my-app/` (all 83 are that folder, the
  user's manual test project in the repo root); `pnpm lint`, `pnpm test` (38 files, 607 tests),
  `pnpm build` (489.66 kB) and the full site sequence (28 files, 131 tests) exit 0. One `pnpm test`
  run failed 32 tests in 5 files and passed unchanged on immediate rerun — transient, most likely
  the concurrent manual work in `my-app/`; watch for it if it recurs.
- The four-suite `INIT_E2E` run and the per-manager manager list are the cooker's; the nest e2e
  file's afterAll cleanup exceeding vitest's 10s hookTimeout is recorded in memory as pre-existing.

### Planner review of phase 3 (2026-11-15)

- The diff was read: the shared manifest helpers moved to `shared-template-plan.service.ts`, the
  nest service only lost them, and the expectation changes in existing tests are the allowed ones.
  The planner re-ran `pnpm lint`, `pnpm typecheck` and `pnpm test` (36 files, 602 tests) with exit 0;
  `dist/cli.mjs` is 489,500 bytes and holds the template.
- Real runs by the planner with pnpm, from the built bundle: `init my-web --framework react -y` and
  `init my-mono --monorepo --framework react -y` exit 0. In both, `lint`, `typecheck`, `build` and
  `prettier --check .` exit 0, the page chunks carry `memo_cache_sentinel`, and the name and the
  title are substituted. The single project was also driven in headless Chromium on `vite preview`:
  pages render, both guards redirect, the console is clean. In the monorepo the root lints its own
  files and turbo runs the app's lint with the app's config, so the two ESLint configs do not meet.
- One defect carried into phase 4: the title substitution passes the project name to
  `String.replace` as a replacement string and into HTML unescaped, so a folder name holding `$&`
  or `&`, `<`, `>` yields a wrong title.

### User confirmation (2026-11-15)

- "OK hết, cứ tiếp tục tới phase 4, cho các pined lib lên". This confirms what the entries below
  list as waiting: the aged pins move up with this work, `eslint-plugin-react-hooks` stays,
  `error-reporting.service.ts` comes along, and the `index.html` title takes the project name.
  Recorded in decision 0057. Phases 3 and 4 run without a further stop for the user.

### Planner review of phase 2 (2026-11-15)

- The diff was read and the three failing test files reproduced by the planner: all three are
  version expectations (the repo's Prettier against the preset, a literal `@nestjs/common` range,
  the node preset's `package.json` snapshot). None is a logic failure and none comes from React.
- Planner decision, to be confirmed by the user: the aged pins are accepted, as
  `.harness/docs/pins-and-template-deps.md` describes. The repo's Prettier moves to 3.10.1, the
  snapshot is updated, and the literal range is read from the nest template's manifest. This
  amends the success criterion on `node` and `nest`: their files stay byte-identical except for
  the versions the pin script moved (eslint, prettier, turbo, the `@nestjs` packages).
- After the fixes the planner re-ran the full sequence: `pnpm lint`, `pnpm typecheck`, `pnpm test`
  (36 files and 592 tests passed, 3 files skipped) and `pnpm build` exit 0. The root manifest
  changed by the `prettier` line only; `pnpm-workspace.yaml` is unchanged.
- `dist/cli.mjs` does not carry the React template yet: nothing imports the constant, so the
  bundler drops it. Phase 3 adds the import, and must prove the bundle then holds the template.

### Phase 2 paused on the user's request, then resumed (2026-11-15)

- State as the cooker reported it, not yet reviewed by the planner: the `define`, the template
  constant, the pin lists, the pin script's template loop and `tests/react-template.test.ts` are
  written; the focused bundle, nest and react template tests passed.
- Open on resume: `pnpm test` showed three failing test files, not yet identified; the lint rerun
  after `pnpm format` is unverified; the phase report is not written.
- Rerunning the pin script moved pins that had aged on their own (eslint 10.14.0 to 10.15.0,
  prettier, turbo, the `@nestjs` packages), so the node and nest presets change with this work.

### Planner review of phase 1 (2026-11-15)

- Re-run by the planner on a fresh strict pnpm copy with the exact shared pins: install, lint,
  `tsc -b`, `vite build` and `prettier --check .` exit 0. Headless Chromium on `vite preview`: every
  page renders, `AuthGuard` and `GuestOnlyRoute` redirect, an unknown path shows NotFound, the
  console is clean. npm, yarn 1 and bun are the cooker's runs, not re-run by the planner.
- The cooker's compiler proof (`getCacheForType`) proved nothing: React itself carries that name.
  The marker is `memo_cache_sentinel` inside a page chunk; phase 4's e2e uses it.
- Review fixes: `Polymorphic` passes `ref`; `useAuth` selects through `useShallow`; no nested
  `<main>`; router errors reach the error reporting service; `lazyPage` takes a guard.
- Carried to phase 2: `@babel/core` is `^7.29.7` from `create-vite` while the registry's latest is
  8.x, so the pin stays on major 7 unless a build on 8 is proven. `rolldown` is an auto-provided
  peer and is not pinned.

### Session 1 (2026-11-15)

- The contract was answered one question at a time; every answer is quoted in the brainstorm report.
- Live proofs behind the lint decision: `eslint-plugin-react` 7.37.5 fails the install with ESLint
  10 on npm (`ERESOLVE`) and on strict pnpm, and crashes on `settings.react.version: 'detect'`.
- Planner assumption, not a user answer: `src/services/error-reporting.service.ts` comes along from
  the reference, because the error boundary, the router and the feature flag setup all report
  through it. The user was asked twice and moved on to the hand-off.
- The user asked for the hand-off without further questions and will test by hand afterwards, so
  the validation interview was not run.

<!-- slug: init-react-preset -->
