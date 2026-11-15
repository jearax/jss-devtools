# Proof: the templates/react project (plan 261115-0643, phase 1)

Phase: [phase-01-template-project.md](../261115-0643-init-react-preset/phase-01-template-project.md) ·
Policy: [decision 0057](../../decisions/0057-init-react-preset.md) · Contract: [brainstorm report](brainstorm-261115-1232-init-react-preset.md)
Status: done. Every check was run for real; exit codes and outputs follow each claim.

## Outcome

`templates/react/` exists at the repository root: a real Vite 8, React 19, TypeScript and React
Compiler project, the pinned `create-vite` output edited to the contract. With the shared jss
toolchain added, it installs, lints, typechecks, builds and serves on pnpm, npm, yarn 1 and bun.
No file under `src/` changed (`git status --short | grep -v templates/react` lists only the
`.harness/` edits from the earlier planning session, all made before this phase started), nothing
was staged or committed.

## The generate command

`pnpm dlx create-vite@9.3.4 react-app --template react-compiler-ts < /dev/null` in the scratchpad:
exit 0, no prompt, no install, 18 files. `vite.config.ts` as generated uses `reactCompilerPreset`
through `@rolldown/plugin-babel`, as the phase expected. Kept: `index.html`, `vite.config.ts`,
the three tsconfigs, `public/favicon.svg`. Deleted: `.oxlintrc.json`, the `oxlint` dependency,
`README.md`, the template's own `.gitignore`, every `.css` file, `public/icons.svg`,
`src/assets/` (`hero.png` is binary). Rewritten: `package.json` and everything under `src/`.

## The tree

```text
templates/react/           37 files, all text (NUL-byte grep clean; favicon.svg is text SVG)
├─ .env.example            VITE_FEATURE_SIDEBAR=true; the app boots without a .env file
├─ eslint.config.mjs       the node preset's config, adapted (see ESLint changes)
├─ index.html              create-vite's own, Prettier-formatted
├─ package.json            name placeholder "react-app"; only its own deps, carets for phase 2
├─ tsconfig.json           files: [] + references to app and node
├─ tsconfig.app.json       create-vite's browser config + the node preset's strictness + @/ paths
├─ tsconfig.node.json      create-vite's vite.config.ts config + forceConsistentCasingInFileNames
├─ vite.config.ts          react() + babel(reactCompilerPreset()), resolve.tsconfigPaths: true
├─ public/favicon.svg
└─ src/
   ├─ main.tsx             async bootstrap(): #root, router, initFeatureFlags, render; void bootstrap();
   ├─ app.tsx              App({ router }): Providers around RouterProvider
   ├─ vite-env.d.ts        vite/client reference + VITE_FEATURE_SIDEBAR in ImportMetaEnv
   ├─ components/
   │  ├─ Providers/Providers.tsx          StrictMode, AppErrorBoundary, FeatureFlagsProvider; first listed outermost
   │  ├─ Polymorphic/Polymorphic.tsx      renders `as` through JSX spread, props typed ComponentProps<C> & { as?: C }
   │  ├─ AppErrorBoundary/                react-error-boundary; fallback is ErrorState with retry (DEV-only details)
   │  ├─ RouteErrorBoundary/              400 -> BadRequest, 404 -> NotFound, >=500 -> ServerError, else ErrorState
   │  └─ ErrorState/ErrorState.tsx        title, optional details, optional retry button (decision 0043: `&&`)
   ├─ contexts/FeatureFlags/              FeatureFlags.tsx (OpenFeatureProvider), FeatureFlags.config.ts
   ├─ layouts/                            RootLayout/ (Header, flag-gated Sidebar, Outlet, Footer), Header/, Footer/, Sidebar/, SideNav/
   ├─ hocs/                               AuthGuard/, GuestOnlyRoute/
   ├─ hooks/useAuth/useAuth.ts            selects isAuthenticated, signIn, signOut through zustand's useShallow
   ├─ stores/auth/auth.store.ts           isAuthenticated, signIn, signOut; in memory
   ├─ pages/                              Home, Login (signIn button), Dashboard (signOut button), BadRequest, NotFound, ServerError
   ├─ router/                             router.tsx (createAppRouter, lazyPage with optional guard, reportRouterError, routes), routes.constant.ts
   └─ services/error-reporting.service.ts reportError, setErrorReporter; console in development
```

SideNav links to the three pages. Login sits behind `GuestOnlyRoute`, Dashboard behind
`AuthGuard`, both wrapped in the route's `lazy` result. The `sidebar` flag is read with the SDK's
`useBooleanFlagValue` (default `true`), keyed by `SIDEBAR_FLAG_KEY` exported from
`FeatureFlags.config.ts`.

