---
title: Cooked the DS core export of the Logo
date: 2026-11-03
summary: "The brand mark component came back to the design system's core branch, is exported from the package, and the site header shows the wordmark next to the theme toggle."
---

# Cooked the DS core export of the Logo

## What happened

The `Logo` component was restored on the design system's `core` branch, exported from
`src/lib/index.ts`, pushed as `e8ec537`, packed into `jjuidev-design-system-0.1.0.tgz` and vendored
into the site. The site's header renders the mark on the left and the theme toggle on the right.

Three things cost more time than the plan expected.

**A vendored tarball that changes under the same version leaves Vite's dep optimizer holding a stale
pre-bundle.** The site's dev server on port 5173 kept serving
`/node_modules/.vite/deps/@jjuidev_design-system.js?v=a55732d5`, a bundle from before the swap, so
the page came up blank with `Uncaught SyntaxError: The requested module ... does not provide an
export named 'Logo'`. Vite keys the optimizer on the lockfile hash and only re-checks it when the
server starts, so a `file:` dependency whose bytes changed under the same version leaves the
pre-bundle stale. The plan forbids touching the user's dev server, so the browser check ran against
the production build, served on a second port from the built `site/dist`. The user later allowed an
in-place restart, and `touch site/vite.config.ts` was enough: the server restarted inside the same
process and re-optimized.

**The component carried two comments that the `core` branch cannot support.** `Logo.constant.ts`
opened with "The SVG masters in scripts/brand-icons are drawn from these numbers", and
`scripts/brand-icons` does not exist on `core`; it now states the geometry instead. The stylesheet
opened with "Raw palette steps for the mark: brand art is the one place they are allowed", which
asserts a rule the repository states nowhere: `core`'s design-token conventions only say that a raw
Tailwind color in a component "needs a reason in review", and that brand art such as a wordmark may
use plain Tailwind classes for a text role. The comment now states the reason the mark reads the
palette steps.

**The built stylesheet carries no class name that says "Logo".** The CSS module hash is
`_1x7zg`, so the packaged `styles.css` and `components.css` hold `_root_1x7zg_2`, `_mark_1x7zg_2`
and the rest. Grepping the tarball for "Logo" finds nothing and reads like the component did not
ship; grepping for the hash shows it did. The `48rem` collapse rule survives minification as
`@media not all and (width>=48rem)`.

## Decisions

- Decision `0007` on `core` was amended in place rather than a new decision record written. The
  bullet that said "The package ships no brand assets" now says "The package ships the brand mark
  component and no other brand asset". The repository records amendments inside the decision it
  amends: `0007` and `0003` both carry dated amendments in place, and the library-only cut of
  `core` itself lives in the `CHANGELOG`, not in a decision.
- The `Logo` gets no `aria-label` in the site. Its name in context is the wordmark text, and the
  site test checks that the wordmark is rendered and visible rather than repeating the name in an
  attribute.
- The consumer e2e asserts that the mark renders and keeps its wordmark. The geometry, the dot
  scaling and the collapse below `md` stay in the component's own Vitest test, which already
  covers them; the e2e only has to prove the export reaches a consumer through the tarball.
- The site's `SiteHeader` passes `expanded` and lets the component's own media query collapse it
  below `48rem`. The site does not add a breakpoint of its own for the wordmark.

## Next steps

- The dev server on port 5173 needed a restart to pick up the new tarball, and the user allowed it:
  `touch site/vite.config.ts` restarts the Vite server inside the same process, on the same port.
  It logged "Re-optimizing dependencies because lockfile has changed" and serves the site again.
- The copy button is still out of `core`, so the install block still shows the command only.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
