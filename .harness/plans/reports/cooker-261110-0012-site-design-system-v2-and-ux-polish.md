# Report: site design system v2 and UX polish

Plan: `.harness/plans/261109-1655-site-design-system-v2-and-ux-polish/plan.md` — all three phases done.
Executed 2026-11-09 → 2026-11-10 by the cooker session.

## Phase 1 — swap to the stable packages

- Built the design system repo (clean tree, `pnpm build`, turbo cache) and packed
  `@jjuidev/styles` 0.0.1 and `@jjuidev/react` 0.0.1 into `site/vendor/`;
  `jjuidev-design-system-0.1.0.tgz` deleted.
- `pnpm pack` rewrote `@jjuidev/styles` from `workspace:^` to `^0.0.1`, as the plan warned. Pinned it
  back with `overrides` in `site/pnpm-workspace.yaml` →
  `pnpm why @jjuidev/styles` shows one copy (site + react both resolve to the vendored tarball).
- `site/package.json`: `@jjuidev/design-system` removed; `@jjuidev/react`,
  `@jjuidev/styles`, `@mantine/hooks` 9.7.4, `tailwind-variants` 3.3.1, `tailwind-merge` 3.7.0 and
  `colorjs.io` 0.7.1 added at the design system's exact pins.
- Imports rewritten per the plan table: CSS entry `@jjuidev/styles/styles.css`, `cn` from
  `@jjuidev/styles/variants`, `defineSkin`/`Register` from `@jjuidev/themes` — correction: from
  `@jjuidev/styles/theme`; components from `@jjuidev/react`. 39 files changed by a mechanical
  rewrite, then ESLint `import-x/order` autofix.
- **Found during the swap:** the component runtime ships its styles in `@jjuidev/react/styles.css`.
  Without importing it, the package's components (Logo, ThemeToggle, ChoiceMenu) render unstyled —
  the first after-screenshot caught a broken header. The site now imports it between the styles
  package and the site skin. This was not in the plan's import table; recorded in decision 0041.
- The legacy `overlay` utility no longer exists; `SearchPalette`'s backdrop now declares the values
  of the package Dialog's own scrim (`fixed inset-0 z-overlay bg-neutral-950/40 backdrop-blur-xs`),
  per the design system's 0051/0052.
- `--color-error-600`/`success-600` expectations in `jss-devtools.skin.test.tsx` updated to the
  stable package's spring status values (`#b73503` / `#01786e`): the site skin inherits the status
  scales, and the old literals were the legacy package's.
- A test fixture string in `highlight.test.ts` renamed so
  `git grep '@jjuidev/design-system' -- site ':!site/pnpm-lock.yaml'` returns nothing (exit 1).

**Verification:** baseline (before) and after screenshots compared per page, viewport and theme —
8 pairs identical after the swap; the only early difference (broken header) was the missing
`@jjuidev/react/styles.css` import, fixed and re-shot. `skin-check` passes:
`ok src/styles/skins/jss-devtools.css (jss-devtools)`.

## Phase 2 — conventions re-sync

Compared site conventions against the stable `.harness/docs/` (styling, component, hooks, testing,
site-traps) and its decisions 0044–0053. Updated
`.harness/docs/site/conventions/`:

- `styling-conventions.md`: rewritten — new stack (both package CSS entries), `skin-check` command,
  cn/tv from `@jjuidev/styles/variants`, and the rules phase 3 depends on: durations
  (150/200/300), states as tokens (no alpha stand-in, stable 0052), never hover-only reveal,
  touch targets (`pointer-coarse:h-11`, `pointer-coarse:hidden` on keyboard hints), the z-index
  layers, `focus-ring`/`focus-ring-inset`, no `transition: all`, one `@apply` per breakpoint
  (0050), semantic class names (0045), text scale stops at 3xl (0053), the scrim exception.
- `component-conventions.md`: package component list, destructure order (stable 0046), the rule
  that the site's own component wins while the package's replacement still changes the look.
- `testing-conventions.md`: new T8 — a test that writes the `jds-skin`/`jds-theme` cookie clears it,
  the trap the stable site documents.
- `README.md`, `folder-structure-conventions.md`: package names and the vendor line.

Step 3 (enforcement): the design system enforces none of the new styling rules through lint or
stylelint (`apps/site` has no stylelint; they are review-only there), so the site's
`stylelint.config.mjs` and `eslint.config.mjs` are unchanged — rules stay review-only, per the
phase's own instruction.

## Phase 3 — interaction feedback and the defects

