# Kongming — GO/NO-GO Phase-2 flow design (`init`)

Verdict: **GO** — với 4 fix trước khi implement (không có flaw blocking).

## 1. Apply order — sound, 2 lưu ý

- `prepare: "husky"` được ghi ở step 3 → `pm add` (step 5) CHẠY lifecycle `prepare` trong lúc install → activation thật xảy ra ở step 5; step 6 là safety net idempotent (bắt buộc khi user đã có `prepare` → skip → lifecycle không chạy). Không flaw — ghi rõ vào doc.
- `pm add` sẽ rewrite package.json đè phần deps đã ghi step 3 (giống specs → vô hại). Option gọn hơn: install on → để `pm add` ghi deps; chỉ ghi tay khi `--no-install`.
- Hazard duy nhất: project ĐÃ có `core.hooksPath` (husky cũ) + install fail → hooks mới live ngay, deps chưa có → commit fail khó hiểu. Fix rẻ: verify check `git config core.hooksPath` khi `--no-install`/install-fail → warning.

## 2. JSON.stringify manifest — chấp nhận được

JSON.parse bảo toàn insertion order → key order giữ nguyên; chỉ mất whitespace (package.json không có comment hợp lệ). `stringify(m, null, 2) + '\n'` ≈ output ppj. jsonc/patch là over-engineering. Đúng.

## 3. Keep-existing drop plugins — đúng

Plugin cho config bị keep = dead deps. Nhưng: `format` script + lint-staged vẫn gọi eslint/prettier CORE → core deps (eslint, @eslint/js, tseslint, globals, prettier, typescript, husky, lint-staged) PHẢI vẫn cài. Ghi rõ trong doc + `skipped` reasons đầy đủ.

## 4. tsconfig merge-min — thiếu 1 guard

- extends chain: an toàn (top-level override shallow). OK.
- **Solution-style / `references`** (Vite template react: tsconfig.json chỉ có references): paths ghi vào root không hiệu lực → alias câm. Guard: thấy `references` hoặc `files: []` → skip + skipped reason + hint, không viết.
- `baseUrl`: paths standalone hoạt động từ TS 4.1 (resolve tương đối). Nên gen `{"@/*": ["./src/*"]}` không cần baseUrl (baseUrl đang đi tới deprecated — medium confidence).

## 5. Non-TTY no-conflict proceed — nhất quán

`confirmOrCancel` (src/utils/prompts.ts:27-52): non-TTY + non-destructive → auto-proceed; chỉ destructive cần `--yes`. init không xoá gì, mutation chỉ khi conflict → có prompt. Đúng convention; đừng yêu cầu `-y` (phá CI-friendly).

## 6. Missing pieces

- InitResult thiếu: `conflicts` + resolution (replaced/kept) cho `--json`; install fail vẫn phải list generated/modified (không rỗng).
- PM exec map: mới định nghĩa cho ppj runner. Cần map đủ cho hooks + activation: pnpm→`pnpm exec` (repo-proof), npm→`npx`, yarn v1→không có `exec` → `yarn run`, berry→`yarn run`, bun→`bunx`.
- lint-staged v17: KHÔNG breaking — key `lint-staged` trong package.json vẫn chuẩn (repo live ^17.4.1); v17.4 thêm defineConfig/`--all`, không ảnh hưởng. Đóng open item.
- husky v9: `.husky/_` tự gitignore (`_/.gitignore` = `*`, repo-proof); hook `#!/usr/bin/env sh` + `pnpm exec lint-staged` sống thật trong repo → đóng phần lớn open item 4. Verify exec-bit phải skip trên win32 (noop).

## 7. Top risk

Resolve "latest" độc lập từng pkg → peer-dep conflict lúc `pm add` (pnpm strict peers), cao nhất: eslint major mới vs eslint-config-next/typescript-eslint peer ranges lag → install fail SAU khi đã ghi configs. Mitigation: đọc peerDependencies khi fetch metadata, chọn set tương thích. Thứ 2: PM command matrix (yarn v1, bun).

Sources: github.com/lint-staged/lint-staged/releases
