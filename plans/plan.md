# Plan — `jss-devtools` (CLI SDK cá nhân)

## Context

Repo `jss-devtools` hiện chỉ có README + 6 file docs ở `docs/`. Chưa có `package.json`, chưa có source code, chưa có CI. Mục tiêu của plan này là:

1. Chốt các **open decisions** đã được đề cập trong docs (build tool, package manager, CLI theme, CI/release tooling).
2. Định nghĩa **stack chuẩn** đủ để ship MVP `0.1.0` lên npm public registry.
3. Lên kế hoạch **phased implementation** có thể execute tuần tự, mỗi phase đều shippable.

Repo phục vụ audience là JS/TS dev, phân phối qua npm public với bin `jss-devtools`. Owner `jjuidev`, org `jearax`. Deployment vật lý thông qua **dokploy** (đã có s�n), nhưng distribution chính của CLI là **npm publish** — dokploy chỉ host landing page / docs site nếu cần.

Theo yêu cầu: bỏ qua LICENSE trong plan này (internal tạm).

---

## Reference Repo Insights (chỉ tham khảo, không require)

Reference repo `/Users/tandm/Documents/jjuidev/npm/jss-cli` (cùng package name `jss-devtools`) có một số pattern đáng học:

| Pattern từ reference | Có adopt không | Ghi chú |
|---|---|---|
| `citty` cho routing | ✅ Adoptted | match với plan |
| `@clack/prompts` cho interactive | ✅ Adoptted | match với plan |
| `figlet` cho banner | ✅ Adoptted | match với plan |
| `consola` thay vì `picocolors` | ✅ Adoptted | consola có levels (info/warn/error/success/debug), scope loggers, box/start/ready — phù hợp hơn cho CLI SDK |
| `nypm` (any package manager detect) | ✅ Adoptted | tiện cho `update`/`upgrade` commands detect pm của target project |
| `pathe` thay vì `node:path` | ✅ Adoptted | cross-platform path utils (đặc biệt Windows compat) |
| `execa` cho child process | ✅ Adoptted | promise-based exec, cross-platform |
| `rimraf` cross-platform rm | ✅ Adoptted | devDep |
| `tsc-alias` cho path alias resolution | ✅ Adoptted | devDep, để `@/*` → `src/*` work trong dist |
| Path alias `@/*` → `./src/*` | ✅ Adoptted | cleaner imports |
| `moduleResolution: "bundler"` | ❌ Override | dùng `NodeNext` để khớp với Node 24 ESM runtime |
| Bun runtime + custom build | � Override | dùng pnpm + tsup (match với plan gốc) |
| ESLint + Prettier | ❌ Override | dùng Biome basic (theo yêu cầu user) |
| Husky + lint-staged | ❌ Skip | YAGNI cho MVP |
| Custom `build.ts` script (Bun.build API) | � Cân nhắc | có thể thay tsup bằng custom `scripts/build.ts` chạy qua `tsx` nếu muốn educational value |

**Lưu ý quan trọng:** user nói rõ "không trust, không require, chỉ refs" — tất cả deps ở trên được chọn vì pattern hợp lý, không phải vì reference dùng.

---

## Stack Decisions (đã research, đã chốt)

### 1. Package Manager — **pnpm**

| Tiêu chí | npm | pnpm | Yarn Berry | Bun |
|---|---|---|---|---|
| Install sạch (no cache) | 55.4s | **4.6s** | 2.7s | 3.6s |
| Warm cache + lockfile | 1.9s | **580ms** | — | 743ms |
| Content-addressable store | ❌ | ✅ | ✅ (opt-in) | ✅ |
| Phantom deps prevention (strict) | ❌ | ✅ mặc định | opt-in | ❌ |
| Build script security | ❌ | ✅ mặc định | ❌ | ❌ (default) |
| Lockfile format | `package-lock.json` | `pnpm-lock.yaml` | `yarn.lock` | `bun.lock` |
| Maturity | stable | stable | stable | evolving |

**Quyết định: pnpm.**

Lý do:
- User đã lean pnpm từ docs ban đầu.
- Strict mode (no phantom deps) quan trọng cho SDK — nếu code reference package không khai báo, fail ngay tại install.
- Content-addressable store tiết kiệm disk khi dev nhiều project song song.
- Tương thích tốt với `engines.node: ">=24.0.0"` (Node 24 LTS), không cần Bun runtime.
- Không cần zero-installs (PnP) của Yarn vì CLI này đơn giản, không có use case offline-cold-start.