Loaded `/ak-frontend-design` and `/ak-ui-ux-pro-max` before designing; used the design system's
`apps/site` interaction-feedback commit `4722350` as the reference
(`transition-colors duration-150 hover:border-strong hover:bg-hover focus-ring
motion-reduce:transition-none`, `bg-selected` for the selected item, `data-visible` reveal).

Interaction contract now holds on every control — computed `transition-duration` is `0.15s` on
skip link, header logo, GitHub link, search trigger, theme toggle, terminal tabs, sidebar links,
pager links, feature cards, CTA and footer links (verified with a computed-style check in the
browser; the skip link was `0s` before, per the scouting).

Defects, each fixed:

1. Hero terminal sized to content (`min-height: 26rem` removed) **and** filled with the installer's
   real output (`INSTALL_TRANSCRIPT` — the two real `say` lines of `scripts/install.sh`).
2. Tabs: distinct labels (`~`, `~/jss-devtools`, `~/projects/my-app`); selected state is
   `bg-selected` + `border-default` (the selected token, no alpha); hover `bg-hover`; press
   `active:bg-active`; `focus-ring` kept; `pointer-coarse:h-11`.
3. Copy button follows the command text (`.command` no longer `flex-1`).
4. Hero subtitle wraps naturally: `VALUE_LINES` is one sentence rendered under
   `max-w-xl text-balance`; the forced per-line blocks and caps removed.
5. Watermark: **removed** (choice stated). The dot pattern and glow carry the hero's texture; the
   blown-up mark competed with the headline.
6. Card hover answers already moved the arrow; added the missing press state
   (`active:translate-y-0 active:bg-active`) and `motion-reduce:hover:translate-y-0`.
7. Footer added (`SiteFooter`: product name, Docs, GitHub, MIT licence) in `Layout`, so home and
   docs both end with it; the closing CTA is a `<section aria-label="Get started">` with one line
   of copy and the button. New `SiteFooter.test.tsx`.
8. Sidebar rhythm: group labels get `lg:pl-3`, the command sublist's extra indent removed — group
   headings and items sit at one depth.
9. Active sidebar item: `bg-selected` + `text-primary`, hover stays the neutral `bg-hover`; the
   alpha (`bg-primary/10`) is gone, per 0052.
10. Inline code is the design system's chip: `bg-hover` surface, no vertical padding
    (`rounded-sm bg-hover px-1.5`), the `CodeChip` recipe.
11. Table rows answer hover (`hover:bg-hover` + `duration-150`); pager already had hover/focus and
    shows Previous; verified.
12. Header: GitHub link and search trigger got `active:bg-active`; logo link got hover/focus
    (`hover:opacity-80`, `focus-ring`). The teal border on scroll is the ScrollProgress bar
    (verified: it is the progress element in the header) — kept.
13. Dark and mobile: checked in the final captures (below); the terminal's pinned glyph colours are
    per-theme; every fix above is token-based, so both themes inherit it.

Press states could not be captured through the Chrome MCP (synthetic events do not set `:active`),
so press captures were taken with Playwright holding a real `mousedown`
(`state-button-press.png`, `state-card-press.png`).

## Checks (real output)

```
pnpm --dir site lint     → eslint + stylelint, clean
pnpm --dir site typecheck→ tsc --noEmit, clean
pnpm --dir site test     → Test Files 23 passed (23) / Tests 99 passed (99)
pnpm --dir site build    → ✓ built in 335ms
skin-check               → ok src/styles/skins/jss-devtools.css (jss-devtools)
node dist/cli.mjs harness doctor → ✔ ... "Harness is healthy"
git grep '@jjuidev/design-system' -- site ':!site/pnpm-lock.yaml' → no match (exit 1)
pnpm why @jjuidev/styles → Found 1 version of @jjuidev/styles
```

## Decisions taken

- Removed the hero watermark rather than integrating it (defect 5 asked for one or the other).
- The install tab replays the installer's two real output lines; the transcript constants carry
  real CLI output only, so nothing was invented.
- Kept the site's own `CopyButton` and the palette shell (phase 1, step 6): both look and behave
  the same as the package's `ButtonCopy`/`Dialog` would, and swapping in this phase would have
  changed the look phase 1 was required to preserve. Revisit if the package's versions converge.
- Updated the skin test's status-scale literals to the stable package's spring values instead of
  pinning them to the legacy ones.

## Screenshots (all taken after the last change, skin `jss-devtools`, cookie-driven themes)

`final/` under the plan's `screenshots/` folder:

- `home-1440-light.png`, `home-1440-dark.png`, `home-390-light.png`, `home-390-dark.png`
- `docs-1440-light.png`, `docs-1440-dark.png`, `docs-390-light.png`, `docs-390-dark.png`
- `state-button-hover.png`, `state-button-press.png`, `state-button-focus.png`
- `state-card-hover.png`, `state-card-press.png`
- `state-sidebar-hover.png`, `state-sidebar-focus.png`
- `state-palette-item.png`

