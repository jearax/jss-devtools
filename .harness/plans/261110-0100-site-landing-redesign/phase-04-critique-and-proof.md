---
phase: 4
title: Critique loop and proof
status: completed
---

# Phase 4: Critique loop and proof

## Steps

1. Run `/ak-frontend-design`'s `scripts/render-check.mjs` at 375, 768 and 1440 for home and two docs
   pages; fix every error.
2. Score the rubric of `references/self-critique-loop.md` from the screenshots; fix the three weakest
   items; repeat up to three rounds. Record each round's scores.
3. `grep -rnE '(^|[ "@])(sm|md|lg|xl|2xl):' site/src` returns no layout variant, and every `@media`
   width query is a `width < Nrem` form. Measure overflow and edge gutters at 390 and 1440 (no `scrollWidth > clientWidth` in `main`/`footer`,
   no text within 12px of the edge).
4. Check contrast of every text and UI pair you introduced in both themes; run `skin-check` if the skin
   changed.
5. Take the final screenshots listed in `plan.md` after the last change, with a clean `jds-skin`
   cookie, scrolled to top, and the replay captured both mid-way and finished.
6. Run the four site checks and `harness doctor`; write the report; prompt `planner`.
