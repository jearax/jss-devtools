---
title: "Release & Publish Pipeline"
description: "Publish rewrite lên npm dưới tên scoped @jjuidev/jss-devtools (continuation 0.x, bắt đầu 0.4.0) qua GitHub Actions base-on ci.yml, auth NPM_TOKEN. Kèm identity fixes (MIT license, repository)."
status: in-progress
priority: P1
effort: "1.5h"
tags: [release, ci-cd, publish, npm]
created: 2026-08-28
---

# Release & Publish Pipeline

## Context

- Upgrade phase-01 closed (87f3e2c) — 7 commits unpushed trên main. CI có sẵn (`ci.yml`: Node 24, pnpm 11, 4 gates, frozen lockfile) — verified đúng.
- Registry reality (verify 2026-08-28): **`@jjuidev/jss-devtools`** (scoped) là package của user, lineage 0.x, `latest = 0.3.2` (2026-05-19). Unscoped `jss-devtools` (old lineage 1.0.0) — không đụng tới.
- User decisions (2026-08-28): publish scoped, version **0.4.0** (giữ 0.x.x) · base-on ci.yml · auth **NPM_TOKEN** trong GitHub secret ("chạy thử đi, lỗi cung cấp key mới") · **MIT** license.

## Design

### Publish identity

| Field | Hiện tại | Sau |
|---|---|---|
| name | `jss-devtools` | `@jjuidev/jss-devtools` |
| version | 0.1.0 | **0.4.0** (continuation sau 0.3.2) |
| license | `"TBD"` (SPDF warn mỗi install) | `MIT` + LICENSE file |
| repository/bugs/homepage | — | `jearax/jss-devtools` (GitHub) |
| bin | `jss-devtools` | giữ nguyên (CLI name không đổi) |
| store projectName (`store.ts:47`) | `'jss-devtools'` | **giữ nguyên** — local store identity (config dir path), không phải npm name; đổi sẽ dời config dir + chứa `/` problematic cho conf |

### Cascade rename (literal → `PKG_INFO.name`)

`PKG_INFO` (utils/pkg) đọc package.json → auto-scoped. Các literal phải đổi: `update-shared.ts:15` PKG · `downgrade.ts:12` PKG · `update-check.ts:83,87`. Detector parsers đã scoped-safe by construction (npm legacy `startsWith(pkg@)` · npm 11 plain-key exact · pnpm name field · yarn NDJSON startsWith · bun includes — verify 2026-08-28). Test fixtures update theo gates đỏ.

### Release flow

```
tag push v0.4.0 → release.yml:
  checkout → Node 24 (registry-url + NODE_AUTH_TOKEN) → pnpm 11 → install frozen
  → lint → typecheck → test → build
  → guard: tag == package.json version (fail sớm nếu lệch)
  → pnpm publish --access public --no-verify
```

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Identity + Cascade + Release Workflow](./phase-01-identity-cascade-release.md) | Completed — local, chờ user-side publish steps |

## Success Criteria

- [x] `package.json`: scoped name, 0.4.0, MIT, repository fields; LICENSE file present
- [x] Self-commands dùng `@jjuidev/jss-devtools` nhất quán (PKG_INFO.name) — uninstall/upgrade/downgrade/update detect đúng bản global scoped
- [x] `pnpm lint` / `typecheck` / `test` / `build` xanh sau rename cascade (69/69)
- [x] `pnpm pack` → `jjuidev-jss-devtools-0.4.0.tgz` chứa dist + LICENSE + README; cài local tgz → self-commands hoạt động (live verify)
- [x] `release.yml` base-on ci.yml + tag-version guard + publish NPM_TOKEN (kongming A1: `--no-git-checks --ignore-scripts`)
- [ ] Publish thật 0.4.0 thành công; `npm view @jjuidev/jss-devtools` thấy 0.4.0; cài từ registry + `jss-devtools version` + real-exec `upgrade` test được — **chờ user-side steps (NPM_TOKEN + push + tag)**

## Relations

- Kế thừa: upgrade/uninstall plans (self-command hardening làm nền cho publish-an-toàn)
- Kongming: report checkpoint (GO mới cook)

## Unresolved Questions

- NPM_TOKEN secret: user sẽ tạo granular token (packages rw @jjuidev scope) + add vào GitHub Actions secrets khi workflow lần đầu cần.
