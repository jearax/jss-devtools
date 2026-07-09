# Changelog

## 0.0.2

### Patch Changes

- Remove ESLint 9.x `defineConfig` import to fix ESLint 8.x compatibility. Package was trying to import from `eslint/config` which doesn't exist in ESLint 8.x exports.

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.0.1] - 2026-07-09

### Added

- `jss init` command: scaffold ESLint 8.x + Prettier + Husky + lint-staged + TS alias imports.
- Framework presets: Node, React, React Native, Next.js (conditional Tailwind/Storybook).
- Smart repo-state detection:
  - Linter coexistence (ESLint silent; Biome/Oxlint/mixed → warn + confirm).
  - Package version conflicts (same-major silent skip; different-major → overwrite/skip/cancel).
  - Config-file detection (target-format silent overwrite; other formats → prompt).
- Auto-create `tsconfig.json` (baseUrl + `@/*` alias) when missing.
- Offline-aware: warns when npm registry unreachable, falls back to declared ranges.
- Non-interactive mode (`-y`) for CI/automation.
- Cross-platform package-manager detection (npm/yarn/pnpm/bun).

### Changed

- Idempotent setup: re-running `init` is silent when nothing changes.
- Husky `pre-commit` merges user content instead of clobbering.
- `git init -b main` (silent, no `master` hint).
- Concise result-only logging (no verbose start/progress lines).

### Removed

- `commitlint` support (replaced by Predicate API).
- Changesets tooling.
