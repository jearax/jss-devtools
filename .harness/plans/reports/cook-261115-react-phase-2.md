# Cook: phase 2 — embedding and pins (plan 261115-0643)

Phase: [phase-02-embedding-and-pins.md](../261115-0643-init-react-preset/phase-02-embedding-and-pins.md) ·
Policy: [decision 0057](../../decisions/0057-init-react-preset.md) · Proof of the template itself:
[proof-261115-react-template.md](proof-261115-react-template.md)

Status: implementation complete and verified. Every phase-2 test passes and the full check
sequence is green except **three test failures that come from pins that aged on their own
(`eslint` 10.15.0, `prettier` 3.10.1, `turbo` 2.11.11, the `@nestjs/*` five), not from React**.
Per the planner's instruction these are reported, not fixed by hand and not pinned back; the
planner owns refreshing those expectations. Nothing staged, nothing committed.

## What changed

| File | Change |
| --- | --- |
| `tsdown.config.ts` | `define` gains `__REACT_TEMPLATE__` from `readFrameworkTemplate('react')`, beside `__NEST_TEMPLATE__` |
| `vitest.config.ts` | same define for tests |
| `src/commands/init/constants/react-template.constant.ts` | new; `declare const __REACT_TEMPLATE__` + `REACT_TEMPLATE_FILES`, mirroring the nest constant |
| `scripts/pin-helpers.mjs` | adds `REACT_DEPENDENCIES` (8 runtime packages) and `REACT_DEV_DEPENDENCIES` (9 dev packages), exactly the manifest sets from phase 1's report; `rolldown` is not listed (auto-provided peer, planner decision b) |
| `scripts/pin-helpers.d.mts` | declares the two new exports — required, see the trap below |
| `scripts/pin-node-preset.mjs` | React packages join the one peer-resolved set (`ALL_PINNED` deduped with `new Set`, `vite` is named by both lists); `@babel/core` is fixed to major 7 through a `FIXED_MAJORS` table the way `@types/node` follows the node floor; the nest-only manifest tail is now one loop over `TEMPLATES` (`nest`, `react`), writing each package as a caret range |
| `tests/react-template.test.ts` | new; mirrors the nest template test plus the phase's extra assertions |
| `templates/react/package.json` | written by the pin script; every React package now a caret at the pinned exact version |
| `templates/nest/package.json`, `src/commands/init/constants/node-preset-dependency.constant.ts` | rewritten by the pin script; only aging moved (details below) |

## The 17 React pins, as resolved

Peer passes: 2, `stepsDown` 0 on all 57 packages — the shared `eslint` and `typescript` pins
were not stepped down, so the planner's stop condition (c) never triggered.

- Runtime: `@openfeature/core 1.12.0`, `@openfeature/react-sdk 1.4.1`, `@openfeature/web-sdk
  1.10.0`, `react 19.3.1`, `react-dom 19.3.1`, `react-error-boundary 6.1.6`,
  `react-router 8.5.1`, `zustand 5.1.0`
- Dev: `@babel/core 7.29.13` (fixed to major 7; registry latest is 8.1.2 — planner decision a),
  `@rolldown/plugin-babel 0.3.1`, `@types/react 19.3.0`, `@types/react-dom 19.3.0`,
  `@vitejs/plugin-react 6.3.0`, `babel-plugin-react-compiler 1.0.0`,
  `eslint-plugin-react-hooks 7.1.1`, `eslint-plugin-react-refresh 0.5.7`, `vite 8.3.8`
- `vite` is pinned once (8.3.8) and written to both manifests with the same version (planner
  decision d); the nest manifest's `vite` entry is unchanged from before this phase.

## Pins that moved, and why

The script ran twice; the second run moved nothing further, so the diff below is stable and
every move is aging (a newer stable release older than `minimumReleaseAge`), not React:

