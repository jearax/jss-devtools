# Styling Conventions

> Adapted from the stable design system's `.harness/docs/styling-conventions.md` (in the design
> system repository) and its decisions 0044–0053. The site authors no token; it uses the ones the
> packages carry.

## The Stack

The site runs Tailwind v4 itself and imports the stable packages' entries:

```css
/* site/src/styles/styles.css */
@import 'tailwindcss';
@import '@jjuidev/styles/styles.css';
@import '@jjuidev/react/styles.css';
@import './skins/jss-devtools.css';
```

- The engine comes first, `@jjuidev/styles` second. Its `styles.css` is the package's one CSS
  source entry and does not import Tailwind itself, so the host imports `tailwindcss` first and
  controls its options.
- `@jjuidev/react/styles.css` carries the component runtime's compiled styles. A component
  imported from `@jjuidev/react` is unstyled without it; the import sits between the styles
  package and the site's skin.
- The site's own skin comes last. It declares scale values only, so it stays unlayered and wins
  over the packages' `@layer theme` whatever the import order.
- No token, colour, skin or typography rule is copied into the site. The packages are the only
  source, except the site's own skin, which is the site's palette declared in the package's shape
  and held to the package's own contract.

## The site's skin

A skin is a set of scale values under `:root[data-skin='<id>']`, and nothing else. The site's
skin lives in `site/src/styles/skins/jss-devtools.css`, and the stable package's own command
checks it against the contrast contract:

```bash
pnpm --dir site exec skin-check src/styles/skins/jss-devtools.css
```

