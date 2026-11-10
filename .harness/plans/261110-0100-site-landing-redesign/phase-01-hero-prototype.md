---
phase: 1
title: Hero prototype and the review gate
status: completed
---

# Phase 1: Hero prototype and the review gate

## Goal

The header and the hero of the brief, finished in both themes and both widths, so the direction can be
judged before the rest is built.

## Steps

1. Load `/ak-frontend-design`, `/ak-ui-ux-pro-max` and `/ak-ui-styling`. Read `plan.md`'s brief and keep
   it fixed. Read `references/aesthetic-recipes.md` and `references/taste-exemplars.md` of
   `/ak-frontend-design` before writing CSS.
2. Read the design system's token and text-role sources (`packages/styles/src/foundation/theme.css`,
   `colors.css`, `utilities/typography.css`) so every value you use is one that exists. Grep your diff
   for raw colours, `px`/`rem` literals and arbitrary `[...]` values before the review; each one is a
   finding unless the conventions name it.
3. Build the page frame (vertical hairlines at the `wrapper` edges, hairline under the header).
4. Header per the brief, including the `Install` button that scrolls to and focuses the install block.
5. Hero left: eyebrow with the version from the package facts, two-tone headline on `text-display-3xl`, one sentence, install block with copy and the platform label, quickstart link.
6. Hero right: the replay terminal. Tabs `init`, `doctor`, `harness` from the real transcripts; a line
   reveal at a readable pace; a replay control; tabs as a proper tablist (arrow keys, roving tabindex);
   reduced motion shows the finished transcript. Fixed height at `lg` so the layout never jumps between
   tabs; on mobile it follows the hero and scrolls inside if needed.
7. Screenshots: 1440 and 390, dark and light, first viewport only, mid-replay and finished; run
   `render-check.mjs` on the page.

## Stop

Prompt `planner` with the screenshot paths and the render-check output, then wait. Do not start phase 2
before planner approves.
