# Design direction — the redesigned site: a bold Home and a Docs section

Phase 1 of [the plan](./plan.md). It replaces the visual direction of
[0016](../261104-0016-site-rich-landing-page/design-direction.md), which the user rejected as "xấu ác,
đơn giản, đơn điệu quá" — too plain, too monotonous. The **content** of 0016 stays: its CLI fact
table, its constants, the host skin, the cookie fix and the six review fixes.

This document is the checkpoint. Phase 2 does not start until `planner-2` approves it, and the user
reviews the hero screenshots before that.

## The brief

From `/ak-frontend-design`:

```text
Register:  Brand
Scene:     A developer lands from a README, a search or a teammate's link, on a laptop or a phone,
           in light or dark. They must feel that this is a real tool with a real surface, not a
           document with a product name on it — and they must reach a working command within a
           minute.
Direction: A product page with presence. The terminal is the hero visual: the CLI's real output,
           in a real window, doing the thing the product does. Everything else is set dressing that
           earns its place by making the product legible.
Color:     Committed. The skin's teal carries the brand, the graphite carries the surfaces, and the
           page alternates between a brand-tinted band and the neutral surface so the rhythm is
           visible without a single gradient-for-its-own-sake.
Type:      The design system's own three families, self-hosted: Be Vietnam Pro for the text, Lora
           for the display, Cascadia Code for everything the CLI prints. The display face is the
           character the previous page lacked.
Signature: The terminal window: real glyphs, real output, a typed command and a line-by-line
           reveal, in a frame with a title bar.
Dials:     variance 8, motion 6, density 4.
```

## What 0016 got wrong, by the numbers

0016 ran at variance 4 and motion 2 with "restraint is the whole strategy". That produced a page
that was correct and flat: one reading column, one surface, one type size for everything, no
product visual above the fold, and a "terminal" that was a bordered `<pre>`. Nothing in it said
"terminal tool". The redesign changes the **shape** of the page, not its honesty: every fact still
comes from the built CLI, and the CLI's real glyphs are still real text.

## The palette: keep the skin, widen its use

The `jss-devtools` host skin stays. It already passes the package's contract, and the plan keeps it:

```text
$ npx jds skin check src/styles/skins/jss-devtools.css --separation
ok    src/styles/skins/jss-devtools.css (jss-devtools)
        light: closest fills secondary and success, 0.103
        dark: closest fills error and warning, 0.093
```

What changes is how much of the page is *skin* rather than *neutral*. 0016 used the skin for the
brand colour only: a teal link, a teal focus ring, the logo. The redesign gives the skin a job
per band:

| Band | Surface | Why |
| --- | --- | --- |
| Hero | The neutral surface, with the brand colour in the display type's accent and the terminal's glow | The product is the subject; the page should not compete with it |
| The command band | `bg-primary` with `text-primary-foreground`, the brand at full strength | The install command is the one thing the reader must not miss |
| The three commands | `bg-raised`, hairline borders | Reading, not selling |
| The harness | A brand-tinted band, `primary-50`/`primary-100` in light and `primary-950`/`primary-900` in dark | This is the differentiator; it gets its own colour |
| Docs | The neutral surface, `bg-raised` for the sidebar and the code blocks | Documentation is a reading surface |

The tinted bands are raw palette steps used as a *surface*, which the design system's rule D2
allows with a one-line reason: they are a band, not a component, and the semantic tokens do not
carry a "tinted band" role. They are declared in the CSS Module, never in JSX.

Gradients are used in exactly two places: the terminal window's top edge and the hero's radial
glow behind the product visual. Both are built from the skin's scales, and both are decoration
that a screen reader never sees.

## The type: the design system's own families, self-hosted

The package carries no fonts and says so: "The package carries no fonts; the host loads Be
Vietnam Pro, Lora and Cascadia Code, or the stacks fall back to system fonts." The redesign takes
the first option, self-hosted, because the terminal — the hero — is unreadable in a proportional
face.

The first pass gave the headline the serif. It read as a magazine, and all four references use a
sans at the display size with tight tracking, so the headline is the sans now: **Be Vietnam Pro,
600, tracking −0.03 em**, at a fluid display step of `clamp(2.25rem, 5.6vw, 3.75rem)` — one line on
a desktop, three on a phone, and never larger than the design system's own `6xl` step. The serif
stays available through the package's `text-display-*` role for a place that wants it, and the site
does not load it: an unused family is 37 kB and a set of `@font-face` rules for nothing.