**Loại:** Bun vì lifecycle scripts mặc định bị tắt (cần `trustedDependencies`) → friction không cần thiết với một CLI SDK.
**Loại:** Yarn Berry vì PnP gây friction với nhiều package phổ biến (jest, vitest native binaries) và ecosystem hiện tại vẫn chuẩn hoá quanh `node_modules`.

Cấu hình `.npmrc` tối thiểu:
```
engine-strict=true
strict-peer-dependencies=true
auto-install-peers=false
```

### 2. Build / Bundler — **tsup** (primary) với migration path sang **tsdown**

| Tiêu chí | tsup | tsdown | esbuild raw | rollup | vite lib | bun build |
|---|---|---|---|---|---|---|
| Stars | 11.3k | mới (RC 0.23) | n/a (engine) | n/a (engine) | n/a (engine) | n/a (engine) |
| Engine | esbuild | rolldown (Rust) | esbuild | rollup | rollup | esbuild |
| Bundle CLI bin | ✅ first-class | ✅ API-compatible | manual config | manual | overkill | ✅ |
| Shebang preservation | ✅ | ✅ | manual | manual | manual | manual |
| Default config DX | zero-config | zero-config | low-level | low-level | medium | medium |
| Production stable | ✅ (de facto) | RC | ✅ | ✅ | ✅ | ✅ |
| Maintenance note | README nói "consider tsdown" | active | active | active | active | active |

**Quyết định: tsup cho MVP, plan migration sang tsdown khi tsdown 1.0.**

Lý do:
- tsup đã chứng minh �n định cho hàng nghìn CLI bin, zero-config đủ cho use case MVP.
- tsup và tsdown dùng chung API surface (CLI flags + config keys), migration sau này chỉ đổi package name.
- tsdown đang RC 0.23 — không nên để personal project dựa vào RC cho MVP, nhưng đáng theo dõi vì nó là bundler chính của **Vite 8+** (rolldown Rust engine, nhanh hơn esbuild trên bundle lớn).
- esbuild raw cần config quá nhiều thứ tự (shebang, externals, banner, format) → trùng lặp với những gì tsup/tsdown đã có sẵn.
- rollup quá flexible nhưng config overhead cho CLI bin là overkill.
- vite lib mode không phải primary use case, không tối ưu cho `bin`.
- bun build yêu cầu Bun runtime trong CI → conflict với Node 24 baseline.

`tsup.config.ts` đề xuất:
```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/bin/jss-devtools.ts'],
  outDir: 'dist/cli',
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  clean: true,
  banner: { js: '#!/usr/bin/env node' },
  dts: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  // External tất cả deps để install size không bloat (consola, clack, citty... đều resolve qua npm)
  external: ['@clack/prompts', 'citty', 'consola', 'execa', 'figlet', 'nypm', 'pathe'],
})
```

**Bin path output:** `dist/cli/cli.js` (match với reference pattern). `package.json` khai báo:
```jsonc
"bin": { "jss-devtools": "./dist/cli/cli.js" }
```

**Alternative: custom `scripts/build.ts`** (tham khảo từ reference) — nếu user muốn educational value, có thể thay tsup bằng ~80-line custom script chạy qua `tsx`/`node --experimental-strip-types` (Node 24 native TS). �u điểm: hiểu sâu bundling pipeline. Nhược: maintain nhiều hơn.

Khi `tsdown` reach 1.0 stable, swap `tsup` → `tsdown` (drop-in replacement).

### 3. CLI Argument Parser — **citty**

| Tiêu chí | commander | citty | yargs |
|---|---|---|---|
| Stars | 28.4k | 1.3k | 13k+ |
| Maintainer | tj | unjs (Nuxt team) | yargs maintainers |
| Zero-dependency | ❌ | ✅ (dùng native `util.parseArgs`) | � |
| ESM-first | ✅ | ✅ | ✅ (since v17) |
| Nested subcommands | ✅ | ✅ + lazy loading | ✅ |
| Auto-generated usage | basic | ✅ | basic |
| Bundle size khi bundled | medium | tiny | lớn |
| API style | OOP `program.command()` | Declarative defineCommand | builder/handler |

**Quyết định: citty.**

Lý do:
- Zero-dependency + native `util.parseArgs` → bundle nhỏ, khớp với triết lý SDK.
- Lazy loading subcommands quan trọng cho CLI có nhiều lệnh (Docker-style tree).
- Declarative API dễ đọc và snapshot-test `--help` output.
- Được maintain b�i unjs — cùng ecosystem với nhiều tool hiện đại (nuxi, giget, jiti).
- commander là "boring pick" nhưng nặng hơn về bundle size và thiếu lazy-loading native.

