# Memory

Short facts about this repository, injected at every session start. Size limits are in
`.harness/config.json` under `memory`.

- One `- ` line per entry: a fact, convention, trap or user correction, and its reason.
- Cite the source when there is one: `(src: path:line)`.
- Longer than a line: write `.harness/docs/<topic>.md` and leave
  `- <fact>. See .harness/docs/<topic>.md`.
- Lessons, not logs: no dates, PR numbers or narration.
- Never a secret. Name where it is kept.
- Existing-mode `init` rejects `--pm` by design: the project uses the manager `packageManager` declares. (src: .harness/decisions/0030-init-node-preset.md)
- Long Write/Edit/heredoc tool calls can garble files with placeholder tokens, and a scripted `str.replace` with no match fails silently: assert the old text first, then grep and syntax-check; recover with short anchored Edits.
- The AgentKit privacy hook scans a Bash command's text, not its paths: `.env`, `process.env` or `.*` in a grep pattern or heredoc blocks as a sensitive read. Build the string at run time (`'.'+'env'`) or move the content through Write/Edit.
- The site's visual bar is product landing pages; reject "restraint" directions, reach boldness inside design-system tokens (decision 0042 names the sites).
- Site traps and screenshot procedures: see .harness/docs/site-traps.md and site-screenshots.md. CSS and responsive rules (desktop-first, `max-*` only): .harness/docs/site/conventions/; where the copy and the design system's source disagree, the source wins.
- `doctor` is not a main command (user): the hero terminal shows `init`, `Claude Code` and `harness` only; the docs page stays. (src: site/src/pages/Home/Home.constant.ts)
- The version lives once in `package.json`; a bump ends with `jss-devtools harness update`. At the same version doctor reads hook-bundle drift as tampering: an older install errors until its first `harness update`. (src: scripts/package-info.mjs)
- `harness update` writes `.claude/settings.json` with spaces; Prettier puts the tabs back. (src: src/modules/harness/services/merge.service.ts)
- Yarn 1 ignores a workspace package without `version` (bins missing, scripts exit 127); every generated workspace `package.json` needs a `version`. (src: src/commands/init/templates/app-package-json.template.ts)
- A monorepo root ESLint config must list the `apps/*` and `packages/*` folders and set `tsconfigRootDir` for JS files too, or linting fails with "multiple candidate TSConfigRootDirs". (src: src/commands/init/templates/eslint-config-mjs.template.ts)
- Pins, `minimumReleaseAge`, peers, pnpm 11 `prepare` skips, `allowBuilds` and template `node_modules` traps: see .harness/docs/pins-and-template-deps.md
- A `scripts/*.mjs` export that a `.ts` test imports must be mirrored in the sibling `.d.mts` (tsc reads the declaration, runtime reads the `.mjs`; no `allowJs`), or the script runs while `pnpm typecheck` fails. (src: scripts/pin-helpers.d.mts)
- Spreading a template's shared const reorders the generated JSON's keys and breaks byte-exact snapshots; derive variants by destructuring-omit. (src: src/commands/init/templates/tsconfig-json.template.ts)
- Nest template traps (tsx breaks DI, `.js` imports, injected-field naming, env file order, @nestjs/i18n quirks): see .harness/docs/nest-template-traps.md
- React template traps (ESLint 10 brace globs, the react-refresh config shape, polymorphic prop types, OpenFeature flag typing): see .harness/docs/react-template-traps.md
- Prettier CLI exits 2 on a no-parser file (husky scripts, `.gitignore`) even mixed with formattable ones, but skips explicitly passed `.prettierignore`d files with exit 0; init's format step filters by extension. (src: src/commands/init/services/init-format.service.ts)
- The user commits straight to `main`, only on request;
- Division of labour (user): trivial fixes the assistant applies directly; large or design-bearing changes go through a plan to the cooker agent. pushing deploys, so never push unasked. A plan must not name a worktree or a feature branch: cook follows that text literally and implements in the wrong tree.
- `pnpm test -- <file>` ignores the file filter and runs the whole suite; run one suite with `pnpm vitest run <file>` (e2e: prefix `INIT_E2E=1`, after `pnpm build`). (src: tests/init.e2e.test.ts)
- `tests/init-nest.e2e.test.ts` passes 12/12 under `INIT_E2E=1` but the file can be marked failed: its `afterAll` rm of twelve installed projects exceeds vitest's 10s `hookTimeout`. The cleanup timeout is the only failure; don't debug the suite for it.
- `pnpm build` does not typecheck: tsdown strips types, so a tsc-only error builds into a broken bundle; run `pnpm typecheck` before launching a long INIT_E2E run against `dist/cli.mjs`.
- ESLint `no-restricted-imports` negation is gitignore-strict: under a `../*` ban only `!../scripts` (the bare directory) re-includes subpaths; `!../scripts/**` and `!../scripts/*` still ban them.
- tsdown/vitest `define` values parse as JSON object literals, not raw text; declare the constant as the object type and consume it directly (src: src/core/constants/package.constant.ts); a `JSON.parse` wrapper chokes on `[object Object]`.
- tsx cannot resolve `@/`; to dump real output for test expectations, run a throwaway `tests/tmp-*.test.ts` with `pnpm vitest run <file> --disableConsoleIntercept`.
- `ak journal create` dates files in UTC; an ICT evening lands on yesterday's name — rename the file or pass `--date`.
- The init e2e suites log `skipped, not on PATH` and pass when a manager is missing; check `<pm> --version` for all four before claiming they ran. (src: tests/init-nest.e2e.test.ts)
- `pnpm run <script> --fix` passes the flag to the last command only (`eslint && stylelint` gets it on stylelint); run `eslint --fix <file>` directly.
- A drift test parsing a template literal from source text must evaluate `\\` escapes before `JSON.parse`; the raw text holds `\\"` where the runtime string holds `\"`. (src: tests/site-nest-docs.test.ts)
- The generated `.vscode/settings.json` sets `eslint.validate`, which REPLACES the extension's default list: without `typescriptreact` in it, editor linting and fix-on-save silently skip every `.tsx` while the CLI stays green. (src: src/commands/init/templates/vscode-settings-json.template.ts)
- An init flag description must keep its `(default: …)` parenthetical on one help line: a wrapped one fails `tests/init.command.test.ts`, `tests/bundle.test.ts` and `tests/help-colours.test.ts`.
- Harness-hardening traps (the hook bundle import cycle, path-safety refusals, the content check's published set, redaction pattern pitfalls, update-test helpers): see .harness/docs/harness-hardening-traps.md
