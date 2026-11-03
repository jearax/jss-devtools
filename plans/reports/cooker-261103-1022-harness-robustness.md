# Harness robustness: distrust what the repository holds

Implementation of [the plan](../261103-1021-harness-robustness/plan.md), phase 1
([paths, output size and JSON state](../261103-1021-harness-robustness/phase-01-paths-output-and-state.md))
and phase 2
([base copies, index drift, doctor, log, timeouts](../261103-1021-harness-robustness/phase-02-base-index-doctor-timeouts.md)).
Nothing was committed or pushed.

Every finding below has a test that was run against the pre-fix code and failed there. The
"fails before" column names the assertion that failed first.

## Findings, one line each

| Finding | Fix | Test that covers it |
| --- | --- | --- |
| B1 manifest paths leave the repository | `readManifest` validates every `files[].path` (relative, no `..`, not absolute, resolves under the repository) and throws a `CliError` naming the path; `stageConflicts` and `loadResolutions` apply the same check, so no caller bypasses it | `tests/harness-update.test.ts` → *the manifest paths* → refuses a path that climbs out of the repository / through a folder / an absolute path (fails before: the update resolved and the outside file was deleted); `tests/harness-doctor.test.ts` → *names an unsafe manifest path instead of saying the manifest is missing* |
| B3 a merge over 1 MiB is truncated | `runCommand` buffers 64 MiB (`MAX_BUFFER_BYTES`); `mergeThreeWay` throws a `CliError` when the `git merge-file` code is not a conflict count (null, negative or above 127) | `tests/harness-update-units.test.ts` → *keeps both edits in a file over 1 MiB* (fails before: `conflicted: true`, the upstream edit missing) and *throws when git merge-file fails, instead of calling it a conflict* (fails before: `conflicted: false` with empty content); `tests/run-command.util.test.ts` → *keeps output larger than 1 MiB whole* (fails before: exit code 1) |
| B5 base copies that do not match the manifest | The preflight hashes every base copy against its manifest `sha256` and stops before the first write, naming the files and the next step `git checkout .harness/core`; it does not repair from the release | `tests/harness-update.test.ts` → *the base copies* → refuses to update when a base copy does not match the manifest (fails before: the update ran and wrote instead of refusing) |
| B6 a failed fingerprint reads as "unchanged" | `gitWorktreeChanges` now says *ok*, *missing* (no repository) or *failed*; a failed fingerprint is logged through `logHookError` and the Stop hook treats it as a changed tree | `tests/harness-hooks.test.ts` → *asks for review when the worktree fingerprint fails* (fails before: no review asked); `tests/git-adapter.test.ts` → *reads worktree changes, and says why it cannot* |
| B8 a truncated `skill-usage.json` disables the Stop hook | The JSON state is written through a temp file and `renameSync`; a parse error reads as an empty map, is logged through `logHookError`, and the next write replaces the corrupt file. `curator.json` shares the write | `tests/harness-hooks.test.ts` → *survives a truncated skill-usage file and rewrites it* (fails before: the file stayed corrupt) |
| B9 a corrupt session makes `--abort` unable to clear | `loadUpdateSession` throws a `CliError` naming the file and suggesting `--abort`; `--abort` removes `.harness/update/` whether or not the session parses | `tests/harness-update.test.ts` → *a corrupt staged session* → aborts it, and refuses to update or continue (fails before: `Unexpected token` and the folder stayed) |
| B10 a second table in `decisions/README.md` | The drift check reads only the table whose header's first cell is `#` (docs: `Doc`) and treats a row as a decision only when the first cell is a four-digit id, bare or as link text | `tests/harness-index-drift.test.ts` → *reads the decisions table and ignores a second table* (fails before: `has rows with no file: 2026`), *still reports a decision file with no row*, *reports a row whose id has no file* |
| Doctor: the Memory row | The Memory summary row takes the worst level among the memory issues (`ok`, `info`, `fail`) | `tests/harness-doctor.test.ts` → *errors when memory is over its limit* (fails before: `✔ Memory` next to `✖ Memory`) |
| `hook-errors.log` grows without bound | The log is capped at 64 KiB (`HOOK_ERROR_LOG_MAX_BYTES`); an append that would pass the cap keeps the newest half on a line boundary and shifts the cursor by the bytes dropped, so the next session still reports only the new errors | `tests/harness-hooks.test.ts` → *caps the hook error log and reports only the errors after the trim* (fails before: the file grew past the cap) |
| S3 the config keys are written three times | `NUMBER_KEYS` is derived from `HARNESS_CONFIG_DEFAULTS`, so a key added to the defaults is validated without a second edit. The `HarnessConfig` type is unchanged | `tests/harness-config.test.ts` → *validates every key the defaults declare*. This one is a guard, not a red-to-green test: the two lists are in sync today, so it passed before the fix as well |
| S8 no hook timeout | The three synchronous entries (SessionStart, the memory guard, Stop) carry `timeout: 30` from `HOOK_TIMEOUT_SECONDS`; the asynchronous ones carry none. `harness update` replaces the harness entries, so an installed `.claude/settings.json` reaches the new shape | `tests/harness-update.test.ts` → *gives the three synchronous hooks a timeout and the async ones none* and *brings settings written by the previous release up to the new entries* (both fail before: no `timeout` field) |