## Per-manager results (all four green)

Setup for every manager: copy `templates/react/`, add the shared toolchain files (`.prettierrc.json`,
`.editorconfig`, `.prettierignore`, `.gitignore`, `commitlint.config.mjs`, `.husky/`, `.vscode/`)
from a fresh `node dist/cli.mjs init scratch-node -y`, merge the `NODE_PRESET_DEPENDENCIES`
devDependencies, install, run. The template holds only its own dependencies; the shared ones keep
their one home in the node preset constants, and phase 3 merges them at init. Each manager ran on
a fresh copy; the pnpm scratch sets `strictPeerDependencies: true` and `engineStrict` in
`pnpm-workspace.yaml`, exactly what init writes.

| Check                          | pnpm 11.24.0 | npm      | yarn 1.22.22 | bun       |
| ------------------------------ | ------------ | -------- | ------------ | --------- |
| install                        | exit 0       | exit 0   | exit 0       | exit 0    |
| lint                           | exit 0       | exit 0   | exit 0       | exit 0    |
| typecheck (`tsc -b`)           | exit 0       | exit 0   | exit 0       | exit 0    |
| build (`tsc -b && vite build`) | exit 0       | exit 0   | exit 0       | exit 0    |
| `prettier --check .`           | exit 0       | exit 0   | exit 0       | exit 0    |
| `GET /` via `vite preview`     | 200          | 200      | 200          | 200       |
| `GET /dashboard`               | 200          | 200      | 200          | 200       |
| port free after kill           | yes          | yes      | yes          | yes       |

Manager notes:

- pnpm strict: green with no workaround. pnpm treats the unlisted `rolldown` peer of
  `@rolldown/plugin-babel` as a warning and auto-provides `rolldown@1.2.19` (vite's own copy);
  no `overrides`, no `peerDependencyRules`, no `minimumReleaseAgeExclude` — `pnpm-workspace.yaml`
  came back unchanged and pnpm asked for no new `allowBuilds` entry.
- npm 11: warns that esbuild's postinstall is not covered by `allowScripts`; the build is still
  green because this project's vite build runs on rolldown, not esbuild.
- yarn 1: only husky's expected ".git can't be found" warning (scratch is not a git repo).
- bun: green, no warnings.

## React Compiler proof

`grep -c "memo_cache_sentinel" dist/assets/*.js` after `vite build`: one match in each page chunk
(`Home-*.js`, `Login-*.js`, `Dashboard-*.js`) and two in `index-*.js`. The memo-cache sentinel is
emitted by `babel-plugin-react-compiler` into the components it transforms, so its presence in a
page chunk proves the compiler ran on that page — not merely that the runtime is linked. This is
the marker the proof uses; `getCacheForType` is not proof by itself, because React's own
dispatcher carries that symbol in every React 19 bundle (review finding, confirmed in the
re-proof scratch).

## Build sizes (`vite build`, pinned pnpm scratch after the review fixes)

```text
dist/index.html                     0.36 kB │ gzip:   0.26 kB
dist/assets/Home-*.js               0.22 kB │ gzip:   0.20 kB
dist/assets/Login-*.js              0.39 kB │ gzip:   0.29 kB
dist/assets/Dashboard-*.js          0.39 kB │ gzip:   0.29 kB
dist/assets/index-*.js            355.64 kB │ gzip: 110.72 kB
```

(The first proof's four-manager builds measured index at 354.60 kB; the review fixes grew the
index chunk by ~1 kB — reportRouterError and the guard-aware lazyPage.)

Home, Login and Dashboard ship as separate lazy chunks; NotFound is static (see deviation 6).

## Deviations from the phase file, each with its reason

1. `reactRefresh.configs.vite` is a config **object** in eslint-plugin-react-refresh 0.5.7, not a
   function as the phase text's `reactRefresh.configs.vite()` reads. Proven by
   `node -e "import('eslint-plugin-react-refresh')..."` in the scratch: `typeof ... === 'object'`.
   The config uses the object.
2. ESLint 10 does not expand a single-element brace group: `files: ['{src}/**/*.{ts,tsx}']`
   matches nothing ("File ignored because no matching configuration was supplied"; the debug
   config in the scratch reproduced it, plain `src/**/*` matched). nest's `{src,test}` works
   because it has two elements. The react config therefore writes the globs without the brace
   group (`src/**/*.{...}`), and the unused `SOURCE_FOLDERS` const is dropped.
3. TypeScript 6.0.3 accepted create-vite's option set unchanged: **zero options dropped or
   replaced** (proven by `tsc -b` exit 0 on all four managers). On top of create-vite's browser
   config, the kept node-preset strictness is `strict`, `noUncheckedIndexedAccess`,
   `noImplicitOverride`, `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes` and
   `forceConsistentCasingInFileNames`; `paths: { "@/*": ["./src/*"] }` with no `baseUrl`, in
   `tsconfig.app.json`. `resolve.tsconfigPaths: true` (a real vite 8 option,
   `tsconfigPaths?: boolean` in its bundled types) resolves `@/` — proven by `vite build`
   resolving every `@/` import (an unresolved alias fails the build), green on all four managers.
   `typecheck` is `tsc -b` (the split tsconfig references make it the working form, instead of
   nest's `tsc --noEmit`), and `build` is create-vite's own `tsc -b && vite build`.
4. `TypedInMemoryProvider`'s `FlagConfiguration` requires a `disabled` property (TS2325 in the
   first typecheck), so `flagConfiguration` carries `disabled: false` and is `as const`, which
   also keeps `defaultVariant` at the literal union `'off' | 'on'`.
5. `Polymorphic` renders through JSX spread (`const Element = (Tag ?? 'div') as ElementType;` then
   `<Element {...rest} />`) with props typed `ComponentProps<C> & { as?: C }` — the review's
   prescription, so a `ref` passes through as the React 19 prop it is (probe-checked: a
   `Ref<HTMLInputElement>` type-checks on `as="input"`, `href` on `as="a"`). Two traps forced the
   shape: a destructuring default (`as: Tag = 'div'`) is a type error (TS2322), and
   `createElement(Tag ?? …)` with a generic `C` collapses the conditional prop type to `any`,
   which trips `no-unsafe-argument` under type-aware lint — `ComponentPropsWithRef<C>` collapses
   the same way. The JSX spread keeps the public typing intact and the lint green.
6. The `*` route renders `NotFound` statically (`Component: NotFound`, the reference's own shape)
   instead of through `lazyPage`: `vite build` warns `INEFFECTIVE_DYNAMIC_IMPORT` when a module is
   both statically imported (by `RouteErrorBoundary`) and dynamically imported (by the router).
   Home, Login and Dashboard still load through lazy loading; Login/Dashboard return their
   guard-wrapped `element` from `lazy` because `lazyPage`'s `{ Component }` shape cannot wrap.
7. Nothing beyond the phase's package list was needed: `rolldown` is **not** a devDependency (see
   the pnpm note — the strict install passed without it), and `@types/babel__core` from
   create-vite's scaffold is **not** kept (typecheck is green without it). Vite resolves
   `@rolldown/plugin-babel`'s Babel peers through `@babel/core` alone.
8. Not carried from the reference: `trackInitialLoad` (NavigationProgress is not in the contract)
   and `RouterProvider`'s `onError`/`reportRouterError` (not in the phase tree; the phase names
   `createAppRouter`, `lazyPage`, `routes` only).

