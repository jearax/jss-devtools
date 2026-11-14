---
phase: 2
title: "Symlink refusal and three defects"
status: done
priority: P1
effort: 1d
dependencies: []
---

# Phase 2: Symlink refusal and three defects

## Goal

No harness file is read or written through a symlink, and three defects the review found are
fixed, each with a test that fails first.

## Context

- `init` already exits 1 when `CLAUDE.md` or `.claude/settings.json` is a symlink
  (`src/commands/init/services/preflight.service.ts:164`, decision 0031). Nothing else checks.
- Reproduced on 0.1.0: with `.harness/MEMORY.md` a symlink to a file outside the repository, the
  SessionStart hook returned that file's text as `additionalContext`.
- `staysInside` in `src/modules/harness/services/path-safety.service.ts` resolves the path as
  text, so a managed folder that is a symlink passes.
- Seventeen files of `src/modules/harness/` call `node:fs` directly. The reads that matter are in
  `memory.service.ts`, `config.service.ts`, `decisions.service.ts`, `index-drift.service.ts`,
  `learned-skills.service.ts`, `skill-usage.service.ts`, `session-log.service.ts`,
  `hook-errors.service.ts`, `update-manifest.service.ts` (`readLiveFile`, `readBaseCopy`),
  `staging.service.ts` and `update-apply.service.ts`.

## Requirements

### Symlinks

1. `path-safety.service.ts` gains one function that answers whether a repository-relative path is
   safe, returning the reason when it is not. A path is safe when it passes the existing text
   check, no existing component below the repository root is a symlink (`lstatSync` each one), and
   the real path of its deepest existing ancestor lies inside the real path of the root. The root
   itself may be reached through a symlink (macOS `/tmp`) and must pass.
2. The hooks read and write harness files only through helpers built on it. An unsafe file is
   skipped as if it were missing. `sessionStartHook` checks the fixed harness paths once
   (`.harness`, `MEMORY.md`, `BOOTSTRAP.md`, `config.json`, `curator.json`, `decisions`, `docs`,
   `state`, `.claude/skills`) and adds one warning per unsafe path:
   `<path> is a symlink; the harness does not read or write through symlinks`. No hook throws
   because of an unsafe path.
3. A skill folder that is a symlink is never read, so it is never counted as a learned skill.
   This keeps a user's own linked skill folders working.
4. The memory guard (`post-tool-use.hook.ts`) keeps its real-path comparison and returns `null`
   when `.harness/MEMORY.md` is unsafe.
5. `harness update` checks every manifest path, every upstream path, the base copies and the
   staging folder in `runUpdatePreflight`, before the lock is taken, and exits 1 naming the path.
   `readLiveFile` and `readBaseCopy` refuse an unsafe path, so no caller can skip the check.
6. `init` checks every harness entry of its plan in preflight the same way; the two existing
   symlink checks become two cases of it.
7. `harness doctor` reports each symlink at or under `.harness/`, under a `harness-*` skill, and
   at `CLAUDE.md` or `.claude/settings.json` as an error, label `Symlinks`, and reads none of
   them.

### Defects

8. `readConfig` (`config.service.ts:53`) builds a fresh object with fresh groups on every call
   instead of spreading the shared `EMPTY_CONFIG`.
9. `compareHarnessVersions` (`update-release.service.ts`) compares `major.minor.patch`
   numerically, orders a prerelease below the same core without one, and follows semver
   precedence between two prereleases. It never returns `NaN`. A version that does not parse is
   reported, not compared: `harness doctor` shows an error on the `Manifest` row, and
   `harness update` exits 1 with `Restore .harness/core from git, then rerun`.
10. `settingsAction` (`update-settings.service.ts:10`) reports invalid JSON in
    `.claude/settings.json` as a `CliError` naming the file and the parse message, and
    `runUpdatePreflight` checks it before the lock, next to `parseConfigJson`.

## Files

- Modify: `src/modules/harness/services/path-safety.service.ts`, the eleven services listed in
  Context, `src/modules/harness/hooks/session-start.hook.ts`, `post-tool-use.hook.ts`,
  `stop.hook.ts`, `src/modules/harness/services/health-state.service.ts` or a new
  `health-symlinks.service.ts` (requirement 7), `update-preflight.service.ts`,
  `update-release.service.ts`, `health-update.service.ts`, `update-settings.service.ts`,
  `config.service.ts`, `src/commands/harness/services/doctor.service.ts`,
  `src/commands/harness/harness.command.ts` (`DOCTOR_CHECKS`),
  `src/commands/init/services/preflight.service.ts`.
- Tests: new `tests/harness-path-safety.test.ts`; cases in `tests/harness-hooks.test.ts`,
  `tests/harness-update.test.ts`, `tests/harness-update-units.test.ts`,
  `tests/harness-doctor.test.ts`, `tests/harness-config.test.ts`,
  `tests/init-preflight.service.test.ts`.

## Tasks

- [ ] Path-safety function and its tests: a plain file, a symlinked file, a file under a
      symlinked folder, a path that does not exist yet, a path with `..`, and a repository root
      that is itself behind a symlink.
- [ ] Read and write helpers on top of it; route the hook services through them.
- [ ] SessionStart warnings for unsafe paths; the memory guard case.
- [ ] `harness update` preflight and the two manifest readers; `init` preflight.
- [ ] The `Symlinks` check in `harness doctor` and its line in `DOCTOR_CHECKS`.
- [ ] Requirement 8, with a test: two `readConfig` calls in one process, the second on a config
      that lost a key, report the key missing.
- [ ] Requirement 9, with a table test: `0.2.0` against `0.2.0-beta.1`, `0.2.0-beta.2` against
      `0.2.0-beta.10`, `0.10.0` against `0.9.0`, and `v0.2.0` and `0.2.x` as unparsable.
- [ ] Requirement 10, with a test: `harness update` on a broken `.claude/settings.json` exits 1
      naming the file and leaves no lock behind.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`.
- Repeat the reproduction: the hook output holds no text from the outside file and one warning
  naming `.harness/MEMORY.md`.
- In a temporary repository with `.harness/docs` replaced by a symlink: `harness update` exits 1
  naming the path before any write, and `harness doctor` lists it under `Symlinks`.

## Risk and rollback

- A repository that links `.harness/` or a part of it on purpose stops working. That is the
  intended cost; the warning and the error say why, and phase 5 documents it.
- The check is `lstat` followed by the read: a link swapped in between is not caught. The threat
  here is repository content at rest, not a process racing the hook.
- The cost is a few `lstat` calls per hook run; `PostToolUse` already runs asynchronously.
- Rollback is reverting the phase commit.