Fallback: nếu cần richer flag parser (custom coercion phức tạp), có thể kết hợp `citty` cho routing + `commander` cho per-command parsing. Không cần cho MVP.

### 4. CLI Theme / UX — **@clack/prompts** + **consola** + **figlet** (banner only)

| Thư viện | Vai trò | Stars | Tại sao |
|---|---|---|---|
| `@clack/prompts` | Interactive prompts (text, confirm, select, multiselect, spinner, password, groupMultiSelect) | 8k+ | Meta pick 2024-2026, opinionated components, dùng bởi create-vite, create-nuxt, shadcn-ui |
| `consola` | Structured logging (info/warn/error/success/debug), scoped loggers, box/start/ready tags | n/a (tiny) | Được dùng bởi Nuxt/Vite ecosystem, có levels + tags tiện cho CLI SDK |
| `figlet` | ASCII banner (splash khi `jss-devtools --version` hoặc `welcome` lệnh) | 3k+ | Cổ điển, lightweight, 150+ fonts |

**Quyết định:**
- `@clack/prompts` cho mọi interactive flow (chỉ trigger khi không có `--json` và không phải CI).
- `consola` cho tất cả output (thay thế `picocolors` + `console.log`). Có sẵn `success`/`info`/`warn`/`error`/`box`/`start`/`ready`. Wrap trong `src/utils/logger.ts` để consistent API.

**Tại sao đổi từ `picocolors` sang `consola`:** tham khảo từ reference cho thấy consola tiện hơn cho CLI SDK vì có levels + scoped loggers + box formatting built-in. Bundle size lớn hơn picocolors (~15KB vs ~2KB) nhưng acceptable cho CLI dev tool.
- `figlet` chỉ dùng cho welcome banner ở `--version` đầu tiên hoặc `jss-devtools welcome` (optional, không bật mặc định nếu output là JSON).

**Không chọn:** `ink` (React-based TUI) — quá nặng cho một SDK CLI, chỉ nên dùng nếu cần TUI mode (Phase 5+ roadmap).

**Không chọn:** `inquirer` — superseded bởi `@clack/prompts` cho trải nghiệm modern CLI.

**Không chọn:** `chalk` / `picocolors` standalone — `consola` đã có color support internal.

### 5. Linter / Formatter — **Biome**

| Tiêu chí | Biome | ESLint + Prettier |
|---|---|---|
| Tool count | 1 binary | 2 binaries + plugins |
| Speed | ~10x ESLint | baseline |
| TS-first | ✅ | ✅ qua plugin |
| Zero config | ✅ (default sane) | ❌ |
| Bundle size in CLI | nhỏ | lớn |

**Quyết định: Biome** — single binary, faster, không cần plugin hunting.

### 6. Test Framework — **Vitest** (đã chốt trong docs)

Vitest đã được lock trong `docs/code-standards.md` và `docs/project-overview-pdr.md`. Không thay đổi.

### 7. CI / Release — **GitHub Actions + changesets**

| Tiêu chí | changesets | release-please |
|---|---|---|
| Workflow | Declarative PR-based changesets files | Conventional commits → auto PR |
| Monorepo | ✅ first-class | ✅ |
| Solo single-package | works (overhead nhỏ) | ✅ simpler |
| GitHub-only | ❌ (works với nhiều git host) | ✅ |
| Changelog quality | ✅ per-package entries | ✅ auto từ commits |
| npm publish integration | ✅ qua `changesets/action` | ✅ qua `release-please-action` |
| User familiarity | ✅ user đã biết | — |

**Quyết định: changesets.**

Lý do:
- User đã có prior knowledge với changesets → giảm learning curve.
- Workflow khai báo (changeset file per PR) dễ review và rollback.
- Compatible với GitHub Actions + npm publish + provenance.
- release-please dựa hoàn toàn vào commit message convention → kém linh hoạt hơn khi cần manual override.

CI matrix jobs (đề xuất):
```
- lint:       biome check
- typecheck:  tsc --noEmit
- test:       vitest run --coverage
- build:      pnpm build (tsup)
- pack:       npm pack --dry-run (verify files)
- release:    changesets/action (bump + publish khi push vào main)
```

### 8. Runtime & Distribution

- **Runtime:** Node.js v24 LTS (`engines.node: ">=24.0.0"`) — đã lock.
- **Distribution:** npm public registry (`registry.npmjs.org`).
- **Provenance:** bật `--provenance` trong `npm publish` (cần OIDC từ GitHub Actions).
- **Deployment (dokploy):** dùng để host:
  - Landing page (optional, static site Next.js hoặc Astro).
  - Documentation site (optional, Mintlify hoặc tự host).
  - **Không** host CLI binary — CLI phân phối qua npm.

