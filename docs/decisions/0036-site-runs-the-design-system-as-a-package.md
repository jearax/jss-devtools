---
id: 0036
title: the site runs the design system as a Tailwind v4 package, with the design system's own conventions
status: accepted
date: 2026-11-03
partially_supersedes: 0027
---

# 0036 The site runs the design system as a Tailwind v4 package, with the design system's own conventions

## Context

Decision [0027](./0027-react-spa-landing-page.md) made the landing page a React single page
application and vendored the design system as a tarball. It imported only
`@jjuidev/design-system/styles.css`, the precompiled stylesheet, and the decision recorded that
"no component JavaScript is imported, so the design system's component runtime never reaches the
bundle". The page therefore had no Tailwind build, no component JavaScript, and the root ESLint
configuration linted `site/src`.

That bought a small bundle and a small toolchain, and it left the site unable to grow: a landing
page with a design system in it should be able to use that design system's components, its theme
provider and its tokens directly, instead of only its compiled CSS. The user asked for the site to
be set up the way the design system is.

The design system offers two stylesheet entries. `styles.css` is precompiled and needs no build
step; `tailwind.css` is the source entry for a host that runs Tailwind v4 itself, and it carries
the tokens, the semantic colours, the skins, the text roles and the base layer as source, so the
host's own Tailwind engine compiles them.

## Decision

**The site runs Tailwind v4 itself and imports the package's source entry.**

```css
/* site/src/styles/styles.css */
@import 'tailwindcss';
@import '@jjuidev/design-system/tailwind.css';
```

`styles.css` is never imported next to it: the package warns in development when both entries are
loaded, and the two carry the same component styles by different routes.

**The theme comes from the package.** `site/src/main.tsx` renders the page inside the package's
`ThemeProvider`. The provider owns the theme and the skin: it reads the `jds-theme` cookie, falls
back to the operating system, writes `data-theme` on `<html>` and follows the system when it
changes. The site does not reimplement the theme. `site/index.html` keeps a small script before
the first paint that applies the same rule, so the page never shows the wrong theme.

**The site follows the design system's conventions, enforced by the site's own tooling.**
`site/eslint.config.mjs` and `site/stylelint.config.mjs` port the design system's rules, the
`src/` layout follows its folder anatomy, the components are arrow functions with a default
export, the styles are CSS Modules with `@apply`, and the tests run in Vitest Browser Mode. The
root ESLint configuration no longer globs `site/src`; the site has its own lint, its own
typecheck and its own tests, and CI runs them.

**The design system stays a package, so nothing is duplicated.** Its tokens, colours, skins,
text roles and class helpers are used, never copied. The package exports `cn` and `tv`, and the
site imports them from it.

**A host may carry its own skin.** The package's skins are scale values under
`:root[data-skin='<id>']`, and `defineSkin` is the typing helper for a host's own. The site has
one, `jss-devtools`, in `site/src/styles/skins/`, and the package's own checker holds it to the
same contract as the platform skins. A host skin is not a copy of the package's palette: it is the
host's palette, declared in the package's shape, and the semantic mapping stays the package's. See
[0037](./0037-the-site-carries-its-own-host-skin.md).

**The `tailwindAutoReference` plugin stays copied in `site/vite/`.** Unlike `cn`, it carries no
design system fact: its entry path and the folders it filters are the host's own layout, and a
missing `@reference` fails the build instead of drifting silently. Moving it into the package
would add a Node-side `./vite` export and a `vite` peer dependency for about twenty lines that
one host uses. Revisit when a second host consumes the design system, or when the design system
fixes a bug in its own copy.

**The vendored tarball is built from the design system's `core` branch.** That branch is the
library alone: no router, no server, no application shell. The site needs the package and
nothing else, so it installs the library build. `core` exports the brand mark, so the header
shows the wordmark next to the theme toggle. It does not export the copy button, so the install
block shows the command only.

**This supersedes the styling and component-import parts of 0027.** The React single page
application, the vendored tarball, the content of the page and the CI build order stay as 0027
decided them. What changes: "only `styles.css` is imported" is now "only `tailwind.css` is
imported", "no component JavaScript is imported" is now "the theme provider is imported", the
non-goal "no Tailwind build in site" is dropped, and "the root ESLint configuration lints
`site/src`" is now "the site has its own ESLint configuration".

## In the user's words

> "Chủ yếu docs/conventions, src/ cho folder structure. Techstack styling libs: port gần giống từ
> design system, chỉ khác là không duplicate lại toàn bộ, xem mục theming-skins" — port the
> conventions and the styling stack around the package; do not duplicate the whole design system.
> (user, 2026-11-03)

> "Site có lint riêng" — the site has its own lint. (user, 2026-11-03)

> "Vitest Browser Mode" — Vitest Browser Mode, with one sample test now; no end-to-end tests and
> no coverage gate yet. (user, 2026-11-03)

> "OK, không cho." — the `tailwindAutoReference` plugin is not moved into the design system; the
> site keeps its copy. (user, 2026-11-03)

> "Export Logo lại từ DS core" — the brand mark comes back to the package on `core`, over keeping
> a copy in the site. (user, 2026-11-03)

## Options considered

| Option                                                         | Consequence                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Run Tailwind v4 and import the package's source entry (chosen) | The host compiles the tokens; the page can use the design system's components and theme as they are           |
| Keep only the precompiled stylesheet                           | The smallest bundle, but no Tailwind build, no theme provider and no component JavaScript                     |
| Copy the design system's token files into `site/`              | The site drifts from the package on the next release; the tokens live in two places                           |
| Put the site in the CLI workspace                              | One lockfile and one install, but React, Vite and Tailwind would sit in the CLI project and in the CLI bundle |

## Consequences

- The bundle grows: the theme provider and the class-merging utilities add roughly 18 kB gzip to
  the JavaScript, and the stylesheet shrinks, because the site's own Tailwind engine emits only
  the utilities the page uses.
- The site's CSS carries the design system's component styles, because the page renders the
  design system's theme toggle. That is the package's contract: the component styles come from
  the build that produced the component JavaScript, so the generated names match.
- The site is a second pnpm project with its own lint stack, so its ESLint major differs from the
  root's. The root `eslint.config.mjs` no longer globs `site/src`, and `pnpm --dir site lint` is
  its own command.
- CI installs Chromium for the site's browser tests, so the `checks` job grows a browser download.
- The vendored tarball is still the only source of the package, so a new design system release
  still means a new pack and a new commit. The pack comes from the `core` branch, so it carries
  the library and nothing else.
- The Node floor stays in one place: the root `package.json`.
- Enforced by: `pnpm --dir site lint`, `pnpm --dir site typecheck`, `pnpm --dir site test` and
  `tests/install.test.ts` (the Node floor on the page equals `engines.node`).
