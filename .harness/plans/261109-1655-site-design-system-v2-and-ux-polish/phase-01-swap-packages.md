---
phase: 1
title: Swap the legacy package for the stable packages
status: done
---

# Phase 1: Swap the legacy package for the stable packages

## Goal

The site builds against `@jjuidev/styles` and `@jjuidev/react` and looks the same as before.

## Steps

1. Before touching anything, take baseline screenshots of the current site (home and
   `/docs/getting-started`; 1440 and 390; light and dark) with `pnpm --dir site dev` on a fixed port.
   Keep them in the session scratchpad.
2. In the design system repository, build and pack both packages (`pnpm build`, then `pnpm pack` in
   `packages/styles` and `packages/react`). Do not change that repository. Copy the two tarballs to
   `site/vendor/` and delete `site/vendor/jjuidev-design-system-0.1.0.tgz`.
3. `site/package.json`: replace `@jjuidev/design-system` with `@jjuidev/styles` and `@jjuidev/react` as
   `file:vendor/<tarball>`. Add any dependency the new packages need that the site lacks, at the exact
   version the design system pins (`@mantine/hooks` 9.7.4, `tailwind-variants` 3.3.1 and so on); do not
   duplicate a version the site already pins differently without stating why.
4. `site/pnpm-workspace.yaml`: `overrides` pins `@jjuidev/styles` to the vendored tarball, so
   `@jjuidev/react`'s rewritten `workspace:^` range never reaches the registry. Confirm with
   `pnpm --dir site why @jjuidev/styles` that one copy is installed.
5. Rewrite the imports per the table in [plan.md](./plan.md): `styles.css` entry, `cn`, `defineSkin` and
   `Register`, the four components. The `declare module` augmentation moves to `@jjuidev/styles/theme`.
6. Check what changed in the components the site uses (`Button` variants, `ThemeToggle` props,
   `ThemeProvider` options, `Logo`). Where a prop or variant was renamed, follow the new API; where the
   site re-implemented something the package now ships (`ButtonCopy` for `CopyButton`, `Dialog` for the
   search palette shell), adopt the package component only if the result looks and behaves the same, and
   record the choice in the report.
7. Run `pnpm exec skin-check site/src/styles/skins/jss-devtools.css` (from the site, against the
   installed package) and fix any failing pair by adjusting the site skin's step, as the tool reports.
8. Compare new screenshots with the baseline. Any difference must be explained by a package change and
   listed in the report; unexplained differences are bugs of this phase.
9. Write decision `0041` (next free number) from `.harness/templates/decision.md`: the site uses the
   stable `@jjuidev/styles` and `@jjuidev/react`, vendored as tarballs, superseding the package choice in
   0036. Quote the user from [plan.md](./plan.md). Add its index row.

## Files

`site/package.json`, `site/pnpm-lock.yaml`, `site/pnpm-workspace.yaml`, `site/vendor/*`,
`site/src/**` imports, `.harness/decisions/0041-*.md`, `.harness/decisions/README.md`.

## Done when

The site's four checks pass, no `@jjuidev/design-system` import remains, `skin-check` passes, and the
screenshot comparison shows no unexplained change.

## Risk

A component API changed in a way that shifts layout. Mitigation: the baseline comparison in step 8; keep
the site's own component where the package one would change the look in this phase, and revisit it in
phase 3.
