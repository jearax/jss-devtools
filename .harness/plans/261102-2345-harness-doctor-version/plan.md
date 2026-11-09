---
title: "harness doctor reports the installed harness version"
description: "harness doctor compares the version in the manifest with the running CLI and says what to run when they differ."
status: completed
priority: P3
effort: 1h
branch: main
tags: [harness, doctor]
blockedBy: []
blocks: []
created: 2026-11-02
---

# harness doctor reports the installed harness version

## Outcome

`jss-devtools harness doctor` shows the harness version installed in the repository and warns when
it differs from the running CLI, with the command that fixes it. The user compared the doctor with
upstream `repository-harness`, whose `status` command reports installed against target version, and
chose to keep one command: "Thêm checker version" (user, 2026-11-02). The version comparison stays
by version number, not by file content: a release that changes no harness file still warns once,
and `harness update` clears it.

## Phases

| #   | Phase                                               | Depends on |
| --- | --------------------------------------------------- | ---------- |
| 1   | [Version check](./phase-01-version-check.md)        | none       |

## Acceptance

- Phase 1's Acceptance holds.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green.

## Non-goals

- A separate `harness status` command.
- A content (sha256) comparison between the release files and the manifest.
- The SessionStart hook: the hook bundle in the repository cannot know the CLI's version.
- `jss-devtools doctor` (the machine doctor).
