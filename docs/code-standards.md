# Code Standards — `jss-devtools`

## Language & Runtime

- **TypeScript** strict mode (`"strict": true` in `tsconfig.json`)
- Target: `ES2024` (Node 24 LTS baseline)
- Module system: **ESM** (`"type": "module"`)
- Node version: **v24 LTS (Krypton, v24.19.0+)**, declared in `package.json` `engines.node` as `>=24.0.0`

## Package Manager

- **pnpm** (preferred; explicit decision once build tool is chosen)
- Lockfile: `pnpm-lock.yaml` (committed)
- Workspace: not needed for MVP (single-package); add later if multi-crate layout emerges

## Project Layout

```
jss-cli/
├── src/
│   ├── bin/             # bin entry script (compiled)
│   ├── cli/             # command router, parser, help
│   ├── commands/        # one file per subcommand
│   ├── core/            # domain modules (no CLI deps)
│   ├── types/           # shared TS types
│   └── index.ts         # public surface
├── tests/
│   ├── unit/
│   └── integration/
├── docs/                # project docs (this folder)
├── plans/               # planning artifacts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## File Naming

- Files: `kebab-case.ts` (e.g. `version-resolver.ts`)
- Modules: one responsibility per file
- Tests: co-located or mirror `src/` layout in `tests/`

## TypeScript Conventions

- No `any` except at FFI boundaries (with comment)
- Prefer `unknown` + narrowing over `any`
- All exports typed explicitly (no implicit `any` return)
- Public types live in `src/types/`
- Use `readonly` for immutable structures

## CLI Conventions

- Every subcommand + every leaf node MUST accept `--help` / `-h`
- Flag naming: kebab-case for multi-word (`--dry-run`, not `--dryRun`)
- Long form preferred; short aliases only where standard (`-h`, `-v`, `-V`)
- Errors → stderr, results → stdout
- `--json` flag for machine-readable output on every command
- Exit codes: `0` ok, `1` user error, `2` internal/runtime error

## Testing (Vitest)

- Unit tests for all `core/` modules
- Integration tests for command handlers
- Snapshot tests for `--help` output stability
- Coverage target: TBD (recommended ≥ 80% for `core/`)
- Test files: `*.test.ts` next to source or under `tests/`

## Linting & Formatting

- **Biome** (basic config) cho TS lint + format. Single binary, ~10x ESLint speed.
- **prettier-package-json** riêng cho `package.json` (Biome không sort keys).
- **husky** + **lint-staged** pre-commit hook: chạy `biome check --write` trên staged TS files và `prettier-package-json --write` trên `package.json`.
- ESLint + Prettier đã bị loại vì Biome cover được phần lớn use case, chỉ prettier-package-json còn giữ cho key sorting.

## Git & Commits

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- No AI co-author references in commit messages
- Branch strategy: TBD (likely trunk-based with PRs)

## Documentation

- Public APIs documented via TSDoc
- Update `docs/` only when user-visible behavior, commands, or contracts change
- README stays in sync with command tree

## Open Build Tool Decisions

Build/bundler candidates under evaluation:

| Tool | Notes |
|---|---|
| `tsup` | Simple, esbuild-powered, great for CLI bins |
| `tsdown` | Newer, rolldown-powered, fast |
| `esbuild` | Raw speed, manual config |
| `bun build` | If adopting Bun runtime |
| `rollup` | Most flexible, more config overhead |
| `vite` | Library mode works, but CLI not primary use |

Decision deferred to user-driven research phase.