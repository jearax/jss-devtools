---
title: "Export Logo from the design system core, bring the wordmark back to the site header"
description: "Restore the Logo component on DS core and export it, push core, re-pack the tarball, and put the Logo back in the site header next to the theme toggle."
status: pending
priority: P2
branch: main
tags: [site, design-system, dependencies]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Export `Logo` from the design system `core`, bring the wordmark back to the site header

Two repositories:

- **DS**: `the dokploy repository`, branch `core` (`ae147d6`, equal to
  `origin/core`). `main` (`fa07334`) already exports `Logo` and is **not** touched. Follow the DS
  `AGENTS.md`, `docs/conventions/` and its commit hooks.
- **Site**: `site/` in this repo. It builds on plans
  [261103-1629](../261103-1629-site-design-system-foundation/plan.md),
  [261103-1833](../261103-1833-site-light-ui-with-design-system/plan.md) and
  [261103-2031](../261103-2031-ds-export-tv-cn-and-core-tarball/plan.md), which are done but not
  committed. Do not revert them.

## Decision taken with the user (2026-11-03, do not reopen)

The user chose to export `Logo` again from DS `core`, over keeping a copy in the site. This
deliberately narrows the `core` cut of `5d0a285` ("the brand assets leave the branch"): the brand
mark component comes back to the package; the other brand assets (favicons, `scripts/brand-icons`,
the logo skill data) stay out.

## Non-goals

- No change to DS `main`, and no other component back on `core` (`ButtonCopy` stays out; the user
  builds the copy button later).
- No favicon, manifest or `scripts/brand-icons` on `core`.
- No redesign of the mark: the component comes back as it is on `main`.
- No commit or push in this repo (jss-devtools). A push to its `main` deploys.

## Part A: DS `core`

1. Check the branch is at `ae147d6` and equal to `origin/core`. Use a temporary
   `git worktree add` or `git switch` in the main worktree; leave the main worktree on `main` and do
   not touch `worktree/silver-cloud-224f`.
2. Restore `src/components/Logo/` from `main` (`Logo.tsx`, `Logo.constant.ts`, `Logo.test.tsx`,
   `styles.module.css`). Fix anything that references what `core` does not have. In particular the
   first comment of `Logo.constant.ts` points at `scripts/brand-icons`, which is not on `core`:
   rewrite it so it states only what exists. If a test, a convention check or the architecture rules
   on `core` reject the component, report it instead of weakening the check.
3. `src/lib/index.ts`: export `Logo` and `LogoProps` in the file's existing style, as `main` does.
4. Extend the public-surface or consumer test the way plan 261103-2031 did for `cn`/`tv`
   (`test/library-consumers.e2e.ts`, or whatever pins the export list): a consumer imports `Logo`
   from the package and renders it.
5. Docs on `core`, smallest owning surface only:
   - `CHANGELOG.md` `[Unreleased]`: an `Added` entry for `Logo`, and fix the `Changed` bullet that
     says `src/lib/index.ts` "no longer exports ... the brand mark".
   - `docs/decisions/0007-autumn-default-palette.md` says "The package ships no brand assets". Make
     it true again with the least edit (the package ships the brand mark component and no other
     brand asset), or, if the DS convention is a new decision record for a reversal, write that
     instead. Say which you did and why.
   - `README.md` "Use as a package", if it lists the exports.
6. Run and paste: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build:lib`, and the consumer e2e
   (`pnpm test:e2e`, or only the library-consumers spec).
7. Commit with a conventional message, for example `feat(lib): export the Logo brand mark`. Let the
   hooks run. Push only when step 6 is green.
8. `pnpm build:lib && pnpm pack` on `core`, copy the tarball to
   `site/vendor/jjuidev-design-system-0.1.0.tgz`. Record the `core` commit hash in the report.

## Part B: the site

1. `pnpm --dir site install`; report the lockfile integrity change.
2. `SiteHeader`: put `Logo` back on the left, `ThemeToggle` stays on the right. Use `expanded` so
   the wordmark shows on desktop (the component collapses itself below `48rem`). Change `.inner`
   back to `justify-between` and delete the "One child today" comment. The Logo needs an accessible
   name in context: the wordmark text gives it one; check it in the test rather than adding an
   `aria-label` that repeats it.
3. Tests: the header test checks the Logo renders with its wordmark and the toggle stays accessible.
4. Docs in this repo: `docs/decisions/0036-…` says `core` does not export the brand mark and the
   header shows no wordmark; update it (the copy button still stays out). Update
   `docs/site/conventions/` or `docs/codebase-summary.md` only where they say the same.
5. Check the build in a browser: light, dark, 1280 px and 360 px (the mark alone at 360 px, no
   horizontal scroll). Save a screenshot under `plans/reports/`.

## Acceptance criteria

1. `git show core:src/lib/index.ts` exports `Logo` and `LogoProps`; the commit is on `origin/core`;
   the DS checks were green before the push; `gh run list` in the DS repo shows the `core` CI run,
   with its status.
2. The vendored tarball's `dist/lib/index.js` exports `Logo`, and its `package.json` comes from
   `core`.
3. The header shows the Logo left and the toggle right, in both themes, and the mark alone at 360 px.
4. Site: `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`.
   Root: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`. All green,
   output pasted.
5. JS and CSS gzip before (134.49 kB / 7.37 kB) and after.

## Report

Write `plans/reports/cooker-2-261103-2318-ds-core-export-logo.md`, then prompt `planner-2` with its
path.

## Constraints

- Raise a blocking question at the step it blocks, one at a time, with your leaning. Stop and ask
  before pushing if a DS check fails or the branch is not where this plan says.
- Never `--force` push and never `--no-verify`.
- Do not restart or kill the dev server on port 5173 (pane `w13:p4`); it belongs to the user.
