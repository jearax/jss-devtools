---
phase: 4
title: "Polish + CI/CD Pipeline"
status: pending
priority: P1
effort: "3h"
dependencies: [3]
---

# Phase 4: Polish + CI/CD Pipeline

## Overview

`0.1.0` ready cho npm publish: changesets workflow, provenance, README polish, tag-driven release.

## Requirements

- **Functional:**
  - `.changeset/config.json` setup với changelog + base branch.
  - `.github/workflows/release.yml` tự động bump + publish khi merge changesets PR.
  - Provenance enabled (`npm publish --provenance` + OIDC).
  - `files` field whitelist dist artifacts (chỉ dist/ ship).
- **Non-functional:**
  - README có Quickstart, command examples, npm version badge.
  - `pnpm pack --dry-run` review output verified clean.
  - Global install smoke test trên máy sạch.

## Architecture

```
.github/workflows/
├── ci.yml                       # (existing from Phase 0)
└── release.yml                  # NEW — changesets → npm publish

.changeset/
├── config.json
└── (changeset files per PR)

README.md                        # rewrite với Quickstart + examples + badges
```

## Related Code Files

**Create:**
- `.changeset/config.json`
- `.github/workflows/release.yml`
- `.changeset/initial-0-1-0.md` (initial changeset entry)

**Modify:**
- `package.json` — add `files`, `sideEffects`, `publishConfig`, finalize scripts
- `README.md` — Quickstart, command examples, install badge, links

## Implementation Steps

1. **`.changeset/config.json`** — `{changelog: "@changesets/cli/changelog", commit: false, access: "public", baseBranch: "main", updateInternalDependencies: "patch"}`.
2. **Initial changeset entry** — `.changeset/initial-0-1-0.md`: `---` + `"jss-devtools": minor` + body giới thiệu MVP.
3. **`.github/workflows/release.yml`** — checkout + setup pnpm + install + changesets/action@v1 với `publish: pnpm release`.
4. **`package.json` finalize** — add `files: ["dist"]`, `sideEffects: false`, `publishConfig: { access: "public" }`, scripts `version`, `release`.
5. **README rewrite** — Quickstart (`pnpm dlx jss-devtools` + global install), command examples cho MVP, npm version badge, links to docs.
6. **`pnpm pack --dry-run`** — verify chỉ dist/ + package.json + README ship.
7. **Smoke test** — trên máy sạch: `npm i -g` từ local tarball → `jss-devtools --help` chạy.
8. **Tag `v0.1.0`** → trigger release workflow.

## Success Criteria

- [ ] `npm i -g jss-devtools` chạy được trên máy sạch (verified với local tarball).
- [ ] `jss-devtools --version` in `0.1.0`.
- [ ] Tất cả MVP commands chạy đúng sau install global.
- [ ] `pnpm pack --dry-run` output chỉ dist/ + package.json + README (+ LICENSE nếu có).
- [ ] Release workflow syntax valid.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Provenance OIDC failure | Test trên dummy publish trước; fallback non-provenance nếu cần |
| Changesets workflow complexity | Test với dummy changesets PR trước |
| Tarball quá lớn | Review `files` field + `pnpm pack --dry-run` |
| Missing files in tarball | Compare với docs/deployment-guide.md checklist |
