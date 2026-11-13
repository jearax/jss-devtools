# Cook: nest phase 4 — end-to-end proof and docs

Plan: [261112-1647-init-nest-preset](../261112-1647-init-nest-preset/plan.md) · Phase:
[phase-04-e2e-and-docs.md](../261112-1647-init-nest-preset/phase-04-e2e-and-docs.md) · Phase 3 report:
[cook-261113-nest-phase-3.md](cook-261113-nest-phase-3.md)

Status: done. Every check below was run for real; exit codes and outputs are quoted. Nothing committed or pushed.
The plan is now complete: all four phases done, every success criterion checked in `plan.md`.

## Outcome

`tests/init-nest.e2e.test.ts` proves the nest preset end to end, per manager on `PATH`, single and
monorepo: the generated app lints, typechecks, passes `test` and `test:e2e`, builds, and the built
`node dist/main.js` answers `GET /health/ready` 200 on a free port before the process is stopped.
The docs and the site describe the preset. The 400 `vi`/`en` checks run inside the generated app's
own `test:e2e` (real HTTP through supertest), because the built app deliberately ships only the
health route — the phase 1 contract. The gated suites stay local: `INIT_E2E` runs in no CI workflow
(`ci.yml` has no reference), stated here as the phase file asks.

## What changed

| File | Change |
| --- | --- |
| `tests/init-nest.e2e.test.ts` | **New, 170 lines.** Gated by `INIT_E2E=1`, reuses `tests/support/init-e2e.ts`. Per manager: single app and `--monorepo` app — `prettier --check .` right after init, name assertions (`my-nest-<pm>`, `@my-nest-mono-<pm>/nest`), `lint`/`typecheck`/`test`/`test:e2e`/`build`, cached turbo rebuild (`FULL TURBO`) for the monorepo, then serve on a free port (`PORT` env, `NODE_ENV=prod`) and `SIGTERM` after a 200. |
| `README.md` | The `node` and `nest` presets named; a `--framework nest` example row; a nest paragraph quoting [decision 0047](../../decisions/0047-init-nest-preset.md); the monorepo paragraph names `apps/nest`. |
| `CLAUDE.md` | The "Where things are" table gains `templates/nest/` (outside the harness block). |
| `.harness/docs/system-architecture.md` | The init section covers both presets, the existing-mode refusal, the embedded template and `nest-plan.service.ts`; the `--framework` flag row no longer says "only node for now". |
| `.harness/docs/codebase-summary.md` | `templates/nest/` in the root table; the init row and the pin row updated; `scripts/framework-template.mjs` and `scripts/pin-helpers.mjs` rows; `tests/nest-template.test.ts` and `tests/init-nest.e2e.test.ts` rows. |
| `.harness/docs/project-roadmap.md` | New "Done: init --framework nest creates a Nest app" section; the open-areas table now reads "beyond `node` and `nest`". |
| `site/src/constants/reference.constant.ts` | `--framework` meaning: `node` and `nest` work, `nest` creates a new project only. |
| `site/src/pages/Docs/Docs.constant.ts` | `INIT_PRESETS`: nest is "Implemented." |
| `site/src/pages/Docs/pages/Init/Init.constant.ts` | New `the-nest-preset` section id and `INIT_NEST_PARAGRAPHS`. |
| `site/src/pages/Docs/pages/Init/InitNest.tsx` | **New, 60 lines.** `presetsSection` (moved out of `Init.tsx`, now "Two of them are implemented.") and `nestSection` (paragraphs plus a copyable `init my-api --framework nest` block). |
| `site/src/pages/Docs/pages/Init/Init.tsx` | Renders the two sections from `InitNest.tsx`; 199 → 172 lines. |
| Plan state | `plan.md` status done, phases 3–4 Done, all success criteria `[x]`; `phase-03`/`phase-04` frontmatter `done`. |

## Site transcripts: checked, no drift, nothing recaptured

The skill's script comparison over a fresh `FORCE_COLOR=1 init my-app -y --dry-run` capture: every
kept `INIT_TRANSCRIPT` line exists verbatim in the fresh capture — including the `To apply` line,
which only matched after I recaptured with `-y`, matching the constant's documented command. The
transcripts never show `init --help`, so the changed `--framework` line and re-padded examples do
not reach them; the node plan listing they do show is byte-identical.

## E2E proof (real output)

`pnpm build` exit 0, then `INIT_E2E=1 pnpm vitest run tests/init-nest.e2e.test.ts tests/init.e2e.test.ts tests/init-monorepo.e2e.test.ts`:
**3 files passed, 19 tests passed**, zero managers skipped (no "skipped, not on PATH" lines; bun 1.3.8, pnpm 11.24.0, yarn 1.22.22 and npm 11.19.1 all on `PATH`). A second run of the nest suite alone with `--disableConsoleIntercept` captured the real per-manager timings:

