# Scout: what `init --framework react` has to touch

Read-only scout on 2026-11-15, at `291fc64`. Goal: add a `react` preset beside `nest`, with help and
docs aligned the same way. Nothing was changed. Input for the brainstorm that follows.

## How the nest preset is wired today

The nest preset is a real project in `templates/nest/` that the build embeds as a
`Record<path, content>` and init copies. Every step below needs a react counterpart.

| Step                | File                                                         | What it does for nest                                                                                              |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Template            | `templates/nest/`                                            | The pinned `nest new` output, edited. Holds its own `eslint.config.mjs`, `tsconfig*.json`, and only its own deps   |
| Read                | `scripts/framework-template.mjs`                             | `readFrameworkTemplate(framework)`: walks the folder, skips `node_modules`, `dist`, lockfiles, git-ignored paths   |
| Embed               | `tsdown.config.ts:60`, `vitest.config.ts:10`                 | `define: { __NEST_TEMPLATE__ }`                                                                                    |
| Constant            | `src/commands/init/constants/nest-template.constant.ts`      | Declares the injected global, exports `NEST_TEMPLATE_FILES`                                                        |
| Plan                | `src/commands/init/services/nest-plan.service.ts`            | Template entries, manifest rename, merges `NODE_PRESET_DEPENDENCIES` minus `tsx`/`tsc-alias`, `--no-sample` filter |
| Route (single)      | `src/commands/init/services/plan.service.ts:110`             | `options.framework === 'nest'` picks `nestCreateModeEntries`                                                       |
| Route (monorepo)    | `src/commands/init/services/monorepo-plan.service.ts:33`     | `framework === 'nest'` picks `nestMonorepoAppEntries` at `apps/nest/`                                              |
| Argument rules      | `src/commands/init/services/init.service.ts:9-27`            | Three nest-only checks: needs `<dir>`, the supported list (`node`, `nest`), `--no-sample` needs nest               |
| Help                | `src/commands/init/init.command.ts:33-44,69`                 | Example rows, `--no-sample` description. The `--framework` enum already lists `react`                              |
| Shared toolchain    | `src/commands/init/services/shared-toolchain-plan.service.ts`| Prettier, editorconfig, gitignore, commitlint, husky, `.vscode/`, pnpm workspace. No ESLint unless passed in       |
| Pins                | `scripts/pin-helpers.mjs:8-35`, `scripts/pin-node-preset.mjs`| `NEST_DEPENDENCIES` lists; one peer-resolved `chosen` map; rewrites `templates/nest/package.json`                  |
| Dev install         | `scripts/template-deps.mjs`                                  | Already generic: installs every `templates/<name>/` outside the workspace, skipped in CI                           |

`InitFramework` (`src/commands/init/types/init-options.type.ts:3`) already contains `react`. The root
`eslint.config.mjs:50`, `tsconfig.json:26` and `.prettierignore:4` already exclude all of `templates/`.

## Tests to mirror or update

- `tests/nest-template.test.ts`: embedded template equals disk, no build output, carets only, no
  shared-toolchain package duplicated. Mirror for react.
- `tests/init-nest.e2e.test.ts` (280 lines, gated by `INIT_E2E=1`): per-manager install, lint,
  typecheck, test, build, serve. Mirror for react.
- `tests/site-nest-docs.test.ts`: keeps the site page's env table, scripts block and `src` tree equal
  to the template. Mirror if the site gets a react page.
- `tests/init.service.test.ts:23-34`: asserts `Framework react is not supported yet`. It must move to
  another unbuilt framework (`rn` or `next`).
- Help snapshots: `tests/bundle.test.ts:189-213`, `tests/init.command.test.ts:75-99`.
- `tests/init-plan.service.test.ts:345-420`: the nest plan and nest monorepo plan file lists.
- `.claude/skills/verify-init-template/SKILL.md`: the proof procedure; its serve proof is nest-specific.

## Docs to align

- `README.md:6,31,70-83`.
- `.harness/docs/`: `codebase-summary.md`, `system-architecture.md`, `project-overview-pdr.md`,
  `project-roadmap.md:253` (lists `react` as not built), `nest-template-traps.md` (the model for a
  react traps doc).
- A new decision superseding 0030's "only node" for react, as 0047 did for nest. Follow-up nest
  decisions 0049, 0050, 0051 show how later policy was split out.
- Site: `site/src/constants/routes.constant.ts:55`, `reference.constant.ts:17,40`,
  `search-index.constant.ts:7,58`, `site/src/pages/Docs/Docs.constant.ts:74`, `Docs.route.ts:73`,
  `pages/Init/{Init.constant.ts,Init.tsx,InitNest.tsx}`, `pages/Nest/*` (five files, the model for a
  react page), and `ci/smoke-site-image.sh:56` (`/docs/nest` returns 200).

## Reference code the user pointed at

The path given, `js-stack/react/components/providers`, does not exist. The folder is
`js-stack/react/react-boilerplate/src/components/providers/` (the user's own workspace, outside this
repository), and it is uncommitted work on top of one commit (`feat: init react template by vite`).

- `Providers.tsx` uses `StrictMode` and `buildProvidersTree` without importing either, so it does not
  compile.
