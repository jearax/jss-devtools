---
title: "Phase 1: Hardening Implementation"
description: "Đóng G1-G6 + A1/A2/A3 cho upgrade (+ update alias): registry/exec guards, capture-enable, prompt chính xác, major-bump gate, update dispatch rewrite. Test-first theo kongming checklist."
status: completed
created: 2026-08-28
---

# Phase 1: Hardening Implementation

## Context

Kongming GO (`plans/reports/kongming-260828-1229-upgrade-design-go-no-go.md`) với 3 amendments absorbed:
- **A1** — citty 0.2.2 `subCommands` match positional đầu tiên (`update 1.2.3` → `Unknown command 1.2.3`) → không thể vừa subCommands vừa nhận spec. Fix: bỏ `subCommands`, dispatch thủ công. User overrule: chỉ `check`, bỏ list/ls.
- **A2** — live bug: citty chạy parent `run` SAU subcommand → `update check` hôm nay double-exec `runUpgradeFlow({}, 'update')` (non-TTY auto-proceed → install thật; `--dry-run` vô dụng vì `{}` hardcode). A1 tự khử; cần regression test.
- **A3** — gate major-bump miễn `--dry-run`: `destructive: resolved.majorBump === true && !dryRun`, tái dùng nguyên `ConfirmOptions.destructive` (không đổi signature prompts.ts). G6 là tiền đề.

Baseline verified: working tree clean, global machine = 0.1.0 local tgz (restored sau live probe).

## Requirements

### R1 (G1) — Fetch guard: `REGISTRY_FETCH_FAILED`

- Helper local `fetchOrReport` trong update-shared.ts (pattern `removeOrReport` uninstall), bọc **chỉ** `await fetchPackageMetadata(PKG)` (dòng 30) — `parseSpec`/`resolveTarget` pure, không bọc.
- JSON rich form (precedent SPEC_INVALID): `baseResult` + `command` + `spec` + `current` + `error: { code: 'REGISTRY_FETCH_FAILED', message }` — message tái dùng thrown message (đã chứa cause).
- Human: `logger.error` 1 dòng, không stack. Exit 1.
- Core tweak 1 dòng (user-approved): `fetch-package.ts:45` → `lastError instanceof Error ? lastError.message : String(lastError)` — bỏ noise `TypeError: ` prefix.
- Không phân loại cause machine-readable (`error.cause`) — YAGNI. Không hint field.

### R2 (G2) — Exec guard: `PM_EXEC_FAILED`

- Helper local `installOrReport` mirror `removeOrReport`: catch throw của `execOrDryRunInstall` → JSON rich form (`pm`/`current`/`target`/`majorBump`/`spec`) + `error: { code: 'PM_EXEC_FAILED', message }`, exit 1; human `logger.error` với `failureReason` (shortMessage + captured stderr — duck-type precedent uninstall).

### R3 (G3) — Capture-enable

- `execOrDryRunInstall(..., { capture: jsonMode && !dryRun })`. Success discard (đã có sẵn trong exec.ts). Test mirror `uninstall.test.ts:133-159`.

### R4 (G4) — Prompt chính xác

- `via ${PM_DISPLAY_NAMES[detected.pm]}` (R3 precedent uninstall).
- "Will run" = `${resolved.command} ${resolved.args.join(' ')}` từ `resolveCommand(pm, 'global', [`${PKG}@${target}`])` ngay trong update-shared (precedent `flow.ts:24`). **Không đụng exec.ts.**
- **Lockstep test bắt buộc** (drift guard): prompt chứa đúng chuỗi resolveCommand cho từng pm — đã verify: npm `npm i -g`, pnpm `pnpm add -g`, yarn `yarn global add`, bun `bun add -g` (chỉ pnpm khớp hardcode cũ).

### R5 (G5) — Major-bump warning visibility

- Strip `bumpNote` khỏi prompt text; `logger.warn('⚠️  Major version bump. Breaking changes likely.')` standalone khi `!jsonMode`, bất kể `--yes` (R2 precedent uninstall). JSON: chỉ field `majorBump` (sẵn có).

### R6 (A3+G6) — Gate + payload

- `confirmOrCancel({ ...options, destructive: resolved.majorBump === true && !dryRun }, ...)` — gate matrix theo plan.md.
- Cancelled payload: `baseResult(detected.pm, PKG, dryRun)` — bỏ hardcode `true`. Test assert `parsed.dryRun === false` trên real-exec gate path.

### R7 (A1/A2) — update.ts dispatch rewrite

- Bỏ `subCommands`; khai báo `specVer` positional (mirror upgrade.ts args).
- `run`: positional === `'check'` → chạy update-check handler (forward `json`), KHÔNG chạy flow; ngược lại → `runUpgradeFlow(extractSelfArgs(args), 'update')`.
- `update-check.ts` chỉ chạm phần gọi lại — internals (console.log, exit 2, không requireGlobalPM) là follow-up.
- Regression test: `specVer='check'` + PM detected + `--yes` → `execOrDryRunInstall` KHÔNG được gọi, exit 0.

## Files

