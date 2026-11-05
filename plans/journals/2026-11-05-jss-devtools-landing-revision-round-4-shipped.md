---
title: jss-devtools landing revision round 4 shipped
date: 2026-11-05
summary: "Round 4 on refactor/site-landing (819c033): footer and GettingStarted section deleted, hero CTA button, cards became single links, BackToTop reference behavior, ScrollProgress ported; Button link composition traded for a recipe-carried Link."
---

# jss-devtools landing revision round 4 shipped

## What happened
Plan 261105-0244 landed in the jss-devtools site on `refactor/site-landing`, commit `819c033`, nothing pushed. `SiteFooter` and the whole `GettingStarted` section are gone (components, styles, tests, `GETTING_STARTED_STEPS`), so `Home` now reads Hero → "The commands" and the page ends at the last section. A centered "Getting started" link sits under the hero terminal, `FEATURES` cards became single router `Link`s with the docs affordance demoted to a `<span>`, `BackToTop` was ported to the design-system reference behavior (always mounted, `data-visible` fade/slide once `scrollY > innerHeight`, the near-bottom auto-hide deleted as the reported misbehavior), and a new `ScrollProgress` bar mounts inside `SiteHeader` — rAF-coalesced writes to `--scroll-progress`, `scaleX` on the compositor, `ResizeObserver` for page growth, hidden when the page cannot scroll. The hero triangle is now real narrowing: `VALUE_LINE` split into `VALUE_LINES` of 49/44/24 characters with per-line `max-width` steps, and the silhouette holds at 1440/768/390 in both themes.

## Decision
The CTA was planned as a design-system `Button` composed as a link, but the vendored package 0.1.0 has no link composition — `render`/`asChild` is not in `ButtonProps`, and TypeScript rejects the prop (TS2322). The trade-off: hand-styling a lookalike would fork the component's look, and passing `render` through a cast would depend on Base UI runtime behavior the package does not promise. The site therefore renders a router `Link` that carries the package's own solid/lg button recipe utility by utility (`bg-primary`, `h-12 px-6 text-label-lg`, `focus-ring`), keeping the look sourced from the package without authoring a token or a component; when the design-system `Button` grows official `render`/`asChild` support, the site drops `.ctaButton` and switches in one place. Two smaller calls: the card's accessible name is `Read the <name> docs` (a prefix of the visible affordance text) so screen readers announce a short label instead of the whole card, and `ScrollProgress` keeps its handlers inside `useEffect` to satisfy exhaustive-deps where the reference used `useEffectEvent` and `@mantine/hooks`.

## Next steps
Owner reviews the branch; merge and push remain the owner's call. Adding `render`/`asChild` link composition to the design-system `Button` is the follow-up that lets the site retire the recipe-carried link.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
