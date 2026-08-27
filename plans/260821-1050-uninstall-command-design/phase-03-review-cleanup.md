---
title: "Phase 3: Review Cleanup (uninstall-scoped)"
description: "Đóng review findings cho uninstall: exec-fail guard local, notes visibility, install-hint. Scope thu hẹp theo user 2026-08-27 (muộn): uninstall only."
status: completed
created: 2026-08-27
---

# Phase 3: Review Cleanup — uninstall-scoped

## Context

Phase 1-2 completed. Code-review + handoff ghi 3 điểm ack-chưa-fix. User chốt scope 2026-08-27: ban đầu shared guard cả 4 commands, sau thu hẹp cùng ngày: **uninstall only** — không đụng commands khác, không tạo util shared mới, không sửa `prompts.ts`/`exec.ts`. `--dry-run` + TTY/non-TTY **giữ nguyên** như plan (user đã cân nhắc remove, quyết giữ).

Kongming review (GO): `plans/reports/kongming-260827-0016-uninstall-phase3-go-no-go.md` — 2 amendments bắt buộc đã hấp thụ vào R1/R4 below.

## Requirements

### R1 — Exec-fail guard cho uninstall (local, không shared)

Hiện tượng: `exec.ts:24-26` throw khi `resolveCommand` null; `exec.ts:41` execa throw khi PM exit non-zero; `uninstall.ts:93` không catch → raw stack trace.

- Guard viết trong `uninstall.ts` theo boundary-guard pattern (precedent `requireGlobalPM`): emit output + `process.exitCode = 1` + return, **không throw**.
- JSON mode: `result: "error"` + payload đầy đủ context (`baseResult` + `command`/`current`/`notes` — rich form theo precedent `SPEC_INVALID`) + `error: { code: "PM_EXEC_FAILED", message }`.
- Human mode: `logger.error` message ngắn kèm `err.shortMessage` của execa (chứa exit code + command) — không stack trace.
- Message phân biệt resolveCommand-null vs execa-fail (cùng code `PM_EXEC_FAILED`).
- Không đụng `exec.ts`: core giữ throw-y, shape `ExecResult` nguyên trạng.

### R2 — Notes hiển thị khi `--yes` (human mode)

- In notes (`logger.warn(notes.join('\n'))`) ngay sau khi build trong `uninstall.ts`, gate `!jsonMode`, bất kể `--yes`.
- **Strip noteBlock khỏi prompt text** — tránh double-print khi TTY confirm.
- Json mode đã có `notes` trong payload — giữ nguyên. `prompts.ts` không đổi.

### R3 — Prompt display name

`uninstall.ts` prompt: `PM_DISPLAY_NAMES[detected.pm]`.

### R4 — Install-hint trong `requireGlobalPM` (flow.ts)

- Nguồn hint: `getPmLedger().lastPm ?? 'npm'` — **không** dùng "pmsSeen cuối cùng" (pmsSeen giữ thứ tự first-seen → chọn sai PM; kongming bug finding, test `tests/store.test.ts:45-52` chứng minh).
- Human: dòng riêng `Install with: <pm> add -g <pkg>` sau message error.
- JSON: field `error.hint` riêng (không nhét vào message).

## Files

| File | Thay đổi |
|---|---|
| `src/commands/self/uninstall.ts` | R1 guard local · R2 notes + strip prompt · R3 display name |
| `src/commands/self/utils/flow.ts` | R4 hint trong `requireGlobalPM` (additive) |
| `tests/` | Test mới: exec-fail json/human · notes `--yes` · hint source |

## Validation

1. Unit test TRƯỚC refactor (kongming test-first):
   - (a) fail-thunk → stdout = 1 JSON doc parseable, `PM_EXEC_FAILED`, exitCode 1;
   - (b) seeded ledger `{pmsSeen:['pnpm','npm'], lastPm:'pnpm'}` → hint chứa `pnpm add -g`;
   - (c) notes hiện human `--yes`, vắng trên stdout json mode.
2. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
3. `afterEach` reset `process.exitCode` (mẫu `tests/prompts.test.ts:9-12`) — chống flaky leak giữa tests.

## Risk & Rollback

- Blast radius: 2 file src + tests. Revert = `git revert` commit của phase.
- `flow.ts` hint là additive — commands khác chỉ thấy thêm dòng hint ở error path PM_NOT_DETECTED, không đổi behavior.

## Results (2026-08-27)

- Implemented R1–R4 đúng spec + kongming amendments (hint source `lastPm`, rich-form JSON payload, strip noteBlock khỏi prompt).
- Code-review findings đã fix:
  - CAO — `lastPm` rác (ledger corrupt/hand-edit) làm `resolveCommand` throw `TypeError` thô trên path `PM_NOT_DETECTED` (shared 4 commands, pmd@1.8.0 không guard) → validate `last in PM_DISPLAY_NAMES`, degrade về npm + unit test `bogus-agent`.
  - Cancelled payload hardcode `dryRun: false` → dùng `dryRun` thật (pre-existing, trong block được chạm).
