# Cooker-2 report — the redesigned site, Phase 1 and Phase 2

Plan: [261104-0116-site-redesign-home-and-docs](../261104-0116-site-redesign-home-and-docs/plan.md).
Direction: [design-direction.md](../261104-0116-site-redesign-home-and-docs/design-direction.md).

Phase 1 wrote the direction and built the hero prototype. Phase 2, below, is the whole thing: the
router, the home page's eight bands, the docs area, the server routes, the tests, the audit and the
docs. Nothing is committed and nothing is pushed.

## What exists now

| Piece | Where | What it is |
| --- | --- | --- |
| The direction | `plans/261104-0116-site-redesign-home-and-docs/design-direction.md` | The brief, the palette, the type, the motion list, the Home sections, the Docs IA, the reference study |
| The reference study | `plans/261104-0116-site-redesign-home-and-docs/refs/` | Eight screenshots at 1280 px of the four references, with what each does well |
| `Terminal` | `site/src/components/Terminal/` | The window frame, the real glyphs coloured by role, the typed command, the line-by-line reveal, the reduced-motion version |
| `CodeBlock` | `site/src/components/CodeBlock/` | The header, the file name or language, the horizontal scroll, no ligatures, highlighted lines |
| The header | `site/src/components/SiteHeader/` | The logo, the nav (Home, Docs, GitHub), the theme toggle, the mobile menu with `aria-expanded` and `aria-controls` |
| The hero | `site/src/pages/Home/components/Hero/` | The two-tone statement headline, the eyebrow, the value line, the install command, the animated terminal |
| The fonts | `site/src/styles/styles.css` | The design system's own three families, self-hosted, pinned |

The 0016 content stays: its constants, its fact table, the host skin, the cookie fix and the six
review fixes are all untouched, and the page still states only what the CLI really prints.

## The prototype

Four screenshots in `plans/reports/`: `site-prototype-hero-light-1280.png`,
`site-prototype-hero-dark-1280.png`, `site-prototype-hero-light-360.png`,
`site-prototype-hero-dark-360.png`.

What the hero does, and where each move comes from:

- **A two-tone statement headline.** "Set up the toolchain." in the display face, "Teach your
  agent." in the muted grey, on one line at 60 px. Herdr's move (`refs/herdr-1-hero.png`), and the
  thing 0016 did not have.
- **The display face is the design system's own serif role.** The package's `text-display-*` role
  already reads the serif family, so the headline is the package's role at a larger step. The
  package's theme stops at `3xl` (1.875 rem) and does not reset Tailwind's default sizes, so
  `text-display-6xl` is the engine's step, not the site's. The rendered size is 60 px.
- **The install command in a bordered box**, with the copy button's place left empty for the
  design system's own `ButtonCopy`. Herdr does exactly this.
- **The terminal is the product visual.** A real window: the three dots, the title, "Example
  output" on the right, the command typed out with a caret, and the CLI's real transcript with its
  real glyphs. The `✔` is the success token, the `✖` the error token, the `◇` the brand.
- **The install command and the terminal share the band**, the terminal the wider half.

The fonts are the package's own three families, self-hosted: Lora for the display, Be Vietnam Pro
for the text, Cascadia Code for everything the CLI prints. 148 kB of latin woff2, no third party at
runtime.

## The three defects the prototype found, and their fixes

1. **The typed command never appeared.** The `animation` shorthand carried two timing functions
   (`cubic-bezier` and `steps`), which is invalid, so the whole declaration was dropped and the
   command stayed at `width: 0` — invisible. The typing now uses `steps()` alone, and the width is
   automatic unless the animation runs, so a broken animation can never hide the content again.
2. **The hero was trapped in the 0016 reading column** (768 px), so the headline wrapped to three
   lines and the terminal clipped its own transcript. The page is now full bleed, with a reading
   column for the prose sections and the hero at 1152 px.
3. **The nav existed twice in the accessibility tree**: the desktop nav and the mobile panel both
   rendered the links. The panel now carries `inert` when it is closed, so its links leave the tree
   and the tab order, and the desktop nav is `hidden` below the `lg` breakpoint.

## The size

