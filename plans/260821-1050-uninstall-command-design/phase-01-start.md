---
phase: 1
title: "Uninstall Hardening Implementation"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Uninstall Hardening Implementation

## Overview

Apply 3 design fixes cho `uninstall` (+ shared flows) theo design doc trong [plan.md](./plan.md): chuẩn hóa `json` default, status schema `'dry-run'`, và non-TTY destructive guard.

## Requirements

- [x] Fix 1 — `uninstall.ts`: `json` arg `default: true` → `default: false`
- [x] Fix 3 — `CommandResultStatus` thêm `'dry-run'`; thay `dryRun ? 'cancelled' : 'success'` bằng `'dry-run'` ở `uninstall.ts` + `update-shared.ts` (upgrade/downgrade flows)
- [x] Fix 2 — `confirmOrCancel` nhận `destructive?: boolean`; non-TTY + destructive + không `--yes` → in error (`REQUIRES_CONFIRMATION` nếu json) + exit 1; `uninstall.ts` truyền `destructive: true`
- [x] Non-TTY upgrade/downgrade KHÔNG đổi behavior (auto-proceed giữ nguyên)
- [x] Docs đồng bộ: `docs/codebase-summary.md` hoặc README ghi non-TTY contract

## Architecture

Sửa tại 4 files — không tạo module mới (YAGNI):

```
src/utils/prompts.ts              ← Fix 2: destructive option + non-TTY guard
src/commands/self/utils/result.ts ← Fix 3: CommandResultStatus + 'dry-run'
src/commands/self/uninstall.ts    ← Fix 1 + 2 + 3 (json default, destructive:true, status)
src/commands/self/utils/update-shared.ts ← Fix 3 (status dry-run)
tests/smoke.test.ts               ← test cases mới
```

## Related Code Files

- Modify: `src/utils/prompts.ts`, `src/commands/self/utils/result.ts`, `src/commands/self/uninstall.ts`, `src/commands/self/utils/update-shared.ts`, `tests/smoke.test.ts`
- Create: không
- Delete: không

## Implementation Steps

1. **Fix 1**: `uninstall.ts` — đổi `json: { default: true }` → `default: false`
2. **Fix 3 schema**: `result.ts` — `CommandResultStatus = 'success' | 'dry-run' | 'noop' | 'cancelled' | 'error'`
3. **Fix 3 áp dụng**: `uninstall.ts` + `update-shared.ts` — `result: dryRun ? 'dry-run' : 'success'`
4. **Fix 2**: `prompts.ts` — thêm `destructive?: boolean` vào `ConfirmOptions`; nhánh non-TTY: nếu `destructive && !yes` → output error + exit 1
5. **uninstall.ts** gọi `confirmOrCancel(..., { destructive: true })` — downgrade/update-shared giữ mặc định (không truyền)
6. **Tests**: smoke test non-TTY uninstall không `--yes` → exit 1; `--yes --dry-run` → exit 0 + JSON `result: "dry-run"`
7. **Verify**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` xanh

## Todo

- [x] Fix 1 — json default false
- [x] Fix 3 — status schema + 2 files
- [x] Fix 2 — destructive guard
- [x] Smoke tests cho 3 fixes
- [x] Full verification suite

## Success Criteria

- [x] `node dist/cli/cli.js uninstall --dry-run --json --yes` → `result: "dry-run"`, exit 0
- [x] Non-TTY uninstall không `--yes` → exit 1, error code `REQUIRES_CONFIRMATION`
- [x] `json` default `false` — `uninstall` (không flag) in human output
- [x] Non-TTY `upgrade --dry-run --yes` vẫn chạy (không regression)
- [x] lint/typecheck/test/build xanh

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Fix 2 verse vào upgrade/downgrade flows | `destructive` opt-in — chỉ uninstall truyền `true`; smoke test regression cho upgrade |
| Schema change phá automation cũ | Chưa publish — không có consumer; ghi chú schema v2 trong plan |
| Kongming flag: verify blast radius `confirmOrCancel` | Đã verify: 4 call sites (uninstall, downgrade, update-shared×2) — guard scope per-destructive, 3 sites còn lại unchanged |
