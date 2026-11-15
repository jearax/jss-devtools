# Cook report — init react preset, phase 3 (init wiring)

Date: 2026-11-15 · Plan: [.harness/plans/261115-0643-init-react-preset/plan.md](../plan.md) · Phase: [phase-03-init-wiring.md](../phase-03-init-wiring.md)

## Result

Phase 3 is implemented and the full check sequence is green. `init <dir> --framework react` now
plans the React app in create mode and, with `--monorepo`, under `apps/react/`. The nest plan
output stayed byte-identical: every nest and node plan test passed with no change to its
expectations.

## What changed

### New files

- `src/commands/init/services/shared-template-plan.service.ts` — what both plan services share,
  extracted from `nest-plan.service.ts`: the `planEntry` helper, `sharedDevDependencies()`
  (`NODE_PRESET_DEPENDENCIES` without `tsx` and `tsc-alias`, caret ranges), and
  `templateManifest(files, packageName, framework)` (parse the embedded manifest, rename, merge
  the shared devDependencies, stringify with tabs). Moved verbatim so the nest output is unchanged.
- `src/commands/init/services/react-plan.service.ts` — `reactCreateModeEntries` and
  `reactMonorepoAppEntries`. The template's `package.json` gets the package name through the
  shared manifest builder; `index.html` gets the project name via a `<title>react-app</title>`
  replacement that throws if the placeholder is missing (the nest CourseModule-drop pattern: a
  missed match fails the plan instead of shipping an unsubstituted file). In the monorepo the app
  is named `@<project>/react` and the title is the project name. There is no `--no-sample`
  handling: the flag stays nest-only, so `reactMonorepoAppEntries` takes only the preflight.

### Modified files

- `src/commands/init/services/nest-plan.service.ts` — the shared pieces removed, imports
  `planEntry` and `templateManifest` from the shared module. The diff is exactly the extraction
  (`git diff` reviewed).
- `src/commands/init/services/init.service.ts` — `nest` and `react` both need `<dir>`, with the
  shared message shape `Framework <name> needs <dir>` and the create hint; the unsupported
  frameworks are now `rn` and `next`, with hint `Only node, nest and react are`. `--no-sample`
  keeps its nest-only rule and message untouched.
- `src/commands/init/services/plan.service.ts` — one dispatch line (`reactCreateModeEntries`)
  in the create-mode ternary chain.
- `src/commands/init/services/monorepo-plan.service.ts` — one dispatch line
  (`reactMonorepoAppEntries(preflight)`).
- `src/commands/init/init.command.ts` — one example row:
  `jss-devtools init my-web --framework react -y` → `Create my-web as a Vite React app`.

## Tests

- `tests/init.service.test.ts` — the unsupported case moved from `react` to `rn` (and `next`);
  added: react with `<dir>` accepted, react without `<dir>` rejected with the folder unchanged,
  `--no-sample --framework react` rejected with today's message.
- `tests/error-output.test.ts` — E19 moved from `react` to `rn` with the new hint (this file also
  held the "not supported yet" rendering).
- `tests/init.command.test.ts` — help block gained the react row (padding copied from the real
  `--help` output); the rejected-framework case moved to `rn`; added dry-run tests for react
  single and monorepo, mirroring the nest ones.
- `tests/bundle.test.ts` — help snapshot gained the react row; added a check that `dist/cli.mjs`
  embeds the react template (`createAppRouter` at least once).
- `tests/init-plan.service.test.ts` — a react describe block: the full sorted path list for
  single and monorepo for every manager (template paths derived from `REACT_TEMPLATE_FILES` keys
  plus an explicit toolchain list, sorted with the exported `comparePlanPaths`; the nest block's
  hardcoded lists keep pinning the comparator itself), name and title substitution in create and
  monorepo mode, and the shared devDependencies merge without `tsx`/`tsc-alias`.
- No other test file changed. `git diff --stat tests/` after this phase (the
  `node-preset-templates.test.ts.snap` lines are the phase-2 pin moves the planner already
  accepted):

