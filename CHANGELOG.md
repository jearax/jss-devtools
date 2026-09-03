# @jjuidev/jss-devtools

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
