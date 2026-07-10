# Changelog

## 0.0.35

### Patch Changes

- Restore eslintConfigNode/pluginReact export-based config API; init self-installs jss-devtools (pinned to running version) so the config import resolves; docs use npx/dlx/bunx

## 0.0.33

### Patch Changes

- Generate self-contained eslint.config.mjs (no jss-devtools import) so the CLI runs purely via npx/dlx/bunx; update docs for PM-specific ephemeral usage

## 0.0.31

### Patch Changes

- Make "Install now" the first and default option in the install confirm prompt

## 0.0.29

### Patch Changes

- Generate eslint.config.mjs with a named const (eslintConfig) and default export it

## 0.0.27

### Patch Changes

- Exclude jsx-a11y from React Native (web-only): split framework install groups so jsx-a11y applies only to react/nextjs

## 0.0.25

### Patch Changes

- Add eslint-plugin-jsx-a11y recommended rules to pluginReact (a11y for JSX)

## 0.0.23

### Patch Changes

- Make all plugin factories resilient via safeRequire: missing plugins/peers degrade gracefully to no-op config instead of crashing eslint.config.mjs

## 0.0.21

### Patch Changes

- Redesign config exports as single flat-config objects (no spread needed). User config [eslintConfigNode, pluginReact(), ...] now valid without spreading.

## 0.0.19

### Patch Changes

- Dynamic typescript-eslint resolution: prefer meta-package, fall back to parser+plugin for legacy consumers

## 0.0.17

### Patch Changes

- Fix peer dep resolution for ESLint 8 compat: OR-range aware version resolution, prefer consumer installed major, install typescript-eslint meta-package

## 0.0.15

### Patch Changes

- 74411b5: Audit fixes: README spread example, add typescript-eslint peerDep, remove unused jsx-a11y, remove @deprecated from defineConfig, cleanup comments

## 0.0.13

### Patch Changes

- f741053: Make defineConfig a function to support defineConfig(eslintConfigNode) usage

## 0.0.11

### Patch Changes

- e426431: Fix defineConfig temporal dead zone - move declaration after eslintConfigNode

## 0.0.9

### Patch Changes

- 3705bf1: Fix nested array in base config - spread tseslint.configs.recommended

## 0.0.7

### Patch Changes

- 520ac8e: Fix ESLint 8.x compatibility - convert async config API to synchronous arrays
- 9bdb33a: Fix lazy plugin loading - prevent require() errors for unused plugins

## 0.0.4

### Patch Changes

- Fix module resolution by ensuring all peer dependencies are properly externalized in build. Previously eslint-plugin-autofix, eslint-plugin-prefer-arrow-functions, and globals were incorrectly bundled, causing ENOENT errors when accessing plugin internals.

## 0.0.3

### Patch Changes

- Fix module resolution errors by adding missing peer dependencies to build externals. Previously, eslint-plugin-autofix, eslint-plugin-prefer-arrow-functions, and globals were being bundled instead of treated as external dependencies.

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
