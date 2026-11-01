---
phase: 3
title: "Hooks and the embedded hook bundle"
status: completed
priority: P1
effort: "1.5d"
dependencies: [1, 2]
---

# Phase 3: Hooks and the embedded hook bundle

## Goal

Build the hook program from `src/modules/harness/`, bundle it on its own, embed its text in
`cli.mjs`, and prove every hook against a temp repository.

## Context

Decision log, section "Hooks: the prototype's shim, a hook-only bundle"; design proposal sections
2 and 3; the Claude Code hooks reference (`https://code.claude.com/docs/en/hooks`, read 2026-11-01).
H0's `src/hooks/*.ts` show the behavior to reach; its traps are in the comments quoted in the
design proposal (Read or `cat` of `SKILL.md` counts as a use; subagent events carry `agent_id`).

## Behavior

| Event (settings matcher) | Mode | Result |
|---|---|---|
| `SessionStart` (`startup\|resume\|clear\|compact`) | sync | `additionalContext`: `MEMORY.md` with its size, titles of decisions in force (skip `Superseded`), the onboarding notice while `BOOTSTRAP.md` exists, warnings: memory near its cap, index drift in `decisions/` and `docs/`, a missing or invalid `config.json` key with the repair command, entries in `hook-errors.log` since the last session |
| `PostToolUse` (`Write\|Edit\|MultiEdit`) | sync | Only when the file is `.harness/MEMORY.md` and breaks `memory.maxChars` or `memory.maxEntryChars`: `decision: "block"` with the reason |
| `PostToolUse` (none) | async | Append one event to `.harness/state/sessions/<session_id>.jsonl`: tool call (skipped when `agent_id` is set), skill used, onboarding asked |
| `PostToolUseFailure` (none) | async | Append the failure: tool, first line of `error`, secrets redacted; skip `is_interrupt` |
| `Stop` (none) | sync | Return at once when `stop_hook_active`. Fold the session log; update `skill-usage.json` (last use per learned skill). Then the first of: onboarding pending and not asked, review due (design proposal section 3), curation due; as `additionalContext` |

- Every outcome exits 0. An error is appended to `.harness/state/hook-errors.log` (one line, no
  secret) and the hook prints nothing.
- A missing config key turns its feature off and is warned; the hook never falls back to a
  default in code.
- When `.claude/skills/ak-*` exists, AgentKit owns `.harness/docs/` and `.harness/plans/`, so the
  index drift check skips `docs/`; `decisions/` is always checked.
- The last review in a session is the last use of `harness-review` in its session log. The last
  curation is shared by the team: when the session used `harness-curate`, the Stop hook writes
  `.harness/curator.json` (`{ "lastRun": "YYYY-MM-DD" }`, committed, not under `state/`), and
  curation is due from its date, or when memory is past the session-start warning ratio and the
  last curation is at least a day old. The ratio and the one day are constants, not config keys.
  No skill writes state of its own.
- Session logs older than seven days are removed by the Stop hook.
- The worktree fingerprint uses the git adapter; a git failure means "unknown", never "changed".

## Code

- `src/modules/harness/harness-hook.entry.ts`: reads stdin, dispatches on `hook_event_name`, prints the result JSON, sets
  `process.exitCode = 0`, catches everything.
- `src/modules/harness/hooks/<event>.hook.ts`: one handler per event, pure: payload and repository
  state in, result out. Shared reads (config, memory, decision index, session log) in
  `src/modules/harness/*.service.ts`.
- `src/modules/harness/templates/hook-shim.template.ts`: the shim text. It parses on any Node, exits
  0 silently below the floor read once from `engines.node` (as `scripts/package-info.mjs` does),
  then imports `./hooks.mjs`.
- `src/modules/harness/constants/`: the settings entries (event, matcher, `async`, timeout, the
  command `node "$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs"`), state paths. Each declared
  once.

## Build

- The hook bundle `hooks.mjs` is built from `src/modules/harness/harness-hook.entry.ts` before the CLI, then embedded in
  `cli.mjs` as text, so `install.sh` and `stage-release.mjs` keep shipping one file with one
  checksum. The cooker picks the mechanism (for example a second tsdown config run first, its text
  passed to the CLI build through `define`); `clean` must not delete the hook bundle the CLI build
  reads. Config files follow the export-naming rule (`export default tsdownHooksConfig`).
- `pnpm build` runs both in order; no other script changes its meaning.

## Tests

- `tests/harness-hooks.test.ts`: each event with a recorded payload, in a temp git repository
  holding a minimal `.harness/`: the JSON printed, the state written, exit 0. Cases: parallel
  `PostToolUse` calls lose no event; corrupt `config.json`; missing key; `stop_hook_active`;
  subagent payload; `Read` of a `SKILL.md`; failure with a secret in `error`.
- `tests/bundle.test.ts`: the embedded hook text equals `dist/hooks.mjs`; the hook bundle contains
  no `commander` or `@clack/prompts` and stays under a size budget the cooker measures and records
  (start: 40 KB); the shim plus bundle run from a sandbox with no `node_modules`.

## Docs

Now that the files exist: `CLAUDE.md` "Where things are" gains the `src/modules/` row and the
`src/modules/harness/harness-hook.entry.ts` row (the entry of the hook bundle Claude Code runs in an
installed repository); `docs/system-architecture.md` gains `modules/harness/` in the layout tree and
a paragraph under "Entry point" for the second entry; `docs/codebase-summary.md` lists the new
files.

## Validation

```bash
pnpm vitest run tests/harness-hooks.test.ts tests/bundle.test.ts tests/architecture.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Report the measured hook bundle size and one hook's wall time.

## Risk and rollback

Nothing installs the hooks until phase 4; revert the commit.
