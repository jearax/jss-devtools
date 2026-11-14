---
title: "Harness hardening for public repositories"
description: "harness doctor verifies the hook files against the CLI and fails on home paths, e-mail addresses and tokens; harness knowledge is gitignored unless init is given --share-knowledge; every harness read and write refuses symlinks."
status: pending
priority: P1
effort: 5d
branch: main
tags: [harness, security, doctor, init, hooks]
blockedBy: []
blocks: []
created: 2026-11-13
---

# Harness hardening for public repositories

## Outcome

A repository that runs the harness in public can tell when its hook code is not the code the CLI
ships, keeps what its agents learned out of git unless the owner opts in, and fails
`jss-devtools harness doctor` before a home path, an e-mail address or a token is pushed. No
harness file is read or written through a symlink. A machine that only clones the repository still
gets working hooks without installing anything. The CLI still never commits and never touches the
git index.

## Why

A security review of a public repository running harness 0.1.0, verified in the source at
`3d8db75`:

| Finding | Evidence |
| --- | --- |
| The hook files certify themselves | `hookFileIssuesOf` (`health-install.service.ts`) compares `.harness/bin/hooks.mjs` with the hash in `.harness/core/manifest.json`, a file of the same repository, and only checks that the shim exists. `decideWholeFile` merges the shim, so an edited shim survives `harness update` |
| Knowledge is published by default | 43 tracked files here (41 under `.harness/plans/`, 2 decisions) hold a real absolute home path. `secretIssues` (`health-state.service.ts`) scans them with four patterns, none for a path, and reports a file without a line |
| Hooks follow symlinks | Reproduced: `.harness/MEMORY.md` as a symlink to a file outside the repository is injected into the session. `path-safety.service.ts` checks the path text only |
| Unredacted lines return to the session | `logHookError` writes the raw message; `sessionStartHook` injects every warning as it is |
| Defects | `readConfig` writes into the shared `EMPTY_CONFIG` groups; `compareHarnessVersions` can return `NaN`; `settingsAction` parses `.claude/settings.json` unguarded; `planHarnessUpdate` reports a file that is new upstream as "deleted locally" |

## Decisions (final)

Closed by the user: "Tôi chốt, bạn soạn plan đi" (user, 2026-11-14). Phase 5 records them; the
numbers are the next free ones when that phase runs (0052 to 0055 today).

| # | Rule | The user's words |
| --- | --- | --- |
| 1 | The hook bundle stays in the repository, so a clone works without the CLI. `harness doctor` compares the hook files with the copy inside the running CLI. Outside changes to them are refused in review. | "tôi đang lo sợ về việc client muốn dùng harness mà ngại việc install jss-devtools"; "Không nhận PR từ open / hoặc review kỹ là đc đúng không." (2026-11-13) |
| 2 | Harness knowledge is gitignored unless `init` is given `--share-knowledge`. The flag is documented in full. | "việc default value thì tôi nghĩ là tắt (tức là ignore á)"; "Dùng --share-knowledge"; "phải docs rõ ràng, explain đầy đủ về flag đó" (2026-11-13) |
| 3 | `harness doctor` is the only guard against publishing private content: no git hook. The redaction rules are upgraded. | "thiết kế ban đầu của project là tránh rườm rà (husky không force user bắt buộc có đc)"; "Nhớ nâng cấp, cái tiến redaction.service.ts" (2026-11-13) |
| 4 | `harness-review` keeps applying its edits without approval; the git diff is the only gate. | "Giữ nguyên" (2026-11-13) |

## Phases

| # | Phase | Depends on |
| --- | --- | --- |
| 1 | [harness doctor verifies the hook files against the CLI](./phase-01-doctor-verifies-hook-files.md) | none |
| 2 | [Symlink refusal and three defects](./phase-02-symlinks-and-defects.md) | none |
| 3 | [Redaction rules and the doctor content check](./phase-03-redaction-and-content-check.md) | 2 |
| 4 | [init --share-knowledge](./phase-04-share-knowledge.md) | 2, 3 |
| 5 | [Decisions and documentation](./phase-05-decisions-and-docs.md) | 1, 2, 3, 4 |
| 6 | [This repository takes the release](./phase-06-dogfood.md) | 5, and the release |

The work happens in this repository's main working tree, on branch `main`. Do not create a
worktree or a branch. The working tree may hold the user's unrelated uncommitted changes: leave
them alone and stage only the phase's own files. One commit per phase, made by the user or on the
user's request. Phase 6 runs after the user has pushed and reinstalled the CLI.

An earlier run implemented phase 1 and part of phase 2 by mistake in the separate worktree
`../jss-devtools-harness-hardening` (branch `fix/harness-public-hardening`, phase 1 is commit
`48b70df`, phase 2 is uncommitted there). That code is a reference only: read it with
`git show 48b70df` or by reading files in that folder while it exists, but do not merge,
cherry-pick or copy it wholesale, and never edit, build, test or run a command from inside that
folder. Every phase is implemented, tested and verified on `main` as written here.

## Acceptance

- Editing `.harness/bin/hooks.mjs` or the shim and the manifest hash together makes
  `harness doctor` exit 1; `harness update` restores both files.
- With the harness and the CLI at different versions, the `Hook files` row reads "not verified"
  and is never `ok`.
