# Codebase review: @jjuidev/jss-devtools

Read-only review at commit `de14fcd` (2026-11-03). The CLI under test was the `dist/cli.mjs` built at 00:31 by another process; every command below ran from a copy at `/private/tmp/claude-501/review-cli.mjs`, as the brief requires. Fixtures ran in `/private/tmp/claude-501/idxdrift/` against the real source through vitest with the `@/` alias pointing at `src/`. Nothing in the repository was modified.

## 1. Verdict

This is a standard-quality CLI: the architecture is enforced rather than described, the terminal layer behaves correctly under pipes, `NO_COLOR`, `CI=1` and a closed stdin, and the exit codes hold under every failure path I exercised. It will scale as a command set — adding a command is one folder, one `registerXCommand` export and two lines in `src/cli.ts` — but the harness module is where the scale limit shows, because it trusts files that live in the user's repository, and because it buffers unbounded output through one 1 MiB buffer. The one thing to fix first is `harness update`: it reads file paths out of `.harness/core/manifest.json` without validating them, so a committed manifest can delete or overwrite files outside the repository.

## 2. Bugs, most severe first

### B1. `harness update` deletes and overwrites files outside the repository

`src/modules/harness/services/update-plan.service.ts:23-30` builds the work list from `manifest.files[].path` with no validation, and `src/modules/harness/services/update-apply.service.ts:12-24` turns each path into `join(cwd, action.path)`, then `rmSync(full)` for a delete and `writeFileSync(full, …)` for an update. `join()` normalises `../`, so the target lands outside the repository root. `.harness/core/manifest.json` is committed to git — `.harness/.gitignore` ignores only `state/` and `update/` — so those paths come from the repository, not from the CLI.

Verified with a fixture: a manifest holding `{ path: '../escaped.txt', kind: 'managed' }` and a matching base copy produced the plan action `{"path":"../escaped.txt","kind":"delete","reason":"dropped upstream"}`, and `applyUpdatePlan` deleted the file one level above the repository root. The same unvalidated path reaches the *write* path: after staging and resolving a conflict at `../escaped.txt`, `harness update --continue` wrote the resolved content outside the repository, so the attacker controls the bytes, not only the target. The staging area is escapable too — `src/modules/harness/services/staging.service.ts:104` (`join(root, folder, input.path)`) and `loadResolutions` at `staging.service.ts:124`.

Fix: reject any manifest path that is not a normalised relative path inside the repository — no `..`, no absolute path, no leading `/` — at the point the manifest is read.

### B2. `init --force` destroys the harness memory, and `--force` is the only way forward

`src/commands/init/services/preflight.service.ts:187-215` treats any existing `.harness/` directory as a conflict, so a second `init` in a project the CLI already set up always exits 1 ("Already set up: .harness/"). `--force` is the documented way past that, and `src/commands/init/services/plan.service.ts:243-276` then plans every harness file whose content differs from the template as an update — including `.harness/MEMORY.md` and `.harness/config.json`.

Verified by execution: with a `.harness/MEMORY.md` holding one remembered fact and a `.harness/config.json` holding `maxChars: 99999` and `minLearnedSkills: 99`, `init -y --force` replaced MEMORY.md with the template's instructional text and config.json with the defaults. The plan showed `~ .harness/MEMORY.md` and `~ .harness/config.json`, but `--force`'s help text announces only "Replace existing ESLint, Prettier, commitlint and editor configs". The harness knowledge store is exactly what the harness exists to hold, and the only path forward destroys it.

Fix: keep the harness files out of the `--force` overwrite set (merge them the way `harness update` does), and say so in the flag's help.

### B3. A merge over 1 MiB is silently truncated: the upstream edit is lost and the file is written truncated

`src/modules/harness/services/three-way-merge.service.ts:42-51` runs `git merge-file` through `gitMergeFile` (`src/core/adapters/git.adapter.ts:56-80`), which uses `execFileAsync` (`src/core/utils/run-command.util.ts:101-120`) with Node's default 1 MiB `maxBuffer`. Over the limit execFile kills git and returns the output truncated to exactly 1048576 bytes with a non-numeric error code, which `exitCodeOf` turns into `1`.