- `providers.utils.tsx` and `utils/providersUtil.tsx` are the same `buildProvidersTree` twice; they
  differ only in the initial component (`<>{children}</>` against `children`).
- The reducer nests providers first-listed outermost. Types are `ComponentType<any>` with an
  `[key: string]: any` props bag, so a wrong prop is not a type error.
- Around it: `hocs/AuthGuard.tsx` and `GuestOnlyRoute.tsx` import `@/routes`, which does not exist;
  `hooks/useAuth` (zustand store plus a fake `useMutation` login); `hooks/useExample`;
  `stores/example`. `vite.config.ts` uses `rolldown-vite@7.2.5`, `babel-plugin-react-compiler` and a
  regex `@/` alias. ESLint comes from the old `@jjuidev/node-devtools` package.
- `js-stack/react/react-router-app/` is React Router 7 in framework mode (`@react-router/dev`, SSR
  build), not the client SPA mode the user asked for.

A closer convention source is this repository's own `site/`: a Vite 8, React 19.3, react-router
8.5.1, Tailwind 4 SPA with `createBrowserRouter` and lazy routes
(`site/src/components/AppRouter/AppRouter.tsx`), `tsconfig.json` with `@/*` paths and no `baseUrl`,
and an ESLint config carrying `eslint-plugin-react` and `eslint-plugin-react-hooks`
(`site/eslint.config.mjs`). Decision 0043 records the user's JSX conditional-rendering convention.

## Findings that constrain the design

Registry facts are from `npm view` on 2026-11-15.

1. **React Router is at 8.5.1, not 7.** The user asked for "react router v7 mode client SPA"; `site/`
   already runs 8.5.1. Version 8 needs `react >= 19.2.7` and Node `>= 22.22.0` (inside the 24.11 floor).
2. **`eslint-plugin-react` 7.37.5 does not accept ESLint 10.** Its peer range ends at `^9.7`; the
   preset pins ESLint 10.14.0. The pin script resolves one version per package across every preset
   (`scripts/pin-node-preset.mjs:81-145`), so adding it would step ESLint down to 9 for `node` and
   `nest` too, and generated pnpm projects set `strictPeerDependencies`. `site/` avoids this only
   because it pins ESLint 9.39.5. `eslint-plugin-react-hooks` 7.1.1 and `eslint-plugin-react-refresh`
   0.5.7 both accept ESLint 10.
3. **The embedder is text-only.** `readFrameworkTemplate` reads every file as UTF-8 and
   `PlanEntry.content` is a `string` (`init-plan.type.ts:11`, `write.service.ts:37`). `create-vite`
   9.3.4's `template-react-ts` ships `src/assets/hero.png`; a binary file would be corrupted. The
   SVGs are safe.
4. **`create-vite` 9.3.4 ships oxlint** (`_oxlintrc.json`) and `_gitignore`, with no ESLint config:
   the same replacement nest needed (0047: "oxlint gives way to the ESLint preset").
5. **Init formats only some extensions.** `PRETTIER_EXTENSIONS`
   (`init-format.service.ts:31`) covers JS/TS, JSON, Markdown and YAML; `.css` and `.html` written by
   a react template would not be formatted by init (decision 0046).
6. **`vite` and `vitest` are already pinned as nest dev dependencies** (`pin-helpers.mjs:33-34`).
   React needs both, so the per-template lists must share names without pinning twice, and
   `tests/nest-template.test.ts`'s shape assumes one template.
7. **The monorepo root ESLint is the node one** (`eslintConfigMjsTemplate({ monorepo: true })`, with
   `globals.node` and no React rules), while the app carries its own `apps/<fw>/eslint.config.mjs`.
   How the two layer for a browser app was not verified.
8. **`--no-sample` is defined as nest's example domain** (decision 0051). Whether react has a sample
   to drop is undecided.
9. `nest-plan.service.ts` holds logic a react plan would repeat: the manifest rename, the shared
   devDependency merge, the `planEntry` helper.

Current versions of the libraries named: react 19.3.1, vite 8.3.8, `@vitejs/plugin-react` 6.3.0,
react-router 8.5.1, react-error-boundary 6.1.6, react-hook-form 7.92.0, zustand 5.1.0,
`@tanstack/react-query` 5.107.1, `@tanstack/react-table` 9.3.1, tailwindcss and `@tailwindcss/vite`
4.3.5, vitest 5.1.0, `babel-plugin-react-compiler` 1.0.0.

## Not checked

- Whether `create-vite` runs without a prompt (the nest proof did this for `nest new`).
- Peer ranges of every candidate library against each other; only the ESLint plugins, the Vite
  plugin, react-router and react-table were read.
- An install of any react template on the four package managers.

## Unresolved questions

1. React Router 7 as asked, or 8 as `site/` runs?
2. React lint rules with ESLint 10: without `eslint-plugin-react`, with a replacement, or by stepping
   ESLint down for every preset?
3. Does the react preset support existing mode, or create mode and `--monorepo` only, like nest?
4. Does `--no-sample` apply to react, and what counts as its sample?
5. Binary assets: keep the template text-only, or extend the embedder?
6. Which of the listed libraries are installed by default, and which are only wired on request?
7. Does the generated app get tests (Vitest, and in which mode), given the nest preset keeps Nest's?