---

## Knowledge Notes — `package.json` fields chuẩn npm publishing

Phần này note lại kiến thức nền về 5 fields quan trọng trong `package.json` cho SDK publish lên npm. Áp dụng cho `jss-devtools` và bất kỳ CLI/library package nào.

### 1. `peerDependencies`

**Định nghĩa (npm docs):** declare **compatibility** với host package mà KHÔNG hard-require nó. Package của bạn là **plugin/add-on** cho host.

**Khi nào dùng:**
- Package của bạn là plugin cho một host cụ thể (VD: `eslint-plugin-react` peer-deps `eslint`).
- Bạn muốn **tránh duplicate install** host package trong cây dependency.

**Khi KHÔNG dùng cho `jss-devtools`:**
- `jss-devtools` là **CLI standalone**, không phải plugin. Tất cả deps (`citty`, `consola`, `figlet`, etc.) là **runtime deps**, dùng `dependencies` không phải `peerDependencies`.
- Nếu sau này có **plugin system** (Phase 5+), plugins của `jss-devtools` sẽ peer-dep `jss-devtools`.

**Behavior change quan trọng:**
- npm v3-6: peer deps **không tự install**, warning nếu thiếu.
- npm v7+ (2021+): peer deps **tự động install**.
- pnpm v7+: mặc định **KHÔNG** tự install (cần `auto-install-peers=true` trong `.npmrc`).

**SemVer range (npm spec):**

| Range | Meaning |
|---|---|
| `1.2.3` | Exact match |
| `^1.2.3` | Compatible (>=1.2.3 <2.0.0) |
| `~1.2.3` | Approximately (>=1.2.3 <1.3.0) |
| `>=1.2.3` | Greater or equal |
| `1.x` / `1.2.x` | Wildcard minor/patch |
| `*` | Any version |
| `1.2.3 \|\| 2.0.0` | Either |
| `git+https://...` | Git URL |
| `user/repo` | GitHub shorthand |
| `file:./local/path` | Local path |

Best practice: dùng **broad range** (`^1.0` hoặc `1.x`) cho peer deps — chỉ major version mới được break plugin contract.

**Example cho plugin tương lai:**
```jsonc
{
  "name": "jss-devtools-plugin-tailwind",
  "peerDependencies": {
    "jss-devtools": "^1.0.0"  // broad range
  }
}
```

### 2. `peerDependenciesMeta`

**Định nghĩa (npm docs):** cung cấp metadata cho peer deps. Primary use case: **mark peer dep là optional**.

**Key flag: `"optional": true`** — npm sẽ KHÔNG tự install peer đó, không warning khi thiếu.

**Tại sao cần `peerDependenciesMeta` thay vì mark optional trực tiếp trong `peerDependencies`:**
- Từ npm v7+, peer deps tự động install. Nếu muốn opt-out cho một peer cụ thể, **chỉ có `peerDependenciesMeta` mới override được**.

**Example pattern (plugin scenario):**
```jsonc
{
  "peerDependencies": {
    "jss-devtools": "^1.0.0",   // required, auto-installed
    "@clack/prompts": "^1.0.0"   // optional, không auto-install
  },
  "peerDependenciesMeta": {
    "@clack/prompts": {
      "optional": true
    }
  }
}
```

**Áp dụng cho `jss-devtools`:** không cần trong MVP (CLI standalone). Documented để reference khi build plugin system sau.

### 3. `files`

**Định nghĩa (npm docs):** array các file patterns **bao gồm** khi publish lên npm tarball. Default `["*"]` (mọi file).

**Quy tắc luôn luôn include** (kể cả khi không list):
- `package.json`
- `README` (any extension)
- `LICENSE` / `LICENSE.md`
- `CHANGELOG` / `CHANGELOG.md` (nếu có)

**`.gitignore` vs `.npmignore` vs `files`:**
- `.gitignore` (root): **không override** `files` field.
- `.npmignore` (root): **không override** `files` field.
- `.npmignore` (subdirectory): **override** `files` cho subdirectory đó.
- Nếu cả `.gitignore` và `.npmignore` đều có, `.npmignore` thắng.

**Pattern syntax:** giống `.gitignore` (inverted — match = include).

**Recommended pattern cho `jss-devtools`:**
```jsonc
{
  "files": ["dist"]  // chỉ dist (đã bao gồm CLI bundle + types)
}
```
Vì `package.json`, `README.md` đã auto-included, chỉ cần list `dist` là đủ.

**Verify bằng:** `pnpm pack --dry-run` (xem danh sách files sẽ ship).

