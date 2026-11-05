---
title: "Landing revision round 5: docs pager and button placement"
date: 2026-11-05
summary: Strengthened the docs pager and moved the getting started button below the commands section on refactor/site-landing
---

# Landing revision round 5: docs pager and button placement

## What happened
- Round 5 of the landing revisions on `refactor/site-landing`, per `design-system/agentkit/plans/261105-0312-landing-revision-round5/`.
- Pager (`site/src/pages/Docs/components/Pager/`): lucide `ArrowLeft`/`ArrowRight` (aria-hidden, 14px) at the two outer edges of the direction labels, title stepped `text-lg` -> `text-xl`, top padding `pt-6` -> `pt-8`, label-title gap `gap-1` -> `gap-2`, and on `<768px` the two links stack full-width with a `max-md:divide-y` hairline and no corner radius. The owner edited `.root` live mid-cook to a desktop `flex justify-between` row (previous left, next right); kept, with `max-md:flex-col` restored for the stack. Hover now also lifts the direction label muted -> default alongside title -> primary.
- New `Pager.test.tsx` (browser mode): renders at `/docs/doctor`, asserts links named "Previous init"/"Next harness" with the right hrefs and two `svg[aria-hidden="true"]` arrows.
- Button relocation: the getting started button left `Hero` (markup + `.cta`/`.ctaButton` styles removed) and now closes `Home`, centered under FeatureRow (`Home/styles.module.css` owns the recipe). `Hero.test.tsx` asserts the hero offers no docs link (`a[href="/docs/getting-started"]` null, the repo's absence pattern - `queryByRole` does not exist on vitest-browser-react `RenderResult`); `Home.test.tsx` renamed to "offers the way into the docs after the commands".
- Decision 2 (card hover ease) was already delivered by round 4 in 819c033; the plan predated that commit by ~2 minutes and the owner likely tested a stale build. Verified computed `transition-property: transform, border-color, background-color` / `0.15s` on the card. No code change.
- Eye-checked via the site dev server on :5174 at 1440/768/390, light and dark: pager row at 1440/768 (`max-md` is `< 48rem`, so exactly 768 keeps the row), stacked hairline divider at 390, "Getting started" title never renders in the pager (first page has no previous), longest real title "Reference" fits one line at 390, home ends Hero -> commands -> centered button. Screenshots in `design-system/agentkit/plans/reports/cook-261105-1038-*`.

## Decision
- One owner for the button markup: `Home` (the page), not FeatureRow (the section stays purely "The commands").
- Adopted the owner's live `justify-between` row edit as the desktop shape instead of my original stacked-leaning column; mobile stacking is enforced by `max-md:flex-col`.
- `max-md:rounded-none` on the links: without it the divider hairline followed the 6px corner radius and hooked at its ends.

## Next steps
- Owner review of 2056701 (nothing pushed). Tailwind's divide-y in v4 puts the border-bottom on all-but-last child - if the pager ever gains three children the divider pattern needs revisiting.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
