---
title: "Landing site React SPA Hello world cho jss-devtools"
description: "Tạo site/ — React SPA Vite hiển thị nội dung landing hiện tại, vendor design system dạng local pack, tích hợp vào pipeline nginx/Dokploy."
status: pending
priority: P2
effort: 4h
branch: main
tags: [frontend, site, docker, ci]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Landing site React SPA — "Hello world"

## Outcome (kết quả mong muốn)

`https://jss-devtools.jjuidev.com` phục vụ một React SPA do Vite build, nội dung **giống hệt**
trang landing hiện tại (`docker/home.html`): tiêu đề, tagline, lệnh cài đặt, yêu cầu, link
GitHub — tiếng Việt, light/dark. Site dùng core brand tokens (màu + font) của
`@jjuidev/design-system`. Không có UI mới.

## Bối cảnh đã chốt với user (không bàn lại)

| Quyết định | Giá trị |
| --- | --- |
| Kiểu app | React SPA (client-render), một trang, **không router** |
| Vị trí | Thư mục `site/` độc lập, **không** vào `src/` (tránh tsdown bundle React vào CLI và đụng architecture rules) |
| Cài đặt | Standalone: `pnpm --dir site install`, lockfile riêng `site/pnpm-lock.yaml`, **không** thêm vào `pnpm-workspace.yaml` |
| Build tool | Vite + `@vitejs/plugin-react`, TypeScript, output `site/dist/` |
| Design system | Vendor (đóng gói cục bộ) dạng local pack (gói cục bộ): tarball từ `/Users/tandm/Documents/jearax/dokploy/design-system` (`pnpm pack`), đặt tại `site/vendor/`, dependency `file:vendor/<tarball>` — **chỉ** dùng export `./styles.css` (core brand), **không** import component JS |
| Phạm vi UI | Chỉ "Hello world" = nội dung landing hiện tại |

## Non-goals (phạm vi loại trừ)

- Không thiết kế UI mới, không thêm section (phần nội dung) mới.
- Không router, không prerender/SSG (user đã chọn SPA và chấp nhận đánh đổi SEO).
- Không vendor font (CSS của DS có sẵn font fallback — phông chữ dự phòng).
- Không Tailwind build trong site (`styles.css` đã compile sẵn).
- Không đổi gì trong `src/` của CLI — bundle CLI phải bất biến về mặt hành vi.

## Acceptance criteria (tiêu chí nghiệm thu)

1. `pnpm --dir site build` tạo `site/dist/index.html` + asset đã hash; nội dung render khớp
   `docker/home.html` (tiêu đề, tagline, lệnh cài, yêu cầu Node, link GitHub, dark mode).
2. `site` import được `@jjuidev/design-system/styles.css` từ tarball vendor; token màu/font
   DS áp dụng lên trang.
3. Docker image build được với `.dockerignore` mới; `ci/smoke-site-image.sh` pass gồm route
   `/assets/` mới; các route cũ (`/`, `/install.sh`, `/releases/latest/*`) giữ nguyên hành vi.
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (CLI) vẫn xanh; `react` không xuất
   hiện trong `package.json` gốc hay `dist/cli.mjs`.
5. CI (`ci.yml`) xây site trước khi `docker build`; mọi dependency của site pin exact version.
6. `docs/deployment-guide.md` cập nhật bảng route + bước build site.

## Phases

| Phase | File | Nội dung |
| --- | --- | --- |
| 01 | [phase-01-scaffold-site.md](./phase-01-scaffold-site.md) | Vendor DS pack + scaffold `site/` Vite React |
| 02 | [phase-02-deploy-pipeline.md](./phase-02-deploy-pipeline.md) | Docker, nginx, smoke test, .dockerignore, CI |
| 03 | [phase-03-verify-and-docs.md](./phase-03-verify-and-docs.md) | Full verification + cập nhật docs |

## Ràng buộc kỹ thuật

- **Pin exact version** cho mọi dependency mới. Nếu pnpm từ chối do `minimumReleaseAge`
  (tuổi tối thiểu của bản phát hành), lùi về bản exact cũ hơn — **không** thêm exclude vào
  `pnpm-workspace.yaml`.
- `pnpm pack` ở DS repo sinh tên file **không có scope** (`jjuidev-design-system-0.1.0.tgz`) —
  đặt tên lại khi copy vào `site/vendor/` cho deterministic (xác định).
- Chỉ `src/cli.ts` đụng process exit/global handler — site không thuộc luật này nhưng `src/`
  không được đổi.
- Lint cho site: mở rộng glob `lint` của `package.json` gốc để phủ `site/src` thay vì eslint
  config riêng (DRY — tránh trùng lặp).
