---
phase: 2
title: "Shared help helpers"
status: pending
priority: P3
effort: 1h
dependencies: [1]
---

# Phase 2: Shared help helpers

Start only when the planner confirms the harness robustness plan is committed.

- `examplesText` is the same function in `src/commands/init/init.command.ts` and
  `src/commands/harness/harness.command.ts`: move it to `src/core/ui/` and use it from both.
- The "apply command line" helper and `shellQuote` exist twice:
  `src/commands/init/services/shell-quote.service.ts` and `src/commands/harness/update.command.ts`.
  Keep one in `src/core/` (the architecture rules decide the folder and suffix). The init version
  quotes the empty string as `''`; the update copy drops it, so `harness update ""` prints a command
  line without the argument. The shared one keeps `''`.
- Tests: the existing help and command-line tests pass unchanged; one test that the update apply
  line keeps an empty argument as `''`.

## Acceptance

- No duplicate of either helper remains (`grep -rn "examplesText\|shellQuote =" src`).
- Full gate green.
