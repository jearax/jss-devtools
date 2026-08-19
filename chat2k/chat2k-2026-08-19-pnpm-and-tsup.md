# pnpm & tsup — Stack Decisions for `jss-devtools` CLI

Knowledge extracted from plan decisions on package manager and build/bundler choices for the `jss-devtools` CLI SDK. Covers two topics: Package Manager (pnpm vs npm/Yarn Berry/Bun) and Build/Bundler (tsup vs tsdown/esbuild/rollup/vite/bun build).

---

## Topic 1 — Package Manager: pnpm

**Subjects compared:** npm, pnpm, Yarn Berry, Bun.

### Comparison Matrix

| Tiêu chí | npm | pnpm | Yarn Berry | Bun |
|---|---|---|---|---|
| Install sạch (no cache) | 55.4s | **4.6s** | 2.7s | 3.6s |
| Warm cache + lockfile | 1.9s | **580ms** | — | 743ms |
| Content-addressable store | ❌ | ✅ | ✅ (opt-in) | ✅ |
| Phantom deps prevention | ❌ | ✅ mặt định | opt-in | ❌ |
| Build script security | ❌ | ✅ mặt định | ❌ | ❌ (default) |
| Lockfile format | `package-lock.json` | `pnpm-lock.yaml` | `yarn.lock` | `bun.lock` |
| Maturity | stable | stable | stable | evolving |

### Pros / Cons

**npm**
- Pros: mặc định ở mọi nơi, zero-config, ecosystem quen thuộc.
- Cons: chậm nhất trong benchmarks, không strict deps, không content-addressable store.

**pnpm**
- Pros: 12x faster clean install so với npm, strict mode ngăn phantom deps, content-addressable store tiết kiệm disk, build script security mặt định.
- Cons: learning curve cho `.npmrc` flags, một số tool cũ giả định `node_modules` flat structure.

**Yarn Berry**
- Pros: Plug'n'Play mode cho zero-installs, content-addressable store opt-in.
- Cons: PnP friction với nhiều package phổ biến (jest, vitest native binaries), ecosystem vẫn chuẩn hoá quanh `node_modules`.

**Bun**
- Pros: 25x faster so với npm install, native (Zig) implementation.
- Cons: lifecycle scripts bị disable mặt định (cần `trustedDependencies`), lock vào Bun runtime, lockfile format changes giữa các versions.

### Use Cases

- **npm**: khi cần zero-config, tool phụ thuộc npm-specific APIs, team muốn "vừa đủ".
- **pnpm**: solo/team project Node/TS, cần strict deps, multi-project trên cùng máy, CI feedback loop nhanh.
- **Yarn Berry**: solo project ít deps, cần zero-installs / PnP, team đã quen Yarn.
- **Bun**: toàn bộ project dùng Bun runtime, deps không có native modules.

### Decision

**pnpm** — chốt cho `jss-devtools`. Lý do: user đã lean pnpm từ docs ban đầu, strict deps quan trọng cho SDK (consumer code không break vì phantom dep), 12x faster clean install giúp CI feedback nhanh, không lock runtime.

**.npmrc config tối thiểu:**
```ini
engine-strict=true
strict-peer-dependencies=true
auto-install-peers=false
```

