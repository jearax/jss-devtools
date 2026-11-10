---
title: "Hero replay restores the tab loop; the version moves to 0.1.0"
date: 2026-11-10
summary: "Replay now puts the hero's tab loop back; the product version is 0.1.0 everywhere it is stated, with decision 0044 superseding 0020"
---

# Hero replay restores the tab loop; the version moves to 0.1.0

## What happened
- The hero's replay control replayed the current transcript but never restored the tab loop: the
  loop's `autoplay` ref stays `false` after a manual tab pick. One line in `Terminal.tsx` puts it
  back; a manual pick still wins until the reader replays.
- The regression test came first and failed for the right reason (the tab never became
  selected). The site's browser tests run with `reducedMotion: 'reduce'`, so the reveal animation
  never ends on its own — the test ends the reveal itself with an `animationend` event on the
  element the terminal marks as the transcript's end.
- The version moved from `0.0.1` to `0.1.0`: `package.json`, the site eyebrow (injected at
  build), the installer transcript and the harness doctor transcript. The installer line was
  stale in shape too: the installer prints the versioned home, not the bin dir.
- The repository's own harness was behind the CLI version, and the doctor said so; `jss-devtools
  harness update` wrote the manifest version and the merge base of the `CLAUDE.md` block.

## Decision
- Decision 0020 ("the version stays 0.0.1 through development") is superseded by 0044, which
  quotes the user and keeps the deploy trigger as it was: a green push to `main`.
- The version lives once, in `package.json`; the site reads it at build, so nothing states it
  twice.

## Next steps
- Nothing is pushed and no tag is cut: the repository has no tags, so a versioned release path
  is still open work.
- Three assertions in `tests/harness-update.test.ts` state the CLI version and move with it;
  the remaining `0.0.1` in the repository is a dependency pin, not the product version.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
