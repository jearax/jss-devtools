# `jss-devtools`

> **JavaScript Stack Dev Tools CLI** — one command, `init`, that overlays an opinionated lint/format/commit toolchain on an existing Node.js + TypeScript project.

- **Package name:** `@jjuidev/jss-devtools` (npm public)
- **Bin:** `jss-devtools`
- **Repo:** `jearax/jss-devtools`
- **Audience:** JavaScript / TypeScript developers building with Node.js stacks
- **Distribution:** Public open-source on npm + GitHub (`jearax/jss-devtools`)
- **Owner:** jjuidev

## Why

Setting up eslint, prettier, editorconfig, husky, lint-staged and commitlint by hand means picking compatible versions, wiring them so they do not fight, and repeating it in every repo. `jss-devtools init` does it in one run: it resolves peer-compatible versions, writes configs that pass their own checks on the first `lint`, installs through the project's package manager, and is safe to re-run. Installing, updating and removing the CLI itself is left to your package manager.

## Install / update / uninstall

The CLI has no self-management commands; use your package manager.

| PM | Install | Update | Uninstall |
|---|---|---|---|
| npm | `npm i -g @jjuidev/jss-devtools` | `npm i -g @jjuidev/jss-devtools@latest` | `npm rm -g @jjuidev/jss-devtools` |
| pnpm | `pnpm add -g @jjuidev/jss-devtools` | `pnpm add -g @jjuidev/jss-devtools@latest` | `pnpm remove -g @jjuidev/jss-devtools` |
| bun | `bun add -g @jjuidev/jss-devtools` | `bun add -g @jjuidev/jss-devtools@latest` | `bun remove -g @jjuidev/jss-devtools` |
| yarn 1 | `yarn global add @jjuidev/jss-devtools` | `yarn global upgrade @jjuidev/jss-devtools --latest` | `yarn global remove @jjuidev/jss-devtools` |

Pin a version (downgrade) with `@<version>`, e.g. `npm i -g @jjuidev/jss-devtools@0.5.10`.
Run once without installing: `npx @jjuidev/jss-devtools`, `pnpm dlx @jjuidev/jss-devtools`, `bunx @jjuidev/jss-devtools`, or `yarn dlx @jjuidev/jss-devtools` (Yarn 2+).

## Usage

```
jss-devtools init [--framework node] [--yes] [--dry-run] [--json]   # react | next | nest | rn are planned
jss-devtools --help | --version
```

`init` overlays dev tooling on an existing single-package project:

| Output | Content |
|---|---|
| `eslint.config.mjs` | Flat config: typescript-eslint, import-x ordering, prettier, autofix, arrow functions. |
| `.editorconfig` | Only when missing. The single whitespace source: tabs (width 2), print width 120, LF line endings. Prettier, eslint-plugin-prettier and editors all read it |
| `.prettierrc.json` | JS syntax rules only: semicolons, single quotes (double in JSX), quote props as needed, no trailing commas, bracket spacing, arrow parens always |
| `.vscode/settings.json`, `.vscode/extensions.json` | Only when missing: format on save with Prettier, eslint fixes on save; recommend EditorConfig, eslint and Prettier extensions |
| `commitlint.config.mjs` | `@commitlint/config-conventional` |
| `.husky/pre-commit`, `.husky/commit-msg` | `lint-staged` and `commitlint --edit` through the project's package manager |
| `package.json` | `prepare`, `typecheck`, `lint`, `format` scripts (only when absent; `lint`/`format` and lint-staged cover `*.{mjs,js,jsx,mts,ts,tsx}` in `src`, `lib`, `app`, `server`, `bin`, `scripts`, `config`, `test`, `tests`, `spec`, `__tests__`, `e2e` and the project root — edit the folder list in the scripts to change scope) and a `lint-staged` block (root globs are written as `./…`, so nested `package.json` files are left alone) |
| `tsconfig.json` | Fresh file, or the `@/*` path alias merged into an existing plain one |
| `.gitignore` | `node_modules/` when missing; an existing file that does not ignore `node_modules` gets the entry appended (reported as modified) |
| `pnpm-workspace.yaml` | pnpm only: `allowBuilds: { unrs-resolver: true }` for pnpm 11 |

The package manager (npm, pnpm, yarn classic, yarn berry, bun) is detected from the lockfile or the `packageManager` field, falling back to npm when neither exists; every command is mapped through [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector). Re-running is idempotent; differing config files are listed for confirmation before they are replaced.

## Tech Stack

| Concern | Choice | Status |
|---|---|---|
| Runtime baseline | Node.js v24 LTS (Krypton, v24.19.0) | locked |
| Language | TypeScript | locked |
| Package manager | pnpm | leaning |
| Test framework | Vitest | locked |
| Build/bundler | TBD — researching (bun, esbuild, tsup, tsdown, rollup, vite) | open |

## Repo Layout

```
.
├── docs/             # project docs (PDR, architecture, standards, roadmap, etc.)
├── plans/            # planning artifacts (phase plans, reports)
├── src/              # (TBD) source
├── tests/            # (TBD) vitest
├── package.json      # (TBD) manifest
└── README.md
```

## Status

Early scaffold. Repo is initialized with README + docs only; implementation has not started yet.

## License

TBD