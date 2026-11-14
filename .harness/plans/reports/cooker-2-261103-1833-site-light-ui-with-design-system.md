# Cooker report: light landing UI on the design system

Plan: [261103-1833-site-light-ui-with-design-system](../261103-1833-site-light-ui-with-design-system/plan.md)
Date: 2026-11-03. Nothing was committed and nothing was pushed. The design system repository was
not touched.

## Outcome

The page is now five components on the design system's own components. `Logo` and `ThemeToggle`
render in the header, `ButtonCopy` renders in the install block, and everything else is the
package's semantic tokens. Every acceptance criterion is met, and the answer to the plan's main
question — is the design system fit for the site — is: **yes, with one variant that does not fit
this context and one utility that is wider than a landing page**. Both are reported below with
evidence.

## Files changed

### New, in `site/src/pages/Home/`

| Path                                                        | What it is                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `Home.constant.ts`                                          | Every fixed value the page shows, in `UPPER_SNAKE_CASE`              |
| `components/SiteHeader/SiteHeader.tsx` + `styles.module.css`| The `<header>`: the design system's `Logo` and `ThemeToggle`         |
| `components/Hero/Hero.tsx` + `styles.module.css`            | The `<h1>` and the tagline                                            |
| `components/InstallCommand/InstallCommand.tsx` + styles     | The install block and the design system's `ButtonCopy`                |
| `components/InstallCommand/InstallCommand.test.tsx`         | The copy test, against the real clipboard                            |
| `components/Requirements/Requirements.tsx` + styles          | The `<h2>` and the `<ul>` of requirements                             |
| `components/SiteFooter/SiteFooter.tsx` + styles             | The `<footer>` and the source link                                   |

### Changed

| Path                       | Change                                                                          |
| -------------------------- | ------------------------------------------------------------------------------- |
| `site/src/pages/Home/Home.tsx` | Now a `<div>` that composes the five components; `<header>`, `<main>`, `<footer>` are siblings |
| `site/src/pages/Home/styles.module.css` | The page band: `wrapper` narrowed to `max-w-3xl`                    |
| `site/src/pages/Home/Home.test.tsx` | The three original checks kept, plus the tagline, the requirements and the theme toggle |
| `site/vitest.config.ts`    | The browser provider grants the clipboard permissions                          |
| `tests/install.test.ts`    | Reads the Node floor from `Home.constant.ts` now                                |
| `.gitignore`               | `.vitest/` — the browser mode writes its failure screenshots there              |

### Docs

`docs/site/conventions/folder-structure-conventions.md` (the page folder, the `components/` folder,
the constants file), `docs/site/conventions/component-conventions.md` (the page components, the
fixed values, the package's components), `docs/site/conventions/styling-conventions.md` (the
`wrapper` reading column), `docs/site/conventions/testing-conventions.md` (the clipboard rule and
the no-snapshot rule) and `docs/codebase-summary.md` (the site tree).

No decision record: the page components folder and the constants file extend the conventions the
site already follows, they do not change one.

## Verification, real output

```
$ pnpm --dir site lint
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"

$ pnpm --dir site typecheck
$ tsc --noEmit

$ pnpm --dir site test
$ vitest run

 RUN  v5.0.3 .site

 Test Files  2 passed (2)
      Tests  7 passed (7)
   Duration  752ms (setup 36%, tests 27%, worker 27%)

$ pnpm --dir site build
$ tsc --noEmit && vite build
vite v8.3.5 building client environment for production...
✓ 2447 modules transformed.
dist/index.html                   0.94 kB │ gzip:  0.56 kB
dist/assets/index-NUH3WDxv.css   46.97 kB │ gzip:  8.45 kB
dist/assets/index-BiaoDD6n.js   417.37 kB │ gzip: 136.57 kB
✓ built in 252ms
```

```
$ pnpm lint
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"

$ pnpm typecheck
$ tsc --noEmit

$ pnpm test
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
   Duration  7.12s

$ pnpm build
✔ Build complete in 26ms
ℹ dist/cli.mjs  337.07 kB │ gzip: 88.44 kB

$ pnpm format:check
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

The root test that changed:

```
$ pnpm exec vitest run tests/install.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

## The bundle size, before and after

| Asset   | Before (raw / gzip) | After (raw / gzip) | Change                  |
| ------- | -------------------- | ------------------ | ----------------------- |
| JavaScript | 274.36 kB / 87.43 kB | 417.37 kB / 136.57 kB | +143.01 kB / +49.14 kB |
| CSS       | 43.87 kB / 8.10 kB   | 46.97 kB / 8.45 kB   | +3.10 kB / +0.35 kB     |

