# Design direction — the rich landing page

Phase 1 of [the plan](./plan.md). It proposes the page and stops for `planner-2` to approve before
anything is built.

The palette below is not a proposal on paper: it is a candidate host skin that already passes the
design system's own contract (`jds skin check`), rendered with the design system's own stylesheet in
both themes.

## The brief

From `/ak-frontend-design`:

```text
Register:  Brand
Scene:     A JavaScript developer lands on this page from a README or a search result, on a laptop
           or a phone, in light or dark. In thirty seconds they must know what the CLI does,
           that it installs with one command, and that it gives an AI agent the repository's rules.
Direction: Technical documentation that reads as a landing page, because the product's only
           credible claim is that it prints real output and writes real files. Every statement on
           the page is a command or the command's output; nothing is a slogan.
Color:     Restrained. Surface white in light, neutral-950 in dark. Accent is the skin's teal,
           used on the primary action, the links, the focus ring and the selection only.
Type:      One sans family (the package's stack) plus the package's mono stack for commands.
           The contrast axis is grotesque against monospace, not two display faces.
Signature: A terminal that is real text, not an image: the actual glyphs the CLI prints (✔ ✖ ◇ │),
           the actual box drawing, the actual command line.
Dials:     variance 4, motion 2, density 6.
```

Density is high because the reader is looking for facts. Variance is low because a tool page that
shows personality in its layout is a tool page nobody trusts. Motion is nearly off: the only motion
worth having is the theme toggle's own transition, which the package already owns.

## The section list, in order

The order follows the plan's Phase 2, step 3. The reasoning behind it is the landing-page research
(`/ak-frontend-design`, section structure of bun.sh, deno.com, pnpm.io, vite.dev and
turborepo.dev/repo): every one of them runs **hero → install → what the thing does → proof → CTA →
footer**, and the install command sits immediately under the hero.

Two consensus sections are deliberately absent: a logo wall and a testimonial row. The site has no
real customers to show and `/ak-frontend-design`'s quality floor forbids inventing them. A
comparison table is also absent: the CLI has no competitor set to compare against honestly.

| # | Section | What it contains | Why it is there |
| --- | --- | --- | --- |
| 1 | **Hero** | The product name, one value line, the install command as the primary call to action, the Node floor as a badge | The reader's first question is "what is this and how do I get it" |
| 2 | **Install** | The install command, the Node floor, what the installer needs | Deno puts install third, right under the hero; a second, quieter copy of the command for the reader who scrolled past the hero |
| 3 | **The three commands** | Three cards: `init`, `doctor`, `harness`. Each card = what it does in one line, the exact command, one line of real output | The "feature breakdown" slot every tool page has, filled with the tool's actual surface instead of invented features |
| 4 | **Terminal** | One real `jss-devtools doctor` transcript, rendered as text in a terminal frame | The product demo slot. A CLI's demo is its output; the transcript is the whole product in eight lines |
| 5 | **The harness** | Why it exists, and the agent workflow: the hooks wired into `.claude/settings.json`, what the agent is told at session start, the skills | The differentiator. Deno's "or let your agent do it" is the model here, because the harness is the part no competing tool has |
| 6 | **Reference** | The `init` options, the presets, the exit codes, links to the repository's own docs | A reader who already decided still needs the table; this is where the page stops selling and starts telling |
| 7 | **Requirements** | Node floor, `curl` or `wget`, `~/.local/bin` on PATH | A spec sheet, close to the footer |
| 8 | **Footer** | Source repository, MIT license, the docs | The consensus closing |

Two placements worth flagging for approval: the Node floor appears in the hero **and** in the
install section **and** in requirements, because each reader reaches the page with a different
question, and repeating one fact three times is cheaper than making the reader hunt for it. The
terminal mock shows `doctor` rather than `init --dry-run`, because the dry-run transcript is
fifty-two lines of file paths and would read as noise; the `init` card carries the honest summary
of it instead (`52 to create`).

## The CLI facts the page states, and where each one comes from

Every value below was read out of the built CLI or the repository. Nothing on the page may go
beyond this table.

