---
title: "Banner in the design system's moss green"
description: "The CLI banner gradient moves from the pink-purple scale to the moss green scale of design-system.jjuidev.com."
status: pending
priority: P3
effort: 1h
branch: main
tags: [ui, banner]
blockedBy: []
blocks: []
created: 2026-11-02
---

# Banner in the design system's moss green

## Outcome

The JSS banner above `--help` and `--version` on a terminal uses the moss green scale of the design
system instead of the pink-purple one, at every colour depth the banner supports.

## Input

> "Giờ màu của banner theo màu chính từ design system này (màu xanh rêu á), hiện tại tone tím là
> màu skin 2. `https://design-system.jjuidev.com/vi/home`" (user, 2026-11-02)

Read from the site's published CSS (`/assets/index-DKVhutbk.css`) and JS on 2026-11-02:

| Token | Moss green, skin `spring` ("Spring") | Pink-purple, `:root` default ("Autumn") |
| --- | --- | --- |
| `--color-primary-300` | `#a8d558` | `#e1a9d5` (in the banner today) |
| `--color-primary-400` | `#8abd2c` | `#cd89bc` (in the banner today) |
| `--color-primary-500` | `#5e8c04` | `#ab6496` (in the banner today) |

The site declares the skins as `[\`default\`, \`spring\`]`, with the default labelled "Autumn"
(pink-purple) and `spring` labelled "Spring" (moss green): the site's own order is the reverse of
the user's wording. The user's choice is unambiguous (moss green), so the banner takes the
`spring` scale, and the constants are named after the colour they hold, not "primary".

## Phases

| #   | Phase                                                      | Depends on |
| --- | ---------------------------------------------------------- | ---------- |
| 1   | [Recolour the banner](./phase-01-recolour-the-banner.md)   | none       |

## Acceptance

- Truecolor: the gradient runs `#a8d558` → `#8abd2c` → `#5e8c04`, shadow characters dimmed as today.
- 256 colours: the nearest xterm colours of that gradient (unchanged mapping code).
- 16 colours: a single green (`32`), dimmed for shadow characters, instead of magenta (`35`).
- `NO_COLOR` or a non-terminal: no escape code, as today.
- `docs/system-architecture.md` names the moss green scale and the 16-colour green.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- The spinner's magenta (`src/core/ui/animated-spinner.ui.ts`) and the help colours; the user named
  the banner only.
- The site under `docker/`.
