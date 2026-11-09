---
title: Move the site to the stable design system and give it real interaction feedback
status: done
created: 2026-11-09
---

# Move the site to the stable design system and give it real interaction feedback

## Outcome

The landing site at `site/` runs on the stable design system the rest of the ecosystem uses:
`@jjuidev/styles` and `@jjuidev/react`, built from `/Users/tandm/Documents/jearax/dokploy/design-system`.
The legacy `@jjuidev/design-system` 0.1.0 tarball is gone. On top of that, every control on the site
answers the user: hover, press and keyboard focus are visible, consistent and timed the way the design
system says. The visual defects listed in phase 3 are fixed.

> "Cá nhân tôi thấy UI của nó chưa đẹp, chưa thực sự đẹp, thiếu UI/UX, các actions như hover,
> active,..." (user, 2026-11-09)

> "xem bản system design cuối stable của tôi ... cân nhắc, xem có apply được design system qua hay
> không, mục đích là align, thống nhất ecosystem" (user, 2026-11-09)

## Why it is feasible (scouted 2026-11-09)

The site imports little from the legacy package, and every import has a direct home in the new one:

| Legacy import (`@jjuidev/design-system`)                | Stable home                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `tailwind.css` (in `site/src/styles/styles.css`)        | `@jjuidev/styles/styles.css`, the one CSS source entry, after `@import 'tailwindcss'`           |
| `cn` (17 files)                                         | `@jjuidev/styles/variants`                                                                      |
| `defineSkin`, `interface Register` (the site skin)      | `@jjuidev/styles/theme`, same shape: `{ id, label }`, `interface Register { skins: [...] }`     |
| `ThemeProvider`, `Button`, `Logo`, `ThemeToggle`        | `@jjuidev/react`, plus `ButtonCopy`, `Dialog`, `Popover` the site can use instead of its own    |

The site skin (`site/src/styles/skins/jss-devtools.css`) is scale values under
`:root[data-skin='jss-devtools']`, the same mechanism the stable skins (`spring.css`, `autumn.css`) use,
and the stable package ships `skin-check` to prove it against the contrast contract.

## Constraints

- Neither package is on npm. Vendor tarballs built with `pnpm pack` in the design system, the way the
  legacy one is vendored (`site/vendor/`, `!site/vendor/*.tgz` in `.gitignore`).
- `@jjuidev/react` depends on `@jjuidev/styles` as `workspace:^`. `pnpm pack` rewrites that to a semver
  range, which pnpm would try to fetch from the registry. Pin it to the vendored tarball with `overrides`
  in `site/pnpm-workspace.yaml`.
- Exact versions only ("Pin what you install"). The site keeps its own pnpm project, lint, tests and
  build; root files are not touched except `.gitignore` if the tarball names need it.
- The site conventions in `.harness/docs/site/conventions/` win over generic UI advice. Where the stable
  design system changed a convention, the site conventions are updated to match it (phase 2), not the
  other way round.
- The site copy is not rewritten. Layout, states and composition change; wording changes only where a
  defect below needs it.
- No commit, no push (a push to `main` deploys the site image).

## Non-goals

- New pages, new docs content, search features or analytics.
- Changing the design system repository. A gap found there is reported, not patched.
- The CLI under `src/`.

## Phases

| #   | Phase                                                                    | Status  |
| --- | ------------------------------------------------------------------------ | ------- |
| 1   | [Swap the legacy package for the stable packages](./phase-01-swap-packages.md) | done    |
| 2   | [Re-sync the site conventions with the stable design system](./phase-02-resync-conventions.md) | done    |
| 3   | [Interaction feedback and the visual defects](./phase-03-interaction-and-visual-polish.md) | done    |

Phase 1 must leave the site looking the same as before (screenshots compared), so phase 3's changes are
the only visual changes and can be reviewed on their own.

## Acceptance criteria

- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
  pass; paste the real output.
- `git grep -n '@jjuidev/design-system' -- site ':!site/pnpm-lock.yaml'` returns nothing, and the legacy
  tarball is deleted.
- `skin-check` passes on `site/src/styles/skins/jss-devtools.css`.
- Every item in phase 3's checklist is fixed and shown in a screenshot taken after the last change:
  desktop 1440 and mobile 390, light and dark, plus hover, press and focus-visible captures.
- A new decision records the move to the stable packages and supersedes what it replaces in
  [0036](../../decisions/0036-site-runs-the-design-system-as-a-package.md).
- `node dist/cli.mjs harness doctor` stays healthy (index rows for the new decision and this plan).

## Report

`.harness/plans/reports/cooker-261109-<HHMM>-site-design-system-v2-and-ux-polish.md`, with the commands
and their output, the screenshots (paths), the decisions taken, and anything not met.