| Fact | Value | Source |
| --- | --- | --- |
| Product name | `jss-devtools` | `node dist/cli.mjs --help` |
| Purpose line | "JavaScript stack dev tools CLI" | `node dist/cli.mjs --help` |
| Commands | `doctor`, `init [dir] [options]`, `harness` | `node dist/cli.mjs --help` |
| `init` preset | `node` only. `--framework` accepts `node`, `react`, `rn`, `next`, `nest` in its declared values, but every value other than `node` fails with `Framework <x> is not supported yet` | `src/commands/init/services/init.service.ts`, `src/commands/init/init.command.ts` |
| `init` options | `--framework <name>`, `--pm <name>` (`bun`, `pnpm`, `yarn`, `npm`; default `npm`), `--force/-f`, `--no-vscode`, `--no-harness`, `--agent-kit`, `--yes/-y`, `--dry-run` | `node dist/cli.mjs init --help` |
| `init` output | `◇  Changes in my-app: 52 to create`, then the file list, then `└  Dry run: nothing written` | `node dist/cli.mjs init my-app --pm pnpm --dry-run` |
| `doctor` output | `✔ Node.js v24.22.0 needs >= 24.11.0`, `✔ Git 2.55.0`, `✔ bun`, `✔ pnpm`, `✔ yarn`, `✔ npm`, then `└  Ready: Node.js, git and 4 package managers` | `node dist/cli.mjs doctor` |
| `harness` subcommands | `harness doctor`, `harness update` | `node dist/cli.mjs harness --help` |
| `harness update` options | `--continue`, `--abort`, `--yes/-y`, `--dry-run` | `node dist/cli.mjs harness update --help` |
| `harness doctor` output | `✔ Memory`, `✔ Decisions`, `✔ Learned skills`, then the failing checks, then `└  10 harness error(s)` | `node dist/cli.mjs harness doctor` |
| `harness doctor` exit code | `0` when healthy or warnings only, `1` when any check fails | `node dist/cli.mjs harness doctor --help` |
| Exit codes | `ok: 0`, `failure: 1` | `src/core/constants/exit-code.constant.ts` |
| Node floor | `>=24.11.0` | `engines.node` in the root `package.json` |
| Install command | `curl -fsSL https://jss-devtools.jjuidev.com/install.sh \| sh` | `scripts/install.sh`, served by the site image |
| License | MIT | root `package.json` |
| Source | `github.com/jearax/jss-devtools2` | the repository |
| Agent hooks | `SessionStart` (startup, resume, clear, compact), `PostToolUse` on `Write`, `Edit`, `MultiEdit`, `PostToolUse`, `PostToolUseFailure`, `Stop` | `src/modules/harness/constants/hook-settings.constant.ts` |
| What the agent is told at session start | The harness memory and its character budget, the decisions in force, index drift, the onboarding notice | `src/modules/harness/hooks/session-start.hook.ts` |
| Harness skills | `harness-onboard`, `harness-curate`, `harness-review` | `src/modules/harness/` |

Two facts are deliberately **not** on the page: the current version number (`0.0.1`, unreleased) and
the framework values that do not work yet. A landing page that promises `react` presets would be
making a promise the CLI breaks at runtime.

## Art direction

The page reads as a piece of technical documentation that happens to be a landing page. That means
the hierarchy is built out of *commands and their output* rather than out of marketing shapes: the
value line is one sentence, every command sits in a mono surface with a hairline border, and the
only large element is the hero's `<h1>` and the terminal frame. Sections are separated by the
package's own spacing scale, not by decorative rules or background bands; the page background stays
the surface colour so the terminal frame and the command surfaces are the only raised layers.

Nothing is centred except the terminal's own content; the rest is a left-aligned reading column at
`max-w-3xl`, following the site's existing convention, so the page scans as a document. The one
deliberate exception is the hero, which is left-aligned too but leads with a command rather than a
headline: the first thing the eye meets after the name is the install command, because that is what
the reader came for.

Restraint is the whole strategy. No gradients, no glow, no drop shadows on text, no motion on
scroll, no decorative illustration. The only depth strategy is hairlines and surface tints, which
is what the package's own components use.

## The palette

The site gets its own palette as a **host skin**: a file of primitive values that the package's
semantic layer points at, registered with `defineSkin` and applied through `data-skin`.

### Which scales change, and why

The package's semantic mapping (`colors.css`) is fixed and is not touched. The host skin replaces
**primitive values only**, and it replaces only the two scales that carry the site's identity:

