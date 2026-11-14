---
title: "Port design-system styles, conventions and layout into site/"
description: "Make site/ a Tailwind v4 host of @jjuidev/design-system with the design system's folder layout, code conventions, lint, Stylelint and Vitest Browser Mode, ready for the landing page work."
status: pending
priority: P2
branch: main
tags: [frontend, site, design-system, tooling]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Port design-system styles, conventions and layout into `site/`

Source repo (read-only): `the dokploy repository` (DS below).
Target: `site/` in this repo. Nothing under `src/`, `tests/` or the CLI bundle changes behaviour.

## Outcome

`site/` is set up the way the DS is, so the next plan can build the landing page without any more
tooling work:

- **Styling stack like the DS, without copying the DS.** The site runs Tailwind v4 itself and imports
  `@jjuidev/design-system/tailwind.css` from the vendored tarball. Tokens, semantic colours, skins
  and text roles come from the package and are never copied. Theme and skin come from the package's
  `ThemeProvider` (see DS `src/pages/Home/components/ThemingSection/ThemingSection.tsx`, section
  `theming-skins`, and DS `README.md` "Use as a package").
- **The same styling conventions.** CSS Modules with `@apply`, `variants.ts` with `tv()`, `cn`, the
  `tailwindAutoReference` Vite plugin, `.root` and camelCase classes, `data-*` state (DS
  `component-conventions.md` S1–S8).
- **The same code conventions, enforced by the site's own tooling.** `site/eslint.config.mjs` and
  `site/stylelint.config.mjs` port the DS rules. Root ESLint stops linting `site/src`.
- **The same `src/` layout and naming** (DS `folder-structure-conventions.md`).
- **Vitest Browser Mode** for unit and component tests, with one real test.
- **The conventions written down** under `docs/site/conventions/`, adapted to what the site uses.

## Decisions taken with the user (2026-11-03, do not reopen)

| Topic | Decision | User's words |
| --- | --- | --- |
| How the DS is used | Package as the one source; port the conventions and the styling stack around it; do not duplicate the DS | "Chủ yếu docs/conventions, src/ cho folder structure. Techstack styling libs: port gần giống từ design system, chỉ khác là không duplicate lại toàn bộ, xem mục theming-skins" |
| Lint | The site has its own ESLint and Stylelint config; root ESLint drops `site/src` | chose "Site có lint riêng" |
| Tests | Vitest Browser Mode with one sample test now; no Playwright e2e, no 90% coverage gate yet | chose "Vitest Browser Mode" |

These replace parts of [decision 0027](../../decisions/0027-react-spa-landing-page.md): "only
`styles.css` is imported", "no component JavaScript", and the non-goal "no Tailwind build in site".
Phase 5 records that in a new decision record.

## Non-goals

- No new landing page UI. The page keeps today's content (title, tagline, install command, Node
  floor, `PATH` note, GitHub link). It is only moved into the new layout and restyled with the
  semantic tokens. No `ThemeToggle` or `SkinToggle` on the page yet.
- No router, React Router, Base UI, `@mantine/hooks`, lucide, React Compiler, feature flags, auth,
  i18n, error reporting or `Providers`/`defineProvider`. Each one is added when a page needs it.
- No Playwright, no axe, no coverage gate.
- No web fonts. The package carries none; the stacks fall back to system fonts, as they do today.
- No change to the CLI (`src/`, `tests/`, `dist/cli.mjs`) or to the nginx routes.
- No copying of DS token, colour, skin or typography CSS into the site.

## Acceptance criteria

1. `site/src/styles/styles.css` is `@import 'tailwindcss';` followed by
   `@import '@jjuidev/design-system/tailwind.css';` plus site globals only. There is no import of
   `@jjuidev/design-system/styles.css` anywhere (the DS warns when both are loaded).
2. `pnpm --dir site build` succeeds. The built page renders today's content with semantic tokens
   (for example `bg-raised`, `text-muted`, `border-default`, `text-heading-*`). Dark mode follows
   the OS with no wrong-theme flash on first paint.
