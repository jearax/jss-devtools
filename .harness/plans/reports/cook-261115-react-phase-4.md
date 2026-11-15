# Cook report — init react preset, phase 4 (e2e, site and docs)

Plan: [.harness/plans/261115-0643-init-react-preset/plan.md](../plan.md), phase file
[phase-04-e2e-site-and-docs.md](../phase-04-e2e-site-and-docs.md). Cooker session 2026-11-15.
Phases 1–3 done and reviewed; phase 4 only.

## (A) Step 0 — title substitution fix + unit test

- `react-plan.service.ts`: the title replacement now goes through a function replacer with the
  project name HTML-escaped (`&` first, then `<`, `>`). A `$&` in a folder name no longer becomes
  a replacement pattern, and `&`, `<`, `>` no longer break the title markup.
- New `tests/react-plan.service.test.ts`, two tests: `a&b$&c<d>e` becomes the title
  `a&amp;b$&amp;c&lt;d&gt;e`, and a plain name is written as-is, in create mode and in the
  monorepo app at `apps/react/index.html`.
- `pnpm vitest run tests/react-plan.service.test.ts` — 1 file, 2 tests, passed.

## (B) tests/init-react.e2e.test.ts

`tests/init-react.e2e.test.ts`, gated by `INIT_E2E=1`, modelled on `tests/init-nest.e2e.test.ts`
and reusing `tests/support/init-e2e.ts`. Per manager (bun, pnpm, yarn, npm): `init` a single app,
assert the manifest name and no `.git`, run `lint`, `typecheck`, `build`, scan `dist/assets/*.js`
for `memo_cache_sentinel`, start `vite preview` on a free port with `--strictPort`, `GET /` and
`GET /dashboard` 200 with `text/html`, stop the server with SIGTERM, assert the port binds again,
then `prettier --check .`. Second test per manager: the same through `--monorepo` with the app at
`apps/react`, the rebuild answered `FULL TURBO`, and the preview served from the app folder.
Managers without `--version` on PATH are named in the log; npm and pnpm throw (they are required).

Managers on this machine at run time: pnpm 11.24.0, npm 11.19.1, yarn 1.22.22, bun 1.3.8 — none
skipped.

### Run 1 of the react suite: 2 passed, 6 failed — all six were test bugs, fixed

`INIT_E2E=1 pnpm vitest run tests/init-react.e2e.test.ts` (run 1) failed 6 of 8 with three
causes, none in the shipped code:

1. The four single-app tests failed on my own assertion
   `expect(existsSync(join(project, '.git'))).toBe(false)` — init creates the git repository
   (`git init -q -b main`) by design; the contract is "no commit", not "no repo". Replaced with the
   `git rev-list --all` empty-output check the monorepo e2e uses, in both tests.
2. The yarn and npm monorepo tests died spawning `apps/react/node_modules/vite/bin/vite.js`:
   yarn and npm hoist vite to the workspace root, pnpm and bun keep it beside the app. The bun and
   pnpm monorepo tests passed, which proves the flow itself. `previewAndStop` now takes the vite
   path, and a `viteBin(app, projectRoot)` helper picks the first existing of the two locations.
3. The same two monorepo tests hit the 600-second test timeout: two turbo builds plus a yarn/npm
   workspace install exceed it. The test-level timeout is now `TIMEOUT * 2`; the per-step timeouts
   are unchanged.

Rerun result in section (G).

### Run 2 of the react suite after the fixes: 8/8 passed

`INIT_E2E=1 pnpm vitest run tests/init-react.e2e.test.ts` — `Test Files 1 passed (1)`,
`Tests 8 passed (8)` (4 managers × single + monorepo), 132.43s, exit 0. The warm package caches of
run 1 made the yarn and npm monorepo tests fast; the doubled timeout is the headroom for a cold
run. Per-manager proof comes from the four-suite verification below, whose reporter lists every
test name.

## (C) Site

- New `site/src/pages/Docs/pages/React/`: `React.constant.ts` (sections, `src/` tree, env rows,
  conventions/monorepo/not-there paragraphs, `REACT_SCRIPTS`), `ReactSections.tsx`
  (what-it-writes, environment table, what-is-not-there-yet), `React.tsx` (the page), and
  `React.test.tsx` (every heading renders, the env cell, the zustand and `use` conventions).
- Wired in: `routes.constant.ts` (react page in the Presets group), `Docs.route.ts`
  (`/docs/react`), `search-index.constant.ts`, `Docs.constant.ts` (`react` is `Implemented.`),
  `reference.constant.ts` (`node`, `react` and `nest` work; `rn` and `next` declared), the init
  page (`InitReact.tsx` beside `InitNest.tsx`, a `the-react-preset` section,
  "Three of them are implemented").
