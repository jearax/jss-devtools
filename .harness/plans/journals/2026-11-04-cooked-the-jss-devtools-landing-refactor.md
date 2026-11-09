---
title: Cooked the jss-devtools landing refactor
date: 2026-11-04
summary: "The site became four tiered bands with a hero terminal, a sticky responsive header, and a Cmd+K docs palette with an active table of contents."
---

# Cooked the jss-devtools landing refactor

## What happened

The `site/` subproject was restructured into a four-band landing page (hero with the install
command in a terminal, badge strip + three feature cards, getting-started block, footer), a
sticky responsive header that raises its surface once the page scrolls, and a docs route with a
Cmd+K search palette over the six docs pages and their 33 sections. The existing "On this page"
aside was upgraded in place with an active-heading highlight rather than replaced by a second TOC.

Five things cost more time than the plan expected.

**The packaged design system does not ship `ButtonCopy` or `Popover`.** The plan wrote both into
the package's public API, but the tarball the site installs exports only `Button, Logo,
SkinToggle, ThemeToggle, useTheme, parsePreferences, defineSkin, PLATFORM_SKINS, ThemeProvider,
cn, tv`. The site does not reimplement design-system components, so the copy affordance became a
site component (`CopyButton`) built on the package's own `Button` with lucide's `Copy`/`Check` —
the same pattern Phase 1's `SearchTrigger` already used.

**A live region that is always mounted still takes room.** Base UI's guidance is to keep the
announcement element in the DOM so the announcement is reliable. The empty state followed that and
kept `py-10`, so the palette showed an ~80 px gap above "PAGES" whenever it had results. The fix
was `empty:p-0`: the element stays mounted and only takes up space when it has something to say.

**Two test files that copy at the same time fight over the clipboard.** The browser's clipboard
belongs to the browser, not to the test file, so the parallel copies overwrote each other's value
and the run failed with `NotAllowedError: Document is not focused`. The fix is
`fileParallelism: false` in `site/vitest.config.ts` — the files run one after the other, and the
suite time did not change.

**The lazy route breaks the browser's own anchor jump.** `Docs` is a lazy route, so the browser
jumps before the section exists; the section then lands wherever the layout settles. The
`ScrollToHash` effect waits for the target with a `MutationObserver`, jumps once, and jumps again
after `document.fonts.ready` — but only if the reader has not scrolled in the meantime, so a
reader who takes over the scroll is not fought. A mid-page section now lands at exactly 96 px,
under the sticky header.

**Base UI's `Dialog` does not set `aria-modal`, and `Autocomplete` omits `aria-selected`.** Both
had to be supplied by hand: `aria-modal="true"` on the popup, and `aria-selected` through the
item's render prop from `state.highlighted`.

## Decisions

- **The skin stays.** Phase 1 said "refresh the skin", but the accepted direction was "the skin
  stays". The approved teal brand and graphite surfaces were kept; the inherited olive
  `secondary` was replaced with a slate companion. `jds skin check --separation` is green in both
  themes (light 0.070, dark 0.082).
- **The search index holds metadata only.** Each docs page got a `<Page>.constant.ts` exporting
  `SECTIONS` as `{ id, title }`; the page consumes `meta('the-id')` from its own constant and the
  index imports only the light constants, so the home route still ships no docs JSX.
- **The trigger and the palette talk over a `window` custom event**, not React context, so the
  header does not have to know what the palette is.

## What is not done

`main` was never moved and nothing was pushed. All four phases sit as commits on
`refactor/site-landing`; merging and pushing are the owner's decision, and pushing `main`
deploys production through the Dokploy webhook. The verification report lives in the
design-system repo at `agentkit/plans/reports/verification-261104-2303-jss-devtools-landing.md`.

## Next steps

The owner reviews the branch and decides on merge and push.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
