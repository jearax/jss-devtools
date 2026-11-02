# Cook report: scaffold touch-ups (moss green banner, fuller ignore files, AgentKit wording)

Plan: [261102-1247-scaffold-touchups](../261102-1247-scaffold-touchups/plan.md), all three phases.
Date: 2026-11-02. Branch `main`. Nothing committed, nothing pushed.

An independent review ran on the first pass and found a defect in the AgentKit detection. The user
and the planner decided the fix; this report is the final state.

## Files changed

### Phase 1 — the banner in moss green

| File | Change |
| --- | --- |
| `src/core/constants/banner.constant.ts` | `DS_PRIMARY_300/400/500` → `DS_MOSS_300/400/500` (`#a8d558`, `#8abd2c`, `#5e8c04`) |
| `src/core/ui/banner.ui.ts` | the new constant names; the 16-colour code `35` → `32` |
| `tests/banner.test.ts` | truecolor stops `38;2;168;213;88` and `38;2;94;140;4;2`; 16-colour `32` and `32;2` |
| `docs/system-architecture.md` | the banner paragraph says moss green and "a single green" |

### Phase 2 — the ignore files

| File | Change |
| --- | --- |
| `src/commands/init/templates/gitignore.template.ts` | the grouped target `.gitignore` (dependencies, build output, frameworks, tests and coverage, caches, logs and runtime, environment, temporary, editors, OS) |
| `src/commands/init/templates/prettierignore.template.ts` | the lockfiles, `.yarn/`, `.harness/bin/` and `.harness/core/`; everything it repeated from `.gitignore` is gone |
| `src/modules/harness/templates/*.template.ts` | the Markdown the harness installs, rewritten in Prettier 3.9.10's output: tables aligned, a blank line after every heading, Prettier's list indents. Formatting only, no wording |
| `tests/harness-markdown-format.test.ts` | **new**: every Markdown entry the harness installs is already in Prettier's output, and the repo's Prettier is the version the scaffold installs |
| `tests/node-preset-templates.test.ts` | two new tests: `.prettierignore` repeats no entry of `.gitignore`, and no `.gitignore` entry names a lint-glob source folder |
| `tests/node-preset-versions.test.ts` | the eslint-ignored folders are now looked up in `.gitignore` **and** `.prettierignore` together |
| `tests/init-plan.service.test.ts` | the `.env*` assertion became `.env` and `.env.*` |
| `tests/__snapshots__/node-preset-templates.test.ts.snap` | the two ignore snapshots |

### Phase 3 — the CLAUDE block follows AgentKit

| File | Change |
| --- | --- |
| `src/modules/harness/templates/claude-block.template.ts` | `harnessClaudeBlockTemplate` is now a function of `agentKit: boolean`; the ownership bullets are the two target variants |
| `src/modules/harness/templates/harness-seeds.template.ts` | the AgentKit line is gone from the docs and plans READMEs |
| `src/modules/harness/templates/harness-template-files.template.ts` | the AgentKit line is gone from the templates README |
| `src/modules/harness/services/agent-kit.service.ts` | **new**: `usesAgentKit`, the one detector |
| `src/modules/harness/constants/harness-paths.constant.ts` | `AGENT_KIT_CONFIG = '.agentkit/config.yaml'` |
| `src/modules/harness/services/index-drift.service.ts` | imports the detector from its new home |
| `src/modules/harness/services/health-skills.service.ts` | imports the detector from its new home; the `ak-*` scan stays, the gate is the new detector |
| `src/modules/harness/services/install-plan.service.ts` | the block is rendered from `input.agentKit`; `harnessRecordedFiles` takes the setting as an argument |
| `src/modules/harness/services/update-release.service.ts` | `harnessRelease(root)` passes `usesAgentKit(root)` |
| `src/commands/harness/update.command.ts` | passes the repository root |
| `tests/harness-update.test.ts` | four new tests: keep, add and remove the AgentKit lines; `ak-*` skills without the config count as no AgentKit; `init --agent-kit` followed by an update keeps the lines |
| `tests/harness-doctor.test.ts` | the `ak-*` warning test writes the AgentKit config |
| `tests/harness-hooks.test.ts` | the docs-drift test writes the AgentKit config |
| `tests/harness-install-plan.service.test.ts` | the two block variants, and no folder README mentions AgentKit |
| `docs/decisions/0034-claude-block-follows-agentkit.md` | **new** decision record |
| `docs/decisions/0031-init-installs-the-harness.md` | points to 0034 for the block; lists `plans/README.md` as managed; names the detection |
| `docs/decisions/0032-harness-update.md` | one line: update renders the block for the setting it detects |
| `docs/project-roadmap.md`, `docs/system-architecture.md` | the `--agent-kit` flag and the block |
| `plans/261102-1247-scaffold-touchups/phase-03-agentkit-wording.md` | the detection table, the code list and the test list |
| `plans/261031-2325-init-harness-discussion/decision-log.md` | the "CLAUDE block follows AgentKit" section: `.agentkit/config.yaml`, with the user's quote |