Verified: a 1.2 MB base with a local edit in the middle and an upstream edit at the end produced `conflicted: true`, a result of exactly 1048576 bytes, **no conflict markers**, and **none of the upstream edit**. The missing markers matter: `loadResolutions` (`src/modules/harness/services/staging.service.ts:134-136`) rejects a resolution that still holds conflict markers, so this truncated text passes as a valid resolution and is written to the live file. The user sees a conflict, accepts the staged copy, and the file lands truncated at 1 MiB with an upstream change gone.

Fix: give the merge a `maxBuffer` that fits a real file, and treat a `git merge-file` failure as an error rather than as "1 conflicting hunk".

### B4. The init end-to-end suite never runs in CI

`tests/init.e2e.test.ts:15` gates itself on `process.env['INIT_E2E'] === '1'`, and `.github/workflows/ci.yml` runs `pnpm test` with no such variable. The suite that proves a created project lints, typechecks, builds and runs — with each of bun, pnpm, yarn and npm — is skipped in every CI run (my local run: `28 passed | 1 skipped`, the 7 skipped tests being this suite). The strongest end-to-end claim the project makes is the one thing CI does not check, and the one most likely to break when a template or a pinned dependency moves.

Fix: give the suite its own CI job with `INIT_E2E=1`, on the managers CI can install.

### B5. A crash between the manifest write and the base-copy write leaves the merge base wrong

`src/modules/harness/services/update-apply.service.ts` writes the action files (lines 11-25), then the new manifest (line 29), then the base copies (lines 31-39). A crash between lines 29 and 39 leaves a manifest recording the new release's hashes over base copies that still hold the old release's content. `ensureBaseCopies` (`src/modules/harness/services/update-preflight.service.ts:73-90`) only checks that the base files *exist*, and a hash comparison exists in exactly one place in the source tree — `src/modules/harness/services/health-install.service.ts:116`, for the live hook bundle. Nothing verifies a base copy against the manifest, so the next `harness update` merges against a stale base and can silently apply the wrong file instead of raising the conflict it should raise. The error hint at `update-preflight.service.ts:86` ("Restore .harness/core from git, then rerun") invites exactly this drift.

Fix: hash each base copy against the manifest on preflight and refuse to merge on a mismatch, or write the base copies before the manifest so the pair recovers together.

### B6. A worktree diff over 1 MiB silently disables the harness review

The same 1 MiB ceiling bites a second time. `src/core/adapters/git.adapter.ts:82-97` runs `git diff HEAD --no-ext-diff` through `runCommand`; over the limit `gitWorktreeChanges` returns `null` and nothing surfaces an error. Verified: a 4.3 MB unstaged diff made `gitWorktreeChanges` return `null`. `worktreeFingerprint` then returns null (`src/modules/harness/services/fingerprint.service.ts:8-10`), so `treeChanged` at `src/modules/harness/hooks/stop.hook.ts:112` is always false and the review-on-stop never fires on a busy repository. The `git status --porcelain` call on the same line has the same ceiling. The failure is size-dependent and silent: the harness looks healthy and simply stops reviewing.

Fix: give the diff a `maxBuffer` that fits a large diff, or hash it as it streams instead of buffering it whole.

### B7. A CRLF file turns into a whole-file conflict, or silently flips line endings

`src/modules/harness/services/three-way-merge.service.ts:42` delegates to `git merge-file` with no line-ending normalisation. Verified: with an LF base, a CRLF live file and a one-line upstream change, the merge reports `conflicted: true` and emits conflict markers around the *whole* file — every line marked as conflicting for a change that touched one line. With a CRLF base and a CRLF live file, the early return at `three-way-merge.service.ts:15-21` returns the LF upstream unchanged, silently rewriting the user's file with LF endings.

Fix: normalise line endings before comparing and merging, and restore the original ending on write.

### B8. A truncated skill-usage file disables the Stop hook for good

`src/modules/harness/services/skill-usage.service.ts:9-12` writes its JSON in place with a plain `writeFileSync`, and `foldSkillUsage` (lines 21-30) parses it back without a guard — unlike `readConfig`, which has a corrupt-config guard, and `lastCuratorRun`, which has a try/catch at line 45.

Verified: a truncated `.harness/state/skill-usage.json` makes `foldSkillUsage` throw ("Unterminated string in JSON"). The Stop hook calls it at `src/modules/harness/hooks/stop.hook.ts:74`, before any of its early returns, so the throw escapes to the entry's catch (`src/modules/harness/harness-hook.entry.ts:15-17`), which logs the error and exits 0. The file stays corrupt, so every later Stop throws too: the review and the curation never run again, and one error line accumulates per stop. Two sessions stopping at once also lose an update, because lines 21-30 are a read-modify-write with no lock.

