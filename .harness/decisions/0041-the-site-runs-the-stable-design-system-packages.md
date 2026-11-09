---
id: 0041
title: the site runs the stable @jjuidev/styles and @jjuidev/react packages
status: accepted
date: 2026-11-09
supersedes: none
partially_supersedes: 0036
---

# 0041 The site runs the stable `@jjuidev/styles` and `@jjuidev/react` packages

## Context

Decision [0036](./0036-site-runs-the-design-system-as-a-package.md) put the site on the legacy
`@jjuidev/design-system` 0.1.0 tarball, whose component runtime carried only the theme provider and
the theme toggle. The stable design system split the package: `@jjuidev/styles` holds the Tailwind
entry, the tokens, the skins, the `cn` helper and the `skin-check` tool, and `@jjuidev/react` holds
the component runtime (theme provider, toggle, logo, button, copy button, dialog, popover). The
stable packages are not on npm, so the site still vendors tarballs built with `pnpm pack` from the
design system repository.

`@jjuidev/react` declares `@jjuidev/styles` as `workspace:^`. `pnpm pack` rewrites that range to a
semver range (`^0.0.1`), which pnpm would try to fetch from the registry — the registry has no such
package.

## Decision

**The site installs `@jjuidev/styles` and `@jjuidev/react` from vendored tarballs and the legacy
package is removed.**

```jsonc
// site/package.json
"@jjuidev/react": "file:vendor/jjuidev-react-0.0.1.tgz",
"@jjuidev/styles": "file:vendor/jjuidev-styles-0.0.1.tgz"
```

**The rewritten `workspace:^` is pinned back to the vendored tarball with an override.**

```yaml
# site/pnpm-workspace.yaml
overrides:
  '@jjuidev/styles': 'file:vendor/jjuidev-styles-0.0.1.tgz'
```

`pnpm why @jjuidev/styles` proves one installed copy. A new design system release means new
tarballs and a new commit that updates both `file:` references.

**The import homes follow the packages.** `cn` comes from `@jjuidev/styles/variants`;
`defineSkin` and the `Register` augmentation come from `@jjuidev/styles/theme`; the components
(`ThemeProvider`, `Button`, `Logo`, `ThemeToggle`) come from `@jjuidev/react`. The site's Tailwind
entry imports `@jjuidev/styles/styles.css` (the package's one CSS source entry, which does not
import Tailwind itself) and then `@jjuidev/react/styles.css` for the component runtime's compiled
styles — the component CSS is not reachable any other way, and without it the package's components
render unstyled.

**Where the stable system dropped a utility, the site declares the values.** The legacy package's
`overlay` utility is gone; the overlay scrim is the values of the package Dialog's own backdrop
(`fixed inset-0`, the overlay z-index layer, `neutral-950/40`, `backdrop-blur-xs`), declared in the
site's `SearchPalette` styles.

**This partially supersedes 0036.** The Tailwind v4 host, the vendored-tarball delivery, the site's
own toolchain and the host-skin mechanism stand as 0036 decided them. What changes: the package is
the stable split (`styles` + `react`) instead of the legacy monolith, the CSS entries are
`@jjuidev/styles/styles.css` plus `@jjuidev/react/styles.css` instead of the legacy `tailwind.css`,
and the component runtime now ships `Button`, `Logo`, `ThemeToggle` and the theme provider the
site uses.

## In the user's words

> "xem bản system design cuối stable của tôi … cân nhắc, xem có apply được design system qua hay
> không, mục đích là align, thống nhất ecosystem" — apply the stable design system to the site so
> the ecosystem aligns on one system. (user, 2026-11-09)

> "Cá nhân tôi thấy UI của nó chưa đẹp, chưa thực sự đẹp, thiếu UI/UX, các actions như hover,
> active,..." — the move is the base for the interaction work, not only a package swap.
> (user, 2026-11-09)

## Options considered

| Option                                            | Consequence                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Vendor the stable split as two tarballs (chosen)  | The site aligns with the ecosystem's system; the workspace range is pinned by one override |
| Keep the legacy 0.1.0 tarball                     | No interaction contract, no `skin-check`, and the package the ecosystem no longer builds   |
| Publish the stable packages to a private registry | Cleaner dependency graph, but new infrastructure for two packages one host consumes        |

## Consequences

- The site renders with the same tokens and skins the rest of the ecosystem uses; the `skin-check`
  contract now holds the site skin.
- A design system change now means packing and committing two tarballs, not one.
- The `overrides` pin is load-bearing: without it, a fresh install fails to resolve `^0.0.1` from
  the registry.
- The component runtime's compiled CSS must be imported alongside the component JavaScript, or the
  package's components render unstyled; enforced by the screenshot comparison in the phase 1 plan.
- Enforced by: `pnpm --dir site lint`, `pnpm --dir site typecheck`, `pnpm --dir site test`,
  `pnpm --dir site build`, and `skin-check` on the site skin.
