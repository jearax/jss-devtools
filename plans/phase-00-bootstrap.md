---
phase: 0
title: "Bootstrap Foundation"
status: completed
priority: P1
effort: "3h"
dependencies: []
---

# Phase 0: Bootstrap Foundation

## Overview

Repo runnable end-to-end: `pnpm install && pnpm build && node dist/cli/cli.js --help` in ra help text. Thiết lập mọi foundation files (config, scripts, CI) và bin entry stub.

## Requirements

- **Functional:**
  - `pnpm build` produce `dist/cli/cli.js` với shebang `#!/usr/bin/env node`.
  - `node dist/cli/cli.js --help` in help text (citty auto-generated).
  - `node dist/cli/cli.js --version` in version từ `package.json`.
- **Non-functional:**
  - TypeScript strict mode, ESM-only, Node 24 LTS baseline.
  - All tooling configs version-pinned trong `package.json`.
  - CI xanh trên PR đầu tiên.

## Architecture

```
src/
├── bin/jss-devtools.ts    # entry — invokes runMain(router)
└── cli/router.ts          # citty defineCommand với meta + run handler

.github/workflows/ci.yml   # lint + typecheck + test + build on Node 24

configs at repo root:
- package.json     # deps + scripts + bin
- tsconfig.json    # strict + ESM + NodeNext + path alias
- tsup.config.ts   # bundler với external runtime deps
- vitest.config.ts # Node env
- biome.json       # basic formatter + linter
- .npmrc, .gitignore, .npmignore, .editorconfig, .nvmrc
```

## Related Code Files

**Create:**
- `package.json`
- `tsconfig.json`
- `tsup.config.ts`
- `vitest.config.ts`
- `biome.json`
- `.npmrc`, `.gitignore`, `.npmignore`, `.editorconfig`, `.nvmrc`
- `.husky/pre-commit`
- `src/cli.ts`
- `src/cli/router.ts`
- `src/utils/logger.ts` (consola wrapper — adopted from reference repo)
- `tests/smoke.test.ts`
- `.github/workflows/ci.yml`

**Modify:** none (greenfield)

**Delete:** none

## Implementation Steps

1. **Tạo `package.json`** với name `jss-devtools`, bin `./dist/cli/cli.js`, engines `>=24.0.0`, type `module`, scripts (`dev`, `build`, `test`, `lint`, `typecheck`, `release`, `prepare: "husky"`), `lint-staged` config (biome cho TS, prettier-package-json cho package.json).
2. **Tạo `tsconfig.json`** với strict + ESM + `target: ES2024` + `module: NodeNext` + `moduleResolution: NodeNext` + path alias `@/*` → `./src/*`.
3. **Tạo `tsup.config.ts`** theo snippet trong `plan.md` §2 — output `dist/cli/cli.js`, banner shebang, external tất cả runtime deps.
4. **Tạo `vitest.config.ts`** với Node env, single-thread cho MVP.
5. **Tạo `biome.json`** basic config (indent 2 spaces, lineWidth 120, semi true, singleQuote true).
6. **Tạo dotfiles**: `.npmrc` (engine-strict + strict-peer-deps + auto-install-peers=false), `.gitignore` (Node + dist + .env), `.npmignore` (src/ tests/ docs/), `.editorconfig`, `.nvmrc` (`24`).
7. **Tạo `.husky/pre-commit`** với `pnpm dlx lint-staged`.
8. **Tạo bin entry** `src/cli.ts` import router và gọi `runMain`.
9. **Tạo router** `src/cli/router.ts` với citty `defineCommand` cho version + default help, dùng `@/utils/logger` thay vì `console.log`.
10. **Tạo logger wrapper** `src/utils/logger.ts` — consola API wrapper (info/warn/error/success/box/start/ready/raw). Pattern adopted từ reference repo.
11. **Tạo smoke test** `tests/smoke.test.ts` exec bin và assert version output. Skip test cho no-args default hint (consola async stdout race với vitest forks pool).
12. **Tạo CI workflow** `.github/workflows/ci.yml` với jobs: lint → typecheck → build → test, chạy trên Node 24.
13. **Install + verify**: `pnpm install` (triggers `husky` prepare hook), `pnpm build`, `pnpm test`, smoke exec `node dist/cli/cli.js --help`.

## Success Criteria

- [ ] `pnpm install` chạy sạch, lockfile `pnpm-lock.yaml` được generate.
- [ ] `pnpm build` produce `dist/cli/cli.js` với shebang `#!/usr/bin/env node` ở dòng đầu.
- [ ] `node dist/cli/cli.js --help` in citty-generated help.
- [ ] `node dist/cli/cli.js --version` in version từ `package.json`.
- [ ] `pnpm test` chạy smoke test pass.
- [ ] `pnpm lint` (biome check) pass với zero errors.
- [ ] `pnpm typecheck` (tsc --noEmit) pass với zero errors.
- [ ] CI workflow syntax valid (yaml + github actions schema).

## Risk Assessment

| Risk | Mitigation |
|---|---|
| pnpm + tsup + TS NodeNext có edge case | Test build ngay sau khi setup; verify ESM resolution |
| citty API mismatch version | Pin `citty ^0.2.1` và verify `--help` output format |
| Biome config quá strict fail | Start với default recommended, iterate nếu cần |
| CI Node 24 chưa available | Pin `node-version: '24'`; fallback `'lts/*'` nếu fail |
| Shebang bị mất khi bundle | `banner: { js: '#!/usr/bin/env node' }` trong tsup config — verified |
