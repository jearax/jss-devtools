# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.
- Both `.harness/bin/*.mjs` and `.harness/core/base/` are written by `harness update` from the CLI's own bundle (source: `src/modules/harness/`); edit neither by hand. `core/base` is the three-way-merge base, not the bundle's source. (src: src/modules/harness/constants/hook-bundle.constant.ts)
- Existing-mode `init` rejects `--pm` by design: an existing project uses the manager `packageManager` declares. (src: .harness/decisions/0030-init-node-preset.md)
- `pnpm test` builds the bundle first through a vitest globalSetup, so a green test run also proves the build. (src: .harness/docs/system-architecture.md)
- The architecture rules are enforced by tests in `tests/support/architecture-rules.ts`, each with a negative fixture under `tests/fixtures/`; add rule and fixture together. (src: .harness/docs/code-standards.md)
- Long agent Write/Edit calls can garble or duplicate JSX/CSS blocks while reporting success; verify brace balance and the expected tail, and prefer small heredoc appends.
- A decorative layer behind page content needs `isolate` on the page root before `-z-1` on the layer, else the child escapes its stacking context and paints behind the page background.
- When pnpm hits an undecided build script it writes a literal placeholder `esbuild: set this to true or false` into `pnpm-workspace.yaml`; delete the placeholder line, never commit it. (src: .harness/plans/reports/cooker-261109-1635-dogfood-harness-migration.md)
- The doctor secret scanner flags any credential word followed by a colon or equals sign, even in prose or in reports quoting the scanner; reword instead of chasing a leak. (src: src/modules/harness/services/redaction.service.ts)
- The site's visual bar is product landing pages (harness.io, agentkit.best, claude.com/product/claude-code, herdr.dev); the user rejected a restrained, document-style landing as too plain. Reject "restraint" directions for site/ marketing pages, but reach boldness inside the design system's tokens (decision 0042).
- Site screenshots: clear a stale `jds-skin` cookie (it overrides the site skin), scroll to top and let the hero's typing finish; a full-page capture draws the sticky header mid-page. Check overflow by `scrollWidth > clientWidth`; `resize_page` can stick, use `emulate viewport` and verify `clientWidth`.
- Chrome MCP synthetic events do not set `:active`, so press-state screenshots need a Playwright script holding a real `mousedown` before the capture.
- Site CSS and responsive rules come from the design system's own docs (component-conventions S1–S12, styling-conventions R1–R5: desktop-first `max-*` only); the site's copy under `.harness/docs/site/conventions/` once missed them, so check the source. (src: .harness/plans/261110-0100-site-landing-redesign/plan.md)
- The design system's `text-display-*` role is the serif family at normal weight; a sans, weighted headline is `text-heading-*`. Never repoint `--font-serif` to get a sans display line. (src: design-system packages/styles/src/utilities/typography.css)
- A Python `str.replace` without an assert fails silently and the fix is lost; wrap every scripted edit in `assert old in s` and verify the effect on the rendered page, not just the file.
- In a CSS Module, a media-prefixed `max-lg:hidden` on one class loses to a plain `display:flex` utility of another class when source order favours the latter; media queries add no specificity, so use the `!` important suffix or compound the selector.
- Vitest browser locators have no `count()`; guard a may-not-exist element with try/catch around `click()`.
- Review site screenshots of every band, scrolling one viewport at a time; a first-viewport shot hides the layout defects below it.
- Playwright `boundingBox()` is viewport-relative; to scroll to an element use `getBoundingClientRect().top + window.scrollY` from `evaluate`, not the box's own y.
- A scroll container (`overflow-x-auto`) clips its children at its padding box, so a child with `-mb-px` cannot cover the container's own `border-b`; draw the rule as a `before:` pseudo-element inside it instead. (src: site/src/components/Terminal/styles.module.css)
- The site's favicon and touch icons come from `@jjuidev/react/brand/*` (in the package's `dist/brand/`), copied at build by `vite-plugin-static-copy` as the design system's own site does; never commit copies into `site/public/`. (src: site/vite.config.ts)
- `@tanstack/react-hotkeys` picks Mac vs other from `navigator.platform`, not the User-Agent; to check the Windows label (`Ctrl+K`) in Playwright, override `Navigator.prototype.platform` in an init script. (src: site/src/constants/search.constant.ts)
- A `styles.x` missing from its CSS Module is `undefined` with no lint or type error; a dead wrapper built that way swallowed a parent's `gap`. When spacing looks wrong, check each `styles.*` exists. (src: site/src/pages/Home/components/CommandsBand/CommandsBand.tsx)
- Vitest scopes CSS Module classes differently from Vite, so `[class*="Component__x"]` selectors that work on the dev server match nothing in site tests; select by role, text or data attribute. (src: site/vitest.config.ts)
- Real, coloured CLI transcripts for the site are captured with the `capture-cli-transcript` learned skill (pty, headless terminal replay). (src: .claude/skills/capture-cli-transcript/SKILL.md)
- `doctor` is not a main command (user): the hero terminal shows `init`, `Claude Code` and `harness` only; do not add a `doctor` tab back. The docs page for it stays. (src: site/src/pages/Home/Home.constant.ts)
- A dependency the site tests import for the first time must be added to `optimizeDeps.include` in `site/vitest.config.ts`: otherwise Vite re-optimizes mid-run and a cold run times out in unrelated suites, while a warm rerun passes. (src: site/vitest.config.ts)
