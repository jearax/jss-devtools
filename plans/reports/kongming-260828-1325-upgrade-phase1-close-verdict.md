---
title: "Kongming GO/NO-GO — upgrade phase-01 close verdict"
created: 2026-08-28
verdict: GO (code giữ local, user manual-test trước commit)
plan: plans/260828-1230-upgrade-command-design (phase-01)
pre-phase: plans/reports/kongming-260828-1229-upgrade-design-go-no-go.md
---

# Kongming Close Verdict — upgrade phase-01 (2026-08-28)

## Verdict: **GO** — close phase-01

Verify độc lập từ source + re-run gates + live matrix (không tin summary). Cả 3
amendments (A1/A2/A3) landed đúng verbatim. Beyond-plan fix (versions normalization)
đúng cause, đúng boundary, có test. Không tìm thấy yếu tố NO-GO.

## Amendments conformance (verify từng cái)

- **A1** — `update.ts` không còn `subCommands`; `specVer` positional (update.ts:16-21);
  dispatch thủ công `specVer === 'check'` (update.ts:39) → dynamic import check handler,
  ngược lại `runUpgradeFlow(extractSelfArgs(args), 'update')` (update.ts:50). User overrule
  "bỏ list/ls, chỉ check" được ghi trong plan.md:32 — `update list` giờ → `SPEC_INVALID`
  structured (live verify, không crash, không usage dump). Delta chấp nhận: `update check
  --help` render parent help — smoke test encode (smoke.test.ts:136-143).
- **A2** — double-exec chết về cấu trúc (một run duy nhất). Regression 2 tầng: unit
  (upgrade.test.ts:383-396: `check` + `--yes` → `execOrDryRunInstall` và
  `fetchPackageMetadata` KHÔNG gọi, exit undefined) + binary smoke single-doc
  (smoke.test.ts:180-192, assert KHÔNG có `"command": "update"` khi check thành công).
  Live: `update check --json | jq -s length` = **1**, `command: "update check"`.
- **A3** — `destructive: resolved.majorBump === true && !dryRun` verbatim
  (update-shared.ts:220), tái dùng `ConfirmOptions.destructive`; **prompts.ts untouched**
  (git status: chỉ 5 files sửa — 4 src + smoke.test.ts). Gate matrix live-verified:
  non-TTY không --yes major → exit 1 `REQUIRES_CONFIRMATION`, payload `dryRun:false`,
  `majorBump:true`, target 1.0.0 · `--yes --dry-run` major → KHÔNG gate, 1 doc dry-run.
- **G6** — mọi payload mang dryRun thật: fetch guard (update-shared.ts:58 `ctx.dryRun`),
  exec guard (:97), cancelled (:224), success (:247).

## Gates (re-run độc lập, exit codes tự thấy)

`pnpm lint` 0 · `pnpm typecheck` 0 · `pnpm test` **69/69** · `pnpm build` 0.

Live matrix (chỉ dry-run/read-only, re-verify): dry-run `| jq -s length` = 1, cmdStr
`npm i -g jss-devtools@1.0.0` · gate REQUIRES_CONFIRMATION exit 1 dryRun=false ·
`update check --json` 1 doc (path TỪNG crash `TypeError: meta.versions.filter` — giờ chạy
live được) · `update bogus-tag --json` → SPEC_INVALID exit 1 · `update 0.0.52 --dry-run`
→ SPEC_INVALID hướng downgrade · alias parity `update 1.0.0 --yes --dry-run --json` →
`command:"update"`, dryRun:true. Registry premise confirmed: `dist-tags.latest = 1.0.0`
(old-lineage), `next = 0.0.52` → **lệnh cấm real-exec --yes giữ nguyên tới khi 0.1.0 publish**.

## Q2 — versions normalization: COVER ĐỦ, đúng chỗ

- Consumers grep toàn src: `update-check.ts:12` (filter), `resolve-target.ts:52`
  (includes), `:60`/`:80` (stableVersions), **và `downgrade.ts:55` — consumer thứ 4 mà
  summary không liệt kê**. Boundary fix tự động che nó: downgrade share `resolveTarget`
  nên pre-fix nó cùng class crash `update 0.0.52` — đây là lý do CỘNG cho fix ở client
  boundary thay vì từng consumer. `update.ts` không đụng metadata trực tiếp (grep xác nhận).