**Sources:**
- [pnpm benchmarks](https://pnpm.io/benchmarks)
- [pnpm feature comparison](https://pnpm.io/feature-comparison)
- [Bun install docs](https://bun.sh/docs/cli/install)
- [Yarn getting started](https://yarnpkg.com/getting-started/install)

---

## Topic 2 — Build / Bundler: tsup

**Subjects compared:** tsup, tsdown, esbuild raw, rollup, vite lib mode, bun build.

### Comparison Matrix

| Tiêu chí | tsup | tsdown | esbuild raw | rollup | vite lib | bun build |
|---|---|---|---|---|---|---|
| Stars | 11.3k | mới (RC 0.23) | n/a (engine) | n/a (engine) | n/a (engine) | n/a (engine) |
| Engine | esbuild | rolldown (Rust) | esbuild | rollup | rollup | esbuild |
| Bundle CLI bin | ✅ first-class | ✅ API-compatible | manual config | manual | overkill | ✅ |
| Shebang preservation | ✅ | ✅ | manual | manual | manual | manual |
| Default config DX | zero-config | zero-config | low-level | low-level | medium | medium |
| Production stable | ✅ (de facto) | RC | ✅ | ✅ | ✅ | ✅ |
| Maintenance note | README nói "consider tsdown" | active | active | active | active | active |

### Bundler Engine Performance

Benchmark trên 19k modules (10k React components + 9k iconify files):

| Bundler | Engine | Time |
|---|---|---|
| Rolldown | Rust | **1.61s** |
| esbuild | Go | 1.70s |
| rspack | Rust | 4.07s |
| Rollup + esbuild | JS + Go | 40.10s |

### Pros / Cons

**tsup**
- Pros: zero-config đủ cho CLI bin, built-in shebang/banner/dts/sourcemap/externals, 11.3k stars production-proven, API-compatible với tsdown.
- Cons: README chính thức khuyến nghị chuyển sang tsdown (package không actively maintained mới nhưng vẫn stable).

**tsdown**
- Pros: dùng rolldown (Rust) nhanh nhất trong benchmark, là bundler chính cho Vite 8+, API-compatible với tsup (drop-in replacement).
- Cons: đang ở RC 0.23 chưa stable cho MVP.

**esbuild raw**
- Pros: fastest single bundler (1.70s), low-level API cho custom pipelines.
- Cons: phải config manually (shebang, externals, banner, format, platform) → trùng lặp với những gì tsup đã có sẵn.

**rollup**
- Pros: most flexible bundler, mature plugin ecosystem.
- Cons: config overhead cho CLI bin single entry là overkill.

**vite lib mode**
- Pros: tích hợp với Vite ecosystem.
- Cons: không tối ưu cho `bin` field (primary use là web apps).

**bun build**
- Pros: native bundler của Bun.
- Cons: yêu cầu Bun runtime trong CI → conflict với Node 24 baseline.

### Use Cases

- **tsup**: production CLI bin, muốn zero-config, muốn stable ngay, OK với migration path sau.
- **tsdown**: khi reach 1.0 stable, muốn Rust engine, Vite 8+ ecosystem.
- **esbuild raw**: custom build pipeline, cần low-level control, plugin system phức tạp.
- **rollup**: library với nhiều output formats, complex transforms.
- **vite lib mode**: browser-targeted library.
- **bun build**: toàn bộ stack đã dùng Bun runtime.

### Decision

**tsup cho MVP**, với **migration path sang tsdown** khi tsdown 1.0 stable.

Lý do: production-proven cho hàng nghìn CLI bin, zero-config đủ cho use case MVP, API-compatible với tsdown (CLI flags + config keys giống nhau → migration ch� đổi package name).

**`tsup.config.ts`:**
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
  external: ['@clack/prompts', 'citty', 'consola', 'execa', 'figlet', 'nypm', 'pathe'],
})
```

**Migration diff (tsup → tsdown):**
```diff
- import { defineConfig } from 'tsup'
+ import { defineConfig } from 'tsdown'
```
Config không đổi.

**Sources:**
- [esbuild homepage](https://esbuild.github.io/)
- [rolldown.rs](https://rolldown.rs/)
- [tsdown homepage](https://tsdown.dev/)
- [tsup repository](https://github.com/egoist/tsup)

---

## References

- [Bun install docs](https://bun.sh/docs/cli/install) — package manager install command, lifecycle scripts, lockfile formats
- [esbuild homepage](https://esbuild.github.io/) — Go-based bundler, tree-shaking, source maps, target platforms
- [pnpm benchmarks](https://pnpm.io/benchmarks) — clean/warm install timings across npm, pnpm, Yarn, Bun
- [pnpm feature comparison](https://pnpm.io/feature-comparison) — content-addressable store, strict mode, build script security flags
- [rolldown.rs](https://rolldown.rs/) — Rust bundler, Rollup-compatible API, Vite 8+ engine
- [tsdown homepage](https://tsdown.dev/) — Rolldown-powered library bundler, tsup-compatible
- [tsup repository](https://github.com/egoist/tsup) — esbuild-based CLI bundler, zero-config defaults
- [Yarn getting started](https://yarnpkg.com/getting-started/install) — Yarn Berry install, Corepack integration
