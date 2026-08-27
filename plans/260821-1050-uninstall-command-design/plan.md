---
title: "Uninstall Command Design"
description: "Design doc + hardening plan cho self command `uninstall` — first trong bộ 4 self-command design docs. Mermaid-visualized. Kongming-reviewed (GO cả 3 fixes)."
status: in-progress
priority: P1
effort: "2h"
tags: [self-command, uninstall, design]
created: 2026-08-21
---

# Uninstall Command Design

## Overview

Thiết kế (và harden) self command `jss-devtools uninstall` — command gỡ CLI khỏi global install qua PM đã detect. Đây là command **đầu tiên** trong bộ per-command design docs (uninstall → upgrade/downgrade → update), làm template cho các command sau.

Design review (kongming, 2026-08-21): **GO** cho cả 3 fixes. Package chưa publish → schema changes free, không breaking.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Design doc đầy đủ flow uninstall (flowchart + sequence, mermaid) | P1 |
| 2 | Fix 1 — `json` flag default `true` → `false` (thống nhất contract 4 commands) | P1 |
| 3 | Fix 3 — dry-run JSON status: `'cancelled'` → `'dry-run'` (schema mới) | P1 |
| 4 | Fix 2 — non-TTY guard cho destructive op: uninstall không `--yes` trong non-TTY → exit 1 | P1 |
| 5 | Detector split (`pm.ts` shared) + parallel probe + PM ledger store (`conf`) | P1 |

## Current State (verified từ source)

```
uninstall.ts → extractSelfArgs → requireGlobalPM (probe + cache)
            → confirmOrCancel (TTY confirm | --yes skip | non-TTY auto-proceed ⚠️)
            → execOrDryRunRemove (resolveCommand pm 'global_uninstall' | dry-run print)
            → output (json | printSuccess + PATH hint)
```

**3 design gaps (evidence):**

| # | Gap | Evidence |
|---|-----|----------|
| 1 | `json` default `true` — lệch chuẩn 3 commands kia (default `false`) | `uninstall.ts` args.json.default |
| 2 | Non-TTY auto-proceed destructive op — CI/script gỡ CLI ngầm không confirm | `prompts.ts` `if (options.yes \|\| !isTTY()) return` |
| 3 | Dry-run báo `result: "cancelled"` — sai semantics cho automation | `uninstall.ts` + `update-shared.ts` `dryRun ? 'cancelled' : 'success'` |

## Target Design

### Decision flow (as-built, post phase-03 — 2026-08-27)

