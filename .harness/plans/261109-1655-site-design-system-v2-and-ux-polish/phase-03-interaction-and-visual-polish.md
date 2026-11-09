---
phase: 3
title: Interaction feedback and the visual defects
status: done
---

# Phase 3: Interaction feedback and the visual defects

## Goal

Every control answers hover, press and keyboard focus the same way, and the defects found when the site
was scouted on 2026-11-09 are gone. The bar is the user's: bold, product-grade landing pages
(harness.io, agentkit.best, claude.com/product/claude-code, herdr.dev), not a documentation page.

Load `/ak-frontend-design` and `/ak-ui-ux-pro-max` before designing, and use the stable design system's
own site (`apps/site` in the design system repository, its "interaction feedback" commit 4722350) as the
reference implementation. The site conventions from phase 2 win where advice conflicts.

## Interaction contract (applies to every control)

| State          | Rule                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Hover          | A visible change through a semantic state token (`hover:bg-hover`, `hover:bg-primary-hover`, border or text token). Never hover-only reveal. |
| Press          | `active:` gives the pressed token, or a small scale/translate press on buttons and cards. Measured, not invisible. |
| Focus-visible  | `focus-ring` (or `focus-ring-inset` on inputs). Every link, button, card and palette item, including the logo link and skip link. |
| Timing         | `transition` on the changed properties, `duration-150`; icon swaps `duration-300`. No `transition: all`. |
| Reduced motion | Translate and scale effects off under `motion-reduce`; colour changes stay.                                |
| Touch          | Controls under 44px get `pointer-coarse:h-11`/`size-11`; keyboard hints are `pointer-coarse:hidden`.      |

Scouting measured `transition-duration: 0s` on the skip link and the header logo link, and a generic
Tailwind colour transition with no press state on the rest. Feature cards lift on hover; nothing has a
press state except the primary button.

## Defects found by scouting (fix each, screenshot each)

Home:

1. The hero terminal is a fixed-height window with two lines of content: about 250px of empty body on
   desktop and more on mobile. Size it to its content, or fill it with the real `init` flow the CLI
   prints, so the hero shows what the tool does.
2. The terminal's tabs read `~`, `~`, `~/projects/my-app`: two tabs with the same label, and the
   selected one is barely marked. Each tab needs a distinct label and a clear selected, hover and focus
   state.
3. The copy button sits at the far right, not aligned with the command line it copies.
4. The hero subtitle has forced line breaks, so at 390px it wraps raggedly ("check / that it works").
   Let it wrap naturally with a max width (`text-balance` or `max-w-*ch`).
5. The large "J" watermark floats off the right edge of the hero and competes with the headline.
   Integrate it into the composition or remove it; state the choice.
6. The feature cards' "Read the … docs →" arrow does not move with the card hover; the whole card is the
   link, so the arrow should answer it.
7. The page ends at an isolated "Getting started" button: there is no footer on home or docs. Add a
   footer (product name, GitHub, docs links, licence) and give the closing call to action a section of
   its own.

Docs:

8. The sidebar indents inconsistently: "Getting started", "Install" and "Reference" sit at one depth,
   the command pages deeper. Group headings and items need one rhythm.
9. The active sidebar item is a bordered box, heavier than anything else on the page. Use the design
   system's selected-item pattern (background token and a marker), with hover distinct from active.
10. Inline `code` has padding but no surface, so it reads as stray spaces ("Node.js,  git  and"). Give it
    the design system's inline-code surface.
11. The table of commands and the pager are unstyled beyond borders; give the table header and rows,
    and the pager, hover and focus states, and show "Previous" when there is one.

Global:

12. The search trigger, theme toggle and GitHub link need matching hover and press states; the
    header's border turning teal on scroll must not be confused with a focus state (check it is the
    scroll progress, and keep it if so).
13. Dark mode and mobile get the same pass: every item above is checked in both.

## Steps

1. Apply the interaction contract component by component, starting with the shared ones
   (`site/src/components/*`), then the pages.
2. Fix defects 1–13. Where a fix changes layout, keep the copy.
3. Add or update component tests for any behaviour change (for example the pager's "Previous", the
   tab selection), in the site's Vitest browser mode.
4. Take the final screenshots after the last change: home and `/docs/getting-started` at 1440 and 390,
   light and dark, plus hover, press and focus-visible captures of a button, a card, a sidebar item and
   a palette item. A screenshot older than a fix is a review finding.

## Files

`site/src/**` components, pages and their `styles.module.css`, tests next to them.

## Done when

The checklist is fixed, the interaction contract holds on every control (show the computed
`transition-duration` is not `0s` on interactive elements), the site's four checks pass, and the
screenshots prove it.