| | Before this plan | After | Delta |
| --- | --- | --- | --- |
| JavaScript | 422.24 kB, gzip 137.42 kB | 426.97 kB, gzip 138.82 kB | +4.73 kB, gzip **+1.40 kB** |
| CSS | 53.55 kB, gzip 8.73 kB | 72.37 kB, gzip 12.63 kB | +18.82 kB, gzip **+3.90 kB** |
| Font files | none | 492 kB of woff2 in the build | the browser fetches the latin subsets, about 150 kB |

What the growth is:

- **JavaScript, +1.40 kB gzip**: the two shared components, the shared header, the hero, and
  `lucide-react` (1.66.0 — the exact version the vendored design system already resolves, so the
  bundle carries one copy).
- **CSS, +3.90 kB gzip**: almost all of it is the `@font-face` rules. The two variable font
  packages publish a rule per subset (six for Lora, ten for Cascadia Code), and the rules are all
  in the stylesheet even though the browser only downloads the latin file. Phase 2 can cut this by
  writing the latin `@font-face` itself and pointing at the package's file; I left the standard
  import for now, because it is the documented way and the file layout is the package's business.
- **The font files are not in the CSS budget.** They are separate assets, fetched on demand by
  `unicode-range`.

## The checks

```text
$ pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"
$ tsc --noEmit
 Test Files  2 passed (2)
      Tests  23 passed (23)
dist/assets/index-CsatIRFB.css                                      72.37 kB │ gzip:  12.63 kB
dist/assets/index-51Cs2Ph7.js                                      426.97 kB │ gzip: 138.82 kB
✓ built in 293ms

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
✔ Build complete in 83ms
All matched files use Prettier code style!

$ npx jds skin check src/styles/skins/jss-devtools.css --separation
ok    src/styles/skins/jss-devtools.css (jss-devtools)
        light: closest fills secondary and success, 0.103
        dark: closest fills error and warning, 0.093
```

The skin is untouched: the same file, the same 22 declarations, the same contract. The fonts and
the icons are the only new dependencies, both pinned to an exact version.

## What the skills decided

| Skill | What it decided |
| --- | --- |
| `/ak-frontend-design` | The brief and the dials (variance 8, motion 6, density 4), the two-tone headline, the product visual as the signature, the section rhythm, the polish audit at the end of Phase 2 |
| `/ak-ui-ux-pro-max` | The landing patterns that the reference study confirmed, the type scale, the accessibility rules the prototype is held to |
| `/ak-design-system` | The three-layer rule: the skin replaces the primitive layer only, and the new shared components use the semantic tokens, never a palette step in JSX |
| `/ak-motion-design` | The motion identity: one easing curve for 80% of it, a three-step duration palette, one entrance pattern, and the reduced-motion version of each |
| `/ak-react-best-practices` | The shared components and the shared constants live outside the page, so the Docs chunk and the Home chunk do not duplicate them |
| `chrome-devtools-mcp:a11y-debugging` | The a11y pass: the landmarks, the heading order, the focus ring, the tap targets, the contrast |

### Advice refused, and why

- **A web font from a CDN.** The plan allows fonts, and the site loads the design system's own
  three families, self-hosted. No Google Fonts, no runtime fetch from a third party.
- **A stock icon set that the site would have to install.** `lucide-react` is the exact version the
  vendored design system already resolves, so the bundle carries one copy, and the site's only icon
  so far is the menu button.
- **`/ak-ui-ux-pro-max`'s dark-only theme.** The theme belongs to the design system, which ships
  both. The references show what each theme should feel like, not that one of them should be deleted.
- **A copy button.** The design system's `core` branch ships no `ButtonCopy`, and the site does not
  reimplement design system components. The header of both new components leaves the room.


## Iteration 2

`planner-2` reviewed the checkpoint: the prototype was better than 0016 but still flatter than the
references in `refs/`. Nine changes, all done.

