---
phase: 4
title: "init --share-knowledge"
status: done
priority: P1
effort: 1.5d
dependencies: [2, 3]
---

# Phase 4: init --share-knowledge

## Goal

A new install keeps harness knowledge out of git. `init --share-knowledge` keeps it in git, as
0.1.0 did. An install made before this release keeps sharing, with nothing changed silently.

## Context

- The harness tells the agent to write memory, decisions, docs, plans and learned skills and to
  commit them with the work (`claude-block.template.ts:91`). In a public repository that publishes
  whatever the agent wrote.
- `.harness/.gitignore` is a managed file with two lines, `state/` and `update/`
  (`harness-seeds.template.ts`).
- A learned skill is `.claude/skills/<name>/` whose `SKILL.md` carries
  `harness-origin: learned` (`learned-skills.service.ts`). Its name has no pattern, and the
  `.gitignore` that `init` writes has no rule for `.claude/`.
- The AgentKit setting is the existing example of a mode: detected in the repository
  (`usesAgentKit`), passed as `HarnessInstallInput.agentKit`, rendered by `OWNED_FILES`. Decision
  0031 allows one varying file for it and rejects variant files otherwise: "No variant files".
- `mergeHarnessConfig` (`config-merge.service.ts`) resets a key that equals its base copy to the
  current default, and fills a group the live file lacks with the defaults.
- `planHarnessUpdate` never produces a `create` action: a path that is new upstream and absent
  locally reaches `decideWholeFile` with `local === null` and becomes the conflict
  "managed file deleted locally".

## What the key decides

| | `knowledge.share: false` (default) | `knowledge.share: true` (`--share-knowledge`) |
| --- | --- | --- |
| In git | The `CLAUDE.md` block, `.harness/config.json`, `.harness/templates/`, `.harness/core/`, `.harness/bin/`, the `harness-*` skills, the hook entries | The same, plus memory, decisions, docs, plans, the archive, `curator.json` and learned skills |
| A fresh clone | Starts with empty knowledge; the first session writes the seed files and asks to onboard | Has the team's knowledge |
| Teammates, a second machine | Each machine learns on its own | Learn from each other through commits |
| Backup | None: deleting the folder loses it | Git |

## Requirements

1. **Flag.** `init` gains `--share-knowledge`:
   `Keep harness knowledge in git instead of ignoring it (default: off)`, with one example row.
   `InitOptions.shareKnowledge?: true`. With `--no-harness`, `validateInitArguments` exits 1
   before any write: `Option --share-knowledge needs the harness`, hint `Drop --no-harness`.
   `init` asks no new question and its outro does not change (decision 0031).
2. **Key.** `HARNESS_CONFIG_DEFAULTS` gains `knowledge: { share: false }` and `HarnessConfig` a
   `knowledge: { share?: boolean }` group. `harnessConfigTemplate` takes the value `init` chose.
   `readConfig` reads boolean keys the way it reads number keys; a missing or non-boolean value
   is the problem `config.json is missing a usable "knowledge.share"`.
3. **Merge.** `knowledge.share` is a choice, not a default, so `mergeHarnessConfig` never resets
   it. The rule runs before the branch that fills a missing group:

   | Live file has the key | Base copy has the key | Result |
   | --- | --- | --- |
   | yes, a boolean | any | the live value |
   | no | yes | the base value |
   | no | no | `true`: the install predates the key and has been sharing |

   One function, `resolveKnowledgeShare(baseRaw, localRaw)`, holds this rule. `mergeHarnessConfig`
   and `harnessRelease` both call it, and it returns the third row for text it cannot parse.