| File | Thay đổi |
|---|---|
| `src/commands/self/utils/update-shared.ts` | R1-R6: 2 guard helpers + capture + prompt + gate + payload |
| `src/commands/self/update.ts` | R7: dispatch rewrite, bỏ subCommands |
| `src/commands/self/update-check.ts` | Dời `fetchAndDisplayUpdates` vào đây (giết circular export); internals giữ nguyên |
| `src/core/registry-client/fetch-package.ts` | Message tweak + normalize `versions` object→array (live finding #1) |
| `tests/upgrade.test.ts`, `tests/fetch-package.test.ts` (mới) | Test-first 8 nhóm + 4 normalization tests |
| `tests/smoke.test.ts` | Encode A1 help delta + e2e dispatch single-doc test |

## Validation

1. **Test-first (viết trước, đỏ trước):** 8 nhóm theo kongming report §Q6 — mocks `global-pm` + `store` + `exec` + **`fetch-package`**; conventions `tests/uninstall.test.ts` (`stdoutOf()`, `afterEach` reset exitCode + restoreMocks, chạy `command.run({args, rawArgs: []})`).
2. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
3. **Manual matrix an toàn** (kongming §Q7.2): mọi test `--dry-run`; `upgrade` non-TTY không --yes → kỳ vọng REQUIRES_CONFIRMATION exit 1 (gate sống, không đụng máy); `upgrade 0.0.52 --dry-run` → SPEC_INVALID hướng downgrade; `update check --json | jq`; `upgrade --yes --dry-run --json | jq` → 1 doc. **CẤM `upgrade --yes` / `update --yes` real-exec tới khi 0.1.0 publish** (latest = old-lineage 1.0.0).

## Risk & Rollback

- Blast radius: 3 src files + tests. Revert = `git revert` commits của phase.
- Top-3 risks (kongming): dispatch edge cases sau A1 (flags trước/sau keyword, help mất COMMANDS section) → test 7-8 + manual matrix; registry old-lineage → dry-run-only; prompt/exec drift → lockstep tests.
- Không đụng downgrade/prompts.ts/exec.ts (trừ update-check gọi lại) — sibling commands không đổi behavior (gate A3 chỉ trong update-shared).

## Results (2026-08-28)

- Implemented R1-R7 đúng spec + kongming amendments (A1 manual dispatch chỉ `check` — user overrule bỏ list/ls · A2 regression test · A3 gate `destructive: majorBump && !dryRun` tái dùng ConfirmOptions, prompts.ts không đổi).
- **Live finding #1 (registry metadata shape):** npm registry trả `versions` là **object** keyed-by-version; type + raw cast ở client enshrine sai shape (array) → `update check` chưa từng chạy được live (`TypeError: meta.versions.filter`) và exact-spec (`update 0.0.52`) crash stack trace **ngoài** fetch guard (resolveTarget gọi `.includes` trên object). Cùng class "mock enshrined sai format" như npm 11/yarn NDJSON (uninstall plan). Fix cause-aligned tại boundary registry-client: normalize `versions` → string array (giữ dist-tags/time) + 4 unit tests stub fetch.
- Code-reviewer (static): 0 critical / 0 high. Folds đã áp: e2e smoke `update check --json` (binary-level single-doc, offline accept-branch) · strip plan/phase/finding labels khỏi test titles (user global rule) · fetch-fail payload dryRun = requested mode (unify với install guard) · willRunOf fallback chain pm→npm→literal (precedent flow.ts).
- UX delta chấp nhận (A1): `update check --help` giờ render parent help (citty chặn --help trước dispatch) — smoke test encode hành vi mới.
- Gates: lint ✓ · typecheck ✓ · test **69/69** (44 cũ + 20 upgrade + 4 normalization + 1 smoke mới) · build ✓. Kongming post-phase GO (`plans/reports/kongming-260828-1325-upgrade-phase1-close-verdict.md`): 3 amendments conform verbatim · normalization phủ cả consumer thứ 4 `downgrade.ts:55` · dryRun-unify khớp uninstall contract.
- Live matrix an toàn (dry-run/read-only): dry-run jq sạch · gate REQUIRES_CONFIRMATION exit 1 payload dryRun=false · `update check --json` đúng 1 doc · SPEC_INVALID structured cho spec cũ/bogus · alias parity `command:"update"`.
- **Chưa chạy:** real-exec `--yes` (CẤM tới khi 0.1.0 publish — latest = old-lineage 1.0.0).
- Trạng thái: code **để local, CHƯA commit** — user manual test trước.

## Non-goals

Downgrade G1-G6 (plan riêng) · DRY-merge downgrade vào `runUpgradeFlow` · fold Will-run formatter vào exec.ts (làm khi merge downgrade) · update-check internals (exit code 2, `--json` fail path human text, không qua requireGlobalPM, `dist-tags.latest` không lọc prerelease — 4 findings 2026-08-28) · shared exec-guard util · `ExecResult` dead fields · test-scaffold dedup (~40 dòng chung uninstall.test.ts) · `update-shared.ts` 255 dòng > ngưỡng modularize 200 (family-wide cleanup) · pre-existing labels trong uninstall.test.ts · update-notifier · publish/retag registry · versioning strategy rewrite-vs-old-lineage.
