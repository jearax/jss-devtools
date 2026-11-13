---
phase: 2
title: "Embedding and pins"
status: done
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Embedding and pins

## Goal

The built bundle carries `templates/nest/` as data, unit tests see the same data, and the pin
script is the only writer of the Nest versions.

## Files

- Create: `scripts/framework-template.mjs` — reads `templates/<framework>/` into a sorted
  `{ path: content }` map, skipping `node_modules/`, `dist/`, lockfiles and anything Git ignores.
- Modify: `tsdown.config.ts`, `vitest.config.ts` — `define: { __NEST_TEMPLATE__: ... }` from that
  reader, the way `__HARNESS_HOOK_BUNDLE__` is defined; vitest gets the real map, not a
  placeholder.
- Create: `src/commands/init/constants/nest-template.constant.ts` — `declare const` and export,
  like `src/modules/harness/constants/hook-bundle.constant.ts`.
- Modify: `scripts/pin-node-preset.mjs` — add the Nest packages and write their versions into
  `templates/nest/package.json` as caret ranges (decision 0030: generated manifests carry carets).
  It is 394 lines: move its shared helpers (npm view, version parsing, age filter) into a new
  `scripts/pin-helpers.mjs` before adding, so the script shrinks rather than grows.
- Create: `tests/nest-template.test.ts`.

## Steps

1. Reader and `define`, with the map's keys sorted so the bundle is reproducible.
2. Pin script: the Nest dependency list comes from phase 1's report. Rerun it; commit whatever it
   moves, and say in the report which pins moved and why (release age).
3. Tests: the embedded map equals the folder on disk; it holds no `node_modules`, `dist` or
   lockfile path; `templates/nest/package.json` versions equal what the pin script would write
   (rerun produces no diff, as for the existing pins); the template has no `AGENTS.md`,
   `.oxlintrc.json` or oxlint dependency.

## Findings from phase 1 to carry

- Never add `minimumReleaseAgeExclude` for a Nest package, in this repository or in a generated
  project. Phase 1 wrote `^12.5.0` for `@nestjs/{common,core,platform-express,testing}`, published
  hours earlier; no version in that range was old enough, so pnpm auto-added excludes. The pin
  script picks the newest version older than one day (12.4.2 at planning time, inside
  `@nestjs/i18n`'s `^12.1.0` peer), and a caret on that version lets pnpm resolve an aged release.
- The logger skips request logs with `startsWith('/health')`, which also silences a route such as
  `/healthy-users`; match `/health/` or the exact health path instead, with a test.
- The `@nestjs/i18n` 0.0.3 API is recorded in `.harness/plans/reports/proof-261112-nest-template.md`;
  read it before touching `src/core/i18n`.

## Verification

- `pnpm build`, then `tests/bundle.test.ts` (runs `dist/cli.mjs` with no `node_modules`).
- `node scripts/pin-node-preset.mjs && git diff --exit-code templates/nest/package.json src/commands/init/constants/`
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## Risks

- Bundle size grows by the template; report `dist/cli.mjs` size before and after.
- A file added to `templates/nest/` ships without review; the map-equals-folder test plus the
  e2e in phase 4 are the guard.
