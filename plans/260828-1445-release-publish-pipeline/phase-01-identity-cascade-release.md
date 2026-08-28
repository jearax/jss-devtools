---
title: "Phase 1: Identity + Cascade + Release Workflow"
description: "Rename scoped @jjuidev/jss-devtools 0.4.0, MIT license, repository fields, PKG literal cascade, release.yml base-on ci.yml với tag guard + NPM_TOKEN publish."
status: completed
created: 2026-08-28
---

# Phase 1: Identity + Cascade + Release Workflow

## Context

User-chốt 2026-08-28: scoped continuation 0.4.0 · base-on ci.yml · NPM_TOKEN · MIT. Registry scoped latest = 0.3.2 (không conflict — 0.4.0 là next sạch). Kongming GO (report plans/reports/).

## Requirements

### R1 — package.json identity

- `name`: `@jjuidev/jss-devtools` · `version`: `0.4.0` · `license`: `MIT`
- Thêm `repository` (github.com/jearax/jss-devtools), `bugs`, `homepage`
- `bin` giữ `jss-devtools`. `publishConfig.access: public` giữ (scoped cần).

### R2 — LICENSE file

MIT, `Copyright (c) 2026 jjuidev`. Auto-included vào tarball bởi npm.

### R3 — PKG literal cascade

- `update-shared.ts:15`, `downgrade.ts:12`: `const PKG = 'jss-devtools'` → import `PKG_INFO.name` từ `@/utils/pkg` (giảm 1 nguồn sự thật).
- `update-check.ts:83,87`: 2 literal → `PKG_INFO.name`.
- `store.ts:47` projectName **không đổi** (local store identity — đổi dời config dir `/jss-devtools`).
- Test fixtures đỏ theo gates → update (cmdStr/prompt expectations build từ PKG_INFO.name).

### R4 — release.yml

- Trigger `push: tags: ['v*']`. Setup mirror ci.yml (Node 24 + registry-url, pnpm 11, cache, install frozen).
- Full gates: lint → typecheck → test → build.
- Guard: `${GITHUB_REF_NAME#v}` == `package.json.version` (fail sớm, chống publish lệch version).
- Publish: `pnpm publish --access public --no-verify`, env `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.

### R5 — Local verification (không cần secret)

- `pnpm pack` → inspect `jjuidev-jss-devtools-0.4.0.tgz` (dist + LICENSE + README).
- Cài tgz local → `jss-devtools version` 0.4.0 → self-commands dry-run detect scoped name đúng → uninstall sạch.

## Files

| File | Thay đổi |
|---|---|
| `package.json` | R1 identity |
| `LICENSE` (mới) | R2 |
| `src/commands/self/utils/update-shared.ts`, `downgrade.ts`, `update-check.ts` | R3 cascade |
| `.github/workflows/release.yml` (mới) | R4 |
| tests fixtures | R3 theo gates |

## Validation

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` sau cascade.
2. `pnpm pack` + tarball inspect + local install smoke (R5).
3. Dry-check workflow yaml (schema/cẩu cấu) — run thật phụ thuộc push + tag + secret (user-side).

## Risk & Rollback

- Rename là public-contract change lớn nhất từ trước tới giờ: miss 1 literal → PM_NOT_DETECTED trên scoped install. Khử bằng grep sweep + test + local tgz install smoke.
- Publish sai version: tag guard chặn.
- Token thiếu/2FA: workflow fail rõ — user cung cấp key mới (đã ack).
- Rollback: git revert commits; registry 0.4.0 đã publish thì unpublish trong 72h window (npm) nếu cần.

## Results (2026-08-28)

- Kongming GO (report 1451) + 2 mandatory amendments applied: (A1) `pnpm publish --access public --no-git-checks --ignore-scripts` — empirical: `--no-verify` là unknown option trên pnpm 11.18, `--no-git-checks` cần cho detached-HEAD tag checkout; (A2) banner render theo **bin name** thay package name (scoped name figlet = 98 cột, vỡ terminal 80).
- README fix: package name scoped + repo `jearax/jss-devtools` (đề nghị nhẹ của kongming — publish-facing correctness).
- Gates sau cascade: lint 0 · typecheck 0 · tsup 0 · **69/69** — fixtures đổi qua `PKG_INFO.name` động (4 call assertions + lockstep prompt spec), khỏi drift mỗi release.
- R5 live verify: `pnpm pack` → `jjuidev-jss-devtools-0.4.0.tgz` (LICENSE + dist + README + package.json) · gỡ bản unscoped cũ → cài tgz scoped → `version` 0.4.0 banner bin-name · `update check --json` package scoped + registry latest 0.3.2 · `uninstall --dry-run` detect **scoped** install, cmdStr `npm uninstall -g @jjuidev/jss-devtools`. Toàn chain rename end-to-end.
- Machine state: global đang là scoped 0.4.0 (tgz local). Sau publish, muốn test full-loop `upgrade` real-exec: cài 0.3.2 từ registry trước (`npm i -g @jjuidev/jss-devtools@0.3.2`) rồi `upgrade` → 0.4.0.
- Còn user-side: NPM_TOKEN secret → push → tag `v0.4.0` (runbook trong session report). Code chưa commit.

## Non-goals

Unscoped `jss-devtools` (không đụng) · changesets GitHub App flow (scripts giữ nguyên, chưa dùng) · OIDC trusted publishing (token đã chốt; OIDC là upgrade sau) · promote dist-tag (next/latest) · homebrew/other distribution · README install-instructions overhaul.
