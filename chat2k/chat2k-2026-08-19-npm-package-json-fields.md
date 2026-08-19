# `package.json` Fields — peerDependencies / files / sideEffects / exports

> Ngày: 2026-08-19  
> Nguồn: docs.npmjs.com, nodejs.org/api/packages.html, webpack.js.org/guides/tree-shaking  
> Ngữ cảnh: chuẩn bị publish `jss-devtools` lên npm public

## TL;DR — Fields cần biết cho npm package

| Field | When to use |
|---|---|
| `dependencies` | Runtime deps bắt buộc (CLI: citty, consola, ...) |
| `peerDependencies` | Plugin pattern, declare host compatibility |
| `peerDependenciesMeta` | Mark peer là optional (npm v7+) |
| `files` | Whitelist files ship trong tarball |
| `sideEffects` | Tree-shaking hint cho bundlers |
| `exports` | Encapsulation + conditional exports |
| `bin` | CLI binary entry |
| `engines` | Runtime version requirement |
| `publishConfig` | Registry/access config |

## 1. `peerDependencies`

**Định nghĩa (npm docs):** declare compatibility với host package. **KHÔNG hard-require** — dùng cho plugin pattern.

**Khi nào dùng:**
- Package là **plugin/add-on** cho host (VD: `eslint-plugin-react` peer-deps `eslint`).
- Tránh duplicate install host.

**Khi KHÔNG dùng cho `jss-devtools`:**
- `jss-devtools` là **CLI standalone**, không phải plugin.
- Tất cả deps dùng `dependencies`, không peer.

**Behavior changes giữa các npm versions:**

| npm version | Auto-install peers? |
|---|---|
| v3-6 | � Không (warning nếu thiếu) |
| v7+ (2021+) | ✅ Có (mặc định) |
| pnpm v7+ | � Không (cần `auto-install-peers=true`) |
| bun | ❌ Không (cần explicit) |

**SemVer range syntax (npm spec):**

| Range | Meaning |
|---|---|
| `1.2.3` | Exact |
| `^1.2.3` | >=1.2.3 <2.0.0 |
| `~1.2.3` | >=1.2.3 <1.3.0 |
| `>=1.2.3` | Greater or equal |
| `1.x` / `1.2.x` | Wildcard |
| `*` | Any |
| `1.2.3 \|\| 2.0.0` | Either |
| `git+https://...` | Git URL |
| `user/repo` | GitHub shorthand |
| `file:./local` | Local path |

**Best practice:** dùng **broad range** (`^1.0` hoặc `1.x`) — chỉ major version mới break plugin contract.

**Example (future plugin):**
```jsonc
{
  "name": "jss-devtools-plugin-tailwind",
  "peerDependencies": {
    "jss-devtools": "^1.0.0"
  }
}
```

## 2. `peerDependenciesMeta`

**Định nghĩa:** metadata cho peer deps. Primary use: **mark peer là optional**.

**Key flag: `"optional": true`** — npm KHÔNG auto-install peer đó, không warning khi thiếu.

**Tại sao cần:**
- npm v7+ auto-install peers. Nếu muốn opt-out cho 1 peer cụ thể, **chỉ `peerDependenciesMeta` mới override được**.

**Example (plugin với optional integrations):**
```jsonc
{
  "peerDependencies": {
    "jss-devtools": "^1.0.0",        // required, auto-installed
    "@clack/prompts": "^1.0.0"        // optional, không auto-install
  },
  "peerDependenciesMeta": {
    "@clack/prompts": {
      "optional": true
    }
  }
}
```

**Áp dụng cho `jss-devtools`:** không cần trong MVP. Documented cho Phase 5+ plugin system.

## 3. `files`

**Định nghĩa:** array of patterns **bao gồm** trong npm tarball. Default `["*"]` (mọi file).

**Auto-included** (kể cả khi không list):
- `package.json`
- `README` (any extension)
- `LICENSE` / `LICENSE.md`
- `CHANGELOG` / `CHANGELOG.md`

**Priority matrix:**

| Config | Override `files`? |
|---|---|
| `.gitignore` (root) | ❌ Không |
| `.npmignore` (root) | ❌ Không |
| `.npmignore` (subdir) | ✅ Có (cho subdir đó) |
| `.gitignore` + `.npmignore` cả hai | `.npmignore` thắng |

**Recommended cho `jss-devtools`:**
```jsonc
{
  "files": ["dist"]  // package.json + README đã auto-included
}
```

**Verify:**
```bash
pnpm pack --dry-run  # list files sẽ ship
```

## 4. `sideEffects` — Tree Shaking Optimization

**Định nghĩa:** khai báo modules có **side effects** khi import. Bundlers dùng để **tree-shake**.

**Side effects là gì:**
- Polyfills modify global (VD: `Array.prototype.includes = ...`).
- CSS imports (`import './style.css'`).
- Register event listeners ở module level.
- Modify prototype chains.

**3 giá trị:**