| Role | Family | Package | Load | Latin woff2 |
| --- | --- | --- | --- | --- |
| Text and display | Be Vietnam Pro | `@fontsource/be-vietnam-pro` | Weights 400, 500, 600, latin subset | 63.6 kB |
| Mono | Cascadia Code | `@fontsource-variable/cascadia-code` | Variable, one file | 47.5 kB |

111 kB of woff2, `font-display: swap`. The font files are listed separately in the size report;
they are not part of the CSS budget.

`--font-sans` and `--font-mono` are pointed at the loaded families in the site's own stylesheet.
The package's `body` already reads `font-sans`, so no component changes its class to get the right
face.

The static family ships a per-subset CSS (`latin-400.css`), and the site imports the latin
subset only. The variable family does not: `@fontsource-variable/cascadia-code` publishes
`index.css` and `wght.css`, and both carry a `@font-face` rule per subset. That is where the
3.9 kB of unused `@font-face` rules comes from — the browser only fetches the latin file, but the
rules for the other nine are in the stylesheet. Writing the latin rule by hand would cut it; it
would also reach into the package's file layout, which is the package's business, so it waits.

No Google Fonts, no CDN, no runtime fetch. The two packages are pinned to an exact version, like
every other dependency in this repository.

## The motion

From `/ak-motion-design`. One identity, applied everywhere:

| Constant | Value | Used for |
| --- | --- | --- |
| Signature easing | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) | Every entrance and reveal, 80% of the motion |
| Duration palette | quick 150 ms, standard 260 ms, slow 700 ms | Feedback / state change / the hero reveal |
| Entrance pattern | Fade and rise 12 px, staggered 60 ms | Section entrances |

Motion personality: **energetic** for the entrance (ease-out-expo), **premium** for the hero
reveal (long, controlled, no overshoot). Nothing bounces. A developer tool that bounces reads as
a toy.

### The list

| What | How | Reduced-motion version |
| --- | --- | --- |
| The hero's display type and sub-line | Fade and rise, 60 ms stagger, 700 ms | Both visible at once, no transform |
| The hero's terminal: the command types | A width animation stepped one character at a time over 700 ms, with a blinking caret | The command is there, no caret, no stepping |
| The hero's terminal: the output reveals | One line at a time, 70 ms apart, fade and rise | All lines visible at once |
| The section entrances | Fade and rise on scroll into view, 260 ms | Visible, no transform |
| The nav's active state and the mobile menu | A 200 ms height and opacity transition | No transition, the panel is simply there |
| The theme switch | The package's own reveal | The package's own |

Every one of these is CSS only: transitions, keyframes and `animation-timeline` where the browser
supports it, with a `@media (prefers-reduced-motion: reduce)` block that sets every animated
property to its final value. No animation library ships. The design system's base layer already
applies `motion-safe:scroll-smooth`, so the scroll behaviour is the package's.

Nothing that matters is hidden until an animation runs: the terminal's final state is the real
output, and the reduced-motion path shows it immediately.

## The two components that carry the page

Both are shared, so they live in `site/src/components/`, not under a page. The site's conventions
have no shared-component folder yet; Phase 2 adds one and updates the conventions.

### `Terminal`

A window frame: a title bar with the three dots and a title (the command, or the folder), the
output in the CLI's real glyphs (`┌ │ ◇ ✔ ✖ └`), and the glyph coloured by role from the semantic
tokens — `success`, `error`, `warning`, and muted for the box drawing. The box drawing is always
muted, so the frame reads as a frame and the content reads as content.

Two variants: **static**, and **animated** for the hero, where the command types and the output
reveals. The reduced-motion version of the animated variant is the static one.

Optional tabs to switch between transcripts (`doctor`, `init --dry-run`, `harness doctor`), as a
real tablist with arrow-key support, following the WAI-ARIA tabs pattern. The hero uses the
tabs: three real transcripts of the real CLI, one tab per command.

The header leaves room for a copy button. There is none yet: the design system's `core` branch
ships no `ButtonCopy`, and the site does not reimplement design system components.

### `CodeBlock`

A file or shell snippet with a header (the file name or the language), syntax colouring, optional
highlighted lines, and horizontal scroll inside the block. **No ligatures**: the mono stack turns
`>=` into `≥`, and the CLI prints `>=`. 0016 already fixed that on its own surfaces; the
component carries the same rule so every snippet on the site prints what the CLI prints.

The colouring approach is decided in Phase 2, from the measured cost of the alternatives.

## The Docs area

### The information architecture

Six pages, in the order the plan fixes. The sidebar and the routes come from one constant, so
they cannot drift.