| Suite | bun | pnpm | yarn 1 | npm |
| --- | --- | --- | --- | --- |
| single (`my-nest-<pm>`) | 7.1s | 12.8s | 24.0s | 11.5s |
| monorepo (`my-nest-mono-<pm>`, `FULL TURBO`) | 8.5s | 15.8s | 23.6s | 13.0s |

Each timing covers init + `prettier --check .` + `lint` + `typecheck` + `test` + `test:e2e` +
`build` + the serve probe (health 200, then `SIGTERM`).

## Checks (repository)

- `pnpm typecheck` → exit 0
- `pnpm test` → exit 0; 32 files passed, 3 skipped; 512 passed, 19 skipped (the e2e suites gate off)
- `pnpm build` → exit 0
- `pnpm lint` → **run last**, exit 0 — and it earned its place: the first run caught two errors in
  `tests/init-nest.e2e.test.ts` (`node:net` import order, a missing blank line), fixed with
  `pnpm lint --fix`, then `pnpm typecheck` and `pnpm lint` re-run, both exit 0

## Checks (site)

- `pnpm --dir site lint` → exit 0 (first run caught 3 import-order/type-import errors in the new
  `InitNest.tsx` — the site forbids `import type` from a module with a default export; fixed)
- `pnpm --dir site typecheck` → exit 0
- `pnpm --dir site test` → exit 0; 26 files, 123 tests passed (the terminal test prints every transcript line)
- `pnpm --dir site build` → exit 0

## Findings

1. **The monorepo turbo tasks stay `lint`/`typecheck`/`build`/`dev`** — no `test` task — so the
   suite runs `test` and `test:e2e` inside `apps/nest`, matching how the planner proved it.
2. **Free-port serve races are accepted**: the test binds port 0, closes the probe socket and hands
   the port to the app — the standard small race; the health poll retries for 30s, so a stolen port
   surfaces as a clear failure, not a hang.
3. **`--disableConsoleIntercept` is required** to see vitest `console.log` in a captured file; the
   default reporter swallowed the per-manager timing lines entirely (memory line added).

## Unresolved questions

- None. The root-vs-app ESLint question from phase 3 is closed: the monorepo e2e runs `lint` at the
  root through turbo (each package's own config) and the full tree passes on every manager.

## Post-review fixes appended 261113

Two review findings on the finished plan, both fixed:

1. **DRY: the shared toolchain entries lived in three plan services.** New
   `src/commands/init/services/shared-toolchain-plan.service.ts` exports `hookCommands` (moved out
   of `plan.service.ts`) and `sharedToolchainEntries(pm, vscode, extras)` — the create-mode list
   (`.prettierrc.json`, `.editorconfig`, `.gitignore`, `.prettierignore`,
   `commitlint.config.mjs`, both husky hooks, `.vscode/*` unless `--no-vscode`,
   `pnpm-workspace.yaml` for pnpm). Each mode keeps its real differences in `extras`: node passes
   `eslintConfig`, monorepo passes the `{ monorepo: true }` ESLint config and the monorepo
   workspace template, nest passes neither (the embedded template carries its own
   `eslint.config.mjs`). Existing-mode merge logic in `plan.service.ts` is untouched.
2. **The nest manifest no longer inherits the node-only runtime tools.** `sharedDevDependencies()`
   in `nest-plan.service.ts` filters `tsx` and `tsc-alias` out of `NODE_PRESET_DEPENDENCIES`
   (nest dev is `nest start --watch`, `nest build` rewrites `@/`). New test
   `excludes the node-only runtime tools from the nest manifests` in
   `tests/init-plan.service.test.ts` asserts neither package in the generated single-app or
   `apps/nest` manifest, with `typescript` still present.

Verification, in the required order:

- `pnpm build` → exit 0
- `INIT_E2E=1 pnpm vitest run tests/init-nest.e2e.test.ts tests/init.e2e.test.ts
  tests/init-monorepo.e2e.test.ts` → 19/19 tests passed (3 files); the combined run then flagged
  `init-nest.e2e.test.ts` as a failed suite because the `afterAll` tmpdir cleanup exceeded vitest's
  10s default hook timeout — a cleanup-timeout flake, not a behavior failure. A clean rerun of the
  suite alone with `--hookTimeout=120000`: **1 file passed, 8/8 tests**, no managers skipped.
- `pnpm typecheck` → exit 0 (it earned its place here: an intermediate refactor state passed
  `pnpm build` while tsc caught a missing identifier — tsdown does not typecheck)
- `pnpm test` → exit 0; 32 files passed, 3 skipped; 513 passed, 19 skipped (one more than the
  phase run: the new exclusion test)
- `pnpm build` → exit 0
- `pnpm lint` → **run last**, exit 0

Nothing committed or pushed.