```jsonc
// Toàn bộ pure — safe prune unused exports
{ "sideEffects": false }

// Mark files có side effects, phần còn lại tree-shake được
{
  "sideEffects": [
    "**/*.css",                // CSS imports
    "./src/polyfill.js",       // polyfill entry
    "./esnext/index.js"
  ]
}

// Default = true (mọi import có side effect → no aggressive tree-shake)
```

**Bundler support:**

| Bundler | Đọc `sideEffects`? |
|---|---|
| webpack 5+ | ✅ |
| rollup | ✅ (popularized concept) |
| esbuild | ✅ |
| tsup / tsdown | ✅ (passthrough) |
| Vite | ✅ (dùng rollup) |

**Common pitfalls:**

1. **CSS imports bị drop** nếu `sideEffects: false` mà có `import './style.css'`:
   ```jsonc
   // Fix:
   { "sideEffects": ["**/*.css"] }
   ```

2. **Polyfills modify global** bị prune → app crash.

3. **Re-exports có side effect** (VD `import './polyfill'; export * from './x'`) bị skip.

4. **Nested deps** sai `sideEffects` → tree-shake sai cả cây con.

5. **Tree-shake chỉ full activate trong production mode** (minify enabled).

**Pure annotations (in-code hint):**
```ts
// Function call pure — safe to drop if result unused
/*#__PURE__*/ double(55)

// Function declaration no-side-effect (webpack 5.107+)
/*#__NO_SIDE_EFFECTS__*/
export function createLogger(prefix) {
  return (msg) => console.log(`[${prefix}] ${msg}`)
}
```

**Áp dụng cho `jss-devtools`:** CLI bin không bị tree-shake (user `npm i -g` chạy trực tiếp). Nhưng nếu expose programmatic API trong tương lai → set `"sideEffects": false`. Cho MVP, **set `"sideEffects": false`** vì code đã pure (bonus cho future lib consumers).

## 5. `exports` — Conditional Exports + Tree Shaking

**Định nghĩa:** define **public entry points**. **Override `"main"`** khi cả hai define.

**Key behaviors:**
- Subpath không listed → throw `ERR_PACKAGE_PATH_NOT_EXPORTED` (encapsulation).
- Wildcard `*` là **string replacement**, không phải glob.

**Condition priority (most specific first):**
1. `"node-addons"` — native C++ addons
2. `"node"` — Node.js env
3. `"import"` — `import` statement (mutually exclusive với `"require"`)
4. `"require"` — `require()` (CJS)
5. `"module-sync"` — ESM không có top-level await
6. `"default"` — fallback (LUÔN CUỐI)

**Tree-shaking implications:**
- `"import"` enable tree-shake tốt hơn (ESM statically analyzable).
- `"module-sync"` đảm bảo sync exports, không top-level await.
- **Named exports** tree-shake tốt hơn default exports:
  ```ts
  import { something } from 'pkg'  // ✅ better tree-shaking
  import pkg from 'pkg'              // ❌ may include whole module
  ```

**Subpath patterns:**
```jsonc
{
  "exports": {
    ".": "./index.js",                       // root
    "./feature": "./feature/index.js",       // explicit subpath
    "./feature/*.js": "./src/feature/*.js",  // wildcard
    "./internal/*": null                     // null = block
  }
}
```

**Real-world CLI + library hybrid pattern:**
```jsonc
{
  "name": "my-tool",
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
    "my-tool": "./dist/cli/cli.js"
  },
  "main": "./dist/cli/index.js"
}
```

**Lưu ý:** `"types"` condition phải list **TRƯỚC** `"import"`/`"require"` (TS resolution rule).

**Quyết định cho `jss-devtools` MVP:**

Vì CLI MVP không expose programmatic API (`src/index.ts` của reference chỉ có `export {}` — no runtime surface), `exports` đơn giản:

```jsonc
{
  "type": "module",
  "bin": {
    "jss-devtools": "./dist/cli/cli.js"
  },
  "files": ["dist"]
}
```

Khi nào cần full `exports`: Phase 5+ khi expose programmatic API (VD `import { parseManifest } from 'jss-devtools'`).

## Final `package.json` Template cho `jss-devtools` MVP

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
  "sideEffects": false,
  "engines": {
    "node": ">=24.0.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsup",
    "clean": "rimraf dist",
    "lint": "biome check",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "dev": "tsup --watch",
    "release": "pnpm clean && pnpm build && changeset publish",
    "version": "changeset version"
  },
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
  // peerDependencies: KHÔNG có trong MVP (CLI standalone)
  // peerDependenciesMeta: KHÔNG có trong MVP
  // exports: KHÔNG có trong MVP (chỉ bin entry)
}
```

## Pre-publish Checklist

- [ ] `engines.node` set đúng runtime baseline
- [ ] `bin` field trỏ tới compiled entry có shebang
- [ ] `files` whitelist dist (không ship `src/`, `tests/`, `docs/`)
- [ ] `sideEffects: false` (nếu code pure)
- [ ] `pnpm pack --dry-run` review output
- [ ] Version tag follows semver
- [ ] Provenance enabled (`npm publish --provenance` + GitHub OIDC)

## Related Notes

- [[2026-08-19-package-managers]] — pnpm workflow.
- [[2026-08-19-js-bundlers]] — tsup config & externals.
