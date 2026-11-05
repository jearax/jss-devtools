---
title: "Landing revision round 6: docs value markers and terminal-authentic glyphs"
date: 2026-11-05
summary: Marked literal values in docs tables as inline code, recoloured the Terminal glyphs to terminal-authentic hues, added a TOC active marker, and renamed hero tabs to working-directory paths on refactor/site-landing
---

# Landing revision round 6: docs value markers and terminal-authentic glyphs

## What happened
- Round 6 of the landing revisions on `refactor/site-landing`, per `design-system/agentkit/plans/261105-0334-landing-revision-round6/`.
- Value markers: the constants (`reference`, `commands`, `harness`, `cli`, `Docs.constant`) backtick every literal a reader could type or open (`bun`, `pnpm`, `yarn`, `npm`, `node`, `react`, `rn`, `next`, `nest`, `git`, `.vscode/`, `.harness/docs`, `.harness/plans`, `ak`, `curl`, `wget`, `sha256sum`, `shasum`, `~/.local/bin`, `PATH`, hook matchers), and every table cell that carries them renders through `RichText` — Init/Reference options, GettingStarted/Reference summaries, Harness matcher/note/skill cells, Doctor check cells, Install requirements and env meanings, Reference exit-code meanings. The preset-state and harness-limit cells stayed prose: nothing typeable in them.
- Found a live defect while sweeping: `FeatureRow` rendered `COMMANDS.details` raw, so the harness card had been printing literal backticks on the home page since round 3. Fixed by rendering the card summary/details through `RichText` too.
- Glyph colours: `.glyph[data-tone]` dropped the site's `text-success/error/warning` tokens for per-theme CSS variables on `.root` (`--terminal-success/error/warning/comment`, dark overrides under `:global(html[data-theme='dark'])`), pinned against the Terminal surface (`bg-raised` = white in light, neutral-900 `#32363b` in dark) with every value at WCAG ≥ 4.6:1; glyphs are `font-bold` now. Light `#1a7f37`/`#cf222e`/`#9a6700`, dark `#3fb950`/`#ff7b72`/`#d29922`, comment `#57606a`/`#98a1ab`.
- Terminal tabs: `TerminalTab` and `Terminal` gained `comment?: string`; the comment renders as a `#`-prefixed line above the command (or above the transcript for the docs windows, which carry no command row), revealed with the terminal-reveal animation, never typed. Hero tabs became `~`, `~`, `~/projects/my-app` with the old labels' purposes as comments. The tab React key moved to `${index}-${label}` because two tabs now share `~`. Doctor/Init/Harness docs windows carry window-level comments.
- TOC active state: `.tocLink` is now a block, active turns `text-primary`, and an `::before` segment (2px, primary, `left:-17px`) sits on the ul's border line aligned to the active link — marker follows `activeId` with no new tracking code.
- Gate green (lint, typecheck, 96/96 tests, build). Tests: Terminal comment-prop cases; Hero tab assertions moved off `getByRole` name (two tabs share `~`; vitest-browser-react `RenderResult` has no `getAllByRole` — used `container.querySelectorAll` + `userEvent.click`); FeatureRow summary asserted de-backticked. Eye-checked both themes on the owner's dev server at :5174 (reused, not restarted): doctor dark/light (glyphs, comment, TOC marker), hero light (path tabs, comment, init transcript), Reference light (code chips in both tables).

## Decision
- The site rule "a utility never names a colour value" bends in the Terminal module on purpose, with the reason written next to the values: the reference is the CLI's real output, not the palette, and the owner asked for terminal-authentic hues.
- Docs windows (no tabs) get the comment as a window-level prop above the transcript instead of gaining a command row: their CodeBlocks and the transcripts' `┌` heads already carry the command, and inventing a command string per window would risk drift from the captured output.
- vitest-browser-react has no `getAllByRole` on `RenderResult`; multi-element queries go through `screen.container.querySelectorAll` and clicks through `userEvent` (the SearchPalette pattern).

## Next steps
- Owner review of 8209cc1 (nothing pushed). The `⚠` warning tone has no transcript that renders it — its colour is contrast-verified arithmetically but has never been eyeballed in a window; if a transcript ever ships a warning line, check it first.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
