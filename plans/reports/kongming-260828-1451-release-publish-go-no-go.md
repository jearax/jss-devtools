# Kongming — GO/NO-GO: Release & Publish Pipeline (phase-01, pre-implementation)

- **Date:** 2026-08-28 · **Plan:** `plans/260828-1445-release-publish-pipeline/` · **Checkpoint:** trước cook
- **Verdict:** **GO — với 2 amendment bắt buộc** (publish flags; banner). Không có gì phải đổi kiến trúc.
- **Phương pháp:** không tin tóm tắt caller — tự đọc source, tự chạy 4 gates trên tree hiện tại (69/69 pass), tự probe registry, tự chạy `pnpm publish --help` + dry-run empirically trên pnpm 11.18.0 (đúng version CI dùng).

## 1. Gates tự chạy (baseline health, tree chưa đổi)

| Gate | Kết quả |
|---|---|
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | 69/69 pass (9 files) |
| `pnpm build` | pass, `node dist/cli/cli.js --version` → 0.1.0 (đúng PKG_INFO hiện tại) |

## 2. Registry probe (tự verify, không tin summary)

- `npm view @jjuidev/jss-devtools version dist-tags maintainers --json` → `latest: 0.3.2`, maintainer `jjuidev` — khớp contract. Unscoped `jss-devtools` không đụng.
- Packument encoded URL `https://registry.npmjs.org/@jjuidev%2Fjss-devtools` → HTTP **200**. Path fetch scoped-safe: `fetch-package.ts:10` dùng `encodeURIComponent(pkg)` → `/` thành `%2F`, registry chấp nhận. Claim chưa có trong plan nhưng đã đúng sẵn.

## 3. AMENDMENT BẮT BUỘC #1 — `pnpm publish --no-verify` KHÔNG TỒN TẠI

Plan R4 + plan.md flow dùng `pnpm publish --access public --no-verify`. Empirical (pnpm **11.18.0**, đúng version `pnpm/action-setup@v4 version: 11` cài trong CI):

```
$ pnpm publish --access public --no-verify ...
[ERROR] Unknown option: 'verify'
```

→ release job sẽ chết ở bước publish, cả token cũng chưa kịp test. Hai flag đúng của pnpm (theo `pnpm publish --help` của chính binary 11.18.0):

- **`--no-git-checks`** — BẮT BUỘC cho tag checkout: `actions/checkout` trên tag = detached HEAD, default checks (publish branch / clean tree / up-to-date with remote) sẽ fail.
- **`--ignore-scripts`** — equivalent đúng của ý đồ `--no-verify`: skip publish lifecycle scripts (`prepare: husky` v.v.).

Câu lệnh sửa thành:

```yaml
pnpm publish --access public --no-git-checks --ignore-scripts
```

Lưu ý: nếu bỏ `--ignore-scripts`, `prepare` (husky) chạy trong publish step — vô hại (`.git` có mặt ở tag checkout) nhưng thừa. KISS: thêm flag, dứt nhớn.

## 4. AMENDMENT BẮT BUỘC #2 — banner render theo `PKG_INFO.name`

`src/utils/banner.ts:20` — `figlet.textSync(PKG_INFO.name, { font: 'Standard' })`. Sau cascade, `PKG_INFO.name` = `@jjuidev/jss-devtools` → ASCII art đo empirically **98 cột** (vượt terminal 80 cột, wrap xấu trên MỌI lần hiển thị banner). figlet không throw (ký tự `@` `/` có glyph trong Standard) nên không crash — thuần cosmetic, nhưng đây là UX regression ngay dòng đầu tiên user thấy.

Sửa: banner là brand CLI, không phải npm identity — render **bin name** thay vì npm name. Gợi ý nhỏ nhất: `figlet.textSync(Object.keys(PKG_INFO.bin)[0], ...)` (bin key = `jss-devtools`, tự cascade nếu đổi bin), fallback tương tự tại `banner.ts:16`.

## 5. Verify claim "detector scoped-safe by construction" — ĐÚNG (đọc source)

Từ `src/core/detector/global-pm.ts`:

| Parser | Claim | Verify |
|---|---|---|
| npm legacy (`:25`) | `k.startsWith(\`${pkg}@\`)` | key `@jjuidev/jss-devtools@0.4.0` match đúng |
| npm 11 plain-key (`:31`) | exact `deps[pkg]` | key `@jjuidev/jss-devtools` exact |
| pnpm (`:39`) | exact `p.name === pkg` | OK |
| yarn NDJSON (`:57,63`) | `startsWith(\`"${pkg}@\`)` + `new RegExp(...)` | `@`, `/`, `-` đều regex-literal, KHÔNG có metachar → constructor an toàn; regex có anchor `"` cuối nên capture đủ prerelease |
| bun/default (`:70,76`) | `includes` + `new RegExp(...)` | an toàn (metachar-free) |

