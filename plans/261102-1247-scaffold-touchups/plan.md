---
title: "Scaffold touch-ups: moss green banner and fuller ignore files"
description: "Two small user requests in one plan: the CLI banner in the design system's moss green, and .gitignore / .prettierignore that cover the common Node.js cases."
status: pending
priority: P3
effort: 3h
branch: main
tags: [ui, banner, init, scaffold]
blockedBy: []
blocks: []
created: 2026-11-02
---

# Scaffold touch-ups: moss green banner and fuller ignore files

## Outcome

1. The JSS banner above `--help` and `--version` uses the design system's moss green scale at every
   colour depth.
2. The `.gitignore` and `.prettierignore` that `jss-devtools init` writes cover the common cases of
   the Node.js ecosystem, as broad and as plain as the lint glob, without speculative entries.

The user gathered small issues into one plan: "Tôi còn update 1 số issue nhỏ, nên lên cùng 1 plan."
(user, 2026-11-02). The plan is written now and handed to a cooker only when the user says so:
"Lên plan thôi, chưa giao" (user, 2026-11-02).

## Phases

| #   | Phase                                                    | Depends on |
| --- | -------------------------------------------------------- | ---------- |
| 1   | [Recolour the banner](./phase-01-recolour-the-banner.md) | none       |
| 2   | [Fuller ignore files](./phase-02-fuller-ignore-files.md) | none       |

The phases touch different files and can run in either order.

## Acceptance

- Every phase's Acceptance holds.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- The spinner's magenta and the help colours; the user named the banner only.
- The site under `docker/`.
- Ignore entries for a specific framework the scaffold does not create, beyond the one-line build
  and cache folders listed in phase 2.
