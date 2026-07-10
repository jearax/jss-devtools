# jss-devtools

> One-shot scaffolding CLI for the JavaScript stack — generates ESLint 8.x + Prettier + Husky + lint-staged + TS alias imports. Run via npx/dlx/bunx, no install required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm version](https://img.shields.io/npm/v/jss-devtools.svg)](https://www.npmjs.com/package/jss-devtools)

## Requirements

- **Node.js** >= 22
- **ESLint** 8.x only (ESLint 9.x support planned for v1.0)

## Quick start

Run once in your project — no install needed. Pick the command for your package manager:

```bash
# npm
npx jss-devtools@latest init

# yarn
yarn dlx jss-devtools@latest init

# pnpm
pnpm dlx jss-devtools@latest init

# bun
bunx jss-devtools@latest init
```

Pin a major to stay on the ESLint 8.x line:

```bash
npx jss-devtools@0 init      # latest 0.0.x (ESLint 8.x edition)
```

`init` auto-detects your package manager and installs ESLint 8.x + the matching plugins as devDependencies. The generated `eslint.config.mjs` is **self-contained** — it does not import `jss-devtools`, so the CLI isn't needed after scaffolding.

Cross-platform (Windows/macOS/Linux).

## Commands

| Command | Description |
| ------- | ----------- |
| `jss-devtools init` | Initialize a project with dev tools |
| `jss-devtools --help` | Show help |

### `init`

Sets up: framework-aware ESLint 8.x config, Prettier, Husky git hooks, lint-staged, TypeScript `@/*` alias imports.

```bash
# Interactive (default)
npx jss-devtools@latest init

# Non-interactive — pick what you need
npx jss-devtools@latest init -y
npx jss-devtools@latest init --framework react --tailwind --aliasImport
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

The generated `eslint.config.mjs` is self-contained — plugins are required directly from your installed devDependencies (no `jss-devtools` import):

```javascript
import { createRequire } from 'node:module'
import js from '@eslint/js'
import globals from 'globals'

const require = createRequire(import.meta.url)
const safeRequire = (m) => { try { return require(m) } catch { return null } }

const eslintConfig = [
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    plugins: { import: safeRequire('eslint-plugin-import'), /* ... */ },
    rules: { /* ... */ }
  }
]

export default eslintConfig
```

Optional plugins (Tailwind, Storybook, Next) degrade gracefully via `safeRequire` if a peer dep is missing.

## Documentation

- [init command flow](./docs/init-command-flow.md)

## License

[MIT](./LICENSE) © 2026 jjuidev

