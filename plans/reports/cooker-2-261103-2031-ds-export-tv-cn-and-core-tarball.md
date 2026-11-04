# Report: export tv and cn from the design system, move the site to the core tarball

Plan: [261103-2031-ds-export-tv-cn-and-core-tarball](../261103-2031-ds-export-tv-cn-and-core-tarball/plan.md)

Both parts are done. The design system exports `cn` and `tv` on `main` and `core`, both branches
are pushed, the site installs the tarball packed from `core`, and the site copies nothing from the
design system any more.

## Part A: the design system

Repository: `/Users/tandm/Documents/jearax/dokploy/design-system`.

### What changed on each branch

| File | Change |
| --- | --- |
| `src/lib/index.ts` | `export { cn, tv } from '@/utils/tailwind-variants.util';` added to the public surface |
| `test/library-consumers.e2e.ts` | The consumer app imports `cn` and `tv` from the package and renders their output; a new test asserts the semantic-role merge; the consumer type check imports them too |
| `README.md` | One line in "Use as a package": a host imports `cn` and `tv` from the package instead of copying the class helpers. On `core` the exports table gained a row for each |
| `CHANGELOG.md` | `[Unreleased]` → `Added`: the package exports `cn` and `tv` |

The new consumer test:

```ts
test('the package exports the class helpers, and they keep the semantic text roles', async ({ page }) => {
	await page.goto(`http://127.0.0.1:${ports.get('plain')}/`);

	// The semantic text roles are sizes, not colors: the merge must keep both.
	await expect(page.getByTestId('merged')).toHaveAttribute('class', 'text-heading-xl text-default');
	await expect(page.getByTestId('varied')).toHaveAttribute('class', 'text-label-sm text-muted');
});
```

It is a real gate: without the export the consumer app fails to build and the whole suite fails in
`beforeAll`.

### Commits and pushes

| Branch | Commit | Push |
| --- | --- | --- |
| `core` | `ae147d6` (`feat(lib): export tv and cn`) | `5d0a285..ae147d6`, pushed before the tarball was packed |
| `main` | `fa07334` (`feat(lib): export tv and cn`) | `c9e5c1d..fa07334`, pushed after every check below was green |

Neither push used `--force` or `--no-verify`; the commit hooks (lint-staged, commitlint) ran.

### Checks, before each push

`core`:

| Command | Result |
| --- | --- |
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm test` | 21 files, 152 tests passed |
| `pnpm test:coverage` | statements 98.94%, branches 95.27%, functions 98.79%, lines 98.94% (gate is 90%) |
| `pnpm build:lib` | built; `dist/lib/index.js` exports `cn` and `tv` |
| `pnpm test:e2e` | 11 passed, including the new consumer test |

`main`:

