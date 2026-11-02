---
phase: 1
title: "Recolour the banner"
status: pending
priority: P3
effort: "1h"
dependencies: []
---

# Phase 1: Recolour the banner

## Files

- `src/core/constants/banner.constant.ts`: replace `DS_PRIMARY_300/400/500` with the moss green
  values `#a8d558`, `#8abd2c`, `#5e8c04`, named after the colour (for example
  `DS_MOSS_300/400/500`); no constant keeps the pink-purple values.
- `src/core/ui/banner.ui.ts`: import the new names; the 16-colour code becomes `32`.
- `tests/banner.test.ts`: the truecolor end stops become `38;2;168;213;88` and
  `38;2;94;140;4;2` (the last column is a shadow character, as today); the 16-colour case expects
  `32` and `32;2`.
- `docs/system-architecture.md`: the banner paragraph says moss green and "a single green".

## Steps

1. Change the constants and the 16-colour code.
2. `pnpm vitest run tests/banner.test.ts`, updating the expected codes only.
3. Update the docs paragraph.
4. Full gate, then one look at the real banner in a truecolor terminal:
   `node dist/cli.mjs --version` (paste the raw escape sequences of the first line with
   `| cat -v` run through `script` or a TTY, or describe what you saw).

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Risk and rollback

Colours only; revert the commit.
