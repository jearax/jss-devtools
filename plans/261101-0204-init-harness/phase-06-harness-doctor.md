---
phase: 6
title: "harness doctor"
status: pending
priority: P2
effort: "1d"
dependencies: [5]
---

# Phase 6: harness doctor

## Goal

`jss-devtools harness doctor` checks the harness installed in the current repository and reports
what the hooks cannot see, above all that the hooks no longer run.

## Context

Added to this plan by the user on 2026-11-01 ("Đưa doctor vào plan này"). The prototype's
`src/commands/doctor-command.ts` is the reference for what it checked; its bundle and toolchain
checks do not carry. `jss-devtools doctor` checks the machine (commit `0a96a55`); this command
checks the repository, so the two stay apart.

## Output

A summary, then one line per issue, then exit 1 when any issue is an error, else 0. Rendered with
the existing check-list UI (`src/core/ui/check-list.ui.ts`) like `doctor`.

Summary: memory size against `memory.maxChars` and its entry count, decisions in force, learned
skills with their last use from `.harness/state/skill-usage.json` ("never" when absent).

| Check | Level | Shared with |
|---|---|---|
| No `.harness/core/manifest.json` | error, next step `jss-devtools init` | update preflight |
| Block markers missing in `CLAUDE.md`, or `CLAUDE.md` missing | error | |
| A harness hook entry missing from `.claude/settings.json`, or settings not valid JSON | error | install plan |
| `.harness/bin/harness-hook.mjs` or `hooks.mjs` missing, or `hooks.mjs` differs from the manifest hash | error, next step `jss-devtools harness update` | |
| `config.json` invalid, or a key missing | error / warn | SessionStart |
| Memory over its limits | error / warn | memory guard, SessionStart |
| Index drift in `decisions/`, and in `docs/` unless `ak-*` skills are present | warn | SessionStart |
| A decision without its required fields or without a quote of the user | warn | |
| A secret-shaped value in `.harness/` | error | failure log redaction |
| A learned skill with invalid frontmatter, or a name starting `ak-` or `harness-` | error | |
| A learned, unpinned skill unused for `curator.staleDays` | warn, "consider `harness-curate`" | |
| A managed file changed from its base | warn, "`harness update` will merge it" | update plan |
| A staged update in `.harness/update/` | warn, naming `--continue` and `--abort` | update preflight |
| With AgentKit on: uncommitted changes under `.claude/skills/ak-*` | warn, "`ak update` overwrites them" | |

Every check is a function in `src/modules/harness/` that returns issues; the SessionStart hook and
`update` call the same functions, so a rule is written once. The command only renders.

## Code

- `src/commands/harness/harness.command.ts` registers `doctor` beside `update`;
  `src/commands/harness/doctor.service.ts` only collects and orders the issues.
- `src/modules/harness/health.service.ts` (or one service per area if it grows past 200 lines),
  type `src/modules/harness/types/health-issue.type.ts`.
- No new flag. `--help` describes what it checks and the exit codes.

## Tests

`tests/harness-doctor.test.ts`, in temp repositories installed by phase 4's code: a fresh install
reports nothing and exits 0; each row of the table, introduced alone, reports exactly that issue at
that level; an error exits 1, warnings alone exit 0.

## Docs

`docs/system-architecture.md`, `docs/codebase-summary.md`, `docs/project-roadmap.md`; the decision
record for `harness update` (phase 5) gains a section for `doctor`, or a short record of its own.

## Validation

```bash
pnpm vitest run tests/harness-doctor.test.ts
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Report one real run in a scratch repository, healthy and with the hooks removed.

## Risk and rollback

A read-only command; revert the commit.
