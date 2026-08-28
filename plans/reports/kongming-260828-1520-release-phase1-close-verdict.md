# Kongming — GO/NO-GO hậu triển khai: Release & Publish Pipeline (close verdict)

- **Date:** 2026-08-28 · **Plan:** `plans/260828-1445-release-publish-pipeline/` · **Checkpoint:** post-implementation, trước khi bàn giao user-side steps
- **Verdict:** **GO** — bàn giao user-side (secret → commit → push → tag). Không có blocker kỹ thuật.
- **2 điều kèm theo:** (1) **BẮT BUỘC sửa runbook full-loop** — registry 0.3.2 KHÔNG có self-commands, vòng "0.3.2 → upgrade → 0.4.0" bất khả thi như đề xuất; thay bằng sequence đã verify ở §5. (2) **Nên-sửa-trước-commit:** `README.md:9` còn 1 dòng stale `jearax/jss-cli` (tóm tắt caller nói README đã sạch — sai, còn sót dòng thứ 3).

**Phương pháp:** không tin tóm tắt caller — tự rerun 4 gates, tự audit `git diff` toàn bộ, tự parse YAML, tự simulate guard, tự kiểm tra tarball + CLI đã install thật, tự tải 0.3.2 từ registry về chạy greps.

## 1. Gates tự chạy (working tree hiện tại, không phải claim của caller)

