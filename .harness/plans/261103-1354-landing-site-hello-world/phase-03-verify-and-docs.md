# Phase 03 — Verification (xác minh) toàn phần + cập nhật docs

## Goal

Chạy đủ chuỗi kiểm tra của repo và cập nhật tài liệu deploy cho đúng trạng thái mới.

## Files to Create / Modify

- Modify: `docs/deployment-guide.md` — bảng "What the image carries" thêm `/assets/`, thêm
  bước build site vào mô tả pipeline.
- Modify: `docs/codebase-summary.md` — thêm `site/` vào cây thư mục.
- Possibly modify: `docker/docker-compose.yml` — chỉ nếu cần (không kỳ vọng).

## Tasks & Steps

1. Full sequence (CLI): `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Lưu output
   thật để report.
2. Site: `pnpm --dir site install && pnpm --dir site typecheck && pnpm --dir site build`.
3. Docker smoke nếu có daemon (xem Phase 02); nếu không có, ghi nhận limitation (hạn chế).
4. Cập nhật `docs/deployment-guide.md`:
   - Pipeline: thêm bước "build the site" vào mô tả job `image` (hoặc checks — theo code thật).
   - Bảng route: thêm `/assets/` + cache `immutable`.
   - Mô tả "The site is one nginx image" — thêm câu SPA được CI build từ `site/`.
5. Cập nhật `docs/codebase-summary.md` thêm `site/` vào cây file.
6. Đối chiếu acceptance criteria (tiêu chí nghiệm thu) trong `plan.md` từng mục, ghi kết quả
   vào report.

## Verification

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --dir site typecheck && pnpm --dir site build
sh ci/smoke-site-image.sh <image> 0.0.1   # nếu có Docker
```

- Mọi lệnh chạy thật, báo output thật. Kết quả skip/fail phải được nêu rõ trong report cuối.