```mermaid
flowchart TD
    CLI["jss-devtools uninstall [--yes] [--dry-run] [--json]"]

    subgraph RUN["① uninstall.ts · run() — command layer"]
        direction TB
        R1["extractSelfArgs → yes · dryRun · json"]
        R2["notes[] :=<br/>shadowed — copies ở PM khác (detectGlobalPMs)<br/>previousPms — ledger.pmsSeen − PM hiện tại"]
        R3{"json mode?"}
        R4["logger.warn(notes) → stderr<br/>kể cả khi --yes (R2)"]
        R5["notes chỉ nằm trong JSON payload"]
    end

    subgraph GUARD1["② flow.ts · requireGlobalPM — boundary guard"]
        direction TB
        G1["detectGlobalPM(pkg)"]
        G2{"PM nào đang giữ pkg?"}
        G3["installHint() (R4)"]
        G4["ledger.lastPm thuộc whitelist?<br/>dữ liệu rác → 'npm' (HIGH-fix)"]
        G5["resolveCommand(pm, global)<br/>→ 'Install with: pnpm add -g jss-devtools'"]
        G6["emit PM_NOT_DETECTED + error.hint"]
    end

    subgraph DET["③ global-pm.ts · detectGlobalPMs — core"]
        direction TB
        T1{"per-process cache?"}
        T2["Promise.all — probe song song<br/>pnpm · npm · yarn · bun"]
        T3["probeOne: execa(pm, list -g --json)<br/>timeout 10s · exit≠0 → null (finding #5)"]
        T4["parseVersionFromList theo từng PM:<br/>npm≤10 — key 'pkg@ver' · npm11 — key thường + version nested<br/>pnpm — mảng name+version · yarn — NDJSON event info · bun — line scan"]
        T5["matches xếp theo PROBE_ORDER<br/>recordPmSeen(winner) → ledger"]
    end

    subgraph CONF["④ prompts.ts · confirmOrCancel — shared util"]
        direction TB
        C1{"--yes?"}
        C2{"stdout.isTTY?<br/>(stdin không quan trọng!)"}
        C3["refuse — destructive guard"]
        C4["@clack confirm<br/>'Uninstall … from npm?' (R3 display name)"]
        C5["user chọn No → cancelled"]
    end

    subgraph GUARD2["⑤ uninstall.ts · removeOrReport — boundary guard (R1)"]
        direction TB
        M1["gọi execOrDryRunRemove<br/>capture = json && !dryRun"]
        M2{"throw từ core?"}
        M3["failureReason:<br/>shortMessage + captured stderr"]
        M4["emit PM_EXEC_FAILED — rich form<br/>pm · current · notes"]
    end

    subgraph EXEC["⑥ exec.ts · execOrDryRun — CORE throw-y"]
        direction TB
        E1["resolveCommand(pm, global_uninstall)<br/>cmdStr = raw pm (runnable)"]
        E2{"null?"}
        E3["THROW 'No global_uninstall command'"]
        E4{"--dry-run?"}
        E5["logger.info '[dry-run] Would execute'"]
        E6["logger.info 'Executing' → stderr"]
        E7["execa · stdio = capture ? pipe : inherit"]
        E8["success → DISCARD captured output"]
        E9["THROW execa error<br/>shortMessage · stderr nếu capture"]
    end

    subgraph OUT["⑦ logger — stream contract"]
        direction TB
        O1["logger.json → stdout = DATA<br/>đúng 1 JSON doc ở MỌI outcome"]
        O2["mọi log còn lại → stderr<br/>(human vẫn thấy trên terminal)"]
        O3["EPIPE guard — pipe đóng sớm<br/>→ exit 0 im lặng"]
    end

    E_PM["⛔ exit 1 · PM_NOT_DETECTED + hint"]
    E_CONF["⛔ exit 1 · REQUIRES_CONFIRMATION"]
    E_EXEC["⛔ exit 1 · PM_EXEC_FAILED — không stack trace"]
    E_CANCEL["⏹ exit 0 · cancelled"]
    E_OK["✅ exit 0 · success hoặc dry-run"]

    CLI --> R1 --> G1 --> T1
    T1 -->|"miss"| T2 --> T3 --> T4 --> T5 --> G2
    G2 -->|"không PM nào"| G3 --> G4 --> G5 --> G6 --> E_PM
    G2 -->|"thấy pm + version"| R2 --> R3
    R3 -->|"human"| R4 --> C1
    R3 -->|"--json"| R5 --> C1
    C1 -->|"có"| M1
    C1 -->|"không"| C2
    C2 -->|"pipe / file / | jq"| C3 --> E_CONF
    C2 -->|"terminal"| C4
    C4 -->|"No"| C5 --> E_CANCEL
    C4 -->|"Yes"| M1
    M1 --> E1 --> E2
    E2 -->|"null"| E3
    E2 -->|"resolved"| E4
    E4 -->|"có"| E5 --> M2
    E4 -->|"không"| E6 --> E7
    E7 -->|"exit 0"| E8 --> M2
    E7 -->|"exit ≠ 0"| E9
    E3 -.->|"catch"| M2
    E9 -.->|"catch"| M2
    M2 -->|"có throw"| M3 --> M4 --> E_EXEC
    M2 -->|"không — ExecResult"| O1 --> E_OK

    class R1,R2,R3,R4,R5 cmdLayer
    class G1,G2,G3,G4,G5,G6,M1,M2,M3,M4,C1,C2,C3,C4,C5 guardLayer
    class T1,T2,T3,T4,T5,E1,E2,E3,E4,E5,E6,E7,E8,E9 coreLayer
    class O1,O2,O3 ioLayer
    class E_PM,E_CONF,E_EXEC exit1
    class E_CANCEL,E_OK exit0
    classDef cmdLayer fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a
    classDef guardLayer fill:#ffedd5,stroke:#f97316,color:#7c2d12
    classDef coreLayer fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
    classDef ioLayer fill:#dcfce7,stroke:#22c55e,color:#14532d
    classDef exit1 fill:#fef2f2,stroke:#dc2626,color:#b91c1c
    classDef exit0 fill:#f0fdf4,stroke:#16a34a,color:#166534
```