| # | The finding | What changed |
| --- | --- | --- |
| 1 | The hero had no call to action | A primary "Get started" and a secondary "View on GitHub", both pills, and a small "Install" pill in the header next to the theme toggle. They are links: the package's `Button` is a `<button>` with no `asChild`, and a navigation call to action has to be a real link, so they carry the package's own semantic tokens (`bg-primary`, `text-primary-foreground`, `rounded-full`, `focus-ring`) instead |
| 2 | The page was a flat one-colour field | Three layers of brand art, all in CSS Modules and all behind the content: a dot pattern that fades out downwards, a radial glow of the brand's primary, and the design system's own brand mark blown up as a watermark in the corner, the way herdr.dev's sheep sits in its hero. Both themes carry it, and the glow and the pattern use a raw palette step with the reason written in the file |
| 3 | The serif headline read as a magazine | The headline is the sans now: Be Vietnam Pro at 600, tracking −0.03 em, at a fluid `clamp(2.25rem, 5.6vw, 3.75rem)`. The two tones stay. Lora is no longer loaded: nothing used it, and an unused family is 37 kB |
| 4 | The product visual was too small | The terminal is full width now, with the three real transcripts as a real tablist — `role="tablist"`, arrow keys, Home and End — and the title bar's three dots carry the error, warning and success tokens. The frame has a deep shadow |
| 5 | No "works with" band | A "Works inside" row: Claude Code hooks, bun, pnpm, yarn, npm. The hooks are the harness's, from the CLI's own `doctor` output and its `--pm` values, and nothing else is claimed |
| 6 | 360 px was broken | The headline is fluid (36 px, three lines), the eyebrow is one line, the install block has the `$` prompt and the command wraps instead of being cut, and the code block's header has room for the copy button the design system does not ship yet. Nothing is clipped at 360 px: the page has no horizontal scroll and no element is wider than the viewport |
| 7 | The fonts' CSS cost | Checked: the static family ships a latin-only CSS, and the site imports it. The variable family does not — it publishes `index.css` and `wght.css`, and both carry a rule per subset. That is the 3.9 kB of unused `@font-face` rules, and it stays until the site is willing to reach into the package's file layout |
| 8 | The syntax colouring | Approved: a small hand-written tokenizer for `sh`, `json` and `ts`. The CodeBlock's shape already takes the code and the highlighted lines, so the colouring can be added without changing the component |
| 9 | The headline copy | Kept: "Set up the toolchain. Teach your agent." |

### What changed in the size

| | Before this iteration | After | Delta |
| --- | --- | --- | --- |
| JavaScript | 426.97 kB, gzip 138.82 kB | 429.90 kB, gzip 139.68 kB | +2.93 kB, gzip **+0.86 kB** |
| CSS | 72.37 kB, gzip 12.63 kB | 75.91 kB, gzip 11.87 kB | +3.54 kB, gzip **−0.76 kB** |
| Font files | 492 kB | 320 kB | **−172 kB**, the unused serif family is gone |

The CSS got bigger and smaller at once: the tablist, the brand art and the buttons added rules,
and dropping Lora removed the `@font-face` rules for its six subsets.

### The checks, again

```text
$ pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
 Test Files  2 passed (2)
      Tests  23 passed (23)
dist/assets/index-Bzp-0yv7.css                                      75.91 kB │ gzip:  11.87 kB
dist/assets/index-DuwvH-c-.js                                      429.90 kB │ gzip: 139.68 kB

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
All matched files use Prettier code style!
```


## Phase 2

The router, the full home page, the docs area, the server routes, the tests, the audit and the docs
are built. Nothing is committed and nothing is pushed.

### The four fixes from the review

| # | The finding | What changed |
| --- | --- | --- |
| 1 | The watermark mark was cut into a strange shape in the corner | The mark is anchored at the top right corner (`origin-top-right`), so the scale grows it down and left and the hero's overflow never cuts it. It is a wide-viewport flourish only: on a phone it sat behind the headline, so it is hidden below `lg` |
| 2 | The background art ended on a hard vertical line | The pattern's mask fades at the right edge as well as downwards, so the art never ends on a line in either theme. The glow is full bleed |
| 3 | The terminal's `✔` was still white | The line splitter stopped at the box drawing and never reached the glyph, so no glyph was ever recognised. It now skips the spaces after the box, and the roles are: `✔` success, `✖` error, `⚠` warning, `◇ │ └` muted |
| 4 | The "Works inside" band was not in the fold | The hero is more compact — the value line is one line on a wide viewport, the gaps are tighter, the top padding is smaller — and the band now starts at 856 px, inside a 900 px viewport. It sits directly under the terminal, where it was |

