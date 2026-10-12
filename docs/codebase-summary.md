# Codebase Summary — `jss-devtools`

Snapshot date: 2026-10-13 (v0.6.0).

## State

- **Stage:** published on npm as `@jjuidev/jss-devtools`; one command, `init`, for single-package Node.js + TypeScript projects.
- **Source:** ~2.5k LOC in `src/` (39 files); 11 Vitest suites in `tests/`.

## Repository Layout

```
src/
├── cli.ts, cli/router.ts        bin entry + citty router
├── commands/init.ts             init command definition
├── commands/init/
│   ├── generators/              content of every generated file
│   ├── install/                 version resolution + PM install commands
│   ├── plan/                    pure plan, conflicts, display lines
│   ├── utils/                   args, preflight, confirm, apply, manifest edits
│   └── run-init-flow.ts         pipeline orchestration
├── core/                        PM detection, registry client, PM command mapping
└── utils/                       logger, spinner, prompts, banner, package info
tests/                           unit + flow + smoke (built CLI) tests
docs/                            this folder
```

## Tooling

| Concern | Choice |
|---|---|
| Build | tsup (ESM, shebang, `dist/cli/cli.js`) |
| Lint / format | ESLint flat config + Prettier |
| Tests | Vitest (`smoke.test.ts` runs the built CLI) |
| Hooks | husky + lint-staged + commitlint |
| CI | `.github/workflows/ci.yml` (main + PRs), `release.yml` (tags `v*`) |

## Docs

- `project-overview-pdr.md` — problem, scope, principles
- `system-architecture.md` — command surface and `init` pipeline
- `code-standards.md` — TS / lint / commit conventions
- `deployment-guide.md` — tag-based release to npm
- `project-roadmap.md` — shipped and planned work
