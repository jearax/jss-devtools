# Cooker-2 report — the rich landing page

Plan: [261104-0016-site-rich-landing-page](../261104-0016-site-rich-landing-page/plan.md).
Direction: [design-direction.md](../261104-0016-site-rich-landing-page/design-direction.md),
approved by `planner-2`.

The page is built, checked and audited. Nothing was committed and nothing was pushed; the dev
server on 5173 was never restarted.

## What the page is

One English page, in the site's own palette, stating the product's real surface:

| Section | What it shows |
| --- | --- |
| Hero | The name, the value line, the install command, the Node floor |
| Install | The install command, what the installer checks and writes |
| Three commands | `init`, `doctor`, `harness`: what each does, the command, its real output |
| In the terminal | A real `jss-devtools doctor` transcript, labelled "Example output" |
| The harness | Why it exists, the hooks it installs, what the agent is told, the skills |
| Reference | The `init` options, the exit codes, the repository's own docs |
| Requirements | The Node floor, `curl` or `wget`, `sha256sum` or `shasum`, `~/.local/bin` on PATH |
| Footer | The source repository, the MIT license |

## The six conditions

### 1. The palette: teal 195, graphite 250, 22 declarations

The skin file is `site/src/styles/skins/jss-devtools.css`. It declares scale values only, under
`:root[data-skin='jss-devtools']`, and it replaces two scales: `primary`, to signal teal, and
`neutral`, to terminal graphite. `secondary` and the four status scales are inherited, because
they carry meaning rather than brand — 22 declarations, not 77.

The values were not picked by hand. The package's own scale values were converted to OKLCH, rotated
to the target hue and converted back **under a fixed WCAG relative luminance**. Holding the
luminance holds every contrast ratio in the package's contract exactly, so the rotation cannot
break the contract; it only changes the hue.

The first attempt held OKLab's `L` instead, and it broke the contract:
`ring-focus on bg-active is 2.86:1, needs 3:1`. OKLab's lightness is not the WCAG luminance, so
equal `L` does not mean equal contrast. The shipped method solves for the luminance instead.

The package's own checker, on the file at its final path:

```text
$ cd site && npx jds skin check src/styles/skins/jss-devtools.css --separation
ok    src/styles/skins/jss-devtools.css (jss-devtools)
        light: closest fills secondary and success, 0.103
        dark: closest fills error and warning, 0.093
```

The two separation figures are the platform's own margins, unchanged. The logo follows the skin,
because the package draws the mark in `primary-700` / `primary-300` / `primary-500` with the apex
dot in `secondary-500`; the header mark is teal in the screenshot.

### 2. The sections: eight, and one constant per fact

