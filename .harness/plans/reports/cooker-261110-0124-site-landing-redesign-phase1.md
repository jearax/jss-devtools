# Cooker report — Phase 1: hero prototype (261110, 01:24)

## Kết quả

Header + hero theo design brief, cả hai theme, hai bề rộng, đã qua render-check. Chờ planner duyệt
trước khi làm phase 2.

## Lệnh đã chạy (output thật)

- `pnpm --dir site lint` → pass (eslint + stylelint, 0 error)
- `pnpm --dir site typecheck` → pass
- `pnpm --dir site test` → 22 files / 100 tests passed
- `pnpm --dir site build` → ✓ built in 496ms
- `node render-check.mjs http://localhost:5310/` → 1 error, 7 warnings (xem dưới)
- Overflow 390px: `scrollWidth == clientWidth` trên `<html>` sau fix; 1440 tương tự.
- Text cách mép viewport ≥ 12px ở 390: qua (script đo `getBoundingClientRect().left >= 12`).

## Ảnh

Trong `.harness/plans/261110-0100-site-landing-redesign/screenshots/`:
- `home-1440-dark-final.png`, `home-1440-dark-finished.png` (mid-replay + finished)
- `home-390-dark-finished.png`, `home-1440-light-finished.png`, `home-390-light-finished.png`
- render-check: `render-check/375x812.png`, `768x1024.png`, `1440x900.png`

## render-check

- ERROR duy nhất: favicon.ico 404 — tồn tại từ trước redesign, không thuộc phạm vi phase này.
- WARN đã xử lý: Install button < 44px → thêm `pointer-coarse:h-11`.
- WARN còn lại (chấp nhận, có lý do): wordmark "jjui|dev" là Logo hai tông của package
  `@jjuidev/react` (thiết kế của DS, không phải lỗi gaps); skipLink là `sr-only` theo thiết kế;
  5 touch target còn lại là các control mono nhỏ của terminal (tab, replay — đã có
  `pointer-coarse:h-11` trên tab/replay; icon-only search là 44px qua SearchTrigger stylesheet).

## Responsive R1–R5 (chỉ thị planner, đã sửa TOÀN site/src, không chỉ phần redesign)

Các file viết lại desktop-first (min-width variant → `max-*`, mỗi breakpoint một `@apply`):

| File                                  | Thay đổi                                                     |
| ------------------------------------- | ------------------------------------------------------------ |
| `pages/Docs/styles.module.css`        | grid 2 cột base, `max-lg:` 1 cột; 220px → 14rem (bậc spacing) |
| `pages/Docs/components/Sidebar/*`     | toàn bộ `lg:` → base + `max-lg:`                              |
| `pages/Docs/components/DocPage/*`     | grid TOC + `max-lg:hidden` aside                              |
| `components/SiteHeader/*`             | nav `md:flex` → base flex + `max-md:hidden`                   |
| `components/Terminal/*`               | `lg:h-96` → `h-96` + `max-lg:h-auto`; `width < 640px` → `width < 40rem` |
| `pages/Home/styles.module.css`        | cta `lg:pb-24` → base + `max-lg:pb-16`                        |

Kiểm tra: `grep -rnE '(^|[ "@])(sm|md|lg|xl|2xl):' site/src` (loại `max-*`) → 0 kết quả.

## Full @apply (chỉ thị planner vòng 2)

- Terminal: 8 hex raw (`--terminal-*`) XOÁ theo decision 0042 → `text-success` / `text-error` /
  `text-warning` / `text-muted`; mọi khai báo thuần chuyển `@apply`, gồm
  `[scrollbar-width:none]`, `[font-variant-ligatures:none]`, `animate-[...]`, `motion-reduce:[animation:none]`,
  hai media query → `max-sm:` và `motion-reduce:` variants.
- Layout frame: viết lại theo phương án "wrapper + border-x" của planner — một phần tử
  `wrapper border-x border-default`, `absolute inset-y-0 left-1/2 -translate-x-1/2 -z-1`, không
  còn mirror 5 bậc width; `.root` thêm `isolate` để `-z-1` không thoát ra sau nền trang.