### 4. `sideEffects` (Tree Shaking optimization)

**Định nghĩa:** khai báo modules có **side effects** (code chạy khi import ngoài việc expose exports). Bundlers dùng để **tree-shake** (loại bỏ unused exports/modules).

**Side effects là gì:** polyfills modify global, CSS imports apply styles, register event listeners, modify prototype.

**3 giá trị:**
- `false` — toàn bộ package **không có side effects** → an toàn prune unused exports.
- `true` — mặc định; bundler KHÔNG tree-shake aggressively.
- Array of glob patterns — chỉ rõ những file CÓ side effects, phần còn lại tree-shake được.

**Ví dụ:**
```jsonc
// Toàn bộ safe
{ "sideEffects": false }

// Mark chỉ CSS là side-effect
{
  "sideEffects": [
    "**/*.css",
    "./src/polyfill.js"
  ]
}
```

**Tích hợp bundler:**

| Bundler | Support |
|---|---|
| webpack 5+ | ✅ đọc `sideEffects` |
| rollup | ✅ popularized concept |
| esbuild | ✅ đọc `sideEffects` |
| tsup | ✅ (passthrough) |

**Common pitfalls:**
1. **CSS imports bị drop** nếu `sideEffects: false` mà có `import './style.css'`. Fix: thêm `"**/*.css"` vào array.
2. **Polyfills modify global** bị prune → app crash. Fix: mark file polyfill trong `sideEffects`.
3. **Re-exports có side effect** (VD `import './polyfill'; export * from './x'`) bị skip nếu không mark.
4. **Nested deps** sai `sideEffects` → tree-shake sai cho cả cây. Hard to debug, chỉ lộ trong production.
5. **Tree-shake chỉ full activate trong production mode** (minify enabled).

**Pure annotations (extra hint cho bundler):**
```ts
// Function call marked pure — safe to drop if result unused
/*#__PURE__*/ double(55)

// Function declaration marked no-side-effect
/*#__NO_SIDE_EFFECTS__*/
export function createLogger(prefix) {
  return (msg) => console.log(`[${prefix}] ${msg}`)
}
```

**Áp dụng cho `jss-devtools`:** vì CLI bin không bị tree-shake (user `npm i -g` rồi chạy trực tiếp), `sideEffects` không critical. Tuy nhiên, nếu expose programmatic API trong tương lai (`require('jss-devtools/utils/...')`), set `"sideEffects": false` để library consumers được tree-shake. Cho MVP, đặt `"sideEffects": false` vì code đã side-effect-free.

### 5. `exports` (Conditional exports + tree shaking)

**Định nghĩa (Node.js docs):** define **public entry points** cho package. **Override `"main"`** khi cả hai define.

**Key behavior:**
- Khi `"exports"` define, **mọi subpath không listed sẽ throw `ERR_PACKAGE_PATH_NOT_EXPORTED`**. Encapsulation: ẩn internal modules khỏi consumer.
- Subpath chỉ resolved nếu khớp pattern trong `exports`.

**Condition priority (most specific first):**
1. `"node-addons"` — native C++ addons
2. `"node"` — Node.js environment
3. `"import"` — `import` statement (mutually exclusive với `"require"`)
4. `"require"` — `require()` (CommonJS)
5. `"module-sync"` — ESM không có top-level await (sync-only)
6. `"default"` — fallback (LUÔN LUÔN CUỐI CÙNG)

**Subpath patterns:**
```jsonc
{
  "exports": {
    ".": "./index.js",                    // root
    "./feature": "./feature/index.js",    // explicit subpath
    "./feature/*.js": "./src/feature/*.js", // wildcard
    "./internal/*": null                  // null = block
  }
}
```

**Wildcard `*`** là string replacement, không phải glob:
```js
import x from 'pkg/features/x.js'
// → resolves to ./node_modules/pkg/src/features/x.js
```

**Tree-shaking implications:**
- `"import"` condition thường enable tree-shake tốt hơn vì ESM **statically analyzable**.
- `"module-sync"` đảm bảo synchronous exports, không top-level await.
- **Named exports** tree-shake tốt hơn default exports:

```ts
// ✅ Better tree-shaking
import { something } from 'pkg'

// ❌ Có thể include cả module
import pkg from 'pkg'
```

**Real-world pattern (CLI + library hybrid):**
```jsonc
{
  "name": "jss-devtools",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/cli/index.js"
    },
    "./utils": {
      "types": "./dist/types/utils/index.d.ts",
      "import": "./dist/cli/utils/index.js"
    },
    "./package.json": "./package.json"
  },
  "bin": {
    "jss-devtools": "./dist/cli/cli.js"
  },
  "main": "./dist/cli/index.js"
}
```

