# Cooker report: harness phase 3 (hooks and the embedded hook bundle)

Date: 2026-11-01. Task brief: `planner-261101-1034-harness-phase-03-task.md`. Phase file:
`plans/261101-0204-init-harness/phase-03-hooks-and-hook-bundle.md` (status set to `completed`).
Not committed, not pushed.

## What changed

New, under `src/modules/harness/`:

- `harness-hook.entry.ts` — reads the payload on stdin, dispatches, prints one JSON line, always
  exits 0; any error is appended to `.harness/state/hook-errors.log`.
- `dispatcher.service.ts` — routes on `hook_event_name`; computes the worktree fingerprint only
  for `SessionStart` and `Stop`.
- `hooks/session-start.hook.ts` — memory with size, decisions in force (skips `Superseded`),
  onboarding notice, config problems, memory near-cap, index drift (docs skipped when
  `.claude/skills/ak-*` exists), hook errors since the last session (byte-offset cursor at
  `.harness/state/hook-errors.cursor`); appends the `start` line.
- `hooks/post-tool-use.hook.ts` — memory guard (`decision: "block"`) for `Write|Edit|MultiEdit` on
  `.harness/MEMORY.md`; otherwise appends one `tool` event (skills from Skill/Read/Bash,
  onboarding detection, subagents skipped by `agent_id`).
- `hooks/post-tool-use-failure.hook.ts` — appends `fail` with the first line of `error`, secrets
  redacted; skips `is_interrupt`.
- `hooks/stop.hook.ts` — returns at once on `stop_hook_active`; prunes session logs older than
  7 days; folds skill usage to `.harness/state/skill-usage.json`; writes `.harness/curator.json`
  (`{lastRun}`) when the session used `harness-curate`; then the first of onboarding / review due
  / curation due as `additionalContext`.
- Services: `config.service.ts` (every missing or invalid key is a warning plus
  `jss-devtools init -f` repair hint; the feature reads no default), `memory.service.ts`,
  `knowledge.service.ts` (decisions, drift, learned skills), `session-log.service.ts`,
  `skill-usage.service.ts` (curator state, `dayDiff`), `fingerprint.service.ts`,
  `hook-errors.service.ts`, `redaction.service.ts`.
- `constants/`: `harness-paths.constant.ts`, `harness-limits.constant.ts` (ratio 0.8, size
  cooldown 1 day, TTL 7 days, guard tools), `hook-settings.constant.ts` (the five settings
  entries and the command, for phase 4).
- `templates/hook-shim.template.ts` — the shim text; parses on old Node, exits 0 silently below
  the floor, imports `./hooks.mjs` otherwise.
- `types/hook.type.ts`.

Build:

- `tsdown.hooks.config.ts` (new) builds `dist/hooks.mjs` from the hook entry; `tsdown.config.ts`
  embeds the bundle text as `export const harnessHookBundle` through `footer` and now uses
  `clean: false` so the hooks bundle survives; `package.json` `scripts.build` runs the hooks
  config first, then the CLI config; `tests/setup/global-setup.ts` builds both before vitest.

Tests:

- `tests/harness-hooks.test.ts` (new, 24 tests): every behavior row and bullet, run against the
  real `dist/hooks.mjs` in temp git repositories — injection content, superseded skip, onboarding,
  near-cap warning, missing key, corrupt config, drift with and without `ak-*`, hook errors once,
  start line, memory guard block, other files untouched, eight parallel PostToolUse events, the
  subagent skip, skill recording, redacted failure, `stop_hook_active`, onboarding-until-asked,
  review on threshold plus changed tree and on any failure, no review without git, curation on
  interval and on size, fresh curation silent, `curator.json` written, usage folded, stale logs
  pruned.
- `tests/bundle.test.ts` (extended): `hooks.mjs` holds no `commander` or `@clack/prompts` and
  stays inside the 40 KB budget; the embedded text in `cli.mjs` equals the fresh bundle byte for
  byte; shim plus bundle run in a sandbox with no `node_modules`, and a below-floor shim exits 0
  with no output.

Docs: `CLAUDE.md` ("Where things are" rows), `docs/system-architecture.md` (layout tree and the
second-entry paragraph), `docs/codebase-summary.md` (the `src/modules/harness/` row).

## Gate output (real)

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ eslint …
$ tsc --noEmit
 Test Files  23 passed | 1 skipped (24)
      Tests  343 passed | 5 skipped (348)
