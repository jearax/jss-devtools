---
phase: 1
title: "The templates/react project"
status: done
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: The templates/react project

## Goal

`templates/react/` exists at the repository root: a real Vite, React, TypeScript and React Compiler
project, the pinned `create-vite` output edited to the contract, that with the shared jss toolchain
added installs, lints, typechecks, builds and serves on pnpm, npm, yarn 1 and bun. No file under
`src/` of this repository changes.

## Context

- Read decision 0057, the brainstorm report and `.harness/docs/pins-and-template-deps.md`.
- Read `templates/nest/package.json` and `templates/nest/eslint.config.mjs`: the react manifest and
  ESLint config follow their shape.
- The learned skill `.claude/skills/verify-init-template/SKILL.md` is the proof procedure; use its
  donor path, because init does not wire `react` until phase 3.
- Work in the scratchpad, never in `/tmp` and never in the repository, except for the final copy
  into `templates/react/`.

## Steps

1. **Generate.** In the scratchpad run `create-vite@9.3.4` with its `react-compiler-ts` variant,
   without a prompt and without an install. Record the exact command and the file list. Expected:
   `vite.config.ts` uses `reactCompilerPreset` through `@rolldown/plugin-babel`.
2. **Keep, delete, rewrite.** Keep `index.html`, `vite.config.ts`, `tsconfig.json`,
   `tsconfig.app.json`, `tsconfig.node.json`, `public/favicon.svg`. Delete the oxlint config, the
   `oxlint` dependency, `README.md`, the template's own `.gitignore` (the shared toolchain writes
   one), every `.css` file, `public/icons.svg` and everything under `src/assets/` (`hero.png` is
   binary and the embedder is text-only). Rewrite `package.json` and everything under `src/`.