| Home | Package | From → To |
| --- | --- | --- |
| `node-preset-dependency.constant.ts` | `eslint` | 10.14.0 → 10.15.0 |
| `node-preset-dependency.constant.ts` | `prettier` | 3.10.0 → 3.10.1 |
| `node-preset-dependency.constant.ts` | `turbo` | 2.11.10 → 2.11.11 |
| `templates/nest/package.json` | `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing` | ^12.4.2 → ^12.5.0 |
| `templates/nest/package.json` | `@nestjs/cli` | ^12.0.12 → ^12.0.13 |

`typescript` stayed at 6.0.3; `@types/node` stayed on the floor major. `templates/react/` is
untracked, so `git diff` cannot show it; its manifest went from phase 1's carets to
`^<exact pinned>` for all 17 packages.

## Verification, with real output

- `node scripts/pin-node-preset.mjs` — exit 0, `node floor: 24.11.0; highest package
  engines.node floor major: 22; peer passes: 2`, `wrote` the constant and both manifests.
- `pnpm vitest run tests/bundle.test.ts tests/react-template.test.ts
  tests/nest-template.test.ts` — `Test Files 3 passed (3)`, `Tests 28 passed (28)`.
- `tests/react-template.test.ts` asserts all six phase requirements: embedded map equals the
  folder on disk; keys sorted; no `node_modules`/`dist`/lockfile/`.env`/oxlint/`.css`/binary
  image path; no NUL byte in any embedded file; every React package a caret; no shared
  toolchain package and no `eslint-plugin-react` in the manifest; no `test` script. `favicon.svg`
  is allowed on purpose: it is text SVG, kept by phase 1 and referenced by `index.html`; the
  forbidden regex blocks raster/binary image extensions, not `.svg`.
- `pnpm lint` — exit 0. `pnpm typecheck` — exit 0.
- `pnpm test` — `3 failed | 589 passed | 23 skipped`; all three failures are aged-pin fallout,
  analysed below.
- `pnpm build` — exit 0, `dist/cli.mjs 452.98 kB │ gzip: 115.03 kB`.

### Bundle size before and after

`dist/cli.mjs`: **452,975 bytes before, 452,975 bytes after — unchanged.** Reason: nothing under
`src/` imports `REACT_TEMPLATE_FILES` yet, so the bundler tree-shakes the constant; the
`__REACT_TEMPLATE__` define has no consumer in the entry graph until phase 3's
`react-plan.service.ts` imports it (nest's constant is reachable through `plan.service.ts`, which
is why nest template content is in the bundle — `grep -c "nestjs-pino" dist/cli.mjs` → 7, while
every react-template content marker greps 0). Phase 3's wiring activates the embedding and the
size will grow then. The phase-2 goal's "the built bundle carries templates/react/ as data" is
therefore staged, not skipped: the data and the define exist and the tests read them through
vitest's define.

### The three failing tests, all aged-pin fallout

1. `tests/harness-markdown-format.test.ts` — "pins the repo Prettier to the version the scaffold
   installs": `AssertionError: expected '3.10.0' to be '3.10.1'`. The test imports `version` from
   the repo's own installed `prettier` and asserts it equals
   `NODE_PRESET_DEPENDENCIES['prettier']`. The pin aged to 3.10.1; the repo's `package.json`
   (which pins the repo's own toolchain independently — root `eslint` is 10.13.0 while the
   constant was already 10.14.0 before this phase) still installs 3.10.0. Fix belongs to the
   planner: bump the repo's own `prettier` to 3.10.1, or accept that this invariant holds only
   when the root toolchain tracks the constant.
2. `tests/init-plan.service.test.ts` — "substitutes the package name and merges the shared
   devDependencies": expects `"@nestjs/common": "^12.4.2"`, receives `^12.5.0`. The literal in
   the test aged; the constant's `@nestjs/*` aging moved it.
3. `tests/node-preset-templates.test.ts` — "renders package.json per package manager": the
   rendered `package.json` embeds `eslint ^10.15.0` / `prettier ^3.10.1`; the snapshots hold
   `^10.14.0` / `^3.10.0`. The first mismatch (`bun`) throws inside the loop, so the `pnpm`,
   `yarn` and `npm` keys are reported obsolete — a reporting artefact of the throw order, not
   three separate breaks. Fix is `pnpm vitest run tests/node-preset-templates.test.ts -u` after
   the planner accepts the aged pins.