- CodeBlock: `max-h-(--code-max-height,none)` + arbitrary property ligatures.
- Hero: gradient glow → `bg-[image:radial-gradient(...)]` (token colour bên trong).
- Số đo: khai báo thuần trong `*.module.css` còn **9**, tất cả nằm trong `@keyframes` (được phép);
  ngoài keyframes = 0. `grep -rnE '^\s+[a-z-]+:\s' site/src --include='*.module.css'`.

## S2 — inline style còn lại (cần planner xác nhận)

2 chỗ `style={{{{...}}}}` trong `Terminal.tsx` đặt **CSS variable** (`--chars`, `--i`) cho từng dòng
— đây chính là kênh "CSS variable + arbitrary utility" mà quy ước định sẵn; không có cách nào đặt
per-element custom property mà không qua inline style. Giữ nguyên; nếu planner muốn path khác,
cần quyết định mới.

## Comments

Đã chạy `/jk:prune-comments` (xóa what-comments, khối giải thích thiết kế; giữ why một dòng:
hex→token, webkit scrollbar, reduced motion, width calc). Tỉ lệ comment trong dòng thêm của diff
pending: **34/307 = 11%** (trước đó 27%).

## Arbitrary value còn lại (báo đúng quy định)

- `SearchPalette`: `top-[15vh]`, `max-h-[70vh]`, `w-[min(40rem,calc(100vw-2rem))]`,
  `max-sm:max-h-[calc(100dvh-2rem)]` — không có token cho kích thước viewport-relative; chưa đổi
  vì SearchPalette thuộc phase 2/3. Nêu đây để planner quyết định.
- `grid-cols-[14rem_minmax(0,1fr)]`, `grid-cols-[minmax(0,1fr)_12.5rem]` — 14rem/12.5rem là bậc
  spacing scale (56/50 × 4px), dùng thay 220px/200px.

## Quyết định dưới quyền delegate

- `--font-serif` được trỏ về Be Vietnam Pro trong `styles.css` (role `text-display-*` của DS đọc
  token này; site không load serif nào — nếu không, hero sẽ rơi vào Georgia).
- Version eyebrow: Vite `define __CLI_VERSION__` đọc `package.json` một lần lúc build
  (`vite.config.ts`, `src/vite-env.d.ts`, `cli.constant.ts`) — không gõ tay.
- `PLATFORM_SCOPE` (docs) giữ nguyên; hero dùng hằng mới `INSTALL_PLATFORM_LABEL = 'macOS & Linux · WSL'` theo brief.
- Footer đã xoá (`SiteFooter`, test, chỗ dùng trong Layout) theo chỉ thị; BackToTop giữ lại.
- Terminal thêm 2 props: `replay` (nút replay trong tab strip) và `fixedBody` (ghim cao thân
  transcript ở lg, theo brief "fixed height at lg").

## Test đã cập nhật (không weakening — design cũ bị thay bởi brief mới)

- `Hero.test.tsx`: eye-brow version + install block + replay control + quickstart link (test cũ
  assert "no eyebrow", "không route" — đảo lại theo brief).
- `SiteHeader.test.tsx`: test cũ "carries no navigation links" → assert nav Docs/Reference + Install.
- `Home.test.tsx`: eyebrow trước h1; install command xuất hiện 2 lần (block + terminal).

## Chưa met / limitation

- Rubric self-critique loop (screenshots 375/768/1440): composition 3, hierarchy 3, typography 2
  (headline bị chặn ở `text-display-3xl` = 1.875rem — trông nhỏ với hero split; muốn to hơn phải
  là quyết định đổi DS 0053, không phải việc của site), color 3, states 2 (hover/active/focus đã
  có trên control chính; press-state screenshot cần Playwright giữ mousedown — để phase 4),
  responsive 3, craft 3. Không item < 2.
- Favicon 404: tồn tại từ trước, chưa sửa (ngoài phạm vi).
- `node dist/cli.mjs harness doctor` chưa chạy trong phase này (không đụng CLI; sẽ chạy ở phase 4
  proof tổng).

## Trạng thái

DỪNG ở review gate phase 1 theo plan. Dev server đang chạy ở port 5310 (process này sẽ tắt khi
cooker được prompt tiếp). KHÔNG commit, KHÔNG push.