## ESLint changes vs the node preset

Same plugins and rules otherwise, parity-checked by the passing lint on all four managers:

- `globals.browser` instead of `globals.node` (base block).
- Extensionless-import rule kept exactly as the node preset writes it (`@/` and relative imports
  must not carry `.js`/`.ts`); parent-relative imports still forbidden in favour of `@/`.
- `@typescript-eslint/consistent-type-imports` stays **on** (nest turns it off for decorator
  metadata; React has no such need).
- Added `reactHooks.configs.flat['recommended-latest']` and `reactRefresh.configs.vite` (object,
  deviation 1). No rule from either was changed or disabled.
- Root files lint under type-aware rules: `*.{...}` at the root matches `vite.config.ts` under the
  `projectService` block (and the split `tsconfig.node.json` covers it), proven by the green lint —
  an unmatched file would hard-error in typescript-eslint's projectService.

## Formatting fold-back

`eslint --fix` ran in the pnpm scratch, then the fixes were folded back into the template with
Prettier formatting (`index.html` and `tsconfig.json` were reformatted by `prettier --write`).
The repository's own lint/prettier do not reach into `templates/` (already configured); the
template was checked as a generated project through `prettier --check .` on all four managers.

## Review re-proof (planner t58, one fresh pnpm scratch)

The planner re-proved phase 1 independently and asked for nine fixes. All nine are applied in
`templates/react/` and re-proven on a fresh pnpm scratch built with the **exact shared pins**
(`NODE_PRESET_DEPENDENCIES` values, not carets: eslint 10.14.0, typescript 6.0.3, prettier
3.10.0, …), `strictPeerDependencies: true`: install exit 0, `lint` exit 0, `tsc -b` exit 0,
`vite build` exit 0, `prettier --check .` exit 0, `GET /` and `GET /dashboard` 200 via
`vite preview`, port free after kill, `memo_cache_sentinel` present in every page chunk. The
four-manager table above reflects the pre-review template; phase 4's `INIT_E2E=1` suite proves
the fixed template on all four managers.