| Scale | Decision | Reason |
| --- | --- | --- |
| `primary` | **Re-tinted to teal**, mean hue 195° | The brand colour: buttons, links, the focus ring, the logo mark. The package default is plum (mean hue 339°); the site needs its own |
| `neutral` | **Re-tinted to cool graphite**, mean hue 250°, chroma ≤ 0.012 | Text, borders, the dark surfaces. The package default is warm parchment, which reads editorial; the site reads like a terminal |
| `secondary` | Inherited from the package | Olive, the package's second brand colour. It is already separated from every status colour and re-tinting it buys nothing |
| `success`, `warning`, `error`, `info` | Inherited from the package | They are semantic, not brand. A status scale that changed with the site's palette would stop meaning "this is a failure" |

Twenty-two declarations, not seventy-seven. The skin is a delta, not a fork of the theme.

### How the values were derived

Not by hand-picking hexes. The package's own scale values were converted to OKLCH, rotated to the
target hue, and converted back **under a fixed WCAG relative luminance**. Because every step keeps
its luminance, every contrast ratio in the package's contract is preserved exactly — the rotation
cannot silently break the contract, it can only change the hue.

The first attempt preserved OKLab's `L` instead, and it broke the contract: `ring-focus on bg-active
is 2.86:1, needs 3:1`. OKLab's lightness is not the WCAG luminance, so equal `L` does not mean
equal contrast. The shipped approach solves for the luminance instead.

### The scale

```css
:root[data-skin='jss-devtools'] {
	--color-primary-50: #e8f9f6;
	--color-primary-100: #cbf0e9;
	--color-primary-200: #a0e0d8;
	--color-primary-300: #70c9c4;
	--color-primary-400: #32b0ac;
	--color-primary-500: #008989;
	--color-primary-600: #007173;
	--color-primary-700: #005b60;
	--color-primary-800: #004549;
	--color-primary-900: #003236;
	--color-primary-950: #001d22;

	--color-neutral-50: #f4f7fb;
	--color-neutral-100: #e9edf3;
	--color-neutral-200: #dce0e7;
	--color-neutral-300: #c4cbd2;
	--color-neutral-400: #a9b0b9;
	--color-neutral-500: #8c949d;
	--color-neutral-600: #737b84;
	--color-neutral-700: #5a646c;
	--color-neutral-800: #444c54;
	--color-neutral-900: #2f363d;
	--color-neutral-950: #12171c;
}
```

The skin id is `jss-devtools`: it matches the package's `/^[a-z][a-z0-9-]*$/`, it is namespaced as
`<zone>-<name>`, and it clashes with neither platform skin (`default`, `spring`).

### The contract, already checked

The package's own checker, on this exact file:

```text
$ npx jds skin check site/src/skins/jss-devtools.css --separation
ok    site/src/skins/jss-devtools.css (jss-devtools)
        light: closest fills secondary and success, 0.103
        dark: closest fills error and warning, 0.093
```

`ok` means every pairing the package's contrast contract holds — foreground on fill, hover and
active for all six intents, muted and default text on all six surfaces, borders and the focus ring
on all six surfaces, in both themes. The two separation figures are the package's own default
margins, unchanged.

### What the skin does to the page

| Token | Light | Dark |
| --- | --- | --- |
| Surface | `#ffffff` (the package fixes it) | `#12171c` (neutral-950) |
| Default text | `#12171c` (neutral-950) | `#f4f7fb` (neutral-50) |
| Muted text | `#5a646c` (neutral-700) | `#c4cbd2` (neutral-300) |
| Border | `#dce0e7` (neutral-200) | `#444c54` (neutral-800) |
| Primary action | `#005b60` (primary-700) on white text | `#70c9c4` (primary-300) on `#003236` text |
| Link, focus ring | `#005b60` (primary-700) | `#70c9c4` (primary-300) |
| Logo mark | stem and dots follow primary-700 / primary-300 | same |

The logo follows the skin, because the package's logo mark is drawn in `primary-700` / `primary-300`
/ `primary-500` with the apex dot in `secondary-500`. The header mark therefore turns teal with the
skin, which is the package's designed behaviour, not a side effect.

## The skill ledger

| Skill | What it decided here |
| --- | --- |
| `/ak-frontend-design` | The brief; the section order; the terminal-as-signature; the restraint rules; the hero-led-with-a-command decision; the polish audit that Phase 2 ends with |
| `/ak-ui-ux-pro-max` | The landing pattern (hero, install, feature breakdown, product demo, reference, footer); the developer-tool palette read; the accessibility and touch-target rules; the pre-delivery checklist |
| `/ak-design-system` | The three-layer token model, and the rule that follows from it: a host skin replaces the **primitive** layer only, and the semantic mapping and the component styles stay the package's |
| `chrome-devtools-mcp:a11y-debugging` | The a11y pass on the built page in Phase 2 |
| `/ak-react-best-practices` | The rendering and bundle budget for the new sections in Phase 2 |

