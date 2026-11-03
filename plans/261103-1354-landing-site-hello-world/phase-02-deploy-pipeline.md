# Phase 02 — Tích hợp pipeline deploy (Docker, nginx, smoke, CI)

## Goal

Image nginx phục vụ SPA build từ `site/dist/`, giữ nguyên 4 route cũ + route `/assets/` mới,
smoke test (kiểm thử khói) phủ route mới, CI xây site trước khi `docker build`.

## Files to Create / Modify

- Modify: `docker/Dockerfile` — COPY `site/dist/` thay `docker/home.html`
- Modify: `docker/nginx.conf` — thêm `location /assets/` (cache `immutable`)
- Modify: `.dockerignore` — thêm `!site/dist/` vào allow-list (bộ cho phép)
- Modify: `ci/smoke-site-image.sh` — kiểm tra route `/assets/`
- Modify: `.github/workflows/ci.yml` — job `image` build site trước `docker build`
- Modify: `package.json` gốc — script `build:site` cho tiện local

## Tasks & Steps

1. **`.dockerignore`** — thêm `!site/dist/` vào allow-list (sau `!release/`).
2. **`docker/Dockerfile`**:
   ```dockerfile
   COPY site/dist/ /usr/share/nginx/html/
   ```
   thay cho `COPY docker/home.html /usr/share/nginx/html/index.html`. Giữ nguyên install.sh và
   `release/`. Comment giải thích SPA cần build trước bởi CI (server không build).
3. **`docker/nginx.conf`** — thêm:
   ```nginx
   # Tên file đã hash nên cache được vĩnh viễn.
   location /assets/ {
       try_files $uri =404;
       add_header Cache-Control "public, max-age=31536000, immutable" always;
   }
   ```
   với `add_header Cache-Control "public, max-age=31536000, immutable" always;`. Giữ nguyên
   `location = /`, `/install.sh`, `/releases/latest/`, và 404 catch-all. Vite default `base: '/'`
   nên không cần rewrite (ghi lại) gì thêm.
4. **`ci/smoke-site-image.sh`** — thêm bước: lấy `/` về 200, trích URL asset từ HTML (regex
   `assets/[^"]+\.js`), fetch URL đó expect 200 + header `immutable`, expect 404 cho một path
   `assets/` không tồn tại. Giữ nguyên các khối assert cũ.
5. **`.github/workflows/ci.yml`** — job `image` cần site dist trước khi `docker build`:
   bước `pnpm --dir site install && pnpm --dir site build` (dùng cùng setup-pnpm/node như job
   `checks`, đúng `engines.node`). Job `checks` thêm `pnpm --dir site typecheck` (site đã được
   phủ bởi root lint). Vite build cho phép tốn vài chục giây — chấp nhận.
6. `package.json` gốc: thêm `"build:site": "pnpm --dir site build"` để chạy local cho tiện.

## Verification

```sh
pnpm --dir site build
docker build -f docker/Dockerfile -t jss-devtools-site-test .   # build context = repo root
sh ci/smoke-site-image.sh jss-devtools-site-test 0.0.1
```

- Smoke pass: `/` 200, asset JS 200 + `immutable`, `assets/` path lạ 404, install.sh +
  releases giữ nguyên header `no-cache`.
- `nginx -t` pass trong Dockerfile (đã có sẵn bước này).
- Lưu ý: nếu local không có Docker daemon, cooker ghi nhận limitation (hạn chế) trong report
  và nhường phần smoke Docker cho CI; không fake (làm giả) kết quả.
