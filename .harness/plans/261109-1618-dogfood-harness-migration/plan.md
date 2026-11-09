---
title: Apply jss-devtools to its own repository
status: completed
created: 2026-11-09
---

# Apply jss-devtools to its own repository

## Outcome

This repository runs on its own harness. `jss-devtools init -f --agent-kit` has been applied in
existing mode, and the project's knowledge lives where the harness and AgentKit expect it:
`docs/decisions/` → `.harness/decisions/`, `docs/` → `.harness/docs/`, `plans/` → `.harness/plans/`.
The SessionStart hook injects the 39 decisions in force, and AgentKit writes new plans into
`.harness/plans/` because `.agentkit/config.yaml` says so.

## User decisions (quote them in the new decision record)

> "Repo này xem như stable rồi. Nhưng tôi muốn apply chính `jss-devtools` vào repo này, chủ yếu là
> port/migrate qua. Dùng `jss-devtools` với --pm pnpm" (user, 2026-11-09)

Asked how deep the migration goes, the user picked "--agent-kit, dời hết" (2026-11-09): init with
`--agent-kit`, move decisions, docs and plans into `.harness/`, commit `.agentkit/config.yaml`.

## Constraints

- `--pm` is rejected in existing mode by design ([0030](../../decisions/0030-init-node-preset.md):
  "An existing project uses the manager it has"). pnpm is detected from `packageManager`, so run
  `jss-devtools init -f -y --agent-kit` with no `--pm`. Use the repo's own build: `node dist/cli.mjs`.
- `git mv` for every move, so history follows the files.
- Accepted decisions are immutable. In the moved ADRs change only relative link paths, nothing else.
- "Pin what you install": no caret ranges, no dependency the repo does not use.
- Do not commit and do not push. A push to `main` deploys the site image. Leave the work staged
  or unstaged for review.

## Non-goals

- Changing `init`, `harness update` or any `src/` behaviour. The CLI issues found below are
  follow-ups to report, not to fix here.
- Rewriting ADR format (lowercase `status`, `# 0001 Title` headings stay as they are).
- Anything under `site/` (it references only URL routes such as `/docs/getting-started`, not repo files).

## What a trial run on a copy of HEAD showed (2026-11-09)

`init -f -y --agent-kit` exits 0. It creates `.harness/**`, `.claude/settings.json` and the three
`.claude/skills/harness-*`, and it writes `.agentkit/config.yaml` with
`paths: { docs: .harness/docs, plans: .harness/plans }`. It also changes 7 tracked files. Typecheck,
tests (480 passed) and `format:check` pass afterwards, but `pnpm lint` fails with 7 errors. Each
change to a tracked file needs a fix:

