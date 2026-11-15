---
phase: 2
title: "Embedding and pins"
status: done
priority: P1
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Embedding and pins

## Goal

The built bundle carries `templates/react/` as data, unit tests see the same data, and the pin
script is the only writer of the React versions.

## Files

- Modify: `tsdown.config.ts`, `vitest.config.ts` — `define: { __REACT_TEMPLATE__: ... }` from
  `readFrameworkTemplate('react')`, beside `__NEST_TEMPLATE__`.
- Create: `src/commands/init/constants/react-template.constant.ts` — `declare const` and export
  `REACT_TEMPLATE_FILES`, like `nest-template.constant.ts`.
- Modify: `scripts/pin-helpers.mjs` — `REACT_DEPENDENCIES` and `REACT_DEV_DEPENDENCIES`, from phase
  1's report.
- Modify: `scripts/pin-node-preset.mjs` — pin the React packages in the same peer-resolved set and
  write their versions into `templates/react/package.json` as caret ranges. Turn the nest-only
  block at the end of the script into one loop over the templates, so the script does not grow by
  a second copy.
- Create: `tests/react-template.test.ts`, mirroring `tests/nest-template.test.ts`.
- Modify: `tests/nest-template.test.ts` only if a shared package forces it (see step 2).

## Steps

1. Reader and `define`. `scripts/framework-template.mjs` needs no change.
2. Pin script. `vite` is already in `NEST_DEV_DEPENDENCIES` and React needs it too: a package
   named by two templates is pinned once and written to both manifests with the same version.
   Rerun the script and say in the report which pins moved and why. ESLint must stay at 10 and
   TypeScript at its current pin: if the peer check wants to step either down, stop and report.
3. Tests: the embedded map equals the folder on disk; keys are sorted; no `node_modules`, `dist`,
   lockfile, `.env` (other than `.env.example`), oxlint config, `.css` or image path; no value
   contains a NUL character; every React package is a caret range; no package from
   `NODE_PRESET_DEPENDENCIES` and no `eslint-plugin-react` appears in the template manifest; the
   manifest has no `test` script.

## Verification

- `pnpm build`, then `pnpm vitest run tests/bundle.test.ts tests/react-template.test.ts tests/nest-template.test.ts`.
- `node scripts/pin-node-preset.mjs && git diff --exit-code src/commands/init/constants/ templates/nest/package.json`
  — the node and nest pins do not move because of React, apart from pins that aged on their own;
  name each one that moved.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## Risks

- Bundle size grows by the template; report `dist/cli.mjs` size before and after.
- The peer check treats a range it cannot parse (a prerelease bound such as `^8.0.0-rc.1`) as
  satisfied; the real install in phase 4 is the guard.
