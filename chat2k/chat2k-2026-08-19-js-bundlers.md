# JS Bundlers Deep-Dive — tsup / tsdown / esbuild / rollup / vite / bun build

> Ngày: 2026-08-19  
> Nguồn: tsup.egoist.dev, tsdown.dev, esbuild.github.io, rolldown.rs official docs  
> Ngữ cảnh: chọn bundler cho `jss-devtools` CLI bin

## TL;DR

**tsup cho MVP** (production-proven, zero-config, API-compatible với tsdown).  
**Migration sang tsdown** khi tsdown reach 1.0 stable (drop-in replacement).

**Không pick:**
- esbuild raw — config overhead.
- rollup — quá flexible, overkill cho CLI bin.
- vite lib mode — không phải primary use case.
- bun build — lock vào Bun runtime.

## So sánh Engine Performance

Benchmark trên 19k modules (10k React components + 9k iconify files):

| Bundler | Engine | Time |
|---|---|---|
| Rolldown | Rust | **1.61s** |
| esbuild | Go | 1.70s |
| rspack | Rust | 4.07s |
| Rollup + esbuild | JS + Go | 40.10s |

→ Rolldown nhanh nhất, slightly hơn esbuild. Rollup + esbuild chậm vì 2-stage.

## So sánh Tổng quan

| Tiêu chí | tsup | tsdown | esbuild raw | rollup | vite lib | bun build |
|---|---|---|---|---|---|---|
| Stars | 11.3k | mới | n/a (engine) | n/a (engine) | n/a (engine) | n/a |
| Engine | esbuild | rolldown | esbuild | rollup | rollup | esbuild |
| DX (zero-config) | ✅ | ✅ | ❌ | ❌ | medium | medium |
| CLI features (shebang/banner/externals) | ✅ built-in | ✅ built-in | manual | manual | manual | manual |
| TypeScript dts generation | ✅ built-in | ✅ | via plugin | via plugin | via plugin | ❌ |
| Production stable | ✅ | ⚠️ RC 0.23 | ✅ | ✅ | ✅ | ✅ |
| Maintenance | ⚠️ README says "consider tsdown" | ✅ active | ✅ | ✅ | ✅ | ✅ |
| Output formats | ESM/CJS/IIFE | ESM/CJS/IIFE | ESM/CJS/IIFE | ESM/CJS | ESM/CJS | ESM/CJS |

## Key Concepts

### `tsup` — esbuild wrapper
- Tác giả: egoist.
- 11.3k stars.
- **README hiện tại khuyến nghị tsdown** — package không actively maintained nhưng vẫn stable cho production use.
- Zero-config defaults: ESM, dts, sourcemap, banner, externals.
- CLI flags + config keys compatible với tsdown → migration dễ.

### `tsdown` — rolldown wrapper
- Tác giả: same egoist (?), maintain bởi unjs/Vite team.
- **Rolldown** là Rust bundler, drop-in cho Rollup API.
- Được chọn làm bundler chính cho **Vite 8+**.
- Hiện ở RC 0.23 — chưa stable.
- API-compatible với tsup → drop-in replacement.

### `esbuild` raw — low-level
- Tác giả: Evan Wallace (Figma).
- Go-based, fastest single bundler ở 1.70s.
- API thấp: phải tự config shebang, externals, banner, format, platform.
- Dùng cho custom build pipelines hoặc khi cần control fine-grained.

### `rollup` — most flexible
- Tác giả: Rich Harris (Svelte creator).
- JS-based, mature, plugin ecosystem lớn nhất.
- Config nhiều nhưng flexible nhất (multi-format, complex transforms).
- Overkill cho CLI bin single entry.

### `vite` lib mode
- Tác giả: Evan You (Vue creator).
- Primary use: dev server + build cho web apps.
- Lib mode: build library output.
- **Không tối ưu cho `bin` field** — dùng cho browser-targeted libs.

### `bun build` — Bun native
- Tác giả: Bun team.
- ESM/CJS, native bundler.
- **Yêu cầu Bun runtime** trong CI → conflict với Node-only projects.
- Lock-in vào Bun ecosystem.

## `tsup.config.ts` cho CLI bin

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
  // External tất cả runtime deps để install size gọn
  external: ['@clack/prompts', 'citty', 'consola', 'execa', 'figlet', 'nypm', 'pathe'],
})
```

**Tại sao external tất cả deps:**
- Bundle thư viện vào dist → install size lớn, nhiều duplicate trên hệ thống user.
- External → deps resolve qua npm → install 1 lần, dedupe qua content-addressable store của pnpm.
- CLI bundle nhỏ chỉ cần code riêng của dự án.

## Migration Path `tsup` → `tsdown`

```diff
- import { defineConfig } from 'tsup'
+ import { defineConfig } from 'tsdown'
```

Config không đổi — API surface giống nhau.

**Migration checklist:**
- [ ] tsdown đã release 1.0+
- [ ] Test build output hash match (regression check).
- [ ] Update CI workflow nếu có flags khác.
- [ ] Update `package.json` devDep: `tsup` → `tsdown`.

## Alternative: Custom `scripts/build.ts`

Reference repo `/Users/tandm/Documents/jjuidev/npm/jss-cli` dùng custom build script:

```ts
import { $ } from 'bun'
import { cp, readFile, writeFile } from 'fs/promises'

const result = await Bun.build({
  entrypoints: ['./src/cli.ts'],
  outdir: './dist/cli',
  target: 'node',
  format: 'esm',
  naming: '[name].js',
  external: ['consola']
})

// Post-process: thêm shebang, chmod +x, copy fonts...
```

**Tradeoff:**
- **+** Hiểu sâu bundling pipeline.
- **+** Customize hoàn toàn (copy fonts, post-process dist, etc.).
- **−** Maintain nhiều hơn (~80 lines vs zero-config).
- **−** Phụ thuộc Bun.build API (nếu dùng Bun) hoặc phải tự gọi esbuild programmatic.

**Khi nào pick custom build:**
- Cần post-process output (copy assets, generate files).
- Cần nhiều entry points với config khác nhau.
- Educational value quan trọng hơn DX.

## Common Bundler Pitfalls

### 1. **Shebang bị mất khi bundle**
- **Fix:** `banner: { js: '#!/usr/bin/env node' }` trong tsup/tsdown.
- Hoặc post-process writeFile prepend shebang.

### 2. **Externals không detect được**
- tsup auto-detect deps trong `package.json`, nhưng dynamic imports có thể miss.
- **Fix:** explicit list trong `external: [...]`.

### 3. **Top-level await bị strip**
- **Fix:** `target: 'node14+'` hoặc `format: ['esm']` + Node version đủ mới.

### 4. **Path aliases không resolve trong dist**
- **Fix:** dùng `tsc-alias` post-process, hoặc bundler config `esbuildOptions.alias`.

### 5. **Node built-ins bị bundle**
- **Fix:** `external: ['node:*', 'fs', 'path', ...]` hoặc `platform: 'node'` (auto-handle).

## Quyết định cho `jss-devtools`

**Phase 0 (MVP):** tsup — zero-config, stable, compatible với tsdown.  
**Phase 5+:** reassess khi tsdown 1.0 stable.  
**Nếu cần custom build:** copy pattern từ reference repo.

## Related Notes

- [[2026-08-19-cli-ux-libraries]] — CLI prompts/logging/banner libs.
- [[2026-08-19-package-managers]] — pnpm/yarn/npm/bun comparison.
