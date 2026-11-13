---
phase: 2
title: "Route, page and review"
status: done
---

# Phase 2: route, page and review

## Context

- The route table, the sidebar and the pager all read `DOCS_PAGES` in
  `site/src/constants/routes.constant.ts`; the router is `site/src/pages/Docs/Docs.route.ts`.
- The search index: `site/src/constants/search-index.constant.ts`.
- Page shape to copy: `site/src/pages/Docs/pages/Init/` (`DocPage`, `DocSection`, `RichText`,
  `CodeBlock`, `CopyButton`).

## Steps

1. Add `{ slug: 'nest', title: 'nest', summary: …, group: 'Presets' }` to `DOCS_PAGES` after
   `harness`, and the `nest` route in `Docs.route.ts`.
2. Build `site/src/pages/Docs/pages/Nest/Nest.tsx` from the phase 1 constants: tree and JSON in
   `CodeBlock`, the env table as a `<table>` like the presets table, curl lines with a copy button.
   Split the file before it passes 200 lines.
3. Add the page to the search index the way the other pages are.
4. Add `expect_status "$base/docs/nest" "200"` to `ci/smoke-site-image.sh`.
5. Tests: the page renders every section heading; the sidebar shows the `Presets` group; the init
   page links to `/docs/nest`. Follow the existing `*.test.tsx` beside each component.
6. Screenshots: desktop and 390px, every band, per `.harness/docs/site-screenshots.md`; check no
   horizontal overflow on the JSON and tree blocks.

## Validation

- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- `shellcheck ci/smoke-site-image.sh`

## Risk

A long JSON line overflows on a phone; the code block must scroll inside itself, not the page.
