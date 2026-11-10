---
title: Redesign the site as a CLI product landing with mini docs
status: completed
created: 2026-11-10
---

# Redesign the site as a CLI product landing with mini docs

## Outcome

The site reads like the landing of a serious CLI tool, on the level of bun.sh, claude.com/product/claude-code
and herdr.dev: in ten seconds a visitor knows what `jss-devtools` does, sees it run, and has the install
command copied. The docs stay short ("mini docs") and look like the same product.

> "UI theo tôi thấy cũng còn khá xấu, chỉ tạm thôi, dùng các skill mạnh nhất về UI, tham khảo các ông lớn
> về UI/UX của 1 landing web site giới thiệu CLI tool, bản ngắn gọn mini docs thôi." (user, 2026-11-10)

> "Full delegate for you, full permission and decision UI/UX" (user, 2026-11-10)

> "Styling và UI for delegate, nhưng điều kiện tiên quyết là vẫn phải giữ vững design system, phải dùng
> theo design system về token, theme,..." (user, 2026-11-10)

Planner holds the UI/UX decisions under that delegation. The brief below is the decision; the cooker
executes it and raises a conflict instead of changing direction.

## Design brief (fixed across iterations)

```text
Register:  Brand
Scene:     A JavaScript developer who works with a coding agent, on a laptop in a dark editor, often at night,
           deciding in under a minute whether this CLI is worth installing.
Direction: Terminal-native editorial, because the product is a CLI whose proof is its own output: show the
           real output, frame it with hairlines, and let type and one accent do the rest.
Color:     Restrained, dark-first; graphite neutrals of the jss-devtools skin, signal-teal accent on at most
           ~10% of any view (primary button, prompt glyph, active tab marker, links, focus).
           Semantic tokens only (bg-*, text-*, border-*), never palette steps or alpha in place of a token.
Type:      Be Vietnam Pro (display, tight tracking) + Cascadia Code (every command, path, label, eyebrow);
           contrast axis: humanist grotesque vs monospace.
Signature: The replay terminal: tabs `init` / `doctor` / `harness` replaying the CLI's real transcripts,
           with a replay control. It is the hero's right half.
Dials:     variance 6, motion 4, density 4
```

References studied (screenshots taken 2026-11-10): bun.sh (split hero, install block with copy and
"then follow the quickstart", hairline page frame, mono caps eyebrows), claude.com/product/claude-code
(product UI as hero proof, quiet chrome), herdr.dev (huge two-tone headline, one primary action),
ghostty.org (terminal window as the whole story). Take patterns, never their assets, logos or copy.

## Page architecture

Home, top to bottom:

1. **Header**: logo and wordmark; GitHub; search (⌘K); theme toggle; a primary
   `Install` button that scrolls to and focuses the install block.
2. **Hero, split at ≥ lg, stacked below**: left: a mono eyebrow with the version read from the package
   facts (never typed by hand), the two-tone headline ("Set up the toolchain." / "Teach your agent.") at `text-display-3xl`, one
   sentence, the install block (`curl -fsSL …/install.sh | sh`, copy button, label "macOS & Linux · WSL"
   because native Windows is not supported), and "Then read the quickstart →". Right: the replay terminal.
3. **Three commands**: one hairline-framed band with three columns (not floating cards): mono command
   name, its one-line job, three facts from the docs, a link. Each column answers hover as a whole.
4. **What lands in your repository**: a file tree of what `init` writes (toolchain files and `.harness/`,
   taken from decisions 0030 and 0031, not invented) beside three short points on why the repository is
   the authority (memory, decisions, plans).
5. **Closing install band**: removed (user, 2026-11-10): "Bỏ section Install in one line. nhé". The
   page ends at the repository band. It is still the end of the page: there is no footer.

A hairline runs between bands. The vertical hairlines at the `wrapper` edges were removed (user,
2026-11-10): "2 border inline của Hero__inner--nR4Yj là không cần thiết". No drop shadows on surfaces; one soft teal glow is
allowed behind the replay terminal, built from colour tokens only.