## The review findings and what was done with them

| # | Finding | Resolution |
| --- | --- | --- |
| 1 | HIGH — `init --agent-kit` lost the AgentKit lines on the next `harness update`: the detector looked for `.claude/skills/ak-*`, but `ak init` writes no skill | Fixed by decision: the detector is now `.agentkit/config.yaml`, the file `ak init` writes and the project commits. `hasAgentKitSkills` → `usesAgentKit`, used by the update flow, the index drift check and the doctor. Reproduced before the fix, verified after |
| 2 | MEDIUM — the detector missed globally installed AgentKit skills | Resolved by the same decision: AgentKit's skills live in the user's global directory and say nothing about this repository; `.agentkit/config.yaml` is the evidence for *this* repository |
| 3 | MEDIUM — `.prettierignore` missed `.harness/core/`, so `pnpm format` dirtied the tree and the doctor warned | Fixed by decision, then by the user's change of direction: `.harness/core/` and `.harness/bin/` stay ignored, and the harness's Markdown is installed already in Prettier's output. The tree is clean and the doctor prints no "changed from its base" line |
| 4 | LOW — 0034 claimed the doctor compares the block with the manifest hash | Corrected: the doctor compares only the hook bundle; the block is checked for its markers |
| 5 | LOW — an installed repository keeps the old AgentKit line in the docs README (a seed outside the manifest) | Kept, as the plan accepted it, and 0034 now says plainly what the stale line says |
| 6 | LOW — `harness update --continue` re-derives the release, so a staged session can drift | Not changed: it is outside this plan's scope. The release now depends on one file the user controls, which is the smallest such surface |
| 7 | The planner's review: 0034's decision paragraph and the "One block for both cases" row said two things that are not so | Both rewritten: the two variants carry the `harness update` line, the AgentKit variant adds the `ak update` and ownership lines; the row now says the previous state was one conditional line in every repository, replaced at the user's request |

## Gate

`pnpm lint && pnpm typecheck && pnpm test && pnpm build`:

```
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
$ vitest run

 Test Files  27 passed | 1 skipped (28)
      Tests  436 passed | 7 skipped (443)

ℹ dist/cli.mjs  322.39 kB │ gzip: 84.31 kB
✔ Build complete in 26ms
```

`pnpm format:check` also passes: "All matched files use Prettier code style!".

## The banner check (phase 1, step 4)

Run in a pty of 24×80 with `COLORTERM=truecolor` (`node dist/cli.mjs --version`), the first and
last column of the art:

```
^[[38;2;168;213;88m█^[[0m ... ^[[38;2;94;140;4;2m╝^[[0m
```

The left stop is `#a8d558` (168,213,88) and the right stop is `#5e8c04` (94,140,4), the gradient
runs between them column by column, and the shadow characters carry the `;2` dim, as before. The
info column (`jss-devtools v0.0.1`, the description, the Node and platform line) is unchanged.

## Phase 2, step 5: formatting a fresh scaffold

Two fresh temp folders, the flow a user runs: `init -y` (and `init -y --agent-kit`), commit,
`pnpm format` twice, `harness doctor`.

```
=== app: pnpm format (1st) ===
src/main.ts 17ms (unchanged)
tsconfig.json 1ms (unchanged)
=== git status --porcelain (after 1st) ===
(above empty = clean)
=== pnpm format (2nd) ===
src/main.ts 11ms (unchanged)
tsconfig.json 1ms (unchanged)
=== git status --porcelain (after 2nd) ===
(above empty = clean)
=== harness doctor ===
┌   jss-devtools harness doctor
│  ✔ Memory         488/4800 chars, 5 entries
│  ✔ Decisions      0 decisions in force
│
└  Harness is healthy

doctor exit=0
```

The `--agent-kit` folder gives the same output: the tree stays clean after both formats, and the
doctor prints no "changed from its base" line.

**Why it holds.** The harness's Markdown is installed already in Prettier's output, so
`prettier --write .` has nothing to change. The test that proves it formats every Markdown entry
`harnessInstallEntries` produces — create and existing mode, with and without AgentKit, and with a
user's own `CLAUDE.md` in front of the block — and requires the result to equal the file. It
failed against the old templates (first on `.harness/decisions/README.md`), which is the evidence
that it pins the behaviour. The same test holds the repo's installed Prettier to the version the
scaffold installs, so the two cannot drift apart unnoticed.