## Decisions the plan left to the implementation

- **`runCommand` reports a failure without an exit code as `null`, not `1`.** The old `1` is what made
  a buffer overflow indistinguishable from "one conflicting hunk". A missing command was already
  `null`; a killed child and an overflow now join it. The `git merge-file` path turns `null` into a
  `CliError` instead of a conflict.
- **`gitWorktreeChanges` returns a discriminated result** (`ok` / `missing` / `failed`) instead of
  `null`. B6 needs "not a git repository" and "git failed" to be different answers: the first must
  not ask for a review, the second must. `tests/git-adapter.test.ts` was updated to the new contract;
  the old assertion ("null without HEAD or outside a repository") covered both cases at once. A
  repository with no commit is neither: it is `ok` with an empty diff, because `git status` still
  lists the tree.
- **The base copy and the manifest record the same content, so the test helper `ageBase` now writes
  the manifest hash too.** B5 makes that pair a checked invariant; the helper used to fake a base
  copy from an older release without the manifest agreeing, which is now exactly the drift the
  preflight refuses.
- **`sha256` moved to `install-plan.service.ts` and is reused** by `update-preflight.service.ts` and
  `health-install.service.ts`, so the manifest hash and the base-copy hash are the same function.
- **The doctor reports an unsafe manifest by name.** B1 makes the manifest unreadable for a doctor
  that only knows "there is a manifest or there is not", which would have printed "No harness
  manifest here" and pointed at `jss-devtools init` for a manifest that is present and unsafe. The
  health context now carries the problem, and the doctor names it.
- **The hook-error cursor is a byte offset.** It was a character count while the log grew in bytes;
  the cap is in bytes, so the cursor is now read and written in bytes as well.
- **`skill-usage.json` is written to `<path>.<pid>.tmp`** before the rename, so two hooks writing at
  once cannot share one temp file. The lost-update race the plan leaves alone is unchanged.

## The independent review

A reviewer agent read the plan and the diff and verified the red-to-green claim by building the new
tests against the pre-fix source: 18 of the new assertions fail at `HEAD`. It raised eleven
confirmed findings; the ones that were closed here are listed below with their test. The rest are
in "Open questions" or were judged not worth changing.

| Finding | What was done |
| --- | --- |
| The `init` settings merge skipped an entry whose command it already knew, so a settings.json written by the previous release never gained the timeout. S8 asks for the merge to be extended; it was not | `mergeIntoSettings` now refreshes the fields of an entry the CLI already wrote, so it keeps its place and takes the current release's `timeout` and `async`. Test: `tests/harness-install-plan.service.test.ts` → *refreshes the timeout on a harness entry an earlier release wrote* (verified failing without the fix) |
| A repository with no commit was classified as a git failure, so the Stop hook asked for a review on every stop and wrote a hook error on every session — a regression this change introduced, and exactly the state `init` leaves behind | `git diff HEAD` failing because HEAD is unborn is a well-defined state, not a failure: the adapter asks `git rev-parse --verify HEAD` and, when there is no commit, returns the status with an empty diff. Test: `tests/harness-hooks.test.ts` → *does not log a hook error in a repository with no commit* (verified failing without the fix) |
| The base-copy drift message's recovery (`git checkout .harness/core`) only works when `.harness/core/` is tracked, and the CLI refuses to repair from the release, so an untracked drift is stuck | The hint now names the fallback: *Run git checkout .harness/core, then rerun. If .harness/core is not in git, run jss-devtools init --force* |
| The doctor stayed silent about the two things the update now refuses: a base copy that does not match the manifest, and a staged session that cannot be read | The doctor gained a *Base copies* row and now reports a corrupt staged session instead of swallowing it. Tests: `tests/harness-doctor.test.ts` → *errors when a base copy does not match the manifest* and *errors when the staged update session is corrupt* (both verified failing without the fix) |
| `NUMBER_KEYS` was derived as "every default key", so a non-numeric default added later would be validated as a number | The derivation filters on `typeof value === 'number'` |
| A manifest whose `files` is not an array, or whose entry has no `path`, surfaced as "Invalid JSON" or crashed inside `isAbsolute` | `readManifest` checks the shape and throws a `CliError` naming the manifest |
| The staging path check blamed `.harness/update/session.json` for a path that came from the manifest | The staging check names the manifest; only `loadResolutions`, where the path really does come from the session file, names the session |
| The merge failure message could read "exit code null" — the case it exists for | It reads "the command reported no exit code" |
| The streamed and the buffered command paths disagreed about a signalled child (`1` against `null`) | Both report `null` now |

Two findings were judged as the plan's scope and left alone: the absolute-path case of the B1 test
has no file outside the repository to assert on (`join` treats an absolute path as relative, so the
old code never reached outside for it), and the review's own note that S3's test is a guard rather
than a red-to-green test, which this report already states.

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, run from the repository root:

