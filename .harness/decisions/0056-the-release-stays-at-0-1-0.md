---
id: 0056
title: The release stays at 0.1.0
status: Accepted
date: 2026-11-14
supersedes: none
---

# 0056: The release stays at 0.1.0

## Context

[0044](./0044-the-version-moves-to-0-1-0.md) moved the version to
0.1.0 for the first feature release. The hardening phases asked for a new version, but the user
decided against a bump: existing 0.1.0 installs keep comparing as the same version.

## Decision

- The release version stays `0.1.0`. No bump ships with the hardening.
- Consequence, measured: `harness doctor` against an existing 0.1.0 install reports the `Hook
files` error (`... is not the file this CLI ships: it was changed outside harness update`) until
  `jss-devtools harness update` runs; a same-version update migrates the hook files and the
  knowledge files, and the doctor reads `Hook files match CLI 0.1.0` afterwards. The upgrade docs
  say this plainly.
- Extends [0044](./0044-the-version-moves-to-0-1-0.md).

> "0.1.0" (user, 2026-11-14), asked whether the release bumps the version

## Options considered

| Option        | Consequence                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| Stay at 0.1.0 | No version churn; the upgrade path needs a same-version update and clear docs |
| Bump to 0.2.0 | Old installs read as older, but the user chose not to bump                    |

## Consequences

- Easier: the installer, the site and the docs keep one version number.
- Harder: version comparison cannot distinguish the hardening from the pre-hardening CLI; the
  Hook files row is the signal, and the docs explain the expected error.
- Enforced by: review only.
