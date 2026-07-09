# @jearax/jss-devtools

> Dev-tools CLI for the JavaScript stack — scaffolds ESLint 8.x + Prettier + Husky + lint-staged + TS alias imports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@jearax/jss-devtools.svg)](https://www.npmjs.com/package/@jearax/jss-devtools)

## Requirements

- **Node.js** >= 22
- **ESLint** 8.x only (v0.x line; ESLint 9.x support comes later)

## Quick start

```bash
npm install --save-dev @jearax/jss-devtools
npx jss-devtools init
```

Supports `npm`, `yarn`, `pnpm`, `bun` (auto-detected). Cross-platform (Windows/macOS/Linux).

## Commands

| Command | Description |
| ------- | ----------- |
| `jss-devtools init` | Initialize a project with dev tools |
| `jss-devtools --help` | Show help |

### `init`

Sets up: framework-aware ESLint 8.x config, Prettier, Husky git hooks, lint-staged, TypeScript `@/*` alias imports.

```bash
# Interactive (default)
jss-devtools init

# Non-interactive — pick what you need
jss-devtools init -y
jss-devtools init --framework react --tailwind --aliasImport
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

```javascript
import { defineConfig, eslintConfigNode, pluginReact } from '@jearax/jss-devtools'

const eslintConfig = defineConfig(eslintConfigNode, pluginReact())

export default eslintConfig
```

Framework plugins: `pluginReact()` (React/RN), `pluginNext()` (Next.js), `pluginTailwind()`, `pluginStorybook()`.

## Documentation

- [init command flow](./docs/init-command-flow.md)

## License

[MIT](./LICENSE) © 2026 jearax
