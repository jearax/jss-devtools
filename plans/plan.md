# Plan — `jss-devtools` (CLI SDK cá nhân)

## Overview

Complete SDK-style JavaScript stack dev-tools CLI, distributed publicly on npm as `jss-devtools` với bin `jss-devtools`. Inspired by Docker's command-tree UX (subcommands + per-subcommand `--help`).

## Context

Repo hiện chỉ có README + 6 docs ở `docs/`. Chưa có `package.json`, source code, hay CI. Mục tiêu plan:

1. Chốt các open decisions đã đề cập trong docs (build tool, package manager, CLI theme, CI/release tooling).
2. Định nghĩa stack chuẩn đủ để ship MVP `0.1.0` lên npm public registry.
3. Lên kế hoạch phased implementation, mỗi phase shippable.

Audience: JS/TS dev. Distribution: npm public. Deployment (optional): dokploy cho landing/docs.

Theo yêu cầu: bỏ qua LICENSE trong plan này (internal tạm).

## Phase Index

| # | Phase | Status | Effort | Dependencies |
|---|---|---|---|---|
| 0 | [Bootstrap Foundation](./phase-00-bootstrap.md) | completed | 3h | — |
| 1 | [Core CLI Infrastructure](./phase-01-core-cli-infrastructure.md) | completed | 2h | 0 |
| 2 | [CLI Self-Management](./phase-02-cli-self-management.md) | completed | 5h | 1 |
| 3 | [Scaffold System](./phase-03-scaffold-system.md) | pending | 4h | 2 |
| 4 | [Polish + CI/CD Pipeline](./phase-04-polish-publish.md) | pending | 3h | 3 |

## Phase 2 Pivot (architectural note)

Phase 2 redesigned từ "manage project's deps" sang **CLI self-management** (4 commands: `update`/`upgrade`/`downgrade`/`uninstall` của chính CLI itself).

Lý do pivot:
- PM là source of truth cho install/uninstall — CLI không nên bypass bằng cách modify `package.json` trực tiếp
- Self-management qua PM commands: `pnpm add -g`, `npm install -g`, etc.
- Project deps management vẫn useful (npm-check, lerna exist) nhưng là use case khác, không phải MVP scope
- Có thể revisit Phase 7+ nếu sau này muốn thêm

Pattern: detect PM → query registry → propose → confirm → exec PM command.

## Subcommand Depth Strategy

- **Citty** hỗ trợ recursive `subCommands` → multi-level (1+ levels) tự nhiên.
- **Hiện tại (Phase 1+2):** flat commands (`version`, `help`, `ls`, `update`, `upgrade`, `downgrade`). Đơn giản, không cần group.
- **Phase 3:** `scaffold init` (2-level) — chỉ chỗ cần depth > 1.
- **Phase 5+:** Plugin system (nếu có) có thể cần `plugin <name> <action>` (3-level).
- **Reference:** Docker CLI dùng pattern `<object> <action>` (2-level). Không cần copy y nguyên — chỉ inspiration. Nếu sau này commands nhiều, có thể refactor sang grouped style.

Best practice: dùng depth tối thiểu cần thiết. Don't nest unless it improves UX.

## Stack Decisions (chốt)

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js v24 LTS | [docs/code-standards.md](../docs/code-standards.md) |
| Language | TypeScript (strict + ESM) | [docs/code-standards.md](../docs/code-standards.md) |
| Package manager | **pnpm** | 12x faster clean install, strict deps, no Bun lock-in |
| Build / bundler | **tsup** | Zero-config cho CLI bin, API-compatible với tsdown (migration path) |
| CLI arg parser | **citty** | Zero-dep, native `util.parseArgs`, lazy loading |
| Interactive prompts | **@clack/prompts** | Meta pick 2024-2026, opinionated components |
| Logger / output | **consola** | Levels + scoped loggers + box built-in (Nuxt/Vite ecosystem) |
| ASCII banner | **figlet** | Classic, lightweight, optional welcome |
| Linter / formatter | **ESLint + Prettier** | Revised từ Biome (2026-08-21) — align reference repo; ESLint latest không pin version |
| Test framework | **Vitest** | [docs/code-standards.md](../docs/code-standards.md) |
| CI provider | **GitHub Actions** | Standard for npm packages |
| Release tooling | **changesets** | User prior knowledge, PR-based changelog |
| Deployment (hosting) | **dokploy** (đã có) | For landing/docs only, CLI distributed via npm |

## Reference Repo Insights (chỉ tham khảo, không require)

Reference `/Users/tandm/Documents/jjuidev/npm/jss-cli` (cùng package name) — patterns đã adopt:

- ✅ Adoptted: `citty`, `@clack/prompts`, `figlet`, `consola` (thay `picocolors`), `nypm`, `pathe`, `execa`, `rimraf`, `tsc-alias`, `husky` + `lint-staged` + `prettier-package-json` (revised từ skip → adopt), path alias `@/*` → `./src/*`.
- ❌ Override: Bun runtime → pnpm.
- 🔄 Revised 2026-08-21: linter Biome → **ESLint + Prettier** (align reference; dep names lấy từ reference, version latest). Giữ `prettier-package-json` cho package.json key sorting. Code style theo reference: tabs, no-semi, no-trailing-comma.
- ➕ Cùng ngày: add 4 core plugins theo jss-cli history rules — `eslint-plugin-import-x` (thay `eslint-plugin-import` vì bản gốc không peer ESLint 10; fork giữ nguyên rules, prefix `import-x/`), `eslint-plugin-autofix`, `eslint-plugin-prefer-arrow-functions`, `eslint-plugin-prettier`. Rules port từ commit `89d4bf1` của jss-cli.
- 🤔 Cân nhắc: Custom `build.ts` (Bun.build API) → educational alternative cho tsup.