No expectation was weakened or deleted; no pin was reverted by hand.

## Traps hit this session

- **`scripts/pin-helpers.d.mts` must be edited in the same change as `pin-helpers.mjs`.** tsc
  reads the sibling declaration file (the repo has no `allowJs`), runtime reads the `.mjs`; with
  only the `.mjs` edited, the pin script runs fine while `pnpm typecheck` fails with TS2724 "has
  no exported member". Recorded in harness memory during this session.
- The long-Write garble trap hit again: the new test file's regex line gained a stray `'`
  ("Unterminated string" under vite's oxc transformer). Caught by the memory's procedure — grep
  the artifact, syntax-check, then fix the single character.
- Three lint errors after the edits (`padding-line-between-statements` twice in the pin script,
  `import-x/order` in the new test) — all fixed by `pnpm format`.

## Out of scope, untouched

No file under `src/` beyond the new constant; no init wiring, no `react-plan.service.ts`, no
`--framework react` behaviour change (phase 3); no commit, no stage, no push. `pnpm
template:install` was not run (not in the phase's verification list); `templates/react/
node_modules` is as phase 1 left it.

## Planner review of phase 2 (2026-11-15)

The planner read the diff, reproduced the three failures and confirmed all three are version
expectations, none a logic failure. **Decision: ACCEPT the aged pins** — the documented mechanism
in [.harness/docs/pins-and-template-deps.md](../../docs/pins-and-template-deps.md): a rerun moves
aged pins and the repo's own Prettier follows the preset, test-asserted. Fixes applied, in the
planner's order:

1. **Root Prettier follows the preset.** `pnpm add -D -E prettier@3.10.1`: exit 0, no
   `minimumReleaseAge` refusal, no `minimumReleaseAgeExclude` written. `git diff package.json`
   touches only the `prettier` line (3.10.0 → 3.10.1); `pnpm-lock.yaml` changes 8 lines, all
   prettier-resolution. `npx prettier --version` → 3.10.1. **No repository file needed
   reformatting** — `pnpm lint` (Prettier as a lint rule) is exit 0 on 3.10.1, so the list is
   empty.
2. **`tests/init-plan.service.test.ts` no longer holds a version literal.** Line 453 now parses
   the range from the nest template's own manifest:
   `JSON.parse(NEST_TEMPLATE_FILES['package.json']!)` and asserts
   `"@nestjs/common": "${nestManifest.dependencies?.['@nestjs/common']}"`, the way the husky line
   below reads `NODE_PRESET_DEPENDENCIES`. The next aged `@nestjs/common` cannot break it.
3. **Snapshot updated for that one file only**: `pnpm vitest run
   tests/node-preset-templates.test.ts -u` — 15/15 passed; `git diff --stat` on the snapshot:
   `16 ++++----`, 8 insertions / 8 deletions, and every changed line is an `eslint` or `prettier`
   version (`^10.14.0` → `^10.15.0`, `^3.10.0` → `^3.10.1` across the four `package.json`
   snapshots). Nothing else moved.
4. **`tests/react-template.test.ts` last test extended**: besides the missing `test` script, it
   now asserts no `vitest`, `jest` or `@testing-library/*` package in either dependency map.
5. **Full sequence, one clean pass**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` —
   exit 0 overall; `Test Files 36 passed | 3 skipped (39)`, `Tests 592 passed | 23 skipped (615)`;
   `dist/cli.mjs 452.98 kB │ gzip: 115.03 kB` (452,975 bytes, unchanged — see the embedding note
   above; phase 3 activates it). Then `pnpm template:install` — exit 0, nest template
   `node_modules` moved to the aged pins, react template already up to date; "Lockfile passes
   supply-chain policies (185 entries)".

The unresolved question above is resolved by decision 2 and the ACCEPT decision; nothing is left
open for phase 3 from this phase. Nothing staged, nothing committed.
