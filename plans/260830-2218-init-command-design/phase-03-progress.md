# Phase 3 — Progress Report (`jss-devtools init`)

Date: 2026-08-31 | Status: **implementation done — ready for manual campaign**

## Deliverables

### Code (22 src files, ~2500 LOC)
- `src/commands/init.ts` (citty leaf)
- `src/commands/init/{types,run-init-flow}.ts`
- `src/commands/init/utils/{args,preflight,apply-plan,confirm-plan,manifest}.ts`
- `src/commands/init/plan/{types,compute-plan,conflicts,display}.ts`
- `src/commands/init/generators/{eslint-config,prettier-config,commitlint-config,tsconfig,husky-hooks,lint-staged,scripts}-content.ts`
- `src/commands/init/presets/{types,node,react,next}-preset.ts` + `get-preset.ts`
- `src/commands/init/install/{resolve-specs,build-install-commands,run-command}.ts`
- `src/core/detector/{project-pm,monorepo-signals}.ts` (NEW)
- `src/core/runner/pm-commands.ts` (NEW)
- `src/core/registry-client/{fetch-package,types}.ts` (additive: `PackageMetadata.versionDocs`)
- `src/cli/router.ts` (additive: `init` subcommand entry)

### Tests (7 files, 213 pass + 1 skip)
- `tests/init-args.test.ts` (12) — citty negation keying pinned
- `tests/init-detectors.test.ts` (21)
- `tests/init-generators.test.ts` (43)
- `tests/init-manifest.test.ts` (22)
- `tests/init-plan.test.ts` (22)
- `tests/init-resolve-specs.test.ts` (15)
- `tests/init-flow.test.ts` (18)

### Docs / changesets
- `plans/260830-2218-init-command-design/{plan,phase-01,phase-02,phase-03}.md`
- `plans/reports/scout-260830-2207-init-command-design.md`
- `plans/reports/kongming-260830-2257-init-phase2-gonogo.md` (kongming report — written by agent)
- `plans/reports/tester-260830-2325-init-command-tests.md` (tester report)
- `.changeset/init-command.md` (minor bump — public release)

## Quality gates (all green)
- `pnpm vitest run` → 213 passed, 1 skipped (PM_UNDETECTED — env-dependent, deferred to v2)
- `pnpm lint` → exit 0
- `pnpm typecheck` → exit 0
- `pnpm build` → tsup success
- Smoke: `init --help` renders all 7 args + auto-inverts `--no-*`; `init` → FRAMEWORK_REQUIRED exit 1; `init --framework react-native` → FRAMEWORK_INVALID exit 1

## Bugs found and fixed during review
1. `specsToRecord` mangled specs without `@` (offline path) → guard with `at <= 0`
2. `^latest` invalid range emitted to manifest under unsatisfiable peers → `specFor(name, version)` helper, applied in 3 places (install, runtime, manifest devDeps)
3. `mergeHookContent` dropped user-authored bash shebangs → only filter init's own `#!/usr/bin/env sh`
4. `husky-activate` skip message suppressed when install failed → surface in both branches
5. `addSpecsCommand` throw bubbled past InitResult envelope → caught, mapped to `installOk = false` + `skipped` entry
6. `compute-plan.ts` manifest-edit field order pinned with why-comment (kongming Q3)

## Carry-forward (NOT blockers)
- PM_UNDETECTED e2e test (skipped) — env-dependent; needs `runPreflight` to expose fallback for injection
- `proceed-keeping` flow covered transitively only (TTY prompt path)
- `peer+dev` install double-write (pnpm tolerates)
- Husky `prepare` script + `husky-activate` dual-redundancy not called out in design doc — future contributors should leave both
- v2 follow-up: `--existing-repo` flag (kongming optional)

## Manual campaign (user gate, per mode node → react → next)
Per kongming Q4 mitigations:
1. Scratch dir per framework + real install + real commit
2. First commit smoke: `git commit --allow-empty -m "feat: initial commit"` to confirm commitlint blocks/allows as expected
3. Second commit: 1 trivial file to confirm lint-staged fires end-to-end (eslint + prettier + ppj)
4. Then real diff to test the full hook chain

## Status
- ✅ All work tasks #1-#4 complete
- ✅ Phase 3 implementation done; awaiting user-run manual campaign + changeset release

## Unresolved questions
None blocking. Manual campaign + changeset release (merge version PR per repo workflow) are the next user-driven actions.