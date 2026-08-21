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
- **No `index.ts` barrel files** — every file self-describing (e.g. `store/store.ts`, không phải `store/index.ts`). File names phải tự nói lên nội dung cho LLM tools (Grep/Glob) và người đọc
- Modules: one responsibility per file
- Tests: co-located or mirror `src/` layout in `tests/`

## TypeScript Conventions

- No `any` except at FFI boundaries (with comment)
- Prefer `unknown` + narrowing over `any`
- All exports typed explicitly (no implicit `any` return)
- Public types live in `src/types/`
- Use `readonly` for immutable structures

## Import Conventions

- **Always use `@/` alias for project imports** (resolves to `./src/*` via `tsconfig.json#paths`).
- **Examples:**
  - ✅ `import { foo } from '@/utils/logger.js'`
  - ❌ `import { foo } from '../../utils/logger.js'`
  - ✅ `import { execa } from '@/core/execa.js'`
  - ❌ `import { execa } from '../core/execa.js'`
- **Node built-ins** (`node:fs`, `node:path`, etc.) — import trực tiếp không alias.
- **npm packages** (`citty`, `consola`, etc.) — import trực tiếp không alias.
- **TS extension `.js`** trong import path (required cho `NodeNext` + `verbatimModuleSyntax`).
- **Tools auto-handle alias:**
  - `tsup` đọc `tsconfig.json#paths` ở bundle time → output có path resolved.
  - `vitest` đọc `tsconfig.json#paths` ở test time (via vite).
  - `tsc --noEmit` resolve từ `tsconfig.json#paths`.

## Comments

- **No comment** for logic a mid-level developer reads straight from the code: basic flow, obvious branches, self-evident names, "what" comments that restate the line below them
- **Comment only genuinely hard logic**: business rules, algorithm reasoning, "magic" behavior (hidden state, non-obvious semantics like memo lifetimes), requirement-driven decisions, and external knowledge not derivable from the code (e.g. third-party tool output formats)
- A comment must answer **why**, never what. If deleting it loses no information → delete it

## CLI Conventions

- Every subcommand + every leaf node MUST accept `--help` / `-h`
- Flag naming: kebab-case for multi-word (`--dry-run`, not `--dryRun`)
- Long form preferred; short aliases only where standard (`-h`, `-v`, `-V`)
- Errors → stderr, results → stdout
- `--json` flag for machine-readable output on every command
- Exit codes: `0` ok, `1` user error, `2` internal/runtime error
- Non-TTY semantics: reversible self-commands (upgrade/downgrade) auto-proceed (CI-friendly); destructive ones (`uninstall`) require explicit `--yes` — otherwise exit 1 with `REQUIRES_CONFIRMATION`

## Testing (Vitest)

- **Trong development:** chỉ maintain **smoke tests** ở `tests/smoke.test.ts`. Smoke test exec bin thật và assert các đầu ra chính (--version, --help, subcommands).
- **Trước release 1 version:** viết đầy đủ unit + integration + snapshot tests cho các core modules và command handlers.
- Lý do: smoke tests nhanh, đủ confidence cho daily dev loop. Full test suite tốn thời gian setup + maintain — chỉ worth khi ship.
- Coverage target (khi có full test): ≥ 80% cho `core/`.
- Test files: `*.test.ts` dưới `tests/` (smoke) hoặc co-located (unit, khi có).
- Vitest config: `pool: 'forks'` (threads pool có stdio capture issues với child_process spawning external binaries).

## Linting & Formatting

- **ESLint** (flat config `eslint.config.mjs`) cho TS lint — `@eslint/js` recommended + `@typescript-eslint` recommended; `no-unused-vars` warn (ignore `^_`, args all, ignoreRestSiblings), `no-explicit-any` off, `consistent-type-imports: no-type-imports`, Node globals qua `globals` package. Version policy: latest, không pin theo reference repo.
- **Core ESLint plugins** (rules port từ jss-cli history — "rules tôi theo đuổi"):
  - `eslint-plugin-import-x` (fork của `eslint-plugin-import` — bản gốc không hỗ trợ ESLint 10; cùng rule names, prefix `import-x/`): `first`, `newline-after-import`, `no-duplicates`, `no-anonymous-default-export`, `order` (alphabetize asc, `@/**` → internal).
  - `eslint-plugin-autofix`: `eol-last`, `curly`, `no-lonely-if`, `no-else-return`, `object-shorthand`, `object-curly-newline`.
  - `eslint-plugin-prefer-arrow-functions`: `prefer-arrow-functions` error.
  - `eslint-plugin-prettier`: `prettier/prettier` error (chạy Prettier như ESLint rule; song song với `prettier --write` trong lint-staged).
  - Core rule `padding-line-between-statements` (blank line giữa statements).
- **Prettier** (`.prettierrc.json`) cho format — `eslint-config-prettier` đặt TRƯỚC rule overrides để explicit rules luôn thắng.
- Prettier style: tabs, `semi: false`, singleQuote, `trailingComma: none`, printWidth 120 (align reference repo `jss-cli`).
- `unrs-resolver` (native binding của import-x, resolve `@/*` alias) — approved build qua `pnpm-workspace.yaml` `allowBuilds`.
- **prettier-package-json** riêng cho `package.json` key sorting.
- **husky** + **lint-staged** pre-commit: `eslint --fix` + `prettier --write` trên staged TS files, `prettier-package-json --write` trên `package.json`.
- Scripts: `pnpm lint` (`eslint .`), `pnpm lint:fix`, `pnpm format`.
- Revised 2026-08-21: migrated từ Biome sang ESLint + Prettier; cùng ngày add 4 core plugins trên.

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