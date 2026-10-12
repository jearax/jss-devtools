# @jjuidev/jss-devtools

## 0.6.0

### Minor Changes

- **BREAKING:** remove the self-management commands `update` (incl. `update check`), `upgrade`, `downgrade`, and `uninstall`. Manage the CLI with your package manager instead:

  - Update: `npm i -g @jjuidev/jss-devtools@latest` (or `pnpm add -g` / `bun add -g` / `yarn global upgrade --latest`)
  - Downgrade: install a pinned version, e.g. `npm i -g @jjuidev/jss-devtools@0.5.10`
  - Uninstall: `npm rm -g @jjuidev/jss-devtools` (or `pnpm remove -g` / `bun remove -g` / `yarn global remove`)

- `init --framework` is optional and defaults to `node`.
- `init` scripts are `lint: eslint .` and `format: eslint --fix .`; scope comes from `eslint.config.mjs` (which now ignores `build/` and, for next, `.next/`), and formatting runs through `prettier/prettier`.
- `init` creates `.gitignore` only when missing, containing just `node_modules/`.
- `init --no-install` writes valid devDependency ranges (`^9.39.5`, previously `@^9.39.5`).
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
