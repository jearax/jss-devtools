# HANDOFF: jss-devtools self-commands — Phase 02 hardening complete, Phase 03 next
Generated: 2026-08-21 14:06 · Session focus: uninstall command design + implementation (plan `260821-1050-uninstall-command-design`)

## Goal

Personal learning CLI (`jss-devtools`, npm public, chưa publish). Session này: thiết kế + harden self command `uninstall` (first trong bộ 4 per-command design docs), kèm 2 hạ tầng ngang: ESLint migration và PM ledger store.

## Why This Matters

Uninstall là destructive op duy nhất — mọi guard/UX quyết định ở đây làm template cho upgrade/downgrade/update (3 design docs còn lại theo intent user: "uninstall TRƯỚC").

## Current State

- Working tree **clean**, branch `main`, mọi thứ đã commit:
  - `176d377` refactor cleanups (switch-case parser, no-index rule `store/store.ts`, comment policy, xóa `PM` alias)
  - `4a01fc2` chat2k note log-vs-throw
  - `a677dcc` + `e04d9cd` plan files + feat uninstall hardening/parallel probe/ledger store
  - `877c1fe` biome→ESLint 10 + prettier + 4 core plugins (import-x fork)
- Plan `plans/260821-1050-uninstall-command-design/` = **completed** (2 phases, criteria ticked). Active pointer: `ak plan use` vẫn trỏ đây.
- Verify cuối: lint ✅ typecheck ✅ build ✅ **23/23 tests** (4 files: smoke 13 + prompts 3 + detector 3 + store 4)

## Key Decisions and Why

| Decision | Why | Where documented |
|---|---|---|
| Parallel probe, KHÔNG cache PM detection | Stale cache đâm nhầm PM khi uninstall; probe ~170ms wall | `global-pm.ts` + plan Key Decisions |
| Ledger = history ("đã TỪNG dùng PM nào"), không phải current-state source | User goal thật; config-first đã bác | `store/store.ts`, kongming report 1105 |
| Non-TTY guard chỉ cho destructive (uninstall `--yes`-required); upgrade/downgrade auto-proceed | npm/pnpm/bun precedent — CI cần self-update hands-free | `prompts.ts` destructive option |
| Boundary-guard pattern: `requireGlobalPM` log+exitCode+null (không throw) | 3 callers đồng UX; TS null-return ép caller check | chat2k note `log-vs-throw-guards` |
| ESLint 10 + `eslint-plugin-import-x` (fork) | Bản gốc peer tối đa ^9; rules port từ jss-cli commit `89d4bf1` | `docs/code-standards.md` §Linting |
| conf store + `clearInvalidConfig` + belt-and-braces degradation | Constructor v15 eager-read (EACCES nổ ở get/set thật) | `store/store.ts` header comment |
| No `index.ts` barrels; comment chỉ cho logic "thực sự khó" | Self-documenting names cho LLM tools; middle-dev rule của user | `docs/code-standards.md` §File Naming, §Comments |

## Rejected Approaches and Traps

- **Cache-PM + trust** (persist detection làm source of truth) — stale sau khi user đổi PM → uninstall nhầm bản sao. Bác ở kongming gate #2.
- **Uniform non-TTY guard cả 4 commands** — block self-update trong CI, ngược precedent.
- **XDG config/cache file split** — over-engineering; single conf store namespaced keys đủ (update-notifier precedent).
- **`eslint-plugin-import` bản gốc** — peer không nhận ESLint 10 dưới strict-peer-deps.
- **Bare `process.exit()` sau khi print** — cắt async pipe writes (`--json | jq` mất output). Đã refactor toàn bộ sang `process.exitCode` + return.
- **consola cho machine JSON** — output biến mất trong vài host context; `logger.json` giờ raw `process.stdout.write`.
- **Test mock constructor conf** — sai tầng; test phải exercise real fs failure (chmod 000, corrupted JSON).
- Editor song song (Biome extension organize-imports lúc save) từng xáo import order sau lint pass — cài `source.fixAll.eslint` hoặc tắt extension nếu tái diễn.

## Verification Status

- 4 kongming gates: GO (design fixes / store design / phase-01 / phase-02 "A-tier")
- 2 code-reviewer passes: phase-01 9/9 criteria; phase-02 DONE_WITH_CONCERNS → **đã xử lý hết** (H1 real-layer degradation, H2 clearInvalidConfig, M1-M3, L1)
- Parallel probe đo thật: 251ms tổng (baseline node 80ms, 301% CPU)
- E2E self commands thật: **blocked until publish** (registry chưa có package) — sẽ verify ở Phase 04

## Relevant Files and Pointers

- Plan + phases + kongming reports: `plans/260821-1050-uninstall-command-design/`, `plans/reports/kongming-*.md`
- Master roadmap: `plans/plan.md` (Phase 03 scaffold pending, Phase 04 polish/publish)
- Standards: `docs/code-standards.md` (comments policy mới, linting stack, no-index rule)
- Knowledge notes: `chat2k/chat2k-2026-08-21-log-vs-throw-guards.md` + 5 notes cũ
- Reference repo (user's prior project): `/Users/tandm/Documents/jjuidev/npm/jss-cli` — commit `542a085` cli-only pivot
- Store file location runtime: env-paths per-platform (`~/Library/Preferences/jss-devtools-nodejs/` trên máy này); `JSS_DEVTOOLS_STORE_DIR` override cho tests

## Open Work and Dependencies

- **🟡 Uninstall review còn 3 điểm chưa fix** (user đã ack, chưa làm): (1) `execOrDryRunRemove` throw khi PM fail — chưa ai catch ở command → stack trace thô; cần `result:"error"` + `code:"PM_EXEC_FAILED"` + exit 1. (2) Notes bị nuốt khi `--yes` human mode (noteBlock chỉ nằm trong prompt). (3) Cosmetic: prompt dùng raw `detected.pm` thay `PM_DISPLAY_NAMES`.
- **PM_NOT_DETECTED message thiếu install-hint** — phase-02 plan risk table thiết kế "Install with: <pm> add -g" nhưng implementation bỏ; user chưa chốt thêm hay không.
- **Phase 03 Scaffold System** (master plan) — detectors import từ `@/core/detector/pm`, lockfile-based qua `package-manager-detector` lib; quyết `nypm` prune/keep tại đây.
- **Deferred đã chốt**: update-notifier + `updateCheck` key @ Phase 04 sau publish; design docs upgrade/downgrade/update sau uninstall-template.

Fresh-agent prompt: Đọc `plans/260821-1050-uninstall-command-design/plan.md` (status completed), `docs/code-standards.md`, và phần Open Work ở trên; verify bằng `git log --oneline -8`, `pnpm lint && pnpm typecheck && pnpm test` (kỳ vọng 23/23) trước khi hành động. Việc tiếp theo user chọn: fix 3 điểm uninstall review, hoặc bắt đầu Phase 03.
