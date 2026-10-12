# Project Roadmap — `jss-devtools`

## Shipped

- **0.5.x** — `init` with peer-aware version resolution, conflict confirmation, husky/lint-staged/commitlint wiring.
- **0.6.0** — lean release: `init` is the only command; `.editorconfig` owns whitespace and `.prettierrc.json` owns JS syntax; minimal `.vscode` and `.gitignore`; npm default when no PM signal; eslint 10; `node` is the only framework.

## Next

- **Framework presets** for the reserved ids `react` (Vite), `next`, `nest` and `rn` (Expo). Direction from the 2026-10-13 brainstorm:
  - compose each framework's official eslint config (`eslint-config-next`, `eslint-config-expo`) with the house rules;
  - leave framework-owned `tsconfig` files untouched;
  - auto-detect the framework from `package.json` dependencies, with `--framework` as an override;
  - accept eslint 9 for React-based presets while `eslint-plugin-react` peers `^9.7`.
- **Release:** switch publishing to npm trusted publishing (OIDC) and drop `NPM_TOKEN` once a release confirms it.

## Out of Scope

Monorepo support, self-management commands, project scaffolding (left to each framework's scaffolder).

## Tracking Conventions

- Plans live in `plans/{date}-{slug}/`; reports in `plans/reports/`.
- Update this file when a release ships or scope changes.
