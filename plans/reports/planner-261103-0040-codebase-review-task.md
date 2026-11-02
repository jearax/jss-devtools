# Task: read-only codebase review

The user asked for a review of the whole codebase: "Review code xem codebase này có scale khi lớn
không, các CLI chuẩn chỉ chưa" (user, 2026-11-03), done by a cooker from a plan.

## Rules

- Read-only. Edit nothing under `src/`, `tests/`, `scripts/`, `ci/`, `docker/`, `docs/`. Write only
  the report below. Do not commit or push.
- Another cooker runs an eval against `dist/cli.mjs`. Do not run `pnpm build`; if you need the CLI,
  copy it first (`cp dist/cli.mjs /private/tmp/claude-501/review-cli.mjs`) and run the copy.
- Scratch repositories go under `/private/tmp/claude-501/`, never inside this repository.
- Report a finding only when you verified it: a `file:line`, the concrete input or state, and what
  goes wrong. A concern you could not verify goes under "Unverified". Do not report style the lint
  already enforces.
- A finding that would reverse a recorded decision in `docs/decisions/` names the decision and stays
  a question for the user, not a fix.

## Read first

`CLAUDE.md`, `docs/system-architecture.md`, `docs/code-standards.md`, `docs/codebase-summary.md`,
`docs/decisions/0024-core-and-command-layout.md`, `tests/support/architecture-rules.ts`, and the
decisions each area below names.

## Areas

### 1. CLI shell and core

`src/cli.ts`, `src/core/**`, `src/commands/doctor/**`, `scripts/install.sh`, `scripts/*.mjs`,
`tsdown.config.ts`, `package.json`.

- Exit codes: success, user error, internal error, commander usage error, unhandled rejection.
- Ctrl-C during a prompt and during a spinner; EPIPE when piped to `head`.
- stdout vs stderr; output when piped, not a TTY, `NO_COLOR`, `FORCE_COLOR`, `TERM=dumb`, `CI=1`.
- Non-interactive use: prompts when stdin is not a TTY, `-y`.
- `--help`, `--version`, unknown command, unknown option.
- File writes (atomicity), path handling. Windows is out of scope (decision 0030: WSL only).
- Installer: checksum verification and its failure modes.

### 2. `init`

`src/commands/init/**` and its tests. Decisions 0030 and 0031.

- A write or install that fails midway: state left behind, message, exit code, safe rerun.
- Existing-repository mode: user files never overwritten silently.
- `--dry-run` matches the real run; folder names with spaces or quotes reach the package manager
  safely.
- The largest files (`plan.service.ts`, `preflight.service.ts`, `init.command.ts`,
  `merge.service.ts`): where a second preset (`react`, `next`, …) would force changes.

### 3. Harness

`src/modules/harness/**`, `src/commands/harness/**` and their tests. Decisions 0031 to 0034.

- Hooks: any path that throws, hangs (stdin, git, large logs) or outlasts a Claude Code hook
  timeout; log growth; two sessions writing the same file.
- `harness update`: a crash between staging and apply, `--continue` / `--abort`, manifest and base
  copies staying consistent, CRLF, path traversal through manifest paths.
- Health rules shared by hooks, doctor and update: duplication, cost on SessionStart.
- `index-drift.service.ts`: the planner suspects a false positive when `decisions/README.md` holds a
  second table whose first column contains a year; confirm or refute it with a fixture.
- What would have to change to support a second agent runtime (name it; propose no abstraction).

### 4. Scaling across the codebase

How a new command is added (registration, duplication), coupling between commands and `core/`,
files over 200 lines that mix concerns, test suite runtime and the slowest suites.

## Report

`plans/reports/cooker-261103-0040-codebase-review.md`, under 200 lines:

1. Verdict in three sentences: standard-quality CLI or not, will it scale, the one thing to fix
   first.
2. Bugs, most severe first: `file:line`, scenario, suggested fix.
3. Scaling and maintainability, same shape.
4. What is already good, one short list.
5. Unverified.
6. Questions for the user, if any.

Reply with the report path and:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
```
