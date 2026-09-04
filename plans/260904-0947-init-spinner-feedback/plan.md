---
slug: init-spinner-feedback
status: in_progress
scope: jss-devtools init command UX (third-party end user)
---

# Init: spinner feedback for long-running ops

## Outcome

Replace silent waits during `jss-devtools init` with real-time progress so the
terminal stops feeling frozen under `bunx`/slow registry conditions.

## Constraints

- `ora` library (decision; user picked it explicitly)
- Reuse existing `logger` abstraction (no separate "progress vs log" split visible to caller)
- Suppress in `--json` mode and non-TTY environments (CI, pipe)
- Existing tests must continue to pass

## Non-goals

- Multi-step prompt UI (clack/ink) — out of scope
- Caching resolved specs (option 3 from earlier discussion) — separate concern
- Spinner for other commands (self/install/uninstall) — `init` only this round

## Acceptance criteria

1. `bunx jss-devtools init --framework node --dry-run` shows a spinner line in
   the first 100ms (no silence during resolve-specs).
2. TTY-only display: `init ... | cat` produces clean plain output (no ANSI).
3. `--json` output is single-line parseable JSON; no spinner interference.
4. Spinner labels visible per stage:
   - Preflight ("Checking project…", "Detecting package manager…", …)
   - Resolving package versions (per name + counter)
   - Installing dependencies
5. Existing 232 tests still pass; typecheck clean.

## Touchpoints

- `package.json` — `+ora`
- `src/utils/progress.ts` *(new)* — `withSpinner(label, fn)` + TTY / `--json` gating
- `src/utils/logger.ts` — possibly add `step()` passthrough (optional)
- `src/commands/init/install/resolve-specs.ts` — wrap fetchPackageMetadata loop
- `src/commands/init/utils/preflight.ts` — step markers
- `src/commands/init/run-init-flow.ts` — wrap `applyPlan`
- `tests/` — TTY/CI/`--json` matrix + regression on existing tests
