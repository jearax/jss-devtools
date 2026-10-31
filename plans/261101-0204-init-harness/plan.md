---
title: "init installs the harness; harness update keeps it current"
description: "jss-devtools init installs the repository harness by default (--no-harness, --agent-kit), and jss-devtools harness update merges a newer harness into a repository, staging conflicts for --continue or --abort."
status: pending
priority: P1
effort: 6d
branch: main
tags: [init, harness, update, hooks]
blockedBy: []
blocks: []
created: 2026-11-01
---

# init installs the harness; harness update keeps it current

## Outcome

`jss-devtools init` (create or existing mode) writes the toolchain and the harness: the `CLAUDE.md`
block, `.harness/` (memory, bootstrap, decisions, docs, plans, templates, config, hook code,
manifest and base), three `harness-*` skills and four hooks in `.claude/settings.json`. The next
Claude Code session gets memory and decisions injected, is asked once about onboarding, and is asked
for a review after real work. `--no-harness` keeps today's behavior; `--agent-kit` also points ak
at `.harness/docs` and `.harness/plans`. After the user installs a newer CLI,
`jss-devtools harness update` brings every harness-owned file up to date, keeps the user's edits,
and on a conflict stages it and exits 1 naming `--continue` and `--abort`. The CLI never commits.

## Input

Every behavior was decided with the user and is quoted in
[the harness decision log](../261031-2325-init-harness-discussion/decision-log.md); the file list,
hooks, review rules and config keys are in the accepted
[design proposal](../261031-2325-init-harness-discussion/design-proposal.md). Read both first; this
plan does not restate the reasons. The prototype H0 (`/Users/tandm/Documents/jearax/dokploy/harness`)
and its installed result (`/Users/tandm/Desktop/test-harness`) are references for behavior, never
code to copy.

## Phases

| # | Phase | Depends on |
|---|---|---|
| 1 | [Layout: the modules layer and the hook entry](./phase-01-modules-layer-and-hook-entry.md) | none |
| 2 | [Harness file contents, reviewed by the user](./phase-02-harness-file-contents.md) | none |
| 3 | [Hooks and the embedded hook bundle](./phase-03-hooks-and-hook-bundle.md) | 1, 2 |
| 4 | [init installs the harness](./phase-04-init-installs-harness.md) | 2, 3 |
| 5 | [harness update](./phase-05-harness-update.md) | 4 |

The approved outline had init before hooks; they are swapped because init writes the hook bundle,
so the bundle must exist first. Scope is unchanged.

One commit per phase, conventional, on `main`, made by the planner on the Mac after review. The
first commit, before any code, holds this plan, the decision log, the design proposal and the
`open-questions.md` update. A push to `main` deploys the site image (see
[the deployment guide](../../docs/deployment-guide.md)); say so when reporting each push.

## Acceptance

- In an existing TypeScript repository without the harness, `jss-devtools init -y` exits 0 and
  writes every path of the design proposal's file table except `.harness/plans/README.md`'s
  AgentKit variant; a second run exits 1 on the owned configs, as today.
- `jss-devtools init --no-harness -y` writes exactly what today's `init -y` writes (the existing
  snapshot tests stay green unchanged except where they assert the default).
- `jss-devtools init --no-harness --agent-kit` exits 1 before any write, naming the conflict.
- `jss-devtools init --agent-kit -y` without `ak` on PATH exits 1 in preflight; with a stub `ak`
  it runs `ak init --docs-dir .harness/docs --plans-dir .harness/plans` and writes the AgentKit
  variants.
- Each hook, run from the installed `.harness/bin/harness-hook.mjs` with a recorded payload on
  stdin inside a temp repository, prints the expected JSON or nothing and exits 0, including on a
  corrupt `config.json`, a missing `.harness/state/` and Node below the floor (simulated).
- `harness update` against a repository installed by a previous build: no local edit, exit 0 and
  every managed file equals the new release; an edited untouched-upstream file, kept; both sides
  edited, exit 1 with staged copies under `.harness/update/` and the live file unchanged;
  `--continue` applies the resolution; `--abort` restores the state before the update. Seeds,
  learned skills and toolchain files are byte for byte unchanged in every case.
- Architecture rules green, including the new ones from phase 1, each with its negative fixture.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` green on Node 24.11.0, real output
  reported.

## Non-goals

- Installing the harness without the toolchain (open question H11).
- Any agent other than Claude Code; no registry, no placeholder.
- Installing or detecting AgentKit; `--agent-kit` only points ak at the folders.
- A background or model-run review (`prompt`/`agent` hooks, `claude -p`); review runs in the
  user's session.
- Committing, pushing or requiring a clean tree.
- A `harness doctor`, `harness status` or any other harness subcommand.

## Decisions this plan makes

Each is implied by the accepted decisions but was not said in words; the user reviews them with
this plan.

| Decision | Phase | Reason |
|---|---|---|
| The hook entry is `src/modules/harness/harness-hook.entry.ts`, a new `.entry.ts` role; only it may print and set the exit code inside a module | 1 | Hooks must print JSON and exit 0 on every error; `cli.ts` keeps failures non-zero. Accepted with the name chosen by the user (2026-11-01). |
| `cli.mjs` stays the only release artifact; the hook bundle's text is embedded in it at build | 3 | `install.sh` and `stage-release.mjs` ship one file with one checksum |
| A harness file that already exists at install is a conflict, exit 1, overwritten only with `-f` | 4 | Same rule as init's owned configs; no backup folder exists |
| `CLAUDE.md` or `.claude/settings.json` being a symlink exits 1 in preflight, accepted: "exit 1 cho cả 2" | 4 | Writing through a symlink edits a file outside the repository (H0's symlink guard) |
| `harness update` shows its plan and asks before writing, takes `-y` and `--dry-run` like init | 5 | Decision 0029 shares these flags; update writes files like init does |
| Skill usage is folded from session logs into `.harness/state/skill-usage.json` by the Stop hook | 3 | Session logs live seven days, archiving needs thirty; Stop runs once per turn, so the fold does not race the async hooks |

## Risks

| Risk | Mitigation |
|---|---|
| Embedding the hook bundle couples the two builds; a stale `hooks.mjs` ships | The build always rebuilds the hook bundle first; `tests/bundle.test.ts` asserts the embedded text equals the fresh bundle |
| Hooks slow every tool call | Counting hooks are `async`; the sync guard matches only edit tools; the hook bundle carries no commander, clack or colour code (size budget asserted) |
| A broken hook blocks a teammate's session | The shim exits 0 below the Node floor and on any error; errors are appended to `.harness/state/hook-errors.log` and warned at the next session start |
| Changing init's default breaks users who run plain `init` | `--help` states both defaults; the outro lists what the harness added |
| The three-way merge corrupts a file | Merge results are written only after every action is planned; conflicts never touch live files; `--abort` restores from the staged local copies |
