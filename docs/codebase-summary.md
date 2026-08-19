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
| `package.json` | missing — to be created |
| `tsconfig.json` | missing — to be created |
| `vitest.config.ts` | missing — to be created |
| `pnpm-lock.yaml` | missing — to be created after init |
| CI config | missing |
| Source code | missing |

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

Before Phase 1 of the roadmap can start, the following must be created:

1. `package.json` (with `name: "jss-devtools"`, `bin`, `engines.node: ">=24.0.0"`, scripts)
2. `tsconfig.json` (strict + ESM + Node 24 lib)
3. `vitest.config.ts`
4. `.gitignore`, `.npmignore` (or `files` field)
5. `.editorconfig`, `.nvmrc`