**Quyết định cho `jss-devtools` MVP:**

Vì CLI MVP không expose programmatic API (theo `src/index.ts` của reference: `export {}` — no runtime surface), `exports` đơn giản:

```jsonc
{
  "type": "module",
  "bin": {
    "jss-devtools": "./dist/cli/cli.js"
  },
  "files": ["dist"]
}
```

Khi nào cần full `exports`:
- Phase 5+ khi expose programmatic API (VD `import { parseManifest } from 'jss-devtools'`).
- Khi cần types definitions cho library consumers.

**Note về types condition:** nếu có types, list `"types"` TRƯỚC `"import"`/`"require"` (TS resolution rule).

### Tổng kết — `package.json` fields cho `jss-devtools` MVP

```jsonc
{
  "name": "jss-devtools",
  "version": "0.1.0",
  "description": "JavaScript stack dev tools CLI",
  "type": "module",
  "license": "TBD",
  "bin": {
    "jss-devtools": "./dist/cli/cli.js"
  },
  "files": ["dist"],
  "sideEffects": false,          // safe vì code pure, bonus cho future lib consumers
  "engines": {
    "node": ">=24.0.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": { /* ... */ },
  "dependencies": {
    "@clack/prompts": "^1.0.1",
    "citty": "^0.2.1",
    "consola": "^3.4.2",
    "execa": "^9.6.1",
    "figlet": "^1.10.0",
    "nypm": "^0.6.5",
    "pathe": "^2.0.3"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.x",
    "@changesets/cli": "^2.x",
    "@types/figlet": "^1.x",
    "@types/node": "^22.x",
    "rimraf": "^6.x",
    "tsc-alias": "^1.x",
    "tsup": "^8.x",
    "tsx": "^4.x",
    "typescript": "^5.x",
    "vitest": "^2.x"
  }
  // peerDependencies: KHÔNG có trong MVP (CLI standalone, không phải plugin)
  // peerDependenciesMeta: KHÔNG có trong MVP
  // exports: KHÔNG có trong MVP (chỉ bin entry)
}
```

**Verify trước publish:**
```bash
pnpm pack --dry-run  # check files list
pnpm publish --dry-run  # check metadata
```

---

## Repo Layout (target)

```
jss-cli/
├── .github/
│   └── workflows/
│       ├── ci.yml             # lint + typecheck + test + build
│       └── release.yml        # changesets → npm publish
├── .changeset/
│   └── config.json
├── docs/                      # (existing) project docs
├── plans/                     # (existing) planning artifacts
├── src/
│   ├── bin/
│   │   └── jss-devtools.ts    # bin entry, sets up env
│   ├── cli/
│   │   ├── router.ts          # citty router
│   │   └── help.ts            # help rendering
│   ├── utils/
│   │   ├── logger.ts          # consola wrappers (info/warn/error/success/box/raw)
│   │   ├── banner.ts          # figlet banner với cache
│   │   ├── constants.ts       # CLI_META, default config
│   │   └── package-manager-detector.ts  # nypm wrapper (Phase 2)
│   ├── commands/
│   │   ├── version.ts
│   │   ├── ls.ts
│   │   ├── update.ts
│   │   ├── upgrade.ts
│   │   ├── downgrade.ts
│   │   └── scaffold/
│   │       └── init.ts
│   ├── core/
│   │   ├── version-resolver/
│   │   ├── registry-client/
│   │   ├── scaffold-engine/
│   │   └── config-loader/
│   ├── types/
│   │   ├── command.ts
│   │   └── package-meta.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── biome.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .gitignore
├── .npmignore
├── .npmrc
├── .editorconfig
├── .nvmrc
└── README.md
```

---

## Phased Implementation Plan

### Phase 0 — Bootstrap (current → ship foundation)

**Goal:** Repo runnable end-to-end với `pnpm install && pnpm build && node dist/cli/cli.js --help`.

**Deliverables:**
- `package.json` (name `jss-devtools`, bin `./dist/cli/cli.js`, engines `>=24.0.0`, scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `release`).
- `tsconfig.json` (strict + ESM + `target: ES2024` + `module: NodeNext` + `moduleResolution: NodeNext` + path alias `@/*` → `./src/*`).
- `tsup.config.ts` (theo snippet ở trên, output `./dist/cli/cli.js`).
- `vitest.config.ts` (Node env, single-thread cho MVP).
- `biome.json` (basic config — indent 2 spaces, lineWidth 120, semi true, singleQuote true).
- `.npmrc`, `.gitignore`, `.npmignore`, `.editorconfig`, `.nvmrc` (`24`).
- Stub `src/bin/jss-devtools.ts` + `src/cli/router.ts` với citty routing `--help` và `--version`.
- CI workflow `.github/workflows/ci.yml` (lint + typecheck + test + build trên Node 24).
- 1 smoke test cho `bin` entry.

