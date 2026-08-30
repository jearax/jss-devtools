---
title: "release pipeline — scoped rename, first npm publish path"
date: 2026-08-28
summary: "Rename @jjuidev/jss-devtools 0.4.0 + MIT + release.yml tag-triggered NPM_TOKEN publish; kongming caught pnpm flag trap, banner 98-col, and corrected the 0.3.2 upgrade-test runbook"
---

# release pipeline — scoped rename, first npm publish path

## What happened
- User muốn setup CI/CD publish sau khi upgrade phase đóng (commit 87f3e2c). Scout: ci.yml sẵn (4 gates), changesets cài nhưng chưa dùng, registry có 2 package của user — unscoped jss-devtools (old 1.0.0) và scoped @jjuidev/jss-devtools (0.x, latest 0.3.2).
- User chốt qua npmjs link: publish scoped, 0.4.0 continuation · base-on ci.yml · NPM_TOKEN ("chạy thử đi") · MIT.
- Kongming GO + 2 amendments empirical: pnpm 11.18 không có `--no-verify` → `--no-git-checks --ignore-scripts` (detached HEAD tag checkout); banner figlet scoped name = 98 cột → render bin name.
- Cook: identity + LICENSE + cascade PKG_INFO.name (update-shared/downgrade/update-check; store.ts projectName giữ) + fixtures động + release.yml (tag guard + publish). 9 tests đỏ do fixture drift + stale dist → fix + rebuild → 69/69.
- R5 live: pack jjuidev-jss-devtools-0.4.0.tgz (LICENSE+dist+README) · cài tgz (sau npm rm -g bản unscoped) · version 0.4.0 banner bin-name · update check thấy scoped + registry thật · uninstall dry-run detect scoped, cmdStr đúng.

## Decision
- Publish scoped @jjuidev/jss-devtools như continuation 0.x — unscoped old-lineage không đụng.
- Tag-triggered release (v* → gates → tag==version guard → publish), NPM_TOKEN secret, không GitHub Release (KISS). Changesets scripts giữ nguyên unused.
- store projectName tách khỏi npm name (local identity); detector proven scoped-safe by construction.

## Next steps
- User-side: tạo granular NPM_TOKEN (rw @jjuidev scope) → GitHub secret → push main → tag v0.4.0 TRỎ commit chứa release.yml (tag trước push branch = workflow im lặng) → watch Actions.
- Post-publish test (kongming-corrected — 0.3.2 registry là lineage khác, KHÔNG có self-commands): cài 0.4.0 → downgrade 0.3.2 --yes real-exec → restore tay 0.4.0 → uninstall --yes → cài lại. Upgrade old→new thật chỉ validate khi có 0.4.1.
- Kongming close GO (report 1520): release.yml sạch first-run, maps leave, README dòng 9 stale đã sửa.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