| # | Slug | Title | What it holds |
| --- | --- | --- | --- |
| 1 | `/docs` | Getting started | What the CLI is, the three commands at a glance, the install command, where to go next |
| 2 | `/docs/install` | Install | The install command, the requirements, what the installer checks and writes, `PATH` |
| 3 | `/docs/init` | init | What it does, the options, the presets that work, the dry-run output |
| 4 | `/docs/doctor` | doctor | What it checks, the output, the exit codes |
| 5 | `/docs/harness` | harness | Why it exists, the hooks, what the agent is told, the skills, `harness doctor` and `harness update` |
| 6 | `/docs/reference` | Reference | The `init` options, the presets that work, the exit codes |

The Reference page carries the tables that the commands' own pages only summarise, so the reader
has one place to look a flag up.

### The page template

Every Docs page is the same shape:

1. A breadcrumb (`Docs / init`).
2. The title and one line of what the page answers.
3. An on-page table of contents, for the pages long enough to need one (`init`, `harness`,
   `reference`). It is a list of links to the page's own headings, marked with
   `aria-current` when it is the one in view.
4. The content: prose, code blocks and terminals, in that order.
5. Previous and next links, from the same route constant.

The sidebar is sticky on a wide viewport and collapses behind the header's menu button on a
narrow one. The active item is marked with `aria-current="page"`.

### The header and the mobile menu

The header carries the package's `Logo`, the navigation (Home, Docs, GitHub), the package's
`ThemeToggle`, and a GitHub link. The navigation is a real list of links, and the active route is
marked with `aria-current="page"`.

On a narrow viewport the navigation collapses behind a menu button that carries
`aria-expanded` and `aria-controls`, and opens a panel that is a disclosure, not a modal: focus
stays where it is, and `Escape` closes it. The design system's `core` branch ships no menu
component, so the site owns this one, and the package's `Button` is used for the trigger.

There is a skip link before the header, so a keyboard user can reach the content.

### The router

`react-router`, pinned to an exact version on the same major the design system's `main` uses.
`/` is Home. `/docs` and `/docs/<slug>` are the Docs area, and that area is a lazy route, so the
Home route does not ship it. An unknown path inside the app renders a not-found view. The server
serves `index.html` for the `/docs` paths, so a Docs page survives a reload.

## The Home page

Seven sections. The content is the 0016 fact table and nothing else; the shape comes from the
reference study below. Each section says what it is for and which band it sits in.

| # | Section | Content, from the 0016 fact table | Band |
| --- | --- | --- | --- |
| 1 | **Hero** | The eyebrow (`jss-devtools · JavaScript stack dev tools CLI`), the statement headline in two tones, the value line, the install command in a code block, the Node floor, and the animated terminal running `jss-devtools doctor` | The surface, full bleed, 1152 px |
| 2 | **The gap** | The problem the CLI answers, in the project's own words: "The repository, not the chat context, is the authority an agent works from." One paragraph, no feature claims | The surface, the reading column |
| 3 | **Three commands** | `init`, `doctor`, `harness`, one step each: what it does, the real command, the real output. The heading is a sentence, not a label | The surface, three cards |
| 4 | **The harness** | Why it exists, the hooks it installs (a code block of the `.claude/settings.json` entries), what the agent is told when a session starts, the three skills | A brand-tinted band, `primary-50`/`primary-950` |
| 5 | **The terminal** | The product, at full bleed: the terminal window with the three real transcripts as tabs (`doctor`, `init --dry-run`, `harness doctor`) | Full bleed, the surface |
| 5b | **Works inside** | What the CLI works with, and only what is true: the harness installs its hooks into Claude Code's `.claude/settings.json`, and `doctor` checks bun, pnpm, yarn and npm while `--pm` installs with one of them | The surface, a row of chips |
| 6 | **Install** | The install command, the requirements, what the installer checks and writes, and the link into the Docs' Reference page | The surface, the reading column |
| 7 | **Closing** | The install command once more, on the brand band, and the two links that matter: the Docs and the repository | `bg-primary` with `text-primary-foreground` |

The 0016 page had eight sections, all prose in one column. This one has seven, and only two of them
are prose.

Two things are deliberately absent, and the reason is the same in both cases: the site has no real
customers, so there is no logo wall and no testimonial row. The references have both. Faking them
is the one thing the plan forbids.

## The reference study

Four sites, observed at 1280 px in the browser. The screenshots are in `refs/`. Nothing was copied:
no code, no text, no asset, no colour value.

### harness.io — `refs/harness-1-hero.png`, `refs/harness-2-cards.png`

