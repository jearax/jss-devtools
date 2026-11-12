# Cooker report: init --monorepo creates a Turborepo

Plan: [.harness/plans/261112-0959-init-monorepo-turborepo/plan.md](../261112-0959-init-monorepo-turborepo/plan.md),
all three phases done. Nothing committed or pushed, per the invocation.

## What changed

- `scripts/pin-node-preset.mjs` resolves `turbo` into a second constant and now writes
  `src/commands/init/constants/node-preset-dependency.constant.ts` itself (it previously printed
  the table for hand-pasting), so the constant is regenerated, never hand-edited.
- New templates: `turbo-json.template.ts`, `monorepo-package-json.template.ts` (root manifest,
  `MONOREPO_LINT_STAGED` exported for reuse), `app-package-json.template.ts`,
  `tsconfig-base-json.template.ts`, `app-tsconfig-json.template.ts`; the pnpm workspace template
  gained `pnpmWorkspaceYamlMonorepoTemplate`; the ESLint template takes `{ monorepo?: boolean }`
  and appends the `apps/*`/`packages/*` source folders only when it is on; `tsconfig-json.template.ts`
  keeps the original literal as the single source of truth and derives the base options from it, so
  its output stayed byte-identical through the refactor.
- `--monorepo` (default off) on `init`, create mode only: `validateInitArguments` exits 1 without
  `<dir>` naming `jss-devtools init <project-name> --monorepo`; `services/monorepo-plan.service.ts`
  builds the create entries; `buildInitPlan` dispatches on `options.monorepo`; the post-install
  sort covers every `package.json` entry in the plan (root and app), not just the root one.
- Tests: `tests/monorepo-templates.test.ts` (9), monorepo plan tests in
  `tests/init-plan.service.test.ts`, the argument rule in `tests/init.service.test.ts`, the help
  and dry-run expectations in `tests/init.command.test.ts` and `tests/bundle.test.ts`, and
  `tests/init-monorepo.e2e.test.ts` gated behind `INIT_E2E=1` with shared helpers moved to
  `tests/support/init-e2e.ts`.
- Docs: the `--monorepo` row in `site/src/constants/reference.constant.ts`,
  `.harness/docs/system-architecture.md`, `.harness/docs/codebase-summary.md` and
  `.harness/docs/project-roadmap.md`.

## Verification (real output)

- Phase 1: `pnpm vitest run tests/monorepo-templates.test.ts tests/node-preset-templates.test.ts
  tests/node-preset-versions.test.ts` → 28 passed. The constants diff holds the new
  `MONOREPO_PRESET_DEPENDENCIES` (turbo 2.11.10) plus five pins that aged past
  `minimumReleaseAge` between the morning planning run and this run (eslint 10.14.0,
  eslint-plugin-import-x 4.18.1, globals 17.14.0, prettier 3.10.0, tsc-alias 1.9.10) — the
  phase-1 expectation "only the turbo constant" could not hold; a second script run was stable.
  The version snapshots were regenerated for the pin moves only. prettier is also pinned in the
  repo's own package.json (asserted by `tests/harness-markdown-format.test.ts`), so it was bumped
  there and installed.
- Phase 2: the three init unit suites → 85 passed; `pnpm build` then a scratch dry-run
  `node dist/cli.mjs init my-app --monorepo --pm pnpm --dry-run` printed the whole tree with `+`
  (turbo.json, apps/node/*, packages/.gitkeep, tsconfig.base.json …) and "Dry run: nothing
  written".
- Phase 3: `INIT_E2E=1 pnpm vitest run tests/init-monorepo.e2e.test.ts tests/init.e2e.test.ts`
  with bun 1.3.8, pnpm 11.24.0, yarn 1.22.22 and npm 11.19.1 on PATH: the four monorepo tests
  passed (init, lint, typecheck, build, cached `FULL TURBO` rebuild, `node apps/node/dist/main.js`,
  `git rev-list --all` empty); no manager was skipped.
- Final: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → 496 passed, 11 skipped
  (gated e2e), build complete. Site: `pnpm --dir site lint && typecheck && test && build` → 123
  passed, build ok.

## Deviations and findings

- The existing `tests/init.e2e.test.ts` has two failures that are pre-existing: the `--agent-kit`
  file-list assertion and the second-run-in-existing-mode test (preflight's harness conflict check
  exits 1 on a project that already has the harness, and the created file list no longer matches
  `DECIDED_FILES + HARNESS_FILES`). Both reproduce at HEAD in a clean worktree with a HEAD-built
  bundle, so they are not caused by this work; fixing them touches existing-mode conflict policy
  and is left out of this plan.
- Two Write-tool mishaps while writing the turbo and app templates were caught immediately by
  prettier/tsc and rewritten; the committed content is the rewritten one.
