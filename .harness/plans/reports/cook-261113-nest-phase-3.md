# Cook: nest phase 3 — init wiring

Plan: [261112-1647-init-nest-preset](../261112-1647-init-nest-preset/plan.md) · Phase:
[phase-03-init-wiring.md](../261112-1647-init-nest-preset/phase-03-init-wiring.md) · Phase 2 report:
[cook-261113-nest-phase-2.md](cook-261113-nest-phase-2.md)

Status: done. Every check below was run for real; exit codes and outputs are quoted. Nothing committed or pushed.

## Outcome

`init my-api --framework nest` (with or without `--monorepo`): the CLI (giao diện dòng lệnh) now goes through init's full flow —
preflight (kiểm tra trước), plan (kế hoạch), dry run (chạy thử), confirmation (xác nhận), writes, install, sort,
format, AgentKit — and writes the Nest 12 ESM app from the embedded template, with the project name substituted and the 19 shared
toolchain devDependencies (phụ thuộc dev) merged into `package.json`. Existing mode with `--framework nest` exits 1 before any write,
naming `jss-devtools init <project-name> --framework nest`. Node preset output is byte-for-byte unchanged: all node plan/template/e2e
tests pass without expectation edits to node output.

## What changed

| File | Change |
| --- | --- |
| `src/commands/init/services/nest-plan.service.ts` | **New, 109 lines.** `nestCreateModeEntries` (template map + shared toolchain, single) and `nestMonorepoAppEntries` (template under `apps/nest/`, name `@<pkg>/nest`). Only `package.json` is transformed: name `nest-app` → derived package name, shared devDependencies merged as carets. Every other template file is copied byte-for-byte. `--no-vscode` and pnpm-only `pnpm-workspace.yaml` honored. |
| `src/commands/init/services/init.service.ts` | Argument rule: `nest` accepted with `<dir>`; `nest` without `<dir>` throws `Framework nest needs <dir>` naming the create command; `react`/`rn`/`next` keep their message, hint updated to `Only node and nest are`. |
| `src/commands/init/services/plan.service.ts` | One dispatch: create mode branches `monorepo` → `monorepoCreateModeEntries`, else `framework === 'nest'` → `nestCreateModeEntries`, else node. 385 → 388 lines. |
| `src/commands/init/services/monorepo-plan.service.ts` | App-entries dispatch: nest → `nestMonorepoAppEntries`, else the three node app entries. Root files untouched. 77 → 85 lines. |
| `src/commands/init/init.command.ts` | `--framework` description is now `Preset to apply`; one example row `jss-devtools init my-api --framework nest -y` (re-pads the example block). 340 → 341 lines. |
| `templates/nest/package.json` | Added `"dev": "nest start --watch"` so the outro's `<pm> run dev` maps to Nest's watch dev server (phase step 2). Versions untouched — the pin script owns them. |
| `tests/init.service.test.ts` | +2: nest accepted with `<dir>`; nest without `<dir>` exits 1, folder unchanged. |
| `tests/error-output.test.ts` | E19 hint expectation updated (`Only node and nest are`); new case asserting the full nest rejection block. |
| `tests/init-plan.service.test.ts` | +4: sorted nest plan paths for all four managers (single + monorepo, pnpm-workspace.yaml only for pnpm), name substitution + shared-dep merge + no `nest-app`/`packageManager` field, node plan byte-equal test. |
| `tests/init.command.test.ts` | HELP_BLOCK snapshot updated (framework line + example rows); +3 tests: existing mode + nest exits 1 before any write, single and monorepo nest dry-runs write nothing. |
| `tests/bundle.test.ts` | Help snapshot: same two-line change as HELP_BLOCK. |
| `tests/help-colours.test.ts` | One-line padding expectation for the re-padded example block (tests/help-colours.test.ts:72). |

## Scratch proof (real built CLI, pnpm 11.24.0)

## Scratch proof (real built CLI, pnpm 11.24.0)

Scratchpad `~/.claude/projects/-Users-tandm-.../scratchpad/nest-phase-3/`. Built bundle 376,543 bytes (was 344,709 → +31,834).

| Check | Result |
| --- | --- |
| `init my-api --framework nest --pm pnpm -y` | exit 0; 66 files; install 3.1s; sorted; formatted 66 files; outro `cd my-api` / `pnpm run dev` |
| install (by init) | exit 0, no `minimumReleaseAgeExclude` added (pins old enough) |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | 8 passed |
| `pnpm test:e2e` | 7 passed |
| `pnpm build` (`nest build`) | exit 0 |
| `prettier --check .` | clean |
| `init dry-single --framework nest --dry-run --pm pnpm` | exit 0, "77 to create", `Dry run: nothing written`, the target folder is never created |
| `init dry-mono --monorepo --framework nest --dry-run --pm pnpm` | exit 0, "82 to create", `+ apps/nest/package.json`, `+ turbo.json`, nothing written |
| existing project + `init --framework nest` | exit 1, `Framework nest needs <dir>` + the create command, `package.json` byte-unchanged |

## Findings

1. **Bundle growth explained**: embedded template content is 26,372 bytes (excludes node_modules/dist/lockfiles);
   bundle grew +31,834 bytes — template strings plus escaping overhead, not the phase-2 estimate of ~116 kB (that was du
   including node_modules). Expect the same final size in phase 4.
2. **Only one file carries the name**: `nest-app` appears in exactly one template file; the transform is a JSON round-trip
   (parse → spread → stringify, tab indent), key order survives, and `prettier-package-json` re-sorts at the sort step anyway.
   engines stays `>=24.11.0` from the template (equals PACKAGE.nodeFloor today). No `packageManager` field is added: name +
   shared devDependencies merge only, per the phase letter.
3. **No `minimumReleaseAgeExclude` in the generated pnpm project**: the moved pins (12.4.2) are old enough; the generated
   pnpm-workspace.yaml holds only allowBuilds + strictPeerDependencies + engineStrict, like any node-preset pnpm project.
4. `format` script stays `npm run lint:fix && prettier --write .` from the template (node preset varies it per manager via
   `formatScript(pm)`). Works from every manager; noted as a deliberate no-transform.
5. **ESLint root-vs-app conflict deferred to phase 4**: the node monorepo root ESLint config bans `.js` import extensions
   while the nest template requires them; the root `lint:fix` glob covers `apps/*/{src,...}`. Each package's own `lint`
   script (turbo) uses the app's nest config so per-package lint is green, but a root-level ESLint pass over apps/nest sources
   with the root config would flag nest imports. Phase 4's monorepo proof must run `turbo run lint` and check the root
   `lint:fix` glob; if the conflict is real, the fix is a nest-aware root config or excluding apps/nest from the root glob — a
   decision for then.
6. **Help snapshot family**: three test files hold init-help expectations (init.command.test.ts HELP_BLOCK, bundle.test.ts,
   help-colours.test.ts padding). All updated to the real rendered output from the built CLI. Site transcripts were recaptured
   from the previous CLI; phase 4 (site) must re-check the init transcript for the changed `--framework` line and re-padded
   examples if any transcript shows init help.

## Unresolved questions

- None blocking. The root-vs-app ESLint conflict in nest monorepo (finding 5) is the one item phase 4 must verify before the
  plan is done — recorded here so phase 4 does not rediscover it.
