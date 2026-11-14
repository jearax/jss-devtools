---
phase: 1
title: "harness doctor verifies the hook files against the CLI"
status: pending
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: harness doctor verifies the hook files against the CLI

## Goal

`harness doctor` says whether `.harness/bin/hooks.mjs` and `.harness/bin/harness-hook.mjs` are the
files the running CLI ships, instead of trusting a hash stored in the same repository.

## Context

- `.claude/settings.json` runs `.harness/bin/harness-hook.mjs` (the shim), which imports
  `.harness/bin/hooks.mjs` (the bundle). Both are committed and both run on every session.
- `hookFileIssuesOf` in `src/modules/harness/services/health-install.service.ts` compares the
  bundle with `manifest.files[].sha256` and checks only that the shim exists. The manifest is
  committed too, so a change to both passes.
- The CLI already holds both texts: `harnessHookBundle`
  (`src/modules/harness/constants/hook-bundle.constant.ts`) and
  `hookShimTemplate(PACKAGE.nodeFloor)` (`src/modules/harness/templates/hook-shim.template.ts`).
- `decideWholeFile` in `update-decide.service.ts` always overwrites the bundle, but three-way
  merges the shim like any managed file. An edited shim equals neither its base nor the upstream
  text, so the merge keeps the edit.
- The bundle is built with `minify: false` (`tsdown.hooks.config.ts`); decision 0032 calls it
  minified, which the new decision in phase 5 corrects without editing 0032.

## Requirements

1. When `compareHarnessVersions(manifest.version, PACKAGE.version)` is 0, the live bundle must
   equal `harnessHookBundle` and the live shim must equal `hookShimTemplate(PACKAGE.nodeFloor)`,
   byte for byte. A difference is an error, label `Hook files`, detail
   `<path> is not the file this CLI ships: it was changed outside harness update`, next step
   `Read git log -p -- .harness/bin, then run jss-devtools harness update`.
2. When the versions differ, or the manifest cannot be read, or its version does not parse
   (phase 2), no byte comparison is possible. The result is a warning, label `Hook files`, detail
   `not verified: the harness is <x>, this CLI is <y>; the hook files are compared at the same version only`,
   with the next step of the existing `Version` row for that direction. The manifest-hash
   comparison stays for this case, so an accidental edit is still an error.
3. The summary gains a `Hook files` row with status `ok` and detail `match CLI <version>` only
   when requirement 1 passed. Without it, no row for the hook files is ever `ok`.
4. `decideWholeFile` treats both hook files alike: the upstream text always replaces the local
   one, reason `hook file restored`, with no merge and no conflict. The bundle's reason
   `hook bundle rebuilt` is replaced by it.
5. The two paths are named once, in `harness-paths.constant.ts` (`HOOK_SHIM_PATH` exists; add
   `HOOK_BUNDLE_PATH` and a list of both), and `health-install.service.ts`,
   `update-decide.service.ts` and `install-plan.service.ts` use them.
6. `DOCTOR_CHECKS` in `src/commands/harness/harness.command.ts` says the hook files are compared
   with the copy inside the running CLI.

## Files

- Modify: `src/modules/harness/services/health-install.service.ts`,
  `src/modules/harness/services/update-decide.service.ts`,
  `src/modules/harness/services/install-plan.service.ts`,
  `src/modules/harness/constants/harness-paths.constant.ts`,
  `src/commands/harness/services/doctor.service.ts` (the summary row),
  `src/commands/harness/harness.command.ts`.
- Tests: `tests/harness-doctor.test.ts`, `tests/harness-update.test.ts`.

## Tasks

- [ ] Write the failing tests first: a bundle edited together with its manifest hash passes
      today; an edited shim passes today and survives `harness update`.
- [ ] Add the path constants and replace the three local spellings.
- [ ] Rewrite `hookFileIssuesOf` for requirements 1 and 2, and return what the summary row needs.
- [ ] Add the summary row and the help text.
- [ ] Make `decideWholeFile` overwrite both hook files.
- [ ] Tests: fresh install shows the `ok` row; edited bundle with a matching manifest hash is an
      error; edited shim is an error and `harness update` restores it; a manifest version other
      than the CLI's gives the warning, exit 0 and no `ok` row; at different versions an edited
      bundle with a stale manifest hash is still an error.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`.
- In a temporary repository: `init -y`, append a line to `.harness/bin/hooks.mjs`, write its new
  sha256 into `.harness/core/manifest.json`; `harness doctor` exits 1 and names the file. Then
  `harness update -y` and `harness doctor` exits 0 with the `ok` row.

## Risk and rollback

- `health-install.service.ts` must stay out of the hook bundle's import graph: it would embed the
  bundle in itself. `tests/bundle.test.ts` (size budget) catches it.
- A development build has the version of the installed harness and another bundle, so in this
  repository `node <built cli> harness doctor` shows the error between a change to the hook source
  and the next `harness update`. That is the check working; phase 6 runs the update. No test and
  no CI job runs `harness doctor` on this repository.
- A changed manifest version skips the comparison: open point 1 of the plan.
- Rollback is reverting the phase commit.
