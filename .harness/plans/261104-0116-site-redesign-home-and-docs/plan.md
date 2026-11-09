---
title: "Redesign the site: a bold Home and a Docs section, with a router and a menu"
description: "Replace the document-style single page with a Home landing on the level of harness.io, agentkit.best and claude.com/product/claude-code, plus a Docs area with a sidebar, routed with react-router."
status: completed
priority: P1
branch: main
tags: [site, frontend, design-system, router]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Redesign the site: a bold Home and a Docs section

Builds on plan [261104-0016](../261104-0016-site-rich-landing-page/plan.md) (built, not committed).
Its **content** stays: the CLI fact table, the constants, the host skin, the cookie fix and the
review fixes. Its **visual direction is rejected** by the user and replaced here. Site conventions:
[docs/site/conventions/](../../docs/site/conventions/README.md).

## Decisions taken with the user (2026-11-04, do not reopen)

| Topic | Decision |
| --- | --- |
| Verdict on 0016 | "UI không như tôi expect, xấu ác, đơn giản, đơn điệu quá" — too plain, too monotonous |
| References | https://www.harness.io/, https://agentkit.best/, https://claude.com/product/claude-code — "tham khảo từ các ông lớn"; and https://herdr.dev/ — "cũng đẹp" (closest in kind: a terminal tool's own site) |
| Structure | "chia routers, có menu, docs": **Home + Docs**. Header menu: Home, Docs, GitHub. Docs has a sidebar: Getting started, Install, `init`, `doctor`, `harness`, Reference (options, presets that work, exit codes) |
| Docs source | React components plus constants, written from the CLI's real output. No Markdown/MDX pipeline |
| Code and terminal | "Có code block, terminal các kiểu": first-class code blocks and terminal windows across Home and Docs (see below) |
| Language, skin | Still English only, still the `jss-devtools` host skin (palette may be retuned in Phase 1 if the new direction needs it; it must still pass `jds skin check`) |

## What made 0016 plain, and what is now allowed

0016 ran on dials variance 4, motion 2, "restraint is the whole strategy", no icons, no gradients,
no motion, no web font. Those were the agent's choices, not the user's. For this plan:

| Lever | Now |
| --- | --- |
| Dials | Variance 7–8, motion 5–6, density 4–5. A landing that has presence, not a document |
| Layout | Full-bleed bands, a large display hero, a product visual above the fold, bento or split feature sections, contrasting dark/brand bands, a strong closing call to action |
| Motion | CSS only (transitions, keyframes, `@starting-style`, scroll-driven animation where supported), always behind `prefers-reduced-motion`. No animation library |
| Product visual | The terminal is the hero visual: real CLI output, typed or revealed in sequence, in a framed window. Real text, not an image |
| Icons | Allowed: `lucide-react`, pinned to the exact version the vendored DS tarball already resolves, so the bundle carries one copy |
| Fonts | Allowed if **self-hosted** (for example a `@fontsource-variable/*` package, pinned). No Google Fonts or any third-party CDN at runtime |
| Colour | Gradients, glows, tinted bands and brand art are allowed, built from the skin's scales and the semantic tokens in CSS Modules. Raw palette steps in a CSS Module need a one-line reason (the DS rule D2); never in JSX |

### Code blocks and terminals

Two site components, used everywhere a command, a file or an output appears:

- **`Terminal`**: a window frame (title bar with the three dots and a title such as the command or
  the folder), a prompt line, the output in the CLI's real glyphs (`┌ │ ◇ ✔ ✖ └`), colour for the
  glyph roles (success, warning, error, muted) from the semantic tokens. Variants: static, and
  animated (typed command, output revealed line by line) for the hero, with the reduced-motion
  version showing the final state. Optional tabs to switch between transcripts (for example
  `doctor`, `init --dry-run`, `harness doctor`), as a real tablist with keyboard support.
- **`CodeBlock`**: a file or shell snippet with a header (file name or language label), syntax
  colouring, optional highlighted lines, horizontal scroll inside the block, no ligatures. Used for
  the install command, `.claude/settings.json` hooks, `package.json` scripts the CLI writes, and
  every Docs example. Phase 1 picks the colouring approach and states its gzip cost: a small
  hand-written tokenizer for `sh`, `json` and `ts` only, or a highlighter library loaded only in the
  Docs chunk. Leaning: the small tokenizer, unless the library costs under 15 kB gzip in the Docs
  chunk.
- **No copy button**: still the user's own follow-up (DS `core` ships no `ButtonCopy`). Leave room
  for it in the header of both components.

Still forbidden: invented customers, logos, testimonials, numbers or features; a reimplemented DS
component (use `Button`, `ThemeToggle`, `Logo` from the package); raw Tailwind in JSX; commit or
push in this repo.

## Skills (required)

