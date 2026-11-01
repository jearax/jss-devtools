# Review: harness phase 3, round 1

Reviewed: the working tree against `aa7a0d2`..`5b8f986` and
`plans/reports/cooker-261101-1118-harness-phase-03-done.md`. Gate was green (343 passed). Fix the
findings below in the same working tree, rerun the full gate, and append a "Round 1 fixes" section
to your done report with the real gate output. Do not commit, do not push. Comments: default zero.

## Findings

1. **Blocker: the embedded bundle is unreachable from source.** `tsdown.config.ts` appends
   `export const harnessHookBundle = ...` as a `footer`. Code inside `cli.mjs` cannot read its own
   footer export, so phase 4 has no way to write `.harness/bin/hooks.mjs`. Inject the text with
   `define` (for example `__HARNESS_HOOK_BUNDLE__`, declared once in a `.d.ts`) and read it in one
   place, `src/modules/harness/constants/hook-bundle.constant.ts`. It must also resolve under
   vitest, where source files run unbundled: make `vitest.config.ts` define the same name. Keep
   `tests/bundle.test.ts` proving the text inside `cli.mjs` equals `dist/hooks.mjs`, now through
   the constant rather than a footer regex. Remove the footer.

2. **Fingerprint must come from git, as the phase file says.** The fs walk of size and mtime is
   slow on large repositories and differs from what review means by "the worktree changed". You
   may now add one function to `src/core/adapters/git.adapter.ts` (and its test) that returns the
   output of `git status --porcelain=v1 -z --untracked-files=all` and of
   `git diff HEAD --no-ext-diff`; the fingerprint hashes both. Any non-zero exit, a missing git or
   a repository without `HEAD` yields "unknown", never "changed". Delete the fs walk.

3. **PostToolUse double count: do not rely on `tool_use_id`.** The hooks reference documents
   `tool_use_id` only in the PreToolUse example and says nothing about whether two matcher groups
   with the same command run once or twice. Give the sync `Write|Edit|MultiEdit` entry its own
   command, `node "$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs" memory-guard`: it only guards
   and never logs. The async catch-all entry only logs. Update `hook-settings.constant.ts`, the
   dispatcher, and the tests; remove the dedupe on `tool_use_id`.

4. **Repair hint is wrong.** `jss-devtools init -f` overwrites the harness, user edits included.
   The decision is "update repairs": the hint for a missing or invalid key is
   `jss-devtools harness update`. (Phase 5 now writes a missing key back even at the same
   version.)

5. **Restore the removed comment** in `tsdown.config.ts`:
   `` // `tests/bundle.test.ts` is the real guard; `onlyBundle: false` only silences tsdown's hint. ``
   It names a non-inferable trap and was outside this phase's scope.

6. **`dev` on a fresh clone.** With `clean: false` the CLI config needs `dist/hooks.mjs`. Make
   `scripts.dev` build the hook bundle first, then watch the CLI, so `pnpm dev` still means
   "watch the CLI" and works on a fresh clone.

7. **`knowledge.service.ts` is 214 lines and holds three areas.** Split it along them: decisions,
   index drift, learned skills (one `*.service.ts` each).

8. **One threshold, one predicate.** The SessionStart warning uses `>=` 0.8 and the curation size
   trigger uses `>`. Use one exported predicate for "memory near its cap" in both, with `>=`.

Accepted as reported: the hook-error byte cursor, the review baseline rule, and the 40 KB budget.

# Review: harness phase 3, round 2

Round 1 fixes 2 to 8 are accepted. Two problems remain from the fix for finding 1.

1. **`pnpm test` fails on a fresh clone.** `vitest.config.ts` reads `dist/hooks.mjs` when the
   config loads, before `globalSetup` builds it. Verified by the planner with no build output
   folder: vitest stops with `ENOENT ... dist/hooks.mjs`. Under vitest, define
   `__HARNESS_HOOK_BUNDLE__` as a fixed placeholder string, without reading any file. Tests that
   need the real bundle read `dist/hooks.mjs`, which `globalSetup` builds, at test time.

2. **Revert the tree-shaking workaround.** Remove `treeshake: false` and the
   `void harnessHookBundle` line with its comment from `src/cli.ts`; `cli.mjs` goes back to about
   238 kB. Nothing consumes the constant until phase 4, so this phase proves only that
   `dist/hooks.mjs` is built, under budget, free of `commander` and `@clack/prompts`, and runs with
   its shim without `node_modules`. The "text inside `cli.mjs` equals `dist/hooks.mjs`" assertion
   moves to phase 4, where init imports the constant (the phase file now says so); drop it here.

Verify both, including one run with the build output folder removed:
`pnpm vitest run tests/git-adapter.test.ts`, then the full gate. Append a "Round 2 fixes" section
with the real outputs. Do not commit, do not push. Comments: default zero.