| Gate | Kết quả |
|---|---|
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm build` | pass (`dist/cli/cli.js` 45.9KB) |
| `pnpm test` | **69/69** pass (9 files) |

## 2. Audit diff — khớp plan + 2 amendment, không có file ngoài scope

`git status --porcelain`: đúng 8 file modified (README, package.json, downgrade.ts, update-check.ts, update-shared.ts, banner.ts, 2 test files) + 2 file mới (release.yml, LICENSE) + plans/. Không có thay đổi lạc ngoại.

- **package.json:** `@jjuidev/jss-devtools` · `0.4.0` · `MIT` · repository/bugs/homepage `jearax/jss-devtools` · `publishConfig.access: public` có sẵn · `files: ["dist"]`. Không có field `packageManager` → `pnpm/action-setup version: 11` tường minh là đúng cách duy nhất.
- **LICENSE:** MIT 2026 jjuidev — khớp `license: MIT`.
- **Cascade:** `update-shared.ts`, `downgrade.ts` → `const PKG = PKG_INFO.name`; `update-check.ts` 2 literals → `PKG_INFO.name`. `store.ts:47` giữ `'jss-devtools'` đúng plan (conf identity, không chứa `/`).
- **Amendment A2 (banner):** `banner.ts:10` — `Object.keys(PKG_INFO.bin)[0] ?? PKG_INFO.name` kèm comment giải thích 98 cột. Verified live: `jss-devtools version` render ASCII art `jss-devtools` (~60 cột), không còn art scoped name.
- **Amendment A1 (publish flags):** `release.yml:69` — `pnpm publish --access public --no-git-checks --ignore-scripts` + comment giải thích detached HEAD. Đúng như amendment.
- **Tests:** 4 call assertions + prompt spec chuyển sang `PKG_INFO.name` (dynamic, không hardcode version) — các literal `jss-devtools` còn lại trong tests là fixture tự nhất quán (cả 2 vế assertion dùng cùng literal), vô hại.
- **README:** dòng Package name + Repo đã sửa; **còn `README.md:9`:** ``- **Distribution:** Public open-source on npm + GitHub (`jearax/jss-cli`)`` — stale. README đi vào tarball → hiện trên npm page. 5 giây sửa; khuyến nghị fold vào cùng commit.

## 3. release.yml — review từ source (Q2)

- **YAML validity:** parse OK (ruby YAML).
- **Step order + mirrors ci.yml:** Node `24`, `pnpm/action-setup@v4 version: 11`, khối `actions/cache@v4` pnpm store copy nguyên văn từ ci.yml, `pnpm install --frozen-lockfile`, gates theo đúng thứ tự ci.yml (lint → typecheck → build → test). Không có mismatch version pin giữa 2 workflow (câu hỏi của caller: KHÔNG có mismatch — cả hai `version: 11`, cả hai setup-node trước action-setup, cả hai dùng actions/cache thủ công chứ không phải `cache: pnpm` của setup-node → nhất quán).
- **Guard:** `TAG="${GITHUB_REF_NAME#v}"` vs `package.json` version — simulate local với `GITHUB_REF_NAME=v0.4.0` → pass; mismatch sẽ exit 1 TRƯỚC publish. Trigger `tags: ['v*']` chỉ match tag có prefix v.
- **Permissions:** `contents: read` — least-privilege, đủ (publish npm không cần GitHub permission nào). Không `id-token` → không provenance; nếu sau này muốn npm provenance thì thêm `id-token: write` + `--provenance` — không phải bây giờ.
- **Secret scoping:** `NODE_AUTH_TOKEN` env chỉ trên publish step; setup-node `registry-url` ghi `~/.npmrc` với `${NODE_AUTH_TOKEN}` (pattern chuẩn, verified-by-docs).
- **Kết luận:** không tìm thấy gì fail ở first run ngoài 2 rủi ro vận hành đã biết (token scope — risk #1; tag sai commit — xem runbook §5).

## 4. Empirical: tarball + máy thật (không tin claim)

- `jjuidev-jss-devtools-0.4.0.tgz`: đúng 5 entries — `package/LICENSE`, `package/dist/cli/cli.js`, `package/dist/cli/cli.js.map`, `package/README.md`, `package/package.json`. Inner package.json name/version/bin đúng. Không rác (plans/, .tgz cũ, .npmrc đều không lọt).
- `*.tgz` đã gitignore (dòng 44) → không risk commit nhầm tarball.
- Máy đang install global `@jjuidev/jss-devtools@0.4.0` (từ tarball):
  - `jss-devtools version` → banner bin-name art + `0.4.0`.
  - `update check --json` → package `@jjuidev/jss-devtools`, current `0.4.0`, `latestStable: 0.3.2` (registry thật), `hasUpdate: false` — đúng logic pre-publish.
  - `uninstall --yes --dry-run --json` → pm npm, `cmdStr: npm uninstall -g @jjuidev/jss-devtools` — scoped-safe. Shadow note từ ledger in đúng.

### Sourcemap trong tarball (Q3) — LEAVE, đồng ý KISS default

`sourcemap: true` trong tsup.config.ts:14 → map 81.5KB vào tarball. Nhận: repo MIT công khai, source vốn đã public trên GitHub — không lộ gì; map chỉ chứa sourcesContent của `src/`; size tăng không đáng kể; stack trace có thể map về TS khi debug (`--enable-source-maps`). Excluding maps (`"!dist/**/*.map"`) là micro-optimization không mua được gì bây giờ. Không đổi.

## 5. Phát hiện load-bearing: registry 0.3.2 KHÔNG có self-commands (Q4)

Tải `@jjuidev/jss-devtools@0.3.2` từ registry về (/tmp), inspect:

- Bundle layout khác hoàn toàn (`dist/{cjs,esm,types,fonts}` — không phải single-bundle `dist/cli/cli.js` của codebase này).
- Grep bundle entry: **0occurrence** của `upgrade` / `downgrade` / `uninstall` / `scaffold`. Deps có `globby`/`defu` — lineage khác.

**Hệ quả:** bước "install 0.3.2 → `jss-devtools upgrade` real-exec lên 0.4.0" trong runbook đề xuất **bất khả thi** — 0.3.2 không có lệnh `upgrade` để gọi. Không phải bug của ta; chỉ là runbook phải đổi.

**Runbook đã sửa (thứ tự verify, mỗi bước reversible):**

1. Tạo granular **NPM_TOKEN**: Packages and scopes → chọn `@jjuidev/jss-devtools` (hoặc all packages) **Read-write**. Classic token với `read:packages`+`write:packages` cũng chạy. 2FA: token publish không cần OTP.
2. GitHub repo → Settings → Secrets and variables → Actions → New secret, tên **chính xác `NPM_TOKEN`** (workflow tham chiếu đúng tên này).
3. Commit toàn bộ (user tự commit theo rule): 8 modified + `release.yml` + `LICENSE` + plans/ + reports/. **LƯU Ý: `LICENSE` đang untracked — nếu quên add, tarball CI thiếu LICENSE (npm chỉ warn, không fail, nhưng nên đủ).**
4. `git push origin main` — **xong push branch rồi mới tag**.
5. `git tag v0.4.0` (trên HEAD vừa push — **tag phải trỏ vào commit chứa release.yml + package.json 0.4.0**; tag nhầm commit cũ: nếu version lệch → guard fail rõ; nếu commit cũ chưa có release.yml → workflow **im lặng không chạy**, đây là bẫy âm thầm duy nhất) → `git push origin v0.4.0`.
6. Watch tab Actions → workflow "Release / Verify + Publish". Fail ở publish vì token? Sửa secret → **re-run failed jobs** từ UI (không cần re-tag, không push lại).
7. `npm view @jjuidev/jss-devtools version dist-tags --json` → `latest: 0.4.0`.
8. Full-loop local (đã sửa theo phát hiện 0.3.2):
   1. `npm i -g @jjuidev/jss-devtools@0.3.2` → `jss-devtools --help` → xác nhận old lineage, không có self-commands (expected).
   2. Cross-upgrade thủ công: `npm i -g @jjuidev/jss-devtools@0.4.0` (đúng những gì user 0.3.2 thật phải làm).
   3. Real-exec #1: `jss-devtools downgrade 0.3.2 --yes` → npm thật cài 0.3.2 từ registry (chứng minh install-exec scoped).
   4. **Restore thủ công bắt buộc:** `npm i -g @jjuidev/jss-devtools@0.4.0` (0.3.2 không thể tự upgrade — đã chứng minh).
   5. Real-exec #2: `jss-devtools uninstall --yes` → tự gỡ → cài lại tay.
   6. Upgrade real-exec thật sự (old → new) chỉ validate được khi có 0.4.1 — để dành, không phải gap của phase này.

## 6. Top-3 residual risks

1. **Token/auth first-run** (scope thiếu, secret tên lệch, org policy chặn) — retry-key đã ack; recovery rẻ: sửa secret → re-run job, gates+guard đã pass trước đó nên chỉ tốn thời gian.
2. **Version 0.4.0 bị đốt nếu CI build lệch local** — chấp nhận được: lockfile frozen, cùng Node/pnpm versions như local, tarball local đã pack-inspect + smoke install thật. Rủi ro thực tế thấp.
3. **Tag nhầm commit → workflow im lặng** — bẫy duy nhất không có error message; khử bằng kỷ luật "push branch xong, tag ngay HEAD mới nhất, kiểm tra Actions tab xuất hiện workflow trong ~10 giây".

Nit tiền tồn tại (không đổi, đã ghi nhận từ lần trước): detector npm legacy prefix collision (`global-pm.ts:25`), bun prerelease truncate (`global-pm.ts:76`), script `release`/`version` changeset trong package.json là dead weight. Ngoài scope phase này.

## Unresolved Questions

1. README.md:9 dòng stale `jearax/jss-cli` — khuyến nghị sửa trong cùng commit; user chốt (không block).
2. 0.3.2 lineage khác hoàn toàn — nếu user có ngữ cảnh về lịch sử publish 0.3.2 (đăng từ repo/máy khác?) thì chỉ ảnh hưởng nhận thức, không ảnh hưởng kỹ thuật 0.4.0.