- A harness path that is a symlink, or lies under a symlinked folder, is refused by the hooks, by
  `init`, by `harness update` and by `harness doctor`, each naming the path.
- A fresh `init` leaves `git status` without memory, decisions, docs, plans or learned skills;
  `init --share-knowledge` lists them. `harness update` on a 0.1.0 install writes
  `knowledge.share: true` and changes no ignore rule.
- `harness doctor` exits 1 on a tracked harness file holding `/Users/<name>/`, `/home/<name>/`,
  `C:\Users\<name>\` or an e-mail address, and on any harness file holding a token, naming file,
  line and rule.
- A hook error holding a token or a home path reaches neither the error log nor the session.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm --dir site lint && pnpm --dir site test` pass.
- After phase 6, `jss-devtools harness doctor` is green in this repository.

## Non-goals

- Running the hook code from the installed CLI, or from npm: dropped by decision 1.
- An inbox or an approval step for learned knowledge: decision 4.
- A git hook, husky or a CI job that enforces the content check: decision 3.
- A history rewrite of this repository. The leaked values are an account name and folder names.
- The `cs` repository, and every other repository on harness 0.1.0: each takes this release with
  `jss-devtools harness update` afterwards.
- A table of bundle hashes per released version, so that a harness older than the CLI could be
  verified too.

## Open points

Each has a default written into its phase, so the plan runs as it is; the user can overturn one.

1. "Not verified" is a warning, so `harness doctor` still exits 0, following the exit-code rule of
   decision 0033. A branch that changes the manifest version therefore turns an error into a
   warning. Making it exit 1 is a policy change for every repository whose harness is older than
   its CLI. Default: warning, and the review rule covers `.harness/core/` (phase 1, phase 5).
2. In private mode `.claude/skills/.gitignore` ignores every skill folder except `harness-*` and
   `ak-*`, because a learned skill is marked inside its file, not by its name. A hand-written skill
   that git does not track yet needs one negation line (phase 4, phase 5).
3. In private mode the SessionStart hook creates the missing seed files, so a fresh clone starts
   empty instead of broken (phase 4). It is the first time a hook writes outside `.harness/state/`.
4. The version this release ships as. The user names it when phase 5 reaches the transcripts;
   0.2.0 is suggested because the `init` default changes.

## Red Team Review

Inline review by the planner, one pass per lens, against the source at `3d8db75`. No reviewer
subagents were used. Applied findings are already in the phase files.

| # | Lens | Finding | Disposition |
| --- | --- | --- | --- |
| 1 | Security | `decideWholeFile` (`update-decide.service.ts:78`) three-way merges the shim: an edited shim equals neither base nor upstream and is kept, so the fix `doctor` names would not fix it | Applied: phase 1 requirement 4 |
| 2 | Security | A changed manifest version skips the byte comparison | Accepted as open point 1; warning row and review rule |
| 3 | Security | Exempting every `git@<host>` address would hide a private forge's host name | Applied: phase 3 exempts three named public forges only |
| 4 | Assumptions | `mergeHarnessConfig` (`config-merge.service.ts:44`) fills a missing group with the defaults, which would write `share: false` into a 0.1.0 install | Applied: phase 4 requirement 3 |
| 5 | Assumptions | `planHarnessUpdate` never emits `create` (`update-decide.service.ts:59`): `.claude/skills/.gitignore`, new on a switch to private, would be a conflict | Applied: phase 4 requirement 8 |
| 6 | Assumptions | With AgentKit off, `.harness/plans/README.md` is a managed file (`install-plan.service.ts:86`); ignoring `plans/` would make every clone report it deleted | Applied: phase 4 requirement 4 |
| 7 | Assumptions | Same version does not mean same bundle for a development build | Recorded: phase 1 risk; phase 6 runs the update |
| 8 | Failure | Token-shaped test samples can trip GitHub push protection | Applied: phase 3 builds samples at run time |
| 9 | Failure | Rolling phase 4 back lets a 0.1.0 `harness update` restore the two-line ignore file in a private repository | Recorded: phase 4 risk |
| 10 | Scope | Variant texts per mode for the block and three skills | Rejected for one copy with a run-time condition, following "No variant files" in decision 0031 |

## Validation Log

Session 2, 2026-11-14. The plan was retargeted from the worktree of
`fix/harness-public-hardening` to `main`, after a cook run followed the old wording into that
worktree. Phase 1 was reset to `pending`, because its code exists only on that branch.

Session 1, 2026-11-14. The user closed the design discussion before planning, so no interview was
run; the four points that are new since then are listed under Open points with their defaults.

Verification of the plan's claims against the source at `3d8db75`: 14 checked, 14 confirmed,
0 failed. Confirmed by reading: `hookFileIssuesOf` and the manifest comparison; the shim merge
path; `SECRET_PATTERNS` and its two call sites; `logHookError` and the warning injection;
`EMPTY_CONFIG` spread; `compareHarnessVersions`; `settingsAction`; the missing `create` action;
`learnedSkillNames` and its marker; the config merge for a missing group; the plans README kind;
`harness doctor` exit codes. Confirmed by command: 43 tracked files with a real home path and one
with a non-exempt e-mail address, counted with the exemptions of phase 3; no CI job and no test
runs `harness doctor` on this repository.

Not verified: the secret-scanning setting of this repository on GitHub (finding 8 is applied
either way), and how Claude Code displays a hook warning line, which this plan does not depend on.
