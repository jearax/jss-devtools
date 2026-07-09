# jss-devtools

> Dev-tools CLI for the JavaScript stack — scaffolds ESLint 8.x + Prettier + Husky + lint-staged + TS alias imports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/node/v/jss-devtools.svg)](https://www.npmjs.com/package/jss-devtools)

## Requirements

- **Node.js** >= 22
- **ESLint** 8.x only (v0.x line - ESLint 9.x support planned for v1.0)

## Peer Dependencies

This package requires ESLint 8.x and related plugins as peer dependencies. These will be installed automatically when you run `jss-devtools init`:

```json
{
  "devDependencies": {
    "eslint": "^8.57.1",
    "typescript-eslint": "^6.21.0",
    "@eslint/js": "^8.57.1",
    "eslint-plugin-import": "^2.32.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.9.4"
  }
}
```

## Quick start

```bash
npm install --save-dev jss-devtools
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
import { eslintConfigNode, pluginReact } from 'jss-devtools'

export default [
  eslintConfigNode,
  pluginReact()
]
```

Framework plugins: `pluginReact()` (React/RN), `pluginNext()` (Next.js), `pluginTailwind()`, `pluginStorybook()`.

## Documentation

- [init command flow](./docs/init-command-flow.md)

## License

[MIT](./LICENSE) © 2026 jjuidev
