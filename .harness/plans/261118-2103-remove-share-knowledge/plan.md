---
title: Retire --share-knowledge and raise the harness config defaults
status: done
created: 2026-11-18
---

# Retire `--share-knowledge` and raise the harness config defaults

## Outcome

1. The harness config defaults are `review.minToolCalls: 21`, `memory.maxChars: 12800` and
   `memory.maxEntryChars: 400`, both in `HARNESS_CONFIG_DEFAULTS` (what `init` writes) and in this
   repository's `.harness/config.json`.
2. The private/shared knowledge feature is gone. `init --share-knowledge` no longer exists. Harness
   knowledge is ordinary tracked content, which is how every install behaved before decision 0053.
   This means the `knowledge.share` key, the variant ignore files and the doctor `Knowledge` row go,
   along with the session-start shared/private line and the private-mode seeding.
3. An old install whose config still holds `knowledge.share` keeps working. Every reader ignores the
   key silently: no warning, no rewrite. This repository's own `.harness/config.json` drops the key.
4. Help text, README, `.harness/docs/`, the managed CLAUDE.md block, the site docs and the
   reference all match the code. Completed plans stay untouched as historical records.

## User decisions (2026-11-18, quote in the new decision records)

- Config scope: "Cả hai". Change both the template defaults and this repo's config.
- Share mode: "Bỏ hẳn key knowledge.share", then "Fix tất cả mọi thứ liên quan, nói chung là bỏ chức
  năng đó, git repo này --cached lại". Remove the whole feature, then refresh this repo's git index
  against the new ignore files.
- Old installs: "Bỏ qua key im lặng".
- Old plans: "Giữ nguyên plan cũ".
- Do not bump the version.

## Phases

### 1. Decisions

- Write a new decision that supersedes 0053 and quotes the user. Mark 0053 `Superseded by NNNN` in
  its frontmatter status and in `.harness/decisions/README.md`. Do not rewrite 0053's body.
- Write a decision for the new limits: 21 / 12800 / 400. Supersede an existing decision if one
  covers the old numbers (check plan `261102-1045-harness-config-defaults` and the decisions it
  produced).

### 2. Code (`src/`)

- `src/modules/harness/templates/harness-config.template.ts`: new defaults, no `knowledge` key,
  `harnessConfigTemplate()` takes no argument.
- `init`: remove the option, its help example, `InitOptions.shareKnowledge`, the harness-only guard
  in `init.service.ts` and the field passed through `plan.service.ts`.
- `install-plan.service.ts`, `harness-seeds.template.ts`: render one ignore-file variant, the one the
  shared mode renders today. Remove the `shareKnowledge` parameters.
- `config-merge.service.ts`: delete `resolveKnowledgeShare`. The merge must not write
  `knowledge` back, and must not add it either. A live key from an old install survives untouched
  only if the merge already keeps unknown live keys; otherwise it is dropped. Either way, nothing
  reads it.
- `update-release.service.ts`, `update-safety.service.ts`: drop the share branch and its comment.
- `doctor.service.ts`: drop the `Knowledge` row.
- `session-start.hook.ts`: drop the shared/private line and the private-only seeding. Keep any
  seeding that runs regardless of mode.
- `hook.type.ts`: remove `knowledge` from `HarnessConfig`.
- `KNOWLEDGE_PATHS`: delete it if nothing else uses it.
- `claude-block.template.ts`: rewrite the "Knowledge follows `knowledge.share`" paragraph. Knowledge
  is committed with the work, and the harness never commits.
- `harness-skills.template.ts` and others: search for `share`, `private`, `gitignored`.

### 3. Tests

- Update the `init`, install-plan, update, hooks and bundle tests and the snapshot. Delete tests that
  only cover the removed feature.
- Add one test showing that `init --share-knowledge` is rejected as an unknown option, non-zero exit.
- Add one test showing that an old config holding `knowledge.share: false` gets no ignored
  knowledge after `harness update`.
- Do not weaken unrelated assertions.

### 4. This repository

- Update `.harness/config.json` to the new numbers and drop `knowledge`.
- Run `jss-devtools harness update` from the built bundle so the managed files (CLAUDE.md block,
  `.harness/core/`, skills, ignore files) re-render. Confirm the diff.
- Refresh the index: `git rm -r --cached .harness .claude/skills`, then `git add .harness
  .claude/skills`, then check `git status`. Nothing that should be tracked may disappear, and
  nothing secret or machine-local may be added.

### 5. Docs and site

- README, `.harness/docs/system-architecture.md`, `project-roadmap.md`, `codebase-summary.md`,
  `harness-hardening-traps.md` and every doc that names the flag, the key or the old numbers.
- Site: `site/src/constants/reference.constant.ts` (flag row),
  `site/src/pages/Docs/pages/Harness/{Harness.constant.ts,Sections.tsx}` (section and keywords),
  `site/src/constants/harness.constant.ts`, `transcripts.constant.ts`. A transcript that shows the
  doctor `Knowledge` row or the old numbers must be re-captured with the `capture-cli-transcript`
  skill, not hand-edited.
- `.harness/MEMORY.md`: fix or remove lines about share mode.

## Acceptance

- `grep -rn "share-knowledge\|shareKnowledge\|knowledge\.share\|resolveKnowledgeShare"` over `src`,
  `tests`, `site/src`, `README.md`, `CLAUDE.md` and `.harness/docs` finds nothing. The decision
  records are the only place the term remains, and they are historical.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passes.
- `pnpm --dir site lint && pnpm --dir site typecheck && pnpm --dir site test && pnpm --dir site build`
  passes.
- `node dist/cli.mjs init --help` has no `--share-knowledge` row or example.
- `package.json` version is unchanged.

## Non-goals

- No version bump. No edits to completed plans. No push. The planner handles commit and push after
  review, `/ak-docs` and `/harness-curate`.
