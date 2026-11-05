---
title: "jss-devtools landing revision round 3 — slim chrome, triangle hero, back-to-top"
date: 2026-11-05
summary: "Round 3 of the landing refactor applied the owner's 7-point review on refactor/site-landing; gate green, branch left for owner review."
---

# jss-devtools landing revision round 3 — slim chrome, triangle hero, back-to-top

## What happened

Executed `agentkit/plans/261105-0149-landing-revision-round3` (design-system repo) against `site/` on `refactor/site-landing`. Two feature commits, none pushed:

- `05f5932` feat(site): strip the header nav, one-line footer and back-to-top — the header keeps brand + search + a GitHub icon anchor + theme toggle; the mobile menu panel, its state and `NAV_ITEMS` are gone, and the search trigger now serves every width (label and Cmd+K hint fold away below `lg` through its own stylesheet). `lucide-react` v1 dropped brand icons, so the GitHub mark is the octicon path (MIT) inlined in `SiteHeader`. Footer collapses to one space-between line ("Built by jjuidev" + source link + license), `FOOTER_COLUMNS`/`footer.constant.ts` deleted, `LICENSE` keeps exactly one visible home. New `BackToTop` in the layout: appears past one viewport of scroll, unmounts at top, hides within half a viewport of the bottom so it never covers the footer fine print; smooth scroll suppressed under prefers-reduced-motion; 44px target.
- `1a2c3f8` feat(site): triangle hero heading and getting-started rework — the headline stacks as a centered inverted triangle after react-hook-form.com (widest clause first, muted clause under it, value line capped as the narrowest centered reading column); one `h1` with two block spans, `titleMuted` meaning kept. GettingStarted drops eyebrow + old title and opens on a large fluid heading, taking the docs on-ramp job. Reference loses "Where the truth lives"; `REFERENCE_LINKS` and the section entry go with it (the search index derives from `SECTIONS`, so it self-updates).

Verification: full gate green (lint, tsc, 21 files / 95 tests, build). All 7 owner decisions walked on the running site at 1440/768/390 in both themes; back-to-top verified visible mid-scroll, hidden at top and near the footer, click returns to top; palette opens via Cmd+K and returns nothing for the removed section. Report: design-system `agentkit/plans/reports/verification-261105-0900-jss-devtools-landing-round3.md`, 10 screenshots alongside.

## Decision

- The GitHub mark is an inline octicon SVG rather than any icon package: lucide-react 1.x removed brand icons, and adding a dependency for one path is not a trade worth making.
- `BackToTop` uses a rAF-throttled scroll listener rather than a sentinel observer: a sentinel at one-viewport depth would need layout cooperation, and the listener also carries the near-bottom suppression that keeps the button off the footer fine print.
- The mobile menu panel was removed entirely rather than kept as a search-only shell: with the nav gone, the bar's icon-only search trigger covers the narrow viewport, verified reachable at 390.

## Next steps

- Owner reviews the branch with the round-1/2/3 reports side by side; merge/push (which deploys) is the owner's call; the "really real" hero visual redesign is planned separately.
- Pre-existing, unchanged: `SearchPalette` renders a `role="status"` div inside a `<p>` (HTML validity + hydration warning); flagged for scheduling.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