**Nits tiền tồn tại (không block, không phải hệ quả rename):**
- npm legacy prefix collision: nếu một ngày có package global `@jjuidev/jss-devtools-*` (sibling), `startsWith` + `slice` trả version rác. Thuần lý thuyết.
- Bun path regex không có trailing anchor → prerelease bị cắt (`0.5.0-beta.1` → capture `0.5.0`). Yarn path không bị. Fix sau, ngoài scope.

**Exec path scoped-safe:** `exec.ts:34,53` — `resolveCommand(pm, verb, [pkgSpec])` → execa argv trực tiếp, không shell interpolation; spec `@jjuidev/jss-devtools@0.4.0` là 1 arg. `willRunOf` (`update-shared.ts:122-132`) cũng qua `resolveCommand`. Riêng `downgrade.ts:107` hardcode template `Will run: ${pm} add -g` — display sai sẵn cho npm/yarn từ trước (nit, display-only).

## 6. Rename completeness sweep (cả repo)

Sweep grep toàn repo (src, tests, .github, husky, tsup, .npmrc, README):

- **src literals còn lại** — đúng như plan liệt kê, không thiếu không thừa: `update-shared.ts:15`, `downgrade.ts:12`, `update-check.ts:83,87`.
- `uninstall.ts` + `flow.ts` **đã** dùng `PKG_INFO.name` sẵn → cascade tự động. `update-check.ts:64` (`Run \`jss-devtools upgrade\``) là bin name → giữ đúng. `update.ts:1` comment.
- `store.ts:47` projectName `'jss-devtools'` — xác nhận giữ đúng (conf identity, không chứa `/`).
- **Version literals `0.1.0`:** chỉ trong test fixtures (detector/uninstall/upgrade/fetch-package) — các test đều parameterize tên package qua tham số hàm, nên sau rename test **không đỏ** như plan kỳ vọng ("fixtures đỏ theo gates" — expectation sai, nhưng vô hại; cập nhật fixtures sang `PKG_INFO.name` vẫn nên làm cho single-source-of-truth).
- Smoke `--version` test so output với `package.json` đọc runtime → tự khớp sau bump.
- tsup bundle JSON import inline lúc build → release job build từ tag checkout sẽ bake đúng version.
- `.npmrc` repo: chỉ engine-strict/peer/linker — không registry/auth, không xung đột.
- `files: ["dist"]` + auto-include README/LICENSE/package.json → tarball đúng sau khi thêm LICENSE.
- **README:** KHÔNG có lệnh install nào (`npm i -g ...` không tồn tại) — nên không có instruction sai đi vào tarball. Chỉ 2 dòng stale: `README.md:1,5` gọi package là `jss-devtools` — sau publish sẽ hiện sai trên npm page của scoped package. **Amendment nhẹ (khuyến nghị):** sửa 2 dòng này trong phase (1 phút, tarball ship README). Plan để README overhaul ngoài non-goals — chỉ cần 2 dòng, không phải overhaul.

## 7. release.yml review (theo thiết kế plan, file chưa viết)

- Trigger `push: tags: ['v*']` + guard `${GITHUB_REF_NAME#v}` vs `package.json` version — đúng (GITHUB_REF_NAME = `v0.4.0` trên tag push).
- setup-node `registry-url` + `NODE_AUTH_TOKEN`: pattern chuẩn, pnpm đọc user-level `~/.npmrc` do setup-node ghi, env-var substitution hoạt động. Repo `.npmrc` không set registry/auth → không conflict. (Verified-by-docs; chưa empirical vì cần secret.)
- GitHub Release creation: **KHÔNG** — KISS đúng. Tag + publish đủ; thêm sau nếu muốn.
- Nhớ bump cache key unchanged — copy ci.yml nguyên khối setup là chuẩn.

## 8. Husky trong CI (Q4) — không có rủi ro

`prepare: husky` chạy khi `pnpm install --frozen-lockfile`; `actions/checkout` giữ `.git` → husky v9 set hooksPath, CI không commit → vô hại. Với `--ignore-scripts` ở publish step, publish không re-run prepare.

## 9. Smoke tests + registry từ CI (Q5) — chấp nhận được

Đã trace từng test với 2 scenario (pre-publish 404 và post-publish):

