# Report: harness plan, phase 5 (`harness update`) — done

Task brief: `plans/reports/planner-261101-1302-harness-phase-05-task.md`.
Implements `plans/261101-0204-init-harness/phase-05-harness-update.md` on `main` at `d366187`.
Not committed, not pushed.

## Files changed

New:

- `src/commands/harness/harness.command.ts` — the `harness` group, its examples, `update` with `--continue`, `--abort`, `-y`, `--dry-run` (decision 0029 spellings via `COMMON_OPTIONS`).
- `src/commands/harness/update.command.ts` — argument rules and wiring only: terminal rule, render, confirm, stage-or-apply. Renamed from the phase file's `update.service.ts` because the architecture suite proves clack/commander live in `*.command.ts`; the phase file's split still holds, the flow just carries the `.command.ts` role.
- `src/modules/harness/update-preflight.service.ts`, `update-manifest.service.ts`, `update-plan.service.ts`, `update-apply.service.ts`, `update-release.service.ts`, `staging.service.ts`, `three-way-merge.service.ts`, `config-merge.service.ts`, `block-region.service.ts`, `types/update.type.ts` — the module layer: preflight, planner, three-way merge (unit space for the block), config key merge, staging, apply, current-release construction. No commander, no clack, no output.
- `tests/harness-update.test.ts` (20 tests), `tests/harness-update-units.test.ts` (14 tests).
- `docs/decisions/0032-harness-update.md`.

Modified:

- `src/cli.ts` — registers the `harness` group only.
- `src/core/adapters/git.adapter.ts` — `gitMergeFile` (the adapter is the only runner caller; no new dependency, the line merge is `git merge-file -p` with labelled markers `yours` / `the installed version` / `the new version`).
- `src/modules/harness/constants/harness-paths.constant.ts` — `.harness/update/` paths.
- `src/modules/harness/install-plan.service.ts` — the manifest/base builders now take `(recorded files, version)` so update and tests can build a release stub; install behavior unchanged (its tests still pass untouched).
- `docs/system-architecture.md`, `docs/codebase-summary.md`, `docs/project-roadmap.md`; phase file `status: done`.

## Gate output (real, final run)

```
$ pnpm lint        → eslint clean
$ pnpm typecheck   → tsc --noEmit clean
$ pnpm test        → Test Files 26 passed | 1 skipped (27); Tests 399 passed | 7 skipped (406)
$ pnpm build       → ✔ Build complete (dist/cli.mjs ~300 kB)
```

## What the tests prove

`tests/harness-update.test.ts` installs temp repositories with phase 4's real `harnessInstallEntries`, then stubs older/newer releases through the same `HarnessRelease` seam the command uses:

- every per-path row: untouched→upstream, edited→kept, non-overlapping merge, overlapping conflict, deleted-locally conflict, dropped-upstream delete vs conflict, hook bundle overwrite, config key rules, settings entries replaced with foreign hooks kept;
- clean update rewrites manifest and base; conflict, `--continue` (refusing marker-bearing copies first), `--abort` flows;
- each preflight exit 1 (no manifest, downgrade, missing base, invalid config JSON, already-staged, lock) with the repository proven byte for byte unchanged by `snapshotDir`;
- `--dry-run` writes nothing even over a conflict; seeds, learned skills, archive, `curator.json` and a toolchain file are byte for byte unchanged in every case;
- `harness update --help` asserted byte for byte.

## The real conflict round trip (scratch repo outside this repo, built CLI)

```
$ jss-devtools harness update
┌   jss-devtools harness update
│
◇  Changes in app: 1 conflicts
│  ! .harness/templates/decision.md
│
└  Cannot finish the update: 1 conflicting file
      .harness/templates/decision.md — overlapping edits
   To finish:
     $ jss-devtools harness update --continue
     $ jss-devtools harness update --abort
exit=1

$ jss-devtools harness update --continue   (resolved copy still holds markers)
└  .harness/update/resolved/.harness/templates/decision.md still holds conflict markers
exit=1

$ jss-devtools harness update --continue   (resolved copy is clean)
┌   jss-devtools harness update
└  Staged update applied
exit=0

live file: "resolved by the user"; manifest version back to 0.0.1; .harness/update/ removed
```