3. `main.tsx` wraps the app in `ThemeProvider` from `@jjuidev/design-system`. The bundle carries
   no DS component it does not render. Report the gzip size of the JS and CSS before and after.
4. `site/src` follows the DS layout: `main.tsx` alone at the root; `pages/Home/Home.tsx` with
   `styles.module.css` and `Home.test.tsx`; `utils/tailwind-variants.util.ts`; `styles/styles.css`.
   Imports go through `@/`, only CSS is relative, components are arrow functions with a default
   export, and props are typed `interface HomeProps extends ComponentProps<'main'> {}`.
5. `pnpm --dir site lint` runs ESLint and Stylelint with the ported DS rules and passes. A
   deliberate violation of each kind (a relative TS import, `import type`, a `function`
   declaration, a kebab-case class in a CSS Module) is shown to fail, then reverted. Paste the
   output.
6. `pnpm --dir site test` runs Vitest Browser Mode in headless Chromium and passes. `Home.test.tsx`
   asserts by role and text (DS testing rules T2–T4), not by a snapshot of the whole page.
7. Root `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes. Root ESLint no longer
   globs `site/src`. `react` does not appear in the root `package.json` or `dist/cli.mjs`.
8. CI (`.github/workflows/ci.yml`) runs site lint, typecheck and test in `checks`, installing
   Chromium for the Vitest browser. The `image` job is unchanged apart from what the build needs.
9. Every new dependency is pinned to an exact version. Prefer the versions the DS lockfile resolves
   (`the dokploy repository`) when they install.
10. The docs in Phase 5 exist, and every claim in them matches the code.

## Phases

### Phase 1: tarball and styling stack

- Check that `site/vendor/jjuidev-design-system-0.1.0.tgz` matches DS `HEAD` (`c9e5c1d`). If it is
  stale, re-pack it (`pnpm build:lib && pnpm pack` in the DS) and say so. Do not commit anything in
  the DS repo.
- Add `tailwindcss`, `@tailwindcss/vite`, `tailwind-variants` and `tailwind-merge` (exact
  versions). `tailwind-merge` is a direct dependency because `tailwind-variants` 3 declares it as an
  optional peer (DS decision 0001).
- Port DS `vite/tailwind-auto-reference.plugin.ts` to `site/vite/` with its entry pointing at the
  site's `/src/styles/styles.css`.
- `site/vite.config.ts`: `tailwindAutoReference()` first, then `react()` and `tailwindcss()`,
  `resolve.tsconfigPaths: true`, and the dev-only readable CSS Module names from the DS config.
  Leave out the DS-only plugins (design tokens module, agent files, CSP, canonical origin, deploy
  modes, React Compiler).
- `site/src/styles/styles.css` as in acceptance criterion 1. Move the rules of today's `site.css`
  into the Home module (Phase 2); globals stay only if no token or DS base rule covers them.
- Port DS `src/utils/tailwind-variants.util.ts` (`tv`, `cn`, the semantic text roles). The package
  does not export it, so this is the one copied DS file. Keep it identical and note its source in
  `docs/site/conventions/` (not in a code comment).

### Phase 2: `src/` layout, theming and content

- Restructure to `src/main.tsx` and `src/pages/Home/{Home.tsx,styles.module.css,Home.test.tsx}`.
  Remove `App.tsx` and `site.css`.
- `main.tsx`: find `#root` and throw if missing (as today), then render
  `StrictMode > ThemeProvider > Home`. Use the package's provider; do not reimplement the theme.
- First paint: today `index.html` sets `data-theme=dark` from `prefers-color-scheme` before React
  runs. Read how the package's `ThemeProvider` and its `jds-theme` cookie resolve the theme on
  mount (DS `src/contexts/Theme/`, decision 0010). Keep a pre-paint script only if it is still
  needed, and make it agree with the provider (cookie first, then the OS). If the right behaviour is
  unclear, stop and report back instead of guessing.
- Restyle `Home` with semantic tokens through `@apply` in `styles.module.css`. Same text, same links.
  Respect DS S5 (`:where()`) only for `src/components/`; a page module does not need it.

### Phase 3: lint and type config