| Command | Result |
| --- | --- |
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm test` | 64 files, 316 tests passed |
| `pnpm test:coverage` | statements 97.41%, branches 90.82%, functions 97.69%, lines 97.37% |
| `pnpm build:lib` | built |
| `pnpm test:e2e` | 184 passed |

The first run of `main`'s e2e failed two tests in `test/server-rendered-preferences.e2e.ts` with
`Error: Docker is required: this suite runs the real nginx image.` The machine had no Docker
daemon (colima installed, not running). Colima was started, and the full suite then ran green at
184 tests, so the plan's fallback to the consumer spec alone was not needed. Colima was stopped
again afterwards.

### The tarball

Packed from `core` at commit `ae147d6dfbdc1a887dad9ccb63e21bb1f05958f9`:

```
pnpm build:lib && pnpm pack --pack-destination /tmp/ds-pack
```

`jjuidev-design-system-0.1.0.tgz` was copied to `site/vendor/jjuidev-design-system-0.1.0.tgz`.
The tarball's `package.json` says `@jjuidev/design-system` `0.1.0`, and its `dist/lib/index.js`
exports:

```
export { S as Button, R as PLATFORM_SKINS, ae as SkinToggle, E as THEME_OPTIONS, We as ThemeProvider, se as ThemeToggle, b as cn, I as defineSkin, fe as parsePreferences, re as tv, w as useTheme }
```

`Logo`, `ButtonCopy` and `Popover` are gone from it, as `core` decided.

### CI

| Branch | Run | Result |
| --- | --- | --- |
| `core` | [41646958683](https://github.com/jearax/design-system/actions/runs/41646958683) (`ae147d6`) | success |
| `main` | [41647684994](https://github.com/jearax/design-system/actions/runs/41647684994) (`fa07334`) | success: `test`, `image (embedded)`, `image (standalone)`, `deploy` all green |

The `main` workflow has three jobs: `test`, then `image` (two modes), then `deploy`. The deploy
job is what calls the Dokploy webhook, and it only runs when `test` and `image` pass, so the site
is not deployed on a failing check. It ran and succeeded, so the design system site was redeployed
with this change. The design system's site carries no `cn` or `tv` usage of its own, so the
deploy changes nothing visible there.

## Part B: the site

No commit and no push in this repository; the changes are in the working tree.

### What changed

| File | Change |
| --- | --- |
| `site/vendor/jjuidev-design-system-0.1.0.tgz` | Replaced with the tarball packed from `core` |
| `site/package.json` | `tailwind-merge` and `tailwind-variants` removed from `dependencies`; they now arrive through the package |
| `site/src/utils/tailwind-variants.util.ts` | Deleted, and with it the `site/src/utils/` folder |
| `site/src/pages/Home/Home.tsx`, `Hero.tsx`, `Requirements.tsx`, `SiteFooter.tsx`, `SiteHeader.tsx`, `InstallCommand.tsx` | `cn` is imported from `@jjuidev/design-system` |
| `site/src/pages/Home/components/SiteHeader/SiteHeader.tsx` | `Logo` removed; the header keeps the `ThemeToggle` |
| `site/src/pages/Home/components/SiteHeader/styles.module.css` | `.inner` uses `justify-end` instead of `justify-between`, so the toggle stays on the right with one child |
| `site/src/pages/Home/components/InstallCommand/InstallCommand.tsx` | `ButtonCopy` removed; the block shows the command only |
| `site/src/pages/Home/components/InstallCommand/styles.module.css` | The `.copy` class removed with the button |
| `site/src/pages/Home/Home.constant.ts` | `INSTALL_COMMAND_SUBJECT` and `COPY_STATUS_LABELS` removed |
| `site/src/pages/Home/components/InstallCommand/InstallCommand.test.tsx` | Deleted; the install command is still asserted by `Home.test.tsx` |

`tailwind-merge` and `tailwind-variants` were kept out of the site's own dependencies on purpose:
the package depends on both, and `tailwind-variants` declares `tailwind-merge` and `tailwindcss`
as peers. The site's own `tailwindcss` satisfies the second peer, so nothing is imported twice
and no site file needs either package directly.

### The lockfile

The vendored tarball's integrity changed:

```
- sha512-29JcCnslGTYpz+VIEHczKsDXaya667jNfpJQAp+sF44bJPg4vCG6a85KEXk0IM7ReacrCpMeUvkD6AthOKEbsw==
+ sha512-UCynFcf3LgOdFLJQ4NHGVqBRx82CNtXIG5lcZINo50DBxr47CM/jlRCKsMqI3oPaDYhcwDE1gJEAqFAiO4z5Yg==
```

Its peer suffix changed with it, because the `core` package declares `vitest` as an optional peer
and `tailwind-variants` declares `tailwindcss` as one:

```
- ...(@types/react-dom@19.3.0(@types/react@19.3.0))(@types/react@19.3.0)(react-dom@19.3.1(react@19.3.1))(react@19.3.1)
+ ...(@types/react@19.3.0)(react-dom@19.3.1(react@19.3.1))(react@19.3.1)(tailwindcss@4.3.3)(vitest@5.0.3)
```

### ThemeToggle and ThemeProvider on the `core` build

No difference. `git diff main core -- src/contexts/Theme/` touches only two comments: the wording of
a prop's doc comment and a comment about the system switch. `ThemeProvider` and `useTheme` are
byte-identical between the branches. The site passes `label` and `optionLabels` to `ThemeToggle`
and no props to `ThemeProvider`; both are supported on `core` (`ThemeToggleProps` carries
`label?: string` and `optionLabels?: Partial<Record<ThemePreference, string>>`), the site's
typecheck passes, and the home test asserts the toggle's accessible name.

### Checks

| Command | Result |
| --- | --- |
| `pnpm --dir site lint` | clean |
| `pnpm --dir site typecheck` | clean |
| `pnpm --dir site test` | 1 file, 6 tests passed |
| `pnpm --dir site build` | built |
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm test` | 30 files passed, 1 skipped; 480 tests passed, 7 skipped |
| `pnpm build` | built |
| `pnpm format:check` | clean |

### Bundle size