The JavaScript growth was measured, not guessed. Each design system component was built on its
own, with the same entry point and the same provider, and the bundle was read:

| Build                          | JavaScript (raw / gzip) | Against the baseline |
| ------------------------------ | ----------------------- | -------------------- |
| Baseline: no design system component | 274.36 kB / 87.43 kB | — |
| `Logo` only                    | 273.96 kB / 87.21 kB    | −0.40 kB / −0.22 kB  |
| `ButtonCopy` only              | 283.03 kB / 90.72 kB    | +8.67 kB / +3.29 kB  |
| `ThemeToggle` only             | 410.76 kB / 133.79 kB   | +136.40 kB / +46.36 kB |
| The page, all three            | 417.37 kB / 136.57 kB   | +143.01 kB / +49.14 kB |

- **`Logo` is free.** It is markup and CSS: the tree shakes it out of the bundle entirely.
- **`ButtonCopy` costs 3.29 kB gzip.** It brings `@base-ui/react/button` and two `lucide-react`
  icons.
- **`ThemeToggle` costs 46.36 kB gzip, and it is the whole story.** It brings
  `@base-ui/react/menu`, `@mantine/hooks` and four `lucide-react` icons. The menu is the price of
  the three-way light/dark/system choice; a plain two-state toggle would be far cheaper.
- The three together cost 6.6 kB gzip more than `ThemeToggle` alone, because `@base-ui/react` and
  `lucide-react` are already in the bundle by then.

The CSS grew by 3.10 kB raw. That is the site's own Tailwind engine emitting the utilities the new
components use; the design system's `components.css` was already in the bundle before this plan.

No dependency was added. `@base-ui/react`, `@mantine/hooks` and `lucide-react` come with the
design system package, and pnpm installs them with it.

## The browser checks

Checked on the built page through the dev server at `http://localhost:5173`, with the Chrome
DevTools MCP.

| Check | Result |
| ----- | ------ |
| Landmarks | `banner`, `main`, `contentinfo`, and one `ul` inside `main` |
| Headings | one `h1` ("jss-devtools") and one `h2` ("Yêu cầu") |
| Theme toggle | the trigger's accessible name is "Đổi giao diện"; the menu items are "Sáng", "Tối", "Hệ thống" |
| Switching the theme | `data-theme` on `<html>` goes `dark` → `light`, and the `jds-theme` cookie follows (`jds-theme=dark` → `jds-theme=light`) |
| After a reload | with `jds-theme=light` in the cookie, the page is `data-theme="light"` with a white background: the pre-paint script and the provider agree |
| Copy button | `data-status="copied"`, the live region reads "Đã sao chép", the accessible name becomes "Đã sao chép lệnh cài đặt" |
| 360 px wide | `scrollWidth` is 360, the same as `clientWidth`: no horizontal page scroll |
| The command at 360 px | the `<code>` is 173 px wide with 484 px of content: it scrolls inside its own block |
| Console | four messages, all of them the Vite and React DevTools notices. No error, no warning |

Screenshots, in `plans/261103-1833-site-light-ui-with-design-system/screenshots/`:

- `site-light-1833.png` — the page in light, at 1280 px
- `site-dark-1833.png` — the page in dark, at 1280 px
- `site-mobile-1833.png` — the page at 360 px, with the copy button under the command
- `site-icon-mode.png` — the install block in `feedback="icon"`, the evidence for the first finding
  below: the copy button is an empty box until the pointer reaches it

## What did not work out of the box

### 1. `ButtonCopy`'s `icon` feedback hides the glyph until hover

The plan's layout sketch shows a compact `[⧉]` copy button, which is the design system's `icon`
feedback mode. In that mode the design system sets the icon to `opacity: 0` and only shows it on
hover, on focus, or once the copy has happened:

```css
:where(.root[data-feedback='icon'] .icon) {
  @apply size-3.5 text-muted opacity-0 transition-opacity duration-150;
}

:where(
  .root[data-feedback='icon']:hover .icon,
  .root[data-feedback='icon']:focus-visible .icon,
  .root[data-feedback='icon']:not([data-status='idle']) .icon
) {
  @apply opacity-100;
}
```

The design system uses this mode for `TokenChip`, where the chip itself is the click target and
the icon is only a hint. The site's install block is different: the button stands on its own, so
it renders as an empty bordered box until the pointer reaches it. `site-icon-mode.png` is the
screenshot of that state.

The site uses `feedback="label"`, the package's default and a fully supported mode: the button
always shows the copy icon and the word "Sao chép". This is a configuration choice inside the
package's API, not a workaround: the site does not override the package's CSS to force the glyph
visible, because the plan forbids working around a design system component in the site.

