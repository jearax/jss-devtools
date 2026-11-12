---
title: "init --monorepo creates a Turborepo"
description: "Add a --monorepo flag to jss-devtools init that creates a Turborepo root with one app under apps/<framework>, generated from templates in code."
status: done
priority: P1
effort: 2d
branch: main
tags: [feature, cli, init]
blockedBy: []
blocks: []
created: 2026-11-12
---

# init --monorepo creates a Turborepo

## Overview

Add a `--monorepo` flag to `jss-devtools init` (default off). With it, `init <dir>` creates a
Turborepo: the toolchain and the harness once at the root, one app at `apps/node`, and an empty
`packages/`. Without the flag, `init` writes exactly what it writes today.

- Policy: [decision 0045](../../decisions/0045-init-monorepo-creates-a-turborepo.md), which partly
  supersedes [0030](../../decisions/0030-init-node-preset.md).
- Contract, Turborepo docs check and skeleton evidence:
  [brainstorm report](../reports/brainstorm-261112-1616-init-monorepo-turborepo.md). Read it
  before phase 1.
- Approach: templates in code (option C). `create-turbo` is not used: it downloads its examples
  from the `main` branch, commits unless given `--no-git`, and refuses a non-empty folder.

## Phases

| #   | Phase                                                          | Status  |
| --- | -------------------------------------------------------------- | ------- |
| 1   | [Templates and pins](./phase-01-templates-and-pins.md)         | Done    |
| 2   | [The flag, preflight and plan](./phase-02-init-flag-and-plan.md) | Done    |
| 3   | [End-to-end proof and docs](./phase-03-e2e-and-docs.md)        | Done    |

Phases run in order; each depends on the one before.

## Success Criteria

- [x] `init my-app --monorepo --pm <pm> -y` for pnpm, npm, yarn 1 and bun writes the tree in the
      brainstorm report; `--dry-run` lists the same paths with `+` and writes nothing.
- [x] In the generated repo: install, `<pm> run lint`, `<pm> run typecheck`, `<pm> run build`
      (all through turbo), a second `build` that reports `FULL TURBO`, and
      `node apps/node/dist/main.js` succeed. Proven by `INIT_E2E=1 pnpm test` for each manager.
- [x] `init --monorepo` without `<dir>` exits 1 before any write and names
      `jss-devtools init <project-name> --monorepo`.
- [x] `init my-app` without the flag is byte-for-byte unchanged: the existing plan, template and
      e2e tests pass without edits to their expectations.
- [x] `--help` shows `--monorepo` with `(default: off)` and one example row; the site `init` docs,
      `.harness/docs/system-architecture.md` and `.harness/docs/codebase-summary.md` describe it.
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass, and the site sequence passes
      if `site/` changed.

## Constraints

- Files under 200 lines (user rule). `plan.service.ts` (382) and `preflight.service.ts` (384) are
  already over: put the monorepo logic in new files, do not grow them.
- Role suffixes and folders per decision 0024; `@/` imports; no parent-relative imports.
- Versions move only through `scripts/pin-node-preset.mjs`.
- The CLI never commits (decision 0031).

## Validation Log

### Session 2 (2026-11-12, implementation)

- Phase 1: templates, pins and tests done. The pin rerun moved five pins past their morning values
  (eslint 10.14.0, eslint-plugin-import-x 4.18.1, globals 17.14.0, prettier 3.10.0,
  tsc-alias 1.9.10) because they aged past `minimumReleaseAge` between the planning run and the
  implementation run; the preset snapshots were regenerated for that, not for any template change.
  prettier is pinned in the repo's own package.json too (asserted by
  `tests/harness-markdown-format.test.ts`), so it was bumped there as well. A rerun of the pin
  script was then stable, and turbo landed at 2.11.10, the version the skeleton proved.
- Phase 2: `--monorepo`, the argument rule, `monorepo-plan.service.ts` and the manifest sort cover
  the app manifest too; the help block changed in `tests/init.command.test.ts` and
  `tests/bundle.test.ts` because of the new option row, as the phase allows.
- Phase 3: `tests/init-monorepo.e2e.test.ts` (INIT_E2E=1) passed for bun, pnpm, yarn and npm —
  lint, typecheck, build, a cached `FULL TURBO` rebuild, `node apps/node/dist/main.js` and no git
  commit. Two failures in the existing `tests/init.e2e.test.ts` (the `--agent-kit` file list and
  the second-run-in-existing-mode test) reproduce at HEAD with a HEAD-built bundle in a clean
  worktree, so they are pre-existing and out of this plan's scope. Docs and site updated; the site
  sequence passed.

### Session 3 (2026-11-12, post-install prettier)

Planner review found init's written files not in the generated project's own Prettier format
(`pnpm exec prettier --check .` flagged turbo.json, tsconfig.base.json, apps/node/tsconfig.json in
a fresh monorepo; 11 of 13 rendered template outputs are dirty, and the single-package
`tsconfig.json` had the same pre-existing defect). User decision: "init tự format sau install".

- The post-install step now runs the project's own `prettier --write` over every written file with
  a Prettier-supported extension, in both modes, right after the manifest sort (the manifests stay
  with the sort step, which already prettier-formats them). Files without a parser (husky scripts,
  `.gitignore`, `.editorconfig`, `.gitkeep`) are filtered out because Prettier exits 2 on them;
  `.prettierignore`d files passed explicitly are skipped by Prettier itself with exit 0, so
  `.harness/bin/` and `.harness/core/` bundles are safe. The failure path reuses today's message
  shape (`Could not format with prettier; the files are written`) and the `To finish` command.
- Templates are unchanged; every run formats what it wrote, so an existing-mode rewrite of an
  owned config is formatted again right after — the step is self-idempotent.
- Verified: unit suites green (498 passed, 11 skipped), a fresh pnpm monorepo and a fresh npm
  single package both pass `prettier --check .` immediately after init, and
  `INIT_E2E=1` for both e2e files with bun 1.3.8, pnpm 11.24.0, yarn 1.22.22, npm 11.19.1 on PATH
  passed the per-manager runs with the new check (monorepo 4 passed; single-package 4 manager runs
  passed) — only the two failures already proven pre-existing at HEAD remain.

### Session 1 (2026-11-12)

Verification: every factual claim in the phases was checked in this planning session against the
code, design-system, the Turborepo docs or a scratch skeleton. Failed: 0.

- Q: `--pm` also accepts bun, which the brainstorm left out. A: "Hỗ trợ bun". bun uses the
  `workspaces` field like npm; the skeleton passed install, `turbo run build typecheck` and the
  run on bun 1.3.8. Propagated to phases 1–3.
- Q: should `turbo.json` declare a `test` task? A: "Không" — no test task until the preset has a
  test runner. Phase 1 already says so.
