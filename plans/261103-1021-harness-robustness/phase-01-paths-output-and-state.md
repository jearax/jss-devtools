---
phase: 1
title: "Paths, output size and JSON state"
status: completed
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: Paths, output size and JSON state

## B1. Manifest paths stay inside the repository

`readManifest` (`src/modules/harness/services/update-manifest.service.ts`) parses
`.harness/core/manifest.json`, which is committed, and `update-apply.service.ts` turns each
`files[].path` into `join(cwd, path)` before `rmSync` / `writeFileSync`. A path `../x` deletes or
writes outside the repository; the staging paths (`staging.service.ts`, `join(root, folder,
input.path)` and `loadResolutions`) escape the same way.

- Validate once, where the manifest is read: every `files[].path` is relative, has no `..` segment,
  is not absolute, and `resolve(cwd, path)` stays under `resolve(cwd)`. A bad path throws
  `CliError` naming the path and the file, with the next step (restore `.harness/core/` from git).
- Apply the same check where staging joins a path, so no caller can bypass it.
- Tests: a manifest with `../escaped.txt`, with `/etc/x`, with `a/../../x`; `harness update`
  exits 1, names the path, and the file outside the repository is untouched.

## B3, B6. Output over 1 MiB

`runCommand` (`src/core/utils/run-command.util.ts`) calls `execFile` with Node's default
`maxBuffer` (1 MiB). Over it, the output is cut and the error code is not a number.

- Give the buffered path a `maxBuffer` of 64 MiB (a named constant).
- `gitMergeFile` / `three-way-merge.service.ts`: a result whose code is not 0 and not a conflict
  count (git's exit code is the number of conflicts, capped at 127; a negative or non-numeric code
  is a failure) throws a `CliError` instead of reporting "conflicted".
- `gitWorktreeChanges` / `fingerprint.service.ts`: when git fails, the fingerprint must not read as
  "unchanged". Make the Stop hook treat a failed fingerprint as a changed tree, so the review is
  asked, and log the failure through `logHookError`.
- Tests: a merge of a file over 1 MiB with edits on both sides keeps both edits (or reports a real
  conflict with markers); a fingerprint failure leads the Stop hook to ask for the review.

## B8. `skill-usage.json`

`foldSkillUsage` (`skill-usage.service.ts`) parses without a guard and writes in place.

- Write through a temp file in the same folder and `renameSync`.
- A parse error reads as an empty map and is logged through `logHookError`; the next write
  replaces the corrupt file.
- Apply the same write to the other JSON state the hooks rewrite, if any shares the pattern.
- Test: a truncated `skill-usage.json`; the Stop hook still runs its review logic and the file is
  valid JSON afterwards.

## B9. `session.json`

`loadUpdateSession` (`staging.service.ts`) is a bare `JSON.parse`; `harness update --abort`
crashes on a corrupt session and cannot remove it.

- A corrupt session throws a `CliError` that names the file and suggests `--abort`.
- `--abort` removes `.harness/update/` whether or not the session parses.
- Test: a corrupt `session.json`; `--abort` exits 0 and the folder is gone; `harness update` and
  `--continue` exit 1 with the message.

## Acceptance

- Each test above fails on the current code and passes after the fix.
- Narrow run: `pnpm vitest run tests/harness-update*.test.ts tests/harness-hooks.test.ts`, then the
  full gate.