```
 tests/__snapshots__/node-preset-templates.test.ts.snap |  16 +--
 tests/bundle.test.ts                                   |   7 ++
 tests/error-output.test.ts                             |   6 +-
 tests/init-plan.service.test.ts                        | 110 ++++++++++++++++++++-
 tests/init.command.test.ts                             |  30 +++++-
 tests/init.service.test.ts                             |  37 ++++++-
```

## Verification (real output)

### Focused suites

```
$ pnpm vitest run tests/init.service.test.ts tests/init-plan.service.test.ts tests/init.command.test.ts tests/error-output.test.ts tests/bundle.test.ts
 Test Files  5 passed (5)
      Tests  153 passed (153)
```

### Dry runs from a scratch directory (built bundle)

`$ node dist/cli.mjs init my-web --framework react --pm pnpm --dry-run` — exit 0, nothing
written; harness rows omitted here for brevity, full listing in the run:

```
◇  Changes in my-web: 87 to create
│  + .husky/commit-msg
│  + .husky/pre-commit
│  + .vscode/extensions.json
│  + .vscode/settings.json
│  + public/favicon.svg
│  + src/components/AppErrorBoundary/AppErrorBoundary.tsx
│  + src/components/ErrorState/ErrorState.tsx
│  + src/components/Polymorphic/Polymorphic.tsx
│  + src/components/Providers/Providers.tsx
│  + src/components/RouteErrorBoundary/RouteErrorBoundary.tsx
│  + src/contexts/FeatureFlags/FeatureFlags.config.ts
│  + src/contexts/FeatureFlags/FeatureFlags.tsx
│  + src/hocs/AuthGuard/AuthGuard.tsx
│  + src/hocs/GuestOnlyRoute/GuestOnlyRoute.tsx
│  + src/hooks/useAuth/useAuth.ts
│  + src/layouts/Footer/Footer.tsx
│  + src/layouts/Header/Header.tsx
│  + src/layouts/RootLayout/RootLayout.tsx
│  + src/layouts/Sidebar/Sidebar.tsx
│  + src/layouts/SideNav/SideNav.tsx
│  + src/pages/BadRequest/BadRequest.tsx
│  + src/pages/Dashboard/Dashboard.tsx
│  + src/pages/Home/Home.tsx
│  + src/pages/Login/Login.tsx
│  + src/pages/NotFound/NotFound.tsx
│  + src/pages/ServerError/ServerError.tsx
│  + src/router/router.tsx
│  + src/router/routes.constant.ts
│  + src/services/error-reporting.service.ts
│  + src/stores/auth/auth.store.ts
│  + src/app.tsx
│  + src/main.tsx
│  + src/vite-env.d.ts
│  + .editorconfig
│  + .env.example
│  + .gitignore
│  + .prettierignore
│  + .prettierrc.json
│  + CLAUDE.md
│  + commitlint.config.mjs
│  + eslint.config.mjs
│  + index.html
│  + package.json
│  + pnpm-workspace.yaml
│  + tsconfig.app.json
│  + tsconfig.json
│  + tsconfig.node.json
│  + vite.config.ts
│
└  Dry run: nothing written
   To apply:
     $ jss-devtools init my-web --framework react --pm pnpm
```

`$ node dist/cli.mjs init my-web --monorepo --framework react --pm pnpm --dry-run` — exit 0,
nothing written; the app lands under `apps/react/` and the toolchain stays at the root:

