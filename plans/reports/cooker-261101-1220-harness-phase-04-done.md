# Cooker report: harness plan, phase 4 (init installs the harness)

Task brief: `plans/reports/planner-261101-1150-harness-phase-04-task.md`. Branch `main`, HEAD
`d1f51e2`. Nothing committed, nothing pushed.

## Files changed

**New**

- `src/core/adapters/agent-kit.adapter.ts` — `ak --version` for preflight, `ak init` after the
  writes, and the one command line (`ak init --docs-dir .harness/docs --plans-dir .harness/plans`).
- `src/modules/harness/install-plan.service.ts` — the harness entries for a given input (mode,
  AgentKit, current `CLAUDE.md` / `settings.json` text): every file of the design table with its
  kind, the `.harness/core/manifest.json` (version + managed/block/config paths with kind and
  sha256) and the `.harness/core/base/**` copies. Imports `harnessHookBundle`, so tree-shaking
  keeps the bundle in the CLI bundle.
- `src/modules/harness/merge.service.ts` — `mergeHarnessBlock` (create when absent, replace a
  stale block in place, append after one blank line otherwise) and `mergeHarnessSettings` (adds
  the five hook entries from `hookSettingEntries`, keeps every other key and hook, key order kept,
  idempotent).
- `src/modules/harness/templates/` — `claude-block.template.ts`, `bootstrap.template.ts`,
  `harness-config.template.ts`, `harness-seeds.template.ts`, `harness-template-files.template.ts`,
  `harness-skills.template.ts`: the approved drafts encoded by a generator script from
  `plans/261101-0204-init-harness/content/`, byte-identical (spot-verified against the drafts).
- `tests/harness-install-plan.service.test.ts` (9 tests), harness sections in
  `tests/init-preflight.service.test.ts` (8 new tests) and `tests/init.service.test.ts` (the
  `--agent-kit` + `--no-harness` rule).

**Modified**

- `init.command.ts` — `--no-harness` / `--agent-kit` with the decided help text and defaults; the
  `ak init` step after the writes; the outro line naming the harness.
- `init.service.ts` — `--agent-kit` needs the harness.
- `preflight.service.ts` — harness conflicts join `ownedConflicts` (exit 1 unless `-f`);
  `CLAUDE.md` / `.claude/settings.json` symlink exit 1; invalid `settings.json` JSON exit 1
  naming the parse error; `ak --version` with `--agent-kit` (both modes, never without the flag).
- `plan.service.ts` — appends the harness entries in both modes; skips entries whose content is
  already installed, so a second run with `-f` is a no-op for the harness.
- `init-options.type.ts` — `harness?: boolean`, `agentKit?: true`.
- `harness-paths.constant.ts` — `HARNESS_PLANS_DIR`, `HARNESS_MANIFEST`, `HARNESS_BASE_DIR`,
  `HARNESS_TEMPLATES_DIR`, `CLAUDE_MD`, `CLAUDE_SETTINGS`, block markers.
- Tests: `bundle.test.ts` now proves the hook bundle text inside the CLI bundle equals the hook
  bundle artifact (the install plan imports `harnessHookBundle`; no `treeshake: false`),
  regenerated help blocks (`init.command.test.ts`, `bundle.test.ts`), default-plan counts updated
  only where they assert the default (`48 to create` in the dry-run and install-steps tests), and
  the toolchain list tests in `init-plan.service.test.ts` now pass `harness: false` — those
  unchanged numbers are the byte-for-byte `--no-harness` proof.