The `.prettierignore` now names only the machine-written files: `.harness/bin/` (the hook bundle
and its shim) and `.harness/core/` (the manifest and the base copies). Prettier still formats the
user's own files — a learned skill and a note in `.harness/docs/` both came back with their tables
aligned.

For the comparison, the same flow with the old `.prettierignore` restored:

```
=== B (without .harness/core/ ignored) ===
dirty files:        1
 M .harness/core/base/.harness/bin/hooks.mjs
doctor warnings: 1
└  Harness is healthy
```

**What the reformat changed, and what it did not.** `git diff -w` on the template files shows no
wording change: table columns padded, a blank line after every heading, Prettier's list
continuation indent, and `harness-pinned: "false"` becoming `'false'` inside the YAML code fence
of the skill template. The `CLAUDE.md` block's nested ownership bullets come through untouched.

## Phase 3, step 3: the two blocks

`node dist/cli.mjs init app-plain --pm pnpm -y` and `node dist/cli.mjs init app-ak --pm pnpm -y
--agent-kit` in `/tmp/jss-v2` (`ak 3.0.0-beta.41` is installed, so the second one ran).

Without AgentKit:

```
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
```

With AgentKit:

```
- Do not edit what an update replaces; put a correction in a learned skill or a memory line instead:
  - `harness-*` skills, `.harness/{bin,core,templates}/`: `jss-devtools harness update`.
  - `ak-*` skills, `.claude/{hooks,rules,agents,output-styles,scripts}/`: `ak update`.
- AgentKit owns `.harness/{docs,plans}/`: follow its skills there. It also works in `.harness/decisions/`.
```

Both match the target text of the phase file. `jss-devtools harness doctor` in each folder prints
"Harness is healthy" and exits 0. No folder README mentions AgentKit:

```
$ grep -rl "AgentKit" .harness --include="README.md"
none
```

The update flow, in the plain folder: adding `.agentkit/config.yaml` and running `harness update -y`
reports "1 to update ~ CLAUDE.md" and writes the AgentKit lines into the block; removing that file
and updating again removes them. A repository with `.claude/skills/ak-*` but no
`.agentkit/config.yaml` keeps the block without the AgentKit lines.

The case the review reproduced, re-run against the fixed build:

```
$ node dist/cli.mjs init app --pm pnpm -y --agent-kit
=== after init --agent-kit ===   2 lines with AgentKit
$ node dist/cli.mjs harness update -y
└  Harness is up to date
=== after harness update ===      the two AgentKit lines are still there
```

## Deviations and notes

1. **`tests/node-preset-versions.test.ts` changed meaning, not just its data.** The old test
   asserted that every folder the preset ESLint config ignores is listed in `.prettierignore`. The
   new `.prettierignore` holds only the lockfiles, `.yarn/` and the harness's own files, so that
   assertion no longer holds; the test now looks the folders up in `.gitignore` and
   `.prettierignore` together. The invariant it protects is unchanged: Prettier 3 follows
   `.gitignore`, and `dist/`, `coverage/` and `node_modules/` are in it.
2. **`tests/init-plan.service.test.ts`** — the `.env*` assertion became `.env` and `.env.*`.
3. **The `.gitignore` has no group headers.** The target table lists entries per group with a
   blank line between the groups, and `init` merges an existing `.gitignore` line by line, so a
   comment header would be appended out of place on merge.
4. **`hasAgentKitSkills` was replaced, not moved.** The review showed the rule it encoded was
   wrong, so `usesAgentKit` on `.agentkit/config.yaml` replaced it at every use site.
5. **The detection is proved by mutation.** With the old rule restored, four of the new tests
   fail, including "keeps the AgentKit lines when init --agent-kit is followed by harness update".

## Not checked

- `pnpm test` leaves one suite skipped (the registry install e2e, gated behind `INIT_E2E=1`); it
  was not run.
- The banner was seen through a pty, not in a human terminal, so the rendering is the escape
  codes and their order, not the eye's view of the moss green.
- No commit and no push, as the task asked.

```text
Status: DONE_WITH_CONCERNS
Summary: The banner now runs the design system's moss green scale, the generated .gitignore and
.prettierignore follow the plan's targets, the harness's Markdown is installed already in
Prettier's output so a fresh scaffold formats to a clean tree with a healthy doctor, and the
CLAUDE.md block carries the AgentKit lines only when .agentkit/config.yaml says AgentKit is in use.
Concerns/Blockers: The scaffold installs Prettier with a caret range ("^3.9.10"), so a user who
installs a later Prettier 3.x may get a Markdown output this repo never saw, and the harness's
Markdown would drift again. The new test pins this repo's Prettier to the preset version, which
covers the repo but not the user's project; pinning the scaffold's Prettier exactly is the
one-line mitigation, and it is the user's call.
```
