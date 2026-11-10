---
title: "Hero replay restores the tab loop; version 0.1.0"
description: "Clicking the Replay control must resume the autoplay tab loop after a manual tab pick, and the product version bumps 0.0.1 → 0.1.0 everywhere it is stated."
status: completed
priority: P1
effort: 2-3h
issue: none
branch: main
decision: none
created: 2026-11-10
---

# Plan: site replay loop fix + version 0.1.0

Repo: `/Users/tandm/Documents/jearax/npm/jss-devtools` (main, clean). Read the repo `CLAUDE.md`
and `.harness/MEMORY.md` first — this repo's harness rules apply, not the cs repo's.

## 1. Bug — Replay stops the tab loop

Symptom (user): after clicking the button `aria-label="Replay the transcript"`, the loop between
the hero terminal's tabs no longer works.

Code: `site/src/components/Terminal/Terminal.tsx`.

- `autoplay.current` starts `true`; `onRevealEnd` schedules the advance to the next tab only while
  `autoplay.current` is true.
- A manual tab pick (click at the `onClick`, or keyboard nav in `onTabKeyDown`) sets
  `autoplay.current = false` — intended: "the tabs play on in a loop until the reader picks one".
- The Replay control's `onClick` only does `setRun(run + 1)`. It never restores `autoplay.current`,
  so once the reader has picked a tab, every later Replay replays the current transcript while the
  loop stays dead forever.

Fix direction (prove it with a failing test first): a Replay is a "play again" action — it should
restore `autoplay.current = true` so the loop resumes from the current tab when its reveal ends.
Keep the existing semantics: a manual tab pick still wins (stops the loop) until the reader
explicitly replays.

Steps:

1. Write the failing browser-mode test in `site/src/pages/Home/components/Hero/Hero.test.tsx`
   (build on the existing replay tests around lines 72 and 118): pick a tab manually, click
   Replay, advance time / wait for the reveal end, assert the active tab moves to the next one.
   Add a second regression: click Replay while the loop is still autoplaying — the loop keeps
   advancing.
2. Apply the minimal fix in `Terminal.tsx`.
3. Check the reduced-motion path still shows the finished transcript and does not move.

## 2. Version 0.0.1 → 0.1.0

First stable feature release. Bump every place the *product* version is stated:

- `package.json` root `version` (the site hero and docs inject it at build via `__CLI_VERSION__`;
  the harness doctor also reads it).
- `site/src/constants/transcripts.constant.ts` line ~10: the installer transcript says
  `installed jss-devtools 0.0.1 to ~/.local/bin/jess-devtools` — re-capture or update to 0.1.0
  (and check that transcript against the real installer output shape; it also says
  `~/.local/bin/jss-devtools` while the real installer installs to `~/.jss-devtools/<version>/`
  with a shim — if the transcript line is stale versus `scripts/install.sh`, fix the line to
  match reality, not just the number).
- Grep the repo for remaining `0.0.1` after the bump: `grep -rn "0\.0\.1" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .`
  Exclusions that are NOT the product version: dependency pins (`@eslint/js 10.0.1`), the vendor
  tarball names `jjuidev-*-0.0.1.tgz` (design-system package versions), `pnpm-lock.yaml`.
- No git tag unless `git tag --list` shows the repo tags releases; report what you found.

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build
```

Manual: `pnpm --dir site dev` — hero loops; click a tab (loop stops); click Replay (loop
resumes); light + dark.

## Safety

- Site work only; the CLI `src/` is untouched.
- Tests run in Chromium (Vitest Browser Mode); `pnpm --dir site exec playwright install chromium`
  if missing.

## Risk & rollback

- Low. One interaction change in `Terminal.tsx`, version strings. Rollback: `git revert`.
- Watch for other `Terminal` consumers relying on a stopped loop after replay — the component is
  shared; grep usages before changing semantics.