Fix: write the state through a temp file and a rename, and guard the parse the way `readConfig` does.

### B9. A corrupt update session makes `--abort` unable to clear the file it exists to clear

`loadUpdateSession` (`src/modules/harness/services/staging.service.ts:19-26`) is a bare `JSON.parse` with no try/catch, and `runAbort` (`src/commands/harness/update.command.ts:45-53`) calls it to decide whether there is anything to abort.

Verified: with a corrupt `.harness/update/session.json`, `harness update --abort` exited 1 with the raw `Unexpected token 'c', "corrupt{" is not valid JSON` and left the file in place — the command whose whole job is to delete that file cannot run. The same throw breaks `harness update` and `--continue`. The doctor already guards the same call (`src/modules/harness/services/health-update.service.ts:68-74`), so the guard is one function away.

Fix: guard the parse, and let `--abort` delete the update directory whether or not the session parses.

### B10. The index-drift check reports a phantom row when the decisions README has a second table

The planner's suspicion is confirmed. `src/modules/harness/services/index-drift.service.ts:9-23` collects every line starting with `|` in the README, with no notion of which table a row belongs to, and `decisionRows` at lines 38-46 takes the first four-digit run in the first cell of every one of those rows.

Verified with a fixture: a `decisions/README.md` whose second table has a `Date` column containing `2026-11-03` yields `["decisions/README.md has rows with no file: 2026"]`. The warning reaches every session — `src/modules/harness/hooks/session-start.hook.ts:58-60` pushes it into the `## Warnings` block — and shows as an `Index` row in `harness doctor` (`src/modules/harness/services/health-state.service.ts:62-70`). The level is `warn`, so the doctor still exits 0, but the alarm is permanent and false.

Fix: parse only the first table, and require the first cell to be a decision id before treating a row as one.

### Smaller verified bugs

- **The memory guard cannot prevent the write it guards.** It is registered as a `PostToolUse` hook on `Write|Edit|MultiEdit` (`src/modules/harness/constants/hook-settings.constant.ts:22-29`), so it runs after the tool has written, then reads the file as it now is (`src/modules/harness/hooks/post-tool-use.hook.ts:47`) and returns `decision: 'block'`. It can report, not prevent — and its own test writes the oversized file first (`tests/harness-hooks.test.ts:248-262`).
- **The doctor prints a green tick next to a red cross on the same fact.** `src/commands/harness/services/doctor.service.ts:65-71` hardcodes the Memory summary row's status as `'ok'`, so an over-limit file yields `✔ Memory 7939/4800 chars` and `✖ Memory MEMORY.md is 7939 chars, over the limit of 4800` in the same run. Verified.
- **A failed write leaves a half-written tree and prints a bare `EACCES`.** `src/commands/init/services/write.service.ts:11-45` lets a write error escape to `src/cli.ts:136-146`, the crash path. Verified: with `.editorconfig` read-only, `init -y --force` printed `EACCES: permission denied, open '/…/.editorconfig'` — no "the files are written", no next step, unlike the install failure.
- **`--framework` advertises five presets and supports one.** `src/commands/init/init.command.ts:80-83` lists `node | react | rn | next | nest` while `src/commands/init/services/init.service.ts:10-12` rejects all but node. Verified: `--framework react` exits 1 with "Framework react is not supported yet".
- **`--dry-run` prints a plan that may not be the plan that runs.** `src/commands/init/init.command.ts:107-109` answers with `npm` when `--dry-run` is set, but an interactive run asks. Verified: `--dry-run -y` plans 51 files with no `pnpm-workspace.yaml`; `--dry-run -y --pm pnpm` plans 52 files with one.
- **The hook error log grows without bound and is read whole on every session.** `src/modules/harness/services/hook-errors.service.ts:15-19` appends forever and `:33` reads the entire file on every `SessionStart`, while the session log next to it is capped (`src/modules/harness/services/session-log.service.ts:54-74`).
- **`--force` deletes the user's `prettier`, `eslintConfig` and `commitlint` keys from `package.json`** (`src/commands/init/services/merge.service.ts:72-81`), but the plan shows only `~ package.json` — the key deletions carry no `-` mark.
- **Two `shellQuote` implementations disagree on the empty string:** `src/commands/init/services/shell-quote.service.ts:1` yields `''` and `src/commands/harness/update.command.ts:41-43` yields nothing, so `harness update ""` prints an apply command line that dropped the argument.
- **The package-manager question is asked before the preflight** (`src/commands/init/init.command.ts:202-203`): verified in a pty, `init nonempty` asks "Which package manager?" before failing on the folder not being empty.