ℹ dist/hooks.mjs  23.46 kB │ gzip: 6.68 kB
ℹ dist/cli.mjs   238.48 kB │ gzip: 61.31 kB
✔ Build complete
```

## Measurements

- `hooks.mjs`: 23.46 kB (23 460 bytes reported by tsdown), budget set at 40 KB in
  `tests/bundle.test.ts`.
- Wall time of one SessionStart hook in a temp repository (node start + fingerprint + state
  write): ~31 ms total (`0.02s user, 0.031 total`).

## Deviations from the phase file, and why

1. **Fingerprint is an fs walk, not `git diff`.** `src/core/adapters/git.adapter.ts` exposes only
   `gitVersion/gitInit/gitHooksPath/gitTopLevel` and is outside the allowed file list; the
   architecture rules forbid spawning git outside an adapter. The fingerprint hashes
   relative path + size + mtime over the worktree from `gitTopLevel`, excluding `.git`,
   `node_modules`, `dist`, `coverage`, `.harness/state`, `.harness/update`. A git failure (or no
   repository) yields `null` = "unknown", never "changed".
2. **PostToolUse double fire.** With both settings entries (sync edit matcher and async
   catch-all), Claude Code runs the same command twice for one edit tool call. The handler
   dedupes on `tool_use_id` when the payload carries it; if a Claude Code version omits that
   field, edit-tool calls are counted twice (the guard still blocks correctly).
3. **Repair command wording** (`jss-devtools init -f`) was not fixed by any plan document; `-f`
   is the documented overwrite path for an existing harness file, so it restores missing keys.
4. **Hook-error cursor.** "Entries since the last session" needs state; a byte-offset cursor at
   `.harness/state/hook-errors.cursor` is written by SessionStart after warning.
5. **`clean: false` on the CLI tsdown config** means a bare `tsdown` run (the `dev` script) on a
   fresh clone fails until `dist/hooks.mjs` exists; `pnpm build` and the test globalSetup always
   build it first.
6. The Stop review baseline is the last non-null fingerprint on `start`/`review` lines up to and
   including the last `review` line; the curation size trigger uses a strict `>` of the 0.8 ratio
   while the session-start warning uses `>=`.

Status: DONE_WITH_CONCERNS
Summary: Phase 3 implemented and green on the full gate (343 tests, hooks.mjs 23.46 kB, SessionStart ~31 ms); all behavior rows are proven by tests run against the real bundle.
Concerns/Blockers: The PostToolUse `tool_use_id` field is not confirmed for the Claude Code version in use — without it, edit-tool calls double-count in session logs (guard unaffected); also the `dev` script needs `dist/hooks.mjs` to exist on a fresh clone.

## Round 1 fixes

All 8 findings from `planner-261101-1119-harness-phase-03-review.md` fixed.

1. **Define injection instead of footer.** Removed the `footer`; `tsdown.config.ts` now injects
   `__HARNESS_HOOK_BUNDLE__` through `define`, read in one place,
   `src/modules/harness/constants/hook-bundle.constant.ts`; `vitest.config.ts` defines the same
   name (reading `dist/hooks.mjs`, which globalSetup always builds first). Two extra facts the
   fix needed: nothing imported the constant, so tree-shaking dropped it — `src/cli.ts` now
   carries one binding (`void harnessHookBundle`) whose only job is keeping the injected text in
   `cli.mjs` until init writes it out, and the CLI build sets `inputOptions.treeshake: false`
   because a pure literal binding alone was still folded away. The bundle test proves
   `harnessHookBundle === dist/hooks.mjs` and that the literal inside `cli.mjs` decodes to the
   same bytes (rolldown prints raw tabs inside the literal, which JS allows and JSON.parse
   does not, hence the tab re-escaping before parsing).
2. **Git-based fingerprint.** New `gitWorktreeChanges` in `src/core/adapters/git.adapter.ts`
   returns `git status --porcelain=v1 -z --untracked-files=all` and `git diff HEAD
   --no-ext-diff`; any non-zero exit, missing git or a repository without `HEAD` yields `null`
   ("unknown"). `worktreeFingerprint` hashes both outputs; the fs walk is deleted. Adapter test
   added (null outside a repo and without HEAD, empty strings on a clean HEAD repo, status names
   a new file). The test repositories now commit once and carry `.harness/.gitignore`
   (`state/`, `update/`) so hook state does not churn the fingerprint.
3. **Memory guard gets its own command.** `memoryGuardCommand` = `node "$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs" memory-guard`;
   `hook-settings.constant.ts` wires the sync `Write|Edit|MultiEdit` entry to it and the async
   catch-all to the plain command. The dispatcher takes a mode argument and maps `memory-guard`
   to `memoryGuardHook` (guards only, never logs); `toolLogHook` only logs, skips subagents by
   `agent_id`, and the `tool_use_id` dedupe is gone. Tests assert the guard blocks without
   writing a session event and the logging entry counts a memory write without blocking.
4. **Repair hint** is now `run "jss-devtools harness update" to restore the default keys`;
   the test asserts `harness update`.
5. **Restored** the `onlyBundle: false` comment in `tsdown.config.ts`.
6. **`scripts.dev`** is now `tsdown --config tsdown.hooks.config.ts && tsdown --watch`, so
   `pnpm dev` still watches the CLI and works on a fresh clone.
7. **`knowledge.service.ts` split** into `decisions.service.ts` (frontmatter, `decisionsInForce`,
   `decisionFileIds`), `index-drift.service.ts` (`indexDrift`, `hasAgentKitSkills`), and
   `learned-skills.service.ts` (`learnedSkillNames`); importers updated.
8. **One predicate:** `memoryNearCap(size, maxChars)` in `memory.service.ts` (`>=` of the 0.8
   ratio) is used by both the SessionStart warning and the Stop curation size trigger.

Gate (real output):

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
      Tests  346 passed | 5 skipped (351)
ℹ dist/hooks.mjs  23.63 kB │ gzip: 6.78 kB
ℹ dist/cli.mjs   298.05 kB │ gzip: 74.67 kB
✔ Build complete
```