```
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
$ vitest run

 RUN  v5.0.5 /Users/tandm/Desktop/yyyy

 Test Files  30 passed | 1 skipped (31)
      Tests  465 passed | 7 skipped (472)
   Duration  5.56s (tests 96%, transform 1%, setup 0%)

$ tsdown --config tsdown.hooks.config.ts && tsdown --config tsdown.config.ts
✔ Build complete in 11ms
✔ Build complete in 30ms
```

The skipped suite is `tests/init.e2e.test.ts`, which gates itself on `INIT_E2E=1`; it was skipped
before this change too (B4, out of scope).

## Docs

`docs/project-roadmap.md` gained the two lines the phase 2 file asks for: what the update now
refuses before the first write, and the `timeout` on the synchronous hook entries. The doctor
section gained the Memory summary row's rule. `docs/system-architecture.md` describes the file
layout, not the preflight rules or the hook entry fields, so it states no old behaviour and stays
as it is.

## Files

New: `src/core/constants/buffer.constant.ts`, `src/modules/harness/services/path-safety.service.ts`,
`tests/harness-config.test.ts`, `tests/harness-index-drift.test.ts`.

Changed source: `src/core/utils/run-command.util.ts`, `src/core/adapters/git.adapter.ts`,
`src/commands/harness/update.command.ts`, `src/commands/harness/doctor.command.ts`,
`src/commands/harness/services/doctor.service.ts`, and in `src/modules/harness/`: `constants/harness-limits.constant.ts`,
`constants/hook-settings.constant.ts`, `hooks/stop.hook.ts`, `services/config.service.ts`,
`services/dispatcher.service.ts`, `services/fingerprint.service.ts`, `services/health-install.service.ts`,
`services/health-skills.service.ts`, `services/health-update.service.ts`, `services/hook-errors.service.ts`,
`services/index-drift.service.ts`, `services/install-plan.service.ts`, `services/merge.service.ts`,
`services/skill-usage.service.ts`, `services/staging.service.ts`, `services/three-way-merge.service.ts`,
`services/update-manifest.service.ts`, `services/update-preflight.service.ts`, `types/health-issue.type.ts`,
`types/hook.type.ts`.

Changed tests: `tests/git-adapter.test.ts`, `tests/harness-doctor.test.ts`, `tests/harness-hooks.test.ts`,
`tests/harness-install-plan.service.test.ts`, `tests/harness-update-units.test.ts`, `tests/harness-update.test.ts`,
`tests/run-command.util.test.ts`.

## Open questions

None blocking. The plan's non-goals were left alone: the memory guard stays a `PostToolUse` report,
CRLF handling, the init e2e job, the init bugs and the preset seam are untouched, and there is no
lock around `skill-usage.json`.

One operational interaction is worth the reviewer's eye: **B5's hash check is byte-exact, and
`.harness/core/base/` is committed to git.** On a Windows checkout with `core.autocrlf=true`, git
rewrites the base copies to CRLF while the manifest records the hash of the LF content, so the
preflight would refuse every update with "Base copies do not match the manifest", and
`git checkout .harness/core` would not help because it re-checks-out the same CRLF bytes. Two ways
out, both outside this plan: normalise line endings before hashing (which only papers over the
symptom, because the merge itself still compares a CRLF base against an LF live file — that is
B7), or ship a `.gitattributes` with `* text=auto eol=lf` for `.harness/core/**` in the installed
repository. The check is implemented byte-exact as the plan asks; the decision belongs to the
reviewer.

One limitation of B1 worth stating plainly: **the path check is on the path string, not on the
file it points at.** A repository that commits a symlink at a path the update writes to (the base
copies under `.harness/core/base/`, for instance) makes the CLI write through it, because
`writeFileSync` follows symlinks — verified in this session. The plan defines the check as
"relative, no `..`, not absolute, resolves under the repository", which is what is implemented; a
symlink-aware check needs `realpath` on the parent directory and has its own time-of-check /
time-of-use race, so it is a separate decision rather than something to fold in here.

Three smaller notes from the review that are left as they are:

- The hook-error cursor changed unit from characters to bytes. A cursor file written by the
  previous release holds a character count and is read as a byte offset, so the first session
  after the upgrade slices at the wrong place; it self-heals after that one session.
- `git checkout .harness/core` restores the manifest as well as the base copies, so the recovery
  also rolls the manifest version back to the committed one. That is the desired recovery, but the
  message does not say so.
- The fingerprint now spawns three git processes instead of two (`rev-parse --show-toplevel`,
  `status`, `diff`) on every SessionStart and Stop, and one more (`rev-parse --verify HEAD`) on
  the path where the diff fails. The cost is one extra process on a hot path; it buys the
  distinction between "no repository" and "git failed" that B6 needs.
- `git --version` that is killed by a signal now reports "Git is not installed" rather than
  "failed", because a failure without an exit code is `null` and that maps to "missing". Cosmetic
  and rare.