```
◇  Changes in my-web: 92 to create
│  + .husky/commit-msg
│  + .husky/pre-commit
│  + .vscode/extensions.json
│  + .vscode/settings.json
│  + apps/react/public/favicon.svg
│  + apps/react/src/components/AppErrorBoundary/AppErrorBoundary.tsx
│  + apps/react/src/components/ErrorState/ErrorState.tsx
│  + apps/react/src/components/Polymorphic/Polymorphic.tsx
│  + apps/react/src/components/Providers/Providers.tsx
│  + apps/react/src/components/RouteErrorBoundary/RouteErrorBoundary.tsx
│  + apps/react/src/contexts/FeatureFlags/FeatureFlags.config.ts
│  + apps/react/src/contexts/FeatureFlags/FeatureFlags.tsx
│  + apps/react/src/hocs/AuthGuard/AuthGuard.tsx
│  + apps/react/src/hocs/GuestOnlyRoute/GuestOnlyRoute.tsx
│  + apps/react/src/hooks/useAuth/useAuth.ts
│  + apps/react/src/layouts/Footer/Footer.tsx
│  + apps/react/src/layouts/Header/Header.tsx
│  + apps/react/src/layouts/RootLayout/RootLayout.tsx
│  + apps/react/src/layouts/Sidebar/Sidebar.tsx
│  + apps/react/src/layouts/SideNav/SideNav.tsx
│  + apps/react/src/pages/BadRequest/BadRequest.tsx
│  + apps/react/src/pages/Dashboard/Dashboard.tsx
│  + apps/react/src/pages/Home/Home.tsx
│  + apps/react/src/pages/Login/Login.tsx
│  + apps/react/src/pages/NotFound/NotFound.tsx
│  + apps/react/src/pages/ServerError/ServerError.tsx
│  + apps/react/src/router/router.tsx
│  + apps/react/src/router/routes.constant.ts
│  + apps/react/src/services/error-reporting.service.ts
│  + apps/react/src/stores/auth/auth.store.ts
│  + apps/react/src/app.tsx
│  + apps/react/src/main.tsx
│  + apps/react/src/vite-env.d.ts
│  + apps/react/.env.example
│  + apps/react/eslint.config.mjs
│  + apps/react/index.html
│  + apps/react/package.json
│  + apps/react/tsconfig.app.json
│  + apps/react/tsconfig.json
│  + apps/react/tsconfig.node.json
│  + apps/react/vite.config.ts
│  + packages/.gitkeep
│  + .editorconfig
│  + .gitignore
│  + .prettierignore
│  + .prettierrc.json
│  + CLAUDE.md
│  + commitlint.config.mjs
│  + eslint.config.mjs
│  + package.json
│  + pnpm-workspace.yaml
│  + tsconfig.base.json
│  + turbo.json
│
└  Dry run: nothing written
   To apply:
     $ jss-devtools init my-web --monorepo --framework react --pm pnpm
```

### Bundle

`dist/cli.mjs` grew from 452,975 bytes to **489,500 bytes** (final build), and
`grep -c "createAppRouter" dist/cli.mjs` is **2**. The new `tests/bundle.test.ts` check asserts
the marker is at least 1.

### Full sequence

```
$ pnpm lint            # exit 0
$ pnpm typecheck       # exit 0
$ pnpm test            # Test Files 36 passed | 3 skipped (39); Tests 602 passed | 23 skipped (625)
$ pnpm build           # exit 0; dist/cli.mjs 489.50 kB
```

Two lint errors were fixed along the way: Prettier line breaks in `react-plan.service.ts`, and an
unused `options` parameter on `reactMonorepoAppEntries` (react has no `--no-sample`, so the
parameter was dropped and the dispatch calls it with the preflight only).

## Not checked here

- A real install (`init --framework react --pm <pm>` writing, installing, building, serving) is
  phase 4's `INIT_E2E=1` proof; this phase only proves the plan and the bundle.
- `prettier --check .` on a freshly generated project is not run here; the template on disk
  passed it in phase 1's review, and init's format step skips `.html` by design
  (`PRETTIER_EXTENSIONS`), which is why the phase requires the template files to already be
  Prettier output.
- npm, yarn and bun behaviour of the plan is proven at plan level only (the per-manager plan
  tests), not by generated-project runs.

## Deviations from the phase file

None. One judgement call inside the phase's boundaries: the react path lists in
`tests/init-plan.service.test.ts` derive the template portion from `REACT_TEMPLATE_FILES` keys
(the embedded-set equality is separately pinned by `tests/react-template.test.ts`) instead of
hardcoding 47 paths, because the hardcoded mirror of the nest block kept producing corrupted
writes this session; the nest block's hardcoded lists still pin the sort comparator. Everything
the phase names is asserted.