## Deviations and decisions (with why)

1. **`update.service.ts` → `update.command.ts`.** The phase file named `update.service.ts` for "argument rules and wiring", but that file asks, renders and prints — the architecture suite (fixtures, not comments) proves clack and commander live only in `*.command.ts`. The logic stayed in `src/modules/harness/` as required; only the wiring moved to the role the repo enforces.
2. **A conflict run asks no question and stages without `-y` or a terminal.** Decision 0001's workflow is "the agent proposes, the user decides": the agent runs `update` non-interactively, resolves the staged copies, continues. Asking before staging would break that main use case, and staging never touches the live tree. Only the live write asks (0029's terminal rule applies exactly there). Recorded in 0032.
3. **Preflight order and the lock.** The lock is checked read-only in preflight; the exclusive lock file is taken after preflight passes and removed after, so a failed preflight leaves the repository byte for byte unchanged (a dry run removes the empty `.harness/update/` it created for the lock). A crashed run leaves the lock; the error names it and says deleting it is the way back.
4. **Config conflict proposal keeps the user's value.** A key both sides changed differently is staged as a whole-file conflict whose resolved copy starts from the local values (valid JSON, agent edits if the new default should win). Invalid-JSON line naming is best-effort: Node's parser gives line/column for most errors; the rare message without position says `unknown line`.
5. **Merge conflict markers carry labels**, not temp paths (`<<<<<<< yours`), via `git merge-file -L`.

## Unresolved questions

None blocking. One note for phase 6: `harness doctor` will want to reuse the staged-session checks (`loadResolutions`' validations) for its own reporting.

Status: DONE
Summary: `jss-devtools harness update` implemented per phase 5 with the full preflight, per-path table, staging/continue/abort flows, 34 new tests, docs and decision 0032; the full gate is green (lint, typecheck, 399 tests, build) and the conflict round trip was proven with the built CLI in a scratch repository.
Concerns/Blockers: none

## Round 1 fixes

Review: `plans/reports/planner-261101-1351-harness-phase-05-review.md`. Both findings fixed.

**1. `--continue` now follows the same rule as a clean update.** It runs under `withUpdateLock`,
renders the staged plan (heading plus the coloured row list), then asks before writing unless
`-y`; without a terminal and without `-y` it exits 1 with the same hint, and the staged session
and the live tree are unchanged. `--dry-run` on a continue stops after rendering. The ask lives
in one shared `confirmWrite` helper used by both flows. New tests: `-y` applies and clears the
session, no-terminal exits 1 with the session and tree byte for byte unchanged, dry run writes
nothing.

**2. Both files split along real boundaries.** `update-plan.service.ts` (315) is now
`update-decide.service.ts` (the per-kind decisions: whole file, block unit space, config keys),
`update-settings.service.ts` (the hook-entries replacement), and `update-plan.service.ts` (plan
assembly and overrides, 86 lines). `update.command.ts` (332) is now
`update-render.service.ts` (marks, colours, heading, path sorting, 110 lines),
`src/modules/harness/update-stage.service.ts` (turning a conflicted plan into the staged
session — moved to the module layer because it is pure data, 51 lines), and
`update.command.ts` (flow only, 189 lines). No file in either layer exceeds 200 lines.

Gate output (real, after the fixes):

```
$ pnpm lint        → eslint clean
$ pnpm typecheck   → tsc --noEmit clean
$ pnpm test        → Test Files 26 passed | 1 skipped (27); Tests 402 passed | 7 skipped (409)
$ pnpm build       → ✔ Build complete
```

Round trip re-verified with the rebuilt CLI in a fresh scratch repository:

```
$ jss-devtools harness update --continue            (no terminal, no -y)
└  Not a terminal
   ↳ Run it in a terminal, or pass --yes
exit=1, session still staged, live tree unchanged

$ jss-devtools harness update --continue -y
└  Staged update applied
live file: "resolved by hand", .harness/update/ removed
```

Status: DONE
Summary: both round 1 findings fixed — `--continue` renders, asks under the lock unless `-y`, and the two oversized files are split along per-kind/rendering/staging boundaries; full gate green (402 tests) and the continue flow re-proven with the built CLI.
Concerns/Blockers: none