- Docs: `docs/decisions/0030-init-node-preset.md` (amendment with the user's quote), new
  `docs/decisions/0031-init-installs-the-harness.md`, `docs/system-architecture.md`,
  `docs/codebase-summary.md`, `docs/project-roadmap.md`.
- `plans/261101-0204-init-harness/phase-04-init-installs-harness.md` — `status: done` only.

## Gate output

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, real output:

- lint: script echo only, exit 0
- `tsc --noEmit`: clean
- vitest: `Test Files 24 passed | 1 skipped (25)` — `Tests 364 passed | 7 skipped (371)` (the
  skipped file is `tests/init.e2e.test.ts`, gated behind `INIT_E2E=1`)
- build: `dist/cli.mjs 271.63 kB`, exit 0

## Scratch-repository run (outside this repo, /tmp/scratch-h4)

`node <dist>/cli.mjs init my-app --pm npm -y` — exit 0, npm install ran (10.4s), outro:

```
└  Next steps
The harness is installed; open Claude Code in the project folder to onboard.
     $ cd my-app
     $ npm run dev
```

The `.harness/` tree: `MEMORY.md`, `BOOTSTRAP.md`, `config.json`, `.gitignore`,
`decisions/README.md`, `docs/README.md`, `plans/README.md`, `templates/**` (7 files),
`bin/hooks.mjs`, `bin/harness-hook.mjs`, `core/manifest.json`, `core/base/**` (15 copies). Plus
`CLAUDE.md` starting with `<!-- HARNESS:BEGIN -->`, `.claude/settings.json` with the five hook
entries, and the three `.claude/skills/harness-*/SKILL.md`.

The installed SessionStart hook, run by hand with a recorded payload on stdin:

```
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"# Harness memory (5 entries, 487/3000 chars)…"}}
HOOK EXIT: 0
```

A second `init -y` in that folder exits 1 with the owned-conflict list ending in
`$ jss-devtools init --force`. `init --no-harness -y` in a sibling folder exits 0 and the tree
contains no `.harness/`, no `CLAUDE.md` block, no `.claude/`.

## Deviations and choices

- **Settings JSON indent is 2 spaces, config.json is tabs.** The draft `config.json` uses tabs and
  is written as the draft; for `.claude/settings.json` the merge re-serializes the user's file, so
  it uses the 2-space shape Claude Code itself writes.
- **The bundle test compares the parsed value, not the raw substring.** The bundler re-serializes
  the `define` string with its own escaping (raw tabs stay raw), so a `toContain` on the
  JSON-escaped text fails; the test extracts the string literal and asserts its value equals the
  hook bundle artifact. Same claim, exact.
- **The install hint for a missing `ak` is `ak is not installed` / `Install ak, then rerun`**; the
  decision log says "the install hint" without giving the sentence.
- **Help examples:** only the `--no-harness` row was added; an `--agent-kit` example row did not
  read naturally.
- **The symlink and invalid-JSON hard stops run even with `-f`**, like the other preflight hard
  stops; `-f` only overrides the owned-conflict list.
- **`settings.json` is kind `merge` and is not in the manifest** — the phase names only managed,
  block and config for the manifest, and the hook-entry merge is idempotent by command.
- **`--agent-kit` is accepted in the plan input but changes no entry**, per "No variant files";
  the plan test asserts the deep-equality of the two plans.

## Limitations

- The `INIT_E2E=1` additions (default create with the harness tree, `--no-harness` equals the
  previous file list, the SessionStart hook run, the stub-`ak` `--agent-kit` runs) were written
  but not executed: the suite installs from the registry and needs every manager. The scratch run
  above exercised the same default path for real (npm), including the hook run.
- The scratch folder is left at `/tmp/scratch-h4` for inspection.

Status: DONE
Summary: init installs the harness by default in both modes through the existing flow, with
`--no-harness` proven byte-for-byte unchanged, `--agent-kit` running `ak init` only, and the full
gate green (364 tests, lint, typecheck, build).

## Round 1 fixes

Review: `plans/reports/planner-261101-1221-harness-phase-04-review.md`.

1. **Final newlines.** The generator had stripped the drafts' trailing newline; all 17 draft-derived
   template literals (`harness-seeds`, `harness-template-files`, `harness-skills`, `bootstrap`)
   now end with exactly one `\n`, so the installed files and the `core/base/**` copies match the
   drafts. New test `ends every text entry with exactly one newline` in
   `tests/harness-install-plan.service.test.ts` (the hook bundle entry is skipped in unit tests:
   its text is build output, injected as the vitest placeholder there). Fresh scratch install and
   `cmp` against the drafts, all byte-identical:

   ```
   SAME .harness/MEMORY.md
   SAME .harness/.gitignore
   SAME .harness/templates/decision.md
   SAME .claude/skills/harness-review/SKILL.md
   SAME .harness/BOOTSTRAP.md
   ```

2. **Outro alignment.** The harness line is indented five spaces, matching the next-step command
   lines, from a fresh run of the built CLI:

   ```
   └  Next steps
        The harness is installed; open Claude Code in the project folder to onboard.
        $ cd withharness
        $ npm run dev
   ```

   (`--no-harness` prints no harness line, verified in the same run.)

3. **The new e2e cases ran, with npm on PATH** (`INIT_E2E=1 pnpm vitest run tests/init.e2e.test.ts -t …`):

   - `-t "npm"` (default create: full harness file list plus the SessionStart hook run):
     `Tests 2 passed | 5 skipped (7)`
   - `-t "no-harness"` (`--no-harness` writes exactly the previous toolchain list):
     `Tests 1 passed | 6 skipped (7)`
   - `-t "agent-kit"` (stub `ak` on PATH runs `ak init --docs-dir .harness/docs --plans-dir
     .harness/plans`; missing `ak` exits 1 before any write): first run failed — the test replaced
     `PATH` and lost `node`, so `execFile('node')` died with ENOENT and an empty stderr; fixed by
     spawning `process.execPath` — then `Tests 1 passed | 6 skipped (7)`.

   The existing-mode e2e (`sets up the project again…`) was not run here: it needs the pnpm
   project the full manager sweep leaves behind; it ran green in your planner round.

Gate after the fixes, real output: lint exit 0; `tsc --noEmit` clean; `Tests 365 passed | 7
skipped (372)`; build `dist/cli.mjs 271.66 kB`, exit 0.
