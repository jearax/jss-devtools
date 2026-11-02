---
phase: 1
title: "Recolour the banner"
status: pending
priority: P3
effort: "1h"
dependencies: []
---

# Phase 1: Recolour the banner

## Input

> "Giờ màu của banner theo màu chính từ design system này (màu xanh rêu á), hiện tại tone tím là
> màu skin 2. `https://design-system.jjuidev.com/vi/home`" (user, 2026-11-02)

Read from the site's published CSS (`/assets/index-DKVhutbk.css`) and JS on 2026-11-02:

| Token                 | Moss green, skin `spring` ("Spring") | Pink-purple, `:root` default ("Autumn") |
| --------------------- | ------------------------------------ | --------------------------------------- |
| `--color-primary-300` | `#a8d558`                            | `#e1a9d5` (in the banner today)         |
| `--color-primary-400` | `#8abd2c`                            | `#cd89bc` (in the banner today)         |
| `--color-primary-500` | `#5e8c04`                            | `#ab6496` (in the banner today)         |

The site declares its skins as `default` ("Autumn", pink-purple) and `spring` ("Spring", moss
green), the reverse of the user's wording. The user's choice is unambiguous, so the banner takes
the `spring` scale, and the constants are named after the colour they hold, not "primary".

## Acceptance

- Truecolor: the gradient runs `#a8d558` → `#8abd2c` → `#5e8c04`, shadow characters dimmed as today.
- 256 colours: the nearest xterm colours of that gradient (mapping code unchanged).
- 16 colours: a single green (`32`), dimmed for shadow characters, instead of magenta (`35`).
- `NO_COLOR` or a non-terminal: no escape code, as today.

## Files

- `src/core/constants/banner.constant.ts`: replace `DS_PRIMARY_300/400/500` with the moss green
  values, named after the colour (for example `DS_MOSS_300/400/500`); no constant keeps the
  pink-purple values.
- `src/core/ui/banner.ui.ts`: import the new names; the 16-colour code becomes `32`.
- `tests/banner.test.ts`: the truecolor end stops become `38;2;168;213;88` and `38;2;94;140;4;2`
  (the last column is a shadow character, as today); the 16-colour case expects `32` and `32;2`.
- `docs/system-architecture.md`: the banner paragraph says moss green and "a single green".

## Steps

1. Change the constants and the 16-colour code.
2. `pnpm vitest run tests/banner.test.ts`, updating the expected codes only.
3. Update the docs paragraph.
4. Full gate, then look at the real banner in a truecolor terminal (`node dist/cli.mjs --version`)
   and say what you saw.

## Risk and rollback

Colours only; revert the commit.
