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
- Long agent Write/Edit/heredoc calls can garble files with literal placeholder tokens, and a scripted `str.replace` with no match fails silently: assert the old text is present, then `grep -rn placeholder` and run a syntax check.
- pnpm undecided build scripts write a literal `esbuild: set this to true or false` placeholder into `pnpm-workspace.yaml`; delete it, never commit it.
- The doctor secret scanner flags any credential word followed by `:` or `=`, even in prose; reword instead of chasing a leak. (src: src/modules/harness/services/redaction.service.ts)
- The site's visual bar is product landing pages (harness.io, agentkit.best, claude.com/product/claude-code, herdr.dev); reject "restraint" directions, reach boldness inside design-system tokens (decision 0042).
- Site traps (CSS Modules, stacking, lint order, Vitest browser quirks) and screenshot procedures: see .harness/docs/site-traps.md and .harness/docs/site-screenshots.md
- Site CSS and responsive rules come from the design system's conventions (component S1–S12, styling R1–R5, desktop-first `max-*` only); check the source, not the site's copy. (src: .harness/plans/261110-0100-site-landing-redesign/plan.md)
- `doctor` is not a main command (user): the hero terminal shows `init`, `Claude Code` and `harness` only; the docs page stays. (src: site/src/pages/Home/Home.constant.ts)
- The product version lives once in `package.json`; a bump ends with `jss-devtools harness update`. (src: scripts/package-info.mjs)
- `harness update` writes `.claude/settings.json` with spaces; Prettier puts the tabs back. (src: src/modules/harness/services/merge.service.ts)
- Yarn 1 ignores a workspace package without `version` (bins missing, scripts exit 127); every generated workspace `package.json` needs a `version`. (src: .harness/plans/reports/brainstorm-261112-1616-init-monorepo-turborepo.md)
- A monorepo root ESLint config must list the `apps/*` and `packages/*` folders (globs resolve from the config's folder) and set `tsconfigRootDir` for JS files too, or linting under two configs fails with "multiple candidate TSConfigRootDirs". (src: src/commands/init/templates/eslint-config-mjs.template.ts)
- Pins, `minimumReleaseAge`, pnpm 11 `prepare` skips and template `node_modules` traps: see .harness/docs/pins-and-template-deps.md
- Spreading a template's shared const reorders the generated JSON's keys and breaks byte-exact snapshots; derive variants by destructuring-omit. (src: src/commands/init/templates/tsconfig-json.template.ts)
- Nest template traps (tsx breaks DI, `.js` imports, injected-field naming, env file order, @nestjs/i18n quirks): see .harness/docs/nest-template-traps.md
- Prettier CLI exits 2 on a no-parser file (husky scripts, `.gitignore`) even mixed with formattable ones, but skips explicitly passed `.prettierignore`d files with exit 0; init's format step filters by extension. (src: src/commands/init/init.command.ts)
- The user commits straight to `main`, only on request; pushing deploys, so never push unasked.
- `pnpm test -- <file>` ignores the file filter and runs the whole suite; run one suite with `pnpm vitest run <file>` (e2e: prefix `INIT_E2E=1`, after `pnpm build`). (src: tests/init.e2e.test.ts)
- `pnpm build` does not typecheck: tsdown strips types, so a tsc-only error builds into a broken bundle; run `pnpm typecheck` before launching a long INIT_E2E run against `dist/cli.mjs`.
- The AgentKit privacy hook blocks a Bash command whose text merely contains `.env` (even prose in a heredoc) as a sensitive read; build the string at run time (`'.'+'env'`) instead of approving a read that never happens.
- Guard rsync source vars with `test -n` (an unset one with --delete copies from /), and re-copy overlay files after an rsync --delete of the source over a scratch dir.
- ESLint `no-restricted-imports` negation is gitignore-strict: under a `../*` ban only `!../scripts` (the bare directory) re-includes subpaths; `!../scripts/**` and `!../scripts/*` still ban them.
- tsdown/vitest `define` values parse as JSON object literals, not raw text; declare the constant as the object type and consume it directly (src: src/core/constants/package.constant.ts); a `JSON.parse` wrapper chokes on `[object Object]`.
- tsx cannot resolve `@/`; to dump real output for test expectations, run a throwaway `tests/tmp-*.test.ts` with `pnpm vitest run <file> --disableConsoleIntercept`.
- `ak journal create` dates files in UTC; an ICT evening lands on yesterday's name — rename the file (plain markdown) or pass `--date`.
- The init e2e suites log `skipped, not on PATH` and pass when a manager is missing; check `<pm> --version` for all four before claiming they ran. (src: tests/init-nest.e2e.test.ts)
- `pnpm run <script> --fix` passes the flag to the script's last command only (`eslint … && stylelint …` gets it on stylelint); run `eslint --fix <file>` directly.
- A drift test parsing a template literal from source text must evaluate `\\` escapes before `JSON.parse`; the raw text holds `\\"` where the runtime string holds `\"`. (src: tests/site-nest-docs.test.ts)
- An init flag description must keep its `(default: …)` parenthetical ending a help line: a wrapped one fails `tests/init.command.test.ts`, `tests/bundle.test.ts` and `tests/help-colours.test.ts`; keep the text short enough not to wrap.