- Gates: lint ✓ · typecheck ✓ · test **32/32** (23 cũ + 9 mới, zero regression) ✓ · build ✓.
- Manual spot-check JSON fail-path: thay bằng unit tests (mock) — CLI chưa publish, không có global install thật từ registry.
- Manual-test finding (2026-08-27, chiều): npm 11+ đổi format `npm ls -g --json` — key plain name (`"jss-devtools"`) + version nested, thay vì key `"pkg@version"` cũ → npm probe mù với global install cài bằng npm 11 (detector test mock cũng enshrine format cũ nên suite vẫn xanh). Fix: parser nhận cả 2 format (`global-pm.ts` npm case) + test riêng format npm 11. Live verify: `pm:"npm"`, `current:"0.1.0"`, `REQUIRES_CONFIRMATION` exit 1 đúng.
- Manual-test finding #2 (yarn): `yarn global list --json` (v1 classic) emit **NDJSON event stream**, package chỉ xuất hiện qua `{"type":"info","data":"\"pkg@version\" has binaries:"}` — parser cũ expect `JSON.parse` một doc với `data:[[...]]` → SyntaxError → yarn probe **chưa từng hoạt động** với yarn thật, và không có test yarn nào phủ. Fix: parse từng line NDJSON, match event `info` `"pkg@version" has binaries` + test riêng. (Lưu ý yarn v1 `global add` cần **absolute path** tarball — resolve relative path against `~/.config/yarn/global/`, không phải CWD. Kèm theo: yarn v1 cache tarball theo **path** — cùng path + content mới vẫn phục vụ cache cũ; `yarn clean` không phải lệnh yarn — phải `yarn cache clean` chính thức, không thì install lại đúng bản stale — đã gây false-alarm "vẫn lỗi jq" trong manual test 2026-08-27.)
- Manual-test finding #3 (json purity): `uninstall --yes --dry-run --json | jq` gãy — consola route `info` lên **stdout**, core `exec.ts` log `[dry-run] Would execute: ...` trước JSON doc (core không biết json mode theo 3-tier design; unit test không bắt được vì exec bị mock). Fix: `logger.ts` dùng `createConsola({ stdout: stderr })` — logs → stderr, stdout chỉ dành cho data (logger.json) — chuẩn Unix, fix một chỗ cho mọi commands. Kèm regression test dùng real exec qua `vi.importActual`. Bonus fix: `cmdStr` trong payload từng dùng display name (`yarn (classic) global remove` — không chạy được) → raw `pm`.
- Manual-test finding #4 (EPIPE): real-exec `--json | jq` — jq chết sớm (stdout dirty do stdio inherit) → đóng pipe → JSON success doc ghi vào pipe đã đóng → `ERROR write EPIPE` trên run THÀNH CÔNG. Fix: EPIPE guard trong `logger.ts` (exit 0 im lặng; error khác vẫn throw) + tests.
- **Stdio-capture kéo vào phase (user approved 2026-08-27)** — item từng defer Phase 04: `exec.ts` thêm `ExecOptions.capture` → `stdio:'pipe'` khi bật; uninstall bật `jsonMode && !dryRun`; success discard output con; fail nhúng captured stderr vào `PM_EXEC_FAILED` message (design kongming report 0016). Live verify C.7: `uninstall --yes --json | jq` → 1 doc `result:"success"`, exit 0, không EPIPE. Invariant "stdout = 1 JSON doc mọi outcome" hoàn tất.
- Manual-test finding #5 (CLI hang): `jss-devtools uninstall` interactive treo vĩnh viễn, không output — nguyên nhân `yarn global list` wedged trên máy lúc đó (aftermath full cache clean + add/remove churn — yarn v1 kẹt refetch/lock transient) trong khi **probe của detector không có timeout** (`Promise.all` chờ mọi probes). Fix: `PROBE_TIMEOUT_MS = 10_000` trong `probeOne` — PM wedged bị skip, CLI không bao giờ treo vì PM; test assert timeout option. Sau khi kill process yarn kẹt, yarn phục hồi (0.14s) — môi trường, không cần hành động.
- Trạng thái: code **để local, CHƯA commit** — user manual test trước khi commit.

## Non-goals (deferred — ghi cho lượt sau)

Shared guard 4 commands · `exec-guard.ts` shared · cleanup `ExecResult` dead fields (`ok`/`dryRun`/`pm`) · capture-enable cho upgrade/downgrade/update (chỉ uninstall bật hiện tại) · merge downgrade vào `runUpgradeFlow` · senior simplify pass · validate `pmsSeen` ở store boundary (theme corrupted-ledger: "Previously installed via undefined") · top-level `message:""` cleanup trên error payloads (phase-04 JSON pass).
