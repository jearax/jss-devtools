# Scout Report — Trang web giới thiệu cho jss-devtools bằng React

## Hiện trạng site

Site giới thiệu hiện là **một file HTML tĩnh duy nhất**: `docker/home.html` (72 dòng, tiếng Việt,
light/dark). Nginx trong `docker/Dockerfile` chỉ phục vụ đúng 4 route:

| Route | File | Cache |
| --- | --- | --- |
| `/` | `index.html` (chính là `home.html`) | default |
| `/install.sh` | installer | `no-cache` |
| `/releases/latest/cli.mjs` | bundle CLI | `no-cache` |
| `/releases/latest/checksums.txt` | checksum | `no-cache` |

Mọi path khác — kể cả `/assets/anything` — trả 404. Server không bao giờ build gì.

Deploy: push tới `main` → job `checks` → job `image` (build image nginx, smoke test
`ci/smoke-site-image.sh`, push GHCR) → job `deploy` (webhook Dokploy). Build context là
allow-list (bộ cho phép) qua `.dockerignore`.

## File liên quan khi thay landing

- `docker/home.html` — trang hiện tại, sẽ bị thay.
- `docker/Dockerfile`, `docker/nginx.conf` — cần phục vụ thêm asset build (JS/CSS) nếu dùng React SPA.
- `ci/smoke-site-image.sh` — smoke test (kiểm thử khói) từng route, cần cập nhật.
- `.dockerignore` — allow-list build context.
- `docs/deployment-guide.md` — bảng route/cache cần cập nhật.
- GitHub workflow trong `.github/workflows/` — job `checks`/`image` nếu thêm bước build site.

## Các phương án

### A. Vite + React SPA, build tĩnh, giữ nginx image
`landing/` build ra static (HTML + JS + CSS assets), Dockerfile COPY thay `home.html`.
Cần mở nginx cho thư mục asset (vd. `/assets/`) + cache header + cập nhật smoke test.
Nhược điểm: SPA client-render → HTML ban đầu gần như rỗng, SEO (tối ưu công cụ tìm kiếm) yếu
cho landing page.

### B. Vite + React + prerender (render trước) tại build
Như A nhưng dùng plugin prerender để xuất HTML đầy đủ nội dung ngay tại build. SEO tốt,
vẫn giữ nguyên pipeline nginx. Cần pin exact version plugin và verify output.

### C. Next.js static export (`output: 'export'`)
Xuất HTML tĩnh tại build, SEO tốt sẵn, ecosystem đầy đủ nếu sau này mở rộng thành docs/blog.
Nhược điểm: phụ thuộc nặng (Next) cho một landing page; lean goal (mục tiêu tinh gọn) của repo.

### D. Astro + React islands
Chuẩn content-site, HTML tĩnh mặc định, React chỉ ở nơi cần tương tác. Kỹ thuật không phải
"React thuần" nhưng là lựa chọn content landing mạnh nhất. Astro cũng build ra static cho nginx.

### E. Host ngoài (Vercel / Cloudflare Pages), tách khỏi repo deploy
UI tốt nhất, deploy riêng. Nhược điểm: phá mô hình "một repo, một deploy" hiện có; thêm surface
(vị trí vận hành) — domain, DNS, cert.

## Phương án không dùng framework

Giữ nguyên một file HTML như hiện tại. Nội dung landing này chỉ là: tagline (khẩu hiệu),
lệnh cài đặt, yêu cầu, link GitHub — file hiện tại đã làm đúng việc đó. Bất kỳ lựa chọn React nào
đều phải trả giá bằng: thêm bước build site, thêm asset route trong nginx, cập nhật smoke test
và deployment guide.

## Unresolved Questions (câu hỏi chưa quyết)

- Quy mô trang: chỉ 1 landing page, hay dự kiến mở thành docs/tài liệu đầy đủ?
- Có bắt buộc React không, khi file HTML tĩnh hiện tại đã phủ đủ nội dung giới thiệu?
