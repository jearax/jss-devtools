# Cooker report — Phase 1 round 2 (261110, 01:33) — 13 findings của planner

## Checks (chạy sau fix cuối)

- `pnpm --dir site lint` → pass · `typecheck` → pass · `test` → 22 files / 100 tests passed · `build` → ✓ 387ms
- render-check: 1 error (favicon 404 — tồn tại từ trước redesign), 7 warnings (wordmark hai tông của
  Logo package DS; skipLink `sr-only`; 7 control < 44px ở mouse — tất cả đã có `pointer-coarse:h-11`
  hoặc stylesheet riêng cho touch: Install, tab, replay, search).
- Overflow 390: `scrollWidth == clientWidth` (489/489); lệnh cài **một dòng**, scroll ngang bên trong
  với scrollbar ẩn (`cmdScrollable: true, clientHeight: 20`).

## Từng mục

**A1** — Tab terminal giờ là `init` / `doctor` / `harness`, phát `INIT_TRANSCRIPT` /
`DOCTOR_TRANSCRIPT` / `HARNESS_TRANSCRIPT` (`Home.constant.ts`). Install không còn trong terminal.
**A2** — Bỏ `fixedBody` (prop + CSS + chỗ dùng); window theo content, không còn khoảng trống.
**A3** — Bỏ `commandCopy` khỏi Hero (prop vẫn còn cho test Terminal).
**A4** — Revert `--font-serif` override; hero dùng `text-heading-3xl` (sans, semibold, hai tông bằng
`text-muted`). Đã ghi memory line: text-display-* là serif — không repoint token.
**A5** — `.installCommand` và `.command` của Terminal: `whitespace-pre` + `overflow-x-auto` +
`[scrollbar-width:none]`, bỏ `break-words`; bỏ cả override `max-sm:whitespace-normal` của Terminal.
**A6** — Header bỏ `max-w-6xl` (đo thật: logo 71 = eyebrow 71 = headline 71; FeatureRow cũng bỏ).
Frame dùng đúng `wrapper` (đề xuất planner) — border nằm ở mép box của wrapper; mép content của
band nằm đúng gutter 16px bên trong, nhất quán mọi band.
**A7** — Glow thay bằng phần tử `bg-primary/10 blur-3xl rounded-full` (tint /10 theo 0052, không
arbitrary, không palette step); bỏ `shadow-2xl` trên Terminal root (cả light lẫn dark).
**B8** — `FeatureRow` bỏ `lg:py-20` và `max-w-6xl`: base `py-20` + `max-lg:py-14`.
**B9** — Tách hết @apply trộn base + variant: SearchPalette (popup, footer), BackToTop,
SearchTrigger (label, shortcut), FeatureRow (row, card), Hero (inner, eyebrowVersion, nextLink),
Pager (root, link, next), Terminal (animated rules), Home ctaButton. Kiểm tra: grep dòng
`@apply` trộn unprefixed + variant → **0** (5 match còn lại là false positive `max-h-`/`max-w-`).
**B10** — `grid-cols-[minmax(0,1fr)_12.5rem]` (12.5rem là bậc spacing 50×4px); marker TOC đổi
`left-[-17px]` → `-left-4` (bậc spacing, marker đặt lên đường border).
**B11** — BackToTop: bỏ `pointer-coarse:h-11 w-11` và `max-sm:right-4 max-sm:bottom-4` trùng base.
**B12** — SearchPalette `top-[15vh]`, `max-h-[70vh]`, `w-[min(40rem,calc(100vw-2rem))]`: giữ nguyên
từ HEAD. Repo design-system (apps/site) không có locally (site vendored qua tarball) nên không đối
chiếu được nguồn — cần planner trích giá trị DS hoặc giữ nguyên.
**B13** — `styles.css`: 3 khai báo `animation-range` / `animation-timeline` giữ, mỗi dòng đã có
comment "no utility exists for scroll-driven animation properties"; 3 khai báo còn lại là custom
property font tokens (được phép).

## Đã chấp nhận (không đổi)

`style={{'--chars'/'--i'}}`, hex trong skin, `bg-raised/90`.

## Ảnh (sau fix cuối)

`screenshots/`: `home-1440-dark-final.png` (tab init, finished), `home-1440-dark-doctor-mid-replay.png`
(đang phát tab doctor), `home-390-dark-final.png`, `home-1440-light-final.png`,
`home-390-light-final.png`. render-check: `render-check/{375x812,768x1024,1440x900}.png`.

## Grep verifications

- min-width variant: `grep -rnE '(^|[ "@])(sm|md|lg|xl|2xl):' site/src | grep -v max-` → **0**.
- Khai báo thuần ngoài `@keyframes` trong `*.module.css` → **0** (tổng 9, tất cả trong keyframes).

## Trạng thái

DỪNG ở review gate. KHÔNG commit, KHÔNG push. Dev server port 5310 còn chạy.
