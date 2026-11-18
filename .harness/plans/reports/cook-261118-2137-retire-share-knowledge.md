# Report: retire `--share-knowledge` and raise the harness config defaults

Plan: `.harness/plans/261118-2103-remove-share-knowledge/plan.md` — all five phases implemented,
2026-11-18. Not committed; the planner owns commit and push.

## What changed

### Phase 1 — decisions
- `.harness/decisions/0059-harness-knowledge-is-ordinary-tracked-content.md`: new, supersedes 0053,
  quotes the user's Vietnamese decisions from the plan.
- `.harness/decisions/0060-harness-config-defaults-21-12800-400.md`: new, records 21 / 12800 / 400.
  No earlier decision covered the old numbers (grepped; the 261102 plan produced none), so
  `supersedes: none`. The only user quote the plan carries for the numbers is "Cả hai" (scope);
  the values themselves come from the plan's Outcome.
- 0053 frontmatter is now `status: Superseded by 0059`; body untouched. Index rows added in
  `.harness/decisions/README.md`.

### Phase 2 — code
- Defaults in `src/modules/harness/templates/harness-config.template.ts` are 21 / 12800 / 400 with
  no `knowledge` key; `harnessConfigTemplate()` takes no argument.
- `init`: the `--share-knowledge` option, its help row and example, `InitOptions.shareKnowledge`,
  the harness-only guard in `init.service.ts`, and the `plan.service.ts` pass-through are gone.
- `install-plan.service.ts` renders one ignore variant (the shared-mode one: `.harness/.gitignore`
  is now `state/` + `update/` only, a plain constant). The `.claude/skills/.gitignore` variant and
  its template are deleted; `harnessRecordedFiles(agentKit)` lost its `shareKnowledge` parameter.
- `config-merge.service.ts`: `resolveKnowledgeShare` deleted. `mergeHarnessConfig` no longer writes
  or adds `knowledge`; merged output is a deep copy of the live file, so a live key from an old
  install survives untouched — every reader ignores it.
- `update-safety.service.ts`: `knowledgeInSync` deleted (the ignore files are ordinary managed
  files now); its call in the `update-preflight` up-to-date check is gone.
- `doctor.service.ts`: the `Knowledge` summary row is gone.
- `session-start.hook.ts`: the shared/private line and the whole private-mode `seedKnowledgeFiles`
  are gone (seeding only ever ran in private mode, so nothing unconditional remains).
- `hook.type.ts`: `knowledge` removed from `HarnessConfig`; `KNOWLEDGE_PATHS` and the now-unused
  `HARNESS_ARCHIVE_DIR` constant are deleted.
- `claude-block.template.ts` and the three harness-skill templates: the "when knowledge is shared"
  wording is now unconditional ("tell the user to commit", "commit them with the work").
- `readConfig` picks its validated keys from `HARNESS_CONFIG_DEFAULTS`, so an old install's live
  `knowledge.share` passes silently — no problem row, no rewrite.

## Verification (real output)

Root sequence, exit 0:

```text
$ eslint "{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}" "*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}"
$ tsc --noEmit
      Tests  611 passed | 35 skipped (646)
   Start at  22:02:13
   Duration  6.24s (tests 95%, import 3%, transform 2%)
ℹ dist/cli.mjs  483.21 kB │ gzip: 122.97 kB
✔ Build complete in 36ms
```

Site sequence, exit 0:

```text
$ eslint "{src,vite}/**/*.{ts,tsx,mjs}" "*.{ts,mjs}" && stylelint "src/**/*.css"
$ tsc --noEmit
 Test Files  28 passed (28)
      Tests  131 passed (131)
   Start at  22:02:29
   Duration  13.38s (worker 96%, tests 3%)
✓ built in 402ms
```

Other acceptance checks:
- `node dist/cli.mjs init --help | grep -c share-knowledge` → `0`.
- `package.json` untouched by the diff; `"version": "0.1.0"` unchanged.
- Acceptance grep over `src`, `tests`, `site/src`, `README.md`, `CLAUDE.md`, `.harness/docs` now
  finds only: the phase-3-mandated rejection test (`--share-knowledge` must appear to assert its
  rejection), and three one-line historical notes naming the retired flag/key while pointing at
  0059 (site knowledge section, system-architecture, roadmap). The plan's acceptance text said
  the decision records should be the only remaining occurrences, which its own phase 3 and
  phase 5 make impossible; I kept the mandated test and the compatibility notes.

## Phase 3 — tests
- Updated: update units (merge expectations, `resolveKnowledgeShare` block deleted, new unit: a
  live `knowledge.share: false` survives the merge untouched), update integration (replaced the
  share-flip test with "retires a private old install silently", covering the plan's required
  old-config case: re-rendered gitignore, deleted skills gitignore, kept live key), hooks
  (knowledge-seeding describe deleted with the feature), doctor, install-plan test + snapshot,
  init help texts in `init.command.test.ts` and `bundle.test.ts`, and the create-mode plan count
  in two tests: 50 → 48 (the skills ignore file and its base copy both left the plan).
- Added: `init --share-knowledge` rejected as an unknown option with exit 1.

## Phase 4 — this repository
- `.harness/config.json` now holds 21 / 12800 / 400 with no `knowledge` key.
- `node dist/cli.mjs harness update -y` re-rendered the managed files: the three harness skills,
  `.claude/settings.json`, `.harness/bin/hooks.mjs` and the CLAUDE.md block. Dry-run diff
  confirmed before applying.
- Git index refreshed with `git rm -r --cached .harness .claude/skills` then `git add`: no tracked
  file disappeared; the only additions are decisions 0059/0060 and this plan folder; nothing under
  `.harness/state/`, `.harness/update/` or `.harness/archive/` entered the index (verified via
  `git ls-files`).

## Phase 5 — docs and site
- README, `system-architecture.md` (the knowledge-sharing paragraph became the config-merge
  paragraph), `project-roadmap.md`, `harness-hardening-traps.md` updated. `.harness/MEMORY.md` had
  no share-mode lines to fix.
- Site: flag row removed from `reference.constant.ts`; `HARNESS_LIMITS` now 12800/400;
  `HARNESS_KNOWLEDGE_TABLE` reshaped to one mode (`area`/`detail`); the Knowledge section rewritten
  as "Knowledge in git" with its keywords; `transcripts.constant.ts` fully re-captured per the
  capture-cli-transcript skill (both doctor runs and both init runs re-recorded; the npm
  deprecation warning the registry printed mid-install was cut, noted in the doc block). All four
  arrays were verified byte-equal against the capture files with a script, and
  `pnpm --dir site test` prints them codes-stripped.

## Not checked / limitations
- I did not run the site against a real browser; the terminal test and build cover the transcript
  rendering only.
- The two init transcripts were re-captured on this machine, so their npm duration (19.3s) and
  deprecation warning reflect today's registry; the label constant already says so.

## Unresolved questions
- None. The one judgment call (keeping the compatibility notes that mention the retired key, plus
  the mandated rejection test, despite the acceptance grep's "decisions only" wording) is a plan
  self-contradiction reported above rather than a question.

## Review fixes (2026-11-18, from the user)
- Decision 0060 now quotes the user's actual words for the numbers: "Update harness config,
  review.minToolCalls: 21, memory.maxChars: 12800, memory.maxEntryChars: 400"; "Cả hai" stays as
  the scope quote.
- `.claude/settings.json` had been rewritten with spaces by `harness update` (the known memory
  trap); `prettier --write` restored tabs and the file now matches HEAD with no diff.
- `pnpm lint` re-run after both fixes: clean, exit 0.