### Advice this plan does not apply, and why

`/ak-ui-ux-pro-max`'s generated design system for this query recommends **JetBrains Mono as a Google
Font**, a **dark-mode-only OLED theme**, a **sticky navigation CTA** and **feature icons**. All four
are refused, and the refusals are recorded here rather than silently dropped:

- **Web fonts.** The package carries no fonts and the site loads none; a font import would add a
  network dependency and a third party to a page whose whole claim is that it is self-contained. The
  package's mono stack carries the terminal, as it already does on the CLI side.
- **Dark only.** The theme belongs to the package, which ships both themes and lets the reader
  choose. A dark-only page would drop the light theme the decision record committed to.
- **Sticky navigation CTA.** The header is the package's own header, and the page has one screenful
  of content above the fold; a sticky bar would cover the terminal.
- **Feature icons.** The site's dependencies carry no icon library, and the package's `core` branch
  exports no icon set. Icons would mean a new dependency or a hand-drawn SVG set, which the plan's
  non-goals forbid. The glyphs in the terminal mock are the CLI's own, not icons.

`/ak-ui-ux-pro-max`'s colour search suggested a slate-and-green developer-tool palette. The teal
primary and the green status scale agree with it; the flat "Trust blue + orange CTA" SaaS palette
it also offered does not, because this is a terminal product and the accent is the logo.

## How the page reads at 360 px

The site's convention is desktop first, narrowed with `max-*` breakpoints. At 360 px the page is a
single column with the package's `wrapper` gutter, so the content column is 328 px wide.

- **Hero.** The name at `text-heading-3xl` fits on one line. The value line is two lines. The
  install command is a mono surface that scrolls **inside itself** (`overflow-x-auto`,
  `whitespace-nowrap`); the page itself never scrolls sideways. The Node floor badge wraps under
  the command rather than sitting beside it.
- **The three commands.** The grid is one column below `md`. Each card keeps its command in the
  same scrolling mono surface, so a long command never widens the card or the page.
- **Terminal.** The frame keeps its border and padding but drops its font one step, to
  `text-body-sm`. The transcript scrolls inside the frame horizontally; the page does not. The
  transcript is a `<pre>` of real text, so it is selectable and searchable, and it is read by a
  screen reader as a block of code.
- **The harness.** The hook list is a definition list, not a table: the event name in mono on its
  own line, the matcher and the command under it. A two-column table cannot hold a command at
  328 px without either truncating it or scrolling the page.
- **Reference.** The `init` options are a definition list for the same reason. The exit codes are
  two lines of prose plus two inline codes, which fit.
- **Touch and focus.** Every interactive element is at least 44 px tall in both themes, the focus
  ring is the package's `ring-focus` on the skin's teal, and nothing depends on hover.
- **Type.** Body text stays at the package's `text-body-base` (16 px). Nothing on the page drops
  below `text-body-sm`, and the terminal is the only place that goes to `text-body-sm` in mono.

## Decisions needed from `planner-2`

1. **The palette.** Teal primary at hue 195° and a cool graphite neutral at hue 250°, on top of the
   package's inherited secondary and status scales. The contract already passes. The leaning: take
   it as it is. The alternative is the package's plum default, which is also contract-clean and
   costs nothing — but then the site has no palette of its own and the "host skin" work in Phase 2
   has no reason to exist.
2. **The section list.** Eight sections in the plan's order, with the hero and the install section
   both carrying the install command, and no logo wall, no testimonials and no comparison table.
   The leaning: take it. The plan forbids inventing social proof, so those sections are the only
   ones the quality floor rules out.
3. **The terminal mock shows `doctor`.** The `init --dry-run` transcript is fifty-two file paths
   and would read as noise. The leaning: take it, and let the `init` card carry the
   `52 to create` summary instead.
4. **The skin is the page's default.** The package resolves `data-skin` from the `jds-skin` cookie
   only, so the site has to write that cookie before the first paint for its own skin to be the
   default rather than the platform's plum. This is a Phase 2 implementation rule, not a design
   decision, and it is recorded here because it is the one thing that can produce a palette flash.
