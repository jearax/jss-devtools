---
title: "The site docs give the nest preset its own page"
description: "Move the nest preset out of the init page into a docs page of its own, written from templates/nest and its e2e output, with a test that keeps the env table equal to the template."
status: done
priority: P2
effort: 1d
branch: main
tags: [site, docs]
blockedBy: []
blocks: []
created: 2026-11-13
---

# The site docs give the nest preset its own page

## Overview

The init page carries the nest preset as three paragraphs. The preset now has a response
envelope, a locale order, Terminus health, and an env file contract that the site does not show.
The user chose a page of its own over a longer init section, so the next preset (`react`, `next`)
adds a page instead of growing init.

- Policy for the app being documented: [0047](../../decisions/0047-init-nest-preset.md),
  [0049](../../decisions/0049-nest-response-envelope.md).
- Site rules: [0042](../../decisions/0042-site-ui-stays-inside-the-design-system.md)
  (every value from the design system), [0043](../../decisions/0043-conditional-rendering-in-jsx.md) (JSX conditionals),
  [site traps](../../docs/site-traps.md), [screenshots](../../docs/site-screenshots.md).
- Source of truth: `templates/nest/`. Every fact on the page is read from a file there or from its
  e2e output, never written from memory.

## Contract

- **Outcome:** `/docs/nest` is a docs page, listed in the sidebar under a `Presets` group, reached
  by the pager and the search index. The init page's nest section shrinks to one paragraph and a
  link to it.
- **Constraints:** the site's own conventions and design system; no new dependency; a push to
  `main` deploys, so nothing is pushed by the cooker.
- **Non-goals:** pages for presets that do not exist; changes to the CLI or `templates/nest/`;
  the home page.
- **Acceptance:**
  1. The page shows: what init writes (the `src/` tree), the environment table and the env file
     order, the three response examples, the locale order with curl commands, the health route,
     the scripts, and the monorepo layout.
  2. A test in the CLI suite fails when a variable name or default in the site's env table differs
     from `templates/nest/.env.example`.
  3. `ci/smoke-site-image.sh` expects `/docs/nest` to answer 200.
  4. The site sequence passes: `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`;
     the CLI sequence passes: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
  5. Screenshots of every band at desktop and phone width, reviewed per the screenshot doc.

## Phases

| #   | Phase                                                   | Status  |
| --- | ------------------------------------------------------- | ------- |
| 1   | [Content and the drift test](./phase-01-content.md)    | Done |
| 2   | [Route, page and review](./phase-02-page.md)            | Done |

## Extension trace

The next preset (`react`) would add `templates/react/`, one `DOCS_PAGES` entry in the `Presets`
group and one page folder. Stable: the route table, the group, the drift test's shape (one
template's example file against one page's table). Changes: only the new page and its constants.
Phase 2's sidebar test proves a group with one page renders; nothing generic is built for a
second preset that does not exist.
