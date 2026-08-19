# Package Managers Deep-Dive — npm / pnpm / Yarn Berry / Bun

> Ngày: 2026-08-19  
> Nguồn: pnpm.io, bun.sh, yarnpkg.com official docs  
> Ngữ cảnh: research cho `jss-devtools` CLI SDK

## TL;DR

**pnpm thắng cho hầu hết use case Node/TS CLI và library:**
- 12x nhanh hơn npm clean install (4.6s vs 55.4s).
- Strict mode (no phantom deps) — quan trọng cho SDK.
- Content-addressable store — disk efficient cho multi-project.
- Không lock vào runtime (Bun cần runtime).

**Bun chỉ thắng nếu:**
- Bạn OK lock vào Bun runtime.
- Không có deps cần `postinstall` scripts.
- Muốn fastest install (3.6s clean).

**Yarn Berry thắng nếu:**
- Bạn muốn zero-installs (PnP).
- Solo project, ít native deps.

**npm thắng nếu:**
- Bạn muốn zero-config, không cần optimize.

## Benchmarks (pnpm official, no cache)

| Tool | Clean install | Warm cache + lockfile |
|---|---|---|
| npm | 55.4s | 1.9s |
| pnpm | **4.6s** | **580ms** |
| Yarn | 2.7s | — |
| Bun | 3.6s | 743ms |
| pnpm 🦀 (Rust, preview) | 711ms | 58ms |

## Feature Matrix

| Feature | npm | pnpm | Yarn Berry | Bun |
|---|---|---|---|---|
| Content-addressable store | ❌ | ✅ | ✅ (opt-in) | ✅ |
| Phantom deps prevention | ❌ | ✅ default | opt-in | ❌ |
| Build script security | ❌ | ✅ default | ❌ | ❌ default |
| Zero-installs (PnP) | ❌ | ❌ | ✅ | ❌ |
| Side-effects cache | ❌ | ✅ | ❌ | ❌ |
| Catalogs (version pinning) | ❌ | ✅ | ❌ | ❌ |
| Auto-install peers | ✅ (v7+) | ❌ (default) | opt-in | varies |
| Lockfile | `package-lock.json` | `pnpm-lock.yaml` | `yarn.lock` | `bun.lock` |

## Key Differentiators

### pnpm — Strict + Content-addressable

**`pnpm` install khác npm/yarn ở 2 điểm:**

1. **Isolated `node_modules`** — mỗi package chỉ thấy deps đã khai báo. Truy cập package không khai báo → fail tại install (phantom dep prevention).
2. **Content-addressable store** — packages deduplicated across projects ở `~/.pnpm-store`. Project A và B cùng version React → chỉ store 1 bản.

**.npmrc flags quan trọng:**
```ini
engine-strict=true            # fail nếu Node version không khớp engines
strict-peer-dependencies=true # fail nếu peer dep conflict
auto-install-peers=false      # KHÔNG auto-install peers (khác npm v7+)
shamefully-hoist=false        # giữ isolated mặc định
```

**Catalogs (pnpm 9+):**
```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
catalog:
  react: ^18.2.0
  typescript: ^5.4.0
```
```jsonc
// package.json
{
  "dependencies": {
    "react": "catalog:",
    "typescript": "catalog:"
  }
}
```
→ Update 1 chỗ, sync toàn workspace.

### Bun — Fastest, but locked in

**Install speed leadership** nhờ native (Zig) implementation + parallel downloads.

**Quan trọng: lifecycle scripts bị DISABLE mặc định:**
```jsonc
{
  "trustedDependencies": ["esbuild", "sharp"]  // chỉ những này mới chạy postinstall
}
```

→ Project dùng `prisma`, `node-gyp`, hoặc bất kỳ native module nào phải explicit add vào list. Friction.

**Lockfile format changes:**
- Bun 1.2+ dùng `bun.lock` (text JSON).
- Cũ hơn: `bun.lockb` (binary).
- Bun **auto-migrate** `pnpm-lock.yaml` sang `bun.lock` (không có flag opt-out).

**CI caveat:** cần `bun ci` thay vì `bun install` để frozen-lockfile behavior.

### Yarn Berry — Plug'n'Play

**PnP mode:** không có `node_modules`, thay bằng `.pnp.cjs` + `.yarn/cache`. Faster install, less disk.

**Nhưng:**
- `jest`, `vitest`, nhiều native binaries → cần config đặc biệt (`pnpify`, `loader`).
- Một số tool giả định `node_modules` resolution → break.
- Yarn 1 (Classic) đã deprecated.

**Khi nào pick Yarn:**
- Solo project, ít deps.
- CI/CD với zero-installs requirement.
- Team đã quen Yarn.

### npm — Boring default

**V7+ changes:**
- Auto-install peer deps (khác Yarn classic).
- `npm ci` cho clean install reproducible.
- Workspaces ổn định từ v7.

**Khi nào OK:**
- Bạn muốn "v�a đủ".
- Team không optimize cho tốc độ.
- Dùng tool phụ thuộc npm-specific APIs.

## Quyết định cho `jss-devtools`

**Chọn pnpm** vì:
- User đã lean pnpm.
- Strict deps quan trọng cho SDK (consumer code không break vì phantom dep).
- 12x faster clean install → CI feedback loop nhanh.
- Không lock runtime.

**Skip Bun** vì:
- Lock vào Bun runtime.
- Lifecycle scripts friction với deps phổ biến.

**Skip Yarn Berry** vì:
- PnP friction với test runners, native modules.

## Commands Workflow (pnpm)

```bash
pnpm install                 # install theo pnpm-lock.yaml
pnpm add <pkg>               # thêm dep (cập nhật lockfile)
pnpm add -D <pkg>            # thêm devDep
pnpm remove <pkg>            # remove dep
pnpm add -w <pkg>            # thêm vào workspace root
pnpm build                   # build dist
pnpm test                    # chạy vitest
pnpm typecheck               # tsc --noEmit
pnpm lint                    # biome check
pnpm pack --dry-run          # preview npm tarball
pnpm publish                 # publish lên registry
pnpm dlx <pkg>               # = npx, run one-off command
pnpm exec <cmd>              # run trong project context
```

## Khi nào reconsider

- **Move sang Bun** nếu: toàn bộ project dùng Bun runtime, deps không có native modules.
- **Move sang npm** nếu: gặp edge case pnpm không support.
- **Move sang Yarn Berry** nếu: cần zero-installs / muốn PnP.