**What it does well.** The headline is a sentence about the reader, not the product: "Agents for
your software factory", set at 64 px in a serif with tight tracking (−1.66 px) on a near-white
surface, with a geometric sans for everything else. The product's parts are a grid of four cards,
one per agent, each with its own heading and its own promise. The page then argues rather than
lists: "Harness gets smarter with every cycle", "Risk-based autonomy you can control". The nav is
deep and product-shaped, with dropdowns.

**For jss-devtools.** The serif display over a geometric sans is exactly the pairing the design
system's own text roles already describe (`text-display-*` is the serif, the body is the sans), so
the site gets the references' look without inventing a type system. The card grid for the product's
parts maps onto the three commands.

**Not for jss-devtools.** It is an enterprise platform page: a logo wall, a CISO-facing
narrative, a deep product nav. jss-devtools has three commands and no customers.

### agentkit.best — `refs/agentkit-1-hero.png`, `refs/agentkit-2-three-steps.png`

**What it does well.** "Your coding agent is powerful. Give it a system." — a statement in two
sentences at 72 px, on a near-black surface. The argument has a shape: the problem, then **three
steps** ("Install once. / Ask in your agent. / Get verified work."), then a 90-second demo, then the
proof. Every step heading is an imperative sentence ending in a full stop. The page is long
(32 386 px) and it earns every band, because each band makes one argument.

**For jss-devtools.** The three-step structure is the same shape as the product: `init`, then
`doctor`, then `harness` — three commands, three steps, three promises. Dark-first is a lesson
about *contrast*, not about being dark: the site's dark theme should feel like this one and its
light theme like harness.io's.

**Not for jss-devtools.** Its testimonials and its pricing kits have nothing to do with a free MIT
CLI.

### claude.com/product/claude-code — `refs/claude-code-1-hero.png`, `refs/claude-code-2-get-started.png`

**What it does well.** The product name as the headline, at 60.5 px in the house serif. Then the
bands: get started, what it can take on, where it meets you, what developers are saying, a FAQ, a
technical rundown. The code is the content — eighteen code blocks on the page — and the install is
a band of its own, not a line in the footer.

**For jss-devtools.** Two things: the product name *is* allowed to be the headline (so the site's
own name is not a mistake), and the reference table deserves a band rather than a row.

### herdr.dev — `refs/herdr-1-hero.png`, `refs/herdr-2-feature.png`

**What it does well.** The closest in kind: a terminal tool's own site. "Made for your agents.
Remade by them." at 82 px, and the **second clause is a dimmer grey** — the two-tone headline is the
move that makes a landing read as designed. Then a short paragraph, a primary button, and **the
install command in a bordered box with a Copy button**, with "Paste it in a terminal." under it.
Then a line of command chips ("Ask your agent to change Herdr. Try one:"). Then the product, a real
screenshot, full bleed. The features are short headings with a screenshot each, and the page ends by
repeating the headline.

**For jss-devtools.** Three things, all in the prototype: the two-tone headline, the install command
in a bordered box (with the copy button's place left for the design system's own `ButtonCopy`),
and the full-bleed product visual. The command chips become the terminal's tabs.

**Not for jss-devtools.** Its heading style writes "##" in front of every section heading, and its
nav runs to nine items. The site has three commands and a three-item nav.

### Across the four

1. **The headline is a sentence, and it is set large.** Three of the four lead with a statement at
   60–82 px; the fourth leads with the product name at 60 px. 0016's headline was the product name
   at 30 px. The size is the difference between a page and a document.
2. **A serif display over a geometric sans.** Two of the four pair them, and the design system's own
   roles already pair them. Self-hosted, the site's own three families.
3. **The product is on the screen, not described.** A terminal window, a real transcript, real glyphs.
   This is the site's signature and the reason the page cannot be a document.
4. **The install command is a band, not a line.** Two of the four give it its own bordered box with a
   copy button. 0016 gave it a bordered surface in a reading column.
5. **The page argues in bands.** Each band makes one point and has its own surface. The surfaces
   alternate: the surface, a tinted band, the surface, the brand band at the close.
6. **Short headings that are sentences.** "Install once.", "Ask in your agent.", "Close it, they keep
   working." A heading that is a label reads like a table of contents.
7. **The closing repeats the promise.** Herdr ends on its headline; the site should end on the
   install command, on the brand band.

What a CLI product's site should copy, then: the two-tone display headline, the install command as
a bordered box, the terminal as the hero visual with real transcripts and real glyphs, one argument
per band, and a closing that repeats the promise. What it must not copy: the logo wall, the
testimonials, the pricing and the deep product nav, because a free MIT CLI has none of them, and
the site says only what is true.
