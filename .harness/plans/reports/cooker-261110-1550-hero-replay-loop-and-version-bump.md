# Cooker Report — Hero replay restores the tab loop, version 0.1.0

Plan: [`261110-1533-site-replay-loop-and-version-bump`](../261110-1533-site-replay-loop-and-version-bump/plan.md)

## The bug

`Terminal.tsx` kept the tab loop in a ref, `autoplay`. A manual tab pick (click or keyboard) set
it to `false`, so the window stayed where the reader put it. The replay control only bumped the
run counter, so it never put the loop back: once a reader had picked a tab, every later replay
replayed the current transcript and the loop stayed dead.

Fix: the replay control sets `autoplay.current = true` before the run counter moves. A manual
pick still wins, until the reader explicitly replays.

## Proof

The failing test came first, in `site/src/pages/Home/components/Hero/Hero.test.tsx`:

- `resumes the tab loop when the reader replays after picking a tab` — picked the Claude Code
  tab, clicked Replay, ended the reveal, expected the window to move to the next tab. Before the
  fix it failed after 5.2 s with `aria-selected="false"`.
- `keeps the loop advancing when the reader replays while it plays` — the guard for the loop that
  was already running.
- `shows the finished transcript and stays put under reduced motion` — the line is fully shown
  (`opacity: 1`) and its `animation-name` is `none`, so nothing moves the window.

The site's browser tests run with `reducedMotion: 'reduce'` (`site/vitest.config.ts`), so the
reveal animation never ends on its own. The test ends the reveal the way the animated run does:
an `animationend` event on the element the terminal marks as the end of the transcript
(`[data-reveal-end]`, else the last revealed line).

Real browser, `pnpm --dir site dev`, Playwright, light and dark:

| Check                                   | Before the fix | After the fix |
| ---------------------------------------- | -------------- | ------------- |
| the loop plays on its own                | pass           | pass          |
| a manual pick stops the loop             | pass           | pass          |
| replay resumes the loop                  | **fail**       | pass          |

## The version bump

`package.json` moves to `0.1.0`. Every place the product states the version says the same:

| Place                                    | Before    | After                                  |
| ---------------------------------------- | --------- | -------------------------------------- |
| `package.json`                           | `0.0.1`   | `0.1.0`                                |
| the site eyebrow (`CLI_VERSION`)         | `0.0.1`   | `0.1.0` (injected at build)            |
| the installer transcript                 | `0.0.1` to `~/.local/bin/jss-devtools` | `0.1.0` to `~/.jss-devtools/0.1.0`     |
| the harness doctor transcript            | `0.0.1`   | `0.1.0`                                |
| the harness manifest (`.harness/core`)   | `0.0.1`   | `0.1.0`                                |

The installer line was stale in shape as well as in number: `scripts/install.sh` writes the bundle
to `~/.jss-devtools/<version>` and the shim to `~/.local/bin/jss-devtools`, and the message names
the versioned home. The line now says what the installer prints.

The harness manifest moved through the tool, not by hand: `jss-devtools harness update` (the
doctor asked for it) wrote the manifest version and the merge base of the `CLAUDE.md` block. It
also rewrote `.claude/settings.json` with spaces; Prettier put the tabs back, so that file is
unchanged in the diff.

Three assertions in `tests/harness-update.test.ts` state the CLI's current version and moved with
it. The remaining `0.0.1` in the repository is `@eslint/js 10.0.1`, the vendor tarball names and
the lockfile — not the product version.

## Decisions

Decision [0020](../../decisions/0020-version-0-0-1-during-development.md) held the version at
`0.0.1` through development. The user's instruction moves it, so [0044](../../decisions/0044-the-version-moves-to-0-1-0.md)
supersedes 0020 and quotes the user. The deploy trigger does not change: a green push to `main`
deploys ([0019](../../decisions/0019-artifact-lives-in-the-site-image.md)).

## Checks

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build      # 480 passed, 7 skipped
pnpm --dir site lint && typecheck && test && build          # 114 passed
```

## Not checked

- Nothing was pushed, and no tag was cut: `git tag --list` is empty, so the repository does not
  tag releases yet. A push to `main` deploys, so the push is the user's call.
- The site was checked in Chromium only (the browser the tests use), light and dark.
- `INSTALL_TRANSCRIPT` has no consumer in the site today, so the corrected installer line is
  documentation of the real output, not rendered text. Nothing else was changed about it.