## 3. Scaling and maintainability

**S1. The shared help helpers are duplicated per command.** `examplesText` is the same function in `src/commands/init/init.command.ts:50-66` and `src/commands/harness/harness.command.ts:19-35`, and the "apply command line" helper is duplicated between `init.command.ts:144-155` and `update.command.ts:28-39`. Every command that grows an Examples section copies the helper again, and the copies already drift in variable naming. Both belong in `src/core/ui/`.

**S2. There is no preset seam in `init`.** Adding a `react` preset touches, at minimum: `src/commands/init/services/plan.service.ts:60-107` (the file list is a flat hardcoded array, not a function of the preset), `src/commands/init/templates/package-json.template.ts:40-72` (the dependency set), `src/commands/init/constants/node-preset-dependency.constant.ts` (one flat `NODE_PRESET_DEPENDENCIES` table), `scripts/pin-node-preset.mjs:5` (a hardcoded `PACKAGES` list that writes that table), `src/commands/init/services/preflight.service.ts` (node-specific checks), `src/commands/init/services/merge.service.ts` (node-specific merges) and `src/commands/init/services/init.service.ts:10`. The preset is implicit in the bodies rather than a parameter anywhere. Decision: [0030](../../decisions/0030-init-node-preset.md).

**S3. The config key set is written three times.** `HarnessConfig` (`src/modules/harness/types/hook.type.ts:40-49`), `HARNESS_CONFIG_DEFAULTS` (`src/modules/harness/templates/harness-config.template.ts:3-14`) and `NUMBER_KEYS` (`src/modules/harness/services/config.service.ts:15-24`) each name the same seven keys. Adding one in a single place leaves the other two behind.

**S4. `src/modules/harness/services/` has 30 files, several with near-identical names.** `merge.service.ts`, `three-way-merge.service.ts` and `config-merge.service.ts` sit next to `src/commands/init/services/merge.service.ts`, a fourth and unrelated merge. Every file is under 200 lines, which is good, but the naming makes the module hard to navigate.

**S5. The architecture suite is real, and it has no size rule.** `tests/support/architecture-rules.ts` holds 14 rules, each with a negative fixture, and `tests/architecture.test.ts` asserts both directions. No rule bounds a file's length or a folder's file count, which is why `plan.service.ts` reached 382 lines. The files over 200 lines that mix concerns are `src/commands/init/services/plan.service.ts` (382), `src/commands/init/services/preflight.service.ts` (339), `src/commands/init/init.command.ts` (298), `src/commands/init/services/merge.service.ts` (215), `src/modules/harness/services/install-plan.service.ts` (207) and `src/cli.ts` (201). `src/modules/harness/templates/harness-template-files.template.ts` (295) is data, not logic.

**S6. The test suite is fast, and the slowest suites are the honest ones.** `28 files, 443 tests, 7.88s` without the build. The slow ones are `tests/init-preflight.service.test.ts` (7.7s), `tests/error-output.test.ts` (5.4s), `tests/harness-hooks.test.ts` (3.9s) and `tests/init.command.test.ts` (3.4s) — all of them driving real package managers and git. There is no suite-size problem to solve; the gap is B4.

**S7. A second agent runtime is a protocol change, not a path change.** The Claude-specific parts are already isolated in `src/modules/harness/constants/harness-paths.constant.ts:20-27` (`CLAUDE.md`, `.claude/settings.json`, `.claude/skills`, and `HOOK_COMMAND` with `$CLAUDE_PROJECT_DIR`), so the paths are cheap to fork. The real work is elsewhere: the hook payload protocol in `src/modules/harness/harness-hook.entry.ts:9` and `services/dispatcher.service.ts:14-24` (the event names and payload shape are Claude Code's), the settings schema written by `src/modules/harness/services/update-settings.service.ts` (a different runtime's hook config is a different format), and the instruction file itself (`src/modules/harness/templates/claude-block.template.ts`, `CLAUDE.md`). The [AgentKit path](../../decisions/0034-claude-block-follows-agentkit.md) is already a partial second target.

