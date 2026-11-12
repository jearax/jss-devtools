---
title: init formats the files it wrote
date: 2026-11-12
summary: "Planner review found init's written files were not in the generated project's own Prettier format (11 of 13 template outputs dirty; prettier --check . failed on turbo.json, tsconfigs, even src/main.ts and the eslint config). User decision: init tự format sau install. The post-install step now runs the project's own prettier --write over every written file with a Prettier-supported extension, in both modes, after the manifest sort; failure keeps the 'the files are written' message shape and the To finish command. Empirical facts that shaped the design: Prettier exits 2 on no-parser files (husky scripts, .gitignore) even mixed with valid ones, so they are filtered by extension; .prettierignore'd files passed explicitly are skipped with exit 0, so .harness/bin and .harness/core stay untouched; because every run formats what it wrote, an existing-mode rewrite of an owned config is formatted again immediately — self-idempotent, templates unchanged. INIT_E2E=1 passed per manager (bun, pnpm, yarn, npm) for both e2e files with the new prettier --check assertion; only the two failures already proven pre-existing at HEAD remain."
---

# init formats the files it wrote

## What happened

Planner review of init --monorepo (verified 496 tests and a real pnpm monorepo) found one defect:
files init writes are not in the generated project's own Prettier format. A fresh
`init my-app --monorepo --pm pnpm -y` fails `prettier --check .` on turbo.json, tsconfig.base.json
and apps/node/tsconfig.json — JSON.stringify expands short arrays that Prettier collapses. A
render-all-templates probe showed 11 of 13 outputs are dirty, including src/main.ts,
eslint.config.mjs and .prettierrc.json; the single-package tsconfig.json carried the same
pre-existing defect. User decision (2026-11-12): "init tự format sau install" — the post-install
step runs the project's own `prettier --write` over every file init wrote, in both modes.

## Decision

Extend the post-install tasks with a "Formatting the written files" step after the manifest sort:
`runLocalBin(pm, 'prettier', ['--write', ...paths])` where paths are the plan's written entries
filtered to Prettier-supported extensions, minus the manifests (the sort step already prettier
formats them). The failure path keeps today's message shape ("Could not format with prettier; the
files are written") and the To finish command. Templates are untouched — the single-package
snapshot expectations did not change.

## Traps

- Prettier exits 2 on files with no inferred parser (husky scripts, .gitignore, .editorconfig,
  .gitkeep) even when mixed with valid files in one call — the path list must be filtered by
  extension, not passed raw.
- `.prettierignore`d files passed explicitly are skipped with exit 0, so `.harness/bin/` and
  `.harness/core/` bundles are safe without extra filtering.
- Idempotency: templates stay dirty, but every run formats what it wrote, so an existing-mode
  rewrite of an owned config is formatted again right after. The step is self-idempotent without
  changing any template.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green (498 passed, 11 skipped).
- Fresh pnpm monorepo and fresh npm single package both pass `prettier --check .` immediately after
  init (exit 0).
- `INIT_E2E=1` for `tests/init-monorepo.e2e.test.ts` and `tests/init.e2e.test.ts` with bun 1.3.8,
  pnpm 11.24.0, yarn 1.22.22, npm 11.19.1 on PATH: the per-manager runs passed with the new
  `prettier --check .` assertion; only the two failures already proven pre-existing at HEAD remain
  (the agent-kit file list and the second-run conflict test).

## Next steps

- Fix the two pre-existing e2e failures behind a policy call on existing-mode harness conflicts.
- Nothing committed; the working tree carries the feature, the format step and the harness records.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