- `update check --json` pre-publish: fetch 404 → else-branch khớp `'Failed to fetch versions'`. Post-publish: khớp JSON doc.
- `upgrade --yes --dry-run --json` pre-publish: `REGISTRY_FETCH_FAILED`, exit 1, không `REQUIRES_CONFIRMATION` → pass. Post-publish trên máy user: noop/dry-run → pass.
- `uninstall` non-TTY: `PM_NOT_DETECTED` hoặc refuse — accept-both đúng.

Rủi ro flake thực tế gần bằng 0 (registry đọc packument không rate-limit đáng kể; 404 pre-publish là deterministic). Không cần gateway/mocking — giữ nguyên.

## 10. dist-tags 0.4.0 vs latest 0.3.2 (Q6) — sạch

Publish không `--tag` → `latest` trỏ 0.4.0 (> 0.3.2, monotonic; npm không special-case 0.x minor). Không surprise. `update-check` filter stable + `semver.gt` hoạt động đúng.

**Upgrade path local 0.1.0 → 0.4.0:** KHÔNG có self-upgrade tự động — CLI mới detect scoped name, unscoped 0.1.0 tgz install → `PM_NOT_DETECTED` + install hint (ledger lastPm `npm` → hint đúng). Phải chuyển tay. **Lưu ý bin collision:** cả 2 package đều ship bin `jss-devtools` → install scoped đè symlink (last-wins). Thứ tự sạch: `npm rm -g jss-devtools` TRƯỚC, rồi `npm i -g @jjuidev/jss-devtools` — tránh shadow-note + orphan node_modules.

**`upgrade next`:** `parseSpec('next')` → dist-tag kind → `meta['dist-tags']['next']` (`resolve-target.ts:55-57`). Chưa publish tag `next` → `SPEC_INVALID` 'No version matches spec' — hành vi đúng. Sẽ hoạt động khi sau này publish prerelease kèm `--tag next`.

## 11. Top-3 risks first publish + safe manual sequence (Q7)

**Risks:**
1. **Auth/token thất bại lần đầu** (granular token thiếu scope `@jjuidev` rw, secret name lệch, 2FA) — user đã ack retry-key. Workflow fail rõ ở publish step, gates + guard đã chạy trước → chỉ retry publish, không push lại tag.
2. **Version 0.4.0 bị "đốt"** nếu tarball sai (npm cấm re-upload cùng version kể cả sau unpublish) — khử bằng R5 pack-inspect-install-smoke TRƯỚC khi tag push; không tag vội.
3. **Rename miss chức năng** (PM_NOT_DETECTED trên install thật) — cascade list đã verify đầy đủ tại §6; amendment banner là miss duy nhất tìm thấy và nó cosmetic. Local tgz smoke đóng nốt.

**Manual sequence sau khi 0.4.0 live (theo thứ tự an toàn tăng dần, mỗi bước reversible):**
1. `npm rm -g jss-devtools` (dọn 0.1.0 cũ) → `npm i -g @jjuidev/jss-devtools` → `jss-devtools --version` = 0.4.0, banner vẫn art `jss-devtools` (sau banner fix).
2. Dry-run toàn bộ: `uninstall --yes --dry-run --json` (detect npm@0.4.0, cmdStr đúng scoped) · `upgrade --yes --dry-run --json` (noop) · `downgrade 0.3.2 --dry-run`.
3. Real-exec reversible #1: `jss-devtools downgrade 0.3.2 --yes` → thật sự npm install 0.3.2. **Recovery bắt buộc thủ công:** `npm i -g @jjuidev/jss-devtools@0.4.0` (0.3.2 là code cũ, không chắc có self-commands).
4. Real-exec reversible #2: `uninstall --yes` → CLI tự gỡ → cài lại tay. (Shadow note sẽ in nếu còn orphan.)
5. Full-loop thật sự: khi có 0.4.1 — `jss-devtools upgrade --yes` detect 0.4.0 → 0.4.1 qua npm. Đây mới là validation trọn vẹn của upgrade real-exec; không cần nhảy vọt trước đó.

## Unresolved Questions

1. Token granular NPM_TOKEN: user tự tạo + add secret `NPM_TOKEN` — ngoài scope, đã ack retry flow.
2. README 2 dòng stale (§6): tôi khuyến nghị sửa trong phase; nếu user chốt giữ non-goalls nguyên vẹn thì để sau — không block.
3. Nit parser (prefix collision, bun prerelease truncate): fix riêng phase sau, không nằm trong plan này.