Measurements after the fixes: `hooks.mjs` 23 628 bytes (budget 40 KB, still asserted by the
test); one SessionStart hook in a fresh temp repository: ~34 ms wall (`0.03s user, 0.034 total`).
`cli.mjs` grew from 238 kB to 298 kB uncompressed (gzip 61 kB to 74.7 kB) because
`treeshake: false` keeps every reachable module's unused exports; release ships one file and one
checksum as before, and `tests/bundle.test.ts` still asserts the embedded text equals the fresh
`hooks.mjs`.

Status: DONE
Summary: All 8 round-1 findings fixed; full gate green (346 passed, hooks.mjs 23.63 kB, SessionStart ~34 ms) with the bundle embedded through `define` and the fingerprint read from git.
Concerns/Blockers: none.

## Round 2 fixes

Both round-2 findings fixed.

1. **Fresh-clone vitest.** `vitest.config.ts` no longer reads `dist/hooks.mjs` at config load:
   `__HARNESS_HOOK_BUNDLE__` is defined as the fixed placeholder string
   `__HARNESS_HOOK_BUNDLE_PLACEHOLDER__`, and the `readFileSync` import is gone. Verified with
   the build output folder removed:
   `pnpm vitest run tests/git-adapter.test.ts` → `Test Files 1 passed (1), Tests 7 passed (7)`
   (globalSetup built the bundles first, so the tests that read `dist/hooks.mjs` do so at test
   time).
2. **Tree-shaking workaround reverted.** `treeshake: false` and its comment are removed from
   `tsdown.config.ts`; the `harnessHookBundle` import and the `void harnessHookBundle` binding
   with its comment are removed from `src/cli.ts`. The "embedded in cli.mjs byte for byte" test
   is dropped (it moves to phase 4, where init imports the constant);
   `tests/bundle.test.ts` keeps the budget/no-commander test and the shim sandbox test.
   `constants/hook-bundle.constant.ts` stays, ready for phase 4's import.

Full gate after the fixes (real output):

```
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
      Tests  345 passed | 5 skipped (350)
ℹ dist/cli.mjs  213.09 kB │ gzip: 54.98 kB
✔ Build complete in 20ms
```

`cli.mjs` is back to 213 kB, without the embedded bundle text (the earlier 238 kB figure
included the 22 kB footer). One note for phase 4: with tree-shaking active again, `init` must
import `harnessHookBundle` in real code, or the define substitution will be shaken out of
`cli.mjs`.

Status: DONE
Summary: Both round-2 findings fixed; the fresh-clone vitest run and the full gate are green (345 passed), `cli.mjs` back to 213 kB with no workarounds.
Concerns/Blockers: none.