### Runtime sequence

```mermaid
sequenceDiagram
    actor U as User
    participant CLI as uninstall.ts
    participant DET as global-pm detector
    participant PM as pnpm/npm/yarn/bun
    U->>CLI: jss-devtools uninstall --yes
    CLI->>DET: detectGlobalPM("jss-devtools")
    DET->>PM: "<pm> list -g --json" (probe order, cached per process)
    PM-->>DET: package@version
    DET-->>CLI: DetectedPM { pm, version }
    CLI->>CLI: TTY confirm OR non-TTY --yes guard
    CLI->>PM: resolveCommand(pm, "global_uninstall") → execa inherit
    PM-->>CLI: exit 0
    CLI-->>U: result + "Restart your shell to refresh PATH cache."
```

### JSON result schema (v2 — pre-publish, free change)

```jsonc
{
  "schemaVersion": "1.0",
  "pm": "pnpm",
  "package": "jss-devtools",
  "dryRun": false,
  "command": "uninstall",
  "result": "success",       // success | dry-run | noop | cancelled | error  ← NEW 'dry-run'
  "current": "0.1.0",
  "cmdStr": "pnpm remove -g jss-devtools",
  "message": "Uninstalled jss-devtools@0.1.0"
}
```

### Non-TTY semantics — per-command, không uniform

| Command | Non-TTY không `--yes` | Lý do |
|---|---|---|
| **uninstall** | **exit 1** `REQUIRES_CONFIRMATION` | Destructive — mất tool, npm precedent (`npm uninstall -g` cần explicit consent trong automation) |
| upgrade / downgrade | auto-proceed (giữ nguyên) | Reversible — CI cần `jss-devtools upgrade` chạy hands-free, đúng precedent pnpm self-update / bun upgrade |

Implement qua option `destructive?: boolean` trong `ConfirmOptions` (single source `confirmOrCancel`, không duplicate per-command logic).

## Key Decisions

| Decision | Chosen | Alternative (rejected) |
|---|---|---|
| Dry-run status | `'dry-run'` distinct status | Giữ `'cancelled'` + field `dryRun:true` — status field phải authoritative (kongming) |
| Non-TTY guard scope | Chỉ uninstall (destructive flag) | Uniform guard cả 4 commands — block self-update trong CI, ngược precedent |
| Guard mechanism | Option trong `confirmOrCancel` | Guard riêng trong uninstall.ts — duplicate logic, DRY violation |
| Fix order | Fix 1 → Fix 3 → Fix 2 | Kongming: consistency → schema → safety (safety sau cùng vì cần verify blast radius) |
| Store impl | **`conf`** (community precedent, lineage configstore ← update-notifier) — strategy "học theo tiền bối, không remake" | env-paths + tự viết store — remake những gì community đã handle |
| Store shape | Single store, namespaced keys (`pmLedger`, `pm` override, `updateCheck`) — cách update-notifier làm | Tách config vs cache file (XDG-purist) — over-engineering cho giai đoạn này |
| PM persistence | **Không cache PM detection** — parallel probe mỗi lần (~300-600ms, zero stale risk); persist chỉ ledger (history) + user override | Cache + trust — stale risk đâm nhầm PM khi uninstall |
| Detector layout | `pm.ts` (shared constants) + `global-pm.ts` (subprocess probe) — eslint/prettier.ts defer Phase 03 lockfile-based | Tạo sẵn 4 files — YAGNI trước khi scaffold tồn tại |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Uninstall Hardening Implementation](./phase-01-start.md) | Completed |
| 2 | [Phase 2: Detector Split + PM Ledger Store](./phase-02-detector-split-pm-ledger-store.md) | Completed |
| 3 | [Phase 3: Review Cleanup — uninstall-scoped](./phase-03-review-cleanup.md) | Completed — local, chờ manual test + commit |

