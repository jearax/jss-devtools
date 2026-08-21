# Codebase Summary — `jss-devtools`

Snapshot date: 2026-08-19.

## State

- **Stage:** Pre-implementation (scaffold only)
- **Source LOC:** 0
- **Files:** `README.md` + `docs/` only

## Repository Layout (actual)

```
jss-cli/
├── .git/                        # git metadata
├── README.md                    # entry doc
└── docs/                        # project docs (this folder)
```

## Git

- Initialized, single branch `main`, 1 commit (`Initial commit`)
- Remote: `git@github.com-jearax:jearax/jss-cli.git` (SSH alias `github-jearax`)
- Working tree: clean

## Tooling Status

| Concern | Status |
|---|---|
| `package.json` | ✅ created (Phase 0) |
| `tsconfig.json` | ✅ created (Phase 0) |
| `vitest.config.ts` | ✅ created (Phase 0) |
| `biome.json` | 🔄 replaced by `eslint.config.mjs` + `.prettierrc.json` (2026-08-21) |
| `tsup.config.ts` | ✅ created (Phase 0) |
| `.husky/pre-commit` | ✅ created (Phase 0) |
| `lint-staged` config | ✅ in `package.json` (Phase 0) |
| `pnpm-lock.yaml` | ✅ generated after `pnpm install` |
| CI config | ✅ `.github/workflows/ci.yml` (Phase 0) |
| Source code | ✅ stub (`src/cli.ts`, `src/cli/router.ts`) |

## Open Source Files (none yet)

| File | Purpose |
|---|---|
| — | (will be filled as implementation lands) |

## Docs Present

- `docs/project-overview-pdr.md` — PDR
- `docs/system-architecture.md` — command tree + modules
- `docs/code-standards.md` — TS / pnpm / Vitest conventions
- `docs/deployment-guide.md` — npm publish flow
- `docs/project-roadmap.md` — phased delivery plan
- `docs/codebase-summary.md` — this file

## Next-Implementation-Ready State

**Phase 0 complete.** Foundation đã có (với logger từ reference repo, dùng `@/` alias convention):

1. ✅ `package.json` (name `jss-devtools`, bin `./dist/cli/cli.js`, `engines.node: ">=24.0.0"`, scripts, lint-staged config, prepare:husky)
2. ✅ `tsconfig.json` (strict + ESM + Node 24 lib + path alias `@/*` → `./src/*`)
3. ✅ `tsup.config.ts` (ESM + Node 24 + shebang banner + externals)
4. ✅ `vitest.config.ts` (Node env + esbuild target override)
5. ✅ `biome.json` → replaced bằng `eslint.config.mjs` + `.prettierrc.json` (ESLint migration 2026-08-21)
6. ✅ `.gitignore`, `.npmignore`, `.editorconfig`, `.nvmrc`, `.npmrc`
7. ✅ `.husky/pre-commit` chạy `pnpm exec lint-staged` (revised từ `pnpm dlx` — lint-staged đã là devDep, 2026-08-21)
8. ✅ `src/cli.ts` (bin entry) + `src/cli/router.ts` (citty router)
9. ✅ `src/utils/logger.ts` (consola wrapper — adopted from reference)
10. ✅ `tests/smoke.test.ts` (2 tests: --version, --help; no-args hint skipped do consola async vs vitest forks pool race)
11. ✅ `.github/workflows/ci.yml` (lint + typecheck + build + test on Node 24)

**Phase 1+ ready to start.**