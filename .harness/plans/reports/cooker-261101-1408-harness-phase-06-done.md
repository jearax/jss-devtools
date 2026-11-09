# Report: harness phase 6 — services move into `services/`

Date: 2026-11-01. Task brief: `plans/reports/planner-261101-1356-harness-phase-06-task.md`.
Phase: `plans/261101-0204-init-harness/phase-06-services-folder.md` (status set to `done`).

## Outcome

Every `*.service.ts` under `src/commands/` and `src/modules/` now lives in a `services/` folder of
its command or module (33 files moved with `git mv`, doctor included). The command root holds only
`*.command.ts`, the module root only `*.entry.ts`, enforced by the `file-role-suffix` rule with two
new negative fixtures (a misplaced `.service.ts` at a command root and at a module root). All
existing service fixtures moved under `services/`; fixture cross-import depths were fixed so each
fixture still violates exactly its own rule. No logic lines changed anywhere.

## Files changed

- `src/commands/{doctor,init,harness}/services/` and `src/modules/harness/services/` — the moves
  (shown as R-high renames in `git diff --cached -M`), plus import rewrites in command files, the
  entry file, `hooks/*.ts`, and inside the services themselves (sibling subfolder imports now use
  the `@/` alias, per the repo's `no-restricted-imports` rule against parent-relative imports).
- `tests/*.test.ts` — aliased service imports now point at `services/`; the alias-scanner test's
  logical-path strings updated.
- `tests/support/architecture-rules.ts` — `ROLE_SUFFIXES` gains `commands/<name>/services/` and
  `modules/<name>/services/` (`.service.ts` only); the command-root catch-all now allows only
  `.command.ts`, the module-root catch-all only `.entry.ts`; all moved fixture paths updated;
  `file-role-suffix` gains the two misplaced-service fixtures.
- `tests/fixtures/architecture/src/**` — all root `*.service.ts` fixtures moved under `services/`
  (git mv); relative import depths corrected; two new `misplaced.service.ts` fixtures that use
  their import so no lint warning fires.
- Docs: `docs/decisions/0024-*` gains the amendment (quoting "Chuyển luôn, không ngoại lệ"), the
  earlier root rows marked superseded; `docs/code-standards.md` roles table, the layout tree in
  `docs/system-architecture.md`, and `docs/codebase-summary.md` updated. `CLAUDE.md` needed no
  change — it names no service path.
- `plans/261101-0204-init-harness/phase-06-services-folder.md` — `status: done`.

## Gate output

- `pnpm vitest run tests/architecture.test.ts` — 27 passed (27).
- `pnpm lint` — clean.
- `pnpm typecheck` — clean.
- `pnpm test` — 26 files passed | 1 skipped; 404 passed | 7 skipped.
- `pnpm build` — `dist/cli.mjs` 301.30 kB, build complete.
- `find src/commands src/modules -maxdepth 2 -name '*.service.ts'` — prints nothing.
- `git diff --cached --stat -M` — 81 files, moves detected as renames; a scan of every changed
  line under `src/` shows import statements, import-list continuations, and blank lines only.

## Deviations

- The rules file previously allowed `.service.ts` at both the command and module root as one
  catch-all row each. I split each into a `services/` row plus a root catch-all, matching the
  phase file's "the command root allows only `.command.ts`, the module root only `.entry.ts`".
- Service-to-subfolder imports inside `services/` had to become `@/` alias imports (not `../`)
  because the repo's lint forbids parent-relative imports; this is why several renames are below
  R100.
- `plans/reports/planner-261101-1356-harness-phase-06-task.md` is included in the staged tree
  (it was untracked at task start); left staged, not committed.

Status: DONE
Summary: All 33 root-level services moved into their command/module `services/` folders with git
mv, imports rewritten, architecture rules tightened with two new negative fixtures, docs amended,
phase marked done; full gate green with no logic changes.
Concerns/Blockers: none.