## Knowledge Notes — `package.json` fields chuẩn npm publishing

### `peerDependencies` — chỉ cho plugin pattern

`jss-devtools` là CLI standalone, không phải plugin → KHÔNG dùng. Behavior đổi giữa npm v3-6 (không auto-install) vs v7+ (auto-install). pnpm v7+ ngược lại npm: không auto.

SemVer range syntax: `^1.2.3` (compatible), `~1.2.3` (approx), `>=1.2.3`, `1.x`, `1.2.x`, `*`, `1.2.3 || 2.0.0`, git URLs, file paths. Best practice: broad range (`^1.0`) cho peer deps.

### `peerDependenciesMeta` — chỉ khi cần mark peer optional

`"optional": true` trong `peerDependenciesMeta` override npm v7+ auto-install behavior. Dùng cho plugin scenario (VD: jss-devtools plugin có peer optional `@clack/prompts`).

### `files` — whitelist files ship

Default `["*"]`. Luôn auto-include: `package.json`, `README`, `LICENSE`, `CHANGELOG`. `.gitignore` root + `.npmignore` root KHÔNG override `files`; `.npmignore` subdir CÓ override.

Cho `jss-devtools`: `"files": ["dist"]` (package.json + README đã auto-included).

### `sideEffects` — tree-shaking hint

- `false` → toàn bộ pure, an toàn prune.
- `true` → mặt định, no aggressive tree-shake.
- Array of globs → mark files có side effects (CSS, polyfills).

Pitfall #1: CSS imports bị drop nếu `sideEffects: false`. Fix: thêm `"**/*.css"`.

Cho `jss-devtools`: `"sideEffects": false` (code pure, bonus cho future lib consumers).

### `exports` — encapsulation + conditional

Khi define: subpath không listed → `ERR_PACKAGE_PATH_NOT_EXPORTED`. Wildcard `*` là string replacement, không glob.

Condition priority: `node-addons` > `node` > `import`/`require` > `module-sync` > `default`. `"types"` phải TRƯỚC `"import"`/`"require"`.

Cho `jss-devtools` MVP: KHÔNG dùng `exports` (chỉ bin entry). Add khi Phase 5+ expose programmatic API.

## Repo Layout (target)

```
jss-cli/
├── .github/workflows/
│   ├── ci.yml                       # Phase 0
│   └── release.yml                  # Phase 4
├── .changeset/                      # Phase 4
│   └── config.json
├── chat2k/                          # learning knowledge (separate from plans)
├── docs/                            # project docs (existing)
├── plans/                           # planning artifacts (this file)
│   ├── plan.md
│   └── phase-NN-*.md
├── src/
│   ├── bin/jss-devtools.ts          # Phase 0
│   ├── cli/
│   │   ├── router.ts                # Phase 0-2
│   │   └── help.ts                  # Phase 1
│   ├── utils/                       # Phase 1+
│   │   ├── logger.ts
│   │   ├── banner.ts
│   │   └── constants.ts
│   ├── commands/                    # Phase 1-3
│   ├── core/                        # Phase 2-3
│   └── index.ts
├── tests/                           # all phases
├── eslint.config.mjs                # Phase 0 (revised from biome.json, 2026-08-21)
├── .prettierrc.json                 # Phase 0 (added with ESLint migration)
├── package.json                     # Phase 0+4
├── pnpm-lock.yaml
├── tsconfig.json                    # Phase 0
├── tsup.config.ts                   # Phase 0
├── vitest.config.ts                 # Phase 0
├── .npmrc, .gitignore, .npmignore,
│   .editorconfig, .nvmrc            # Phase 0
└── README.md
```

## Verification Plan (sau mỗi phase)

1. `pnpm install` không warning/l�i.
2. `pnpm lint` (`eslint .`) pass.
3. `pnpm typecheck` (tsc --noEmit) pass.
4. `pnpm test` (vitest run) pass.
5. `pnpm build` (tsup) tạo dist/ với shebang đúng.
6. `node dist/cli/cli.js --help` in help đúng.
7. `node dist/cli/cli.js --version` in version đúng.
8. CI xanh.

## Open Decisions

Tất cả đã chốt. License deferred (bỏ qua internal tạm).

## Unresolved Questions

Không có.

## Notes cho Implementer

- `package.json`: `"type": "module"` (ESM), `bin: { "jss-devtools": "./dist/cli/cli.js" }`, `engines.node: ">=24.0.0"`.
- tsup config: `banner: { js: '#!/usr/bin/env node' }` để preserve shebang.
- `@clack/prompts` cần TTY detection — không trigger trong CI.
- consola: `import consola from 'consola'` default import. Wrap trong `src/utils/logger.ts`.
- Vitest: `environment: 'node'`, `pool: 'threads'`.
- ESLint flat config `eslint.config.mjs` + `.prettierrc.json` (tabs, `semi: false`, singleQuote, `trailingComma: none`, printWidth 120).
- Changesets: `.changeset/config.json` với `changelog: "@changesets/cli/changelog"`, `baseBranch: "main"`.
