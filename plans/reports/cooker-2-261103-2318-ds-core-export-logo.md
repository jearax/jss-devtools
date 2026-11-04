---
title: Cooked the DS core export of the Logo
date: 2026-11-03
summary: "The brand mark component came back to the design system's core branch, is exported from the package, and the site header shows the wordmark next to the theme toggle."
---

# Cooked the DS core export of the Logo

## Outcome

`Logo` is back on the design system's `core` branch, exported from the package, pushed, and
vendored into the site. The site's header shows the mark and the wordmark on the left and the theme
toggle on the right, in both themes, and the mark alone below `48rem`.

| | |
| --- | --- |
| DS `core` commit | `e8ec537` (`feat(lib): export the Logo brand mark`), pushed to `origin/core` |
| DS `core` CI | run `41674490835`, **success**, 1m45s |
| Tarball | `site/vendor/jjuidev-design-system-0.1.0.tgz`, packed from `core` at `e8ec537` |
| jss-devtools | **not committed, not pushed** (a push to `main` deploys) |

The work was done in a temporary worktree at `/tmp/ds-core-2318` on branch `core`. The design
system's main worktree stayed on `main` at `fa07334`, and `worktree/silver-cloud-224f` was not
touched.

## Part A: the design system's `core` branch

### What changed

| File | Change |
| --- | --- |
| `src/components/Logo/Logo.tsx` | Restored from `main`, unchanged |
| `src/components/Logo/Logo.constant.ts` | Restored; the first comment no longer points at `scripts/brand-icons` |
| `src/components/Logo/Logo.test.tsx` | Restored, unchanged (6 tests) |
| `src/components/Logo/styles.module.css` | Restored; the first comment now states the reason instead of a rule the repository does not state |
| `src/lib/index.ts` | Exports `Logo` and `LogoProps`, in the file's existing style |
| `test/library-consumers.e2e.ts` | The consumer app imports and renders `Logo`; a new test asserts the mark and its wordmark; the consumer type check imports it too |
| `CHANGELOG.md` | `Added`: the package exports `Logo`. `Changed`: the branch now holds the brand mark component, the copy button and the language constants are the ones the surface no longer exports, and the brand assets that left are the ones other than the mark |
| `docs/decisions/0007-autumn-default-palette.md` | The bullet amended in place (see below) |
| `README.md` | The intro and the exports table list the brand mark component |
| `docs/ARCHITECTURE.md` | The public surface lists `Logo` among the components |
| `docs/README.md` | The intro lists the brand mark component |
| `docs/conventions/component-conventions.md` | The catalog gains the `Logo` row, as on `main` |

### The two comments that had to change

`Logo.constant.ts` opened with "The SVG masters in scripts/brand-icons are drawn from these
numbers", and `scripts/brand-icons` does not exist on `core`. It now reads "The mark's geometry:
the stem path, the three dots and the tagline."

`styles.module.css` opened with "Raw palette steps for the mark: brand art is the one place they
are allowed". That asserts a rule the repository states nowhere: `core`'s design-token conventions
say that a raw Tailwind color in a component "needs a reason in review" (rule D2) and that brand
art such as a wordmark may use plain Tailwind classes where no text role fits. The comment now
states the reason the mark reads the palette steps: a semantic token points at one step per scale,
and the three dots sit on different ones. No visual change.

The component itself is unchanged from `main`, as the plan requires: no redesign of the mark, no
change to the dots, the wordmark or the collapse.

### Decision 0007: amended in place, not a new record

The plan offered both. I amended the existing bullet:

> **The package ships the brand mark component and no other brand asset**, so the palette is a code
> change in `src/styles/theme.css` only.

The reason for the least edit is the repository's own precedent: `0007` and `0003` both carry dated
amendments inside the decision they amend, and the library-only cut of `core` itself lives in the
`CHANGELOG`, not in a decision record. A new record for "one component came back" would be heavier
than the repo's practice.

### Checks on `core`