Full path prefix:
`/Users/tandm/Documents/jearax/npm/jss-devtools/.harness/plans/261109-1655-site-design-system-v2-and-ux-polish/screenshots/final/`

Phase 1 baseline/after pairs: `screenshots/phase1-baseline/` and `screenshots/phase1-after/`.

## Not met / limitations

- Nothing from the acceptance list is open. The one deliberate note: the press captures come from
  Playwright real-input holds rather than the interactive MCP session, because synthetic events do
  not set `:active`.
- The dev server ran on port 5310 for the session and was stopped; port 5173 untouched.
- No commit, no push, per the ticket.

## Review round (planner, 2026-11-10) — 6 findings fixed

Planner ran its own checks (all green) and found six issues; each fixed, then the four site checks
rerun and every screenshot re-shot after the last change:

1. Terminal output cut at 390 — transcript lines now wrap like the command line
   (`whitespace-pre-wrap break-words`), the body is `min-w-0 max-w-full overflow-y-auto`.
   Measured: no element under `[class*="Terminal"]`, `footer` or the CTA has
   `scrollWidth > clientWidth` at 390 or 1440 (Playwright, JSON in session).
2. CTA line at x=0 — the closing band goes through the package's `wrapper` utility now.
   Wrapper audit: every band (header, hero, commands, CTA, footer, docs grid, not-found) goes
   through it; `Layout`'s main is full-bleed by design with every band carrying its own width.
3. Footer at 390 — the row stacks under `max-sm` (`flex-col items-start pb-24`), one
   `@apply max-sm:` line per stable 0050; the licence reads at the links' own size and colour
   (`text-body-sm text-muted`), the links keep `focus-ring` + hover.
4. Back-to-top overlap — the footer reserves `pb-24` under `max-sm`; the button now follows the
   design system's own BackToTop: `z-float` layer, `border-strong`, `shadow-lg`,
   `hover:bg-raised-hover`, `invisible` + `data-visible` reveal, `pointer-coarse` sizing.
5. Screenshots re-shot — all page and state captures retaken with Playwright, fresh context
   (clean cookies, so the `jss-devtools` skin applies), `reducedMotion: reduce` (animations settle
   to their final state, the reveal never hides content, no sticky header mid-page), scrolled to
   top before each full-page shot. `state-*` captures re-shot the same way.
6. Repo hygiene — `.harness/plans/**/screenshots/` added to `.gitignore`; stray `v-state-*`
   preview files deleted. Images stay on disk for review.

Extras from the design-system docs read (planner's second message — read in full: design system
`CLAUDE.md`, `.harness/docs/` styling/component/hooks/testing/site-traps/toolchain-traps/
architecture, decisions 0044–0056):

- `z-20`/`z-30` arbitrary z-index replaced with the `z-header`/`z-float` layer tokens everywhere.
- One `@apply` per breakpoint (stable 0050) applied to the rules this round touched
  (footer `.inner`, sidebar `.link` and `[aria-current]`).
- Site conventions updated: the no-decision-numbers-in-copy rule (stable 0048) added to
  `component-conventions.md`; the wrapper rule was already stated; 0045/0046/0050/0052/0053 were
  already written in phase 2.

Final checks after the last code change (real output):

```
pnpm --dir site lint      → clean
pnpm --dir site typecheck → clean
pnpm --dir site test      → Test Files 23 passed (23) / Tests 99 passed (99)
pnpm --dir site build     → ✓ built in 365ms
overflow at 390 and 1440  → [] in terminal, footer and CTA
```

## Review round 2 (planner, 2026-11-10) — 3 alignment nits fixed

1. Footer left edge — the links keep their 4px padding for the 44px hit area and pull the text
   back with `-ml-1`, so `jss-devtools`, `Docs`, `GitHub` and `MIT licence` share one left edge.
2. Closing band — the copy line is `text-center`, so copy and button share one axis.
3. Terminal tabs at 390 — the strip no longer wraps: it is one row that scrolls itself
   (`overflow-x: auto`, scrollbar hidden on purpose, tabs `shrink-0 whitespace-nowrap`,
   `focus-ring` kept). Measured in the browser at 390: one tab row, strip scrollable, footer link
   `marginLeft: -4px / paddingLeft: 4px`, CTA `text-align: center`.

All four site checks rerun green after the change (23 files / 99 tests, build ok); all eight page
screenshots re-shot after it. State captures unaffected — none of the three fixes lands inside
their crops.
