# Cooker report — Landing site React SPA "Hello world"

Status: **DONE**

Summary: Đã dựng `site/` — một React SPA (Vite) độc lập, nội dung giống hệt trang landing cũ,
dùng core brand tokens của `@jjuidev/design-system` 0.1.0 vendored dạng tarball; đã nối vào
pipeline nginx/Dokploy (Dockerfile, nginx route `/assets/`, smoke test, CI); `docker/home.html`
bị thay bằng SPA nên đã xóa và test liên quan được cập nhật. Toàn bộ chuỗi kiểm tra của CLI và
của site đều xanh, image docker build và smoke test pass thật. Planner review đã pass; ADR 0027 được
thêm theo review. Chưa commit, chưa push.

## Files đã tạo

| Path | Nội dung |
| --- | --- |
| `site/vendor/jjuidev-design-system-0.1.0.tgz` | Tarball `pnpm pack` từ DS repo, đặt đúng tên deterministic |
| `site/package.json` | Dự án pnpm độc lập: React 19.3.1, Vite 8.3.5, DS `file:vendor/...`, mọi dep pin exact |
| `site/pnpm-workspace.yaml` | `packages: []` — site là workspace root riêng, không vào workspace CLI |
| `site/pnpm-lock.yaml` | Lockfile riêng của site, đã commit |
| `site/tsconfig.json` | `jsx: react-jsx`, `moduleResolution: Bundler`, strict, `types: ["vite/client"]` |
| `site/vite.config.ts` | `defineConfig` gán const có tên + plugin `react()` |
| `site/index.html` | Shell `<html lang="vi">`, script đặt `data-theme="dark"` theo `prefers-color-scheme` |
| `site/src/main.tsx` | Import `styles.css` của DS + `site.css`, mount React root |
| `site/src/App.tsx` | Nội dung landing (tiêu đề, tagline, lệnh cài, yêu cầu Node, link GitHub) |
| `site/src/styles/site.css` | Layout, dùng token DS (`--border-color-default`, `--font-mono`, `--radius-md`, …) |
| `docs/decisions/0027-react-spa-landing-page.md` | ADR: landing page là React SPA do Vite build, DS vendor dạng tarball chỉ dùng `styles.css`, đánh đổi client-render do user chấp nhận; supersedes 0021 |

## Files đã sửa

| Path | Thay đổi |
| --- | --- |
| `package.json` | `lint`/`lint:fix` phủ `site/src/**/*.{ts,tsx}`; thêm script `build:site` |
| `eslint.config.mjs` | `SOURCE_FOLDERS` thêm `site/src` — site dùng chung config, không có config riêng |
| `tsconfig.json` | `exclude` thêm `site` (site có project riêng, root không typecheck site) |
| `.gitignore` | `!site/vendor/*.tgz` — tarball phải được commit để CI build không cần registry |
| `.dockerignore` | `!site/dist/` vào allow-list của build context |
| `docker/Dockerfile` | `COPY site/dist/ /usr/share/nginx/html/` thay cho `COPY docker/home.html …` |
| `docker/nginx.conf` | Thêm `location /assets/` với `Cache-Control: public, max-age=31536000, immutable` |
| `ci/smoke-site-image.sh` | Trích URL asset JS từ HTML, expect 200 + `immutable`, expect 404 cho asset không tồn tại |
| `.github/workflows/ci.yml` | Job `checks`: cài site + `pnpm --dir site typecheck`; job `image`: setup pnpm + build site trước `docker build` |
| `tests/install.test.ts` | Test "same Node floor on the home page" đọc `site/src/App.tsx` thay `docker/home.html` |
| `docs/deployment-guide.md` | Pipeline có bước build site; bảng "What the image carries" thêm `/assets/*` |
| `docs/codebase-summary.md` | Thêm mục `site/`, bỏ dòng `docker/home.html`, cập nhật Dockerfile/nginx/tsconfig/eslint |
| `docs/system-architecture.md` | Mô tả pipeline mới, routing table có `/assets/`, bảng "one fact, one home" trỏ sang `site/src/App.tsx` |
| `docs/decisions/0021, 0022, 0026` | Sửa tham chiếu tới file đã xóa; 0021 ghi chú trang tĩnh đã bị SPA thay |
| `docker/home.html` | **Xóa** — landing page do SPA phục vụ |

## Lệnh đã chạy và output thật

### Vendor design system

```
$ cd /Users/tandm/Documents/jearax/dokploy/design-system
$ pnpm pack --pack-destination .../site/vendor
...
/Users/tandm/Documents/jearax/npm/jss-devtools/site/vendor/jjuidev-design-system-0.1.0.tgz
```