### The three answers

(a) **The call to actions are links.** Agreed, and it stays. The package's `Button` is a `<button>`
with no `asChild`, and a navigation call to action has to be a real link. The links carry the
package's semantic tokens and its focus ring, so they look like its button. The follow-up for the
design system is a `Button` that can render an anchor, or a `ButtonLink`. It is written down in
[0038](../../decisions/0038-the-site-has-a-router-and-a-docs-area.md).

(b) **The 3.9 kB of unused `@font-face` rules stays.** The reason is in the decision record: the
variable family publishes no latin-only stylesheet, and writing the rule by hand would mean
copying the package's file layout, which drifts on the next bump.

(c) **The headline stays:** "Set up the toolchain. Teach your agent."

### What is built

| Piece | Where | What it is |
| --- | --- | --- |
| The router | `site/src/components/AppRouter/` | The route tree: the layout, the home page, the docs area, the not-found view. The tree is a factory, because the router consumes a route object as it loads it |
| The docs area | `site/src/pages/Docs/` | The layout, the sidebar, the page template, the pager, and the six pages |
| The home page | `site/src/pages/Home/` | Eight bands: the hero, the statement, the three commands, the harness, the install, the reference, the requirements, the closing call to action |
| The shared facts | `site/src/constants/` | The CLI's facts, the commands, the harness, the options and the exit codes — one home, read by both routes |
| The server | `docker/nginx.conf` | `/docs` and every path under it answer with the shell, so a docs page survives a reload. `/robots.txt` is a real file. Every other path still answers 404 |
| The smoke test | `ci/smoke-site-image.sh` | `/docs`, `/docs/` and `/docs/install` answer 200, `/docsomething` answers 404, and the installer still works from the image |

The docs area is lazy route by route. The router matches the paths before it loads anything, so a
lazy route cannot bring its own children: the tree has to be static. The layout, the sidebar and
each page are therefore their own chunk, and the home route ships none of them. `/docs` redirects
to `/docs/getting-started`, so every page has exactly one address and the sidebar can mark the
current one.

### The defects the screenshots found

1. **The command cards showed each other's output.** The transcripts were bound to the cards by
   position, so the `init` card showed the `doctor` transcript. They are bound by name now.
2. **Both bento grids had a hole.** Three tiles with a two-column tile left the third tile alone on
   the second row. The bento is two columns with the wide tile on the first row, which also gives
   the terminal the width its transcript needs.
3. **The watermark was cut in half.** The scale grew the mark upwards, out of the hero, and the
   hero's `overflow-hidden` cut it. It is anchored at its corner now.
4. **The docs tables broke a command across three lines.** A command in a table cell does not wrap
   any more.
5. **The brand link announced a different thing than the one on screen.** The link carried an
   `aria-label` that did not contain the visible wordmark, which is Lighthouse's
   `label-content-name-mismatch`. The link is named by the mark's own wordmark now.

### The size

| Route | JavaScript | CSS |
| --- | --- | --- |
| The home route, before this plan | 429.90 kB, gzip 139.68 kB | 75.91 kB, gzip 11.87 kB |
| The home route, now | 536.57 kB, gzip **173.25 kB** | 100.55 kB, gzip **13.58 kB** |
| The docs chunks, now | 24.81 kB across nine chunks, gzip **8.81 kB** | 14.53 kB, gzip **3.10 kB** |

The growth is the router and the home page, and the attribution says so. Decoding the build's
source map and grouping the bytes by their source:

