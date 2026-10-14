# @jjuidev/jss-devtools

## 0.6.4

### Patch Changes

- The generated `lint`/`format` scripts, lint-staged and `eslint.config.mjs` `files` cover `.jsx` and `.tsx` too: the code glob is `{src,lib,app,server,bin,scripts,config,test,tests,spec,__tests__,e2e}/**/*.{mjs,js,jsx,mts,ts,tsx}` plus `./*.{mjs,js,jsx,mts,ts,tsx}` at the root. React components were skipped by lint and the pre-commit hook. CommonJS (`.cjs`/`.cts`) stays out. Existing projects keep their scripts and `lint-staged` block; edit the extension list by hand, and re-run `init` to see the `eslint.config.mjs` difference.

## 0.6.3

### Patch Changes

- lint-staged formats only the root manifest: the generated key is `./package.json` instead of `package.json`. A glob without `/` matches basenames in every directory, so committing nested `package.json` files (vendored tools, agent skills under `.claude/`) reformatted them too. Existing projects keep their `lint-staged` block; rename the key by hand.
- `init` appends `node_modules/` to an existing `.gitignore` that does not already ignore it (`node_modules`, `/node_modules`, `**/node_modules`, with or without a trailing `/`, `/*` or `/**`, or a `!` negation). Existing content is kept byte for byte, a missing final newline is added first, and the file is listed under `modified` in the result, including `--dry-run`. Previously the installed dependency tree stayed untracked after `init` in such repos.

## 0.6.2

### Patch Changes

- `init` no longer adds `.claude/**`, `.agentkit/**` and `.harness/**` to `eslint.config.mjs`; lint scope lives only in explicit globs, which are easier to edit than a hard-coded ignore list.
- The generated `lint`/`format` scripts and lint-staged cover `*.{ts,mts,js,mjs}` in `src`, `lib`, `app`, `server`, `bin`, `scripts`, `config`, `test`, `tests`, `spec`, `__tests__`, `e2e` and the project root. `eslint.config.mjs` `files` uses the same extensions. CommonJS (`.cjs`/`.cts`) stays out because the generated rules are ESM-only.
- lint-staged's root glob is `./*.{ts,mts,js,mjs}`: a glob without `/` matches files in every directory, so the old `*.{ts,mjs}` also linted staged files under `.claude/` and other folders.

## 0.6.1

### Patch Changes

- `init` scopes the generated `lint`/`format` scripts to `{src,test}/**/*.ts` and root `*.{ts,mjs}` (with `--no-error-on-unmatched-pattern`) instead of `eslint .`, matching `lint-staged`. In projects that also hold agent tooling, `eslint .` walked hundreds of tool-owned JS files and `lint` could run for minutes.
- `eslint.config.mjs` also ignores `.claude/**`, `.agentkit/**` and `.harness/**`, so a direct `eslint .` or a staged root file in those dirs skips them too. Scripts are only added when absent: on an existing project, re-run `init` to update `eslint.config.mjs` (shown as a differing file) and change the `lint`/`format` scripts by hand if you want the narrower scope.

## 0.6.0

### Minor Changes

- **BREAKING:** remove the self-management commands `update` (incl. `update check`), `upgrade`, `downgrade`, and `uninstall`. Manage the CLI with your package manager instead:

  - Update: `npm i -g @jjuidev/jss-devtools@latest` (or `pnpm add -g` / `bun add -g` / `yarn global upgrade --latest`)
  - Downgrade: install a pinned version, e.g. `npm i -g @jjuidev/jss-devtools@0.5.10`
  - Uninstall: `npm rm -g @jjuidev/jss-devtools` (or `pnpm remove -g` / `bun remove -g` / `yarn global remove`)