**Runtime deps cài trong Phase 0:**
```jsonc
"dependencies": {
  "@clack/prompts": "^1.0.1",  // interactive prompts
  "citty": "^0.2.1",            // arg parser
  "consola": "^3.4.2",          // structured logger
  "execa": "^9.6.1",            // child process
  "figlet": "^1.10.0",          // ASCII banner
  "nypm": "^0.6.5",             // any-pm detection (cho update/upgrade)
  "pathe": "^2.0.3"             // cross-platform path utils
}
```

**Dev deps cài trong Phase 0:**
```jsonc
"devDependencies": {
  "@biomejs/biome": "^1.x",     // linter + formatter (basic config)
  "@changesets/cli": "^2.x",    // release tooling
  "@types/figlet": "^1.x",
  "@types/node": "^22.x",       // Node 24 baseline
  "@types/pathe": "^2.x",       // (chỉ nếu cần — pathe đã có types built-in)
  "rimraf": "^6.x",             // cross-platform rm
  "tsc-alias": "^1.x",          // resolve path aliases in dist
  "tsup": "^8.x",               // bundler
  "tsx": "^4.x",                // dev runner cho scripts/build.ts (nếu dùng custom build)
  "typescript": "^5.x",         // TypeScript
  "vitest": "^2.x"              // testing
}
```

**Exit criteria:**
- `pnpm i` chạy sạch (deps installed, lockfile `pnpm-lock.yaml` committed).
- `pnpm build` tạo `dist/cli/cli.js` có shebang.
- `node dist/cli/cli.js --help` in help.
- `node dist/cli/cli.js --version` in version.
- `pnpm test` chạy 1 test pass.
- CI xanh trên PR đầu tiên.

### Phase 1 — Core CLI Infrastructure

**Goal:** Hoàn thiện command router + theme helpers + help system.

**Deliverables:**
- `src/utils/logger.ts` — consola wrappers (`info`, `warn`, `error`, `success`, `box`, `start`, `ready`, `raw` cho ASCII art).
- `src/cli/help.ts` — citty auto-help + custom splash (figlet).
- `src/cli/router.ts` — top-level router với citty `defineCommand`.
- `src/commands/version.ts` — in version + optional figlet banner.
- `src/commands/help.ts` — pass-through tới citty help.
- Unit tests cho router + help rendering.
- Snapshot test cho `--help` output stability.

**Exit criteria:**
- Mọi subcommand accept `--help`/`-h`.
- `--json` flag hoạt động trên tất cả commands (returns JSON thay vì formatted).
- Help text ổn định qua snapshot tests.

### Phase 2 — Version Management Commands

**Goal:** MVP commands `ls`, `update`, `upgrade`, `downgrade` hoạt động end-to-end.

**Deliverables:**
- `src/core/registry-client/` — npm registry HTTP client (`/registry.npmjs.org/{pkg}` endpoints, AbortController timeout, retry).
- `src/core/version-resolver/` — semver logic với `semver` package.
- `src/commands/ls.ts` — list installed (đọc `package.json` + lockfile) + available (gọi registry).
- `src/commands/update.ts` — update packages theo semver range.
- `src/commands/upgrade.ts` — upgrade có `--major`/`--minor`/`--patch`.
- `src/commands/downgrade.ts` — downgrade tới version trước (theo range constraint).
- Integration tests với mocked registry responses.

**Exit criteria:**
- Mỗi command chạy được với `jss-devtools <cmd> [pkg]` thật trên fixture project.
- `--json` output đúng schema.
- Test coverage ≥ 80% trên `core/`.

### Phase 3 — Scaffold System

**Goal:** `jss-devtools scaffold init [preset]` hoạt động end-to-end.

**Deliverables:**
- `src/core/scaffold-engine/` — template loader (handlebars hoặc đơn giản string-replace) + writer.
- `src/core/config-loader/` — đọc `.jssrc` (nếu có) + env defaults.
- `src/commands/scaffold/init.ts` — subcommand `scaffold init <preset>`.
- 1 preset mặc định `ts-lib` (TypeScript library starter).
- Interactive flow với `@clack/prompts` cho việc chọn preset + project name.

**Exit criteria:**
- `jss-devtools scaffold init ts-lib` tạo project mới chạy được (`pnpm i && pnpm build` exit 0).
- Test coverage cho scaffold flow.

