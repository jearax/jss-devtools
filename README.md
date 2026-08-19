# `jss-devtools`

> **JavaScript Stack Dev Tools CLI** — A complete SDK-style command-line interface inspired by Docker's command structure (subcommands + per-subcommand `--help`).

- **Package name:** `jss-devtools` (npm public)
- **Bin:** `jss-devtools`
- **Repo:** `jss-cli`
- **Audience:** JavaScript / TypeScript developers building with Node.js stacks
- **Distribution:** Public open-source on npm + GitHub (`jearax/jss-cli`)
- **Owner:** jjuidev

## Why

Most JS dev-tool CLIs are either too narrow (single-purpose) or too scattered (one tool per concern). `jss-devtools` aims to be a single, opinionated entry point for the common JavaScript stack workflows — version management, scaffolding, and everyday helpers — with a Docker-style help experience that always tells you what's possible next.

## MVP Commands

```
jss-devtools --help            # top-level help
jss-devtools version           # show CLI version
jss-devtools update [pkg]      # update package(s) to latest matching range
jss-devtools upgrade [pkg]     # upgrade to next major (interactive)
jss-devtools downgrade [pkg]   # downgrade to previous version
jss-devtools ls                # list installed / available versions
jss-devtools scaffold init     # initialize a new project from a preset
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