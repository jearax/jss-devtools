---
phase: 1
title: "Version check"
status: pending
priority: P3
effort: 1h
dependencies: []
---

# Phase 1: Version check

## Context

- The manifest `.harness/core/manifest.json` records `version`, the CLI version that installed or
  last updated the harness (`src/modules/harness/services/install-plan.service.ts`, `manifestOf`).
- `compareHarnessVersions` in `src/modules/harness/services/update-release.service.ts` already
  orders two versions; `harness update` uses it to refuse a downgrade
  (`update-preflight.service.ts`, "refusing downgrade"). Reuse it; do not write a second comparison.
- The running CLI's version is `PACKAGE.version` (`src/core/constants/package.constant.ts`).
- Decision 0033: "A new check joins a `health-*.service.ts` file and the `--help` list together."

## Behaviour

| Manifest vs CLI | Where              | Level | Text                                                                                              |
| --------------- | ------------------ | ----- | ------------------------------------------------------------------------------------------------- |
| equal           | summary row        | ok    | `Version  <v>`                                                                                    |
| older           | issue              | warn  | `harness <installed> installed, CLI is <cli>`, next step `run jss-devtools harness update`        |
| newer           | issue              | warn  | `installed by CLI <installed>, this CLI is <cli>`, next step the install command line             |
| no manifest     | nothing new        | –     | the existing missing-manifest error already covers it                                             |

- Both mismatch cases are warnings: the hooks still run, so the exit code stays 0.
- The install command line is `INSTALL_COMMAND_LINE` in `update-release.service.ts`; reuse it.
- Label `Version` for the summary row and for both issues.

## Files

- `src/modules/harness/services/health-update.service.ts`: add `versionIssue(manifest)` returning
  `HealthIssue | null`, exported beside the others.
- `src/commands/harness/services/doctor.service.ts`: call it in `collectHealth`; add the summary row
  when the versions are equal.
- `src/commands/harness/harness.command.ts`: name the version check in `DOCTOR_CHECKS`.
- `tests/harness-doctor.test.ts`: equal, older and newer, each by rewriting `version` in the
  fixture's manifest; assert the text and exit code 0.

## Acceptance

- The three cases print as in the table; exit code 0 in all three.
- `harness doctor --help` names the version check.
- No new version comparison function.

## Risk and rollback

Read-only check; revert the commit.
