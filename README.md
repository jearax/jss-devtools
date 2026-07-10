# jss-devtools

> Dev-tools CLI for the JavaScript stack — scaffolds ESLint 8.x + Prettier + Husky + lint-staged + TS alias imports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/jss-devtools.svg)](https://www.npmjs.com/package/jss-devtools)

## Versioning

| Line | ESLint focus |
|------|--------------|
| **v1.x** (this) | ESLint `^8.0.0` |
| v2.x (planned) | ESLint `^9.0.0` and above |

## Requirements

- **Node.js** >= 22
- **ESLint** 8.x (v1.x line). ESLint 9.x → use the future v2.x.

## Quick start

Install `jss-devtools` as a devDependency, then run `init` via your package manager's executor (npx/dlx/bunx). Pin a major to stay on the ESLint 8.x line.

```bash
# 1. install
npm install -D jss-devtools        # yarn: yarn add -D jss-devtools
                                  # pnpm: pnpm add -D jss-devtools
                                  # bun:  bun add -d jss-devtools

# 2. init — pick the executor for your PM
npx jss-devtools init             # npm
yarn dlx jss-devtools init        # yarn
pnpm dlx jss-devtools init        # pnpm
bunx jss-devtools init            # bun
```

Pin a major:

```bash
npx jss-devtools@0 init           # latest 0.0.x (ESLint 8.x edition)
```

`init` auto-detects your package manager and installs ESLint 8.x + the matching plugins as devDependencies. Cross-platform (Windows/macOS/Linux).

## Commands

| Command | Description |
| ------- | ----------- |
| `jss-devtools init` | Initialize a project with dev tools |
| `jss-devtools --help` | Show help |

### `init`

Sets up: framework-aware ESLint 8.x config, Prettier, Husky git hooks, lint-staged, TypeScript `@/*` alias imports.

```bash
# Interactive (default)
npx jss-devtools init

# Non-interactive — pick what you need
npx jss-devtools init -y
npx jss-devtools init --framework react --tailwind --aliasImport
```

**Flags**

| Flag | Description |
| ---- | ----------- |
| `-y`, `--yes` | Use defaults (non-interactive) |
| `--framework` | `node` \| `react` \| `react-native` \| `nextjs` |
| `--tailwind` | Enable Tailwind CSS |
| `--storybook` | Enable Storybook |
| `--aliasImport` | Enable `@/*` alias imports |

## Smart detection

`init` is safe to re-run (idempotent) and respects existing setup:

- **Linter** — ESLint detected → silent. Biome/Oxlint → warn + confirm.
- **Package conflicts** — same-major → silent skip. Different-major → overwrite / skip / cancel.
- **Configs** — existing `eslint.config.mjs` / `.prettierrc.json` → silent overwrite; other formats → prompt.
- **Alias** — `@/*` already configured → silent. Missing `tsconfig.json` → auto-created.
- **Offline** — warns when npm registry is unreachable, falls back to declared ranges.

## Generated ESLint config

Composes ready-made configs via `defineConfig`:

```javascript
import { defineConfig, eslintConfigNode, pluginReact } from 'jss-devtools'

const eslintConfig = defineConfig(
  eslintConfigNode,
  pluginReact()
)

export default eslintConfig
```

Exports: `defineConfig(...configs)` (composer, flattens to a flat-config array), `eslintConfigNode` (base), `pluginReact()` (React/RN), `pluginNext()` (Next.js), `pluginTailwind()`, `pluginStorybook()`. Optional plugins degrade gracefully if a peer dep is missing.

## Documentation

- [init command flow](./docs/init-command-flow.md)

## License

[MIT](./LICENSE) © 2026 jjuidev



