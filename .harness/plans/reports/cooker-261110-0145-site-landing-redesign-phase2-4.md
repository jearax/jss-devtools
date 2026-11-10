# Cooker report — Phases 2–4 (261110, 01:45) — đã áp 4 fix đầu phase 2 của planner

## Checks (output thật, lần chạy cuối)

- `pnpm --dir site lint` → pass (eslint + stylelint)
- `pnpm --dir site typecheck` → pass
- `pnpm --dir site test` → **23 files / 103 tests passed**
- `pnpm --dir site build` → ✓ built in 384ms
- `node dist/cli.mjs harness doctor` → "Harness is healthy" (v0.0.1, memory 3825/9600)
- render-check (home, /docs/getting-started, /docs/reference × 375/768/1440): mỗi trang còn đúng
  **1 error = favicon.ico 404** (tồn tại từ trước redesign, chưa sửa vì ngoài phạm vi; một lỗi
  React duplicate-key trong FileTree đã phát hiện và sửa trong vòng render-check).
- Overflow: `scrollWidth == clientWidth` (489/489 ở 390, 1429/1429 ở 1440) trên home và docs;
  không text nào cách mép < 12px (đo `getBoundingClientRect().left >= 12` → rỗng).
- Fix 1 planner, đo thật: **eyebrow top = 200px không đổi qua cả 3 tab** (script bấm lần lượt
  init → doctor → harness rồi đọc lại). Test mới `keeps the left column fixed when switching tabs`.

## 4 fix đầu phase 2 (theo planner)

1. Terminal `fixedBody`: thân ghim `h-96` ở desktop (đủ transcript dài nhất — init, 14 dòng),
   `max-lg:h-auto`; cột trái không di chuyển (đo + test như trên).
2. Glow: bỏ `overflow-hidden` (không còn cạnh cắt cứng); glow là `bg-primary/10 blur-3xl
   rounded-full`, đặt `right-1/4 top-1/3` — nằm trong frame, mờ dần, cả hai theme.
3. Lệnh install: thêm `mask-r-from-85%` (fade mép phải) — áp cho cả install block lẫn lệnh terminal.
4. SearchPalette theo **DS `apps/site/src/pages/Home/components/CommandPalette/styles.module.css`**
   (nguồn do planner cung cấp): `top-[12vh]`, `w-[min(36rem,calc(100%-2rem))]`,
   list `max-h-[60dvh]`. Scrim `bg-neutral-950/40` giữ theo 0052.

## Phase 2 — landing

- **CommandsBand** (thay FeatureRow cards): một khung hairline, 3 cột chia nhau bằng border-l,
  cả cột là một link (hover `bg-hover`, press `bg-active`, focus-ring, arrow dịch trên hover,
  `motion-reduce` tắt); mono command (h3), one-line job, facts, link docs.
- **FileTree + `repository-tree.constant.ts`**: cây mono từ decisions 0030 (node preset) và 0031
  (`.harness/` mở cấp 1: MEMORY.md, BOOTSTRAP.md, config.json, bin/, core/, decisions/, docs/,
  plans/, templates/); mỗi node ghi `source` decision. Test khẳng định cấu trúc (mức lồng hợp lệ)
  và các tên được decisions nêu. Bên phải là 3 điểm: Memory / Decisions / Plans.
- **Closing band**: InstallBlock (component dùng chung với hero) + `Getting started` (primary) +
  `Read the docs` (secondary).
- **Entrance**: copy stagger 0–240ms, terminal 300ms, CSS only, `prefers-reduced-motion` tắt hẳn.
- **Footer** đã xoá từ vòng trước; BackToTop giữ. Dot pattern và CTA cũ đã mất theo rewrite.

## Phase 3 — mini docs

- Header + frame chung với landing (Layout dùng chung, đã verify logo = eyebrow = 71px trên home;
  docs cùng wrapper).
- Sidebar: nhãn nhóm mono uppercase (đã có), selected-item pattern thêm **marker bar**
  (`before:` bar bg-primary) + `bg-selected`; hover giữ neutral để phân biệt; mobile là **disclosure
  drawer** (button `aria-expanded`, list gập qua `max-lg:hidden!` — cần `!` vì `.list` display:flex
  cùng specificity thắng nếu chỉ ghi thường; ảnh 390 xác nhận chỉ còn nhãn "Docs").
- Reading column: `prose` giữ, thêm surface cho header ô bảng (`bg-hover`); CodeBlock đã là terminal
  surface (WindowChrome) hai theme với copy.
- TOC active marker theo scroll (đã có, verify trong ảnh docs-install).
- Pager: hai link viền (`border border-default`, hover/press), label hướng + title.

## Phase 4 — proof

- Greps (output thật):
  - min-width variant: `grep -rnE '(^|[ "@])(sm|md|lg|xl|2xl):' site/src | grep -v max-` → **0**.
  - `@media` trong site/src: chỉ `width < Nrem` và `prefers-reduced-motion` → đúng quy ước.
  - Khai báo thuần trong `*.module.css`: **11 dòng, toàn bộ nằm trong `@keyframes`** (Terminal 9,
    Hero keyframes); ngoài keyframes = 0 (FileTree đã chuyển thành arbitrary property).
  - Arbitrary px: grep `\[[^]]*px\]` → **0**.
  - Palette step ngoài skin: chỉ glow `bg-primary/10` (0052 tint) và scrim `bg-neutral-950/40`.
- Contrast: toàn bộ cặp màu là token semantic của DS (đã qua contract của package); skin không đổi
  nên không chạy skin-check.
- Rubric self-critique (round 1): composition 3, hierarchy 3, typography 3, color 3, states 3,
  responsive 3, craft 2 (điểm yếu nhất: animation timeline của terminal reveal khi replay nhanh —
  đã thử, chấp nhận vì terminal fade ở mobile là token-based; không item dưới 2). Sau fix, không
  cần round 2 vì mọi item ≥ 2 và render-check sạch lỗi thật.
- Screenshots (sau thay đổi cuối): `screenshots/` — home 1440/390 × dark/light final;
  `home-1440-dark-doctor-mid-replay.png`; docs install + getting-started × 1440/390 × dark/light;
  state shots `install-hover/press/focus`, `column-hover/press`, `tab-hover`, `sidebar-hover`
  (dark + light, chụp bằng Playwright giữ mousedown thật cho press, Tab thật cho focus-visible).
- render-check outputs: `render-check/` trong thư mục plan.

## Journal

`ak journal create` → `.harness/plans/journals/2026-11-09-site-landing-redesign-phases-2-4-....md`.
AgentWiki publish skipped.

## Câu hỏi còn mở

- Favicon 404: thêm file favicon hay để planner quyết định (ngoài phạm vi redesign).

## Trạng thái

Phase 2–4 xong, KHÔNG commit, KHÔNG push. Dev server còn ở 5310.
