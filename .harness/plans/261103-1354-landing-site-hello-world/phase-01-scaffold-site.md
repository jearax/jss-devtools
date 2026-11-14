---
phase: 01
title: "Vendor design system + scaffold site Vite React"
status: pending
priority: P2
effort: 1.5h
dependencies: []
---

# Phase 01 — Vendor design system + scaffold site Vite React

## Goal

Tạo thư mục `site/` (gói độc lập) hiển thị nội dung landing hiện tại bằng React + Vite, với
core brand tokens (màu + font) của `@jjuidev/design-system` vendored (đóng gói cục bộ) dạng
local pack (gói cục bộ) tarball.

## Files to Create / Modify

- Create: `site/vendor/jjuidev-design-system-0.1.0.tgz` (tarball từ `pnpm pack` ở DS repo)
- Create: `site/package.json`, `site/tsconfig.json`, `site/vite.config.ts`, `site/index.html`
- Create: `site/src/main.tsx`, `site/src/App.tsx`, `site/src/styles/site.css`
- Modify: `package.json` gốc — mở rộng glob `lint` để phủ `site/src`

## Tasks & Steps

1. **Vendor design system:**
   ```sh
   cd the dokploy repository
   pnpm pack --pack-destination <plan-dir>/tmp-pack/
   ```
   DS phải được build lib trước (`pnpm build:lib`) nếu `dist/lib` chưa tươi — hiện đã có
   `dist/lib` với `styles.css`. Copy tarball vào `site/vendor/jjuidev-design-system-0.1.0.tgz`
   (tên tarball `pnpm pack` sinh ra không có scope — đặt tên lại khi copy).
2. **`site/package.json`** — standalone, không vào workspace:
   ```json
   {
     "name": "@jjuidev/jss-devtools-site",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc --noEmit && vite build",
       "typecheck": "tsc --noEmit"
     }
   }
   ```
   (pseudo-json minh họa — cooker viết đúng cú pháp; `private: true`.)
   Dependencies (pin exact, chọn bản đã đủ tuổi `minimumReleaseAge`):
   `react`, `react-dom`; devDependencies: `vite`, `@vitejs/plugin-react`,
   `@types/react`, `@types/react-dom`, `typescript`.
   `"@jjuidev/design-system": "file:vendor/jjuidev-design-system-0.1.0.tgz"`.
3. `site/vite.config.ts` — `defineConfig` gán const có tên, `react()` plugin, `root` mặc định.
4. `site/tsconfig.json` — `jsx: "react-jsx"`, `moduleResolution: "bundler"`, strict, include
   `src/` + vite/client types. Tham khảo style `tsconfig.json` gốc.
5. `site/index.html` — giữ `<html lang="vi">`, title `jss-devtools`, meta viewport, màu
   scheme light/dark.
6. `site/src/main.tsx` — `import '@jjuidev/design-system/styles.css'` rồi
   `import './styles/site.css'`, `createRoot(document.getElementById('root'))`.
7. `site/src/App.tsx` — render nội dung tương đương `docker/home.html`: `h1` "jss-devtools",
   tagline "Công cụ dòng lệnh cho các repository JavaScript.", khối code lệnh cài
   `curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh`, yêu cầu
   `Node >= 24.11.0` + curl/wget, ghi chú `~/.local/bin/jss-devtools` + PATH,
   link GitHub `https://github.com/jearax/jss-devtools2`.
8. `site/src/styles/site.css` — layout tương đương CSS inline hiện tại (`main` max-width
   42rem, pre/code styling, light/dark qua `prefers-color-scheme`), dùng CSS variables
   (biến CSS) do `styles.css` của DS cung cấp khi khả thi; không thêm font file.
9. `package.json` gốc: thêm `site/src` vào glob `lint`/`lint:fix` (pattern
   `site/src/**/*.{ts,tsx}`), chạy `pnpm lint` để xác nhận site code qua rule hiện có.

## Verification

```sh
pnpm --dir site install
pnpm --dir site build          # tsc + vite build → site/dist
pnpm --dir site vite preview   # hoặc dev server, kiểm tra trực quan
pnpm lint                      # CLI + site
```

- `site/dist/index.html` tồn tại, tham chiếu asset `/assets/*.js` đã hash.
- Trang hiển thị đủ nội dung landing cũ, light/dark hoạt động.
- Token DS (font "Be Vietnam Pro" fallback, bảng màu neutral) áp dụng (kiểm tra computed style).
