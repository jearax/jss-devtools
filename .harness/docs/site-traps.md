# Site traps

Facts about `site/` that cost real time when missed. Each names the file that proves it. Conventions
themselves live in [site/conventions/](./site/conventions/); screenshot procedures in
[site-screenshots.md](./site-screenshots.md).

## Styling

- A decorative layer behind page content needs `isolate` on the page root before `-z-1` on the
  layer, else it escapes the stacking context.
- `text-display-*` is the serif family at normal weight; a sans weighted headline is
  `text-heading-*`. Never repoint `--font-serif` (design-system
  `packages/styles/src/utilities/typography.css`).
- In a CSS Module, a media-prefixed `max-lg:hidden` loses to a plain `display:flex` utility when
  source order favours it: media queries add no specificity. Use `!` or compound the selector.
- A scroll container clips children at its padding box, so `-mb-px` cannot cover the container's
  own `border-b`; draw the rule as a `before:` pseudo-element inside it
  (`site/src/components/Terminal/styles.module.css`).
- A `styles.x` missing from its CSS Module is `undefined` with no lint or type error; when spacing
  looks wrong, check each `styles.*` exists
  (`site/src/pages/Home/components/CommandsBand/CommandsBand.tsx`).
- Favicons come from `@jjuidev/react/brand/*` via `vite-plugin-static-copy` at build; never commit
  copies into `site/public/` (`site/vite.config.ts`).

## Lint

- The site's import order differs from the root repo's: all `@/` imports sit in one alphabetical
  group with no blank lines, and a type-only import is still written as a value `import` when its
  module has one (`site/eslint.config.mjs`).

## Tests (`site/vitest.config.ts`)

- Vitest scopes CSS Module classes differently from Vite: `[class*="Component__x"]` matches
  nothing. Select by role, text or data attribute.
- Browser locators have no `count()`; guard a may-not-exist element with try/catch around
  `click()`.
- A first-time test dependency goes into `optimizeDeps.include`, else Vite re-optimizes mid-run and
  a cold run times out.
- A wrong named import in `site/src/constants/search-index.constant.ts` fails unrelated suites
  (AppRouter, Layout, SearchPalette load the index) with "does not provide an export named X";
  fix the import, not those suites.
- Tests run with `reducedMotion: 'reduce'`; a test needing the reveal end dispatches `animationend`
  on the marked element.
- `@tanstack/react-hotkeys` reads `navigator.platform`; to test the Windows label in Playwright,
  override `Navigator.prototype.platform` in an init script (`site/src/constants/search.constant.ts`).