- `site/eslint.config.mjs`: port DS `eslint.config.mjs` (react, react-hooks `recommended-latest`,
  import-x order with `@/` and CSS last, `no-restricted-imports` for relative non-CSS imports in
  `src/` except tests, `consistent-type-imports: no-type-imports`, `prefer-arrow-functions`,
  `arrow-body-style`, `no-restricted-syntax` for `enum`, padding lines, vitest plugin for tests,
  `CONFIG_LOADER_FILES` for `vite.config.ts`, `vitest.config.ts` and `vite/*.ts`). Drop the
  Playwright block. Follow this repo's rule: assign to `eslintConfig`, then default-export it.
- `site/stylelint.config.mjs`: port DS `stylelint.config.mjs` (standard, css-modules, Tailwind
  at-rules, camelCase module classes).
- Prettier stays at the root, and formatting facts stay in `.editorconfig` (this repo's CLAUDE.md,
  "One fact, one home"). Do not add a `.prettierrc` in `site/`.
- `site/package.json` scripts: `lint` (ESLint and Stylelint), `format`, `test`, `test:watch`;
  keep `build`, `dev`, `preview`, `typecheck`.
- `site/tsconfig.json`: add `paths` `@/*`, set `verbatimModuleSyntax: false` (required by
  `no-type-imports`), add `allowImportingTsExtensions` for the config loader files, and include
  `vite/` and the config files. Keep the stricter flags already there (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, ...) unless the package's types break them; report it if they do.
- Root: remove `site/src` from `SOURCE_FOLDERS` in `eslint.config.mjs` and from the `lint` and
  `lint:fix` globs in `package.json`. Update the CI comment that says the root config lints the
  site.

### Phase 4: Vitest Browser Mode and CI

- Add `vitest`, `@vitest/browser-playwright`, `playwright`, `vitest-browser-react` and
  `@vitest/eslint-plugin` (exact versions). Port DS `vitest.config.ts` (merge with the Vite config,
  stable `<Folder>_<class>` CSS Module names, browser mode, `reducedMotion: 'reduce'`, Chromium)
  without the coverage block, and DS `vitest.setup.ts` (`vitest-browser-react`, global CSS).
- `Home.test.tsx`: heading, install command and GitHub link, queried by role and text.
- CI `checks` job: after `pnpm --dir site install --frozen-lockfile`, install the Chromium the
  Vitest browser needs (`pnpm --dir site exec playwright install --with-deps chromium`), then run
  `pnpm --dir site lint`, `typecheck` and `test`. Keep the image job building the site as it does
  now.

### Phase 5: docs

- `docs/site/conventions/`: adapted copies of the DS conventions the site follows: folder
  structure, component, code, styling and tokens (how to use the package's tokens, not how to
  author them), and testing. Each file says it was adapted from the DS and lists what the site
  leaves out (router, auth, feature flags, Base UI, mantine, Storybook, e2e, coverage gate). Keep
  them short. Write only rules the site's tooling or layout follows today (this repo's
  CLAUDE.md, "Write what exists").
- New decision record `docs/decisions/0028-...md` that supersedes the styling and
  component-import parts of 0027 and records the three decisions above with the user's words.
  Mark 0027 as partly superseded.
- Update `docs/codebase-summary.md`, `docs/system-architecture.md`, the "Where things are" table in
  `CLAUDE.md` if the site rows change, and `docs/deployment-guide.md` only if CI or the image
  changed.

## Verification to report

Run, and paste the real output:

```bash
pnpm --dir site install --frozen-lockfile
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Also report: the bundle size before and after, the deliberate lint failures from criterion 5, and a
screenshot or a description of the built page in light and dark.

## Constraints

- Do not commit or push. A push to `main` deploys (CLAUDE.md). The planner reviews first.
- Do not edit the DS repo.
- If pnpm refuses a version because of `minimumReleaseAge`, go back to an older exact version. Do
  not add an exclusion.
- Raise a blocking question at the step it blocks, one at a time, with your leaning.

## Open questions

- Whether the pre-paint theme script stays depends on the package's `ThemeProvider` behaviour
  (Phase 2). The cooker decides from the source, or reports back.
