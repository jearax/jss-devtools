---
title: init --monorepo ships a Turborepo
date: 2026-11-12
summary: "Implemented init --monorepo (decision 0045) through the plan's three phases: turbo pinned into MONOREPO_PRESET_DEPENDENCIES with the pin script now writing the constants file itself; five new monorepo templates plus monorepo switches on the eslint and pnpm-workspace templates with byte-identical defaults; the --monorepo flag with the missing-dir rule, monorepo-plan.service.ts and a multi-manifest sort; INIT_E2E=1 e2e proving lint/typecheck/build/FULL TURBO/run for bun, pnpm, yarn and npm; docs and site updated. Key findings: registry churn moved five pins between the morning planning run and the evening implementation run (snapshots regenerated, repo prettier bumped to follow the preset); two failures in the existing tests/init.e2e.test.ts proven pre-existing at HEAD in a clean worktree."
---

# init --monorepo ships a Turborepo

## What happened

Implemented plan 261112-0959 (init --monorepo creates a Turborepo, decision 0045), all three phases.

- `scripts/pin-node-preset.mjs` resolves `turbo` into `MONOREPO_PRESET_DEPENDENCIES` and now writes
  `node-preset-dependency.constant.ts` itself instead of printing for hand-pasting. Turbo landed at
  2.11.10 (2.11.11 still inside pnpm's `minimumReleaseAge`), the version the scratch skeleton proved.
- New templates: turbo.json, root package.json, app package.json, tsconfig.base.json, app
  tsconfig.json, and monorepo variants for pnpm-workspace.yaml and the ESLint source folders. The
  single-package tsconfig literal stayed the source of truth and the base derives from it, so its
  output survived the refactor byte for byte.
- `--monorepo` (create mode only) exits 1 without `<dir>` naming the next command;
  `services/monorepo-plan.service.ts` holds the entries; the post-install sort now covers every
  `package.json` in the plan, not only the root one.

## Errors and traps

- The pin rerun moved five pins (eslint, eslint-plugin-import-x, globals, prettier, tsc-alias) that
  aged past `minimumReleaseAge` between the morning planning run and the evening run — the plan's
  "only the turbo constant" verification could not hold. A second run was stable; the version
  snapshots were regenerated for the pin moves only. `tests/harness-markdown-format.test.ts` pins
  the repo's own prettier to the preset value, so package.json and the lockfile moved to 3.10.0.
- The tsconfig refactor first reordered the `paths` key and broke the snapshot; rewriting the
  original literal as the single source fixed it without touching expectations.
- The existing `tests/init.e2e.test.ts` fails twice (the `--agent-kit` file list, and a second
  `init -y` on a project that already has the harness hitting the "Already set up" conflict check).
  Both reproduce at HEAD with a HEAD-built bundle in a clean worktree, so they are pre-existing and
  out of this plan's scope.

## Verification

- INIT_E2E=1 monorepo suite passed for bun 1.3.8, pnpm 11.24.0, yarn 1.22.22, npm 11.19.1 — none
  skipped: lint, typecheck, build, cached `FULL TURBO` rebuild, `node apps/node/dist/main.js`,
  `git rev-list --all` empty.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`: 496 passed, 11 skipped (gated), build
  complete. Site sequence: 123 passed, build ok.

## Next steps

- Fix the two pre-existing failures in `tests/init.e2e.test.ts` (they touch existing-mode harness
  conflict policy — needs a policy call before editing expectations).
- The plan's harness files (decision 0045, plan state, this report) sit uncommitted in the tree per
  the invocation; commit them with the feature work.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