| File                  | What init did                                                                                                  | Fix                                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`   | `-f` replaced it with the preset: dropped the Vitest block, `tests/fixtures/**` override and the extra ignores | Restore the HEAD version, then set `IGNORED_PATHS` to `.harness/plans/**` instead of `plans/**`, keep `.agentkit/**`, `site/**`, and add `.harness/bin/**`, `.harness/core/**` (the generated hook bundle) |
| `package.json`        | added `tsc-alias ^1.9.9`, `tsx ^4.23.15` (the node preset's build tools)                                       | Remove both: the repo builds with tsdown and the caret breaks the pin rule                                                                                                                                         |
| `pnpm-workspace.yaml` | added `allowBuilds.esbuild: true`                                                                              | Remove it with tsx; confirm `pnpm install` raises no `ERR_PNPM_IGNORED_BUILDS`                                                                                                                                     |
| `pnpm-lock.yaml`      | follows package.json                                                                                           | Re-run `pnpm install` after the removals                                                                                                                                                                           |
| `.gitignore`          | appended ~40 generic entries                                                                                   | Keep them, but see the ignore rules below                                                                                                                                                                          |
| `.prettierignore`     | added lockfiles, `.yarn/`, `.harness/bin/`, `.harness/core/`                                                   | Keep; change `plans/` to `.harness/plans/`                                                                                                                                                                         |
| `CLAUDE.md`           | appended the AgentKit variant of the harness block                                                             | Keep the block; update the project part above it (phase 3)                                                                                                                                                         |

**Ignore rules hide the harness.** Root `.gitignore` ignores `.claude/` and `.agentkit/`, so
`.claude/settings.json`, the `harness-*` skills and `.agentkit/config.yaml` would never be committed.
On another clone the hooks would not run, and `harness update` would detect no AgentKit and drop
the AgentKit block variant ([0034](../../decisions/0034-claude-block-follows-agentkit.md)).

- Replace `.agentkit/` with nothing: `ak init` writes `.agentkit/.gitignore`, which ignores everything
  except itself and `config.yaml`.
- Replace `.claude/` with `.claude/*`, `!.claude/settings.json`, `!.claude/skills/`. Local
  `.claude/agent-memory/` and `scheduled_tasks.lock` stay ignored.
- The appended `.env.*` comes after `!.env.example` and re-ignores it; move the negation below it.

## Phases

### 1. Apply init

1. `pnpm build`, then `node dist/cli.mjs init --dry-run -f --agent-kit` and compare with the table above.
2. `node dist/cli.mjs init -f -y --agent-kit`.
3. Apply every fix in the table and the ignore rules. `pnpm install`.
4. `git status --short` must list `.claude/settings.json`, `.claude/skills/harness-*`,
   `.agentkit/.gitignore` and `.agentkit/config.yaml` as untracked, not ignored.

### 2. Move the knowledge

1. `git mv docs/decisions/* .harness/decisions/`. The seeded `.harness/decisions/README.md` stays.
2. `git mv` each `docs/*.md` and `docs/site/` into `.harness/docs/`. Keep the seeded README.
   Remove the empty `docs/`.
3. `git mv` every entry of `plans/` (plan folders, `journals/`, `reports/`, this plan included) into
   `.harness/plans/`. Keep the seeded README. Remove the empty `plans/`.
4. Fix every relative link that a move broke, in the moved files and in every file that links into
   them. Example: `../../plans/X` inside a decision becomes `../plans/X`. Write a throwaway link
   checker in the session scratchpad, not in the repo, and run it over all tracked `*.md` files.

### 3. Indexes, project docs, new decision

1. `.harness/decisions/README.md`: one row per decision (`# | Title | Status | Date`), taken from
   each file's frontmatter, linked.
2. `.harness/docs/README.md`: one row per moved doc, in the table format the seed uses.
3. `.harness/plans/README.md`: one row per plan folder (`Plan | Status | Summary`), status from the
   plan's frontmatter or its journal.
4. Project `CLAUDE.md` (above the harness block) and `README.md`: rewrite every `docs/`, `docs/decisions/`,
   `docs/site/` and `plans/` path, including the "Where things are" table, the Docs section and the
   architecture rule's link to 0024. Say once that the harness block below is managed by
   `jss-devtools harness update`.
5. Write `.harness/decisions/0040-the-repository-runs-on-its-own-harness.md` from
   `.harness/templates/decision.md`, quoting the user decisions above, and add its index row.

### 4. Onboard

Follow the `harness-onboard` skill with one change: `.harness/docs/system-architecture.md` already
exists, so do not create a second architecture doc; point the memory line at it. Add non-obvious
facts to `.harness/MEMORY.md` with `(src: path)`. Skip the user policy questions, which the 40
decisions already answer. Delete `.harness/BOOTSTRAP.md`.

## Acceptance criteria (run them and paste the real output into the report)

- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
- `pnpm format:check` passes.
- `node dist/cli.mjs harness doctor` reports no issue (index drift included).
- `node dist/cli.mjs harness update --dry-run` reports nothing to change.
- `git grep -nE '(^|[^.a-z/])(docs/decisions|plans)/|\]\(\.?/?docs/' -- ':!site' ':!pnpm-lock.yaml'`
  returns no stale path; list and justify any hit you keep.
- The link checker reports zero broken relative links.
- `git status` shows the moves as renames (`R`), `docs/` and `plans/` gone, nothing committed.
- No new dependency; `tsx`, `tsc-alias`, `allowBuilds.esbuild` absent.

## CLI follow-ups to report, not fix

1. Existing-mode merge adds the preset's build deps (`tsx`, `tsc-alias`) with caret ranges to a
   project that builds another way.
2. Init writes harness files under `.claude/` and `.agentkit/` without warning when `.gitignore`
   ignores those folders, so the install silently never reaches git.
3. The `.gitignore` merge appends `.env.*` after an existing `!.env.example` and re-ignores it.

## Report back

Write the report to `.harness/plans/reports/cooker-261109-<HHMM>-dogfood-harness-migration.md`.
Include the commands run with their output, the decisions you made, and any acceptance item you
could not meet. Then prompt `planner` through herdr for review.
