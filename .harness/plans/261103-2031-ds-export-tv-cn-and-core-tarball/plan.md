---
title: "Export tv and cn from the design system, move the site to the core tarball"
description: "Add tv/cn to the public surface of @jjuidev/design-system on main and core, push both, re-pack the tarball from core, and drop the site's copied util plus Logo and ButtonCopy."
status: pending
priority: P2
branch: main
tags: [site, design-system, dependencies]
blockedBy: []
blocks: []
created: 2026-11-03
---

# Export `tv` and `cn` from the design system, move the site to the `core` tarball

Two repositories:

- **DS**: `the dokploy repository`, branches `main` (`c9e5c1d`) and
  `core` (`5d0a285`). Follow its own `AGENTS.md`, `docs/conventions/` and commit hooks.
- **Site**: `site/` in this repo. It builds on plans
  [261103-1629](../261103-1629-site-design-system-foundation/plan.md) and
  [261103-1833](../261103-1833-site-light-ui-with-design-system/plan.md), which are done but not
  committed. Do not revert them.

## Why

`cn` and `tv` carry a design system fact: the tailwind-merge config that knows `text-display-*`,
`text-heading-*`, `text-body-*` and `text-label-*` are typography roles. Without that config,
`cn('text-heading-3xl', 'text-muted')` drops the size class. Today the site keeps a copy of
`src/utils/tailwind-variants.util.ts`, so a role added in the DS would silently break the site's
merges. The fact must live only in the DS (this repo's CLAUDE.md, "One fact, one home").

## Decisions taken with the user (2026-11-03, do not reopen)

| Topic | Decision |
| --- | --- |
| Where the export goes | Both DS branches, `main` and `core` |
| Which branch the tarball comes from | `core` |
| `ButtonCopy` and `Logo` | `core` no longer exports them. Remove both from the site for now; the user builds them later |
| DS commits | Commit **and push** both DS branches |

Pushing DS `main` runs its CI and **deploys the DS site** (`.github/workflows/ci.yml`: image job and
`deploy` job on `main`). Pushing `core` runs CI only. Both pushes happen only after every DS check
below is green.

## Non-goals

- No other change to the DS public surface, and nothing else in the DS beyond what this plan lists.
- `tailwindAutoReference` stays copied in the site. It is a 20-line build plugin whose entry path is
  host-specific, and the user did not ask for it to move.
- No replacement copy button or wordmark in the site. The user will build them later.
- No commit or push in this repo (jss-devtools). A push to its `main` deploys.

## Part A: the design system

Do `core` first, then `main`. The main worktree has `main` checked out and is clean; use
`git switch` there, or a temporary `git worktree add`. Do not touch the existing
`worktree/silver-cloud-224f` worktree. Leave the main worktree on `main` at the end.

On each branch:

1. `src/lib/index.ts`: export `cn` and `tv` from `@/utils/tailwind-variants.util`, as named
   exports, in the file's existing style. If the util exports a type a host needs to call them
   (`CnOptions` comes from `tailwind-variants` itself, so probably none), export that type too.
2. If the branch has a test that pins the public export list or the consumer build
   (`test/library-consumers.e2e.ts`), extend it so a consumer imports `cn` and `tv` from the
   package and gets the semantic-role merge: `cn('text-heading-xl', 'text-default')` keeps both.
   If there is no such test, add the smallest test the DS testing conventions allow.
3. `README.md` "Use as a package": one line saying hosts import `cn` and `tv` from the package
   instead of copying the util. `CHANGELOG.md` `[Unreleased]` / `Added`: one entry.
4. Run the branch's own checks and paste the output: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm build:lib`, and the consumer e2e if the branch has it (`pnpm test:e2e`, or only the
   library-consumers spec if the full e2e needs servers the branch does not have).
5. Commit with a conventional message, for example `feat(lib): export tv and cn`. Let the hooks
   run; do not skip them. Push only when step 4 is green.

Then, on `core`: `pnpm build:lib && pnpm pack`, and copy the tarball to
`site/vendor/jjuidev-design-system-0.1.0.tgz` (`core` still says version `0.1.0`). Record the
`core` commit hash the tarball was built from in the report.

## Part B: the site

1. `pnpm --dir site install` so the lockfile picks up the new tarball. Report its integrity change.
2. Delete `site/src/utils/tailwind-variants.util.ts`. Import `cn` (and `tv` where used) from
   `@jjuidev/design-system` everywhere.
3. Remove `tailwind-variants` and `tailwind-merge` from `site/package.json` if nothing in `site/`
   imports them directly any more; they arrive through the package. If ESLint or TypeScript needs
   one of them directly, keep it and say why.
4. Remove `Logo` from `SiteHeader` and `ButtonCopy` from `InstallCommand`. The header keeps
   `ThemeToggle`; the install block shows the command only. Delete the constants that become
   unused (`INSTALL_COMMAND_SUBJECT`, `COPY_STATUS_LABELS`) and `InstallCommand.test.tsx`. Keep a
   check that the install command is shown (the Home test already has one).
5. Check that `ThemeToggle`, `ThemeProvider` and their props (`label`, `optionLabels`) behave the
   same on the `core` build. Report any difference instead of working around it.
6. Docs in this repo: `docs/decisions/0036-…` no longer has a copied util and no longer uses
   `ButtonCopy` or `Logo`; say the tarball comes from DS `core` and why. Update
   `docs/site/conventions/` where they say `cn` comes from `@/utils/…`, and `docs/codebase-summary.md`
   for the removed files.

## Acceptance criteria

1. `git show <branch>:src/lib/index.ts` exports `cn` and `tv` on both DS branches, both commits are
   on `origin`, and the DS checks of each branch were green before its push.
2. The vendored tarball's `dist/lib/index.js` exports `cn` and `tv`, and its `package.json` comes
   from `core`.
3. `site/src/utils/` is gone; `grep -r "tailwind-variants.util" site/src` finds nothing.
4. `grep -rn "ButtonCopy\|Logo" site/src` finds nothing.
5. Site: `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`.
   Root: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`. All green,
   with the output pasted.
6. Report JS and CSS gzip before (136.57 kB / 8.45 kB) and after.
7. The DS CI runs triggered by the two pushes: report their status (`gh run list` in the DS repo),
   including the deploy job on `main`.

## Report

Write `plans/reports/cooker-2-261103-2031-ds-export-tv-cn-and-core-tarball.md` and send its path to
`planner-2`.

## Constraints

- Raise a blocking question at the step it blocks, one at a time, with your leaning. In particular,
  stop and ask before pushing if a DS check fails, or if the branch history is not what this plan
  says (`main` at `c9e5c1d`, `core` at `5d0a285`, or either branch behind `origin`).
- Never `--force` push and never `--no-verify`.