### Phase 4 — Polish + CI/CD Pipeline

**Goal:** `0.1.0` ready cho npm publish.

**Deliverables:**
- `.changeset/config.json` + workflow `.github/workflows/release.yml`.
- Provenance setup (`npm publish --provenance`).
- `files` field trong `package.json` whitelist dist artifacts.
- README updates (Quickstart, command examples, badge npm version).
- `docs/` updates (architecture diagram nếu cần).
- Tag `v0.1.0` trigger CI → publish lên npm.

**Exit criteria:**
- `npm i -g jss-devtools` chạy được trên máy sạch.
- `jss-devtools --version` in `0.1.0`.
- Tất cả MVP commands chạy đúng sau install global.

### Phase 5+ (out of scope for this plan)

- Plugin system
- Workspace / monorepo awareness
- TUI mode (Ink)
- Auto-update CLI itself
- Hooks / events surface
- Migration tsup → tsdown khi tsdown 1.0 stable

---

## Critical Files (sẽ tạo mới trong Phase 0)

- `package.json`
- `tsconfig.json`
- `tsup.config.ts`
- `vitest.config.ts`
- `biome.json`
- `.gitignore`, `.npmignore`, `.npmrc`, `.editorconfig`, `.nvmrc`
- `src/bin/jss-devtools.ts`
- `src/cli/router.ts`
- `src/utils/logger.ts`
- `src/utils/banner.ts`
- `src/utils/constants.ts`
- `src/cli/help.ts`
- `src/commands/version.ts`
- `src/commands/help.ts`
- `tests/smoke.test.ts`
- `.github/workflows/ci.yml`

---

## Verification Plan

Sau mỗi phase, verify:

1. **Local:**
   - `pnpm install` không warning/l�i.
   - `pnpm lint` (biome check) pass.
   - `pnpm typecheck` (tsc --noEmit) pass.
   - `pnpm test` (vitest run) pass.
   - `pnpm build` (tsup) tạo dist/ với shebang đúng.
   - `node dist/cli/cli.js --help` in help đúng.
   - `node dist/cli/cli.js --version` in version đúng.

2. **CI:**
   - GitHub Actions chạy matrix Node 24.x → all jobs xanh.

3. **Pack test:**
   - `pnpm pack --dry-run` review output (chỉ dist/ + README + package.json).

4. **Smoke (Phase 4):**
   - Trên máy sạch: `npm i -g jss-devtools` → `jss-devtools --help` chạy.

---

## Open Decisions đã chốt trong plan này

| Topic | Decision | Status |
|---|---|---|
| Package manager | **pnpm** | chốt |
| Build / bundler | **tsup** (với migration path sang tsdown) | chốt |
| CLI arg parser | **citty** | chốt |
| Interactive prompts | **@clack/prompts** | chốt |
| Logger / output | **consola** | chốt |
| ASCII banner | **figlet** (optional, chỉ welcome) | chốt |
| Linter / formatter | **Biome** | chốt |
| CI provider | **GitHub Actions** | chốt |
| Release tooling | **changesets** | chốt |
| Deployment (hosting) | **dokploy** (đã có, dùng cho docs/landing) | chốt |
| License | (bỏ qua — internal tạm) | deferred |
| Lint config strictness | recommended defaults | chốt |

---

## Unresolved Questions

Không có — tất cả open decisions trong docs ban đầu đã được resolve qua research trong plan này. Nếu sau Phase 0 có blocker mới (ví dụ tsup deprecated nhanh hơn dự kiến, hoặc citty thiếu feature cần thiết), sẽ mở lại trong plan tiếp theo.

---

## Notes cho Implementer

- Khi tạo `package.json`, đặt `"type": "module"` để khớp với ESM target đã chốt trong `docs/code-standards.md`.
- Khi setup `tsup`, đảm bảo banner shebang được preserve (`banner: { js: '#!/usr/bin/env node' }`).
- `@clack/prompts` cần detect TTY — không trigger prompts trong CI. Có thể dùng `is-interactive` package hoặc `process.stdout.isTTY`.
- `consola` dùng default import: `import consola from 'consola'`. Wrapper trong `src/utils/logger.ts` để consistent API và dễ swap implementation sau.
- Vitest cần config `pool: 'threads'` và `environment: 'node'` để khớp với Node 24 baseline.
- Biome cần `biome.json` với `formatter.indentStyle: "space"` và `formatter.indentWidth: 2` để khớp với TS convention.
- Changesets cần `.changeset/config.json` với `changelog: "@changesets/cli/changelog"` và base branch `main`.