**Decided by the user (2026-11-03): the site keeps `feedback="label"`.** The compact `[⧉]` of the
plan's sketch is not what ships; the button always shows the copy icon and the word "Sao chép". The
finding stays on record for the design system's own backlog, but the site does not wait for it.

### 2. `wrapper` is wider than a landing page, and `max-w-*` beats it

The package's `wrapper` utility is 1440 px at 2xl and 1320 px at 1280 px, so it never binds on an
ordinary screen. It also carries `padding-inline: 1rem`, the page gutter. The design system's own
rule says: "Put the page content in `wrapper`; use `max-w-*` for a reading column."

The site does both on the same element:

```css
.main {
  @apply wrapper flex max-w-3xl flex-1 flex-col gap-10 py-12;
}
```

The utility layer puts `max-w-3xl` after the custom `wrapper` utility, so the narrower one wins;
the measured `max-width` is `768px`. Without it the header sat at the page gutter and the content
at the centre of the column, and the two did not line up. With it, the logo, the heading and the
footer link all start at the same x.

**This is a question for the design system**: should `wrapper` ship a narrower default, or should
the package document that `max-w-*` overrides it?

### 3. The `Logo` wordmark disappears below 48 rem

The package hides the logo's wordmark under 48 rem:

```css
@media (width < 48rem) {
  :where(.text) {
    @apply max-w-0 opacity-0;
  }
}
```

At 360 px the header shows the mark alone, without "jjui dev". This is the design system's own
rule, unchanged, and it is a reasonable one for a narrow header. It is listed here because the
plan's sketch shows the wordmark in the header at every width.

### 4. `role="listitem"` has no accessible name

Worth knowing for the next test: `listitem` is not a name-from-content role, so
`getByRole('listitem', { name: 'Node >= 24.11.0' })` never matches. The requirements are checked
with `getByText` inside the list instead.

## The choices the plan left open

- **The presentation-only parts are covered by the page test, not by snapshots.** The plan allowed
  either. The site has no snapshot convention — the design system's rule T12 was left out when the
  site was set up, and a snapshot of a whole page is forbidden — so `Hero`, `Requirements` and
  `SiteFooter` are checked by their role and their text in `Home.test.tsx`. The file now has six
  checks: the three the plan asked to keep, plus the tagline, the requirements and the theme
  toggle.
- **`Home` is a `<div>`, not a `<main>`.** The plan asks for a `<header>`, a `<main>` and a
  `<footer>`. A `<main>` cannot hold a `<header>` and a `<footer>` as siblings, so `Home` is the
  container that holds all three, and `HomeProps` extends `ComponentProps<'div'>`.
- **The sentence "Cài đặt cho user hiện tại, không cần sudo:" is gone.** The plan's layout has no
  place for it, and the plan's list of the facts that stay — the Node floor, `curl` or `wget`,
  `~/.local/bin` and `PATH`, the GitHub URL — does not include it. The plan says "no new copy
  beyond what the page says today", and this line was copy the page said today. The user decided
  it stays out; see the decisions below.
- **The Node floor is one constant.** `Home.constant.ts` holds `NODE_FLOOR = '>= 24.11.0'`, and
  the root test compares it with `engines.node`, whitespace aside. The page renders `Node >=
  24.11.0`, so the `&gt;=` entity of the old test is gone: the constant holds `>=`.

## The decisions the user took (2026-11-03)

1. **The copy button keeps `feedback="label"`.** The compact `[⧉]` of the plan's sketch does not
   ship; the button always shows the copy icon and the word "Sao chép". The site does not override
   the package's CSS to make the `icon` mode show its glyph.
2. **The sentence "Cài đặt cho user hiện tại, không cần sudo:" stays out.** It is not added back.

A third correction came from the planner's review: the requirement line was wrong about the
facts. `PATH` holds directories, not files — the installer writes the `jss-devtools` shim *into*
`~/.local/bin` (`scripts/install.sh`, `BIN_DIR="${JSS_DEVTOOLS_BIN_DIR:-${HOME}/.local/bin}"`), and
the installer then checks that the *directory* is on `PATH`. The requirement now reads
`~/.local/bin trong PATH`, and the check in `Home.test.tsx` was changed with it.

## Open questions

None. Both questions the report raised are answered, and the copy correction is applied.

## Not done, on purpose

- No commit and no push: a push to `main` deploys.
- The design system repository was not edited. Its `dist/` was not rebuilt either; the vendored
  tarball was not touched.
- No new dependency, no router, no `SkinToggle`, no web fonts, no feature cards: the plan's
  non-goals.