Docs (mini): the same header and frame; sidebar with mono group labels and one selected-item pattern;
reading column with code blocks that are terminal surfaces in both themes; a table of contents with an
active marker; previous and next as two bordered links. Content stays as it is except where a page
needs a heading or a link to fit this structure.

## Decisions taken under the delegation

- **The design system is the precondition, not a default.** Every colour, size, space, radius, shadow,
  duration, z-index and theme value comes from `@jjuidev/styles` tokens, text roles and the theme runtime
  (and the site skin's scale values). No raw colour, no arbitrary value, no local token that stands in for
  a missing design-system one, no role above `3xl` (design system decision 0053). The hero headline uses
  `text-display-3xl`; its weight comes from the role, two-tone colour tokens, tracking the role allows,
  and the layout. When the brief cannot be reached inside the system, stop and report the gap; do not
  work around it.
- Dark is designed first and reviewed first; light must be equally finished. The theme default stays as
  it is (follows the system).
- No "used by" logos, star counts, benchmarks or testimonials: nothing exists to show honestly.

## Constraints

- **No footer** on home or docs; remove `SiteFooter` and its test.

  > "Không cần Footer" (user, 2026-11-10)

- **Responsive is desktop-first** (design system 0021, 0050, styling conventions R1 to R5): unprefixed
  utilities are the desktop layout; narrower widths use `max-2xl:` … `max-sm:` only, never `sm:` `md:`
  `lg:` `xl:` `2xl:` for layout; plain CSS writes `@media (width < 40rem)`-style rem queries, never px or
  `>=`; container queries use `@max-*`. In a CSS module, one `@apply` for the base, then one `@apply`
  per breakpoint that changes something, widest first. The site currently has 42 min-width variants and
  a `(width < 640px)` query: all of them are rewritten, not only the ones the redesign touches.

  > "Cách responsive sai conventions, xem design-system repo." (user, 2026-11-10)

- Design system conventions (`.harness/docs/site/conventions/` and the design system's own docs) win,
  with no exception. `wrapper` for page width, `focus-ring`, z-layers, durations,
  touch targets, one `@apply` per breakpoint, semantic class names.
- Real content only: transcripts from `site/src/constants/transcripts.constant.ts`, facts from the docs
  and decisions. Copy may be tightened; no claim the CLI cannot back.
- No new dependency unless a phase cannot be done without it; then pinned exactly and justified in the
  report. Motion uses CSS first.
- Accessibility: contrast ≥ 4.5:1 body and ≥ 3:1 large text and UI, keyboard reachable replay controls
  and tabs (roving tabindex, arrow keys), `prefers-reduced-motion` shows the finished transcript at once,
  content visible without JavaScript animation.
- Dev server on port 5310 only; 5173 belongs to the user. No commit, no push.

## Phases

| #   | Phase                                                            | Status  |
| --- | ---------------------------------------------------------------- | ------- |
| 1   | [Hero prototype and the review gate](./phase-01-hero-prototype.md) | done    |
| 2   | [The rest of the landing](./phase-02-landing-bands.md)           | done    |
| 3   | [Mini docs](./phase-03-mini-docs.md)                             | done    |
| 4   | [Critique loop and proof](./phase-04-critique-and-proof.md)      | done    |

Phase 1 stops for planner review. Phases 2 to 4 start only after planner approves the hero.

## Acceptance criteria

- The four site checks pass; `node dist/cli.mjs harness doctor` is healthy.
- `render-check.mjs` from `/ak-frontend-design` reports no error at 375, 768 and 1440; the rubric of its
  `references/self-critique-loop.md` scores every item at 2 or more, with the scores in the report.
- No element in `main` or `footer` has `scrollWidth > clientWidth` at 390 and 1440, and no text sits
  within 12px of the viewport edge on mobile.
- Every control has hover, press and focus-visible states with non-zero transitions; the replay terminal
  works by keyboard and under reduced motion.
- Screenshots after the last change: home and two docs pages, 1440 and 390, dark and light; the hero in
  motion (mid-replay) and finished; hover, press and focus states of the primary button, a command
  column, a tab, a sidebar item.

## Report

`.harness/plans/reports/cooker-261110-<HHMM>-site-landing-redesign.md`: commands with real output, the
rubric scores, screenshot paths, decisions, anything not met.