## Success Criteria

- [x] Flowchart + sequence diagram render đúng (mermaid v11) trong plan
- [x] `json` default `false` ở uninstall — đồng bộ 4 commands
- [x] `CommandResultStatus` thêm `'dry-run'` — uninstall + update-shared dùng status mới
- [x] Non-TTY `uninstall` không `--yes` → exit 1 + `REQUIRES_CONFIRMATION`
- [x] Non-TTY `upgrade`/`downgrade` vẫn auto-proceed (không regression)
- [x] Parallel probe thay serial · ledger ghi được PM từng install · shadowing warn
- [x] Smoke tests cover 3 fixes · `pnpm lint`/`typecheck`/`test`/`build` xanh
- [x] PM exec fail ở uninstall (execa non-zero / resolveCommand null) → `result:"error"` + `error.code:"PM_EXEC_FAILED"` + exit 1, không raw stack trace — guard local trong uninstall.ts (shared 4 commands defer)
- [x] Shadowing/ledger notes hiển thị ở human mode kể cả `--yes` — uninstall only, `prompts.ts` không đổi, strip noteBlock khỏi prompt
- [x] Confirm prompt uninstall dùng `PM_DISPLAY_NAMES` thay raw `detected.pm`
- [x] `PM_NOT_DETECTED` kèm install-hint trong `requireGlobalPM` — nguồn `lastPm ?? 'npm'` (không phải pmsSeen cuối cùng)

## Relations

- Hoàn thiện chi tiết cho [phase-02-cli-self-management.md](../phase-02-cli-self-management.md) (completed — đây là hardening pass)
- Schema v2 + unit tests feed [phase-04-polish-publish.md](../phase-04-polish-publish.md) (pre-release full test suite)
- Template cho design docs của upgrade/downgrade/update (làm sau)

## Dep Mapping (user-provided refs — dùng khi cần)

| Dep | Vai trò | Khi nào thêm |
|---|---|---|
| `conf` | Store (đã chốt phase-02) — successor của `configstore` | Phase 02 |
| ~~`configstore`~~ | Tổ tiên của conf — KHÔNG thêm, conf thay thế | — |
| `update-notifier` | Tier-1 notify (chốt trước đó: Phase 04 sau publish) | Phase 04 |
| ~~`latest-version`~~, ~~`boxen`~~ | Internal deps CỦA update-notifier — không khai báo trực tiếp | — |
| `semver` | Đã là direct dep (version-resolver đang dùng) ✅ | có sẵn |

## Unresolved Questions

Không có — kongming đã review GO (report: `plans/reports/kongming-260827-0016-uninstall-phase3-go-no-go.md`), 2 amendments đã hấp thụ. Phase 3 scope chốt 2026-08-27: ban đầu shared guard cả 4 commands, sau thu hẹp cùng ngày: **uninstall only** — không đụng commands khác/utils khác; `--dry-run` + TTY/non-TTY giữ nguyên. Deferred: shared guard, cleanup `ExecResult`, stdio-capture json (Phase 04 blocker), merge downgrade, simplify pass.