| Asset | Before | After | Delta |
| --- | --- | --- | --- |
| JavaScript | 136.57 kB gzip (417,362 B raw, 134,959 B gzip) | 134.49 kB gzip (412,217 B raw, 133,008 B gzip) | −2.08 kB |
| CSS | 8.45 kB gzip (46,979 B raw, 8,442 B gzip) | 7.37 kB gzip (38,014 B raw, 7,415 B gzip) | −1.08 kB |

Both numbers come from the build's own report; the raw and `gzip` byte counts are measured with
the `gzip` command. The CSS shrank because `core` does not ship the `Logo`, `ButtonCopy` and
`Popover` styles the site no longer uses.

### Docs

| File | Change |
| --- | --- |
| `docs/decisions/0036-site-runs-the-design-system-as-a-package.md` | The copied util is gone: the package exports `cn` and `tv`. The tarball is packed from `core`, and why. The consequence about the site rendering no design system component now says it renders the theme toggle |
| `docs/site/conventions/README.md` | Nothing is copied from the design system any more |
| `docs/site/conventions/styling-conventions.md` | `tv()` and `cn()` come from the package |
| `docs/site/conventions/component-conventions.md` | `ThemeToggle` is the one component used from the package; `cn` and `tv` are imported from it |
| `docs/site/conventions/folder-structure-conventions.md` | The `utils/` folder and the copy-button test are out of the tree; the import example uses the package |
| `docs/codebase-summary.md` | The `site/src/utils/` row is gone; the section says the tarball comes from `core` and that the site copies nothing |

## Acceptance criteria

| # | Criterion | Result |
| --- | --- | --- |
| 1 | `cn` and `tv` exported on both branches, both commits on `origin`, checks green before each push | Met: `ae147d6` on `core`, `fa07334` on `main`, both pushed, both green before the push |
| 2 | The tarball's `dist/lib/index.js` exports `cn` and `tv`, and its `package.json` comes from `core` | Met |
| 3 | `site/src/utils/` is gone, no `tailwind-variants.util` reference left | Met |
| 4 | No `ButtonCopy` or `Logo` left in `site/src` | Met |
| 5 | Site and root checks green | Met, output above |
| 6 | JS and CSS gzip before and after | Met: 136.57 kB → 134.49 kB and 8.45 kB → 7.37 kB |
| 7 | The CI runs of the two pushes | Met: `core` success, `main` success with the `deploy` job green |

## Follow-up: the theme toggle belongs on the right

The planner's review caught a real bug in what this report described. `SiteHeader`'s `.inner` was
`justify-between` with a single child, so with `Logo` gone the toggle landed on the **left**, not
on the right. The user's layout puts the toggle on the right, so `.inner` is now `justify-end`:

```css
/* One child today, so the toggle sits on the right rather than on the left. */
.inner {
	@apply wrapper flex max-w-3xl items-center justify-end gap-4 py-4;
}
```

When the wordmark comes back it returns to the left, and `.inner` goes back to `justify-between`.

Measured on the built site at a 1280 px viewport: `.inner` spans 256 → 1024 px, the toggle sits at
968 → 1008 px, flush with the container's right edge, and `justify-content` computes to
`flex-end`. The screenshot is `plans/reports/site-header-toggle-right.png`.

| Command | Result |
| --- | --- |
| `pnpm --dir site lint` | clean |
| `pnpm --dir site test` | 1 file, 6 tests passed |
| `pnpm --dir site build` | built; CSS 38.00 kB, gzip 7.37 kB; JS 412.21 kB, gzip 134.49 kB |

Nothing else changed, and nothing was committed or pushed.

## Notes for the planner

- The site no longer has a copy button or a wordmark. `core` does not export `ButtonCopy` or
  `Logo`, and the plan said to remove both from the site for now. The home page shows the install
  command as text and the header shows only the theme toggle, on the right, with the left side
  empty until the wordmark comes back.
- `site/package.json` lost two direct dependencies. If the site's own Tailwind build ever needs
  `tailwind-merge` directly, it has to come back as a direct dependency rather than through the
  package.
- Colima was started for the Docker e2e and stopped again.
- The dev server that was already running on port 5173 for `site/` is now serving a stale
  optimized-deps bundle of the old design system (`does not provide an export named 'cn'`), so the
  page is blank there. It predates the tarball swap and holds its optimizer state in memory, so it
  needs a restart; it was not started here and was left running. Its cache directory
  `site/node_modules/.vite/deps` was removed, so the next start re-optimizes from the new tarball.
