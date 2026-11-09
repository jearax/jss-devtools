---
id: 0033
title: harness doctor checks the repository, the machine doctor checks the machine
status: accepted
date: 2026-11-01
---

# 0033: harness doctor checks the repository, the machine doctor checks the machine

## Context

Phase 7 of the
[harness plan](../plans/261101-0204-init-harness/phase-07-harness-doctor.md) adds
`jss-devtools harness doctor`. The user added the phase on 2026-11-01 ("Đưa doctor vào plan này"):
the hooks see one session at a time, so nothing tells the user that the hooks no longer run — a
deleted shim, a lost settings entry, a corrupted manifest. The prototype had a doctor command too,
but its bundle and toolchain checks do not carry to this CLI.

## Decision

`jss-devtools harness doctor` is read-only and repository-scoped: it checks what the hooks cannot
see about themselves. It shares the existing `doctor` command name on purpose, and the two stay
apart by scope: `jss-devtools doctor` checks the machine (Node, git, package managers); this one
checks the harness installed in the current repository. No flag decides which one runs.

Every check is a function in `src/modules/harness/services/` that returns `HealthIssue[]`, so the
SessionStart hook and `harness update` call the same rules and a rule is written once; the command
only collects, orders and renders through the check-list UI. The table of checks, levels and next
steps is in the phase file. Exit codes: 0 healthy or warnings only, 1 on any error.

## Consequences

- The command never writes, so its rollback is reverting the commit.
- A new check joins a `health-*.service.ts` file and the `--help` list together.
- The old prototype's doctor command is now fully superseded; nothing is copied from it.