| Source | In the home chunk |
| --- | --- |
| `react-dom` | 202.63 kB |
| `@base-ui/react` (the design system's own runtime) | 97.52 kB |
| `react-router` | **91.64 kB** |
| `tailwind-variants` (the design system's `cn`) | 40.22 kB |
| `@jjuidev/design-system` | 11.59 kB |
| `lucide-react` | 4.89 kB |
| The site's own code | about 25 kB |

So the router is the whole of the JavaScript growth: the eight bands and the six docs pages are
about 25 kB of raw code, and the router is 91.64 kB.

Measured on its own, with react excluded: the data router costs 34.87 kB gzip, the plain router
14.66 kB. The plain router has no route-level lazy discovery, so the docs would have to be split
with `React.lazy` instead, and the plain router's own chunk would carry the import thunks. The
data router is what the design system's own `main` branch uses, and it is the documented way to
keep a route out of the landing page's bundle.

The CSS grew by 1.71 kB gzip: the bands, the sidebar and the docs' prose rules.

The font files are not in this budget: they are separate assets, fetched by `unicode-range`. The
build carries 320 kB of woff2, and the browser downloads the latin subsets, about 150 kB.

### The checks

```text
$ pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"
$ tsc --noEmit
 Test Files  7 passed (7)
      Tests  35 passed (35)
dist/assets/DocPage-5cKgzoUM.css                                     9.75 kB │ gzip:   1.76 kB
dist/assets/DocPage-CUPSH1lp.js                                      2.38 kB │ gzip:   0.85 kB
dist/assets/Docs-CRLjkrE9.js                                         0.79 kB │ gzip:   0.38 kB
dist/assets/Docs-CsJm6lkS.css                                        4.78 kB │ gzip:   1.34 kB
dist/assets/Docs.constant-C9kYsBnw.js                                0.85 kB │ gzip:   0.40 kB
dist/assets/Doctor-oFqYub-s.js                                       2.43 kB │ gzip:   0.93 kB
dist/assets/GettingStarted-CQ3mqXJm.js                               2.93 kB │ gzip:   1.17 kB
dist/assets/Harness-Dv2OVC4u.js                                      4.54 kB │ gzip:   1.48 kB
dist/assets/index-4tJ3Tmc4.css                                     100.55 kB │ gzip:  13.58 kB
dist/assets/index-CGBBvLDb.js                                      536.57 kB │ gzip: 173.25 kB
dist/assets/Init-CnG6U6K2.js                                         4.29 kB │ gzip:   1.38 kB
dist/assets/Install-B8hXyvh-.js                                      3.80 kB │ gzip:   1.32 kB
dist/assets/Reference-BJrAF6Fj.js                                    2.80 kB │ gzip:   0.90 kB
✓ built in 401ms

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
✔ Build complete in 30ms
All matched files use Prettier code style!

$ npx jds skin check src/styles/skins/jss-devtools.css --separation
ok    src/styles/skins/jss-devtools.css (jss-devtools)
        light: closest fills secondary and success, 0.103
        dark: closest fills error and warning, 0.093
```

The skin is untouched: the same file, the same 22 declarations, the same contract.

### The image

Docker was installed but its daemon was not running, so colima was started for the run and stopped
after it.

```text
$ docker build -f docker/Dockerfile -t jss-devtools-site:local .
$ sh ci/smoke-site-image.sh jss-devtools-site:local
smoke-site-image: every route answers as specified, and the installer works
```

The smoke test covers `/docs`, `/docs/`, `/docs/install`, `/robots.txt`, the two release files, the
installer itself, and the 404s: `/vi/home`, `/docsomething`, `/nope`.

### The audit

Lighthouse, desktop, against the dev server:

| Route | Accessibility | Best practices | SEO |
| --- | --- | --- | --- |
| `/` | **100** | 100 | 100 |
| `/docs/reference` | **100** | 100 | 100 |

The first run failed two audits, and both are fixed: the page had no meta description, and
`/robots.txt` answered with the 404 page instead of a file. The a11y pass found one more: the
brand link's `aria-label` did not contain the visible wordmark.

The screenshots are in `plans/reports/`: `site-home-light-1280.png`, `site-home-dark-1280.png`,
`site-home-light-360.png`, `site-home-dark-360.png`, `site-band-commands-light-1280.png`,
`site-docs-getting-started-light-1280.png` and `site-docs-reference-light-1280.png`.

### The docs

- [0038](../../decisions/0038-the-site-has-a-router-and-a-docs-area.md) — the router, the
  docs area, the lazy route by route, the shared constants, and the two things the implementation
  decided (the links instead of the package's `Button`, and the `@font-face` rules that stay).
- `docs/site/conventions/folder-structure-conventions.md` — the tree, the router, the constants
  that moved.
- `docs/codebase-summary.md` — the site's rows.
- `docs/deployment-guide.md` — the docs routes and the robots file.

`tests/install.test.ts` reads the Node floor from the place it now lives, `site/src/constants/cli.constant.ts`.
The assertion is the same: the site's floor is the manifest's floor.

## Phase 2 review fixes

`planner-2` reviewed the Phase 2 report and did not approve it. Seven fixes, all done.

### The seven

| # | The finding | What changed |
| --- | --- | --- |
| 1 | The terminal's glyph lost the spaces around it | The splitter kept the spaces before the glyph in the text and dropped the space after it, so `│  ✔ Node.js` printed as `│✔ Node.js`. The spaces are their own part now, and a test proves that every rendered line's `textContent` is the source line, for all three transcripts |
| 2 | The bands below the fold were still 0016's white cards | Three bands are brand-tinted now — the gap, the harness and the reference — with the hero's own dot pattern, and the rhythm alternates: surface, tint, surface, tint, surface, tint, surface, the primary closing band. The gap's statement is a display size. The bento grids have no holes: the harness band is the hooks and the settings file side by side, the reference band puts the options in two columns, the install band is a wide tile over two |
| 3 | The syntax colouring was not built | It is built: a hand-written tokenizer for `sh`, `json` and `ts`, in the CodeBlock, with the colours taken from the design system's semantic layer. Every role clears 4.5:1 against the block in both themes, measured in the browser. It costs 3 kB of raw code and 1.28 kB gzip. The docs now show the two files the CLI writes: the `.claude/settings.json` the harness installs and the `package.json` scripts a new project carries, both from a real run |
| 4 | A raw backtick reached the page | The command's own description carried `` `harness doctor` `` in backticks. The constants stay strings, and a small component turns the backticks into `code` elements. It was the only raw backtick in the site |
| 5 | The repository address was a redirect | `jearax/jss-devtools2` is a redirect after the rename; the canonical is `jearax/jss-devtools`. There is one constant now, and the nav, the reference links and the footer all read it |
| 6 | The screenshots did not cover the acceptance | They do now: the home page in both themes at 1280 and 360 (full page), the docs at 1280 in both themes, and the docs at 360 with the mobile menu open |
| 7 | The router's trade-off was not written down | It is in [0038](../../decisions/0038-the-site-has-a-router-and-a-docs-area.md): the data router costs about 20 kB gzip more than the plain router, and the trade is accepted |

### The icons and the motion

The cards carry a lucide icon each — the folder, the stethoscope and the robot for the three
commands, the download, the folder and the shield for the install tiles. The icon is `aria-hidden`
and the name beside it carries the meaning.

The motion is a scroll-driven reveal, CSS only: `animation-timeline: view()` with a range that ends
a quarter of the way through the element's cover, so a tall block is already opaque while it is
still entering. It is inside `@supports (animation-timeline: view())` and inside
`prefers-reduced-motion: no-preference`, so a browser without the timeline, and a reader who asked
for less motion, get the content as it is.

### The size

| | JavaScript | CSS |
| --- | --- | --- |
| The home route, before the fixes | 536.57 kB, gzip 173.25 kB | 100.55 kB, gzip 13.58 kB |
| The home route, now | 544.88 kB, gzip **175.89 kB** | 108.26 kB, gzip **14.27 kB** |
| The docs chunks, now | 25.93 kB across nine chunks, gzip **9.13 kB** | 14.53 kB, gzip **3.10 kB** |

The growth is +2.64 kB gzip of JavaScript and +0.69 kB gzip of CSS. The tokenizer is 1.28 kB gzip
of that; the rest is the icons, the bands' own rules, the two new snippets and the reveal.

### The checks

```text
$ pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"
$ tsc --noEmit
 Test Files  10 passed (10)
      Tests  53 passed (53)
dist/assets/index-B03db6Gc.js                                      544.88 kB │ gzip: 175.89 kB
dist/assets/index-CHUtZnGD.css                                     108.26 kB │ gzip:  14.27 kB
✓ built in 327ms

$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
✔ Build complete in 28ms
All matched files use Prettier code style!

$ docker build -f docker/Dockerfile -t jss-devtools-site:local .
$ sh ci/smoke-site-image.sh jss-devtools-site:local
smoke-site-image: every route answers as specified, and the installer works
```

The site gained 18 tests: the tokenizer, the code block, the terminal's lines and the contrast of
every token role in both themes.

### The audit

| Route | Accessibility | Best practices | SEO |
| --- | --- | --- | --- |
| `/` | **100** | 100 | 100 |
| `/docs/harness` | **100** | 100 | 100 |

The only failing audit is `llms-txt`, which stays out of scope.

### The screenshots

`site-home-light-1280.png`, `site-home-dark-1280.png`, `site-home-light-360.png`,
`site-home-dark-360.png` (full page), `site-band-commands-light-1280.png`,
`site-band-harness-light-1280.png`, `site-docs-getting-started-light-1280.png`,
`site-docs-reference-light-1280.png`, `site-docs-reference-dark-1280.png` and
`site-docs-reference-dark-360-menu.png`.

## Image name

The user chose the new name: "Dùng tên mới (Recommended)".

`planner-2` checked the evidence before asking. The CI run of `a77ab7e` pushed
`ghcr.io/jearax/jss-devtools:latest`; an anonymous pull of both names answers 200, with different
digests (`jss-devtools` is `1adbff49…`, `jss-devtools2` is `c84f0389…`); and the live page serves no
React bundle, so production is still running the old image. The two names are two different images,
and the site was being deployed from the older one.

What changed:

- `docker/docker-compose.yml` pulls `ghcr.io/jearax/jss-devtools:latest`.
- `docs/deployment-guide.md` names the canonical package, the canonical Git URL and the canonical
  `sha-` tag, and adds a line for the one thing outside this repository: the Dokploy service's Git
  URL. GitHub redirects the old name, so a service still pointing at it keeps working, but the
  canonical name is the one that survives the next rename.
- [0039](../../decisions/0039-the-repository-and-the-image-are-jss-devtools.md) records the
  rename, with the user's words and the evidence. [0010](../../decisions/0010-github-remote.md)
  and [0013](../../decisions/0013-repository-visibility.md) keep what was decided then and carry
  a note that says what superseded them; the visibility has not changed, only the name.

The CI workflow is not touched: it already tags with `${{ github.repository }}`, which is the
canonical name.

```text
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
✔ Build complete in 28ms
All matched files use Prettier code style!
```

## Unresolved questions

1. **The router's weight.** The data router costs 91.64 kB raw, about 25 kB gzip, of the home
   route's bundle, and the plain router would cost 14.66 kB gzip against the data router's 34.87
   kB. The trade is the route-level lazy discovery the docs area needs. `planner-2` agreed with
   the leaning and asked for the number to be written down, which it now is in [0038](../../decisions/0038-the-site-has-a-router-and-a-docs-area.md).
   If the landing page's weight matters more than that, the switch is the router file and the route
   object, not the pages.
2. **`llms.txt`.** Lighthouse's agentic browsing audit wants one, and the site has none. It is a new
   capability rather than a fix, so it is not in this plan. My leaning: a short file listing the
   home page and the six docs pages, if the user wants the site's content to reach the models that
   read it.
3. **The call to actions are links, not the package's `Button`.** The package's `Button` is a
   `<button>` with no `asChild`, and a navigation call to action has to be a real link. The links
   carry the package's semantic tokens and the package's focus ring, so they look like its button
   and behave like a link. If the design system grows an `asChild` or an anchor variant, they
   become the package's `Button` and the site stops carrying that one piece of its own.
4. **The Dokploy service's Git URL.** It is outside this repository: the service reads Git, and it
   still points at the old name. GitHub redirects it, so the service keeps working, and the canonical
   name is the one that survives the next rename. The user checks that field.