4. **The ignore files follow the key.** They are the exception to "No variant files"; the new
   decision says so.
   - `.harness/.gitignore`: with `true`, today's two lines. With `false` it adds `MEMORY.md`,
     `BOOTSTRAP.md`, `curator.json`, `decisions/`, `docs/` and `archive/`, and for plans either
     `plans/` (with AgentKit, where the README is the repository's index) or `plans/*` and
     `!plans/README.md` (without AgentKit, where that README is a managed file).
   - `.claude/skills/.gitignore`, a managed file written only with `false`: `/*`, `!/.gitignore`,
     `!/harness-*/`, `!/ak-*/`.
5. **Everything else stays one copy** and states the rule as a run-time condition:
   - the `CLAUDE.md` block replaces "Commit harness changes with the work; the harness never
     commits." with: knowledge follows `knowledge.share` in `.harness/config.json`, which session
     start states; shared knowledge is committed with the work; private knowledge is gitignored
     and stays on this machine, so list what changed and ask for no commit; the harness never
     commits;
   - `harness-onboard` steps 2 and 8, `harness-review` section 5 and `harness-curate` step 6 say
     "when knowledge is shared" where they tell the user to commit or mention a teammate.
6. **SessionStart.**
   - It adds one line to its context: `Harness knowledge: shared through git` or
     `Harness knowledge: private to this machine (gitignored)`.
   - With `false`, it creates each missing seed through the safe write of phase 2: `MEMORY.md`,
     `decisions/README.md`, `docs/README.md`, `plans/README.md` in the variant `usesAgentKit`
     selects, and `BOOTSTRAP.md` (the existing-project text) only when `MEMORY.md` was missing.
     A failed write goes to the hook error log and the session continues.
   - With `true`, or when the key is unusable, nothing is created and a missing `MEMORY.md` stays
     a warning, as today.
7. **Plumbing.** `HarnessInstallInput` gains `shareKnowledge`; `OWNED_FILES`,
   `harnessRecordedFiles` and `harnessInstallEntries` take it; `plan.service.ts` of `init` passes
   `options.shareKnowledge === true`; `harnessRelease(root)` passes
   `resolveKnowledgeShare(base, live)` of `.harness/config.json`.
8. **A file that is new upstream is created.** In `planHarnessUpdate`, a path the manifest does
   not record and the repository does not hold becomes a `create` action, reason
   `new in this release`. A path the manifest records and the repository lost stays the existing
   conflict.
9. **Doctor.** The summary gains a `Knowledge` row: `shared through git` or
   `private to this machine`.
10. **One list of knowledge paths.** One exported constant names them. The ignore template, the
    seeding and the documentation table read it, so a later per-kind setting (decisions shared,
    memory private) changes that list and the config type only. Nothing is built for it now.
11. The CLI never runs `git add` or `git rm`. Changing the key later is: edit the key, run
    `jss-devtools harness update` (it re-renders the two ignore files), then the user runs
    `git rm -r --cached <paths>` to go private or `git add` to share. Phase 5 documents it.

## Files

- Modify: `src/commands/init/init.command.ts`, `src/commands/init/types/init-options.type.ts`,
  `src/commands/init/services/init.service.ts`, `src/commands/init/services/plan.service.ts`,
  `src/modules/harness/templates/harness-config.template.ts`, `harness-seeds.template.ts`,
  `claude-block.template.ts`, `harness-skills.template.ts`,
  `src/modules/harness/types/hook.type.ts`,
  `src/modules/harness/constants/harness-paths.constant.ts`,
  `src/modules/harness/services/config.service.ts`, `config-merge.service.ts`,
  `install-plan.service.ts`, `update-release.service.ts`, `update-plan.service.ts`,
  `update-decide.service.ts`, `src/modules/harness/hooks/session-start.hook.ts`,
  `src/commands/harness/services/doctor.service.ts`, `src/commands/harness/harness.command.ts`.
- Tests: `tests/init.service.test.ts`, `tests/init.command.test.ts`, `tests/init.e2e.test.ts`,
  `tests/harness-install-plan.service.test.ts` and its snapshot, `tests/harness-config.test.ts`,
  `tests/harness-update.test.ts`, `tests/harness-update-units.test.ts`,
  `tests/harness-hooks.test.ts`, `tests/harness-doctor.test.ts`, `tests/bundle.test.ts` (the
  `init --help` assertion).

## Tasks

- [ ] The key: defaults, type, template, reader, and `resolveKnowledgeShare` with a table test of
      the three rows plus unparsable text.
- [ ] The merge rule in `mergeHarnessConfig`, with tests: a fixture whose live and base config
      have no `knowledge` group ends with `true`; a live `true` over a base `false` stays `true`;
      a live `false` equal to its base stays `false`.
- [ ] The knowledge-path constant and the two ignore templates; `OWNED_FILES` and the release.
      Snapshot both values of the key with AgentKit on and off.
- [ ] The `create` action, with a failing test first: a release that adds a managed file applies
      without a conflict.
- [ ] The flag, its validation and help; `tests/init.service.test.ts` and the help assertions.
- [ ] The block sentence and the four skill sentences.
- [ ] SessionStart: the state line and the seeding, with hook tests: a clone without the seeds
      gets them and reports onboarding pending; with `true` nothing is written.
- [ ] The `Knowledge` row and the help text.
- [ ] Update tests: a 0.1.0-style install updates to `knowledge.share: true` with no change to
      `.harness/.gitignore`; flipping the key to `false` and updating rewrites
      `.harness/.gitignore` and creates `.claude/skills/.gitignore`; flipping back deletes the
      untouched file.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`.
- In a temporary git repository: `init -y`, then `git add -A` and `git status --short` list no
  `MEMORY.md`, nothing under `.harness/decisions`, `.harness/docs` or `.harness/plans`, and no
  learned skill. With `--share-knowledge` they are listed.
- Clone that repository and run the SessionStart hook once: the seeds exist, the context holds
  `private to this machine`, and onboarding is pending.

## Risk and rollback

- Private knowledge has no backup and does not follow a clone. `--help` and the documentation of
  phase 5 say so in plain words.
- A hand-written skill under `.claude/skills/` that git does not track yet is ignored in private
  mode; a tracked one is unaffected. The documentation names the negation line, and an edit to
  that managed ignore file survives `harness update` through the normal merge.
- After a switch to private, tracked knowledge stays tracked until the user runs `git rm
  --cached`. The content check of phase 3 reads the published set from git, so those files are
  still checked.
- Rollback is reverting the phase commit. A repository already installed in private mode then
  gets the two-line ignore file back from an older `harness update`, and its knowledge becomes
  untracked instead of ignored: tell the user before rolling back after a release.