3. **Manifest.** `name` is the fixed placeholder `react-app`, `private: true`, `type: module`,
   `engines.node` as in `templates/nest/package.json`. Scripts: `dev` (`vite`), `build`
   (typecheck, then `vite build`), `preview`, `typecheck`, and `lint`, `lint:fix`, `format`,
   `prepare` in the shape nest uses, with `src` as the only source folder. The `lint-staged` block
   follows nest's. No `test` script.
   - `dependencies`: `react`, `react-dom`, `react-router`, `react-error-boundary`, `zustand`,
     `@openfeature/react-sdk`, `@openfeature/web-sdk`, `@openfeature/core`.
   - `devDependencies`: `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`,
     `@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler`,
     `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `vite`.
   - Nothing that `NODE_PRESET_DEPENDENCIES` already holds (`typescript`, `@types/node`, `eslint`,
     `globals`, `prettier`, …): init merges those in. Add a package beyond this list only when a
     check proves it is required, and name the check in the report.
4. **TypeScript.** The shared pin is TypeScript 6.0.3, not the 7 that `create-vite` asks for: drop
   or replace any option TypeScript 6 rejects, and record each. `@/*` maps to `./src/*` with no
   `baseUrl`. Keep the strict options of `templates/nest/tsconfig.json` that apply to a browser app.
   Vite resolves `@/` through `resolve.tsconfigPaths: true`; if that does not work with the split
   tsconfig files, record why and use the smallest alternative.
5. **ESLint.** Start from the `node` preset's config
   (`src/commands/init/templates/eslint-config-mjs.template.ts`): same plugins and rules, imports
   without file extensions, `globals.browser`, source folder `src`. Add
   `reactHooks.configs.flat['recommended-latest']` and `reactRefresh.configs.vite()`. Do not
   install `eslint-plugin-react`. Root files (`vite.config.ts`) must lint under type-aware rules
   too. Record every rule changed and why.
6. **Source tree.** One folder per component, default export, `@/` imports. Every layout and page
   is unstyled and prints `Hello <Name>`; no CSS file, no class names.

   ```text
   src/
   ├─ main.tsx                       async bootstrap(): #root, router, initFeatureFlags, render; ends with `void bootstrap();`
   ├─ app.tsx                        App({ router }): Providers around RouterProvider
   ├─ vite-env.d.ts                  types for import.meta.env, the VITE_FEATURE_ variables included
   ├─ components/
   │  ├─ Providers/Providers.tsx     an ordered list of provider components, composed; first listed is outermost
   │  ├─ Polymorphic/Polymorphic.tsx renders the element given in `as`, typed from that element's props
   │  ├─ AppErrorBoundary/           react-error-boundary around the app; fallback is ErrorState with retry
   │  ├─ RouteErrorBoundary/         the router's error element: 400, 404, 500 pages by status, else ErrorState
   │  └─ ErrorState/                 title, optional details, optional retry button
   ├─ contexts/FeatureFlags/         FeatureFlags.tsx (wraps OpenFeatureProvider), FeatureFlags.config.ts
   ├─ layouts/                       RootLayout/ (Header, Sidebar, Outlet, Footer), Header/, Footer/, Sidebar/, SideNav/
   ├─ hocs/                          AuthGuard/, GuestOnlyRoute/
   ├─ hooks/useAuth/useAuth.ts       selects from the auth store
   ├─ stores/auth/auth.store.ts      zustand: isAuthenticated, signIn, signOut; in memory
   ├─ pages/                         Home/, Login/, Dashboard/, BadRequest/, NotFound/, ServerError/
   ├─ router/                        router.tsx (createAppRouter, lazyPage, routes), routes.constant.ts
   └─ services/error-reporting.service.ts   reportError, setErrorReporter; console in development
   ```

   - `Providers`: providers are `ComponentType<{ children: ReactNode }>`; a provider that needs
     props gets its own small wrapper component. No `any`, no props bag. It holds `StrictMode`,
     `AppErrorBoundary` and `FeatureFlagsProvider`.
   - Router: Data Mode, `createBrowserRouter`. `RootLayout` is the layout route with
     `RouteErrorBoundary`; `Home` is public; `Login` sits behind `GuestOnlyRoute`; `Dashboard`
     behind `AuthGuard`; `*` renders `NotFound`. Pages load through `lazyPage`. `SideNav` links to
     the three pages. `Login` has one button that calls `signIn`; `Dashboard` one that calls
     `signOut`.
   - Feature flags: follow the reference, including the timeout around `setProviderAndWait`. One
     flag, `sidebar`, read from `VITE_FEATURE_SIDEBAR` (default on), decides whether `RootLayout`
     renders `Sidebar`, through the SDK's own `FeatureFlag` component or hook. `.env.example` lists
     the variable. The app must boot with no `.env` file.
   - State: no hand-written React context. Decision 0043 applies to the JSX.
7. **Proof harness.** Per manager (pnpm, npm, yarn 1, bun), on a fresh scratch copy with the shared
   toolchain from a donor `node dist/cli.mjs init scratch-node -y`: install, `lint`, `typecheck`,
   `build`, `prettier --check .`. Then `vite preview` on a free port: `GET /` and
   `GET /dashboard` answer 200 with HTML. Stop the server and check the port is free.
   - Compiler proof: the built JavaScript under `dist/assets/` contains the React Compiler runtime
     (`react/compiler-runtime`'s cache function). Record the command and the match.
   - Size: record `vite build`'s reported sizes, total and gzip.
   - pnpm: the scratch `pnpm-workspace.yaml` must be the one init writes
     (`strictPeerDependencies: true`); record any `allowBuilds` entry pnpm asks for.
8. **Fold back.** Run `lint:fix` and Prettier in the scratch project, then copy only the template's
   own files into `templates/react/`: no `node_modules`, `dist`, lockfile, shared toolchain file,
   `.env` or log. `pnpm template:install react` then gives the editor its dependencies.
9. **Versions.** Record the exact resolved version of every dependency, for phase 2's pin script.

## Output

`templates/react/` ready in the working tree, and the report
`.harness/plans/reports/proof-261115-react-template.md`: the generate command, the tree, the
per-manager commands with their real output, the sizes, and each deviation from this phase with
its reason.

## Verification

- Per manager, on the scratch copy: install, `lint`, `typecheck`, `build`, `prettier --check .`
  exit 0; `vite preview` answers `GET /` and `GET /dashboard` 200.
- `git status --short templates/react` lists only text files; no file under it contains a NUL byte.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the repository root, unchanged.

## Failure protocol

The plan's failure protocol applies. In particular, do not add `overrides`,
`peerDependencyRules`, `--legacy-peer-deps` or `--force` to get an install through: report the
package and the error instead.