The skin is registered with `defineSkin` from `@jjuidev/styles/theme` in
`site/src/styles/skins/jss-devtools.skin.ts` and handed to `ThemeProvider` from
`@jjuidev/react`. The `Register` augmentation — `declare module '@jjuidev/styles/theme'` — makes
the host's own skin id typed. The provider resolves `data-skin` from the `jds-skin` cookie, so
the document shell writes that cookie when it is absent, never overwrites a stored choice, and
sets the same attribute the provider resolves. See
[decision 0037](../../../decisions/0037-the-site-carries-its-own-host-skin.md) and
[decision 0041](../../../decisions/0041-the-site-runs-the-stable-design-system-packages.md).

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
- The package carries no fonts. The site self-hosts its two families (`Be Vietnam Pro` for the
  headline, `Cascadia Code` for the CLI's output) and points the `--font-*` tokens at them, with
  the package's stacks as the fallback.

## Interaction states

Review enforces this contract on every control (links, buttons, cards, palette items). A stable
decision sets it; the site follows it so every control answers the user the same way.

- **States are tokens, not palette steps or alpha** (stable 0052): hover reads
  `hover:bg-primary-hover`, `hover:bg-hover` or a border/text state token; press reads `active:`
  plus the pressed token, or a small `scale`/`translate` press on buttons and cards. Never
  `hover:bg-primary/90` where a state token exists.
- **Timing** (stable durations): `duration-150` for hover, press and popups; `duration-200` for
  backdrops and drawers; `duration-300` for icon swaps. The `transition` names the properties
  that change; `transition: all` is never written.
- **Reduced motion**: a `translate` or `scale` effect is off under `motion-reduce:`; colour
  changes stay.
- **Never hover-only reveal**: a control that appears on hover must also appear under
  `(pointer: coarse)` and for the keyboard.

## Touch targets

A control smaller than 44px adds `pointer-coarse:h-11` (or `pointer-coarse:size-11`). A keyboard
hint (`⌘ K`) is `pointer-coarse:hidden`, and copy around it reads as a sentence without it.

## Z-index

Use `z-<name>` from the nine layers the styles package defines in its `layers.css`. Never a bare
`z-50` or an arbitrary value. Lowest first: `sticky`, `float`, `header`, `overlay`, `modal`,
`popover`, `toast`, `tooltip`, `progress`. Whatever opens from a layer sits above that layer, and
everything in the page sits below `overlay`, so the backdrop dims it.

## Focus

Focusable controls use `focus-ring` (2px outside) or `focus-ring-inset` (2px inside, for a text
input's border or a clipped parent). Both draw an outline on `:focus-visible` only, in
`ring-focus`. The outline is never removed without this replacement.

## Alpha

An alpha modifier never replaces a semantic token that covers the need: states, disabled,
secondary text, strong borders and raised layers are tokens (stable 0052). Alpha stays for what
no token covers — a tint, a translucent bar, a scrim — at the recommended steps `/10`, `/40` and
`/90`; another value needs a reason written next to it. The modal scrim is the package's own
exception: `bg-neutral-950/40`, the values the `SearchPalette` backdrop copies.

## Layout

- The page container is the package's `wrapper` utility: the page gutter and the page width.
- The reading column narrows it with `max-w-3xl`. A band that carries content applies both, so
  every band starts at the same line.

## Responsive (R1–R5)

The design system is desktop-first (stable decisions 0021 and 0050). The un-prefixed utilities
are the wide layout; the narrow layouts are overrides, widest breakpoint first.

- **R1** — a layout variant is only ever `max-2xl:` / `max-xl:` / `max-lg:` / `max-md:` /
  `max-sm:`. The min-width variants (`sm:` `md:` `lg:` `xl:` `2xl:`) are never used for layout.
- **R2** — plain CSS narrows with `@media (width < 64rem)`: rem steps from the package's
  breakpoint tokens, never px, never `min-width`. A container query uses the `@max-*` form.
- **R3** — in a CSS Module, one `@apply` holds the base utilities, then each breakpoint that
  changes something gets its own `@apply` (`@apply max-lg:…`), ordered widest first (0050).
  An `@apply` never mixes un-prefixed utilities with `max-*` ones and never holds two breakpoints.
- **R4** — an element that differs at a narrow width states the narrow layout through the
  override, so deleting every `max-*` line leaves the desktop layout intact.
- **R5** — state and touch variants that the narrow layouts need (`pointer-coarse:`,
  `motion-reduce:`) follow the same one-per-breakpoint line discipline.

## CSS Modules

- A component's own styles live in `styles.module.css` and use `@apply`. No `@reference` is
  written: the `tailwindAutoReference` Vite plugin prepends `@reference "/src/styles/styles.css"`
  to every CSS file under `src/` that lacks one, so `@apply` can use the theme's tokens.
- The outermost wrapper class is `.root`; the other classes are camelCase and semantic — they
  name what the element is or does (`.sidebar`, `.searchButton`), never a tag name or a counter
  (`.main1`) (stable 0045). Stylelint rejects a kebab-case class in a module.
- No `@layer` in a CSS Module: module rules stay unlayered and beat every Tailwind layer.
- State and props reach the CSS through `data-*` attributes and selectors.
- **One `@apply` per breakpoint** (stable 0050): the desktop utilities go on the first `@apply`,
  then one `@apply` per breakpoint that changes something, widest first (`max-2xl:` …
  `max-sm:`), and each line holds only that breakpoint's utilities. An `@apply` never mixes
  unprefixed utilities with `max-*` ones, and never holds two breakpoints.
- A class name is never built from parts (`rounded-${name}`): Tailwind generates only classes it
  finds whole in source. A value that varies goes through a CSS variable read by an arbitrary
  utility.
- A plain declaration is allowed only where Tailwind has no utility at all — a custom property,
  an SVG presentation attribute, a third-party selector — with a one-line comment saying why.

## Text

- A text role owns the size, the weight and the leading together: `text-heading-xl`,
  `text-body-base`. `font-size`, `font-weight` and `line-height` are never set next to a role.
- The scale stops at `3xl` (stable 0053): the largest heading on any page is
  `text-display-3xl`. No `4xl` and no role above `3xl`.
- Use `text-default`, `text-muted` or `text-disabled` for colour, never a scale step.

## Merging classes

`tv()` and `cn()` come from `@jjuidev/styles/variants`. They carry the merge config that knows
the design system's semantic text roles, so they are imported from the package and never from
`tailwind-merge` or `tailwind-variants` directly. A Tailwind class string never appears in JSX;
it belongs in a `variants.ts` built with `tv()`.

## The site's own rules

Three rules the site adds to the packages'.

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
