---
title: "Light landing UI on the design system"
description: "Split the Home page into small components and add a light layout (header with Logo and ThemeToggle, install block with ButtonCopy, requirements list, footer) to prove the design system works in site/."
status: pending
priority: P2
branch: main
tags: [frontend, site, design-system]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Light landing UI on the design system

Builds on [261103-1629-site-design-system-foundation](../261103-1629-site-design-system-foundation/plan.md)
(done, not committed yet). Source repo for reference, read-only:
`the dokploy repository` (DS below). Site conventions:
[docs/site/conventions/](../../docs/site/conventions/README.md).

## Outcome

The page shows that the design system applies cleanly in `site/`. It uses the package's components
and the semantic tokens, follows the site conventions, and looks right in light and dark. The user's
words: "Chủ yếu là apply design system á, xem có ổn hay không thôi."

Layout chosen by the user (2026-11-03):

```text
┌──────────────────────────────────────┐
│ jjuidev                     [◐ Theme]│  header: DS Logo + DS ThemeToggle
├──────────────────────────────────────┤
│ jss-devtools                         │  hero: heading + tagline
│ Công cụ dòng lệnh cho repo JS.       │
│ ┌──────────────────────────────────┐ │  install block + DS ButtonCopy
│ │ $ curl -fsSL …/install.sh | sh [⧉]│ │
│ └──────────────────────────────────┘ │
│ Yêu cầu                              │  requirements list
│  • Node >= 24.11.0                   │
│  • curl hoặc wget                    │
│  • ~/.local/bin trong PATH           │
├──────────────────────────────────────┤
│ Mã nguồn: GitHub                     │  footer
└──────────────────────────────────────┘
```

## Non-goals

- No new copy beyond what the page says today. The `PATH` note becomes a list item, and its wording
  may be shortened, but the facts stay the same: Node floor, `curl` or `wget`, `~/.local/bin/jss-devtools`
  and `PATH`, the GitHub URL.
- No feature cards, no router, no i18n, no `SkinToggle`, no web fonts, no images.
- No change to the design system repo, the tarball, the CLI, nginx or CI.
- No new dependency, except one the DS components need at runtime that is not already installed.
  Report it if that happens.

## Acceptance criteria

1. Components live under `site/src/pages/Home/components/<Name>/<Name>.tsx`, one folder each:
   `SiteHeader`, `Hero`, `InstallCommand`, `Requirements`, `SiteFooter`. `Home.tsx` only composes
   them. Each follows the site conventions: an arrow function with a default export, an exported
   `<Name>Props` (`interface … extends ComponentProps<'<tag>'>` for an element root), `{...props}`
   last, `cn(styles.root, className)`, `.root` and camelCase classes, no raw Tailwind in JSX.
2. Fixed values (the install command, the GitHub URL, the requirement items) live in
   `pages/Home/Home.constant.ts` as UPPER_SNAKE_CASE constants. No component hard-codes them.
3. The DS components come from `@jjuidev/design-system`: `Logo` in the header, `ThemeToggle` in the
   header (the provider is already in `main.tsx`), and `ButtonCopy` with `value` set to the install
   command. Nothing is reimplemented locally.
4. Styling uses only semantic tokens and roles (`bg-raised`, `text-muted`, `border-default`,
   `text-heading-*`, `text-body-*`, `text-label-*`), the `wrapper` page container, and desktop-first
   `max-*` breakpoints. No raw palette steps (`bg-neutral-100`), no `dark:` for colours, no
   `opacity` for state. See DS `src/pages/Home/constants/rules.constant.ts` (`AGENT_DOS`,
   `AGENT_DONTS`).
5. Semantics and accessibility: `<header>`, `<main>`, `<footer>`; one `<h1>`; the requirements list
   is a `<ul>`; `ThemeToggle` and `ButtonCopy` have accessible names in Vietnamese
   (`label` / `aria-label`, `subject` / `statusLabels` where the component supports them).
6. Tests follow DS testing rules T2–T4 and T12–T13:
   - `Home.test.tsx` keeps its three behaviour checks (heading, install command, GitHub link).
   - `InstallCommand.test.tsx`: clicking the copy button writes the install command to the
     clipboard (grant clipboard permission in the browser provider if Vitest needs it) and shows
     the copied state.
   - Presentation-only components (`Hero`, `Requirements`, `SiteFooter`) get one snapshot each or
     are covered by the Home test. Pick one way and say why.
   - The header is checked for an accessible theme toggle.
7. `tests/install.test.ts` (root) still proves the page shows the same Node floor as
   `engines.node`. Point it at wherever the floor now lives (`Home.constant.ts`) and adjust the
   expected text, because the constant holds `>=` and not the `&gt;=` entity.
8. The built page works in light and dark. Switching with `ThemeToggle` changes `data-theme` and
   writes the `jds-theme` cookie. After a reload, the pre-paint script and the provider agree, with
   no flash. The page is usable at 360 px wide with no horizontal page scroll; the install command
   scrolls inside its own block.
9. Report the JS and CSS gzip size before and after. `ButtonCopy` and `ThemeToggle` bring in
   `@base-ui/react` and `lucide-react` icons, so growth is expected. Measure it and say which
   package costs what.
10. `docs/site/conventions/` and `docs/codebase-summary.md` are updated only where the new tree or
    rules change what they say. No decision record, unless a convention has to change.

## Steps

1. Read the DS sources of `Logo`, `ThemeToggle` and `ButtonCopy` for their props
   (`src/components/Logo/`, `src/contexts/Theme/components/ThemeToggle/`,
   `src/components/ButtonCopy/`). Check that their types and exports are present in the vendored
   package (`dist/lib/types/lib/index.d.ts`).
2. Add `Home.constant.ts`, then the five components with their `styles.module.css`.
3. Recompose `Home.tsx`. Move the page-level layout (`wrapper`, vertical rhythm) into its module.
4. Tests (criterion 6), then the root test (criterion 7).
5. Check the build in a browser: light, dark, the toggle, the copy button, 360 px. Take screenshots.
6. Docs (criterion 10).

## Verification to report

Paste the real output:

```bash
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm format:check
```

Also report the bundle sizes (criterion 9), the browser checks and screenshot paths (criterion 8),
and anything about the DS components that did not work out of the box. That last point is the main
question of this task: whether the design system is fit for the site.

## Constraints

- Do not commit or push. A push to `main` deploys.
- Do not edit the DS repo. If a DS component misbehaves, report it with evidence instead of working
  around it in the site.
- Pin any new dependency to an exact version.
- Raise a blocking question at the step it blocks, one at a time, with your leaning.
