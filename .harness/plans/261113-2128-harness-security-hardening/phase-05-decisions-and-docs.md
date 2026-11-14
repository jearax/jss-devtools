---
phase: 5
title: "Decisions and documentation"
status: done
priority: P1
effort: 1d
dependencies: [1, 2, 3, 4]
---

# Phase 5: Decisions and documentation

## Goal

The four user decisions are on record with the user's words, and a reader of the site or the
README can tell what `--share-knowledge` does, what private mode cannot do, and how to keep a
public repository that runs the harness safe.

## Context

- Decisions are immutable: 0031, 0032 and 0033 are not edited. The new records name the decision
  they extend. Numbers are the next free ones at the time of writing; `ls .harness/decisions`
  first, because other work in this repository adds decisions too.
- The user asked for the flag to be documented in full: "phải docs rõ ràng, explain đầy đủ về
  flag đó" (user, 2026-11-13).
- The site's search index is built from each page's `SECTIONS` constant
  (`site/src/constants/search-index.constant.ts`), so a new section is declared once.
- Transcripts are captured from a real run with the `capture-cli-transcript` skill, never edited
  by hand.
- The release needs a new version. At an unchanged version every existing install would compare
  as the same version with another bundle and read as changed outside `harness update` (phase 1).

## Requirements

1. Four decision records from `.harness/templates/decision.md`, each with its row in
   `.harness/decisions/README.md`. The quotes are copied from the Decisions table of
   [plan.md](./plan.md), unchanged and untranslated.

   | Title | Must state |
   | --- | --- |
   | The hook files stay in the repository, and harness doctor checks them against the CLI | Why running hooks from the installed CLI was dropped (a clone must work without it; each machine would run its own hook version). The comparison rule and the "not verified" case. The review rule of requirement 3. That the bundle is not minified, where 0032 says it is. Extends 0031, 0032, 0033 |
   | Harness knowledge is gitignored unless init is given --share-knowledge | The default, the key `knowledge.share`, what counts as knowledge, the migration rule for older installs, and that the two ignore files are the exception to "No variant files" of 0031. Extends 0031 |
   | harness doctor is the only guard against publishing private content | No git hook and no CI gate ships with the harness. What the content check covers and what it cannot. Extends 0033 |
   | harness-review applies its edits without approval | The memory-poisoning path: text from a web page or a tool result written as a lesson, then injected into every later session. The git diff is the only gate |

2. The site's Harness page gains two sections and updates the rest:
   - **Private or shared knowledge**: what the flag does; the table of phase 4; how to change the
     key later, with the exact commands of phase 4 requirement 11; what private mode cannot do
     (no backup, nothing on a fresh clone or a second machine, usage counted per machine); the
     negation line for a hand-written skill.
   - **Security**: the hook files run on every session and are compared with the CLI by
     `harness doctor`; the "not verified" case; the review rule of requirement 3; symlinks are
     refused; what the content check catches (the rule names), the marker
     `harness-doctor: allow`, and what it cannot catch (a private name with no shape, anything
     already pushed); `harness-review` writes without approval, so read the diff.
   - The existing sections on the hooks, on `harness doctor` and on the files `init` writes
     match the new behavior.
3. The review rule, in the Security section and in the first decision:
   - only a maintainer runs `jss-devtools harness update`;
   - a pull request from outside that touches `.harness/bin/`, `.harness/core/` or the hook
     entries of `.claude/settings.json` is refused;
   - read the diff on the forge before checking a branch out and opening Claude Code in it,
     because the hooks run when the session starts;
   - on GitHub, the repository setting that limits pull requests to collaborators removes the
     case.
4. `site/src/constants/reference.constant.ts` gains the `--share-knowledge` row; every other
   place the site lists the `init` flags follows (search `--agent-kit` under `site/src`).
5. `README.md`: the harness paragraph names the flag and its default, and links the docs section
   and the decision.
6. `.harness/docs/system-architecture.md` describes the hook-file comparison, the rule list, the
   content check, the path-safety function and the `knowledge.share` key. `.harness/MEMORY.md`
   gains the traps only: `health-install.service.ts` stays out of the hook bundle; token samples
   in tests are built at run time; the finder uses `matchAll`.
7. The version: ask the user for the number when this phase starts (0.2.0 is suggested), then
   change it wherever plan `261110-1533-site-replay-loop-and-version-bump` changed it.
8. The transcripts that show `init --help`, an `init` run or `harness doctor` are captured again
   from the built CLI.

## Files

- Create: four files under `.harness/decisions/`.
- Modify: `.harness/decisions/README.md`,
  `site/src/pages/Docs/pages/Harness/Harness.constant.ts`,
  `site/src/pages/Docs/pages/Harness/Harness.tsx`, `site/src/constants/harness.constant.ts`,
  `site/src/constants/reference.constant.ts`, `site/src/constants/transcripts.constant.ts`,
  `README.md`, `.harness/docs/system-architecture.md`, `.harness/MEMORY.md`, `package.json` and
  the files the version plan lists.

## Tasks

- [ ] Write the four decisions and their index rows.
- [ ] Ask the user for the version and apply it.
- [ ] Write the two site sections and update the existing ones; add the reference row.
- [ ] Update `README.md`, the architecture doc and the memory lines.
- [ ] `pnpm build`, then capture the transcripts again with the `capture-cli-transcript` skill.
- [ ] Check that every command and file name in the new text exists as written.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test && pnpm --dir site lint && pnpm --dir site test`.
- `node <built cli> harness doctor` reports no index drift for the decisions README.
- `node <built cli> init --help` shows `--share-knowledge` with `(default: off)`, and the
  transcript on the site equals that output.
- The site's search finds "share-knowledge" and "Security".

## Risk and rollback

- The working tree may hold the user's uncommitted work on the same files. `.harness/MEMORY.md`,
  `.harness/decisions/README.md` and `README.md` are the files most likely to need a manual
  merge; say so in the report.
- A push to `main` deploys the site and the installer. The user pushes.
- Rollback is reverting the phase commit; decisions are withdrawn by a superseding record, not
  by deletion, once they were pushed.