`dist/lib/styles.css` đã có sẵn trong DS repo nên không cần chạy `pnpm build:lib`. `pnpm pack`
sinh đúng tên `jjuidev-design-system-0.1.0.tgz` (không có dấu `@`), nên **không** cần rename như
plan dự đoán.

### Cài đặt và build site

```
$ pnpm --dir site install
dependencies:
+ @jjuidev/design-system 0.1.0
+ react 19.3.1
+ react-dom 19.3.1
devDependencies:
+ @types/react 19.3.0
+ @types/react-dom 19.3.0
+ @vitejs/plugin-react 6.1.2
+ typescript 6.0.3 (7.0.2 is available)
+ vite 8.3.5
Done in 4.1s using pnpm v11.24.0
```

`pnpm --dir site install --frozen-lockfile` cũng pass (lockfile khớp) — đây là lệnh CI chạy.

```
$ pnpm --dir site build
$ tsc --noEmit && vite build
vite v8.3.5 building client environment for production...
✓ 17 modules transformed.
dist/index.html                   0.69 kB │ gzip:  0.44 kB
dist/assets/index-DZxiEPts.css   54.53 kB │ gzip:  9.15 kB
dist/assets/index-C6VaMhJS.js   220.49 kB │ gzip: 69.07 kB
✓ built in 66ms
```

### Chuỗi kiểm tra của CLI

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
...
 Test Files  30 passed | 1 skipped (31)
      Tests  472 passed | 7 skipped (479)
   Duration  5.85s
✔ Build complete in 28ms
CHAIN_EXIT=0
```

`pnpm format:check` cũng pass sau khi Prettier căn lại ba bảng trong `docs/` (Prettier yêu cầu cột
bảng thẳng hàng):

```
$ pnpm format:check
Checking formatting...
All matched files use Prettier code style!
```

### Kiểm tra site bằng trình duyệt (vite preview, cổng 4173)

Content render đúng, light và dark đều đúng (computed style đọc từ DOM):

```
light: bodyBg=rgb(255,255,255) bodyColor=rgb(28,22,18) tagline=rgb(107,97,90) theme=null
       bodyFont="Be Vietnam Pro", -apple-system, "system-ui", …   ← token --font-sans của DS
dark:  bodyBg=rgb(28,22,18) bodyColor=rgb(249,246,242) tagline=rgb(208,201,194) theme="dark"
```

Accessibility snapshot (light) cho đúng nội dung landing cũ: `h1 jss-devtools`, tagline, lệnh cài
`curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh`, yêu cầu `Node >= 24.11.0` +
`curl`/`wget`, `~/.local/bin/jss-devtools` + `PATH`, link `github.com/jearax/jss-devtools2`.

### Docker image và smoke test (chạy thật)

Daemon Docker không chạy sẵn nên đã `colima start`, build xong thì `colima stop` để trả về trạng
thái ban đầu.

```
$ node scripts/stage-release.mjs dist/cli.mjs
staged /Users/tandm/Documents/jearax/npm/jss-devtools/release/cli.mjs

$ docker build -f docker/Dockerfile -t jss-devtools-site-test .
#12 0.085 nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
#12 0.087 nginx: configuration file /etc/nginx/nginx.conf test is successful
#13 DONE 0.1s

$ sh ci/smoke-site-image.sh jss-devtools-site-test 0.0.1
smoke-site-image: every route answers as specified, and the installer works
```

Nội dung image (đúng allow-list, không lọt source của site):

```
/usr/share/nginx/html: 50x.html assets index.html install.sh releases
/usr/share/nginx/html/assets: index-C6VaMhJS.js index-DZxiEPts.css
```

Trang trong container thật cũng render đúng (snapshot trình duyệt với `http://127.0.0.1:8080/`
khớp nội dung landing cũ).

### Rò rỉ React vào CLI

```
$ grep -c "react" package.json   → 0
$ grep -c "react" pnpm-lock.yaml  → 0
$ grep -n "react" dist/cli.mjs   → 9362: "react",     ← chỉ là preset framework của lệnh init, có sẵn từ trước
```

## Đối chiếu acceptance criteria