The eight sections are in the plan's order. The install command appears in the hero and in the
install section, and both read `INSTALL_COMMAND`. The Node floor appears in three places — the
hero badge ("Requires Node >= 24.11.0"), the install section ("Checks Node >= 24.11.0 before it
downloads anything") and the requirements list — and all three read `NODE_FLOOR`.

`NODE_FLOOR` stays in `site/src/pages/Home/Home.constant.ts`, because `tests/install.test.ts`
reads it from there:

```text
it('shows the same Node floor on the home page', async () => {
    const page = await readFile(resolve(projectRoot, 'site/src/pages/Home/Home.constant.ts'), 'utf8');
    const floor = /^export const NODE_FLOOR = '([^']+)';$/m.exec(page)?.[1];
    expect(floor?.replace(/\s+/g, '')).toBe(manifest.engines.node.replace(/\s+/g, ''));
});
```

That test still passes: `>= 24.11.0` against `engines.node`'s `>=24.11.0`.

The page's content outgrew one constants file, so it is split as the conventions allow:
`Home.constant.ts` keeps the site's own facts, and `constants/` holds `commands.constant.ts`,
`harness.constant.ts` and `reference.constant.ts`.

### 3. The terminal: the doctor transcript, labelled

The terminal frame carries the label "Example output", because the transcript is a real run but
the versions in it are the ones this machine had. The frame is a `<pre>` of real text, so the
output is selectable, searchable and read by a screen reader as a block of code.

The `harness` card does **not** carry the "10 harness error(s)" line from this repository. A
scratch project was created outside the repository, the CLI set it up for real, and the healthy
output was taken from there:

```text
$ cd /tmp/jss-scratch && node …/dist/cli.mjs init demo-app --pm npm --yes
…
◇  Installed with npm (11.9s)
◇  Sorting package.json
◆  Sorted package.json
└  Next steps
   The harness is installed; open Claude Code in the project folder to onboard.

$ cd /tmp/jss-scratch/demo-app && node …/dist/cli.mjs harness doctor
┌   jss-devtools harness doctor
│  ✔ Version         0.0.1
│  ✔ Memory          488/4800 chars, 5 entries
│  ✔ Decisions       0
│  ✔ Learned skills  0
│
└  Harness is healthy
```

The scratch directory was deleted when the work was done.

### 4. The skin as the default: what the package documents, and what it does not

The package's own source was read before anything was written. `src/contexts/Theme/Theme.tsx`
and `src/contexts/Theme/skin.store.ts`, recovered from the package's source map:

```ts
// Theme.tsx
const skin = useSyncExternalStore(subscribeSkin, getSkinSnapshot, () => {
    const stored = initialPreferences?.skin;
    return stored && resolvedSkins.some((option) => option.id === stored) ? stored : DEFAULT_SKIN_ID;
});
```

```ts
// skin.store.ts
const readStoredSkin = (): SkinSnapshot => {
    const stored = parseSkinValue(readCookie(SKIN_COOKIE));
    return stored !== null && knownSkins.has(stored) ? stored : DEFAULT_SKIN_ID;
};
```

`initialPreferences` is the **third** argument of `useSyncExternalStore`: the server snapshot.
The package documents it as "What a server read from the cookies (`parsePreferences`); the first
render, and hydration, use it". The site is a client render with no hydration, so it is never
read. `data-skin` is written from the `jds-skin` cookie and from nothing else.

So there is no documented mechanism for a client-only host to make its own skin the default, and
the fallback in the approval applies. The rule, in one place, is:

- the cookie is written **only when it is absent**, never overwriting a stored choice;
- the cookie is **host-only**: `Path=/`, `SameSite=Lax`, `Secure` over https, and no `Domain`
  attribute;
- the document shell sets the same `data-skin` attribute the provider will resolve, so the first
  paint and the provider agree;
- the provider deletes the attribute for the default skin, exactly as the package does.

The skin id therefore appears twice: in `site/src/styles/skins/jss-devtools.skin.ts` and in the
inline script. A test holds them together:

```ts
it('is named the same in the document shell', async () => {
    const shell = await fetch('/index.html').then((response) => {
        return response.text();
    });
    expect(shell).toContain(`jds-skin=${JSS_DEVTOOLS_SKIN.id}`);
});
```

The mechanism is verified in the browser: after a reload with no cookie, `document.cookie` is
`jds-skin=jss-devtools`, `document.documentElement.dataset.skin` is `jss-devtools`, and
`getComputedStyle(document.documentElement).getPropertyValue('--color-primary-700')` is
`#005b60` — the teal, not the platform's plum.

### 5. The skin file's place: `site/src/styles/skins/jss-devtools.css`

The file is at the approved path and imported from `site/src/styles/styles.css`, after the
package's source entry:

```css
@import 'tailwindcss';
@import '@jjuidev/design-system/tailwind.css';
@import './skins/jss-devtools.css';
```

The `tailwindAutoReference` plugin leaves `src/styles/` alone, so the skin is never given an
`@reference` to the entry that imports it, and the plugin was not touched. The file is unlayered,
so it wins over the package's `@layer theme` whatever the import order.

`docs/site/conventions/folder-structure-conventions.md` now shows the skin folder, the constants
split and the reason the skin lives under `src/styles/`.

### 6. The four refusals, kept

`/ak-ui-ux-pro-max`'s generated design system for this query recommended a Google web font, a
dark-mode-only OLED theme, a sticky navigation CTA and feature icons. All four are refused, and
the reasons are unchanged:

- **Web fonts.** The package carries no fonts and the site loads none; a font import would add a
  third party to a page whose claim is that it is self-contained.
- **Dark only.** The theme belongs to the package, which ships both themes and lets the reader
  choose.
- **Sticky navigation CTA.** The header is the package's header, and a sticky bar would cover the
  terminal.
- **Feature icons.** The site has no icon library and the package's `core` branch exports no icon
  set; icons would mean a new dependency or a hand-drawn SVG set.

## The CLI facts on the page, and where each came from

Every value on the page is a fact the CLI can be held to. The full table is in the direction
document; the sources are the built CLI and the repository.

| Fact | Source |
| --- | --- |
| The three commands and their descriptions | `node dist/cli.mjs --help` |
| The `init` options and their defaults | `node dist/cli.mjs init --help` |
| The `harness` subcommands and `harness update`'s options | `node dist/cli.mjs harness --help`, `harness update --help` |
| "Only node is implemented" | `src/commands/init/services/init.service.ts` — every other framework throws `Framework <name> is not supported yet` |
| The `init` card's command and output | `node dist/cli.mjs init my-app --pm pnpm --dry-run` |
| The `doctor` card's output | `node dist/cli.mjs doctor` |
| The `harness` card's output | `jss-devtools harness doctor` in a project the CLI had just set up |
| The terminal transcript | `node dist/cli.mjs doctor` |
| The exit codes `0` and `1` | `src/core/constants/exit-code.constant.ts` |
| `harness doctor` returns 0 for warnings, 1 for a failed check | `node dist/cli.mjs harness doctor --help` |
| The Node floor `>= 24.11.0` | `engines.node` in the root `package.json` |
| What the installer checks and writes | `scripts/install.sh` |
| The hooks and what the agent is told | `src/modules/harness/constants/hook-settings.constant.ts`, `src/modules/harness/hooks/session-start.hook.ts` |
| The skills | `src/modules/harness/` |

Two facts are deliberately **not** on the page: the current version (`0.0.1`, unreleased) and the
framework presets that are declared but not implemented. A landing page that promised `react`
presets would break at runtime.

## The checks

The site:

```text
$ pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"
$ tsc --noEmit
$ vitest run
 Test Files  2 passed (2)
      Tests  21 passed (21)
$ tsc --noEmit && vite build
✓ 2429 modules transformed.
dist/index.html                   2.20 kB │ gzip:   1.03 kB
dist/assets/index-B68x_ZXD.css   53.55 kB │ gzip:   8.73 kB
dist/assets/index-BQV24bTA.js   422.24 kB │ gzip: 137.42 kB
```

The root:

```text
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
 Test Files  30 passed | 1 skipped (31)
      Tests  480 passed | 7 skipped (487)
ℹ dist/cli.mjs  337.07 kB │ gzip: 88.44 kB
✔ Build complete in 35ms
$ prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

## The size, before and after

| | Before | After | Delta |
| --- | --- | --- | --- |
| JavaScript | 413.43 kB, gzip 134.98 kB | 422.24 kB, gzip 137.42 kB | +8.81 kB, gzip **+2.44 kB** |
| CSS | 42.41 kB, gzip 7.89 kB | 53.55 kB, gzip 8.73 kB | +11.14 kB, gzip **+0.84 kB** |
| `index.html` | 0.94 kB, gzip 0.56 kB | 2.20 kB, gzip 1.03 kB | +1.26 kB, gzip **+0.47 kB** |

The attribution was measured, not guessed. A variant build with the five new sections removed
from the tree and the skin import removed gives the split:

| Build | JavaScript | CSS |
| --- | --- | --- |
| The old sections only, no skin | 413.77 kB, gzip 135.05 kB | 43.31 kB, gzip 7.98 kB |
| The full page | 422.24 kB, gzip 137.42 kB | 53.55 kB, gzip 8.73 kB |

So of the JavaScript growth, **+2.37 kB gzip is the five new sections** (their components and
their copy constants) and **+0.07 kB gzip** is the changed hero, the changed requirements list,
the skin registration and the constants split. Of the CSS growth, **+0.75 kB gzip is the new
sections' styles and the skin file** (the skin is 644 bytes of the built stylesheet) and
**+0.09 kB gzip** is the changed hero and requirements styles plus the `focus-ring` utility. The
`index.html` growth is the pre-paint script's skin rule.

Nothing else grew. The design system's own component styles, the platform's `spring` skin and the
theme layer are in both builds: the package's `tailwind.css` carries the platform skins itself,
so the site ships them without asking for them.

## The audit

`/ak-frontend-design`'s UX polish audit and an accessibility pass with
`chrome-devtools-mcp:a11y-debugging`, on the built page at 1280 px and 360 px, light and dark.

Lighthouse, desktop, navigation mode:

```text
Accessibility: 100
Best Practices: 100
SEO: 82
Agentic Browsing: 67
```

The three failures are not accessibility. `meta-description` and `llms-txt` are search surfaces
that decision 0027 recorded as a non-goal for a client-rendered page, and `robots-txt` fails
because the dev server answers `/robots.txt` with the page. None of them is introduced by this
change.

`render-check.mjs` at 375, 768 and 1440 px found no overflow, no clipping and no contrast
problem. Two findings were fixed and two were left, with the reason:

| Finding | What was done |
| --- | --- |
| The reference links were 19 px tall, below the 44 px tap target | Fixed: each link is `inline-block py-2.5`, so it is 44 px tall. The warning is gone |
| The `jss-devtools` definition list overlapped: the grid's items were the row wrappers, not the `dt` and `dd` | Fixed: the list is a flex column and each row is the two-column grid |
| The three command cards were clipped: the page is a 768 px reading column, so three columns of 240 px cannot hold a command | Fixed: the cards stack, and each pairs its name with its command and output |
| `favicon.ico` answers 404 | Left. It is pre-existing, and the package ships no favicon asset: the mark lives in the package's `Logo` component, so the site would have to redraw the brand mark to fix it, which the plan forbids |
| The `jjui` and `dev` spans of the wordmark touch | Left. Both are inside the package's own `Logo` component, and the gap is the package's design |

Keyboard focus was checked on every interactive element. The page's own links had the browser's
default blue outline, which is off-palette, so they now use the package's own `focus-ring`
utility — a 2px outline in `ring-focus`, shown on `:focus-visible`:

```text
BUTTON  2px solid rgb(0, 137, 137)  offset 2px
A       2px solid rgb(0, 137, 137)  offset 2px   (every link)
```

Other checks: one `<h1>`; the heading order is h1 → h2 → h3 with no level skipped; the landmarks
are `header`, `main` and `footer`; no horizontal page scroll at 360 px, and no element wider than
the viewport; no console message of any kind.

## Review fixes

`planner-2` reviewed Phase 2 and asked for six changes. All six are done.

| # | The finding | The fix |
| --- | --- | --- |
| 1 | The pre-paint script wrote the `jds-skin` cookie with `Domain=jjuidev.com`, so this site's default skin would land in a preference every other host on the domain reads, and a host that does not know the id would read it | The `Domain` attribute is gone. The cookie is host-only: `Path=/`, `SameSite=Lax`, `Secure` over https, still written only when no cookie is there. The comment in `index.html` says why, decision 0037 says it, and a test holds it: `expect(shell).not.toContain('Domain=')` |
| 2 | The `init` card showed a command without `--dry-run` next to an output that says "Dry run: nothing written" | The card's command is `jss-devtools init my-app --pm pnpm --dry-run`, the command the output was captured from |
| 3 | The hook notes were guesses, and the `Stop` note was wrong | Every hook was read in `src/modules/harness/hooks/` and the notes now say what the code does: the memory guard blocks a write that would break the memory's budget, the tool log appends every call with the skills it used, a failure is appended with its secrets redacted, and `Stop` prunes the old sessions, folds the session's skill usage and asks for onboarding, a review or a curation when one is due |
| 4 | The exit codes carried raw backticks, so the page showed them | The command name is a field of its own and is rendered in `<code>`: "The command succeeded. `harness doctor` returns 0 when the harness has warnings only." |
| 5 | The page listed the framework presets that do not work | The chips are gone. The `--framework` row already says that only node works today and that react, rn, next and nest are declared but not implemented |
| 6 | The mono stack rendered `>=` as the `≥` ligature, while the CLI prints `>=` | `font-variant-ligatures: none` on the terminal, the command surfaces and the card outputs, applied as `@apply [font-variant-ligatures:none]` because Tailwind v4 ships no such utility |

The cookie fix was verified in the browser with the Cookie Store API, which reports a host-only
cookie as `domain: null`:

```text
{ name: 'jds-skin', value: 'jss-devtools', domain: null, path: '/', secure: false, sameSite: 'lax' }
```

The ligature fix was verified the same way: `getComputedStyle(transcript).fontVariantLigatures` is
`none`, and the transcript now shows `needs >= 24.11.0` where it showed `needs ≥ 24.11.0`.

## Deviations from the approved direction

One, and it is deliberate.

The direction said the install command scrolls inside its own surface and never wraps. At 360 px
that clipped the page's primary call to action mid-URL — `curl -fsSL https://jss-devtools.jju` —
so the command now wraps below the `md` breakpoint. The page still never scrolls sideways, and
nothing is hidden: the whole command is on screen.

The screenshots are in `plans/reports/`: `site-rich-landing-light-1280.png`,
`site-rich-landing-dark-1280.png`, `site-rich-landing-light-360.png`,
`site-rich-landing-dark-360.png`, and the `render-check-site/` and `lighthouse-site/` folders.

## The files

**New in the site**

- `site/src/styles/skins/jss-devtools.css` — the skin
- `site/src/styles/skins/jss-devtools.skin.ts` — `defineSkin` and the `Register` augmentation
- `site/src/styles/skins/jss-devtools.skin.test.tsx` — the skin is applied, and the id matches the shell
- `site/src/pages/Home/constants/{commands,harness,reference}.constant.ts` — the page's content
- `site/src/pages/Home/components/{Commands,Install,Terminal,Harness,Reference}/` — the new sections

**Changed in the site**

- `site/index.html` — `lang="en"`, the title, and the pre-paint script's skin rule
- `site/src/main.tsx` — the provider receives the site's skin
- `site/src/styles/styles.css` — the skin's import
- `site/src/pages/Home/Home.constant.ts`, `Home.tsx`, `Home.test.tsx` — the English copy, the sections, the tests
- `site/src/pages/Home/components/{Hero,Requirements,SiteFooter}/` — the English copy

**Docs**

- `docs/decisions/0037-the-site-carries-its-own-host-skin.md` — new: the page and the skin
- `docs/decisions/0027-…` and `0036-…` — the content, the language and the host skin
- `docs/site/conventions/{folder-structure,component,styling}-conventions.md` — the skin, the constants split, the focus ring
- `docs/codebase-summary.md`, `docs/project-roadmap.md` — the new folders, and the page that the site now serves

## Unresolved questions and follow-ups

1. **The favicon.** The site answers `/favicon.ico` with a 404. It is pre-existing and out of
   scope for this task, so nothing was done: the package's `ThemeProvider` has a `syncFavicon`
   prop that re-tints an SVG favicon with `--color-primary`, but the package ships no favicon
   asset, and the site would have to redraw the brand mark to make one, which this plan forbids.
   `planner-2` will ask the user whether the design system should ship the mark as an SVG file;
   when it does, the site links it and turns `syncFavicon` on.
2. **`llms.txt` and the meta description.** Lighthouse names both, and the page is now content
   enough to answer them. `planner-2` agrees that decision 0027 still stands: search surfaces
   are a non-goal for a client-rendered page, and they belong to the SEO work that comes later.
   Nothing was added here.
3. **The platform skins.** The package's `tailwind.css` carries the `spring` skin, so a stored
   `jds-skin` of another package skin still resolves to a real palette, and this site shows it
   rather than its own. That is the package's rule, `planner-2` agrees it stays, and this plan
   did not change it. The site's own cookie is host-only, so it cannot leak this site's default
   skin to the other hosts on the domain.
