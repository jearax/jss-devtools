---
title: "Rich one-page landing for jss-devtools, in English, with the site's own skin"
description: "Turn the minimal landing into a content-rich single page in English, designed with the UI/UX skills, on the design system package, with a host skin made through defineSkin."
status: pending
priority: P2
branch: main
tags: [site, frontend, design-system, content]
blockedBy: []
blocks: []
created: 2026-11-04
---

# Rich one-page landing for jss-devtools

Builds on plans 261103-1629, 261103-1833, 261103-2031 and 261103-2318 (done, not committed; do not
revert them). Site conventions: [docs/site/conventions/](../../docs/site/conventions/README.md).
Design system: the `@jjuidev/design-system` package vendored from DS `core` `e8ec537`.

## Decisions taken with the user (2026-11-04, do not reopen)

The user gave these to `cooker-2` directly:

| Topic | Decision |
| --- | --- |
| Scope | A content-rich landing, **one page** |
| Language | **English only**; `lang="en"` |
| Stack | The site's own stack and the design system as it is: React SPA, Vite, Tailwind v4, CSS Modules, the package |
| Palette | The site's own palette as a **host skin** made with `defineSkin` from the package |
| Skills | UI/UX work runs through the UI/UX skills (below), not ad hoc |

## UI/UX skills (required)

Load and follow these before and while designing. Name in the report which skill drove which
choice.

- `/ak-frontend-design`: art direction for the page, the section design, and the UX polish audit
  of the built page at the end.
- `/ak-ui-ux-pro-max`: the palette for the skin, typography scale use, spacing, accessibility and
  the UI guideline review.
- `/ak-design-system`: how the skin's primitive steps map onto the package's semantic tokens.
- `/ak-react-best-practices`: rendering and bundle size of the new sections.
- `chrome-devtools-mcp:a11y-debugging` (or `/ak-web-testing`): the browser and accessibility
  checks.

The site's conventions and the design system's contract win over a skill's generic advice. When a
skill recommends something they forbid (raw palette steps in components, a new dependency, a
reimplemented DS component, web fonts), report it instead of applying it.

## Non-goals

- No new dependency, no web fonts, no router, no second page, no i18n.
- No copy button: DS `core` does not ship `ButtonCopy`, and the site does not reimplement DS
  components. The user builds it later.
- No change to the DS repo. If the page needs a DS component that `core` lacks, write it in the
  report as a follow-up.
- No change to the CLI under `src/`, no version bump, no change to nginx, Docker or CI unless a gate
  proves it necessary (then report it).
- No commit or push in this repo. A push to `main` deploys.
- Do not restart or kill the dev server on port 5173 (pane `w13:p4`). If it needs a restart, ask
  `planner-2`.

## Phase 1: direction (checkpoint)

1. Read `docs/project-overview-pdr.md`, decision 0036, `docs/site/conventions/`, and `site/src/`.
2. Collect the real CLI facts: `node dist/cli.mjs --help`, `init --help`, `doctor --help`,
   `harness --help` and its subcommands, the presets, the exit codes (`src/core/`), the Node floor
   (`engines.node`), the license (MIT). The page states only these. No invented feature or flag.
3. With `/ak-frontend-design`, look at 4 to 6 landing pages of CLI tools (bun, deno, pnpm, turbo,
   vite, …) for their **section structure** and what a reader needs. Copy no layout, code or colour.
4. With `/ak-ui-ux-pro-max` and `/ak-design-system`, pick the skin's palette direction and check it
   can pass the contract (step 6 of phase 2).
5. Write `plans/261104-0016-site-rich-landing-page/design-direction.md`: the section list in order
   with the content of each (from step 2), the art direction in a few lines, the palette (scales and
   steps), and how the page reads at 360 px. Then **prompt `planner-2` with its path and stop** until
   `planner-2` approves it.

## Phase 2: build (after approval)

1. **Skin.** One host file `site/src/skins/<id>.css` (follow the folder conventions) that declares
   only `:root[data-skin='<id>'] { --color-<scale>-<step>: … }`. `defineSkin({ id, label })` passed
   to `ThemeProvider` with the platform skins. Namespaced id matching `/^[a-z][a-z0-9-]*$/`, no
   clash with platform ids. The `Register` module augmentation so `setSkin` is typed. The page uses
   this skin by default; whether a skin picker is shown is out of scope (none).
2. **First paint.** The pre-paint script in `site/index.html` sets `data-skin` as well as
   `data-theme`, mirroring the provider's rule, so there is no frame in the platform palette.
3. **Sections**, one folder each under `pages/Home/components/`, per the conventions: hero (name,
   value line, install call to action), install (the command and the Node floor), the three commands
   (`init`, `doctor`, `harness`: what it does, a real command, real output), a terminal mock in
   HTML and CSS with real CLI output (text, not images), why it exists / the AI-agent workflow
   (`harness`), reference (the `init` options, presets, exit codes, links to the repo docs),
   requirements, footer (source, license). Every displayed value lives in `Home.constant.ts` (split
   into `constants/` if it outgrows one file, per the conventions).
4. **Tests.** Behaviour tests for the new sections (real headings, the real commands, the links),
   a test that the skin is applied, and the root `tests/install.test.ts` still matching the Node
   floor.
5. **Skin contract.** `npx jds skin check site/src/skins/<id>.css` (the package's CLI) green for
   every theme. Paste the output.
6. **Audit.** `/ak-frontend-design` UX polish audit and an a11y pass on the built page; fix what
   they find inside the scope.
7. **Docs.** Decision 0036 and `docs/site/conventions/` where they say otherwise (language, skin,
   page structure); `docs/codebase-summary.md` for new folders. A new decision record for the host
   skin if decision 0036 cannot hold it in a paragraph.

## Acceptance criteria

1. The page is in English, one page, with the sections of the approved direction.
2. Every CLI fact on the page matches the CLI's real output; the report lists each with its source.
3. The skin is a host file plus `defineSkin`, passes `jds skin check`, and is set before first paint
   (reload in dark and light shows no palette flash).
4. Conventions hold: no raw palette steps or raw Tailwind in JSX, semantic tokens only, values in
   constants, `{...props}` last, `cn` from the package.
5. Light and dark at 1280 px and 360 px, no horizontal page scroll, screenshots under
   `plans/reports/`. Keyboard focus visible, one `<h1>`, landmarks, contrast AA.
6. Site: `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`.
   Root: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`. Output pasted.
7. JS and CSS gzip before (134.98 kB / 7.89 kB) and after, with what caused the growth.

## Report

Write `plans/reports/cooker-2-261104-0016-site-rich-landing-page.md` and prompt `planner-2` with its
path.

## Constraints

- Raise a blocking question to `planner-2` at the step it blocks, one at a time, with your leaning.
- Pin anything you install (nothing is expected).
- Never `--force` and never `--no-verify`.