| # | Tiêu chí | Kết quả |
| --- | --- | --- |
| 1 | `pnpm --dir site build` tạo `site/dist/index.html` + asset đã hash, nội dung khớp trang cũ | Đạt — asset `index-C6VaMhJS.js` / `index-DZxiEPts.css`, nội dung khớp (đã kiểm bằng trình duyệt) |
| 2 | Import được `@jjuidev/design-system/styles.css` từ tarball vendor, token màu/font áp dụng | Đạt — computed style lấy từ `--font-sans`, `--text-color-muted`, `--border-color-default` của DS |
| 3 | Image build được với `.dockerignore` mới, smoke pass kèm route `/assets/`, route cũ giữ nguyên | Đạt — build + smoke thật, `/assets/` trả 200 kèm `immutable`, `/install.sh` và `/releases/latest/*` vẫn `no-cache` |
| 4 | Chuỗi kiểm tra CLI xanh, `react` không xuất hiện ở `package.json` gốc hay `dist/cli.mjs` | Đạt — xem mục trên |
| 5 | CI build site trước `docker build`, mọi dependency của site pin exact | Đạt ở mức cấu hình — workflow đã sửa, **chưa** chạy trên GitHub Actions; xem Concerns |
| 6 | `docs/deployment-guide.md` cập nhật bảng route + bước build site | Đạt |

## Kết quả review của planner

Planner review đã pass, giữ nguyên toàn bộ thay đổi. Yêu cầu duy nhất là thêm decision record cho
quyết định "landing page là React SPA", đã làm xong: `docs/decisions/0027-react-spa-landing-page.md`
(theo format của ADR 0033/0034, có trích lời user và bảng "Options considered"), và ADR 0021
giờ trỏ sang 0027 với `supersedes: 0021`.

Concern 3 (thiếu ADR) đã được xử lý. Ba concern còn lại dưới đây — 2, 4, 5 — planner **chấp nhận,
không sửa**:

- Concern 2: giữ đúng một Node floor ở `package.json` gốc, `site/` không khai báo `engines`.
- Concern 4: cây dependency của design system là chi phí chấp nhận của việc vendor tarball; bundle
  không bị ảnh hưởng vì site chỉ import CSS.
- Concern 5: SEO client-render đã thuộc non-goals của plan.

## Concerns

1. **Workflow CI chưa được GitHub Actions chạy thật.** Thay đổi trong `.github/workflows/ci.yml`
   chỉ mới được kiểm tra bằng logic cục bộ (`pnpm --dir site install --frozen-lockfile`,
   `pnpm --dir site typecheck`, `pnpm --dir site build`, `docker build`, smoke script). Đặc biệt
   `pnpm/setup` trong job `image` và `cache-dependency-path` nhiều lockfile chưa từng chạy trên
   runner thật. Lần push đầu tiên là lần kiểm chứng đầu tiên của workflow này.
2. **`site/package.json` không khai báo `engines.node`.** Repo giữ "một Node floor duy nhất" ở
   `package.json` gốc; site là dự án riêng nên không nhân bản floor đó (sẽ phải sửa `site/` khi
   floor đổi). CI vẫn cài site trên đúng Node floor vì job `image` dùng
   `needs.checks.outputs.node`. Đổi lại: cài site ngoài CI không được pnpm chặn Node quá thấp.
   *(Planner đã chấp nhận, không sửa.)*
3. ~~**Chưa có decision record mới cho quyết định "landing page là React SPA".**~~ Đã xử lý:
   `docs/decisions/0027-react-spa-landing-page.md` ghi lại quyết định và supersedes 0021.
4. **Site kéo theo cây dependency của design system.** Chỉ dùng `styles.css` nhưng pnpm cài
   luôn dependency runtime của DS (`@base-ui/react`, `react-router`, `shiki`, `lucide-react`, …) —
   98 package. Đây là hệ quả của việc vendor dạng tarball `file:`; giảm nhẹ chỉ khi DS tách
   `styles.css` thành gói riêng. *(Planner đã chấp nhận, không sửa.)*
5. **SPA client-render nên HTML gần như rỗng với crawler.** Đã nằm trong non-goals của plan và
   user đã chấp nhận, nhưng cần nhớ khi trang này bắt đầu quan trọng với SEO.
   *(Planner đã chấp nhận, không sửa.)*
6. **Lệnh `pnpm pack` sinh tên file đúng như plan dự đoán** (`jjuidev-design-system-0.1.0.tgz`),
   nên không có bước rename nào được thực hiện — lệnh trong plan chưa đúng ở điểm này.

## Lệnh chạy sau review

```
$ npx prettier --write docs/decisions/0027-react-spa-landing-page.md
docs/decisions/0027-react-spa-landing-page.md 32ms

$ pnpm format:check
Checking formatting...
All matched files use Prettier code style!
```

## Blockers

Không có.