- Wire-shape còn lại: `time` optional, mọi access `meta.time?.[v]` + `??` fallback
  (update-check.ts:41,55) — an toàn. `dist-tags` —typed `Record<string,string>`, đúng wire
  shape; **lỗ hổng lý thuyết duy nhất**: `resolve-target.ts:80` `meta['dist-tags'].latest`
  sẽ TypeError nếu dist-tags thiếu, và throw đó nằm NGOÀI guard (resolveTarget pure theo
  design). Chỉ reachable nếu registry trả 200 thiếu dist-tags — với REGISTRY hardcode
  registry.npmjs.org thì không xảy ra. Không blocker; lưu ý nếu sau này registry URL cấu
  hình được. Degenerate inputs đều graceful: versions thiếu → `[]` (test có), versions
  string → Object.keys index-strings → semver.valid lọc sạch, không crash.

## Q3 — fetch-fail payload dryRun = requested mode: SANE

Khớp chính xác family contract của uninstall: MỌI payload của uninstall mang dryRun thật
(uninstall.ts:45 error, :135 cancelled, :160 success). update-shared giờ uniform y hệt.
Test có riêng (upgrade.test.ts:138-153). Một nốt cosmetics: `SPEC_INVALID`/`noop`
hardcode `baseResult(..., false)` (update-shared.ts:164,188) nên `update bogus --dry-run
--json` → `dryRun:false` — path này không represent operation nào chạy/cả mô phỏng, 2 chiều
đều bảo vệ được; gom vào DRY-merge downgrade, không phải blocker.

## Q4 — Top-3 residual risks cho manual-test round

1. **Real-exec ban (human factor, cao nhất).** `--yes` đi qua mọi bump theo design —
   gate không cứu. `upgrade --yes` / `update --yes` không `--dry-run` = cài old-lineage
   1.0.0 ĐÈ môi trường dev. Recovery tiện tay: `jss-devtools-0.1.0.tgz` đang nằm repo root.
   Cấm giữ nguyên tới khi publish 0.1.0.
2. **Đúng binary đang test.** Global `jss-devtools` trên máy là 0.1.0 build từ tgz snapshot
   CŨ — có thể thiếu dispatch rewrite. Manual test chạy `node dist/cli/cli.js` (build mới)
   hoặc re-pack; xác nhận `--version` + `update --help` có positional specVer trước khi test.
   File `jss-devtools-0.1.0.tgz` untracked — KHÔNG commit (thêm .gitignore `*.tgz` nếu muốn).
3. **TTY prompt chưa từng chạy thật.** Unit mock `@clack confirm`; manual round là lần đầu
   prompt đa dòng (display name + Will run từ resolveCommand) render thật — kiểm tra TTY:
   prompt đọc được, `n` → exit 0 cancelled payload dryRun đúng; ⚠️ major warn in TRƯỚC
   prompt, standalone. Kèm 2 phút dispatch edges: `update check` TTY + non-TTY, flags
   trước/sau keyword (`update --json check`).

## Beyond-plan fix đánh giá

Normalize `versions` object→array tại `fetch-package.ts:38-47`: đúng boundary (client là
điểm duy nhất biết wire shape), giữ dist-tags/time nguyên, 4 unit tests stub fetch (object,
array-as-is, missing, preserve). Fix luôn crash class cho downgrade + upgrade cùng lúc.
Correct call — chấp nhận vào phase.

## Bookkeeping nits (không block)

- Phase-01 ghi "21 upgrade tests" — thực tế `upgrade.test.ts` = **20** (69/69 tổng vẫn đúng;
  20 + 44 cũ + 4 normalization + 1 smoke thêm = 69). Sửa số trong phase file nếu muốn sạch.
- Deferred (scaffold dedup ~40 dòng, update-shared.ts 263 dòng > ngưỡng 200, labels cũ
  uninstall.test.ts): deferral hợp lý — downgrade DRY-merge sẽ đụng lại update-shared, tách
  bây giờ là churn. Giữ trong non-goals phase sau.

## Unresolved questions

Không có câu block. Manual-test gate (ritual) + cấm real-exec tới publish là 2 điều kiện
đi kèm GO.
