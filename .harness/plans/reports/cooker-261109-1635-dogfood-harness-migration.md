# Report: cook .harness/plans/261109-1618-dogfood-harness-migration/plan.md

- Date: 2026-11-09 16:35 (Asia/Ho_Chi_Minh)
- Executor: cooker (Claude Code session)
- Plan: `.harness/plans/261109-1618-dogfood-harness-migration/plan.md`
- Result: **all acceptance criteria met**; work staged, nothing committed, nothing pushed.

## Outcome

`jss-devtools init -f -y --agent-kit` applied in existing mode (no `--pm`; pnpm detected from
`packageManager`), using the repo's own build (`node dist/cli.mjs`). Knowledge moved with `git mv`:

- `docs/decisions/` -> `.harness/decisions/` (39 ADRs, links fixed, decision 0040 added)
- `docs/` -> `.harness/docs/` (incl. `docs/site/` -> `.harness/docs/site/`)
- `plans/` -> `.harness/plans/` (plan folders, `journals/`, `reports/`, this plan itself)

Staged status: 265 `R` (renames), 39 `A` (harness install files + decision 0040), 5 `M`
(`.gitignore`, `.prettierignore`, `CLAUDE.md`, `README.md`, `eslint.config.mjs`).
`docs/` and `plans/` are gone.

## Acceptance criteria — real commands and output

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — lint clean, `tsc --noEmit` clean,
   **Tests 480 passed | 7 skipped**, `Build complete in 29ms` (337.11 kB). All exit 0.
2. `pnpm format:check` — "All matched files use Prettier code style!"
3. `node dist/cli.mjs harness doctor` — "Harness is healthy", exit 0. One warning line:
   `– Decisions 0033-harness-doctor.md has no quote of the user` (warning, not an error).
   Re-run after planner review fixes: see "Post-review re-run" below.
4. `node dist/cli.mjs harness update --dry-run` — "Harness is up to date", exit 0.
5. Stale-path grep
   `git grep -nE '(^|[^.a-z/])(docs/decisions|plans)/|\]\(\.?/?docs/' -- ':!site' ':!pnpm-lock.yaml'`
   returned 103 hits; all are kept and justified below.
6. Link checker (`/tmp/jss-linkcheck/check.mjs`, throwaway, over 288 `*.md`) — 2 broken links, both
   pre-existing before the move and kept:
   - `.harness/plans/261031-2325-init-harness-discussion/decision-log.md` ->
     `../../../jss-harness-eval/...` (external sibling repo; depth unchanged by the move).
   - `.harness/plans/reports/cooker-2-261103-1432-...md` -> `./plan.md` (target never existed).
   `.harness/core/base/CLAUDE.md` is excluded from the check: generated template with placeholder
   paths, owned by `harness update`.
7. `git status` — moves shown as `R` renames; `docs/` and `plans/` gone; nothing committed.
8. No new dependency: `tsx`, `tsc-alias`, `allowBuilds.esbuild` absent from `package.json`,
   `pnpm-lock.yaml`, `pnpm-workspace.yaml`.

## Kept grep hits, justified

Evergreen docs were updated (`.harness/docs/code-standards.md`, `codebase-summary.md`); the
remaining ~103 hits are historical records kept as written:

- ADR prose and quotes (0001, 0012, 0035): accepted decisions are immutable; 0012's
  "decision records live in `docs/decisions/`" is now historically true but no longer the layout —
  see the open question below.
- Plans, journals, reports, open-questions and decision logs: paths quoted as they were at the
  time; rewriting history falsifies records.

## CLI follow-ups (reported, not fixed — non-goal)

1. Existing-mode merge adds the node preset's build deps with caret ranges (`tsc-alias ^1.9.9`,
   `tsx ^4.23.15`) to a project that builds another way. Confirmed exactly; the caret also breaks
   the repo's own pin rule.
2. Init writes harness files under `.claude/` and `.agentkit/` without warning when `.gitignore`
   ignores those folders; `harness doctor` stays green while the install never reaches git.
   Confirmed: I had to narrow the ignore rules by hand (see below).
3. The `.gitignore` merge appends `.env.*` after an existing `!.env.example`, re-ignoring it.
   Confirmed and fixed locally by moving the negation below the append.
4. New follow-up found this session: the secret scanner (`redaction.service.ts`) matches a
   credential word immediately followed by a colon or equals sign, so it flags plain prose. The
   phrase "authors no credential-word: it" in
   `.harness/docs/site/conventions/styling-conventions.md` was reported as a secret-shaped value;
   I reworded the prose (semicolon instead of colon) instead of touching `src/`.

## Decisions made beyond the plan's literal text

1. Doctor's secret flag was plain prose, not a leak. Reworded the doc sentence (allowed; docs are not
   `src/`), reported the pattern gap as follow-up 4 instead of fixing the scanner.
2. Kept-hits policy above: evergreen docs updated, history untouched.
3. `.gitignore` narrowed: `.agentkit/` rule removed (`ak init` writes its own `.gitignore` that
   keeps `config.yaml`); `.claude/` -> `.claude/*`, `!.claude/settings.json`, `!.claude/skills/`
   (local `agent-memory/` and `scheduled_tasks.lock` stay ignored); `!.env.example` moved below the
   appended `.env.*`. `pnpm install` after the reinstall also left a literal placeholder
   `esbuild: set this to true or false` in `pnpm-workspace.yaml`; removed it, reinstall clean.

## Open questions for planner / user

1. **0012 vs 0040.** Decision 0012 states decision records live in `docs/decisions/NNNN-<slug>.md`,
   which 0040 contradicts. I did not decide: superseding 0012 would drop it from the "in force"
   count (39 -> 38) and the plan deliberately says 39 stay in force. Leave to planner/user.
2. The doctor warning about 0033 having no user quote is pre-existing (decision 0033 was written
   from a spec discussion); not addressed here.

## Indexes and docs written

- `.harness/decisions/README.md`: 40 rows (39 moved + 0040), status/date from frontmatter.
- `.harness/docs/README.md`: 11 rows (7 root docs + 4 site convention docs under `site/`).
- `.harness/plans/README.md`: 33 rows, status from each plan's frontmatter; 3 folders with no
  plan.md marked `reference` (knowledge base and two decision logs).
- `CLAUDE.md` and `README.md`: every `docs/`/`plans/` path rewritten; "Where things are" table now
  lists `.harness/`; CLAUDE.md notes the harness block at the end is managed by
  `jss-devtools harness update`.
- `.harness/MEMORY.md`: 5 non-obvious facts with `(src: ...)`; `.harness/BOOTSTRAP.md` deleted.
- Decision 0040 written from the template, quoting the user's two statements, index row added.


## Post-review re-run (planner feedback, 2026-11-09)

Planner review: near-pass, four fixes. Applied: (1) rewrote the prose the secret scanner flags in
this report and the journal (the phrase "credential word followed by a colon"); (2) 0040 now
supersedes 0012 — planner's call: keeping 0012 in force would inject a wrong instruction at every
session start, and the plan's "39 decisions" was descriptive, not a constraint; 0040's Decision now
states records live in `.harness/decisions/`, 0012's status is `Superseded by 0040` (its only
allowed edit), and both index rows updated; (3) MEMORY.md line 1 corrected — `.harness/bin/` is
written by `harness update` from the CLI's bundle (`src/modules/harness/`), not generated from
`.harness/core/`, which is the three-way-merge base; the broken-links log line removed as
narration; (4) this report's title and Plan path updated to `.harness/plans/`.
