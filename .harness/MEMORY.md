# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.
- `.harness/bin/*.mjs` and `.harness/core/base/` are written by `harness update` from the CLI bundle; edit neither by hand; `core/base` is the merge base, not the source. (src: src/modules/harness/constants/hook-bundle.constant.ts)
- Existing-mode `init` rejects `--pm` by design: the project uses the manager `packageManager` declares. (src: .harness/decisions/0030-init-node-preset.md)
- `pnpm test` builds the bundle first via vitest globalSetup, so a green run also proves the build. (src: .harness/docs/system-architecture.md)
- Architecture rules are tests in `tests/support/architecture-rules.ts`, each with a negative fixture under `tests/fixtures/`; add rule and fixture together. (src: .harness/docs/code-standards.md)
- Long agent Write/Edit calls can garble code blocks (TS, JSX, CSS) while reporting success; verify brace balance and the tail, prefer small heredoc appends.
- A decorative layer behind page content needs `isolate` on the page root before `-z-1` on the layer, else it escapes the stacking context.
- pnpm undecided build scripts write a literal `esbuild: set this to true or false` placeholder into `pnpm-workspace.yaml`; delete it, never commit it.
- The doctor secret scanner flags any credential word followed by `:` or `=`, even in prose; reword instead of chasing a leak. (src: src/modules/harness/services/redaction.service.ts)
- The site's visual bar is product landing pages (harness.io, agentkit.best, claude.com/product/claude-code, herdr.dev); reject "restraint" directions, reach boldness inside design-system tokens (decision 0042).
- Site screenshot procedures (skin cookie, viewport checks, `:active`, per-band review, scroll positions). See .harness/docs/site-screenshots.md
- Site CSS and responsive rules come from the design system's conventions (component S1–S12, styling R1–R5, desktop-first `max-*` only); check the source, not the site's copy. (src: .harness/plans/261110-0100-site-landing-redesign/plan.md)
- `text-display-*` is the serif family at normal weight; a sans weighted headline is `text-heading-*`; never repoint `--font-serif`. (src: design-system packages/styles/src/utilities/typography.css)
- A Python `str.replace` without an assert fails silently; wrap scripted edits in `assert old in s` and verify the rendered page, not just the file.
- In a CSS Module, media-prefixed `max-lg:hidden` loses to a plain `display:flex` utility when source order favours it; media queries add no specificity — use `!` or compound the selector.
- Vitest browser locators have no `count()`; guard a may-not-exist element with try/catch around `click()`.
- A scroll container clips children at its padding box, so `-mb-px` cannot cover the container's own `border-b`; draw the rule as a `before:` pseudo-element inside it. (src: site/src/components/Terminal/styles.module.css)
- Site favicons come from `@jjuidev/react/brand/*` via `vite-plugin-static-copy` at build; never commit copies into `site/public/`. (src: site/vite.config.ts)
- `@tanstack/react-hotkeys` reads `navigator.platform`; to test the Windows label in Playwright, override `Navigator.prototype.platform` in an init script. (src: site/src/constants/search.constant.ts)
- A `styles.x` missing from its CSS Module is `undefined` with no lint or type error; when spacing looks wrong, check each `styles.*` exists. (src: site/src/pages/Home/components/CommandsBand/CommandsBand.tsx)
- Vitest scopes CSS Module classes differently from Vite; `[class*="Component__x"]` matches nothing in site tests — select by role, text or data attribute. (src: site/vitest.config.ts)
- `doctor` is not a main command (user): the hero terminal shows `init`, `Claude Code` and `harness` only; the docs page stays. (src: site/src/pages/Home/Home.constant.ts)
- A first-time site-test dependency must go into `optimizeDeps.include` in `site/vitest.config.ts`, else Vite re-optimizes mid-run and a cold run times out. (src: site/vitest.config.ts)
- Site browser tests run with `reducedMotion: 'reduce'`; a test needing the reveal end dispatches `animationend` on the marked element. (src: site/vitest.config.ts)
- The product version lives once in `package.json`; a bump ends with `jss-devtools harness update`. (src: scripts/package-info.mjs)
- `harness update` writes `.claude/settings.json` with spaces; Prettier puts the tabs back. (src: src/modules/harness/services/merge.service.ts)
- Yarn 1 ignores a workspace package without `version` (bins missing, scripts exit 127); every generated workspace `package.json` needs a `version`. (src: .harness/plans/reports/brainstorm-261112-1616-init-monorepo-turborepo.md)
- ESLint flat-config globs resolve from the config's folder, so a monorepo root config must list the `apps/*` and `packages/*` source folders. (src: src/commands/init/templates/eslint-config-mjs.template.ts)
- `scripts/pin-node-preset.mjs` writes the constants file itself; a rerun moves pins that aged past `minimumReleaseAge`, and the repo's own prettier follows the preset (test-asserted). (src: scripts/pin-node-preset.mjs)
- Spreading a template's shared const reorders the generated JSON's keys and breaks byte-exact snapshots; derive variants by destructuring-omit. (src: src/commands/init/templates/tsconfig-json.template.ts)
- Nest DI needs decorator metadata tsx/esbuild never emit, so a Nest preset runs `nest start --watch`; Nest 12 is ESM `nodenext` where `@/` imports need a `.js` suffix. See .harness/plans/reports/brainstorm-261112-1953-init-nest-preset.md
- Prettier CLI exits 2 on a no-parser file (husky scripts, `.gitignore`) even mixed with formattable ones, but skips explicitly passed `.prettierignore`d files with exit 0; init's format step filters by extension. (src: src/commands/init/init.command.ts)
- The site's ESLint import order differs from the root repo's: all `@/` imports sit in one alphabetical group with no blank lines, and a type-only import must still be written as a value `import` when its module has one. (src: site/eslint.config.mjs)
- The user commits straight to `main`, only on request; pushing deploys, so never push unasked.
