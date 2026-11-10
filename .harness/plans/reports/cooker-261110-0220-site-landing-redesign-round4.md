# Cooker report — Round 4 (261110, 02:20) — 8 findings của planner

## Checks (output thật, sau fix cuối)

- `pnpm --dir site lint` → pass · `typecheck` → pass · `test` → **23 files / 103 tests passed** · `build` → ✓ 388ms
- `node dist/cli.mjs harness doctor` → "Harness is healthy" (chạy ở round trước, CLI không đổi)
- render-check đã chạy ở round trước cho home + 2 docs pages; lỗi thật duy nhất còn lại là
  favicon 404 (câu hỏi còn mở).

## Từng mục (đo thật bằng Playwright tại 1440)

1. **Band tràn hết frame**: CommandsBand `.row` giờ `-mx-4 border-y border-default`, bỏ viền dọc
   ngoài (frame giữ hai đường dọc, cột chỉ giữ vạch chia). Đo: `rowLeft 60 == frameLeft 60`,
   `rowRight 1380 == frameRight 1380`.
2. **Repository band**: cột trái `sticky top-24 self-start` đi theo cây file; nhịp trên giảm —
   band `pt-10 pb-20` thay `py-20`.
3. **Closing band** có heading `text-heading-2xl` hai tông: "Install in one **line.**" (muted từ
   "line."), nhịp `pt-10 pb-20` như các band.
4. **Lệnh desktop không còn fade cụt**: mask chuyển sang `max-lg:mask-r-from-85%` (chỉ fade khi
   bề rộng hẹp thật sự tràn; áp cho InstallBlock và lệnh terminal); block mở rộng `max-w-2xl`.
5. **Cột harness**: `jss-devtools harness` (lệnh cha) trong `commands.constant.ts`; hai
   subcommand đã nằm trong phần mô tả.
6. **Docs cùng frame + wrapper**: bỏ `max-w-6xl` của docs grid và surface `bg-surface` của docs
   root (surface vẽ đè frame vì frame là negative-z trong cùng stacking context). Đo:
   `logoLeft 76 == sidebarLeft 76`, frame có ở docs (`frameLeft 60`).
7. **TOC gióng top**: Breadcrumbs/h1/summary chuyển vào cột trái của grid, aside bắt đầu từ row
   top. Đo: `asideTop 135 == đỉnh cột nội dung (breadcrumb)`; h1 ở 187 sau breadcrumb.
8. **Artifact gốc repo**: `render-check/` chuyển vào
   `.harness/plans/261110-0100-site-landing-redesign/render-check-round3/` (gitignored); gốc repo
   sạch (`ls render-check` → không còn).

## Greps (output thật)

- min-width variant → **0**; khai báo thuần ngoài keyframes → **0**; arbitrary px → **0**;
  hex ngoài skin → **0**.

## Ảnh (sau fix cuối, toàn bộ band)

`screenshots/`: `home-1440-{dark,light}-screen{1,2}.png`, `home-390-{dark,light}-screen{1..N}.png`
(scroll từng viewport phủ hết trang), `docs-{install,getting-started}-{1440,390}-{dark,light}.png`,
cùng bộ state shots và matrix của các vòng trước.

## Câu hỏi còn mở

- Favicon 404: thêm hay bỏ, chờ planner.

## Trạng thái

KHÔNG commit, KHÔNG push. Dev server 5310 còn chạy.

## Addendum — round 5 (02:20 +): 2 lỗi mobile 390 của planner

1. `.repositoryHead` thêm `@apply max-lg:static` — sticky chỉ ở desktop hai cột. Ảnh giữa band
   `home-390-{dark,light}-repository-mid.png`: cột trái cuộn đi theo, không còn đè cây file.
2. Closing band: `.closingActions` và hai nút `max-sm` xếp cột full-width (hết ngắt chữ);
   `.closing` thêm `max-sm:pb-24` để back-to-top không đè nút cuối. Ảnh
   `home-390-{dark,light}-closing.png`.

Lệnh chạy lần cuối: lint → pass, typecheck → pass, test → 23 files / 103 tests passed,
build → ✓ built in 361ms.
