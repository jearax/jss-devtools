---
phase: 2
title: Re-sync the site conventions with the stable design system
status: done
---

# Phase 2: Re-sync the site conventions with the stable design system

## Goal

`.harness/docs/site/conventions/` states the rules of the stable design system, adapted to the site, so
phase 3 polishes against the same rules the design system's own site follows.

## Source

The stable design system's `.harness/docs/`: `styling-conventions.md`, `component-conventions.md`,
`hooks-conventions.md`, `testing-conventions.md`, `site-traps.md`, and its decisions 0044 to 0053
(styles in CSS modules, semantic class names, props order, comments, one `@apply` per breakpoint, scrim,
no alpha in place of a semantic token, text sizes stop at `3xl`).

## Steps

1. Diff each site convention file against its stable counterpart. For each rule that changed, was added
   or was dropped, update the site file. Keep the site's own adaptations (site-only rules), and mark
   nothing as "TODO": write the rule or leave it out.
2. Rules phase 3 depends on, which must be present in `styling-conventions.md` afterwards: durations
   (`duration-150` hover, press, popups; `duration-200` backdrops; `duration-300` icon swaps), the
   `focus-ring` / `focus-ring-inset` utilities, touch targets (`pointer-coarse:h-11`, never reveal only on
   hover), the z-index layers, and states as tokens (`hover:bg-primary-hover`, `active:` the pressed
   token) rather than palette steps or alpha.
3. Check the site code against any new rule that a lint or test enforces in the design system (for
   example stylelint rules). Add the enforcement to the site's own config only when the design system
   enforces it the same way; otherwise the rule stays review-only, as it is there.
4. Update `.harness/docs/README.md` rows if a file is added or removed.

## Files

`.harness/docs/site/conventions/*.md`, `.harness/docs/README.md`, and `site/stylelint.config.mjs` or
`site/eslint.config.mjs` only for step 3.

## Done when

Every stable rule is either present in the site conventions or named in the report as deliberately not
adopted, with the reason. Site lint passes.