- `init --framework` is optional and defaults to `node`.
- **BREAKING:** only `node` is supported. The `react` and `next` presets are removed and, like the reserved `nest` and `rn`, abort with `FRAMEWORK_NOT_SUPPORTED`. `init` no longer adds framework runtime dependencies.
- `init` installs eslint 10 (was capped at 9 for `eslint-plugin-react`) and no longer installs the unused `tsc-alias`.
- `@types/node` is always installed, so `typecheck` passes with `--no-linter` (the generated `tsconfig.json` sets `types: ['node']`).
- `init` scripts are `lint: eslint .` and `format: eslint --fix .`; scope comes from `eslint.config.mjs` (which now ignores `build/`), and formatting runs through `prettier/prettier`.
- `init` creates `.gitignore` only when missing, containing just `node_modules/`.
- `init --no-install` writes valid devDependency ranges (`^10.12.0`, previously `@^10.12.0`).
- `init` treats the array form of `package.json#workspaces` (npm/yarn/bun) as a monorepo.
- `init` pins `@eslint/js` to the same major as `eslint`, so npm no longer reports `ERESOLVE` (a warning on install, a hard failure on a later `npm install`).
- `init` exits with code 1 when the conflict prompt is cancelled, so scripts and CI do not treat it as success.
- `init` no longer asks which package manager to use: without a lockfile or `packageManager` field it uses npm. This also removes the spinner/prompt flicker during "Checking project".
- `init` creates `.vscode/settings.json` and `.vscode/extensions.json` when missing (format on save via Prettier, eslint fixes on save, `source.organizeImports: never`, EditorConfig extension recommended).
- `init` creates `.editorconfig` when missing and makes it the single whitespace source (tabs width 2, print width 120, LF line endings); `.prettierrc.json` holds only JS syntax rules (`semi`, `singleQuote`, `jsxSingleQuote`, `quoteProps`, `trailingComma: none`, `bracketSpacing`, `bracketSameLine`, `arrowParens`). Generated JSON (tsconfig, VS Code files) now matches Prettier's layout.
- lint-staged formats `package.json` with `prettier --write` instead of `prettier-package-json --use-tabs`, so it follows `.editorconfig` (keys are no longer sorted).
- **BREAKING:** remove the `version` and `help` subcommands; use `-v`/`--version` and `-h`/`--help` (both print the figlet banner). `init` is the only command.
- `init` output now follows the house setup of the `dokploy/design-system` and `dokploy/auth` repos: plain `@commitlint/config-conventional`, eslint, and `lint`/`typecheck` scripts.
- `init` on pnpm writes `allowBuilds: { unrs-resolver: true }` to `pnpm-workspace.yaml`. pnpm 11 removed `onlyBuiltDependencies`, so the previous `package.json#pnpm` entry had no effect (and was also written for npm/yarn/bun projects).
- `init` no longer treats a `pnpm-workspace.yaml` without `packages` as a monorepo.
- Package manager detection and command mapping use `package-manager-detector` only (yarn classic vs berry included).
- Re-running `init` keeps `package.json` indentation and reports `noop` when nothing changed.
- Drop the `consola`, `ora`, `nypm` and `pathe` dependencies; the published tarball no longer ships a sourcemap.
- Drop the `conf` dependency. The package-manager ledger it wrote (in the OS config directory under `jss-devtools`) is no longer read and can be deleted.

## 0.5.2

### Patch Changes

- d4cd2de: Fix `init` generator to produce syntactically valid `eslint.config.mjs`.

  - `node` preset: `globals.node` was emitted as a bare identifier (`globals: { globals.node }`), which is invalid object shorthand. Emit it as a spread (`...globals.node`) to match the `react` preset and the house `eslint.config.mjs`.
  - generator template: the `newlines-between` key inside `import-x/order` was unquoted — a hyphenated key, also a syntax error. Quote it (`'newlines-between'`) to match the house reference.
  - generator template: remove a stray closing brace that unbalanced the rules block (the previous bracket-only sanity check missed it).
  - Add an AST-parse regression test so future template drift gets caught at unit-test time.

## 0.5.1

### Patch Changes

- aa60ef6: Polish `init` generator output to match the house `eslint.config.mjs` style.

  - `eslint.config.mjs`: align indent across all `plugins: { ... }` entries — the `.join` separator used one extra tab, so the first entry was indented one level less than the rest.
  - `commitlint.config.mjs`: wrap config in a named const (`const commitlintConfig = {...}`) before `export default`, matching the named-const wrapper used by `eslint.config.mjs`.

## 0.5.0

### Minor Changes

- 5dce9e0: Add `jss-devtools init` — bootstrap full dev tooling on an existing project.

  - Generates git repo (silent), husky hooks, lint-staged, ESLint flat config, Prettier (incl. `prettier-package-json` via the detected package-manager runner), commitlint (`@commitlint/config-conventional` default rules), tsconfig + `@/*` path alias, and `prepare`/`format` scripts.
  - Framework presets: `node`, `react`, `next` (`react-native` is out of scope for v0.3.x).
  - Flags: `--framework <node|react|next>` (required), `-y`, `--dry-run`, `--json`, `--no-linter`, `--no-commitlint`, `--no-install`.
  - Detects package manager in this order: `packageManager` field → lockfile → nypm guess → prompt (TTY) / abort (non-TTY).
  - Monorepo workspaces and foreign linters (biome/oxlint) abort with a hint before any write.
  - Idempotent: a successful run reports `noop` on the next invocation; user-owned scripts, dependencies, and existing config files are never clobbered.

  Known caveats:
  - `init` needs a TTY unless `--yes` is passed and a lockfile (or `packageManager` field) is present — PM_UNDETECTED aborts otherwise.
  - `--no-install` writes `devDependencies`/`peerDependencies` entries tagged `@latest`; the user's next install resolves them to the current latest stable.

- 5dce9e0: Scaffold init command

### Patch Changes

- 0a65e33: Update pkgs

## 0.4.1

### Patch Changes

- 29d0093: Drop the Docker-inspired mention from package description and README; switch the release pipeline to changesets-driven version automation.
