# Styling Conventions

> Adapted from `@jjuidev/design-system`'s `docs/conventions/component-conventions.md` (the styling
> rules S1-S8) and `docs/conventions/design-tokens-conventions.md`. The site authors no token: it
> uses the ones the package carries.

## The Stack

The site runs Tailwind v4 itself and imports the design system's source entry:

```css
/* site/src/styles/styles.css */
@import 'tailwindcss';
@import '@jjuidev/design-system/tailwind.css';
@import './skins/jss-devtools.css';
```

- The engine comes first, the package second. The package's `tailwind.css` is the source entry:
  tokens, semantic colours, skins, text roles, the page container and the base layer.
- `@jjuidev/design-system/styles.css` is the precompiled entry and must never be imported next to
  the source entry; the package warns when both are loaded.
- The site's own skin comes last. It declares scale values only, so it stays unlayered and wins
  over the package's `@layer theme` whatever the import order.
- No token, colour, skin or typography rule is copied into the site. The package is the only
  source, except the site's own skin, which is the site's palette declared in the package's
  shape and held to the package's own contract.

## The site's skin

A skin is a set of scale values under `:root[data-skin='<id>']`, and nothing else. The site's
skin lives in `site/src/styles/skins/<id>.css`, and it is checked by the package's own command:

```bash
npx jds skin check src/styles/skins/jss-devtools.css --separation
```

The skin is registered with `defineSkin` in `site/src/styles/skins/<id>.skin.ts` and handed to the
package's `ThemeProvider`. The `Register` augmentation makes the host's own skin id typed. The
package resolves `data-skin` from the `jds-skin` cookie, so the document shell writes that cookie
when it is absent, never overwrites a stored choice, and sets the same attribute the provider
resolves. See [decision 0037](../../decisions/0037-the-site-carries-its-own-host-skin.md).

A skin's values are scale values, so a scale is replaced as a whole and the package's semantic
mapping keeps pointing at it. The status scales are inherited: they carry meaning, not brand.

## Tokens

| Need                    | Utility                          |
| ----------------------- | -------------------------------- |
| The page surface        | `bg-surface`                     |
| A raised panel          | `bg-raised`                      |
| The default text        | `text-default`                   |
| Secondary text          | `text-muted`                     |
| A border                | `border-default`                 |
| A link or a brand mark  | `text-primary`                   |
| A heading               | `text-heading-3xl`               |
| Body text               | `text-body-base`, `text-body-lg` |
| A short label           | `text-label-sm`                  |
| The keyboard focus ring | `focus-ring`                     |

- The dark palette lives behind `[data-theme=dark]`, which the theme provider writes on `<html>`.
  A utility never names a colour value, so a component needs no dark variant of its own.
- `focus-ring` is the package's own focus indicator: a 2px outline in `ring-focus`, shown on
  `:focus-visible`. An element the site owns that can be focused applies it, so the focus ring is
  the package's colour rather than the browser's default.
- The package carries no fonts. The stacks fall back to the system fonts, and the site loads no
  web font.

## Layout

- The page container is the package's `wrapper` utility: the page gutter and the page width.
- The reading column narrows it with `max-w-3xl`. A band that carries content (the header, the
  main, the footer) applies both, so every band starts at the same line.
- The layout is written desktop first and narrowed with `max-*` breakpoints, never `sm:`.

```css
.main {
  @apply wrapper flex max-w-3xl flex-1 flex-col gap-10 py-12;
}
```

## CSS Modules

- A component's own styles live in `styles.module.css` and use `@apply`. No `@reference` is
  written: the `tailwindAutoReference` Vite plugin prepends `@reference "/src/styles/styles.css"`
  to every CSS file under `src/` that lacks one, so `@apply` can use the theme's tokens.
- The outermost wrapper class is `.root`; the other classes are camelCase. Stylelint rejects a
  kebab-case class in a module.
- No `@layer` in a CSS Module: module rules stay unlayered and beat every Tailwind layer.
- State and props reach the CSS through `data-*` attributes and selectors.

```css
.root {
  @apply flex items-center gap-3 rounded-lg border border-default bg-raised p-4 max-sm:flex-col max-sm:items-stretch;
}

.command {
  @apply min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-body-sm text-default max-sm:flex-none;
}
```

## Utilities

- `tv()` and `cn()` come from `@jjuidev/design-system`. They carry the merge config that knows the
  design system's semantic text roles, so they are imported from the package and never copied.
  `cn` merges a consumer's `className` with the component's own and resolves a conflicting
  Tailwind class.
- A Tailwind class string never appears in JSX. It belongs in a `variants.ts` built with `tv()`.

## The site's own rules

Three rules the site adds to the package's.

**A band may be brand-tinted.** The pale end of the brand scale in the light theme, the deep end
in the dark one, where the pale end would be brighter than the page itself. It is a primitive
step, so it needs the reason written next to it, and the dark theme's value is set with a
`:global(html[data-theme='dark'])` rule in the band's own module.

**The reveal is CSS only.** `reveal` is a utility in the site's Tailwind entry: a scroll-driven
`animation-timeline: view()` fade, inside `@supports (animation-timeline: view())` and inside
`prefers-reduced-motion: no-preference`. A browser without the timeline, and a reader who asked
for less motion, get the content as it is. The range ends a quarter of the way through the
element's cover, so a tall block is already opaque while it is still entering.

**A snippet says its language.** `CodeBlock` takes a `language` and colours the snippet with the
hand-written tokenizer in `CodeBlock/highlight.ts` — `sh`, `json` and `ts`, and nothing else. The
roles come from the package's semantic layer, and each one clears 4.5:1 against the block in both
themes. A snippet with no language prints as plain text.
