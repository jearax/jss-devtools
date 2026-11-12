# Cooker final report: init --monorepo creates a Turborepo

Plan: [.harness/plans/261112-0959-init-monorepo-turborepo/plan.md](../261112-0959-init-monorepo-turborepo/plan.md),
decision [0045](../../decisions/0045-init-monorepo-creates-a-turborepo.md). All three phases done,
success criteria checked in the plan. Nothing committed or pushed (invocation instruction); the
full report with the verification log is
[cooker-261112-1944-init-monorepo-turborepo.md](./cooker-261112-1944-init-monorepo-turborepo.md).

## What changed

- `scripts/pin-node-preset.mjs`: `turbo` resolved into a second constant, and the script now writes
  `src/commands/init/constants/node-preset-dependency.constant.ts` itself (previously printed for
  hand-pasting). Turbo pinned 2.11.10 (2.11.11 still inside `minimumReleaseAge`); a second run was
  stable.
- New templates: `turbo-json.template.ts`, `monorepo-package-json.template.ts` (exports
  `MONOREPO_LINT_STAGED`), `app-package-json.template.ts`, `tsconfig-base-json.template.ts`,
  `app-tsconfig-json.template.ts`; `pnpmWorkspaceYamlMonorepoTemplate`; the ESLint template takes
  `{ monorepo?: boolean }` and appends the `apps/*`/`packages/*` source folders only when set. The
  single-package tsconfig literal is the single source of truth; the base and app variants derive
  from it, so the single-package output stayed byte-identical through the refactor.
- `--monorepo` on `init`, create mode only: `validateInitArguments` exits 1 without `<dir>` naming
  `jss-devtools init <project-name> --monorepo`; `services/monorepo-plan.service.ts` builds the
  entries; `buildInitPlan` dispatches on `options.monorepo`; the post-install sort covers every
  `package.json` entry in the plan (root and app).
- Tests: `tests/monorepo-templates.test.ts` (9), monorepo plan tests in
  `tests/init-plan.service.test.ts`, the argument rule in `tests/init.service.test.ts`, help and
  dry-run expectations in `tests/init.command.test.ts` and `tests/bundle.test.ts`,
  `tests/init-monorepo.e2e.test.ts` gated behind `INIT_E2E=1`, shared helpers moved to
  `tests/support/init-e2e.ts`.
- Docs: `site/src/constants/reference.constant.ts`, `.harness/docs/system-architecture.md`,
  `.harness/docs/codebase-summary.md`, `.harness/docs/project-roadmap.md`; decision 0045, plan
  statuses, cooker report, journal (`ak journal validate` ok), memory lines.

## Verification (real output)

- Phase 1: template suites → 28 passed. Constants diff holds the new `MONOREPO_PRESET_DEPENDENCIES`
  (turbo 2.11.10) plus five pins that aged past `minimumReleaseAge` between the morning planning
  run and the implementation run (eslint 10.14.0, eslint-plugin-import-x 4.18.1, globals 17.14.0,
  prettier 3.10.0, tsc-alias 1.9.10) — the phase-1 "only the turbo constant" expectation could not
  hold; version snapshots were regenerated for the pin moves only. `prettier` is also pinned in the
  repo's own package.json (asserted by `tests/harness-markdown-format.test.ts`), so it was bumped
  there and installed.
- Phase 2: init unit suites → 85 passed; `pnpm build` then a scratch dry-run
  `node dist/cli.mjs init my-app --monorepo --pm pnpm --dry-run` printed the whole tree with `+`
  (turbo.json, apps/node/*, packages/.gitkeep, tsconfig.base.json, …) and "Dry run: nothing
  written".
- Phase 3: `INIT_E2E=1 pnpm vitest run tests/init-monorepo.e2e.test.ts tests/init.e2e.test.ts`
  with bun 1.3.8, pnpm 11.24.0, yarn 1.22.22 and npm 11.19.1 on PATH: the four monorepo tests
  passed (init, lint, typecheck, build, cached `FULL TURBO` rebuild, `node apps/node/dist/main.js`,
  `git rev-list --all` empty); no manager skipped.
- Final: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → 496 passed, 11 skipped (gated
  e2e), build complete. Site sequence: lint, typecheck, 123 tests passed, build ok.

## Deviations and findings

- The existing `tests/init.e2e.test.ts` has two failures that are pre-existing: the `--agent-kit`
  file-list assertion and the second-run-in-existing-mode test (a second `init -y` on a project
  that already carries the harness exits 1 with "Already set up"). Both reproduce at HEAD in a
  clean worktree with a HEAD-built bundle, so they are not caused by this work; fixing either
  touches existing-mode conflict policy and is left out of this plan.
- The phase-1 pin expectation above is the only acceptance-criteria deviation; it is the pin
  script's documented behavior, not a hand edit.

## Unresolved

- The two pre-existing e2e failures need a policy call (existing-mode harness conflicts) before
  anyone edits their expectations.
