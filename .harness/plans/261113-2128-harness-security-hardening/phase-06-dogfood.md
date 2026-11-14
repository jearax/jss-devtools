---
phase: 6
title: "This repository takes the release"
status: pending
priority: P1
effort: 3h
dependencies: [5]
---

# Phase 6: This repository takes the release

## Goal

This repository runs the new harness, installed the way any repository takes it (decision 0040),
and `jss-devtools harness doctor` is green here: no home path and no e-mail address is left in a
tracked harness file.

## Context

- Before this phase the user has committed phases 1 to 5, pushed `main` (which deploys the
  installer) and reinstalled the CLI. `jss-devtools --version` shows the new version.
- This repository was installed by 0.1.0, so the update writes `knowledge.share: true` and it
  stays shared. Its decisions and plans are the public design record.
- 43 tracked files hold a real absolute home path: 41 under `.harness/plans/` and the decisions
  0001 and 0014. One report holds a package author's public e-mail address. The counts are from
  `3d8db75`; the content check gives the list of the day.
- `harness update` touches managed files only. Plans, reports, journals and decisions belong to
  the repository and are cleaned by hand, with the content check as the list.
- The history is not rewritten.

## Requirements

1. Use the installed CLI (`jss-devtools`), not the build in the working tree, for the update and
   for the final check.
2. `jss-devtools harness update --dry-run` first. The expected plan: the two hook files restored,
   the `harness-*` skills and the `CLAUDE.md` block updated, `knowledge.share: true` added to
   `.harness/config.json`, and no change to `.harness/.gitignore`. Anything else is read and
   understood before it is applied.
3. Every match of the content check is removed, by these rules:
   - a path inside this repository becomes repository-relative;
   - a path to a sibling repository becomes its name, such as `the design-system repository`;
   - any other home path becomes `~/…`;
   - an e-mail address is removed, or the line is marked `harness-doctor: allow` when the address
     is public and the sentence needs it.
4. The two decisions are changed by redaction only: the account name in the path goes, and no
   other word changes. `.harness/templates/decision.md` allows redaction as the one edit of an
   accepted decision. Ask the user before editing them; the alternative is the marker on those
   two lines.
5. The row of this plan in `.harness/plans/README.md` becomes `completed`.
6. The CLI commits nothing. The user commits and pushes.

## Files

- Changed by the update: `.harness/bin/hooks.mjs`, `.harness/bin/harness-hook.mjs`,
  `.harness/config.json`, `.harness/core/**`, `.claude/skills/harness-*/SKILL.md`, `CLAUDE.md`.
- Changed by hand: the files the content check names under `.harness/plans/` and
  `.harness/decisions/`, and `.harness/plans/README.md`.

## Tasks

- [ ] Confirm the installed version, then run the dry run and compare it with requirement 2.
- [ ] Apply the update and run `jss-devtools harness doctor`; record the count of files per rule.
- [ ] Ask the user about the two decisions (requirement 4).
- [ ] Clean the files, one folder at a time, rerunning the check until it is green.
- [ ] Set the plan's row to `completed` and report the diff summary for the user's commit.

## Verification

- `jss-devtools harness doctor` exits 0, with the rows `Hook files` (`match CLI <version>`),
  `Knowledge` (`shared through git`) and `Content check`.
- `git grep -nE '/(Users|home)/[A-Za-z0-9._-]+/' -- .harness CLAUDE.md .claude` prints only
  placeholder lines.
- `jss-devtools harness update --dry-run` reports nothing to change.
- `pnpm lint && pnpm typecheck && pnpm test`.

## Risk and rollback

- The cleaned values stay in the history of this repository. They are an account name and folder
  names, not credentials; the plan does not rewrite history.
- A conflict in the update is staged, not applied; resolve it with `harness update --continue`
  as decision 0032 describes, and never by editing `.harness/core/`.
- The working tree may hold uncommitted changes to the same knowledge files; run this phase in
  this working tree on `main` after the user has committed or stashed them. Do not create a
  separate checkout, clone or worktree for it.
- Rollback is `git checkout` of the changed files before the commit, and a revert after it.