**S8. Nothing in the harness declares a hook timeout.** `src/modules/harness/constants/hook-settings.constant.ts` emits no `timeout` field and `src/modules/harness/constants/harness-limits.constant.ts` holds no deadline, so the three `async: false` hooks — SessionStart, the memory guard and Stop — block the session for as long as they take, and the `async: true` ones have no ceiling of their own.

## 4. What is already good

- The boundary rules are tested in both directions, with a negative fixture per rule.
- The exit codes hold: usage errors, `CliError` and unexpected crashes all end non-zero, and the architecture suite forbids `process.exit` and global handlers outside `src/cli.ts`.
- The terminal layer is correct under every environment I tried — piped, `NO_COLOR`, `FORCE_COLOR`, `TERM=dumb`, `CI=1` — and the banner never reaches a pipe.
- A closed stdin is refused with "Not a terminal" and exit 1 before any prompt; Ctrl-C during a prompt exits 1, writes nothing and leaves no folder behind.
- The installer verifies the sha256 and runs the bundle *before* it writes anything, so a failed install leaves nothing behind; the mismatch case is covered by `tests/install.test.ts`.
- Every preflight edge exits 1 with what was found and the next command ("Already set up: eslint.config.mjs" / `$ jss-devtools init --force`), and no tool config is touched without `--force`.
- The shell quoting is right: `init 'my app'` survives the round trip to the apply command line, and the command runner never uses a shell.

## 5. Unverified

- `harness update --continue` was not driven end to end: a real conflict needs a release whose content differs from the installed base, and only one CLI version exists here. `--abort` was driven (it discarded a staged session and left the live files alone).
- The installer was read, not re-run against a live server; the mismatch path is covered by the existing suite, which I did not execute in a network-free way.
- The `install.sh` checksum proves integrity against corruption, not against a compromised origin: `cli.mjs` and `checksums.txt` come from the same host. Whether that matters is a product decision, not a defect.
- The smaller bugs were found by reading and by execution, not each by a dedicated failing test.
- `src/modules/harness/services/session-log.service.ts:76-81` exports `touchSession`, which nothing in `src/` or `tests/` calls; the intent (keeping a live session's log out of the pruner) is plausible but unconfirmed.

## 6. Questions for the user

- Should `--framework react` (and the other three names) become real presets, or should the choice list narrow to `node` until they exist? Decision [0030](../../decisions/0030-init-node-preset.md) settles the node preset but does not say whether the names are a promise.
- Is `.harness/core/manifest.json` meant to be trusted input? If a repository is untrusted, B1 needs a validation step before the paths are used; if it is always trusted, the deletion in B1 is still a footgun worth closing.
- Should `harness update` refuse to run when the base copies do not match the manifest (B5), or repair them from the release instead of refusing?
- Should the init e2e suite (B4) run in the main CI job or in a separate one? It needs the network and four package managers, so it does not fit the current 15-minute `checks` job as it stands.
- Is the memory guard meant to *prevent* an oversized `MEMORY.md` or only to report it? As a `PostToolUse` hook it can only report.
- The generated npm hook runs plain `npx lint-staged` (verified: `src/commands/init/services/plan.service.ts:35-40` → `package-manager-detector` resolves `execute-local` to `npx`), while pnpm, yarn and bun resolve to their own local exec forms. Plain `npx` can fetch an unpinned `lint-staged` from the registry when the local bin is missing. Decision [0030](../../decisions/0030-init-node-preset.md) says "Versions are pinned, not fetched" — should the npm path use `npx --no-install`, or is the registry fallback intended?

## User decisions on the findings (2026-11-03)

- Fixed in [harness robustness](../261103-1021-harness-robustness/plan.md): B1, B3, B5, B6, B8, B9,
  B10, the doctor Memory row, the hook error log, S3, S8. The memory guard stays a report.
- Fixed in [init touch-ups](../261103-1021-init-touch-ups/plan.md): the failed-write message, the
  package-manager question order, the dry-run note, S1.
- Not changed: both `--force` findings ("nó đang mang ý nghĩa -f") and `npx --no-install` ("kệ
  nó"); `--framework` stays as decision T3 has it.
- Deferred, none planned: B4 (init e2e in CI), B7 (CRLF), S2 (preset seam), S4 and S5 (naming, a
  size rule), S7 (a second runtime), the installer checksum origin: "tôi chọn không làm hết, để sau
  hết" (user, 2026-11-03).
