# `jss-devtools`

> **JavaScript Stack Dev Tools CLI** — A complete SDK-style command-line interface (subcommands + per-subcommand `--help`).

- **Package name:** `@jjuidev/jss-devtools` (npm public)
- **Bin:** `jss-devtools`
- **Repo:** `jearax/jss-devtools`
- **Audience:** JavaScript / TypeScript developers building with Node.js stacks
- **Distribution:** Public open-source on npm + GitHub (`jearax/jss-devtools`)
- **Owner:** jjuidev

## Why

Most JS dev-tool CLIs are either too narrow (single-purpose) or too scattered (one tool per concern). `jss-devtools` aims to be a single, opinionated entry point for the common JavaScript stack workflows — version management, scaffolding, and everyday helpers — with a Docker-style help experience that always tells you what's possible next.

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
jss-devtools init [--framework <node|react|next>] [--yes] [--dry-run] [--json]   # framework defaults to node
jss-devtools --help | --version
```

`init` overlays dev tooling on an existing single-package project:

| Output | Content |
|---|---|
| `eslint.config.mjs` | Flat config: typescript-eslint, import-x ordering, prettier, autofix, arrow functions, type-aware promise rules, `@/` alias imports (react/next add react + react-hooks) |
| `.editorconfig` | Only when missing. The single whitespace source: tabs (width 2), LF, print width 120; YAML uses spaces. Prettier, eslint-plugin-prettier and editors all read it |
| `.prettierrc.json` | JS syntax rules only: semicolons, single quotes (double in JSX), quote props as needed, no trailing commas, bracket spacing, arrow parens always |
| `.vscode/settings.json`, `.vscode/extensions.json` | Only when missing: format on save with Prettier, eslint fixes on save; recommend EditorConfig, eslint and Prettier extensions |
| `commitlint.config.mjs` | `@commitlint/config-conventional` |
| `.husky/pre-commit`, `.husky/commit-msg` | `lint-staged` and `commitlint --edit` through the project's package manager |
| `package.json` | `prepare`, `typecheck`, `lint`, `format` scripts (only when absent) and a `lint-staged` block |
| `tsconfig.json` | Fresh file, or the `@/*` path alias merged into an existing plain one |
| `pnpm-workspace.yaml` | pnpm only: `allowBuilds: { unrs-resolver: true }` for pnpm 11 |
| `.gitignore` | Only when missing |

The package manager (npm, pnpm, yarn classic, yarn berry, bun) is detected from the lockfile or the `packageManager` field; every command is mapped through [`package-manager-detector`](https://github.com/antfu-collective/package-manager-detector). Re-running is idempotent; differing config files are listed for confirmation before they are replaced.

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