- `tests/site-react-docs.test.ts`: the page's scripts block, `src/` tree and environment table
  must stay equal to `templates/react/` — 3 tests, passed.
- `ci/smoke-site-image.sh`: `/docs/react` must answer 200 beside `/docs/nest`.
- Site sequence: lint, typecheck, test (28 files, 131 tests) and build all exit 0; the build
  emits `React-DpHmGY05.js`.

## (D) Docs

- `README.md`: the intro ships `node`, `nest` and `react`; a react example line in the commands
  block; a react paragraph (what it writes, create-mode only, `apps/react`, decision 0057,
  `/docs/react`); the monorepo paragraph names `apps/react`.
- `.harness/docs/system-architecture.md`: the init section covers the react preset (create mode
  only, `react-plan.service.ts`, the shared manifest helpers, the escaped title, the tsx/tsc-alias
  exclusion, the traps doc) and the flags table names three implemented presets.
- `.harness/docs/codebase-summary.md`: a `templates/react/` row, the `src/commands/init/` row
  names `react-plan.service.ts`, `shared-template-plan.service.ts` and
  `react-template.constant.ts`, the pin-script row covers both templates, and the tests table has
  `init-react.e2e`, `react-template`, `react-plan.service` and `site-react-docs` rows.
- `.harness/docs/project-roadmap.md`: a "Done: the init react preset" section with the e2e and
  site proof, and the "Not started" table now lists only `rn` and `next`.
- `.harness/docs/project-overview-pdr.md`: "Node, Nest and React ship; Next and React Native
  presets are planned."
- `.harness/docs/react-template-traps.md`: added the pins-aging trap (phase 2), the title
  substitution pattern trap (step 0), the `memo_cache_sentinel` proof trap (phase 4) and the
  RichText backtick trap of the docs page.
- `CLAUDE.md`: a `templates/react/` row in "Where things are", outside the harness block.
- `.claude/skills/verify-init-template/SKILL.md`: the fast path names react and its e2e suite,
  and the React section gains the stop-then-prove-the-port-free discipline the e2e enforces. No
  other change to the skill — its React section held.

## (G) Final gate — real output

Verification of the phase: `INIT_E2E=1 pnpm vitest run tests/init-react.e2e.test.ts
tests/init-nest.e2e.test.ts tests/init.e2e.test.ts tests/init-monorepo.e2e.test.ts` —
`Test Files 1 failed | 3 passed (4)`, `Tests 31 passed (31)`, 258.63s. The react (8), init (11)
and init-monorepo files passed whole; the nest file's 12 tests all passed and the file is marked
failed only by its `afterAll` cleanup hook hitting vitest's 10-second `hookTimeout` while removing
twelve installed projects. Re-ran the nest suite alone once: `Tests 12 passed (12)`, same hook
timeout — deterministic on this machine, unrelated to the react work (the react file's own
`afterAll`, eight projects, passes). Left unfixed: the nest e2e file is outside phase 4's scope.

- `pnpm lint` — exit 0.
- `pnpm typecheck` — exit 2, **all 83 errors under `my-app/`**, a project a concurrent session ran
  `init my-app --framework react` on inside the repository root at 15:29–15:30 while this phase ran
  (it is not in tsconfig's `exclude`, so the root typecheck reaches it). Filtered output:
  `tsc --noEmit` reports **zero errors outside `my-app/`**. Not deleted — it is not this session's
  file. After removing `my-app/`, `pnpm typecheck` is the one command to re-run.
- `pnpm test` — `Test Files 38 passed | 4 skipped (42)`, `Tests 607 passed | 31 skipped (638)`,
  exit 0. The four skipped files are the `INIT_E2E` suites proven above.
- `pnpm build` — `dist/cli.mjs 489.66 kB`, exit 0.
- Site sequence — lint, typecheck, test (`28 files`, `131 tests`), build, all exit 0.
- `node dist/cli.mjs harness doctor` — `Harness is healthy`; the only advisory is the pre-existing
  `0033-harness-doctor.md has no quote of the user`, under `.harness/decisions/` which this phase
  must not edit.

`ci/smoke-site-image.sh` was extended with the `/docs/react` 200 check but not run: it needs a
built site image through Docker, which this phase does not build. The check is exercised by CI's
image job.

## Status

Phase 4 is complete on the cooker side. Not done here, by design: the phase file's `status` stays
`todo` and the plan's phase table stays `Pending` for the planner to review and flip; nothing is
committed, staged or pushed. Unresolved: the `pnpm typecheck` blocker above, owned by the
concurrent session that created `my-app/`.
