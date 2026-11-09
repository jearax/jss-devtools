---
title: Cooked the harness doctor version check
date: 2026-11-03
plan: ../261102-2345-harness-doctor-version/plan.md
phase: 1
summary: "harness doctor now reports the installed harness version and warns when it differs from the running CLI, with the command that fixes it."
---

# Cooked the harness doctor version check

## What happened

Phase 1 of the
[harness doctor version plan](../261102-2345-harness-doctor-version/plan.md) was implemented as
written. `jss-devtools harness doctor` now reads `version` from `.harness/core/manifest.json` and
compares it with the running CLI's `PACKAGE.version`:

| Manifest vs CLI | Where               | Level | Text                                                                                       |
| --------------- | ------------------- | ----- | ------------------------------------------------------------------------------------------ |
| equal           | summary row         | ok    | `Version  <v>`                                                                             |
| older           | issue               | warn  | `harness <installed> installed, CLI is <cli>`, next step `run jss-devtools harness update`   |
| newer           | issue               | warn  | `installed by CLI <installed>, this CLI is <cli>`, next step the install command line       |
| no manifest     | nothing new         | –     | the existing missing-manifest error already covers it                                       |

Both mismatch cases are warnings, so the exit code stays 0 and the hooks still run.

## Files

- `src/modules/harness/services/health-update.service.ts`: added `versionIssue(manifest)`, exported
  beside `managedDriftIssues` and `stagedUpdateIssue`. It reuses `compareHarnessVersions` and
  `INSTALL_COMMAND_LINE` from `update-release.service.ts`; no second comparison was written.
- `src/commands/harness/services/doctor.service.ts`: `collectHealth` calls `versionIssue`; the
  summary rows carry the `Version` row when the versions are equal. The manifest is now read once
  per collection through a local `manifestOf` helper.
- `src/commands/harness/harness.command.ts`: `DOCTOR_CHECKS` names the version check.
- `tests/harness-doctor.test.ts`: three new cases (equal, older, newer), each rewriting `version`
  in the fixture's manifest, plus a `--help` assertion for the new check.
- `docs/project-roadmap.md`: the doctor check list gained the version check.

## Findings

- **The summary row and the issue read the manifest in different places.** `summaryRows` and
  `collectHealth` are separate exported functions, and the doctor command calls both. The version
  comparison therefore had to be reachable from the command layer, not only from the module. The
  summary row calls `compareHarnessVersions` directly; the issue comes from the module. Both use
  the same function, so there is still one comparison in the codebase.
- **`harnessVersionState` was a second home for the comparison.** An intermediate version exported
  a `'equal' | 'older' | 'newer'` helper from `health-update.service.ts` to avoid the command layer
  touching the comparison. It was removed: the plan's acceptance says no new version comparison
  function, and a state enum beside `compareHarnessVersions` is exactly the second home the plan
  warned about.
- **A warning row renders as `-`, not `✖`.** `issueRows` maps a `warn` level to the `info` status,
  which the check list draws as a dim dash. The three new tests assert the text rather than the
  mark, because the mark already means "warn" everywhere else.

## Measurements

Gate on Node 24.22.0: lint clean, typecheck clean, `Test Files 28 passed | 1 skipped (29)`,
`Tests 441 passed | 7 skipped (448)`, build green (`dist/cli.mjs` 324.22 kB, gzip 84.58 kB).

The three doctor cases, run against a real `jss-devtools init` install with the manifest version
rewritten:

```
=== manifest version 0.0.1 ===
┌   jss-devtools harness doctor
│  ✔ Version    0.0.1
│  ✔ Memory     488/4800 chars, 5 entries
│  ✔ Decisions  0 decisions in force
│
└  Harness is healthy
exit=0

=== manifest version 0.0.0 ===
┌   jss-devtools harness doctor
│  ✔ Memory     488/4800 chars, 5 entries
│  ✔ Decisions  0 decisions in force
│  – Version    harness 0.0.0 installed, CLI is 0.0.1  run jss-devtools harness update
│
└  Harness is healthy
exit=0

=== manifest version 99.0.0 ===
┌   jss-devtools harness doctor
│  ✔ Memory     488/4800 chars, 5 entries
│  ✔ Decisions  0 decisions in force
│  – Version    installed by CLI 99.0.0, this CLI is 0.0.1  curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh
│
└  Harness is healthy
exit=0
```

## Unresolved

- The `Version` summary row carries only the version string, with no "matches the CLI" wording. It
  is unambiguous next to the two mismatch rows, but the label could be read as the CLI's version
  rather than the installed one. The phase specified the text `Version  <v>`, so it was left as
  specified.
- The doctor command lives outside the repository that owns the manifest, so `PACKAGE.version` is
  the version of the CLI actually running. That is the comparison the plan asked for; it is not the
  same as the version the harness was last updated against, which the manifest does not record
  separately.

## Not done

- Nothing was committed or pushed. The working tree holds the change for review.
