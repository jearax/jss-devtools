# @jjuidev/jss-devtools

## 0.5.3

### Patch Changes

- 19a92ba: Update `init` generator: `.prettierrc.json` now emits `tabWidth: 4` (was 2) to give client projects roomier space-indented formatting out of the box.

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
