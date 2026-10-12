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

## Commands

```
jss-devtools --help            # top-level help
jss-devtools version           # show CLI version
jss-devtools init              # set up dev tooling on an existing project
```

Each subcommand supports `jss-devtools <subcommand> --help` for usage details.

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