The fixes, briefly: Polymorphic typed `ComponentProps<C>` (deviation 5 covers the shape);
useAuth selects fields through `useShallow` instead of subscribing to the whole store;
Login/Dashboard render `<section>` so the document keeps one `<main>` (RootLayout's);
RouteErrorBoundary inlines the description and reads `<status> <statusText>` for route error
responses no page handles; `reportRouterError` is exported from router.tsx and wired to
`RouterProvider onError` in app.tsx, so the error-reporting service's `router` source and `route`
field have their caller; `lazyPage` takes an optional guard component, removing the duplicated
Login/Dashboard lazy blocks.

## Files carrying the project-name placeholder (for phase 3)

`grep -rn "react-app"` over the template (excluding `node_modules`) matches exactly two files:

| File          | Placeholder                              |
| ------------- | ---------------------------------------- |
| package.json  | `"name": "react-app"`                    |
| index.html    | `<title>react-app</title>`               |

Both hold the fixed placeholder `react-app`; phase 3 substitutes the init project name in both.

## @babel/core version origin

`@babel/core ^7.29.7` is inherited from create-vite 9.3.4's `react-compiler-ts` scaffold (its
generated package.json), not chosen here. The registry's latest is 8.1.2; the version stays at
^7.29.7 per the planner: `@rolldown/plugin-babel` 0.3.1 accepts `^7.29.0 || ^8.0.0-rc.1`, but the
compiler toolchain (babel-plugin-react-compiler 1.0.0) is built against Babel 7, and the pin
script owns any move. Resolved on install: 7.29.13.

## Versions recorded for the pin script (step 9)

Resolved on install (carets in the manifest, exact versions as installed in the pnpm scratch):

Runtime: react 19.3.1, react-dom 19.3.1, react-router 8.5.1 (peers need react/react-dom
>=19.2.7), react-error-boundary 6.1.6, zustand 5.1.0, @openfeature/react-sdk 1.4.1,
@openfeature/web-sdk 1.10.0, @openfeature/core 1.12.0.

Dev: @babel/core 7.29.13, @rolldown/plugin-babel 0.3.1, @types/react 19.3.0,
@types/react-dom 19.3.0, @vitejs/plugin-react 6.3.0, babel-plugin-react-compiler 1.0.0,
eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.5.7, vite 8.3.8 (already pinned
for nest; one home in `pin-helpers.mjs`), typescript 6.0.3 (shared pin, unchanged).

Phase-2 notes for the pin script:

- The proof merges carets, so eslint resolved 10.15.0 and prettier 3.10.1 in the scratch; the
  shared pins stay 10.14.0/3.10.0 and the generated project will install the pinned exact
  versions.
- `rolldown` resolves as an auto-provided peer at 1.2.19 (vite depends on `~1.2.18`). Whether the
  pin script must pin it is a phase-2 decision: today nothing in the manifest names it.
- Peer ranges checked on the registry (2026-11-15): every react template package accepts the
  shared pins; `eslint-plugin-react-hooks` 7.1.1 and `eslint-plugin-react-refresh` 0.5.7 both
  declare `eslint ^10`; zustand's and `@vitejs/plugin-react`'s extra peers are all
  `peerDependenciesMeta`-optional, so no strict-install conflict exists for any of the four
  managers.

## Repository checks (root, after the copy)

- `pnpm lint` -> exit 0
- `pnpm typecheck` -> exit 0
- `pnpm test` -> exit 0 (35 files passed, 3 skipped; 586 passed, 23 skipped)
- `pnpm build` -> exit 0 (dist/cli.mjs 452.98 kB)
- `pnpm template:install` -> exit 0 (gives `templates/react/node_modules` to the editor)
- `git status --short templates/react` -> only the new untracked directory; 37 text files, no NUL
  byte (`LC_ALL=C grep -rlP "\x00"` clean, `file` reads favicon.svg as "SVG Scalable Vector
  Graphics image", which is text).
- Nothing staged, nothing committed.

## Unresolved questions

- None blocking phase 1. For phase 2: whether the pin script should pin `rolldown` (the peer is
  auto-provided today), and the merge set for the shared toolchain (`tsx`/`tsc-alias` are
  node-build tools a browser template does not need — the proof merged the full
  `NODE_PRESET_DEPENDENCIES` because the nest proof did; init's actual merge is phase 3's choice).

## Process notes

- The automatic journal step was skipped: the task restricts repository writes to
  `templates/react/` and this report, and a journal would be a third destination. The failures and
  workarounds worth keeping (Write/heredoc corruption on this session, the ESLint single-brace
  glob trap, the `configs.vite` object shape) are recorded above for the planner to journal.