| Command | Result |
| --- | --- |
| `pnpm lint` | clean (ESLint + Stylelint) |
| `pnpm typecheck` | clean |
| `pnpm test` | 22 files, 158 tests passed (the `Logo` file's own 6 included) |
| `pnpm test:coverage` | statements 98.95%, branches 95.28%, functions 98.8%, lines 98.95% — above the 90% gate |
| `pnpm build:lib` | built; `dist/lib/index.js` exports `Logo` |
| `pnpm test:e2e` | 12 passed, including the new consumer test |

The consumer e2e is a real gate: without the export the fixture app fails to build and the whole
suite fails in `beforeAll`.

### The tarball

Packed from `core` at `e8ec537c26a07dfa2ce8c02baa3045b88fe47f84`:

```
pnpm build:lib && pnpm pack --pack-destination /tmp/ds-pack
```

`jjuidev-design-system-0.1.0.tgz` was copied to `site/vendor/jjuidev-design-system-0.1.0.tgz`.
Its `package.json` says `@jjuidev/design-system` `0.1.0`, and its `dist/lib/index.js` exports
`Logo`. Its `dist/lib/types/lib/index.d.ts` exports `Logo` and `LogoProps`.

The mark's CSS ships with it. The CSS module hash carries no "Logo" in it, so the packaged
stylesheet holds `_root_1x7zg_2`, `_mark_1x7zg_2`, `_stem_1x7zg_2` and the rest, and the `48rem`
collapse rule survives minification as `@media not all and (width>=48rem)`.

## Part B: the site

### What changed

| File | Change |
| --- | --- |
| `site/src/pages/Home/components/SiteHeader/SiteHeader.tsx` | `Logo` on the left with `expanded`, `ThemeToggle` on the right |
| `site/src/pages/Home/components/SiteHeader/styles.module.css` | `.inner` is `justify-between` again; the "One child today" comment is gone |
| `site/src/pages/Home/Home.test.tsx` | A new test: the header shows the brand mark with its wordmark |
| `site/pnpm-lock.yaml` | The vendored tarball's integrity hash, one line |
| `site/vendor/jjuidev-design-system-0.1.0.tgz` | The new tarball |
| `docs/decisions/0036-site-runs-the-design-system-as-a-package.md` | The paragraph that said `core` exports no brand mark now says it does, and the header shows the wordmark; the copy button still stays out |
| `docs/site/conventions/component-conventions.md` | `ThemeToggle` and `Logo` both come from the package |

The `Logo` carries no `aria-label`. Its name in context is the wordmark text, and the test checks
that the wordmark renders and is visible rather than repeating the name in an attribute.

### The lockfile

`pnpm --dir site install` changed one line: the tarball's integrity hash.

```
- integrity: sha512-UCynFcf3LgOdFLJQ4NHGVqBRx82CNtXIG5lcZINo50DBxr47CM/jlRCKsMqI3oPaDYhcwDE1gJEAqFAiO4z5Yg==
+ integrity: sha512-ys63sX21NmuQjIJRf9o/bvPQP1REXPUuFlJPNfx+DdCii8SAkm8wi3KXk1enKfEMr9MeVbvW271LFCi+QR0+uA==
```

### The checks

| Command | Result |
| --- | --- |
| `pnpm --dir site lint` | clean |
| `pnpm --dir site typecheck` | clean |
| `pnpm --dir site test` | 1 file, 7 tests passed |
| `pnpm --dir site build` | built |
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm test` | 30 files passed, 1 skipped; 480 tests passed, 7 skipped |
| `pnpm build` | `dist/cli.mjs` 337.07 kB, gzip 88.44 kB |
| `pnpm format:check` | all matched files use Prettier code style |

### The browser check

The build was served on port 4173 and checked in Chromium. The dev server on port 5173 was
restarted in place afterwards, with the user's authorisation, and serves the same page; see the open
items.

| State | Measured |
| --- | --- |
| 1280 px, light | Logo left with the wordmark, toggle right. Stem stroke `rgb(122, 61, 98)` (`primary-700`, autumn plum) |
| 1280 px, dark | Stem stroke `rgb(225, 169, 213)` (`primary-300`), foot dot at scale 1 and opacity 0.35, apex dot `rgb(189, 197, 125)` (`secondary-300`) |
| 360 px, light and dark | The mark alone: the logo is 56 px wide, the wordmark's box is 0 px wide at opacity 0, `justify-content: space-between`, the toggle's right edge at 344 px |
| Horizontal scroll | None: `scrollWidth` equals `clientWidth` at 1280 px (1280) and at 360 px (360). The install command still scrolls inside its own block, as it did before |

Screenshots:

- `plans/reports/site-header-with-logo-light-1280.png`
- `plans/reports/site-header-with-logo-dark-1280.png`
- `plans/reports/site-header-with-logo-light-360.png`
- `plans/reports/site-header-with-logo-dark-360.png`
- `plans/reports/site-header-with-logo-dev-server-1280.png` (the dev server, after the restart)

### Bundle size

| Asset | Before | After | Delta |
| --- | --- | --- | --- |
| JavaScript | 134.49 kB gzip (412,217 B raw, 133,008 B gzip) | 134.98 kB gzip (413,434 B raw, 133,457 B gzip) | +0.49 kB |
| CSS | 7.37 kB gzip (38,014 B raw, 7,415 B gzip) | 7.89 kB gzip (42,412 B raw, 7,916 B gzip) | +0.52 kB |

The before column is plan 261103-2031's measurement of the same build without the mark. The after
column is the build's own report plus `gzip -n -c`. The CSS grew back what plan 2031 took off when
`core` stopped shipping the `Logo`, the `ButtonCopy` and the `Popover` styles; the copy button and
the popover are still out.

## Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | `git show core:src/lib/index.ts` exports `Logo` and `LogoProps`; the commit is on `origin/core`; the checks were green before the push; `gh run list` shows the `core` CI run | Met: `e8ec537` on `origin/core`, all checks green before the push, CI run `41674490835` success |
| 2 | The tarball's `dist/lib/index.js` exports `Logo`, and its `package.json` comes from `core` | Met |
| 3 | The header shows the Logo left and the toggle right, in both themes, and the mark alone at 360 px | Met, measured and screenshotted above |
| 4 | Site and root checks green | Met, output above |
| 5 | JS and CSS gzip before and after | Met: 134.49 → 134.98 kB and 7.37 → 7.89 kB |

## Open items

**Resolved: the dev server on port 5173 needed a restart to pick up the new tarball.** Its Vite
optimizer cache was built before the swap, so the page came up blank with
`Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@jjuidev_design-system.js?v=a55732d5'
does not provide an export named 'Logo'`. Vite keys the optimizer on the lockfile hash and only
re-checks it when the server starts, so a `file:` dependency whose bytes changed under the same
version leaves the pre-bundle stale. The plan forbids restarting that server, so the first browser
check ran against the production build on a second port. The user authorised an in-place restart
afterwards: `touch site/vite.config.ts`, which restarts the Vite server inside the same process, on
the same port, in the same pane. The server logged "Re-optimizing dependencies because lockfile
has changed", and the dev server now serves the site with the mark, the wordmark and the toggle,
with no console error. `plans/reports/site-header-with-logo-dev-server-1280.png` is that state.

Nothing else is outstanding: the copy button is still out of `core`, as the plan says it stays.
