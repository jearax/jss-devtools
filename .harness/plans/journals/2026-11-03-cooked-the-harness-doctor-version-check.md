---
title: Cooked the harness doctor version check
date: 2026-11-03
summary: "harness doctor now reports the installed harness version and warns when it differs from the running CLI, with the command that fixes it."
---

# Cooked the harness doctor version check

## What happened

The [harness doctor version plan](../261102-2345-harness-doctor-version/plan.md) was cooked,
phase 1 only, as written. `jss-devtools harness doctor` now compares `version` in
`.harness/core/manifest.json` with the running CLI's `PACKAGE.version`:

- equal: a `Version  <v>` summary row;
- older: a warning `harness <installed> installed, CLI is <cli>`, next step
  `run jss-devtools harness update`;
- newer: a warning `installed by CLI <installed>, this CLI is <cli>`, next step the install
  command line.

Both mismatches are warnings, so the exit code stays 0. The report is
[minimax-cooker-261103-0004](../reports/minimax-cooker-261103-0004-harness-doctor-version-done.md).

## Findings

- **`harnessVersionState` was a second home for the comparison.** An intermediate version
  exported a `'equal' | 'older' | 'newer'` helper from `health-update.service.ts` so the command
  layer would not touch `compareHarnessVersions`. The phase's acceptance says no new version
  comparison function, and a state enum beside the existing comparator is exactly the second home
  the phase warned about. It was removed: the summary row calls `compareHarnessVersions` directly
  and the issue comes from the module's `versionIssue`.
- **The doctor command reads the manifest twice.** `summaryRows` and `collectHealth` are separate
  exported functions and the command calls both, so the version has to be reachable from the
  command layer. `collectHealth` now reads the manifest once through a local `manifestOf` helper;
  `summaryRows` reads it again for the summary row. The file is small and the doctor is
  read-only, so the second read costs nothing worth a signature change.
- **A warning row renders as a dim dash, not a cross.** `issueRows` maps a `warn` level to the
  `info` status, which the check list draws as `–`. The three new tests assert the text rather
  than the mark, because the mark already means "warn" everywhere else.

## Measurements

Gate on Node 24.22.0: lint clean, typecheck clean, `Test Files 28 passed | 1 skipped (29)`,
`Tests 441 passed | 7 skipped (448)`, build green (`dist/cli.mjs` 324.22 kB, gzip 84.58 kB).

The three doctor cases were run against a real `jss-devtools init` install with the manifest
version rewritten: equal prints `✔ Version    0.0.1`, older prints
`– Version    harness 0.0.0 installed, CLI is 0.0.1  run jss-devtools harness update`, newer
prints `– Version    installed by CLI 99.0.0, this CLI is 0.0.1  curl -fsSL
https://jss-devtools.jjuidev.com/install.sh | sh`. All three exit 0.

## Next steps

- Nothing was committed or pushed; the working tree holds the change for review.
- The `Version` summary row carries only the version string. It reads unambiguously beside the
  two mismatch rows, but the label could be taken for the CLI's version rather than the installed
  one. The phase specified the text `Version  <v>`, so it was left as specified.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