Load and follow, and name in the report which skill drove which choice:
`/ak-frontend-design` (art direction from the references, build, UX polish audit),
`/ak-ui-ux-pro-max` (palette, typography, layout, accessibility review), `/ak-design-system`
(tokens and the skin), `/ak-motion-design` (the hero and section motion, reduced-motion fallbacks),
`/ak-react-best-practices` (route splitting, bundle), `chrome-devtools-mcp:a11y-debugging`.
The site conventions and the DS contract still win; report a conflicting recommendation instead of
applying it.

## Phase 1: direction and a hero prototype (checkpoint)

1. Finish the open review fixes of 0016 first (the six points `planner-2` sent) if not done, and
   keep them.
2. Study the four references with `/ak-frontend-design` in the browser: screenshot each at 1280 px
   (above the fold and two more sections) into `plans/261104-0116-site-redesign-home-and-docs/refs/`,
   and write what each does well: hero composition, type scale, how the product is shown, section
   rhythm, colour bands, motion, nav, docs layout. Copy no code, text or asset.
3. Write `design-direction.md` in this plan folder: the Home section list with content (from the
   0016 fact table only), the Docs information architecture and page template (sidebar, on-page
   table of contents, prev/next), the header and mobile menu, the dials, the type choice (font or
   not, and why), the palette (keep or retune, with `jds skin check` output), the motion list with
   the reduced-motion version of each.
4. Build only the **header, the Home hero with its animated `Terminal`, and one `CodeBlock`** as a
   prototype on the real stack, and screenshot it
   in light and dark at 1280 px and 360 px into `plans/reports/`.
5. Prompt `planner-2` with the path of `design-direction.md` and **stop** until approved. The user
   reviews the hero screenshots before Phase 2.

## Phase 2: build (after approval)

1. **Router.** `react-router`, pinned exact, the same major as DS `main` uses (`^8.4.0` there).
   Routes: `/` (Home) and `/docs`, `/docs/<slug>` for each Docs page. The Docs area is a lazy
   route so Home does not ship it. A not-found view for unknown paths inside the app. Route paths
   and the sidebar order live in one constant.
2. **Layout.** A shared shell: header (Logo, nav, ThemeToggle, GitHub link; a mobile menu button
   with `aria-expanded` and a disclosure panel, since DS `core` ships no menu component), main,
   footer. Active link state. Skip link.
3. **Home.** The approved sections, built per the conventions.
4. **Docs.** One component per page under the conventions' folder anatomy; sidebar and on-page
   table of contents; prev/next links; code blocks with the ligature fix of 0016.
5. **nginx.** `docker/nginx.conf`: serve `index.html` for `/docs` and `/docs/` paths
   (`location ^~ /docs` with `try_files /index.html =404`), keep every other unknown path at 404.
   Update `ci/smoke-site-image.sh`: `/docs` and one docs page return 200 with the page, `/nope`
   still 404. Run the smoke test locally if Docker is available; otherwise say so.
6. **Tests.** Routing (Home, a Docs page, not-found), the menu (keyboard, `aria-expanded`), the
   sidebar active state, the CLI facts on the Docs pages, `tests/install.test.ts` still green.
7. **Audit.** `/ak-frontend-design` polish audit and the a11y pass on every route; fix inside scope.
8. **Docs.** A decision record for the router and the Docs area (supersedes the one-page parts of
   0037 and the "no router" non-goal of 0027); `docs/site/conventions/` (routes, pages folder);
   `docs/codebase-summary.md`; `docs/deployment-guide.md` for the nginx routes.

## Acceptance criteria

1. Home reads at the level of the references: a display hero with the product shown, visible
   section rhythm and colour bands, motion that respects reduced motion. Screenshots in both themes
   at 1280 and 360 px for `/`, `/docs` and one docs page.
2. `/`, `/docs`, `/docs/<slug>` work on reload in the built image (nginx), unknown top-level paths
   404, the smoke test covers it.
3. Every CLI fact on any page matches the 0016 fact table or a newer real capture, with its source.
4. Conventions hold; dependencies added are pinned and listed with why.
5. Site and root sequences green, output pasted:
   `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`,
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`.
6. JS and CSS gzip for the Home route and for the Docs chunk, before (137.44 kB / 8.75 kB) and after,
   with what caused the growth (font files listed separately).
7. Lighthouse accessibility 100 on `/` and on a docs page.

## Report

`plans/reports/cooker-2-261104-0116-site-redesign-home-and-docs.md`, then prompt `planner-2` with
its path.

## Constraints

- Raise a blocking question to `planner-2` at the step it blocks, one at a time, with your leaning.
- No commit or push in this repo; a push to `main` deploys.
- Do not restart or kill the dev server on port 5173 (pane `w13:p4`); ask `planner-2` if needed.
- Never `--force`, never `--no-verify`.
